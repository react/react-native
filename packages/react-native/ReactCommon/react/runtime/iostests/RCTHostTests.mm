/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <RCTTestUtils/RCTMemoryUtils.h>
#import <RCTTestUtils/ShimRCTInstance.h>
#import <React/RCTLog.h>
#import <React/RCTMockDef.h>
#import <ReactCommon/RCTHermesInstance.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTInstance.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <hermes/hermes.h>

#import <OCMock/OCMock.h>

RCT_MOCK_REF(RCTHost, _RCTLogNativeInternal);

RCTLogLevel gLogLevel;
int gLogCalledTimes = 0;
NSString *gLogMessage = nil;
static void RCTLogNativeInternalMock(RCTLogLevel level, const char *fileName, int lineNumber, NSString *format, ...)
{
  gLogLevel = level;
  gLogCalledTimes++;

  va_list args;
  va_start(args, format);
  gLogMessage = [[NSString alloc] initWithFormat:format arguments:args];
  va_end(args);
}

@interface RCTHostTests : XCTestCase
@end

@implementation RCTHostTests {
  RCTHost *_subject;
  id<RCTHostDelegate> _mockHostDelegate;
}

static ShimRCTInstance *shimmedRCTInstance;

- (void)setUp
{
  [super setUp];

  RCTAutoReleasePoolPush();

  shimmedRCTInstance = [ShimRCTInstance new];

  _mockHostDelegate = OCMProtocolMock(@protocol(RCTHostDelegate));
  _subject = [[RCTHost alloc] initWithBundleURL:OCMClassMock([NSURL class])
                                   hostDelegate:_mockHostDelegate
                     turboModuleManagerDelegate:OCMProtocolMock(@protocol(RCTTurboModuleManagerDelegate))
                               jsEngineProvider:^std::shared_ptr<facebook::react::JSRuntimeFactory>() {
                                 return std::make_shared<facebook::react::RCTHermesInstance>();
                               }
                                  launchOptions:nil];
}

- (void)tearDown
{
  RCTAutoReleasePoolPop();

  _subject = nil;
  XCTAssertEqual(RCTGetRetainCount(_subject), 0);

  _mockHostDelegate = nil;
  XCTAssertEqual(RCTGetRetainCount(_mockHostDelegate), 0);

  [shimmedRCTInstance reset];
  gLogCalledTimes = 0;
  gLogMessage = nil;

  [super tearDown];
}

- (void)testStart
{
  RCT_MOCK_SET(RCTHost, _RCTLogNativeInternal, RCTLogNativeInternalMock);

  XCTAssertEqual(shimmedRCTInstance.initCount, 0);
  [_subject start];
  OCMVerify(OCMTimes(1), [_mockHostDelegate hostDidStart:_subject]);
  XCTAssertEqual(shimmedRCTInstance.initCount, 1);
  XCTAssertEqual(gLogCalledTimes, 0);

  XCTAssertEqual(shimmedRCTInstance.invalidateCount, 0);
  [_subject start];
  XCTAssertEqual(shimmedRCTInstance.initCount, 2);
  XCTAssertEqual(shimmedRCTInstance.invalidateCount, 1);
  OCMVerify(OCMTimes(2), [_mockHostDelegate hostDidStart:_subject]);
  XCTAssertEqual(gLogLevel, RCTLogLevelWarning);
  XCTAssertEqual(gLogCalledTimes, 1);
  XCTAssertEqualObjects(
      gLogMessage,
      @"RCTHost should not be creating a new instance if one already exists. This implies there is a bug with how/when this method is being called.");

  RCT_MOCK_RESET(RCTHost, _RCTLogNativeInternal);
}

- (void)testCallFunctionOnJSModule
{
  [_subject start];

  NSArray *args = @[ @"hi", @(5), @(NO) ];
  [_subject callFunctionOnJSModule:@"jsModule" method:@"method" args:args];

  XCTAssertEqualObjects(shimmedRCTInstance.jsModuleName, @"jsModule");
  XCTAssertEqualObjects(shimmedRCTInstance.method, @"method");
  XCTAssertEqualObjects(shimmedRCTInstance.args, args);
}

- (void)testDidReceiveErrorStack
{
  id<RCTInstanceDelegate> instanceDelegate = (id<RCTInstanceDelegate>)_subject;

  NSMutableArray<NSDictionary<NSString *, id> *> *stack = [NSMutableArray array];

  NSMutableDictionary<NSString *, id> *stackFrame0 = [NSMutableDictionary dictionary];
  stackFrame0[@"linenumber"] = @(3);
  stackFrame0[@"column"] = @(4);
  stackFrame0[@"methodname"] = @"method1";
  stackFrame0[@"file"] = @"file1.js";
  [stack addObject:stackFrame0];

  NSMutableDictionary<NSString *, id> *stackFrame1 = [NSMutableDictionary dictionary];
  stackFrame0[@"linenumber"] = @(63);
  stackFrame0[@"column"] = @(44);
  stackFrame0[@"methodname"] = @"method2";
  stackFrame0[@"file"] = @"file2.js";
  [stack addObject:stackFrame1];

  id extraData = [NSDictionary dictionary];

  [instanceDelegate instance:[OCMArg any]
      didReceiveJSErrorStack:stack
                     message:@"message"
             originalMessage:nil
                        name:nil
              componentStack:nil
                 exceptionId:5
                     isFatal:YES
                   extraData:extraData];

  OCMVerify(
      OCMTimes(1),
      [_mockHostDelegate host:_subject
          didReceiveJSErrorStack:stack
                         message:@"message"
                 originalMessage:nil
                            name:nil
                  componentStack:nil
                     exceptionId:5
                         isFatal:YES
                       extraData:extraData]);
}

- (void)testDidInitializeRuntime
{
  auto hermesRuntime = facebook::hermes::makeHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();

  id<RCTInstanceDelegate> instanceDelegate = (id<RCTInstanceDelegate>)_subject;
  [instanceDelegate instance:[OCMArg any] didInitializeRuntime:*rt];

  OCMVerify(OCMTimes(1), [_mockHostDelegate host:_subject didInitializeRuntime:*rt]);
}

- (void)testDidInitializeRuntime_DEPRECATED
{
  id<RCTHostRuntimeDelegate> mockRuntimeDelegate = OCMProtocolMock(@protocol(RCTHostRuntimeDelegate));
  _subject.runtimeDelegate = mockRuntimeDelegate;

  auto hermesRuntime = facebook::hermes::makeHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();

  id<RCTInstanceDelegate> instanceDelegate = (id<RCTInstanceDelegate>)_subject;
  [instanceDelegate instance:[OCMArg any] didInitializeRuntime:*rt];

  OCMVerify(OCMTimes(1), [mockRuntimeDelegate host:_subject didInitializeRuntime:*rt]);
}

@end
