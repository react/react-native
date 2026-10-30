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
#import <React/RCTLog.h>

// The native module method JS calls, from the generated spec.
@interface RCTAccessibilityManager (RCTAccessibilityManagerTests)

- (void)getCurrentPreferences:(RCTResponseSenderBlock)onSuccess onError:(RCTResponseSenderBlock)onError;

@end

// Records the device events the module sends.
@interface RCTAccessibilityManagerTestsEventDispatcher : NSObject

@property (nonatomic, strong) NSMutableArray<NSArray *> *events;

- (void)sendDeviceEventWithName:(NSString *)name body:(id)body;

@end

@implementation RCTAccessibilityManagerTestsEventDispatcher

- (instancetype)init
{
  if (self = [super init]) {
    _events = [NSMutableArray new];
  }
  return self;
}

- (void)sendDeviceEventWithName:(NSString *)name body:(id)body
{
  [_events addObject:@[ name, body ]];
}

@end

@interface RCTAccessibilityManagerTestsModuleRegistry : RCTModuleRegistry

@property (nonatomic, strong) RCTAccessibilityManagerTestsEventDispatcher *eventDispatcher;

@end

@implementation RCTAccessibilityManagerTestsModuleRegistry

- (id)moduleForName:(const char *)moduleName
{
  return strcmp(moduleName, "EventDispatcher") == 0 ? _eventDispatcher : nil;
}

@end

// Holds the settings a test reader returns, so a test can change them after
// installing the reader. Installing a reader refreshes the module's cache, so
// only a notification can be what sends an event.
@interface RCTAccessibilityManagerTestsSettings : NSObject

@property (nonatomic, copy) NSDictionary<NSString *, id> *preferences;

@end

@implementation RCTAccessibilityManagerTestsSettings

@end

static NSDictionary<NSString *, NSNumber *> *RCTTestPreferences(
    BOOL prefersSwitchLabels,
    BOOL prefersNonColorIndicators)
{
  return @{
    @"prefersSwitchLabels" : @(prefersSwitchLabels),
    @"prefersNonColorIndicators" : @(prefersNonColorIndicators),
  };
}

static BOOL RCTIsCFBoolean(id value)
{
  return value != nil && CFGetTypeID((__bridge CFTypeRef)value) == CFBooleanGetTypeID();
}

@interface RCTAccessibilityManagerTests : XCTestCase

@end

@implementation RCTAccessibilityManagerTests {
  // The module holds its registry weakly, so the test keeps each one alive.
  NSMutableArray<RCTAccessibilityManagerTestsModuleRegistry *> *_moduleRegistries;
}

- (void)setUp
{
  [super setUp];
  _moduleRegistries = [NSMutableArray new];
}

- (void)tearDown
{
  RCTSetLogFunction(RCTDefaultLogFunction);
  _moduleRegistries = nil;
  [super tearDown];
}

- (RCTAccessibilityManager *)managerWithEventDispatcher:(RCTAccessibilityManagerTestsEventDispatcher *)eventDispatcher
{
  RCTAccessibilityManagerTestsModuleRegistry *moduleRegistry = [RCTAccessibilityManagerTestsModuleRegistry new];
  moduleRegistry.eventDispatcher = eventDispatcher;
  [_moduleRegistries addObject:moduleRegistry];
  RCTAccessibilityManager *manager = [RCTAccessibilityManager new];
  manager.moduleRegistry = moduleRegistry;
  return manager;
}

- (void)installReaderOverSettings:(RCTAccessibilityManagerTestsSettings *)settings
                        onManager:(RCTAccessibilityManager *)manager
{
  RCTAccessibilityManagerSetPreferencesReader(manager, ^NSDictionary<NSString *, id> * {
    return settings.preferences;
  });
}

