/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTurboModule.h"

#import <React/RCTBridgeModule.h>
#import <React/RCTConvert.h>
#import <React/RCTCxxConvert.h>
#import <React/RCTManagedPointer.h>
#import <React/RCTModuleMethod.h>
#import <React/RCTUtils.h>
#import <ReactCommon/CallInvoker.h>
#import <ReactCommon/TurboModule.h>
#import <ReactCommon/TurboModulePerfLogger.h>
#import <cxxreact/TraceSection.h>
#import <react/bridging/Bridging.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>

#include <glog/logging.h>

#import <objc/message.h>
#import <objc/runtime.h>
#import <atomic>
#import <iostream>
#import <mutex>

#import <sstream>
#import <vector>

using namespace facebook;
using namespace facebook::react;
using namespace facebook::react::TurboModuleConvertUtils;

static int32_t getUniqueId()
{
  static int32_t counter = 0;
  return counter++;
}

namespace facebook::react {

namespace TurboModuleConvertUtils {
/**
 * All static helper functions are ObjC++ specific.
 */
static jsi::Value convertNSNumberToJSIBoolean(jsi::Runtime &runtime, NSNumber *value)
{
  return jsi::Value((bool)[value boolValue]);
}

static jsi::Value convertNSNumberToJSINumber(jsi::Runtime &runtime, NSNumber *value)
{
  return jsi::Value([value doubleValue]);
}

static jsi::String convertNSStringToJSIString(jsi::Runtime &runtime, NSString *value)
{
  return jsi::String::createFromUtf8(runtime, ([value UTF8String] != nullptr) ? [value UTF8String] : "");
}

static jsi::Object convertNSDictionaryToJSIObject(jsi::Runtime &runtime, NSDictionary *value)
{
  jsi::Object result = jsi::Object(runtime);
  for (NSString *k in value) {
    result.setProperty(runtime, convertNSStringToJSIString(runtime, k), convertObjCObjectToJSIValue(runtime, value[k]));
  }
  return result;
}

static jsi::Array convertNSArrayToJSIArray(jsi::Runtime &runtime, NSArray *value)
{
  jsi::Array result = jsi::Array(runtime, value.count);
  for (size_t i = 0; i < value.count; i++) {
    result.setValueAtIndex(runtime, i, convertObjCObjectToJSIValue(runtime, value[i]));
  }
  return result;
}

static std::vector<jsi::Value> convertNSArrayToStdVector(jsi::Runtime &runtime, NSArray *value)
{
  std::vector<jsi::Value> result;
  for (size_t i = 0; i < value.count; i++) {
    result.emplace_back(convertObjCObjectToJSIValue(runtime, value[i]));
  }
  return result;
}

jsi::Value convertObjCObjectToJSIValue(jsi::Runtime &runtime, id value)
{
  if ([value isKindOfClass:[NSString class]]) {
    return convertNSStringToJSIString(runtime, (NSString *)value);
  } else if ([value isKindOfClass:[NSNumber class]]) {
    if ([value isKindOfClass:[@YES class]]) {
      return convertNSNumberToJSIBoolean(runtime, (NSNumber *)value);
    }
    return convertNSNumberToJSINumber(runtime, (NSNumber *)value);
  } else if ([value isKindOfClass:[NSDictionary class]]) {
    return convertNSDictionaryToJSIObject(runtime, (NSDictionary *)value);
  } else if ([value isKindOfClass:[NSArray class]]) {
    return convertNSArrayToJSIArray(runtime, (NSArray *)value);
  } else if (value == (id)kCFNull) {
    return jsi::Value::null();
  }
  return jsi::Value::undefined();
}

static NSString *convertJSIStringToNSString(jsi::Runtime &runtime, const jsi::String &value)
{
  return [NSString stringWithUTF8String:value.utf8(runtime).c_str()];
}

static NSArray *convertJSIArrayToNSArray(
    jsi::Runtime &runtime,
    const jsi::Array &value,
    const std::shared_ptr<CallInvoker> &jsInvoker,
    BOOL useNSNull)
{
  size_t size = value.size(runtime);
  NSMutableArray *result = [NSMutableArray new];
  for (size_t i = 0; i < size; i++) {
    // Insert kCFNull when it's `undefined` value to preserve the indices.
    id convertedObject = convertJSIValueToObjCObject(runtime, value.getValueAtIndex(runtime, i), jsInvoker, useNSNull);
    [result addObject:(convertedObject != nullptr) ? convertedObject : (id)kCFNull];
  }
  return result;
}

static NSDictionary *convertJSIObjectToNSDictionary(
    jsi::Runtime &runtime,
    const jsi::Object &value,
    const std::shared_ptr<CallInvoker> &jsInvoker,
    BOOL useNSNull)
{
  jsi::Array propertyNames = value.getPropertyNames(runtime);
  size_t size = propertyNames.size(runtime);
  NSMutableDictionary *result = [NSMutableDictionary new];
  for (size_t i = 0; i < size; i++) {
    jsi::String name = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
    NSString *k = convertJSIStringToNSString(runtime, name);
    id v = convertJSIValueToObjCObject(runtime, value.getProperty(runtime, name), jsInvoker, useNSNull);
    if (v != nullptr) {
      result[k] = v;
    }
  }
  return result;
}

static RCTResponseSenderBlock
convertJSIFunctionToCallback(jsi::Runtime &rt, jsi::Function &&function, const std::shared_ptr<CallInvoker> &jsInvoker)
{
  __block std::optional<AsyncCallback<>> callback({rt, std::move(function), jsInvoker});
  return ^(NSArray *args) {
    if (!callback) {
      LOG(FATAL) << "Callback arg cannot be called more than once";
    }

    callback->call([args](jsi::Runtime &rt, jsi::Function &jsFunction) {
      auto jsArgs = convertNSArrayToStdVector(rt, args);
      jsFunction.call(rt, (const jsi::Value *)jsArgs.data(), jsArgs.size());
    });
    callback = std::nullopt;
  };
}

id convertJSIValueToObjCObject(
    jsi::Runtime &runtime,
    const jsi::Value &value,
    const std::shared_ptr<CallInvoker> &jsInvoker,
    BOOL useNSNull)
{
  if (value.isUndefined() || (value.isNull() && !useNSNull)) {
    return nil;
  }
  if (value.isNull() && useNSNull) {
    return (id)kCFNull;
  }
  if (value.isBool()) {
    return @(value.getBool());
  }
  if (value.isNumber()) {
    return @(value.getNumber());
  }
  if (value.isString()) {
    return convertJSIStringToNSString(runtime, value.getString(runtime));
  }
  if (value.isObject()) {
    jsi::Object o = value.getObject(runtime);
    if (o.isArray(runtime)) {
      return convertJSIArrayToNSArray(runtime, o.getArray(runtime), jsInvoker, useNSNull);
    }
    if (o.isFunction(runtime)) {
      return convertJSIFunctionToCallback(runtime, o.getFunction(runtime), jsInvoker);
    }
    return convertJSIObjectToNSDictionary(runtime, o, jsInvoker, useNSNull);
  }

  throw jsi::JSError(runtime, "Unsupported jsi::Value kind");
}

static jsi::Value createJSRuntimeError(jsi::Runtime &runtime, const std::string &message)
{
  return runtime.global().getPropertyAsFunction(runtime, "Error").call(runtime, message);
}

/**
 * Creates JSError with current JS runtime and NSException stack trace.
 */
static jsi::JSError convertNSExceptionToJSError(
    jsi::Runtime &runtime,
    NSException *exception,
    const std::string &moduleName,
    const std::string &methodName)
{
  std::string reason = [exception.reason UTF8String];

  jsi::Object cause(runtime);
  cause.setProperty(runtime, "name", [exception.name UTF8String]);
  cause.setProperty(runtime, "message", reason);
  cause.setProperty(runtime, "stackSymbols", convertNSArrayToJSIArray(runtime, exception.callStackSymbols));
  cause.setProperty(
      runtime, "stackReturnAddresses", convertNSArrayToJSIArray(runtime, exception.callStackReturnAddresses));

  std::string message = moduleName + "." + methodName + " raised an exception: " + reason;
  jsi::Value error = createJSRuntimeError(runtime, message);
  error.asObject(runtime).setProperty(runtime, "cause", std::move(cause));
  return {runtime, std::move(error)};
}

/**
 * Creates JS error value with current JS runtime and error details.
 */
static jsi::Value convertJSErrorDetailsToJSRuntimeError(jsi::Runtime &runtime, NSDictionary *jsErrorDetails)
{
  NSString *message = jsErrorDetails[@"message"];

  auto jsError = createJSRuntimeError(runtime, [message UTF8String]);
  for (NSString *key in jsErrorDetails) {
    id value = jsErrorDetails[key];
    jsError.asObject(runtime).setProperty(runtime, [key UTF8String], convertObjCObjectToJSIValue(runtime, value));
  }

  return jsError;
}

} // namespace TurboModuleConvertUtils

jsi::Value
ObjCTurboModule::createPromise(jsi::Runtime &runtime, const std::string &methodName, PromiseInvocationBlock invoke)
{
  if (invoke == nullptr) {
    return jsi::Value::undefined();
  }

  jsi::Function Promise = runtime.global().getPropertyAsFunction(runtime, "Promise");

  // Note: the passed invoke() block is not retained by default, so let's retain it here to help keep it longer.
  // Otherwise, there's a risk of it getting released before the promise function below executes.
  PromiseInvocationBlock invokeCopy = [invoke copy];
  return Promise.callAsConstructor(
      runtime,
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "fn"),
          2,
          [invokeCopy, jsInvoker = jsInvoker_, moduleName = name_, methodName](
              jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t count) {
            if (count != 2) {
              throw jsi::JSError(
                  rt,
                  moduleName + "." + methodName + "(): Promise must pass constructor function two args. Passed " +
                      std::to_string(count) + " args.");
            }

            __block BOOL resolveWasCalled = NO;
            __block std::optional<AsyncCallback<>> resolve({rt, args[0].getObject(rt).getFunction(rt), jsInvoker});
            __block std::optional<AsyncCallback<>> reject({rt, args[1].getObject(rt).getFunction(rt), jsInvoker});
            __block std::shared_ptr<std::mutex> mutex = std::make_shared<std::mutex>();

            RCTPromiseResolveBlock resolveBlock = ^(id result) {
              std::optional<AsyncCallback<>> localResolve;
              bool alreadyResolved = false;
              bool alreadyRejected = false;
              {
                std::lock_guard<std::mutex> lock(*mutex);
                if (!resolve || !reject) {
                  alreadyResolved = resolveWasCalled;
                  alreadyRejected = !resolveWasCalled;
                } else {
                  resolveWasCalled = YES;
                  localResolve = std::move(resolve);
                  resolve = std::nullopt;
                  reject = std::nullopt;
                }
              }

              if (alreadyResolved) {
                RCTLogError(
                    @"%s.%s(): Tried to resolve a promise more than once.", moduleName.c_str(), methodName.c_str());
                return;
              } else if (alreadyRejected) {
                RCTLogError(
                    @"%s.%s(): Tried to resolve a promise after it's already been rejected.",
                    moduleName.c_str(),
                    methodName.c_str());
                return;
              }

              localResolve->call([result](jsi::Runtime &rt, jsi::Function &jsFunction) {
                jsFunction.call(rt, convertObjCObjectToJSIValue(rt, result));
              });
            };

            RCTPromiseRejectBlock rejectBlock = ^(NSString *code, NSString *message, NSError *error) {
              std::optional<AsyncCallback<>> localReject;
              bool alreadyResolved = false;
              bool alreadyRejected = false;
              {
                std::lock_guard<std::mutex> lock(*mutex);
                if (!resolve || !reject) {
                  alreadyResolved = resolveWasCalled;
                  alreadyRejected = !resolveWasCalled;
                } else {
                  resolveWasCalled = NO;
                  localReject = std::move(reject);
                  reject = std::nullopt;
                  resolve = std::nullopt;
                }
              }

              if (alreadyResolved) {
                RCTLogError(
                    @"%s.%s() Tried to reject a promise after it's already been resolved. Message: %s",
                    moduleName.c_str(),
                    methodName.c_str(),
                    message.UTF8String);
                return;
              } else if (alreadyRejected) {
                RCTLogError(
                    @"%s.%s() Tried to reject a promise more than once. Message: %s",
                    moduleName.c_str(),
                    methodName.c_str(),
                    message.UTF8String);
                return;
              }

              NSDictionary *jsErrorDetails = RCTJSErrorFromCodeMessageAndNSError(code, message, error);
              localReject->call([jsErrorDetails](jsi::Runtime &rt, jsi::Function &jsFunction) {
                jsFunction.call(rt, convertJSErrorDetailsToJSRuntimeError(rt, jsErrorDetails));
              });
            };

            invokeCopy(resolveBlock, rejectBlock);
            return jsi::Value::undefined();
          }));
}

