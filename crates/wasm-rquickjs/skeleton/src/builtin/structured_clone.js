// @ungap/structured-clone v1.3.0
// https://github.com/ungap/structured-clone
// MIT License
// Adapted for authenticated host values and atomic same-runtime transfers.

import { class_id, detach_buffer, copy_array_data } from '__wasm_rquickjs_builtin/structured_clone_native';
import { DOMException } from '__wasm_rquickjs_builtin/abort_controller';
import {
  getCloneAdapter, isMarkedAsUncloneable, isMarkedAsUntransferable,
  isTransferableSignal,
} from '__wasm_rquickjs_builtin/internal/clone_policy';

const call = Function.prototype.call;
const apply = Reflect.apply;
const uncurry = fn => call.bind(fn);
const NativeMap = Map;
const nativeMapGet = Map.prototype.get;
const nativeMapHas = Map.prototype.has;
const nativeMapSet = Map.prototype.set;
const mapGet = uncurry(Map.prototype.get);
const mapSet = uncurry(Map.prototype.set);
const mapHas = uncurry(Map.prototype.has);
const mapForEach = uncurry(Map.prototype.forEach);
const setForEach = uncurry(Set.prototype.forEach);
const setAdd = uncurry(Set.prototype.add);
const NativeSet = Set;
const NativeArray = Array;
const arrayIsArray = Array.isArray;
const NativeUint8Array = Uint8Array;
const NativeArrayBuffer = ArrayBuffer;
const NativeDataView = DataView;
const NativeDate = Date;
const NativeRegExp = RegExp;
const NativeError = Error;
const NativeTypeError = TypeError;
const NativeObject = Object;
const NativeBigInt = BigInt;
const keys = Object.keys;
const hasOwn = Object.hasOwn;
const propertyIsEnumerable = uncurry(Object.prototype.propertyIsEnumerable);
const symbolIterator = Symbol.iterator;
const descriptor = Object.getOwnPropertyDescriptor;
const define = Object.defineProperty;
const defineProperties = Object.defineProperties;
const getPrototypeOf = Object.getPrototypeOf;
const push = uncurry(Array.prototype.push);
const fnToString = uncurry(Function.prototype.toString);
const symbolToString = uncurry(Symbol.prototype.toString);
const dateTime = uncurry(Date.prototype.getTime);
const regexpSource = uncurry(descriptor(RegExp.prototype, 'source').get);
const uint8Set = uncurry(Uint8Array.prototype.set);
const typedPrototype = getPrototypeOf(Uint8Array.prototype);
const typedBuffer = uncurry(descriptor(typedPrototype, 'buffer').get);
const typedOffset = uncurry(descriptor(typedPrototype, 'byteOffset').get);
const typedLength = uncurry(descriptor(typedPrototype, 'length').get);
const dataBuffer = uncurry(descriptor(DataView.prototype, 'buffer').get);
const dataOffset = uncurry(descriptor(DataView.prototype, 'byteOffset').get);
const dataLength = uncurry(descriptor(DataView.prototype, 'byteLength').get);
const immutableDescriptor = descriptor(ArrayBuffer.prototype, 'immutable');
const bufferImmutable = immutableDescriptor && uncurry(immutableDescriptor.get);
const resizableDescriptor = descriptor(ArrayBuffer.prototype, 'resizable');
const maxLengthDescriptor = descriptor(ArrayBuffer.prototype, 'maxByteLength');
const bufferResizable = resizableDescriptor && uncurry(resizableDescriptor.get);
const bufferMaxLength = maxLengthDescriptor && uncurry(maxLengthDescriptor.get);
const promiseThen = uncurry(Promise.prototype.then);
const resolved = Promise.resolve();
const jsonStringify = JSON.stringify;
const jsonParse = JSON.parse;
const numberIsNaN = Number.isNaN;
const objectIs = Object.is;
const negativeZeroKey = Symbol('negative zero record');
const memoMethods = {__proto__: null,
  get: {__proto__: null, value: nativeMapGet},
  has: {__proto__: null, value: nativeMapHas},
  set: {__proto__: null, value: nativeMapSet},
};
const valueMethods = {__proto__: null, push: {__proto__: null, value: Array.prototype.push}};
// Own captured methods keep private hot-path calls independent of public
// prototypes without a Function.call trampoline or mutable bind metadata.
const newMemo = () => defineProperties(new NativeMap(), memoMethods);
const newValues = () => defineProperties([], valueMethods);

