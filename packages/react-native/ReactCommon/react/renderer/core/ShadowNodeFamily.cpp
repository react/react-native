/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNodeFamily.h"
#include "ShadowNode.h"

#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/State.h>

#include <utility>

namespace facebook::react {

using AncestorList = ShadowNode::AncestorList;

ShadowNodeFamily::ShadowNodeFamily(
    const ShadowNodeFamilyFragment& fragment,
    SharedEventEmitter eventEmitter,
    EventDispatcher::Weak eventDispatcher,
    const ComponentDescriptor& componentDescriptor)
    : eventDispatcher_(std::move(eventDispatcher)),
      tag_(fragment.tag),
      surfaceId_(fragment.surfaceId),
      instanceHandle_(fragment.instanceHandle),
      eventEmitter_(std::move(eventEmitter)),
      componentDescriptor_(componentDescriptor),
      componentHandle_(componentDescriptor.getComponentHandle()),
      componentName_(componentDescriptor.getComponentName()) {}

void ShadowNodeFamily::setParent(const ShadowNodeFamily::Shared& parent) {
  react_native_assert(parent_.lock() == nullptr || parent_.lock() == parent);
  if (hasParent_) {
    return;
  }

  parent_ = parent;
  hasParent_ = true;
}

ComponentHandle ShadowNodeFamily::getComponentHandle() const {
  return componentHandle_;
}

SurfaceId ShadowNodeFamily::getSurfaceId() const {
  return surfaceId_;
}

SharedEventEmitter ShadowNodeFamily::getEventEmitter() const {
  return eventEmitter_;
}

ComponentName ShadowNodeFamily::getComponentName() const {
  return componentName_;
}

void ShadowNodeFamily::setMounted() {
  hasBeenMounted_ = true;
}

const ComponentDescriptor& ShadowNodeFamily::getComponentDescriptor() const {
  return componentDescriptor_;
}

void ShadowNodeFamily::onUnmountedFamilyDestroyed(
    std::function<void(const ShadowNodeFamily& family)> callback) {
  onUnmountedFamilyDestroyedCallback_ = std::move(callback);
}

Tag ShadowNodeFamily::getTag() const {
  return tag_;
}

jsi::Value ShadowNodeFamily::getInstanceHandle(jsi::Runtime& runtime) const {
  if (instanceHandle_ == nullptr) {
    return jsi::Value::null();
  }

  return instanceHandle_->getInstanceHandle(runtime);
}

InstanceHandle::Shared ShadowNodeFamily::getInstanceHandle() const {
  return instanceHandle_;
}

void ShadowNodeFamily::setInstanceHandle(
    InstanceHandle::Shared& instanceHandle) {
  instanceHandle_ = instanceHandle;
}

ShadowNodeFamily::~ShadowNodeFamily() {
  if (!hasBeenMounted_ && onUnmountedFamilyDestroyedCallback_ != nullptr) {
    onUnmountedFamilyDestroyedCallback_(*this);
  }
}

AncestorList ShadowNodeFamily::getAncestors(
    const ShadowNode& ancestorShadowNode) const {
  auto families = std::vector<const ShadowNodeFamily*>{};
  auto ancestorFamily = ancestorShadowNode.family_.get();

  auto family = this;
  while ((family != nullptr) && family != ancestorFamily) {
    families.push_back(family);
    family = family->parent_.lock().get();
  }

  if (family != ancestorFamily) {
    return {};
  }

  auto ancestors = AncestorList{};
  auto parentNode = &ancestorShadowNode;
  for (auto it = families.rbegin(); it != families.rend(); it++) {
    auto childFamily = *it;
    auto found = false;
    auto childIndex = 0;
    for (const auto& childNode : *parentNode->children_) {
      if (childNode->family_.get() == childFamily) {
        ancestors.emplace_back(*parentNode, childIndex);
        parentNode = childNode.get();
        found = true;
        break;
      }
      childIndex++;
    }

    if (!found) {
      ancestors.clear();
      return ancestors;
    }
  }

  return ancestors;
}

State::Shared ShadowNodeFamily::getMostRecentState() const {
  std::unique_lock lock(mutex_);
  return mostRecentState_;
}

void ShadowNodeFamily::setMostRecentState(const State::Shared& state) {
  std::unique_lock lock(mutex_);

  /*
   * Checking and setting `isObsolete_` prevents old states to be recommitted
   * on top of fresher states. It's okay to commit a tree with "older" Shadow
   * Nodes (the evolution of nodes is not linear), however, we never back out
   * states (they progress linearly).
   */
  if (state && (state->isObsolete_ || state == mostRecentState_)) {
    return;
  }

  if (mostRecentState_) {
    mostRecentState_->isObsolete_ = true;
  }

  mostRecentState_ = state;
}

std::shared_ptr<const State> ShadowNodeFamily::getMostRecentStateIfObsolete(
    const State& state) const {
  std::unique_lock lock(mutex_);
  if (!state.isObsolete_) {
    return {};
  }
  return mostRecentState_;
}

void ShadowNodeFamily::dispatchRawState(
    StateUpdate&& stateUpdate,
    EventQueue::UpdateMode updateMode) {
  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  eventDispatcher->dispatchStateUpdate(std::move(stateUpdate), updateMode);
}

} // namespace facebook::react
