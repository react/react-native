/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDevBanner.h"

#import <QuartzCore/QuartzCore.h>

#import <React/RCTDefines.h>
#import <React/RCTUtils.h>

#if RCT_DEV_MENU

static const CGFloat RCTDevBannerTopMargin = 16;
static const CGFloat RCTDevBannerHorizontalMargin = 16;
static const CGFloat RCTDevBannerLabelHorizontalPadding = 14;
static const CGFloat RCTDevBannerLabelVerticalPadding = 10;
static const CGFloat RCTDevBannerMinHeight = 40;
static const CGFloat RCTDevBannerDismissButtonSize = 22;
static const CGFloat RCTDevBannerFontSize = 12.5;
static const CGFloat RCTDevBannerLineSpacing = 2;
static const NSTimeInterval RCTDevBannerAnimationDuration = 0.2;
static const CGFloat RCTDevBannerHiddenScale = 0.85;
// The hidden state scales about a point this fraction of the capsule's height above its center.
static const CGFloat RCTDevBannerHiddenAnchorOffset = 0.05;
// A capsule stays on screen at least this long, so one shown and hidden in quick succession can still be read.
static const NSTimeInterval RCTDevBannerMinPresentedTime = 0.6;
static const CGFloat RCTDevBannerAccessorySpacing = 6;
static const CGFloat RCTDevBannerStackSpacing = 12;
static const CGFloat RCTDevBannerDimmingAlpha = 0.2;

#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
#define RCT_DEV_BANNER_HAS_HINGE 1
#else
#define RCT_DEV_BANNER_HAS_HINGE 0
#endif

// The horizontal margin a system alert keeps from each side of its window, unless the safe area inset there is larger.
static const CGFloat RCTDevBannerAlertMinimumMargin = 24;

// The horizontal offset from the window's center to the line the banner centers on, matching where a system alert
// sits: each side inset, capped at the alert's minimum margin, pushes the alert away from it by half its size. The
// iPhone Duo's 84pt rail thus shifts it 12pt; equal insets, as on every other iPhone, leave it centered. No public API
// exposes this; it mirrors UIKit's alert presentation on iOS 27.1.
static CGFloat RCTDevBannerCenterLayoutAnchor(UIEdgeInsets safeAreaInsets)
{
  return (MIN(safeAreaInsets.left, RCTDevBannerAlertMinimumMargin) -
          MIN(safeAreaInsets.right, RCTDevBannerAlertMinimumMargin)) /
      2;
}

// The banners currently shown, held weakly, so one can stack below another.
static NSHashTable<RCTDevBanner *> *RCTDevBannerVisibleBanners(void)
{
  static NSHashTable<RCTDevBanner *> *banners;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    banners = [NSHashTable weakObjectsHashTable];
  });
  return banners;
}

// Hosts the banner above the app's windows and passes touches outside it through to them.
@interface RCTDevBannerWindow : UIWindow
// Called after each layout pass, since the banner's placement depends on the window's size and safe area in
// ways Auto Layout can't express.
@property (nonatomic, copy) void (^layoutHandler)(void);
@end

@implementation RCTDevBannerWindow

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

@implementation RCTDevBanner {
  RCTDevBannerWindow *_window;
  UILabel *_label;
  UIView *_container;
  UIView *_contentView;
  UIView *_dimmingView;
  UIView *_accessoryView;
  UIButton *_dismissButton;
  NSLayoutConstraint *_labelTrailingConstraint;
  NSLayoutConstraint *_labelToButtonConstraint;
  NSLayoutConstraint *_centerConstraint;
  NSLayoutConstraint *_trailingLimitConstraint;
  NSLayoutConstraint *_topSafeAreaConstraint;
  NSLayoutConstraint *_topMarginConstraint;
  NSLayoutConstraint *_topPullConstraint;
  NSDate *_showDate;
  BOOL _hiding;
  // Incremented by each show so a hide animation that it interrupts does not tear down the new banner.
  NSUInteger _generation;
#if RCT_DEV_BANNER_HAS_HINGE
  NSTimer *_divisionPollTimer;
  NSDate *_divisionPollDeadline;
  BOOL _hingeOpen;
#endif
}

- (void)dealloc
{
#if RCT_DEV_BANNER_HAS_HINGE
  [_divisionPollTimer invalidate];
#endif
  UIWindow *window = _window;
  _window = nil;
  if (window) {
    RCTExecuteOnMainQueue(^{
      window.hidden = YES;
    });
  }
}

- (BOOL)isVisible
{
  return _window != nil;
}

