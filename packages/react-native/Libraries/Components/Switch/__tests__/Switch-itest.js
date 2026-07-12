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

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Switch} from 'react-native';

describe('<ExampleComponent>', () => {
  describe('props', () => {
    describe('exampleProp', () => {
      // more describe('<context>') or tests with it('<behaviour>')
    });
    // ... more props
  });
  describe('ref', () => {
    describe('exampleMethod()', () => {
      // more describe('<context>') or tests with it('<behaviour>')
    });
    // ... more methods
    describe('instance', () => {
      it('uses the "RN:Switch" tag name', () => {
        const elementRef = createRef<HostInstance>();
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<Switch ref={elementRef} />);
        });

        expect(elementRef.current).toBeInstanceOf(HTMLElement);
        const element = nullthrows(elementRef.current);
        expect(element.tagName).toBe('RN:Switch');
      });
    });
  });
});
