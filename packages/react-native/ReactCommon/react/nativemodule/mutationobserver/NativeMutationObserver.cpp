/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeMutationObserver.h"
#include <cxxreact/TraceSection.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/primitives.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule>
NativeMutationObserverModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeMutationObserver>(
      std::move(jsInvoker));
}

namespace facebook::react {

static UIManager& getUIManagerFromRuntime(jsi::Runtime& runtime) {
  return UIManagerBinding::getBinding(runtime)->getUIManager();
}

NativeMutationObserver::NativeMutationObserver(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeMutationObserverCxxSpec(std::move(jsInvoker)) {}

void NativeMutationObserver::observe(
    jsi::Runtime& runtime,
    const NativeMutationObserverObserveOptions& options) {
  auto mutationObserverId = options.mutationObserverId;
  auto subtree = options.subtree;
  auto shadowNode = options.targetShadowNode;
  auto& uiManager = getUIManagerFromRuntime(runtime);

  mutationObserverManager_.observe(
      mutationObserverId, shadowNode, subtree, uiManager);
}

void NativeMutationObserver::unobserveAll(
    jsi::Runtime& /*runtime*/,
    MutationObserverId mutationObserverId) {
  mutationObserverManager_.unobserveAll(mutationObserverId);
}

void NativeMutationObserver::connect(
    jsi::Runtime& runtime,
    jsi::Function notifyMutationObservers,
    SyncCallback<jsi::Value(jsi::Value)> getPublicInstanceFromInstanceHandle) {
  auto& uiManager = getUIManagerFromRuntime(runtime);

  runtime_ = &runtime;
  notifyMutationObservers_.emplace(std::move(notifyMutationObservers));
  getPublicInstanceFromInstanceHandle_.emplace(
      std::move(getPublicInstanceFromInstanceHandle));

  auto onMutationsCallback = [&](std::vector<MutationRecord>& records) {
    return onMutations(records);
  };

  mutationObserverManager_.connect(uiManager, std::move(onMutationsCallback));
}

void NativeMutationObserver::disconnect(jsi::Runtime& runtime) {
  auto& uiManager = getUIManagerFromRuntime(runtime);
  mutationObserverManager_.disconnect(uiManager);
  runtime_ = nullptr;
  notifyMutationObservers_.reset();
  getPublicInstanceFromInstanceHandle_.reset();
}

std::vector<NativeMutationRecord> NativeMutationObserver::takeRecords(
    jsi::Runtime& /*runtime*/) {
  notifiedMutationObservers_ = false;

  std::vector<NativeMutationRecord> records;
  pendingRecords_.swap(records);
  return records;
}

jsi::Value NativeMutationObserver::getPublicInstanceFromShadowNode(
    const ShadowNode& shadowNode) const {
  auto instanceHandle = shadowNode.getInstanceHandle(*runtime_);
  if (!instanceHandle.isObject()) {
    return jsi::Value::null();
  }
  return getPublicInstanceFromInstanceHandle_.value().call(
      std::move(instanceHandle));
}

std::vector<jsi::Value>
NativeMutationObserver::getPublicInstancesFromShadowNodes(
    const std::vector<std::shared_ptr<const ShadowNode>>& shadowNodes) const {
  std::vector<jsi::Value> publicInstances;
  publicInstances.reserve(shadowNodes.size());

  for (const auto& shadowNode : shadowNodes) {
    publicInstances.push_back(getPublicInstanceFromShadowNode(*shadowNode));
  }

  return publicInstances;
}

void NativeMutationObserver::onMutations(std::vector<MutationRecord>& records) {
  TraceSection s("NativeMutationObserver::onMutations");

  for (const auto& record : records) {
    pendingRecords_.emplace_back(
        NativeMutationRecord{
            record.mutationObserverId,
            // It's safe to call into JS here because we only check mutations
            // synchronously when committing from React (so we're in a JS
            // task already).
            getPublicInstanceFromShadowNode(*record.targetShadowNode),
            getPublicInstancesFromShadowNodes(record.addedShadowNodes),
            getPublicInstancesFromShadowNodes(record.removedShadowNodes)});
  }

  notifyMutationObserversIfNecessary();
}

/**
 * This method allows us to avoid scheduling multiple calls to notify observers
 * in the JS thread. We schedule one and skip subsequent ones (we just append
 * the records to the pending list and wait for the scheduled task to consume
 * all of them).
 */
void NativeMutationObserver::notifyMutationObserversIfNecessary() {
  bool dispatchNotification = false;

  if (!pendingRecords_.empty() && !notifiedMutationObservers_) {
    notifiedMutationObservers_ = true;
    dispatchNotification = true;
  }

  if (dispatchNotification) {
    TraceSection s("NativeMutationObserver::notifyObservers");
#ifndef RCT_REMOVE_LEGACY_ARCH
    if (ReactNativeFeatureFlags::enableBridgelessArchitecture()) {
#endif
      runtime_->queueMicrotask(notifyMutationObservers_.value());
#ifndef RCT_REMOVE_LEGACY_ARCH
    } else {
      jsInvoker_->invokeAsync([&](jsi::Runtime& runtime) {
        // It's possible that the last observer was disconnected before we could
        // dispatch this notification.
        if (notifyMutationObservers_) {
          notifyMutationObservers_.value().call(runtime);
        }
      });
    }
#endif
  }
}

} // namespace facebook::react
