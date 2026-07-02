//! Host-side producers/consumers for Component Model `future<T>` / `stream<T>` values.
//!
//! These adapters let the host drive the read/write ends of component futures and streams using
//! ordinary `futures` primitives (a `oneshot` channel for a `future<T>`, a `Sink`/`Stream` pair
//! for a `stream<T>`). They are adapted from wasmtime's own `component-async-tests` test utilities
//! (`crates/misc/component-async-tests/src/util.rs`), which are not published on crates.io.

use futures::{Sink, Stream, channel::oneshot};
use std::future::Future;
use std::marker::PhantomData;
use std::pin::Pin;
use std::task::{Context, Poll};
use wasmtime::Result;
use wasmtime::StoreContextMut;
use wasmtime::component::{
    Destination, FutureConsumer, FutureProducer, Lift, Lower, Source, StreamConsumer,
    StreamProducer, StreamResult,
};

/// Produces the items of a component `stream<T>` from a `futures::Stream`.
pub struct PipeProducer<S>(S);

impl<S> PipeProducer<S> {
    pub fn new(rx: S) -> Self {
        Self(rx)
    }
}

impl<D, T: Send + Sync + Lower + 'static, S: Stream<Item = T> + Send + 'static> StreamProducer<D>
    for PipeProducer<S>
{
    type Item = T;
    type Buffer = Option<T>;

    fn poll_produce<'a>(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        _: StoreContextMut<D>,
        mut destination: Destination<'a, Self::Item, Self::Buffer>,
        finish: bool,
    ) -> Poll<Result<StreamResult>> {
        // SAFETY: standard pin-projection; we never move out of `self`.
        let stream = unsafe { self.map_unchecked_mut(|v| &mut v.0) };

        match stream.poll_next(cx) {
            Poll::Pending => {
                if finish {
                    Poll::Ready(Ok(StreamResult::Cancelled))
                } else {
                    Poll::Pending
                }
            }
            Poll::Ready(Some(item)) => {
                destination.set_buffer(Some(item));
                Poll::Ready(Ok(StreamResult::Completed))
            }
            Poll::Ready(None) => Poll::Ready(Ok(StreamResult::Dropped)),
        }
    }
}

/// Consumes the items of a component `stream<T>` into a `futures::Sink`.
pub struct PipeConsumer<T, S>(S, PhantomData<fn() -> T>);

impl<T, S> PipeConsumer<T, S> {
    pub fn new(tx: S) -> Self {
        Self(tx, PhantomData)
    }
}

impl<D, T: Lift + 'static, S: Sink<T, Error: std::error::Error + Send + Sync> + Send + 'static>
    StreamConsumer<D> for PipeConsumer<T, S>
{
    type Item = T;

    fn poll_consume(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        store: StoreContextMut<D>,
        mut source: Source<Self::Item>,
        finish: bool,
    ) -> Poll<Result<StreamResult>> {
        // SAFETY: standard pin-projection; we never move out of `self`.
        let mut sink = unsafe { self.map_unchecked_mut(|v| &mut v.0) };

        let on_pending = || {
            if finish {
                Poll::Ready(Ok(StreamResult::Cancelled))
            } else {
                Poll::Pending
            }
        };

        match sink.as_mut().poll_flush(cx) {
            Poll::Pending => on_pending(),
            Poll::Ready(result) => {
                result?;
                match sink.as_mut().poll_ready(cx) {
                    Poll::Pending => on_pending(),
                    Poll::Ready(result) => {
                        result?;
                        let item = &mut None;
                        source.read(store, item)?;
                        sink.start_send(item.take().unwrap())?;
                        Poll::Ready(Ok(StreamResult::Completed))
                    }
                }
            }
        }
    }
}

/// Produces the value of a component `future<T>` from a `oneshot::Receiver`.
pub struct OneshotProducer<T>(oneshot::Receiver<T>);

impl<T> OneshotProducer<T> {
    pub fn new(rx: oneshot::Receiver<T>) -> Self {
        Self(rx)
    }
}

impl<D, T: Send + 'static> FutureProducer<D> for OneshotProducer<T> {
    type Item = T;

    fn poll_produce(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        _: StoreContextMut<D>,
        finish: bool,
    ) -> Poll<Result<Option<T>>> {
        match Pin::new(&mut self.get_mut().0).poll(cx) {
            Poll::Pending if finish => Poll::Ready(Ok(None)),
            Poll::Pending => Poll::Pending,
            Poll::Ready(result) => Poll::Ready(Ok(Some(result?))),
        }
    }
}

/// Consumes the value of a component `future<T>` into a `oneshot::Sender`.
pub struct OneshotConsumer<T>(Option<oneshot::Sender<T>>);

impl<T> OneshotConsumer<T> {
    pub fn new(tx: oneshot::Sender<T>) -> Self {
        Self(Some(tx))
    }
}

impl<D, T: Lift + Send + 'static> FutureConsumer<D> for OneshotConsumer<T> {
    type Item = T;

    fn poll_consume(
        self: Pin<&mut Self>,
        _: &mut Context<'_>,
        store: StoreContextMut<D>,
        mut source: Source<'_, T>,
        _: bool,
    ) -> Poll<Result<()>> {
        let value = &mut None;
        source.read(store, value)?;
        _ = self.get_mut().0.take().unwrap().send(value.take().unwrap());
        Poll::Ready(Ok(()))
    }
}
