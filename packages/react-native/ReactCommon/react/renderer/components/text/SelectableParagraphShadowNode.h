/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/text/ParagraphShadowNode.h>

namespace facebook::react {

/*
 * ShadowNode for selectable Paragraph components, which may map to different native component than Paragraph.
 */
class SelectableParagraphShadowNode : public ParagraphShadowNode {
 public:
  using ParagraphShadowNode::ParagraphShadowNode;

  static constexpr ComponentName Name()
  {
    return "SelectableParagraph";
  }

  static ComponentHandle Handle()
  {
    return ComponentHandle(Name());
  }
};

} // namespace facebook::react
