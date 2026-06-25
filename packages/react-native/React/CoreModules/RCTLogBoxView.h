/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTSurfaceView.h>
#import <UIKit/UIKit.h>

@interface RCTLogBoxView : UIWindow

- (instancetype)initWithFrame:(CGRect)frame;

- (void)createRootViewController:(UIView *)view;

- (instancetype)initWithWindow:(UIWindow *)window surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter;

- (void)show;

@end
