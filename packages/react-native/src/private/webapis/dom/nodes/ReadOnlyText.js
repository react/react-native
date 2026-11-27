/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as ReactNativeFeatureFlags from '../../../featureflags/ReactNativeFeatureFlags';
import ReadOnlyCharacterData from './ReadOnlyCharacterData';
import ReadOnlyNode from './ReadOnlyNode';

export default class ReadOnlyText extends ReadOnlyCharacterData {
  /**
   * @override
   */
  // $FlowFixMe[unsafe-getters-setters]
  get nodeName(): string {
    return '#text';
  }

  /**
   * @override
   */
  // $FlowFixMe[unsafe-getters-setters]
  get nodeType(): number {
    return ReadOnlyNode.TEXT_NODE;
  }
}

export const ReadOnlyText_public: typeof ReadOnlyText =
  // $FlowExpectedError[incompatible-type]
  function Text() {
    throw new TypeError(
      "Failed to construct 'Text': Nodes cannot be imperatively created in React Native",
    );
  };

ReadOnlyText_public.prototype = ReadOnlyText.prototype;

// The public imperative EventTarget API (`addEventListener`,
// `removeEventListener`, `dispatchEvent`) is gated behind
// `enableImperativeEvents` until it is finalized. Native/internal event
// dispatch does not rely on these public methods.
if (!ReactNativeFeatureFlags.enableImperativeEvents()) {
  for (const method of [
    'addEventListener',
    'removeEventListener',
    'dispatchEvent',
  ]) {
    Object.defineProperty(ReadOnlyText.prototype, method, {
      value: undefined,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
}
