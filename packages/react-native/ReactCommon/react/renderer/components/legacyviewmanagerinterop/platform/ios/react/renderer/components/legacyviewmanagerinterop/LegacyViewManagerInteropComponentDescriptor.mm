/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyViewManagerInteropComponentDescriptor.h"

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#include <React/RCTBridge+Private.h>
#include <React/RCTBridge.h>
#include <React/RCTBridgeModuleDecorator.h>
#include <React/RCTBridgeProxy.h>
#include <React/RCTComponentData.h>
#include <React/RCTEventDispatcher.h>
#include <React/RCTModuleData.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropState.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/ManagedObjectWrapper.h>
#include "RCTLegacyViewManagerInteropCoordinator.h"

namespace facebook::react {

static std::string moduleNameFromComponentNameNoRCTPrefix(const std::string &componentName)
{
  // TODO: remove FB specific code (T56174424)
  if (componentName == "StickerInputView") {
    return "FBStickerInputViewManager";
  }

  if (componentName == "FDSTooltipView") {
    return "FBReactFDSTooltipViewManager";
  }

  std::string fbPrefix("FB");
  if (std::mismatch(fbPrefix.begin(), fbPrefix.end(), componentName.begin()).first == fbPrefix.end()) {
    // If `moduleName` has "FB" prefix.
    return componentName + "Manager";
  }

  std::string artPrefix("ART");
  if (std::mismatch(artPrefix.begin(), artPrefix.end(), componentName.begin()).first == artPrefix.end()) {
    return componentName + "Manager";
  }

  std::string rnPrefix("RN");
  if (std::mismatch(rnPrefix.begin(), rnPrefix.end(), componentName.begin()).first == rnPrefix.end()) {
    return componentName + "Manager";
  }

  return componentName + "Manager";
}

inline NSString *RCTNSStringFromString(const std::string &string)
{
  return [NSString stringWithUTF8String:string.c_str()];
}

static Class getViewManagerFromComponentName(const std::string &componentName)
{
  auto viewManagerName = moduleNameFromComponentNameNoRCTPrefix(componentName);

  // 1. Try to get the manager with the RCT prefix.
  auto rctViewManagerName = "RCT" + viewManagerName;
  Class viewManagerClass = NSClassFromString(RCTNSStringFromString(rctViewManagerName));
  if (viewManagerClass != nullptr) {
    return viewManagerClass;
  }

  // 2. Try to get the manager without the prefix.
  viewManagerClass = NSClassFromString(RCTNSStringFromString(viewManagerName));
  if (viewManagerClass != nullptr) {
    return viewManagerClass;
  }

  return nil;
}

static Class getViewManagerClass(const std::string &componentName, RCTBridge *bridge, RCTBridgeProxy *bridgeProxy)
{
  Class viewManager = getViewManagerFromComponentName(componentName);
  if (viewManager != nil) {
    return viewManager;
  }

  if (ReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS()) {
    NSArray<Class> *modulesClasses = RCTGetModuleClasses();
    for (Class moduleClass in modulesClasses) {
      if ([RCTBridgeModuleNameForClass(moduleClass) isEqualToString:RCTNSStringFromString(componentName)]) {
        return moduleClass;
      }
    }
  } else {
    // If all the heuristics fail, let's try to retrieve the view manager from the bridge/bridgeProxy
    if (bridge != nil) {
      return [[bridge moduleForName:RCTNSStringFromString(componentName)] class];
    }

    if (bridgeProxy != nil) {
      return [[bridgeProxy moduleForName:RCTNSStringFromString(componentName) lazilyLoadIfNecessary:YES] class];
    }
  }

  return nil;
}

static std::shared_ptr<void> constructCoordinator(
    const std::shared_ptr<const ContextContainer> &contextContainer,
    const ComponentDescriptor::Flavor &flavor)
{
  auto optionalBridge = contextContainer->find<std::shared_ptr<void>>("Bridge");
  RCTBridge *bridge;
  if (optionalBridge) {
    bridge = unwrapManagedObjectWeakly(optionalBridge.value());
  }

  RCTBridgeProxy *bridgeProxy;
  auto optionalBridgeProxy = contextContainer->find<std::shared_ptr<void>>("RCTBridgeProxy");
  if (optionalBridgeProxy) {
    bridgeProxy = unwrapManagedObjectWeakly(optionalBridgeProxy.value());
  }

  auto componentName = *std::static_pointer_cast<const std::string>(flavor);
  Class viewManagerClass = getViewManagerClass(componentName, bridge, bridgeProxy);
  assert(viewManagerClass);

  auto optionalEventDispatcher = contextContainer->find<std::shared_ptr<void>>("RCTEventDispatcher");
  RCTEventDispatcher *eventDispatcher;
  if (optionalEventDispatcher) {
    eventDispatcher = unwrapManagedObject(optionalEventDispatcher.value());
  }

  auto optionalModuleDecorator = contextContainer->find<std::shared_ptr<void>>("RCTBridgeModuleDecorator");
  RCTBridgeModuleDecorator *bridgeModuleDecorator;
  if (optionalModuleDecorator) {
    bridgeModuleDecorator = unwrapManagedObject(optionalModuleDecorator.value());
  }

  RCTComponentData *componentData =
      [[RCTComponentData alloc] initWithManagerClass:viewManagerClass
                                              bridge:bridge != nil ? bridge : (RCTBridge *)bridgeProxy
                                     eventDispatcher:eventDispatcher];
  return wrapManagedObject([[RCTLegacyViewManagerInteropCoordinator alloc]
      initWithComponentData:componentData
                     bridge:bridge
                bridgeProxy:bridgeProxy
      bridgelessInteropData:bridgeModuleDecorator]);
}

LegacyViewManagerInteropComponentDescriptor::LegacyViewManagerInteropComponentDescriptor(
    const ComponentDescriptorParameters &parameters)
    : ConcreteComponentDescriptor(parameters), _coordinator(constructCoordinator(contextContainer_, flavor_))
{
}

ComponentHandle LegacyViewManagerInteropComponentDescriptor::getComponentHandle() const
{
  return reinterpret_cast<ComponentHandle>(getComponentName());
}

ComponentName LegacyViewManagerInteropComponentDescriptor::getComponentName() const
{
  return static_cast<const std::string *>(flavor_.get())->c_str();
}

void LegacyViewManagerInteropComponentDescriptor::adopt(ShadowNode &shadowNode) const
{
  ConcreteComponentDescriptor::adopt(shadowNode);

  auto &legacyViewManagerInteropShadowNode = static_cast<LegacyViewManagerInteropShadowNode &>(shadowNode);

  auto state = LegacyViewManagerInteropState{};
  state.coordinator = _coordinator;

  legacyViewManagerInteropShadowNode.setStateData(std::move(state));
}
} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
