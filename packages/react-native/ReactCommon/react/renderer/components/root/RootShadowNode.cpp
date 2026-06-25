/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RootShadowNode.h"

#include <cxxreact/TraceSection.h>
#include <react/renderer/components/view/conversions.h>

namespace facebook::react {

// NOLINTNEXTLINE(facebook-hte-CArray,modernize-avoid-c-arrays)
const char RootComponentName[] = "RootView";

bool RootShadowNode::layoutIfNeeded(
    std::vector<const LayoutableShadowNode*>* affectedNodes) {
  TraceSection s("RootShadowNode::layout");

  if (getIsLayoutClean()) {
    return false;
  }

  ensureUnsealed();

  auto layoutContext = getConcreteProps().layoutContext;
  layoutContext.affectedNodes = affectedNodes;

  layoutTree(layoutContext, getConcreteProps().layoutConstraints);

  return true;
}

Transform RootShadowNode::getTransform() const {
  auto viewportOffset = getConcreteProps().layoutContext.viewportOffset;
  return Transform::Translate(viewportOffset.x, viewportOffset.y, 0);
}

RootShadowNode::Unshared RootShadowNode::clone(
    const PropsParserContext& propsParserContext,
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) const {
  auto props = std::make_shared<const RootProps>(
      propsParserContext, getConcreteProps(), layoutConstraints, layoutContext);
  auto newRootShadowNode = std::make_shared<RootShadowNode>(
      *this,
      ShadowNodeFragment{
          /* .props = */ props,
      });

  if (layoutConstraints != getConcreteProps().layoutConstraints) {
    newRootShadowNode->dirtyLayout();
  }

  return newRootShadowNode;
}

void RootShadowNode::setInstanceHandle(
    InstanceHandle::Shared instanceHandle) const {
  getFamilyShared()->setInstanceHandle(instanceHandle);
}

} // namespace facebook::react
