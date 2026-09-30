/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBasicShapeUtils.h"

#import <React/RCTConversions.h>

using namespace facebook::react;

static CGFloat RCTResolveValueUnit(const ValueUnit &unit, CGFloat referenceDimension)
{
  if (unit.unit == UnitType::Percent) {
    return (CGFloat)unit.value * referenceDimension / 100.0f;
  }
  return (CGFloat)unit.value;
}

@implementation RCTBasicShapeUtils

+ (UIBezierPath *)createCirclePath:(const CircleShape &)circle bounds:(CGRect)bounds
{
  // Resolve radius (use smaller dimension as reference for percentages, matching CSS closest-side)
  // Default to 50% of closest-side if radius is not specified
  CGFloat referenceDimension = MIN(bounds.size.width, bounds.size.height);
  CGFloat radius = circle.r.has_value() ? RCTResolveValueUnit(circle.r.value(), referenceDimension) : referenceDimension / 2.0f;
  CGFloat cx = bounds.origin.x + (circle.cx.has_value() ? RCTResolveValueUnit(circle.cx.value(), bounds.size.width) : bounds.size.width / 2.0f);
  CGFloat cy = bounds.origin.y + (circle.cy.has_value() ? RCTResolveValueUnit(circle.cy.value(), bounds.size.height) : bounds.size.height / 2.0f);

  CGFloat diameter = radius * 2.0f;
  CGRect circleRect = CGRectMake(cx - radius, cy - radius, diameter, diameter);

  return [UIBezierPath bezierPathWithOvalInRect:circleRect];
}

+ (UIBezierPath *)createEllipsePath:(const EllipseShape &)ellipse bounds:(CGRect)bounds
{
  // Resolve radii (default to 50% if not specified)
  CGFloat rx = ellipse.rx.has_value() ? RCTResolveValueUnit(ellipse.rx.value(), bounds.size.width) : bounds.size.width / 2.0f;
  CGFloat ry = ellipse.ry.has_value() ? RCTResolveValueUnit(ellipse.ry.value(), bounds.size.height) : bounds.size.height / 2.0f;
  CGFloat cx = bounds.origin.x + (ellipse.cx.has_value() ? RCTResolveValueUnit(ellipse.cx.value(), bounds.size.width) : bounds.size.width / 2.0f);
  CGFloat cy = bounds.origin.y + (ellipse.cy.has_value() ? RCTResolveValueUnit(ellipse.cy.value(), bounds.size.height) : bounds.size.height / 2.0f);

  CGFloat diameterX = rx * 2.0f;
  CGFloat diameterY = ry * 2.0f;
  CGRect ellipseRect = CGRectMake(cx - rx, cy - ry, diameterX, diameterY);

  return [UIBezierPath bezierPathWithOvalInRect:ellipseRect];
}

+ (UIBezierPath *)createInsetPath:(const InsetShape &)inset bounds:(CGRect)bounds
{
  CGFloat top = bounds.origin.y + RCTResolveValueUnit(inset.top, bounds.size.height);
  CGFloat right = bounds.origin.x + RCTResolveValueUnit(inset.right, bounds.size.width);
  CGFloat bottom = bounds.origin.y + RCTResolveValueUnit(inset.bottom, bounds.size.height);
  CGFloat left = bounds.origin.x + RCTResolveValueUnit(inset.left, bounds.size.width);

  CGRect insetRect = CGRectMake(
      left, top, bounds.size.width - left - right, bounds.size.height - top - bottom);

  if (insetRect.size.width < 0 || insetRect.size.height < 0) {
    return nil;
  }

  CGFloat borderRadius = inset.borderRadius.has_value() ? RCTResolveValueUnit(inset.borderRadius.value(), MIN(insetRect.size.width, insetRect.size.height)) : 0.0f;

  return [UIBezierPath bezierPathWithRoundedRect:insetRect cornerRadius:borderRadius];
}

