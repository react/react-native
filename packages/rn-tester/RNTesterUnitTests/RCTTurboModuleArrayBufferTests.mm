/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTArrayBuffer.h>
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

RCTArrayBuffer *createIntegerSequenceBuffer(NSUInteger size)
{
  RCTArrayBuffer *buffer = [RCTArrayBuffer arrayBufferWithLength:size];
  auto *bytes = static_cast<uint8_t *>(buffer.mutableBytes);
  for (NSUInteger i = 0; i < size; ++i) {
    bytes[i] = static_cast<uint8_t>(i);
  }
  return buffer;
}

RCTArrayBuffer *arrayBufferFromData(NSData *data)
{
  return [RCTArrayBuffer arrayBufferWithCopiedBytes:data.bytes length:data.length];
}

NSMutableData *mutableDataFromArrayBuffer(RCTArrayBuffer *arrayBuffer)
{
  return [NSMutableData dataWithBytes:arrayBuffer.mutableBytes length:arrayBuffer.length];
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
@property (nonatomic, assign) BOOL sawLegacyNSData;
@property (nonatomic, assign) BOOL sawWritableBytes;
@property (nonatomic, assign) BOOL sawOwningBytes;

@end

@implementation RCTTestArrayBufferTurboModule

RCT_EXPORT_MODULE()

- (NSMutableData *)testMethodWhichTransformsArrayBuffer:(NSData *)buffer
{
  return mutableDataFromArrayBuffer(
      [self testMethodWhichTransformsArrayBufferWithRCTArrayBuffer:arrayBufferFromData(buffer)]);
}

- (RCTArrayBuffer *)testMethodWhichTransformsArrayBufferWithRCTArrayBuffer:(RCTArrayBuffer *)buffer
{
  RCTArrayBuffer *result = [RCTArrayBuffer arrayBufferWithLength:buffer.length];
  auto *destinationBytes = static_cast<uint8_t *>(result.mutableBytes);
  for (NSUInteger i = 0; i < buffer.length; ++i) {
    destinationBytes[i] = static_cast<uint8_t>((i + 1) * 10);
  }
  return result;
}

- (NSMutableData *)testMethodWhichReturnsItsArgument:(NSData *)buffer
{
  return mutableDataFromArrayBuffer(
      [self testMethodWhichReturnsItsArgumentWithRCTArrayBuffer:arrayBufferFromData(buffer)]);
}

- (RCTArrayBuffer *)testMethodWhichReturnsItsArgumentWithRCTArrayBuffer:(RCTArrayBuffer *)buffer
{
  auto *bytes = static_cast<uint8_t *>(buffer.mutableBytes);
  for (NSUInteger i = 0; i < buffer.length && i < 3; ++i) {
    bytes[i] = static_cast<uint8_t>(99 - i);
  }
  return buffer;
}

- (NSMutableData *)testLegacyMethodWhichTransformsArrayBuffer:(NSData *)buffer
{
  self.sawLegacyNSData = [buffer isKindOfClass:[NSData class]];
  NSMutableData *result = [NSMutableData dataWithData:buffer];
  auto *bytes = static_cast<uint8_t *>(result.mutableBytes);
  for (NSUInteger i = 0; i < result.length; ++i) {
    bytes[i] += 1;
  }
  return result;
}

- (NSNumber *)testMethodWhichChecksArrayBufferOwnership:(NSData *)buffer
{
  return [self testMethodWhichChecksArrayBufferOwnershipWithRCTArrayBuffer:arrayBufferFromData(buffer)];
}

- (NSNumber *)testMethodWhichChecksArrayBufferOwnershipWithRCTArrayBuffer:(RCTArrayBuffer *)buffer
{
  // An observable in-place write verifies that RCTArrayBuffer still exposes mutable storage.
  auto *bytes = static_cast<uint8_t *>(buffer.mutableBytes);
  bytes[0] = 77;
  self.sawWritableBytes = buffer.length == 3 && bytes[0] == 77;
  self.sawOwningBytes = buffer.isOwningBytes;
  return @(YES);
}

- (void)testMethodWhichStoresArrayBuffer:(NSData *)payload
{
  [self testMethodWhichStoresArrayBufferWithRCTArrayBuffer:arrayBufferFromData(payload)];
}

- (void)testMethodWhichStoresArrayBufferWithRCTArrayBuffer:(RCTArrayBuffer *)payload
{
  self.lastReceivedPayload = [NSData dataWithBytes:payload.mutableBytes length:payload.length];
}

- (void)testMethodWhichCallsBackWithArrayBuffer:(double)size callback:(RCTResponseSenderBlock)callback
{
  callback(@[ createIntegerSequenceBuffer(static_cast<NSUInteger>(size)) ]);
}

- (void)testMethodWhichReturnsArrayBuffer:(double)size
                                  resolve:(RCTPromiseResolveBlock)resolve
                                   reject:(RCTPromiseRejectBlock)reject
{
  if (resolve == nil || reject == nil) {
    return;
  }

  resolve(createIntegerSequenceBuffer(static_cast<NSUInteger>(size)));
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
      "testMethodWhichTransformsArrayBuffer",
      @selector(testMethodWhichTransformsArrayBufferWithRCTArrayBuffer:),
      @selector(testMethodWhichTransformsArrayBuffer:),
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

// The new sync entry point receives a live alias, so an in-place write reaches the JS ArrayBuffer.
- (void)testJSBackedArrayBufferIsNotCopiedDuringTheNewCall
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

  module.invokeObjCMethod(
      *rt,
      BooleanKind,
      "testMethodWhichChecksArrayBufferOwnership",
      @selector(testMethodWhichChecksArrayBufferOwnershipWithRCTArrayBuffer:),
      @selector(testMethodWhichChecksArrayBufferOwnership:),
      args,
      1);

  XCTAssertTrue(instance.sawWritableBytes);
  XCTAssertFalse(instance.sawOwningBytes);
  XCTAssertEqual(bytesFromArrayBuffer(*rt, sourceBuffer)[0], 77);
}

- (void)testLegacyNSDataSignatureRoundTrip
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
      "testLegacyMethodWhichTransformsArrayBuffer",
      NSSelectorFromString(@"testLegacyMethodWhichTransformsArrayBufferWithRCTArrayBuffer:"),
      @selector(testLegacyMethodWhichTransformsArrayBuffer:),
      args,
      1);

  auto returnedBytes = bytesFromArrayBuffer(*rt, result.asObject(*rt).getArrayBuffer(*rt));
  XCTAssertTrue(instance.sawLegacyNSData);
  XCTAssertEqual(returnedBytes.size(), 3u);
  XCTAssertEqual(returnedBytes[0], 2);
  XCTAssertEqual(returnedBytes[1], 3);
  XCTAssertEqual(returnedBytes[2], 4);
  XCTAssertEqual(bytesFromArrayBuffer(*rt, sourceBuffer)[0], 1, @"The legacy argument must be an owning copy");
}

