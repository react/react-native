/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ReactTestRenderer} from 'react-test-renderer';

import Dimensions from '../Dimensions';
import useScreenDimensions from '../useScreenDimensions';
import {create, unmount} from '@react-native/jest-preset/jest/renderer';
import * as React from 'react';
import {act} from 'react-test-renderer';

describe('useScreenDimensions', () => {
  const window = {width: 320, height: 480, scale: 2, fontScale: 1};
  const screen = {width: 400, height: 800, scale: 2, fontScale: 1};
  let renderer: ?ReactTestRenderer;
  let observed;
  let renderCount;
  let originalDimensions;

  function TestComponent() {
    observed = useScreenDimensions();
    renderCount++;
    return null;
  }

  beforeEach(() => {
    originalDimensions = {
      window: Dimensions.get('window'),
      screen: Dimensions.get('screen'),
    };
    Dimensions.set({window, screen});
    renderCount = 0;
  });

  afterEach(async () => {
    if (renderer != null) {
      await unmount(renderer);
      renderer = null;
    }
    jest.restoreAllMocks();
    Dimensions.set(originalDimensions);
  });

  it('returns screen metrics rather than window metrics', async () => {
    renderer = await create(<TestComponent />);
    expect(observed).toEqual(screen);
    expect(observed).not.toEqual(window);
  });

  it.each([
    ['width', 800],
    ['height', 400],
    ['scale', 3],
    ['fontScale', 1.5],
  ])('updates when %s changes', async (property, value) => {
    renderer = await create(<TestComponent />);
    const nextScreen = {...screen, [property]: value};
    await act(() => {
      Dimensions.set({window, screen: nextScreen});
    });
    expect(observed).toEqual(nextScreen);
  });

  it('does not render again for window-only changes or identical screen metrics', async () => {
    renderer = await create(<TestComponent />);
    const previousRenderCount = renderCount;
    const previousDimensions = observed;
    await act(() => {
      Dimensions.set({window: {...window, width: 200}, screen: {...screen}});
    });
    expect(renderCount).toBe(previousRenderCount);
    expect(observed).toBe(previousDimensions);
  });

  it('catches changes between render and subscription', async () => {
    const nextScreen = {...screen, width: 800, height: 400};
    function UpdateBeforeSubscription() {
      React.useLayoutEffect(() => {
        Dimensions.set({window, screen: nextScreen});
      }, []);
      return <TestComponent />;
    }
    renderer = await create(<UpdateBeforeSubscription />);
    expect(observed).toEqual(nextScreen);
  });

  it('removes its subscription on unmount', async () => {
    const addEventListener = jest.spyOn(Dimensions, 'addEventListener');
    renderer = await create(<TestComponent />);
    const subscription = addEventListener.mock.results[0].value;
    const remove = jest.spyOn(subscription, 'remove');
    await unmount(renderer);
    renderer = null;
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
