/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBorderDrawing.h"
#import "RCTLog.h"

static const CGFloat RCTViewBorderThreshold = 0.001;

CGFloat RCTMaxBorderInset(UIEdgeInsets borderInsets)
{
  return MAX(MAX(borderInsets.top, borderInsets.left), MAX(borderInsets.bottom, borderInsets.right));
}

BOOL RCTBorderInsetsAreEqual(UIEdgeInsets borderInsets)
{
  return ABS(borderInsets.left - borderInsets.right) < RCTViewBorderThreshold &&
      ABS(borderInsets.left - borderInsets.bottom) < RCTViewBorderThreshold &&
      ABS(borderInsets.left - borderInsets.top) < RCTViewBorderThreshold;
}

BOOL RCTCornerRadiiAreEqualAndSymmetrical(RCTCornerRadii cornerRadii)
{
  return cornerRadii.topLeftHorizontal == cornerRadii.topLeftVertical &&
      cornerRadii.topRightHorizontal == cornerRadii.topRightVertical &&
      cornerRadii.bottomLeftHorizontal == cornerRadii.bottomLeftVertical &&
      cornerRadii.bottomRightHorizontal == cornerRadii.bottomRightVertical &&
      ABS(cornerRadii.topLeftHorizontal - cornerRadii.topRightHorizontal) < RCTViewBorderThreshold &&
      ABS(cornerRadii.topLeftHorizontal - cornerRadii.bottomLeftHorizontal) < RCTViewBorderThreshold &&
      ABS(cornerRadii.topLeftHorizontal - cornerRadii.bottomRightHorizontal) < RCTViewBorderThreshold;
}

BOOL RCTBorderColorsAreEqual(RCTBorderColors borderColors)
{
  return CGColorEqualToColor(borderColors.left.CGColor, borderColors.right.CGColor) &&
      CGColorEqualToColor(borderColors.left.CGColor, borderColors.top.CGColor) &&
      CGColorEqualToColor(borderColors.left.CGColor, borderColors.bottom.CGColor);
}

RCTCornerInsets RCTGetCornerInsets(RCTCornerRadii cornerRadii, UIEdgeInsets edgeInsets)
{
  return (RCTCornerInsets){{
                               MAX(0, cornerRadii.topLeftHorizontal - edgeInsets.left),
                               MAX(0, cornerRadii.topLeftVertical - edgeInsets.top),
                           },
                           {
                               MAX(0, cornerRadii.topRightHorizontal - edgeInsets.right),
                               MAX(0, cornerRadii.topRightVertical - edgeInsets.top),
                           },
                           {
                               MAX(0, cornerRadii.bottomLeftHorizontal - edgeInsets.left),
                               MAX(0, cornerRadii.bottomLeftVertical - edgeInsets.bottom),
                           },
                           {
                               MAX(0, cornerRadii.bottomRightHorizontal - edgeInsets.right),
                               MAX(0, cornerRadii.bottomRightVertical - edgeInsets.bottom),
                           }};
}

static UIEdgeInsets RCTRoundInsetsToPixel(UIEdgeInsets edgeInsets)
{
  edgeInsets.top = RCTRoundPixelValue(edgeInsets.top);
  edgeInsets.bottom = RCTRoundPixelValue(edgeInsets.bottom);
  edgeInsets.left = RCTRoundPixelValue(edgeInsets.left);
  edgeInsets.right = RCTRoundPixelValue(edgeInsets.right);

  return edgeInsets;
}

static void RCTPathAddEllipticArc(
    CGMutablePathRef path,
    const CGAffineTransform *m,
    CGPoint origin,
    CGSize size,
    CGFloat startAngle,
    CGFloat endAngle,
    BOOL clockwise)
{
  CGFloat xScale = 1;
  CGFloat yScale = 1;
  CGFloat radius = 0;
  if (size.width != 0) {
    xScale = 1;
    yScale = size.height / size.width;
    radius = size.width;
  } else if (size.height != 0) {
    xScale = size.width / size.height;
    yScale = 1;
    radius = size.height;
  }

  CGAffineTransform t = CGAffineTransformMakeTranslation(origin.x, origin.y);
  t = CGAffineTransformScale(t, xScale, yScale);
  if (m != NULL) {
    t = CGAffineTransformConcat(t, *m);
  }

  CGPathAddArc(path, &t, 0, 0, radius, startAngle, endAngle, clockwise);
}

