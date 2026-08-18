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

#import <memory>
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
