/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Switch} from 'react-native';

function render(element: React.MixedElement): Fantom.Root {
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(element);
  });
  return root;
}

describe('Switch', () => {
  it('renders the native switch', () => {
    const root = render(<Switch value={true} />);

    expect(
      root.getRenderedOutput({props: ['accessibilityRole']}).toJSX(),
    ).toEqual(<rn-androidSwitch accessibilityRole="switch" />);
  });

  it('reflects the disabled state via accessibilityState', () => {
    const root = render(<Switch value={false} disabled={true} />);

    expect(
      root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
    ).toEqual(
      <rn-androidSwitch accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
    );
  });

  it('renders with track and thumb color props applied', () => {
    // Exercises the color-resolution path; the mounted switch still renders as
    // the native switch host.
    const root = render(
      <Switch
        value={true}
        thumbColor="#ff0000"
        trackColor={{true: '#00ff00', false: '#0000ff'}}
        ios_backgroundColor="#cccccc"
      />,
    );

    expect(
      root.getRenderedOutput({props: ['accessibilityRole']}).toJSX(),
    ).toEqual(<rn-androidSwitch accessibilityRole="switch" />);
  });

  it('fires onValueChange and onChange when the native switch toggles', () => {
    const onValueChange = jest.fn();
    const onChange = jest.fn();
    const ref = createRef<HostInstance>();
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <Switch
          ref={ref}
          value={false}
          onValueChange={onValueChange}
          onChange={onChange}
        />,
      );
    });

    Fantom.dispatchNativeEvent(nullthrows(ref.current), 'change', {
      value: true,
    });

    expect(onValueChange).toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenCalled();
  });
});