const VOID = -1, PRIMITIVE = 0, ARRAY = 1, OBJECT = 2, DATE = 3;
const REGEXP = 4, MAP = 5, SET = 6, ERROR = 7, BIGINT = 8, CUSTOM = 9;
const BUFFER = 10, VIEW = 11, BOX = 12;

// Engine class IDs are opaque facts, never inferred from a mutable prototype,
// constructor, public instanceof hook, or Symbol.toStringTag.
const classes = new NativeMap();
function addClass(sample, kind, detail) {
  const id = class_id(sample);
  mapSet(classes, id, {kind, detail});
  return id;
}
addClass({}, OBJECT);
addClass([], ARRAY);
addClass(new NativeDate(0), DATE);
addClass(new NativeRegExp(''), REGEXP);
addClass(new NativeMap(), MAP);
addClass(new NativeSet(), SET);
addClass(new NativeError(), ERROR);
const arrayBufferClass = addClass(new NativeArrayBuffer(0), BUFFER);
addClass(new SharedArrayBuffer(0), 13);
addClass(new NativeDataView(new NativeArrayBuffer(0)), VIEW, 'DataView');
const viewConstructors = new NativeMap();
for (const Constructor of [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array,
  Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array]) {
  const name = Constructor.name;
  addClass(new Constructor(0), VIEW, name);
  mapSet(viewConstructors, name, Constructor);
}
for (const Constructor of [Boolean, Number, String, BigInt]) {
  const name = Constructor.name;
  const sample = Constructor === BigInt ? NativeObject(0n) : new Constructor();
  addClass(sample, BOX, {name, valueOf: uncurry(Constructor.prototype.valueOf)});
}
const errorConstructors = new NativeMap();
for (const Constructor of [Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError])
  mapSet(errorConstructors, Constructor.name, Constructor);
const regexpFlags = [];
for (const [property, flag] of [['hasIndices','d'], ['global','g'], ['ignoreCase','i'],
  ['multiline','m'], ['dotAll','s'], ['unicode','u'], ['unicodeSets','v'], ['sticky','y']]) {
  const d = descriptor(RegExp.prototype, property);
  if (d) push(regexpFlags, [uncurry(d.get), flag]);
}

const cloneError = message => new DOMException(message, 'DataCloneError');
const ownData = (object, name) => { const d = descriptor(object, name); return d && hasOwn(d, 'value') ? d : undefined; };
function checkBuffer(buffer) {
  // Construction also distinguishes detached zero-length buffers from live ones.
  new NativeUint8Array(buffer);
}
function rejectImmutableBuffer(buffer) {
  if (bufferImmutable && bufferImmutable(buffer))
    throw cloneError('Immutable ArrayBuffer cloning and transfer are not supported');
}
function bufferRecord(buffer) {
  checkBuffer(buffer);
  const bytes = new NativeUint8Array(buffer);
  const data = new NativeUint8Array(typedLength(bytes));
  uint8Set(data, bytes);
  return {bytes: data, max: bufferResizable && bufferResizable(buffer) ? bufferMaxLength(buffer) : null};
}

