/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageUtils.h>

#import <cmath>

#import <ImageIO/ImageIO.h>
#import <MobileCoreServices/UTCoreTypes.h>

#import <React/RCTLog.h>
#import <React/RCTUtils.h>

static CGFloat RCTCeilValue(CGFloat value, CGFloat scale)
{
  return ceil(value * scale) / scale;
}

static CGFloat RCTFloorValue(CGFloat value, CGFloat scale)
{
  return floor(value * scale) / scale;
}

static CGSize RCTCeilSize(CGSize size, CGFloat scale)
{
  return (CGSize){RCTCeilValue(size.width, scale), RCTCeilValue(size.height, scale)};
}

static CGImagePropertyOrientation CGImagePropertyOrientationFromUIImageOrientation(UIImageOrientation imageOrientation)
{
  // see https://stackoverflow.com/a/6699649/496389
  switch (imageOrientation) {
    case UIImageOrientationUp:
      return kCGImagePropertyOrientationUp;
    case UIImageOrientationDown:
      return kCGImagePropertyOrientationDown;
    case UIImageOrientationLeft:
      return kCGImagePropertyOrientationLeft;
    case UIImageOrientationRight:
      return kCGImagePropertyOrientationRight;
    case UIImageOrientationUpMirrored:
      return kCGImagePropertyOrientationUpMirrored;
    case UIImageOrientationDownMirrored:
      return kCGImagePropertyOrientationDownMirrored;
    case UIImageOrientationLeftMirrored:
      return kCGImagePropertyOrientationLeftMirrored;
    case UIImageOrientationRightMirrored:
      return kCGImagePropertyOrientationRightMirrored;
    default:
      return kCGImagePropertyOrientationUp;
  }
}

static UIImageOrientation UIImageOrientationFromCGImagePropertyOrientation(CGImagePropertyOrientation imageOrientation)
{
  switch (imageOrientation) {
    case kCGImagePropertyOrientationUp:
      return UIImageOrientationUp;
    case kCGImagePropertyOrientationDown:
      return UIImageOrientationDown;
    case kCGImagePropertyOrientationLeft:
      return UIImageOrientationLeft;
    case kCGImagePropertyOrientationRight:
      return UIImageOrientationRight;
    case kCGImagePropertyOrientationUpMirrored:
      return UIImageOrientationUpMirrored;
    case kCGImagePropertyOrientationDownMirrored:
      return UIImageOrientationDownMirrored;
    case kCGImagePropertyOrientationLeftMirrored:
      return UIImageOrientationLeftMirrored;
    case kCGImagePropertyOrientationRightMirrored:
      return UIImageOrientationRightMirrored;
    default:
      return UIImageOrientationUp;
  }
}

