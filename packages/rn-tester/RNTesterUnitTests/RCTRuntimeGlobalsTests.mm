/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <OCMock/OCMock.h>
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <React/RCTArrayBuffer.h>
#import <hermes/hermes.h>

#include <limits>

using namespace facebook;

@interface RCTRuntimeGlobalsTestDelegate : RCTDefaultReactNativeFactoryDelegate
@property (nonatomic, copy) NSDictionary<NSString *, id> *globals;
@property (nonatomic, assign) NSUInteger initializationCount;
@property (nonatomic, assign) BOOL sawGlobalsInCallback;
@end

@implementation RCTRuntimeGlobalsTestDelegate

- (NSDictionary<NSString *, id> *)initialRuntimeGlobals
{
  return self.globals;
}

- (void)host:(RCTHost *)host didInitializeRuntime:(jsi::Runtime &)runtime
{
  self.initializationCount++;
  self.sawGlobalsInCallback = runtime.global().hasProperty(runtime, "startupConfig");
}

@end

@interface RCTRuntimeGlobalsTests : XCTestCase
@end

@implementation RCTRuntimeGlobalsTests {
  RCTHost *_host;
}

- (void)setUp
{
  [super setUp];
  _host = OCMClassMock([RCTHost class]);
}

- (void)tearDown
{
  [(id)_host stopMocking];
  _host = nil;
  [super tearDown];
}

- (RCTReactNativeFactory *)factoryWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate
{
  // Exercise the initialization callback without starting an app or a Metro connection.
  RCTReactNativeFactory *factory = [RCTReactNativeFactory new];
  factory.delegate = delegate;
  return factory;
}

- (void)testGlobalsAreAvailableToTheInitializationCallbackAndFirstScript
{
  auto runtime = facebook::hermes::makeHermesRuntime();
  RCTRuntimeGlobalsTestDelegate *delegate = [RCTRuntimeGlobalsTestDelegate new];
  const uint8_t bytes[] = {1, 2, 3};
  delegate.globals = @{
    @"startupConfig" : @{
      @"label" : @"native",
      @"count" : @42,
      @"enabled" : @YES,
      @"items" : @[ @"first", @2.5, @NO, NSNull.null, @{@"nested" : @YES} ],
    },
    @"emptyValue" : NSNull.null,
    @"binaryValue" : [RCTArrayBuffer arrayBufferWithCopiedBytes:bytes length:sizeof(bytes)],
    @"customName" : @"supplied by the caller",
  };
  auto factory = [self factoryWithDelegate:delegate];

  [(id<RCTHostDelegate>)factory host:_host didInitializeRuntime:*runtime];

  XCTAssertEqual(delegate.initializationCount, 1u);
  XCTAssertTrue(delegate.sawGlobalsInCallback);
  auto result = runtime->evaluateJavaScript(
      std::make_shared<jsi::StringBuffer>(
          "startupConfig.label === 'native' && startupConfig.count === 42 && "
          "startupConfig.enabled === true && startupConfig.items[0] === 'first' && "
          "startupConfig.items[1] === 2.5 && startupConfig.items[2] === false && "
          "startupConfig.items[3] === null && startupConfig.items[4].nested === true && "
          "emptyValue === null && customName === 'supplied by the caller' && "
          "binaryValue instanceof ArrayBuffer && binaryValue.byteLength === 3 && "
          "new Uint8Array(binaryValue)[1] === 2"),
      "startup.js");
  XCTAssertTrue(result.getBool());
}

- (void)testEachRuntimeReceivesFreshObjects
{
  RCTRuntimeGlobalsTestDelegate *delegate = [RCTRuntimeGlobalsTestDelegate new];
  delegate.globals = @{@"startupConfig" : @{@"count" : @1}};
  auto factory = [self factoryWithDelegate:delegate];
  auto firstRuntime = facebook::hermes::makeHermesRuntime();
  auto secondRuntime = facebook::hermes::makeHermesRuntime();

  [(id<RCTHostDelegate>)factory host:_host didInitializeRuntime:*firstRuntime];
  firstRuntime->global().getPropertyAsObject(*firstRuntime, "startupConfig").setProperty(*firstRuntime, "count", 2);
  [(id<RCTHostDelegate>)factory host:_host didInitializeRuntime:*secondRuntime];

  auto config = secondRuntime->global().getPropertyAsObject(*secondRuntime, "startupConfig");
  XCTAssertEqual(config.getProperty(*secondRuntime, "count").getNumber(), 1);
  XCTAssertEqualObjects(delegate.globals[@"startupConfig"][@"count"], @1);
  XCTAssertEqual(delegate.initializationCount, 2u);
}

