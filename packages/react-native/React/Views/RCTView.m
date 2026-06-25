/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTView.h"

#import <QuartzCore/QuartzCore.h>
#import <React/RCTMockDef.h>

#import "RCTAutoInsetsProtocol.h"
#import "RCTBorderCurve.h"
#import "RCTBorderDrawing.h"
#import "RCTI18nUtil.h"
#import "RCTLocalizedString.h"
#import "RCTLog.h"
#import "RCTViewUtils.h"
#import "UIView+React.h"

RCT_MOCK_DEF(RCTView, RCTContentInsets);
#define RCTContentInsets RCT_MOCK_USE(RCTView, RCTContentInsets)

const UIAccessibilityTraits SwitchAccessibilityTrait = 0x20000000000001;

@implementation UIView (RCTViewUnmounting)

- (void)react_remountAllSubviews
{
  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (UIView *subview in self.subviews) {
    [subview react_remountAllSubviews];
  }
}

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // Even though we don't support subview unmounting
  // we do support clipsToBounds, so if that's enabled
  // we'll update the clipping

  if (self.clipsToBounds && self.subviews.count > 0) {
    clipRect = [clipView convertRect:clipRect toView:self];
    clipRect = CGRectIntersection(clipRect, self.bounds);
    clipView = self;
  }

  // Normal views don't support unmounting, so all
  // this does is forward message to our subviews,
  // in case any of those do support it

  for (UIView *subview in self.subviews) {
    [subview react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }
}

- (UIView *)react_findClipView
{
  UIView *testView = self;
  UIView *clipView = nil;
  CGRect clipRect = self.bounds;
  // We will only look for a clipping view up the view hierarchy until we hit the root view.
  while (testView) {
    if (testView.clipsToBounds) {
      if (clipView) {
        CGRect testRect = [clipView convertRect:clipRect toView:testView];
        if (!CGRectContainsRect(testView.bounds, testRect)) {
          clipView = testView;
          clipRect = CGRectIntersection(testView.bounds, testRect);
        }
      } else {
        clipView = testView;
        clipRect = [self convertRect:self.bounds toView:clipView];
      }
    }
    if ([testView isReactRootView]) {
      break;
    }
    testView = testView.superview;
  }
  return clipView ?: self.window;
}

@end

static NSString *RCTRecursiveAccessibilityLabel(UIView *view)
{
  // Result string is initialized lazily to prevent useless but costly allocations.
  NSMutableString *str = nil;
  for (UIView *subview in view.subviews) {
    // Skip subviews that have accessibilityElementsHidden set to YES
    if (subview.accessibilityElementsHidden) {
      continue;
    }
    NSString *label = subview.accessibilityLabel;
    if (!label) {
      label = RCTRecursiveAccessibilityLabel(subview);
    }
    if (label && label.length > 0) {
      if (str == nil) {
        str = [NSMutableString string];
      }
      if (str.length > 0) {
        [str appendString:@" "];
      }
      [str appendString:label];
    }
  }
  return str;
}

@implementation RCTView {
  UIColor *_backgroundColor;
  NSMutableDictionary<NSString *, NSDictionary *> *accessibilityActionsNameMap;
  NSMutableDictionary<NSString *, NSDictionary *> *accessibilityActionsLabelMap;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _borderWidth = -1;
    _borderTopWidth = -1;
    _borderRightWidth = -1;
    _borderBottomWidth = -1;
    _borderLeftWidth = -1;
    _borderStartWidth = -1;
    _borderEndWidth = -1;
    _borderTopLeftRadius = -1;
    _borderTopRightRadius = -1;
    _borderTopStartRadius = -1;
    _borderTopEndRadius = -1;
    _borderBottomLeftRadius = -1;
    _borderBottomRightRadius = -1;
    _borderBottomStartRadius = -1;
    _borderBottomEndRadius = -1;
    _borderEndEndRadius = -1;
    _borderEndStartRadius = -1;
    _borderStartEndRadius = -1;
    _borderStartStartRadius = -1;
    _borderCurve = RCTBorderCurveCircular;
    _borderStyle = RCTBorderStyleSolid;
    _hitTestEdgeInsets = UIEdgeInsetsZero;
    _cursor = RCTCursorAuto;

    _backgroundColor = super.backgroundColor;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : unused)

- (void)setReactLayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  if (_reactLayoutDirection != layoutDirection) {
    _reactLayoutDirection = layoutDirection;
    [self.layer setNeedsDisplay];
  }

  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
    self.semanticContentAttribute = layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight
        ? UISemanticContentAttributeForceLeftToRight
        : UISemanticContentAttributeForceRightToLeft;
  }
}

#pragma mark - Hit Testing

