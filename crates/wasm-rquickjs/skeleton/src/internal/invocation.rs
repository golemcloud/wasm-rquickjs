//! Runs the JavaScript work of each exported call on that call's own component-model task.
//!
//! The host attributes every host call to the invocation whose component-model task makes it, so
//! the runtime must never run one call's work while another call's task is polling. Each exported
//! call is an *invocation* with a job owner number, and everything it starts is tagged with that
//! owner:
//!
//! * QuickJS jobs belong to the owner that was current when they were enqueued. A promise reaction
//!   job belongs to the owner that was current when the reaction was registered (`then`, `await`),
//!   so a continuation that crosses invocations runs for the invocation that awaits. rquickjs keeps
//!   the jobs per owner (`rquickjs::runtime::job_owner`).
//! * Futures spawned into the rquickjs scheduler (`Ctx::spawn`) are kept per owner.
//! * Futures spawned on the component-model executor ([`spawn_local`]) are polled under the owner
//!   that spawned them, on the task that spawned them.
//! * Timers, `process.nextTick` callbacks and component writers are counted per owner.
//!
//! rquickjs only executes jobs, and only polls futures, of the owner that is current on the
//! runtime. Every future that can enter JavaScript is wrapped in [`Owned`], which makes its owner
//! current for each poll. Because those futures belong to the task of their invocation, the
//! invocation's work runs only on its own task.
//!
//! An async exported call drains its own work on its task; other invocations' work is neither run
//! nor awaited. With the `post-return-drain` feature, for hosts that keep driving a call's task
//! until it exits, the call returns its result as soon as it is ready and drains afterwards.
//! Otherwise it drains before it returns, unless a JavaScript producer still feeds a component
//! future/stream that the host reads after a return. Owner 0 is the runtime's own work, such as
//! initialization and synchronous exported calls. A synchronous call returns without waiting for
//! the work it schedules and its task ends when it returns, so a running async exported call, or
//! else the next one, adopts that work and drains it on its own task. Work that a future of a
//! finished invocation starts is adopted the same way.
//!
//! When an invocation has finished, a reaction that it registered and that another invocation
//! triggers later runs for the triggering invocation, because the finished invocation's task no
//! longer runs jobs.

use super::runtime_services::{ComponentWakeHub, RuntimeServices};
use futures::channel::oneshot;
use rquickjs::runtime::job_owner;
use rquickjs::{Ctx, qjs};
use std::cell::{Cell, RefCell};
use std::collections::{HashMap, HashSet};
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll, Wake};
use wit_bindgen_p3::rt::async_support::JoinHandle;

/// The job owner of the runtime's own work.
pub(crate) const RUNTIME_OWNER: u64 = 0;

thread_local! {
    static CURRENT: Cell<u64> = const { Cell::new(RUNTIME_OWNER) };
    static NEXT: Cell<u64> = const { Cell::new(RUNTIME_OWNER + 1) };
    static RUNNING: RefCell<HashSet<u64>> = RefCell::new(HashSet::from([RUNTIME_OWNER]));
    static RUNTIME: Cell<*mut qjs::JSRuntime> = const { Cell::new(std::ptr::null_mut()) };
    /// Wakes every driver of the component's runtime.
    static WAKE_HUB: RefCell<Option<Arc<ComponentWakeHub>>> = const { RefCell::new(None) };
}

/// The owner whose work runs now.
pub(crate) fn current() -> u64 {
    CURRENT.get()
}

/// The job owner that is current on the runtime of `ctx`. The component's runtime follows
/// [`current`]; other runtimes, such as execution jobs, always run as [`RUNTIME_OWNER`].
pub(crate) fn job_owner_of(ctx: &Ctx<'_>) -> u64 {
    unsafe { job_owner::get(qjs::JS_GetRuntime(ctx.as_raw().as_ptr())) }
}

fn enter(owner: u64) -> u64 {
    let previous = CURRENT.replace(owner);
    let rt = RUNTIME.get();
    if !rt.is_null() {
        unsafe {
            job_owner::set(rt, owner);
        }
    }
    previous
}

