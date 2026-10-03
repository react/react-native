/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import DOMException from '../errors/DOMException';
import {
  getPlatformObjectClone,
  isPlatformObject,
} from '../webidl/PlatformObjects';

const BASIC_CONSTRUCTORS = [Number, String, Boolean, Date];

const ObjectPrototype = Object.prototype;

// Technically the memory value should be a parameter in
// `structuredCloneInternal` but as an optimization we can reuse the same map
// and avoid allocating a new one in every call to `structuredClone`.
// This is safe because we don't invoke user code in `structuredClone`, so at
// any given point we only have one memory object alive anyway.
const memory: Map<unknown, unknown> = new Map();

function structuredCloneInternal(value: unknown): unknown {
  // Handles `null` and `undefined`.
  if (value == null) {
    return value;
  }

  // Handles remaining primitive values.
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'bigint':
      return value;
  }

  // Handles unsupported types (symbols and functions).
  if (typeof value !== 'object') {
    // value is symbol or function
    throw new DOMException(
      `Failed to execute 'structuredClone' on 'Window': ${String(value)} could not be cloned.`,
      'DataCloneError',
    );
  }

  // Handles circular references.
  const existingClone = memory.get(value);
  if (existingClone !== undefined) {
    return existingClone;
  }

  // Handles arrays.
  if (Array.isArray(value)) {
    const result: Array<unknown> = [];
    memory.set(value, result);
    const keys = Object.keys(value);

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      const innerValue = value[key];
      switch (typeof innerValue) {
        case 'undefined':
        case 'boolean':
        case 'number':
        case 'string':
        case 'bigint':
          result[key] = innerValue;
          break;
        default:
          result[key] = structuredCloneInternal(innerValue);
      }
    }

    return result;
  }

  // Simple object fast path
  // $FlowFixMe[prop-missing] Why doesn't Flow know about Object.prototype?
  if (Object.getPrototypeOf(value) === ObjectPrototype) {
    const result = {};
    memory.set(value, result);
    const keys = Object.keys(value);

    if (!Object.hasOwn(value, '__proto__')) {
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        const innerValue = value[key];
        switch (typeof innerValue) {
          case 'undefined':
          case 'boolean':
          case 'number':
          case 'string':
          case 'bigint':
            // $FlowExpectedError[prop-missing]
            result[key] = innerValue;
            break;
          default:
            // $FlowExpectedError[prop-missing]
            result[key] = structuredCloneInternal(innerValue);
        }
      }
    } else {
      for (const key of keys) {
        const clonedValue = structuredCloneInternal(value[key]);
        if (key === '__proto__') {
          defineEnumerableProperty(result, key, clonedValue);
        } else {
          // $FlowExpectedError[prop-missing]
          result[key] = clonedValue;
        }
      }
    }

    return result;
  }

  // Handles complex types (typeof === 'object').

  if (value instanceof ArrayBuffer) {
    return cloneArrayBuffer(value);
  }

  if (value instanceof DataView) {
    const result = new DataView(
      cloneArrayBuffer(value.buffer),
      value.byteOffset,
      value.byteLength,
    );
    memory.set(value, result);
    return result;
  }

  if (isTypedArray(value)) {
    const result = cloneTypedArray(value);
    memory.set(value, result);
    return result;
  }

  if (value instanceof BigInt) {
    const result = Object(value.valueOf());
    memory.set(value, result);
    return result;
  }

  for (const Cls of BASIC_CONSTRUCTORS) {
    if (value instanceof Cls) {
      const result = new Cls(value);
      memory.set(value, result);
      return result;
    }
  }

  if (value instanceof Map) {
    const result = new Map<unknown, unknown>();
    memory.set(value, result);

    for (const [innerKey, innerValue] of value) {
      result.set(
        structuredCloneInternal(innerKey),
        structuredCloneInternal(innerValue),
      );
    }

    return result;
  }

  if (value instanceof Set) {
    const result = new Set<unknown>();
    memory.set(value, result);

    for (const innerValue of value) {
      result.add(structuredCloneInternal(innerValue));
    }

    return result;
  }

  if (value instanceof RegExp) {
    const result = new RegExp(value.source, value.flags);
    memory.set(value, result);

    return result;
  }

  // We need to check platform objects before `Error` because `DOMException`
  // is a platform object AND an `Error` subclass.
  const clone = getPlatformObjectClone(value);
  if (clone != null) {
    const result = clone(value);
    memory.set(value, result);
    return result;
  }

  if (value instanceof AggregateError) {
    const result = new AggregateError([], value.message);
    memory.set(value, result);

    const errors = structuredCloneInternal(value.errors);
    if (!Array.isArray(errors)) {
      throw new TypeError('AggregateError errors must be an array');
    }
    result.errors = errors;

    cloneErrorProperties(value, result);
    return result;
  }

  if (value instanceof Error) {
    const result = createErrorClone(value);
    memory.set(value, result);

    cloneErrorProperties(value, result);
    return result;
  }

  if (value instanceof Symbol) {
    throw new DOMException(
      "Failed to execute 'structuredClone' on 'Window': Symbol object could not be cloned.",
      'DataCloneError',
    );
  }

  // Known non-serializable objects.
  if (isNonSerializableObject(value) || isPlatformObject(value)) {
    throw new DOMException(
      `Failed to execute 'structuredClone' on 'Window': ${String(value)} could not be cloned.`,
      'DataCloneError',
    );
  }

  // Arbitrary object slow path
  const result = {};
  memory.set(value, result);
  const keys = Object.keys(value);

  // We need to use Object.keys instead of iterating by indices because we
  // also need to copy arbitrary fields set in the array.
  if (Object.hasOwn(value, '__proto__')) {
    for (const key of keys) {
      const clonedValue = structuredCloneInternal(value[key]);
      if (key === '__proto__') {
        defineEnumerableProperty(result, key, clonedValue);
      } else {
        // $FlowExpectedError[prop-missing]
        result[key] = clonedValue;
      }
    }
  } else {
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      // $FlowExpectedError[prop-missing]
      result[key] = structuredCloneInternal(value[key]);
    }
  }

  return result;
}

