/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/text/RawTextProps.h>
#include <react/renderer/core/ConcreteShadowNode.h>

namespace facebook::react {

extern const char RawTextComponentName[];

/*
 * `ShadowNode` for <RawText> component, represents a purely regular string
 * object in React. In a code fragment `<Text>Hello!</Text>`, "Hello!" part
 * is represented as `<RawText text="Hello!"/>`.
 * <RawText> component must not have any children.
 */
class RawTextShadowNode : public ConcreteShadowNode<
                              RawTextComponentName,
                              ShadowNode,
                              RawTextProps> {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;
};

} // namespace facebook::react
