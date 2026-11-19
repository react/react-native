/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTKeyboardAvoidingViewComponentView.h"

#import <react/renderer/components/FBReactNativeSpec/ComponentDescriptors.h>
#import <react/renderer/components/FBReactNativeSpec/Props.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

// Hidden view from the keyboard top to the guide owner bottom.
@interface RCTKeyboardTrackingView : UIView

@property (nonatomic, copy, nullable) void (^onLayout)(void);

@end

@implementation RCTKeyboardTrackingView

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (self.onLayout != nil) {
    self.onLayout();
  }
}

@end

@implementation RCTKeyboardAvoidingViewComponentView {
  RCTKeyboardTrackingView *_trackingView;
  // Window subview, so no other code manages it and its frames are in window coordinates.
  UIView *_trackingContainerView;
  // The window guide never updates, and the guide of this view moves on resize.
  __weak UIView *_guideOwnerView;
  BOOL _isUpdateScheduled;
  CGFloat _minTrackingHeight;
  CGSize _guideOwnerSize;
  CGFloat _guideOwnerBottomSafeArea;
  BOOL _isTrackingViewLaidOut;
  CGFloat _keyboardInset;
  // Changes once per keyboard animation: at its end, or at the start of a hide.
  CGFloat _settledInset;
  NSUInteger _keyboardAnimationCount;
  // `height` shrinks this view, so measure it while the keyboard doesn't overlap.
  CGFloat _heightWithoutKeyboard;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = KeyboardAvoidingViewShadowNode::defaultSharedProps();

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_keyboardWillChangeFrame:)
                                                 name:UIKeyboardWillChangeFrameNotification
                                               object:nil];
  }

  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [_trackingContainerView removeFromSuperview];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  [_trackingContainerView removeFromSuperview];
  _trackingContainerView = nil;
  _trackingView = nil;

  UIWindow *window = self.window;

  if (window == nil) {
    return;
  }

  UIView *guideOwnerView = window.rootViewController.view;

  for (UIResponder *responder = self.nextResponder; responder != nil; responder = responder.nextResponder) {
    if ([responder isKindOfClass:[UIViewController class]]) {
      guideOwnerView = ((UIViewController *)responder).view;
      break;
    }
  }

  if (guideOwnerView == nil) {
    return;
  }

  _guideOwnerView = guideOwnerView;
  _guideOwnerSize = CGSizeZero;
  _isTrackingViewLaidOut = NO;

  _trackingContainerView = [[UIView alloc] initWithFrame:window.bounds];
  _trackingContainerView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  _trackingContainerView.hidden = YES;
  _trackingContainerView.userInteractionEnabled = NO;
  [window addSubview:_trackingContainerView];

  _trackingView = [RCTKeyboardTrackingView new];
  _trackingView.translatesAutoresizingMaskIntoConstraints = NO;
  __weak __typeof(self) weakSelf = self;

  _trackingView.onLayout = ^{
    __typeof(self) strongSelf = weakSelf;

    if (strongSelf == nil) {
      return;
    }

    strongSelf->_isTrackingViewLaidOut = YES;
    [strongSelf _updateKeyboardInset];
  };

  [_trackingContainerView addSubview:_trackingView];

  [NSLayoutConstraint activateConstraints:@[
    [_trackingView.leadingAnchor constraintEqualToAnchor:_trackingContainerView.leadingAnchor],
    [_trackingView.trailingAnchor constraintEqualToAnchor:_trackingContainerView.trailingAnchor],
    [_trackingView.topAnchor constraintEqualToAnchor:guideOwnerView.keyboardLayoutGuide.topAnchor],
    [_trackingView.bottomAnchor constraintEqualToAnchor:guideOwnerView.bottomAnchor],
  ]];

  [self _scheduleUpdate];
}

#pragma mark - Keyboard tracking

