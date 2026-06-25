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

const flattenStyle = require('../flattenStyle').default;
const StyleSheet = require('../StyleSheet').default;

function getFixture() {
  return StyleSheet.create({
    elementA: {
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementA/styleB',
    },
    elementB: {
      styleB: 'moduleA/elementB/styleB',
    },
  });
}

describe('flattenStyle', () => {
  it('should merge style objects', () => {
    const style1 = {width: 10};
    const style2 = {height: 20};
    const flatStyle = flattenStyle([style1, style2]);
    expect(flatStyle?.width).toBe(10);
    expect(flatStyle?.height).toBe(20);
  });

  it('should override style properties', () => {
    const style1 = {backgroundColor: '#000', width: 10};
    const style2 = {backgroundColor: '#023c69', width: null};
    const flatStyle = flattenStyle([style1, style2]);
    expect(flatStyle?.backgroundColor).toBe('#023c69');
    expect(flatStyle?.width).toBe(null);
  });

  it('should overwrite properties with `undefined`', () => {
    const style1 = {backgroundColor: '#000'};
    const style2 = {backgroundColor: undefined};
    const flatStyle = flattenStyle([style1, style2]);
    expect(flatStyle?.backgroundColor).toBe(undefined);
  });

  it('should not fail on falsy values', () => {
    expect(() => flattenStyle([null, false, undefined])).not.toThrow();
  });

  it('should recursively flatten arrays', () => {
    const style1 = {width: 10};
    const style2 = {height: 20};
    const style3 = {width: 30};
    const flatStyle = flattenStyle([
      null,
      [] as const,
      [style1, style2],
      style3,
    ]);
    expect(flatStyle?.width).toBe(30);
    expect(flatStyle?.height).toBe(20);
  });

  it('should not allocate an object when there is no style', () => {
    const nullStyle = flattenStyle(null);
    const nullStyleAgain = flattenStyle(null);

    expect(nullStyle).toBe(nullStyleAgain);
    expect(nullStyle).toBe(undefined);
  });

  it('should not allocate an object when there is a style', () => {
    const style = {a: 'b'};
    const nullStyle = flattenStyle(style);

    expect(nullStyle).toBe(style);
  });

  it('should not allocate an object when there is a single class', () => {
    const fixture = getFixture();
    const singleStyle = flattenStyle(fixture.elementA);
    const singleStyleAgain = flattenStyle(fixture.elementA);

    expect(singleStyle).toBe(singleStyleAgain);
    expect(singleStyle).toEqual({
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementA/styleB',
    });
  });

  it('should allocate an object when an array contains one style', () => {
    const style = {a: 'b'};
    const singleStyle = flattenStyle([style]);

    expect(singleStyle).not.toBe(style);
    expect(singleStyle).toEqual(style);
  });

  it('should allocate an object when an array contains one effective style', () => {
    const style = {a: 'b'};
    const singleStyle = flattenStyle([null, false, undefined, style]);
    const singleStyleAgain = flattenStyle([null, [undefined, style], false]);

    expect(singleStyle).not.toBe(style);
    expect(singleStyleAgain).not.toBe(style);
    expect(singleStyle).toEqual(style);
    expect(singleStyleAgain).toEqual(style);
  });

  it('should allocate an object when merging multiple styles', () => {
    const style1 = {width: 10};
    const style2 = {height: 20};
    const flatStyle = flattenStyle([style1, style2]);

    expect(flatStyle).not.toBe(style1);
    expect(flatStyle).not.toBe(style2);
    expect(style1).toEqual({width: 10});
    expect(style2).toEqual({height: 20});
    expect(flatStyle).toEqual({width: 10, height: 20});
  });

  it('should merge single class and style properly', () => {
    const fixture = getFixture();
    const style = {styleA: 'overrideA', styleC: 'overrideC'};
    const arrayStyle = flattenStyle([fixture.elementA, style]);

    expect(arrayStyle).toEqual({
      styleA: 'overrideA',
      styleB: 'moduleA/elementA/styleB',
      styleC: 'overrideC',
    });
  });

  it('should merge multiple classes', () => {
    const fixture = getFixture();
    const AthenB = flattenStyle([fixture.elementA, fixture.elementB]);
    const BthenA = flattenStyle([fixture.elementB, fixture.elementA]);

    expect(AthenB).toEqual({
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementB/styleB',
    });
    expect(BthenA).toEqual({
      styleA: 'moduleA/elementA/styleA',
      styleB: 'moduleA/elementA/styleB',
    });
  });

  it('should merge multiple classes with style', () => {
    const fixture = getFixture();
    const style = {styleA: 'overrideA'};
    const AthenB = flattenStyle([fixture.elementA, fixture.elementB, style]);
    const BthenA = flattenStyle([fixture.elementB, fixture.elementA, style]);

    expect(AthenB).toEqual({
      styleA: 'overrideA',
      styleB: 'moduleA/elementB/styleB',
    });
    expect(BthenA).toEqual({
      styleA: 'overrideA',
      styleB: 'moduleA/elementA/styleB',
    });
  });

  it('should flatten recursively', () => {
    const fixture = getFixture();
    const style = [{styleA: 'newA', styleB: 'newB'}, {styleA: 'newA2'}];
    const AthenB = flattenStyle([fixture.elementA, fixture.elementB, style]);

    expect(AthenB).toEqual({
      styleA: 'newA2',
      styleB: 'newB',
    });
  });

  it('should ignore invalid class names', () => {
    // $FlowExpectedError[extra-arg]
    // $FlowExpectedError[incompatible-type]
    const invalid = flattenStyle(1234, null);

    expect(invalid).toEqual(undefined);
    // Invalid class name 1234 skipping ...
  });
});
