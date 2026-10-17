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

static const CGFloat RCTDevLoadingViewTopMargin = 16;
static const CGFloat RCTDevLoadingViewHorizontalMargin = 16;
static const CGFloat RCTDevLoadingViewLabelHorizontalPadding = 14;
static const CGFloat RCTDevLoadingViewLabelVerticalPadding = 10;
static const CGFloat RCTDevLoadingViewMinHeight = 40;
static const CGFloat RCTDevLoadingViewDismissButtonSize = 22;
static const CGFloat RCTDevLoadingViewFontSize = 12.5;
static const CGFloat RCTDevLoadingViewLineSpacing = 2;
static const NSTimeInterval RCTDevLoadingViewAnimationDuration = 0.2;
static const CGFloat RCTDevLoadingViewHiddenScale = 0.85;
// The hidden state scales about a point this fraction of the capsule's height above its center.
static const CGFloat RCTDevLoadingViewHiddenAnchorOffset = 0.05;

#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
#define RCT_DEV_LOADING_VIEW_HAS_HINGE 1
#else
#define RCT_DEV_LOADING_VIEW_HAS_HINGE 0
#endif

// The horizontal margin a system alert keeps from each side of its window, unless the safe area inset there is larger.
static const CGFloat RCTDevLoadingViewAlertMinimumMargin = 24;

// The horizontal offset from the window's center to the line the banner centers on, matching where a system alert
// sits: each side inset, capped at the alert's minimum margin, pushes the alert away from it by half its size. The
// iPhone Duo's 84pt rail thus shifts it 12pt; equal insets, as on every other iPhone, leave it centered. No public API
// exposes this; it mirrors UIKit's alert presentation on iOS 27.1.
static CGFloat RCTDevLoadingViewCenterLayoutAnchor(UIEdgeInsets safeAreaInsets)
{
  return (MIN(safeAreaInsets.left, RCTDevLoadingViewAlertMinimumMargin) -
          MIN(safeAreaInsets.right, RCTDevLoadingViewAlertMinimumMargin)) /
      2;
}

// Hosts the banner above the app's windows and passes touches outside it through to them.
@interface RCTDevLoadingWindow : UIWindow
// Called after each layout pass, since the banner's placement depends on the window's size and safe area in
// ways Auto Layout can't express.
@property (nonatomic, copy) void (^layoutHandler)(void);
@end

@implementation RCTDevLoadingWindow

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (_layoutHandler != nil) {
    _layoutHandler();
  }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  UIView *view = [super hitTest:point withEvent:event];
  return view == self.rootViewController.view ? nil : view;
}

@end

