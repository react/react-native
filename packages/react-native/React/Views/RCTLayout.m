/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <yoga/Yoga.h>

#import "RCTAssert.h"
#import "RCTShadowView+Layout.h"

RCTLayoutMetrics RCTLayoutMetricsFromYogaNode(YGNodeRef yogaNode)
{
  RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){(CGPoint){RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetLeft(yogaNode)),
                                    RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetTop(yogaNode))},
                          (CGSize){RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetWidth(yogaNode)),
                                   RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetHeight(yogaNode))}};

  UIEdgeInsets padding =
      (UIEdgeInsets){RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetPadding(yogaNode, YGEdgeTop)),
                     RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetPadding(yogaNode, YGEdgeLeft)),
                     RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetPadding(yogaNode, YGEdgeBottom)),
                     RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetPadding(yogaNode, YGEdgeRight))};

  UIEdgeInsets borderWidth =
      (UIEdgeInsets){RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetBorder(yogaNode, YGEdgeTop)),
                     RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetBorder(yogaNode, YGEdgeLeft)),
                     RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetBorder(yogaNode, YGEdgeBottom)),
                     RCTCoreGraphicsFloatFromYogaFloat(YGNodeLayoutGetBorder(yogaNode, YGEdgeRight))};

  UIEdgeInsets compoundInsets = (UIEdgeInsets){borderWidth.top + padding.top,
                                               borderWidth.left + padding.left,
                                               borderWidth.bottom + padding.bottom,
                                               borderWidth.right + padding.right};

  CGRect bounds = (CGRect){CGPointZero, frame.size};
  CGRect contentFrame = UIEdgeInsetsInsetRect(bounds, compoundInsets);

  layoutMetrics.frame = frame;
  layoutMetrics.borderWidth = borderWidth;
  layoutMetrics.contentFrame = contentFrame;
  layoutMetrics.displayType = RCTReactDisplayTypeFromYogaDisplayType(YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = RCTUIKitLayoutDirectionFromYogaLayoutDirection(YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return YGUndefined;
  }

  return value;
}

CGFloat RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat RCTCoreGraphicsFloatFromYogaValue(YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case YGUnitPoint:
      return RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case YGUnitPercent:
      return RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case YGUnitAuto:
    case YGUnitUndefined:
    case YGUnitMaxContent:
    case YGUnitFitContent:
    case YGUnitStretch:
      return baseFloatValue;
  }
}

YGDirection RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection RCTUIKitLayoutDirectionFromYogaLayoutDirection(YGDirection direction)
{
  switch (direction) {
    case YGDirectionInherit:
    case YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

YGDisplay RCTYogaDisplayTypeFromReactDisplayType(RCTDisplayType displayType)
{
  switch (displayType) {
    case RCTDisplayTypeNone:
      return YGDisplayNone;
    case RCTDisplayTypeFlex:
      return YGDisplayFlex;
    case RCTDisplayTypeInline:
      RCTAssert(NO, @"RCTDisplayTypeInline cannot be converted to YGDisplay value.");
      return YGDisplayNone;
  }
}

RCTDisplayType RCTReactDisplayTypeFromYogaDisplayType(YGDisplay displayType)
{
  switch (displayType) {
    case YGDisplayFlex:
    case YGDisplayContents:
    case YGDisplayGrid:
      return RCTDisplayTypeFlex;
    case YGDisplayNone:
      return RCTDisplayTypeNone;
    default:
      return RCTDisplayTypeFlex;
  }
}
