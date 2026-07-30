/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDevLoadingView.h>
#include <UIKit/UIKit.h>

#import <QuartzCore/QuartzCore.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTAppearance.h>
#import <React/RCTBridge.h>
#import <React/RCTConstants.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTDevLoadingViewSetEnabled.h>
#import <React/RCTUtils.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTDevLoadingView () <NativeDevLoadingViewSpec>
@end

#if RCT_DEV_MENU

@implementation RCTDevLoadingView {
  UIWindow *_window;
  UILabel *_label;
  UIView *_container;
  UIButton *_dismissButton;
  NSDate *_showDate;
  BOOL _hiding;
  dispatch_block_t _initialMessageBlock;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(hide)
                                                 name:RCTJavaScriptDidLoadNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(hide)
                                                 name:RCTJavaScriptDidFailToLoadNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(hide)
                                                 name:@"RCTInstanceDidLoadBundle"
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [self clearInitialMessageDelay];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  UIWindow *window = _window;
  _window = nil;
  if (window) {
    RCTExecuteOnMainQueue(^{
      window.hidden = YES;
    });
  }
}

+ (void)setEnabled:(BOOL)enabled
{
  RCTDevLoadingViewSetEnabled(enabled);
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)clearInitialMessageDelay
{
  if (_initialMessageBlock != nil) {
    dispatch_block_cancel(_initialMessageBlock);
    _initialMessageBlock = nil;
  }
}

- (void)showInitialMessageDelayed:(void (^)())initialMessage
{
  _initialMessageBlock = dispatch_block_create(static_cast<dispatch_block_flags_t>(0), initialMessage);

  // We delay the initial loading message to prevent flashing it
  // when loading progress starts quickly. To do that, we
  // schedule the message to be shown in a block, and cancel
  // the block later when the progress starts coming in.
  // If the progress beats this timer, this message is not shown.
  dispatch_after(
      dispatch_time(DISPATCH_TIME_NOW, 0.2 * NSEC_PER_SEC), dispatch_get_main_queue(), self->_initialMessageBlock);
}