/**
 * Perform method invocation on a specific queue as configured by the module class.
 * This serves as a backward-compatible support for RCTBridgeModule's methodQueue API.
 *
 * In the future:
 * - This methodQueue support may be removed for simplicity and consistency with Android.
 * - ObjC module methods will be always be called from JS thread.
 *   They may decide to dispatch to a different queue as needed.
 */
id ObjCTurboModule::performMethodInvocation(
    jsi::Runtime &runtime,
    bool isSync,
    const char *methodName,
    NSInvocation *inv,
    NSMutableArray *retainedObjectsForInvocation)
{
  __block id result;
  __weak id<RCTBridgeModule> weakModule = instance_;
  const char *moduleName = name_.c_str();
  std::string methodNameStr{methodName};
  __block int32_t asyncCallCounter = 0;

  void (^block)() = ^{
    id<RCTBridgeModule> strongModule = weakModule;
    if (strongModule == nullptr) {
      return;
    }

    if (isSync) {
      TurboModulePerfLogger::syncMethodCallExecutionStart(moduleName, methodName);
    } else {
      TurboModulePerfLogger::asyncMethodCallExecutionStart(moduleName, methodName, asyncCallCounter);
    }

    @try {
      [inv invokeWithTarget:strongModule];
    } @catch (NSException *exception) {
      if (isSync) {
        // We can only convert NSException to JSError in sync method calls.
        // See https://github.com/reactwg/react-native-new-architecture/discussions/276#discussioncomment-12567155
        throw convertNSExceptionToJSError(runtime, exception, std::string{moduleName}, methodNameStr);
      } else {
        @throw exception;
      }
    } @finally {
      [retainedObjectsForInvocation removeAllObjects];
    }

    if (!isSync) {
      TurboModulePerfLogger::asyncMethodCallExecutionEnd(moduleName, methodName, asyncCallCounter);
      return;
    }

    void *rawResult;
    [inv getReturnValue:&rawResult];
    result = (__bridge id)rawResult;
    TurboModulePerfLogger::syncMethodCallExecutionEnd(moduleName, methodName);
  };

  if (isSync) {
    nativeMethodCallInvoker_->invokeSync(methodNameStr, [&]() -> void { block(); });
    return result;
  } else {
    asyncCallCounter = getUniqueId();
    TurboModulePerfLogger::asyncMethodCallDispatch(moduleName, methodName);
    nativeMethodCallInvoker_->invokeAsync(methodNameStr, [block, moduleName, methodNameStr]() -> void {
      TraceSection s(
          "RCTTurboModuleAsyncMethodInvocation",
          "module",
          moduleName,
          "method",
          methodNameStr,
          "returnType",
          "promise");
      block();
    });
    return nil;
  }
}

