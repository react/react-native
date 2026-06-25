/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/text/BaseParagraphComponentDescriptor.h>
#include <react/renderer/components/text/SelectableParagraphShadowNode.h>

namespace facebook::react {
/*
 * Descriptor for <SelectableParagraph> component, which may render to a
 * different native view than <Paragraph>.
 */
class SelectableParagraphComponentDescriptor final
    : public BaseParagraphComponentDescriptor<SelectableParagraphShadowNode> {
 public:
  using BaseParagraphComponentDescriptor::BaseParagraphComponentDescriptor;
};

} // namespace facebook::react
