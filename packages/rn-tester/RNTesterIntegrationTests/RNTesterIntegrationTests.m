/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>

#define RCT_TEST(name)                     \
  -(void)test##name                        \
  {                                        \
    [_runner runTest:_cmd module:@ #name]; \
  }

#define RCT_TEST_ONLY_WITH_PACKAGER(name)    \
  -(void)test##name                          \
  {                                          \
    if (getenv("CI_USE_PACKAGER")) {         \
      [_runner runTest:_cmd module:@ #name]; \
    }                                        \
  }

@interface RNTesterIntegrationTests : XCTestCase

@end

@implementation RNTesterIntegrationTests {
  RCTTestRunner *_runner;
}

- (void)setUp
{
  _runner = RCTInitRunnerForApp(@"IntegrationTests/IntegrationTestsApp", nil, nil);
  _runner.recordMode = NO;
}

#pragma mark - Test harness

// Disabled due to test being based on deprecated RCTBridge
- (void)disabled_testTheTester_waitOneFrame
{
  [_runner runTest:_cmd
                  module:@"IntegrationTestHarnessTest"
            initialProps:@{@"waitOneFrame" : @YES}
      configurationBlock:nil];
}

// Disabled
//- (void)testTheTester_ExpectError
//{
//  [_runner runTest:_cmd
//            module:@"IntegrationTestHarnessTest"
//      initialProps:@{@"shouldThrow": @YES}
// configurationBlock:nil
//  expectErrorRegex:@"because shouldThrow"];
//}

#pragma mark - JS tests

// This list should be kept in sync with IntegrationTestsApp.js
// RCT_TEST(IntegrationTestHarnessTest) // Disabled due to test being based on deprecated RCTBridge
// RCT_TEST(TimersTest) // Disabled due to issue introduced in 61346d3
// RCT_TEST(AppEventsTest) // Disabled due to test being based on deprecated RCTBridge
// RCT_TEST(ImageCachePolicyTest) // This test never passed.
// RCT_TEST(ImageSnapshotTest) // Disabled due to test being based on deprecated RCTBridge
// RCT_TEST(LayoutEventsTest) // Disabled due to flakiness: #8686784
// RCT_TEST(SimpleSnapshotTest) // Disabled due to test being based on deprecated RCTBridge
// RCT_TEST(SyncMethodTest) // Disabled due to test being based on deprecated RCTBridge
// RCT_TEST(PromiseTest) // Disabled due to test being based on deprecated RCTBridge
// RCT_TEST_ONLY_WITH_PACKAGER(WebSocketTest) // Disabled due to test being based on deprecated RCTBridge; Requires a
// WebSocket test server, see scripts/objc-test.sh

// RCT_TEST(GlobalEvalWithSourceUrlTest) // Disabled due to test being based on deprecated RCTBridge

@end
