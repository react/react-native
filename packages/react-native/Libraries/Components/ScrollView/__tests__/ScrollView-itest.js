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

    it('returns persistentScrollbar to its default once the prop is removed', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<ScrollView persistentScrollbar={true} />);
      });

      expect(
        root.getRenderedOutput({props: ['persistentScrollbar']}).toJSX(),
      ).toEqual(
        <rn-scrollView persistentScrollbar="true">
          <rn-view />
        </rn-scrollView>,
      );

      Fantom.runTask(() => {
        root.render(<ScrollView />);
      });

      expect(
        root.getRenderedOutput({props: ['persistentScrollbar']}).toJSX(),
      ).toEqual(
        <rn-scrollView>
          <rn-view />
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

      expect(ref.mock.lastCall[0]).toBeInstanceOf(HTMLElement);

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

      expect(refA.mock.lastCall[0]).toBeInstanceOf(HTMLElement);

      Fantom.runTask(() => {
        root.render(<ScrollView innerViewRef={refB} />);
      });

      expect(refA.mock.lastCall[0]).toBe(null);
      expect(refB.mock.lastCall[0]).toBeInstanceOf(HTMLElement);
    });
  });

  describe('getInnerViewRef', () => {
    it('returns a host instance', () => {
      const ref = createRef<React.ElementRef<typeof ScrollView>>();
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<ScrollView ref={ref} />);
      });

      const innerView = nullthrows(nullthrows(ref.current).getInnerViewRef());
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

describe('horizontal ScrollView in RTL', () => {
  it('agrees on the scroll offset in onScroll, scrollLeft and child positions', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});
    const scrollViewRef = createRef<HostInstance>();
    const childRef = createRef<HostInstance>();
    const onScroll = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          horizontal={true}
          onScroll={event => {
            onScroll(event.nativeEvent);
          }}
          ref={scrollViewRef}
          style={{direction: 'rtl', height: 100, width: 100}}>
          <View style={{height: 100, width: 100}} />
          <View ref={childRef} style={{height: 100, width: 100}} />
          <View style={{height: 100, width: 100}} />
        </ScrollView>,
      );
    });

    Fantom.scrollTo(scrollViewRef, {x: 50, y: 0});

    const [entry] = onScroll.mock.lastCall;
    expect(entry.contentOffset).toEqual({x: 50, y: 0});
    expect(nullthrows(scrollViewRef.current).scrollLeft).toBe(50);
    expect(nullthrows(childRef.current).getBoundingClientRect().x).toBe(50);
  });
});
