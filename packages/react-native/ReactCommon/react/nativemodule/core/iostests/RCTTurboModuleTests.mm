/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTArrayBuffer.h>
#import <ReactCommon/RCTTurboModule.h>
#import <hermes/hermes.h>
#import <jsi/decorator.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

#import <array>
#import <memory>
#import <vector>

#import <OCMock/OCMock.h>

using namespace facebook::react;

@interface RCTTestTurboModule : NSObject <RCTBridgeModule>

// Deliberately not exported with RCT_EXPORT_METHOD: without `__rct_export__` metadata,
// `getArgumentTypeName` returns nil for the arguments.
- (void)testMethodWhichTakesStringWithoutExportMacro:(NSString *)string;

- (void)logEvent:(NSString *)eventName data:(NSDictionary *)data analyticsModule:(nullable NSString *)analyticsModule;

@end

@implementation RCTTestTurboModule

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(testMethodWhichTakesObject : (id)object) {}

- (void)testMethodWhichTakesStringWithoutExportMacro:(NSString *)string
{
}

- (void)logEvent:(NSString *)eventName data:(NSDictionary *)data analyticsModule:(nullable NSString *)analyticsModule
{
}

@end

@interface RCTThrowingTurboModule : NSObject <RCTBridgeModule>

@end

@implementation RCTThrowingTurboModule

RCT_EXPORT_MODULE()

// A plain `NSArray *` parameter has no element converter to sanitise it (unlike, say,
// `NSArray<NSString *> *`, which RCTConvert routes through `NSStringArray:` and which drops nulls),
// so `convertJSIArrayToNSArray` substituting `[NSNull null]` for a null element to preserve the
// indices is what this loop actually receives from a JS caller passing `['a', null]`.
RCT_EXPORT_METHOD(testMethodWhichReadsStringsFromArray : (NSArray *)items)
{
  for (NSUInteger i = 0; i < items.count; i++) {
    (void)[(NSString *)items[i] length];
  }
}

@end

class ReactNativeFeatureFlagsNSNullConversionEnabled : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableModuleArgumentNSNullConversionIOS() override
  {
    return true;
  }
};

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

// `jsi::Runtime::tryGetMutableBuffer` is optional — the Hermes branch linked into apps returns
// nullptr for every ArrayBuffer — so decorate the runtime to answer it for the buffers created
// through it. That keeps the coverage of the native-backed path independent of the engine.
// The registry is weak, so the only owners of a backing store remain the JS ArrayBuffer and
// whatever the conversion retains.
class MutableBufferAwareRuntime final : public facebook::jsi::RuntimeDecorator<facebook::jsi::Runtime> {
 public:
  explicit MutableBufferAwareRuntime(facebook::jsi::Runtime &plain) : RuntimeDecorator(plain) {}

  facebook::jsi::ArrayBuffer createArrayBuffer(std::shared_ptr<facebook::jsi::MutableBuffer> buffer) override
  {
    auto arrayBuffer = RuntimeDecorator::createArrayBuffer(buffer);
    buffers_.push_back(buffer);
    return arrayBuffer;
  }

  std::shared_ptr<facebook::jsi::MutableBuffer> tryGetMutableBuffer(
      const facebook::jsi::ArrayBuffer &arrayBuffer) override
  {
    uint8_t *data = arrayBuffer.data(*this);
    for (const auto &weakBuffer : buffers_) {
      auto buffer = weakBuffer.lock();
      if (buffer != nullptr && buffer->data() == data) {
        return buffer;
      }
    }
    return nullptr;
  }

 private:
  std::vector<std::weak_ptr<facebook::jsi::MutableBuffer>> buffers_;
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

// `NativeMethodCallInvoker::invokeAsync` is noexcept, so an NSException escaping the async
// invocation terminates the process — which is the production failure mode, but leaves nothing for
// a test to inspect. Catching here stands in for the process-level handler and puts the exception
// exactly where that handler would see it.
class ExceptionCapturingNativeMethodCallInvoker : public NativeMethodCallInvoker {
 public:
  __strong NSException *caught = nil;

