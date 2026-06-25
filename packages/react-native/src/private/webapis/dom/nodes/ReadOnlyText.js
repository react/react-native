/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

import * as ReactNativeFeatureFlags from '../../../featureflags/ReactNativeFeatureFlags';
import ReadOnlyCharacterData from './ReadOnlyCharacterData';
import ReadOnlyNode from './ReadOnlyNode';

export default class ReadOnlyText extends ReadOnlyCharacterData {
  /**
   * @override
   */
  get nodeName(): string {
    return '#text';
  }

  /**
   * @override
   */
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

// $FlowExpectedError[prop-missing]
ReadOnlyText_public.prototype = ReadOnlyText.prototype;

// The public imperative EventTarget API (`addEventListener`,
// `removeEventListener`, `dispatchEvent`) is only inherited by this final class
// when `enableNativeEventTargetEventDispatching` is enabled (which makes
// `ReadOnlyNode` extend `EventTarget`). Until that public API is finalized, it
// is gated behind `enableImperativeEvents`: when that flag is off we remove
// those methods from this final class. Native/internal event dispatch does not
// rely on these public methods, so removing them is safe.
if (
  ReactNativeFeatureFlags.enableNativeEventTargetEventDispatching() &&
  !ReactNativeFeatureFlags.enableImperativeEvents()
) {
  const prototype: interface {
    addEventListener?: unknown,
    removeEventListener?: unknown,
    dispatchEvent?: unknown,
  } = ReadOnlyText.prototype;
  prototype.addEventListener = undefined;
  prototype.removeEventListener = undefined;
  prototype.dispatchEvent = undefined;
}
