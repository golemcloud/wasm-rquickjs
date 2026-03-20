export function testPrimitives() {
    const results = [];
    
    const num = 42;
    const clonedNum = structuredClone(num);
    results.push(`number: ${clonedNum === num}`);
    
    const str = "hello";
    const clonedStr = structuredClone(str);
    results.push(`string: ${clonedStr === str}`);
    
    const bool = true;
    const clonedBool = structuredClone(bool);
    results.push(`boolean: ${clonedBool === bool}`);
    
    const nil = null;
    const clonedNil = structuredClone(nil);
    results.push(`null: ${clonedNil === nil}`);
    
    const undef = undefined;
    const clonedUndef = structuredClone(undef);
    results.push(`undefined: ${clonedUndef === undef}`);
    
    const big = 9007199254740993n;
    const clonedBig = structuredClone(big);
    results.push(`bigint: ${clonedBig === big}`);
    
    return results.join(", ");
}

export function testObjects() {
    const results = [];
    
    const obj = { a: 1, b: "two", c: { nested: true } };
    const clonedObj = structuredClone(obj);
    results.push(`object different ref: ${clonedObj !== obj}`);
    results.push(`object.a: ${clonedObj.a === 1}`);
    results.push(`object.b: ${clonedObj.b === "two"}`);
    results.push(`object.c.nested: ${clonedObj.c.nested === true}`);
    results.push(`nested different ref: ${clonedObj.c !== obj.c}`);
    
    obj.a = 999;
    results.push(`mutation isolated: ${clonedObj.a === 1}`);
    
    return results.join(", ");
}

export function testArrays() {
    const results = [];
    
    const arr = [1, 2, 3, "four", { five: 5 }];
    const clonedArr = structuredClone(arr);
    results.push(`array different ref: ${clonedArr !== arr}`);
    results.push(`array length: ${clonedArr.length === arr.length}`);
    results.push(`array[0]: ${clonedArr[0] === 1}`);
    results.push(`array[3]: ${clonedArr[3] === "four"}`);
    results.push(`array[4] different ref: ${clonedArr[4] !== arr[4]}`);
    results.push(`array[4].five: ${clonedArr[4].five === 5}`);
    
    const typedArr = new Uint8Array([1, 2, 3, 4, 5]);
    const clonedTypedArr = structuredClone(typedArr);
    results.push(`typed array different ref: ${clonedTypedArr !== typedArr}`);
    results.push(`typed array length: ${clonedTypedArr.length === typedArr.length}`);
    results.push(`typed array[2]: ${clonedTypedArr[2] === 3}`);
    
    return results.join(", ");
}

export function testCollections() {
    const results = [];
    
    const map = new Map();
    map.set("key1", "value1");
    map.set("key2", { nested: "object" });
    const clonedMap = structuredClone(map);
    results.push(`map different ref: ${clonedMap !== map}`);
    results.push(`map size: ${clonedMap.size === 2}`);
    results.push(`map key1: ${clonedMap.get("key1") === "value1"}`);
    results.push(`map key2 different ref: ${clonedMap.get("key2") !== map.get("key2")}`);
    results.push(`map key2.nested: ${clonedMap.get("key2").nested === "object"}`);
    
    const set = new Set();
    set.add("one");
    set.add("two");
    set.add(3);
    const clonedSet = structuredClone(set);
    results.push(`set different ref: ${clonedSet !== set}`);
    results.push(`set size: ${clonedSet.size === 3}`);
    results.push(`set has one: ${clonedSet.has("one")}`);
    results.push(`set has 3: ${clonedSet.has(3)}`);
    
    return results.join(", ");
}

export function testSpecialTypes() {
    const results = [];
    
    const date = new Date("2024-01-15T10:30:00Z");
    const clonedDate = structuredClone(date);
    results.push(`date different ref: ${clonedDate !== date}`);
    results.push(`date value: ${clonedDate.getTime() === date.getTime()}`);
    
    const regex = /hello\s+world/gi;
    const clonedRegex = structuredClone(regex);
    results.push(`regex different ref: ${clonedRegex !== regex}`);
    results.push(`regex source: ${clonedRegex.source === regex.source}`);
    results.push(`regex flags: ${clonedRegex.flags === regex.flags}`);
    
    const error = new Error("test error");
    const clonedError = structuredClone(error);
    results.push(`error different ref: ${clonedError !== error}`);
    results.push(`error message: ${clonedError.message === "test error"}`);
    
    return results.join(", ");
}

export function testCircularRefs() {
    const results = [];
    
    const obj = { name: "root" };
    obj.self = obj;
    
    const clonedObj = structuredClone(obj);
    results.push(`circular clone different ref: ${clonedObj !== obj}`);
    results.push(`circular self ref: ${clonedObj.self === clonedObj}`);
    results.push(`circular name: ${clonedObj.name === "root"}`);
    
    const arr = [1, 2];
    arr.push(arr);
    
    const clonedArr = structuredClone(arr);
    results.push(`circular array different ref: ${clonedArr !== arr}`);
    results.push(`circular array self ref: ${clonedArr[2] === clonedArr}`);
    results.push(`circular array[0]: ${clonedArr[0] === 1}`);
    
    return results.join(", ");
}
