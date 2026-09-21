/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTBridgeModule.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCommon/TestCallInvoker.h>
#import <hermes/hermes.h>
#import <react/bridging/ArrayBuffer.h>

#import <list>
#import <vector>

using namespace facebook::react;

namespace {

std::shared_ptr<facebook::jsi::Runtime> createHermesRuntime(bool enableMicrotaskQueue = false)
{
  if (!enableMicrotaskQueue) {
    return facebook::hermes::makeHermesRuntime();
  }

  return facebook::hermes::makeHermesRuntime(::hermes::vm::RuntimeConfig::Builder().withMicrotaskQueue(true).build());
}

NSMutableData *createIntegerSequenceData(NSUInteger size)
{
  NSMutableData *data = [NSMutableData dataWithLength:size];
  auto *bytes = static_cast<uint8_t *>(data.mutableBytes);
  for (NSUInteger i = 0; i < size; ++i) {
    bytes[i] = static_cast<uint8_t>(i);
  }
  return data;
}

std::vector<uint8_t> bytesFromData(NSData *data)
{
  if (data == nil) {
    return {};
  }

  auto *bytes = static_cast<const uint8_t *>(data.bytes);
  return std::vector<uint8_t>(bytes, bytes + data.length);
}

std::vector<uint8_t> bytesFromArrayBuffer(facebook::jsi::Runtime &runtime, const facebook::jsi::ArrayBuffer &buffer)
{
  auto *bytes = buffer.data(runtime);
  return std::vector<uint8_t>(bytes, bytes + buffer.size(runtime));
}

class ImmediateNativeMethodCallInvoker final : public NativeMethodCallInvoker {
 public:
  void invokeAsync(const std::string &, NativeMethodCallFunc &&func) noexcept override
  {
    func();
  }

  void invokeSync(const std::string &, NativeMethodCallFunc &&func) noexcept override
  {
    func();
  }
};

class QueueingNativeMethodCallInvoker final : public NativeMethodCallInvoker {
 public:
  void invokeAsync(const std::string &, NativeMethodCallFunc &&func) noexcept override
  {
    queue_.push_back(std::move(func));
  }

  void invokeSync(const std::string &, NativeMethodCallFunc &&func) noexcept override
  {
    func();
  }

  void flushQueue()
  {
    while (!queue_.empty()) {
      auto func = std::move(queue_.front());
      queue_.pop_front();
      func();
    }
  }

 private:
  std::list<NativeMethodCallFunc> queue_;
};

} // namespace

@interface RCTTestArrayBufferTurboModule : NSObject <RCTBridgeModule>

@property (nonatomic, copy) NSData *lastReceivedPayload;

@end

@implementation RCTTestArrayBufferTurboModule

RCT_EXPORT_MODULE()

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSMutableData *, testMethodWhichMutatesArrayBuffer : (NSMutableData *)buffer)
{
  auto *bytes = static_cast<uint8_t *>(buffer.mutableBytes);
  for (NSUInteger i = 0; i < buffer.length; ++i) {
    bytes[i] = static_cast<uint8_t>((i + 1) * 10);
  }
  return buffer;
}

RCT_EXPORT_METHOD(testMethodWhichStoresArrayBuffer : (NSMutableData *)payload)
{
  self.lastReceivedPayload = [payload copy];
}

RCT_EXPORT_METHOD(testMethodWhichStoresNestedArrayBuffer : (NSDictionary *)payload)
{
  NSDictionary *nestedPayload = payload[@"nested"];
  self.lastReceivedPayload = [nestedPayload[@"buffer"] copy];
}

RCT_EXPORT_METHOD(
    testMethodWhichReturnsArrayBuffer : (double)size resolve : (RCTPromiseResolveBlock)
        resolve reject : (RCTPromiseRejectBlock)reject)
{
  if (resolve == nil || reject == nil) {
    return;
  }

  resolve(createIntegerSequenceData(static_cast<NSUInteger>(size)));
}

@end

@interface RCTTurboModuleArrayBufferTests : XCTestCase

@end

@implementation RCTTurboModuleArrayBufferTests

