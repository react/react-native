/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTLog.h>
#import <React/UIView+React.h>

@class RCTBridge;
@class RCTShadowView;
@class RCTSparseArray;
@class RCTUIManager;

typedef void (^RCTViewManagerUIBlock)(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry);

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

@interface RCTViewManager : NSObject <RCTBridgeModule>

/**
 * The bridge can be used to access both the RCTUIIManager and the RCTEventDispatcher,
 * allowing the manager (or the views that it manages) to manipulate the view
 * hierarchy and send events back to the JS context.
 */
@property (nonatomic, weak) RCTBridge *bridge;

/**
 * This method instantiates a native view to be managed by the module. Override
 * this to return a custom view instance, which may be preconfigured with default
 * properties, subviews, etc. This method will be called many times, and should
 * return a fresh instance each time. The view module MUST NOT cache the returned
 * view and return the same instance for subsequent calls.
 */
- (UIView *)view;

/**
 * This method instantiates a shadow view to be managed by the module. If omitted,
 * an ordinary RCTShadowView instance will be created, which is typically fine for
 * most view types. As with the -view method, the -shadowView method should return
 * a fresh instance each time it is called.
 */
- (RCTShadowView *)shadowView;

/**
 * DEPRECATED: declare properties of type RCTBubblingEventBlock instead
 *
 * Returns an array of names of events that can be sent by native views. This
 * should return bubbling, directly-dispatched event types. The event name
 * should not include a prefix such as 'on' or 'top', as this will be applied
 * as needed. When subscribing to the event, use the 'Captured' suffix to
 * indicate the captured form, or omit the suffix for the bubbling form.
 *
 * Note that this method is not inherited when you subclass a view module, and
 * you should not call [super customBubblingEventTypes] when overriding it.
 */
- (NSArray<NSString *> *)customBubblingEventTypes __deprecated_msg("Use RCTBubblingEventBlock props instead.");

/**
 * This handles the simple case, where JS and native property names match.
 */
#define RCT_EXPORT_VIEW_PROPERTY(name, type)            \
  +(NSArray<NSString *> *)propConfig_##name RCT_DYNAMIC \
  {                                                     \
    return @[ @ #type ];                                \
  }

/**
 * This macro maps a named property to an arbitrary key path in the view.
 */
#define RCT_REMAP_VIEW_PROPERTY(name, keyPath, type)    \
  +(NSArray<NSString *> *)propConfig_##name RCT_DYNAMIC \
  {                                                     \
    return @[ @ #type, @ #keyPath ];                    \
  }

/**
 * This macro can be used when you need to provide custom logic for setting
 * view properties. The macro should be followed by a method body, which can
 * refer to "json", "view" and "defaultView" to implement the required logic.
 */
#define RCT_CUSTOM_VIEW_PROPERTY(name, type, viewClass) \
  RCT_REMAP_VIEW_PROPERTY(name, __custom__, type)       \
  -(void)set_##name : (id)json forView : (viewClass *)view withDefaultView : (viewClass *)defaultView RCT_DYNAMIC

/**
 * This macro is used to map properties to the shadow view, instead of the view.
 */
#define RCT_EXPORT_SHADOW_PROPERTY(name, type)                \
  +(NSArray<NSString *> *)propConfigShadow_##name RCT_DYNAMIC \
  {                                                           \
    return @[ @ #type ];                                      \
  }

/**
 * This macro maps a named property to an arbitrary key path in the shadow view.
 */
#define RCT_REMAP_SHADOW_PROPERTY(name, keyPath, type)        \
  +(NSArray<NSString *> *)propConfigShadow_##name RCT_DYNAMIC \
  {                                                           \
    return @[ @ #type, @ #keyPath ];                          \
  }

/**
 * This macro can be used when you need to provide custom logic for setting
 * shadow view properties. The macro should be followed by a method body, which can
 * refer to "json" and "view".
 */
#define RCT_CUSTOM_SHADOW_PROPERTY(name, type, viewClass) \
  RCT_REMAP_SHADOW_PROPERTY(name, __custom__, type)       \
  -(void)set_##name : (id)json forShadowView : (viewClass *)view RCT_DYNAMIC

// Parse a JSON object and only return the number value, eveything else returns a 0
CGFloat RCTJSONParseOnlyNumber(id json);

@end

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
