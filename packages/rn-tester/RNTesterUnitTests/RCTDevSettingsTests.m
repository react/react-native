/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDevSettings.h>
#import <React/RCTReloadCommand.h>
#import <XCTest/XCTest.h>

#if RCT_DEV

@interface RCTDevSettings (Tests)
- (BOOL)_canHandlePackagerReload;
- (BOOL)_claimDevMenuForPackager:(NSString *)packager;
- (void)invalidate;
@end

@interface RCTDevSettingsTests : XCTestCase
@end

@implementation RCTDevSettingsTests {
  NSMutableArray<RCTDevSettings *> *_instances;
}

- (void)setUp
{
  [super setUp];
  _instances = [NSMutableArray new];
}

- (void)tearDown
{
  for (RCTDevSettings *instance in _instances) {
    [instance invalidate];
  }
  _instances = nil;
  [super tearDown];
}

- (RCTDevSettings *)newInstance
{
  RCTDevSettings *instance = [[RCTDevSettings alloc] initWithDataSource:nil];
  [_instances addObject:instance];
  return instance;
}

- (void)postReloadNotification
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTTriggerReloadCommandNotification object:nil];
}

- (void)testReloadRetiresEveryInstanceAndNotTheReplacement
{
  RCTDevSettings *a = [self newInstance];
  RCTDevSettings *b = [self newInstance];
  XCTAssertTrue([a _canHandlePackagerReload]);
  XCTAssertTrue([b _canHandlePackagerReload]);

  [self postReloadNotification];

  XCTAssertFalse([a _canHandlePackagerReload]);
  XCTAssertFalse([b _canHandlePackagerReload]);
  XCTAssertTrue([[self newInstance] _canHandlePackagerReload]);
}

- (void)testDevMenuOwnerOtherInstanceDoesNotBlockReload
{
  RCTDevSettings *a = [self newInstance];
  RCTDevSettings *b = [self newInstance];
  XCTAssertTrue([a _claimDevMenuForPackager:@"test-owner:8081"]);
  XCTAssertTrue([b _canHandlePackagerReload]);
}

- (void)testDevMenuHasOneOwnerPerPackager
{
  RCTDevSettings *a = [self newInstance];
  RCTDevSettings *b = [self newInstance];
  XCTAssertTrue([a _claimDevMenuForPackager:@"test-per-packager:8081"]);
  XCTAssertTrue([a _claimDevMenuForPackager:@"test-per-packager:8081"]);
  XCTAssertFalse([b _claimDevMenuForPackager:@"test-per-packager:8081"]);
  XCTAssertTrue([b _claimDevMenuForPackager:@"test-per-packager:8082"]);
}

- (void)testRetiredDevMenuOwnerDoesNotBlock
{
  RCTDevSettings *a = [self newInstance];
  RCTDevSettings *b = [self newInstance];
  XCTAssertTrue([a _claimDevMenuForPackager:@"test-retired:8081"]);

  [a invalidate];

  XCTAssertFalse([a _claimDevMenuForPackager:@"test-retired:8081"]);
  XCTAssertFalse([a _canHandlePackagerReload]);
  XCTAssertTrue([b _claimDevMenuForPackager:@"test-retired:8081"]);

  [self postReloadNotification];

  XCTAssertFalse([b _claimDevMenuForPackager:@"test-retired:8081"]);
  XCTAssertTrue([[self newInstance] _claimDevMenuForPackager:@"test-retired:8081"]);
}

@end

#endif
