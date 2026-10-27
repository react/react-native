/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>
#import <React/RCTModuleMethod.h>

@interface AllocationTestModule : NSObject <RCTBridgeModule, RCTInvalidating>

@property (atomic, assign, getter=isValid) BOOL valid;

@end

@implementation AllocationTestModule

RCT_EXPORT_MODULE();

- (instancetype)init
{
  if ((self = [super init])) {
    self.valid = YES;
  }
  return self;
}

- (void)invalidate
{
  self.valid = NO;
}

RCT_EXPORT_METHOD(
    test : (__unused NSString *)a : (__unused NSNumber *)b : (__unused RCTResponseSenderBlock)
        c : (__unused RCTResponseErrorBlock)d)
{
}

@end

@interface RCTAllocationTests : XCTestCase
@end

@implementation RCTAllocationTests

- (void)testModuleMethodsAreDeallocated
{
  static RCTMethodInfo methodInfo = {
      .objcName = "test:(NSString *)a :(nonnull NSNumber *)b :(RCTResponseSenderBlock)c :(RCTResponseErrorBlock)d",
      .jsName = "",
      .isSync = false};

  __weak RCTModuleMethod *weakMethod;
  @autoreleasepool {
    __autoreleasing RCTModuleMethod *method =
        [[RCTModuleMethod alloc] initWithExportedMethod:&methodInfo moduleClass:[AllocationTestModule class]];
    XCTAssertNotNil(method, @"RCTModuleMethod should have been created");
    weakMethod = method;
  }

  RCT_RUN_RUNLOOP_WHILE(weakMethod)
  XCTAssertNil(weakMethod, @"RCTModuleMethod should have been deallocated");
}

@end
