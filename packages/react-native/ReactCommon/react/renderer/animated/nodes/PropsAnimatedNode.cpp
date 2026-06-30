/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#include "PropsAnimatedNode.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/nodes/ColorAnimatedNode.h>
#include <react/renderer/animated/nodes/ObjectAnimatedNode.h>
#include <react/renderer/animated/nodes/StyleAnimatedNode.h>
#include <react/renderer/animated/nodes/ValueAnimatedNode.h>

namespace facebook::react {

namespace {

bool isLayoutStyleUpdated(
    const folly::dynamic& props,
    NativeAnimatedNodesManager& manager) {
  for (const auto& entry : props.items()) {
    auto nodeTag = static_cast<Tag>(entry.second.asInt());
    if (const auto& node = manager.getAnimatedNode<AnimatedNode>(nodeTag)) {
      if (node->type() == AnimatedNodeType::Style) {
        if (const auto& styleNode =
                manager.getAnimatedNode<StyleAnimatedNode>(nodeTag)) {
          if (styleNode->isLayoutStyleUpdated()) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

} // namespace

PropsAnimatedNode::PropsAnimatedNode(
    Tag tag,
    const folly::dynamic& config,
    NativeAnimatedNodesManager& manager)
    : AnimatedNode(tag, config, manager, AnimatedNodeType::Props),
      props_(folly::dynamic::object()) {
  if (auto it = getConfig().find("rootTag"); it != getConfig().items().end()) {
    connectedRootTag_ = static_cast<Tag>(it->second.asInt());
  }
}

void PropsAnimatedNode::connectToShadowNodeFamily(
    ShadowNodeFamily::Weak shadowNodeFamily) {
  shadowNodeFamily_ = std::move(shadowNodeFamily);
}

void PropsAnimatedNode::disconnectFromShadowNodeFamily() {
  shadowNodeFamily_.reset();
}

void PropsAnimatedNode::connectToView(Tag viewTag) {
  react_native_assert(
      connectedViewTag_ == animated::undefinedAnimatedNodeIdentifier &&
      "Animated node has already been attached to a view already exists.");
  connectedViewTag_ = viewTag;
}

void PropsAnimatedNode::disconnectFromView(Tag viewTag) {
  react_native_assert(
      connectedViewTag_ == viewTag &&
      "Attempting to disconnect view that has not been connected with the given animated node.");
  connectedViewTag_ = animated::undefinedAnimatedNodeIdentifier;
}

// restore the value to whatever the value was on the ShadowNode instead of in
// the View hierarchy
void PropsAnimatedNode::restoreDefaultValues() {
  // If node is already disconnected from View, we cannot restore default values
  if (connectedViewTag_ != animated::undefinedAnimatedNodeIdentifier) {
    if (manager_->useSharedAnimatedBackend()) {
      manager_->schedulePropsCommit(
          connectedViewTag_,
          folly::dynamic::object(),
          false,
          false,
          shadowNodeFamily_);
    } else {
      manager_->schedulePropsCommit(
          connectedViewTag_, folly::dynamic::object(), false, false);
    }
  }
}

void PropsAnimatedNode::collectPropsLocked() {
  // TODO: T190192206 consolidate shared update logic between
  // Props/StyleAnimatedNode
  const auto& configProps = getConfig()["props"];
  for (const auto& entry : configProps.items()) {
    auto propName = entry.first.asString();
    auto nodeTag = static_cast<Tag>(entry.second.asInt());
    if (auto node = manager_->getAnimatedNode<AnimatedNode>(nodeTag)) {
      switch (node->type()) {
        case AnimatedNodeType::Value:
        case AnimatedNodeType::Interpolation:
        case AnimatedNodeType::Modulus:
        case AnimatedNodeType::Round:
        case AnimatedNodeType::Diffclamp:
        // Operators
        case AnimatedNodeType::Addition:
        case AnimatedNodeType::Subtraction:
        case AnimatedNodeType::Multiplication:
        case AnimatedNodeType::Division: {
          if (const auto& valueNode =
                  manager_->getAnimatedNode<ValueAnimatedNode>(nodeTag)) {
            if (valueNode->getIsColorValue()) {
              props_.insert(
                  propName.c_str(),
                  static_cast<int32_t>(valueNode->getValue()));
            } else {
              props_.insert(propName.c_str(), valueNode->getValue());
            }
          }
        } break;
        case AnimatedNodeType::Color: {
          if (const auto& colorNode =
                  manager_->getAnimatedNode<ColorAnimatedNode>(nodeTag)) {
            props_.insert(
                propName.c_str(), static_cast<int32_t>(colorNode->getColor()));
          }
        } break;
        case AnimatedNodeType::Style: {
          if (const auto& styleNode =
                  manager_->getAnimatedNode<StyleAnimatedNode>(nodeTag)) {
            styleNode->collectViewUpdates(props_);
          }
        } break;
        case AnimatedNodeType::Object: {
          if (const auto objectNode =
                  manager_->getAnimatedNode<ObjectAnimatedNode>(nodeTag)) {
            objectNode->collectViewUpdates(propName, props_);
          }
        } break;
        case AnimatedNodeType::Props:
        case AnimatedNodeType::Tracking:
        case AnimatedNodeType::Transform:
          break;
      }
    }
  }

  layoutStyleUpdated_ = isLayoutStyleUpdated(getConfig()["props"], *manager_);
}

void PropsAnimatedNode::collectProps() {
  if (connectedViewTag_ == animated::undefinedAnimatedNodeIdentifier) {
    return;
  }

  std::lock_guard<std::mutex> lock(propsMutex_);
  collectPropsLocked();
}

void PropsAnimatedNode::update() {
  return update(false);
}

void PropsAnimatedNode::update(bool forceFabricCommit) {
  if (connectedViewTag_ == animated::undefinedAnimatedNodeIdentifier) {
    return;
  }

  std::lock_guard<std::mutex> lock(propsMutex_);
  collectPropsLocked();

  if (manager_->useSharedAnimatedBackend()) {
    manager_->schedulePropsCommit(
        connectedViewTag_,
        props_,
        layoutStyleUpdated_,
        forceFabricCommit,
        shadowNodeFamily_);
  } else {
    manager_->schedulePropsCommit(
        connectedViewTag_, props_, layoutStyleUpdated_, forceFabricCommit);
  }
}

} // namespace facebook::react