CGPathRef RCTPathCreateWithRoundedRect(
    CGRect bounds,
    RCTCornerInsets cornerInsets,
    const CGAffineTransform *transform,
    const BOOL inverted)
{
  const CGFloat minX = CGRectGetMinX(bounds);
  const CGFloat minY = CGRectGetMinY(bounds);
  const CGFloat maxX = CGRectGetMaxX(bounds);
  const CGFloat maxY = CGRectGetMaxY(bounds);

  const CGSize topLeft = {
      MAX(0, MIN(cornerInsets.topLeft.width, bounds.size.width - cornerInsets.topRight.width)),
      MAX(0, MIN(cornerInsets.topLeft.height, bounds.size.height - cornerInsets.bottomLeft.height)),
  };
  const CGSize topRight = {
      MAX(0, MIN(cornerInsets.topRight.width, bounds.size.width - cornerInsets.topLeft.width)),
      MAX(0, MIN(cornerInsets.topRight.height, bounds.size.height - cornerInsets.bottomRight.height)),
  };
  const CGSize bottomLeft = {
      MAX(0, MIN(cornerInsets.bottomLeft.width, bounds.size.width - cornerInsets.bottomRight.width)),
      MAX(0, MIN(cornerInsets.bottomLeft.height, bounds.size.height - cornerInsets.topLeft.height)),
  };
  const CGSize bottomRight = {
      MAX(0, MIN(cornerInsets.bottomRight.width, bounds.size.width - cornerInsets.bottomLeft.width)),
      MAX(0, MIN(cornerInsets.bottomRight.height, bounds.size.height - cornerInsets.topRight.height)),
  };

  CGMutablePathRef path = CGPathCreateMutable();
  if (inverted) {
    RCTPathAddEllipticArc(
        path, transform, (CGPoint){minX + bottomLeft.width, maxY - bottomLeft.height}, bottomLeft, M_PI, M_PI_2, YES);
    RCTPathAddEllipticArc(
        path, transform, (CGPoint){maxX - bottomRight.width, maxY - bottomRight.height}, bottomRight, M_PI_2, 0, YES);
    RCTPathAddEllipticArc(
        path, transform, (CGPoint){maxX - topRight.width, minY + topRight.height}, topRight, 0, 3 * M_PI_2, YES);
    RCTPathAddEllipticArc(
        path, transform, (CGPoint){minX + topLeft.width, minY + topLeft.height}, topLeft, 3 * M_PI_2, M_PI, YES);
  } else {
    RCTPathAddEllipticArc(
        path, transform, (CGPoint){minX + topLeft.width, minY + topLeft.height}, topLeft, M_PI, 3 * M_PI_2, NO);
    RCTPathAddEllipticArc(
        path, transform, (CGPoint){maxX - topRight.width, minY + topRight.height}, topRight, 3 * M_PI_2, 0, NO);
    RCTPathAddEllipticArc(
        path, transform, (CGPoint){maxX - bottomRight.width, maxY - bottomRight.height}, bottomRight, 0, M_PI_2, NO);
    RCTPathAddEllipticArc(
        path, transform, (CGPoint){minX + bottomLeft.width, maxY - bottomLeft.height}, bottomLeft, M_PI_2, M_PI, NO);
  }
  CGPathCloseSubpath(path);
  return path;
}

static void
RCTEllipseGetIntersectionsWithLine(CGRect ellipseBounds, CGPoint lineStart, CGPoint lineEnd, CGPoint intersections[2])
{
  const CGPoint ellipseCenter = {CGRectGetMidX(ellipseBounds), CGRectGetMidY(ellipseBounds)};

  lineStart.x -= ellipseCenter.x;
  lineStart.y -= ellipseCenter.y;
  lineEnd.x -= ellipseCenter.x;
  lineEnd.y -= ellipseCenter.y;

  const CGFloat m = (lineEnd.y - lineStart.y) / (lineEnd.x - lineStart.x);
  const CGFloat a = ellipseBounds.size.width / 2;
  const CGFloat b = ellipseBounds.size.height / 2;
  const CGFloat c = lineStart.y - m * lineStart.x;
  const CGFloat A = (b * b + a * a * m * m);
  const CGFloat B = 2 * a * a * c * m;
  const CGFloat D = sqrt((a * a * (b * b - c * c)) / A + pow(B / (2 * A), 2));

  const CGFloat x_ = -B / (2 * A);
  const CGFloat x1 = x_ + D;
  const CGFloat x2 = x_ - D;
  const CGFloat y1 = m * x1 + c;
  const CGFloat y2 = m * x2 + c;

  intersections[0] = (CGPoint){x1 + ellipseCenter.x, y1 + ellipseCenter.y};
  intersections[1] = (CGPoint){x2 + ellipseCenter.x, y2 + ellipseCenter.y};
}

