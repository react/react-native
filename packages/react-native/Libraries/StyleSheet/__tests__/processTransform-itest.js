/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

const processTransform = require('../processTransform').default;

describe('processTransform', () => {
  describe('validation', () => {
    it('should accept an empty array', () => {
      processTransform([]);
    });

    it('should accept an empty string', () => {
      processTransform('');
    });

    it('should accept a simple valid transform', () => {
      processTransform([
        {scale: 0.5},
        {translateX: 10},
        {translateY: 20},
        {rotate: '10deg'},
      ]);
      processTransform(
        'scale(0.5) translateX(10px) translateY(20px) rotate(10deg)',
      );
    });

    it('should accept a percentage translate transform', () => {
      processTransform([{translateY: '20%'}, {translateX: '10%'}]);
      processTransform('translateX(10%)');
    });

    it('should throw on object with multiple properties', () => {
      expect(() => processTransform([{scale: 0.5, translateY: 10}])).toThrow(
        'You must specify exactly one property per transform object. Passed properties: {"scale":0.5,"translateY":10}',
      );
    });

    it('should throw on invalid transform property', () => {
      expect(() => processTransform([{translateW: 10}])).toThrow(
        'Invalid transform translateW: {"translateW":10}',
      );
      expect(() => processTransform('translateW(10)')).toThrow(
        'Invalid transform translateW: {"translateW":10}',
      );
    });

    it('should throw when not passing an array to an array prop', () => {
      expect(() => processTransform([{matrix: 'not-a-matrix'}])).toThrow(
        'Transform with key of matrix must have an array as the value: {"matrix":"not-a-matrix"}',
      );
      expect(() => processTransform([{translate: 10}])).toThrow(
        'Transform with key of translate must have an array as the value: {"translate":10}',
      );
    });

    it('should accept a valid matrix', () => {
      processTransform([{matrix: [1, 1, 1, 1, 1, 1, 1, 1, 1]}]);
      processTransform('matrix(1, 1, 1, 1, 1, 1, 1, 1, 1)');
      processTransform([
        {matrix: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]},
      ]);
      processTransform(
        'matrix(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1)',
      );
    });

    it('should throw when passing a matrix of the wrong size', () => {
      expect(() => processTransform([{matrix: [1, 1, 1, 1]}])).toThrow(
        'Matrix transform must have a length of 9 (2d) or 16 (3d). Provided matrix has a length of 4: {"matrix":[1,1,1,1]}',
      );
      expect(() => processTransform('matrix(1, 1, 1, 1)')).toThrow(
        'Matrix transform must have a length of 9 (2d) or 16 (3d). Provided matrix has a length of 4: {"matrix":[1,1,1,1]}',
      );
    });

    it('should accept a valid translate', () => {
      processTransform([{translate: [1, 1]}]);
      processTransform('translate(1px)');
      processTransform('translate(1px, 1px)');
      processTransform([{translate: [1, 1, 1]}]);
    });

    it('should throw when passing a translate of the wrong size', () => {
      expect(() => processTransform([{translate: [1]}])).toThrow(
        'Transform with key translate must be an array of length 2 or 3, found 1: {"translate":[1]}',
      );
      expect(() => processTransform([{translate: [1, 1, 1, 1]}])).toThrow(
        'Transform with key translate must be an array of length 2 or 3, found 4: {"translate":[1,1,1,1]}',
      );
      expect(() => processTransform('translate(1px, 1px, 1px, 1px)')).toThrow(
        'Transform with key translate must be an string with 1 or 2 parameters, found 4: translate(1px, 1px, 1px, 1px)',
      );
    });

    it('should throw when passing an invalid value to a number prop', () => {
      expect(() => processTransform([{translateY: '20deg'}])).toThrow(
        'Transform with key of "translateY" must be number or a percentage. Passed value: {"translateY":"20deg"}.',
      );
      expect(() => processTransform([{scale: {x: 10, y: 10}}])).toThrow(
        'Transform with key of "scale" must be a number: {"scale":{"x":10,"y":10}}',
      );
      expect(() => processTransform([{perspective: []}])).toThrow(
        'Transform with key of "perspective" must be a number: {"perspective":[]}',
      );
    });

    it('should throw when passing a perspective of 0', () => {
      expect(() => processTransform([{perspective: 0}])).toThrow(
        'Transform with key of "perspective" cannot be zero: {"perspective":0}',
      );
    });

    it('should accept an angle in degrees or radians', () => {
      processTransform([{skewY: '10deg'}]);
      processTransform('skewY(10deg)');
      processTransform([{rotateX: '1.16rad'}]);
      processTransform('rotateX(1.16rad)');
    });

    it('should throw when passing an invalid angle prop', () => {
      expect(() => processTransform([{rotate: 10}])).toThrow(
        'Transform with key of "rotate" must be a string: {"rotate":10}',
      );
      expect(() => processTransform('rotate(10)')).toThrow(
        'Transform with key of "rotate" must be a string: {"rotate":10}',
      );
      expect(() => processTransform([{skewX: '10drg'}])).toThrow(
        'Rotate transform must be expressed in degrees (deg) or radians (rad): {"skewX":"10drg"}',
      );
      expect(() => processTransform('skewX(10drg)')).toThrow(
        'Rotate transform must be expressed in degrees (deg) or radians (rad): {"skewX":"10drg"}',
      );
    });

    it('should throw when passing an Animated.Value', () => {
      expect(() => processTransform([{rotate: {getValue: () => {}}}])).toThrow(
        'You passed an Animated.Value to a normal component. You need to wrap that component in an Animated. For example, replace <View /> by <Animated.View />.',
      );
    });
  });
});
