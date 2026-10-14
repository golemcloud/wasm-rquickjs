//! Native ownership ledger. Declining entry must be mapped to a declared export
//! error, not a component trap that would cancel the existing lease owner.
use std::cell::Cell;
use std::rc::Rc;

#[derive(Clone, Copy, PartialEq, Eq)]
enum Mode {
    Open,
    Leased,
    Spent,
}

pub(crate) struct Ledger {
    mode: Cell<Mode>,
    exports: Cell<usize>,
    retained: Cell<usize>,
}

impl Default for Ledger {
    fn default() -> Self {
        Self {
            mode: Cell::new(Mode::Open),
            exports: Cell::new(0),
            retained: Cell::new(0),
        }
    }
}

impl Ledger {
    pub(crate) fn enter(self: &Rc<Self>) -> Result<Export, &'static str> {
        if self.mode.get() != Mode::Open {
            return Err("terminal runtime is unavailable");
        }
        self.exports.set(
            self.exports
                .get()
                .checked_add(1)
                .expect("export count overflow"),
        );
        Ok(Export(self.clone()))
    }

    /// Register idle waiters, scheduler drivers, and retained writers that can
    /// access the runtime after their initiating call has returned.
    pub(crate) fn retain(self: &Rc<Self>) -> Result<Retained, &'static str> {
        if self.mode.get() != Mode::Open {
            return Err("terminal runtime is unavailable");
        }
        self.retained.set(
            self.retained
                .get()
                .checked_add(1)
                .expect("retained count overflow"),
        );
        Ok(Retained(self.clone()))
    }

    pub(crate) fn exclusive(&self) -> bool {
        self.mode.get() == Mode::Open && self.exports.get() == 1 && self.retained.get() == 0
    }
}

pub(crate) struct Export(Rc<Ledger>);
impl Export {
    /// The caller must additionally establish scheduler and JS quiescence. The
    /// ledger cannot observe engine queues or infer their owners.
    pub(crate) fn lease(&self, quiescent: bool) -> Result<Lease, &'static str> {
        if !quiescent || !self.0.exclusive() {
            return Err("terminal process requires exclusive quiescent ownership");
        }
        self.0.mode.set(Mode::Leased);
        Ok(Lease(self.0.clone()))
    }
}
impl Drop for Export {
    fn drop(&mut self) {
        self.0.exports.set(
            self.0
                .exports
                .get()
                .checked_sub(1)
                .expect("export count underflow"),
        );
    }
}

pub(crate) struct Retained(Rc<Ledger>);
impl Drop for Retained {
    fn drop(&mut self) {
        self.0.retained.set(
            self.0
                .retained
                .get()
                .checked_sub(1)
                .expect("retained count underflow"),
        );
    }
}

pub(crate) struct Lease(Rc<Ledger>);
impl Drop for Lease {
    fn drop(&mut self) {
        self.0.mode.set(Mode::Spent);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn competing_entry_does_not_cancel_the_owner() {
        let ledger = Rc::new(Ledger::default());
        let export = ledger.enter().unwrap();
        let lease = export.lease(true).unwrap();
        assert!(ledger.enter().is_err());
        assert!(ledger.retain().is_err());
        assert!(ledger.mode.get() == Mode::Leased);
        drop(lease);
        assert!(ledger.enter().is_err());
        drop(export);
        assert_eq!(ledger.exports.get(), 0);
    }

    #[test]
    fn parked_calls_and_retained_activity_block_admission() {
        let ledger = Rc::new(Ledger::default());
        let first = ledger.enter().unwrap();
        let second = ledger.enter().unwrap();
        assert!(first.lease(true).is_err());
        drop(second);
        let retained = ledger.retain().unwrap();
        assert!(first.lease(true).is_err());
        drop(retained);
        assert!(first.lease(false).is_err());
        let lease = first.lease(true).unwrap();
        drop(lease);
        assert!(first.lease(true).is_err());
    }

    #[test]
    fn cancellation_releases_registrations_but_never_reopens_a_lease() {
        let ledger = Rc::new(Ledger::default());
        let first = ledger.enter().unwrap();
        let retained = ledger.retain().unwrap();
        drop(retained);
        drop(first);
        let next = ledger.enter().unwrap();
        assert!(ledger.exclusive());
        let lease = next.lease(true).unwrap();
        drop(next);
        assert_eq!(ledger.exports.get(), 0);
        assert!(ledger.enter().is_err());
        drop(lease);
        assert!(ledger.enter().is_err());
    }
}
