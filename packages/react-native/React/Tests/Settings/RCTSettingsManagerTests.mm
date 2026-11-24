/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>
#import <React/RCTSettingsManager.h>
#import <XCTest/XCTest.h>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <memory>

@interface RCTSettingsManager () <NativeSettingsManagerSpec, RCTInvalidating>
@end

@interface RCTSettingsTestDefaults : NSUserDefaults
@property (nonatomic, strong) NSMutableDictionary *values;
@property (atomic, assign) BOOL readOnMainThread;
@property (atomic, assign) NSTimeInterval snapshotDelay;
@property (atomic, assign) NSUInteger snapshotCount;
@property (nonatomic, copy) void (^onSnapshot)(NSDictionary *);
@end

@implementation RCTSettingsTestDefaults

- (instancetype)init
{
  if ((self = [super init])) {
    _values = [NSMutableDictionary new];
  }
  return self;
}

- (NSDictionary *)dictionaryRepresentation
{
  self.readOnMainThread = [NSThread isMainThread];
  [NSThread sleepForTimeInterval:self.snapshotDelay];
  NSDictionary *snapshot;
  @synchronized(self) {
    self.snapshotCount++;
    snapshot = [self.values copy];
  }
  if (self.onSnapshot != nil) {
    self.onSnapshot(snapshot);
  }
  return snapshot;
}

- (void)setObject:(id)value forKey:(NSString *)key
{
  @synchronized(self) {
    self.values[key] = value;
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:NSUserDefaultsDidChangeNotification object:self];
}

- (void)removeObjectForKey:(NSString *)key
{
  @synchronized(self) {
    [self.values removeObjectForKey:key];
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:NSUserDefaultsDidChangeNotification object:self];
}

- (BOOL)synchronize
{
  return YES;
}

@end

@interface RCTSettingsTestEventDispatcher : NSObject
@property (nonatomic, copy) void (^onEvent)(NSString *, NSDictionary *);
@end

@implementation RCTSettingsTestEventDispatcher

- (void)sendDeviceEventWithName:(NSString *)name body:(NSDictionary *)body
{
  self.onEvent(name, body);
}

@end

@interface RCTSettingsTestModuleRegistry : RCTModuleRegistry
@property (nonatomic, strong) RCTSettingsTestEventDispatcher *dispatcher;
@end

@implementation RCTSettingsTestModuleRegistry

- (id)moduleForName:(const char *)moduleName
{
  return self.dispatcher;
}

@end

@interface RCTSettingsManagerTests : XCTestCase
@end

@implementation RCTSettingsManagerTests {
  RCTSettingsTestDefaults *_defaults;
  RCTSettingsManager *_manager;
  RCTSettingsTestModuleRegistry *_registry;
}

- (void)setUp
{
  [super setUp];
  class AsyncSettingsFlags : public facebook::react::ReactNativeFeatureFlagsDefaults {
   public:
    bool enableAsyncSettingsManagerUpdatesIOS() override
    {
      return true;
    }
  };
  facebook::react::ReactNativeFeatureFlags::dangerouslyReset();
  facebook::react::ReactNativeFeatureFlags::override(std::make_unique<AsyncSettingsFlags>());
  _defaults = [RCTSettingsTestDefaults new];
  _manager = [[RCTSettingsManager alloc] initWithUserDefaults:_defaults];
  _registry = [RCTSettingsTestModuleRegistry new];
  _registry.dispatcher = [RCTSettingsTestEventDispatcher new];
  _manager.moduleRegistry = _registry;
  XCTAssertTrue([_manager respondsToSelector:@selector(invalidate)]);
}

- (void)tearDown
{
  [_manager invalidate];
  if (_manager.methodQueue != nil) {
    dispatch_sync(
        _manager.methodQueue,
        ^{
        });
  }
  _manager = nil;
  facebook::react::ReactNativeFeatureFlags::dangerouslyReset();
  [super tearDown];
}

- (void)useDefaultFeatureFlags
{
  [_manager invalidate];
  _manager = nil;
  facebook::react::ReactNativeFeatureFlags::dangerouslyReset();
  _manager = [[RCTSettingsManager alloc] initWithUserDefaults:_defaults];
  _manager.moduleRegistry = _registry;
}

