//! Dispatch primitives for a terminal runtime whose owner completes in Rust.
//! These do not acquire a lease, initialize a runtime, or settle a JS caller.
use rquickjs::{CatchResultExt, CaughtError, Ctx, Function, IntoJs, Promise};
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::task::{Context, Poll};

#[path = "terminal_admission.rs"]
pub(crate) mod admission;
#[path = "terminal_output.rs"]
pub(crate) mod output;

/// A native owner supplies termination, wakeup and task-liveness state. It must
/// never clear termination or reuse a stopped runtime. Callback loops also
/// need checks inside their polls, before each JavaScript re-entry.
pub(crate) trait Signal {
    fn stopped(&self) -> bool;
    fn registered(&self);
    fn released(&self);
    fn polled(&self) {}
    fn failed(&self, message: &'static str);
}

impl<T: Signal + ?Sized> Signal for Rc<T> {
    fn stopped(&self) -> bool {
        (**self).stopped()
    }
    fn registered(&self) {
        (**self).registered();
    }
    fn released(&self) {
        (**self).released();
    }
    fn polled(&self) {
        (**self).polled();
    }
    fn failed(&self, message: &'static str) {
        (**self).failed(message);
    }
}

/// Context-local binding hook. The owner must release any JS handles retained
/// by its signal before destroying the context; native owners use plain data.
#[derive(Clone)]
pub(crate) struct SignalHandle(pub(crate) Rc<dyn Signal>);

unsafe impl<'js> rquickjs::JsLifetime<'js> for SignalHandle {
    type Changed<'to> = Self;
}

impl Signal for SignalHandle {
    fn stopped(&self) -> bool {
        self.0.stopped()
    }
    fn registered(&self) {
        self.0.registered();
    }
    fn released(&self) {
        self.0.released();
    }
    fn polled(&self) {
        self.0.polled();
    }
    fn failed(&self, message: &'static str) {
        self.0.failed(message);
    }
}

pub(crate) fn spawn<'js, F>(ctx: &Ctx<'js>, future: F)
where
    F: Future<Output = ()> + 'js,
{
    let signal = ctx
        .userdata::<SignalHandle>()
        .map(|handle| (*handle).clone());
    match signal {
        Some(signal) => ctx.spawn(Guard::new(future, signal)),
        None => ctx.spawn(future),
    }
}

pub(crate) struct Guard<F, S: Signal> {
    inner: Option<F>,
    signal: S,
}

impl<F, S: Signal> Guard<F, S> {
    pub(crate) fn new(inner: F, signal: S) -> Self {
        signal.registered();
        Self {
            inner: Some(inner),
            signal,
        }
    }
}

impl<F: Future, S: Signal> Future for Guard<F, S> {
    type Output = F::Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        // SAFETY: inner is structurally pinned and never moved. Pin::set drops
        // it in place during cancellation, including when F is !Unpin.
        let this = unsafe { self.get_unchecked_mut() };
        this.signal.polled();
        if this.signal.stopped() {
            unsafe { Pin::new_unchecked(&mut this.inner) }.set(None);
            return Poll::Pending;
        }
        let Some(inner) = (unsafe { Pin::new_unchecked(&mut this.inner) }).as_pin_mut() else {
            return Poll::Pending;
        };
        let result = inner.poll(cx);
        if this.signal.stopped() {
            unsafe { Pin::new_unchecked(&mut this.inner) }.set(None);
            return Poll::Pending;
        }
        result
    }
}

impl<F, S: Signal> Drop for Guard<F, S> {
    fn drop(&mut self) {
        self.signal.released();
    }
}

/// Own the Promise adapter: guarding only its inner future does not prevent
/// resolve/reject from invoking user code after result conversion requests exit.
pub(crate) fn promise<'js, F, R, S>(
    ctx: &Ctx<'js>,
    future: F,
    signal: S,
) -> rquickjs::Result<Promise<'js>>
where
    F: Future<Output = R> + 'js,
    R: IntoJs<'js>,
    S: Signal + 'js,
{
    let (promise, resolve, reject) = Promise::new(ctx)?;
    signal.registered();
    ctx.spawn(Adapter {
        inner: Some(future),
        ctx: ctx.clone(),
        signal,
        resolve,
        reject,
        completed: false,
    });
    Ok(promise)
}

struct Adapter<'js, F, S: Signal> {
    inner: Option<F>,
    ctx: Ctx<'js>,
    signal: S,
    resolve: Function<'js>,
    reject: Function<'js>,
    completed: bool,
}

impl<'js, F, S> Future for Adapter<'js, F, S>
where
    F: Future,
    F::Output: IntoJs<'js>,
    S: Signal,
{
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        // SAFETY: inner is structurally pinned and never moved. The completed
        // future stays alive through conversion/settlement to preserve borrows.
        let this = unsafe { self.get_unchecked_mut() };
        this.signal.polled();
        if this.completed {
            return Poll::Ready(());
        }
        if this.signal.stopped() {
            unsafe { Pin::new_unchecked(&mut this.inner) }.set(None);
            return Poll::Pending;
        }
        let Some(inner) = (unsafe { Pin::new_unchecked(&mut this.inner) }).as_pin_mut() else {
            return Poll::Pending;
        };
        let Poll::Ready(result) = inner.poll(cx) else {
            return Poll::Pending;
        };
        if this.signal.stopped() {
            unsafe { Pin::new_unchecked(&mut this.inner) }.set(None);
            return Poll::Pending;
        }
        let result = result.into_js(&this.ctx).catch(&this.ctx);
        if this.signal.stopped() {
            unsafe { Pin::new_unchecked(&mut this.inner) }.set(None);
            return Poll::Pending;
        }
        let result = match result {
            Ok(value) => this.resolve.call::<_, ()>((value,)),
            Err(error) => {
                let value = match error {
                    CaughtError::Exception(error) => error.into_value(),
                    CaughtError::Value(value) => value,
                    CaughtError::Error(error) => {
                        // A public native-function call preserves rquickjs's
                        // private Error::throw conversion without copying it.
                        let throw = match Function::new(
                            this.ctx.clone(),
                            rquickjs::function::OnceFn::new(move || Err::<(), _>(error)),
                        ) {
                            Ok(function) => function,
                            Err(_) => {
                                this.signal.failed("failed to create error adapter");
                                unsafe { Pin::new_unchecked(&mut this.inner) }.set(None);
                                return Poll::Pending;
                            }
                        };
                        let _ = throw.call::<_, ()>(());
                        this.ctx.catch()
                    }
                };
                if this.signal.stopped() {
                    unsafe { Pin::new_unchecked(&mut this.inner) }.set(None);
                    return Poll::Pending;
                }
                this.reject.call::<_, ()>((value,))
            }
        };
        if result.is_err() && !this.signal.stopped() {
            let _ = this.ctx.catch();
            this.signal.failed("Promise settlement failed");
        }
        if this.signal.stopped() {
            unsafe { Pin::new_unchecked(&mut this.inner) }.set(None);
            return Poll::Pending;
        }
        this.completed = true;
        Poll::Ready(())
    }
}

impl<F, S: Signal> Drop for Adapter<'_, F, S> {
    fn drop(&mut self) {
        self.signal.released();
    }
}
