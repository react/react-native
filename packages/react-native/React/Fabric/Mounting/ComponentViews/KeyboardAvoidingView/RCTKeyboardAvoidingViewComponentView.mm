/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTKeyboardAvoidingViewComponentView.h"

#import <react/renderer/components/FBReactNativeSpec/Props.h>
#import <react/renderer/components/keyboardavoidingview/KeyboardAvoidingViewComponentDescriptor.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

/*
 * Hidden view between the keyboard layout guide and the bottom of the guide
 * owner. Kept out of the guide owner, whose subviews Fabric can manage.
 */
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

@interface RCTKeyboardAvoidingViewDisplayLinkTarget : NSObject

@property (nonatomic, weak) RCTKeyboardAvoidingViewComponentView *view;

@end

@interface RCTKeyboardAvoidingViewComponentView ()

- (void)_displayLinkDidFire;

@end

@implementation RCTKeyboardAvoidingViewDisplayLinkTarget

- (void)displayLinkDidFire:(CADisplayLink *)displayLink
{
  [self.view _displayLinkDidFire];
}

@end

@implementation RCTKeyboardAvoidingViewComponentView {
  KeyboardAvoidingViewShadowNode::ConcreteState::Shared _state;
  RCTKeyboardTrackingView *_trackingView;
  // Holds the tracking view. A direct subview of the window, so no other code
  // manages its subviews.
  UIView *_trackingContainerView;
  // Owns the keyboard layout guide. The guide of the window itself is not
  // updated, and the guide of this view moves when the view resizes.
  __weak UIView *_guideOwnerView;
  CADisplayLink *_displayLink;
  BOOL _isUpdateScheduled;

  // Height of the tracking view when the keyboard is hidden.
  CGFloat _keyboardBaseHeight;
  // Smallest height of the tracking view since the guide owner got its size.
  CGFloat _minTrackingHeight;
  CGSize _guideOwnerSize;
  // The tracking view has no size until its first layout.
  BOOL _isTrackingViewLaidOut;
  CGFloat _targetKeyboardHeight;
  // Keyboard height and inset when the keyboard started to move to its target.
  CGFloat _startKeyboardHeight;
  CGFloat _startInset;
  CGFloat _restingHeight;
  CGFloat _appliedInset;
  CGFloat _appliedRestingHeight;
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
  [_displayLink invalidate];
  [_trackingContainerView removeFromSuperview];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  [self _stopDisplayLink];
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
    [strongSelf _startDisplayLink];
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

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  // A commit can not start inside a mount, so the update runs on the next loop.
  [self _scheduleUpdate];
}

#pragma mark - Keyboard tracking

/*
 * UIKit animates the guide only while it lays out the guide owner. The tracking
 * view is outside of it, so it is laid out here with the keyboard animation.
 * The guide already has its final position when this notification is posted.
 */
- (void)_keyboardWillChangeFrame:(NSNotification *)notification
{
  UIView *trackingContainerView = _trackingContainerView;
  if (trackingContainerView == nil) {
    return;
  }

  NSTimeInterval duration = [notification.userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  UIViewAnimationCurve curve =
      (UIViewAnimationCurve)[notification.userInfo[UIKeyboardAnimationCurveUserInfoKey] integerValue];
  [UIView animateWithDuration:duration
                        delay:0
                      options:(UIViewAnimationOptions)curve << 16 | UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     [trackingContainerView layoutIfNeeded];
                   }
                   completion:nil];
}

- (CGFloat)_currentKeyboardBaseHeight
{
  // The tracking view is at its smallest height when the keyboard is hidden.
  // Capped at the bottom safe area, in case the keyboard was never hidden.
  UIView *guideOwnerView = _guideOwnerView;
  if (guideOwnerView == nil) {
    return 0;
  }
  if (!CGSizeEqualToSize(guideOwnerView.bounds.size, _guideOwnerSize)) {
    _guideOwnerSize = guideOwnerView.bounds.size;
    _minTrackingHeight = CGFLOAT_MAX;
  }
  _minTrackingHeight = MIN(_minTrackingHeight, _trackingView.layer.bounds.size.height);
  CGFloat bottomSafeArea =
      MAX(CGRectGetMaxY(guideOwnerView.bounds) - CGRectGetMaxY(guideOwnerView.safeAreaLayoutGuide.layoutFrame), 0);
  return MIN(bottomSafeArea, _minTrackingHeight);
}

- (void)_startDisplayLink
{
  if (_displayLink != nil) {
    return;
  }
  auto target = [RCTKeyboardAvoidingViewDisplayLinkTarget new];
  target.view = self;
  _displayLink = [CADisplayLink displayLinkWithTarget:target selector:@selector(displayLinkDidFire:)];
  [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)_stopDisplayLink
{
  [_displayLink invalidate];
  _displayLink = nil;
}

- (void)_displayLinkDidFire
{
  if (_trackingView == nil || !_isTrackingViewLaidOut) {
    [self _stopDisplayLink];
    return;
  }

  CALayer *layer = _trackingView.layer;
  CALayer *presentationLayer = layer.presentationLayer ?: layer;
  BOOL isAnimating = layer.animationKeys.count > 0;

  _keyboardBaseHeight = [self _currentKeyboardBaseHeight];
  CGFloat keyboardHeight = MAX(presentationLayer.bounds.size.height - _keyboardBaseHeight, 0);
  CGFloat targetHeight = MAX(layer.bounds.size.height - _keyboardBaseHeight, 0);

  [self _keyboardFrameDidChange:keyboardHeight targetHeight:targetHeight];

  if (!isAnimating) {
    [self _stopDisplayLink];
  }
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
    // A running display link sends the next update itself.
    if (strongSelf->_displayLink == nil) {
      [strongSelf _startDisplayLink];
    }
  });
}