NS_INLINE BOOL RCTCornerRadiiAreAboveThreshold(RCTCornerRadii cornerRadii)
{
  return (
      cornerRadii.topLeftHorizontal > RCTViewBorderThreshold || cornerRadii.topLeftVertical > RCTViewBorderThreshold ||
      cornerRadii.topRightHorizontal > RCTViewBorderThreshold ||
      cornerRadii.topRightVertical > RCTViewBorderThreshold ||
      cornerRadii.bottomLeftHorizontal > RCTViewBorderThreshold ||
      cornerRadii.bottomLeftVertical > RCTViewBorderThreshold ||
      cornerRadii.bottomRightHorizontal > RCTViewBorderThreshold ||
      cornerRadii.bottomRightVertical > RCTViewBorderThreshold);
}

static CGPathRef RCTPathCreateOuterOutline(BOOL drawToEdge, CGRect rect, RCTCornerRadii cornerRadii)
{
  if (drawToEdge) {
    return CGPathCreateWithRect(rect, NULL);
  }

  return RCTPathCreateWithRoundedRect(rect, RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero), NULL, NO);
}

static UIGraphicsImageRenderer *
RCTMakeUIGraphicsImageRenderer(CGSize size, UIColor *backgroundColor, BOOL hasCornerRadii, BOOL drawToEdge)
{
  const CGFloat alpha = CGColorGetAlpha(backgroundColor.CGColor);
  const BOOL opaque = (drawToEdge || !hasCornerRadii) && alpha == 1.0;
  UIGraphicsImageRendererFormat *const rendererFormat = [UIGraphicsImageRendererFormat defaultFormat];
  rendererFormat.opaque = opaque;
  UIGraphicsImageRenderer *const renderer = [[UIGraphicsImageRenderer alloc] initWithSize:size format:rendererFormat];
  return renderer;
}

