/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/text/BaseParagraphComponentDescriptor.h>
#include <react/renderer/components/text/ParagraphShadowNode.h>

namespace facebook::react {
/*
 * Descriptor for <Paragraph> component.
 */
class ParagraphComponentDescriptor final : public BaseParagraphComponentDescriptor<ParagraphShadowNode> {
 public:
  using BaseParagraphComponentDescriptor::BaseParagraphComponentDescriptor;
};

} // namespace facebook::react
