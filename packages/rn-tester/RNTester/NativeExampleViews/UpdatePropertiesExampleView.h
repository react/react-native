/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTView.h>
#import <React/RCTViewManager.h>

@class RCTRootViewFactory;

@interface UpdatePropertiesExampleViewManager : RCTViewManager

- (instancetype)initWithRootViewFactory:(RCTRootViewFactory *)rootViewFactory;

@end

@interface UpdatePropertiesExampleView : RCTView

@end
