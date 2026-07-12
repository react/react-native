/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollViewComponentView.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTConstants.h>
#import <React/RCTScrollEvent.h>

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/components/scrollview/RCTComponentViewHelpers.h>
#import <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#import <react/renderer/components/scrollview/ScrollViewEventEmitter.h>
#import <react/renderer/components/scrollview/ScrollViewProps.h>
#import <react/renderer/components/scrollview/ScrollViewState.h>
#import <react/renderer/components/scrollview/conversions.h>

#import "RCTConversions.h"
#import "RCTCustomPullToRefreshViewProtocol.h"
#import "RCTEnhancedScrollView.h"
#import "RCTFabricComponentsPlugins.h"
#import "RCTVirtualViewContainerState.h"

using namespace facebook::react;

static NSString *kOnScrollEvent = @"onScroll";

static NSString *kOnScrollEndEvent = @"onScrollEnded";

static const CGFloat kClippingLeeway = 44.0;

static UIScrollViewKeyboardDismissMode RCTUIKeyboardDismissModeFromProps(const ScrollViewProps &props)
{
  switch (props.keyboardDismissMode) {
    case ScrollViewKeyboardDismissMode::None:
      return UIScrollViewKeyboardDismissModeNone;
    case ScrollViewKeyboardDismissMode::OnDrag:
      return UIScrollViewKeyboardDismissModeOnDrag;
    case ScrollViewKeyboardDismissMode::Interactive:
      return UIScrollViewKeyboardDismissModeInteractive;
  }
}

static UIScrollViewIndicatorStyle RCTUIScrollViewIndicatorStyleFromProps(const ScrollViewProps &props)
{
  switch (props.indicatorStyle) {
    case ScrollViewIndicatorStyle::Default:
      return UIScrollViewIndicatorStyleDefault;
    case ScrollViewIndicatorStyle::Black:
      return UIScrollViewIndicatorStyleBlack;
    case ScrollViewIndicatorStyle::White:
      return UIScrollViewIndicatorStyleWhite;
  }
}

// Once Fabric implements proper NativeAnimationDriver, this should be removed.
// This is just a workaround to allow animations based on onScroll event.
// This is only used to animate sticky headers in ScrollViews, and only the contentOffset and tag is used.
// TODO: T116850910 [Fabric][iOS] Make Fabric not use legacy RCTEventDispatcher for native-driven AnimatedEvents
static void
RCTSendScrollEventForNativeAnimations_DEPRECATED(UIScrollView *scrollView, NSInteger tag, NSString *eventName)
{
  if (ReactNativeFeatureFlags::cxxNativeAnimatedEnabled()) {
    return;
  }
  static uint16_t coalescingKey = 0;
  RCTScrollEvent *scrollEvent = [[RCTScrollEvent alloc] initWithEventName:eventName
                                                                 reactTag:[NSNumber numberWithInt:tag]
                                                  scrollViewContentOffset:scrollView.contentOffset
                                                   scrollViewContentInset:scrollView.contentInset
                                                    scrollViewContentSize:scrollView.contentSize
                                                          scrollViewFrame:scrollView.frame
                                                      scrollViewZoomScale:scrollView.zoomScale
                                                                 userData:nil
                                                            coalescingKey:coalescingKey];
  NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:scrollEvent, @"event", nil];
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED
                                                      object:nil
                                                    userInfo:userInfo];
}

@interface RCTScrollViewComponentView () <
    UIScrollViewDelegate,
    RCTScrollViewProtocol,
    RCTScrollableProtocol,
    RCTEnhancedScrollViewOverridingDelegate>

@end

@implementation RCTScrollViewComponentView {
  ScrollViewShadowNode::ConcreteState::Shared _state;
  CGSize _contentSize;
  NSTimeInterval _lastScrollEventDispatchTime;
  NSTimeInterval _scrollEventThrottle;
  // Flag indicating whether the scrolling that is currently happening
  // is triggered by user or not.
  // This helps to only update state from `scrollViewDidScroll` in case
  // some other part of the system scrolls scroll view.
  BOOL _isUserTriggeredScrolling;
  BOOL _shouldUpdateContentInsetAdjustmentBehavior;
  BOOL _automaticallyAdjustKeyboardInsets;

  CGPoint _contentOffsetWhenClipped;

  __weak UIView *_contentView;

  CGRect _prevFirstVisibleFrame;
  __weak UIView *_firstVisibleView;
  NSInteger _firstVisibleViewTag;

  CGFloat _endDraggingSensitivityMultiplier;

  // A flag indicating that accessibility API is used.
  // It is not restored to the default value in prepareForRecycle.
  // Once an accessibility API is used, view culling will be disabled for the entire session.
  BOOL _isAccessibilityAPIUsed;

  // Flag to temporarily disable maintainVisibleContentPosition adjustments during immediate state updates
  // to prevent conflicts between immediate content offset updates and visible content position logic
  BOOL _avoidAdjustmentForMaintainVisibleContentPosition;

  RCTVirtualViewContainerState *_virtualViewContainerState;
}

