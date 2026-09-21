/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTModuleMethod.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>
#import <functional>
#import <memory>
#import <string>
#import <unordered_map>

#define RCT_IS_TURBO_MODULE_CLASS(klass) \
  ((RCTTurboModuleEnabled() && [(klass) conformsToProtocol:@protocol(RCTTurboModule)]))
#define RCT_IS_TURBO_MODULE_INSTANCE(module) RCT_IS_TURBO_MODULE_CLASS([(module) class])

namespace facebook::react {

class CallbackWrapper;
class Instance;
using EventEmitterCallback = std::function<void(const std::string &, id)>;

namespace TurboModuleConvertUtils {
jsi::Value convertObjCObjectToJSIValue(jsi::Runtime &runtime, id value);
id convertJSIValueToObjCObject(
    jsi::Runtime &runtime,
    const jsi::Value &value,
    const std::shared_ptr<CallInvoker> &jsInvoker,
    BOOL useNSNull = NO);
} // namespace TurboModuleConvertUtils

template <>
struct Bridging<id> {
  static jsi::Value toJs(jsi::Runtime &rt, const id &value)
  {
    return TurboModuleConvertUtils::convertObjCObjectToJSIValue(rt, value);
  }
};

/**
 * ObjC++ specific TurboModule base class.
 */
class JSI_EXPORT ObjCTurboModule : public TurboModule {
 public:
  // TODO(T65603471): Should we unify this with a Fabric abstraction?
  struct InitParams {
    std::string moduleName;
    id<RCTBridgeModule> instance;
    std::shared_ptr<CallInvoker> jsInvoker;
    std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker;
    bool isSyncModule;
  };

  ObjCTurboModule(const InitParams &params);

  jsi::Value invokeObjCMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind returnType,
      const std::string &methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count);

  id<RCTBridgeModule> instance_;
  std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker_;

 protected:
  void setMethodArgConversionSelector(NSString *methodName, size_t argIndex, NSString *fnName);

  void setEventEmitterCallback(EventEmitterCallback eventEmitterCallback);

  /**
   * Why is this virtual?
   *
   * Purpose: Converts native module method returns from Objective C values to JavaScript values.
   *
   * ObjCTurboModule uses TurboModuleMethodValueKind to convert returns from Objective C values to JavaScript values.
   * ObjCInteropTurboModule just blindly converts returns from Objective C values to JavaScript values by runtime type,
   * because it cannot infer TurboModuleMethodValueKind from the RCT_EXPORT_METHOD annotations.
   */
  virtual jsi::Value convertReturnIdToJSIValue(
      jsi::Runtime &runtime,
      const char *methodName,
      TurboModuleMethodValueKind returnType,
      id result);

  /**
   * Why is this virtual?
   *
   * Purpose: Get a native module method's argument's type, given the method name, and argument index.
   *
   * ObjCInteropTurboModule computes the argument type names eagerly on module init. So, make this method virtual. That
   * way, ObjCInteropTurboModule doesn't end up computing the argument types twice: once on module init, and second on
   * method dispatch.
   */
  virtual NSString *getArgumentTypeName(jsi::Runtime &runtime, NSString *methodName, int argIndex);

  /**
   * Why is this virtual?
   *
   * Purpose: Convert arguments from JavaScript values to Objective C values. Assign the Objective C argument to the
   * method invocation.
   *
   * ObjCInteropTurboModule relies heavily on RCTConvert to convert arguments from JavaScript values to Objective C
   * values. ObjCTurboModule tries to minimize reliance on RCTConvert: RCTConvert uses the RCT_EXPORT_METHOD macros,
   * which we want to remove long term from React Native.
   */
  virtual void setInvocationArg(
      jsi::Runtime &runtime,
      const char *methodName,
      const std::string &objCArgType,
      const jsi::Value &arg,
      size_t i,
      NSInvocation *inv,
      NSMutableArray *retainedObjectsForInvocation);

 private:
  // Does the NativeModule dispatch async methods to the JS thread?
  const bool isSyncModule_;

  /**
   * TODO(ramanpreet):
   * Investigate an optimization that'll let us get rid of this NSMutableDictionary.
   * Perhaps, have the code-generated TurboModule subclass implement
   * getMethodArgConversionSelector below.
   */
  NSMutableDictionary<NSString *, NSMutableArray *> *methodArgConversionSelectors_;
  NSDictionary<NSString *, NSArray<NSString *> *> *methodArgumentTypeNames_;

  bool isMethodSync(TurboModuleMethodValueKind returnType);
  BOOL hasMethodArgConversionSelector(NSString *methodName, size_t argIndex);
  SEL getMethodArgConversionSelector(NSString *methodName, size_t argIndex);
  NSInvocation *createMethodInvocation(
      jsi::Runtime &runtime,
      bool isSync,
      const char *methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count,
      NSMutableArray *retainedObjectsForInvocation);
  id performMethodInvocation(
      jsi::Runtime &runtime,
      bool isSync,
      const char *methodName,
      NSInvocation *inv,
      NSMutableArray *retainedObjectsForInvocation);
  void performVoidMethodInvocation(
      jsi::Runtime &runtime,
      const char *methodName,
      NSInvocation *inv,
      NSMutableArray *retainedObjectsForInvocation);

  using PromiseInvocationBlock = void (^)(RCTPromiseResolveBlock resolveWrapper, RCTPromiseRejectBlock rejectWrapper);
  jsi::Value createPromise(jsi::Runtime &runtime, const std::string &methodName, PromiseInvocationBlock invoke);
};

} // namespace facebook::react

@interface EventEmitterCallbackWrapper : NSObject {
 @public
  facebook::react::EventEmitterCallback _eventEmitterCallback;
}
@end

/**
 * Factory object that can create a Turbomodule. It could be either a C++ TM or any TurboModule.
 * This needs to be an Objective-C class so we can instantiate it at runtime.
 */
@protocol RCTModuleProvider <NSObject>

/**
 * Create an instance of a TurboModule with the JS Invoker.
 */
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params;
@end

/**
 * Protocol that objects can inherit to conform to be treated as turbomodules.
 * It inherits from RCTTurboModuleProvider, meaning that a TurboModule can create itself
 */
@protocol RCTTurboModule <RCTModuleProvider>

@optional
- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *)eventEmitterCallbackWrapper;
@end

/**
 * These methods are all implemented by RCTCxxBridge, which subclasses RCTBridge. Hence, they must only be used in
 * contexts where the concrete class of an RCTBridge instance is RCTCxxBridge. This happens, for example, when
 * [RCTCxxBridgeDelegate jsExecutorFactoryForBridge:(RCTBridge *)] is invoked by RCTCxxBridge.
 *
 * TODO: Consolidate this extension with the one in RCTSurfacePresenter.
 */
@interface RCTBridge (RCTTurboModule)
- (std::shared_ptr<facebook::react::CallInvoker>)jsCallInvoker;
- (std::shared_ptr<facebook::react::NativeMethodCallInvoker>)decorateNativeMethodCallInvoker:
    (std::shared_ptr<facebook::react::NativeMethodCallInvoker>)nativeMethodCallInvoker;
@end
