/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <React/RCTAccessibilityManager+Internal.h>
#import <React/RCTAccessibilityManager.h>
#import <React/RCTBridgeModule.h>

// The native module method JS calls, from the generated spec.
@interface RCTAccessibilityManager (RCTAccessibilityManagerTimeoutTests)

- (void)getRecommendedTimeoutMillis:(double)mSec onSuccess:(RCTResponseSenderBlock)onSuccess;

@end

@interface RCTAccessibilityManagerTimeoutTests : XCTestCase

@end

@implementation RCTAccessibilityManagerTimeoutTests

- (NSNumber *)recommendedTimeoutOf:(RCTAccessibilityManager *)manager for:(double)mSec
{
  __block NSNumber *timeout = nil;
  [manager getRecommendedTimeoutMillis:mSec
                             onSuccess:^(NSArray *response) {
                               timeout = response.firstObject;
                             }];
  return timeout;
}

- (void)testTimeoutIsThreeTimesLongerWhileSwitchControlIsRunning
{
  RCTAccessibilityManager *manager = [RCTAccessibilityManager new];
  XCTAssertNotNil(manager);
  RCTAccessibilityManagerSetSwitchControlReader(manager, ^BOOL {
    return YES;
  });

  XCTAssertEqualObjects([self recommendedTimeoutOf:manager for:4000], @12000);
  XCTAssertEqualObjects([self recommendedTimeoutOf:manager for:0], @0);
}

- (void)testTimeoutIsUnchangedWhileSwitchControlIsNotRunning
{
  RCTAccessibilityManager *manager = [RCTAccessibilityManager new];
  XCTAssertNotNil(manager);
  RCTAccessibilityManagerSetSwitchControlReader(manager, ^BOOL {
    return NO;
  });

  XCTAssertEqualObjects([self recommendedTimeoutOf:manager for:4000], @4000);
  XCTAssertEqualObjects([self recommendedTimeoutOf:manager for:0], @0);
}

- (void)testReaderIsReadOnEveryCall
{
  RCTAccessibilityManager *manager = [RCTAccessibilityManager new];
  XCTAssertNotNil(manager);
  __block BOOL isSwitchControlRunning = NO;
  RCTAccessibilityManagerSetSwitchControlReader(manager, ^BOOL {
    return isSwitchControlRunning;
  });

  XCTAssertEqualObjects([self recommendedTimeoutOf:manager for:4000], @4000);
  isSwitchControlRunning = YES;
  XCTAssertEqualObjects([self recommendedTimeoutOf:manager for:4000], @12000);
}

- (void)testSeparateInstancesUseTheirOwnReaders
{
  RCTAccessibilityManager *managerA = [RCTAccessibilityManager new];
  RCTAccessibilityManager *managerB = [RCTAccessibilityManager new];
  XCTAssertNotNil(managerA);
  XCTAssertNotNil(managerB);
  RCTAccessibilityManagerSetSwitchControlReader(managerA, ^BOOL {
    return YES;
  });
  RCTAccessibilityManagerSetSwitchControlReader(managerB, ^BOOL {
    return NO;
  });

  XCTAssertEqualObjects([self recommendedTimeoutOf:managerA for:4000], @12000);
  XCTAssertEqualObjects([self recommendedTimeoutOf:managerB for:4000], @4000);
}

- (void)testWithoutAReaderTheSystemIsRead
{
  RCTAccessibilityManager *manager = [RCTAccessibilityManager new];
  XCTAssertNotNil(manager);
  NSNumber *expected = UIAccessibilityIsSwitchControlRunning() ? @12000 : @4000;

  XCTAssertEqualObjects([self recommendedTimeoutOf:manager for:4000], expected);

  RCTAccessibilityManagerSetSwitchControlReader(manager, ^BOOL {
    return !UIAccessibilityIsSwitchControlRunning();
  });
  XCTAssertNotEqualObjects([self recommendedTimeoutOf:manager for:4000], expected);

  RCTAccessibilityManagerSetSwitchControlReader(manager, nil);
  XCTAssertEqualObjects([self recommendedTimeoutOf:manager for:4000], expected);
}

@end