+ (RCTScrollViewComponentView *_Nullable)findScrollViewComponentViewForView:(UIView *)view
{
  do {
    view = view.superview;
  } while (view != nil && ![view isKindOfClass:[RCTScrollViewComponentView class]]);
  return (RCTScrollViewComponentView *)view;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = ScrollViewShadowNode::defaultSharedProps();
    _scrollView = [[RCTEnhancedScrollView alloc] initWithFrame:self.bounds];
    _scrollView.clipsToBounds = _props->getClipsContentToBounds();
    _scrollView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _scrollView.delaysContentTouches = NO;
    ((RCTEnhancedScrollView *)_scrollView).overridingDelegate = self;
    _isUserTriggeredScrolling = NO;
    _shouldUpdateContentInsetAdjustmentBehavior = YES;
    _automaticallyAdjustKeyboardInsets = NO;
    _isAccessibilityAPIUsed = NO;
    [self addSubview:_scrollView];

    _containerView = [[UIView alloc] initWithFrame:CGRectZero];
    [_scrollView addSubview:_containerView];

    [self.scrollViewDelegateSplitter addDelegate:self];
#if TARGET_OS_IOS
    [self _registerKeyboardListener];
#endif

    _scrollEventThrottle = 0;
    _endDraggingSensitivityMultiplier = 1;
  }

  return self;
}

- (void)dealloc
{
  // Removing all delegates from the splitter nils the actual delegate which prevents a crash on UIScrollView
  // deallocation.
  [self.scrollViewDelegateSplitter removeAllDelegates];
}

#if TARGET_OS_IOS
- (void)_registerKeyboardListener
{
  // According to Apple docs, we don't need to explicitly unregister the observer, it's done automatically.
  // See the Apple documentation:
  // https://developer.apple.com/documentation/foundation/nsnotificationcenter/1413994-removeobserver?language=objc
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_keyboardWillChangeFrame:)
                                               name:UIKeyboardWillChangeFrameNotification
                                             object:nil];
}

- (void)_keyboardWillChangeFrame:(NSNotification *)notification
{
  if (!_automaticallyAdjustKeyboardInsets) {
    return;
  }
  BOOL isHorizontal = _scrollView.contentSize.width > self.frame.size.width;
  if (isHorizontal) {
    return;
  }

  bool isInverted = [self isInverted];
  double duration = [notification.userInfo[UIKeyboardAnimationDurationUserInfoKey] doubleValue];

  UIViewAnimationCurve curve =
      (UIViewAnimationCurve)[notification.userInfo[UIKeyboardAnimationCurveUserInfoKey] unsignedIntegerValue];
  CGRect keyboardEndFrame = [notification.userInfo[UIKeyboardFrameEndUserInfoKey] CGRectValue];
  CGRect keyboardBeginFrame = [notification.userInfo[UIKeyboardFrameBeginUserInfoKey] CGRectValue];

  CGPoint absoluteViewOrigin = [self convertPoint:self.bounds.origin toView:nil];
  CGFloat scrollViewLowerY = isInverted ? absoluteViewOrigin.y : absoluteViewOrigin.y + self.bounds.size.height;

  UIEdgeInsets newEdgeInsets = _scrollView.contentInset;
  CGFloat inset = MAX(scrollViewLowerY - keyboardEndFrame.origin.y, 0);
  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  if (isInverted) {
    newEdgeInsets.top = MAX(inset, props.contentInset.top);
  } else {
    newEdgeInsets.bottom = MAX(inset, props.contentInset.bottom);
  }

  CGPoint newContentOffset = _scrollView.contentOffset;
  self.firstResponderFocus = CGRectNull;

  CGFloat contentDiff = 0;
  if ([[UIApplication sharedApplication] sendAction:@selector(reactUpdateResponderOffsetForScrollView:)
                                                 to:nil
                                               from:self
                                           forEvent:nil]) {
    if (CGRectEqualToRect(_firstResponderFocus, CGRectNull)) {
      UIView *inputAccessoryView = _firstResponderViewOutsideScrollView.inputAccessoryView;
      if (inputAccessoryView) {
        // Text input view is within the inputAccessoryView.
        contentDiff = keyboardEndFrame.origin.y - keyboardBeginFrame.origin.y;
      }
    } else {
      // Inner text field focused
      CGFloat focusEnd = CGRectGetMaxY(self.firstResponderFocus);
      if (focusEnd > keyboardEndFrame.origin.y) {
        // Text field active region is below visible area with keyboard - update diff to bring into view
        contentDiff = keyboardEndFrame.origin.y - focusEnd;
      }
    }
  }

  if (isInverted) {
    newContentOffset.y += contentDiff;
  } else {
    newContentOffset.y -= contentDiff;
  }

  if (@available(iOS 14.0, *)) {
    // On iOS when Prefer Cross-Fade Transitions is enabled, the keyboard position
    // & height is reported differently (0 instead of Y position value matching height of frame)
    // Fixes similar issue we saw with https://github.com/facebook/react-native/pull/34503
    if (UIAccessibilityPrefersCrossFadeTransitions() && keyboardEndFrame.size.height == 0) {
      newContentOffset.y = 0;
      newEdgeInsets.bottom = 0;
    }
  }

  [UIView animateWithDuration:duration
                        delay:0.0
                      options:animationOptionsWithCurve(curve)
                   animations:^{
                     self->_scrollView.contentInset = newEdgeInsets;
                     self->_scrollView.verticalScrollIndicatorInsets = newEdgeInsets;
                     [self scrollTo:newContentOffset.x y:newContentOffset.y animated:NO];
                   }
                   completion:nil];
}