- (NSDictionary *)currentPreferencesOf:(RCTAccessibilityManager *)manager
{
  __block NSDictionary *preferences = nil;
  [manager
      getCurrentPreferences:^(NSArray *response) {
        preferences = response.firstObject;
      }
      onError:^(__unused NSArray *response) {
        XCTFail(@"getCurrentPreferences failed");
      }];
  return preferences;
}

- (void)postNotification:(NSNotificationName)name
{
  [[NSNotificationCenter defaultCenter] postNotificationName:name object:nil];
}

- (void)testSystemReaderAtStartup
{
  RCTAccessibilityManagerTestsEventDispatcher *eventDispatcher = [RCTAccessibilityManagerTestsEventDispatcher new];
  RCTAccessibilityManager *manager = [self managerWithEventDispatcher:eventDispatcher];
  XCTAssertNotNil(manager);

  NSDictionary *preferences = [self currentPreferencesOf:manager];

  XCTAssertEqualObjects(
      [NSSet setWithArray:preferences.allKeys],
      ([NSSet setWithArray:@[ @"prefersSwitchLabels", @"prefersNonColorIndicators" ]]));
  XCTAssertTrue(RCTIsCFBoolean(preferences[@"prefersSwitchLabels"]));
  XCTAssertTrue(RCTIsCFBoolean(preferences[@"prefersNonColorIndicators"]));
  XCTAssertEqualObjects(preferences[@"prefersSwitchLabels"], @(UIAccessibilityIsOnOffSwitchLabelsEnabled()));
  XCTAssertEqualObjects(preferences[@"prefersNonColorIndicators"], @(UIAccessibilityShouldDifferentiateWithoutColor()));
  XCTAssertEqual(eventDispatcher.events.count, 0);
}

- (void)testSetterReplacesThePreferencesWithoutAnEvent
{
  RCTAccessibilityManagerTestsEventDispatcher *eventDispatcher = [RCTAccessibilityManagerTestsEventDispatcher new];
  RCTAccessibilityManager *manager = [self managerWithEventDispatcher:eventDispatcher];
  XCTAssertNotNil(manager);

  RCTAccessibilityManagerSetPreferencesReader(manager, ^NSDictionary<NSString *, id> * {
    return RCTTestPreferences(YES, YES);
  });

  XCTAssertEqualObjects([self currentPreferencesOf:manager], RCTTestPreferences(YES, YES));
  XCTAssertEqual(eventDispatcher.events.count, 0);
}

- (void)testOnOffSwitchLabelsChangeSendsOneEvent
{
  RCTAccessibilityManagerTestsEventDispatcher *eventDispatcher = [RCTAccessibilityManagerTestsEventDispatcher new];
  RCTAccessibilityManager *manager = [self managerWithEventDispatcher:eventDispatcher];
  XCTAssertNotNil(manager);
  RCTAccessibilityManagerTestsSettings *settings = [RCTAccessibilityManagerTestsSettings new];
  settings.preferences = RCTTestPreferences(NO, NO);
  [self installReaderOverSettings:settings onManager:manager];

  settings.preferences = RCTTestPreferences(YES, NO);
  [self postNotification:UIAccessibilityOnOffSwitchLabelsDidChangeNotification];
  [self postNotification:UIAccessibilityOnOffSwitchLabelsDidChangeNotification];

  XCTAssertEqualObjects(
      eventDispatcher.events, (@[ @[ @"accessibilityPreferencesChanged", RCTTestPreferences(YES, NO) ] ]));
  XCTAssertEqualObjects([self currentPreferencesOf:manager], RCTTestPreferences(YES, NO));
}

