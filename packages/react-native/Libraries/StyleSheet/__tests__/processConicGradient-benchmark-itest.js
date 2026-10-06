/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @fantom_native_opt false
 * @fantom_js_opt true
 * @fantom_js_bytecode false
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {BackgroundImageValue} from '../StyleSheetTypes';

import processBackgroundImage from '../processBackgroundImage';
import * as Fantom from '@react-native/fantom';

const linearString = 'linear-gradient(90deg, red, blue)';
const conicString = 'conic-gradient(from 90deg, red, blue)';

const linearObject: ReadonlyArray<BackgroundImageValue> = [
  {
    type: 'linear-gradient',
    direction: '90deg',
    colorStops: [{color: 'red'}, {color: 'blue'}],
  },
];

const conicObject: ReadonlyArray<BackgroundImageValue> = [
  {
    type: 'conic-gradient',
    from: '90deg',
    colorStops: [{color: 'red'}, {color: 'blue'}],
  },
];

function createConicString(stopCount: number): string {
  const stops = [];
  for (let index = 0; index < stopCount; index++) {
    const color = index % 2 === 0 ? 'red' : 'blue';
    const position = (index / (stopCount - 1)) * 100;
    stops.push(`${color} ${position}%`);
  }
  return `conic-gradient(${stops.join(', ')})`;
}

const conicString20 = createConicString(20);
const conicString100 = createConicString(100);
const linearString20 = conicString20.replace(
  'conic-gradient',
  'linear-gradient',
);
const linearString100 = conicString100.replace(
  'conic-gradient',
  'linear-gradient',
);
const conicStringLayers = [conicString, conicString, conicString].join(', ');

Fantom.unstable_benchmark
  .suite('processBackgroundImage', {minTestExecutionTimeMs: 500})
  .test('parse linear gradient string with two stops', () => {
    processBackgroundImage(linearString);
  })
  .test('parse conic gradient string with two stops', () => {
    processBackgroundImage(conicString);
  })
  .test('parse linear gradient object with two stops', () => {
    processBackgroundImage(linearObject);
  })
  .test('parse conic gradient object with two stops', () => {
    processBackgroundImage(conicObject);
  })
  .test('parse conic gradient string with 20 stops', () => {
    processBackgroundImage(conicString20);
  })
  .test('parse linear gradient string with 20 stops', () => {
    processBackgroundImage(linearString20);
  })
  .test('parse conic gradient string with 100 stops', () => {
    processBackgroundImage(conicString100);
  })
  .test('parse linear gradient string with 100 stops', () => {
    processBackgroundImage(linearString100);
  })
  .test('parse three conic gradient layers', () => {
    processBackgroundImage(conicStringLayers);
  });