- (void)testFlagDisabledPreservesSynchronousUpdates
{
  [self useDefaultFeatureFlags];
  XCTAssertFalse(facebook::react::ReactNativeFeatureFlags::enableAsyncSettingsManagerUpdatesIOS());
  _defaults.snapshotDelay = 0.2;
  _defaults.values[@"date"] = [NSDate dateWithTimeIntervalSince1970:0];
  __block BOOL delivered = NO;
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    XCTAssertTrue([NSThread isMainThread]);
    XCTAssertEqualObjects(name, @"settingsUpdated");
    XCTAssertEqualObjects(body[@"token"], @"new-token");
    XCTAssertEqualObjects(body[@"date"], [NSNull null]);
    delivered = YES;
  };
  void (^write)(void) = ^{
    NSTimeInterval start = [NSDate timeIntervalSinceReferenceDate];
    [self->_defaults setObject:@"new-token" forKey:@"token"];
    XCTAssertTrue(delivered);
    XCTAssertGreaterThanOrEqual([NSDate timeIntervalSinceReferenceDate] - start, 0.15);
  };
  if ([NSThread isMainThread]) {
    write();
  } else {
    dispatch_sync(dispatch_get_main_queue(), write);
  }
  XCTAssertTrue(_defaults.readOnMainThread);
  XCTAssertEqual(_defaults.snapshotCount, 1u);
}

- (void)testFlagDisabledPreservesEveryIntermediateUpdate
{
  [self useDefaultFeatureFlags];
  NSMutableArray *updates = [NSMutableArray new];
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    [updates addObject:body[@"external"] ?: [NSNull null]];
  };
  [_defaults setObject:@"A" forKey:@"external"];
  [_defaults setObject:@"B" forKey:@"external"];
  [_defaults setObject:@"A" forKey:@"external"];
  XCTAssertEqualObjects(updates, (@[ @"A", @"B", @"A" ]));
  XCTAssertEqual(_defaults.snapshotCount, 3u);
}

- (void)testFlagDisabledPreservesDefaultMethodQueue
{
  [self useDefaultFeatureFlags];
  XCTAssertFalse([_manager respondsToSelector:@selector(invalidate)]);
  XCTAssertNil(_manager.methodQueue);
  dispatch_queue_t queue = dispatch_queue_create("com.facebook.react.SettingsManagerTests", DISPATCH_QUEUE_SERIAL);
  [_manager setValue:queue forKey:@"methodQueue"];
  XCTAssertEqual(_manager.methodQueue, queue);
}

- (void)testFlagDisabledDoesNotEchoJavaScriptWrites
{
  [self useDefaultFeatureFlags];
  __block NSUInteger eventCount = 0;
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    eventCount++;
  };
  [_manager setValues:@{@"local" : @"value"}];
  XCTAssertEqualObjects(_defaults.values[@"local"], @"value");
  [_manager deleteValues:@[ @"local" ]];
  XCTAssertNil(_defaults.values[@"local"]);
  XCTAssertEqual(eventCount, 0u);
  XCTAssertEqual(_defaults.snapshotCount, 0u);
}

- (void)testFlagDisabledPreservesNotificationsAfterInvalidation
{
  [self useDefaultFeatureFlags];
  __block NSUInteger eventCount = 0;
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    eventCount++;
  };
  [_manager invalidate];
  [_defaults setObject:@"value" forKey:@"external"];
  XCTAssertEqual(eventCount, 1u);
  XCTAssertEqual(_defaults.snapshotCount, 1u);
}

- (void)testNotificationDoesNotBlockPostingThread
{
  _defaults.snapshotDelay = 0.2;
  XCTestExpectation *event = [self expectationWithDescription:@"settingsUpdated"];
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    XCTAssertEqualObjects(name, @"settingsUpdated");
    XCTAssertEqualObjects(body[@"token"], @"new-token");
    [event fulfill];
  };

  __block NSTimeInterval duration;
  void (^write)(void) = ^{
    NSTimeInterval start = [NSDate timeIntervalSinceReferenceDate];
    [self->_defaults setObject:@"new-token" forKey:@"token"];
    duration = [NSDate timeIntervalSinceReferenceDate] - start;
  };
  if ([NSThread isMainThread]) {
    write();
  } else {
    dispatch_sync(dispatch_get_main_queue(), write);
  }
  [self waitForExpectations:@[ event ] timeout:5];
  XCTAssertLessThan(duration, 0.1);
  XCTAssertFalse(_defaults.readOnMainThread);
}

