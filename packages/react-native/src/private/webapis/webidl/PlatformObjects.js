/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const IS_PLATFORM_OBJECT_KEY = Symbol('isPlatformObject');
const CLONE_PLATFORM_OBJECT_KEY = Symbol('clonePlatformObject');

/**
 * Marks the given object or instances of the given class as platform objects.
 *
 * Optionally, it sets the clone function for that platform object, which is a
 * simplification of the serializable attribute of the Web interface.
 */
export const setPlatformObject: (<T extends interface {}>(
  obj: Class<T>,
  options?: {clone: T => T},
) => void) &
  (<T extends interface {}>(obj: T, options?: {clone: T => T}) => void) =
  function setPlatformObject(obj, options) {
    if (typeof obj === 'function') {
      // $FlowExpectedError[prop-missing]
      obj.prototype[IS_PLATFORM_OBJECT_KEY] = true;
      if (options) {
        // $FlowExpectedError[prop-missing]
        obj.prototype[CLONE_PLATFORM_OBJECT_KEY] = options.clone;
      }
    } else {
      // $FlowExpectedError[prop-missing]
      obj[IS_PLATFORM_OBJECT_KEY] = true;
      if (options) {
        // $FlowExpectedError[prop-missing]
        obj[CLONE_PLATFORM_OBJECT_KEY] = options.clone;
      }
    }
  };

/**
 * Indicates if the given object is a platform object.
 */
export function isPlatformObject<T extends interface {}>(obj: T): boolean {
  // $FlowExpectedError[invalid-in-lhs]
  return IS_PLATFORM_OBJECT_KEY in obj;
}

/**
 * Returns the clone function for the given platform object, if it was set.
 */
export function getPlatformObjectClone<T extends interface {}>(
  obj: T,
): (T => T) | void {
  // $FlowExpectedError[prop-missing]
  return obj[CLONE_PLATFORM_OBJECT_KEY];
}