- (void)setPointerEvents:(RCTPointerEvents)pointerEvents
{
  _pointerEvents = pointerEvents;
  self.userInteractionEnabled = (pointerEvents != RCTPointerEventsNone);
  if (pointerEvents == RCTPointerEventsBoxNone) {
    self.accessibilityViewIsModal = NO;
  }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  BOOL canReceiveTouchEvents = ([self isUserInteractionEnabled] && ![self isHidden]);
  if (!canReceiveTouchEvents) {
    return nil;
  }

  // `hitSubview` is the topmost subview which was hit. The hit point can
  // be outside the bounds of `view` (e.g., if -clipsToBounds is NO).
  UIView *hitSubview = nil;
  BOOL isPointInside = [self pointInside:point withEvent:event];
  BOOL needsHitSubview = !(_pointerEvents == RCTPointerEventsNone || _pointerEvents == RCTPointerEventsBoxOnly);
  if (needsHitSubview && (![self clipsToBounds] || isPointInside)) {
    // Take z-index into account when calculating the touch target.
    NSArray<UIView *> *sortedSubviews = [self reactZIndexSortedSubviews];

    // The default behaviour of UIKit is that if a view does not contain a point,
    // then no subviews will be returned from hit testing, even if they contain
    // the hit point. By doing hit testing directly on the subviews, we bypass
    // the strict containment policy (i.e., UIKit guarantees that every ancestor
    // of the hit view will return YES from -pointInside:withEvent:). See:
    //  - https://developer.apple.com/library/ios/qa/qa2013/qa1812.html
    for (UIView *subview in [sortedSubviews reverseObjectEnumerator]) {
      CGPoint convertedPoint = [subview convertPoint:point fromView:self];
      hitSubview = [subview hitTest:convertedPoint withEvent:event];
      if (hitSubview != nil) {
        break;
      }
    }
  }

  UIView *hitView = (isPointInside ? self : nil);

  switch (_pointerEvents) {
    case RCTPointerEventsNone:
      return nil;
    case RCTPointerEventsUnspecified:
      return hitSubview ?: hitView;
    case RCTPointerEventsBoxOnly:
      return hitView;
    case RCTPointerEventsBoxNone:
      return hitSubview;
    default:
      RCTLogInfo(@"Invalid pointer-events specified %lld on %@", (long long)_pointerEvents, self);
      return hitSubview ?: hitView;
  }
}

- (BOOL)pointInside:(CGPoint)point withEvent:(UIEvent *)event
{
  if (UIEdgeInsetsEqualToEdgeInsets(self.hitTestEdgeInsets, UIEdgeInsetsZero)) {
    return [super pointInside:point withEvent:event];
  }
  CGRect hitFrame = UIEdgeInsetsInsetRect(self.bounds, self.hitTestEdgeInsets);
  return CGRectContainsPoint(hitFrame, point);
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *label = super.accessibilityLabel;
  if (label) {
    return label;
  }
  if (self.isAccessibilityElement) {
    return RCTRecursiveAccessibilityLabel(self);
  }
  return nil;
}

- (NSArray<UIAccessibilityCustomAction *> *)accessibilityCustomActions
{
  if (!self.accessibilityActions.count) {
    return nil;
  }

  accessibilityActionsNameMap = [NSMutableDictionary new];
  accessibilityActionsLabelMap = [NSMutableDictionary new];
  NSMutableArray *actions = [NSMutableArray array];
  for (NSDictionary *action in self.accessibilityActions) {
    if (action[@"name"]) {
      accessibilityActionsNameMap[action[@"name"]] = action;
    }
    if (action[@"label"]) {
      accessibilityActionsLabelMap[action[@"label"]] = action;
      [actions addObject:[[UIAccessibilityCustomAction alloc]
                             initWithName:action[@"label"]
                                   target:self
                                 selector:@selector(didActivateAccessibilityCustomAction:)]];
    }
  }

  return [actions copy];
}

- (BOOL)didActivateAccessibilityCustomAction:(UIAccessibilityCustomAction *)action
{
  if (!_onAccessibilityAction || !accessibilityActionsLabelMap) {
    return NO;
  }
  // iOS defines the name as the localized label, so use our map to convert this back to the non-localized action name
  // when passing to JS. This allows for standard action names across platforms.
  NSDictionary *actionObject = accessibilityActionsLabelMap[action.name];
  if (actionObject) {
    _onAccessibilityAction(@{@"actionName" : actionObject[@"name"], @"actionTarget" : self.reactTag});
  }
  return YES;
}

