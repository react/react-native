/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTUIManager.h"

#import <AVFoundation/AVFoundation.h>
#import <React/RCTDefines.h>
#import <React/RCTSurfacePresenterStub.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>

#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTComponent.h"
#import "RCTComponentData.h"
#import "RCTConvert.h"
#import "RCTEventDispatcherProtocol.h"
#import "RCTLayoutAnimation.h"
#import "RCTLayoutAnimationGroup.h"
#import "RCTLog.h"
#import "RCTModuleData.h"
#import "RCTModuleMethod.h"
#import "RCTProfile.h"
#import "RCTScrollableProtocol.h"
#import "RCTShadowView.h"
#import "RCTSurfaceRootShadowView.h"
#import "RCTSurfaceRootView.h"
#import "RCTUIManagerObserverCoordinator.h"
#import "RCTUIManagerUtils.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "RCTViewManager.h"
#import "UIView+React.h"

NSMutableDictionary<NSString *, id> *RCTModuleConstantsForDestructuredComponent(
    NSMutableDictionary<NSString *, NSDictionary *> *directEvents,
    NSMutableDictionary<NSString *, NSDictionary *> *bubblingEvents,
    Class managerClass,
    NSString *name,
    NSDictionary<NSString *, id> *viewConfig)
{
  NSMutableDictionary<NSString *, id> *moduleConstants = [NSMutableDictionary new];

  // Register which event-types this view dispatches.
  // React needs this for the event plugin.
  NSMutableDictionary<NSString *, NSDictionary *> *bubblingEventTypes = [NSMutableDictionary new];
  NSMutableDictionary<NSString *, NSDictionary *> *directEventTypes = [NSMutableDictionary new];

  // Add manager class
  moduleConstants[@"Manager"] = RCTBridgeModuleNameForClass(managerClass);

  // Add native props
  moduleConstants[@"NativeProps"] = viewConfig[@"propTypes"];
  moduleConstants[@"baseModuleName"] = viewConfig[@"baseModuleName"];
  moduleConstants[@"bubblingEventTypes"] = bubblingEventTypes;
  moduleConstants[@"directEventTypes"] = directEventTypes;
  // In the Old Architecture the "Commands" and "Constants" properties of view manager config are populated by
  // lazifyViewManagerConfig function in JS. This fuction uses NativeModules global object that is not available in the
  // New Architecture. To make native view configs work in the New Architecture we will populate these properties in
  // native.
  if (facebook::react::ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode()) {
    moduleConstants[@"Commands"] = viewConfig[@"Commands"];
    moduleConstants[@"Constants"] = viewConfig[@"Constants"];
  }
  // Add direct events
  for (NSString *eventName in viewConfig[@"directEvents"]) {
    if (!directEvents[eventName]) {
      directEvents[eventName] = @{
        @"registrationName" : [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"],
      };
    }
    directEventTypes[eventName] = directEvents[eventName];
    if (RCT_DEBUG && bubblingEvents[eventName]) {
      RCTLogError(
          @"Component '%@' re-registered bubbling event '%@' as a "
           "direct event",
          name,
          eventName);
    }
  }

  // Add bubbling events
  for (NSString *eventName in viewConfig[@"bubblingEvents"]) {
    if (!bubblingEvents[eventName]) {
      NSString *bubbleName = [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"];
      bubblingEvents[eventName] = @{
        @"phasedRegistrationNames" : @{
          @"bubbled" : bubbleName,
          @"captured" : [bubbleName stringByAppendingString:@"Capture"],
        }
      };
    }
    bubblingEventTypes[eventName] = bubblingEvents[eventName];
    if (RCT_DEBUG && directEvents[eventName]) {
      RCTLogError(
          @"Component '%@' re-registered direct event '%@' as a "
           "bubbling event",
          name,
          eventName);
    }
  }

  // Add capturing events (added as bubbling events but with the 'skipBubbling' flag)
  for (NSString *eventName in viewConfig[@"capturingEvents"]) {
    if (!bubblingEvents[eventName]) {
      NSString *bubbleName = [eventName stringByReplacingCharactersInRange:(NSRange){0, 3} withString:@"on"];
      bubblingEvents[eventName] = @{
        @"phasedRegistrationNames" : @{
          @"bubbled" : bubbleName,
          @"captured" : [bubbleName stringByAppendingString:@"Capture"],
          @"skipBubbling" : @YES
        }
      };
    }
    bubblingEventTypes[eventName] = bubblingEvents[eventName];
    if (RCT_DEBUG && directEvents[eventName]) {
      RCTLogError(
          @"Component '%@' re-registered direct event '%@' as a "
           "bubbling event",
          name,
          eventName);
    }
  }

  return moduleConstants;
}

@implementation RCTUIManager
- (void)registerRootViewTag:(NSNumber *)rootTag
{
}

- (void)registerRootView:(UIView *)rootView
{
}

- (UIView *)viewForReactTag:(NSNumber *)reactTag
{
  return nil;
}

- (void)removeViewFromRegistry:(NSNumber *)reactTag
{
}

- (NSString *)viewNameForReactTag:(NSNumber *)reactTag
{
  return nil;
}

- (RCTShadowView *)shadowViewForReactTag:(NSNumber *)reactTag
{
  return nil;
}

- (void)setAvailableSize:(CGSize)availableSize forRootView:(UIView *)rootView
{
}

- (void)setLocalData:(NSObject *)localData forView:(UIView *)view
{
}

- (void)setSize:(CGSize)size forView:(UIView *)view
{
}

- (void)setIntrinsicContentSize:(CGSize)intrinsicContentSize forView:(UIView *)view
{
}

- (void)setNextLayoutAnimationGroup:(RCTLayoutAnimationGroup *)layoutAnimationGroup
{
}

- (void)addUIBlock:(__strong RCTViewManagerUIBlock)block
{
}

- (void)prependUIBlock:(__strong RCTViewManagerUIBlock)block
{
}

- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag viewName:(NSString *)viewName props:(NSDictionary *)props
{
}

- (void)rootViewForReactTag:(NSNumber *)reactTag withCompletion:(void (^__strong)(UIView *__strong))completion
{
}

- (UIView *)viewForNativeID:(NSString *)nativeID withRootTag:(NSNumber *)rootTag
{
  return nil;
}

- (void)setNativeID:(NSString *)nativeID forView:(UIView *)view
{
}

- (void)setNeedsLayout
{
}

+ (UIView *)JSResponder
{
  return nil;
}

+ (NSString *)moduleName
{
  return @"UIManager";
}

- (void)invalidate
{
}

@end

@implementation RCTBridge (RCTUIManager)

- (RCTUIManager *)uiManager
{
  return [self moduleForClass:[RCTUIManager class]];
}

@end

UIView *RCTPaperViewOrCurrentView(UIView *view)
{
  if ([view respondsToSelector:@selector(paperView)]) {
    return [view performSelector:@selector(paperView)];
  }
  return view;
}

@implementation RCTComposedViewRegistry {
  __weak RCTUIManager *_uiManager;
  NSDictionary<NSNumber *, UIView *> *_registry;
}

- (instancetype)initWithUIManager:(RCTUIManager *)uiManager andRegistry:(NSDictionary<NSNumber *, UIView *> *)registry
{
  self = [super init];
  if (self) {
    _uiManager = uiManager;
    _registry = registry;
  }
  return self;
}

- (NSUInteger)count
{
  return self->_registry.count;
}

- (NSEnumerator *)keyEnumerator
{
  return self->_registry.keyEnumerator;
}

- (id)objectForKey:(id)key
{
  if (![key isKindOfClass:[NSNumber class]]) {
    return NULL;
  }

  NSNumber *index = (NSNumber *)key;
  UIView *view = _registry[index];
  if (view) {
    return RCTPaperViewOrCurrentView(view);
  }
  view = [_uiManager viewForReactTag:index];
  if (view) {
    return RCTPaperViewOrCurrentView(view);
  }
  return NULL;
}

- (void)removeObjectForKey:(id)key
{
  if (![key isKindOfClass:[NSNumber class]]) {
    return;
  }

  NSNumber *tag = (NSNumber *)key;

  if (_registry[key]) {
    NSMutableDictionary *mutableRegistry = (NSMutableDictionary *)_registry;
    [mutableRegistry removeObjectForKey:tag];
  } else if ([_uiManager viewForReactTag:tag]) {
    [_uiManager removeViewFromRegistry:tag];
  }
}

@end
