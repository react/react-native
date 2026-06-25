/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const StatusBar = require('../StatusBar').default;
const {create} = require('@react-native/jest-preset/jest/renderer');
const React = require('react');

describe('StatusBar', () => {
  it('renders the statusbar', async () => {
    const component = await create(<StatusBar />);
    expect(component).not.toBeNull();
  });
  it('renders the statusbar animated enabled', async () => {
    const component = await create(<StatusBar animated={true} />);
    expect(component.toTree()?.props.animated).toBe(true);
  });
  it('renders the statusbar with fade transition on hide', async () => {
    const component = await create(<StatusBar hidden={true} />);
    expect(component.toTree()?.props.hidden).toBe(true);
  });
  it('renders the statusbar with a background color', async () => {
    const component = await create(<StatusBar backgroundColor={'#fff'} />);
    expect(component.toTree()?.props.backgroundColor).toBe('#fff');
    expect(
      // $FlowFixMe[prop-missing]
      component.toTree()?.type._defaultProps.backgroundColor.animated,
    ).toBe(false);
  });
  it('renders the statusbar with default barStyle', async () => {
    const component = await create(<StatusBar />);
    StatusBar.setBarStyle('default');
    // $FlowFixMe[prop-missing]
    expect(component.toTree()?.type._defaultProps.barStyle.value).toBe(
      'default',
    );
    // $FlowFixMe[prop-missing]
    expect(component.toTree()?.type._defaultProps.barStyle.animated).toBe(
      false,
    );
  });
  it('resolves auto barStyle against the current color scheme', () => {
    const Appearance = require('../../../Utilities/Appearance');
    const Platform = require('../../../Utilities/Platform').default;

    const nativeStatusBarManager =
      Platform.OS === 'ios'
        ? require('../NativeStatusBarManagerIOS').default
        : require('../NativeStatusBarManagerAndroid').default;

    const appearanceSpy = jest.spyOn(Appearance, 'getColorScheme');
    const setStyleSpy = jest.spyOn(nativeStatusBarManager, 'setStyle');

    appearanceSpy.mockReturnValue('light');
    setStyleSpy.mockClear();

    StatusBar.setBarStyle('auto');
    expect(setStyleSpy.mock.calls[0][0]).toBe('dark-content');

    appearanceSpy.mockReturnValue('dark');
    setStyleSpy.mockClear();

    StatusBar.setBarStyle('auto');
    expect(setStyleSpy.mock.calls[0][0]).toBe('light-content');

    appearanceSpy.mockRestore();
    setStyleSpy.mockRestore();
  });
  it('renders the statusbar but should not be visible', async () => {
    const component = await create(<StatusBar hidden={true} />);
    expect(component.toTree()?.props.hidden).toBe(true);
    // $FlowFixMe[prop-missing]
    expect(component.toTree()?.type._defaultProps.hidden.animated).toBe(false);
    // $FlowFixMe[prop-missing]
    expect(component.toTree()?.type._defaultProps.hidden.transition).toBe(
      'fade',
    );
  });
  it('renders the statusbar with networkActivityIndicatorVisible true', async () => {
    const component = await create(
      <StatusBar networkActivityIndicatorVisible={true} />,
    );
    expect(component.toTree()?.props.networkActivityIndicatorVisible).toBe(
      true,
    );
  });
});