- (void)testLargeNestedSettingsAreCleanedOffMainThread
{
  NSMutableDictionary *entries = [NSMutableDictionary new];
  for (NSUInteger index = 0; index < 5000; index++) {
    entries[[NSString stringWithFormat:@"entry-%lu", (unsigned long)index]] =
        @{@"nested" : @{@"string" : @"value", @"number" : @42, @"date" : [NSDate dateWithTimeIntervalSince1970:0]}};
  }
  _defaults.values[@"config"] = entries;
  XCTestExpectation *event = [self expectationWithDescription:@"cleaned settings"];
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    XCTAssertEqual([body[@"config"] count], 5000u);
    XCTAssertEqualObjects(body[@"config"][@"entry-0"][@"nested"][@"date"], [NSNull null]);
    XCTAssertEqualObjects(body[@"config"][@"entry-4999"][@"nested"][@"number"], @42);
    [event fulfill];
  };
  void (^write)(void) = ^{
    [self->_defaults setObject:@"new-token" forKey:@"token"];
  };
  if ([NSThread isMainThread]) {
    write();
  } else {
    dispatch_sync(dispatch_get_main_queue(), write);
  }
  [self waitForExpectations:@[ event ] timeout:5];
  XCTAssertFalse(_defaults.readOnMainThread);
}

- (void)testJavaScriptWritesDoNotEchoUpdates
{
  XCTestExpectation *event = [self expectationWithDescription:@"no settingsUpdated echo"];
  event.inverted = YES;
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    [event fulfill];
  };
  dispatch_sync(_manager.methodQueue, ^{
    [self->_manager setValues:@{@"local" : @"value"}];
    XCTAssertEqualObjects(self->_defaults.values[@"local"], @"value");
    [self->_manager deleteValues:@[ @"local" ]];
    XCTAssertNil(self->_defaults.values[@"local"]);
  });
  XCTAssertEqual(_defaults.snapshotCount, 0u);
  [self waitForExpectations:@[ event ] timeout:0.3];
}

- (void)testBackgroundNotificationStillDeliversSettings
{
  XCTestExpectation *event = [self expectationWithDescription:@"background settings"];
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    XCTAssertEqualObjects(body[@"background"], @YES);
    [event fulfill];
  };
  dispatch_queue_t queue = dispatch_queue_create("com.facebook.react.SettingsManagerTests", DISPATCH_QUEUE_SERIAL);
  dispatch_async(queue, ^{
    [self->_defaults setObject:@YES forKey:@"background"];
  });
  [self waitForExpectations:@[ event ] timeout:5];
}

- (void)testMainQueueRemainsResponsiveDuringSnapshot
{
  dispatch_semaphore_t releaseSnapshot = dispatch_semaphore_create(0);
  XCTestExpectation *snapshot = [self expectationWithDescription:@"snapshot entered"];
  XCTestExpectation *heartbeat = [self expectationWithDescription:@"main queue heartbeat"];
  XCTestExpectation *event = [self expectationWithDescription:@"settings delivered"];
  _defaults.onSnapshot = ^(NSDictionary *body) {
    XCTAssertFalse([NSThread isMainThread]);
    [snapshot fulfill];
    XCTAssertEqual(dispatch_semaphore_wait(releaseSnapshot, dispatch_time(DISPATCH_TIME_NOW, 5 * NSEC_PER_SEC)), 0);
  };
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    XCTAssertFalse([NSThread isMainThread]);
    [event fulfill];
  };
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_defaults setObject:@"value" forKey:@"external"];
    dispatch_async(dispatch_get_main_queue(), ^{
      [heartbeat fulfill];
    });
  });
  [self waitForExpectations:@[ snapshot, heartbeat ] timeout:3];
  dispatch_semaphore_signal(releaseSnapshot);
  [self waitForExpectations:@[ event ] timeout:3];
}