/// Makes `ctx`'s runtime the component's runtime, whose job owner follows [`current`].
pub(crate) fn register_component_runtime(ctx: &Ctx<'_>) {
    let rt = unsafe { qjs::JS_GetRuntime(ctx.as_raw().as_ptr()) };
    RUNTIME.set(rt);
    let hub = ctx
        .userdata::<RuntimeServices>()
        .expect("runtime services not initialized")
        .timers
        .wake_hub
        .clone();
    WAKE_HUB.set(Some(hub));
    unsafe {
        job_owner::set_redirect(rt, Some(redirect));
        job_owner::set(rt, current());
    }
}

/// Called when a job is enqueued for an owner other than the current one, such as the
/// continuation of an invocation that awaits a promise another invocation resolves. The owner's
/// drivers are woken, because nothing else tells them about the new job. Jobs of an owner that no
/// longer runs jobs go to the owner that enqueues them, which always runs jobs: it is a running
/// invocation or the runtime, because a future of a finished invocation runs as the runtime (see
/// [`Owned`]).
///
/// rquickjs calls this while QuickJS settles a promise, so it must not run JavaScript or enqueue
/// jobs.
fn redirect(owner: u64, current: u64) -> u64 {
    if RUNNING.with_borrow(|running| running.contains(&owner)) {
        WAKE_HUB.with_borrow(|hub| {
            if let Some(hub) = hub {
                hub.wake_by_ref();
            }
        });
        owner
    } else {
        current
    }
}

/// Allocates the owner of a new invocation.
fn begin() -> u64 {
    let owner = NEXT.get();
    NEXT.set(owner.checked_add(1).expect("invocation owner overflowed"));
    RUNNING.with_borrow_mut(|running| running.insert(owner));
    owner
}

/// Marks an owner as no longer running jobs.
pub(crate) fn finish(owner: u64) {
    RUNNING.with_borrow_mut(|running| running.remove(&owner));
    ADOPTIONS.with_borrow_mut(|adoptions| adoptions.remove(&owner));
}

/// The owner whose work a future of `owner` runs as. A finished invocation no longer runs jobs,
/// so work that one of its futures starts, such as a promise it resolves, is the runtime's own
/// work and is adopted like the work of a synchronous call.
fn effective(owner: u64) -> u64 {
    if owner == RUNTIME_OWNER || RUNNING.with_borrow(|running| running.contains(&owner)) {
        owner
    } else {
        RUNTIME_OWNER
    }
}

/// A future whose polls, and drop, run with its owner current.
pub struct Owned<F> {
    owner: u64,
    inner: Option<F>,
}

impl<F> Owned<F> {
    pub(crate) fn new(owner: u64, inner: F) -> Self {
        Self {
            owner,
            inner: Some(inner),
        }
    }
}

/// Makes the effective owner of `owner` current until it is dropped, then restores the previous
/// owner. Work that a finished owner starts is reported as left for adoption.
struct EnterGuard {
    previous: u64,
    adopted: bool,
}

impl EnterGuard {
    fn new(owner: u64) -> Self {
        let effective = effective(owner);
        Self {
            previous: enter(effective),
            adopted: effective != owner,
        }
    }
}

impl Drop for EnterGuard {
    fn drop(&mut self) {
        enter(self.previous);
        if self.adopted {
            leave_runtime_work();
        }
    }
}

impl<F: Future> Future for Owned<F> {
    type Output = F::Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<F::Output> {
        // SAFETY: `inner` is structurally pinned; it is never moved out, only dropped in place.
        let this = unsafe { self.get_unchecked_mut() };
        let _guard = EnterGuard::new(this.owner);
        let inner = unsafe { Pin::new_unchecked(this.inner.as_mut().expect("polled after drop")) };
        let result = inner.poll(cx);
        if result.is_ready() {
            this.inner = None;
        }
        result
    }
}

impl<F> Drop for Owned<F> {
    fn drop(&mut self) {
        if self.inner.is_some() {
            let _guard = EnterGuard::new(self.owner);
            self.inner = None;
        }
    }
}

/// Spawns `future` on the current component-model task, polled under the current owner.
pub fn spawn_local<T: 'static>(future: impl Future<Output = T> + 'static) -> JoinHandle<T> {
    wit_bindgen_p3::rt::async_support::spawn_local(Owned::new(current(), future))
}

