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
