/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeDOM.h"
#include <react/renderer/bridging/bridging.h>
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/dom/DOM.h>
#include <react/renderer/uimanager/PointerEventsProcessor.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule> NativeDOMModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeDOM>(std::move(jsInvoker));
}

namespace facebook::react {

namespace {
inline std::shared_ptr<const ShadowNode> getShadowNode(
    facebook::jsi::Runtime& runtime,
    jsi::Value& shadowNodeValue) {
  return Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
      runtime, shadowNodeValue);
}

#pragma mark - Private helpers

UIManager& getUIManagerFromRuntime(facebook::jsi::Runtime& runtime) {
  return UIManagerBinding::getBinding(runtime)->getUIManager();
}

RootShadowNode::Shared getCurrentShadowTreeRevision(
    facebook::jsi::Runtime& runtime,
    SurfaceId surfaceId) {
  auto shadowTreeRevisionProvider =
      getUIManagerFromRuntime(runtime).getShadowTreeRevisionProvider();
  return shadowTreeRevisionProvider->getCurrentRevision(surfaceId);
}

RootShadowNode::Shared getCurrentShadowTreeRevision(
    facebook::jsi::Runtime& runtime,
    jsi::Value& nativeNodeReference) {
  if (nativeNodeReference.isNumber()) {
    return getCurrentShadowTreeRevision(
        runtime, static_cast<SurfaceId>(nativeNodeReference.asNumber()));
  }

  return getCurrentShadowTreeRevision(
      runtime, getShadowNode(runtime, nativeNodeReference)->getSurfaceId());
}

facebook::react::PointerEventsProcessor& getPointerEventsProcessorFromRuntime(
    facebook::jsi::Runtime& runtime) {
  return facebook::react::UIManagerBinding::getBinding(runtime)
      ->getPointerEventsProcessor();
}

std::vector<facebook::jsi::Value> getArrayOfInstanceHandlesFromShadowNodes(
    const std::vector<std::shared_ptr<const ShadowNode>>& nodes,
    facebook::jsi::Runtime& runtime) {
  // JSI doesn't support adding elements to an array after creation,
  // so we need to accumulate the values in a vector and then create
  // the array when we know the size.
  std::vector<facebook::jsi::Value> nonNullInstanceHandles;
  nonNullInstanceHandles.reserve(nodes.size());
  for (const auto& shadowNode : nodes) {
    auto instanceHandle = (*shadowNode).getInstanceHandle(runtime);
    if (!instanceHandle.isNull()) {
      nonNullInstanceHandles.push_back(std::move(instanceHandle));
    }
  }

  return nonNullInstanceHandles;
}

bool isRootShadowNode(const ShadowNode& shadowNode) {
  return shadowNode.getTraits().check(ShadowNodeTraits::Trait::RootNodeKind);
}

} // namespace

#pragma mark - NativeDOM

