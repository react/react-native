/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTNetworkTask.h>
#import <React/RCTURLRequestHandler.h>
#import <XCTest/XCTest.h>

@interface TestHandler<RCTURLRequestHandler> : NSObject
@end

@implementation TestHandler
- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return YES;
}
- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  return [[NSUUID UUID] UUIDString];
}
@end

@interface RCTNetworkTaskTests : XCTestCase

@end

@implementation RCTNetworkTaskTests

- (void)testCanReadTaskStatus
{
  NSURL *url = [[NSURL alloc] initWithString:@"https://developers.facebook.com"];
  NSURLRequest *request = [[NSURLRequest alloc] initWithURL:url];
  dispatch_queue_t callbackQueue =
      dispatch_queue_create("RCTNetworkTaskTests-testCanReadTaskStatus", DISPATCH_QUEUE_SERIAL);
  id<RCTURLRequestHandler> testHandler = (id<RCTURLRequestHandler>)[[TestHandler alloc] init];
  RCTNetworkTask *task = [[RCTNetworkTask alloc] initWithRequest:request
                                                         handler:testHandler
                                                   callbackQueue:callbackQueue];
  XCTAssertEqual(task.status, RCTNetworkTaskPending);
  [task start];
  XCTAssertEqual(task.status, RCTNetworkTaskInProgress);
  [task cancel];
  XCTAssertEqual(task.status, RCTNetworkTaskFinished);
}

- (void)testBuffersResponseDataByDefault
{
  RCTNetworkTask *task = [self createTask];
  XCTAssertTrue(task.buffersResponseData);

  NSMutableArray<NSNumber *> *progress = [NSMutableArray new];
  NSData *data = [self completeTask:task withChunks:@[ @"abc", @"def" ] progress:progress];

  XCTAssertEqualObjects([[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding], @"abcdef");
  XCTAssertEqualObjects(progress, (@[ @3, @6 ]));
}

- (void)testDoesNotBufferResponseDataWhenDisabled
{
  RCTNetworkTask *task = [self createTask];
  task.buffersResponseData = NO;

  NSMutableArray<NSNumber *> *progress = [NSMutableArray new];
  NSData *data = [self completeTask:task withChunks:@[ @"abc", @"def" ] progress:progress];

  XCTAssertNil(data);
  XCTAssertEqualObjects(progress, (@[ @3, @6 ]));
}

- (RCTNetworkTask *)createTask
{
  NSURL *url = [[NSURL alloc] initWithString:@"https://developers.facebook.com"];
  NSURLRequest *request = [[NSURLRequest alloc] initWithURL:url];
  dispatch_queue_t callbackQueue = dispatch_queue_create("RCTNetworkTaskTests", DISPATCH_QUEUE_SERIAL);
  id<RCTURLRequestHandler> testHandler = (id<RCTURLRequestHandler>)[[TestHandler alloc] init];
  return [[RCTNetworkTask alloc] initWithRequest:request handler:testHandler callbackQueue:callbackQueue];
}

/**
 * Feeds the chunks to the task the way a request handler would, and returns the data that the
 * completion block gets. Adds the progress that the incremental data block gets to `progress`.
 */
- (NSData *)completeTask:(RCTNetworkTask *)task
              withChunks:(NSArray<NSString *> *)chunks
                progress:(NSMutableArray<NSNumber *> *)progress
{
  __block NSData *completionData = nil;
  XCTestExpectation *completion = [self expectationWithDescription:@"completion block called"];
  task.incrementalDataBlock = ^(NSData *data, int64_t bytesReceived, int64_t total) {
    [progress addObject:@(bytesReceived)];
  };
  task.completionBlock = ^(NSURLResponse *response, NSData *data, NSError *error) {
    completionData = data;
    [completion fulfill];
  };

  [task start];
  id token = task.requestToken;
  for (NSString *chunk in chunks) {
    [task URLRequest:token didReceiveData:[chunk dataUsingEncoding:NSUTF8StringEncoding]];
  }
  [task URLRequest:token didCompleteWithError:nil];

  // The task calls the blocks on its callback queue, in order, so the progress is complete as well
  [self waitForExpectations:@[ completion ] timeout:1];
  return completionData;
}

@end