CGRect RCTTargetRect(CGSize sourceSize, CGSize destSize, CGFloat destScale, RCTResizeMode resizeMode)
{
  if (CGSizeEqualToSize(destSize, CGSizeZero)) {
    // Assume we require the largest size available
    return (CGRect){CGPointZero, sourceSize};
  }

  CGFloat aspect = sourceSize.width / sourceSize.height;
  // If only one dimension in destSize is non-zero (for example, an Image
  // with `flex: 1` whose height is indeterminate), calculate the unknown
  // dimension based on the aspect ratio of sourceSize
  if (destSize.width == 0) {
    destSize.width = destSize.height * aspect;
  }
  if (destSize.height == 0) {
    destSize.height = destSize.width / aspect;
  }

  // Calculate target aspect ratio if needed
  CGFloat targetAspect = 0.0;
  if (resizeMode != RCTResizeModeCenter && resizeMode != RCTResizeModeStretch) {
    targetAspect = destSize.width / destSize.height;
    if (aspect == targetAspect) {
      resizeMode = RCTResizeModeStretch;
    }
  }

  switch (resizeMode) {
    case RCTResizeModeStretch:
    case RCTResizeModeRepeat:
    case RCTResizeModeNone:

      return (CGRect){CGPointZero, RCTCeilSize(destSize, destScale)};

    case RCTResizeModeContain:

      if (targetAspect <= aspect) { // target is taller than content

        sourceSize.width = destSize.width;
        sourceSize.height = sourceSize.width / aspect;

      } else { // target is wider than content

        sourceSize.height = destSize.height;
        sourceSize.width = sourceSize.height * aspect;
      }
      return (CGRect){{
                          RCTFloorValue((destSize.width - sourceSize.width) / 2, destScale),
                          RCTFloorValue((destSize.height - sourceSize.height) / 2, destScale),
                      },
                      RCTCeilSize(sourceSize, destScale)};

    case RCTResizeModeCover:

      if (targetAspect <= aspect) { // target is taller than content

        sourceSize.height = destSize.height;
        sourceSize.width = sourceSize.height * aspect;
        destSize.width = destSize.height * targetAspect;
        return (CGRect){{RCTFloorValue((destSize.width - sourceSize.width) / 2, destScale), 0},
                        RCTCeilSize(sourceSize, destScale)};

      } else { // target is wider than content

        sourceSize.width = destSize.width;
        sourceSize.height = sourceSize.width / aspect;
        destSize.height = destSize.width / targetAspect;
        return (CGRect){{0, RCTFloorValue((destSize.height - sourceSize.height) / 2, destScale)},
                        RCTCeilSize(sourceSize, destScale)};
      }

    case RCTResizeModeCenter:

      // Make sure the image is not clipped by the target.
      if (sourceSize.height > destSize.height) {
        sourceSize.width = destSize.width;
        sourceSize.height = sourceSize.width / aspect;
      }
      if (sourceSize.width > destSize.width) {
        sourceSize.height = destSize.height;
        sourceSize.width = sourceSize.height * aspect;
      }

      return (CGRect){{
                          RCTFloorValue((destSize.width - sourceSize.width) / 2, destScale),
                          RCTFloorValue((destSize.height - sourceSize.height) / 2, destScale),
                      },
                      RCTCeilSize(sourceSize, destScale)};
  }
}

CGAffineTransform RCTTransformFromTargetRect(CGSize sourceSize, CGRect targetRect)
{
  CGAffineTransform transform = CGAffineTransformIdentity;
  transform = CGAffineTransformTranslate(transform, targetRect.origin.x, targetRect.origin.y);
  transform = CGAffineTransformScale(
      transform, targetRect.size.width / sourceSize.width, targetRect.size.height / sourceSize.height);
  return transform;
}

CGSize RCTTargetSize(
    CGSize sourceSize,
    CGFloat sourceScale,
    CGSize destSize,
    CGFloat destScale,
    RCTResizeMode resizeMode,
    BOOL allowUpscaling)
{
  switch (resizeMode) {
    case RCTResizeModeCenter:

      return RCTTargetRect(sourceSize, destSize, destScale, resizeMode).size;

    case RCTResizeModeStretch:

      if (!allowUpscaling) {
        CGFloat scale = sourceScale / destScale;
        destSize.width = MIN(sourceSize.width * scale, destSize.width);
        destSize.height = MIN(sourceSize.height * scale, destSize.height);
      }
      return RCTCeilSize(destSize, destScale);

    default: {
      // Get target size
      CGSize size = RCTTargetRect(sourceSize, destSize, destScale, resizeMode).size;
      if (!allowUpscaling) {
        // return sourceSize if target size is larger
        if (sourceSize.width * sourceScale < size.width * destScale) {
          return sourceSize;
        }
      }
      return size;
    }
  }
}