// Returning the argument must hand JS the mutated bytes: it has to stay valid through the
// return-value conversion.
- (void)testSyncMethodCanReturnItsOwnArgument
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
      "testMethodWhichReturnsItsArgument",
      @selector(testMethodWhichReturnsItsArgumentWithRCTArrayBuffer:),
      @selector(testMethodWhichReturnsItsArgument:),
      args,
      1);

  XCTAssertTrue(result.isObject());
  XCTAssertTrue(result.asObject(*rt).isArrayBuffer(*rt));
  auto returnedBytes = bytesFromArrayBuffer(*rt, result.asObject(*rt).getArrayBuffer(*rt));
  XCTAssertEqual(returnedBytes.size(), 3u, @"Returning the argument must not yield an empty buffer");
  XCTAssertEqual(returnedBytes[0], 99);
  XCTAssertEqual(returnedBytes[1], 98);
  XCTAssertEqual(returnedBytes[2], 97);
}

// A zero-length ArrayBuffer must round-trip, NULL bytes pointer and all.
- (void)testEmptyArrayBufferRoundTrip
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

  auto sourceBuffer =
      rt->global().getPropertyAsFunction(*rt, "eval").call(*rt, "new ArrayBuffer(0)").asObject(*rt).getArrayBuffer(*rt);
  facebook::jsi::Value args[1] = {facebook::jsi::Value(*rt, sourceBuffer)};

  auto result = module.invokeObjCMethod(
      *rt,
      ArrayBufferKind,
      "testMethodWhichTransformsArrayBuffer",
      @selector(testMethodWhichTransformsArrayBufferWithRCTArrayBuffer:),
      @selector(testMethodWhichTransformsArrayBuffer:),
      args,
      1);

  XCTAssertTrue(result.isObject());
  XCTAssertTrue(result.asObject(*rt).isArrayBuffer(*rt));
  XCTAssertEqual(result.asObject(*rt).getArrayBuffer(*rt).size(*rt), 0u);
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
      *rt,
      VoidKind,
      "testMethodWhichStoresArrayBuffer",
      @selector(testMethodWhichStoresArrayBufferWithRCTArrayBuffer:),
      @selector(testMethodWhichStoresArrayBuffer:),
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
      *rt,
      VoidKind,
      "testMethodWhichStoresArrayBuffer",
      @selector(testMethodWhichStoresArrayBufferWithRCTArrayBuffer:),
      @selector(testMethodWhichStoresArrayBuffer:),
      args,
      1);
  args[0] = facebook::jsi::Value::undefined();

  nativeInvoker->flushQueue();

  auto receivedBytes = bytesFromData(instance.lastReceivedPayload);
  XCTAssertEqual(receivedBytes.size(), 4u);
  XCTAssertEqual(receivedBytes[0], 4);
  XCTAssertEqual(receivedBytes[1], 5);
  XCTAssertEqual(receivedBytes[2], 6);
  XCTAssertEqual(receivedBytes[3], 7);
}