- (void)showMessage:(NSString *)message
              color:(UIColor *)color
    backgroundColor:(UIColor *)backgroundColor
      dismissButton:(BOOL)dismissButton
{
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
      self->_window = windowScene != nil ? [[RCTDevBannerWindow alloc] initWithWindowScene:windowScene]
                                         : [[RCTDevBannerWindow alloc] init];
      self->_window.frame = self->_window.windowScene.coordinateSpace.bounds;
#if !TARGET_OS_TV
      self->_window.windowLevel = [self windowLevel];
#endif
      self->_window.rootViewController = [UIViewController new];
      __weak __typeof(self) weakSelf = self;
      self->_window.layoutHandler = ^{
        [weakSelf _updatePlacementAnimated:NO];
      };
      self->_window.rootViewController.view.backgroundColor = UIColor.clearColor;
#if RCT_DEV_BANNER_HAS_HINGE
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
    [self updateMessage:message];
    self->_container.accessibilityLabel = [self accessibilityLabelForMessage:message];
    self->_container.isAccessibilityElement = self->_container.accessibilityLabel != nil;

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

    [RCTDevBannerVisibleBanners() addObject:self];
    self->_window.hidden = NO;
    [self _updatePlacementAnimated:NO];
    [self->_window layoutIfNeeded];
    [self _updateOtherBannersAnimated:YES];
    if (isNewBanner) {
      [self _animateBannerIn];
    }
  });
}

- (void)updateMessage:(NSString *)message
{
  _label.attributedText = [self attributedTextForMessage:message textColor:_label.textColor];
}

- (void)hide
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_hiding = YES;
    NSUInteger generation = self->_generation;
    NSTimeInterval presentedTime = [[NSDate date] timeIntervalSinceDate:self->_showDate];
    NSTimeInterval delay = MAX(0, RCTDevBannerMinPresentedTime - presentedTime);
    [UIView animateWithDuration:RCTDevBannerAnimationDuration
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
          self->_dimmingView.alpha = 0;
        }
        completion:^(__unused BOOL finished) {
          if (self->_generation != generation) {
            return;
          }
          [self _removeBanner];
          [RCTDevBannerVisibleBanners() removeObject:self];
          [self _updateOtherBannersAnimated:YES];
          self->_window.hidden = YES;
          self->_window = nil;
        }];
  });
}

#pragma mark - Subclassing

- (UIWindowLevel)windowLevel
{
  // Above the paused banner's dimming, so loading messages stay readable and tappable while the app is paused.
  return UIWindowLevelStatusBar + 2;
}

- (BOOL)dimsBackground
{
  return NO;
}

- (NSUInteger)stackLevel
{
  return 1;
}

- (CGFloat)minimumHeight
{
  return RCTDevBannerMinHeight;
}

- (NSDirectionalEdgeInsets)labelInsets
{
  return NSDirectionalEdgeInsetsMake(
      RCTDevBannerLabelVerticalPadding,
      RCTDevBannerLabelHorizontalPadding,
      RCTDevBannerLabelVerticalPadding,
      RCTDevBannerLabelHorizontalPadding);
}

- (UIView *)makeLeadingAccessoryView
{
  return nil;
}

- (NSAttributedString *)attributedTextForMessage:(NSString *)message textColor:(__unused UIColor *)textColor
{
  NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
  paragraphStyle.alignment = NSTextAlignmentCenter;
  paragraphStyle.lineSpacing = RCTDevBannerLineSpacing;
  return [[NSAttributedString alloc] initWithString:message
                                         attributes:@{NSParagraphStyleAttributeName : paragraphStyle}];
}

- (NSString *)accessibilityLabelForMessage:(__unused NSString *)message
{
  return nil;
}

- (void)didTapCapsule
{
  [self hide];
}

#pragma mark - Placement

