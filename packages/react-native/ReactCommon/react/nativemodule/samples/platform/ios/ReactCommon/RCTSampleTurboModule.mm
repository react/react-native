/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSampleTurboModule.h"

#import <React/RCTArrayBuffer.h>
#import "RCTSampleTurboModulePlugin.h"

#import <React/RCTAssert.h>
#import <React/RCTInitializing.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModuleWithJSIBindings.h>
#import <UIKit/UIKit.h>

#include <span>

using namespace facebook::react;

@interface RCTSampleTurboModule () <RCTTurboModuleWithJSIBindings, RCTInitializing>
@end

@implementation RCTSampleTurboModule {
  facebook::react::ModuleConstants<JS::NativeSampleTurboModule::Constants> _constants;
}

// Backward-compatible export
RCT_EXPORT_MODULE()

// Backward-compatible queue configuration
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (void)initialize
{
  UIScreen *mainScreen = UIScreen.mainScreen;
  CGSize screenSize = mainScreen.bounds.size;

  _constants = facebook::react::typedConstants<JS::NativeSampleTurboModule::Constants>({
      .const1 = YES,
      .const2 = screenSize.width,
      .const3 = @"something",
  });
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeSampleTurboModuleSpecJSI>(params);
}

// Backward compatible invalidation
- (void)invalidate
{
  // Actually do nothing here.
  NSLog(@"Invalidating RCTSampleTurboModule...");
}

- (facebook::react::ModuleConstants<JS::NativeSampleTurboModule::Constants>)constantsToExport
{
  return _constants;
}

- (facebook::react::ModuleConstants<JS::NativeSampleTurboModule::Constants>)getConstants
{
  return _constants;
}

- (void)getImageUrl:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  reject(@"Exception", @"Not implemented", nil);
}

#pragma mark - RCTTurboModuleWithJSIBindings

- (void)installJSIBindingsWithRuntime:(facebook::jsi::Runtime &)runtime
                          callInvoker:(const std::shared_ptr<CallInvoker> &)callinvoker
{
  runtime.global().setProperty(runtime, "__SampleTurboModuleJSIBindings", "Hello JSI!");
}

#pragma mark - Spec Methods

- (void)voidFunc
{
  // Nothing to do
  [self emitOnPress];
  [self emitOnClick:@"click"];
  [self emitOnChange:@{@"a" : @1, @"b" : @"two"}];
  [self emitOnSubmit:@[ @{@"a" : @1, @"b" : @"two"}, @{@"a" : @3, @"b" : @"four"} ]];
}

- (NSNumber *)getBool:(BOOL)arg
{
  return @(arg);
}

- (NSNumber *)getEnum:(double)arg
{
  return @(arg);
}

- (NSNumber *)getNumber:(double)arg
{
  return @(arg);
}

- (NSString *)getString:(NSString *)arg
{
  return arg;
}

- (NSArray<id<NSObject>> *)getArray:(NSArray *)arg
{
  return arg;
}

- (NSDictionary *)getObject:(NSDictionary *)arg
{
  return arg;
}

- (NSDictionary *)getUnsafeObject:(NSDictionary *)arg
{
  return arg;
}

- (NSNumber *)getRootTag:(double)arg
{
  return @(arg);
}

- (NSDictionary *)getValue:(double)x y:(NSString *)y z:(NSDictionary *)z
{
  return @{
    @"x" : @(x),
    @"y" : (y != nullptr) ? y : [NSNull null],
    @"z" : (z != nullptr) ? z : [NSNull null],
  };
}

// The argument aliases the JS ArrayBuffer's bytes, so mutating in place is visible to JS.
- (RCTArrayBuffer *)getArrayBuffer:(RCTArrayBuffer *)buffer
{
  auto *bytes = static_cast<uint8_t *>(buffer.mutableBytes);
  if (bytes == nullptr) {
    return buffer;
  }

  std::span<uint8_t> byteSpan(bytes, static_cast<size_t>(buffer.length));
  for (auto &byte : byteSpan) {
    byte = static_cast<uint8_t>(byte * 2);
  }
  return buffer;
}

- (RCTArrayBuffer *)createNativeBuffer:(double)size
{
  return [RCTArrayBuffer arrayBufferWithLength:(NSUInteger)size];
}

- (void)processAsyncBuffer:(RCTArrayBuffer *)payload
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  resolve(@(payload.length));
}

- (void)getValueWithCallback:(RCTResponseSenderBlock)callback
{
  if (callback == nullptr) {
    return;
  }
  callback(@[ @"value from callback!" ]);
}

- (void)getValueWithPromise:(BOOL)error resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  if ((resolve == nullptr) || (reject == nullptr)) {
    return;
  }

  if (error) {
    reject(
        @"code_1",
        @"intentional promise rejection",
        [NSError errorWithDomain:@"RCTSampleTurboModule" code:1 userInfo:nil]);
  } else {
    resolve(@"result!");
  }
}

- (void)voidFuncThrows
{
  NSException *myException = [NSException exceptionWithName:@"Exception"
                                                     reason:@"Intentional exception from ObjC voidFuncThrows"
                                                   userInfo:nil];
  @throw myException;
}

- (NSDictionary *)getObjectThrows:(NSDictionary *)arg
{
  NSException *myException = [NSException exceptionWithName:@"Exception"
                                                     reason:@"Intentional exception from ObjC getObjectThrows"
                                                   userInfo:nil];
  @throw myException;
}

- (void)promiseThrows:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  NSException *myException = [NSException exceptionWithName:@"Exception"
                                                     reason:@"Intentional exception from ObjC promiseThrows"
                                                   userInfo:nil];
  @throw myException;
}

- (void)voidFuncAssert
{
  RCTAssert(false, @"Intentional assert from ObjC voidFuncAssert");
}

- (NSDictionary *)getObjectAssert:(NSDictionary *)arg
{
  RCTAssert(false, @"Intentional assert from ObjC getObjectAssert");
  return arg;
}

- (void)promiseAssert:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  RCTAssert(false, @"Intentional assert from ObjC promiseAssert");
}

@end

Class _Nonnull RCTSampleTurboModuleCls(void)
{
  return RCTSampleTurboModule.class;
}
