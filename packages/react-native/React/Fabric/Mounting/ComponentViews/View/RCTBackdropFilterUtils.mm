/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBackdropFilterUtils.h"

#import <React/RCTConversions.h>
#import <react/renderer/graphics/Filter.h>

using namespace facebook::react;

@implementation RCTBackdropFilterUtils

+ (CIImage *)applyCIFilterFunctions:(const std::vector<FilterFunction> &)filterFunctions
                            toImage:(CIImage *)image
                              scale:(CGFloat)scale
{
  CIImage *result = image;
  for (const auto &primitive : filterFunctions) {
    if (primitive.type == FilterType::DropShadow) {
      continue;
    }
    CIFilter *filter = [self _ciFilterFromFilterFunction:primitive scale:scale];
    if (!filter) {
      continue;
    }
    CGRect extent = result.extent;
    CIImage *input = (primitive.type == FilterType::Blur) ? [result imageByClampingToExtent] : result;
    [filter setValue:input forKey:kCIInputImageKey];
    CIImage *output = filter.outputImage;
    if (output) {
      result = (primitive.type == FilterType::Blur) ? [output imageByCroppingToRect:extent] : output;
    }
  }
  return result;
}

// MARK: - Private

+ (nullable CIFilter *)_ciFilterFromFilterFunction:(const FilterFunction &)primitive scale:(CGFloat)scale
{
  if (!std::holds_alternative<Float>(primitive.parameters)) {
    return nil;
  }

  const Float value = std::get<Float>(primitive.parameters);

  switch (primitive.type) {
    case FilterType::Blur: {
      CIFilter *filter = [CIFilter filterWithName:@"CIGaussianBlur"];
      [filter setValue:@(value * scale) forKey:@"inputRadius"];
      return filter;
    }

    case FilterType::Brightness: {
      // CSS brightness(n) is multiplicative: 0=black, 1=normal, 2=double.
      // CIColorMatrix scales each RGB channel independently.
      CIFilter *filter = [CIFilter filterWithName:@"CIColorMatrix"];
      [filter setValue:[CIVector vectorWithX:value Y:0 Z:0 W:0] forKey:@"inputRVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:value Z:0 W:0] forKey:@"inputGVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:0 Z:value W:0] forKey:@"inputBVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:0 Z:0 W:1] forKey:@"inputAVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:0 Z:0 W:0] forKey:@"inputBiasVector"];
      return filter;
    }

    case FilterType::Contrast: {
      // CIColorControls.inputContrast: 0=gray, 1=normal, >1=more contrast.
      // Matches CSS contrast() semantics directly.
      CIFilter *filter = [CIFilter filterWithName:@"CIColorControls"];
      [filter setValue:@(value) forKey:@"inputContrast"];
      [filter setValue:@(0.0f) forKey:@"inputBrightness"];
      [filter setValue:@(1.0f) forKey:@"inputSaturation"];
      return filter;
    }

    case FilterType::Grayscale: {
      // CSS grayscale(0)=color, grayscale(1)=gray.
      // Map to CIColorControls: saturation = 1 - grayscaleAmount.
      CIFilter *filter = [CIFilter filterWithName:@"CIColorControls"];
      [filter setValue:@(1.0f - value) forKey:@"inputSaturation"];
      [filter setValue:@(0.0f) forKey:@"inputBrightness"];
      [filter setValue:@(1.0f) forKey:@"inputContrast"];
      return filter;
    }

    case FilterType::Saturate: {
      // CIColorControls.inputSaturation: 0=gray, 1=normal, >1=vibrant.
      // Matches CSS saturate() semantics directly.
      CIFilter *filter = [CIFilter filterWithName:@"CIColorControls"];
      [filter setValue:@(value) forKey:@"inputSaturation"];
      [filter setValue:@(0.0f) forKey:@"inputBrightness"];
      [filter setValue:@(1.0f) forKey:@"inputContrast"];
      return filter;
    }

    case FilterType::HueRotate: {
      // CIHueAdjust.inputAngle takes radians; CSS value arrives in degrees.
      CIFilter *filter = [CIFilter filterWithName:@"CIHueAdjust"];
      [filter setValue:@(value * M_PI / 180.0) forKey:@"inputAngle"];
      return filter;
    }

    case FilterType::Invert: {
      // CSS invert(n) in straight-alpha: R_out = (1-2n)*R_in + n
      // In premultiplied space (CIImage) the constant term n must be scaled by alpha
      // so that transparent pixels stay transparent: R_out_premult = (1-2n)*R_premult + n*A
      // This is expressed via the W (alpha) component of each RGB row — not a bias vector.
      const Float s = 1.0f - 2.0f * value;
      CIFilter *filter = [CIFilter filterWithName:@"CIColorMatrix"];
      [filter setValue:[CIVector vectorWithX:s Y:0 Z:0 W:value] forKey:@"inputRVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:s Z:0 W:value] forKey:@"inputGVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:0 Z:s W:value] forKey:@"inputBVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:0 Z:0 W:1] forKey:@"inputAVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:0 Z:0 W:0] forKey:@"inputBiasVector"];
      return filter;
    }

    case FilterType::Opacity: {
      // CSS opacity(n): A_out = n * A_in.
      CIFilter *filter = [CIFilter filterWithName:@"CIColorMatrix"];
      [filter setValue:[CIVector vectorWithX:1 Y:0 Z:0 W:0] forKey:@"inputRVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:1 Z:0 W:0] forKey:@"inputGVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:0 Z:1 W:0] forKey:@"inputBVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:0 Z:0 W:value] forKey:@"inputAVector"];
      [filter setValue:[CIVector vectorWithX:0 Y:0 Z:0 W:0] forKey:@"inputBiasVector"];
      return filter;
    }

    case FilterType::Sepia: {
      // CISepiaTone.inputIntensity: 0=no effect, 1=full sepia. Matches CSS sepia().
      CIFilter *filter = [CIFilter filterWithName:@"CISepiaTone"];
      [filter setValue:@(value) forKey:@"inputIntensity"];
      return filter;
    }

    case FilterType::DropShadow:
      return nil;
  }
}

@end