function createSerializer(rejectCustom, transfers, prepareDataArrays = true) {
  const records = [];
  const memo = newMemo();
  const signals = [];
  const hostPlans = [];
  const transferredBuffers = [];
  const property = {__proto__: null, value: undefined, enumerable: true, configurable: true, writable: true};
  function defineData(object, key, value) {
    property.value = value;
    define(object, key, property);
  }
  function as(record, value) {
    const index = records.length;
    push(records, record);
    // Scalar record reuse bounds allocations for repeated values, but the
    // memo must distinguish the two zeros that Map treats as the same key.
    memo.set(value, index);
    return index;
  }
  function pair(value) {
    if (value === 0 && objectIs(value, -0)) {
      const cached = memo.get(negativeZeroKey);
      if (cached !== undefined) return cached;
      return as([PRIMITIVE, value], negativeZeroKey);
    }
    const cached = memo.get(value);
    if (cached !== undefined) return cached;
    const type = typeof value;
    if (value === null || (type !== 'object' && type !== 'function')) {
      if (type === 'undefined') return as([VOID], value);
      if (type === 'bigint') return as([BIGINT, `${value}`], value);
      if (type === 'symbol') throw cloneError(`${symbolToString(value)} could not be cloned.`);
      return as([PRIMITIVE, value], value);
    }
    if (type === 'function') throw cloneError(`${fnToString(value)} could not be cloned.`);

    const adapter = getCloneAdapter(value);
    const info = adapter?.ordinary ? {kind: OBJECT} : mapGet(classes, class_id(value));
    const intrinsic = info && info.kind !== OBJECT;
    const transfer = transfers && mapGet(transfers, value);
    if (transfer?.kind === 'signal') {
      if (rejectCustom) throw new NativeTypeError('execution results cannot contain AbortSignal values');
      const plan = adapter.prepare(value);
      push(signals, plan);
      return as([CUSTOM, plan.target], value);
    }
    if (!intrinsic && !adapter?.ignoreUncloneable && isMarkedAsUncloneable(value))
      throw cloneError('Cannot clone object of unsupported type.');
    if (adapter && !adapter.ordinary && adapter.kind !== 'AbortSignal') {
      if (rejectCustom) throw new NativeTypeError(`execution results cannot contain ${adapter.kind} values`);
      if (adapter.prepareClone) {
        const plan = adapter.prepareClone(value);
        const index = as([CUSTOM, plan.target, plan], value);
        push(hostPlans, plan);
        return index;
      }
      if (!adapter.clone) return adapter.reject();
      return as([CUSTOM, adapter.clone(value)], value);
    }
    if (isTransferableSignal(value))
      throw cloneError('Object that needs transfer was found in message but not listed in transferList');
    if (!info) throw cloneError('Cannot clone object of unsupported type.');
    const {kind, detail} = info;
    switch (kind) {
      case 13: throw cloneError('SharedArrayBuffer cloning requires shared backing support');
      case ARRAY:
      case OBJECT: {
        const data = {__proto__: null, keys: null, values: null};
        if (kind === ARRAY) data.length = value.length;
        const record = [kind, data];
        const index = as(record, value);
        let propertyKeys;
        if (kind === ARRAY && prepareDataArrays) {
          const snapshot = copy_array_data(value, data.length);
          if (snapshot) {
            if (typeof snapshot.symbol === 'symbol')
              throw cloneError(`${symbolToString(snapshot.symbol)} could not be cloned.`);
            if (snapshot.remaining === undefined) {
              record[0] = CUSTOM;
              record[1] = snapshot.array;
              return index;
            }
            data.target = snapshot.array;
            propertyKeys = snapshot.remaining;
          }
        }
        if (kind === ARRAY && prepareDataArrays) data.target ??= new NativeArray(data.length);
        data.values = newValues();
        propertyKeys ??= keys(value);
        data.keys = propertyKeys;
        let count = 0;
        for (let i = 0; i < propertyKeys.length; i++) {
          const key = propertyKeys[i];
          // Object.keys snapshots keys; deleted/non-enumerable later properties
          // are omitted, as in the platform serialization algorithm.
          if (propertyIsEnumerable(value, key)) {
            const child = value[key];
            if (data.target !== undefined) {
              const type = typeof child;
              if (child === null || (type !== 'object' && type !== 'function' && type !== 'symbol')) {
                defineData(data.target, key, child);
                continue;
              }
              // Reserve insertion order before traversing this graph edge.
              // Pair immediately: nested getters/errors must precede the next
              // source property, even though reconstruction happens later.
              defineData(data.target, key, undefined);
            }
            propertyKeys[count++] = key;
            data.values.push(pair(child));
          }
        }
        propertyKeys.length = count;
        return index;
      }
      case BUFFER: {
        rejectImmutableBuffer(value);
        let data;
        try { checkBuffer(value); data = transfer ? null : bufferRecord(value); } catch { throw cloneError('An ArrayBuffer is detached and could not be cloned.'); }
        const record = [BUFFER, data];
        const index = as(record, value);
        if (transfer) push(transferredBuffers, {value, record});
        return index;
      }
      case VIEW: {
        const dataView = detail === 'DataView';
        let buffer, offset, length;
        try {
          buffer = dataView ? dataBuffer(value) : typedBuffer(value);
          checkBuffer(buffer);
        } catch { throw cloneError('An ArrayBuffer is detached and could not be cloned.'); }
        if (class_id(buffer) === arrayBufferClass && bufferResizable && bufferResizable(buffer))
          throw cloneError('Cloning views backed by resizable ArrayBuffer is not supported');
        offset = dataView ? dataOffset(value) : typedOffset(value);
        length = dataView ? dataLength(value) : typedLength(value);
        const data = {type: detail, offset, length, buffer: 0};
        const index = as([VIEW, data], value);
        data.buffer = pair(buffer);
        return index;
      }
      case DATE: return as([DATE, dateTime(value)], value);
      case REGEXP: {
        let flags = '';
        for (let i = 0; i < regexpFlags.length; i++) if (regexpFlags[i][0](value)) flags += regexpFlags[i][1];
        return as([REGEXP, {source: regexpSource(value), flags}], value);
      }
      case MAP: {
        const entries = [];
        const index = as([MAP, entries], value);
        mapForEach(value, (entry, key) => push(entries, [key, entry]));
        for (let i = 0; i < entries.length; i++) {
          entries[i][0] = pair(entries[i][0]);
          entries[i][1] = pair(entries[i][1]);
        }
        return index;
      }
      case SET: {
        const entries = [];
        const index = as([SET, entries], value);
        setForEach(value, entry => push(entries, entry));
        for (let i = 0; i < entries.length; i++) entries[i] = pair(entries[i]);
        return index;
      }
      case ERROR: {
        const name = value.name;
        const data = {__proto__: null, name: mapHas(errorConstructors, name) ? name : 'Error'};
        const index = as([ERROR, data], value);
        const message = ownData(value, 'message');
        if (message && typeof message.value === 'string') data.message = message.value;
        const stack = value.stack;
        if (typeof stack === 'string') data.stack = stack;
        const cause = ownData(value, 'cause');
        if (cause) data.cause = pair(cause.value);
        return index;
      }
      case BOX: {
        const primitive = detail.valueOf(value);
        return as([BOX, {type: detail.name, value: detail.name === 'BigInt' ? `${primitive}` : primitive}], value);
      }
    }
    throw cloneError('Cannot clone object of unsupported type.');
  }
  function finish() {
    // A reason getter can abort another source. Each source transitions once,
    // so repeat only while a newly aborted source adds work to this graph.
    let changed;
    let hostIndex = 0;
    do {
      changed = false;
      // Host metadata follows the outer graph, sharing its memo and getter
      // order. Metadata can discover further hosts or abort a signal.
      while (hostIndex < hostPlans.length) hostPlans[hostIndex++].serialize(pair);
      for (let i = 0; i < signals.length; i++) {
        const plan = signals[i];
        const state = plan.snapshot();
        if (state.aborted && !plan.serialized) {
          plan.serialized = true;
          plan.reason = pair(state.reason);
          changed = true;
        }
      }
    } while (changed || hostIndex < hostPlans.length);
    for (let i = 0; i < transferredBuffers.length; i++) {
      const entry = transferredBuffers[i];
      entry.record[1] = bufferRecord(entry.value);
    }
  }
  return {pair, records, signals, finish};
}

