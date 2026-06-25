/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {ReactTestRenderer} from 'react-test-renderer';

import nullthrows from 'nullthrows';
import * as React from 'react';
import TestRenderer from 'react-test-renderer';

export async function create(
  Component: React.MixedElement,
): Promise<ReactTestRenderer> {
  let component;
  await TestRenderer.act(async () => {
    component = TestRenderer.create(Component);
  });
  return nullthrows(component);
}

export async function unmount(testRenderer: ReactTestRenderer) {
  await TestRenderer.act(async () => {
    testRenderer.unmount();
  });
}

export async function update(
  testRenderer: ReactTestRenderer,
  element: React.MixedElement,
) {
  await TestRenderer.act(async () => {
    testRenderer.update(element);
  });
}