- (NSString *)accessibilityValue
{
  static dispatch_once_t onceToken;
  static NSDictionary<NSString *, NSString *> *rolesAndStatesDescription = nil;

  dispatch_once(&onceToken, ^{
    rolesAndStatesDescription = @{
      @"alert" : RCTLocalizedString("alert", "important, and usually time-sensitive, information"),
      @"busy" : RCTLocalizedString("busy", "an element currently being updated or modified"),
      @"checkbox" : RCTLocalizedString("checkbox", "checkable interactive control"),
      @"combobox" : RCTLocalizedString(
          "combo box",
          "input that controls another element that can pop up to help the user set the value of that input"),
      @"menu" : RCTLocalizedString("menu", "offers a list of choices to the user"),
      @"menubar" : RCTLocalizedString(
          "menu bar", "presentation of menu that usually remains visible and is usually presented horizontally"),
      @"menuitem" : RCTLocalizedString("menu item", "an option in a set of choices contained by a menu or menubar"),
      @"progressbar" :
          RCTLocalizedString("progress bar", "displays the progress status for tasks that take a long time"),
      @"radio" : RCTLocalizedString(
          "radio button",
          "a checkable input that when associated with other radio buttons, only one of which can be checked at a time"),
      @"radiogroup" : RCTLocalizedString("radio group", "a group of radio buttons"),
      @"scrollbar" : RCTLocalizedString("scroll bar", "controls the scrolling of content within a viewing area"),
      @"spinbutton" : RCTLocalizedString(
          "spin button", "defines a type of range that expects the user to select a value from among discrete choices"),
      @"switch" : RCTLocalizedString("switch", "represents the states 'on' and 'off'"),
      @"tab" : RCTLocalizedString("tab", "an interactive element inside a tablist"),
      @"tablist" : RCTLocalizedString("tab list", "container for a set of tabs"),
      @"timer" : RCTLocalizedString(
          "timer",
          "a numerical counter listing the amount of elapsed time from a starting point or the remaining time until an end point"),
      @"toolbar" : RCTLocalizedString(
          "tool bar",
          "a collection of commonly used function buttons or controls represented in a compact visual form"),
      @"checked" : RCTLocalizedString("checked", "a checkbox, radio button, or other widget which is checked"),
      @"unchecked" : RCTLocalizedString("unchecked", "a checkbox, radio button, or other widget which is unchecked"),
      @"expanded" :
          RCTLocalizedString("expanded", "a menu, dialog, accordian panel, or other widget which is expanded"),
      @"collapsed" :
          RCTLocalizedString("collapsed", "a menu, dialog, accordian panel, or other widget which is collapsed"),
      @"mixed" :
          RCTLocalizedString("mixed", "a checkbox, radio button, or other widget which is both checked and unchecked"),
    };
  });

  // Handle Switch.
  if ((self.accessibilityTraits & SwitchAccessibilityTrait) == SwitchAccessibilityTrait) {
    for (NSString *state in self.accessibilityState) {
      id val = self.accessibilityState[state];
      if (!val) {
        continue;
      }
      if ([state isEqualToString:@"checked"] && [val isKindOfClass:[NSNumber class]]) {
        return [val boolValue] ? @"1" : @"0";
      }
    }
  }
  NSMutableArray *valueComponents = [NSMutableArray new];

  // TODO: This logic makes VoiceOver describe some AccessibilityRole which do not have a backing UIAccessibilityTrait.
  // It does not run on Fabric.
  NSString *role = self.role ?: self.accessibilityRole;
  NSString *roleDescription = role ? rolesAndStatesDescription[role] : nil;
  if (roleDescription) {
    [valueComponents addObject:roleDescription];
  }

  // Handle states which haven't already been handled in RCTViewManager.
  for (NSString *state in self.accessibilityState) {
    id val = self.accessibilityState[state];
    if (!val) {
      continue;
    }
    if ([state isEqualToString:@"checked"]) {
      if ([val isKindOfClass:[NSNumber class]]) {
        [valueComponents addObject:rolesAndStatesDescription[[val boolValue] ? @"checked" : @"unchecked"]];
      } else if ([val isKindOfClass:[NSString class]] && [val isEqualToString:@"mixed"]) {
        [valueComponents addObject:rolesAndStatesDescription[@"mixed"]];
      }
    }
    if ([state isEqualToString:@"expanded"] && [val isKindOfClass:[NSNumber class]]) {
      [valueComponents addObject:rolesAndStatesDescription[[val boolValue] ? @"expanded" : @"collapsed"]];
    }
    if ([state isEqualToString:@"busy"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      [valueComponents addObject:rolesAndStatesDescription[@"busy"]];
    }
  }

  // Handle accessibilityValue.
  if (self.accessibilityValueInternal) {
    id min = self.accessibilityValueInternal[@"min"];
    id now = self.accessibilityValueInternal[@"now"];
    id max = self.accessibilityValueInternal[@"max"];
    id text = self.accessibilityValueInternal[@"text"];
    if (text && [text isKindOfClass:[NSString class]]) {
      [valueComponents addObject:text];
    } else if (
        [min isKindOfClass:[NSNumber class]] && [now isKindOfClass:[NSNumber class]] &&
        [max isKindOfClass:[NSNumber class]] && ([min intValue] < [max intValue]) &&
        ([min intValue] <= [now intValue] && [now intValue] <= [max intValue])) {
      int val = ([now intValue] * 100) / ([max intValue] - [min intValue]);
      [valueComponents addObject:[NSString stringWithFormat:@"%d percent", val]];
    }
  }

  if (valueComponents.count > 0) {
    return [valueComponents componentsJoinedByString:@", "];
  }
  return nil;
}

- (UIView *)reactAccessibilityElement
{
  return self;
}

- (BOOL)isAccessibilityElement
{
  if (self.reactAccessibilityElement == self) {
    return [super isAccessibilityElement];
  }

  return NO;
}

- (BOOL)performAccessibilityAction:(NSString *)name
{
  if (_onAccessibilityAction && accessibilityActionsNameMap[name]) {
    _onAccessibilityAction(@{@"actionName" : name, @"actionTarget" : self.reactTag});
    return YES;
  }
  return NO;
}

- (BOOL)accessibilityActivate
{
  if ([self performAccessibilityAction:@"activate"]) {
    return YES;
  } else if (_onAccessibilityTap) {
    _onAccessibilityTap(nil);
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformMagicTap
{
  if ([self performAccessibilityAction:@"magicTap"]) {
    return YES;
  } else if (_onMagicTap) {
    _onMagicTap(nil);
    return YES;
  } else {
    return NO;
  }
}

- (BOOL)accessibilityPerformEscape
{
  if ([self performAccessibilityAction:@"escape"]) {
    return YES;
  } else if (_onAccessibilityEscape) {
    _onAccessibilityEscape(nil);
    return YES;
  } else {
    return NO;
  }
}

- (void)accessibilityIncrement
{
  [self performAccessibilityAction:@"increment"];
}

- (void)accessibilityDecrement
{
  [self performAccessibilityAction:@"decrement"];
}

- (NSString *)description
{
  return [[super description] stringByAppendingFormat:@" reactTag: %@; frame = %@; layer = %@",
                                                      self.reactTag,
                                                      NSStringFromCGRect(self.frame),
                                                      self.layer];
}

#pragma mark - Statics for dealing with layoutGuides

+ (void)autoAdjustInsetsForView:(UIView<RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset
{
  UIEdgeInsets baseInset = parentView.contentInset;
  CGFloat previousInsetTop = scrollView.contentInset.top;
  CGPoint contentOffset = scrollView.contentOffset;

  if (parentView.automaticallyAdjustContentInsets) {
    UIEdgeInsets autoInset = RCTContentInsets(parentView);
    baseInset.top += autoInset.top;
    baseInset.bottom += autoInset.bottom;
    baseInset.left += autoInset.left;
    baseInset.right += autoInset.right;
  }
  scrollView.contentInset = baseInset;
  scrollView.scrollIndicatorInsets = baseInset;

  if (updateOffset) {
    // If we're adjusting the top inset, then let's also adjust the contentOffset so that the view
    // elements above the top guide do not cover the content.
    // This is generally only needed when your views are initially laid out, for
    // manual changes to contentOffset, you can optionally disable this step
    CGFloat currentInsetTop = scrollView.contentInset.top;
    if (currentInsetTop != previousInsetTop) {
      contentOffset.y -= (currentInsetTop - previousInsetTop);
      scrollView.contentOffset = contentOffset;
    }
  }
}

#pragma mark - View Unmounting

- (void)react_remountAllSubviews
{
  if (_removeClippedSubviews) {
    for (UIView *view in self.reactSubviews) {
      if (view.superview != self) {
        [self addSubview:view];
        [view react_remountAllSubviews];
      }
    }
  } else {
    // If _removeClippedSubviews is false, we must already be showing all subviews
    [super react_remountAllSubviews];
  }
}

- (void)react_updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // TODO (#5906496): for scrollviews (the primary use-case) we could
  // optimize this by only doing a range check along the scroll axis,
  // instead of comparing the whole frame

  if (!_removeClippedSubviews) {
    // Use default behavior if unmounting is disabled
    return [super react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
  }

  if (self.reactSubviews.count == 0) {
    // Do nothing if we have no subviews
    return;
  }

  if (CGSizeEqualToSize(self.bounds.size, CGSizeZero)) {
    // Do nothing if layout hasn't happened yet
    return;
  }

  // Convert clipping rect to local coordinates
  clipRect = [clipView convertRect:clipRect toView:self];
  clipRect = CGRectIntersection(clipRect, self.bounds);
  clipView = self;

  // Mount / unmount views
  for (UIView *view in self.reactSubviews) {
    if (!CGSizeEqualToSize(CGRectIntersection(clipRect, view.frame).size, CGSizeZero)) {
      // View is at least partially visible, so remount it if unmounted
      [self addSubview:view];

      // Then test its subviews
      if (CGRectContainsRect(clipRect, view.frame)) {
        // View is fully visible, so remount all subviews
        [view react_remountAllSubviews];
      } else {
        // View is partially visible, so update clipped subviews
        [view react_updateClippedSubviewsWithClipRect:clipRect relativeToView:clipView];
      }

    } else if (view.superview) {
      // View is completely outside the clipRect, so unmount it
      [view removeFromSuperview];
    }
  }
}

- (void)setRemoveClippedSubviews:(BOOL)removeClippedSubviews
{
  if (!removeClippedSubviews && _removeClippedSubviews) {
    [self react_remountAllSubviews];
  }
  _removeClippedSubviews = removeClippedSubviews;
}

- (void)didUpdateReactSubviews
{
  if (_removeClippedSubviews) {
    [self updateClippedSubviews];
  } else {
    [super didUpdateReactSubviews];
  }
}

- (void)updateClippedSubviews
{
  // Find a suitable view to use for clipping
  UIView *clipView = [self react_findClipView];
  if (clipView) {
    [self react_updateClippedSubviewsWithClipRect:clipView.bounds relativeToView:clipView];
  }
}

- (void)layoutSubviews
{
  // TODO (#5906496): this a nasty performance drain, but necessary
  // to prevent gaps appearing when the loading spinner disappears.
  // We might be able to fix this another way by triggering a call
  // to updateClippedSubviews manually after loading

  [super layoutSubviews];

  if (_removeClippedSubviews) {
    [self updateClippedSubviews];
  }
}

- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];

  if ([self.traitCollection hasDifferentColorAppearanceComparedToTraitCollection:previousTraitCollection]) {
    [self.layer setNeedsDisplay];
  }
}

#pragma mark - Borders

- (UIColor *)backgroundColor
{
  return _backgroundColor;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  if ([_backgroundColor isEqual:backgroundColor]) {
    return;
  }

  _backgroundColor = backgroundColor;
  [self.layer setNeedsDisplay];
}

static CGFloat RCTDefaultIfNegativeTo(CGFloat defaultValue, CGFloat x)
{
  return x >= 0 ? x : defaultValue;
};

- (UIEdgeInsets)bordersAsInsets
{
  const CGFloat borderWidth = MAX(0, _borderWidth);
  const BOOL isRTL = _reactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat borderStartWidth = RCTDefaultIfNegativeTo(_borderLeftWidth, _borderStartWidth);
    const CGFloat borderEndWidth = RCTDefaultIfNegativeTo(_borderRightWidth, _borderEndWidth);

    const CGFloat directionAwareBorderLeftWidth = isRTL ? borderEndWidth : borderStartWidth;
    const CGFloat directionAwareBorderRightWidth = isRTL ? borderStartWidth : borderEndWidth;

    return (UIEdgeInsets){
        RCTDefaultIfNegativeTo(borderWidth, _borderTopWidth),
        RCTDefaultIfNegativeTo(borderWidth, directionAwareBorderLeftWidth),
        RCTDefaultIfNegativeTo(borderWidth, _borderBottomWidth),
        RCTDefaultIfNegativeTo(borderWidth, directionAwareBorderRightWidth),
    };
  }

  const CGFloat directionAwareBorderLeftWidth = isRTL ? _borderEndWidth : _borderStartWidth;
  const CGFloat directionAwareBorderRightWidth = isRTL ? _borderStartWidth : _borderEndWidth;

  return (UIEdgeInsets){
      RCTDefaultIfNegativeTo(borderWidth, _borderTopWidth),
      RCTDefaultIfNegativeTo(borderWidth, RCTDefaultIfNegativeTo(_borderLeftWidth, directionAwareBorderLeftWidth)),
      RCTDefaultIfNegativeTo(borderWidth, _borderBottomWidth),
      RCTDefaultIfNegativeTo(borderWidth, RCTDefaultIfNegativeTo(_borderRightWidth, directionAwareBorderRightWidth)),
  };
}

- (RCTCornerRadii)cornerRadii
{
  const BOOL isRTL = _reactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;
  const CGFloat radius = MAX(0, _borderRadius);

  CGFloat topLeftRadius;
  CGFloat topRightRadius;
  CGFloat bottomLeftRadius;
  CGFloat bottomRightRadius;

  const CGFloat logicalTopStartRadius = RCTDefaultIfNegativeTo(_borderStartStartRadius, _borderTopStartRadius);
  const CGFloat logicalTopEndRadius = RCTDefaultIfNegativeTo(_borderStartEndRadius, _borderTopEndRadius);
  const CGFloat logicalBottomStartRadius = RCTDefaultIfNegativeTo(_borderEndStartRadius, _borderBottomStartRadius);
  const CGFloat logicalBottomEndRadius = RCTDefaultIfNegativeTo(_borderEndEndRadius, _borderBottomEndRadius);

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    const CGFloat topStartRadius = RCTDefaultIfNegativeTo(_borderTopLeftRadius, logicalTopStartRadius);
    const CGFloat topEndRadius = RCTDefaultIfNegativeTo(_borderTopRightRadius, logicalTopEndRadius);
    const CGFloat bottomStartRadius = RCTDefaultIfNegativeTo(_borderBottomLeftRadius, logicalBottomStartRadius);
    const CGFloat bottomEndRadius = RCTDefaultIfNegativeTo(_borderBottomRightRadius, logicalBottomEndRadius);

    const CGFloat directionAwareTopLeftRadius = isRTL ? topEndRadius : topStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? topStartRadius : topEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? bottomEndRadius : bottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? bottomStartRadius : bottomEndRadius;

    topLeftRadius = RCTDefaultIfNegativeTo(radius, directionAwareTopLeftRadius);
    topRightRadius = RCTDefaultIfNegativeTo(radius, directionAwareTopRightRadius);
    bottomLeftRadius = RCTDefaultIfNegativeTo(radius, directionAwareBottomLeftRadius);
    bottomRightRadius = RCTDefaultIfNegativeTo(radius, directionAwareBottomRightRadius);
  } else {
    const CGFloat directionAwareTopLeftRadius = isRTL ? logicalTopEndRadius : logicalTopStartRadius;
    const CGFloat directionAwareTopRightRadius = isRTL ? logicalTopStartRadius : logicalTopEndRadius;
    const CGFloat directionAwareBottomLeftRadius = isRTL ? logicalBottomEndRadius : logicalBottomStartRadius;
    const CGFloat directionAwareBottomRightRadius = isRTL ? logicalBottomStartRadius : logicalBottomEndRadius;

    topLeftRadius =
        RCTDefaultIfNegativeTo(radius, RCTDefaultIfNegativeTo(_borderTopLeftRadius, directionAwareTopLeftRadius));
    topRightRadius =
        RCTDefaultIfNegativeTo(radius, RCTDefaultIfNegativeTo(_borderTopRightRadius, directionAwareTopRightRadius));
    bottomLeftRadius =
        RCTDefaultIfNegativeTo(radius, RCTDefaultIfNegativeTo(_borderBottomLeftRadius, directionAwareBottomLeftRadius));
    bottomRightRadius = RCTDefaultIfNegativeTo(
        radius, RCTDefaultIfNegativeTo(_borderBottomRightRadius, directionAwareBottomRightRadius));
  }

  // Get scale factors required to prevent radii from overlapping
  const CGSize size = self.bounds.size;
  const CGFloat topScaleFactor = RCTZeroIfNaN(MIN(1, size.width / (topLeftRadius + topRightRadius)));
  const CGFloat bottomScaleFactor = RCTZeroIfNaN(MIN(1, size.width / (bottomLeftRadius + bottomRightRadius)));
  const CGFloat rightScaleFactor = RCTZeroIfNaN(MIN(1, size.height / (topRightRadius + bottomRightRadius)));
  const CGFloat leftScaleFactor = RCTZeroIfNaN(MIN(1, size.height / (topLeftRadius + bottomLeftRadius)));

  // Return scaled radii
  return (RCTCornerRadii){
      topLeftRadius * MIN(topScaleFactor, leftScaleFactor),
      topLeftRadius * MIN(topScaleFactor, leftScaleFactor),
      topRightRadius * MIN(topScaleFactor, rightScaleFactor),
      topRightRadius * MIN(topScaleFactor, rightScaleFactor),
      bottomLeftRadius * MIN(bottomScaleFactor, leftScaleFactor),
      bottomLeftRadius * MIN(bottomScaleFactor, leftScaleFactor),
      bottomRightRadius * MIN(bottomScaleFactor, rightScaleFactor),
      bottomRightRadius * MIN(bottomScaleFactor, rightScaleFactor),
  };
}

