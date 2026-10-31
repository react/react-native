/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTNetworking.h>
#import <React/RCTUtils.h>

#define RCT_RUN_RUNLOOP_WHILE(CONDITION)                                                            \
  {                                                                                                 \
    NSDate *timeout = [NSDate dateWithTimeIntervalSinceNow:30];                                     \
    NSRunLoop *runloop = [NSRunLoop mainRunLoop];                                                   \
    while ((CONDITION)) {                                                                           \
      [runloop runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.01]]; \
      if ([timeout timeIntervalSinceNow] <= 0) {                                                    \
        XCTFail(@"Runloop timed out before condition was met");                                     \
        break;                                                                                      \
      }                                                                                             \
    }                                                                                               \
  }

extern BOOL RCTIsGzippedData(NSData *__nullable data);

@interface RCTNetworking (Private)

- (void)buildRequest:(NSDictionary<NSString *, id> *)query completionBlock:(void (^)(NSURLRequest *request))block;

@end

@interface RCTGzipTests : XCTestCase

@end

@implementation RCTGzipTests

- (void)testGzip
{
  // set up data
  NSString *inputString = @"Hello World!";
  NSData *inputData = [inputString dataUsingEncoding:NSUTF8StringEncoding];

  // compress
  NSData *outputData = RCTGzipData(inputData, -1);
  XCTAssertTrue(RCTIsGzippedData(outputData));
}

- (void)testDontRezipZippedData
{
  // set up data
  NSString *inputString = @"Hello World!";
  NSData *inputData = [inputString dataUsingEncoding:NSUTF8StringEncoding];

  // compress
  NSData *compressedData = RCTGzipData(inputData, -1);
  inputString = [[NSString alloc] initWithData:compressedData encoding:NSUTF8StringEncoding];

  // compress again
  NSData *outputData = RCTGzipData(inputData, -1);
  NSString *outputString = [[NSString alloc] initWithData:outputData encoding:NSUTF8StringEncoding];
  XCTAssertEqualObjects(outputString, inputString);
}

// Disabled due to test being based on deprecated RCTBridge
- (void)disabled_testRequestBodyEncoding
{
  NSDictionary *query = @{
    @"url" : @"http://example.com",
    @"method" : @"POST",
    @"data" : @{@"string" : @"Hello World"},
    @"headers" : @{@"Content-Encoding" : @"gzip"},
  };

  RCTNetworking *networker = [RCTNetworking new];
  [networker setValue:dispatch_get_main_queue() forKey:@"methodQueue"];
  __block NSURLRequest *request = nil;
  [networker buildRequest:query
          completionBlock:^(NSURLRequest *_request) {
            request = _request;
          }];

  RCT_RUN_RUNLOOP_WHILE(request == nil);

  XCTAssertNotNil(request);
  XCTAssertNotNil(request.HTTPBody);
  XCTAssertTrue(RCTIsGzippedData(request.HTTPBody));
}

@end
