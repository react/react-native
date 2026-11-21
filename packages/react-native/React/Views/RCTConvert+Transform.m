/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConvert+Transform.h"

static const NSUInteger kMatrixArrayLength = 4 * 4;

BOOL RCTIsFiniteTransform(CATransform3D transform)
{
  const CGFloat *entries = (const CGFloat *)&transform;
  for (NSUInteger i = 0; i < kMatrixArrayLength; i++) {
    if (!isfinite((float)entries[i])) {
      return NO;
    }
  }
  return YES;
}

static BOOL RCTIsNonFiniteLength(YGValue value)
{
  return (value.unit == YGUnitPoint || value.unit == YGUnitPercent) && !isfinite(value.value);
}

@implementation RCTConvert (Transform)

+ (CGFloat)convertToRadians:(id)json
{
  if ([json isKindOfClass:[NSString class]]) {
    NSString *stringValue = (NSString *)json;
    if ([stringValue hasSuffix:@"deg"]) {
      CGFloat degrees = [[stringValue substringToIndex:stringValue.length - 3] floatValue];
      return degrees * M_PI / 180;
    }
    if ([stringValue hasSuffix:@"rad"]) {
      // The C++ transform parser holds an angle with a unit in degrees, as a float.
      float degrees = [[stringValue substringToIndex:stringValue.length - 3] floatValue] * 57.295779513f;
      return degrees * M_PI / 180;
    }
  }
  return [json floatValue];
}

+ (CATransform3D)CATransform3DFromMatrix:(id)json
{
  CATransform3D transform = CATransform3DIdentity;
  if (!json) {
    return transform;
  }
  if (![json isKindOfClass:[NSArray class]]) {
    RCTLogConvertError(json, @"a CATransform3D. Expected array for transform matrix.");
    return transform;
  }
  if ([json count] != kMatrixArrayLength) {
    RCTLogConvertError(json, @"a CATransform3D. Expected 4x4 matrix array.");
    return transform;
  }
  for (NSUInteger i = 0; i < kMatrixArrayLength; i++) {
    // Read as a float, as every other operand is, so an entry past the largest float stays infinite.
    ((CGFloat *)&transform)[i] = (float)[RCTConvert CGFloat:json[i]];
  }
  return transform;
}

+ (CATransform3D)CATransform3D:(id)json
{
  CATransform3D transform = [self CATransform3DFromTransforms:json];
  // NaN and infinity are not CSS numbers, so a transform holding one is an invalid declaration and is ignored:
  // https://drafts.csswg.org/css-values-4/#numbers. Every non-finite operand but a perspective's makes the
  // matrix non-finite.
  return RCTIsFiniteTransform(transform) ? transform : CATransform3DIdentity;
}