static UIImage *RCTGetSolidBorderImage(
    RCTCornerRadii cornerRadii,
    CGSize viewSize,
    UIEdgeInsets borderInsets,
    RCTBorderColors borderColors,
    UIColor *backgroundColor,
    BOOL drawToEdge)
{
  const BOOL hasCornerRadii = RCTCornerRadiiAreAboveThreshold(cornerRadii);
  const RCTCornerInsets cornerInsets = RCTGetCornerInsets(cornerRadii, borderInsets);

  // Incorrect render for borders that are not proportional to device pixel: borders get stretched and become
  // significantly bigger than expected.
  // Rdar: http://www.openradar.me/15959788
  borderInsets = RCTRoundInsetsToPixel(borderInsets);

  const BOOL makeStretchable =
      (borderInsets.left + cornerInsets.topLeft.width + borderInsets.right + cornerInsets.bottomRight.width <=
       viewSize.width) &&
      (borderInsets.left + cornerInsets.bottomLeft.width + borderInsets.right + cornerInsets.topRight.width <=
       viewSize.width) &&
      (borderInsets.top + cornerInsets.topLeft.height + borderInsets.bottom + cornerInsets.bottomRight.height <=
       viewSize.height) &&
      (borderInsets.top + cornerInsets.topRight.height + borderInsets.bottom + cornerInsets.bottomLeft.height <=
       viewSize.height);

  UIEdgeInsets edgeInsets =
      (UIEdgeInsets){borderInsets.top + MAX(cornerInsets.topLeft.height, cornerInsets.topRight.height),
                     borderInsets.left + MAX(cornerInsets.topLeft.width, cornerInsets.bottomLeft.width),
                     borderInsets.bottom + MAX(cornerInsets.bottomLeft.height, cornerInsets.bottomRight.height),
                     borderInsets.right + MAX(cornerInsets.bottomRight.width, cornerInsets.topRight.width)};

  const CGSize size = makeStretchable ? (CGSize){
    // 1pt for the middle stretchable area along each axis
    edgeInsets.left + 1 + edgeInsets.right,
    edgeInsets.top + 1 + edgeInsets.bottom,
  } : viewSize;

  UIGraphicsImageRenderer *const imageRenderer =
      RCTMakeUIGraphicsImageRenderer(size, backgroundColor, hasCornerRadii, drawToEdge);

  UIImage *image = [imageRenderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull rendererContext) {
    const CGContextRef context = rendererContext.CGContext;
    const CGRect rect = {.size = size};
    CGPathRef path = RCTPathCreateOuterOutline(drawToEdge, rect, cornerRadii);

    if (backgroundColor) {
      CGContextSetFillColorWithColor(context, backgroundColor.CGColor);
      CGContextAddPath(context, path);
      CGContextFillPath(context);
    }

    CGContextAddPath(context, path);
    CGPathRelease(path);

    CGPathRef insetPath =
        RCTPathCreateWithRoundedRect(UIEdgeInsetsInsetRect(rect, borderInsets), cornerInsets, NULL, NO);

    CGContextAddPath(context, insetPath);
    CGContextEOClip(context);

    BOOL hasEqualColors = RCTBorderColorsAreEqual(borderColors);
    if ((drawToEdge || !hasCornerRadii) && hasEqualColors) {
      CGContextSetFillColorWithColor(context, borderColors.left.CGColor);
      CGContextAddRect(context, rect);
      CGContextAddPath(context, insetPath);
      CGContextEOFillPath(context);

    } else {
      CGPoint topLeft = (CGPoint){borderInsets.left, borderInsets.top};
      if (cornerInsets.topLeft.width > 0 && cornerInsets.topLeft.height > 0) {
        CGPoint points[2];
        RCTEllipseGetIntersectionsWithLine(
            (CGRect){topLeft, {2 * cornerInsets.topLeft.width, 2 * cornerInsets.topLeft.height}},
            CGPointZero,
            topLeft,
            points);
        if (!isnan(points[1].x) && !isnan(points[1].y)) {
          topLeft = points[1];
        }
      }

      CGPoint bottomLeft = (CGPoint){borderInsets.left, size.height - borderInsets.bottom};
      if (cornerInsets.bottomLeft.width > 0 && cornerInsets.bottomLeft.height > 0) {
        CGPoint points[2];
        RCTEllipseGetIntersectionsWithLine(
            (CGRect){{bottomLeft.x, bottomLeft.y - 2 * cornerInsets.bottomLeft.height},
                     {2 * cornerInsets.bottomLeft.width, 2 * cornerInsets.bottomLeft.height}},
            (CGPoint){0, size.height},
            bottomLeft,
            points);
        if (!isnan(points[1].x) && !isnan(points[1].y)) {
          bottomLeft = points[1];
        }
      }

      CGPoint topRight = (CGPoint){size.width - borderInsets.right, borderInsets.top};
      if (cornerInsets.topRight.width > 0 && cornerInsets.topRight.height > 0) {
        CGPoint points[2];
        RCTEllipseGetIntersectionsWithLine(
            (CGRect){{topRight.x - 2 * cornerInsets.topRight.width, topRight.y},
                     {2 * cornerInsets.topRight.width, 2 * cornerInsets.topRight.height}},
            (CGPoint){size.width, 0},
            topRight,
            points);
        if (!isnan(points[0].x) && !isnan(points[0].y)) {
          topRight = points[0];
        }
      }

      CGPoint bottomRight = (CGPoint){size.width - borderInsets.right, size.height - borderInsets.bottom};
      if (cornerInsets.bottomRight.width > 0 && cornerInsets.bottomRight.height > 0) {
        CGPoint points[2];
        RCTEllipseGetIntersectionsWithLine(
            (CGRect){{bottomRight.x - 2 * cornerInsets.bottomRight.width,
                      bottomRight.y - 2 * cornerInsets.bottomRight.height},
                     {2 * cornerInsets.bottomRight.width, 2 * cornerInsets.bottomRight.height}},
            (CGPoint){size.width, size.height},
            bottomRight,
            points);
        if (!isnan(points[0].x) && !isnan(points[0].y)) {
          bottomRight = points[0];
        }
      }

      UIColor *currentColor = nil;

      // RIGHT
      if (borderInsets.right > 0) {
        const CGPoint points[] = {
            (CGPoint){size.width, 0},
            topRight,
            bottomRight,
            (CGPoint){size.width, size.height},
        };

        currentColor = borderColors.right;
        CGContextAddLines(context, points, sizeof(points) / sizeof(*points));
      }

      // BOTTOM
      if (borderInsets.bottom > 0) {
        const CGPoint points[] = {
            (CGPoint){0, size.height},
            bottomLeft,
            bottomRight,
            (CGPoint){size.width, size.height},
        };

        if (!CGColorEqualToColor(currentColor.CGColor, borderColors.bottom.CGColor)) {
          CGContextSetFillColorWithColor(context, currentColor.CGColor);
          CGContextFillPath(context);
          currentColor = borderColors.bottom;
        }
        CGContextAddLines(context, points, sizeof(points) / sizeof(*points));
      }

      // LEFT
      if (borderInsets.left > 0) {
        const CGPoint points[] = {
            CGPointZero,
            topLeft,
            bottomLeft,
            (CGPoint){0, size.height},
        };

        if (!CGColorEqualToColor(currentColor.CGColor, borderColors.left.CGColor)) {
          CGContextSetFillColorWithColor(context, currentColor.CGColor);
          CGContextFillPath(context);
          currentColor = borderColors.left;
        }
        CGContextAddLines(context, points, sizeof(points) / sizeof(*points));
      }

      // TOP
      if (borderInsets.top > 0) {
        const CGPoint points[] = {
            CGPointZero,
            topLeft,
            topRight,
            (CGPoint){size.width, 0},
        };

        if (!CGColorEqualToColor(currentColor.CGColor, borderColors.top.CGColor)) {
          CGContextSetFillColorWithColor(context, currentColor.CGColor);
          CGContextFillPath(context);
          currentColor = borderColors.top;
        }
        CGContextAddLines(context, points, sizeof(points) / sizeof(*points));
      }

      CGContextSetFillColorWithColor(context, currentColor.CGColor);
      CGContextFillPath(context);
    }

    CGPathRelease(insetPath);
  }];

  if (makeStretchable) {
    image = [image resizableImageWithCapInsets:edgeInsets];
  }

  return image;
}

