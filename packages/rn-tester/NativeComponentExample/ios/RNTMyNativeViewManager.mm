/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import "UIView+ColorOverlays.h"

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

@interface RNTMyNativeViewManager : RCTViewManager
@end

@implementation RNTMyNativeViewManager

RCT_EXPORT_MODULE(RNTMyNativeView)

RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)

RCT_EXPORT_VIEW_PROPERTY(onIntArrayChanged, RCTBubblingEventBlock)

RCT_EXPORT_VIEW_PROPERTY(values, NSArray *)

RCT_EXPORT_METHOD(callNativeMethodToChangeBackgroundColor : (nonnull NSNumber *)reactTag color : (NSString *)color)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if ((view == nullptr) || ![view isKindOfClass:[UIView class]]) {
      RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
      return;
    }

    [view setBackgroundColorWithColorString:color];
  }];
}

- (UIView *)view
{
  return [[UIView alloc] init];
}

@end

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
