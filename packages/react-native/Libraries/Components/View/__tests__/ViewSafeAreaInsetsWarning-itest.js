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

import type {HighResTimeStampMock} from '@react-native/fantom/src/HighResTimeStampMock';
import type {HostInstance} from 'react-native/src/private/types/HostInstance';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';

const INSETS = {top: 44, right: 0, bottom: 34, left: 0};
const FRAME = {x: 0, y: 0, width: 390, height: 844};

function renderObservingView(): {current: HostInstance | null} {
  const nodeRef = createRef<HostInstance>();
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(
      <View ref={nodeRef} experimental_onSafeAreaInsetsChange={() => {}} />,
    );
  });
  return nodeRef;
}

function dispatchInsetsChange(nodeRef: {current: HostInstance | null}) {
  Fantom.dispatchNativeEvent(nodeRef, 'safeAreaInsetsChange', {
    insets: INSETS,
    frame: FRAME,
  });
}

describe('experimental_onSafeAreaInsetsChange warning', () => {
  const originalConsoleWarn = console.warn;
  let mockConsoleWarn: JestMockFn<ReadonlyArray<unknown>, void>;
  let mockClock: ?HighResTimeStampMock;

  beforeEach(() => {
    mockConsoleWarn = jest.fn();
    // $FlowFixMe[cannot-write]
    console.warn = mockConsoleWarn;
    mockClock = Fantom.installHighResTimeStampMock();
  });

  afterEach(() => {
    // $FlowFixMe[cannot-write]
    console.warn = originalConsoleWarn;
    mockClock?.uninstall();
    mockClock = null;
  });

  it('stays silent while the insets change at a plausible rate', () => {
    const nodeRef = renderObservingView();

    // A rotation, a keyboard, a split view: a handful of changes, spread out.
    for (let i = 0; i < 20; i++) {
      dispatchInsetsChange(nodeRef);
      mockClock?.advanceTimeBy(200);
    }

    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  it('warns once when a single view loops within the window', () => {
    const nodeRef = renderObservingView();

    for (let i = 0; i < 11; i++) {
      dispatchInsetsChange(nodeRef);
      mockClock?.advanceTimeBy(16);
    }

    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    expect(mockConsoleWarn.mock.lastCall[0]).toContain(
      '`experimental_onSafeAreaInsetsChange` fired more than 10 times in 1000ms',
    );

    // The loop keeps running; the warning does not.
    for (let i = 0; i < 50; i++) {
      dispatchInsetsChange(nodeRef);
      mockClock?.advanceTimeBy(16);
    }

    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
  });

  it('counts each view separately', () => {
    const nodeRefA = renderObservingView();
    const nodeRefB = renderObservingView();

    for (let i = 0; i < 10; i++) {
      dispatchInsetsChange(nodeRefA);
      dispatchInsetsChange(nodeRefB);
      mockClock?.advanceTimeBy(16);
    }

    expect(mockConsoleWarn).not.toHaveBeenCalled();

    dispatchInsetsChange(nodeRefA);

    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
  });

  it('still delivers the event to the handler', () => {
    const nodeRef = createRef<HostInstance>();
    const onSafeAreaInsetsChange = jest.fn();
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          ref={nodeRef}
          experimental_onSafeAreaInsetsChange={event => {
            onSafeAreaInsetsChange(event.nativeEvent);
          }}
        />,
      );
    });

    dispatchInsetsChange(nodeRef);

    expect(onSafeAreaInsetsChange).toHaveBeenCalledTimes(1);
    expect(onSafeAreaInsetsChange.mock.lastCall[0].insets).toEqual(INSETS);
  });
});