- (void)testDifferentiateWithoutColorChangeSendsOneEvent
{
  RCTAccessibilityManagerTestsEventDispatcher *eventDispatcher = [RCTAccessibilityManagerTestsEventDispatcher new];
  RCTAccessibilityManager *manager = [self managerWithEventDispatcher:eventDispatcher];
  XCTAssertNotNil(manager);
  RCTAccessibilityManagerTestsSettings *settings = [RCTAccessibilityManagerTestsSettings new];
  settings.preferences = RCTTestPreferences(NO, NO);
  [self installReaderOverSettings:settings onManager:manager];

  settings.preferences = RCTTestPreferences(NO, YES);
  [self postNotification:UIAccessibilityShouldDifferentiateWithoutColorDidChangeNotification];
  [self postNotification:UIAccessibilityShouldDifferentiateWithoutColorDidChangeNotification];

  XCTAssertEqualObjects(
      eventDispatcher.events, (@[ @[ @"accessibilityPreferencesChanged", RCTTestPreferences(NO, YES) ] ]));
  XCTAssertEqualObjects([self currentPreferencesOf:manager], RCTTestPreferences(NO, YES));
}

- (void)testNotificationAfterTheSetterWithTheSameValuesSendsNoEvent
{
  RCTAccessibilityManagerTestsEventDispatcher *eventDispatcher = [RCTAccessibilityManagerTestsEventDispatcher new];
  RCTAccessibilityManager *manager = [self managerWithEventDispatcher:eventDispatcher];
  XCTAssertNotNil(manager);
  RCTAccessibilityManagerTestsSettings *settings = [RCTAccessibilityManagerTestsSettings new];
  settings.preferences = RCTTestPreferences(YES, YES);
  [self installReaderOverSettings:settings onManager:manager];

  [self postNotification:UIAccessibilityOnOffSwitchLabelsDidChangeNotification];
  [self postNotification:UIAccessibilityShouldDifferentiateWithoutColorDidChangeNotification];

  XCTAssertEqual(eventDispatcher.events.count, 0);
}

- (void)testSeparateInstancesUseTheirOwnReaders
{
  RCTAccessibilityManagerTestsEventDispatcher *eventDispatcherA = [RCTAccessibilityManagerTestsEventDispatcher new];
  RCTAccessibilityManagerTestsEventDispatcher *eventDispatcherB = [RCTAccessibilityManagerTestsEventDispatcher new];
  RCTAccessibilityManager *managerA = [self managerWithEventDispatcher:eventDispatcherA];
  RCTAccessibilityManager *managerB = [self managerWithEventDispatcher:eventDispatcherB];
  XCTAssertNotNil(managerA);
  XCTAssertNotNil(managerB);
  RCTAccessibilityManagerTestsSettings *settingsA = [RCTAccessibilityManagerTestsSettings new];
  RCTAccessibilityManagerTestsSettings *settingsB = [RCTAccessibilityManagerTestsSettings new];
  settingsA.preferences = RCTTestPreferences(NO, NO);
  settingsB.preferences = RCTTestPreferences(NO, NO);
  [self installReaderOverSettings:settingsA onManager:managerA];
  [self installReaderOverSettings:settingsB onManager:managerB];

  settingsA.preferences = RCTTestPreferences(YES, NO);
  settingsB.preferences = RCTTestPreferences(NO, YES);
  [self postNotification:UIAccessibilityOnOffSwitchLabelsDidChangeNotification];

  XCTAssertEqualObjects(
      eventDispatcherA.events, (@[ @[ @"accessibilityPreferencesChanged", RCTTestPreferences(YES, NO) ] ]));
  XCTAssertEqualObjects(
      eventDispatcherB.events, (@[ @[ @"accessibilityPreferencesChanged", RCTTestPreferences(NO, YES) ] ]));
}

