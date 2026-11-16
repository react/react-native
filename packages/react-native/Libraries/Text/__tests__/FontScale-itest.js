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

import type {RootConfig} from '@react-native/fantom';
import type {HostInstance, TextInputInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Text, TextInput, View} from 'react-native';

const cases = [
  {
    name: 'default font scaling',
    allowFontScaling: undefined,
    maxFontSizeMultiplier: undefined,
    expectedMultiplier: 2,
    // Known bug: TextInput keeps its cached size; this should be 2.
    expectedTextInputMultiplier: 1,
  },
  {
    name: 'disabled font scaling',
    allowFontScaling: false,
    maxFontSizeMultiplier: undefined,
    expectedMultiplier: 1,
    expectedTextInputMultiplier: 1,
  },
  {
    name: 'capped font scaling',
    allowFontScaling: undefined,
    maxFontSizeMultiplier: 1.5,
    expectedMultiplier: 1.5,
    // Known bug: TextInput keeps its cached size; this should be 1.5.
    expectedTextInputMultiplier: 1,
  },
];

describe('runtime font-scale changes', () => {
  for (const componentName of ['Text', 'TextInput']) {
    for (const {
      name,
      allowFontScaling,
      maxFontSizeMultiplier,
      expectedMultiplier,
      expectedTextInputMultiplier,
    } of cases) {
      it(`handles font-scale changes for mounted ${componentName} with ${name}`, () => {
        const rootConfig: RootConfig = {
          viewportWidth: 400,
          viewportHeight: 600,
          devicePixelRatio: 2,
          fontScale: 1,
          viewportOffsetX: 10,
          viewportOffsetY: 20,
        };
        const parentRef = createRef<HostInstance>();
        const textRef = createRef<HostInstance>();
        const inputRef = createRef<TextInputInstance>();
        const content = (
          <View
            ref={parentRef}
            style={{width: 300, height: 400, alignItems: 'flex-start'}}>
            {componentName === 'Text' ? (
              <Text
                ref={textRef}
                allowFontScaling={allowFontScaling}
                maxFontSizeMultiplier={maxFontSizeMultiplier}
                style={{fontSize: 20}}>
                text
              </Text>
            ) : (
              <TextInput
                ref={inputRef}
                value="text"
                allowFontScaling={allowFontScaling}
                maxFontSizeMultiplier={maxFontSizeMultiplier}
                style={{fontSize: 20, padding: 0}}
              />
            )}
          </View>
        );
        const expectedFontScale =
          componentName === 'Text'
            ? expectedMultiplier
            : expectedTextInputMultiplier;

        // Mount and destroy the reference before creating the subject so global
        // Dimensions changes cannot rerender it and invalidate its cached layout.
        const referenceRoot = Fantom.createRoot({
          ...rootConfig,
          fontScale: expectedFontScale,
        });
        let expectedBounds;
        try {
          Fantom.runTask(() => referenceRoot.render(content));
          expectedBounds = nullthrows(
            componentName === 'Text' ? textRef.current : inputRef.current,
          ).getBoundingClientRect();
        } finally {
          Fantom.runTask(() => referenceRoot.render(<></>));
          referenceRoot.destroy();
        }

        const root = Fantom.createRoot(rootConfig);
        try {
          Fantom.runTask(() => root.render(content));

          const parent = nullthrows(parentRef.current);
          const text = textRef.current;
          const input = inputRef.current;
          const element = nullthrows(componentName === 'Text' ? text : input);
          const parentBounds = parent.getBoundingClientRect();
          const initialBounds = element.getBoundingClientRect();
          expect(initialBounds.width).toBeGreaterThan(0);
          expect(initialBounds.height).toBeGreaterThan(0);
          if (expectedFontScale > 1) {
            expect(expectedBounds.width).toBeGreaterThan(initialBounds.width);
            expect(expectedBounds.height).toBeGreaterThan(initialBounds.height);
          }
          root.takeMountingManagerLogs();

          root.updateSurfaceConstraints({fontScale: 2});

          expect(parentRef.current).toBe(parent);
          expect(parent.getBoundingClientRect()).toEqual(parentBounds);
          expect(textRef.current).toBe(text);
          expect(inputRef.current).toBe(input);
          const scaledBounds = element.getBoundingClientRect();
          expect(scaledBounds.width).toBeCloseTo(expectedBounds.width);
          expect(scaledBounds.height).toBeCloseTo(expectedBounds.height);
          expect(
            root
              .takeMountingManagerLogs()
              .filter(log => /^(Create|Delete|Insert|Remove) /.test(log)),
          ).toEqual([]);

          root.updateSurfaceConstraints({fontScale: 1});

          expect(parentRef.current).toBe(parent);
          expect(parent.getBoundingClientRect()).toEqual(parentBounds);
          expect(textRef.current).toBe(text);
          expect(inputRef.current).toBe(input);
          expect(element.getBoundingClientRect()).toEqual(initialBounds);
          expect(
            root
              .takeMountingManagerLogs()
              .filter(log => /^(Create|Delete|Insert|Remove) /.test(log)),
          ).toEqual([]);
        } finally {
          Fantom.runTask(() => root.render(<></>));
          root.destroy();
        }
      });
    }
  }
});
