/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UIManagerBinding.h"

#include <cxxreact/TraceSection.h>
#include <glog/logging.h>
#include <jsi/JSIDynamic.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/components/view/PointerEvent.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/dom/DOM.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>
#include <react/renderer/uimanager/primitives.h>

#include <utility>

namespace facebook::react {

void UIManagerBinding::createAndInstallIfNeeded(
    jsi::Runtime& runtime,
    const std::shared_ptr<UIManager>& uiManager) {
  auto uiManagerModuleName = "nativeFabricUIManager";

  auto uiManagerValue =
      runtime.global().getProperty(runtime, uiManagerModuleName);
  if (uiManagerValue.isUndefined()) {
    // The global namespace does not have an instance of the binding;
    // we need to create, install and return it.
    auto uiManagerBinding = std::make_shared<UIManagerBinding>(uiManager);
    auto object = jsi::Object::createFromHostObject(runtime, uiManagerBinding);
    runtime.global().setProperty(
        runtime, uiManagerModuleName, std::move(object));
  }
}

std::shared_ptr<UIManagerBinding> UIManagerBinding::getBinding(
    jsi::Runtime& runtime) {
  auto uiManagerModuleName = "nativeFabricUIManager";

  auto uiManagerValue =
      runtime.global().getProperty(runtime, uiManagerModuleName);
  if (uiManagerValue.isUndefined()) {
    return nullptr;
  }

  auto uiManagerObject = uiManagerValue.asObject(runtime);
  return uiManagerObject.getHostObject<UIManagerBinding>(runtime);
}

UIManagerBinding::UIManagerBinding(std::shared_ptr<UIManager> uiManager)
    : uiManager_(std::move(uiManager)) {}

UIManagerBinding::~UIManagerBinding() {
  LOG(WARNING) << "UIManagerBinding::~UIManagerBinding() was called (address: "
               << this << ").";
}

void UIManagerBinding::dispatchEvent(
    jsi::Runtime& runtime,
    EventTarget* eventTarget,
    const std::string& type,
    ReactEventPriority priority,
    const EventPayload& eventPayload,
    HighResTimeStamp eventTimestamp) const {
  TraceSection s("UIManagerBinding::dispatchEvent", "type", type);

  if (eventPayload.getType() == EventPayloadType::PointerEvent) {
    auto pointerEvent = static_cast<const PointerEvent&>(eventPayload);
    auto dispatchCallback = [this, &runtime, eventTimestamp](
                                const ShadowNode& targetNode,
                                const std::string& type,
                                ReactEventPriority priority,
                                const EventPayload& eventPayload) {
      auto eventTarget = targetNode.getEventEmitter()->getEventTarget();
      if (eventTarget != nullptr) {
        eventTarget->retain(runtime);
        this->dispatchEventToJS(
            runtime,
            eventTarget.get(),
            type,
            priority,
            eventPayload,
            eventTimestamp);
        eventTarget->release(runtime);
      }
    };
    auto targetNode = PointerEventsProcessor::getShadowNodeFromEventTarget(
        runtime, eventTarget);
    if (targetNode != nullptr) {
      pointerEventsProcessor_.interceptPointerEvent(
          targetNode,
          type,
          priority,
          pointerEvent,
          dispatchCallback,
          *uiManager_);
    }
  } else {
    dispatchEventToJS(
        runtime, eventTarget, type, priority, eventPayload, eventTimestamp);
  }
}

void UIManagerBinding::dispatchEventToJS(
    jsi::Runtime& runtime,
    EventTarget* eventTarget,
    const std::string& type,
    ReactEventPriority priority,
    const EventPayload& eventPayload,
    HighResTimeStamp eventTimestamp) const {
  auto payload = eventPayload.asJSIValue(runtime);

  // If a payload is null, the factory has decided to cancel the event
  if (payload.isNull()) {
    return;
  }

  auto instanceHandle = eventTarget != nullptr ? [&]() {
    auto instanceHandle = eventTarget->getInstanceHandle(runtime);
    if (instanceHandle.isUndefined()) {
      return jsi::Value::null();
    }

    // Mixing `target` into `payload`.
    if (!payload.isObject()) {
      LOG(ERROR) << "payload for dispatchEvent is not an object: "
                 << eventTarget->getTag();
    }
    react_native_assert(payload.isObject());
    payload.asObject(runtime).setProperty(
        runtime, "target", eventTarget->getTag());
    return instanceHandle;
  }()
                                               : jsi::Value::null();

  if (instanceHandle.isNull()) {
    // Do not log all missing instanceHandles to avoid log spam
    LOG_EVERY_N(INFO, 10) << "instanceHandle is null, event of type " << type
                          << " will be dropped";
  }

  // Add timestamp to payload if not already set
  if (payload.isObject()) {
    auto payloadObject = payload.asObject(runtime);
    if (!payloadObject.hasProperty(runtime, "timeStamp")) {
      payloadObject.setProperty(
          runtime, "timeStamp", eventTimestamp.toDOMHighResTimeStamp());
    }
  }

  currentEventPriority_ = priority;
  if (eventHandler_) {
    eventHandler_->call(
        runtime,
        std::move(instanceHandle),
        jsi::String::createFromUtf8(runtime, type),
        std::move(payload));
  }
  currentEventPriority_ = ReactEventPriority::Default;
}

void UIManagerBinding::invalidate() const {
  uiManager_->setDelegate(nullptr);
}

static void validateArgumentCount(
    jsi::Runtime& runtime,
    const std::string& methodName,
    size_t expected,
    size_t actual) {
  if (actual < expected) {
    throw jsi::JSError(
        runtime,
        methodName + " requires " + std::to_string(expected) +
            " arguments, but only " + std::to_string(actual) + " were passed");
  }
}

jsi::Value UIManagerBinding::get(
    jsi::Runtime& runtime,
    const jsi::PropNameID& name) {
  auto methodName = name.utf8(runtime);

  // Convert shared_ptr<UIManager> to a raw ptr
  // Why? Because:
  // 1) UIManagerBinding strongly retains UIManager. The JS VM
  //    strongly retains UIManagerBinding (through the JSI).
  //    These functions are JSI functions and are only called via
  //    the JS VM; if the JS VM is torn down, those functions can't
  //    execute and these lambdas won't execute.
  // 2) The UIManager is only deallocated when all references to it
  //    are deallocated, including the UIManagerBinding. That only
  //    happens when the JS VM is deallocated. So, the raw pointer
  //    is safe.
  //
  // Even if it's safe, why not just use shared_ptr anyway as
  //  extra insurance?
  // 1) Using shared_ptr or weak_ptr when they're not needed is
  //    a pessimisation. It's more instructions executed without
  //    any additional value in this case.
  // 2) How and when exactly these lambdas is deallocated is
  //    complex. Adding shared_ptr to them which causes the UIManager
  //    to potentially live longer is unnecessary, complicated cognitive
  //    overhead.
  // 3) There is a strong suspicion that retaining UIManager from
  //    these C++ lambdas, which are retained by an object that is held onto
  //    by the JSI, caused some crashes upon deallocation of the
  //    Scheduler and JS VM. This could happen if, for instance, C++
  //    semantics cause these lambda to not be deallocated until
  //    a CPU tick (or more) after the JS VM is deallocated.
  UIManager* uiManager = uiManager_.get();

  // Semantic: Creates a new node with given pieces.
  if (methodName == "createNode") {
    auto paramCount = 5;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          try {
            validateArgumentCount(runtime, methodName, paramCount, count);

            auto instanceHandle =
                instanceHandleFromValue(runtime, arguments[4], arguments[0]);
            if (!instanceHandle) {
              react_native_assert(false);
              return jsi::Value::undefined();
            }

            return valueFromShadowNode(
                runtime,
                uiManager->createNode(
                    tagFromValue(arguments[0]),
                    stringFromValue(runtime, arguments[1]),
                    surfaceIdFromValue(runtime, arguments[2]),
                    RawProps(runtime, arguments[3]),
                    std::move(instanceHandle)),
                true);
          } catch (const std::logic_error& ex) {
            LOG(FATAL) << "logic_error in createNode: " << ex.what();
          }
        });
  }

  if (methodName == "setIsJSResponder") {
    auto paramCount = 3;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          uiManager->setIsJSResponder(
              Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                  runtime, arguments[0]),
              arguments[1].getBool(),
              arguments[2].getBool());

          return jsi::Value::undefined();
        });
  }

  if (methodName == "findNodeAtPoint") {
    auto paramCount = 4;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto node = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
              runtime, arguments[0]);
          auto locationX = (Float)arguments[1].getNumber();
          auto locationY = (Float)arguments[2].getNumber();
          auto onSuccessFunction =
              arguments[3].getObject(runtime).getFunction(runtime);
          auto targetNode = uiManager->findNodeAtPoint(
              node, Point{.x = locationX, .y = locationY});

          if (!targetNode) {
            onSuccessFunction.call(runtime, jsi::Value::null());
            return jsi::Value::undefined();
          }

          auto& eventTarget = targetNode->getEventEmitter()->eventTarget_;

          EventEmitter::DispatchMutex().lock();
          eventTarget->retain(runtime);
          auto instanceHandle = eventTarget->getInstanceHandle(runtime);
          eventTarget->release(runtime);
          EventEmitter::DispatchMutex().unlock();

          onSuccessFunction.call(runtime, std::move(instanceHandle));
          return jsi::Value::undefined();
        });
  }

  // Semantic: Clones the node with *same* props and *given* children.
  if (methodName == "cloneNodeWithNewChildren") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          // TODO: re-enable when passChildrenWhenCloningPersistedNodes is
          // rolled out
          // validateArgumentCount(runtime, methodName, paramCount, count);

          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(
                  *Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                      runtime, arguments[0]),
                  count > 1 ? shadowNodeListFromValue(runtime, arguments[1])
                            : ShadowNode::emptySharedShadowNodeSharedList(),
                  RawProps()),
              true);
        });
  }

  // Semantic: Clones the node with *given* props and *same* children.
  if (methodName == "cloneNodeWithNewProps") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(
                  *Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                      runtime, arguments[0]),
                  nullptr,
                  RawProps(runtime, arguments[1])),
              true);
        });
  }

  // Semantic: Clones the node with *given* props and *given* children.
  if (methodName == "cloneNodeWithNewChildrenAndProps") {
    auto paramCount = 3;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          // TODO: re-enable when passChildrenWhenCloningPersistedNodes is
          // rolled out
          // validateArgumentCount(runtime, methodName, paramCount, count);

          bool hasChildrenArg = count == 3;
          return valueFromShadowNode(
              runtime,
              uiManager->cloneNode(
                  *Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                      runtime, arguments[0]),
                  hasChildrenArg
                      ? shadowNodeListFromValue(runtime, arguments[1])
                      : ShadowNode::emptySharedShadowNodeSharedList(),
                  RawProps(runtime, arguments[hasChildrenArg ? 2 : 1])),
              true);
        });
  }

  if (methodName == "appendChild") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          uiManager->appendChild(
              Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                  runtime, arguments[0]),
              Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                  runtime, arguments[1]));
          return jsi::Value::undefined();
        });
  }

  // TODO: remove when passChildrenWhenCloningPersistedNodes is rolled out
  if (methodName == "createChildSet") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        0,
        [](jsi::Runtime& runtime,
           const jsi::Value& /*thisValue*/,
           const jsi::Value* /*arguments*/,
           size_t /*count*/) -> jsi::Value {
          auto shadowNodeList =
              std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
                  std::vector<std::shared_ptr<const ShadowNode>>({}));
          return valueFromShadowNodeList(runtime, shadowNodeList);
        });
  }

  // TODO: remove when passChildrenWhenCloningPersistedNodes is rolled out
  if (methodName == "appendChildToSet") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNodeList = shadowNodeListFromValue(runtime, arguments[0]);
          auto shadowNode = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
              runtime, arguments[1]);
          shadowNodeList->push_back(shadowNode);
          return jsi::Value::undefined();
        });
  }

  if (methodName == "completeRoot") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto runtimeSchedulerBinding =
              RuntimeSchedulerBinding::getBinding(runtime);
          auto surfaceId = surfaceIdFromValue(runtime, arguments[0]);

          auto shadowNodeList = shadowNodeListFromValue(runtime, arguments[1]);
          uiManager->completeSurface(
              surfaceId,
              shadowNodeList,
              {.enableStateReconciliation = true,
               .mountSynchronously = false,
               .source = ShadowTree::CommitSource::React});

          return jsi::Value::undefined();
        });
  }

  if (methodName == "registerEventHandler") {
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [this, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto eventHandler =
              arguments[0].getObject(runtime).getFunction(runtime);
          eventHandler_ =
              std::make_unique<jsi::Function>(std::move(eventHandler));
          return jsi::Value::undefined();
        });
  }

  if (methodName == "getRelativeLayoutMetrics") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto layoutMetrics = uiManager->getRelativeLayoutMetrics(
              *Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                  runtime, arguments[0]),
              Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                  runtime, arguments[1])
                  .get(),
              {/* .includeTransform = */ .includeTransform = false});
          auto frame = layoutMetrics.frame;
          auto result = jsi::Object(runtime);
          result.setProperty(runtime, "left", frame.origin.x);
          result.setProperty(runtime, "top", frame.origin.y);
          result.setProperty(runtime, "width", frame.size.width);
          result.setProperty(runtime, "height", frame.size.height);
          return result;
        });
  }

  if (methodName == "dispatchCommand") {
    auto paramCount = 3;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          if (arguments[0].isObject()) {
            auto shadowNode =
                Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                    runtime, arguments[0]);
            uiManager->dispatchCommand(
                shadowNode,
                stringFromValue(runtime, arguments[1]),
                commandArgsFromValue(runtime, arguments[2]));
          }
          return jsi::Value::undefined();
        });
  }

  if (methodName == "setNativeProps") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value&,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          uiManager->setNativeProps_DEPRECATED(
              Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                  runtime, arguments[0]),
              RawProps(runtime, arguments[1]));

          return jsi::Value::undefined();
        });
  }

  // Legacy API
  if (methodName == "measureLayout") {
    auto paramCount = 4;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
              runtime, arguments[0]);
          auto relativeToShadowNode =
              Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                  runtime, arguments[1]);
          auto onFailFunction =
              arguments[2].getObject(runtime).getFunction(runtime);
          auto onSuccessFunction =
              arguments[3].getObject(runtime).getFunction(runtime);

          auto currentRevision =
              uiManager->getShadowTreeRevisionProvider()->getCurrentRevision(
                  shadowNode->getSurfaceId());
          if (currentRevision == nullptr) {
            onFailFunction.call(runtime);
            return jsi::Value::undefined();
          }

          auto maybeRect = dom::measureLayout(
              currentRevision, *shadowNode, *relativeToShadowNode);

          if (!maybeRect) {
            onFailFunction.call(runtime);
            return jsi::Value::undefined();
          }

          auto rect = maybeRect.value();

          onSuccessFunction.call(
              runtime,
              {jsi::Value{runtime, rect.x},
               jsi::Value{runtime, rect.y},
               jsi::Value{runtime, rect.width},
               jsi::Value{runtime, rect.height}});
          return jsi::Value::undefined();
        });
  }

  if (methodName == "measure") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
              runtime, arguments[0]);
          auto callbackFunction =
              arguments[1].getObject(runtime).getFunction(runtime);

          auto currentRevision =
              uiManager->getShadowTreeRevisionProvider()->getCurrentRevision(
                  shadowNode->getSurfaceId());
          if (currentRevision == nullptr) {
            callbackFunction.call(runtime, {0, 0, 0, 0, 0, 0});
            return jsi::Value::undefined();
          }

          auto measureRect = dom::measure(currentRevision, *shadowNode);

          callbackFunction.call(
              runtime,
              {jsi::Value{runtime, measureRect.x},
               jsi::Value{runtime, measureRect.y},
               jsi::Value{runtime, measureRect.width},
               jsi::Value{runtime, measureRect.height},
               jsi::Value{runtime, measureRect.pageX},
               jsi::Value{runtime, measureRect.pageY}});
          return jsi::Value::undefined();
        });
  }

  if (methodName == "measureInWindow") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
              runtime, arguments[0]);
          auto callbackFunction =
              arguments[1].getObject(runtime).getFunction(runtime);

          auto currentRevision =
              uiManager->getShadowTreeRevisionProvider()->getCurrentRevision(
                  shadowNode->getSurfaceId());

          if (currentRevision == nullptr) {
            callbackFunction.call(runtime, {0, 0, 0, 0});
            return jsi::Value::undefined();
          }

          auto rect = dom::measureInWindow(currentRevision, *shadowNode);
          callbackFunction.call(
              runtime,
              {jsi::Value{runtime, rect.x},
               jsi::Value{runtime, rect.y},
               jsi::Value{runtime, rect.width},
               jsi::Value{runtime, rect.height}});
          return jsi::Value::undefined();
        });
  }

  if (methodName == "sendAccessibilityEvent") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          uiManager->sendAccessibilityEvent(
              Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                  runtime, arguments[0]),
              stringFromValue(runtime, arguments[1]));

          return jsi::Value::undefined();
        });
  }

  if (methodName == "configureNextLayoutAnimation") {
    auto paramCount = 3;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          uiManager->configureNextLayoutAnimation(
              runtime,
              // TODO: pass in JSI value instead of folly::dynamic to RawValue
              RawValue(commandArgsFromValue(runtime, arguments[0])),
              arguments[1],
              arguments[2]);
          return jsi::Value::undefined();
        });
  }

  if (methodName == "unstable_getCurrentEventPriority") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        0,
        [this](
            jsi::Runtime& /*runtime*/,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* /*arguments*/,
            size_t /*count*/) -> jsi::Value {
          return {serialize(currentEventPriority_)};
        });
  }

  if (methodName == "unstable_DefaultEventPriority") {
    return {serialize(ReactEventPriority::Default)};
  }

  if (methodName == "unstable_DiscreteEventPriority") {
    return {serialize(ReactEventPriority::Discrete)};
  }

  if (methodName == "unstable_ContinuousEventPriority") {
    return {serialize(ReactEventPriority::Continuous)};
  }

  if (methodName == "unstable_IdleEventPriority") {
    return {serialize(ReactEventPriority::Idle)};
  }

  if (methodName == "findShadowNodeByTag_DEPRECATED") {
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value&,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = uiManager->findShadowNodeByTag_DEPRECATED(
              tagFromValue(arguments[0]));

          if (!shadowNode) {
            return jsi::Value::null();
          }

          return valueFromShadowNode(runtime, shadowNode);
        });
  }

  if (methodName == "getBoundingClientRect") {
    // This has been moved to `NativeDOM` but we need to keep it here because
    // there are still some callsites using this method in apps that don't have
    // the DOM APIs enabled yet.
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
              runtime, arguments[0]);
          bool includeTransform = arguments[1].getBool();

          auto currentRevision =
              uiManager->getShadowTreeRevisionProvider()->getCurrentRevision(
                  shadowNode->getSurfaceId());

          if (currentRevision == nullptr) {
            return jsi::Value::undefined();
          }

          auto domRect = dom::getBoundingClientRect(
              currentRevision, *shadowNode, includeTransform);

          return jsi::Array::createWithElements(
              runtime,
              jsi::Value{runtime, domRect.x},
              jsi::Value{runtime, domRect.y},
              jsi::Value{runtime, domRect.width},
              jsi::Value{runtime, domRect.height});
        });
  }

  if (methodName == "compareDocumentPosition") {
    // This has been moved to `NativeDOM` but we need to keep it here because
    // there are still some callsites using this method in apps that don't have
    // the DOM APIs enabled yet.
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto shadowNode = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
              runtime, arguments[0]);
          auto otherShadowNode =
              Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                  runtime, arguments[1]);

          auto currentRevision =
              uiManager->getShadowTreeRevisionProvider()->getCurrentRevision(
                  shadowNode->getSurfaceId());

          double documentPosition = 0;

          if (currentRevision != nullptr) {
            documentPosition = (double)dom::compareDocumentPosition(
                currentRevision, *shadowNode, *otherShadowNode);
          }

          return {documentPosition};
        });
  }

  if (methodName == "measureInstance") {
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          if (!arguments[0].isObject()) {
            auto result = jsi::Object(runtime);
            result.setProperty(runtime, "x", 0);
            result.setProperty(runtime, "y", 0);
            result.setProperty(runtime, "width", 0);
            result.setProperty(runtime, "height", 0);
            return result;
          }

          auto shadowNode = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
              runtime, arguments[0]);

          auto currentRevision =
              uiManager->getShadowTreeRevisionProvider()->getCurrentRevision(
                  shadowNode->getSurfaceId());

          if (currentRevision == nullptr) {
            auto result = jsi::Object(runtime);
            result.setProperty(runtime, "x", 0);
            result.setProperty(runtime, "y", 0);
            result.setProperty(runtime, "width", 0);
            result.setProperty(runtime, "height", 0);
            return result;
          }

          auto domRect = dom::getBoundingClientRect(
              currentRevision, *shadowNode, true /* includeTransform */);

          auto result = jsi::Object(runtime);
          result.setProperty(runtime, "x", domRect.x);
          result.setProperty(runtime, "y", domRect.y);
          result.setProperty(runtime, "width", domRect.width);
          result.setProperty(runtime, "height", domRect.height);

          return result;
        });
  }

  if (methodName == "applyViewTransitionName") {
    auto paramCount = 3;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          if (arguments[0].isObject()) {
            auto shadowNode =
                Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                    runtime, arguments[0]);
            auto transitionName = arguments[1].isString()
                ? stringFromValue(runtime, arguments[1])
                : "";
            auto className = arguments[2].isString()
                ? stringFromValue(runtime, arguments[2])
                : "";
            if (!transitionName.empty()) {
              auto* viewTransitionDelegate =
                  uiManager->getViewTransitionDelegate();
              if (viewTransitionDelegate != nullptr) {
                viewTransitionDelegate->applyViewTransitionName(
                    *shadowNode, transitionName, className);
              }
            }
          }

          return jsi::Value::undefined();
        });
  }

  if (methodName == "createViewTransitionInstance") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto transitionName = arguments[0].isString()
              ? stringFromValue(runtime, arguments[0])
              : "";
          auto pseudoElementTag = tagFromValue(arguments[1]);

          if (!transitionName.empty()) {
            auto* viewTransitionDelegate =
                uiManager->getViewTransitionDelegate();
            if (viewTransitionDelegate != nullptr) {
              viewTransitionDelegate->createViewTransitionInstance(
                  transitionName, pseudoElementTag);
            }
          }

          return jsi::Value::undefined();
        });
  }

  if (methodName == "cancelViewTransitionName") {
    auto paramCount = 2;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          if (arguments[0].isObject()) {
            auto shadowNode =
                Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                    runtime, arguments[0]);
            auto transitionName = arguments[1].isString()
                ? stringFromValue(runtime, arguments[1])
                : "";
            if (!transitionName.empty()) {
              auto* viewTransitionDelegate =
                  uiManager->getViewTransitionDelegate();
              if (viewTransitionDelegate != nullptr) {
                viewTransitionDelegate->cancelViewTransitionName(
                    *shadowNode, transitionName);
              }
            }
          }

          return jsi::Value::undefined();
        });
  }

  if (methodName == "restoreViewTransitionName") {
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          if (arguments[0].isObject()) {
            auto shadowNode =
                Bridging<std::shared_ptr<const ShadowNode>>::fromJs(
                    runtime, arguments[0]);
            auto* viewTransitionDelegate =
                uiManager->getViewTransitionDelegate();
            if (viewTransitionDelegate != nullptr) {
              viewTransitionDelegate->restoreViewTransitionName(*shadowNode);
            }
          }

          return jsi::Value::undefined();
        });
  }

  if (methodName == "suspendOnActiveViewTransition") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        0,
        [uiManager](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* /*arguments*/,
            size_t /*count*/) -> jsi::Value {
          auto* viewTransitionDelegate = uiManager->getViewTransitionDelegate();
          if (viewTransitionDelegate != nullptr) {
            viewTransitionDelegate->suspendOnActiveViewTransition();
          }
          return jsi::Value::undefined();
        });
  }

  if (methodName == "startViewTransitionReadyFinished") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        0,
        [uiManager](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* /*arguments*/,
            size_t /*count*/) -> jsi::Value {
          auto* viewTransitionDelegate = uiManager->getViewTransitionDelegate();
          if (viewTransitionDelegate != nullptr) {
            viewTransitionDelegate->startViewTransitionReadyFinished();
          }
          return jsi::Value::undefined();
        });
  }

  if (methodName == "startViewTransition") {
    auto paramCount = 1;
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        paramCount,
        [uiManager, methodName, paramCount](
            jsi::Runtime& runtime,
            const jsi::Value& /*thisValue*/,
            const jsi::Value* arguments,
            size_t count) -> jsi::Value {
          validateArgumentCount(runtime, methodName, paramCount, count);

          auto* viewTransitionDelegate = uiManager->getViewTransitionDelegate();
          if (viewTransitionDelegate == nullptr) {
            return jsi::Value::undefined();
          }

          auto promiseConstructor =
              runtime.global().getPropertyAsFunction(runtime, "Promise");

          std::shared_ptr<jsi::Function> readyResolveFunc;
          std::shared_ptr<jsi::Function> finishedResolveFunc;

          auto mutationFunc = std::make_shared<jsi::Function>(
              arguments[0].asObject(runtime).asFunction(runtime));

          auto readyPromise = promiseConstructor.callAsConstructor(
              runtime,
              jsi::Function::createFromHostFunction(
                  runtime,
                  jsi::PropNameID::forAscii(runtime, "readyExecutor"),
                  2,
                  [&readyResolveFunc](
                      jsi::Runtime& runtime,
                      const jsi::Value& /*thisValue*/,
                      const jsi::Value* args,
                      size_t /*count*/) -> jsi::Value {
                    readyResolveFunc = std::make_shared<jsi::Function>(
                        args[0].asObject(runtime).asFunction(runtime));
                    return jsi::Value::undefined();
                  }));

          auto finishedPromise = promiseConstructor.callAsConstructor(
              runtime,
              jsi::Function::createFromHostFunction(
                  runtime,
                  jsi::PropNameID::forAscii(runtime, "finishedExecutor"),
                  2,
                  [&finishedResolveFunc, viewTransitionDelegate](
                      jsi::Runtime& rt,
                      const jsi::Value& /*thisValue*/,
                      const jsi::Value* args,
                      size_t /*count*/) mutable -> jsi::Value {
                    auto onCompleteFunc = std::make_shared<jsi::Function>(
                        args[0].asObject(rt).asFunction(rt));
                    finishedResolveFunc = std::make_shared<jsi::Function>(
                        jsi::Function::createFromHostFunction(
                            rt,
                            jsi::PropNameID::forAscii(rt, "finishedResolve"),
                            0,
                            [onCompleteFunc = std::move(onCompleteFunc),
                             viewTransitionDelegate =
                                 std::move(viewTransitionDelegate)](
                                jsi::Runtime& runtime,
                                const jsi::Value& /*thisValue*/,
                                const jsi::Value* /*args*/,
                                size_t /*count*/) -> jsi::Value {
                              onCompleteFunc->call(runtime);
                              viewTransitionDelegate->startViewTransitionEnd();
                              return jsi::Value::undefined();
                            }));
                    return jsi::Value::undefined();
                  }));

          auto result = jsi::Object(runtime);
          result.setProperty(runtime, "ready", std::move(readyPromise));
          result.setProperty(runtime, "finished", std::move(finishedPromise));

          viewTransitionDelegate->startViewTransition(
              [&runtime, mutationFunc = std::move(mutationFunc)]() {
                // mutationCallback is called synchronously by the
                // delegate during startViewTransition, so &runtime is
                // valid (it comes from the enclosing host function).
                mutationFunc->call(runtime);
              },
              [readyResolveFunc = std::move(readyResolveFunc), &runtime]() {
                // onReadyCallback is called synchronously on the JS
                // thread by the delegate, so &runtime is valid.
                if (readyResolveFunc) {
                  readyResolveFunc->call(runtime);
                }
              },
              [finishedResolveFunc = std::move(finishedResolveFunc),
               runtimeExecutor = uiManager->runtimeExecutor_]() {
                runtimeExecutor(
                    [finishedResolveFunc = std::move(finishedResolveFunc)](
                        jsi::Runtime& rt) mutable {
                      if (finishedResolveFunc) {
                        finishedResolveFunc->call(rt);
                      }
                    });
              });

          return jsi::Value(runtime, result);
        });
  }

  return jsi::Value::undefined();
}

UIManager& UIManagerBinding::getUIManager() {
  return *uiManager_;
}

PointerEventsProcessor& UIManagerBinding::getPointerEventsProcessor() {
  return pointerEventsProcessor_;
}

} // namespace facebook::react