- (void)testReaderValuesReachTheEventAsCFBooleans
{
  RCTAccessibilityManagerTestsEventDispatcher *eventDispatcher = [RCTAccessibilityManagerTestsEventDispatcher new];
  RCTAccessibilityManager *manager = [self managerWithEventDispatcher:eventDispatcher];
  XCTAssertNotNil(manager);
  RCTAccessibilityManagerTestsSettings *settings = [RCTAccessibilityManagerTestsSettings new];
  settings.preferences = RCTTestPreferences(NO, NO);
  [self installReaderOverSettings:settings onManager:manager];

  settings.preferences = @{@"prefersSwitchLabels" : @1, @"prefersNonColorIndicators" : @0, @"unknownKey" : @YES};
  [self postNotification:UIAccessibilityOnOffSwitchLabelsDidChangeNotification];

  XCTAssertEqual(eventDispatcher.events.count, 1);
  NSDictionary *body = eventDispatcher.events.firstObject[1];
  XCTAssertEqualObjects(body, RCTTestPreferences(YES, NO));
  XCTAssertTrue(RCTIsCFBoolean(body[@"prefersSwitchLabels"]));
  XCTAssertTrue(RCTIsCFBoolean(body[@"prefersNonColorIndicators"]));
  XCTAssertEqual(body.count, 2);
}

- (void)testReaderReturningNilFallsBackToTheSystem
{
  RCTAccessibilityManagerTestsEventDispatcher *eventDispatcher = [RCTAccessibilityManagerTestsEventDispatcher new];
  RCTAccessibilityManager *manager = [self managerWithEventDispatcher:eventDispatcher];
  XCTAssertNotNil(manager);
  BOOL systemSwitchLabels = UIAccessibilityIsOnOffSwitchLabelsEnabled();
  BOOL systemNonColorIndicators = UIAccessibilityShouldDifferentiateWithoutColor();
  // Start from the opposite of the system values, so a cache left unchanged
  // would not match the system values below.
  RCTAccessibilityManagerSetPreferencesReader(manager, ^NSDictionary<NSString *, id> * {
    return RCTTestPreferences(!systemSwitchLabels, !systemNonColorIndicators);
  });
  XCTAssertEqualObjects(
      [self currentPreferencesOf:manager], RCTTestPreferences(!systemSwitchLabels, !systemNonColorIndicators));
  NSMutableArray<NSString *> *warnings = [NSMutableArray new];
  RCTSetLogFunction(
      ^(RCTLogLevel level,
        __unused RCTLogSource source,
        __unused NSString *fileName,
        __unused NSNumber *lineNumber,
        NSString *message) {
        if (level == RCTLogLevelWarning) {
          [warnings addObject:message];
        }
      });

  RCTAccessibilityManagerSetPreferencesReader(manager, ^NSDictionary<NSString *, id> * {
    return nil;
  });

  XCTAssertEqual(warnings.count, 1);
  XCTAssertTrue([warnings.firstObject containsString:@"reader returned nil"]);
  XCTAssertEqualObjects(
      [self currentPreferencesOf:manager], RCTTestPreferences(systemSwitchLabels, systemNonColorIndicators));
  XCTAssertEqual(eventDispatcher.events.count, 0);
}

- (void)testResettingTheReaderReturnsTheSystemValues
{
  RCTAccessibilityManagerTestsEventDispatcher *eventDispatcher = [RCTAccessibilityManagerTestsEventDispatcher new];
  RCTAccessibilityManager *manager = [self managerWithEventDispatcher:eventDispatcher];
  XCTAssertNotNil(manager);
  BOOL systemSwitchLabels = UIAccessibilityIsOnOffSwitchLabelsEnabled();
  BOOL systemNonColorIndicators = UIAccessibilityShouldDifferentiateWithoutColor();
  RCTAccessibilityManagerSetPreferencesReader(manager, ^NSDictionary<NSString *, id> * {
    return RCTTestPreferences(!systemSwitchLabels, !systemNonColorIndicators);
  });
  XCTAssertEqualObjects(
      [self currentPreferencesOf:manager], RCTTestPreferences(!systemSwitchLabels, !systemNonColorIndicators));

  RCTAccessibilityManagerSetPreferencesReader(manager, nil);

  XCTAssertEqualObjects(
      [self currentPreferencesOf:manager], RCTTestPreferences(systemSwitchLabels, systemNonColorIndicators));
  XCTAssertEqual(eventDispatcher.events.count, 0);
}

@end