#if RCT_DEV_BANNER_HAS_HINGE
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
// while its inset spans the whole top edge, so the banner ignores that inset and sits 16pt from the top. A banner
// that stacks below others sits under them instead of at the top.
- (void)_updatePlacementAnimated:(BOOL)animated
{
  if (_container == nil) {
    return;
  }
  UIView *rootView = _window.rootViewController.view;
  UIEdgeInsets safeAreaInsets = rootView.safeAreaInsets;
  CGFloat centerOffset = RCTDevBannerCenterLayoutAnchor(safeAreaInsets);
  CGFloat trailingMargin = RCTDevBannerHorizontalMargin;
  BOOL respectsTopSafeArea = YES;
  CGFloat stackOffset = 0;
  for (RCTDevBanner *banner in RCTDevBannerVisibleBanners()) {
    if (banner != self && banner->_container != nil && [banner stackLevel] < [self stackLevel]) {
      stackOffset += CGRectGetHeight(banner->_container.frame) + RCTDevBannerStackSpacing;
    }
  }
#if RCT_DEV_BANNER_HAS_HINGE
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
      respectsTopSafeArea == _topSafeAreaConstraint.active && stackOffset == _topPullConstraint.constant) {
    return;
  }
  _centerConstraint.constant = centerOffset;
  _trailingLimitConstraint.constant = -trailingMargin;
  _topSafeAreaConstraint.active = respectsTopSafeArea;
  _topSafeAreaConstraint.constant = stackOffset;
  _topMarginConstraint.constant = RCTDevBannerTopMargin + stackOffset;
  _topPullConstraint.constant = stackOffset;
  if (animated) {
    [UIView animateWithDuration:RCTDevBannerAnimationDuration
                     animations:^{
                       [rootView layoutIfNeeded];
                     }];
  }
}

- (void)_updateOtherBannersAnimated:(BOOL)animated
{
  for (RCTDevBanner *banner in [RCTDevBannerVisibleBanners() copy]) {
    if (banner != self) {
      [banner _updatePlacementAnimated:animated];
    }
  }
}

#pragma mark - Capsule

- (CGAffineTransform)_hiddenTransform
{
  CGFloat anchorY = -RCTDevBannerHiddenAnchorOffset * _container.bounds.size.height;
  CGAffineTransform transform = CGAffineTransformMakeTranslation(0, anchorY);
  transform = CGAffineTransformScale(transform, RCTDevBannerHiddenScale, RCTDevBannerHiddenScale);
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
  _dimmingView.alpha = 0;

  [UIView animateWithDuration:RCTDevBannerAnimationDuration
                        delay:0
                      options:UIViewAnimationOptionCurveEaseOut | UIViewAnimationOptionAllowUserInteraction
                   animations:^{
                     effectView.effect = effect;
                     self->_contentView.alpha = 1;
                     self->_container.alpha = 1;
                     self->_container.transform = CGAffineTransformIdentity;
                     self->_dimmingView.alpha = 1;
                   }
                   completion:nil];
}

- (void)_createBannerWithBackgroundColor:(UIColor *)backgroundColor
{
  UIView *rootView = _window.rootViewController.view;
  if ([self dimsBackground]) {
    [self _createDimmingView];
  }

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
    container.layer.cornerRadius = [self minimumHeight] / 2;
    container.layer.cornerCurve = kCACornerCurveContinuous;
    container.clipsToBounds = YES;
    contentView = container;
  }
  container.translatesAutoresizingMaskIntoConstraints = NO;
  [container addGestureRecognizer:[[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(didTapCapsule)]];

  UILabel *label = [UILabel new];
  label.translatesAutoresizingMaskIntoConstraints = NO;
  label.font = [UIFont monospacedDigitSystemFontOfSize:RCTDevBannerFontSize weight:UIFontWeightMedium];
  label.textAlignment = NSTextAlignmentCenter;
  label.numberOfLines = 0;
  [contentView addSubview:label];

  [rootView addSubview:container];

  // Centered on the window like a system alert, with required safe area limits that only push the banner
  // inward where the two would overlap, such as beside the camera cutout.
  UILayoutGuide *safeArea = rootView.safeAreaLayoutGuide;
  NSDirectionalEdgeInsets labelInsets = [self labelInsets];
  _centerConstraint = [container.centerXAnchor constraintEqualToAnchor:rootView.centerXAnchor];
  _centerConstraint.priority = UILayoutPriorityDefaultHigh;
  _trailingLimitConstraint = [container.trailingAnchor constraintLessThanOrEqualToAnchor:safeArea.trailingAnchor
                                                                                constant:-RCTDevBannerHorizontalMargin];
  _labelTrailingConstraint = [label.trailingAnchor constraintEqualToAnchor:contentView.trailingAnchor
                                                                  constant:-labelInsets.trailing];
  // Sits flush under a top safe area inset such as the status bar, or 16pt from the top edge without one, each
  // pushed down by the banners stacked above it.
  _topSafeAreaConstraint = [container.topAnchor constraintGreaterThanOrEqualToAnchor:safeArea.topAnchor];
  _topMarginConstraint = [container.topAnchor constraintGreaterThanOrEqualToAnchor:rootView.topAnchor
                                                                          constant:RCTDevBannerTopMargin];
  _topPullConstraint = [container.topAnchor constraintEqualToAnchor:rootView.topAnchor];
  _topPullConstraint.priority = UILayoutPriorityDefaultLow;
  [NSLayoutConstraint activateConstraints:@[
    _centerConstraint,
    _trailingLimitConstraint,
    [container.leadingAnchor constraintGreaterThanOrEqualToAnchor:safeArea.leadingAnchor
                                                         constant:RCTDevBannerHorizontalMargin],
    _topSafeAreaConstraint,
    _topMarginConstraint,
    _topPullConstraint,
    [container.heightAnchor constraintGreaterThanOrEqualToConstant:[self minimumHeight]],
    [label.topAnchor constraintEqualToAnchor:contentView.topAnchor constant:labelInsets.top],
    [label.bottomAnchor constraintEqualToAnchor:contentView.bottomAnchor constant:-labelInsets.bottom],
  ]];

  UIView *accessoryView = [self makeLeadingAccessoryView];
  if (accessoryView != nil) {
    accessoryView.translatesAutoresizingMaskIntoConstraints = NO;
    [contentView addSubview:accessoryView];
    [NSLayoutConstraint activateConstraints:@[
      [accessoryView.leadingAnchor constraintEqualToAnchor:contentView.leadingAnchor constant:labelInsets.leading],
      [accessoryView.centerYAnchor constraintEqualToAnchor:contentView.centerYAnchor],
      [label.leadingAnchor constraintEqualToAnchor:accessoryView.trailingAnchor constant:RCTDevBannerAccessorySpacing],
    ]];
  } else {
    [label.leadingAnchor constraintEqualToAnchor:contentView.leadingAnchor constant:labelInsets.leading].active = YES;
  }

  _container = container;
  _contentView = contentView;
  _label = label;
  _accessoryView = accessoryView;
}

