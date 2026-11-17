/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @fantom_flags enableCppPropsIteratorSetter:*
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {ViewStyleProp} from '../StyleSheet';
import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';

const DARK = '@media (prefers-color-scheme: dark)';
const LIGHT = '@media (prefers-color-scheme: light)';

const WHITE = 'rgba(255, 255, 255, 1)';
const BLACK = 'rgba(0, 0, 0, 1)';
const NAVY = 'rgba(0, 0, 128, 1)';
const RED = 'rgba(255, 0, 0, 1)';

// Conditional values are not in the style types yet.
function conditional(
  defaultValue: unknown,
  query: string,
  value: unknown,
): $FlowFixMe {
  const result: {[key: string]: unknown} = {default: defaultValue};
  result[query] = value;
  return result;
}

const whiteOrBlack = conditional('white', DARK, 'black');

function render(root: Fantom.Root, element: React.MixedElement) {
  Fantom.runTask(() => {
    root.render(element);
  });
}

function output(root: Fantom.Root): React.Node {
  return root
    .getRenderedOutput({props: ['backgroundColor', 'opacity']})
    .toJSX();
}

describe('conditional values', () => {
  afterEach(() => {
    Fantom.setColorScheme('light');
  });

  it('renders the default in light mode', () => {
    const root = Fantom.createRoot();
    render(root, <View style={{backgroundColor: whiteOrBlack}} />);
    expect(output(root)).toEqual(<rn-view backgroundColor={WHITE} />);
  });

  it('renders the matching value in dark mode', () => {
    Fantom.setColorScheme('dark');
    const root = Fantom.createRoot();
    render(root, <View style={{backgroundColor: whiteOrBlack}} />);
    expect(output(root)).toEqual(<rn-view backgroundColor={BLACK} />);
  });

  it('renders the default when no condition matches', () => {
    Fantom.setColorScheme('dark');
    const root = Fantom.createRoot();
    render(
      root,
      <View style={{backgroundColor: conditional('red', LIGHT, 'white')}} />,
    );
    expect(output(root)).toEqual(<rn-view backgroundColor={RED} />);
  });

  it('a later plain value in the style array wins', () => {
    Fantom.setColorScheme('dark');
    const root = Fantom.createRoot();
    // The payload keeps the flag without a conditional value.
    render(
      root,
      <View
        style={[{backgroundColor: whiteOrBlack}, {backgroundColor: 'red'}]}
      />,
    );
    expect(output(root)).toEqual(<rn-view backgroundColor={RED} />);
  });

  it('keeps the matching value when another prop changes', () => {
    Fantom.setColorScheme('dark');
    const root = Fantom.createRoot();
    render(root, <View style={{backgroundColor: whiteOrBlack, opacity: 1}} />);
    render(
      root,
      <View style={{backgroundColor: whiteOrBlack, opacity: 0.5}} />,
    );
    expect(output(root)).toEqual(
      <rn-view backgroundColor={BLACK} opacity="0.5" />,
    );
  });

  it('updates the value when a condition changes', () => {
    Fantom.setColorScheme('dark');
    const root = Fantom.createRoot();
    render(root, <View style={{backgroundColor: whiteOrBlack}} />);
    render(
      root,
      <View style={{backgroundColor: conditional('white', DARK, 'navy')}} />,
    );
    expect(output(root)).toEqual(<rn-view backgroundColor={NAVY} />);
  });

  it('keeps a condition when another prop becomes conditional', () => {
    Fantom.setColorScheme('dark');
    const root = Fantom.createRoot();
    render(root, <View style={{backgroundColor: whiteOrBlack}} />);
    render(
      root,
      <View
        style={{
          backgroundColor: whiteOrBlack,
          opacity: conditional(1, DARK, 0.5),
        }}
      />,
    );
    // A later update keeps both conditions.
    render(
      root,
      <View
        style={{
          backgroundColor: whiteOrBlack,
          opacity: conditional(1, DARK, 0.5),
          borderWidth: 1,
        }}
      />,
    );
    expect(output(root)).toEqual(
      <rn-view backgroundColor={BLACK} opacity="0.5" />,
    );
  });

  it('removes the condition when the value becomes plain', () => {
    Fantom.setColorScheme('dark');
    const root = Fantom.createRoot();
    render(root, <View style={{backgroundColor: whiteOrBlack}} />);
    render(root, <View style={{backgroundColor: 'red'}} />);
    expect(output(root)).toEqual(<rn-view backgroundColor={RED} />);

    // The removed condition does not come back on a later update.
    render(root, <View style={{backgroundColor: 'red', opacity: 0.5}} />);
    expect(output(root)).toEqual(
      <rn-view backgroundColor={RED} opacity="0.5" />,
    );
  });

  it('resets the value when the style is removed', () => {
    Fantom.setColorScheme('dark');
    const root = Fantom.createRoot();
    render(root, <View style={{backgroundColor: whiteOrBlack}} />);
    render(root, <View collapsable={false} style={{opacity: 0.5}} />);
    expect(output(root)).toEqual(<rn-view opacity="0.5" />);
  });

  it('uses the color scheme when the props are set', () => {
    const root = Fantom.createRoot();
    render(
      root,
      <View key="a" style={{backgroundColor: whiteOrBlack, opacity: 1}} />,
    );

    Fantom.setColorScheme('dark');

    // Rendered views keep their values until their conditions are resolved
    // again.
    render(
      root,
      <View key="a" style={{backgroundColor: whiteOrBlack, opacity: 0.5}} />,
    );
    expect(output(root)).toEqual(
      <rn-view backgroundColor={WHITE} opacity="0.5" />,
    );

    // A new view uses the new color scheme.
    render(
      root,
      <View key="b" style={{backgroundColor: whiteOrBlack, opacity: 0.5}} />,
    );
    expect(output(root)).toEqual(
      <rn-view backgroundColor={BLACK} opacity="0.5" />,
    );
  });

  it('a changed conditional value uses the current color scheme', () => {
    const root = Fantom.createRoot();
    render(root, <View style={{backgroundColor: whiteOrBlack}} />);
    expect(output(root)).toEqual(<rn-view backgroundColor={WHITE} />);

    Fantom.setColorScheme('dark');
    render(
      root,
      <View style={{backgroundColor: conditional('white', DARK, 'navy')}} />,
    );
    expect(output(root)).toEqual(<rn-view backgroundColor={NAVY} />);
  });

  it('resolves conditions set with setNativeProps', () => {
    Fantom.setColorScheme('dark');
    const root = Fantom.createRoot();
    const ref = createRef<HostInstance>();
    const childRef = createRef<HostInstance>();
    const renderWithChild = (opacity: number) =>
      render(
        root,
        <View ref={ref} collapsable={false} style={{opacity}}>
          <View ref={childRef} collapsable={false} />
        </View>,
      );
    renderWithChild(1);

    Fantom.runTask(() => {
      nullthrows(ref.current).setNativeProps({
        style: {backgroundColor: whiteOrBlack},
      });
    });
    expect(output(root)).toEqual(
      <rn-view backgroundColor={BLACK}>
        <rn-view />
      </rn-view>,
    );

    // A React update of the view merges the `setNativeProps` props into it.
    renderWithChild(0.5);
    expect(output(root)).toEqual(
      <rn-view backgroundColor={BLACK} opacity="0.5">
        <rn-view />
      </rn-view>,
    );

    // A change of the child clones the view without new props. That clone
    // applies the `setNativeProps` props again, with an empty
    // `ContextContainer`.
    Fantom.runTask(() => {
      nullthrows(childRef.current).setNativeProps({style: {opacity: 0.25}});
    });
    expect(output(root)).toEqual(
      <rn-view backgroundColor={BLACK} opacity="0.5">
        <rn-view opacity="0.25" />
      </rn-view>,
    );
  });

  describe('with setNativeProps', () => {
    let root: Fantom.Root;
    const ref = createRef<HostInstance>();
    const childRef = createRef<HostInstance>();

    function renderView(style: ViewStyleProp) {
      render(
        root,
        <View ref={ref} collapsable={false} style={style}>
          <View ref={childRef} collapsable={false} />
        </View>,
      );
    }

    function setNativeStyle(style: {...}) {
      Fantom.runTask(() => {
        nullthrows(ref.current).setNativeProps({style});
      });
    }

    // Clones the view without new props, which applies the `setNativeProps`
    // props again.
    function changeChild() {
      Fantom.runTask(() => {
        nullthrows(childRef.current).setNativeProps({style: {opacity: 0.25}});
      });
    }

    function parentOutput(): React.Node {
      return root
        .getRenderedOutput({props: ['backgroundColor', 'opacity']})
        .toJSX();
    }

    beforeEach(() => {
      Fantom.setColorScheme('dark');
      root = Fantom.createRoot();
      renderView({opacity: 1});
    });

    it('keeps the conditions of earlier calls', () => {
      setNativeStyle({backgroundColor: whiteOrBlack});
      setNativeStyle({opacity: conditional(1, DARK, 0.5)});
      changeChild();
      expect(parentOutput()).toEqual(
        <rn-view backgroundColor={BLACK} opacity="0.5">
          <rn-view opacity="0.25" />
        </rn-view>,
      );
    });

    it('a later plain value removes the condition', () => {
      setNativeStyle({backgroundColor: whiteOrBlack});
      setNativeStyle({backgroundColor: 'red'});
      changeChild();
      expect(parentOutput()).toEqual(
        <rn-view backgroundColor={RED}>
          <rn-view opacity="0.25" />
        </rn-view>,
      );
    });

    it('keeps the condition when React adds another condition', () => {
      setNativeStyle({backgroundColor: whiteOrBlack});
      renderView({opacity: conditional(1, DARK, 0.5)});
      expect(parentOutput()).toEqual(
        <rn-view backgroundColor={BLACK} opacity="0.5">
          <rn-view />
        </rn-view>,
      );
      changeChild();
      expect(parentOutput()).toEqual(
        <rn-view backgroundColor={BLACK} opacity="0.5">
          <rn-view opacity="0.25" />
        </rn-view>,
      );
    });

    it('keeps a condition from React over a plain native value', () => {
      // Like a JS-driven animation, which uses `setNativeProps`.
      setNativeStyle({backgroundColor: 'red'});
      renderView({opacity: 1, backgroundColor: whiteOrBlack});
      changeChild();
      expect(parentOutput()).toEqual(
        <rn-view backgroundColor={BLACK}>
          <rn-view opacity="0.25" />
        </rn-view>,
      );
    });

    it('a plain value from React replaces the condition', () => {
      setNativeStyle({backgroundColor: whiteOrBlack});
      renderView({opacity: 1, backgroundColor: 'red'});
      changeChild();
      expect(parentOutput()).toEqual(
        <rn-view backgroundColor={RED}>
          <rn-view opacity="0.25" />
        </rn-view>,
      );
    });
  });
});
