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

import type {Root} from '@react-native/fantom';

import {
  AbsolutePositionScene,
  OverflowScene,
  StackingScene,
  TransformScene,
} from './fixtures/RenderingEdgeCases';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

let root: Root;

beforeEach(() => {
  root = Fantom.createRoot();
});

afterEach(() => {
  root.destroy();
});

describe('Fantom rendering edge cases', () => {
  it('preserves sibling z-index order and nested stacking after updates', () => {
    Fantom.runTask(() => root.render(<StackingScene zIndex={2} />));
    expect(root.takeScreenshot()).toMatchSnapshot();
    Fantom.runTask(() => root.render(<StackingScene zIndex={-3} />));
    expect(root.takeScreenshot()).toMatchSnapshot('updated stacking');
  });

  it('clips overflowing descendants to rounded bounds without clipping siblings', () => {
    Fantom.runTask(() => root.render(<OverflowScene overflow="visible" />));
    expect(root.takeScreenshot()).toMatchSnapshot('visible overflow');
    Fantom.runTask(() => root.render(<OverflowScene overflow="hidden" />));
    expect(root.takeScreenshot()).toMatchSnapshot('hidden overflow');
  });

  it('positions absolute children within bordered parents without affecting flow', () => {
    Fantom.runTask(() => root.render(<AbsolutePositionScene />));
    expect(root.takeScreenshot()).toMatchSnapshot();
  });

  it('renders affine transforms and skips singular siblings at fractional coordinates', () => {
    Fantom.runTask(() => root.render(<TransformScene />));
    expect(root.takeScreenshot()).toMatchSnapshot();
  });
});