+ (UIBezierPath *)createPolygonPath:(const PolygonShape &)polygon bounds:(CGRect)bounds
{
  if (polygon.points.empty()) {
    return nil;
  }

  UIBezierPath *path = [UIBezierPath bezierPath];

  const auto &firstPoint = polygon.points[0];
  [path moveToPoint:CGPointMake(
        bounds.origin.x + RCTResolveValueUnit(firstPoint.first, bounds.size.width),
        bounds.origin.y + RCTResolveValueUnit(firstPoint.second, bounds.size.height))];

  for (size_t i = 1; i < polygon.points.size(); i++) {
    const auto &point = polygon.points[i];
    [path addLineToPoint:CGPointMake(
        bounds.origin.x + RCTResolveValueUnit(point.first, bounds.size.width),
        bounds.origin.y + RCTResolveValueUnit(point.second, bounds.size.height))];
  }

  path.usesEvenOddFillRule = polygon.fillRule == FillRule::EvenOdd;
  [path closePath];
  return path;
}

+ (UIBezierPath *)createRectPath:(const RectShape &)rect bounds:(CGRect)bounds
{
  CGFloat top = bounds.origin.y + RCTResolveValueUnit(rect.top, bounds.size.height);
  CGFloat right = bounds.origin.x + RCTResolveValueUnit(rect.right, bounds.size.width);
  CGFloat bottom = bounds.origin.y + RCTResolveValueUnit(rect.bottom, bounds.size.height);
  CGFloat left = bounds.origin.x + RCTResolveValueUnit(rect.left, bounds.size.width);

  CGRect clipRect = CGRectMake(left, top, right - left, bottom - top);

  if (clipRect.size.width < 0 || clipRect.size.height < 0) {
    return nil;
  }

  CGFloat borderRadius = rect.borderRadius.has_value() ? RCTResolveValueUnit(rect.borderRadius.value(), MIN(clipRect.size.width, clipRect.size.height)) : 0.0f;
  return [UIBezierPath bezierPathWithRoundedRect:clipRect cornerRadius:borderRadius];
}

+ (UIBezierPath *)createXywhPath:(const XywhShape &)xywh bounds:(CGRect)bounds
{
  CGFloat x = bounds.origin.x + RCTResolveValueUnit(xywh.x, bounds.size.width);
  CGFloat y = bounds.origin.y + RCTResolveValueUnit(xywh.y, bounds.size.height);
  CGFloat width = RCTResolveValueUnit(xywh.width, bounds.size.width);
  CGFloat height = RCTResolveValueUnit(xywh.height, bounds.size.height);

  CGRect xywhRect = CGRectMake(x, y, width, height);

  if (xywhRect.size.width < 0 || xywhRect.size.height < 0) {
    return nil;
  }

  CGFloat borderRadius = xywh.borderRadius.has_value() ? RCTResolveValueUnit(xywh.borderRadius.value(), MIN(xywhRect.size.width, xywhRect.size.height)) : 0.0f;
  return [UIBezierPath bezierPathWithRoundedRect:xywhRect cornerRadius:borderRadius];
}

+ (UIBezierPath *)createPathFromBasicShape:(const BasicShape &)basicShape bounds:(CGRect)bounds
{
  if (std::holds_alternative<CircleShape>(basicShape)) {
    return [self createCirclePath:std::get<CircleShape>(basicShape) bounds:bounds];
  } else if (std::holds_alternative<EllipseShape>(basicShape)) {
    return [self createEllipsePath:std::get<EllipseShape>(basicShape) bounds:bounds];
  } else if (std::holds_alternative<InsetShape>(basicShape)) {
    return [self createInsetPath:std::get<InsetShape>(basicShape) bounds:bounds];
  } else if (std::holds_alternative<PolygonShape>(basicShape)) {
    return [self createPolygonPath:std::get<PolygonShape>(basicShape) bounds:bounds];
  } else if (std::holds_alternative<RectShape>(basicShape)) {
    return [self createRectPath:std::get<RectShape>(basicShape) bounds:bounds];
  } else if (std::holds_alternative<XywhShape>(basicShape)) {
    return [self createXywhPath:std::get<XywhShape>(basicShape) bounds:bounds];
  }

  return nil;
}

@end
