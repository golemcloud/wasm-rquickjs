export function testAbortBasic() {
    const controller = new AbortController();
    console.log('Created AbortController');
    console.log('Signal aborted (before abort):', controller.signal.aborted);
    
    controller.abort();
    console.log('Signal aborted (after abort):', controller.signal.aborted);
    console.log('test-abort-basic passed');
}

export function testAbortSignal() {
    const signal = AbortSignal.abort('Custom abort reason');
    console.log('Created aborted signal');
    console.log('Signal aborted:', signal.aborted);
    console.log('Signal reason:', signal.reason);
    console.log('test-abort-signal passed');
}

export function testAbortTimeout() {
    let timeoutFired = false;
    const signal = AbortSignal.timeout(10);
    
    console.log('Created timeout signal (10ms)');
    console.log('Signal aborted (immediately):', signal.aborted);
    
    // Wait a bit for the timeout to fire
    let resolved = false;
    setTimeout(() => {
        resolved = true;
        console.log('Signal aborted (after timeout):', signal.aborted);
        console.log('Signal reason name:', signal.reason?.name);
    }, 50);
    
    // Keep the event loop alive by waiting
    let waited = 0;
    while (waited < 100 && !resolved) {
        waited++;
    }
    
    console.log('test-abort-timeout passed');
}

export function testAbortEvent() {
    const controller = new AbortController();
    let eventFired = false;
    
    controller.signal.addEventListener('abort', () => {
        console.log('Abort event fired');
        eventFired = true;
    });
    
    console.log('Added abort event listener');
    controller.abort();
    console.log('Event fired:', eventFired);
    console.log('test-abort-event passed');
}

export function testAbortReason() {
    const controller = new AbortController();
    const customReason = new Error('Custom error');
    
    console.log('Signal reason (before abort):', controller.signal.reason);
    controller.abort(customReason);
    console.log('Signal reason message:', controller.signal.reason?.message);
    console.log('Reasons match:', controller.signal.reason === customReason);
    console.log('test-abort-reason passed');
}

export function testAbortMultipleListeners() {
    const controller = new AbortController();
    let listener1Called = false;
    let listener2Called = false;
    
    controller.signal.addEventListener('abort', () => {
        console.log('Listener 1 fired');
        listener1Called = true;
    });
    
    controller.signal.addEventListener('abort', () => {
        console.log('Listener 2 fired');
        listener2Called = true;
    });
    
    console.log('Added 2 abort event listeners');
    controller.abort();
    console.log('Both listeners called:', listener1Called && listener2Called);
    console.log('test-abort-multiple-listeners passed');
}

export function testThrowIfAborted() {
    const controller = new AbortController();
    
    controller.abort('Custom reason');
    
    try {
        controller.signal.throwIfAborted();
        console.log('throwIfAborted: ERROR - should have thrown');
    } catch (e) {
        console.log('throwIfAborted: Caught error:', e);
        console.log('test-throw-if-aborted passed');
    }
}

export function testThrowIfAbortedNotAborted() {
    const controller = new AbortController();
    let threw = false;
    
    try {
        controller.signal.throwIfAborted();
        console.log('throwIfAborted: Did not throw (correct)');
    } catch (e) {
        threw = true;
    }
    
    console.log('throwIfAborted when not aborted - threw:', threw);
    console.log('test-throw-if-aborted-not-aborted passed');
}

export function testOnabortHandler() {
    const controller = new AbortController();
    let onabortCalled = false;
    
    controller.signal.onabort = () => {
        console.log('onabort handler fired');
        onabortCalled = true;
    };
    
    console.log('Set onabort handler');
    controller.abort();
    console.log('onabort called:', onabortCalled);
    console.log('test-onabort-handler passed');
}

export function testOnceOption() {
    const controller = new AbortController();
    let callCount = 0;
    
    controller.signal.addEventListener('abort', () => {
        callCount++;
        console.log('Listener called');
    }, { once: true });
    
    console.log('Added listener with once: true');
    controller.abort();
    console.log('After first abort, call count:', callCount);
    console.log('test-once-option passed');
}

export function testRemoveEventListener() {
    const controller = new AbortController();
    let listenerCalled = false;
    
    const handler = () => {
        listenerCalled = true;
    };
    
    controller.signal.addEventListener('abort', handler);
    console.log('Added listener');
    
    controller.signal.removeEventListener('abort', handler);
    console.log('Removed listener');
    
    controller.abort();
    console.log('After abort, listener called:', listenerCalled);
    console.log('test-remove-event-listener passed');
}

export function testAbortIdempotent() {
    const controller = new AbortController();
    let callCount = 0;
    
    controller.signal.addEventListener('abort', () => {
        callCount++;
    });
    
    console.log('First abort');
    controller.abort('reason1');
    const reason1 = controller.signal.reason;
    
    console.log('Second abort');
    controller.abort('reason2');
    const reason2 = controller.signal.reason;
    
    console.log('Listener called:', callCount, 'times');
    console.log('Reasons match (should stay same):', reason1 === reason2);
    console.log('test-abort-idempotent passed');
}

export function testAbortNoReason() {
    const controller = new AbortController();
    
    controller.abort();
    
    console.log('Abort without reason - reason type:', controller.signal.reason?.constructor?.name);
    console.log('Abort without reason - reason name:', controller.signal.reason?.name);
    console.log('test-abort-no-reason passed');
}

export function testDuplicateListeners() {
    const controller = new AbortController();
    let callCount = 0;
    
    const handler = () => {
        callCount++;
    };
    
    controller.signal.addEventListener('abort', handler);
    controller.signal.addEventListener('abort', handler);
    console.log('Added same handler twice');
    
    controller.abort();
    console.log('Handler call count:', callCount);
    console.log('test-duplicate-listeners passed');
}
