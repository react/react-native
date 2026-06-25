/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/bridging/bridging.h>
#include <react/renderer/core/ShadowNode.h>

namespace facebook::react {

using BackgroundExecutor = std::function<void(std::function<void()> &&callback)>;

struct ShadowNodeListWrapper : public jsi::NativeState {
  ShadowNodeListWrapper(std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> shadowNodeList)
      : shadowNodeList(std::move(shadowNodeList))
  {
  }

  // The below method needs to be implemented out-of-line in order for the class
  // to have at least one "key function" (see
  // https://itanium-cxx-abi.github.io/cxx-abi/abi.html#vague-vtable)
  ~ShadowNodeListWrapper() override;

  std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> shadowNodeList;
};

inline static jsi::Value valueFromShadowNode(
    jsi::Runtime &runtime,
    std::shared_ptr<const ShadowNode> shadowNode,
    bool assignRuntimeShadowNodeReference = false)
{
  // Wrap the shadow node so that we can update JS references from native
  auto wrappedShadowNode = std::make_shared<ShadowNodeWrapper>(std::move(shadowNode));

  if (assignRuntimeShadowNodeReference) {
    wrappedShadowNode->shadowNode->setRuntimeShadowNodeReference(wrappedShadowNode);
  }

  jsi::Object obj(runtime);
  obj.setNativeState(runtime, std::move(wrappedShadowNode));
  return obj;
}

// TODO: once we no longer need to mutate the return value (appendChildToSet)
// make this a SharedListOfShared
inline static std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> shadowNodeListFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value)
{
  // TODO: cleanup when passChildrenWhenCloningPersistedNodes is rolled out
  jsi::Object object = value.asObject(runtime);
  if (object.isArray(runtime)) {
    auto jsArray = std::move(object).asArray(runtime);
    size_t jsArrayLen = jsArray.length(runtime);
    if (jsArrayLen > 0) {
      auto shadowNodeArray = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
      shadowNodeArray->reserve(jsArrayLen);

      for (size_t i = 0; i < jsArrayLen; i++) {
        shadowNodeArray->push_back(
            Bridging<std::shared_ptr<const ShadowNode>>::fromJs(runtime, jsArray.getValueAtIndex(runtime, i)));
      }
      return shadowNodeArray;
    } else {
      // TODO: return ShadowNode::emptySharedShadowNodeSharedList()
      return std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
          std::vector<std::shared_ptr<const ShadowNode>>({}));
      ;
    }
  } else {
    return object.getNativeState<ShadowNodeListWrapper>(runtime)->shadowNodeList;
  }
}

inline static jsi::Value valueFromShadowNodeList(
    jsi::Runtime &runtime,
    std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> shadowNodeList)
{
  auto wrapper = std::make_shared<ShadowNodeListWrapper>(std::move(shadowNodeList));
  // Use the wrapper for NativeState too, otherwise we can't implement
  // the marker interface. Could be simplified to a simple struct wrapper.
  jsi::Object obj(runtime);
  obj.setNativeState(runtime, std::move(wrapper));
  return obj;
}

inline static std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> shadowNodeListFromWeakList(
    const std::shared_ptr<std::vector<std::weak_ptr<const ShadowNode>>> &weakShadowNodeList)
{
  auto result = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
  for (const auto &weakShadowNode : *weakShadowNodeList) {
    auto sharedShadowNode = weakShadowNode.lock();
    if (!sharedShadowNode) {
      return nullptr;
    }
    result->push_back(sharedShadowNode);
  }
  return result;
}

inline static std::shared_ptr<std::vector<std::weak_ptr<const ShadowNode>>> weakShadowNodeListFromValue(
    jsi::Runtime &runtime,
    const jsi::Value &value)
{
  auto shadowNodeList = shadowNodeListFromValue(runtime, value);
  auto weakShadowNodeList = std::make_shared<std::vector<std::weak_ptr<const ShadowNode>>>();
  for (const auto &shadowNode : *shadowNodeList) {
    weakShadowNodeList->push_back(shadowNode);
  }
  return weakShadowNodeList;
}

inline static Tag tagFromValue(const jsi::Value &value)
{
  return (Tag)value.getNumber();
}

inline static InstanceHandle::Shared
instanceHandleFromValue(jsi::Runtime &runtime, const jsi::Value &instanceHandleValue, const jsi::Value &tagValue)
{
  react_native_assert(!instanceHandleValue.isNull());
  if (instanceHandleValue.isNull()) {
    return nullptr;
  }
  return std::make_shared<InstanceHandle>(runtime, instanceHandleValue, tagFromValue(tagValue));
}

inline static SurfaceId surfaceIdFromValue(jsi::Runtime &runtime, const jsi::Value &value)
{
  return (SurfaceId)value.getNumber();
}

inline static int displayModeToInt(const DisplayMode value)
{
  // the result of this method should be in sync with
  // Libraries/ReactNative/DisplayMode.js
  switch (value) {
    case DisplayMode::Visible:
      return 1;
    case DisplayMode::Suspended:
      return 2;
    case DisplayMode::Hidden:
      return 3;
    default:
      react_native_assert(0 && "displayModeToInt: Invalid DisplayMode");
      return -1;
  }
}

inline static std::string stringFromValue(jsi::Runtime &runtime, const jsi::Value &value)
{
  return value.getString(runtime).utf8(runtime);
}

inline static folly::dynamic commandArgsFromValue(jsi::Runtime &runtime, const jsi::Value &value)
{
  return jsi::dynamicFromValue(runtime, value);
}
} // namespace facebook::react
