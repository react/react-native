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

import View from '../../Components/View/View';
import AppState, {type AppStateStatus} from '../AppState';
import useAppState from '../useAppState';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('useAppState', () => {
  const originalAddEventListener = AppState.addEventListener;
  const originalCurrentState = AppState.currentState;

  let observed: AppStateStatus | void;

  afterEach(() => {
    // $FlowFixMe[cannot-write]
    AppState.addEventListener = originalAddEventListener;
    AppState.currentState = originalCurrentState;
    observed = undefined;
  });

  function mockSubscription() {
    const handlers: Array<(AppStateStatus) => void> = [];
    const remove = jest.fn();
    const addEventListener = jest.fn(
      (type: string, handler: AppStateStatus => void) => {
        handlers.push(handler);
        return {remove};
      },
    );
    // $FlowFixMe[cannot-write]
    AppState.addEventListener = addEventListener;
    return {addEventListener, handlers, remove};
  }

  function renderHook() {
    function TestComponent() {
      observed = useAppState();
      return <View />;
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<TestComponent />);
    });
    return root;
  }

  for (const state of ['active', 'background', 'inactive', 'extension']) {
    it(`returns '${state}' when AppState reports '${state}'`, () => {
      mockSubscription();
      AppState.currentState = state;

      const root = renderHook();

      expect(observed).toBe(state);

      root.destroy();
    });
  }

  it("returns 'unknown' when the current state is not yet known", () => {
    mockSubscription();
    AppState.currentState = null;

    const root = renderHook();

    expect(observed).toBe('unknown');

    root.destroy();
  });

  it('subscribes to changes and re-renders with the new state', () => {
    const {addEventListener, handlers} = mockSubscription();
    AppState.currentState = 'active';

    const root = renderHook();

    expect(addEventListener.mock.calls.length).toBe(1);
    expect(addEventListener.mock.calls[0][0]).toBe('change');
    expect(typeof addEventListener.mock.calls[0][1]).toBe('function');
    expect(observed).toBe('active');

    AppState.currentState = 'background';
    Fantom.runTask(() => {
      handlers.forEach(handler => handler('background'));
    });
    expect(observed).toBe('background');

    root.destroy();
  });

  it('unsubscribes when the component unmounts', () => {
    const {remove} = mockSubscription();
    AppState.currentState = 'active';

    const root = renderHook();
    expect(observed).toBe('active');

    root.destroy();
    Fantom.runWorkLoop();

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('throws when called outside of a component', () => {
    let error;
    try {
      // $FlowFixMe[react-rule-hook]
      useAppState();
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(Error);
  });
});