NativeDOM::NativeDOM(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeDOMCxxSpec(std::move(jsInvoker)) {}

#pragma mark - Methods from the `Node` interface (for `ReadOnlyNode`).

double NativeDOM::compareDocumentPosition(
    jsi::Runtime& rt,
    jsi::Value nativeNodeReference,
    jsi::Value otherNativeNodeReference) {
  auto currentRevision = getCurrentShadowTreeRevision(rt, nativeNodeReference);
  if (currentRevision == nullptr) {
    return dom::DOCUMENT_POSITION_DISCONNECTED;
  }

  std::shared_ptr<const ShadowNode> shadowNode;
  std::shared_ptr<const ShadowNode> otherShadowNode;

  // Check if document references are used
  if (nativeNodeReference.isNumber() || otherNativeNodeReference.isNumber()) {
    if (nativeNodeReference.isNumber() && otherNativeNodeReference.isNumber()) {
      // Both are documents (and equality is handled in JS directly).
      return dom::DOCUMENT_POSITION_DISCONNECTED;
    } else if (nativeNodeReference.isNumber()) {
      // Only the first is a document
      auto surfaceId = nativeNodeReference.asNumber();
      shadowNode = currentRevision;
      otherShadowNode = getShadowNode(rt, otherNativeNodeReference);

      if (isRootShadowNode(*otherShadowNode)) {
        // If the other is a root node, we just need to check if it is its
        // `documentElement`
        return (surfaceId == otherShadowNode->getSurfaceId())
            ? dom::DOCUMENT_POSITION_CONTAINED_BY |
                dom::DOCUMENT_POSITION_FOLLOWING
            : dom::DOCUMENT_POSITION_DISCONNECTED;
      } else {
        // Otherwise, we'll use the root node to represent the document
        // (the result should be the same)
      }
    } else {
      // Only the second is a document
      auto otherSurfaceId = otherNativeNodeReference.asNumber();
      shadowNode = getShadowNode(rt, nativeNodeReference);
      otherShadowNode = getCurrentShadowTreeRevision(rt, otherSurfaceId);

      if (isRootShadowNode(*shadowNode)) {
        // If this is a root node, we just need to check if the other is its
        // document.
        return (otherSurfaceId == shadowNode->getSurfaceId())
            ? dom::DOCUMENT_POSITION_CONTAINS | dom::DOCUMENT_POSITION_PRECEDING
            : dom::DOCUMENT_POSITION_DISCONNECTED;
      } else {
        // Otherwise, we'll use the root node to represent the document
        // (the result should be the same)
      }
    }
  } else {
    shadowNode = getShadowNode(rt, nativeNodeReference);
    otherShadowNode = getShadowNode(rt, otherNativeNodeReference);
  }

  return dom::compareDocumentPosition(
      currentRevision, *shadowNode, *otherShadowNode);
}

std::vector<jsi::Value> NativeDOM::getChildNodes(
    jsi::Runtime& rt,
    jsi::Value nativeNodeReference) {
  auto currentRevision = getCurrentShadowTreeRevision(rt, nativeNodeReference);
  if (currentRevision == nullptr) {
    return std::vector<jsi::Value>{};
  }

  // The only child node of the document is the root node.
  if (nativeNodeReference.isNumber()) {
    return getArrayOfInstanceHandlesFromShadowNodes({currentRevision}, rt);
  }

  auto childNodes = dom::getChildNodes(
      currentRevision, *getShadowNode(rt, nativeNodeReference));
  return getArrayOfInstanceHandlesFromShadowNodes(childNodes, rt);
}

jsi::Value NativeDOM::getElementById(
    jsi::Runtime& rt,
    SurfaceId surfaceId,
    const std::string& id) {
  auto currentRevision = getCurrentShadowTreeRevision(rt, surfaceId);
  if (currentRevision == nullptr) {
    return jsi::Value::undefined();
  }

  auto elementById = dom::getElementById(currentRevision, id);
  if (elementById == nullptr) {
    return jsi::Value::undefined();
  }

  return elementById->getInstanceHandle(rt);
}

jsi::Value NativeDOM::getParentNode(
    jsi::Runtime& rt,
    jsi::Value nativeNodeReference) {
  // The document does not have a parent node.
  if (nativeNodeReference.isNumber()) {
    return jsi::Value::undefined();
  }

  auto shadowNode = getShadowNode(rt, nativeNodeReference);
  if (isRootShadowNode(*shadowNode)) {
    // The parent of the root node is the document.
    return jsi::Value{shadowNode->getSurfaceId()};
  }

  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return jsi::Value::undefined();
  }

  auto parentShadowNode = dom::getParentNode(currentRevision, *shadowNode);
  if (parentShadowNode == nullptr) {
    return jsi::Value::undefined();
  }

  return parentShadowNode->getInstanceHandle(rt);
}

bool NativeDOM::isConnected(jsi::Runtime& rt, jsi::Value nativeNodeReference) {
  auto currentRevision = getCurrentShadowTreeRevision(rt, nativeNodeReference);
  if (currentRevision == nullptr) {
    return false;
  }

  // The document is connected because we got a value for current revision.
  if (nativeNodeReference.isNumber()) {
    return true;
  }

  auto shadowNode = getShadowNode(rt, nativeNodeReference);
  return dom::isConnected(currentRevision, *shadowNode);
}

#pragma mark - Methods from the `Element` interface (for `ReactNativeElement`).

std::tuple<
    /* topWidth: */ int,
    /* rightWidth: */ int,
    /* bottomWidth: */ int,
    /* leftWidth: */ int>
NativeDOM::getBorderWidth(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode) {
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0, 0, 0};
  }

  auto borderWidth = dom::getBorderWidth(currentRevision, *shadowNode);
  return std::tuple{
      borderWidth.top, borderWidth.right, borderWidth.bottom, borderWidth.left};
}

std::tuple<
    /* x: */ double,
    /* y: */ double,
    /* width: */ double,
    /* height: */ double>
NativeDOM::getBoundingClientRect(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode,
    bool includeTransform) {
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0, 0, 0};
  }

  auto domRect = dom::getBoundingClientRect(
      currentRevision, *shadowNode, includeTransform);

  return std::tuple{domRect.x, domRect.y, domRect.width, domRect.height};
}

std::tuple</* width: */ int, /* height: */ int> NativeDOM::getInnerSize(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode) {
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0};
  }

  auto innerSize = dom::getInnerSize(currentRevision, *shadowNode);
  return std::tuple{innerSize.width, innerSize.height};
}

std::tuple</* scrollLeft: */ double, /* scrollTop: */ double>
NativeDOM::getScrollPosition(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode) {
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0};
  }

  auto domPoint = dom::getScrollPosition(currentRevision, *shadowNode);
  return std::tuple{domPoint.x, domPoint.y};
}

std::tuple</* scrollWidth: */ int, /* scrollHeight */ int>
NativeDOM::getScrollSize(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode) {
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {0, 0};
  }

  auto scrollSize = dom::getScrollSize(currentRevision, *shadowNode);
  return std::tuple{scrollSize.width, scrollSize.height};
}

std::string NativeDOM::getTagName(
    jsi::Runtime& /*rt*/,
    std::shared_ptr<const ShadowNode> shadowNode) {
  return dom::getTagName(*shadowNode);
}