// Dims the app and swallows touches while a banner says it cannot respond to them. The dimming view sits below the
// capsule, which this window's hit testing leaves interactive.
- (void)_createDimmingView
{
  UIView *dimmingView = [UIView new];
  dimmingView.backgroundColor = [UIColor.blackColor colorWithAlphaComponent:RCTDevBannerDimmingAlpha];
  dimmingView.translatesAutoresizingMaskIntoConstraints = NO;
  UIView *rootView = _window.rootViewController.view;
  [rootView addSubview:dimmingView];
  [NSLayoutConstraint activateConstraints:@[
    [dimmingView.topAnchor constraintEqualToAnchor:rootView.topAnchor],
    [dimmingView.bottomAnchor constraintEqualToAnchor:rootView.bottomAnchor],
    [dimmingView.leadingAnchor constraintEqualToAnchor:rootView.leadingAnchor],
    [dimmingView.trailingAnchor constraintEqualToAnchor:rootView.trailingAnchor],
  ]];
  _dimmingView = dimmingView;
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
    [button.widthAnchor constraintEqualToConstant:RCTDevBannerDismissButtonSize],
    [button.heightAnchor constraintEqualToConstant:RCTDevBannerDismissButtonSize],
  ]];

  _dismissButton = button;
}

- (void)_removeBanner
{
  [_container removeFromSuperview];
  [_dimmingView removeFromSuperview];
  _container = nil;
  _contentView = nil;
  _dimmingView = nil;
  _accessoryView = nil;
  _label = nil;
  _dismissButton = nil;
  _labelTrailingConstraint = nil;
  _labelToButtonConstraint = nil;
  _centerConstraint = nil;
  _trailingLimitConstraint = nil;
  _topSafeAreaConstraint = nil;
  _topMarginConstraint = nil;
  _topPullConstraint = nil;
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

@end

#else

@implementation RCTDevBanner

- (BOOL)isVisible
{
  return NO;
}
- (void)showMessage:(NSString *)message
              color:(UIColor *)color
    backgroundColor:(UIColor *)backgroundColor
      dismissButton:(BOOL)dismissButton
{
}
- (void)updateMessage:(NSString *)message
{
}
- (void)hide
{
}
- (UIWindowLevel)windowLevel
{
  return UIWindowLevelNormal;
}
- (BOOL)dimsBackground
{
  return NO;
}
- (NSUInteger)stackLevel
{
  return 0;
}
- (CGFloat)minimumHeight
{
  return 0;
}
- (NSDirectionalEdgeInsets)labelInsets
{
  return NSDirectionalEdgeInsetsZero;
}
- (UIView *)makeLeadingAccessoryView
{
  return nil;
}
- (NSAttributedString *)attributedTextForMessage:(NSString *)message textColor:(UIColor *)textColor
{
  return [[NSAttributedString alloc] initWithString:message];
}
- (NSString *)accessibilityLabelForMessage:(NSString *)message
{
  return nil;
}
- (void)didTapCapsule
{
}

@end

#endif
