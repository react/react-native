/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const stringifySafe = require('../Utilities/stringifySafe').default;
const invariant = require('invariant');

type TransformObject = {[string]: unknown, ...};
type TransformArray = Array<TransformObject>;

/**
 * Generate a transform matrix based on the provided transforms, and use that
 * within the style object instead.
 *
 * This allows us to provide an API that is similar to CSS, where transforms may
 * be applied in an arbitrary order, and yet have a universal, singular
 * interface to native code.
 */
function processTransform(transform: TransformArray | string): TransformArray {
  let normalizedTransform;
  if (typeof transform === 'string') {
    const regex = new RegExp(/(\w+)\(([^)]+)\)/g);
    const transformArray: TransformArray = [];
    let matches;

    while ((matches = regex.exec(transform))) {
      const {key, value} = _getKeyAndValueFromCSSTransform(
        matches[1],
        matches[2],
      );

      if (value !== undefined) {
        transformArray.push({[key]: value});
      }
    }
    normalizedTransform = transformArray;
  } else {
    normalizedTransform = transform;
  }

  if (__DEV__) {
    _validateTransforms(normalizedTransform);
  }

  return normalizedTransform;
}

const _getKeyAndValueFromCSSTransform: (
  key: string,
  args: string,
) => {key: string, value?: Array<string | number> | number | string} = (
  key,
  args,
) => {
  const argsWithUnitsRegex = new RegExp(/([+-]?\d+(\.\d+)?)([a-zA-Z]+|%)?/g);

  switch (key) {
    case 'matrix':
      return {key, value: args.match(/[+-]?\d+(\.\d+)?/g)?.map(Number)};
    case 'translate':
    case 'translate3d':
      const parsedArgs = [];
      let missingUnitOfMeasurement = false;

      let matches;
      while ((matches = argsWithUnitsRegex.exec(args))) {
        const value = Number(matches[1]);
        const unitOfMeasurement = matches[3];

        if (value !== 0 && !unitOfMeasurement) {
          missingUnitOfMeasurement = true;
        }

        if (unitOfMeasurement === '%') {
          parsedArgs.push(`${value}%`);
        } else {
          parsedArgs.push(value);
        }
      }

      if (__DEV__) {
        invariant(
          !missingUnitOfMeasurement,
          `Transform with key ${key} must have units unless the provided value is 0, found %s`,
          `${key}(${args})`,
        );

        if (key === 'translate') {
          invariant(
            parsedArgs?.length === 1 || parsedArgs?.length === 2,
            'Transform with key translate must be an string with 1 or 2 parameters, found %s: %s',
            parsedArgs?.length,
            `${key}(${args})`,
          );
        } else {
          invariant(
            parsedArgs?.length === 3,
            'Transform with key translate3d must be an string with 3 parameters, found %s: %s',
            parsedArgs?.length,
            `${key}(${args})`,
          );
        }
      }

      if (parsedArgs?.length === 1) {
        parsedArgs.push(0);
      }

      return {key: 'translate', value: parsedArgs};
    case 'translateX':
    case 'translateY':
    case 'perspective':
      const argMatches = argsWithUnitsRegex.exec(args);

      if (!argMatches?.length) {
        return {key, value: undefined};
      }

      const value = Number(argMatches[1]);
      const unitOfMeasurement = argMatches[3];

      if (__DEV__) {
        invariant(
          value === 0 || unitOfMeasurement,
          `Transform with key ${key} must have units unless the provided value is 0, found %s`,
          `${key}(${args})`,
        );
      }

      return {key, value};

    default:
      return {key, value: !isNaN(args) ? Number(args) : args};
  }
};

function _validateTransforms(transform: TransformArray): void {
  transform.forEach(transformation => {
    const keys = Object.keys(transformation);
    invariant(
      keys.length === 1,
      'You must specify exactly one property per transform object. Passed properties: %s',
      stringifySafe(transformation),
    );
    const key = keys[0];
    const value = transformation[key];
    if (key === 'matrix' && transform.length > 1) {
      console.error(
        'When using a matrix transform, you must specify exactly one transform object. Passed transform: ' +
          stringifySafe(transform),
      );
    }
    _validateTransform(key, value, transformation);
  });
}

function _validateTransform(
  key: string,
  value: unknown,
  transformation: TransformObject,
) {
  const isAnimatedValue =
    value != null &&
    typeof value === 'object' &&
    'getValue' in value &&
    typeof value.getValue === 'function';
  invariant(
    !isAnimatedValue,
    'You passed an Animated.Value to a normal component. ' +
      'You need to wrap that component in an Animated. For example, ' +
      'replace <View /> by <Animated.View />.',
  );

  const multivalueTransforms = ['matrix', 'translate'];
  if (multivalueTransforms.indexOf(key) !== -1) {
    invariant(
      Array.isArray(value),
      'Transform with key of %s must have an array as the value: %s',
      key,
      stringifySafe(transformation),
    );
  }
  switch (key) {
    case 'matrix':
      invariant(
        Array.isArray(value),
        'Transform with key of %s must have an array as the value: %s',
        key,
        stringifySafe(transformation),
      );
      invariant(
        value.length === 9 || value.length === 16,
        'Matrix transform must have a length of 9 (2d) or 16 (3d). ' +
          'Provided matrix has a length of %s: %s',
        value.length,
        stringifySafe(transformation),
      );
      break;
    case 'translate':
      invariant(
        Array.isArray(value),
        'Transform with key of %s must have an array as the value: %s',
        key,
        stringifySafe(transformation),
      );
      invariant(
        value.length === 2 || value.length === 3,
        'Transform with key translate must be an array of length 2 or 3, found %s: %s',
        value.length,
        stringifySafe(transformation),
      );
      break;
    case 'rotateX':
    case 'rotateY':
    case 'rotateZ':
    case 'rotate':
    case 'skewX':
    case 'skewY':
      invariant(
        typeof value === 'string',
        'Transform with key of "%s" must be a string: %s',
        key,
        stringifySafe(transformation),
      );
      invariant(
        value.indexOf('deg') > -1 || value.indexOf('rad') > -1,
        'Rotate transform must be expressed in degrees (deg) or radians ' +
          '(rad): %s',
        stringifySafe(transformation),
      );
      break;
    case 'perspective':
      invariant(
        typeof value === 'number',
        'Transform with key of "%s" must be a number: %s',
        key,
        stringifySafe(transformation),
      );
      invariant(
        value !== 0,
        'Transform with key of "%s" cannot be zero: %s',
        key,
        stringifySafe(transformation),
      );
      break;
    case 'translateX':
    case 'translateY':
      invariant(
        typeof value === 'number' ||
          (typeof value === 'string' && value.endsWith('%')),
        'Transform with key of "%s" must be number or a percentage. Passed value: %s.',
        key,
        stringifySafe(transformation),
      );
      break;
    case 'scale':
    case 'scaleX':
    case 'scaleY':
      invariant(
        typeof value === 'number',
        'Transform with key of "%s" must be a number: %s',
        key,
        stringifySafe(transformation),
      );
      break;
    default:
      invariant(
        false,
        'Invalid transform %s: %s',
        key,
        stringifySafe(transformation),
      );
  }
}

export default processTransform;
