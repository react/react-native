/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTFileReaderModule.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>

#import <React/RCTArrayBuffer.h>
#import <React/RCTBlobManager.h>

#import "RCTBlobPlugins.h"

static NSString *const kRCTFileReaderInvalidBlobError = @"ERROR_INVALID_BLOB";

@interface RCTFileReaderModule () <NativeFileReaderModuleSpec>
@end

@implementation RCTFileReaderModule

RCT_EXPORT_MODULE(FileReaderModule)

@synthesize moduleRegistry = _moduleRegistry;

- (void)readAsText:(JS::NativeFileReaderModule::BlobDescriptor &)blob
          encoding:(NSString *)encoding
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  NSString *blobId = blob.blobId();
  NSInteger offset = (NSInteger)blob.offset();
  NSInteger size = (NSInteger)blob.size();

  RCTBlobManager *blobManager = [_moduleRegistry moduleForName:"BlobModule"];
  dispatch_async(blobManager.methodQueue, ^{
    NSData *data = [blobManager resolve:blobId offset:offset size:size];

    if (data == nil) {
      reject(RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to resolve data for blob: %@", blobId], nil);
    } else {
      NSStringEncoding stringEncoding;

      if (encoding == nil) {
        stringEncoding = NSUTF8StringEncoding;
      } else {
        stringEncoding =
            CFStringConvertEncodingToNSStringEncoding(CFStringConvertIANACharSetNameToEncoding((CFStringRef)encoding));
      }

      NSString *text = [[NSString alloc] initWithData:data encoding:stringEncoding];

      resolve(text);
    }
  });
}

- (void)readAsDataURL:(JS::NativeFileReaderModule::BlobDescriptor &)blob
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject
{
  NSString *blobId = blob.blobId();
  NSInteger offset = (NSInteger)blob.offset();
  NSInteger size = (NSInteger)blob.size();
  NSString *type = blob.type();

  RCTBlobManager *blobManager = [_moduleRegistry moduleForName:"BlobModule"];
  dispatch_async(blobManager.methodQueue, ^{
    NSData *data = [blobManager resolve:blobId offset:offset size:size];

    if (data == nil) {
      reject(RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to resolve data for blob: %@", blobId], nil);
    } else {
      NSString *text = [NSString stringWithFormat:@"data:%@;base64,%@",
                                                  type != nil && [type length] > 0 ? type : @"application/octet-stream",
                                                  [data base64EncodedStringWithOptions:0]];

      resolve(text);
    }
  });
}

- (void)readAsArrayBuffer:(JS::NativeFileReaderModule::BlobDescriptor &)blob
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
  NSString *blobId = blob.blobId();
  NSInteger offset = (NSInteger)blob.offset();
  NSInteger size = (NSInteger)blob.size();

  RCTBlobManager *blobManager = [_moduleRegistry moduleForName:"BlobModule"];
  dispatch_async(blobManager.methodQueue, ^{
    RCTArrayBuffer *buffer = [blobManager resolveBuffer:blobId offset:offset size:size];

    if (buffer == nil) {
      reject(kRCTFileReaderInvalidBlobError, @"The specified blob is invalid", nil);
    } else {
      resolve(buffer);
    }
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeFileReaderModuleSpecJSI>(params);
}

@end

Class RCTFileReaderModuleCls(void)
{
  return RCTFileReaderModule.class;
}
