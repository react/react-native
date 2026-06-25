/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RCTLegacyViewManagerInteropCoordinator.h"

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#include <React/RCTBridge+Private.h>
#include <React/RCTBridgeMethod.h>
#include <React/RCTBridgeProxy.h>
#include <React/RCTComponentData.h>
#include <React/RCTEventDispatcherProtocol.h>
#include <React/RCTModuleData.h>
#include <React/RCTModuleMethod.h>
#include <React/RCTUIManager.h>
#include <React/RCTUIManagerUtils.h>
#include <React/RCTUtils.h>
#include <React/RCTViewManager.h>
#include <folly/json.h>
#include <objc/runtime.h>
#include <react/utils/FollyConvert.h>

using namespace facebook::react;

@implementation RCTLegacyViewManagerInteropCoordinator {
  RCTComponentData *_componentData;
  __weak RCTBridge *_bridge;
  __weak RCTBridgeModuleDecorator *_bridgelessInteropData;
  __weak RCTBridgeProxy *_bridgeProxy;

  /*
   Each instance of `RCTLegacyViewManagerInteropComponentView` registers a block to which events are dispatched.
   This is the container that maps unretained UIView pointer to a block to which the event is dispatched.
   */
  NSMutableDictionary<NSNumber *, InterceptorBlock> *_eventInterceptors;

  /*
   * In bridgeless mode, instead of using the bridge to look up RCTModuleData,
   * store that information locally.
   */
  NSMutableArray<id<RCTBridgeMethod>> *_moduleMethods;
  NSMutableDictionary<NSString *, id<RCTBridgeMethod>> *_moduleMethodsByName;
}

- (instancetype)initWithComponentData:(RCTComponentData *)componentData
                               bridge:(nullable RCTBridge *)bridge
                          bridgeProxy:(nullable RCTBridgeProxy *)bridgeProxy
                bridgelessInteropData:(RCTBridgeModuleDecorator *)bridgelessInteropData
{
  if (self = [super init]) {
    _componentData = componentData;
    _bridge = bridge;
    _bridgelessInteropData = bridgelessInteropData;
    _bridgeProxy = bridgeProxy;

    if (bridgelessInteropData) {
      //  During bridge mode, RCTBridgeModules will be decorated with these APIs by the bridge.
      RCTAssert(
          _bridge == nil,
          @"RCTLegacyViewManagerInteropCoordinator should not be initialized with RCTBridgeModuleDecorator in bridge mode.");
    }

    _eventInterceptors = [NSMutableDictionary new];

    __weak __typeof(self) weakSelf = self;
    _componentData.eventInterceptor = ^(NSString *eventName, NSDictionary *event, NSNumber *reactTag) {
      __typeof(self) strongSelf = weakSelf;
      if (strongSelf) {
        InterceptorBlock block = [strongSelf->_eventInterceptors objectForKey:reactTag];
        if (block) {
          block(
              std::string([RCTNormalizeInputEventName(eventName) UTF8String]),
              convertIdToFollyDynamic(event ? event : @{}));
        }
      }
    };
  }
  return self;
}

- (void)addObserveForTag:(NSInteger)tag usingBlock:(InterceptorBlock)block
{
  [_eventInterceptors setObject:block forKey:[NSNumber numberWithInteger:tag]];
}

- (void)removeObserveForTag:(NSInteger)tag
{
  [_eventInterceptors removeObjectForKey:[NSNumber numberWithInteger:tag]];
}

- (UIView *)createPaperViewWithTag:(NSInteger)tag
{
  [_bridgelessInteropData attachInteropAPIsToModule:(id<RCTBridgeModule>)_componentData.manager];
  return [_componentData createViewWithTag:[NSNumber numberWithInteger:tag] rootTag:NULL];
}

- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(UIView *)view
{
  [_componentData setProps:props forView:view];

  if ([view respondsToSelector:@selector(didSetProps:)]) {
    [view performSelector:@selector(didSetProps:) withObject:[props allKeys]];
  }
}

- (NSString *)componentViewName
{
  return RCTDropReactPrefixes(_componentData.name);
}

