//! Target-independent buffering and fan-out for cloned fetch response bodies.

use rquickjs::{Ctx, Exception};
use std::cell::RefCell;
use std::rc::Rc;
use std::task::{Poll, Waker};

pub(crate) trait NativeBody {
    async fn read_chunk(&mut self) -> Result<Option<Vec<u8>>, String>;
    fn discard(self);
}

pub(crate) struct SharedBody<S> {
    native: Option<S>,
    buffer: Vec<u8>,
    finished: bool,
    error: Option<String>,
    waiters: Vec<Waker>,
}

impl<S> SharedBody<S> {
    pub(crate) fn new(native: S) -> Self {
        Self {
            native: Some(native),
            buffer: Vec::new(),
            finished: false,
            error: None,
            waiters: Vec::new(),
        }
    }

    pub(crate) fn discard(shared: &Rc<RefCell<Self>>)
    where
        S: NativeBody,
    {
        let (native, waiters) = {
            let mut state = shared.borrow_mut();
            state.finished = true;
            (state.native.take(), std::mem::take(&mut state.waiters))
        };
        if let Some(native) = native {
            native.discard();
        }
        wake_all(waiters);
    }
}

struct NativeLease<S: NativeBody> {
    native: Option<S>,
    shared: Rc<RefCell<SharedBody<S>>>,
}

impl<S: NativeBody> Drop for NativeLease<S> {
    fn drop(&mut self) {
        let Some(native) = self.native.take() else {
            return;
        };
        native.discard();
        let waiters = {
            let mut state = self.shared.borrow_mut();
            state.finished = true;
            std::mem::take(&mut state.waiters)
        };
        wake_all(waiters);
    }
}

pub(crate) async fn collect<'js, S: NativeBody>(
    ctx: &Ctx<'js>,
    shared: Rc<RefCell<SharedBody<S>>>,
) -> rquickjs::Result<Vec<u8>> {
    let mut position = 0;
    let mut bytes = Vec::new();
    while let Some(chunk) = read_chunk(ctx, &shared, position).await? {
        position += chunk.len();
        bytes.extend_from_slice(&chunk);
    }
    Ok(bytes)
}

pub(crate) async fn read_chunk<'js, S: NativeBody>(
    ctx: &Ctx<'js>,
    shared: &Rc<RefCell<SharedBody<S>>>,
    position: usize,
) -> rquickjs::Result<Option<Vec<u8>>> {
    loop {
        {
            let state = shared.borrow();
            if position < state.buffer.len() {
                let end = (position + 16 * 1024).min(state.buffer.len());
                return Ok(Some(state.buffer[position..end].to_vec()));
            }
            if let Some(error) = &state.error {
                return Err(Exception::throw_message(ctx, error));
            }
            if state.finished {
                return Ok(None);
            }
        }

        let native = shared.borrow_mut().native.take();
        let Some(native) = native else {
            std::future::poll_fn(|cx| {
                let mut state = shared.borrow_mut();
                if position < state.buffer.len()
                    || state.error.is_some()
                    || state.finished
                    || state.native.is_some()
                {
                    Poll::Ready(())
                } else {
                    if !state
                        .waiters
                        .iter()
                        .any(|waker| waker.will_wake(cx.waker()))
                    {
                        state.waiters.push(cx.waker().clone());
                    }
                    Poll::Pending
                }
            })
            .await;
            continue;
        };

        let mut lease = NativeLease {
            native: Some(native),
            shared: shared.clone(),
        };
        let outcome = lease
            .native
            .as_mut()
            .expect("native response body lease is present")
            .read_chunk()
            .await;

        let native = lease.native.take();
        let (result, waiters) = {
            let mut state = shared.borrow_mut();
            let result = match outcome {
                Ok(Some(chunk)) => {
                    state.buffer.extend_from_slice(&chunk);
                    state.native = native;
                    Ok(Some(chunk))
                }
                Ok(None) => {
                    state.finished = true;
                    Ok(None)
                }
                Err(error) => {
                    state.error = Some(error.clone());
                    state.finished = true;
                    Err(Exception::throw_message(ctx, &error))
                }
            };
            (result, std::mem::take(&mut state.waiters))
        };
        wake_all(waiters);
        return result;
    }
}

fn wake_all(waiters: Vec<Waker>) {
    for waiter in waiters {
        waiter.wake();
    }
}
