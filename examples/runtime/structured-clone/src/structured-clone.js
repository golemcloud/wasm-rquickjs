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

import assert from 'node:assert/strict';
import {
    markAsUncloneable, markAsUntransferable, isMarkedAsUntransferable, MessageChannel, MessagePort, receiveMessageOnPort, Worker,
} from 'node:worker_threads';
import { Blob as BufferBlob, File as BufferFile, Buffer } from 'node:buffer';
import { transferableAbortController, transferableAbortSignal, aborted } from 'node:util';
import { createSecretKey, webcrypto } from 'node:crypto';
import { BlockList } from 'node:net';

const restoredMarked = Object.freeze({value: 1});
markAsUncloneable(restoredMarked);
const restoredBuffer = new ArrayBuffer(8);
markAsUntransferable(restoredBuffer);
const cloneFailure = fn => assert.throws(fn, {name: 'DataCloneError', code: 25});
async function within(task) {
    let guard;
    try {return await Promise.race([task,new Promise((_,reject)=>{guard=setTimeout(()=>reject(Error('message delivery timed out')),1000);})]);}
    finally{clearTimeout(guard);}
}

export async function testPolicyCase(index) {
    switch (index) {
        case 0: {
            for (const primitive of [undefined, null, 1, true, 'x', 1n, Symbol('x')]) {
                markAsUncloneable(primitive);
                markAsUntransferable(primitive);
                assert.equal(isMarkedAsUntransferable(primitive), false);
            }
            for (const value of [{}, Object.freeze({}), Object.preventExtensions({})]) {
                const before = Reflect.ownKeys(value);
                markAsUncloneable(value);
                markAsUntransferable(value);
                assert.equal(isMarkedAsUntransferable(value), true);
                assert.deepEqual(Reflect.ownKeys(value), before);
                cloneFailure(() => structuredClone(value));
            }
            let reads = 0;
            const value = {get fail() { reads++; throw Error('getter ran'); }};
            markAsUncloneable(value);
            cloneFailure(() => structuredClone({value}));
            assert.equal(reads, 0);
            const prototype = {};
            markAsUncloneable(prototype);
            markAsUntransferable(prototype);
            assert.equal(isMarkedAsUntransferable(Object.create(prototype)), false);
            assert.deepEqual(structuredClone(Object.create(prototype)), {});
            cloneFailure(() => structuredClone(restoredMarked));
            assert.equal(isMarkedAsUntransferable(restoredBuffer), true);
            break;
        }
        case 1: {
            const zeros=structuredClone([0,-0,-0,0,new Number(-0),new Map([[1,-0],[2,0]])]);
            assert.equal(Object.is(zeros[0],0),true);assert.equal(Object.is(zeros[1],-0),true);
            assert.equal(Object.is(zeros[2],-0),true);assert.equal(Object.is(zeros[3],0),true);
            assert.equal(Object.is(zeros[4].valueOf(),-0),true);
            assert.equal(Object.is(zeros[5].get(1),-0),true);assert.equal(Object.is(zeros[5].get(2),0),true);
            const key = createSecretKey(Buffer.from('secret'));
            for (const value of [[], new Date(NaN), /a/gi, new Map([[1,2]]), new Set([3]),
                new ArrayBuffer(2), new Uint8Array([3]), new DataView(new ArrayBuffer(2)),
                new Number(1), new Boolean(true), new String('x'), Object(1n), new TypeError('x'), key]) {
                markAsUncloneable(value);
                const clone = structuredClone(value);
                assert.notEqual(clone, value);
            }
            assert.deepEqual(structuredClone({[Symbol.toStringTag]: 'ArrayBuffer', x: 1}), {x: 1});
            const blocked = {};
            markAsUncloneable(blocked);
            for (const graph of [[blocked], new Map([[blocked, 1]]), new Map([[1, blocked]]), new Set([blocked]), new Error('x', {cause: blocked})])
                cloneFailure(() => structuredClone(graph));
            const a = new Array(4);
            a[1] = a;
            a.extra = {a};
            const clone = structuredClone(a);
            assert.equal(0 in clone, false);
            assert.equal(clone.length, 4);
            assert.equal(clone[1], clone);
            assert.equal(clone.extra.a, clone);
            a.extra = blocked;
            cloneFailure(() => structuredClone(a));
            let causeReads = 0;
            const error = new Error('x');
            Object.defineProperty(error, 'cause', {get() {causeReads++; return blocked;}});
            structuredClone(error);
            assert.equal(causeReads, 0);
            let stackReads=0;
            const stackError=new Error('original');
            Object.defineProperty(stackError,'stack',{get(){stackReads++;return 'original stack';}});
            assert.equal(structuredClone(stackError).stack,'original stack');
            assert.equal(stackReads,1);
            break;
        }
        case 2: {
            let reads = 0;
            const shared = {x: 1};
            const graph = {get value() {reads++; return shared;}, shared, map: new Map([[shared, shared]]), set: new Set([shared])};
            graph.self = graph;
            Object.defineProperty(graph, '__proto__', {enumerable: true, value: shared});
            const clone = structuredClone(graph);
            assert.equal(reads, 1);
            assert.equal(clone.self, clone);
            assert.equal(clone.value, clone.shared);
            assert.equal(clone.map.get(clone.shared), clone.shared);
            assert.equal(clone.set.has(clone.shared), true);
            assert.equal(Object.getPrototypeOf(clone), Object.prototype);
            assert.equal(Object.hasOwn(clone, '__proto__'), true);
            assert.equal(clone.__proto__, clone.shared);
            const late={};markAsUncloneable(late);
            const map=new Map();
            map.set('first',{get value(){map.set('late',late);return 1;}});
            const mapCopy=structuredClone(map);
            assert.equal(map.has('late'),true);assert.equal(mapCopy.has('late'),false);
            const set=new Set();
            set.add({get value(){set.add(late);return 1;}});
            assert.equal(structuredClone(set).size,1);
            const removed={get first(){delete removed.second;return 1;},second:late};
            assert.deepEqual(structuredClone(removed),{first:1});
            cloneFailure(() => structuredClone(() => {}, {json: true, lossy: true}));
            structuredClone(1, {get json() {throw Error('ignored option read');}});
            break;
        }
        case 3: {
            const buffer = new ArrayBuffer(24);
            const a = new Uint8Array(buffer, 4, 5);
            a.set([1,2,3,4,5]);
            const b = new DataView(buffer, 3, 8);
            const clone = structuredClone({buffer, a, b}, {transfer: [buffer]});
            assert.equal(buffer.byteLength, 0);
            assert.equal(clone.a.buffer, clone.buffer);
            assert.equal(clone.b.buffer, clone.buffer);
            assert.equal(clone.a.byteOffset, 4);
            assert.equal(clone.b.byteOffset, 3);
            assert.deepEqual([...clone.a], [1,2,3,4,5]);
            const absent = new ArrayBuffer(2);
            structuredClone(1, {transfer: [absent]});
            assert.equal(absent.byteLength, 0);
            break;
        }
        case 4: {
            const a = new ArrayBuffer(8), b = new ArrayBuffer(8);
            markAsUntransferable(b);
            cloneFailure(() => structuredClone({a, b}, {transfer: [a,b]}));
            assert.equal(a.byteLength, 8);
            assert.equal(b.byteLength, 8);
            const bad = {};
            markAsUncloneable(bad);
            cloneFailure(() => structuredClone({a, bad}, {transfer: [a]}));
            assert.equal(a.byteLength, 8);
            cloneFailure(() => structuredClone(a, {transfer: [a,a]}));
            assert.equal(a.byteLength, 8);
            const pool = Buffer.from('pool').buffer;
            assert.equal(isMarkedAsUntransferable(pool), true);
            cloneFailure(() => structuredClone(pool, {transfer: [pool]}));
            assert.ok(pool.byteLength > 0);
            break;
        }
        case 5: {
            const original = globalThis.structuredClone;
            const weakAdd = WeakSet.prototype.add, weakHas = WeakSet.prototype.has;
            const channel = new MessageChannel();
            try {
                WeakSet.prototype.add = WeakSet.prototype.has = () => {throw Error('patched weak operation');};
                const blocked = Object.freeze({x:1});
                markAsUncloneable(blocked);
                markAsUntransferable(blocked);
                assert.equal(isMarkedAsUntransferable(blocked), true);
                globalThis.structuredClone = value => value;
                cloneFailure(() => channel.port1.postMessage({blocked}));
                const forged = {[Symbol.for('__wasm_rquickjs.untransferable')]: true};
                assert.equal(isMarkedAsUntransferable(forged), false);
            } finally {
                globalThis.structuredClone = original;
                WeakSet.prototype.add = weakAdd;
                WeakSet.prototype.has = weakHas;
                channel.port1.close();channel.port2.close();
            }
            break;
        }
        case 6: {
            for (const Constructor of [globalThis.Blob, BufferBlob]) {
                class DerivedBlob extends Constructor {}
                const blob = new DerivedBlob(['hello', new Uint8Array([32,119,111,114,108,100])], {type:'TEXT/PLAIN'});
                const graph = {blob, again: blob};
                const clone = structuredClone(graph);
                assert.equal(clone.blob, clone.again);
                assert.notEqual(clone.blob, blob);
                assert.equal(await clone.blob.text(), 'hello world');
                assert.equal(clone.blob.type, 'text/plain');
                const slice = structuredClone(blob.slice(1,5,'text/x'));
                assert.equal(await slice.text(), 'ello');
                markAsUncloneable(blob);
                cloneFailure(() => structuredClone({blob}));
                const outer = new Constructor([blob]);
                assert.equal(await structuredClone(outer).text(), 'hello world');
            }
            const file = structuredClone(new BufferFile(['hi'],'secret.txt',{type:'TEXT/PLAIN'}));
            assert.equal(await file.text(), 'hi');
            assert.equal(file.name, undefined);
            break;
        }
        case 7: {
            const blob = new Blob(['safe']);
            const bufferBlob = new BufferBlob(['safe']);
            const originals = [globalThis.Blob, globalThis.TextDecoder, globalThis.Uint8Array];
            try {
                for (const value of [blob, bufferBlob]) {
                    for (const name of ['size','type','stream','arrayBuffer','constructor'])
                        Object.defineProperty(value,name,{get(){throw Error('Blob hook invoked');}});
                }
                globalThis.Blob = globalThis.TextDecoder = globalThis.Uint8Array = function() {throw Error('global invoked');};
                const a = structuredClone(blob), b = structuredClone(bufferBlob);
                globalThis.Blob = originals[0];globalThis.TextDecoder = originals[1];globalThis.Uint8Array = originals[2];
                assert.equal(await a.text(), 'safe');assert.equal(await b.text(), 'safe');
            } finally { [globalThis.Blob,globalThis.TextDecoder,globalThis.Uint8Array] = originals; }
            for (const Constructor of [Blob,BufferBlob]) {
                const originalDecoder=globalThis.TextDecoder;
                const source=new Constructor(['safe']);
                let leaked;
                try {
                    globalThis.TextDecoder=class {decode(bytes){if(bytes)leaked=bytes;return '';}};
                    await source.text();
                } finally {globalThis.TextDecoder=originalDecoder;}
                assert.ok(leaked,'backing escape positive control');
                const copy=structuredClone(source);
                leaked[0]=88;
                assert.equal(await source.text(),'Xafe');
                assert.equal(await copy.text(),'safe','clone must not share escapable backing');
            }
            const foreign = {size: 1, [Symbol.toStringTag]:'Blob', stream(){throw Error('foreign IO');}};
            // fetch-blob's public constructor accepts Blob-like parts. The clone
            // owner must reject their backing without calling stream().
            const withForeign = new Blob([foreign]);
            cloneFailure(() => structuredClone({withForeign}));
            break;
        }
        case 8: {
            const cryptoKey = await webcrypto.subtle.generateKey({name:'AES-GCM',length:128},true,['encrypt','decrypt']);
            const algorithm = cryptoKey.algorithm, usages = cryptoKey.usages;
            algorithm.key = cryptoKey;
            let metadataReads = 0;
            Object.defineProperty(algorithm, 'metadata', {enumerable:true, get(){metadataReads++;return {value:1};}});
            const originalKeys = Object.keys, originalHas = Set.prototype.has;
            let graph;
            try {
                Object.keys = Set.prototype.has = () => {throw Error('mutable public intrinsic');};
                graph = structuredClone({key:cryptoKey,algorithm,usages});
            } finally {Object.keys=originalKeys;Set.prototype.has=originalHas;}
            assert.equal(graph.key.type, 'secret');
            assert.equal(graph.key.algorithm, graph.algorithm);
            assert.equal(graph.key.usages, graph.usages);
            assert.equal(graph.algorithm.key, graph.key);
            assert.notEqual(graph.algorithm, algorithm);
            assert.notEqual(graph.usages, usages);
            assert.equal(metadataReads, 1);
            const iv = new Uint8Array(12);
            const encrypted = await webcrypto.subtle.encrypt({name:'AES-GCM',iv},graph.key,new Uint8Array([1,2,3]));
            assert.deepEqual(new Uint8Array(await webcrypto.subtle.decrypt({name:'AES-GCM',iv},cryptoKey,encrypted)),new Uint8Array([1,2,3]));
            const blockedMetadata = {};markAsUncloneable(blockedMetadata);
            algorithm.blocked = blockedMetadata;
            const undetached = new ArrayBuffer(4);
            cloneFailure(() => structuredClone({cryptoKey,undetached},{transfer:[undetached]}));
            assert.equal(undetached.byteLength,4);
            delete algorithm.blocked;
            const laterKey = await webcrypto.subtle.generateKey({name:'AES-GCM',length:128},true,['encrypt']);
            const order = [];
            Object.defineProperty(laterKey.algorithm,'metadata',{enumerable:true,get(){order.push('metadata');return 1;}});
            const laterClone = structuredClone({key:laterKey,get later(){order.push('later');laterKey.algorithm.extra='after';return 1;}});
            assert.deepEqual(order,['later','metadata']);
            assert.equal(laterClone.key.algorithm.extra,'after');
            markAsUncloneable(cryptoKey);
            cloneFailure(() => structuredClone({cryptoKey}));
            const block = new BlockList();block.addAddress('127.0.0.1');
            const clone = structuredClone(block);clone.addAddress('127.0.0.2');
            assert.equal(block.check('127.0.0.2'), true);
            markAsUncloneable(block);
            cloneFailure(() => structuredClone({block}));
            const forged = {[Symbol.for('__wasm_rquickjs.structuredClone')](){throw Error('forged clone');}};
            // Functions are unsupported ordinary properties, never host hooks.
            assert.deepEqual(structuredClone(forged), {});
            const dom = new DOMException('host error');
            assert.deepEqual(structuredClone(dom), {});
            markAsUncloneable(dom);
            cloneFailure(() => structuredClone(dom));
            break;
        }
        case 9: {
            const ac = transferableAbortController();
            const clone = structuredClone({signal:ac.signal,get trigger(){ac.abort({x:1});return true;}}, {transfer:[ac.signal]});
            assert.equal(clone.signal.aborted, true);
            assert.deepEqual(clone.signal.reason,{x:1});
            assert.notEqual(clone.signal.reason,ac.signal.reason);
            const signal = transferableAbortSignal(AbortSignal.abort('x'));
            markAsUncloneable(signal);
            assert.equal(structuredClone(signal,{transfer:[signal]}).reason,'x');
            const blocked = {};markAsUncloneable(blocked);
            const bad = transferableAbortSignal(AbortSignal.abort(blocked));
            cloneFailure(() => structuredClone({bad},{transfer:[bad]}));
            break;
        }
        case 10: {
            const ac=transferableAbortController();
            const clone=structuredClone(ac.signal,{transfer:[ac.signal]});
            const seen=new Promise(resolve=>clone.addEventListener('abort',resolve,{once:true}));
            const reason={x:1};ac.abort(reason);
            assert.equal(clone.aborted,false);
            let guard;
            try {
                await Promise.race([seen, new Promise((_,reject) => {
                    guard=setTimeout(()=>reject(Error('abort forwarding timed out')),1000);
                })]);
            } finally { clearTimeout(guard); }
            assert.equal(clone.aborted,true);
            assert.deepEqual(clone.reason,reason);
            assert.notEqual(clone.reason,reason);
            const bad=transferableAbortController();const blocked={};markAsUncloneable(blocked);
            cloneFailure(()=>structuredClone({signal:bad.signal,blocked},{transfer:[bad.signal]}));
            // Failure must not attach a private forwarding observer.
            bad.abort(()=>{});
            break;
        }
        case 11: {
            const fs=await import('node:fs');
            fs.mkdirSync('/tmp', {recursive:true});
            fs.writeFileSync('/tmp/blob-clone-policy.txt','file');
            const file=await fs.openAsBlob('/tmp/blob-clone-policy.txt');
            assert.throws(()=>structuredClone({nested:[file]}),{code:'ERR_INVALID_STATE'});
            const withFile=new Blob([file]);
            assert.throws(()=>structuredClone(withFile),{code:'ERR_INVALID_STATE'});
            fs.unlinkSync('/tmp/blob-clone-policy.txt');
            assert.throws(()=>new Worker('unused.js'),{code:'ERR_UNSUPPORTED_OPERATION'});
            for(const value of [new SharedArrayBuffer(1),new ReadableStream()])
                cloneFailure(()=>structuredClone(value,{transfer:[value]}));
            break;
        }
        case 12: {
            const channel = new MessageChannel();
            try {
                const a = new ArrayBuffer(3);
                const list = [a];
                list[Symbol.iterator] = () => { throw Error('array iterator must not run'); };
                channel.port1.postMessage({a}, list);
                assert.equal(a.byteLength, 0);
                const b = new ArrayBuffer(3);
                channel.port1.postMessage({b}, (function*(){yield b;})());
                assert.equal(b.byteLength, 0);
                const c = new ArrayBuffer(3);
                channel.port1.postMessage({c}, Object.create({transfer:[c]}));
                assert.equal(c.byteLength, 0);
                for (const value of [0, false, 'x', Symbol('x')])
                    assert.throws(() => channel.port1.postMessage(1,value), {code:'ERR_INVALID_ARG_TYPE', message:'Optional transferList argument must be an iterable'});
                for (const transfer of [null, 0, false, {}])
                    assert.throws(() => channel.port1.postMessage(1,{transfer}), {code:'ERR_INVALID_ARG_TYPE', message:'Optional options.transfer argument must be an iterable'});
                const original = new TypeError('iterator user error');
                assert.throws(() => channel.port1.postMessage(1,{transfer:{[Symbol.iterator](){return {next(){throw original;}};}}}), error => error === original);
                let reads = 0;
                structuredClone(1,{transfer:{get [Symbol.iterator](){reads++;return function*(){};}}});
                assert.equal(reads,1);
                assert.throws(() => structuredClone(1,{transfer:[1]}), {code:'ERR_INVALID_ARG_TYPE', message:'Value is not an object'});
                channel.port1.close();
                const bad = {};markAsUncloneable(bad);
                cloneFailure(() => channel.port1.postMessage(bad));
                const closedBuffer = new ArrayBuffer(3);
                channel.port1.postMessage(closedBuffer,[closedBuffer]);
                assert.equal(closedBuffer.byteLength,0);
            } finally {channel.port1.close();channel.port2.close();}
            break;
        }
        case 13: {
            const tick = () => new Promise(resolve => setTimeout(resolve,0));
            const channel = new MessageChannel();
            const events = [];
            channel.port2.on('close', () => events.push('close'));
            channel.port1.postMessage(1);channel.port1.postMessage(2);channel.port1.close();
            await tick();await tick();
            assert.deepEqual(events,[]);
            channel.port2.on('message', value => events.push(value));
            await tick();await tick();
            assert.deepEqual(events,[1,2,'close']);
            const local = new MessageChannel();const lost=[];
            local.port2.on('message',value=>lost.push(value));
            local.port1.postMessage(1);local.port2.close();
            await tick();await tick();
            assert.deepEqual(lost,[]);local.port1.close();
            const paused = new MessageChannel();const seen=[];
            paused.port2.once('message',value=>seen.push(value));
            paused.port1.postMessage(1);paused.port1.postMessage(2);
            await tick();await tick();assert.deepEqual(seen,[1]);
            paused.port2.addListener('message',value=>seen.push(value));
            await tick();await tick();assert.deepEqual(seen,[1,2]);
            paused.port1.close();paused.port2.close();
            const explicit = new MessageChannel();const discarded=[];
            explicit.port2.start();explicit.port1.postMessage(1);
            await tick();await tick();
            explicit.port2.on('message',value=>discarded.push(value));
            await tick();assert.deepEqual(discarded,[]);
            explicit.port1.close();explicit.port2.close();
            break;
        }
        case 14: {
            const ac=transferableAbortController();
            function discarded() {
                const target=structuredClone(ac.signal,{transfer:[ac.signal]});
                target.self=target;
                return new WeakRef(target);
            }
            function cycle() {const value={};value.self=value;return new WeakRef(value);}
            const target=discarded(), control=cycle();
            await new Promise(resolve=>setTimeout(resolve,0));
            gc();
            await new Promise(resolve=>setTimeout(resolve,0));
            gc();
            assert.equal(control.deref(),undefined,'GC positive control');
            assert.equal(target.deref(),undefined,'a live source must not retain discarded transferred signals');
            ac.abort('after collection');
            assert.equal(ac.signal.aborted,true);
            function transferredTimeout() {
                const source=transferableAbortSignal(AbortSignal.timeout(0));
                return structuredClone(source,{transfer:[source]});
            }
            const timeout=transferredTimeout();
            gc();
            let guard;
            try {
                await Promise.race([
                    new Promise(resolve=>timeout.addEventListener('abort',resolve,{once:true})),
                    new Promise((_,reject)=>{guard=setTimeout(()=>reject(Error('transferred timeout was collected')),1000);}),
                ]);
            } finally {clearTimeout(guard);}
            assert.equal(timeout.aborted,true);
            break;
        }
        case 15: {
            const immutable=new ArrayBuffer(3).transferToImmutable();
            cloneFailure(()=>structuredClone(immutable));
            const buffer=new ArrayBuffer(4);
            cloneFailure(()=>structuredClone({buffer,immutable},{transfer:[buffer,immutable]}));
            assert.equal(buffer.byteLength,4);
            assert.equal(immutable.byteLength,3);
            const resizable=new ArrayBuffer(4,{maxByteLength:8});
            const copy=structuredClone(resizable);
            assert.equal(copy.resizable,true);assert.equal(copy.maxByteLength,8);
            cloneFailure(()=>structuredClone(new Uint8Array(resizable)));
            cloneFailure(()=>structuredClone(new DataView(resizable)));
            break;
        }
        case 16: {
            const ordinary=new AbortController(),resource={};
            const observed=aborted(ordinary.signal,resource);
            assert.deepEqual(structuredClone(ordinary.signal),{});
            cloneFailure(()=>structuredClone(ordinary.signal,{transfer:[ordinary.signal]}));
            ordinary.abort();await observed;
            const invalid=new AbortController();
            await assert.rejects(aborted(invalid.signal,null),{code:'ERR_INVALID_ARG_TYPE'});
            assert.deepEqual(structuredClone(invalid.signal),{});
            const buffer=new Uint8Array([4,5,6]).buffer,view=new Uint8Array(buffer,1,2);
            const blob=new Blob([new Uint8Array([8,9])]),source=transferableAbortController();
            const define=Object.defineProperty,create=Object.create;
            const lengthDescriptor=Object.getOwnPropertyDescriptor(Uint8Array.prototype,'length');
            const getDescriptor=Object.getOwnPropertyDescriptor(Object.prototype,'get');
            let hooks=0,lengthReads=0,copy,error;
            define(Uint8Array.prototype,'length',{__proto__:null,configurable:true,get(){lengthReads++;return 0;}});
            define(Object.prototype,'get',{__proto__:null,configurable:true,value(){throw Error('inherited descriptor field');}});
            try {
                Object.defineProperty=Object.create=()=>{hooks++;throw Error('mutable construction hook');};
                copy=structuredClone({buffer,view,blob,signal:source.signal},{transfer:[buffer,source.signal]});
                try{structuredClone(Symbol('blocked'));}catch(caught){error=caught;}
            } finally {
                Object.defineProperty=define;Object.create=create;
                if(lengthDescriptor)define(Uint8Array.prototype,'length',lengthDescriptor);else delete Uint8Array.prototype.length;
                if(getDescriptor)define(Object.prototype,'get',getDescriptor);else delete Object.prototype.get;
            }
            assert.equal(hooks,0);assert.equal(lengthReads,0);
            assert.equal(error.name,'DataCloneError');assert.equal(error.code,25);
            assert.equal(buffer.byteLength,0);assert.deepEqual(new Uint8Array(copy.buffer),new Uint8Array([4,5,6]));
            assert.equal(copy.view.buffer,copy.buffer);assert.deepEqual(copy.view,new Uint8Array([5,6]));
            assert.deepEqual(new Uint8Array(await copy.blob.arrayBuffer()),new Uint8Array([8,9]));
            break;
        }
        case 17: {
            const process=(await import('node:process')).default;
            for(const mode of ['marked','getter']) {
                const source=transferableAbortController();
                const first=structuredClone(source.signal,{transfer:[source.signal]});
                const second=structuredClone(source.signal,{transfer:[source.signal]});
                let local=0;source.signal.onabort=()=>local++;
                source.signal.addEventListener('abort',()=>local++);
                const reason=mode==='marked'?{}:{get value(){throw new Error('reason getter failure');}};
                if(mode==='marked')markAsUncloneable(reason);
                const errors=[];let resolveErrors,guard;
                const seen=new Promise(resolve=>resolveErrors=resolve);
                const onError=error=>{errors.push(error);if(errors.length===2)resolveErrors();};
                process.on('uncaughtException',onError);
                try {
                    source.abort(reason);
                    assert.equal(local,2);assert.equal(source.signal.aborted,true);
                    assert.equal(errors.length,0,'forwarding errors are asynchronous');
                    await Promise.race([seen,new Promise((_,reject)=>{guard=setTimeout(()=>reject(Error('missing forwarding errors')),1000);})]);
                    assert.equal(errors.length,2);
                    for(const error of errors)assert.equal(error.name,mode==='marked'?'DataCloneError':'Error');
                    assert.equal(first.aborted,false);assert.equal(second.aborted,false);
                } finally {clearTimeout(guard);process.removeListener('uncaughtException',onError);}
            }
            break;
        }
        case 18: {
            const source=transferableAbortController();
            let middle=structuredClone(source.signal,{transfer:[source.signal]});
            const leaf=structuredClone(middle,{transfer:[middle]});
            const weak=new WeakRef(middle);middle=null;
            for(let i=0;i<5;i++){gc();await new Promise(resolve=>setTimeout(resolve,0));}
            assert.ok(weak.deref(),'a retained leaf keeps its forwarding chain alive');
            let guard;
            const seen=new Promise(resolve=>leaf.addEventListener('abort',resolve,{once:true}));
            source.abort({value:1});
            try {await Promise.race([seen,new Promise((_,reject)=>{guard=setTimeout(()=>reject(Error('transfer chain lost')),1000);})]);}
            finally{clearTimeout(guard);}
            assert.deepEqual(leaf.reason,{value:1});
            let timeoutSource=transferableAbortSignal(AbortSignal.timeout(60000));
            let discarded=structuredClone(timeoutSource,{transfer:[timeoutSource]});
            const weakTimeout=new WeakRef(timeoutSource),weakDiscarded=new WeakRef(discarded);
            timeoutSource=null;discarded=null;
            for(let i=0;i<12;i++){gc();await new Promise(resolve=>setTimeout(resolve,0));}
            assert.equal(weakDiscarded.deref(),undefined);
            assert.equal(weakTimeout.deref(),undefined,'discarded observers must not pin timeout sources');
            break;
        }
        case 19: {
            const channel=new MessageChannel(),events=[];
            assert.equal(channel.port1.constructor,MessagePort);
            for(const construct of [()=>MessagePort(),()=>new MessagePort(),()=>Reflect.construct(MessagePort,[],MessageChannel)])
                assert.throws(construct,{code:'ERR_CONSTRUCT_CALL_INVALID'});
            assert.throws(()=>MessageChannel(),{code:'ERR_CONSTRUCT_CALL_REQUIRED'});
            for(const value of [null,0,{},Object.create(MessagePort.prototype)])
                assert.throws(()=>receiveMessageOnPort(value),{code:'ERR_INVALID_ARG_TYPE'});
            cloneFailure(()=>structuredClone({port:channel.port1}));
            assert.deepEqual(structuredClone(Object.create(MessagePort.prototype)),{});
            let resolveMixed;const mixed=new Promise(resolve=>resolveMixed=resolve);
            channel.port2.on('message',value=>{events.push(value);resolveMixed();});
            channel.port1.postMessage(1);channel.port1.postMessage(2);
            assert.deepEqual(receiveMessageOnPort(channel.port2),{message:1});
            await within(mixed);assert.deepEqual(events,[2]);
            const locallyClosed=new Promise(resolve=>channel.port2.once('close',resolve));
            channel.port1.postMessage(3);channel.port2.close();
            assert.deepEqual(receiveMessageOnPort(channel.port2),{message:3});
            await within(locallyClosed);
            assert.equal(receiveMessageOnPort(channel.port2),undefined);
            channel.port1.close();
            const active=new MessageChannel(),accepted=[];
            let resolveAccepted;const acceptedDone=new Promise(resolve=>resolveAccepted=resolve);
            active.port2.on('message',value=>{
                accepted.push(value);if(value===3)resolveAccepted();
                if(value===1){active.port2.close();assert.deepEqual(receiveMessageOnPort(active.port2),{message:2});}
            });
            active.port1.postMessage(1);active.port1.postMessage(2);active.port1.postMessage(3);
            await within(acceptedDone);assert.deepEqual(accepted,[1,3]);active.port1.close();
            const peer=new MessageChannel(),order=[];
            const peerClosed=new Promise(resolve=>peer.port2.on('close',()=>{order.push('close');resolve();}));
            peer.port1.postMessage('last');peer.port1.close();
            assert.deepEqual(receiveMessageOnPort(peer.port2),{message:'last'});order.push('polled');
            await within(peerClosed);assert.deepEqual(order,['polled','close']);peer.port2.close();
            for(const mutation of ['shrink','extend']) {
                const c=new MessageChannel(),a=new ArrayBuffer(1),b=new ArrayBuffer(1),extra=new ArrayBuffer(1),list=[a,b];
                Object.defineProperty(list,0,{configurable:true,get(){if(mutation==='shrink')list.length=1;else list.push(extra);return a;}});
                if(mutation==='shrink') {cloneFailure(()=>c.port1.postMessage('x',list));assert.equal(a.byteLength,1);assert.equal(b.byteLength,1);}
                else {c.port1.postMessage('x',list);assert.equal(a.byteLength,0);assert.equal(b.byteLength,0);}
                assert.equal(extra.byteLength,1);c.port1.close();c.port2.close();
            }
            for(const done of [1,'yes',false]) {
                const buffer=new ArrayBuffer(1);let calls=0,gets=0;
                const iterator={get next(){gets++;return()=>++calls===1?{done,value:buffer}:{done:true};}};
                structuredClone('x',{transfer:{[Symbol.iterator](){return iterator;}}});
                assert.equal(buffer.byteLength,0);assert.equal(gets,2);assert.equal(calls,2);
            }
            break;
        }
        case 20: {
            const data=Object.freeze([0,-0,undefined,10n]);
            const graph=structuredClone({data,again:data,map:new Map([[data,'key']])});
            assert.equal(graph.data,graph.again);assert.equal(graph.map.get(graph.data),'key');
            assert.equal(Object.is(graph.data[1],-0),true);assert.equal(graph.data[2],undefined);assert.equal(graph.data[3],10n);
            assert.deepEqual(Object.getOwnPropertyDescriptor(graph.data,'0'),{value:0,writable:true,enumerable:true,configurable:true});
            const sparse=new Array(512);sparse[0]=1;sparse[511]=2;sparse.push=42;sparse['\ud800']=3;
            Object.defineProperty(sparse,'__proto__',{value:'own data',enumerable:true});
            const copy=structuredClone(Object.freeze(sparse));
            assert.equal(copy.length,512);assert.equal(1 in copy,false);assert.equal(copy[511],2);
            assert.equal(copy.push,42);assert.equal(copy['\ud800'],3);assert.equal(copy.__proto__,'own data');
            assert.equal(Object.getPrototypeOf(copy),Array.prototype);
            let reads=0;const bad=[Symbol('first')];
            Object.defineProperty(bad,1,{enumerable:true,get(){reads++;return 1;}});
            const undetached=new ArrayBuffer(1);
            cloneFailure(()=>structuredClone(bad,{transfer:[undetached]}));assert.equal(reads,0);assert.equal(undetached.byteLength,1);
            const pureBad=[1,Symbol('second')];
            cloneFailure(()=>structuredClone(pureBad,{transfer:[undetached]}));assert.equal(undetached.byteLength,1);
            const late=[1,2,3,4];
            Object.defineProperty(late,2,{enumerable:true,get(){late[0]=9;delete late[3];return 5;}});
            const lateCopy=structuredClone(late);
            assert.equal(lateCopy[0],1);assert.equal(lateCopy[1],2);assert.equal(lateCopy[2],5);assert.equal(3 in lateCopy,false);
            const cyclic=[1];cyclic.push({owner:cyclic});
            const cyclicCopy=structuredClone(cyclic);assert.equal(cyclicCopy[1].owner,cyclicCopy);
            const key=await webcrypto.subtle.generateKey({name:'AES-GCM',length:128},true,['encrypt']);
            key.algorithm.extra=data;
            const keyGraph=structuredClone({data,key});assert.equal(keyGraph.key.algorithm.extra,keyGraph.data);
            for(const length of [2**31,2**32-1]) {
                const edge=new Array(length);edge[0]=1;edge[length-1]=-0;
                const edgeCopy=structuredClone(edge);
                assert.equal(edgeCopy.length,length);assert.equal(edgeCopy[0],1);
                assert.equal(1 in edgeCopy,false);assert.equal(Object.is(edgeCopy[length-1],-0),true);
                assert.deepEqual(Object.keys(edgeCopy),['0',String(length-1)]);
            }
            const descriptor=Object.getOwnPropertyDescriptor(Array.prototype,'1');let setterCalls=0,protectedCopy;
            const primitive=[1,2];
            const poison={first:0,second:1,get arm(){Object.defineProperty(Array.prototype,'1',{configurable:true,set(){setterCalls++;throw Error('inherited numeric setter');}});return 2;},primitive};
            try{protectedCopy=structuredClone(poison);}finally{if(descriptor)Object.defineProperty(Array.prototype,'1',descriptor);else delete Array.prototype[1];}
            assert.equal(setterCalls,0);assert.deepEqual(protectedCopy.primitive,[1,2]);
            const planDescriptor=Object.getOwnPropertyDescriptor(Array.prototype,'2');let planReads=0,planCopy;
            const planSource={get array(){Object.defineProperty(Array.prototype,'2',{configurable:true,get(){planReads++;return undefined;}});return [1,2];}};
            try{planCopy=structuredClone(planSource);}finally{if(planDescriptor)Object.defineProperty(Array.prototype,'2',planDescriptor);else delete Array.prototype[2];}
            assert.equal(planReads,0);assert.deepEqual(planCopy.array,[1,2]);
            const order=[],tail=[0,-0,undefined,10n];
            tail.first={get child(){order.push('nested');tail[0]=99;return tail;}};
            Object.defineProperty(tail,'second',{enumerable:true,get(){order.push('second');return 'primitive';}});
            tail.third={owner:tail};tail.fourth=true;
            const tailGraph=structuredClone({tail,map:new Map([[tail,'tail']])});
            assert.deepEqual(order,['nested','second']);assert.equal(tailGraph.tail[0],0);
            assert.equal(Object.is(tailGraph.tail[1],-0),true);assert.equal(tailGraph.tail[2],undefined);assert.equal(tailGraph.tail[3],10n);
            assert.deepEqual(Object.keys(tailGraph.tail),['0','1','2','3','first','second','third','fourth']);
            assert.equal(tailGraph.tail.first.child,tailGraph.tail);assert.equal(tailGraph.tail.third.owner,tailGraph.tail);
            assert.equal(tailGraph.map.get(tailGraph.tail),'tail');
            const boundary=[{get fail(){throw Error('nested failure');}}];
            Object.defineProperty(boundary,1,{enumerable:true,get(){throw Error('wrong traversal order');}});
            assert.throws(()=>structuredClone(boundary,{transfer:[undetached]}),/nested failure/);assert.equal(undetached.byteLength,1);
            break;
        }
        case 250: {
            const graph=Array.from({length:2000},(_,i)=>({value:i,label:`item-${i}`,nested:{x:i}}));
            const fs=await import('node:fs');
            let baseline;
            if(fs.existsSync('/baseline-clone.js')) {
                const source=fs.readFileSync('/baseline-clone.js','utf8')
                    .replace(/export const /g,'const ').replace(/export default structuredClone;/,'');
                baseline=new Function(source+'\nreturn structuredClone;')();
            }
            const samples=[];
            for(let trial=0;trial<3;trial++) {
                const start=performance.now();
                for(let i=0;i<5;i++)assert.equal(structuredClone(graph)[1999].nested.x,1999);
                const currentMs=performance.now()-start;
                let baselineMs;
                if(baseline) {
                    const start=performance.now();
                    for(let i=0;i<5;i++)assert.equal(baseline(graph)[1999].nested.x,1999);
                    baselineMs=performance.now()-start;
                }
                samples.push({currentMs,baselineMs});
            }
            const buffer=new ArrayBuffer(256*1024);
            new Uint8Array(buffer).fill(7);
            const bufferSamples=[];
            for(let trial=0;trial<3;trial++) {
                const start=performance.now();
                for(let i=0;i<2;i++)assert.equal(new Uint8Array(structuredClone(buffer))[buffer.byteLength-1],7);
                const currentMs=performance.now()-start;
                let baselineMs;
                if(baseline) {
                    const start=performance.now();
                    for(let i=0;i<2;i++)assert.equal(new Uint8Array(baseline(buffer))[buffer.byteLength-1],7);
                    baselineMs=performance.now()-start;
                }
                bufferSamples.push({currentMs,baselineMs});
            }
            const profileInput=Array.from({length:100000},(_,i)=>i%8);
            const profileKeys=Object.keys(profileInput),property={__proto__:null,value:0,writable:true,enumerable:true,configurable:true};
            const defined=new Array(profileInput.length),profileStart=performance.now();
            for(let i=0;i<profileKeys.length;i++){property.value=profileInput[i];Object.defineProperty(defined,profileKeys[i],property);}
            const defineMs=performance.now()-profileStart;
            const assigned=new Array(profileInput.length),assignmentStart=performance.now();
            Object.setPrototypeOf(assigned,null);
            for(let i=0;i<profileKeys.length;i++)assigned[profileKeys[i]]=profileInput[i];
            Object.setPrototypeOf(assigned,Array.prototype);
            const assignmentMs=performance.now()-assignmentStart;
            assert.equal(defined.length,assigned.length);
            assert.equal(Object.getPrototypeOf(assigned),Array.prototype);
            assert.ok(profileInput.every((value,index)=>defined[index]===value&&assigned[index]===value));
            const denseProfile={length:profileInput.length,defineMs,assignmentMs};
            const denseSamples=[];
            for(const [kind,length] of [['numbers',100000],['numbers',1000000],['objects',100000]]) {
                const input=Array.from({length},(_,i)=>kind==='numbers'?i%8:{value:i});
                const start=performance.now();
                const copy=structuredClone(input);
                const currentMs=performance.now()-start;
                assert.equal(copy.length,length);
                let baselineMs;
                if(baseline) {
                    const start=performance.now();
                    assert.equal(baseline(input).length,length);
                    baselineMs=performance.now()-start;
                }
                denseSamples.push({kind,length,currentMs,baselineMs});
            }
            const fallbackSamples=[];
            const mixedLength=100000;
            for(const mode of ['early-object','late-object','late-getter','small-nested','sparse']) {
                let input;
                if(mode==='small-nested')input=Array.from({length:20000},(_,i)=>[i%8,1,2]);
                else if(mode==='sparse'){input=new Array(mixedLength);input[0]=1;input[mixedLength-1]=2;}
                else {input=Array.from({length:mixedLength},(_,i)=>i%8);if(mode==='early-object')input[0]={value:1};else if(mode==='late-object')input[mixedLength-1]={value:1};else Object.defineProperty(input,mixedLength-1,{enumerable:true,get(){return 1;}});}
                const start=performance.now();assert.equal(structuredClone(input).length,input.length);
                const currentMs=performance.now()-start;let baselineMs;
                if(baseline){const start=performance.now();assert.equal(baseline(input).length,input.length);baselineMs=performance.now()-start;}
                fallbackSamples.push({mode,length:input.length,currentMs,baselineMs});
            }
            const largeBufferSamples=[];
            for(const length of [1024*1024,16*1024*1024,64*1024*1024]) {
                const source=new ArrayBuffer(length);
                new Uint8Array(source)[length-1]=17;
                const start=performance.now(),copy=structuredClone(source);
                const cloneMs=performance.now()-start;
                assert.equal(new Uint8Array(copy)[length-1],17);
                const transferStart=performance.now();
                const moved=structuredClone(source,{transfer:[source]});
                const transferMs=performance.now()-transferStart;
                assert.equal(source.byteLength,0);assert.equal(new Uint8Array(moved)[length-1],17);
                largeBufferSamples.push({length,cloneMs,transferMs});
            }
            const blob=new Blob([new Uint8Array(1024*1024)]);
            const blobStart=performance.now();
            for(let i=0;i<6;i++)assert.equal(structuredClone(blob).size,1024*1024);
            return JSON.stringify({graphCopies:5,objectsPerGraph:4001,samples,bufferCopies:2,bufferBytes:buffer.byteLength,bufferSamples,denseProfile,denseSamples,fallbackSamples,largeBufferSamples,blobCopies:6,blobBytes:1024*1024,blobMs:performance.now()-blobStart});
        }
        default: throw Error(`Unknown clone policy case ${index}`);
    }
    return 'ok';
}