BOOL RCTUpscalingRequired(
    CGSize sourceSize,
    CGFloat sourceScale,
    CGSize destSize,
    CGFloat destScale,
    RCTResizeMode resizeMode)
{
  if (CGSizeEqualToSize(destSize, CGSizeZero)) {
    // Assume we require the largest size available
    return YES;
  }

  // Precompensate for scale
  CGFloat scale = sourceScale / destScale;
  sourceSize.width *= scale;
  sourceSize.height *= scale;

  // Calculate aspect ratios if needed (don't bother if resizeMode == stretch)
  CGFloat aspect = 0.0;
  CGFloat targetAspect = 0.0;
  if (resizeMode != RCTResizeModeStretch) {
    aspect = sourceSize.width / sourceSize.height;
    targetAspect = destSize.width / destSize.height;
    if (aspect == targetAspect) {
      resizeMode = RCTResizeModeStretch;
    }
  }

  switch (resizeMode) {
    case RCTResizeModeStretch:

      return destSize.width > sourceSize.width || destSize.height > sourceSize.height;

    case RCTResizeModeContain:

      if (targetAspect <= aspect) { // target is taller than content

        return destSize.width > sourceSize.width;

      } else { // target is wider than content

        return destSize.height > sourceSize.height;
      }

    case RCTResizeModeCover:

      if (targetAspect <= aspect) { // target is taller than content

        return destSize.height > sourceSize.height;

      } else { // target is wider than content

        return destSize.width > sourceSize.width;
      }

    case RCTResizeModeRepeat:
    case RCTResizeModeCenter:
    case RCTResizeModeNone:

      return NO;
  }
}

UIImage *__nullable RCTDecodeImageWithData(NSData *data, CGSize destSize, CGFloat destScale, RCTResizeMode resizeMode)
{
  CGImageSourceRef sourceRef = CGImageSourceCreateWithData((__bridge CFDataRef)data, NULL);
  if (!sourceRef) {
    return nil;
  }

  // Get original image size
  CFDictionaryRef imageProperties = CGImageSourceCopyPropertiesAtIndex(sourceRef, 0, NULL);
  if (!imageProperties) {
    CFRelease(sourceRef);
    return nil;
  }
  NSNumber *width = (NSNumber *)CFDictionaryGetValue(imageProperties, kCGImagePropertyPixelWidth);
  NSNumber *height = (NSNumber *)CFDictionaryGetValue(imageProperties, kCGImagePropertyPixelHeight);
  NSNumber *orientationNum = (NSNumber *)CFDictionaryGetValue(imageProperties, kCGImagePropertyOrientation);
  CGSize sourceSize = {width.doubleValue, height.doubleValue};
  CFRelease(imageProperties);

  if (CGSizeEqualToSize(destSize, CGSizeZero)) {
    destSize = sourceSize;
    if (!destScale) {
      destScale = 1;
    }
  } else if (!destScale) {
    destScale = RCTScreenScale();
  }

  if (resizeMode == RCTResizeModeStretch) {
    // Decoder cannot change aspect ratio, so RCTResizeModeStretch is equivalent
    // to RCTResizeModeCover for our purposes
    resizeMode = RCTResizeModeCover;
  }

  // Calculate target size
  CGSize targetSize = RCTTargetSize(sourceSize, 1, destSize, destScale, resizeMode, NO);
  CGSize targetPixelSize = RCTSizeInPixels(targetSize, destScale);
  CGImageRef imageRef;
  BOOL createThumbnail = targetPixelSize.width != 0 && targetPixelSize.height != 0 &&
      (sourceSize.width > targetPixelSize.width || sourceSize.height > targetPixelSize.height);
  UIImageOrientation orientation = UIImageOrientationUp;

  if (createThumbnail) {
    CGFloat maxPixelSize = fmax(targetPixelSize.width, targetPixelSize.height);

    // Get a thumbnail of the source image. This is usually slower than creating a full-sized image,
    // but takes up less memory once it's done.
    // It rotates the image according to the orientation from metadata, so we'll pass `UIImageOrientationUp`
    // to the `UIImage` initializer
    imageRef = CGImageSourceCreateThumbnailAtIndex(
        sourceRef, 0, (__bridge CFDictionaryRef) @{
          (id)kCGImageSourceShouldAllowFloat : @YES,
          (id)kCGImageSourceCreateThumbnailWithTransform : @YES,
          (id)kCGImageSourceCreateThumbnailFromImageAlways : @YES,
          (id)kCGImageSourceThumbnailMaxPixelSize : @(maxPixelSize),
        });
  } else {
    // Get an image in full size. This is faster than `CGImageSourceCreateThumbnailAtIndex`
    // and consumes less memory if only the target size doesn't require downscaling.
    imageRef = CGImageSourceCreateImageAtIndex(
        sourceRef, 0, (__bridge CFDictionaryRef) @{
          (id)kCGImageSourceShouldAllowFloat : @YES,
        });

    // Unlike `CGImageSourceCreateThumbnailAtIndex` (with `kCGImageSourceCreateThumbnailWithTransform` set to YES),
    // `CGImageSourceCreateImageAtIndex` doesn't rotate the image to keep the orientation, so we'll need to pass
    // the actual orientation (if present) to the `UIImage` initializer
    if (orientationNum) {
      orientation = UIImageOrientationFromCGImagePropertyOrientation(
          (CGImagePropertyOrientation)[orientationNum unsignedIntValue]);
    }
  }

  CFRelease(sourceRef);
  if (!imageRef) {
    return nil;
  }

  // Return image
  UIImage *image = [UIImage imageWithCGImage:imageRef scale:destScale orientation:orientation];
  CGImageRelease(imageRef);
  return image;
}

