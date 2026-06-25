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
import {ScrollView, Text, View} from 'react-native';
import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('<ScrollView>', () => {
  describe('rendering', () => {
    it('renders its children', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <ScrollView>
            <View>
              <Text>Hello World!</Text>
            </View>
          </ScrollView>,
        );
      });

      expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
        <rn-scrollView>
          <rn-view>
            <rn-paragraph>Hello World!</rn-paragraph>
          </rn-view>
        </rn-scrollView>,
      );
    });
  });

  describe('ref', () => {
    it('receives an instance or null', () => {
      const root = Fantom.createRoot();
      const ref = jest.fn();

      Fantom.runTask(() => {
        root.render(<ScrollView ref={ref} />);
      });

      expect(ref).toHaveBeenCalledTimes(1);
      expect(ref.mock.calls[0][0]).not.toBe(null);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(ref.mock.lastCall[0]).toBe(null);
    });

    it('transitions between refs', () => {
      const root = Fantom.createRoot();
      const refA = jest.fn();
      const refB = jest.fn();

      Fantom.runTask(() => {
        root.render(<ScrollView ref={refA} />);
      });

      expect(refA.mock.lastCall[0]).not.toBe(null);

      Fantom.runTask(() => {
        root.render(<ScrollView ref={refB} />);
      });

      expect(refA.mock.lastCall[0]).toBe(null);
      expect(refB.mock.lastCall[0]).not.toBe(null);
    });
  });

  describe('innerViewRef', () => {
    it('receives an instance or null', () => {
      const root = Fantom.createRoot();
      const ref = jest.fn();

      Fantom.runTask(() => {
        root.render(<ScrollView innerViewRef={ref} />);
      });

      expect(ref.mock.lastCall[0]).toBeInstanceOf(ReactNativeElement);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(ref.mock.lastCall[0]).toBe(null);
    });

    it('transitions between refs', () => {
      const root = Fantom.createRoot();
      const refA = jest.fn();
      const refB = jest.fn();

      Fantom.runTask(() => {
        root.render(<ScrollView innerViewRef={refA} />);
      });

      expect(refA.mock.lastCall[0]).toBeInstanceOf(ReactNativeElement);

      Fantom.runTask(() => {
        root.render(<ScrollView innerViewRef={refB} />);
      });

      expect(refA.mock.lastCall[0]).toBe(null);
      expect(refB.mock.lastCall[0]).toBeInstanceOf(ReactNativeElement);
    });
  });

  describe('getInnerViewRef', () => {
    it('returns a host instance', () => {
      const ref = createRef<React.ElementRef<typeof ScrollView>>();
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<ScrollView ref={ref} />);
      });

      const innerView = ensureInstance(
        nullthrows(ref.current).getInnerViewRef(),
        ReactNativeElement,
      );
      expect(innerView.tagName).toBe('RN:View');
    });
  });
});

describe('onScroll', () => {
  it('delivers onScroll event', () => {
    const root = Fantom.createRoot();
    const scrollViewRef = createRef<HostInstance>();
    const onScroll = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          onScroll={event => {
            onScroll(event.nativeEvent);
          }}
          ref={scrollViewRef}
        />,
      );
    });

    Fantom.runOnUIThread(() => {
      Fantom.enqueueNativeEvent(
        scrollViewRef,
        'scroll',
        {
          contentOffset: {
            x: 0,
            y: 1,
          },
        },
        {
          isUnique: true,
        },
      );
    });

    Fantom.runWorkLoop();

    expect(onScroll).toHaveBeenCalledTimes(1);
    const [entry] = onScroll.mock.lastCall;
    expect(entry.contentOffset).toEqual({
      x: 0,
      y: 1,
    });
  });

  it('batches onScroll event per UI tick', () => {
    const root = Fantom.createRoot();
    const scrollViewRef = createRef<HostInstance>();
    const onScroll = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          onScroll={event => {
            onScroll(event.nativeEvent);
          }}
          ref={scrollViewRef}
        />,
      );
    });

    Fantom.runOnUIThread(() => {
      Fantom.enqueueNativeEvent(
        scrollViewRef,
        'scroll',
        {
          contentOffset: {
            x: 0,
            y: 1,
          },
        },
        {
          isUnique: true,
        },
      );
      Fantom.enqueueNativeEvent(
        scrollViewRef,
        'scroll',
        {
          contentOffset: {
            x: 0,
            y: 2,
          },
        },
        {
          isUnique: true,
        },
      );
    });

    Fantom.runWorkLoop();

    expect(onScroll).toHaveBeenCalledTimes(1);
    const [entry] = onScroll.mock.lastCall;
    expect(entry.contentOffset).toEqual({
      x: 0,
      y: 2,
    });
  });
});
