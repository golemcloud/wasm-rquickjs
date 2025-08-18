function runImpl() {
    console.count();
    console.log("logged", "message", 1, 2, { key: "value" });
    console.trace("This is a trace message");
    console.debug("This is an debug message");
    console.info("This is an info message");
    console.warn("This is a warning message");
    console.error("This is an error message");
    console.count();
    console.assert(1 === 2, "This is an assertion failure");
    console.assert(1 === 1, "This should not be printed");
    console.group("Group 1");
    console.log("Inside Group 1");
    console.groupCollapsed("Group 2");
    console.log("Inside Group 2");
    console.groupEnd();
    console.groupEnd();
    console.count();
    console.count("test");
    console.countReset();
    console.count("test");
    console.count();
}

export const run = runImpl;
