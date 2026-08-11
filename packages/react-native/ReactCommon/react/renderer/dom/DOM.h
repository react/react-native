/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ShadowNode.h>
#include <cstdint>
#include <string>
#include <vector>

namespace facebook::react::dom {

constexpr uint_fast16_t DOCUMENT_POSITION_DISCONNECTED = 1;
constexpr uint_fast16_t DOCUMENT_POSITION_PRECEDING = 2;
constexpr uint_fast16_t DOCUMENT_POSITION_FOLLOWING = 4;
constexpr uint_fast16_t DOCUMENT_POSITION_CONTAINS = 8;
constexpr uint_fast16_t DOCUMENT_POSITION_CONTAINED_BY = 16;

struct DOMRect {
  double x = 0;
  double y = 0;
  double width = 0;
  double height = 0;
};

struct RNMeasureRect {
  double x = 0;
  double y = 0;
  double width = 0;
  double height = 0;
  double pageX = 0;
  double pageY = 0;
};

struct DOMOffset {
  std::shared_ptr<const ShadowNode> offsetParent = nullptr;
  double top = 0;
  double left = 0;
};

struct DOMPoint {
  double x = 0;
  double y = 0;
};

struct DOMSizeRounded {
  int width = 0;
  int height = 0;
};

struct DOMBorderWidthRounded {
  int top = 0;
  int right = 0;
  int bottom = 0;
  int left = 0;
};

std::shared_ptr<const ShadowNode> getParentNode(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

std::shared_ptr<const ShadowNode> getElementById(
    const std::shared_ptr<const ShadowNode>& currentRevision,
    const std::string& id);

std::vector<std::shared_ptr<const ShadowNode>> getChildNodes(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

bool isConnected(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

uint_fast16_t compareDocumentPosition(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode,
    const ShadowNode& otherShadowNode);

std::string getTextContent(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

DOMRect getBoundingClientRect(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode,
    bool includeTransform);

DOMOffset getOffset(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

DOMPoint getScrollPosition(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

DOMSizeRounded getScrollSize(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

DOMSizeRounded getInnerSize(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

DOMBorderWidthRounded getBorderWidth(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

std::string getTagName(const ShadowNode& shadowNode);

// Non-standard methods from React Native

RNMeasureRect measure(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

DOMRect measureInWindow(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

// This method returns an optional to signal to go through the error callback
// instead of going through the success callback with an empty DOMRect.
std::optional<DOMRect> measureLayout(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode,
    const ShadowNode& relativeToShadowNode);

} // namespace facebook::react::dom
