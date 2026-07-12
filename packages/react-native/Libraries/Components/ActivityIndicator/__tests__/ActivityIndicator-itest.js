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
import {ActivityIndicator} from 'react-native';

describe('<ActivityIndicator>', () => {
  it('sets displayName', () => {
    expect(ActivityIndicator.displayName).toBe('ActivityIndicator');
  });

  describe('props', () => {
    describe('size', () => {
      it('defaults to "small" (20x20)', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ActivityIndicator />);
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar height="20" width="20" />,
        );
      });

      it('renders with size "small"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ActivityIndicator size="small" />);
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar height="20" width="20" />,
        );
      });

      it('renders with size "large" (36x36)', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ActivityIndicator size="large" />);
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar height="36" width="36" />,
        );
      });

      it('renders with numeric size on Android', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ActivityIndicator size={48} />);
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar height="48" width="48" />,
        );
      });
    });

    describe('color', () => {
      it('renders an AndroidProgressBar when color is set', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ActivityIndicator color="red" />);
        });

        // Color is a native prop not serialized as a view attribute,
        // but the component still renders correctly
        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar height="20" width="20" />,
        );
      });
    });

    describe('animating', () => {
      it('defaults to true', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ActivityIndicator />);
        });

        // Component renders normally when animating (default)
        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar height="20" width="20" />,
        );
      });

      it('renders when animating is false', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ActivityIndicator animating={false} />);
        });

        // Component still renders when not animating
        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar height="20" width="20" />,
        );
      });
    });

    describe('style', () => {
      it('applies wrapper View style', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ActivityIndicator style={{opacity: 0.5}} />);
        });

        expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
          <rn-view opacity="0.5">
            <rn-androidProgressBar />
          </rn-view>,
        );
      });
    });

    describe('accessibilityLabel', () => {
      it('is propagated to the native component', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ActivityIndicator accessibilityLabel="Loading content" />,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
        ).toEqual(
          <rn-androidProgressBar accessibilityLabel="Loading content" />,
        );
      });
    });

    describe('testID', () => {
      it('is propagated to the native component', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ActivityIndicator testID="loading-spinner" />);
        });

        expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
          <rn-androidProgressBar testID="loading-spinner" />,
        );
      });
    });
  });

  describe('ref', () => {
    it('provides a valid HTMLElement instance', () => {
      const elementRef = createRef<HostInstance>();
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<ActivityIndicator ref={elementRef} />);
      });

      expect(elementRef.current).toBeInstanceOf(HTMLElement);
    });

    it('has the correct tag name', () => {
      const elementRef = createRef<HostInstance>();
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<ActivityIndicator ref={elementRef} />);
      });

      const element = nullthrows(elementRef.current);
      expect(element.tagName).toBe('RN:AndroidProgressBar');
    });
  });
});