// Currently, the dashed / dotted implementation only supports a single colour,
// as that's currently required and supported on Android.
//
// Supporting individual widths + colours on each side is possible by modifying
// the current implementation. The idea is that we will draw four different lines
// and clip appropriately for each side (might require adjustment of phase so that
// they line up but even browsers don't do a good job at that).
//
// Firstly, create two paths for the outer and inner paths. The inner path is
// generated exactly the same way as the outer, just given an inset rect, derived
// from the insets on each side. Then clip using the odd-even rule
// (CGContextEOClip()). This will give us a nice rounded (possibly) clip mask.
//
// +----------------------------------+
// |@@@@@@@@  Clipped Space  @@@@@@@@@|
// |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
// |@@+----------------------+@@@@@@@@|
// |@@|                      |@@@@@@@@|
// |@@|                      |@@@@@@@@|
// |@@|                      |@@@@@@@@|
// |@@+----------------------+@@@@@@@@|
// |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
// +----------------------------------+
//
// Afterwards, we create a clip path for each border side (CGContextSaveGState()
// and CGContextRestoreGState() when drawing each side). The clip mask for each
// segment is a trapezoid connecting corresponding edges of the inner and outer
// rects. For example, in the case of the top edge, the points would be:
// - (MinX(outer), MinY(outer))
// - (MaxX(outer), MinY(outer))
// - (MinX(inner) + topLeftRadius, MinY(inner) + topLeftRadius)
// - (MaxX(inner) - topRightRadius, MinY(inner) + topRightRadius)
//
//         +------------------+
//         |\                /|
//         | \              / |
//         |  \    top     /  |
//         |   \          /   |
//         |    \        /    |
//         |     +------+     |
//         |     |      |     |
//         |     |      |     |
//         |     |      |     |
//         |left |      |right|
//         |     |      |     |
//         |     |      |     |
//         |     +------+     |
//         |    /        \    |
//         |   /          \   |
//         |  /            \  |
//         | /    bottom    \ |
//         |/                \|
//         +------------------+
//
//
// Note that this approach will produce discontinuous colour changes at the edge
// (which is okay). The reason is that Quartz does not currently support drawing
// of gradients _along_ a path (NB: clipping a path and drawing a linear gradient
// is _not_ equivalent).

