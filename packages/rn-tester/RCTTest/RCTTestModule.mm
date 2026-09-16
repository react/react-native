/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTestModule.h"

#import <React/RCTAssert.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <ReactCommon/RCTTurboModule.h>

#import "FBSnapshotTestController.h"

#import "RCTTestPlugins.h"

@protocol NativeTestModuleSpec <RCTBridgeModule, RCTTurboModule>

- (void)markTestCompleted;
- (void)markTestPassed:(BOOL)success;
- (void)verifySnapshot:(RCTResponseSenderBlock)callback;

@end

namespace facebook {
namespace react {
/**
 * ObjC++ class for module 'TestModule'
 */

class JSI_EXPORT NativeTestModuleSpecJSI : public ObjCTurboModule {
 public:
  NativeTestModuleSpecJSI(const ObjCTurboModule::InitParams &params);
};
} // namespace react
} // namespace facebook

namespace facebook {
namespace react {

static facebook::jsi::Value __hostFunction_NativeTestModuleSpecJSI_markTestCompleted(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "markTestCompleted", @selector(markTestCompleted), args, count);
}

static facebook::jsi::Value __hostFunction_NativeTestModuleSpecJSI_markTestPassed(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "markTestPassed", @selector(markTestPassed:), args, count);
}

static facebook::jsi::Value __hostFunction_NativeTestModuleSpecJSI_verifySnapshot(
    facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "verifySnapshot", @selector(verifySnapshot:), args, count);
}

NativeTestModuleSpecJSI::NativeTestModuleSpecJSI(const ObjCTurboModule::InitParams &params) : ObjCTurboModule(params)
{
  methodMap_["markTestCompleted"] = MethodMetadata{0, __hostFunction_NativeTestModuleSpecJSI_markTestCompleted};

  methodMap_["markTestPassed"] = MethodMetadata{1, __hostFunction_NativeTestModuleSpecJSI_markTestPassed};

  methodMap_["verifySnapshot"] = MethodMetadata{1, __hostFunction_NativeTestModuleSpecJSI_verifySnapshot};
}

} // namespace react
} // namespace facebook

@interface RCTTestModule () <NativeTestModuleSpec>
@end

@implementation RCTTestModule {
  NSMutableDictionary<NSString *, NSNumber *> *_snapshotCounter;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return _bridge.uiManager.methodQueue;
}

- (void)setMethodQueue:(dispatch_queue_t)methodQueue
{
  // noop
}

- (void)verifySnapshot:(RCTResponseSenderBlock)callback
{
  RCTAssert(_controller != nil, @"No snapshot controller configured.");

  [_bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    NSString *testName = NSStringFromSelector(self->_testSelector);
    if (!self->_snapshotCounter) {
      self->_snapshotCounter = [NSMutableDictionary new];
    }

    NSNumber *counter = @([self->_snapshotCounter[testName] integerValue] + 1);
    self->_snapshotCounter[testName] = counter;

    NSError *error = nil;
    NSString *identifier = [counter stringValue];
    if (self->_testSuffix) {
      identifier = [identifier stringByAppendingString:self->_testSuffix];
    }
    BOOL success = [self->_controller compareSnapshotOfView:self->_view
                                                   selector:self->_testSelector
                                                 identifier:identifier
                                                      error:&error];
    if (!success) {
      RCTLogInfo(@"Failed to verify snapshot %@ (error: %@)", identifier, error);
    }
    callback(@[ @(success) ]);
  }];
}

RCT_EXPORT_METHOD(sendAppEvent : (NSString *)name body : (nullable id)body)
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [[_moduleRegistry moduleForName:"EventDispatcher"] sendAppEventWithName:name body:body];
#pragma clang diagnostic pop
}

RCT_REMAP_METHOD(
    shouldResolve,
    shouldResolve_resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  resolve(@1);
}

RCT_REMAP_METHOD(
    shouldReject,
    shouldReject_resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  reject(nil, nil, nil);
}

- (void)markTestCompleted
{
  [self markTestPassed:YES];
}

- (void)markTestPassed:(BOOL)success
{
  [_bridge.uiManager
      addUIBlock:^(__unused RCTUIManager *uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        self->_status = success ? RCTTestStatusPassed : RCTTestStatusFailed;
      }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTestModuleSpecJSI>(params);
}

@end

Class RCTTestModuleCls(void)
{
  return RCTTestModule.class;
}