/*
 * Overlap between the view at rest and a keyboard of the given height,
 * measured like the JavaScript implementation.
 */
- (CGFloat)_relativeKeyboardHeight:(CGFloat)keyboardHeight
{
  if (keyboardHeight <= 0 || self.window == nil) {
    return 0;
  }

  const auto &props = static_cast<const KeyboardAvoidingViewProps &>(*_props);

  CGFloat frameY;
  CGFloat frameHeight;
  if (props.behavior == KeyboardAvoidingViewBehavior::Position) {
    // `position` moves a content container: measure the view that holds it.
    UIView *container = self.superview;
    if (container == nil) {
      return 0;
    }
    frameHeight = container.bounds.size.height;
    frameY = container.center.y - frameHeight * container.layer.anchorPoint.y;
  } else {
    frameY = _layoutMetrics.frame.origin.y;
    frameHeight =
        props.behavior == KeyboardAvoidingViewBehavior::Height ? _restingHeight : _layoutMetrics.frame.size.height;
  }

  CGFloat keyboardY = self.window.bounds.size.height - keyboardHeight - props.keyboardVerticalOffset;
  return MAX(frameY + frameHeight - keyboardY, 0);
}

- (void)_keyboardFrameDidChange:(CGFloat)keyboardHeight targetHeight:(CGFloat)targetHeight
{
  if (targetHeight != _targetKeyboardHeight) {
    _targetKeyboardHeight = targetHeight;
    _startKeyboardHeight = keyboardHeight;
    _startInset = _appliedInset;
  }

  if (!_state) {
    return;
  }

  const auto &props = static_cast<const KeyboardAvoidingViewProps &>(*_props);
  if (props.behavior == KeyboardAvoidingViewBehavior::None && _appliedInset == 0) {
    return;
  }

  if (_appliedInset == 0) {
    _restingHeight = _layoutMetrics.frame.size.height;
  }

  // The tracking view stops at the bottom of the guide owner, which can be
  // above the bottom of the window.
  CGFloat ownerBottomInset = 0;
  if (UIView *guideOwnerView = _guideOwnerView) {
    ownerBottomInset = MAX(
        self.window.bounds.size.height - CGRectGetMaxY([guideOwnerView convertRect:guideOwnerView.bounds toView:nil]),
        0);
  }
  CGFloat targetInset =
      targetHeight > 0 ? [self _relativeKeyboardHeight:targetHeight + _keyboardBaseHeight + ownerBottomInset] : 0;
  CGFloat distance = targetHeight - _startKeyboardHeight;
  CGFloat progress = distance != 0 ? MIN(MAX((keyboardHeight - _startKeyboardHeight) / distance, 0), 1) : 1;
  BOOL isActive = props.enabled && props.behavior != KeyboardAvoidingViewBehavior::None;
  CGFloat inset = isActive ? _startInset + (targetInset - _startInset) * progress : 0;

  if (inset == _appliedInset && (inset == 0 || _restingHeight == _appliedRestingHeight)) {
    return;
  }

  _appliedInset = inset;
  _appliedRestingHeight = _restingHeight;
  _state->getData().update(inset, _restingHeight);
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<KeyboardAvoidingViewComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldKeyboardAvoidingViewProps = static_cast<const KeyboardAvoidingViewProps &>(*_props);
  const auto &newKeyboardAvoidingViewProps = static_cast<const KeyboardAvoidingViewProps &>(*props);

  BOOL needsUpdate = oldKeyboardAvoidingViewProps.behavior != newKeyboardAvoidingViewProps.behavior ||
      oldKeyboardAvoidingViewProps.enabled != newKeyboardAvoidingViewProps.enabled ||
      oldKeyboardAvoidingViewProps.keyboardVerticalOffset != newKeyboardAvoidingViewProps.keyboardVerticalOffset;

  [super updateProps:props oldProps:oldProps];

  if (needsUpdate) {
    [self _scheduleUpdate];
  }
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  _state = std::static_pointer_cast<const KeyboardAvoidingViewShadowNode::ConcreteState>(state);
  [self _scheduleUpdate];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self _stopDisplayLink];
  _state.reset();
  _targetKeyboardHeight = 0;
  _startKeyboardHeight = 0;
  _startInset = 0;
  _restingHeight = 0;
  _appliedInset = 0;
  _appliedRestingHeight = 0;
}

@end

Class<RCTComponentViewProtocol> RCTKeyboardAvoidingViewCls(void)
{
  return RCTKeyboardAvoidingViewComponentView.class;
}