static inline UIViewAnimationOptions animationOptionsWithCurve(UIViewAnimationCurve curve)
{
  // UIViewAnimationCurve #7 is used for keyboard and therefore private - so we can't use switch/case here.
  // source: https://stackoverflow.com/a/7327374/5281431
  RCTAssert(
      UIViewAnimationCurveLinear << 16 == UIViewAnimationOptionCurveLinear,
      @"Unexpected implementation of UIViewAnimationCurve");
  return curve << 16;
}
#endif

- (RCTGenericDelegateSplitter<id<UIScrollViewDelegate>> *)scrollViewDelegateSplitter
{
  return ((RCTEnhancedScrollView *)_scrollView).delegateSplitter;
}

#pragma mark - RCTMountingTransactionObserving

- (void)mountingTransactionWillMount:(const facebook::react::MountingTransaction &)transaction
                withSurfaceTelemetry:(const facebook::react::SurfaceTelemetry &)surfaceTelemetry
{
  [self _prepareForMaintainVisibleScrollPosition];
}

- (void)mountingTransactionDidMount:(const MountingTransaction &)transaction
               withSurfaceTelemetry:(const facebook::react::SurfaceTelemetry &)surfaceTelemetry
{
  [self _remountChildren];
  [self _adjustForMaintainVisibleContentPosition];
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>();
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  if (layoutMetrics.layoutDirection != oldLayoutMetrics.layoutDirection) {
    CGAffineTransform transform = (layoutMetrics.layoutDirection == LayoutDirection::LeftToRight)
        ? CGAffineTransformIdentity
        : CGAffineTransformMakeScale(-1, 1);

    _containerView.transform = transform;
    _scrollView.transform = transform;
  }
}

