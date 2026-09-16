/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {ColorValue} from 'react-native';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {PlatformColor, View} from 'react-native';

const processColor = require('../processColor').default;

// Fantom runs as `Platform.OS === 'android'` with no host resource system, so
// PlatformColor tokens never resolve and the fallback is carried through, not
// applied (the real miss -> fallback visual is covered by RNTester screenshots).
// These tests verify each fallback format renders to the expected color and that
// the raw fallback string survives the color pipeline into the view props.

function renderedBackgroundColor(color: ColorValue): unknown {
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<View style={{backgroundColor: color}} />);
  });
  return root.getRenderedOutput({props: ['backgroundColor']}).toJSX();
}

describe('PlatformColor lazy fallback', () => {
  describe('fallback color-format strings render to the expected color', () => {
    // Opaque formats only: alpha serialization is exercised via the pipeline
    // assertions below, keeping these rendered-output checks deterministic.
    const cases: Array<[string, string, string]> = [
      ['#RRGGBB hex', '#FF0000', 'rgba(255, 0, 0, 1)'],
      ['rgb()', 'rgb(255, 0, 128)', 'rgba(255, 0, 128, 1)'],
      ['hsl()', 'hsl(120, 100%, 50%)', 'rgba(0, 255, 0, 1)'],
      ['named color', 'cornflowerblue', 'rgba(100, 149, 237, 1)'],
    ];
    for (const [name, input, expected] of cases) {
      it(`renders ${name}`, () => {
        expect(renderedBackgroundColor(input)).toEqual(
          <rn-view backgroundColor={expected} />,
        );
      });
    }
  });

  // The `PlatformColor()` arguments must be literals (enforced by the
  // @react-native/platform-colors lint rule), so each case is spelled out.
  describe('PlatformColor carries the raw, unprocessed fallback', () => {
    it('carries a #RRGGBB fallback', () => {
      expect(
        processColor(
          PlatformColor('?attr/nonExistentColor', {fallback: '#FF0000'}),
        ),
      ).toEqual({
        resource_paths: ['?attr/nonExistentColor'],
        fallback: '#FF0000',
      });
    });

    it('carries a #RRGGBBAA fallback', () => {
      expect(
        processColor(
          PlatformColor('?attr/nonExistentColor', {fallback: '#FF000080'}),
        ),
      ).toEqual({
        resource_paths: ['?attr/nonExistentColor'],
        fallback: '#FF000080',
      });
    });

    it('carries an rgb() fallback', () => {
      expect(
        processColor(
          PlatformColor('?attr/nonExistentColor', {
            fallback: 'rgb(255, 0, 128)',
          }),
        ),
      ).toEqual({
        resource_paths: ['?attr/nonExistentColor'],
        fallback: 'rgb(255, 0, 128)',
      });
    });

    it('carries an rgba() fallback', () => {
      expect(
        processColor(
          PlatformColor('?attr/nonExistentColor', {
            fallback: 'rgba(0, 128, 255, 0.7)',
          }),
        ),
      ).toEqual({
        resource_paths: ['?attr/nonExistentColor'],
        fallback: 'rgba(0, 128, 255, 0.7)',
      });
    });

    it('carries an hsl() fallback', () => {
      expect(
        processColor(
          PlatformColor('?attr/nonExistentColor', {
            fallback: 'hsl(120, 100%, 50%)',
          }),
        ),
      ).toEqual({
        resource_paths: ['?attr/nonExistentColor'],
        fallback: 'hsl(120, 100%, 50%)',
      });
    });

    it('carries an hsla() fallback', () => {
      expect(
        processColor(
          PlatformColor('?attr/nonExistentColor', {
            fallback: 'hsla(280, 100%, 60%, 0.8)',
          }),
        ),
      ).toEqual({
        resource_paths: ['?attr/nonExistentColor'],
        fallback: 'hsla(280, 100%, 60%, 0.8)',
      });
    });

    it('carries a named-color fallback', () => {
      expect(
        processColor(
          PlatformColor('?attr/nonExistentColor', {fallback: 'cornflowerblue'}),
        ),
      ).toEqual({
        resource_paths: ['?attr/nonExistentColor'],
        fallback: 'cornflowerblue',
      });
    });
  });

  it('omits the fallback field when none is provided (miss stays transparent)', () => {
    expect(processColor(PlatformColor('?attr/nonExistentColor'))).toEqual({
      resource_paths: ['?attr/nonExistentColor'],
    });
  });
});