static UIImage *RCTGetDashedOrDottedBorderImage(
    RCTBorderStyle borderStyle,
    RCTCornerRadii cornerRadii,
    CGSize viewSize,
    UIEdgeInsets borderInsets,
    RCTBorderColors borderColors,
    UIColor *backgroundColor,
    BOOL drawToEdge)
{
  NSCParameterAssert(borderStyle == RCTBorderStyleDashed || borderStyle == RCTBorderStyleDotted);

  if (!RCTBorderColorsAreEqual(borderColors)) {
    RCTLogWarn(@"Unsupported dashed / dotted border style");
    return nil;
  }

  const CGFloat lineWidth = RCTMaxBorderInset(borderInsets);
  if (lineWidth <= 0.0) {
    return nil;
  }

  const BOOL hasCornerRadii = RCTCornerRadiiAreAboveThreshold(cornerRadii);
  UIGraphicsImageRenderer *const imageRenderer =
      RCTMakeUIGraphicsImageRenderer(viewSize, backgroundColor, hasCornerRadii, drawToEdge);
  return [imageRenderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull rendererContext) {
    const CGContextRef context = rendererContext.CGContext;
    const CGRect rect = {.size = viewSize};

    if (backgroundColor) {
      CGPathRef outerPath = RCTPathCreateOuterOutline(drawToEdge, rect, cornerRadii);
      CGContextAddPath(context, outerPath);
      CGPathRelease(outerPath);

      CGContextSetFillColorWithColor(context, backgroundColor.CGColor);
      CGContextFillPath(context);
    }

    // Stroking means that the width is divided in half and grows in both directions
    // perpendicular to the path, that's why we inset by half the width, so that it
    // reaches the edge of the rect.
    CGRect pathRect = CGRectInset(rect, lineWidth / 2.0, lineWidth / 2.0);
    CGPathRef path =
        RCTPathCreateWithRoundedRect(pathRect, RCTGetCornerInsets(cornerRadii, UIEdgeInsetsZero), NULL, NO);

    if (!RCTBorderInsetsAreEqual(borderInsets)) {
      CGContextSaveGState(context);
      {
        // Create a path representing the full rect
        CGMutablePathRef outerPath = CGPathCreateMutable();
        CGPathAddRect(outerPath, NULL, rect);

        CGRect insetRect = CGRectMake(
            rect.origin.x + borderInsets.left,
            rect.origin.y + borderInsets.top,
            rect.size.width - borderInsets.left - borderInsets.right,
            rect.size.height - borderInsets.top - borderInsets.bottom);

        // The padding edge (inner border) radius is the outer border radius minus the corresponding border thickness
        CGPathRef innerRoundedRect =
            RCTPathCreateWithRoundedRect(insetRect, RCTGetCornerInsets(cornerRadii, borderInsets), NULL, NO);

        // Add both paths to outerPath
        CGPathAddPath(outerPath, NULL, innerRoundedRect);

        // Clip using even-odd
        CGContextAddPath(context, outerPath);
        CGContextEOClip(context);
        CGPathRelease(outerPath);
        CGPathRelease(innerRoundedRect);
      }
    }

    CGFloat dashLengths[2];
    dashLengths[0] = dashLengths[1] = (borderStyle == RCTBorderStyleDashed ? 3 : 1) * lineWidth;

    CGContextSetLineWidth(context, lineWidth);
    CGContextSetLineDash(context, 0, dashLengths, sizeof(dashLengths) / sizeof(*dashLengths));

    CGContextSetStrokeColorWithColor(context, [UIColor yellowColor].CGColor);

    CGContextAddPath(context, path);
    CGContextSetStrokeColorWithColor(context, borderColors.top.CGColor);
    CGContextStrokePath(context);

    CGPathRelease(path);
  }];
}

UIImage *RCTGetBorderImage(
    RCTBorderStyle borderStyle,
    CGSize viewSize,
    RCTCornerRadii cornerRadii,
    UIEdgeInsets borderInsets,
    RCTBorderColors borderColors,
    UIColor *backgroundColor,
    BOOL drawToEdge)
{
  switch (borderStyle) {
    case RCTBorderStyleSolid:
      return RCTGetSolidBorderImage(cornerRadii, viewSize, borderInsets, borderColors, backgroundColor, drawToEdge);
    case RCTBorderStyleDashed:
    case RCTBorderStyleDotted:
      return RCTGetDashedOrDottedBorderImage(
          borderStyle, cornerRadii, viewSize, borderInsets, borderColors, backgroundColor, drawToEdge);
    case RCTBorderStyleUnset:
      break;
  }

  return nil;
}
