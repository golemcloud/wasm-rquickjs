import util from "node:util";

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
    
    // Map examples
    console.log("--- Map Examples ---");
    
    const emptyMap = new Map();
    console.log("Empty map:", emptyMap);
    
    const simpleMap = new Map();
    simpleMap.set("name", "John");
    simpleMap.set("age", 30);
    simpleMap.set("city", "New York");
    console.log("Simple map:", simpleMap);
    
    const mixedMap = new Map();
    mixedMap.set("string", "value");
    mixedMap.set(42, "number key");
    mixedMap.set({ key: "obj" }, "object key");
    console.log("Map with mixed keys:", mixedMap);
    
    const nestedMap = new Map();
    nestedMap.set("user", { name: "Alice", age: 25 });
    nestedMap.set("config", { debug: true, timeout: 5000 });
    console.log("Map with object values:", nestedMap);
    
    const mapWithArray = new Map();
    mapWithArray.set("colors", ["red", "green", "blue"]);
    mapWithArray.set("numbers", [1, 2, 3, 4, 5]);
    console.log("Map with array values:", mapWithArray);
    
    console.log("--- Map in dir() ---");
    console.dir(simpleMap, { colors: false });
    
    console.log("--- Map in inspect() ---");
    console.log(util.inspect(nestedMap, { depth: 2 }));
    
    // Set examples
    console.log("--- Set Examples ---");
    
    const emptySet = new Set();
    console.log("Empty set:", emptySet);
    
    const simpleSet = new Set();
    simpleSet.add("apple");
    simpleSet.add("banana");
    simpleSet.add("cherry");
    console.log("Simple set:", simpleSet);
    
    const mixedSet = new Set();
    mixedSet.add("string");
    mixedSet.add(42);
    mixedSet.add({ key: "obj" });
    mixedSet.add([1, 2, 3]);
    console.log("Set with mixed types:", mixedSet);
    
    const nestedSet = new Set();
    nestedSet.add({ name: "Alice", age: 25 });
    nestedSet.add({ name: "Bob", age: 30 });
    console.log("Set with objects:", nestedSet);
    
    console.log("--- Set in dir() ---");
    console.dir(simpleSet, { colors: false });
    
    console.log("--- Set in inspect() ---");
    console.log(util.inspect(nestedSet, { depth: 2 }));
    
    // WeakSet examples
    console.log("--- WeakSet Examples ---");
    const weakSet = new WeakSet();
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    weakSet.add(obj1);
    weakSet.add(obj2);
    console.log("WeakSet:", weakSet);
    
    // WeakMap examples
    console.log("--- WeakMap Examples ---");
    const weakMap = new WeakMap();
    const key1 = { name: "Alice" };
    const key2 = { name: "Bob" };
    weakMap.set(key1, "value1");
    weakMap.set(key2, "value2");
    console.log("WeakMap:", weakMap);
    
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