@implementation RCTDevLoadingView {
  RCTDevLoadingWindow *_window;
  UILabel *_label;
  UIView *_container;
  UIView *_contentView;
  UIButton *_dismissButton;
  NSLayoutConstraint *_labelTrailingConstraint;
  NSLayoutConstraint *_labelToButtonConstraint;
  NSLayoutConstraint *_centerConstraint;
  NSLayoutConstraint *_trailingLimitConstraint;
  NSLayoutConstraint *_topSafeAreaConstraint;
  NSDate *_showDate;
  BOOL _hiding;
  // Incremented by each show so a hide animation that it interrupts does not tear down the new banner.
  NSUInteger _generation;
  dispatch_block_t _initialMessageBlock;
#if RCT_DEV_LOADING_VIEW_HAS_HINGE
  NSTimer *_divisionPollTimer;
  NSDate *_divisionPollDeadline;
  BOOL _hingeOpen;
#endif
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
#if RCT_DEV_LOADING_VIEW_HAS_HINGE
  [_divisionPollTimer invalidate];
#endif
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
  if (!RCTDevLoadingViewGetEnabled()) {
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
    self->_generation++;
    if (self->_hiding) {
      [self _removeBanner];
    }

    if (self->_window == nullptr) {
      UIWindowScene *windowScene = RCTKeyWindow().windowScene;
      self->_window = windowScene != nil ? [[RCTDevLoadingWindow alloc] initWithWindowScene:windowScene]
                                         : [[RCTDevLoadingWindow alloc] init];
      self->_window.frame = self->_window.windowScene.coordinateSpace.bounds;
#if !TARGET_OS_TV
      self->_window.windowLevel = UIWindowLevelStatusBar + 1;
#endif
      self->_window.rootViewController = [UIViewController new];
      __weak __typeof(self) weakSelf = self;
      self->_window.layoutHandler = ^{
        [weakSelf _updatePlacementAnimated:NO];
      };
      self->_window.rootViewController.view.backgroundColor = UIColor.clearColor;
#if RCT_DEV_LOADING_VIEW_HAS_HINGE
      [self _observeHinge];
#endif
    }

    BOOL isNewBanner = self->_container == nullptr;
    if (isNewBanner) {
      [self _createBannerWithBackgroundColor:backgroundColor];
    } else {
      [self _applyBackgroundColor:backgroundColor];
    }

    self->_label.textColor = color;
    [self _setLabelText:message];

    if (dismissButton && self->_dismissButton == nullptr) {
      [self _createDismissButton];
    } else if (!dismissButton && self->_dismissButton != nullptr) {
      [self->_dismissButton removeFromSuperview];
      self->_dismissButton = nullptr;
      self->_labelToButtonConstraint = nil;
    }
    if (self->_dismissButton != nullptr) {
      UIButtonConfiguration *buttonConfig = self->_dismissButton.configuration;
      buttonConfig.baseForegroundColor = color;
      buttonConfig.background.backgroundColor = [color colorWithAlphaComponent:0.2];
      self->_dismissButton.configuration = buttonConfig;
    }
    self->_labelTrailingConstraint.active = self->_dismissButton == nullptr;
    self->_labelToButtonConstraint.active = self->_dismissButton != nullptr;

    self->_window.hidden = NO;
    [self _updatePlacementAnimated:NO];
    [self->_window layoutIfNeeded];
    if (isNewBanner) {
      [self _animateBannerIn];
    }
  });
}

#if RCT_DEV_LOADING_VIEW_HAS_HINGE
- (void)_observeHinge
{
  if (@available(iOS 27.1, *)) {
    __weak __typeof(self) weakSelf = self;
    UIHingeInteraction *interaction = [[UIHingeInteraction alloc]
        initWithUpdateHandler:^(__unused UIHingeInteraction *hingeInteraction, UIHingeInteractionUpdate *update) {
          [weakSelf _hingeDidUpdate:update.hinge];
        }];
    [_window.rootViewController.view addInteraction:interaction];
  }
}

// The division region becomes active once the hinge settles, matching when the system's own UI moves aside,
// but that change has no notification of its own, so each hinge update starts a short poll for it.
- (void)_hingeDidUpdate:(UIHinge *)hinge API_AVAILABLE(ios(27.1))
{
  _hingeOpen = hinge.status == UIHingeStatusPartiallyOpen || hinge.status == UIHingeStatusFullyOpen;
  _divisionPollDeadline = [NSDate dateWithTimeIntervalSinceNow:1.5];
  if (_divisionPollTimer != nil) {
    return;
  }
  __weak __typeof(self) weakSelf = self;
  _divisionPollTimer =
      [NSTimer scheduledTimerWithTimeInterval:0.05
                                      repeats:YES
                                        block:^(NSTimer *timer) {
                                          __typeof(self) strongSelf = weakSelf;
                                          if (strongSelf == nil) {
                                            [timer invalidate];
                                            return;
                                          }
                                          [strongSelf _updatePlacementAnimated:YES];
                                          if (strongSelf->_divisionPollDeadline.timeIntervalSinceNow < 0) {
                                            [timer invalidate];
                                            strongSelf->_divisionPollTimer = nil;
                                          }
                                        }];
}
#endif