/// Runs the body of an async exported call as a new invocation, which drains its own remaining
/// work on the call's task. With the `post-return-drain` feature the result is returned as soon
/// as the body produces it and the drain runs after the return. Otherwise the drain, including
/// the work this call adopts, runs before the return, except while a JavaScript producer of any
/// invocation feeds a component future/stream that the host can only consume after a return.
pub async fn invocation<T>(body: impl Future<Output = T>) -> T {
    let owner = begin();
    adopt_runtime_work(owner);
    let mut pending = PendingDrain(Some(owner));
    let result = Owned::new(owner, body).await;
    if !cfg!(feature = "post-return-drain") && Owned::new(owner, drain_before_return(owner)).await {
        pending.0 = None;
        finish(owner);
    }
    drop(pending);
    result
}

/// Drains an invocation's work after the return when it is dropped armed: after the result, or
/// when the call is cancelled before it, so that a cancelled invocation's work still runs and the
/// invocation finishes.
struct PendingDrain(Option<u64>);

impl Drop for PendingDrain {
    fn drop(&mut self) {
        if let Some(owner) = self.0.take() {
            wit_bindgen_p3::rt::async_support::spawn_local(Owned::new(owner, async move {
                super::p3::drain_invocation().await;
                finish(owner);
            }));
        }
    }
}

/// Drains the invocation's own work and the work it adopted. Returns `false` when the rest must
/// drain after the return (see [`super::p3::drain_invocation_before_return`]), also when a
/// JavaScript producer becomes active while the adopted work drains: the adopted drains then keep
/// running on the call's task after the return.
async fn drain_before_return(owner: u64) -> bool {
    loop {
        if !super::p3::drain_invocation_before_return().await {
            return false;
        }
        let adoptions = ADOPTIONS.with_borrow_mut(|adoptions| adoptions.remove(&owner));
        let Some(adoptions) = adoptions else {
            return true;
        };
        for adoption in adoptions {
            let completed = super::p3::await_unless_any_writer_activates(async {
                let _ = adoption.await;
            })
            .await;
            if !completed {
                return false;
            }
        }
    }
}

/// Runs the body of a synchronous exported call as the runtime's own work. A synchronous call
/// must return without waiting for the work it schedules, and its task ends when it returns, so
/// that work stays with the runtime until an async exported call adopts it.
pub async fn sync_invocation<T>(body: impl Future<Output = T>) -> T {
    let result = Owned::new(RUNTIME_OWNER, body).await;
    leave_runtime_work();
    result
}

thread_local! {
    /// Whether work of the runtime owner may be waiting for adoption.
    static RUNTIME_WORK_LEFT: Cell<bool> = const { Cell::new(false) };
    /// The completion of each drain of adopted work, by the invocation that adopted it, until
    /// that invocation awaits them before it returns.
    static ADOPTIONS: RefCell<HashMap<u64, Vec<oneshot::Receiver<()>>>> =
        RefCell::new(HashMap::new());
}

/// Records that work of the runtime owner waits for adoption, and wakes the running invocations'
/// drivers so that one of them adopts it.
fn leave_runtime_work() {
    RUNTIME_WORK_LEFT.set(true);
    WAKE_HUB.with_borrow(|hub| {
        if let Some(hub) = hub {
            hub.wake_by_ref();
        }
    });
}

/// Drains the runtime owner's waiting work on the current task, for invocation `adopter`. Called
/// when an invocation starts, and by every poll of an invocation's scheduler driver, so a running
/// invocation adopts the work as soon as it is left.
pub(crate) fn adopt_runtime_work(adopter: u64) {
    if adopter == RUNTIME_OWNER || !RUNTIME_WORK_LEFT.replace(false) {
        return;
    }
    let (done, completion) = oneshot::channel();
    if !cfg!(feature = "post-return-drain") {
        ADOPTIONS
            .with_borrow_mut(|adoptions| adoptions.entry(adopter).or_default().push(completion));
    }
    wit_bindgen_p3::rt::async_support::spawn_local(Owned::new(RUNTIME_OWNER, async move {
        let mut left = LeftOnDrop(true);
        super::p3::drain_invocation().await;
        left.0 = false;
        let _ = done.send(());
    }));
}

/// Reports the runtime owner's work as waiting again when an adoption drain is dropped before it
/// completes.
struct LeftOnDrop(bool);

impl Drop for LeftOnDrop {
    fn drop(&mut self) {
        if self.0 {
            RUNTIME_WORK_LEFT.set(true);
        }
    }
}

/// Runs `future` as the runtime's own work, for example the runtime's initialization.
pub(crate) async fn as_runtime<T>(future: impl Future<Output = T>) -> T {
    Owned::new(RUNTIME_OWNER, future).await
}