function cloneErrorProperties(value: Error, result: Error): void {
  if (Object.hasOwn(value, 'cause')) {
    Object.defineProperty(result, 'cause', {
      configurable: true,
      value: structuredCloneInternal(value.cause),
      writable: true,
    });
  }

  result.stack = value.stack;
}

/**
 * Basic implementation of `structuredClone`.
 * See:
 * - https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone.
 * - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
 * - https://html.spec.whatwg.org/multipage/structured-data.html#structured-cloning
 *
 * Supports cloning all built-in types supported by the spec, circular
 * references and referential equality of the same objects found in the
 * structure.
 *
 * Shortcuts:
 * - This implementation does NOT serialize and deserialize the value
 *   but implements the cloning in a single step.
 *
 * Known limitations:
 * - It does not support transferring values.
 */
export default function structuredClone<T>(value: T): T {
  try {
    // $FlowExpectedError[incompatible-type] structured cloning preserves the value's serializable type.
    return structuredCloneInternal(value);
  } finally {
    memory.clear();
  }
}

const NON_SERIALIZABLE_OBJECT_KEY = Symbol('nonSerializableObject');

function cloneArrayBuffer(value: ArrayBuffer): ArrayBuffer {
  const existingClone = memory.get(value);
  if (existingClone instanceof ArrayBuffer) {
    return existingClone;
  }

  const result = value.slice(0);
  memory.set(value, result);
  return result;
}

function cloneTypedArray(value: $TypedArray): $TypedArray {
  const buffer = cloneArrayBuffer(value.buffer);
  const {byteOffset, length} = value;

  if (value instanceof Int8Array) {
    return new Int8Array(buffer, byteOffset, length);
  }
  if (value instanceof Uint8Array) {
    return new Uint8Array(buffer, byteOffset, length);
  }
  if (value instanceof Uint8ClampedArray) {
    return new Uint8ClampedArray(buffer, byteOffset, length);
  }
  if (value instanceof Int16Array) {
    return new Int16Array(buffer, byteOffset, length);
  }
  if (value instanceof Uint16Array) {
    return new Uint16Array(buffer, byteOffset, length);
  }
  if (value instanceof Int32Array) {
    return new Int32Array(buffer, byteOffset, length);
  }
  if (value instanceof Uint32Array) {
    return new Uint32Array(buffer, byteOffset, length);
  }
  if (typeof Float16Array !== 'undefined' && value instanceof Float16Array) {
    return new Float16Array(buffer, byteOffset, length);
  }
  if (value instanceof Float32Array) {
    return new Float32Array(buffer, byteOffset, length);
  }
  if (value instanceof Float64Array) {
    return new Float64Array(buffer, byteOffset, length);
  }
  if (value instanceof BigInt64Array) {
    return new BigInt64Array(buffer, byteOffset, length);
  }
  if (value instanceof BigUint64Array) {
    return new BigUint64Array(buffer, byteOffset, length);
  }

  throw new TypeError('Unsupported typed array');
}

function defineEnumerableProperty(
  target: interface {},
  key: string,
  value: unknown,
): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

declare function isTypedArray(value: unknown): implies value is $TypedArray;
function isTypedArray(value: unknown): boolean {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

function createErrorClone(value: Error): Error {
  switch (value.name) {
    case 'EvalError':
      return new EvalError(value.message);
    case 'RangeError':
      return new RangeError(value.message);
    case 'ReferenceError':
      return new ReferenceError(value.message);
    case 'SyntaxError':
      return new SyntaxError(value.message);
    case 'TypeError':
      return new TypeError(value.message);
    case 'URIError':
      return new URIError(value.message);
    default:
      return new Error(value.message);
  }
}

function isNonSerializableObject<T extends interface {}>(obj: T): boolean {
  // $FlowExpectedError[invalid-in-lhs]
  return NON_SERIALIZABLE_OBJECT_KEY in obj;
}

function markClassAsNonSerializable<T>(cls: Class<T>): void {
  // $FlowExpectedError[incompatible-use]
  cls.prototype[NON_SERIALIZABLE_OBJECT_KEY] = true;
}

// Non-serializable built-ins.
markClassAsNonSerializable(WeakMap);
markClassAsNonSerializable(WeakSet);
markClassAsNonSerializable(Promise);
