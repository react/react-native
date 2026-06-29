/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <ReactCommon/RCTTurboModule.h>
#import <hermes/hermes.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>

#import <vector>

#import <OCMock/OCMock.h>

using namespace facebook::react;

@interface RCTTestTurboModule : NSObject <RCTBridgeModule>

@end

@implementation RCTTestTurboModule

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(testMethodWhichTakesObject : (id)object) {}

@end

// Minimal concrete MutableBuffer that owns its bytes, used to observe lifetime.
class TestMutableBuffer : public facebook::jsi::MutableBuffer {
 public:
  explicit TestMutableBuffer(size_t size) : bytes_(size, 0) {}
  size_t size() const override
  {
    return bytes_.size();
  }
  uint8_t *data() override
  {
    return bytes_.data();
  }

 private:
  std::vector<uint8_t> bytes_;
};

class StubNativeMethodCallInvoker : public NativeMethodCallInvoker {
 public:
  void invokeAsync(const std::string &methodName, NativeMethodCallFunc &&func) noexcept override
  {
    func();
  }
  void invokeSync(const std::string &methodName, NativeMethodCallFunc &&func) noexcept override
  {
    func();
  }
};

@interface RCTTurboModuleTests : XCTestCase
@end

@implementation RCTTurboModuleTests {
  std::unique_ptr<ObjCTurboModule> module_;
  RCTTestTurboModule *instance_;
}

- (void)setUp
{
  [super setUp];
  instance_ = OCMClassMock([RCTTestTurboModule class]);

  ObjCTurboModule::InitParams params = {
      .moduleName = "TestModule",
      .instance = instance_,
      .jsInvoker = nullptr,
      .nativeMethodCallInvoker = std::make_shared<StubNativeMethodCallInvoker>(),
      .isSyncModule = false,
  };
  module_ = std::make_unique<ObjCTurboModule>(params);
}

- (void)tearDown
{
  module_ = nullptr;
  instance_ = nil;

  [super tearDown];
}

- (void)testInvokeTurboModuleWithNull
{
  auto hermesRuntime = facebook::hermes::makeHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();

  // Empty object
  facebook::jsi::Value args[1] = {facebook::jsi::Object(*rt)};
  module_->invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichTakesObject", @selector(testMethodWhichTakesObject:), args, 1);
  OCMVerify(OCMTimes(1), [instance_ testMethodWhichTakesObject:@{}]);

  // Object with one key
  args[0].asObject(*rt).setProperty(*rt, "foo", "bar");
  module_->invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichTakesObject", @selector(testMethodWhichTakesObject:), args, 1);
  OCMVerify(OCMTimes(1), [instance_ testMethodWhichTakesObject:@{@"foo" : @"bar"}]);

  // Object with key without value
  args[0].asObject(*rt).setProperty(*rt, "foo", facebook::jsi::Value::null());
  module_->invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichTakesObject", @selector(testMethodWhichTakesObject:), args, 1);
  if (ReactNativeFeatureFlags::enableModuleArgumentNSNullConversionIOS()) {
    OCMVerify(OCMTimes(1), [instance_ testMethodWhichTakesObject:@{@"foo" : (id)kCFNull}]);
  } else {
    OCMVerify(OCMTimes(2), [instance_ testMethodWhichTakesObject:@{}]);
  }

  // Null
  args[0] = facebook::jsi::Value::null();
  module_->invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichTakesObject", @selector(testMethodWhichTakesObject:), args, 1);
  OCMVerify(OCMTimes(1), [instance_ testMethodWhichTakesObject:nil]);
}

// A JS ArrayBuffer converts to an NSMutableData that owns an independent copy of
// the bytes — NSMutableData cannot alias a foreign buffer, so the result stays
// valid and is safe to mutate after the source buffer is gone. This covers the
// ArrayBuffer-backed-by-native-MutableBuffer case, which is the one that could in
// principle have been aliased zero-copy.
- (void)testArrayBufferConvertsToIndependentNSMutableData
{
  constexpr size_t kBufferSize = 64 * 1024;

  auto hermesRuntime = facebook::hermes::makeHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();

  auto buffer = std::make_shared<TestMutableBuffer>(kBufferSize);
  *buffer->data() = 0xAB;

  facebook::jsi::ArrayBuffer arrayBuffer(*rt, buffer);
  id converted =
      TurboModuleConvertUtils::convertJSIValueToObjCObject(*rt, facebook::jsi::Value(*rt, arrayBuffer), nullptr);

  XCTAssertTrue([converted isKindOfClass:[NSMutableData class]]);
  NSMutableData *data = (NSMutableData *)converted;
  XCTAssertEqual(data.length, (NSUInteger)kBufferSize);
  XCTAssertEqual(*static_cast<const uint8_t *>(data.bytes), 0xAB);

  // Independent copy: mutating the NSMutableData must not write through to the
  // source MutableBuffer.
  *static_cast<uint8_t *>(data.mutableBytes) = 0xCD;
  XCTAssertEqual(*buffer->data(), 0xAB, @"NSMutableData must not alias the source buffer");
}

@end
