/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <Foundation/Foundation.h>

#import <React/CallInvoker.h>
#import <React/NativeModuleCore.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTModuleMethod.h>
#import <functional>
#import <memory>
#import <mutex>
#import <string>
#import <string_view>
#import <unordered_map>
#import <vector>

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
    BOOL useNSNull = NO,
    BOOL mustCopyBytes = YES);
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
   *
   * mustCopyBytes says whether the invocation may outlive the JS call, in which case ArrayBuffer arguments must be
   * copied rather than aliased.
   */
  virtual void setInvocationArg(
      jsi::Runtime &runtime,
      const char *methodName,
      const std::string &objCArgType,
      const jsi::Value &arg,
      size_t i,
      NSInvocation *inv,
      NSMutableArray *retainedObjectsForInvocation,
      bool mustCopyBytes);

 private:
  // Does the NativeModule dispatch async methods to the JS thread?
  const bool isSyncModule_;

  struct MethodInfo {
    // Looked up on the method's first call, since it doesn't change.
    NSMethodSignature *signature;
    // Argument types declared with RCT_EXPORT_METHOD, used to convert arguments with RCTConvert.
    NSArray<NSString *> *argumentTypeNames;
    // RCTCxxConvert selectors that convert arguments to C++ structs, set by the generated code.
    std::vector<SEL> argConversionSelectors;
  };
  struct MethodNameHash {
    using is_transparent = void;
    size_t operator()(std::string_view methodName) const
    {
      return std::hash<std::string_view>{}(methodName);
    }
  };
  // Keyed by the method's JS name; looked up without allocating a std::string.
  std::unordered_map<std::string, MethodInfo, MethodNameHash, std::equal_to<>> methodInfos_;
  bool argumentTypeNamesLoaded_{false};
  std::mutex methodInfosMutex_;
  MethodInfo &findOrCreateMethodInfo(std::string_view methodName);
  NSMethodSignature *getMethodSignature(const char *methodName, SEL selector);

  bool isMethodSync(TurboModuleMethodValueKind returnType);
  bool mustCopyJSHeapArrayBufferBytes(TurboModuleMethodValueKind returnType);
  BOOL hasMethodArgConversionSelector(NSString *methodName, size_t argIndex);
  SEL getMethodArgConversionSelector(NSString *methodName, size_t argIndex);
  NSInvocation *createMethodInvocation(
      jsi::Runtime &runtime,
      bool isSync,
      bool mustCopyBytes,
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