- (void)handleCommand:(NSString *)commandName
                 args:(NSArray *)args
             reactTag:(NSInteger)tag
            paperView:(nonnull UIView *)paperView
{
  Class managerClass = _componentData.managerClass;
  [self _lookupModuleMethodsIfNecessary];
  RCTModuleData *moduleData = [_bridge.batchedBridge moduleDataForName:RCTBridgeModuleNameForClass(managerClass)];
  id<RCTBridgeMethod> method;

  // We can't use `[NSString intValue]` as "0" is a valid command,
  // but also a falsy value. [NSNumberFormatter numberFromString] returns a
  // `NSNumber *` which is NULL when it's to be NULL
  // and it points to 0 when the string is @"0" (not a falsy value).
  NSNumberFormatter *formatter = [[NSNumberFormatter alloc] init];

  if ([commandName isKindOfClass:[NSNumber class]] || [formatter numberFromString:commandName] != NULL) {
    method = moduleData ? moduleData.methods[[commandName intValue]] : _moduleMethods[[commandName intValue]];
  } else if ([commandName isKindOfClass:[NSString class]]) {
    method = moduleData ? moduleData.methodsByName[commandName] : _moduleMethodsByName[commandName];
    if (method == nil) {
      RCTLogError(@"No command found with name \"%@\"", commandName);
    }
  } else {
    RCTLogError(@"dispatchViewManagerCommand must be called with a string or integer command");
    return;
  }

  NSArray *newArgs = [@[ [NSNumber numberWithInteger:tag] ] arrayByAddingObjectsFromArray:args];

  if (_bridge) {
    [self _handleCommandsOnBridge:method withArgs:newArgs];
  } else {
    [self _handleCommandsOnBridgeless:method withArgs:newArgs];
  }
}

#pragma mark - Private
- (void)_handleCommandsOnBridge:(id<RCTBridgeMethod>)method withArgs:(NSArray *)newArgs
{
  [_bridge.batchedBridge
      dispatchBlock:^{
        [method invokeWithBridge:self->_bridge module:self->_componentData.manager arguments:newArgs];
        [self->_bridge.uiManager setNeedsLayout];
      }
              queue:RCTGetUIManagerQueue()];
}

- (void)_handleCommandsOnBridgeless:(id<RCTBridgeMethod>)method withArgs:(NSArray *)newArgs
{
  RCTViewManager *componentViewManager = self->_componentData.manager;
  [componentViewManager setValue:_bridgeProxy forKey:@"bridge"];

  [self->_bridgeProxy.uiManager
      addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        [method invokeWithBridge:nil module:componentViewManager arguments:newArgs];
      }];
}

- (void)_addUIBlock:(RCTViewManagerUIBlock)block
{
  if (_bridge) {
    [self _addUIBlockOnBridge:block];
  } else {
    [self->_bridgeProxy.uiManager addUIBlock:block];
  }
}

- (void)_addUIBlockOnBridge:(RCTViewManagerUIBlock)block
{
  __weak __typeof__(self) weakSelf = self;
  [_bridge.batchedBridge
      dispatchBlock:^{
        __typeof__(self) strongSelf = weakSelf;
        [strongSelf->_bridge.uiManager addUIBlock:block];
      }
              queue:RCTGetUIManagerQueue()];
}

// This is copy-pasta from RCTModuleData.
- (void)_lookupModuleMethodsIfNecessary
{
  if (!_bridge && !_moduleMethods) {
    _moduleMethods = [NSMutableArray new];
    _moduleMethodsByName = [NSMutableDictionary new];

    unsigned int methodCount;
    Class cls = _componentData.managerClass;
    while (cls && cls != [NSObject class] && cls != [NSProxy class]) {
      Method *methods = class_copyMethodList(object_getClass(cls), &methodCount);

      for (unsigned int i = 0; i < methodCount; i++) {
        Method method = methods[i];
        SEL selector = method_getName(method);
        if ([NSStringFromSelector(selector) hasPrefix:@"__rct_export__"]) {
          IMP imp = method_getImplementation(method);
          auto exportedMethod = ((const RCTMethodInfo *(*)(id, SEL))imp)(_componentData.managerClass, selector);
          id<RCTBridgeMethod> moduleMethod =
              [[RCTModuleMethod alloc] initWithExportedMethod:exportedMethod moduleClass:_componentData.managerClass];
          [_moduleMethodsByName setValue:moduleMethod forKey:[NSString stringWithUTF8String:moduleMethod.JSMethodName]];
          [_moduleMethods addObject:moduleMethod];
        }
      }

      free(methods);
      cls = class_getSuperclass(cls);
    }
  }
}

@end

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
