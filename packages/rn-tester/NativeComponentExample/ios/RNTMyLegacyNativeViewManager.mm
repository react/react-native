/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import "RNTLegacyView.h"
#import "RNTMyNativeViewComponentView.h"
#import "UIView+ColorOverlays.h"

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

@interface RNTMyLegacyNativeViewManager : RCTViewManager

@end

@implementation RNTMyLegacyNativeViewManager

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_MODULE()

RCT_REMAP_VIEW_PROPERTY(color, backgroundColor, UIColor)

RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)

RCT_EXPORT_VIEW_PROPERTY(onColorChanged, RCTBubblingEventBlock)

RCT_CUSTOM_VIEW_PROPERTY(cornerRadius, CGFloat, RNTLegacyView)
{
  view.clipsToBounds = true;
  NSNumber *cornerRadius = (NSNumber *)json;
  view.layer.cornerRadius = [cornerRadius floatValue];
}

RCT_EXPORT_METHOD(changeBackgroundColor : (nonnull NSNumber *)reactTag color : (NSString *)color)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    if (UIView *view = [RNTMyLegacyNativeViewManager getViewByTag:viewRegistry reactTag:reactTag]) {
      [view setBackgroundColorWithColorString:color];
    }
  }];
}

RCT_EXPORT_METHOD(addOverlays : (nonnull NSNumber *)reactTag overlayColors : (NSArray *)overlayColors)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    if (UIView *view = [RNTMyLegacyNativeViewManager getViewByTag:viewRegistry reactTag:reactTag]) {
      [view addColorOverlays:overlayColors];
    }
  }];
}

RCT_EXPORT_METHOD(removeOverlays : (nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    if (UIView *view = [RNTMyLegacyNativeViewManager getViewByTag:viewRegistry reactTag:reactTag]) {
      [view removeOverlays];
    }
  }];
}

+ (UIView *)getViewByTag:(NSDictionary<NSNumber *, UIView *> *)viewRegistry reactTag:(nonnull NSNumber *)reactTag
{
  UIView *view = viewRegistry[reactTag];
  if ((view == nullptr) || ![view isKindOfClass:[RNTLegacyView class]]) {
    RCTLogError(@"Cannot find RNTLegacyView with tag #%@", reactTag);
    return NULL;
  }
  return view;
}

- (UIView *)view
{
  RNTLegacyView *view = [[RNTLegacyView alloc] init];
  return view;
}

- (NSDictionary *)constantsToExport
{
  return @{@"PI" : @3.14};
}
@end

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
