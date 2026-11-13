/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSampleLegacyModule.h"

@implementation RCTSampleLegacyModule

// Backward-compatible export
RCT_EXPORT_MODULE()

// Backward-compatible queue configuration
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

// Backward compatible invalidation
- (void)invalidate
{
  // Actually do nothing here.
  NSLog(@"Invalidating RCTSampleTurboModule...");
}

- (NSDictionary *)getConstants
{
  return @{
    @"const1" : @YES,
    @"const2" : @(390),
    @"const3" : @"something",
  };
}

// TODO: Remove once fully migrated to TurboModule.
- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

RCT_EXPORT_METHOD(voidFunc)
{
  // Nothing to do
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getBool : (BOOL)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getEnum : (double)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getNumber : (double)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getFloat : (float)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getInt : (int)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getLongLong : (int64_t)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getUnsignedLongLong : (uint64_t)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getNSInteger : (NSInteger)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getNSUInteger : (NSUInteger)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSArray<id<NSObject>> *, getArray : (NSArray *)arg)
{
  return arg;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSDictionary *, getObject : (NSDictionary *)arg)
{
  return arg;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString *, getString : (NSString *)arg)
{
  return arg;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getNSNumber : (nonnull NSNumber *)arg)
{
  return arg;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSDictionary *, getUnsafeObject : (NSDictionary *)arg)
{
  return arg;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getRootTag : (double)arg)
{
  return @(arg);
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSDictionary *, getValue : (double)x y : (NSString *)y z : (NSDictionary *)z)
{
  return @{
    @"x" : @(x),
    @"y" : (y != nullptr) ? y : [NSNull null],
    @"z" : (z != nullptr) ? z : [NSNull null],
  };
}

RCT_EXPORT_METHOD(getValueWithCallback : (RCTResponseSenderBlock)callback)
{
  if (callback == nullptr) {
    return;
  }
  callback(@[ @"value from callback!" ]);
}

RCT_EXPORT_METHOD(
    getValueWithPromise : (BOOL)error resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
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

RCT_EXPORT_METHOD(voidFuncThrows)
{
  NSException *myException = [NSException exceptionWithName:@"Excepption"
                                                     reason:@"Intentional exception from ObjC voidFuncThrows"
                                                   userInfo:nil];
  @throw myException;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSDictionary *, getObjectThrows : (NSDictionary *)arg)
{
  NSException *myException = [NSException exceptionWithName:@"Excepption"
                                                     reason:@"Intentional exception from ObjC getObjectThrows"
                                                   userInfo:nil];
  @throw myException;
}

RCT_EXPORT_METHOD(
    promiseThrows : (BOOL)error resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  NSException *myException = [NSException exceptionWithName:@"Excepption"
                                                     reason:@"Intentional exception from ObjC promiseThrows"
                                                   userInfo:nil];
  @throw myException;
}

RCT_EXPORT_METHOD(voidFuncAssert)
{
  RCTAssert(false, @"Intentional assert from ObjC voidFuncAssert");
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSDictionary *, getObjectAssert : (NSDictionary *)arg)
{
  RCTAssert(false, @"Intentional assert from ObjC getObjectAssert");
  return arg;
}

RCT_EXPORT_METHOD(
    promiseAssert : (BOOL)error resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  RCTAssert(false, @"Intentional assert from ObjC promiseAssert");
}

@end
