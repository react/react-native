/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageStoreManager.h>

#import <atomic>
#import <memory>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <ImageIO/ImageIO.h>
#import <MobileCoreServices/UTType.h>
#import <React/RCTAssert.h>
#import <React/RCTImageUtils.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import "RCTImagePlugins.h"

static NSString *const RCTImageStoreURLScheme = @"rct-image-store";

@interface RCTImageStoreManager () <NativeImageStoreIOSSpec>
@end

@implementation RCTImageStoreManager {
  NSMutableDictionary<NSString *, NSData *> *_store;
  NSUInteger _id;
}

@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (float)handlerPriority
{
  return 1;
}

- (void)removeImageForTag:(NSString *)imageTag withBlock:(void (^)(void))block
{
  dispatch_async(_methodQueue, ^{
    [self removeImageForTag:imageTag];
    if (block != nullptr) {
      block();
    }
  });
}

- (NSString *)_storeImageData:(NSData *)imageData
{
  RCTAssertThread(_methodQueue, @"Must be called on RCTImageStoreManager thread");

  if (_store == nullptr) {
    _store = [NSMutableDictionary new];
    _id = 0;
  }

  NSString *imageTag = [NSString stringWithFormat:@"%@://%tu", RCTImageStoreURLScheme, _id++];
  _store[imageTag] = imageData;
  return imageTag;
}

- (void)storeImageData:(NSData *)imageData withBlock:(void (^)(NSString *imageTag))block
{
  RCTAssertParam(block);
  dispatch_async(_methodQueue, ^{
    block([self _storeImageData:imageData]);
  });
}

- (void)getImageDataForTag:(NSString *)imageTag withBlock:(void (^)(NSData *imageData))block
{
  RCTAssertParam(block);
  dispatch_async(_methodQueue, ^{
    block(self->_store[imageTag]);
  });
}

- (void)storeImage:(UIImage *)image withBlock:(void (^)(NSString *imageTag))block
{
  RCTAssertParam(block);
  dispatch_async(_methodQueue, ^{
    NSString *imageTag = [self _storeImageData:RCTGetImageData(image, 0.75)];
    dispatch_async(dispatch_get_main_queue(), ^{
      block(imageTag);
    });
  });
}

- (void)removeImageForTag:(NSString *)imageTag
{
  [_store removeObjectForKey:imageTag];
}

- (void)hasImageForTag:(NSString *)imageTag callback:(RCTResponseSenderBlock)callback
{
  callback(@[ @(_store[imageTag] != nil) ]);
}

// TODO (#5906496): Name could be more explicit - something like getBase64EncodedDataForTag:?
- (void)getBase64ForTag:(NSString *)imageTag
        successCallback:(RCTResponseSenderBlock)successCallback
          errorCallback:(RCTResponseSenderBlock)errorCallback
{
  NSData *imageData = _store[imageTag];
  if (imageData == nullptr) {
    errorCallback(
        @[ RCTJSErrorFromNSError(RCTErrorWithMessage([NSString stringWithFormat:@"Invalid imageTag: %@", imageTag])) ]);
    return;
  }
  // Dispatching to a background thread to perform base64 encoding
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    successCallback(@[ [imageData base64EncodedStringWithOptions:0] ]);
  });
}

- (void)addImageFromBase64:(NSString *)base64String
           successCallback:(RCTResponseSenderBlock)successCallback
             errorCallback:(RCTResponseSenderBlock)errorCallback

{
  // Dispatching to a background thread to perform base64 decoding
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    NSData *imageData = [[NSData alloc] initWithBase64EncodedString:base64String options:0];
    if (imageData != nullptr) {
      dispatch_async(self->_methodQueue, ^{
        successCallback(@[ [self _storeImageData:imageData] ]);
      });
    } else {
      errorCallback(@[ RCTJSErrorFromNSError(RCTErrorWithMessage(@"Failed to add image from base64String")) ]);
    }
  });
}