std::string NativeDOM::getTextContent(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode) {
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return "";
  }

  return dom::getTextContent(currentRevision, *shadowNode);
}

bool NativeDOM::hasPointerCapture(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode,
    double pointerId) {
  bool isCapturing = getPointerEventsProcessorFromRuntime(rt).hasPointerCapture(
      static_cast<PointerIdentifier>(pointerId), shadowNode.get());
  return isCapturing;
}

void NativeDOM::releasePointerCapture(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode,
    double pointerId) {
  getPointerEventsProcessorFromRuntime(rt).releasePointerCapture(
      static_cast<PointerIdentifier>(pointerId), shadowNode.get());
}

void NativeDOM::setPointerCapture(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode,
    double pointerId) {
  getPointerEventsProcessorFromRuntime(rt).setPointerCapture(
      static_cast<PointerIdentifier>(pointerId), shadowNode);
}

#pragma mark - Methods from the `HTMLElement` interface (for `ReactNativeElement`).

std::tuple<
    /* offsetParent: */ jsi::Value,
    /* top: */ double,
    /* left: */ double>
NativeDOM::getOffset(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode) {
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    return {jsi::Value::undefined(), 0, 0};
  }

  auto domOffset = dom::getOffset(currentRevision, *shadowNode);

  return std::tuple{
      domOffset.offsetParent == nullptr
          ? jsi::Value::undefined()
          : domOffset.offsetParent->getInstanceHandle(rt),
      domOffset.top,
      domOffset.left};
}

#pragma mark - Special methods to handle the root node.

jsi::Value NativeDOM::linkRootNode(
    jsi::Runtime& rt,
    SurfaceId surfaceId,
    jsi::Value instanceHandle) {
  auto currentRevision = getCurrentShadowTreeRevision(rt, surfaceId);
  if (currentRevision == nullptr) {
    return jsi::Value::undefined();
  }

  auto instanceHandleWrapper =
      std::make_shared<InstanceHandle>(rt, instanceHandle, surfaceId);
  currentRevision->setInstanceHandle(instanceHandleWrapper);

  return Bridging<std::shared_ptr<const ShadowNode>>::toJs(rt, currentRevision);
}

#pragma mark - Legacy layout APIs (for `ReactNativeElement`).

void NativeDOM::measure(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode,
    const MeasureOnSuccessCallback& callback) {
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    callback(0, 0, 0, 0, 0, 0);
    return;
  }

  auto measureRect = dom::measure(currentRevision, *shadowNode);

  callback(
      measureRect.x,
      measureRect.y,
      measureRect.width,
      measureRect.height,
      measureRect.pageX,
      measureRect.pageY);
}

void NativeDOM::measureInWindow(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode,
    const MeasureInWindowOnSuccessCallback& callback) {
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    callback(0, 0, 0, 0);
    return;
  }

  auto rect = dom::measureInWindow(currentRevision, *shadowNode);
  callback(rect.x, rect.y, rect.width, rect.height);
}

void NativeDOM::measureLayout(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode,
    std::shared_ptr<const ShadowNode> relativeToShadowNode,
    jsi::Function onFail,
    const MeasureLayoutOnSuccessCallback& onSuccess) {
  auto currentRevision =
      getCurrentShadowTreeRevision(rt, shadowNode->getSurfaceId());
  if (currentRevision == nullptr) {
    onFail.call(rt);
    return;
  }

  auto maybeRect =
      dom::measureLayout(currentRevision, *shadowNode, *relativeToShadowNode);

  if (!maybeRect) {
    onFail.call(rt);
    return;
  }

  auto rect = maybeRect.value();

  onSuccess(rect.x, rect.y, rect.width, rect.height);
}

void NativeDOM::measureAsyncOnUI(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode,
    const MeasureAsyncOnUICallback& callback) {
  UIManager& uiManager = getUIManagerFromRuntime(rt);
  UIManagerDelegate* uiManagerDelegate = uiManager.getDelegate();
  if (uiManagerDelegate == nullptr) {
    return;
  }

  std::function<void(folly::dynamic)> jsCallback = [callback](const folly::dynamic& args) {
    // TODO: can we make the rest accept an AsyncFunction directly?
    callback.call(
        args.at(0).getDouble(),
        args.at(1).getDouble(),
        args.at(2).getDouble(),
        args.at(3).getDouble(),
        args.at(4).getDouble(),
        args.at(5).getDouble());
  };

  uiManagerDelegate->uiManagerMeasureAsyncOnUI(shadowNode, jsCallback);
}

#pragma mark - Legacy direct manipulation APIs (for `ReactNativeElement`).

void NativeDOM::setNativeProps(
    jsi::Runtime& rt,
    std::shared_ptr<const ShadowNode> shadowNode,
    jsi::Value updatePayload) {
  getUIManagerFromRuntime(rt).setNativeProps_DEPRECATED(
      shadowNode, RawProps(rt, updatePayload));
}

} // namespace facebook::react
