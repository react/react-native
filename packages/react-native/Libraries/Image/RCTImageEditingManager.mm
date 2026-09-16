/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageEditingManager.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTConvert.h>
#import <React/RCTImageLoader.h>
#import <React/RCTImageLoaderProtocol.h>
#import <React/RCTImageStoreManager.h>
#import <React/RCTImageUtils.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <UIKit/UIKit.h>

#import "RCTImagePlugins.h"

@interface RCTImageEditingManager () <NativeImageEditorSpec>
@end

@implementation RCTImageEditingManager

RCT_EXPORT_MODULE()

@synthesize moduleRegistry = _moduleRegistry;

/**
 * Crops an image and adds the result to the image store.
 *
 * @param imageRequest An image URL
 * @param cropData Dictionary with `offset`, `size` and `displaySize`.
 *        `offset` and `size` are relative to the full-resolution image size.
 *        `displaySize` is an optimization - if specified, the image will
 *        be scaled down to `displaySize` rather than `size`.
 *        All units are in px (not points).
 */
- (void)cropImage:(NSString *)imageRequestString
           cropData:(JS::NativeImageEditor::Options &)cropData
    successCallback:(RCTResponseSenderBlock)successCallback
      errorCallback:(RCTResponseSenderBlock)errorCallback
{
  NSURLRequest *imageRequest = [RCTConvert NSURLRequest:imageRequestString];

  CGRect rect = {
      [RCTConvert CGPoint:@{
        @"x" : @(cropData.offset().x()),
        @"y" : @(cropData.offset().y()),
      }],
      [RCTConvert CGSize:@{
        @"width" : @(cropData.size().width()),
        @"height" : @(cropData.size().height()),
      }]};

  // We must keep a copy of cropData so that we can access data from it at a later time
  JS::NativeImageEditor::Options cropDataCopy = cropData;

  [[_moduleRegistry moduleForName:"ImageLoader"]
      loadImageWithURLRequest:imageRequest
                     callback:^(NSError *error, UIImage *image) {
                       if (error) {
                         errorCallback(@[ RCTJSErrorFromNSError(error) ]);
                         return;
                       }

                       // Crop image
                       CGSize targetSize = rect.size;
                       CGRect targetRect = {{-rect.origin.x, -rect.origin.y}, image.size};
                       CGAffineTransform transform = RCTTransformFromTargetRect(image.size, targetRect);
                       UIImage *croppedImage = RCTTransformImage(image, targetSize, image.scale, transform);

                       // Scale image
                       if (cropDataCopy.displaySize()) {
                         targetSize = [RCTConvert CGSize:@{
                           @"width" : @(cropDataCopy.displaySize()->width()),
                           @"height" : @(cropDataCopy.displaySize()->height())
                         }]; // in pixels
                         RCTResizeMode resizeMode = [RCTConvert RCTResizeMode:cropDataCopy.resizeMode() ?: @"contain"];
                         targetRect = RCTTargetRect(croppedImage.size, targetSize, 1, resizeMode);
                         transform = RCTTransformFromTargetRect(croppedImage.size, targetRect);
                         croppedImage = RCTTransformImage(croppedImage, targetSize, image.scale, transform);
                       }

                       // Store image
                       [[self->_moduleRegistry moduleForName:"ImageStoreManager"]
                           storeImage:croppedImage
                            withBlock:^(NSString *croppedImageTag) {
                              if (!croppedImageTag) {
                                NSString *errorMessage = @"Error storing cropped image in RCTImageStoreManager";
                                RCTLogWarn(@"%@", errorMessage);
                                errorCallback(@[ RCTJSErrorFromNSError(RCTErrorWithMessage(errorMessage)) ]);
                                return;
                              }
                              successCallback(@[ croppedImageTag ]);
                            }];
                     }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeImageEditorSpecJSI>(params);
}

@end

Class RCTImageEditingManagerCls()
{
  return RCTImageEditingManager.class;
}
