/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import normalizeColor from '..';

it('accepts only spec compliant colors', () => {
  expect(normalizeColor('#abc')).not.toBe(null);
  expect(normalizeColor('#abcd')).not.toBe(null);
  expect(normalizeColor('#abcdef')).not.toBe(null);
  expect(normalizeColor('#abcdef01')).not.toBe(null);
  expect(normalizeColor('rgb(1,2,3)')).not.toBe(null);
  expect(normalizeColor('rgb(1 2 3)')).not.toBe(null);
  expect(normalizeColor('rgb(1, 2, 3)')).not.toBe(null);
  expect(normalizeColor('rgb(   1   , 2   , 3   )')).not.toBe(null);
  expect(normalizeColor('rgb(-1, -2, -3)')).not.toBe(null);
  expect(normalizeColor('rgba(0, 0, 0, 1)')).not.toBe(null);
  expect(normalizeColor(0x01234567 + 0.5)).toBe(null);
  expect(normalizeColor(-1)).toBe(null);
  expect(normalizeColor(0xffffffff + 1)).toBe(null);
});

it('temporarilys accept floating point values for rgb', () => {
  expect(normalizeColor('rgb(1.1, 2.1, 3.1)')).toBe(0x010203ff);
  expect(normalizeColor('rgba(1.1, 2.1, 3.1, 1.0)')).toBe(0x010203ff);
});

it('refuses non-spec compliant colors', () => {
  expect(normalizeColor('#00gg00')).toBe(null);
  expect(normalizeColor('rgb(1, 2, 3,)')).toBe(null);
  expect(normalizeColor('rgb(1, 2, 3')).toBe(null);
  // Functional forms must match the whole string (hex already did).
  expect(normalizeColor('xxrgb(1, 2, 3)yy')).toBe(null);
  expect(normalizeColor('rgb(1, 2, 3)yy')).toBe(null);
  expect(normalizeColor('xxrgb(1, 2, 3)')).toBe(null);
  expect(normalizeColor('rgba(1,2,3,0.5)extra')).toBe(null);
  expect(normalizeColor('prefixhsl(0, 0%, 0%)')).toBe(null);
  expect(normalizeColor('hwb(0 0% 0%)suffix')).toBe(null);

  // Used to be accepted by normalizeColor
  expect(normalizeColor('abc')).toBe(null);
  expect(normalizeColor(' #abc ')).toBe(null);
  expect(normalizeColor('##abc')).toBe(null);
  expect(normalizeColor('rgb 255 0 0')).toBe(null);
  expect(normalizeColor('RGBA(0, 1, 2)')).toBe(null);
  expect(normalizeColor('rgb (0, 1, 2)')).toBe(null);
  expect(normalizeColor('rgba(0 0 0 0.0)')).toBe(null);
  expect(normalizeColor('hsv(0, 1, 2)')).toBe(null);
  // $FlowExpectedError[incompatible-type]  - Intentionally malformed argument.
  expect(normalizeColor({r: 10, g: 10, b: 10})).toBe(null);
  expect(normalizeColor('hsl(1%, 2, 3)')).toBe(null);
  expect(normalizeColor('rgb(1%, 2%, 3%)')).toBe(null);
});

it('handles hex6 properly', () => {
  expect(normalizeColor('#000000')).toBe(0x000000ff);
  expect(normalizeColor('#ffffff')).toBe(0xffffffff);
  expect(normalizeColor('#ff00ff')).toBe(0xff00ffff);
  expect(normalizeColor('#abcdef')).toBe(0xabcdefff);
  expect(normalizeColor('#012345')).toBe(0x012345ff);
});

it('handles hex3 properly', () => {
  expect(normalizeColor('#000')).toBe(0x000000ff);
  expect(normalizeColor('#fff')).toBe(0xffffffff);
  expect(normalizeColor('#f0f')).toBe(0xff00ffff);
});

it('handles hex8 properly', () => {
  expect(normalizeColor('#00000000')).toBe(0x00000000);
  expect(normalizeColor('#ffffffff')).toBe(0xffffffff);
  expect(normalizeColor('#ffff00ff')).toBe(0xffff00ff);
  expect(normalizeColor('#abcdef01')).toBe(0xabcdef01);
  expect(normalizeColor('#01234567')).toBe(0x01234567);
});

it('handles rgb properly', () => {
  expect(normalizeColor('rgb(0, 0, 0)')).toBe(0x000000ff);
  expect(normalizeColor('rgb(-1, -2, -3)')).toBe(0x000000ff);
  expect(normalizeColor('rgb(0, 0, 255)')).toBe(0x0000ffff);
  expect(normalizeColor('rgb(100, 15, 69)')).toBe(0x640f45ff);
  expect(normalizeColor('rgb(255, 255, 255)')).toBe(0xffffffff);
  expect(normalizeColor('rgb(256, 256, 256)')).toBe(0xffffffff);
  expect(normalizeColor('rgb(0  0  0)')).toBe(0x000000ff);
  expect(normalizeColor('rgb(0 0 255)')).toBe(0x0000ffff);
  expect(normalizeColor('rgb(0 0 0 / 0.5)')).toBe(0x00000080);
  expect(normalizeColor('rgb(0 0 0 / 1)')).toBe(0x000000ff);
  expect(normalizeColor('rgb(0, 0, 0, 0.5)')).toBe(0x00000080);
});

