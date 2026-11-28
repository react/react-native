/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBoxShadow.h"

#import <React/RCTConversions.h>

#import <react/renderer/graphics/Color.h>

#import <math.h>

using namespace facebook::react;
// See https://drafts.csswg.org/css-backgrounds/#shadow-shape
static CGFloat adjustedCornerRadius(CGFloat cornerRadius, CGFloat spreadDistance)
{
  CGFloat adjustment = spreadDistance;
  (void)adjustment;
  if (cornerRadius < abs(spreadDistance)) {
    const CGFloat r = cornerRadius / (CGFloat)abs(spreadDistance);
    const CGFloat p = (CGFloat)pow(r - 1.0, 3.0);
    adjustment *= 1.0 + p;
  }

  return fmax(cornerRadius + adjustment, 0);
}

static RCTCornerRadii cornerRadiiForBoxShadow(RCTCornerRadii cornerRadii, CGFloat spreadDistance)
{
  return {
      adjustedCornerRadius(cornerRadii.topLeftHorizontal, spreadDistance),
      adjustedCornerRadius(cornerRadii.topLeftVertical, spreadDistance),
      adjustedCornerRadius(cornerRadii.topRightHorizontal, spreadDistance),
      adjustedCornerRadius(cornerRadii.topRightVertical, spreadDistance),
      adjustedCornerRadius(cornerRadii.bottomLeftHorizontal, spreadDistance),
      adjustedCornerRadius(cornerRadii.bottomLeftVertical, spreadDistance),
      adjustedCornerRadius(cornerRadii.bottomRightHorizontal, spreadDistance),
      adjustedCornerRadius(cornerRadii.bottomRightVertical, spreadDistance)};
}

static CGRect insetRect(CGRect rect, CGFloat left, CGFloat top, CGFloat right, CGFloat bottom)
{
  return CGRectMake(
      rect.origin.x + left, rect.origin.y + top, rect.size.width - right - left, rect.size.height - bottom - top);
}

static CGColorRef colorRefFromSharedColor(const SharedColor &color)
{
  CGColorRef colorRef = RCTUIColorFromSharedColor(color).CGColor;
  return (colorRef != nullptr) ? colorRef : [UIColor blackColor].CGColor;
}

static CALayer *initBoxShadowLayer(const BoxShadow &shadow, CGSize layerSize)
{
  CALayer *shadowLayer = [CALayer layer];
  shadowLayer.frame = CGRectMake(0, 0, layerSize.width, layerSize.height);
  shadowLayer.shadowColor = colorRefFromSharedColor(shadow.color);
  // Default is (0, -3) believe it or not
  shadowLayer.shadowOffset = CGSizeMake(0, 0);
  shadowLayer.shadowOpacity = 1;
  // Apple's blur is not quite what we want and seems to be a bit overbearing
  // with the radius. This is an eyeballed adjustment that has the blur looking
  // more like the web.
  shadowLayer.shadowRadius = shadow.blurRadius / 2;
  shadowLayer.contentsScale = [UIScreen mainScreen].scale;

  return shadowLayer;
}

