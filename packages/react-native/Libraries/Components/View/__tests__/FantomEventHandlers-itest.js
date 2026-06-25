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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {ScrollView, View} from 'react-native';

describe('Fantom.getDefinedEventHandlers', () => {
  it('returns event handler names registered on a view', () => {
    const root = Fantom.createRoot();
    const ref = createRef<React.ElementRef<typeof View>>();

    Fantom.runTask(() => {
      root.render(
        <View ref={ref} onLayout={() => {}} onTouchStart={() => {}} />,
      );
    });

    const handlers = Fantom.getDefinedEventHandlers(ref);
    expect(handlers).toContain('onLayout');
    expect(handlers).toContain('onTouchStart');
  });

  it('returns an empty array when no event handlers are registered', () => {
    const root = Fantom.createRoot();
    const ref = createRef<React.ElementRef<typeof View>>();

    Fantom.runTask(() => {
      root.render(<View ref={ref} />);
    });

    expect(Fantom.getDefinedEventHandlers(ref)).toEqual([]);
  });

  it('returns multiple event handler names when multiple are registered', () => {
    const root = Fantom.createRoot();
    const ref = createRef<React.ElementRef<typeof View>>();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          onLayout={() => {}}
          onTouchStart={() => {}}
          onTouchEnd={() => {}}
          onTouchCancel={() => {}}
          onClick={() => {}}
        />,
      );
    });

    const handlers = Fantom.getDefinedEventHandlers(ref);
    expect(handlers).toContain('onLayout');
    expect(handlers).toContain('onTouchStart');
    expect(handlers).toContain('onTouchEnd');
    expect(handlers).toContain('onTouchCancel');
    expect(handlers).toContain('onClick');
  });

  it('detects onScroll on a ScrollView', () => {
    const root = Fantom.createRoot();
    const ref = createRef<React.ElementRef<typeof ScrollView>>();

    Fantom.runTask(() => {
      root.render(<ScrollView ref={ref} onScroll={() => {}} />);
    });

    expect(Fantom.getDefinedEventHandlers(ref)).toContain('onScroll');
  });
});
