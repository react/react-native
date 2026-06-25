/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <gtest/gtest.h>
#include <algorithm>
#include <memory>

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/stubs/stubs.h>

#include "Entropy.h"

namespace facebook::react {

static Tag generateReactTag()
{
  static Tag tag = 1000;
  return tag++;
}

class ShadowTreeEdge final {
 public:
  std::shared_ptr<const ShadowNode> shadowNode{nullptr};
  std::shared_ptr<const ShadowNode> parentShadowNode{nullptr};
  int index{0};
};

static bool traverseShadowTree(
    const std::shared_ptr<const ShadowNode> &parentShadowNode,
    const std::function<void(const ShadowTreeEdge &edge, bool &stop)> &callback)
{
  auto index = int{0};
  for (const auto &childNode : parentShadowNode->getChildren()) {
    auto stop = bool{false};

    callback(ShadowTreeEdge{childNode, parentShadowNode, index}, stop);

    if (stop) {
      return true;
    }

    if (traverseShadowTree(childNode, callback)) {
      return true;
    }

    index++;
  }
  return false;
}

static int countShadowNodes(const std::shared_ptr<const ShadowNode> &rootShadowNode)
{
  auto counter = int{0};

  traverseShadowTree(rootShadowNode, [&](const ShadowTreeEdge &edge, bool &stop) { counter++; });

  return counter;
}

static ShadowTreeEdge findShadowNodeWithIndex(const std::shared_ptr<const ShadowNode> &rootNode, int index)
{
  auto counter = int{0};
  auto result = ShadowTreeEdge{};

  traverseShadowTree(rootNode, [&](const ShadowTreeEdge &edge, bool &stop) {
    if (index == counter) {
      result = edge;
    }

    counter++;
  });

  return result;
}

static ShadowTreeEdge findRandomShadowNode(
    const Entropy &entropy,
    const std::shared_ptr<const ShadowNode> &rootShadowNode)
{
  auto count = countShadowNodes(rootShadowNode);
  return findShadowNodeWithIndex(rootShadowNode, entropy.random<int>(1 /* Excluding a root node */, count - 1));
}

static std::vector<std::shared_ptr<const ShadowNode>> cloneSharedShadowNodeList(
    const std::vector<std::shared_ptr<const ShadowNode>> &list)
{
  auto result = std::vector<std::shared_ptr<const ShadowNode>>{};
  result.reserve(list.size());
  for (const auto &shadowNode : list) {
    result.push_back(shadowNode->clone({}));
  }
  return result;
}

static inline std::shared_ptr<ShadowNode> messWithChildren(const Entropy &entropy, const ShadowNode &shadowNode)
{
  auto children = shadowNode.getChildren();
  children = cloneSharedShadowNodeList(children);
  entropy.shuffle(children);
  return shadowNode.clone(
      {ShadowNodeFragment::propsPlaceholder(),
       std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(children)});
}

static inline std::shared_ptr<ShadowNode> messWithLayoutableOnlyFlag(
    const Entropy &entropy,
    const ShadowNode &shadowNode)
{
  auto oldProps = shadowNode.getProps();

  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto newProps =
      shadowNode.getComponentDescriptor().cloneProps(parserContext, oldProps, RawProps(folly::dynamic::object()));

  auto &viewProps = const_cast<ViewProps &>(static_cast<const ViewProps &>(*newProps));

  if (entropy.random<bool>(0.1)) {
    viewProps.nativeId = entropy.random<bool>() ? "42" : "";
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.backgroundColor = entropy.random<bool>() ? SharedColor() : whiteColor();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.shadowColor = entropy.random<bool>() ? SharedColor() : blackColor();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.accessible = entropy.random<bool>();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.zIndex = entropy.random<int>();
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.pointerEvents = entropy.random<bool>() ? PointerEventsMode::Auto : PointerEventsMode::None;
  }

  if (entropy.random<bool>(0.1)) {
    viewProps.transform = entropy.random<bool>() ? Transform::Identity() : Transform::Perspective(42);
  }

#ifdef ANDROID
  if (entropy.random<bool>(0.1)) {
    viewProps.elevation = entropy.random<bool>() ? 1 : 0;
  }
#endif

  return shadowNode.clone({newProps});
}

// Similar to `messWithLayoutableOnlyFlag` but has a 50/50 chance of flattening
// (or unflattening) a node's children.
static inline std::shared_ptr<ShadowNode> messWithNodeFlattenednessFlags(
    const Entropy &entropy,
    const ShadowNode &shadowNode)
{
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto oldProps = shadowNode.getProps();
  auto newProps =
      shadowNode.getComponentDescriptor().cloneProps(parserContext, oldProps, RawProps(folly::dynamic::object()));

  auto &viewProps = const_cast<ViewProps &>(static_cast<const ViewProps &>(*newProps));

  if (entropy.random<bool>(0.5)) {
    viewProps.nativeId = "";
    viewProps.collapsable = true;
    viewProps.backgroundColor = SharedColor();
    viewProps.shadowColor = SharedColor();
    viewProps.accessible = false;
    viewProps.zIndex = {};
    viewProps.pointerEvents = PointerEventsMode::Auto;
    viewProps.transform = Transform::Identity();
#ifdef ANDROID
    viewProps.elevation = 0;
#endif
  } else {
    viewProps.nativeId = "42";
    viewProps.backgroundColor = whiteColor();
    viewProps.shadowColor = blackColor();
    viewProps.accessible = true;
    viewProps.zIndex = {entropy.random<int>()};
    viewProps.pointerEvents = PointerEventsMode::None;
    viewProps.transform = Transform::Perspective(entropy.random<int>());
#ifdef ANDROID
    viewProps.elevation = entropy.random<int>();
#endif
  }

  return shadowNode.clone({newProps});
}

static inline std::shared_ptr<ShadowNode> messWithYogaStyles(const Entropy &entropy, const ShadowNode &shadowNode)
{
  folly::dynamic dynamic = folly::dynamic::object();

  if (entropy.random<bool>()) {
    dynamic["flexDirection"] = entropy.random<bool>() ? "row" : "column";
  }

  std::vector<std::string> properties = {
      "flex",      "flexGrow",    "flexShrink",   "flexBasis",   "left",       "top",          "marginLeft",
      "marginTop", "marginRight", "marginBottom", "paddingLeft", "paddingTop", "paddingRight", "paddingBottom",
      "width",     "height",      "maxWidth",     "maxHeight",   "minWidth",   "minHeight",
  };

  // It is not safe to add new Yoga properties to this list. Unit tests
  // validate specific seeds, and what they test may change and cause unrelated
  // failures if the size of properties also changes.
  EXPECT_EQ(properties.size(), 20);

  for (const auto &property : properties) {
    if (entropy.random<bool>(0.1)) {
      dynamic[property] = entropy.random<int>(0, 1024);
    }
  }

  ContextContainer contextContainer;

  PropsParserContext parserContext{-1, contextContainer};

  auto oldProps = shadowNode.getProps();
  auto newProps = shadowNode.getComponentDescriptor().cloneProps(parserContext, oldProps, RawProps(dynamic));
  return shadowNode.clone({newProps});
}

using ShadowNodeAlteration =
    std::function<std::shared_ptr<ShadowNode>(const Entropy &entropy, const ShadowNode &shadowNode)>;

static inline void
alterShadowTree(const Entropy &entropy, RootShadowNode::Shared &rootShadowNode, ShadowNodeAlteration alteration)
{
  auto edge = findRandomShadowNode(entropy, rootShadowNode);

  rootShadowNode = std::static_pointer_cast<RootShadowNode>(rootShadowNode->cloneTree(
      edge.shadowNode->getFamily(),
      [&](const ShadowNode &oldShadowNode) { return alteration(entropy, oldShadowNode); }));
}

static inline void alterShadowTree(
    const Entropy &entropy,
    RootShadowNode::Shared &rootShadowNode,
    std::vector<ShadowNodeAlteration> alterations)
{
  auto i = entropy.random<int>(0, alterations.size() - 1);
  alterShadowTree(entropy, rootShadowNode, alterations[i]);
}

static SharedViewProps generateDefaultProps(const ComponentDescriptor &componentDescriptor)
{
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  return std::static_pointer_cast<const ViewProps>(componentDescriptor.cloneProps(parserContext, nullptr, RawProps{}));
}

static inline std::shared_ptr<const ShadowNode> generateShadowNodeTree(
    const Entropy &entropy,
    const ComponentDescriptor &componentDescriptor,
    int size,
    int deviation = 3)
{
  if (size <= 1) {
    auto family = componentDescriptor.createFamily({generateReactTag(), SurfaceId(1), nullptr});
    return componentDescriptor.createShadowNode(ShadowNodeFragment{generateDefaultProps(componentDescriptor)}, family);
  }

  auto items = std::vector<int>(size);
  std::fill(items.begin(), items.end(), 1);
  auto chunks = entropy.distribute(items, deviation);
  auto children = std::vector<std::shared_ptr<const ShadowNode>>{};

  for (const auto &chunk : chunks) {
    children.push_back(generateShadowNodeTree(entropy, componentDescriptor, chunk.size()));
  }

  auto family = componentDescriptor.createFamily({generateReactTag(), SurfaceId(1), nullptr});
  return componentDescriptor.createShadowNode(
      ShadowNodeFragment{
          generateDefaultProps(componentDescriptor),
          std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(children)},
      family);
}

} // namespace facebook::react
