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

import {DRIVERS} from './AnimatedFantomTestUtils';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Animated} from 'react-native';

// Renders `color` as a View's backgroundColor so it can be observed through the
// public rendered output rather than private state.
function renderColor(color: Animated.Color): Fantom.Root {
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(
      <Animated.View style={{width: 10, height: 10, backgroundColor: color}} />,
    );
  });
  return root;
}

function mountedBackgroundColor(color: Animated.Color): string {
  return renderColor(color)
    .getRenderedOutput({props: ['backgroundColor']})
    .toJSONObject().props.backgroundColor;
}

describe('Animated.Color', () => {
  it('defaults to opaque black', () => {
    expect(mountedBackgroundColor(new Animated.Color())).toBe(
      'rgba(0, 0, 0, 1)',
    );
  });

  it('parses an rgba() string', () => {
    expect(
      mountedBackgroundColor(new Animated.Color('rgba(255, 128, 0, 1)')),
    ).toBe('rgba(255, 128, 0, 1)');
  });

  it('parses a hex string', () => {
    expect(mountedBackgroundColor(new Animated.Color('#ff0000'))).toBe(
      'rgba(255, 0, 0, 1)',
    );
  });

  it('accepts an rgba object', () => {
    // The rendered color quantizes alpha to 8 bits (0.5 -> 128/255).
    expect(
      mountedBackgroundColor(new Animated.Color({r: 10, g: 20, b: 30, a: 0.5})),
    ).toBe('rgba(10, 20, 30, 0.501961)');
  });

  it('accepts individual AnimatedValues for each channel', () => {
    expect(
      mountedBackgroundColor(
        new Animated.Color({
          r: new Animated.Value(1),
          g: new Animated.Value(2),
          b: new Animated.Value(3),
          a: new Animated.Value(1),
        }),
      ),
    ).toBe('rgba(1, 2, 3, 1)');
  });

  it('updates all channels via setValue', () => {
    const color = new Animated.Color('rgba(0, 0, 0, 1)');
    const root = renderColor(color);

    Fantom.runTask(() => {
      color.setValue({r: 5, g: 6, b: 7, a: 1});
    });

    expect(
      root.getRenderedOutput({props: ['backgroundColor']}).toJSX(),
    ).toEqual(<rn-view backgroundColor="rgba(5, 6, 7, 1)" />);
  });

  it('applies an offset on top of the base value', () => {
    const color = new Animated.Color({r: 10, g: 10, b: 10, a: 1});
    const root = renderColor(color);

    // `setOffset` on its own does not flush to a connected view (unlike the
    // native driver, which does); the following value update flushes the
    // composed color, which includes the offset (base 20 + offset 5).
    Fantom.runTask(() => {
      color.setOffset({r: 5, g: 5, b: 5, a: 0});
      color.setValue({r: 20, g: 20, b: 20, a: 1});
    });

    expect(
      root.getRenderedOutput({props: ['backgroundColor']}).toJSX(),
    ).toEqual(<rn-view backgroundColor="rgba(25, 25, 25, 1)" />);
  });

  it('flattenOffset and extractOffset preserve the composed value', () => {
    const color = new Animated.Color({r: 10, g: 10, b: 10, a: 1});
    renderColor(color);

    let afterFlatten: string = '';
    let afterExtract: string = '';
    Fantom.runTask(() => {
      color.setOffset({r: 5, g: 5, b: 5, a: 0});
      // Merges the offset (5) into the base (10) -> base 15, offset 0.
      color.flattenOffset();
      color.stopAnimation(value => {
        afterFlatten = String(value);
      });
      // Moves the base (15) into the offset -> base 0, offset 15.
      color.extractOffset();
      color.stopAnimation(value => {
        afterExtract = String(value);
      });
    });

    expect(afterFlatten).toBe('rgba(15, 15, 15, 1)');
    expect(afterExtract).toBe('rgba(15, 15, 15, 1)');
  });

  it('resetAnimation restores the value and reports it to the callback', () => {
    const color = new Animated.Color('rgba(1, 2, 3, 1)');
    renderColor(color);

    let reported: string = '';
    Fantom.runTask(() => {
      color.resetAnimation(value => {
        reported = String(value);
      });
    });

    expect(reported).toBe('rgba(1, 2, 3, 1)');
  });

  it('updates a native-driven color via setValue', () => {
    const color = new Animated.Color('rgba(0, 0, 0, 1)', {
      useNativeDriver: true,
    });
    renderColor(color);

    // A native-driven color applies via direct manipulation rather than the
    // committed tree, so observe the value through the animation callback.
    let reported: string = '';
    Fantom.runTask(() => {
      color.setValue({r: 5, g: 6, b: 7, a: 1});
      color.stopAnimation(value => {
        reported = String(value);
      });
    });
    Fantom.unstable_produceFramesForDuration(16);
    Fantom.runWorkLoop();

    expect(reported).toBe('rgba(5, 6, 7, 1)');
  });

  for (const {name, useNativeDriver} of DRIVERS) {
    it(`animates to a target color (${name})`, () => {
      const color = new Animated.Color('rgba(255, 0, 0, 1)');
      const root = renderColor(color);

      expect(
        root.getRenderedOutput({props: ['backgroundColor']}).toJSX(),
      ).toEqual(<rn-view backgroundColor="rgba(255, 0, 0, 1)" />);

      let finished = false;
      Fantom.runTask(() => {
        Animated.timing(color, {
          toValue: {r: 0, g: 0, b: 255, a: 1},
          duration: 100,
          useNativeDriver,
        }).start(result => {
          finished = result.finished;
        });
      });

      Fantom.unstable_produceFramesForDuration(200);
      Fantom.runWorkLoop();

      // The final driven color is flushed to the committed tree and observed
      // through the public rendered output.
      expect(finished).toBe(true);
      expect(
        root.getRenderedOutput({props: ['backgroundColor']}).toJSX(),
      ).toEqual(<rn-view backgroundColor="rgba(0, 0, 255, 1)" />);
    });
  }
});