- (void)showMessage:(NSString *)message
              color:(UIColor *)color
    backgroundColor:(UIColor *)backgroundColor
      dismissButton:(BOOL)dismissButton
{
  if (!RCTDevLoadingViewGetEnabled() || _hiding) {
    return;
  }

  // Input validation
  if (message == nil || [message isEqualToString:@""]) {
    NSLog(@"Error: message cannot be nil or empty");
    return;
  }
  if (color == nil) {
    NSLog(@"Error: color cannot be nil");
    return;
  }
  if (backgroundColor == nil) {
    NSLog(@"Error: backgroundColor cannot be nil");
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    if (RCTRunningInTestEnvironment()) {
      return;
    }

    self->_showDate = [NSDate date];

    if (self->_label == nullptr) {
      self->_label = [[UILabel alloc] init];
      self->_label.translatesAutoresizingMaskIntoConstraints = NO;
      self->_label.font = [UIFont monospacedDigitSystemFontOfSize:12.0 weight:UIFontWeightRegular];
      self->_label.textAlignment = NSTextAlignmentCenter;
      [self->_container addSubview:self->_label];
      self->_label.numberOfLines = 0;
    }
    self->_label.textColor = color;
    self->_label.text = message;

    if (self->_container == nullptr) {
      self->_container = [[UIView alloc] init];
      self->_container.translatesAutoresizingMaskIntoConstraints = NO;
      UITapGestureRecognizer *tapGesture = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(hide)];
      [self->_container addGestureRecognizer:tapGesture];
      self->_container.userInteractionEnabled = YES;
      [self->_container addSubview:self->_label];
    }
    self->_container.backgroundColor = backgroundColor;

    // Handle button creation/removal dynamically based on dismissButton parameter
    if (dismissButton && self->_dismissButton == nullptr) {
      CGFloat hue = 0.0;
      CGFloat saturation = 0.0;
      CGFloat brightness = 0.0;
      CGFloat alpha = 0.0;
      [backgroundColor getHue:&hue saturation:&saturation brightness:&brightness alpha:&alpha];
      UIColor *darkerBackground = [UIColor colorWithHue:hue
                                             saturation:saturation
                                             brightness:brightness * 0.7
                                                  alpha:1.0];

      UIButtonConfiguration *buttonConfig = [UIButtonConfiguration plainButtonConfiguration];
      buttonConfig.attributedTitle = [[NSAttributedString alloc]
          initWithString:@"Dismiss ✕"
              attributes:@{NSFontAttributeName : [UIFont systemFontOfSize:11.0 weight:UIFontWeightRegular]}];
      buttonConfig.contentInsets = NSDirectionalEdgeInsetsMake(6, 12, 6, 12);
      buttonConfig.background.backgroundColor = darkerBackground;
      buttonConfig.background.cornerRadius = 10;
      buttonConfig.baseForegroundColor = color;

      // Button is a visual cue to tap anywhere on the banner to dismiss so no separate action is needed
      self->_dismissButton = [UIButton buttonWithConfiguration:buttonConfig primaryAction:nil];
      self->_dismissButton.userInteractionEnabled = NO;
      self->_dismissButton.translatesAutoresizingMaskIntoConstraints = NO;

      // Prevent button from being compressed - force label to wrap instead
      [self->_dismissButton setContentCompressionResistancePriority:UILayoutPriorityRequired
                                                            forAxis:UILayoutConstraintAxisHorizontal];
      [self->_dismissButton setContentHuggingPriority:UILayoutPriorityRequired
                                              forAxis:UILayoutConstraintAxisHorizontal];

      [self->_container addSubview:self->_dismissButton];
    } else if (!dismissButton && self->_dismissButton != nullptr) {
      [self->_dismissButton removeFromSuperview];
      self->_dismissButton = nullptr;
    }

    UIWindow *mainWindow = RCTKeyWindow();
    if (self->_window == nullptr) {
      UIWindowScene *windowScene = mainWindow.windowScene;
      if (windowScene != nil) {
        self->_window = [[UIWindow alloc] initWithWindowScene:windowScene];
      } else {
        self->_window = [[UIWindow alloc] init];
      }
#if !TARGET_OS_TV
      self->_window.windowLevel = UIWindowLevelStatusBar + 1;
#endif
      self->_window.rootViewController = [UIViewController new];
      [self->_window.rootViewController.view addSubview:self->_container];
    }

    CGFloat topSafeAreaHeight = mainWindow.safeAreaInsets.top;
    self->_window.hidden = NO;

    [self->_window layoutIfNeeded];

    NSMutableArray *constraints = [NSMutableArray arrayWithArray:@[
      // Container constraints
      [self->_container.topAnchor constraintEqualToAnchor:self->_window.rootViewController.view.topAnchor],
      [self->_container.leadingAnchor constraintEqualToAnchor:self->_window.rootViewController.view.leadingAnchor],
      [self->_container.trailingAnchor constraintEqualToAnchor:self->_window.rootViewController.view.trailingAnchor],

      // Label constraints
      [self->_label.topAnchor constraintEqualToAnchor:self->_container.topAnchor constant:topSafeAreaHeight + 8],
      [self->_label.leadingAnchor constraintEqualToAnchor:self->_container.leadingAnchor constant:10],
      [self->_label.bottomAnchor constraintEqualToAnchor:self->_container.bottomAnchor constant:-8],
    ]];

    // Add button-specific constraints if button exists
    if (self->_dismissButton != nullptr) {
      [constraints addObjectsFromArray:@[
        [self->_dismissButton.trailingAnchor constraintEqualToAnchor:self->_container.trailingAnchor constant:-10],
        [self->_dismissButton.centerYAnchor constraintEqualToAnchor:self->_label.centerYAnchor],
        [self->_dismissButton.heightAnchor constraintEqualToConstant:22],
        [self->_label.trailingAnchor constraintEqualToAnchor:self->_dismissButton.leadingAnchor constant:-10],
      ]];
    } else {
      [constraints addObject:[self->_label.trailingAnchor constraintEqualToAnchor:self->_container.trailingAnchor
                                                                         constant:-10]];
    }

    [NSLayoutConstraint activateConstraints:constraints];

    [self->_window layoutIfNeeded];
    self->_window.frame = CGRectMake(0, 0, mainWindow.frame.size.width, self->_container.frame.size.height);
  });
}

