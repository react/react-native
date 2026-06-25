/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PlatformTestComponentBaseProps} from '../PlatformTest/RNTesterPlatformTestTypes';
import type {HostInstance, PointerEvent} from 'react-native';

import RNTesterPlatformTest from '../PlatformTest/RNTesterPlatformTest';
import * as React from 'react';
import {useCallback, useRef} from 'react';
import {StyleSheet, View} from 'react-native';

function getNativeTagFromHostElement(elem: ?HostInstance | number): ?number {
  if (typeof elem === 'number') {
    return elem;
  }
  if (elem != null) {
    return elem.__nativeTag;
  }
  return undefined;
}

const styles = StyleSheet.create({
  outer: {
    padding: 40,
    height: 60,
    backgroundColor: 'blue',
  },
  inner: {
    padding: 40,
    height: 60,
    backgroundColor: 'green',
  },
  released: {
    padding: 40,
    height: 60,
    backgroundColor: 'yellow',
  },
});

// adapted from https://github.com/web-platform-tests/wpt/blob/master/uievents/order-of-events/mouse-events/mouseover-out.html
function PointerEventPointerOverOutTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const t = harness.useAsyncTest('PointerOver/Out events');

  const innerNativeTagRef = useRef(-1);
  const outerNativeTagRef = useRef(-1);

  const handleInnerRefCallback = useCallback((elem: null | HostInstance) => {
    const nativeTag = getNativeTagFromHostElement(elem);
    innerNativeTagRef.current = nativeTag != null ? nativeTag : -1;
  }, []);
  const handleOuterRefCallback = useCallback((elem: null | HostInstance) => {
    const nativeTag = getNativeTagFromHostElement(elem);
    outerNativeTagRef.current = nativeTag != null ? nativeTag : -1;
  }, []);

  const innerOverRef = useRef(0);
  const innerOutRef = useRef(0);

  const outerOwnOverRef = useRef(0);
  const outerOwnOutRef = useRef(0);
  const outerOverRef = useRef(0);
  const outerOutRef = useRef(0);

  const innerPointerOverHandler = useCallback(
    (e: PointerEvent) => {
      t.step(({assert_equals, assert_true}) => {
        assert_equals(
          innerOverRef.current,
          innerOutRef.current,
          'pointerover is received before pointerout',
        );
        switch (innerOverRef.current) {
          case 0: {
            assert_equals(
              outerOwnOverRef.current,
              1,
              'should have triggered a pointerover in the outer before',
            );
            break;
          }
          case 1: {
            assert_equals(
              outerOwnOverRef.current,
              1,
              'should have not triggered a pointerover in the outer before',
            );
            break;
          }
          default: {
            assert_true(false, 'should not get more than two mouseovers');
          }
        }
      });
      innerOverRef.current++;
    },
    [t],
  );
  const innerPointerOutHandler = useCallback(
    (e: PointerEvent) => {
      t.step(({assert_equals, assert_true}) => {
        assert_equals(
          innerOverRef.current,
          innerOutRef.current + 1,
          'pointerout is received after pointerover',
        );
        switch (innerOutRef.current) {
          case 0: {
            assert_equals(
              outerOwnOutRef.current,
              1,
              'pointerout should have been received in the parent when hovering over this element',
            );
            break;
          }
          case 1: {
            break;
          }
          default: {
            assert_true(false, 'should not get more than two pointerouts');
          }
        }
      });
      innerOutRef.current++;
    },
    [t],
  );

  const outerPointerOverHandler = useCallback(
    (e: PointerEvent) => {
      const eventElemTag = getNativeTagFromHostElement(e.target);
      t.step(({assert_equals}) => {
        if (eventElemTag === outerNativeTagRef.current) {
          assert_equals(
            outerOwnOverRef.current,
            outerOwnOutRef.current,
            'outer: pointerover is received before pointerout',
          );
          outerOwnOverRef.current++;
        } else {
          assert_equals(
            outerOverRef.current - outerOwnOverRef.current,
            innerOverRef.current - 1,
            'pointerover: should only receive this via bubbling',
          );
        }
      });
      outerOverRef.current++;
    },
    [t],
  );
  const outerPointerOutHandler = useCallback(
    (e: PointerEvent) => {
      const eventElemTag = getNativeTagFromHostElement(e.target);
      t.step(({assert_equals}) => {
        if (eventElemTag === outerNativeTagRef.current) {
          assert_equals(
            outerOwnOverRef.current,
            outerOwnOutRef.current + 1,
            'outer: pointerout is received after pointerover',
          );
          if (outerOwnOutRef.current === 1) {
            assert_equals(innerOutRef.current, 2, 'inner should be done now');
            t.done();
          }
          outerOwnOutRef.current++;
        } else {
          assert_equals(
            outerOutRef.current - outerOwnOutRef.current,
            innerOutRef.current - 1,
            'pointerout: should only receive this via bubbling',
          );
        }
      });
      outerOutRef.current++;
    },
    [t],
  );

  return (
    <>
      <View
        ref={handleOuterRefCallback}
        onPointerOver={outerPointerOverHandler}
        onPointerOut={outerPointerOutHandler}
        style={styles.outer}>
        <View
          ref={handleInnerRefCallback}
          onPointerOver={innerPointerOverHandler}
          onPointerOut={innerPointerOutHandler}
          style={styles.inner}
        />
      </View>
      <View style={styles.released} />
    </>
  );
}

type Props = Readonly<{}>;
export default function PointerEventPointerOverOut(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventPointerOverOutTestCase}
      description=""
      instructions={[
        'Move your mouse over the blue view, later over the green one, later over the yellow one.',
        'Move the mouse from the yellow view to the green one, later to the blue one, and later over this paragraph.',
      ]}
      title="PointerOver/PointerOut handling"
    />
  );
}
