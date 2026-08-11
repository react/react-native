/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/iostextinput/TextInputProps.h>
#include <react/renderer/components/textinput/BaseTextInputShadowNode.h>
#include <react/renderer/components/textinput/TextInputEventEmitter.h>
#include <react/renderer/components/textinput/TextInputState.h>

namespace facebook::react {

extern const char TextInputComponentName[];

/*
 * `ShadowNode` for <TextInput> component.
 */
class TextInputShadowNode final : public BaseTextInputShadowNode<
                                      TextInputComponentName,
                                      TextInputProps,
                                      TextInputEventEmitter,
                                      TextInputState> {
 public:
  using BaseTextInputShadowNode::BaseTextInputShadowNode;
};

} // namespace facebook::react