static CALayer *
RCTGetOutsetBoxShadowLayer(const facebook::react::BoxShadow &shadow, RCTCornerRadii cornerRadii, CGSize layerSize)
{
  CALayer *shadowLayer = initBoxShadowLayer(shadow, layerSize);

  const RCTCornerInsets shadowRectCornerInsets =
      RCTGetCornerInsets(cornerRadiiForBoxShadow(cornerRadii, shadow.spreadDistance), UIEdgeInsetsZero);

  // A negative spread can shrink the shadow rect to zero but not past it: CGRectInset would return CGRectNull, which
  // ends up as NaN in CoreGraphics. Capping each inset at half the size keeps the rect centred on the layer.
  const CGRect bounds = shadowLayer.bounds;
  CGRect shadowRect = CGRectInset(
      bounds,
      fmin(-shadow.spreadDistance, bounds.size.width / 2),
      fmin(-shadow.spreadDistance, bounds.size.height / 2));
  shadowRect = CGRectOffset(shadowRect, shadow.offsetX, shadow.offsetY);
  CGPathRef shadowRectPath = RCTPathCreateWithRoundedRect(shadowRect, shadowRectCornerInsets, nil, NO);
  shadowLayer.shadowPath = shadowRectPath;

  CAShapeLayer *mask = [CAShapeLayer new];
  [mask setContentsScale:[UIScreen mainScreen].scale];
  CGMutablePathRef path = CGPathCreateMutable();
  CGPathRef layerPath =
      RCTPathCreateWithRoundedRect(shadowLayer.bounds, RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero), nil, NO);
  CGPathAddPath(path, NULL, layerPath);
  CGPathRef paddedShadowRectPath = RCTPathCreateWithRoundedRect(
      CGRectInset(shadowRect, -2 * (shadow.blurRadius + 1), -2 * (shadow.blurRadius + 1)),
      shadowRectCornerInsets,
      nil,
      NO);
  CGPathAddPath(path, NULL, paddedShadowRectPath);
  mask.fillRule = kCAFillRuleEvenOdd;
  mask.path = path;
  shadowLayer.mask = mask;

  CGPathRelease(path);
  CGPathRelease(shadowRectPath);
  CGPathRelease(layerPath);
  CGPathRelease(paddedShadowRectPath);

  return shadowLayer;
}

static CALayer *RCTGetInsetBoxShadowLayer(
    const facebook::react::BoxShadow &shadow,
    RCTCornerRadii cornerRadii,
    UIEdgeInsets edgeInsets,
    CGSize layerSize)
{
  CALayer *shadowLayer = initBoxShadowLayer(shadow, layerSize);

  CGMutablePathRef path = CGPathCreateMutable();
  // This shadow is padded by the blur to make sure blur artifacts can be cast
  // if the clear region is right on the border of the layer
  CGRect shadowRect =
      insetRect(shadowLayer.bounds, edgeInsets.left, edgeInsets.top, edgeInsets.right, edgeInsets.bottom);
  if (CGRectIsNull(shadowRect)) {
    shadowRect = CGRectMake(0, 0, 0, 0);
  }
  CGPathRef shadowPath =
      RCTPathCreateWithRoundedRect(CGRectInset(shadowRect, -shadow.blurRadius, -shadow.blurRadius), {}, nil, NO);

  CGPathRef layerPath = RCTPathCreateWithRoundedRect(shadowRect, RCTGetCornerInsets(cornerRadii, edgeInsets), nil, NO);
  CGPathAddPath(path, NULL, shadowPath);

  CGRect clearRegionRect = CGRectOffset(shadowRect, shadow.offsetX, shadow.offsetY);
  clearRegionRect = CGRectInset(clearRegionRect, shadow.spreadDistance, shadow.spreadDistance);
  if (CGRectIsNull(clearRegionRect)) {
    clearRegionRect = CGRectMake(0, 0, 0, 0);
  }
  CGPathRef clearRegionPath = RCTPathCreateWithRoundedRect(
      clearRegionRect,
      RCTGetCornerInsets(cornerRadiiForBoxShadow(cornerRadii, -shadow.spreadDistance), edgeInsets),
      nil,
      YES);
  CGPathAddPath(path, NULL, clearRegionPath);

  shadowLayer.shadowPath = path;

  CAShapeLayer *mask = [CAShapeLayer new];
  mask.path = layerPath;
  shadowLayer.mask = mask;

  CGPathRelease(path);
  CGPathRelease(layerPath);
  CGPathRelease(shadowPath);
  CGPathRelease(clearRegionPath);

  return shadowLayer;
}

CALayer *RCTGetBoxShadowLayer(
    const facebook::react::BoxShadow &shadow,
    RCTCornerRadii cornerRadii,
    UIEdgeInsets edgeInsets,
    CGSize layerSize)
{
  if (shadow.inset) {
    return RCTGetInsetBoxShadowLayer(shadow, cornerRadii, edgeInsets, layerSize);
  } else {
    return RCTGetOutsetBoxShadowLayer(shadow, cornerRadii, layerSize);
  }
}