void ObjCTurboModule::performVoidMethodInvocation(
    jsi::Runtime &runtime,
    const char *methodName,
    NSInvocation *inv,
    NSMutableArray *retainedObjectsForInvocation)
{
  __weak id<RCTBridgeModule> weakModule = instance_;
  const char *moduleName = name_.c_str();
  std::string methodNameStr{methodName};
  __block int32_t asyncCallCounter = 0;

  void (^block)() = ^{
    id<RCTBridgeModule> strongModule = weakModule;
    if (strongModule == nullptr) {
      return;
    }

    TurboModulePerfLogger::asyncMethodCallExecutionStart(moduleName, methodName, asyncCallCounter);

    @try {
      [inv invokeWithTarget:strongModule];
    } @catch (NSException *exception) {
      // Void methods are always async, re-throw instead of converting to
      // JSError, same as the async branch in performMethodInvocation.
      @throw exception;
    } @finally {
      [retainedObjectsForInvocation removeAllObjects];
    }

    TurboModulePerfLogger::asyncMethodCallExecutionEnd(moduleName, methodName, asyncCallCounter);

    return;
  };

  asyncCallCounter = getUniqueId();
  TurboModulePerfLogger::asyncMethodCallDispatch(moduleName, methodName);
  nativeMethodCallInvoker_->invokeAsync(methodNameStr, [moduleName, methodNameStr, block]() -> void {
    TraceSection s(
        "RCTTurboModuleAsyncMethodInvocation", "module", moduleName, "method", methodNameStr, "returnType", "void");
    block();
  });
}