- (void)testNilAndEmptyGlobalsPreserveExistingPropertiesAndCallback
{
  auto runtime = facebook::hermes::makeHermesRuntime();
  runtime->global().setProperty(*runtime, "existingValue", 7);
  RCTRuntimeGlobalsTestDelegate *delegate = [RCTRuntimeGlobalsTestDelegate new];
  auto factory = [self factoryWithDelegate:delegate];

  [(id<RCTHostDelegate>)factory host:_host didInitializeRuntime:*runtime];
  delegate.globals = @{};
  [(id<RCTHostDelegate>)factory host:_host didInitializeRuntime:*runtime];

  XCTAssertEqual(runtime->global().getProperty(*runtime, "existingValue").getNumber(), 7);
  XCTAssertEqual(delegate.initializationCount, 2u);
}

- (void)testCallerSelectedNamesAndExistingPropertyAssignment
{
  auto runtime = facebook::hermes::makeHermesRuntime();
  RCTRuntimeGlobalsTestDelegate *delegate = [RCTRuntimeGlobalsTestDelegate new];
  const unichar characters[] = {'a', 0, 'b'};
  NSString *nameWithNull = [NSString stringWithCharacters:characters length:3];
  delegate.globals = @{@"existingValue" : @8, @"配置" : @"value", nameWithNull : @YES};
  auto factory = [self factoryWithDelegate:delegate];
  runtime->global().setProperty(*runtime, "existingValue", 7);

  [(id<RCTHostDelegate>)factory host:_host didInitializeRuntime:*runtime];

  auto result = runtime->evaluateJavaScript(
      std::make_shared<jsi::StringBuffer>(
          "existingValue === 8 && globalThis['配置'] === 'value' && globalThis['a\\u0000b'] === true"),
      "names.js");
  XCTAssertTrue(result.getBool());
}

- (void)testDefaultDelegateInstallsNoGlobals
{
  RCTDefaultReactNativeFactoryDelegate *delegate = [RCTDefaultReactNativeFactoryDelegate new];
  XCTAssertNil([delegate initialRuntimeGlobals]);
  auto factory = [self factoryWithDelegate:delegate];
  auto runtime = facebook::hermes::makeHermesRuntime();

  [(id<RCTHostDelegate>)factory host:_host didInitializeRuntime:*runtime];

  XCTAssertFalse(runtime->global().hasProperty(*runtime, "startupConfig"));
}

- (void)testNonFiniteNumbersUseNativeConversion
{
  auto runtime = facebook::hermes::makeHermesRuntime();
  RCTRuntimeGlobalsTestDelegate *delegate = [RCTRuntimeGlobalsTestDelegate new];
  delegate.globals = @{
    @"startupConfig" : @{
      @"items" : @[
        @(std::numeric_limits<double>::quiet_NaN()),
        @(std::numeric_limits<double>::infinity()),
        @(-std::numeric_limits<double>::infinity()),
      ],
    },
  };
  auto factory = [self factoryWithDelegate:delegate];

  [(id<RCTHostDelegate>)factory host:_host didInitializeRuntime:*runtime];

  auto result = runtime->evaluateJavaScript(
      std::make_shared<jsi::StringBuffer>(
          "Number.isNaN(startupConfig.items[0]) && startupConfig.items[1] === Infinity && "
          "startupConfig.items[2] === -Infinity"),
      "numbers.js");
  XCTAssertTrue(result.getBool());
  XCTAssertTrue(delegate.sawGlobalsInCallback);
  XCTAssertEqual(delegate.initializationCount, 1u);
}

@end