function createDeserializer(records) {
  const memo = newMemo();
  // Reuse one private descriptor for synchronous own-property creation. Keep it
  // scoped to this clone so its last value cannot retain an earlier result.
  const property = {__proto__: null, value: undefined, enumerable: true, configurable: true, writable: true};
  function defineData(object, key, value) {
    property.value = value;
    define(object, key, property);
  }
  function as(value, index) { memo.set(index, value); return value; }
  function unpair(index) {
    const kind = records[index][0], data = records[index][1];
    // Scalars have no identity or reconstruction work. Repeated scalar records
    // can return their value directly rather than entering the object memo.
    if (kind === VOID) return undefined;
    if (kind === PRIMITIVE) return data;
    const cached = memo.get(index);
    if (cached !== undefined) return cached;
    switch (kind) {
      case BIGINT: return as(NativeBigInt(data), index);
      case CUSTOM: {
        as(data, index);
        const plan = hasOwn(records[index], 2) ? records[index][2] : undefined;
        if (plan) plan.finish(unpair);
        return data;
      }
      case ARRAY:
      case OBJECT: {
        const object = as(kind === ARRAY ? (data.target ?? new NativeArray(data.length)) : {}, index);
        for (let i = 0; i < data.keys.length; i++) defineData(object, data.keys[i], unpair(data.values[i]));
        return object;
      }
      case DATE: return as(new NativeDate(data), index);
      case REGEXP: return as(new NativeRegExp(data.source, data.flags), index);
      case BUFFER: {
        const length = arrayIsArray(data.bytes) ? data.bytes.length : typedLength(data.bytes);
        const buffer = data.max === null ? new NativeArrayBuffer(length)
          : new NativeArrayBuffer(length, {maxByteLength: data.max});
        uint8Set(new NativeUint8Array(buffer), data.bytes);
        return as(buffer, index);
      }
      case VIEW: {
        const buffer = unpair(data.buffer);
        const Constructor = data.type === 'DataView' ? NativeDataView : mapGet(viewConstructors, data.type);
        return as(new Constructor(buffer, data.offset, data.length), index);
      }
      case MAP: {
        const map = as(new NativeMap(), index);
        for (let i = 0; i < data.length; i++) mapSet(map, unpair(data[i][0]), unpair(data[i][1]));
        return map;
      }
      case SET: {
        const set = as(new NativeSet(), index);
        for (let i = 0; i < data.length; i++) setAdd(set, unpair(data[i]));
        return set;
      }
      case ERROR: {
        const Constructor = mapGet(errorConstructors, data.name) || NativeError;
        const error = as(new Constructor(data.message), index);
        define(error, 'stack', {__proto__: null, value: data.stack, writable: true, configurable: true});
        if (hasOwn(data, 'cause')) define(error, 'cause', {__proto__: null, value: unpair(data.cause), writable: true, configurable: true});
        return error;
      }
      case BOX: return as(NativeObject(data.type === 'BigInt' ? NativeBigInt(data.value) : data.value), index);
    }
    throw new NativeTypeError('Invalid structured clone record');
  }
  return unpair;
}