- (void)testSyncArrayBufferRoundTrip
{
  auto hermesRuntime = createHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();
  auto *instance = [RCTTestArrayBufferTurboModule new];

  ObjCTurboModule::InitParams params = {
      .moduleName = "TestModule",
      .instance = instance,
      .jsInvoker = nullptr,
      .nativeMethodCallInvoker = std::make_shared<ImmediateNativeMethodCallInvoker>(),
      .isSyncModule = false,
  };
  ObjCTurboModule module(params);

  auto sourceBuffer = rt->global()
                          .getPropertyAsFunction(*rt, "eval")
                          .call(*rt, "new Uint8Array([1, 2, 3]).buffer")
                          .asObject(*rt)
                          .getArrayBuffer(*rt);
  facebook::jsi::Value args[1] = {facebook::jsi::Value(*rt, sourceBuffer)};

  auto result = module.invokeObjCMethod(
      *rt,
      ArrayBufferKind,
      "testMethodWhichMutatesArrayBuffer",
      @selector(testMethodWhichMutatesArrayBuffer:),
      args,
      1);

  XCTAssertTrue(result.isObject());
  XCTAssertTrue(result.asObject(*rt).isArrayBuffer(*rt));

  auto returnedBuffer = result.asObject(*rt).getArrayBuffer(*rt);
  auto returnedBytes = bytesFromArrayBuffer(*rt, returnedBuffer);
  XCTAssertEqual(returnedBytes.size(), 3u);
  XCTAssertEqual(returnedBytes[0], 10);
  XCTAssertEqual(returnedBytes[1], 20);
  XCTAssertEqual(returnedBytes[2], 30);
}

- (void)testAsyncJSBackedArrayBufferIsCopied
{
  auto hermesRuntime = createHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();
  auto nativeInvoker = std::make_shared<QueueingNativeMethodCallInvoker>();
  auto *instance = [RCTTestArrayBufferTurboModule new];

  ObjCTurboModule::InitParams params = {
      .moduleName = "TestModule",
      .instance = instance,
      .jsInvoker = nullptr,
      .nativeMethodCallInvoker = nativeInvoker,
      .isSyncModule = false,
  };
  ObjCTurboModule module(params);

  auto sourceBuffer = rt->global()
                          .getPropertyAsFunction(*rt, "eval")
                          .call(*rt, "new Uint8Array([1, 2, 3]).buffer")
                          .asObject(*rt)
                          .getArrayBuffer(*rt);
  facebook::jsi::Value args[1] = {facebook::jsi::Value(*rt, sourceBuffer)};

  module.invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichStoresArrayBuffer", @selector(testMethodWhichStoresArrayBuffer:), args, 1);

  auto *sourceBytes = sourceBuffer.data(*rt);
  sourceBytes[0] = 9;
  sourceBytes[1] = 8;
  sourceBytes[2] = 7;

  nativeInvoker->flushQueue();

  auto receivedBytes = bytesFromData(instance.lastReceivedPayload);
  XCTAssertEqual(receivedBytes.size(), 3u);
  XCTAssertEqual(receivedBytes[0], 1);
  XCTAssertEqual(receivedBytes[1], 2);
  XCTAssertEqual(receivedBytes[2], 3);
}

- (void)testAsyncNestedJSBackedArrayBufferIsCopied
{
  auto hermesRuntime = createHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();
  auto nativeInvoker = std::make_shared<QueueingNativeMethodCallInvoker>();
  auto *instance = [RCTTestArrayBufferTurboModule new];

  ObjCTurboModule::InitParams params = {
      .moduleName = "TestModule",
      .instance = instance,
      .jsInvoker = nullptr,
      .nativeMethodCallInvoker = nativeInvoker,
      .isSyncModule = false,
  };
  ObjCTurboModule module(params);

  auto sourceObject = rt->global()
                          .getPropertyAsFunction(*rt, "eval")
                          .call(*rt, "({nested: {buffer: new Uint8Array([1, 2, 3]).buffer}})")
                          .asObject(*rt);
  auto sourceBuffer = sourceObject.getProperty(*rt, "nested")
                          .asObject(*rt)
                          .getProperty(*rt, "buffer")
                          .asObject(*rt)
                          .getArrayBuffer(*rt);
  facebook::jsi::Value args[1] = {facebook::jsi::Value(*rt, sourceObject)};

  module.invokeObjCMethod(
      *rt,
      VoidKind,
      "testMethodWhichStoresNestedArrayBuffer",
      @selector(testMethodWhichStoresNestedArrayBuffer:),
      args,
      1);

  auto *sourceBytes = sourceBuffer.data(*rt);
  sourceBytes[0] = 9;
  sourceBytes[1] = 8;
  sourceBytes[2] = 7;

  nativeInvoker->flushQueue();

  auto receivedBytes = bytesFromData(instance.lastReceivedPayload);
  XCTAssertEqual(receivedBytes.size(), 3u);
  XCTAssertEqual(receivedBytes[0], 1);
  XCTAssertEqual(receivedBytes[1], 2);
  XCTAssertEqual(receivedBytes[2], 3);
}