#pragma mark - RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [request.URL.scheme caseInsensitiveCompare:RCTImageStoreURLScheme] == NSOrderedSame;
}

- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  __block auto cancelled = std::make_shared<std::atomic<bool>>(false);
  void (^cancellationBlock)(void) = ^{
    cancelled->store(true);
  };

  // Dispatch async to give caller time to cancel the request
  dispatch_async(_methodQueue, ^{
    if (cancelled->load()) {
      return;
    }

    NSString *imageTag = request.URL.absoluteString;
    NSData *imageData = self->_store[imageTag];
    if (imageData == nullptr) {
      NSError *error = RCTErrorWithMessage([NSString stringWithFormat:@"Invalid imageTag: %@", imageTag]);
      [delegate URLRequest:cancellationBlock didCompleteWithError:error];
      return;
    }

    CGImageSourceRef sourceRef = CGImageSourceCreateWithData((__bridge CFDataRef)imageData, NULL);
    if (sourceRef == nullptr) {
      NSError *error =
          RCTErrorWithMessage([NSString stringWithFormat:@"Unable to decode data for imageTag: %@", imageTag]);
      [delegate URLRequest:cancellationBlock didCompleteWithError:error];
      return;
    }
    CFStringRef UTI = CGImageSourceGetType(sourceRef);
    CFRelease(sourceRef);

    NSString *MIMEType = (__bridge_transfer NSString *)UTTypeCopyPreferredTagWithClass(UTI, kUTTagClassMIMEType);
    NSURLResponse *response = [[NSURLResponse alloc] initWithURL:request.URL
                                                        MIMEType:MIMEType
                                           expectedContentLength:imageData.length
                                                textEncodingName:nil];
    CFRelease(UTI);

    [delegate URLRequest:cancellationBlock didReceiveResponse:response];
    [delegate URLRequest:cancellationBlock didReceiveData:imageData];
    [delegate URLRequest:cancellationBlock didCompleteWithError:nil];
  });

  return cancellationBlock;
}

- (void)cancelRequest:(id)requestToken
{
  if (requestToken != nullptr) {
    ((void (^)(void))requestToken)();
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeImageStoreIOSSpecJSI>(params);
}

@end

@implementation RCTImageStoreManager (Deprecated)

- (NSString *)storeImage:(UIImage *)image
{
  RCTAssertMainQueue();
  RCTLogWarn(
      @"RCTImageStoreManager.storeImage() is deprecated and has poor performance. Use an alternative method instead.");
  __block NSString *imageTag;
  dispatch_sync(_methodQueue, ^{
    imageTag = [self _storeImageData:RCTGetImageData(image, 0.75)];
  });
  return imageTag;
}

- (UIImage *)imageForTag:(NSString *)imageTag
{
  RCTAssertMainQueue();
  RCTLogWarn(
      @"RCTImageStoreManager.imageForTag() is deprecated and has poor performance. Use an alternative method instead.");
  __block NSData *imageData;
  dispatch_sync(_methodQueue, ^{
    imageData = self->_store[imageTag];
  });
  return [UIImage imageWithData:imageData];
}

- (void)getImageForTag:(NSString *)imageTag withBlock:(void (^)(UIImage *image))block
{
  RCTAssertParam(block);
  dispatch_async(_methodQueue, ^{
    NSData *imageData = self->_store[imageTag];
    dispatch_async(dispatch_get_main_queue(), ^{
      // imageWithData: is not thread-safe, so we can't do this on methodQueue
      block([UIImage imageWithData:imageData]);
    });
  });
}

@end

@implementation RCTBridge (RCTImageStoreManager)

- (RCTImageStoreManager *)imageStoreManager
{
  return [self moduleForClass:[RCTImageStoreManager class]];
}

@end

@implementation RCTBridgeProxy (RCTImageStoreManager)

- (RCTImageStoreManager *)imageStoreManager
{
  return [self moduleForClass:[RCTImageStoreManager class]];
}

@end

Class RCTImageStoreManagerCls(void)
{
  return RCTImageStoreManager.class;
}