export function serialize(value, {rejectCustom = false} = {}) {
  const state = createSerializer(rejectCustom, undefined, false);
  state.pair(value);
  state.finish();
  return state.records;
}
export const deserialize = records => createDeserializer(records)(0);
const NUMBER_TRANSPORT_KEY = '__wasm_rquickjs_number_transport__';
function transportReplacer(_key, value) {
  if (typeof value !== 'number') return value;
  if (numberIsNaN(value)) return {[NUMBER_TRANSPORT_KEY]: 'NaN'};
  if (value === Infinity) return {[NUMBER_TRANSPORT_KEY]: 'Infinity'};
  if (value === -Infinity) return {[NUMBER_TRANSPORT_KEY]: '-Infinity'};
  if (objectIs(value, -0)) return {[NUMBER_TRANSPORT_KEY]: '-0'};
  return value;
}
function transportReviver(_key, value) {
  if (!value || typeof value !== 'object' || keys(value).length !== 1 || !(NUMBER_TRANSPORT_KEY in value)) return value;
  switch (value[NUMBER_TRANSPORT_KEY]) {
    case 'NaN': return NaN;
    case 'Infinity': return Infinity;
    case '-Infinity': return -Infinity;
    case '-0': return -0;
    default: return value;
  }
}
export const serializeForTransport = (value, options) => {
  const records = serialize(value, options);
  // Numeric byte arrays belong only to JSON transport. Same-runtime records
  // retain native byte copies rather than allocating one JS value per byte.
  for (let i = 0; i < records.length; i++) {
    if (records[i][0] !== BUFFER) continue;
    const data = records[i][1];
    const length = typedLength(data.bytes);
    const bytes = new NativeArray(length);
    for (let j = 0; j < length; j++) bytes[j] = data.bytes[j];
    data.bytes = bytes;
  }
  return jsonStringify(records, transportReplacer);
};
export const deserializeFromTransport = value => deserialize(jsonParse(value, transportReviver));

