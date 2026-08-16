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

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import {createRef} from 'react';
import {StyleSheet, View} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

// Orientation is derived natively from the surface's viewport (landscape when it
// is wider than tall), so the viewport passed to `createRoot` selects which
// branch matches. (Re-resolving on a post-mount rotation is covered by the C++
// commit-hook unit test; Fantom has no post-mount viewport resize.)
const portraitRoot = () =>
  Fantom.createRoot({viewportWidth: 390, viewportHeight: 844});
const landscapeRoot = () =>
  Fantom.createRoot({viewportWidth: 844, viewportHeight: 390});

const styles = StyleSheet.create({
  portraitBox: {
    height: 50,
    // Conditional values are not typed yet, hence the cast.
    width: {default: 120, '@media (orientation: portrait)': 300} as $FlowFixMe,
  },
  landscapeBox: {
    height: 50,
    width: {default: 120, '@media (orientation: landscape)': 300} as $FlowFixMe,
  },
});

function elementOf(ref: {current: HostInstance | null}): ReactNativeElement {
  return ensureInstance(ref.current, ReactNativeElement);
}

describe('StyleSheet conditional (media-query) values', () => {
  it('resolves a matching orientation condition natively at mount', () => {
    const ref = createRef<HostInstance>();
    const root = portraitRoot();
    Fantom.runTask(() => {
      root.render(<View ref={ref} style={styles.portraitBox} />);
    });
    expect(elementOf(ref).getBoundingClientRect().width).toBe(300);
  });

  it('resolves against a landscape viewport', () => {
    const ref = createRef<HostInstance>();
    const root = landscapeRoot();
    Fantom.runTask(() => {
      root.render(<View ref={ref} style={styles.landscapeBox} />);
    });
    expect(elementOf(ref).getBoundingClientRect().width).toBe(300);
  });

  it('uses the default value when the condition does not match', () => {
    const ref = createRef<HostInstance>();
    const root = portraitRoot();
    Fantom.runTask(() => {
      root.render(<View ref={ref} style={styles.landscapeBox} />);
    });
    expect(elementOf(ref).getBoundingClientRect().width).toBe(120);
  });

  it('resolves a conditional value nested under plain ancestor views', () => {
    const ref = createRef<HostInstance>();
    const root = portraitRoot();
    Fantom.runTask(() => {
      root.render(
        <View>
          <View>
            <View ref={ref} style={styles.portraitBox} />
          </View>
        </View>,
      );
    });
    // The conditional node is two plain wrappers deep, so it only resolves if
    // the `HasStyleConditionsInSubtree` trait propagated up through the plain
    // ancestors -- otherwise the commit hook prunes their subtree and the box
    // would silently render at its default (120).
    expect(elementOf(ref).getBoundingClientRect().width).toBe(300);
  });

  it('keeps the resolved value across an unrelated re-render', () => {
    const ref = createRef<HostInstance>();
    const root = portraitRoot();
    Fantom.runTask(() => {
      root.render(<View ref={ref} style={styles.portraitBox} />);
    });
    expect(elementOf(ref).getBoundingClientRect().width).toBe(300);

    // A re-render that only changes height must not lose the resolved width;
    // the commit hook re-applies the condition on every commit.
    Fantom.runTask(() => {
      root.render(
        <View ref={ref} style={[styles.portraitBox, {height: 80}]} />,
      );
    });
    expect(elementOf(ref).getBoundingClientRect().width).toBe(300);
    expect(elementOf(ref).getBoundingClientRect().height).toBe(80);
  });

  it('reverts a patched value to its default when the conditional is removed', () => {
    const ref = createRef<HostInstance>();
    const root = portraitRoot();
    Fantom.runTask(() => {
      root.render(<View ref={ref} style={styles.portraitBox} />);
    });
    expect(elementOf(ref).getBoundingClientRect().width).toBe(300); // patched

    // Re-render with a plain width equal to the default. JS sees width
    // unchanged (120 -> 120), so it only emits `styleConditions: null`; native
    // must re-base off the unpatched props to drop the patched 300 back to 120.
    // Without re-basing this would stay stuck at 300.
    Fantom.runTask(() => {
      root.render(<View ref={ref} style={{height: 50, width: 120}} />);
    });
    expect(elementOf(ref).getBoundingClientRect().width).toBe(120);
  });

  it('unmounts a conditional node cleanly', () => {
    const ref = createRef<HostInstance>();
    const root = portraitRoot();
    Fantom.runTask(() => {
      root.render(<View ref={ref} style={styles.portraitBox} />);
    });
    expect(ref.current).not.toBe(null);

    Fantom.runTask(() => {
      root.render(<></>);
    });
    // Ref cleared -> the conditional node tore down without throwing.
    expect(ref.current).toBe(null);
  });
});