+ (CATransform3D)CATransform3DFromTransforms:(id)json
{
  CATransform3D transform = CATransform3DIdentity;
  if (!json) {
    return transform;
  }
  if (![json isKindOfClass:[NSArray class]]) {
    RCTLogConvertError(json, @"a CATransform3D. Did you pass something other than an array?");
    return transform;
  }
  // legacy matrix support
  if ([(NSArray *)json count] == kMatrixArrayLength && [json[0] isKindOfClass:[NSNumber class]]) {
    RCTLogWarn(
        @"[RCTConvert CATransform3D:] has deprecated a matrix as input. Pass an array of configs (which can contain a matrix key) instead.");
    return [self CATransform3DFromMatrix:json];
  }

  CGFloat zeroScaleThreshold = FLT_EPSILON;

  CATransform3D next;
  for (NSDictionary *transformConfig in (NSArray<NSDictionary *> *)json) {
    if (transformConfig.count != 1) {
      RCTLogConvertError(json, @"a CATransform3D. You must specify exactly one property per transform object.");
      return transform;
    }
    NSString *property = transformConfig.allKeys[0];
    id value = transformConfig[property];

    if ([property isEqualToString:@"matrix"]) {
      next = [self CATransform3DFromMatrix:value];
      transform = CATransform3DConcat(next, transform);

    } else if ([property isEqualToString:@"perspective"]) {
      CGFloat perspective = [value floatValue];
      // -1 / ±Infinity is a finite m34, so the matrix's own check cannot see it.
      if (!isfinite(perspective)) {
        return CATransform3DIdentity;
      }
      // A depth from 0 up to 1px renders as 1px: https://drafts.csswg.org/css-transforms-2/#funcdef-perspective
      next = CATransform3DIdentity;
      next.m34 = -1 / (perspective >= 0 && perspective < 1 ? 1 : perspective);
      transform = CATransform3DConcat(next, transform);

    } else if ([property isEqualToString:@"rotateX"]) {
      CGFloat rotate = [self convertToRadians:value];
      transform = CATransform3DRotate(transform, rotate, 1, 0, 0);

    } else if ([property isEqualToString:@"rotateY"]) {
      CGFloat rotate = [self convertToRadians:value];
      transform = CATransform3DRotate(transform, rotate, 0, 1, 0);

    } else if ([property isEqualToString:@"rotate"] || [property isEqualToString:@"rotateZ"]) {
      CGFloat rotate = [self convertToRadians:value];
      transform = CATransform3DRotate(transform, rotate, 0, 0, 1);

    } else if ([property isEqualToString:@"scale"]) {
      CGFloat scale = [value floatValue];
      scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
      transform = CATransform3DScale(transform, scale, scale, 1);

    } else if ([property isEqualToString:@"scaleX"]) {
      CGFloat scale = [value floatValue];
      scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
      transform = CATransform3DScale(transform, scale, 1, 1);

    } else if ([property isEqualToString:@"scaleY"]) {
      CGFloat scale = [value floatValue];
      scale = ABS(scale) < zeroScaleThreshold ? zeroScaleThreshold : scale;
      transform = CATransform3DScale(transform, 1, scale, 1);

    } else if ([property isEqualToString:@"translate"]) {
      NSArray *array = (NSArray<NSNumber *> *)value;
      CGFloat translateX = [array[0] floatValue];
      CGFloat translateY = [array[1] floatValue];
      CGFloat translateZ = array.count > 2 ? [array[2] floatValue] : 0;
      transform = CATransform3DTranslate(transform, translateX, translateY, translateZ);

    } else if ([property isEqualToString:@"translateX"]) {
      CGFloat translate = [value floatValue];
      transform = CATransform3DTranslate(transform, translate, 0, 0);

    } else if ([property isEqualToString:@"translateY"]) {
      CGFloat translate = [value floatValue];
      transform = CATransform3DTranslate(transform, 0, translate, 0);

    } else if ([property isEqualToString:@"skewX"]) {
      CGFloat skew = [self convertToRadians:value];
      next = CATransform3DIdentity;
      next.m21 = tanf(skew);
      transform = CATransform3DConcat(next, transform);

    } else if ([property isEqualToString:@"skewY"]) {
      CGFloat skew = [self convertToRadians:value];
      next = CATransform3DIdentity;
      next.m12 = tanf(skew);
      transform = CATransform3DConcat(next, transform);

    } else {
      RCTLogInfo(@"Unsupported transform type for a CATransform3D: %@.", property);
    }
  }
  return transform;
}

+ (RCTTransformOrigin)RCTTransformOrigin:(id)json
{
  RCTTransformOrigin transformOrigin = {
      [RCTConvert YGValue:json[0]], [RCTConvert YGValue:json[1]], [RCTConvert CGFloat:json[2]]};
  // A non-finite origin converts as no origin does, and a view turns about its center for both.
  if (RCTIsNonFiniteLength(transformOrigin.x) || RCTIsNonFiniteLength(transformOrigin.y) ||
      !isfinite((float)transformOrigin.z)) {
    return (RCTTransformOrigin){YGValueUndefined, YGValueUndefined, 0};
  }
  return transformOrigin;
}

@end