function invalidArgument(message) {
  const error = new NativeTypeError(message);
  error.code = 'ERR_INVALID_ARG_TYPE';
  return error;
}
const isObject = value => value !== null && (typeof value === 'object' || typeof value === 'function');
function optionsTransfer(options) {
  if (options == null) return [];
  if (!isObject(options))
    throw invalidArgument("Failed to execute 'structuredClone': Options cannot be converted to a dictionary");
  const transfer = options.transfer;
  if (transfer === undefined) return [];
  const memberError = () => invalidArgument("Failed to execute 'structuredClone': transfer in Options can not be converted to sequence.");
  if (!isObject(transfer)) throw memberError();
  const method = transfer[symbolIterator];
  if (method == null) throw memberError();
  const iterator = apply(method, transfer, []);
  if (!isObject(iterator)) throw memberError();
  const list = [];
  while (true) {
    const next = iterator.next;
    const item = next == null ? undefined : apply(next, iterator, []);
    if (!isObject(item)) throw invalidArgument('Value is not an object');
    if (item.done === true) return list;
    const value = item.value;
    if (!isObject(value)) throw invalidArgument('Value is not an object');
    push(list, value);
  }
}

export default function structuredClone(value, options) {
  if (arguments.length === 0) {
    const error = new NativeTypeError('The "value" argument must be specified');
    error.code = 'ERR_MISSING_ARGS';
    throw error;
  }
  return cloneWithTransferList(value, optionsTransfer(options));
}

// Private messaging adapter: list conversion is owned by each public API, while
// graph policy, transfer validation and commit have this single implementation.
export function cloneWithTransferList(value, list) {
  const transfers = new NativeMap();
  const buffers = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (isMarkedAsUntransferable(item)) throw cloneError('Cannot transfer object of unsupported type.');
    const info = mapGet(classes, class_id(item));
    if (mapHas(transfers, item))
      throw cloneError(`Transfer list contains duplicate ${info?.kind === BUFFER ? 'ArrayBuffer' : 'object'}`);
    if (info?.kind === BUFFER) {
      rejectImmutableBuffer(item);
      try { checkBuffer(item); } catch { throw cloneError('An ArrayBuffer is detached and could not be cloned.'); }
      mapSet(transfers, item, {kind: 'buffer'});
      push(buffers, item);
    } else if (isTransferableSignal(item)) {
      mapSet(transfers, item, {kind: 'signal'});
    } else {
      throw cloneError('Found invalid object in transferList');
    }
  }
  const state = createSerializer(false, transfers);
  state.pair(value);
  // Even a transferred signal absent from the payload must have its owner plan
  // prepared. ArrayBuffers absent from the payload are still detached below.
  mapForEach(transfers, (entry, item) => { if (entry.kind === 'signal') state.pair(item); });
  state.finish();
  const unpair = createDeserializer(state.records);
  const result = unpair(0);
  for (let i = 0; i < state.signals.length; i++) {
    const plan = state.signals[i];
    if (plan.serialized) plan.initialize(unpair(plan.reason));
  }
  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    try { checkBuffer(buffer); } catch { throw cloneError('An ArrayBuffer is detached and could not be cloned.'); }
    if (isMarkedAsUntransferable(buffer)) throw cloneError('Cannot transfer object of unsupported type.');
  }
  const rollback = [];
  try {
    for (let i = 0; i < state.signals.length; i++) {
      const plan = state.signals[i];
      if (plan.serialized) continue;
      const forward = plan.forward(structuredClone, task => promiseThen(resolved, task));
      push(rollback, plan.subscribe(forward));
    }
  } catch (error) {
    for (let i = 0; i < rollback.length; i++) rollback[i]();
    throw error;
  }
  for (let i = 0; i < buffers.length; i++) detach_buffer(buffers[i]);
  return result;
}