  void invokeAsync(const std::string & /*methodName*/, NativeMethodCallFunc &&func) noexcept override
  {
    // The outer C++ handler is what makes the `noexcept` honest: `func` is a std::function, and
    // invoking an empty one throws a `std::bad_function_call` that `@catch (NSException *)` cannot
    // bind.
    try {
      @try {
        func();
      } @catch (NSException *exception) {
        caught = exception;
      }
    } catch (...) {
    }
  }
  void invokeSync(const std::string & /*methodName*/, NativeMethodCallFunc &&func) noexcept override
  {
    try {
      func();
    } catch (...) {
    }
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

  ReactNativeFeatureFlags::dangerouslyReset();

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

- (void)testInvokeUnexportedTurboModuleMethodWithNullPassesNil
{
  ReactNativeFeatureFlags::dangerouslyForceOverride(std::make_unique<ReactNativeFeatureFlagsNSNullConversionEnabled>());

  auto hermesRuntime = facebook::hermes::makeHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();

  std::array<facebook::jsi::Value, 1> args = {facebook::jsi::Value::null()};
  module_->invokeObjCMethod(
      *rt,
      VoidKind,
      "testMethodWhichTakesStringWithoutExportMacro",
      @selector(testMethodWhichTakesStringWithoutExportMacro:),
      args.data(),
      args.size());

  OCMVerify(OCMTimes(1), [instance_ testMethodWhichTakesStringWithoutExportMacro:nil]);
  OCMVerify(OCMNever(), [instance_ testMethodWhichTakesStringWithoutExportMacro:(id)kCFNull]);
}

- (void)testInvokeUnexportedTurboModuleMethodWithNullTrailingArgumentPassesNil
{
  ReactNativeFeatureFlags::dangerouslyForceOverride(std::make_unique<ReactNativeFeatureFlagsNSNullConversionEnabled>());

  auto hermesRuntime = facebook::hermes::makeHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();

  __block id capturedAnalyticsModule = (id)kCFNull;
  OCMStub([instance_ logEvent:OCMOCK_ANY
                         data:OCMOCK_ANY
              analyticsModule:[OCMArg checkWithBlock:^BOOL(id value) {
                capturedAnalyticsModule = value;
                return YES;
              }]]);

  std::array<facebook::jsi::Value, 3> args = {
      facebook::jsi::String::createFromAscii(*rt, "some_event"),
      facebook::jsi::Object(*rt),
      facebook::jsi::Value::null()};
  args[1].asObject(*rt).setProperty(*rt, "key", "value");

  module_->invokeObjCMethod(
      *rt, VoidKind, "logEvent", @selector(logEvent:data:analyticsModule:), args.data(), args.size());

  OCMVerify(OCMTimes(1), [instance_ logEvent:@"some_event" data:@{@"key" : @"value"} analyticsModule:nil]);
  XCTAssertNil(capturedAnalyticsModule);

  // `NSNull` is truthy, so this fallback would forward it and throw on -mutableCopy.
  NSString *analyticsModule = (capturedAnalyticsModule != nullptr) ? capturedAnalyticsModule : @"";
  XCTAssertNoThrow([analyticsModule mutableCopy]);
}

// Scrubbing a null in argument position must not scrub nulls nested inside a collection argument.
- (void)testInvokeTurboModuleKeepsNestedNullAsNSNullWhenFlagEnabled
{
  ReactNativeFeatureFlags::dangerouslyForceOverride(std::make_unique<ReactNativeFeatureFlagsNSNullConversionEnabled>());

  auto hermesRuntime = facebook::hermes::makeHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();

  std::array<facebook::jsi::Value, 1> args = {facebook::jsi::Object(*rt)};
  args[0].asObject(*rt).setProperty(*rt, "foo", facebook::jsi::Value::null());
  module_->invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichTakesObject", @selector(testMethodWhichTakesObject:), args.data(), args.size());

  OCMVerify(OCMTimes(1), [instance_ testMethodWhichTakesObject:@{@"foo" : (id)kCFNull}]);
}

// Void methods are always async, so an NSException raised by the module unwinds past every module
// frame before anything reports it. The rethrow is the last point at which the failing module and
// method are still known, so it has to put them on the exception.
- (void)testVoidMethodExceptionCarriesModuleAndMethodName
{
  auto hermesRuntime = facebook::hermes::makeHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();

  auto invoker = std::make_shared<ExceptionCapturingNativeMethodCallInvoker>();
  RCTThrowingTurboModule *instance = [RCTThrowingTurboModule new];
  ObjCTurboModule::InitParams params = {
      .moduleName = "ThrowingTestModule",
      .instance = instance,
      .jsInvoker = nullptr,
      .nativeMethodCallInvoker = invoker,
      .isSyncModule = false,
  };
  ObjCTurboModule module(params);

  auto items = facebook::jsi::Array(*rt, 2);
  items.setValueAtIndex(*rt, 0, facebook::jsi::String::createFromAscii(*rt, "a"));
  items.setValueAtIndex(*rt, 1, facebook::jsi::Value::null());
  std::array<facebook::jsi::Value, 1> args = {facebook::jsi::Value(*rt, items)};

  module.invokeObjCMethod(
      *rt,
      VoidKind,
      "testMethodWhichReadsStringsFromArray",
      @selector(testMethodWhichReadsStringsFromArray:),
      args.data(),
      1);

  NSException *caught = invoker->caught;
  XCTAssertNotNil(caught, @"Sending -length to the NSNull standing in for the null element must raise");
  XCTAssertEqualObjects(caught.name, NSInvalidArgumentException);
  XCTAssertTrue(
      [caught.reason containsString:@"ThrowingTestModule"], @"reason must name the module: %@", caught.reason);
  XCTAssertTrue(
      [caught.reason containsString:@"testMethodWhichReadsStringsFromArray"],
      @"reason must name the method: %@",
      caught.reason);
  // The original failure has to survive alongside the identity rather than be replaced by it.
  XCTAssertTrue([caught.reason containsString:@"unrecognized selector"], @"%@", caught.reason);
  NSException *original = caught.userInfo[@"RCTTurboModuleOriginalException"];
  XCTAssertNotNil(original);
  XCTAssertNotNil(original.callStackReturnAddresses);
  XCTAssertNotNil(original.callStackSymbols);
}

// A native-backed ArrayBuffer is aliased rather than copied, and the RCTArrayBuffer retains
// the backing MutableBuffer, so the alias outlives the JS object.
- (void)testNativeBackedArrayBufferIsAliasedAndKeepsBackingStoreAlive
{
  constexpr size_t kBufferSize = 64 * 1024;

  auto hermesRuntime = facebook::hermes::makeHermesRuntime();
  MutableBufferAwareRuntime runtime(*hermesRuntime);

  auto buffer = std::make_shared<TestMutableBuffer>(kBufferSize);
  *buffer->data() = 0xAB;
  const uint8_t *sourceBytes = buffer->data();

  RCTArrayBuffer *converted = nil;
  {
    facebook::jsi::ArrayBuffer arrayBuffer(runtime, buffer);
    const long ownersBeforeConversion = buffer.use_count();

    id result = TurboModuleConvertUtils::convertJSIValueToObjCObject(
        runtime, facebook::jsi::Value(runtime, arrayBuffer), nullptr, NO, NO);
    XCTAssertTrue([result isKindOfClass:[RCTArrayBuffer class]]);
    converted = (RCTArrayBuffer *)result;

    XCTAssertEqual(
        buffer.use_count(), ownersBeforeConversion + 1, @"The RCTArrayBuffer must retain the backing MutableBuffer");
  }

  XCTAssertTrue(converted.isOwningBytes, @"A native-backed buffer must be safe to retain");
  XCTAssertEqual(converted.length, (NSUInteger)kBufferSize);
  XCTAssertEqual(converted.mutableBytes, (void *)sourceBytes, @"Bytes must be aliased, not copied");

  // Writes through the source are visible, and vice versa: one shared allocation.
  *buffer->data() = 0xCD;
  XCTAssertEqual(*static_cast<const uint8_t *>(converted.mutableBytes), 0xCD);
  *static_cast<uint8_t *>(converted.mutableBytes) = 0xEF;
  XCTAssertEqual(*buffer->data(), 0xEF);

  // Dropping the caller's reference leaves the bytes valid.
  buffer.reset();
  XCTAssertEqual(*static_cast<const uint8_t *>(converted.mutableBytes), 0xEF);
}

@end
