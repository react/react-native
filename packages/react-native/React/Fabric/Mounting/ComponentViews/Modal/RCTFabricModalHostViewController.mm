/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricModalHostViewController.h"

#import <React/RCTLog.h>
#import <React/RCTSurfaceTouchHandler.h>

@implementation RCTFabricModalHostViewController {
  CGRect _lastViewBounds;
#if !TARGET_OS_TV
  RCTSurfaceTouchHandler *_touchHandler;
#endif
}

- (instancetype)init
{
  if ((self = [super init]) == nullptr) {
    return nil;
  }
#if !TARGET_OS_TV
  _touchHandler = [RCTSurfaceTouchHandler new];
#endif

  return self;
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];
  if (!CGRectEqualToRect(_lastViewBounds, self.view.bounds)) {
    [_delegate boundsDidChange:self.view.bounds];
    _lastViewBounds = self.view.bounds;
  }
}

- (void)loadView
{
  self.view = [UIView new];
#if !TARGET_OS_TV
  [_touchHandler attachToView:self.view];
#endif
}

#if !TARGET_OS_TV
- (UIStatusBarStyle)preferredStatusBarStyle
{
  return [RCTUIStatusBarManager() statusBarStyle];
}

- (BOOL)prefersStatusBarHidden
{
  return [RCTUIStatusBarManager() isStatusBarHidden];
}
#endif

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  _lastViewBounds = CGRectZero;
}

#if RCT_DEV && TARGET_OS_IOS
- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  UIInterfaceOrientationMask appSupportedOrientationsMask =
      [RCTSharedApplication() supportedInterfaceOrientationsForWindow:RCTKeyWindow()];
  if ((_supportedInterfaceOrientations & appSupportedOrientationsMask) == 0u) {
    RCTLogError(
        @"Modal was presented with 0x%x orientations mask but the application only supports 0x%x."
        @"Add more interface orientations to your app's Info.plist to fix this."
        @"NOTE: This will crash in non-dev mode.",
        (unsigned)_supportedInterfaceOrientations,
        (unsigned)appSupportedOrientationsMask);
    return UIInterfaceOrientationMaskAll;
  }

  return _supportedInterfaceOrientations;
}
#endif // RCT_DEV

@end
