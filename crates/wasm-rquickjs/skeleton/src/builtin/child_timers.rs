use crate::internal::runtime_services::{
    OwnedJsRuntime, RuntimeServices, run_process_turn_checkpoint,
};
use futures::future::{AbortHandle, AbortRegistration, Abortable, LocalBoxFuture, poll_fn};
use futures::stream::{FuturesUnordered, Stream};
use futures::task::AtomicWaker;
use rquickjs::{CatchResultExt, Persistent, Value};
use std::cell::RefCell;
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::task::Poll;

pub(crate) struct ChildTimer {
    pub(crate) key: usize,
    pub(crate) delay: u32,
    pub(crate) periodic: bool,
    pub(crate) callback: Persistent<Value<'static>>,
    pub(crate) args: Persistent<Vec<Value<'static>>>,
}

/// Timer waits owned by a child, not by its QuickJS scheduler. Unreferenced
/// timers can run while ordinary work is pending without keeping that work alive.
#[derive(Default)]
pub(crate) struct ChildTimers {
    pending: RefCell<Vec<(ChildTimer, AbortRegistration)>>,
    waker: AtomicWaker,
}

impl ChildTimers {
    pub(crate) async fn install(runtime: &OwnedJsRuntime) -> Rc<Self> {
        let owner = Rc::new(Self::default());
        runtime
            .ctx
            .with(|ctx| {
                *ctx.userdata::<RuntimeServices>()
                    .unwrap()
                    .timers
                    .child_owner
                    .borrow_mut() = Some(Rc::downgrade(&owner));
            })
            .await;
        owner
    }

    pub(crate) fn schedule(&self, timer: ChildTimer, registration: AbortRegistration) {
        self.pending.borrow_mut().push((timer, registration));
        self.waker.wake();
    }

    pub(crate) async fn drain(&self, runtime: &OwnedJsRuntime) -> Result<(), String> {
        let mut waits: FuturesUnordered<LocalBoxFuture<'static, (ChildTimer, bool)>> =
            FuturesUnordered::new();
        let mut ready: Option<(ChildTimer, bool)> = None;
        poll_fn(|cx| {
            self.waker.register(cx.waker());
            loop {
                // idle retains the runtime lock across Pending. Its scheduler
                // tasks stay pinned internally when this polling slice ends.
                let idle = {
                    let mut idle = std::pin::pin!(runtime.rt.idle());
                    idle.as_mut().poll(cx)
                };
                let observation = runtime.ctx.with(|ctx| {
                    let checkpoint = run_process_turn_checkpoint(&ctx)
                        .catch(&ctx)
                        .map_err(crate::internal::format_caught_error)?;
                    let dispatched = ready.is_some();
                    if let Some((timer, cancelled)) = ready.take() {
                        if !cancelled {
                            super::timeout::dispatch_scheduled_task(
                                ctx.clone(),
                                timer.callback.clone(),
                                timer.args.clone(),
                                timer.key,
                            );
                        }
                        let services = ctx.userdata::<RuntimeServices>().unwrap();
                        if !cancelled
                            && timer.periodic
                            && services
                                .timers
                                .abort_handles
                                .borrow()
                                .contains_key(&timer.key)
                        {
                            let (handle, registration) = AbortHandle::new_pair();
                            services
                                .timers
                                .abort_handles
                                .borrow_mut()
                                .insert(timer.key, handle);
                            self.schedule(timer, registration);
                        } else {
                            services
                                .timers
                                .abort_handles
                                .borrow_mut()
                                .remove(&timer.key);
                            services
                                .timers
                                .unrefed_timers
                                .borrow_mut()
                                .remove(&timer.key);
                        }
                    }
                    let services = ctx.userdata::<RuntimeServices>().unwrap();
                    let referenced = services
                        .timers
                        .abort_handles
                        .borrow()
                        .len()
                        .saturating_sub(services.timers.unrefed_timers.borrow().len());
                    Ok::<_, String>((checkpoint || dispatched, referenced))
                });
                let (did_work, referenced) = match std::pin::pin!(observation).poll(cx) {
                    Poll::Pending => return Poll::Pending,
                    Poll::Ready(Err(error)) => return Poll::Ready(Err(error)),
                    Poll::Ready(Ok(state)) => state,
                };

                // Drop the queue borrow before any future poll can call JS.
                let pending = std::mem::take(&mut *self.pending.borrow_mut());
                for (timer, registration) in pending {
                    waits.push(Box::pin(async move {
                        let cancelled = Abortable::new(
                            wasip3::clocks::monotonic_clock::wait_for(
                                u64::from(timer.delay).saturating_mul(1_000_000),
                            ),
                            registration,
                        )
                        .await
                        .is_err();
                        (timer, cancelled)
                    }));
                }
                if did_work {
                    continue;
                }
                if idle.is_ready() && referenced == 0 {
                    return Poll::Ready(Ok(()));
                }
                match Pin::new(&mut waits).poll_next(cx) {
                    Poll::Ready(Some(timer)) => ready = Some(timer),
                    Poll::Ready(None) | Poll::Pending => return Poll::Pending,
                }
            }
        })
        .await
    }
}