// UIKit only animates the guide owner, so lay out the tracking view in the keyboard animation.
- (void)_keyboardWillChangeFrame:(NSNotification *)notification
{
  UIView *trackingContainerView = _trackingContainerView;

  if (trackingContainerView == nil) {
    return;
  }

  NSTimeInterval duration = [notification.userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  UIViewAnimationCurve curve =
      (UIViewAnimationCurve)[notification.userInfo[UIKeyboardAnimationCurveUserInfoKey] integerValue];

  _keyboardAnimationCount++;
  __weak __typeof(self) weakSelf = self;

  [UIView animateWithDuration:duration
      delay:0
      options:(UIViewAnimationOptions)curve << 16 | UIViewAnimationOptionBeginFromCurrentState
      animations:^{
        [trackingContainerView layoutIfNeeded];
      }
      completion:^(__unused BOOL finished) {
        __typeof(self) strongSelf = weakSelf;

        if (strongSelf == nil) {
          return;
        }

        strongSelf->_keyboardAnimationCount--;

        if (strongSelf->_keyboardAnimationCount == 0) {
          [strongSelf _updateKeyboardInset];
        }
      }];
}

- (CGFloat)_hiddenKeyboardTrackingHeight
{
  // Capped at the bottom safe area, for when the keyboard was never hidden.
  UIView *guideOwnerView = _guideOwnerView;

  if (guideOwnerView == nil) {
    return 0;
  }

  CGFloat bottomSafeArea =
      MAX(CGRectGetMaxY(guideOwnerView.bounds) - CGRectGetMaxY(guideOwnerView.safeAreaLayoutGuide.layoutFrame), 0);

  // The hidden guide follows the bottom safe area, which can change without a resize.
  if (!CGSizeEqualToSize(guideOwnerView.bounds.size, _guideOwnerSize) || bottomSafeArea != _guideOwnerBottomSafeArea) {
    _guideOwnerSize = guideOwnerView.bounds.size;
    _guideOwnerBottomSafeArea = bottomSafeArea;
    _minTrackingHeight = CGFLOAT_MAX;
  }

  _minTrackingHeight = MIN(_minTrackingHeight, _trackingView.bounds.size.height);
  return MIN(bottomSafeArea, _minTrackingHeight);
}

- (void)_scheduleUpdate
{
  if (_isUpdateScheduled) {
    return;
  }

  _isUpdateScheduled = YES;
  __weak __typeof(self) weakSelf = self;

  dispatch_async(dispatch_get_main_queue(), ^{
    __typeof(self) strongSelf = weakSelf;

    if (strongSelf == nil) {
      return;
    }

    strongSelf->_isUpdateScheduled = NO;
    [strongSelf _updateKeyboardInset];
  });
}

- (void)_updateKeyboardInset
{
  if (_trackingView == nil || !_isTrackingViewLaidOut || _eventEmitter == nullptr) {
    return;
  }

  const auto &props = static_cast<const KeyboardAvoidingViewProps &>(*_props);

  if (_keyboardInset == 0) {
    _heightWithoutKeyboard = _layoutMetrics.frame.size.height;
  }

  CGFloat inset = 0;
  BOOL isKeyboardVisible = _trackingView.bounds.size.height > [self _hiddenKeyboardTrackingHeight];

  if (props.enabled && isKeyboardVisible) {
    CGFloat keyboardY = CGRectGetMinY(_trackingView.frame) - props.keyboardVerticalOffset;
    inset = MAX(_layoutMetrics.frame.origin.y + _heightWithoutKeyboard - keyboardY, 0);
  }

  // During an animation, `inset` is already the end value.
  CGFloat settledInset = (_keyboardAnimationCount == 0 || inset == 0) ? inset : _settledInset;

  if (inset == _keyboardInset && settledInset == _settledInset) {
    return;
  }

  _keyboardInset = inset;
  _settledInset = settledInset;
  CGFloat maxHeight = inset > 0 ? MAX(_heightWithoutKeyboard - inset, 0) : INFINITY;

  // A `folly::dynamic` payload, which C++ Native Animated can read.
  _eventEmitter->dispatchUniqueEvent(
      "keyboardInsetChange",
      folly::dynamic::object("inset", inset)("maxHeight", maxHeight)("settledInset", settledInset));
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<KeyboardAvoidingViewComponentDescriptor>();
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  // Can't commit inside a mount.
  [self _scheduleUpdate];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _keyboardInset = 0;
  _settledInset = 0;
  _heightWithoutKeyboard = 0;
}

@end

Class<RCTComponentViewProtocol> RCTKeyboardAvoidingViewCls(void)
{
  return RCTKeyboardAvoidingViewComponentView.class;
}
