/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInvalidating.h>
#import <React/RCTURLRequestHandler.h>

typedef NSURLSessionConfiguration *_Nullable (^NSURLSessionConfigurationProvider)(void);
/**
 *  The block provided via this function will provide the NSURLSessionConfiguration for all HTTP requests made by the
 * app.
 */
RCT_EXTERN void RCTSetCustomNSURLSessionConfigurationProvider(NSURLSessionConfigurationProvider /*provider*/);

typedef NSURLRequest *_Nullable (^RCTHTTPRequestInterceptor)(NSURLRequest *request);
/**
 * The block provided via this function can inspect/modify HTTP requests before
 * they are sent. Return a modified request to override, or nil to use the
 * original request unchanged.
 */
RCT_EXTERN void RCTSetCustomHTTPRequestInterceptor(RCTHTTPRequestInterceptor /*interceptor*/);

/**
 * This is the default RCTURLRequestHandler implementation for HTTP requests.
 */
@interface RCTHTTPRequestHandler : NSObject <RCTURLRequestHandler, RCTInvalidating>

@end