jsi::Value ObjCTurboModule::convertReturnIdToJSIValue(
    jsi::Runtime &runtime,
    const char *methodName,
    TurboModuleMethodValueKind returnType,
    id result)
{
  if (returnType == VoidKind) {
    return jsi::Value::undefined();
  }

  if (result == (id)kCFNull || result == nil) {
    return jsi::Value::null();
  }

  jsi::Value returnValue = jsi::Value::undefined();

  // TODO: Re-use value conversion logic from existing impl, if possible.
  switch (returnType) {
    case VoidKind: {
      break;
    }
    case BooleanKind: {
      returnValue = convertNSNumberToJSIBoolean(runtime, (NSNumber *)result);
      break;
    }
    case NumberKind: {
      returnValue = convertNSNumberToJSINumber(runtime, (NSNumber *)result);
      break;
    }
    case StringKind: {
      returnValue = convertNSStringToJSIString(runtime, (NSString *)result);
      break;
    }
    case ObjectKind: {
      returnValue = convertNSDictionaryToJSIObject(runtime, (NSDictionary *)result);
      break;
    }
    case ArrayKind: {
      returnValue = convertNSArrayToJSIArray(runtime, (NSArray *)result);
      break;
    }
    case FunctionKind:
      throw jsi::JSError(runtime, "convertReturnIdToJSIValue: FunctionKind is not supported yet.");
    case PromiseKind:
      throw jsi::JSError(runtime, "convertReturnIdToJSIValue: PromiseKind wasn't handled properly.");
  }

  return returnValue;
}

