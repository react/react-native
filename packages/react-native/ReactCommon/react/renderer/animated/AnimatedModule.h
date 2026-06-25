/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif
#include <ReactCommon/TurboModuleWithJSIBindings.h>
#include <folly/dynamic.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>
#include <react/renderer/animated/NativeAnimatedNodesManagerProvider.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <memory>
#include <string>
#include <variant>

namespace facebook::react {

class AnimatedModule : public NativeAnimatedModuleCxxSpec<AnimatedModule>, public TurboModuleWithJSIBindings {
#pragma mark - Operation structures for each type of animated operation
  struct CreateAnimatedNodeOp {
    Tag tag{};
    folly::dynamic config;
  };

  struct GetValueOp {
    Tag tag{};
    AsyncCallback<double> callback;
  };

  struct StartListeningToAnimatedNodeValueOp {
    Tag tag{};
  };

  struct StopListeningToAnimatedNodeValueOp {
    Tag tag{};
  };

  struct ConnectAnimatedNodesOp {
    Tag parentTag{};
    Tag childTag{};
  };

  struct DisconnectAnimatedNodesOp {
    Tag parentTag{};
    Tag childTag{};
  };

  struct StartAnimatingNodeOp {
    int animationId{};
    Tag nodeTag{};
    folly::dynamic config;
    AnimationEndCallback endCallback;
  };

  struct StopAnimationOp {
    int animationId{};
  };

  struct SetAnimatedNodeValueOp {
    Tag nodeTag{};
    double value{};
  };

  struct SetAnimatedNodeOffsetOp {
    Tag nodeTag{};
    double offset{};
  };

  struct FlattenAnimatedNodeOffsetOp {
    Tag nodeTag{};
  };

  struct ExtractAnimatedNodeOffsetOp {
    Tag nodeTag{};
  };

  struct ConnectAnimatedNodeToViewOp {
    Tag nodeTag{};
    Tag viewTag{};
  };

  struct ConnectAnimatedNodeToShadowNodeFamilyOp {
    Tag nodeTag{};
    std::shared_ptr<ShadowNodeFamily> shadowNodeFamily{};
  };

  struct DisconnectAnimatedNodeFromViewOp {
    Tag nodeTag{};
    Tag viewTag{};
  };

  struct RestoreDefaultValuesOp {
    Tag nodeTag{};
  };

  struct DropAnimatedNodeOp {
    Tag tag{};
  };

  struct AddAnimatedEventToViewOp {
    Tag viewTag{};
    std::string eventName;
    folly::dynamic eventMapping;
  };

  struct RemoveAnimatedEventFromViewOp {
    Tag viewTag{};
    std::string eventName;
    Tag animatedNodeTag{};
  };

  using Operation = std::variant<
      CreateAnimatedNodeOp,
      GetValueOp,
      StartListeningToAnimatedNodeValueOp,
      StopListeningToAnimatedNodeValueOp,
      ConnectAnimatedNodesOp,
      DisconnectAnimatedNodesOp,
      StartAnimatingNodeOp,
      StopAnimationOp,
      SetAnimatedNodeOffsetOp,
      SetAnimatedNodeValueOp,
      ConnectAnimatedNodeToViewOp,
      ConnectAnimatedNodeToShadowNodeFamilyOp,
      DisconnectAnimatedNodeFromViewOp,
      RestoreDefaultValuesOp,
      FlattenAnimatedNodeOffsetOp,
      ExtractAnimatedNodeOffsetOp,
      DropAnimatedNodeOp,
      AddAnimatedEventToViewOp,
      RemoveAnimatedEventFromViewOp>;

#pragma mark -

 public:
  AnimatedModule(
      std::shared_ptr<CallInvoker> jsInvoker,
      std::shared_ptr<NativeAnimatedNodesManagerProvider> nodesManagerProvider);

  void startOperationBatch(jsi::Runtime &rt);

  void finishOperationBatch(jsi::Runtime &rt);

  void createAnimatedNode(jsi::Runtime &rt, Tag tag, jsi::Object config);

  void updateAnimatedNodeConfig(jsi::Runtime &rt, Tag tag, jsi::Object config);

  void getValue(jsi::Runtime &rt, Tag tag, AsyncCallback<double> saveValueCallback);

  void startListeningToAnimatedNodeValue(jsi::Runtime &rt, Tag tag);

  void stopListeningToAnimatedNodeValue(jsi::Runtime &rt, Tag tag);

  void connectAnimatedNodes(jsi::Runtime &rt, Tag parentTag, Tag childTag);

  void disconnectAnimatedNodes(jsi::Runtime &rt, Tag parentTag, Tag childTag);

  void startAnimatingNode(
      jsi::Runtime &rt,
      int animationId,
      Tag nodeTag,
      jsi::Object config,
      AnimationEndCallback endCallback);

  void stopAnimation(jsi::Runtime &rt, int animationId);

  void setAnimatedNodeValue(jsi::Runtime &rt, Tag nodeTag, double value);

  void setAnimatedNodeOffset(jsi::Runtime &rt, Tag nodeTag, double offset);

  void flattenAnimatedNodeOffset(jsi::Runtime &rt, Tag nodeTag);

  void extractAnimatedNodeOffset(jsi::Runtime &rt, Tag nodeTag);

  void connectAnimatedNodeToView(jsi::Runtime &rt, Tag nodeTag, Tag viewTag);

  void connectAnimatedNodeToShadowNodeFamily(jsi::Runtime &rt, Tag nodeTag, jsi::Object shadowNode);

  void disconnectAnimatedNodeFromView(jsi::Runtime &rt, Tag nodeTag, Tag viewTag);

  void restoreDefaultValues(jsi::Runtime &rt, Tag nodeTag);

  void dropAnimatedNode(jsi::Runtime &rt, Tag tag);

  void addAnimatedEventToView(jsi::Runtime &rt, Tag viewTag, std::string eventName, jsi::Object eventMapping);

  void removeAnimatedEventFromView(jsi::Runtime &rt, Tag viewTag, std::string eventName, Tag animatedNodeTag);

  void addListener(jsi::Runtime &rt, const std::string &eventName);

  void removeListeners(jsi::Runtime &rt, int count);

  void queueAndExecuteBatchedOperations(jsi::Runtime &rt, jsi::Array operationsAndArgs);

 private:
  std::shared_ptr<NativeAnimatedNodesManagerProvider> nodesManagerProvider_;
  std::weak_ptr<NativeAnimatedNodesManager> nodesManager_;
  std::vector<Operation> preOperations_;
  std::vector<Operation> operations_;

  void executeOperation(const Operation &operation, std::weak_ptr<NativeAnimatedNodesManager> nodesManagerWeak);
  void installJSIBindingsWithRuntime(jsi::Runtime &runtime) override;
};

} // namespace facebook::react