- (RCTBorderColors)borderColorsWithTraitCollection:(UITraitCollection *)traitCollection
{
  const BOOL isRTL = _reactLayoutDirection == UIUserInterfaceLayoutDirectionRightToLeft;

  UIColor *directionAwareBorderLeftColor = nil;
  UIColor *directionAwareBorderRightColor = nil;

  if ([[RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL]) {
    UIColor *borderStartColor = _borderStartColor ?: _borderLeftColor;
    UIColor *borderEndColor = _borderEndColor ?: _borderRightColor;

    directionAwareBorderLeftColor = isRTL ? borderEndColor : borderStartColor;
    directionAwareBorderRightColor = isRTL ? borderStartColor : borderEndColor;
  } else {
    directionAwareBorderLeftColor = (isRTL ? _borderEndColor : _borderStartColor) ?: _borderLeftColor;
    directionAwareBorderRightColor = (isRTL ? _borderStartColor : _borderEndColor) ?: _borderRightColor;
  }

  UIColor *borderColor = _borderColor;
  UIColor *borderTopColor = _borderTopColor;
  UIColor *borderBottomColor = _borderBottomColor;

  if (_borderBlockColor) {
    borderTopColor = _borderBlockColor;
    borderBottomColor = _borderBlockColor;
  }
  if (_borderBlockEndColor) {
    borderBottomColor = _borderBlockEndColor;
  }
  if (_borderBlockStartColor) {
    borderTopColor = _borderBlockStartColor;
  }

  borderColor = [borderColor resolvedColorWithTraitCollection:self.traitCollection];
  borderTopColor = [borderTopColor resolvedColorWithTraitCollection:self.traitCollection];
  directionAwareBorderLeftColor = [directionAwareBorderLeftColor resolvedColorWithTraitCollection:self.traitCollection];
  borderBottomColor = [borderBottomColor resolvedColorWithTraitCollection:self.traitCollection];
  directionAwareBorderRightColor =
      [directionAwareBorderRightColor resolvedColorWithTraitCollection:self.traitCollection];

  return (RCTBorderColors){
      (borderTopColor ?: borderColor),
      (directionAwareBorderLeftColor ?: borderColor),
      (borderBottomColor ?: borderColor),
      (directionAwareBorderRightColor ?: borderColor),
  };
}

- (void)reactSetFrame:(CGRect)frame
{
  // If frame is zero, or below the threshold where the border radii can
  // be rendered as a stretchable image, we'll need to re-render.
  // TODO: detect up-front if re-rendering is necessary
  CGSize oldSize = self.bounds.size;
  [super reactSetFrame:frame];
  if (!CGSizeEqualToSize(self.bounds.size, oldSize)) {
    [self.layer setNeedsDisplay];
  }
}

- (void)displayLayer:(CALayer *)layer
{
  if (CGSizeEqualToSize(layer.bounds.size, CGSizeZero)) {
    return;
  }

  RCTUpdateShadowPathForView(self);

  RCTUpdateHoverStyleForView(self);

  const RCTCornerRadii cornerRadii = [self cornerRadii];
  const UIEdgeInsets borderInsets = [self bordersAsInsets];
  const RCTBorderColors borderColors = [self borderColorsWithTraitCollection:self.traitCollection];

  BOOL useIOSBorderRendering = RCTCornerRadiiAreEqualAndSymmetrical(cornerRadii) &&
      RCTBorderInsetsAreEqual(borderInsets) && RCTBorderColorsAreEqual(borderColors) &&

      // iOS draws borders in front of the content whereas CSS draws them behind
      // the content. For this reason, only use iOS border drawing when clipping
      // or when the border is hidden.

      (borderInsets.top == 0 || (borderColors.top && CGColorGetAlpha(borderColors.top.CGColor) == 0) ||
       self.clipsToBounds);

  // iOS clips to the outside of the border, but CSS clips to the inside. To
  // solve this, we'll need to add a container view inside the main view to
  // correctly clip the subviews.

  UIColor *backgroundColor = [_backgroundColor resolvedColorWithTraitCollection:self.traitCollection];

  if (useIOSBorderRendering) {
    layer.cornerRadius = cornerRadii.topLeftHorizontal;
    layer.borderColor = borderColors.left.CGColor;
    layer.borderWidth = borderInsets.left;
    layer.backgroundColor = backgroundColor.CGColor;
    layer.contents = nil;
    layer.needsDisplayOnBoundsChange = NO;
    layer.mask = nil;
    return;
  }

  UIImage *image = RCTGetBorderImage(
      _borderStyle, layer.bounds.size, cornerRadii, borderInsets, borderColors, backgroundColor, self.clipsToBounds);

  layer.backgroundColor = NULL;

  if (image == nil) {
    layer.contents = nil;
    layer.needsDisplayOnBoundsChange = NO;
    return;
  }

  CGRect contentsCenter = ({
    CGSize size = image.size;
    UIEdgeInsets insets = image.capInsets;
    CGRectMake(
        insets.left / size.width, insets.top / size.height, (CGFloat)1.0 / size.width, (CGFloat)1.0 / size.height);
  });

  layer.contents = (id)image.CGImage;
  layer.contentsScale = image.scale;
  layer.needsDisplayOnBoundsChange = YES;
  layer.magnificationFilter = kCAFilterNearest;

  const BOOL isResizable = !UIEdgeInsetsEqualToEdgeInsets(image.capInsets, UIEdgeInsetsZero);
  if (isResizable) {
    layer.contentsCenter = contentsCenter;
  } else {
    layer.contentsCenter = CGRectMake(0.0, 0.0, 1.0, 1.0);
  }

  [self updateClippingForLayer:layer];
}

static BOOL RCTLayerHasShadow(CALayer *layer)
{
  return layer.shadowOpacity * CGColorGetAlpha(layer.shadowColor) > 0;
}

static void RCTUpdateShadowPathForView(RCTView *view)
{
  if (RCTLayerHasShadow(view.layer)) {
    if (CGColorGetAlpha(view.backgroundColor.CGColor) > 0.999) {
      // If view has a solid background color, calculate shadow path from border
      const RCTCornerRadii cornerRadii = [view cornerRadii];
      const RCTCornerInsets cornerInsets = RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero);
      CGPathRef shadowPath = RCTPathCreateWithRoundedRect(view.bounds, cornerInsets, NULL, NO);
      view.layer.shadowPath = shadowPath;
      CGPathRelease(shadowPath);

    } else {
      // Can't accurately calculate box shadow, so fall back to pixel-based shadow
      view.layer.shadowPath = nil;

      RCTLogAdvice(
          @"View #%@ of type %@ has a shadow set but cannot calculate "
           "shadow efficiently. Consider setting a solid background color to "
           "fix this, or apply the shadow to a more specific component.",
          view.reactTag,
          [view class]);
    }
  }
}

