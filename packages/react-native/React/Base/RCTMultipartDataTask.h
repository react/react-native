/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>
#import <React/RCTMultipartStreamReader.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^RCTMultipartDataTaskCallback)(
    NSInteger statusCode,
    NSDictionary *_Nullable headers,
    NSData *_Nullable content,
    NSError *_Nullable error,
    BOOL done);

typedef NSURLRequest *_Nullable (^RCTMultipartDataTaskRequestInterceptor)(NSURLRequest *request);
/**
 * The block provided via this function can inspect/modify multipart data task
 * requests before they are sent. Return a modified request to override, or nil
 * to use the original request unchanged.
 */
RCT_EXTERN void RCTSetCustomMultipartDataTaskRequestInterceptor(
    RCTMultipartDataTaskRequestInterceptor _Nullable /*interceptor*/);

@interface RCTMultipartDataTask : NSObject

- (instancetype)initWithURL:(NSURL *)url
                partHandler:(RCTMultipartDataTaskCallback)partHandler
            progressHandler:(nullable RCTMultipartProgressCallback)progressHandler;

- (void)startTask;

@end

NS_ASSUME_NONNULL_END
