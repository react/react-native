/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIView+React.h"

#import <objc/runtime.h>

#import "RCTAssert.h"
#import "RCTConvert+Transform.h"
#import "RCTLog.h"
#import "RCTShadowView.h"

@implementation UIView (React)

- (NSNumber *)reactTag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactTag:(NSNumber *)reactTag
{
  objc_setAssociatedObject(self, @selector(reactTag), reactTag, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSNumber *)rootTag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setRootTag:(NSNumber *)rootTag
{
  objc_setAssociatedObject(self, @selector(rootTag), rootTag, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSString *)nativeID
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setNativeID:(NSString *)nativeID
{
  objc_setAssociatedObject(self, @selector(nativeID), nativeID, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (BOOL)shouldAccessibilityIgnoresInvertColors
{
  return self.accessibilityIgnoresInvertColors;
}

- (void)setShouldAccessibilityIgnoresInvertColors:(BOOL)shouldAccessibilityIgnoresInvertColors
{
  self.accessibilityIgnoresInvertColors = shouldAccessibilityIgnoresInvertColors;
}

- (BOOL)isReactRootView
{
  return RCTIsReactRootView(self.reactTag);
}

- (NSNumber *)reactTagAtPoint:(CGPoint)point
{
  UIView *view = [self hitTest:point withEvent:nil];
  while (view && !view.reactTag) {
    view = view.superview;
  }
  return view.reactTag;
}

- (NSArray<UIView *> *)reactSubviews
{
  return objc_getAssociatedObject(self, _cmd);
}

- (UIView *)reactSuperview
{
  return self.superview;
}

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  // We access the associated object directly here in case someone overrides
  // the `reactSubviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(reactSubviews));
  if (!subviews) {
    subviews = [NSMutableArray new];
    objc_setAssociatedObject(self, @selector(reactSubviews), subviews, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  [subviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactSubview:(UIView *)subview
{
  // We access the associated object directly here in case someone overrides
  // the `reactSubviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(reactSubviews));
  [subviews removeObject:subview];
  [subview removeFromSuperview];
}

#pragma mark - Display

- (YGDisplay)reactDisplay
{
  return self.isHidden ? YGDisplayNone : YGDisplayFlex;
}

- (void)setReactDisplay:(YGDisplay)display
{
  self.hidden = display == YGDisplayNone;
}

#pragma mark - Layout Direction

- (UIUserInterfaceLayoutDirection)reactLayoutDirection
{
  if ([self respondsToSelector:@selector(semanticContentAttribute)]) {
    return [UIView userInterfaceLayoutDirectionForSemanticContentAttribute:self.semanticContentAttribute];
  } else {
    return [objc_getAssociatedObject(self, @selector(reactLayoutDirection)) integerValue];
  }
}

- (void)setReactLayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
    self.semanticContentAttribute = layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight
        ? UISemanticContentAttributeForceLeftToRight
        : UISemanticContentAttributeForceRightToLeft;
  } else {
    objc_setAssociatedObject(
        self, @selector(reactLayoutDirection), @(layoutDirection), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
}

#pragma mark - zIndex

- (NSInteger)reactZIndex
{
  return self.layer.zPosition;
}

- (void)setReactZIndex:(NSInteger)reactZIndex
{
  self.layer.zPosition = reactZIndex;
}

- (NSArray<UIView *> *)reactZIndexSortedSubviews
{
  // Check if sorting is required - in most cases it won't be.
  BOOL sortingRequired = NO;
  for (UIView *subview in self.subviews) {
    if (subview.reactZIndex != 0) {
      sortingRequired = YES;
      break;
    }
  }
  return sortingRequired ? [self.reactSubviews sortedArrayUsingComparator:^NSComparisonResult(UIView *a, UIView *b) {
    if (a.reactZIndex > b.reactZIndex) {
      return NSOrderedDescending;
    } else {
      // Ensure sorting is stable by treating equal zIndex as ascending so
      // that original order is preserved.
      return NSOrderedAscending;
    }
  }]
                         : self.subviews;
}

- (void)didUpdateReactSubviews
{
  for (UIView *subview in self.reactSubviews) {
    [self addSubview:subview];
  }
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  // The default implementation does nothing.
}

- (void)reactSetFrame:(CGRect)frame
{
  // These frames are in terms of anchorPoint = topLeft, but internally the
  // views are anchorPoint = center for easier scale and rotation animations.
  // Convert the frame so it works with anchorPoint = center.
  CGPoint position = {CGRectGetMidX(frame), CGRectGetMidY(frame)};
  CGRect bounds = {CGPointZero, frame.size};

  // Avoid crashes due to nan coords
  if (isnan(position.x) || isnan(position.y) || isnan(bounds.origin.x) || isnan(bounds.origin.y) ||
      isnan(bounds.size.width) || isnan(bounds.size.height)) {
    RCTLogError(
        @"Invalid layout for (%@)%@. position: %@. bounds: %@",
        self.reactTag,
        self,
        NSStringFromCGPoint(position),
        NSStringFromCGRect(bounds));
    return;
  }

  self.center = position;
  self.bounds = bounds;

  id transformOrigin = objc_getAssociatedObject(self, @selector(reactTransformOrigin));
  if (transformOrigin) {
    updateTransform(self);
  }
}

#pragma mark - Transforms

- (CATransform3D)reactTransform
{
  id obj = objc_getAssociatedObject(self, _cmd);
  return obj != nil ? [obj CATransform3DValue] : CATransform3DIdentity;
}

- (void)setReactTransform:(CATransform3D)reactTransform
{
  objc_setAssociatedObject(self, @selector(reactTransform), @(reactTransform), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  updateTransform(self);
}

- (RCTTransformOrigin)reactTransformOrigin
{
  id obj = objc_getAssociatedObject(self, _cmd);
  if (obj != nil) {
    RCTTransformOrigin transformOrigin;
    [obj getValue:&transformOrigin];
    return transformOrigin;
  } else {
    return (RCTTransformOrigin){(YGValue){50, YGUnitPercent}, (YGValue){50, YGUnitPercent}, 0};
  }
}

- (void)setReactTransformOrigin:(RCTTransformOrigin)reactTransformOrigin
{
  id obj = [NSValue value:&reactTransformOrigin withObjCType:@encode(RCTTransformOrigin)];
  objc_setAssociatedObject(self, @selector(reactTransformOrigin), obj, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  updateTransform(self);
}

static void updateTransform(UIView *view)
{
  CATransform3D transform;
  id rawTansformOrigin = objc_getAssociatedObject(view, @selector(reactTransformOrigin));
  if (rawTansformOrigin) {
    CGSize size = view.bounds.size;
    CGFloat anchorPointX = 0;
    CGFloat anchorPointY = 0;
    CGFloat anchorPointZ = 0;
    RCTTransformOrigin transformOrigin;
    [rawTansformOrigin getValue:&transformOrigin];
    if (transformOrigin.x.unit == YGUnitPoint) {
      anchorPointX = transformOrigin.x.value - size.width * 0.5;
    } else if (transformOrigin.x.unit == YGUnitPercent) {
      anchorPointX = (transformOrigin.x.value * 0.01 - 0.5) * size.width;
    }

    if (transformOrigin.y.unit == YGUnitPoint) {
      anchorPointY = transformOrigin.y.value - size.height * 0.5;
    } else if (transformOrigin.y.unit == YGUnitPercent) {
      anchorPointY = (transformOrigin.y.value * 0.01 - 0.5) * size.height;
    }
    anchorPointZ = transformOrigin.z;
    transform = CATransform3DConcat(
        view.reactTransform, CATransform3DMakeTranslation(anchorPointX, anchorPointY, anchorPointZ));
    transform =
        CATransform3DConcat(CATransform3DMakeTranslation(-anchorPointX, -anchorPointY, -anchorPointZ), transform);
  } else {
    transform = view.reactTransform;
  }

  // A transform whose origin's translations overflow it is drawn untransformed, as RCTConvert draws one that
  // overflows on its own.
  if (!RCTIsFiniteTransform(transform)) {
    transform = CATransform3DIdentity;
  }

  view.layer.transform = transform;
  // Enable edge antialiasing in rotation, skew, or perspective transforms
  view.layer.allowsEdgeAntialiasing = transform.m12 != 0.0f || transform.m21 != 0.0f || transform.m34 != 0.0f;
}

- (UIViewController *)reactViewController
{
  id responder = [self nextResponder];
  while (responder) {
    if ([responder isKindOfClass:[UIViewController class]]) {
      return responder;
    }
    responder = [responder nextResponder];
  }
  return nil;
}

- (void)reactAddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.reactSuperview;
    while (parentView) {
      if (parentView.reactViewController) {
        [parentView.reactViewController addChildViewController:controller];
        [controller didMoveToParentViewController:parentView.reactViewController];
        break;
      }
      parentView = (UIView *)parentView.reactSuperview;
    }
    return;
  }
}

/**
 * Focus manipulation.
 */
- (BOOL)reactIsFocusNeeded
{
  return [(NSNumber *)objc_getAssociatedObject(self, @selector(reactIsFocusNeeded)) boolValue];
}

- (void)setReactIsFocusNeeded:(BOOL)isFocusNeeded
{
  objc_setAssociatedObject(self, @selector(reactIsFocusNeeded), @(isFocusNeeded), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)reactFocus
{
  if (![self becomeFirstResponder]) {
    self.reactIsFocusNeeded = YES;
  }
}

- (void)reactFocusIfNeeded
{
  if (self.reactIsFocusNeeded) {
    if ([self becomeFirstResponder]) {
      self.reactIsFocusNeeded = NO;
    }
  }
}

- (void)reactBlur
{
  [self resignFirstResponder];
}

#pragma mark - Layout

- (UIEdgeInsets)reactBorderInsets
{
  CGFloat borderWidth = self.layer.borderWidth;
  return UIEdgeInsetsMake(borderWidth, borderWidth, borderWidth, borderWidth);
}

- (UIEdgeInsets)reactPaddingInsets
{
  return UIEdgeInsetsZero;
}

- (UIEdgeInsets)reactCompoundInsets
{
  UIEdgeInsets borderInsets = self.reactBorderInsets;
  UIEdgeInsets paddingInsets = self.reactPaddingInsets;

  return UIEdgeInsetsMake(
      borderInsets.top + paddingInsets.top,
      borderInsets.left + paddingInsets.left,
      borderInsets.bottom + paddingInsets.bottom,
      borderInsets.right + paddingInsets.right);
}

- (CGRect)reactContentFrame
{
  return UIEdgeInsetsInsetRect(self.bounds, self.reactCompoundInsets);
}

#pragma mark - Accessibility

- (UIView *)reactAccessibilityElement
{
  return self;
}

- (NSArray<NSDictionary *> *)accessibilityActions
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setAccessibilityActions:(NSArray<NSDictionary *> *)accessibilityActions
{
  objc_setAssociatedObject(
      self, @selector(accessibilityActions), accessibilityActions, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSString *)accessibilityLanguage
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setAccessibilityLanguage:(NSString *)accessibilityLanguage
{
  objc_setAssociatedObject(
      self, @selector(accessibilityLanguage), accessibilityLanguage, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSString *)accessibilityRole
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setAccessibilityRole:(NSString *)accessibilityRole
{
  objc_setAssociatedObject(self, @selector(accessibilityRole), accessibilityRole, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSString *)role
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setRole:(NSString *)role
{
  objc_setAssociatedObject(self, @selector(role), role, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSDictionary<NSString *, id> *)accessibilityState
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setAccessibilityState:(NSDictionary<NSString *, id> *)accessibilityState
{
  objc_setAssociatedObject(self, @selector(accessibilityState), accessibilityState, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSDictionary<NSString *, id> *)accessibilityValueInternal
{
  return objc_getAssociatedObject(self, _cmd);
}
- (void)setAccessibilityValueInternal:(NSDictionary<NSString *, id> *)accessibilityValue
{
  objc_setAssociatedObject(
      self, @selector(accessibilityValueInternal), accessibilityValue, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (UIAccessibilityTraits)accessibilityRoleTraits
{
  NSNumber *traitsAsNumber = objc_getAssociatedObject(self, _cmd);
  return traitsAsNumber ? [traitsAsNumber unsignedLongLongValue] : UIAccessibilityTraitNone;
}

- (void)setAccessibilityRoleTraits:(UIAccessibilityTraits)accessibilityRoleTraits
{
  objc_setAssociatedObject(
      self,
      @selector(accessibilityRoleTraits),
      [NSNumber numberWithUnsignedLongLong:accessibilityRoleTraits],
      OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (UIAccessibilityTraits)roleTraits
{
  NSNumber *traitsAsNumber = objc_getAssociatedObject(self, _cmd);
  return traitsAsNumber ? [traitsAsNumber unsignedLongLongValue] : UIAccessibilityTraitNone;
}

- (void)setRoleTraits:(UIAccessibilityTraits)roleTraits
{
  objc_setAssociatedObject(
      self, @selector(roleTraits), [NSNumber numberWithUnsignedLongLong:roleTraits], OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

#pragma mark - Debug
- (void)react_addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"   | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (UIView *subview in self.subviews) {
    [subview react_addRecursiveDescriptionToString:string atLevel:level + 1];
  }
}

- (NSString *)react_recursiveDescription
{
  NSMutableString *description = [NSMutableString string];
  [self react_addRecursiveDescriptionToString:description atLevel:0];
  return description;
}

@end