static void RCTUpdateHoverStyleForView(RCTView *view)
{
#if !TARGET_OS_TV && defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= 170000 /* __IPHONE_17_0 */
  if (@available(iOS 17.0, *)) {
    UIHoverStyle *hoverStyle = nil;
    if ([view cursor] == RCTCursorPointer) {
      const RCTCornerRadii cornerRadii = [view cornerRadii];
      const RCTCornerInsets cornerInsets = RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero);
#if TARGET_OS_IOS
      // Due to an Apple bug, it seems on iOS, `[UIShape shapeWithBezierPath:]` needs to
      // be calculated in the superviews' coordinate space (view.frame). This is not true
      // on other platforms like visionOS.
      CGPathRef borderPath = RCTPathCreateWithRoundedRect(view.frame, cornerInsets, NULL, NO);
#else // TARGET_OS_VISION
      CGPathRef borderPath = RCTPathCreateWithRoundedRect(view.bounds, cornerInsets, NULL, NO);
#endif
      UIBezierPath *bezierPath = [UIBezierPath bezierPathWithCGPath:borderPath];
      CGPathRelease(borderPath);
      UIShape *shape = [UIShape shapeWithBezierPath:bezierPath];

      hoverStyle = [UIHoverStyle styleWithEffect:[UIHoverHighlightEffect effect] shape:shape];
    }
    [view setHoverStyle:hoverStyle];
  }