- (void)testAsyncNativeBackedArrayBufferRetainsBackingStore
{
  auto hermesRuntime = createHermesRuntime();
  facebook::jsi::Runtime *rt = hermesRuntime.get();
  auto nativeInvoker = std::make_shared<QueueingNativeMethodCallInvoker>();
  auto *instance = [RCTTestArrayBufferTurboModule new];

  ObjCTurboModule::InitParams params = {
      .moduleName = "TestModule",
      .instance = instance,
      .jsInvoker = nullptr,
      .nativeMethodCallInvoker = nativeInvoker,
      .isSyncModule = false,
  };
  ObjCTurboModule module(params);

  facebook::jsi::Value args[1] = {facebook::jsi::Value::undefined()};
  {
    auto nativeBuffer = std::make_shared<detail::OwnedBytesBuffer>(std::vector<uint8_t>{4, 5, 6, 7});
    auto sourceBuffer = facebook::jsi::ArrayBuffer(*rt, nativeBuffer);
    args[0] = facebook::jsi::Value(*rt, sourceBuffer);
  }

  module.invokeObjCMethod(
      *rt, VoidKind, "testMethodWhichStoresArrayBuffer", @selector(testMethodWhichStoresArrayBuffer:), args, 1);
  args[0] = facebook::jsi::Value::undefined();

  nativeInvoker->flushQueue();

  auto receivedBytes = bytesFromData(instance.lastReceivedPayload);
  XCTAssertEqual(receivedBytes.size(), 4u);
  XCTAssertEqual(receivedBytes[0], 4);
  XCTAssertEqual(receivedBytes[1], 5);
  XCTAssertEqual(receivedBytes[2], 6);
  XCTAssertEqual(receivedBytes[3], 7);
}

- (void)testPromiseResolvesArrayBuffer
{
  auto hermesRuntime = createHermesRuntime(true);
  facebook::jsi::Runtime *rt = hermesRuntime.get();
  auto jsInvoker = std::make_shared<TestCallInvoker>(*rt);
  auto *instance = [RCTTestArrayBufferTurboModule new];

  ObjCTurboModule::InitParams params = {
      .moduleName = "TestModule",
      .instance = instance,
      .jsInvoker = jsInvoker,
      .nativeMethodCallInvoker = std::make_shared<ImmediateNativeMethodCallInvoker>(),
      .isSyncModule = false,
  };
  ObjCTurboModule module(params);

  facebook::jsi::Value args[1] = {facebook::jsi::Value(4.0)};
  auto promiseValue = module.invokeObjCMethod(
      *rt,
      PromiseKind,
      "testMethodWhichReturnsArrayBuffer",
      @selector(testMethodWhichReturnsArrayBuffer:resolve:reject:),
      args,
      1);

  auto promise = promiseValue.asObject(*rt);
  auto then = promise.getPropertyAsFunction(*rt, "then");

  std::vector<uint8_t> resolvedBytes;
  auto onResolved = facebook::jsi::Function::createFromHostFunction(
      *rt,
      facebook::jsi::PropNameID::forAscii(*rt, "onResolved"),
      1,
      [&resolvedBytes](
          facebook::jsi::Runtime &runtime,
          const facebook::jsi::Value &,
          const facebook::jsi::Value *callbackArgs,
          size_t count) -> facebook::jsi::Value {
        if (count == 1 && callbackArgs[0].isObject() && callbackArgs[0].asObject(runtime).isArrayBuffer(runtime)) {
          resolvedBytes = bytesFromArrayBuffer(runtime, callbackArgs[0].asObject(runtime).getArrayBuffer(runtime));
        }
        return facebook::jsi::Value::undefined();
      });
  then.callWithThis(*rt, promise, onResolved);

  jsInvoker->flushQueue();

  XCTAssertEqual(resolvedBytes.size(), 4u);
  XCTAssertEqual(resolvedBytes[0], 0);
  XCTAssertEqual(resolvedBytes[1], 1);
  XCTAssertEqual(resolvedBytes[2], 2);
  XCTAssertEqual(resolvedBytes[3], 3);
}

@end