// A buffer handed to a callback is delivered to JS after the native call has returned.
- (void)testCallbackDeliversArrayBuffer
{
  auto hermesRuntime = createHermesRuntime();
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

  std::vector<uint8_t> callbackBytes;
  auto onCallback = facebook::jsi::Function::createFromHostFunction(
      *rt,
      facebook::jsi::PropNameID::forAscii(*rt, "onCallback"),
      1,
      [&callbackBytes](
          facebook::jsi::Runtime &runtime,
          const facebook::jsi::Value &,
          const facebook::jsi::Value *callbackArgs,
          size_t count) -> facebook::jsi::Value {
        if (count == 1 && callbackArgs[0].isObject() && callbackArgs[0].asObject(runtime).isArrayBuffer(runtime)) {
          callbackBytes = bytesFromArrayBuffer(runtime, callbackArgs[0].asObject(runtime).getArrayBuffer(runtime));
        }
        return facebook::jsi::Value::undefined();
      });
  facebook::jsi::Value args[2] = {facebook::jsi::Value(3.0), facebook::jsi::Value(*rt, onCallback)};

  module.invokeObjCMethod(
      *rt,
      VoidKind,
      "testMethodWhichCallsBackWithArrayBuffer",
      @selector(testMethodWhichCallsBackWithArrayBuffer:callback:),
      args,
      2);

  jsInvoker->flushQueue();

  XCTAssertEqual(callbackBytes.size(), 3u);
  XCTAssertEqual(callbackBytes[0], 0);
  XCTAssertEqual(callbackBytes[1], 1);
  XCTAssertEqual(callbackBytes[2], 2);
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