// Places the banner where a system alert would center itself, or while a fold divides the screen, centered within
// the leading segment and clear of the fold. On a foldable held open in portrait, the status bar sits in a corner
// while its inset spans the whole top edge, so the banner ignores that inset and sits 16pt from the top.
- (void)_updatePlacementAnimated:(BOOL)animated
{
  if (_container == nil) {
    return;
  }
  UIView *rootView = _window.rootViewController.view;
  UIEdgeInsets safeAreaInsets = rootView.safeAreaInsets;
  CGFloat centerOffset = RCTDevLoadingViewCenterLayoutAnchor(safeAreaInsets);
  CGFloat trailingMargin = RCTDevLoadingViewHorizontalMargin;
  BOOL respectsTopSafeArea = YES;
#if RCT_DEV_LOADING_VIEW_HAS_HINGE
  if (@available(iOS 27.1, *)) {
    respectsTopSafeArea = !(_hingeOpen && CGRectGetHeight(rootView.bounds) > CGRectGetWidth(rootView.bounds));
    CGFloat minX = safeAreaInsets.left;
    CGFloat maxX = CGRectGetWidth(rootView.bounds) - safeAreaInsets.right;
    for (UIViewReservedRegion *region in
         [rootView reservedRegionsOfKind:[UIViewReservedRegionKind divisionRegionKind]]) {
      CGFloat dividerX = CGRectGetMinX(region.frame);
      if (region.active && CGRectGetHeight(region.frame) >= CGRectGetWidth(region.frame) && dividerX > minX &&
          dividerX < maxX) {
        centerOffset = (minX + dividerX) / 2 - CGRectGetMidX(rootView.bounds);
        trailingMargin += maxX - dividerX;
      }
    }
  }
#endif
  if (centerOffset == _centerConstraint.constant && -trailingMargin == _trailingLimitConstraint.constant &&
      respectsTopSafeArea == _topSafeAreaConstraint.active) {
    return;
  }
  _centerConstraint.constant = centerOffset;
  _trailingLimitConstraint.constant = -trailingMargin;
  _topSafeAreaConstraint.active = respectsTopSafeArea;
  if (animated) {
    [UIView animateWithDuration:RCTDevLoadingViewAnimationDuration
                     animations:^{
                       [rootView layoutIfNeeded];
                     }];
  }
}

- (CGAffineTransform)_hiddenTransform
{
  CGFloat anchorY = -RCTDevLoadingViewHiddenAnchorOffset * _container.bounds.size.height;
  CGAffineTransform transform = CGAffineTransformMakeTranslation(0, anchorY);
  transform = CGAffineTransformScale(transform, RCTDevLoadingViewHiddenScale, RCTDevLoadingViewHiddenScale);
  return CGAffineTransformTranslate(transform, 0, -anchorY);
}

- (void)_animateBannerIn
{
  // A visual effect view renders incorrectly below full alpha, so its effect and content fade instead.
  UIVisualEffectView *effectView =
      [_container isKindOfClass:UIVisualEffectView.class] ? (UIVisualEffectView *)_container : nil;
  UIVisualEffect *effect = effectView.effect;
  effectView.effect = nil;
  if (effectView != nil) {
    _contentView.alpha = 0;
  } else {
    _container.alpha = 0;
  }
  _container.transform = [self _hiddenTransform];

  [UIView animateWithDuration:RCTDevLoadingViewAnimationDuration
                        delay:0
                      options:UIViewAnimationOptionCurveEaseOut | UIViewAnimationOptionAllowUserInteraction
                   animations:^{
                     effectView.effect = effect;
                     self->_contentView.alpha = 1;
                     self->_container.alpha = 1;
                     self->_container.transform = CGAffineTransformIdentity;
                   }
                   completion:nil];
}