it('handles rgba properly', () => {
  expect(normalizeColor('rgba(0, 0, 0, 0.0)')).toBe(0x00000000);
  expect(normalizeColor('rgba(0, 0, 0, 0)')).toBe(0x00000000);
  expect(normalizeColor('rgba(0, 0, 0, -0.5)')).toBe(0x00000000);
  expect(normalizeColor('rgba(0, 0, 0, 1.0)')).toBe(0x000000ff);
  expect(normalizeColor('rgba(0, 0, 0, 1)')).toBe(0x000000ff);
  expect(normalizeColor('rgba(0, 0, 0, 1.5)')).toBe(0x000000ff);
  expect(normalizeColor('rgba(100, 15, 69, 0.5)')).toBe(0x640f4580);
  expect(normalizeColor('rgba(0  0  0 / 0.0)')).toBe(0x00000000);
  expect(normalizeColor('rgba(0 0 0 / 1)')).toBe(0x000000ff);
  expect(normalizeColor('rgba(100 15 69 / 0.5)')).toBe(0x640f4580);
  expect(normalizeColor('rgba(0, 0, 0)')).toBe(0x000000ff);
});

it('handles hsl properly', () => {
  expect(normalizeColor('hsl(0, 0%, 0%)')).toBe(0x000000ff);
  expect(normalizeColor('hsl(360, 100%, 100%)')).toBe(0xffffffff);
  expect(normalizeColor('hsl(180, 50%, 50%)')).toBe(0x40bfbfff);
  expect(normalizeColor('hsl(540, 50%, 50%)')).toBe(0x40bfbfff);
  expect(normalizeColor('hsl(70, 25%, 75%)')).toBe(0xcacfafff);
  expect(normalizeColor('hsl(70, 100%, 75%)')).toBe(0xeaff80ff);
  expect(normalizeColor('hsl(70, 110%, 75%)')).toBe(0xeaff80ff);
  expect(normalizeColor('hsl(70, 0%, 75%)')).toBe(0xbfbfbfff);
  expect(normalizeColor('hsl(70, -10%, 75%)')).toBe(0xbfbfbfff);
  expect(normalizeColor('hsl(0 0% 0%)')).toBe(0x000000ff);
  expect(normalizeColor('hsl(360 100% 100%)')).toBe(0xffffffff);
  expect(normalizeColor('hsl(180 50% 50%)')).toBe(0x40bfbfff);
});

it('handles hsla properly', () => {
  expect(normalizeColor('hsla(0, 0%, 0%, 0)')).toBe(0x00000000);
  expect(normalizeColor('hsla(360, 100%, 100%, 1)')).toBe(0xffffffff);
  expect(normalizeColor('hsla(360, 100%, 100%, 0)')).toBe(0xffffff00);
  expect(normalizeColor('hsla(180, 50%, 50%, 0.2)')).toBe(0x40bfbf33);
  expect(normalizeColor('hsla(0 0% 0% / 0)')).toBe(0x00000000);
  expect(normalizeColor('hsla(360 100% 100% / 1)')).toBe(0xffffffff);
  expect(normalizeColor('hsla(360 100% 100% / 0)')).toBe(0xffffff00);
  expect(normalizeColor('hsla(180 50% 50% / 0.2)')).toBe(0x40bfbf33);
});

it('handles hwb properly', () => {
  expect(normalizeColor('hwb(0 0% 100%)')).toBe(0x000000ff);
  expect(normalizeColor('hwb(0 100% 0%)')).toBe(0xffffffff);
  expect(normalizeColor('hwb(0 0% 0%)')).toBe(0xff0000ff);
  expect(normalizeColor('hwb(70 50% 0%)')).toBe(0xeaff80ff);
  expect(normalizeColor('hwb(0 50% 50%)')).toBe(0x808080ff);
  expect(normalizeColor('hwb(360 100% 100%)')).toBe(0x808080ff);
  expect(normalizeColor('hwb(0 0% 0%)')).toBe(0xff0000ff);
  expect(normalizeColor('hwb(70 50% 0%)')).toBe(0xeaff80ff);
  expect(normalizeColor('hwb(0, 0%, 100%)')).toBe(null);
  expect(normalizeColor('hwb(200 30% 20% / 0.5)')).toBe(0x4da1cc80);
});

it('handles named colors properly', () => {
  expect(normalizeColor('red')).toBe(0xff0000ff);
  expect(normalizeColor('transparent')).toBe(0x00000000);
  expect(normalizeColor('peachpuff')).toBe(0xffdab9ff);
});

it('handles number colors properly', () => {
  expect(normalizeColor(0x00000000)).toBe(0x00000000);
  expect(normalizeColor(0xff0000ff)).toBe(0xff0000ff);
  expect(normalizeColor(0xffffffff)).toBe(0xffffffff);
  expect(normalizeColor(0x01234567)).toBe(0x01234567);
});

it('returns the same color when it is already normalized', () => {
  const normalizedColor = normalizeColor('red') || 0;
  expect(normalizeColor(normalizedColor)).toBe(normalizedColor);
});