- (bool)isInverted
{
  // Look into the entry at position 2,2 to check if scaleY is applied
  return self.layer.transform.m22 == -1;
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldScrollViewProps = static_cast<const ScrollViewProps &>(*_props);
  const auto &newScrollViewProps = static_cast<const ScrollViewProps &>(*props);

#define REMAP_PROP(reactName, localName, target)                      \
  if (oldScrollViewProps.reactName != newScrollViewProps.reactName) { \
    target.localName = newScrollViewProps.reactName;                  \
  }

#define REMAP_VIEW_PROP(reactName, localName) REMAP_PROP(reactName, localName, self)
#define MAP_VIEW_PROP(name) REMAP_VIEW_PROP(name, name)
#define REMAP_SCROLL_VIEW_PROP(reactName, localName) \
  REMAP_PROP(reactName, localName, ((RCTEnhancedScrollView *)_scrollView))
#define MAP_SCROLL_VIEW_PROP(name) REMAP_SCROLL_VIEW_PROP(name, name)

  // FIXME: Commented props are not supported yet.
  MAP_SCROLL_VIEW_PROP(alwaysBounceHorizontal);
  MAP_SCROLL_VIEW_PROP(alwaysBounceVertical);
  MAP_SCROLL_VIEW_PROP(bounces);
  MAP_SCROLL_VIEW_PROP(bouncesZoom);
  MAP_SCROLL_VIEW_PROP(canCancelContentTouches);
  MAP_SCROLL_VIEW_PROP(centerContent);
  // MAP_SCROLL_VIEW_PROP(automaticallyAdjustContentInsets);
  MAP_SCROLL_VIEW_PROP(decelerationRate);
  MAP_SCROLL_VIEW_PROP(directionalLockEnabled);
  MAP_SCROLL_VIEW_PROP(maximumZoomScale);
  MAP_SCROLL_VIEW_PROP(minimumZoomScale);
  MAP_SCROLL_VIEW_PROP(scrollEnabled);
#if !TARGET_OS_TV
  MAP_SCROLL_VIEW_PROP(pagingEnabled);
  MAP_SCROLL_VIEW_PROP(pinchGestureEnabled);
  MAP_SCROLL_VIEW_PROP(scrollsToTop);
#endif
  MAP_SCROLL_VIEW_PROP(showsHorizontalScrollIndicator);
  MAP_SCROLL_VIEW_PROP(showsVerticalScrollIndicator);

  if (oldScrollViewProps.automaticallyAdjustKeyboardInsets != newScrollViewProps.automaticallyAdjustKeyboardInsets) {
    _automaticallyAdjustKeyboardInsets = newScrollViewProps.automaticallyAdjustKeyboardInsets;
  }

  if (oldScrollViewProps.scrollIndicatorInsets != newScrollViewProps.scrollIndicatorInsets) {
    _scrollView.scrollIndicatorInsets = RCTUIEdgeInsetsFromEdgeInsets(newScrollViewProps.scrollIndicatorInsets);
  }

  if (oldScrollViewProps.indicatorStyle != newScrollViewProps.indicatorStyle) {
    _scrollView.indicatorStyle = RCTUIScrollViewIndicatorStyleFromProps(newScrollViewProps);
  }

  _endDraggingSensitivityMultiplier = newScrollViewProps.endDraggingSensitivityMultiplier;

  if (oldScrollViewProps.scrollEventThrottle != newScrollViewProps.scrollEventThrottle) {
    // Zero means "send value only once per significant logical event".
    // Prop value is in milliseconds.
    // iOS implementation uses `NSTimeInterval` (in seconds).
    CGFloat throttleInSeconds = newScrollViewProps.scrollEventThrottle / 1000.0;
    CGFloat msPerFrame = 1.0 / 60.0;
    if (throttleInSeconds < 0) {
      _scrollEventThrottle = INFINITY;
    } else if (throttleInSeconds <= msPerFrame) {
      _scrollEventThrottle = 0;
    } else {
      _scrollEventThrottle = throttleInSeconds;
    }
  }

  // Overflow prop
  if (oldScrollViewProps.getClipsContentToBounds() != newScrollViewProps.getClipsContentToBounds()) {
    _scrollView.clipsToBounds = newScrollViewProps.getClipsContentToBounds();
  }

  MAP_SCROLL_VIEW_PROP(zoomScale);

  // When disabling centerContent, reset inset to prop value
  // (enabling is handled automatically by the setCenterContent: setter)
  if (oldScrollViewProps.centerContent && !newScrollViewProps.centerContent) {
    _scrollView.contentInset = RCTUIEdgeInsetsFromEdgeInsets(newScrollViewProps.contentInset);
  }

  // Only apply contentInset from props if centerContent is disabled
  // When centerContent is enabled, the inset is calculated by centerContentIfNeeded
  if (oldScrollViewProps.contentInset != newScrollViewProps.contentInset && !newScrollViewProps.centerContent) {
    _scrollView.contentInset = RCTUIEdgeInsetsFromEdgeInsets(newScrollViewProps.contentInset);
  }
  if (oldScrollViewProps.contentOffset != newScrollViewProps.contentOffset) {
    _scrollView.contentOffset = RCTCGPointFromPoint(newScrollViewProps.contentOffset);
  }

  // RCTEnhancedScrollView specific props

  auto *scrollView = (RCTEnhancedScrollView *)_scrollView;
  if (oldScrollViewProps.snapToAlignment != newScrollViewProps.snapToAlignment) {
    scrollView.snapToAlignment = RCTNSStringFromString(toString(newScrollViewProps.snapToAlignment));
  }

  scrollView.snapToStart = newScrollViewProps.snapToStart;
  scrollView.snapToEnd = newScrollViewProps.snapToEnd;

  if (oldScrollViewProps.snapToOffsets != newScrollViewProps.snapToOffsets) {
    NSMutableArray<NSNumber *> *snapToOffsets = [NSMutableArray array];
    for (const auto &snapToOffset : newScrollViewProps.snapToOffsets) {
      [snapToOffsets addObject:[NSNumber numberWithFloat:snapToOffset]];
    }
    scrollView.snapToOffsets = snapToOffsets;
  }

  if (oldScrollViewProps.automaticallyAdjustsScrollIndicatorInsets !=
      newScrollViewProps.automaticallyAdjustsScrollIndicatorInsets) {
    scrollView.automaticallyAdjustsScrollIndicatorInsets = newScrollViewProps.automaticallyAdjustsScrollIndicatorInsets;
  }

  if ((oldScrollViewProps.contentInsetAdjustmentBehavior != newScrollViewProps.contentInsetAdjustmentBehavior) ||
      _shouldUpdateContentInsetAdjustmentBehavior) {
    const auto contentInsetAdjustmentBehavior = newScrollViewProps.contentInsetAdjustmentBehavior;
    if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::Never) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    } else if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::Automatic) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAutomatic;
    } else if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::ScrollableAxes) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentScrollableAxes;
    } else if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::Always) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAlways;
    }
    _shouldUpdateContentInsetAdjustmentBehavior = NO;
  }

  MAP_SCROLL_VIEW_PROP(disableIntervalMomentum);
  MAP_SCROLL_VIEW_PROP(snapToInterval);

  if (oldScrollViewProps.keyboardDismissMode != newScrollViewProps.keyboardDismissMode) {
    scrollView.keyboardDismissMode = RCTUIKeyboardDismissModeFromProps(newScrollViewProps);
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  assert(std::dynamic_pointer_cast<const ScrollViewShadowNode::ConcreteState>(state));
  _state = std::static_pointer_cast<const ScrollViewShadowNode::ConcreteState>(state);
  auto &data = _state->getData();

  auto contentOffset = RCTCGPointFromPoint(data.contentOffset);
  if (!oldState && !CGPointEqualToPoint(contentOffset, CGPointZero)) {
    /*
     * When <ScrollView /> is suspended, it is removed from view hierarchy and its offset is stored in
     * state. We want to restore this offset from the state but it must be snapped to be within UIScrollView's
     * content to remove any overscroll.
     *
     * This can happen, for example, with pull to refresh. The UIScrollView will be overscrolled into negative offset.
     * If the offset is not adjusted to be within the content area, it leads to a gap and UIScrollView does not adjust
     * its offset until user scrolls.
     */

    // Adjusting overscroll on the top.
    contentOffset.y = fmax(contentOffset.y, -_scrollView.contentInset.top);

    // Adjusting overscroll on the left.
    contentOffset.x = fmax(contentOffset.x, -_scrollView.contentInset.left);

    // TODO: T190695447 - Protect against over scroll on the bottom and right as well.
    // This is not easily done because we need to flip the order of method calls for
    // ShadowViewMutation::Insert. updateLayout must come before updateState.

    _scrollView.contentOffset = contentOffset;
  }

  CGSize contentSize = RCTCGSizeFromSize(data.getContentSize());

  if (CGSizeEqualToSize(_contentSize, contentSize)) {
    return;
  }

  _contentSize = contentSize;
  _containerView.frame = CGRect{RCTCGPointFromPoint(data.contentBoundingRect.origin), contentSize};

  [self _preserveContentOffsetIfNeededWithBlock:^{
    self->_scrollView.contentSize = contentSize;
  }];
}

