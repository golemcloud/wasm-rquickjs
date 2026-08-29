//! Target-independent buffering and fan-out for cloned fetch response bodies.

use rquickjs::{Ctx, Exception};
use std::cell::RefCell;
use std::rc::Rc;
use std::task::{Poll, Waker};

pub(crate) trait NativeBody {
    async fn read_chunk(&mut self) -> Result<Option<Vec<u8>>, String>;
    fn discard(self);
    #[cfg(feature = "p3")]
    fn take_recovered_read_bytes_for_test(&self) -> usize {
        0
    }
    #[cfg(feature = "p3")]
    fn pause_next_ready_read_for_test(&self) -> bool {
        false
    }
}

pub(crate) struct SharedBody<S> {
    native: Option<S>,
    buffer: Vec<u8>,
    finished: bool,
    error: Option<String>,
    waiters: Vec<Waker>,
    readers: usize,
}

impl<S: NativeBody> SharedBody<S> {
    fn new(native: S) -> Self {
        Self {
            native: Some(native),
            buffer: Vec::new(),
            finished: false,
            error: None,
            waiters: Vec::new(),
            readers: 2,
        }
    }
}

pub(crate) struct SharedBodyReader<S: NativeBody> {
    shared: Rc<RefCell<SharedBody<S>>>,
    active: bool,
}

impl<S: NativeBody> SharedBodyReader<S> {
    pub(crate) fn pair(native: S) -> (Self, Self) {
        let shared = Rc::new(RefCell::new(SharedBody::new(native)));
        (
            Self {
                shared: shared.clone(),
                active: true,
            },
            Self {
                shared,
                active: true,
            },
        )
    }

    pub(crate) fn branch(&self) -> Self {
        self.shared.borrow_mut().readers += 1;
        Self {
            shared: self.shared.clone(),
            active: true,
        }
    }

    pub(crate) fn discard(self) {
        drop(self);
    }

    #[cfg(feature = "p3")]
    pub(crate) fn take_recovered_read_bytes_for_test(&self) -> usize {
        self.shared
            .borrow()
            .native
            .as_ref()
            .map_or(0, NativeBody::take_recovered_read_bytes_for_test)
    }

    #[cfg(feature = "p3")]
    pub(crate) fn pause_next_ready_read_for_test(&self) -> bool {
        self.shared
            .borrow()
            .native
            .as_ref()
            .is_some_and(NativeBody::pause_next_ready_read_for_test)
    }
}

impl<S: NativeBody> Drop for SharedBodyReader<S> {
    fn drop(&mut self) {
        if !self.active {
            return;
        }
        self.active = false;
        let (native, waiters) = {
            let mut state = self.shared.borrow_mut();
            state.readers = state
                .readers
                .checked_sub(1)
                .expect("shared response reader count underflow");
            if state.readers == 0 && !state.finished {
                state.finished = true;
                (state.native.take(), std::mem::take(&mut state.waiters))
            } else {
                (None, Vec::new())
            }
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
        let (native, waiters) = {
            let mut state = self.shared.borrow_mut();
            let discard = state.readers == 0 || state.finished;
            if discard {
                state.finished = true;
                (Some(native), std::mem::take(&mut state.waiters))
            } else {
                state.native = Some(native);
                (None, std::mem::take(&mut state.waiters))
            }
        };
        if let Some(native) = native {
            native.discard();
        }
        wake_all(waiters);
    }
}

pub(crate) async fn collect<'js, S: NativeBody>(
    ctx: &Ctx<'js>,
    reader: SharedBodyReader<S>,
) -> rquickjs::Result<Vec<u8>> {
    let mut position = 0;
    let mut bytes = Vec::new();
    while let Some(chunk) = read_chunk(ctx, &reader, position).await? {
        position += chunk.len();
        bytes.extend_from_slice(&chunk);
    }
    Ok(bytes)
}

pub(crate) async fn read_chunk<'js, S: NativeBody>(
    ctx: &Ctx<'js>,
    reader: &SharedBodyReader<S>,
    position: usize,
) -> rquickjs::Result<Option<Vec<u8>>> {
    let shared = &reader.shared;
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
