/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';
import invariant from 'invariant';

/**
 * Static poolers. Several custom versions for each potential number of
 * arguments. A completely generic pooler is easy to implement, but would
 * require accessing the `arguments` object. In each of these, `this` refers to
 * the Class itself, not an instance. If any others are needed, simply add them
 * here, or in their own files.
 */
/* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
 * Flow's LTI update could not be added via codemod */
const oneArgumentPooler = function (copyFieldsFrom: any) {
  const Klass = this; // eslint-disable-line consistent-this
  if (Klass.instancePool.length) {
    const instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

/* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
 * Flow's LTI update could not be added via codemod */
const twoArgumentPooler = function (a1: any, a2: any) {
  const Klass = this; // eslint-disable-line consistent-this
  if (Klass.instancePool.length) {
    const instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

/* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
 * Flow's LTI update could not be added via codemod */
const threeArgumentPooler = function (a1: any, a2: any, a3: any) {
  const Klass = this; // eslint-disable-line consistent-this
  if (Klass.instancePool.length) {
    const instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3);
    return instance;
  } else {
    return new Klass(a1, a2, a3);
  }
};

/* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
 * Flow's LTI update could not be added via codemod */
const fourArgumentPooler = function (a1: any, a2: any, a3: any, a4: any) {
  const Klass = this; // eslint-disable-line consistent-this
  if (Klass.instancePool.length) {
    const instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4);
  }
};

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
/* $FlowFixMe[missing-this-annot] The 'this' type annotation(s) required by
 * Flow's LTI update could not be added via codemod */
const standardReleaser = function (instance) {
  const Klass = this; // eslint-disable-line consistent-this
  invariant(
    instance instanceof Klass,
    'Trying to release an instance into a pool of a different type.',
  );
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

const DEFAULT_POOL_SIZE = 10;
const DEFAULT_POOLER = oneArgumentPooler;

type Pooler = any;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances.
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
const addPoolingTo = function <T>(
  CopyConstructor: Class<T>,
  pooler: Pooler,
): Class<T> & {
  getPooled(
    ...args: ReadonlyArray<unknown>
  ): /* arguments of the constructor */ T,
  release(instance: unknown): void,
  ...
} {
  // Casting as any so that flow ignores the actual implementation and trusts
  // it to match the type we declared
  const NewKlass: any = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

const PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler as Pooler,
  twoArgumentPooler: twoArgumentPooler as Pooler,
  threeArgumentPooler: threeArgumentPooler as Pooler,
  fourArgumentPooler: fourArgumentPooler as Pooler,
};

export default PooledClass;