- (void)_createBannerWithBackgroundColor:(UIColor *)backgroundColor
{
  UIView *container;
  UIView *contentView;
#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
  if (@available(iOS 26.0, *)) {
    UIVisualEffectView *effectView =
        [[UIVisualEffectView alloc] initWithEffect:[self _glassEffectWithTintColor:backgroundColor]];
    effectView.cornerConfiguration = [UICornerConfiguration capsuleConfiguration];
    container = effectView;
    contentView = effectView.contentView;
  }
#endif
  if (container == nil) {
    container = [UIView new];
    container.backgroundColor = backgroundColor;
    container.layer.cornerRadius = RCTDevLoadingViewMinHeight / 2;
    container.layer.cornerCurve = kCACornerCurveContinuous;
    container.clipsToBounds = YES;
    contentView = container;
  }
  container.translatesAutoresizingMaskIntoConstraints = NO;
  [container addGestureRecognizer:[[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(hide)]];

  UILabel *label = [UILabel new];
  label.translatesAutoresizingMaskIntoConstraints = NO;
  label.font = [UIFont monospacedDigitSystemFontOfSize:RCTDevLoadingViewFontSize weight:UIFontWeightMedium];
  label.textAlignment = NSTextAlignmentCenter;
  label.numberOfLines = 0;
  [contentView addSubview:label];

  UIView *rootView = _window.rootViewController.view;
  [rootView addSubview:container];

  // Centered on the window like a system alert, with required safe area limits that only push the banner
  // inward where the two would overlap, such as beside the camera cutout.
  UILayoutGuide *safeArea = rootView.safeAreaLayoutGuide;
  _centerConstraint = [container.centerXAnchor constraintEqualToAnchor:rootView.centerXAnchor];
  _centerConstraint.priority = UILayoutPriorityDefaultHigh;
  _trailingLimitConstraint =
      [container.trailingAnchor constraintLessThanOrEqualToAnchor:safeArea.trailingAnchor
                                                         constant:-RCTDevLoadingViewHorizontalMargin];
  _labelTrailingConstraint = [label.trailingAnchor constraintEqualToAnchor:contentView.trailingAnchor
                                                                  constant:-RCTDevLoadingViewLabelHorizontalPadding];
  // Sits flush under a top safe area inset such as the status bar, or 16pt from the top edge without one.
  _topSafeAreaConstraint = [container.topAnchor constraintGreaterThanOrEqualToAnchor:safeArea.topAnchor];
  NSLayoutConstraint *topPull = [container.topAnchor constraintEqualToAnchor:rootView.topAnchor];
  topPull.priority = UILayoutPriorityDefaultLow;
  [NSLayoutConstraint activateConstraints:@[
    _centerConstraint,
    _trailingLimitConstraint,
    [container.leadingAnchor constraintGreaterThanOrEqualToAnchor:safeArea.leadingAnchor
                                                         constant:RCTDevLoadingViewHorizontalMargin],
    _topSafeAreaConstraint,
    [container.topAnchor constraintGreaterThanOrEqualToAnchor:rootView.topAnchor constant:RCTDevLoadingViewTopMargin],
    topPull,
    [container.heightAnchor constraintGreaterThanOrEqualToConstant:RCTDevLoadingViewMinHeight],
    [label.topAnchor constraintEqualToAnchor:contentView.topAnchor constant:RCTDevLoadingViewLabelVerticalPadding],
    [label.bottomAnchor constraintEqualToAnchor:contentView.bottomAnchor
                                       constant:-RCTDevLoadingViewLabelVerticalPadding],
    [label.leadingAnchor constraintEqualToAnchor:contentView.leadingAnchor
                                        constant:RCTDevLoadingViewLabelHorizontalPadding],
  ]];

  _container = container;
  _contentView = contentView;
  _label = label;
}

- (void)_setLabelText:(NSString *)message
{
  NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
  paragraphStyle.alignment = NSTextAlignmentCenter;
  paragraphStyle.lineSpacing = RCTDevLoadingViewLineSpacing;
  _label.attributedText = [[NSAttributedString alloc] initWithString:message
                                                          attributes:@{NSParagraphStyleAttributeName : paragraphStyle}];
}

- (void)_createDismissButton
{
  UIButtonConfiguration *buttonConfig = [UIButtonConfiguration plainButtonConfiguration];
  buttonConfig.image = [UIImage
       systemImageNamed:@"xmark"
      withConfiguration:[UIImageSymbolConfiguration configurationWithPointSize:10 weight:UIImageSymbolWeightBold]];
  buttonConfig.contentInsets = NSDirectionalEdgeInsetsZero;
  buttonConfig.cornerStyle = UIButtonConfigurationCornerStyleCapsule;

  __weak __typeof(self) weakSelf = self;
  UIButton *button = [UIButton buttonWithConfiguration:buttonConfig
                                         primaryAction:[UIAction actionWithHandler:^(__unused UIAction *action) {
                                           [weakSelf hide];
                                         }]];
  button.accessibilityLabel = @"Dismiss";
  button.translatesAutoresizingMaskIntoConstraints = NO;
  [button setContentCompressionResistancePriority:UILayoutPriorityRequired forAxis:UILayoutConstraintAxisHorizontal];
  [_contentView addSubview:button];

  _labelToButtonConstraint = [_label.trailingAnchor constraintEqualToAnchor:button.leadingAnchor constant:-8];
  [NSLayoutConstraint activateConstraints:@[
    [button.trailingAnchor constraintEqualToAnchor:_contentView.trailingAnchor constant:-9],
    [button.centerYAnchor constraintEqualToAnchor:_contentView.centerYAnchor],
    [button.widthAnchor constraintEqualToConstant:RCTDevLoadingViewDismissButtonSize],
    [button.heightAnchor constraintEqualToConstant:RCTDevLoadingViewDismissButtonSize],
  ]];

  _dismissButton = button;
}

- (void)_removeBanner
{
  [_container removeFromSuperview];
  _container = nil;
  _contentView = nil;
  _label = nil;
  _dismissButton = nil;
  _labelTrailingConstraint = nil;
  _labelToButtonConstraint = nil;
  _centerConstraint = nil;
  _trailingLimitConstraint = nil;
  _topSafeAreaConstraint = nil;
  _hiding = NO;
}

- (void)_applyBackgroundColor:(UIColor *)backgroundColor
{
#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
  if (@available(iOS 26.0, *)) {
    if ([_container isKindOfClass:UIVisualEffectView.class]) {
      ((UIVisualEffectView *)_container).effect = [self _glassEffectWithTintColor:backgroundColor];
      return;
    }
  }
#endif
  _container.backgroundColor = backgroundColor;
}

#if defined(__IPHONE_26_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_26_0
- (UIGlassEffect *)_glassEffectWithTintColor:(UIColor *)tintColor API_AVAILABLE(ios(26.0))
{
  UIGlassEffect *effect = [UIGlassEffect effectWithStyle:UIGlassEffectStyleRegular];
  effect.tintColor = tintColor;
  return effect;
}
#endif

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
    NSUInteger generation = self->_generation;
    const NSTimeInterval MIN_PRESENTED_TIME = 0.6;
    NSTimeInterval presentedTime = [[NSDate date] timeIntervalSinceDate:self->_showDate];
    NSTimeInterval delay = MAX(0, MIN_PRESENTED_TIME - presentedTime);
    [UIView animateWithDuration:RCTDevLoadingViewAnimationDuration
        delay:delay
        options:UIViewAnimationOptionCurveEaseIn
        animations:^{
          if ([self->_container isKindOfClass:UIVisualEffectView.class]) {
            ((UIVisualEffectView *)self->_container).effect = nil;
            self->_contentView.alpha = 0;
          } else {
            self->_container.alpha = 0;
          }
          self->_container.transform = [self _hiddenTransform];
        }
        completion:^(__unused BOOL finished) {
          if (self->_generation != generation) {
            return;
          }
          [self _removeBanner];
          self->_window.hidden = YES;
          self->_window = nil;
        }];
  });
}

- (void)showProgressMessage:(NSString *)message
{
  if (_window != nil) {
    // This is an optimization. Since the progress can come in quickly,
    // we want to do the minimum amount of work to update the UI,
    // which is to only update the label text.
    [self _setLabelText:message];
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