- (void)showMessage:(NSString *)message
              withColor:(NSNumber *__nonnull)color
    withBackgroundColor:(NSNumber *__nonnull)backgroundColor
      withDismissButton:(NSNumber *)dismissButton
{
  [self showMessage:message
                color:[RCTConvert UIColor:color]
      backgroundColor:[RCTConvert UIColor:backgroundColor]
        dismissButton:[dismissButton boolValue]];
}
- (void)hide
{
  if (!RCTDevLoadingViewGetEnabled()) {
    return;
  }

  // Cancel the initial message block so it doesn't display later and get stuck.
  [self clearInitialMessageDelay];

  dispatch_async(dispatch_get_main_queue(), ^{
    self->_hiding = YES;
    const NSTimeInterval MIN_PRESENTED_TIME = 0.6;
    NSTimeInterval presentedTime = [[NSDate date] timeIntervalSinceDate:self->_showDate];
    NSTimeInterval delay = MAX(0, MIN_PRESENTED_TIME - presentedTime);
    CGRect windowFrame = self->_window.frame;
    [UIView animateWithDuration:0.25
        delay:delay
        options:0
        animations:^{
          self->_window.frame = CGRectOffset(windowFrame, 0, -windowFrame.size.height);
        }
        completion:^(__unused BOOL finished) {
          self->_window.frame = windowFrame;
          self->_window.hidden = YES;
          self->_window = nil;
          self->_container = nil;
          self->_label = nil;
          self->_dismissButton = nil;
          self->_hiding = false;
        }];
  });
}

- (void)showProgressMessage:(NSString *)message
{
  if (_window != nil) {
    // This is an optimization. Since the progress can come in quickly,
    // we want to do the minimum amount of work to update the UI,
    // which is to only update the label text.
    _label.text = message;
    return;
  }

  UIColor *color = [UIColor whiteColor];
  UIColor *backgroundColor = [UIColor colorWithHue:105 saturation:0 brightness:.25 alpha:1];

  if ([self isDarkModeEnabled]) {
    color = [UIColor colorWithHue:208 saturation:0.03 brightness:.14 alpha:1];
    backgroundColor = [UIColor colorWithHue:0 saturation:0 brightness:0.98 alpha:1];
  }

  [self showMessage:message color:color backgroundColor:backgroundColor dismissButton:false];
}

- (void)showOfflineMessage
{
  UIColor *color = [UIColor whiteColor];
  UIColor *backgroundColor = [UIColor blackColor];

  if ([self isDarkModeEnabled]) {
    color = [UIColor blackColor];
    backgroundColor = [UIColor whiteColor];
  }

  NSString *message = [NSString stringWithFormat:@"Connect to %@ to develop JavaScript.", RCT_PACKAGER_NAME];
  [self showMessage:message color:color backgroundColor:backgroundColor dismissButton:false];
}

- (BOOL)isDarkModeEnabled
{
  // We pass nil here to match the behavior of the native module.
  // If we were to pass a view, then it's possible that this native
  // banner would have a different color than the JavaScript banner
  // (which always passes nil). This would result in an inconsistent UI.
  return [RCTColorSchemePreference(nil) isEqualToString:@"dark"];
}
- (void)showWithURL:(NSURL *)URL
{
  if (URL.fileURL) {
    // If dev mode is not enabled, we don't want to show this kind of notification.
#if !RCT_DEV
    return;
#endif
    [self showOfflineMessage];
  } else {
    [self showInitialMessageDelayed:^{
      NSString *message = [NSString stringWithFormat:@"Loading from %@\u2026", RCT_PACKAGER_NAME];
      [self showProgressMessage:message];
    }];
  }
}

- (void)updateProgress:(RCTLoadingProgress *)progress
{
  if (!progress) {
    return;
  }

  // Cancel the initial message block so it's not flashed before progress.
  [self clearInitialMessageDelay];

  dispatch_async(dispatch_get_main_queue(), ^{
    [self showProgressMessage:[progress description]];
  });
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDevLoadingViewSpecJSI>(params);
}

@end

#else

@implementation RCTDevLoadingView

+ (NSString *)moduleName
{
  return nil;
}
+ (void)setEnabled:(BOOL)enabled
{
}
- (void)showMessage:(NSString *)message
              color:(UIColor *)color
    backgroundColor:(UIColor *)backgroundColor
      dismissButton:(BOOL)dismissButton
{
}
- (void)showMessage:(NSString *)message
              withColor:(NSNumber *)color
    withBackgroundColor:(NSNumber *)backgroundColor
      withDismissButton:(NSNumber *)dismissButton
{
}
- (void)showWithURL:(NSURL *)URL
{
}
- (void)updateProgress:(RCTLoadingProgress *)progress
{
}
- (void)hide
{
}
- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDevLoadingViewSpecJSI>(params);
}

@end

#endif

Class RCTDevLoadingViewCls(void)
{
  return RCTDevLoadingView.class;
}
