/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUtils.h>

#import <React/RCTAlertController.h>

@interface RCTAlertController ()

@property (nonatomic, strong) UIWindow *alertWindow;

@end

@implementation RCTAlertController

- (UIWindow *)alertWindow
{
  if (_alertWindow == nil) {
    UIWindowScene *scene = RCTKeyWindow().windowScene;
    if (scene != nil) {
      _alertWindow = [[UIWindow alloc] initWithWindowScene:scene];
      _alertWindow.frame = scene.coordinateSpace.bounds;
    } else {
      _alertWindow = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
    }

    if (_alertWindow != nullptr) {
      _alertWindow.rootViewController = [UIViewController new];
      _alertWindow.windowLevel = UIWindowLevelAlert + 1;
    }
  }

  return _alertWindow;
}

- (void)show:(BOOL)animated completion:(void (^)(void))completion
{
  UIUserInterfaceStyle style = self.overrideUserInterfaceStyle;
  if (style == UIUserInterfaceStyleUnspecified) {
    UIUserInterfaceStyle overriddenStyle = RCTKeyWindow().overrideUserInterfaceStyle;
    style = (overriddenStyle != 0) ? overriddenStyle : UIUserInterfaceStyleUnspecified;
  }

  self.overrideUserInterfaceStyle = style;

  [self.alertWindow makeKeyAndVisible];
  [self.alertWindow.rootViewController presentViewController:self animated:animated completion:completion];
}

- (void)hide
{
  [_alertWindow setHidden:YES];

  _alertWindow.windowScene = nil;

  _alertWindow = nil;
}

@end
