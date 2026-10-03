/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTPackagerClient.h>
#import <React/RCTPackagerConnection.h>
#import <React/RCTReconnectingWebSocket.h>

@interface RCTPackagerConnection (Testing)

- (void)reconnectingWebSocket:(RCTReconnectingWebSocket *)webSocket didReceiveMessage:(id)message;

@end

@interface RCTPackagerConnectionTests : XCTestCase

@end

@implementation RCTPackagerConnectionTests

- (void)testIgnoresBinaryMessages
{
  RCTPackagerConnection *connection = [RCTPackagerConnection new];
  NSData *message = [@"{}" dataUsingEncoding:NSUTF8StringEncoding];

  XCTAssertNoThrow([connection reconnectingWebSocket:nil didReceiveMessage:message]);
}

- (void)testIgnoresNonObjectMessages
{
  RCTPackagerConnection *connection = [RCTPackagerConnection new];

  XCTAssertNoThrow([connection reconnectingWebSocket:nil didReceiveMessage:@"[]"]);
}

- (void)testDispatchesValidNotification
{
  XCTestExpectation *expectation = [self expectationWithDescription:@"Notification handler is called"];
  __block NSDictionary<NSString *, id> *receivedParams;
  RCTPackagerConnection *connection = [RCTPackagerConnection new];
  dispatch_queue_t queue = dispatch_queue_create("RCTPackagerConnectionTests", DISPATCH_QUEUE_SERIAL);

  [connection addNotificationHandler:^(NSDictionary<NSString *, id> *params) {
    receivedParams = params;
    [expectation fulfill];
  }
                                      queue:queue
                                  forMethod:@"reload"];

  NSString *message = [NSString stringWithFormat:
                                 @"{\"version\":%d,\"method\":\"reload\",\"params\":{\"value\":1}}",
                                 RCT_PACKAGER_CLIENT_PROTOCOL_VERSION];
  [connection reconnectingWebSocket:nil didReceiveMessage:message];

  [self waitForExpectations:@[ expectation ] timeout:1.0];
  XCTAssertEqualObjects(receivedParams, (@{ @"value" : @1 }));
}

@end