- (UIView *)betterHitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  // This is the same algorithm as in the RCTViewComponentView with the exception of
  // skipping the immediate child (_containerView) and checking grandchildren instead.
  // This prevents issues with touches outside of _containerView being ignored even
  // if they are within the bounds of the _containerView's children.

  if (!self.userInteractionEnabled || self.hidden || self.alpha < 0.01) {
    return nil;
  }

  BOOL isPointInside = [self pointInside:point withEvent:event];

  BOOL clipsToBounds = _containerView.clipsToBounds;

  clipsToBounds = clipsToBounds || _layoutMetrics.overflowInset == EdgeInsets{};

  if (clipsToBounds && !isPointInside) {
    return nil;
  }

  for (UIView *subview in [_containerView.subviews reverseObjectEnumerator]) {
    UIView *hitView = [subview hitTest:[subview convertPoint:point fromView:self] withEvent:event];
    if (hitView) {
      return hitView;
    }
  }

  return isPointInside ? _scrollView : nil;
}

/*
 * Disables programmatical changing of ScrollView's `contentOffset` if a touch gesture is in progress.
 */
- (void)_preserveContentOffsetIfNeededWithBlock:(void (^)())block
{
  if (!block) {
    return;
  }

  if (!_isUserTriggeredScrolling) {
    return block();
  }

  [((RCTEnhancedScrollView *)_scrollView) preserveContentOffsetWithBlock:block];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_containerView insertSubview:childComponentView atIndex:index];
  if (![childComponentView conformsToProtocol:@protocol(RCTCustomPullToRefreshViewProtocol)]) {
    _contentView = childComponentView;
  }
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
  if (![childComponentView conformsToProtocol:@protocol(RCTCustomPullToRefreshViewProtocol)] &&
      _contentView == childComponentView) {
    _contentView = nil;
  }
}

/*
 * Returns whether or not the scroll view interaction should be blocked because
 * JavaScript was found to be the responder.
 */
- (BOOL)_shouldDisableScrollInteraction
{
  UIView *ancestorView = self.superview;

  while (ancestorView) {
    if ([ancestorView respondsToSelector:@selector(isJSResponder)]) {
      BOOL isJSResponder = ((UIView<RCTComponentViewProtocol> *)ancestorView).isJSResponder;
      if (isJSResponder) {
        return YES;
      }
    }

    ancestorView = ancestorView.superview;
  }

  return NO;
}

- (ScrollViewEventEmitter::Metrics)_scrollViewMetrics
{
  auto metrics = ScrollViewEventEmitter::Metrics{};
  metrics.contentSize = RCTSizeFromCGSize(_scrollView.contentSize);
  metrics.contentOffset = RCTPointFromCGPoint(_scrollView.contentOffset);
  metrics.contentInset = RCTEdgeInsetsFromUIEdgeInsets(_scrollView.contentInset);
  metrics.containerSize = RCTSizeFromCGSize(_scrollView.bounds.size);
  metrics.zoomScale = _scrollView.zoomScale;
  metrics.timestamp = CACurrentMediaTime();

  if (_layoutMetrics.layoutDirection == LayoutDirection::RightToLeft) {
    metrics.contentOffset.x = metrics.contentSize.width - metrics.containerSize.width - metrics.contentOffset.x;
  }

  return metrics;
}

- (ScrollViewEventEmitter::EndDragMetrics)_scrollViewMetricsWithVelocity:(CGPoint)velocity
                                                  andTargetContentOffset:(CGPoint)targetContentOffset
{
  ScrollViewEventEmitter::EndDragMetrics metrics = [self _scrollViewMetrics];
  metrics.targetContentOffset.x = targetContentOffset.x;
  metrics.targetContentOffset.y = targetContentOffset.y;
  metrics.velocity.x = velocity.x;
  metrics.velocity.y = velocity.y;
  return metrics;
}

/**
 * When use of accessibility APIs is detected, view culling is disabled to make accessibility work correctly.
 */
- (void)_disableViewCullingIfNecessary
{
  if (!_isAccessibilityAPIUsed) {
    _isAccessibilityAPIUsed = YES;
    [self _updateStateWithContentOffset];
  }
}

- (NSInteger)accessibilityElementCount
{
  // From empirical testing, method `accessibilityElementCount` is called lazily only
  // when accessibility is used.
  // Why we don't use UIAccessibilitySwitchControlStatusDidChangeNotification and
  // UIAccessibilityVoiceOverStatusDidChangeNotification? The notifications are not called when using Accessibility
  // Inspector. We anticipate developers will want to debug accessbility with Accessibility Inspector and don't want to
  // break that developer workflow with view culling. Therefore, we are using API use detection to disable view culling
  // instead of the notifications.
  [self _disableViewCullingIfNecessary];
  return [super accessibilityElementCount];
}