NSDictionary<NSString *, id> *__nullable RCTGetImageMetadata(NSData *data)
{
  CGImageSourceRef sourceRef = CGImageSourceCreateWithData((__bridge CFDataRef)data, NULL);
  if (!sourceRef) {
    return nil;
  }
  CFDictionaryRef imageProperties = CGImageSourceCopyPropertiesAtIndex(sourceRef, 0, NULL);
  CFRelease(sourceRef);
  return (__bridge_transfer id)imageProperties;
}

NSData *__nullable RCTGetImageData(UIImage *image, float quality)
{
  CGImageRef cgImage = image.CGImage;
  if (!cgImage) {
    return NULL;
  }
  NSMutableDictionary *properties = [[NSMutableDictionary alloc] initWithDictionary:@{
    (id)kCGImagePropertyOrientation : @(CGImagePropertyOrientationFromUIImageOrientation(image.imageOrientation))
  }];
  CGImageDestinationRef destination;
  CFMutableDataRef imageData = CFDataCreateMutable(NULL, 0);
  if (RCTImageHasAlpha(cgImage)) {
    // get png data
    destination = CGImageDestinationCreateWithData(imageData, kUTTypePNG, 1, NULL);
  } else {
    // get jpeg data
    destination = CGImageDestinationCreateWithData(imageData, kUTTypeJPEG, 1, NULL);
    [properties setValue:@(quality) forKey:(id)kCGImageDestinationLossyCompressionQuality];
  }
  if (!destination) {
    CFRelease(imageData);
    return NULL;
  }
  CGImageDestinationAddImage(destination, cgImage, (__bridge CFDictionaryRef)properties);
  if (!CGImageDestinationFinalize(destination)) {
    CFRelease(imageData);
    imageData = NULL;
  }
  CFRelease(destination);
  return (__bridge_transfer NSData *)imageData;
}

UIImage *__nullable RCTTransformImage(UIImage *image, CGSize destSize, CGFloat destScale, CGAffineTransform transform)
{
  if (destSize.width <= 0 | destSize.height <= 0 || destScale <= 0) {
    return nil;
  }

  BOOL opaque = !RCTImageHasAlpha(image.CGImage);
  UIGraphicsImageRendererFormat *const rendererFormat = [UIGraphicsImageRendererFormat defaultFormat];
  rendererFormat.opaque = opaque;
  rendererFormat.scale = destScale;
  UIGraphicsImageRenderer *const renderer = [[UIGraphicsImageRenderer alloc] initWithSize:destSize
                                                                                   format:rendererFormat];
  return [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull context) {
    CGContextConcatCTM(context.CGContext, transform);
    [image drawAtPoint:CGPointZero];
  }];
}

BOOL RCTImageHasAlpha(CGImageRef image)
{
  switch (CGImageGetAlphaInfo(image)) {
    case kCGImageAlphaNone:
    case kCGImageAlphaNoneSkipLast:
    case kCGImageAlphaNoneSkipFirst:
      return NO;
    default:
      return YES;
  }
}
