export function simpleGet(port) {
    console.log('XMLHttpRequest test 1: simple GET');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === xhr.DONE) {
                console.log(`Status: ${xhr.status}`);
                console.log(`Response length: ${xhr.response ? xhr.response.length : 0}`);
                resolve();
            }
        };
        
        xhr.open('GET', `http://localhost:${port}/todos`);
        xhr.send();
    });
}

export function simplePost(port) {
    console.log('XMLHttpRequest test 2: simple POST');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onload = function() {
            console.log(`POST Status: ${xhr.status}`);
            console.log(`POST Response length: ${xhr.response ? xhr.response.length : 0}`);
            resolve();
        };
        
        xhr.onerror = function() {
            console.log('POST Error occurred');
            resolve();
        };
        
        xhr.open('POST', `http://localhost:${port}/todos`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({
            title: 'Test Todo',
            body: 'Testing XMLHttpRequest',
            userId: 1
        }));
    });
}

export function setRequestHeaders(port) {
    console.log('XMLHttpRequest test 3: set request headers');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onload = function() {
            console.log(`Headers test status: ${xhr.status}`);
            resolve();
        };
        
        xhr.open('GET', `http://localhost:${port}/todos`);
        xhr.setRequestHeader('X-Custom-Header', 'test-value');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.send();
    });
}

export function getResponseHeaders(port) {
    console.log('XMLHttpRequest test 4: get response headers');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onload = function() {
            const contentType = xhr.getResponseHeader('content-type');
            console.log(`Content-Type header: ${contentType}`);
            
            const allHeaders = xhr.getAllResponseHeaders();
            console.log(`All headers length: ${allHeaders.length}`);
            
            resolve();
        };
        
        xhr.open('GET', `http://localhost:${port}/todos`);
        xhr.send();
    });
}

export function responseTypes(port) {
    console.log('XMLHttpRequest test 5: response types');
    
    return new Promise(async (resolve) => {
        // Test text response
        const xhr1 = new XMLHttpRequest();
        xhr1.responseType = 'text';
        
        xhr1.onload = function() {
            console.log(`Text response type: ${typeof xhr1.response}`);
            
            // Test JSON response
            const xhr2 = new XMLHttpRequest();
            xhr2.responseType = 'json';
            
            xhr2.onload = function() {
                console.log(`JSON response type: ${typeof xhr2.response}`);
                console.log(`JSON response is object: ${typeof xhr2.response === 'object'}`);
                resolve();
            };
            
            xhr2.open('GET', `http://localhost:${port}/todos`);
            xhr2.send();
        };
        
        xhr1.open('GET', `http://localhost:${port}/todos`);
        xhr1.send();
    });
}

export function readystateEvents(port) {
    console.log('XMLHttpRequest test 6: readystate events');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const states = [];
        
        xhr.onreadystatechange = function() {
            states.push(xhr.readyState);
            console.log(`ReadyState changed to: ${xhr.readyState}`);
        };
        
        xhr.onload = function() {
            console.log(`States encountered: ${states.join(', ')}`);
            console.log(`Final status: ${xhr.status}`);
            resolve();
        };
        
        xhr.open('GET', `http://localhost:${port}/todos`);
        xhr.send();
    });
}

export function errorHandling(port) {
    console.log('XMLHttpRequest test 7: error handling');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onerror = function() {
            console.log('Error handler called');
            console.log(`Status on error: ${xhr.status}`);
            resolve();
        };
        
        xhr.onload = function() {
            console.log('Request succeeded');
            resolve();
        };
        
        // Try to fetch from invalid URL to trigger error
        xhr.open('GET', 'http://invalid-domain-that-does-not-exist-12345.com/test');
        xhr.send();
    });
}

export function abortRequest(port) {
    console.log('XMLHttpRequest test 8: abort request');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        let abortCalled = false;
        
        xhr.onabort = function() {
            console.log('Abort handler called');
            abortCalled = true;
            resolve();
        };
        
        xhr.onload = function() {
            console.log('Request completed (should not happen)');
            resolve();
        };
        
        xhr.open('GET', `http://localhost:${port}/todos-stream`);
        xhr.send();
        
        // Abort immediately after send
        setTimeout(() => {
            xhr.abort();
        }, 10);
    });
}

export function timeoutHandling(port) {
    console.log('XMLHttpRequest test 9: timeout handling');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        let timeoutCalled = false;
        
        xhr.timeout = 100; // 100ms timeout
        
        xhr.ontimeout = function() {
            console.log('Timeout handler called');
            timeoutCalled = true;
            resolve();
        };
        
        xhr.onload = function() {
            console.log('Request completed');
            if (!timeoutCalled) {
                resolve();
            }
        };
        
        // Use a slow endpoint to trigger timeout
        xhr.open('GET', `http://localhost:${port}/slow`);
        xhr.send();
    });
}

export function requestWithBasicAuth(port) {
    console.log('XMLHttpRequest test 10: basic auth');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onload = function() {
            console.log(`Auth request status: ${xhr.status}`);
            resolve();
        };
        
        xhr.onerror = function() {
            console.log('Auth request error');
            resolve();
        };
        
        // Basic auth is set via open method
        xhr.open('GET', `http://localhost:${port}/todos`, true, 'testuser', 'testpass');
        xhr.send();
    });
}

export function postWithFormData(port) {
    console.log('XMLHttpRequest test 11: POST with FormData');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        
        formData.append('name', 'John Doe');
        formData.append('email', 'john@example.com');
        
        xhr.onload = function() {
            console.log(`FormData POST status: ${xhr.status}`);
            resolve();
        };
        
        xhr.open('POST', `http://localhost:${port}/form-echo`);
        xhr.send(formData);
    });
}

export function postWithJsonBody(port) {
    console.log('XMLHttpRequest test 12: POST with JSON body');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        const jsonData = {
            name: 'Test',
            value: 42
        };
        
        xhr.onload = function() {
            console.log(`JSON POST status: ${xhr.status}`);
            console.log(`JSON response: ${xhr.response}`);
            resolve();
        };
        
        xhr.open('POST', `http://localhost:${port}/json-echo`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(jsonData));
    });
}

export function statusIsNumber(port) {
    console.log('XMLHttpRequest test 13: status is number');
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onload = function() {
            const status = xhr.status;
            console.log(`Status value: ${status}`);
            console.log(`Status typeof: ${typeof status}`);
            console.log(`Status is number: ${typeof status === 'number'}`);
            console.log(`Status === 200: ${status === 200}`);
            console.log(`Status >= 200 && status < 300: ${status >= 200 && status < 300}`);
            resolve();
        };
        
        xhr.onerror = function() {
            console.log('Error occurred');
            resolve();
        };
        
        xhr.open('GET', `http://localhost:${port}/todos`);
        xhr.send();
    });
}