- (NSArray<id<UIFocusItem>> *)focusItemsInRect:(CGRect)rect
{
  // From empirical testing, method `focusItemsInRect:` is called lazily only
  // when keyboard navigation is used.
  [self _disableViewCullingIfNecessary];
  return [super focusItemsInRect:rect];
}

- (void)_updateStateWithContentOffset
{
  if (!_state) {
    return;
  }

  BOOL enableImmediateUpdateModeForContentOffsetChanges =
      ReactNativeFeatureFlags::enableImmediateUpdateModeForContentOffsetChanges();

  _avoidAdjustmentForMaintainVisibleContentPosition = enableImmediateUpdateModeForContentOffsetChanges;

  auto contentOffset = RCTPointFromCGPoint(_scrollView.contentOffset);
  BOOL isAccessibilityAPIUsed = _isAccessibilityAPIUsed;
  _state->updateState(
      [contentOffset, isAccessibilityAPIUsed](
          const ScrollViewShadowNode::ConcreteState::Data &oldData) -> ScrollViewShadowNode::ConcreteState::SharedData {
        if (oldData.contentOffset == contentOffset && oldData.disableViewCulling == isAccessibilityAPIUsed) {
          // avoid doing a state update if content offset and use of accessibility didn't change.
          return nullptr;
        }
        auto newData = oldData;
        newData.contentOffset = contentOffset;
        newData.disableViewCulling =
            UIAccessibilityIsVoiceOverRunning() || UIAccessibilityIsSwitchControlRunning() || isAccessibilityAPIUsed;
        return std::make_shared<const ScrollViewShadowNode::ConcreteState::Data>(newData);
      },
      enableImmediateUpdateModeForContentOffsetChanges ? EventQueue::UpdateMode::unstable_Immediate
                                                       : EventQueue::UpdateMode::Asynchronous);

  _avoidAdjustmentForMaintainVisibleContentPosition = NO;
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  // Must invalidate state before setting contentOffset on ScrollView.
  // Otherwise the state will be propagated to shadow tree.
  _state.reset();

  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  _scrollView.contentOffset = RCTCGPointFromPoint(props.contentOffset);
  // Reset zoom scale to default
  _scrollView.zoomScale = 1.0;
  // Invalidate cached content size so that updateState: recalculates the
  // container frame after zoomScale reset (which may have mutated it in RTL).
  _contentSize = CGSizeZero;
  _scrollView.contentInset = RCTUIEdgeInsetsFromEdgeInsets(props.contentInset);
  // We set the default behavior to "never" so that iOS
  // doesn't do weird things to UIScrollView insets automatically
  // and keeps it as an opt-in behavior.
  _scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
  _shouldUpdateContentInsetAdjustmentBehavior = YES;
  _isUserTriggeredScrolling = NO;
  CGRect oldFrame = self.frame;
  self.frame = CGRectZero;
  self.frame = oldFrame;
  _contentView = nil;
  _prevFirstVisibleFrame = CGRectZero;
  _firstVisibleView = nil;
  _firstVisibleViewTag = 0;
  _virtualViewContainerState = nil;
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView
                     withVelocity:(CGPoint)velocity
              targetContentOffset:(inout CGPoint *)targetContentOffset
{
  if (fabs(_endDraggingSensitivityMultiplier - 1) > 0.0001f) {
    if (targetContentOffset->y > 0) {
      const CGFloat travel = targetContentOffset->y - scrollView.contentOffset.y;
      targetContentOffset->y = scrollView.contentOffset.y + travel * _endDraggingSensitivityMultiplier;
    }
  }

  if (!_eventEmitter) {
    return;
  }

  auto metrics = [self _scrollViewMetricsWithVelocity:velocity andTargetContentOffset:*targetContentOffset];

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScrollEndDrag(metrics);
}

- (BOOL)touchesShouldCancelInContentView:(__unused UIView *)view
{
  // Historically, `UIScrollView`s in React Native do not cancel touches
  // started on `UIControl`-based views (as normal iOS `UIScrollView`s do).
  return ![self _shouldDisableScrollInteraction];
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  auto scrollMetrics = [self _scrollViewMetrics];

  [self _updateStateWithContentOffset];

  NSTimeInterval now = CACurrentMediaTime();
  if ((_lastScrollEventDispatchTime == 0) || (now - _lastScrollEventDispatchTime > _scrollEventThrottle)) {
    _lastScrollEventDispatchTime = now;
    if (_eventEmitter) {
      static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScroll(scrollMetrics);
    }

    RCTSendScrollEventForNativeAnimations_DEPRECATED(scrollView, self.tag, kOnScrollEvent);
  }

  [self _remountChildrenIfNeeded];
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView
{
  [self scrollViewDidScroll:scrollView];
}

- (BOOL)scrollViewShouldScrollToTop:(UIScrollView *)scrollView
{
  _isUserTriggeredScrolling = YES;
  return YES;
}

- (void)scrollViewDidScrollToTop:(UIScrollView *)scrollView
{
  if (!_eventEmitter) {
    return;
  }

  _isUserTriggeredScrolling = NO;
  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScrollToTop([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScrollBeginDrag([self _scrollViewMetrics]);
  _isUserTriggeredScrolling = YES;
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  [self _updateStateWithContentOffset];

  if (!decelerate) {
    // ScrollView will not decelerate and `scrollViewDidEndDecelerating` will not be called.
    // `_isUserTriggeredScrolling` must be set to NO here.
    _isUserTriggeredScrolling = NO;
    RCTSendScrollEventForNativeAnimations_DEPRECATED(scrollView, self.tag, kOnScrollEndEvent);
  }
}

- (void)scrollViewWillBeginDecelerating:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onMomentumScrollBegin([self _scrollViewMetrics]);
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onMomentumScrollEnd([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
  _isUserTriggeredScrolling = NO;

  RCTSendScrollEventForNativeAnimations_DEPRECATED(scrollView, self.tag, kOnScrollEndEvent);
}

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
{
  [self _handleFinishedScrolling:scrollView];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (!self.window) {
    // The view is being removed, ensure that the scroll end event is dispatched
    [self _handleScrollEndIfNeeded];
  }
}

- (void)_handleScrollEndIfNeeded
{
  if (_scrollView.isDecelerating || !_scrollView.isTracking) {
    if (!_eventEmitter) {
      return;
    }
    static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onMomentumScrollEnd([self _scrollViewMetrics]);

    [self _updateStateWithContentOffset];
    _isUserTriggeredScrolling = NO;
  }
}

- (void)_handleFinishedScrolling:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];
  [self scrollViewDidScroll:scrollView];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onMomentumScrollEnd([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (void)scrollViewWillBeginZooming:(UIScrollView *)scrollView withView:(nullable UIView *)view
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScrollBeginDrag([self _scrollViewMetrics]);
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(nullable UIView *)view atScale:(CGFloat)scale
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  auto metrics = [self _scrollViewMetricsWithVelocity:{} andTargetContentOffset:{}];
  static_cast<const ScrollViewEventEmitter &>(*_eventEmitter).onScrollEndDrag(metrics);

  [self _updateStateWithContentOffset];
}

- (UIView *)viewForZoomingInScrollView:(__unused UIScrollView *)scrollView
{
  return _containerView;
}

#pragma mark -

- (void)_forceDispatchNextScrollEvent
{
  _lastScrollEventDispatchTime = 0;
}

#pragma mark - Native commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTScrollViewHandleCommand(self, commandName, args);
}

- (void)flashScrollIndicators
{
  [_scrollView flashScrollIndicators];
}

- (void)scrollTo:(double)x y:(double)y animated:(BOOL)animated
{
  CGPoint offset = CGPointMake(x, y);
  CGRect maxRect = CGRectMake(
      fmin(-_scrollView.contentInset.left, 0),
      fmin(-_scrollView.contentInset.top, 0),
      fmax(
          _scrollView.contentSize.width - _scrollView.bounds.size.width + _scrollView.contentInset.right +
              fmax(_scrollView.contentInset.left, 0),
          0.01),
      fmax(
          _scrollView.contentSize.height - _scrollView.bounds.size.height + _scrollView.contentInset.bottom +
              fmax(_scrollView.contentInset.top, 0),
          0.01)); // Make width and height greater than 0

  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  if (!CGRectContainsPoint(maxRect, offset) && !props.scrollToOverflowEnabled) {
    CGFloat localX = fmax(offset.x, CGRectGetMinX(maxRect));
    localX = fmin(localX, CGRectGetMaxX(maxRect));
    CGFloat localY = fmax(offset.y, CGRectGetMinY(maxRect));
    localY = fmin(localY, CGRectGetMaxY(maxRect));
    offset = CGPointMake(localX, localY);
  }

  [self scrollToOffset:offset animated:animated];
}

- (void)scrollToEnd:(BOOL)animated
{
  BOOL isHorizontal = _scrollView.contentSize.width > self.frame.size.width;
  CGPoint offset;
  if (isHorizontal) {
    CGFloat offsetX = _scrollView.contentSize.width - _scrollView.bounds.size.width + _scrollView.contentInset.right;
    offset = CGPointMake(fmax(offsetX, 0), 0);
  } else {
    CGFloat offsetY = _scrollView.contentSize.height - _scrollView.bounds.size.height + _scrollView.contentInset.bottom;
    offset = CGPointMake(0, fmax(offsetY, 0));
  }

  [self scrollToOffset:offset animated:animated];
}

#pragma mark - Child views mounting

- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // Do nothing. ScrollView manages its subview clipping individually in `_remountChildren`.
}

- (void)_remountChildrenIfNeeded
{
  if (ReactNativeFeatureFlags::enableViewCulling()) {
    return;
  }

  CGPoint contentOffset = _scrollView.contentOffset;

  if (std::abs(_contentOffsetWhenClipped.x - contentOffset.x) < kClippingLeeway &&
      std::abs(_contentOffsetWhenClipped.y - contentOffset.y) < kClippingLeeway) {
    return;
  }

  _contentOffsetWhenClipped = contentOffset;

  [self _remountChildren];
}

- (void)_remountChildren
{
  if (ReactNativeFeatureFlags::enableViewCulling()) {
    return;
  }

  [_scrollView updateClippedSubviewsWithClipRect:CGRectInset(_scrollView.bounds, -kClippingLeeway, -kClippingLeeway)
                                  relativeToView:_scrollView];
}

#pragma mark - RCTScrollableProtocol

- (CGSize)contentSize
{
  return _contentSize;
}

- (void)scrollToOffset:(CGPoint)offset
{
  [self scrollToOffset:offset animated:YES];
}

- (void)scrollToOffset:(CGPoint)offset animated:(BOOL)animated
{
  if (_layoutMetrics.layoutDirection == LayoutDirection::RightToLeft) {
    // Adjusting offset.x in right to left layout direction.
    offset.x = self.contentSize.width - _scrollView.frame.size.width - offset.x;
  }

  if (CGPointEqualToPoint(_scrollView.contentOffset, offset)) {
    return;
  }

  [self _forceDispatchNextScrollEvent];

  [_scrollView setContentOffset:offset animated:animated];

  if (!animated) {
    // When not animated, the expected workflow in ``scrollViewDidEndScrollingAnimation`` after scrolling is not going
    // to get triggered. We will need to manually execute here.
    [self _handleFinishedScrolling:_scrollView];
  }
}

- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated
{
  [_scrollView zoomToRect:rect animated:animated];
}

- (void)addScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener
{
  [self.scrollViewDelegateSplitter addDelegate:scrollListener];
}

- (void)removeScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener
{
  [self.scrollViewDelegateSplitter removeDelegate:scrollListener];
}

#pragma mark - Maintain visible content position

- (void)_prepareForMaintainVisibleScrollPosition
{
  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  if (!props.maintainVisibleContentPosition || _avoidAdjustmentForMaintainVisibleContentPosition) {
    return;
  }

  BOOL horizontal = _scrollView.contentSize.width > self.frame.size.width;
  int minIdx = props.maintainVisibleContentPosition.value().minIndexForVisible;
  for (NSUInteger ii = minIdx; ii < _contentView.subviews.count; ++ii) {
    // Find the first view that is partially or fully visible.
    UIView *subview = _contentView.subviews[ii];
    BOOL hasNewView = NO;
    if (horizontal) {
      hasNewView = subview.frame.origin.x + subview.frame.size.width > _scrollView.contentOffset.x;
    } else {
      hasNewView = subview.frame.origin.y + subview.frame.size.height > _scrollView.contentOffset.y;
    }
    if (hasNewView || ii == _contentView.subviews.count - 1) {
      _prevFirstVisibleFrame = subview.frame;
      _firstVisibleView = subview;
      _firstVisibleViewTag = subview.tag;
      break;
    }
  }
}

- (void)_adjustForMaintainVisibleContentPosition
{
  const auto &props = static_cast<const ScrollViewProps &>(*_props);
  if (!props.maintainVisibleContentPosition || _avoidAdjustmentForMaintainVisibleContentPosition) {
    return;
  }

  if (ReactNativeFeatureFlags::enableViewCulling()) {
    // Abort if the first visible view has changed (different tag)
    if (_firstVisibleView && _firstVisibleView.tag != _firstVisibleViewTag) {
      return;
    }
  }

  std::optional<int> autoscrollThreshold = props.maintainVisibleContentPosition.value().autoscrollToTopThreshold;
  BOOL horizontal = _scrollView.contentSize.width > self.frame.size.width;
  // TODO: detect and handle/ignore re-ordering
  if (horizontal) {
    CGFloat deltaX = _firstVisibleView.frame.origin.x - _prevFirstVisibleFrame.origin.x;
    if (ABS(deltaX) > 0.5) {
      CGFloat x = _scrollView.contentOffset.x;
      [self _forceDispatchNextScrollEvent];
      _scrollView.contentOffset = CGPointMake(_scrollView.contentOffset.x + deltaX, _scrollView.contentOffset.y);
      if (autoscrollThreshold) {
        // If the offset WAS within the threshold of the start, animate to the start.
        if (x <= autoscrollThreshold.value()) {
          [self scrollToOffset:CGPointMake(0, _scrollView.contentOffset.y) animated:YES];
        }
      }
    }
  } else {
    CGRect newFrame = _firstVisibleView.frame;
    CGFloat deltaY = newFrame.origin.y - _prevFirstVisibleFrame.origin.y;
    if (ABS(deltaY) > 0.5) {
      CGFloat y = _scrollView.contentOffset.y;
      [self _forceDispatchNextScrollEvent];
      _scrollView.contentOffset = CGPointMake(_scrollView.contentOffset.x, _scrollView.contentOffset.y + deltaY);
      if (autoscrollThreshold) {
        // If the offset WAS within the threshold of the start, animate to the start.
        if (y <= autoscrollThreshold.value()) {
          [self scrollToOffset:CGPointMake(_scrollView.contentOffset.x, 0) animated:YES];
        }
      }
    }
  }
}

#pragma mark - RCTVirtualViewContainerProtocol

- (RCTVirtualViewContainerState *)virtualViewContainerState
{
  if (!_virtualViewContainerState) {
    _virtualViewContainerState = [[RCTVirtualViewContainerState alloc] initWithScrollView:self];
  }
  return _virtualViewContainerState;
}

@end

Class<RCTComponentViewProtocol> RCTScrollViewCls(void)
{
  return RCTScrollViewComponentView.class;
}