- (void)testBurstNotificationsCoalesceToLatestSettings
{
  dispatch_semaphore_t releaseQueue = dispatch_semaphore_create(0);
  XCTestExpectation *blocked = [self expectationWithDescription:@"queue blocked"];
  dispatch_async(_manager.methodQueue, ^{
    [blocked fulfill];
    XCTAssertEqual(dispatch_semaphore_wait(releaseQueue, dispatch_time(DISPATCH_TIME_NOW, 5 * NSEC_PER_SEC)), 0);
  });
  [self waitForExpectations:@[ blocked ] timeout:3];

  XCTestExpectation *event = [self expectationWithDescription:@"latest settings"];
  __block NSUInteger eventCount = 0;
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    eventCount++;
    XCTAssertEqualObjects(body[@"external"], @99);
    [event fulfill];
  };
  for (NSUInteger index = 0; index < 100; index++) {
    [_defaults setObject:@(index) forKey:@"external"];
  }
  dispatch_semaphore_signal(releaseQueue);
  [self waitForExpectations:@[ event ] timeout:3];
  dispatch_sync(
      _manager.methodQueue,
      ^{
      });
  XCTAssertEqual(eventCount, 1u);
  XCTAssertEqual(_defaults.snapshotCount, 1u);
}

- (void)testNotificationDuringSnapshotSchedulesTrailingUpdate
{
  dispatch_semaphore_t releaseSnapshot = dispatch_semaphore_create(0);
  XCTestExpectation *snapshot = [self expectationWithDescription:@"first snapshot captured"];
  XCTestExpectation *events = [self expectationWithDescription:@"ordered updates"];
  events.expectedFulfillmentCount = 2;
  __block NSUInteger snapshotCount = 0;
  _defaults.onSnapshot = ^(NSDictionary *body) {
    if (++snapshotCount == 1) {
      [snapshot fulfill];
      XCTAssertEqual(dispatch_semaphore_wait(releaseSnapshot, dispatch_time(DISPATCH_TIME_NOW, 5 * NSEC_PER_SEC)), 0);
    }
  };
  __block NSUInteger eventCount = 0;
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    XCTAssertEqualObjects(body[@"external"], @(++eventCount));
    [events fulfill];
  };
  [_defaults setObject:@1 forKey:@"external"];
  [self waitForExpectations:@[ snapshot ] timeout:3];
  [_defaults setObject:@2 forKey:@"external"];
  dispatch_semaphore_signal(releaseSnapshot);
  [self waitForExpectations:@[ events ] timeout:3];
  dispatch_sync(
      _manager.methodQueue,
      ^{
      });
  XCTAssertEqual(eventCount, 2u);
  XCTAssertEqual(_defaults.snapshotCount, 2u);
}

- (void)testInvalidationDropsPendingUpdate
{
  dispatch_semaphore_t releaseQueue = dispatch_semaphore_create(0);
  XCTestExpectation *blocked = [self expectationWithDescription:@"queue blocked"];
  dispatch_async(_manager.methodQueue, ^{
    [blocked fulfill];
    XCTAssertEqual(dispatch_semaphore_wait(releaseQueue, dispatch_time(DISPATCH_TIME_NOW, 5 * NSEC_PER_SEC)), 0);
  });
  [self waitForExpectations:@[ blocked ] timeout:3];
  __block NSUInteger eventCount = 0;
  _registry.dispatcher.onEvent = ^(NSString *name, NSDictionary *body) {
    eventCount++;
  };
  [_defaults setObject:@1 forKey:@"external"];
  [_manager invalidate];
  [_defaults setObject:@2 forKey:@"external"];
  dispatch_semaphore_signal(releaseQueue);
  dispatch_sync(
      _manager.methodQueue,
      ^{
      });
  XCTAssertEqual(eventCount, 0u);
  XCTAssertEqual(_defaults.snapshotCount, 0u);
}

- (void)testPendingUpdateDoesNotRetainManager
{
  dispatch_queue_t queue = _manager.methodQueue;
  dispatch_semaphore_t releaseQueue = dispatch_semaphore_create(0);
  XCTestExpectation *blocked = [self expectationWithDescription:@"queue blocked"];
  dispatch_async(queue, ^{
    [blocked fulfill];
    XCTAssertEqual(dispatch_semaphore_wait(releaseQueue, dispatch_time(DISPATCH_TIME_NOW, 5 * NSEC_PER_SEC)), 0);
  });
  [self waitForExpectations:@[ blocked ] timeout:3];
  [_defaults setObject:@1 forKey:@"external"];
  __weak RCTSettingsManager *weakManager = _manager;
  _manager = nil;
  XCTAssertNil(weakManager);
  dispatch_semaphore_signal(releaseQueue);
  dispatch_sync(
      queue,
      ^{
      });
  XCTAssertEqual(_defaults.snapshotCount, 0u);
}

@end