#endif
}

- (void)updateClippingForLayer:(CALayer *)layer
{
  CALayer *mask = nil;
  CGFloat cornerRadius = 0;

  if (self.clipsToBounds) {
    const RCTCornerRadii cornerRadii = [self cornerRadii];
    if (RCTCornerRadiiAreEqualAndSymmetrical(cornerRadii)) {
      cornerRadius = cornerRadii.topLeftHorizontal;

    } else {
      CAShapeLayer *shapeLayer = [CAShapeLayer layer];
      CGPathRef path =
          RCTPathCreateWithRoundedRect(self.bounds, RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero), NULL, NO);
      shapeLayer.path = path;
      CGPathRelease(path);
      mask = shapeLayer;
    }
  }

  layer.cornerRadius = cornerRadius;
  layer.mask = mask;
}

#pragma mark Border Color

#define setBorderColor(side)                       \
  -(void)setBorder##side##Color : (UIColor *)color \
  {                                                \
    if ([_border##side##Color isEqual:color]) {    \
      return;                                      \
    }                                              \
    _border##side##Color = color;                  \
    [self.layer setNeedsDisplay];                  \
  }

setBorderColor() setBorderColor(Top) setBorderColor(Right) setBorderColor(Bottom) setBorderColor(Left)
    setBorderColor(Start) setBorderColor(End) setBorderColor(Block) setBorderColor(BlockEnd) setBorderColor(BlockStart)

#pragma mark - Border Width

#define setBorderWidth(side)                     \
  -(void)setBorder##side##Width : (CGFloat)width \
  {                                              \
    if (_border##side##Width == width) {         \
      return;                                    \
    }                                            \
    _border##side##Width = width;                \
    [self.layer setNeedsDisplay];                \
  }

        setBorderWidth() setBorderWidth(Top) setBorderWidth(Right) setBorderWidth(Bottom) setBorderWidth(Left)
            setBorderWidth(Start) setBorderWidth(End)

#pragma mark - Border Radius

#define setBorderRadius(side)                      \
  -(void)setBorder##side##Radius : (CGFloat)radius \
  {                                                \
    if (_border##side##Radius == radius) {         \
      return;                                      \
    }                                              \
    _border##side##Radius = radius;                \
    [self.layer setNeedsDisplay];                  \
  }

                setBorderRadius() setBorderRadius(TopLeft) setBorderRadius(TopRight) setBorderRadius(TopStart)
                    setBorderRadius(TopEnd) setBorderRadius(BottomLeft) setBorderRadius(BottomRight)
                        setBorderRadius(BottomStart) setBorderRadius(BottomEnd) setBorderRadius(EndEnd)
                            setBorderRadius(EndStart) setBorderRadius(StartEnd) setBorderRadius(StartStart)

#pragma mark - Border Curve

#define setBorderCurve(side)                            \
  -(void)setBorder##side##Curve : (RCTBorderCurve)curve \
  {                                                     \
    if (_border##side##Curve == curve) {                \
      return;                                           \
    }                                                   \
    _border##side##Curve = curve;                       \
    [self.layer setNeedsDisplay];                       \
  }

                                setBorderCurve()

#pragma mark - Border Style

#define setBorderStyle(side)                            \
  -(void)setBorder##side##Style : (RCTBorderStyle)style \
  {                                                     \
    if (_border##side##Style == style) {                \
      return;                                           \
    }                                                   \
    _border##side##Style = style;                       \
    [self.layer setNeedsDisplay];                       \
  }

                                    setBorderStyle()

                                        @end
