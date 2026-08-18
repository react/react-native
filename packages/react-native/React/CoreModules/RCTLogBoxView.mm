/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTLogBoxView.h"

#import <React/RCTLog.h>
#import <React/RCTSurface.h>
#import <React/RCTSurfaceHostingView.h>

@implementation RCTLogBoxView {
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame]) != nullptr) {
#if !TARGET_OS_TV
    self.windowLevel = UIWindowLevelStatusBar - 1;
#endif
    self.backgroundColor = [UIColor clearColor];
  }
  return self;
}

- (void)createRootViewController:(UIView *)view
{
  UIViewController *_rootViewController = [UIViewController new];
  _rootViewController.view = view;
  _rootViewController.view.backgroundColor = [UIColor clearColor];
  _rootViewController.modalPresentationStyle = UIModalPresentationFullScreen;
  self.rootViewController = _rootViewController;
}

- (instancetype)initWithWindow:(UIWindow *)window surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  self = [super initWithWindowScene:window.windowScene];

  id<RCTSurfaceProtocol> surface = [surfacePresenter createFabricSurfaceForModuleName:@"LogBox" initialProperties:@{}];
  [surface start];
  RCTSurfaceHostingView *rootView = [[RCTSurfaceHostingView alloc]
      initWithSurface:surface
      sizeMeasureMode:RCTSurfaceSizeMeasureModeWidthExact | RCTSurfaceSizeMeasureModeHeightExact];
  [self createRootViewController:rootView];

  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
}

- (void)show
{
  [self becomeFirstResponder];
  [self makeKeyAndVisible];
}

@end