/**
 * Given a method name, and an argument index, return type of that argument.
 * Prerequisite: You must wrap the method declaration inside some variant of the
 * RCT_EXPORT_METHOD macro.
 *
 * This method returns nil if the method for which you're querying the argument type
 * is not wrapped in an RCT_EXPORT_METHOD.
 *
 * Note: This is only being introduced for backward compatibility. It will be removed
 *       in the future.
 */
NSString *ObjCTurboModule::getArgumentTypeName(jsi::Runtime &runtime, NSString *methodName, int argIndex)
{
  if (methodArgumentTypeNames_ == nullptr) {
    NSMutableDictionary<NSString *, NSArray<NSString *> *> *methodArgumentTypeNames = [NSMutableDictionary new];

    unsigned int numberOfMethods;
    Class cls = [instance_ class];
    Method *methods = class_copyMethodList(object_getClass(cls), &numberOfMethods);

    if (methods != nullptr) {
      for (unsigned int i = 0; i < numberOfMethods; i++) {
        SEL s = method_getName(methods[i]);
        NSString *mName = NSStringFromSelector(s);
        if (![mName hasPrefix:@"__rct_export__"]) {
          continue;
        }

        // Message dispatch logic from old infra
        RCTMethodInfo *(*getMethodInfo)(id, SEL) = (__typeof__(getMethodInfo))objc_msgSend;
        RCTMethodInfo *methodInfo = getMethodInfo(cls, s);

        NSArray<RCTMethodArgument *> *arguments;
        NSString *otherMethodName = RCTParseMethodSignature(methodInfo->objcName, &arguments);

        NSMutableArray *argumentTypes = [NSMutableArray arrayWithCapacity:[arguments count]];
        for (int j = 0; j < [arguments count]; j += 1) {
          [argumentTypes addObject:arguments[j].type];
        }

        NSString *normalizedOtherMethodName = [otherMethodName componentsSeparatedByString:@":"][0];
        methodArgumentTypeNames[normalizedOtherMethodName] = argumentTypes;
      }

      free(methods);
    }

    methodArgumentTypeNames_ = methodArgumentTypeNames;
  }

  if (methodArgumentTypeNames_[methodName] != nullptr) {
    assert([methodArgumentTypeNames_[methodName] count] > argIndex);
    return methodArgumentTypeNames_[methodName][argIndex];
  }

  return nil;
}

