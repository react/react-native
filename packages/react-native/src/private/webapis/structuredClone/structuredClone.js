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

const VALID_ERROR_NAMES = new Set([
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
]);

const BASIC_CONSTRUCTORS = [Number, String, Boolean, Date];

const ObjectPrototype = Object.prototype;

// Technically the memory value should be a parameter in
// `structuredCloneInternal` but as an optimization we can reuse the same map
// and avoid allocating a new one in every call to `structuredClone`.
// This is safe because we don't invoke user code in `structuredClone`, so at
// any given point we only have one memory object alive anyway.
const memory: Map<unknown, unknown> = new Map();

function structuredCloneInternal<T>(value: T): T {
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
  if (memory.has(value)) {
    // $FlowExpectedError[incompatible-type] we know memory.get(value) is T
    return memory.get(value);
  }

  // Handles arrays.
  if (Array.isArray(value)) {
    const result = [];
    memory.set(value, result);

    for (const key of Object.keys(value)) {
      result[key] = structuredCloneInternal(value[key]);
    }

    // $FlowExpectedError[incompatible-type] we know result is T
    return result;
  }

  // Simple object fast path
  // $FlowFixMe[prop-missing] Why doesn't Flow know about Object.prototype?
  if (Object.getPrototypeOf(value) === ObjectPrototype) {
    const result = {};
    memory.set(value, result);

    for (const key of Object.keys(value)) {
      // $FlowExpectedError[prop-missing]
      result[key] = structuredCloneInternal(value[key]);
    }

    // $FlowExpectedError[incompatible-type] we know result is T
    return result;
  }

  // Handles complex types (typeof === 'object').

  for (const Cls of BASIC_CONSTRUCTORS) {
    if (value instanceof Cls) {
      const result = new Cls(value);
      memory.set(value, result);
      // $FlowExpectedError[incompatible-type] we know result is T
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

    // $FlowExpectedError[incompatible-type] we know result is T
    return result;
  }

  if (value instanceof Set) {
    const result = new Set<unknown>();
    memory.set(value, result);

    for (const innerValue of value) {
      result.add(structuredCloneInternal(innerValue));
    }

    // $FlowExpectedError[incompatible-type] we know result is T
    return result;
  }

  if (value instanceof RegExp) {
    const result = new RegExp(value.source, value.flags);
    memory.set(value, result);

    // $FlowExpectedError[incompatible-type] we know result is T
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

  if (value instanceof Error) {
    const result = value.cause
      ? new Error(value.message, {cause: value.cause})
      : new Error(value.message);
    memory.set(value, result);

    if (VALID_ERROR_NAMES.has(value.name)) {
      result.name = value.name;
    } else {
      result.name = 'Error';
    }

    result.stack = value.stack;

    // $FlowExpectedError[incompatible-type] we know result is T
    return result;
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

  // We need to use Object.keys instead of iterating by indices because we
  // also need to copy arbitrary fields set in the array.
  for (const key of Object.keys(value)) {
    // $FlowExpectedError[prop-missing]
    result[key] = structuredCloneInternal(value[key]);
  }

  // $FlowExpectedError[incompatible-type] we know result is T
  return result;
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
    return structuredCloneInternal(value);
  } finally {
    memory.clear();
  }
}

const NON_SERIALIZABLE_OBJECT_KEY = Symbol('nonSerializableObject');

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
