/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTImageURLLoader.h>
#import <React/RCTResizeMode.h>
#import <React/RCTURLRequestHandler.h>

/**
 * Provides the interface needed to register an image decoder. Image decoders
 * are also bridge modules, so should be registered using RCT_EXPORT_MODULE().
 */
@protocol RCTImageDataDecoder <RCTBridgeModule>

/**
 * Indicates whether this handler is capable of decoding the specified data.
 * Typically the handler would examine some sort of header data to determine
 * this.
 */
- (BOOL)canDecodeImageData:(NSData *)imageData;

/**
 * Decode an image from the data object. The method should call the
 * completionHandler when the decoding operation  has finished. The method
 * should also return a cancellation block, if applicable.
 *
 * If you provide a custom image decoder, you most implement scheduling yourself,
 * to avoid decoding large amounts of images at the same time.
 */
- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler;

@optional

/**
 * If more than one RCTImageDataDecoder responds YES to `-canDecodeImageData:`
 * then `decoderPriority` is used to determine which one to use. The decoder
 * with the highest priority will be selected. Default priority is zero.
 * If two or more valid decoders have the same priority, the selection order is
 * undefined.
 */
- (float)decoderPriority;

@end