void ObjCTurboModule::setInvocationArg(
    jsi::Runtime &runtime,
    const char *methodName,
    const std::string &objCArgType,
    const jsi::Value &arg,
    size_t i,
    NSInvocation *inv,
    NSMutableArray *retainedObjectsForInvocation)
{
  if (arg.isBool()) {
    bool v = arg.getBool();

    /**
     * JS type checking ensures the Objective C argument here is either a BOOL or NSNumber*.
     */
    if (objCArgType == @encode(id)) {
      id objCArg = [NSNumber numberWithBool:v];
      [inv setArgument:(void *)&objCArg atIndex:i + 2];
      [retainedObjectsForInvocation addObject:objCArg];
    } else {
      [inv setArgument:(void *)&v atIndex:i + 2];
    }

    return;
  }

  if (arg.isNumber()) {
    double v = arg.getNumber();

    /**
     * JS type checking ensures the Objective C argument here is either a double or NSNumber* or NSInteger.
     */
    if (objCArgType == @encode(id)) {
      id objCArg = [NSNumber numberWithDouble:v];
      [inv setArgument:(void *)&objCArg atIndex:i + 2];
      [retainedObjectsForInvocation addObject:objCArg];
    } else if (objCArgType == @encode(NSInteger)) {
      NSInteger integer = v;
      [inv setArgument:&integer atIndex:i + 2];
    } else {
      [inv setArgument:(void *)&v atIndex:i + 2];
    }

    return;
  }

  /**
   * Convert arg to ObjC objects.
   */
  BOOL enableModuleArgumentNSNullConversionIOS = ReactNativeFeatureFlags::enableModuleArgumentNSNullConversionIOS();
  id objCArg = convertJSIValueToObjCObject(runtime, arg, jsInvoker_, enableModuleArgumentNSNullConversionIOS);
  if (objCArg != nullptr) {
    NSString *methodNameNSString = @(methodName);

    /**
     * Convert objects using RCTConvert.
     */
    if (objCArgType == @encode(id)) {
      NSString *argumentType = getArgumentTypeName(runtime, methodNameNSString, static_cast<int>(i));
      if (argumentType != nil) {
        NSString *rctConvertMethodName = [NSString stringWithFormat:@"%@:", argumentType];
        SEL rctConvertSelector = NSSelectorFromString(rctConvertMethodName);

        if ([RCTConvert respondsToSelector:rctConvertSelector]) {
          // Message dispatch logic from old infra
          id (*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;
          id convertedObjCArg = convert([RCTConvert class], rctConvertSelector, objCArg);

          if (enableModuleArgumentNSNullConversionIOS && convertedObjCArg == (id)kCFNull) {
            return;
          }

          [inv setArgument:(void *)&convertedObjCArg atIndex:i + 2];
          if (convertedObjCArg != nullptr) {
            [retainedObjectsForInvocation addObject:convertedObjCArg];
          }
          return;
        }
      }
    }

    /**
     * Convert objects using RCTCxxConvert to structs.
     */
    if ([objCArg isKindOfClass:[NSDictionary class]] && hasMethodArgConversionSelector(methodNameNSString, i)) {
      SEL methodArgConversionSelector = getMethodArgConversionSelector(methodNameNSString, i);

      // Message dispatch logic from old infra (link:
      // https://github.com/facebook/react-native/commit/6783694158057662fd7b11fc123c339b2b21bfe6#diff-263fc157dfce55895cdc16495b55d190R350)
      RCTManagedPointer *(*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;
      RCTManagedPointer *box = convert([RCTCxxConvert class], methodArgConversionSelector, objCArg);

      void *pointer = box.voidPointer;
      [inv setArgument:&pointer atIndex:i + 2];
      [retainedObjectsForInvocation addObject:box];
      return;
    }
  }

  /**
   * Insert converted args unmodified.
   */
  [inv setArgument:(void *)&objCArg atIndex:i + 2];
  if (objCArg != nullptr) {
    [retainedObjectsForInvocation addObject:objCArg];
  }
}

NSInvocation *ObjCTurboModule::createMethodInvocation(
    jsi::Runtime &runtime,
    bool isSync,
    const char *methodName,
    SEL selector,
    const jsi::Value *args,
    size_t count,
    NSMutableArray *retainedObjectsForInvocation)
{
  const char *moduleName = name_.c_str();
  if (isSync) {
    TurboModulePerfLogger::syncMethodCallArgConversionStart(moduleName, methodName);
  } else {
    TurboModulePerfLogger::asyncMethodCallArgConversionStart(moduleName, methodName);
  }

  const NSObject<RCTBridgeModule> *module = instance_;
  NSMethodSignature *methodSignature = [module methodSignatureForSelector:selector];
  if (count > methodSignature.numberOfArguments - 2) {
    throw jsi::JSError(
        runtime,
        name_ + "." + methodName + " called with too many arguments, expected up to " +
            std::to_string(methodSignature.numberOfArguments - 2) + ", got " + std::to_string(count));
  }

  NSInvocation *inv = [NSInvocation invocationWithMethodSignature:methodSignature];
  [inv setSelector:selector];

  for (size_t i = 0; i < count; i++) {
    const jsi::Value &arg = args[i];
    const std::string objCArgType = [methodSignature getArgumentTypeAtIndex:i + 2];
    setInvocationArg(runtime, methodName, objCArgType, arg, i, inv, retainedObjectsForInvocation);
  }

  if (isSync) {
    TurboModulePerfLogger::syncMethodCallArgConversionEnd(moduleName, methodName);
  } else {
    TurboModulePerfLogger::asyncMethodCallArgConversionEnd(moduleName, methodName);
  }

  return inv;
}

bool ObjCTurboModule::isMethodSync(TurboModuleMethodValueKind returnType)
{
  if (isSyncModule_) {
    return true;
  }

  return returnType != VoidKind && returnType != PromiseKind;
}

ObjCTurboModule::ObjCTurboModule(const InitParams &params)
    : TurboModule(params.moduleName, params.jsInvoker),
      instance_(params.instance),
      nativeMethodCallInvoker_(params.nativeMethodCallInvoker),
      isSyncModule_(params.isSyncModule)
{
}

jsi::Value ObjCTurboModule::invokeObjCMethod(
    jsi::Runtime &runtime,
    TurboModuleMethodValueKind returnType,
    const std::string &methodNameStr,
    SEL selector,
    const jsi::Value *args,
    size_t count)
{
  const char *moduleName = name_.c_str();
  const char *methodName = methodNameStr.c_str();

  bool isSyncInvocation = isMethodSync(returnType);

  if (isSyncInvocation) {
    TurboModulePerfLogger::syncMethodCallStart(moduleName, methodName);
  } else {
    TurboModulePerfLogger::asyncMethodCallStart(moduleName, methodName);
  }

  NSMutableArray *retainedObjectsForInvocation = [NSMutableArray arrayWithCapacity:count + 2];
  NSInvocation *inv = createMethodInvocation(
      runtime, isSyncInvocation, methodName, selector, args, count, retainedObjectsForInvocation);

  jsi::Value returnValue = jsi::Value::undefined();

  switch (returnType) {
    case PromiseKind: {
      returnValue = createPromise(
          runtime, methodNameStr, ^(RCTPromiseResolveBlock resolveBlock, RCTPromiseRejectBlock rejectBlock) {
            RCTPromiseResolveBlock resolveCopy = [resolveBlock copy];
            RCTPromiseRejectBlock rejectCopy = [rejectBlock copy];
            [inv setArgument:(void *)&resolveCopy atIndex:count + 2];
            [inv setArgument:(void *)&rejectCopy atIndex:count + 3];
            [retainedObjectsForInvocation addObject:resolveCopy];
            [retainedObjectsForInvocation addObject:rejectCopy];
            // The return type becomes void in the ObjC side.
            performMethodInvocation(runtime, isSyncInvocation, methodName, inv, retainedObjectsForInvocation);
          });
      break;
    }
    case VoidKind: {
      performVoidMethodInvocation(runtime, methodName, inv, retainedObjectsForInvocation);
      if (isSyncInvocation) {
        TurboModulePerfLogger::syncMethodCallReturnConversionStart(moduleName, methodName);
      }
      returnValue = jsi::Value::undefined();
      if (isSyncInvocation) {
        TurboModulePerfLogger::syncMethodCallReturnConversionEnd(moduleName, methodName);
      }
      break;
    }
    case BooleanKind:
    case NumberKind:
    case StringKind:
    case ObjectKind:
    case ArrayKind:
    case FunctionKind: {
      id result = performMethodInvocation(runtime, true, methodName, inv, retainedObjectsForInvocation);
      TurboModulePerfLogger::syncMethodCallReturnConversionStart(moduleName, methodName);
      returnValue = convertReturnIdToJSIValue(runtime, methodName, returnType, result);
      TurboModulePerfLogger::syncMethodCallReturnConversionEnd(moduleName, methodName);
    } break;
  }

  if (isSyncInvocation) {
    TurboModulePerfLogger::syncMethodCallEnd(moduleName, methodName);
  } else {
    TurboModulePerfLogger::asyncMethodCallEnd(moduleName, methodName);
  }

  return returnValue;
}

BOOL ObjCTurboModule::hasMethodArgConversionSelector(NSString *methodName, size_t argIndex)
{
  return (methodArgConversionSelectors_ != nullptr) && (methodArgConversionSelectors_[methodName] != nullptr) &&
      ![methodArgConversionSelectors_[methodName][argIndex] isEqual:(id)kCFNull];
}

SEL ObjCTurboModule::getMethodArgConversionSelector(NSString *methodName, size_t argIndex)
{
  assert(hasMethodArgConversionSelector(methodName, argIndex));
  return (SEL)((NSValue *)methodArgConversionSelectors_[methodName][argIndex]).pointerValue;
}

void ObjCTurboModule::setMethodArgConversionSelector(NSString *methodName, size_t argIndex, NSString *fnName)
{
  if (methodArgConversionSelectors_ == nullptr) {
    methodArgConversionSelectors_ = [NSMutableDictionary new];
  }

  if (methodArgConversionSelectors_[methodName] == nullptr) {
    auto metaData = methodMap_.at([methodName UTF8String]);
    auto argCount = metaData.argCount;

    methodArgConversionSelectors_[methodName] = [NSMutableArray arrayWithCapacity:argCount];
    for (int i = 0; i < argCount; i += 1) {
      [methodArgConversionSelectors_[methodName] addObject:(id)kCFNull];
    }
  }

  SEL selector = NSSelectorFromString(fnName);
  NSValue *selectorValue = [NSValue valueWithPointer:selector];

  methodArgConversionSelectors_[methodName][argIndex] = selectorValue;
}

void ObjCTurboModule::setEventEmitterCallback(EventEmitterCallback eventEmitterCallback)
{
  if ([instance_ conformsToProtocol:@protocol(RCTTurboModule)] &&
      [instance_ respondsToSelector:@selector(setEventEmitterCallback:)]) {
    EventEmitterCallbackWrapper *wrapper = [EventEmitterCallbackWrapper new];
    wrapper->_eventEmitterCallback = std::move(eventEmitterCallback);
    [(id<RCTTurboModule>)instance_ setEventEmitterCallback:wrapper];
  }
}

} // namespace facebook::react

@implementation EventEmitterCallbackWrapper
@end
