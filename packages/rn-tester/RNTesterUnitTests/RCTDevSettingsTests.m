/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBundleManager.h>
#import <React/RCTDevSettings.h>
#import <React/RCTPackagerConnection.h>
#import <React/RCTReloadCommand.h>
#import <XCTest/XCTest.h>

#if RCT_DEV && RCT_DEV_MENU

@interface RCTDevSettings (Tests)
- (BOOL)_claimDevMenu;
- (void)invalidate;
@end

@interface RCTPackagerConnection (Tests)
- (void)reconnectingWebSocket:(id)webSocket didReceiveMessage:(id)message;
@end

static NSString *const kReloadMessage = @"{\"version\":2,\"method\":\"reload\"}";

@interface RCTDevSettingsTests : XCTestCase
@end

@implementation RCTDevSettingsTests {
  NSMutableArray<RCTDevSettings *> *_instances;
  RCTBundleManager *_bundleManager;
  NSUInteger _reloads;
  id _reloadObserver;
}

- (void)setUp
{
  [super setUp];
  _instances = [NSMutableArray new];
  // An explicit packager host, so no instance sends a /status request.
  RCTBundleConfiguration *config = [[RCTBundleConfiguration alloc] initWithPackagerServerScheme:@"http"
                                                                             packagerServerHost:@"localhost:1"
                                                                                     bundlePath:nil];
  _bundleManager = [[RCTBundleManager alloc] initWithBundleConfig:config];
  RCTBridgelessBundleURLGetter getter = ^NSURL * {
    return [NSURL URLWithString:@"http://localhost:1/index.bundle"];
  };
  [_bundleManager setBridgelessBundleURLGetter:getter andSetter:nil andDefaultGetter:getter];
  _reloads = 0;
  __weak __typeof(self) weakSelf = self;
  _reloadObserver = [[NSNotificationCenter defaultCenter] addObserverForName:RCTTriggerReloadCommandNotification
                                                                      object:nil
                                                                       queue:nil
                                                                  usingBlock:^(__unused NSNotification *note) {
                                                                    __typeof(self) strongSelf = weakSelf;
                                                                    if (strongSelf != nil) {
                                                                      strongSelf->_reloads++;
                                                                    }
                                                                  }];
}

- (void)tearDown
{
  [[NSNotificationCenter defaultCenter] removeObserver:_reloadObserver];
  for (RCTDevSettings *instance in _instances) {
    [instance invalidate];
  }
  _instances = nil;
  _bundleManager = nil;
  [super tearDown];
}

- (RCTDevSettings *)newInitializedInstance
{
  RCTDevSettings *instance = [[RCTDevSettings alloc] initWithDataSource:nil];
  instance.bundleManager = _bundleManager;
  [instance initialize];
  [_instances addObject:instance];
  return instance;
}

- (void)deliverReloadTo:(RCTDevSettings *)instance
{
  [instance.packagerConnection reconnectingWebSocket:nil didReceiveMessage:kReloadMessage];
}

- (void)invalidateInstance:(RCTDevSettings *)instance
{
  [_instances removeObject:instance];
  [instance invalidate];
}

- (void)drainMainQueue
{
  [[NSRunLoop mainRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
}

- (void)testNewInstanceHandlesReloadBeforeOldInstanceInvalidates
{
  RCTDevSettings *oldInstance = [self newInitializedInstance];
  RCTDevSettings *newInstance = [self newInitializedInstance];
  XCTAssertNotNil(oldInstance);

  [self deliverReloadTo:newInstance];
  [self drainMainQueue];

  XCTAssertEqual(_reloads, 1u);
}

- (void)testOneCommandOnTwoConnectionsReloadsOnce
{
  RCTDevSettings *a = [self newInitializedInstance];
  RCTDevSettings *b = [self newInitializedInstance];

  [self deliverReloadTo:a];
  [self deliverReloadTo:b];
  [self drainMainQueue];

  XCTAssertEqual(_reloads, 1u);
}

- (void)testDevMenuHasOneLiveOwner
{
  RCTDevSettings *a = [self newInitializedInstance];
  RCTDevSettings *b = [self newInitializedInstance];
  XCTAssertTrue([a _claimDevMenu]);
  XCTAssertTrue([a _claimDevMenu]);
  XCTAssertFalse([b _claimDevMenu]);

  [self invalidateInstance:a];

  XCTAssertFalse([a _claimDevMenu]);
  XCTAssertTrue([b _claimDevMenu]);
}

@end

#endif
