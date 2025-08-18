function runImpl() {
    console.count();
    console.log("logged", "message", 1, 2, {key: "value"});
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
    console.dir({key: "value", nested: {a: 1, b: 2}}, {depth: 2, colors: true});
    console.dir({key: "value", nested: {a: 1, b: 2}}, {colors: false});
    console.table(["apples", "oranges", "bananas"]);
    const people = [
        ["Tyrone", "Jones"],
        ["Janet", "Smith"],
        ["Maria", "Cruz"],
    ];
    console.table(people);

    function Person(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    const me = new Person("Tyrone", "Jones");
    console.table(me);

    const tyrone = new Person("Tyrone", "Jones");
    const janet = new Person("Janet", "Smith");
    const maria = new Person("Maria", "Cruz");

    console.table([tyrone, janet, maria], ["firstName"]);
    console.time("time-test");
    setTimeout(() => {
        console.timeLog("time-test", "after 1 second");
        setTimeout(() => {
            console.timeLog("time-test", "after 2 seconds");
            console.timeEnd("time-test");
        }, 1000);
    }, 1000);
}

export const run = runImpl;
