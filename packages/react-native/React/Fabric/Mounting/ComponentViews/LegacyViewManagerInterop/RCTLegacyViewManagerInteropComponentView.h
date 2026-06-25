/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#import <UIKit/UIKit.h>

#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTLegacyViewManagerInteropComponentView : RCTViewComponentView

/**
 Returns true for components that are supported by LegacyViewManagerInterop layer, false otherwise.
 */
+ (BOOL)isSupported:(NSString *)componentName;

+ (void)supportLegacyViewManagerWithName:(NSString *)componentName;
+ (void)supportLegacyViewManagersWithPrefix:(NSString *)prefix;

/**
 * This method is required for addUIBlock and to let the infra bypass the interop layer
 * when providing views from the RCTUIManager. The interop layer should be transparent to the users.
 */
- (UIView *)paperView;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
