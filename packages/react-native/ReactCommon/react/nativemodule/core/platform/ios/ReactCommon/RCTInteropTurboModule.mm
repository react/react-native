/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RCTInteropTurboModule.h"

#ifndef RCT_REMOVE_LEGACY_MODULE_INTEROP

#import <objc/message.h>
#import <objc/runtime.h>

#import <React/RCTAssert.h>
#import <React/RCTConvert.h>
#import <React/RCTCxxConvert.h>
#import <React/RCTManagedPointer.h>
#import <React/RCTModuleMethod.h>
#import <React/RCTParserUtils.h>

namespace facebook::react {

namespace {

// This is used for generating short exception strings.
std::string getType(jsi::Runtime &rt, const jsi::Value &v)
{
  if (v.isUndefined()) {
    return "undefined";
  } else if (v.isNull()) {
    return "null";
  } else if (v.isBool()) {
    return v.getBool() ? "true" : "false";
  } else if (v.isNumber()) {
    return "number";
  } else if (v.isString()) {
    return "string";
  } else if (v.isSymbol()) {
    return "symbol";
  } else if (v.isBigInt()) {
    return "bigint";
  } else if (v.isObject()) {
    jsi::Object vObj = v.getObject(rt);
    return vObj.isFunction(rt) ? "function" : vObj.isArray(rt) ? "array" : "object";
  } else {
    return "unknown";
  }
}

std::vector<const RCTMethodInfo *> getMethodInfos(Class moduleClass)
{
  std::vector<const RCTMethodInfo *> methodInfos;

  Class cls = moduleClass;
  while ((cls != nullptr) && cls != [NSObject class] && cls != [NSProxy class]) {
    unsigned int methodCount;
    Method *methods = class_copyMethodList(object_getClass(cls), &methodCount);

    for (unsigned int i = 0; i < methodCount; i++) {
      Method method = methods[i];
      SEL selector = method_getName(method);
      if ([NSStringFromSelector(selector) hasPrefix:@"__rct_export__"]) {
        IMP imp = method_getImplementation(method);
        const RCTMethodInfo *methodInfo = ((const RCTMethodInfo *(*)(id, SEL))imp)(moduleClass, selector);
        methodInfos.push_back(methodInfo);
      }
    }

    free(methods);
    cls = class_getSuperclass(cls);
  }

  return methodInfos;
}

NSString *getJSMethodName(const RCTMethodInfo *methodInfo)
{
  std::string jsName = methodInfo->jsName;
  if (!jsName.empty()) {
    return @(jsName.c_str());
  }

  NSString *methodName = @(methodInfo->objcName);
  NSRange colonRange = [methodName rangeOfString:@":"];
  if (colonRange.location != NSNotFound) {
    methodName = [methodName substringToIndex:colonRange.location];
  }
  methodName = [methodName stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  RCTAssert(
      methodName.length,
      @"%s is not a valid JS function name, please"
       " supply an alternative using RCT_REMAP_METHOD()",
      methodInfo->objcName);

  return methodName;
}

class ObjCInteropTurboModuleParseException : public std::runtime_error {
 public:
  ObjCInteropTurboModuleParseException(std::string moduleName, std::string methodName, std::string message)
      : std::runtime_error(
            "Failed to create module \"" + moduleName + "\": Error while parsing method " + moduleName + "." +
            methodName + ": " + message)
  {
  }
};

struct ExportedMethod {
  NSString *methodName;
  NSArray<NSString *> *argumentTypes;
  std::string returnType;
  SEL selector;
};

std::vector<ExportedMethod> parseExportedMethods(std::string moduleName, Class moduleClass)
{
  std::vector<const RCTMethodInfo *> methodInfos = getMethodInfos(moduleClass);
  std::vector<ExportedMethod> methods;
  methods.reserve(methodInfos.size());

  for (const RCTMethodInfo *methodInfo : methodInfos) {
    NSString *jsMethodName = getJSMethodName(methodInfo);
    NSArray<RCTMethodArgument *> *arguments;
    SEL objCMethodSelector = NSSelectorFromString(RCTParseMethodSignature(methodInfo->objcName, &arguments));
    NSMethodSignature *objCMethodSignature = [moduleClass instanceMethodSignatureForSelector:objCMethodSelector];
    if (objCMethodSignature == nullptr) {
      RCTLogWarn(
          @"The Objective-C `%s` method signature for the JS method `%@` can not be found in the Objective-C definition of the %s module.\nThe `%@` JS method will not be available.",
          methodInfo->objcName,
          jsMethodName,
          moduleName.c_str(),
          jsMethodName);
      continue;
    }
    std::string objCMethodReturnType = [objCMethodSignature methodReturnType];

    if (objCMethodSignature.numberOfArguments - 2 != [arguments count]) {
      std::string message = "Parsed argument count (i.e: " + std::to_string([arguments count]) +
          ") != Objective C method signature argument count (i.e: " +
          std::to_string(objCMethodSignature.numberOfArguments - 2) + ").";
      throw ObjCInteropTurboModuleParseException(moduleName, [jsMethodName UTF8String], message);
    }

    NSMutableArray<NSString *> *argumentTypes = [NSMutableArray new];
    for (NSUInteger i = 0; i < [arguments count]; i += 1) {
      [argumentTypes addObject:arguments[i].type];
    }

    if ([argumentTypes count] == 1) {
      std::string lastArgType = [argumentTypes[[argumentTypes count] - 1] UTF8String];
      if (lastArgType == "RCTPromiseResolveBlock" || lastArgType == "RCTPromiseRejectBlock") {
        std::string message =
            "Methods that return promises must accept a RCTPromiseResolveBlock followed by a RCTPromiseRejectBlock. This method just accepts a " +
            lastArgType + ".";
        throw ObjCInteropTurboModuleParseException(moduleName, [jsMethodName UTF8String], message);
      }
    } else if ([argumentTypes count] > 1) {
      std::string lastArgType = [argumentTypes[[argumentTypes count] - 1] UTF8String];
      std::string secondLastArgType = [argumentTypes[[argumentTypes count] - 2] UTF8String];
      if ((secondLastArgType == "RCTPromiseResolveBlock" && lastArgType != "RCTPromiseRejectBlock") ||
          (secondLastArgType != "RCTPromiseResolveBlock" && lastArgType == "RCTPromiseRejectBlock")) {
        std::string message =
            "Methods that return promises must accept a RCTPromiseResolveBlock followed by a RCTPromiseRejectBlock. This method accepts a " +
            secondLastArgType + " followed by a " + lastArgType + ".";
        throw ObjCInteropTurboModuleParseException(moduleName, [jsMethodName UTF8String], message);
      }
    }

    methods.push_back(
        {.methodName = jsMethodName,
         .argumentTypes = argumentTypes,
         .returnType = objCMethodReturnType,
         .selector = objCMethodSelector});
  }

  return methods;
}

SEL selectorForType(NSString *type)
{
  const char *input = type.UTF8String;
  return NSSelectorFromString([RCTParseType(&input) stringByAppendingString:@":"]);
}

template <typename T>
T RCTConvertTo(SEL selector, id json)
{
  T (*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;
  return convert([RCTConvert class], selector, json);
}

} // namespace

ObjCInteropTurboModule::ObjCInteropTurboModule(const ObjCTurboModule::InitParams &params)
    : ObjCTurboModule(params), constantsCache_(jsi::Value::undefined())
{
  std::vector<ExportedMethod> methods = parseExportedMethods(name_, [params.instance class]);
  methodDescriptors_.reserve(methods.size());

  NSMutableDictionary<NSString *, NSArray<NSString *> *> *methodArgTypeNames = [NSMutableDictionary new];
  methodArgumentTypeNames_ = methodArgTypeNames;

  for (const ExportedMethod &method : methods) {
    const size_t numArgs = [method.argumentTypes count];
    const bool isPromiseMethod =
        numArgs >= 2 && [method.argumentTypes[numArgs - 1] isEqualToString:@"RCTPromiseRejectBlock"];

    const size_t jsArgCount = isPromiseMethod ? numArgs - 2 : numArgs;

    /**
     * In the TurboModule system, only promises and voids are special. So, set those.
     * In the else case, just assume ObjectKind. This will be ignored by the interop layer.
     * In the else case, the interop layer will just call into ::convertReturnIdToJSIValue()
     */
    const TurboModuleMethodValueKind returnKind = isPromiseMethod ? PromiseKind
        : method.returnType == @encode(void)                      ? VoidKind
                                                                  : ObjectKind;

    methodMap_[[method.methodName UTF8String]] =
        MethodMetadata{.argCount = static_cast<size_t>(jsArgCount), .invoker = nullptr};

    for (NSUInteger i = 0; i < numArgs; i += 1) {
      NSString *typeName = method.argumentTypes[i];

      if ([typeName hasPrefix:@"JS::"]) {
        NSString *rctCxxConvertSelector =
            [[typeName stringByReplacingOccurrencesOfString:@"::" withString:@"_"] stringByAppendingString:@":"];
        setMethodArgConversionSelector(method.methodName, i, rctCxxConvertSelector);
      }
    }

    methodArgTypeNames[method.methodName] = method.argumentTypes;
    methodDescriptors_.push_back({
        .methodName = [method.methodName UTF8String],
        .selector = method.selector,
        .jsArgCount = jsArgCount,
        .jsReturnKind = returnKind,
    });
  }

  if ([params.instance respondsToSelector:@selector(constantsToExport)]) {
    methodDescriptors_.push_back({
      .methodName = "getConstants", .selector = @selector(constantsToExport), .jsArgCount = 0,
      .jsReturnKind = ObjectKind,
    });
  } else {
    static SEL getConstantsSelector = NSSelectorFromString(@"getConstants");
    if ([params.instance respondsToSelector:getConstantsSelector]) {
      methodDescriptors_.push_back({
          .methodName = "getConstants",
          .selector = getConstantsSelector,
          .jsArgCount = 0,
          .jsReturnKind = ObjectKind,
      });
    }
  }
}

jsi::Value ObjCInteropTurboModule::create(jsi::Runtime &runtime, const jsi::PropNameID &propName)
{
  for (size_t i = 0; i < methodDescriptors_.size(); i += 1) {
    if (methodDescriptors_[i].methodName == propName.utf8(runtime)) {
      if (propName.utf8(runtime) == "getConstants") {
        return jsi::Function::createFromHostFunction(
            runtime,
            propName,
            static_cast<unsigned int>(methodDescriptors_[i].jsArgCount),
            [this, i](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) mutable {
              if (!this->constantsCache_.isUndefined()) {
                return jsi::Value(rt, this->constantsCache_);
              }
              const std::string &methodName = this->methodDescriptors_[i].methodName;
              NSString *moduleName = [[this->instance_ class] description];
              this->_logLegacyArchitectureWarning(moduleName, methodName);

              // TODO: Dispatch getConstants to the main queue, if the module requires main queue setup
              jsi::Value ret = this->invokeObjCMethod(
                  rt,
                  this->methodDescriptors_[i].jsReturnKind,
                  methodName,
                  this->methodDescriptors_[i].selector,
                  args,
                  count);

              bool isRetValid = ret.isUndefined() || ret.isNull() ||
                  (ret.isObject() && !ret.asObject(rt).isFunction(rt) && !ret.asObject(rt).isArray(rt));

              if (!isRetValid) {
                std::string methodJsSignature = name_ + ".getConstants()";
                std::string errorPrefix = methodJsSignature + ": ";
                throw jsi::JSError(
                    rt,
                    errorPrefix + "Expected return value to be null, undefined, or a plain object. But, got: " +
                        getType(rt, ret));
              }

              if (ret.isUndefined() || ret.isNull()) {
                this->constantsCache_ = jsi::Object(rt);
              } else {
                this->constantsCache_ = jsi::Value(rt, ret);
              }

              return ret;
            });
      }

      return jsi::Function::createFromHostFunction(
          runtime,
          propName,
          static_cast<unsigned int>(methodDescriptors_[i].jsArgCount),
          [this, i](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) {
            const std::string &methodName = this->methodDescriptors_[i].methodName;
            NSString *moduleName = [[this->instance_ class] description];
            this->_logLegacyArchitectureWarning(moduleName, methodName);

            return this->invokeObjCMethod(
                rt,
                this->methodDescriptors_[i].jsReturnKind,
                methodName,
                this->methodDescriptors_[i].selector,
                args,
                count);
          });
    }
  }

  jsi::Object constants = getConstants(runtime).asObject(runtime);
  jsi::Value constant = constants.getProperty(runtime, propName);

  if (!constant.isUndefined()) {
    // TODO(T145105887): Output warning. Tried to access a constant as a
    // property on the native module object. Please migrate to getConstants().
  }

  return constant;
}

void ObjCInteropTurboModule::_logLegacyArchitectureWarning(NSString *moduleName, const std::string &methodName)
{
  if (!RCTAreLegacyLogsEnabled()) {
    return;
  }

  std::string separator = std::string(".");

  std::string moduleInvocation = [moduleName cStringUsingEncoding:NSUTF8StringEncoding] + separator + methodName;
  if (warnedModuleInvocation_.find(moduleInvocation) == warnedModuleInvocation_.end()) {
    RCTLogWarn(
        @"The `%@` module is invoking the `%s` method using the TurboModule interop layer. This is part of the compatibility layer with the Legacy Architecture. If `%@` is a local module, please migrate it to be a Native Module as described at https://reactnative.dev/docs/next/turbo-native-modules-introduction. If `%@` is a third party dependency, please open an issue in the library repository.",
        moduleName,
        methodName.c_str(),
        moduleName,
        moduleName);
    warnedModuleInvocation_.insert(moduleInvocation);
  }
}

void ObjCInteropTurboModule::setInvocationArg(
    jsi::Runtime &runtime,
    const char *methodNameCStr,
    const std::string &objCArgType,
    const jsi::Value &jsiArg,
    size_t index,
    NSInvocation *inv,
    NSMutableArray *retainedObjectsForInvocation)
{
  NSString *methodName = @(methodNameCStr);
  std::string methodJsSignature = name_ + "." + methodNameCStr + "()";

  NSString *argumentType = getArgumentTypeName(runtime, methodName, static_cast<int>(index));
  std::string errorPrefix = methodJsSignature + ": Error while converting JavaScript argument " +
      std::to_string(index) + " to Objective C type " + [argumentType UTF8String] + ". ";

  SEL selector = selectorForType(argumentType);

  if ([RCTConvert respondsToSelector:selector]) {
    id objCArg = TurboModuleConvertUtils::convertJSIValueToObjCObject(runtime, jsiArg, jsInvoker_, YES);

    if (objCArgType == @encode(char)) {
      char arg = RCTConvertTo<char>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(unsigned char)) {
      unsigned char arg = RCTConvertTo<unsigned char>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(short)) {
      short arg = RCTConvertTo<short>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(unsigned short)) {
      unsigned short arg = RCTConvertTo<unsigned short>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(int)) {
      int arg = RCTConvertTo<int>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(unsigned int)) {
      unsigned int arg = RCTConvertTo<unsigned int>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(long)) {
      long arg = RCTConvertTo<long>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(unsigned long)) {
      unsigned long arg = RCTConvertTo<unsigned long>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(long long)) {
      long long arg = RCTConvertTo<long long>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(unsigned long long)) {
      unsigned long long arg = RCTConvertTo<unsigned long long>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(float)) {
      float arg = RCTConvertTo<float>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(double)) {
      double arg = RCTConvertTo<double>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(BOOL)) {
      BOOL arg = RCTConvertTo<BOOL>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(SEL)) {
      SEL arg = RCTConvertTo<SEL>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(const char *)) {
      const char *arg = RCTConvertTo<const char *>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(void *)) {
      void *arg = RCTConvertTo<void *>(selector, objCArg);
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType == @encode(id)) {
      id arg = RCTConvertTo<id>(selector, objCArg);

      // Handle the special case where there is an argument and it must be nil
      // Without this check, the JS side will receive an object.
      // See: discussion at
      // https://github.com/facebook/react-native/pull/49250#issuecomment-2668465893
      if (arg == [NSNull null]) {
        return;
      }

      if (arg != nullptr) {
        [retainedObjectsForInvocation addObject:arg];
      }
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    if (objCArgType[0] == _C_STRUCT_B) {
      NSMethodSignature *typeSignature = [RCTConvert methodSignatureForSelector:selector];
      NSInvocation *typeInvocation = [NSInvocation invocationWithMethodSignature:typeSignature];
      typeInvocation.selector = selector;
      typeInvocation.target = [RCTConvert class];

      void *returnValue = malloc(typeSignature.methodReturnLength);
      if (returnValue == nullptr) {
        // CWE - 391 : Unchecked error condition
        // https://www.cvedetails.com/cwe-details/391/Unchecked-Error-Condition.html
        // https://eli.thegreenplace.net/2009/10/30/handling-out-of-memory-conditions-in-c
        abort();
      }
      [typeInvocation setArgument:&objCArg atIndex:2];
      [typeInvocation invoke];

      [typeInvocation getReturnValue:returnValue];
      [inv setArgument:returnValue atIndex:index + 2];
      free(returnValue);
      return;
    }

    const char *BLOCK_TYPE = @encode(
        __typeof__(^{
        }));

    if (objCArgType == BLOCK_TYPE) {
      /**
       * RCTModuleMethod doesn't actually call into RCTConvert in this case.
       */
      id arg = [objCArg copy];
      if (arg != nullptr) {
        [retainedObjectsForInvocation addObject:arg];
      }
      [inv setArgument:&arg atIndex:(index) + 2];
      return;
    }

    throw jsi::JSError(runtime, errorPrefix + "Objective C type " + [argumentType UTF8String] + " is unsupported.");
  }

  if ([argumentType isEqualToString:@"RCTResponseSenderBlock"]) {
    if (!(jsiArg.isObject() && jsiArg.asObject(runtime).isFunction(runtime))) {
      throw jsi::JSError(
          runtime, errorPrefix + "JavaScript argument must be a function. Got " + getType(runtime, jsiArg));
    }

    RCTResponseSenderBlock arg =
        (RCTResponseSenderBlock)TurboModuleConvertUtils::convertJSIValueToObjCObject(runtime, jsiArg, jsInvoker_, YES);
    if (arg != nullptr) {
      [retainedObjectsForInvocation addObject:arg];
    }
    [inv setArgument:&arg atIndex:(index) + 2];
    return;
  }

  if ([argumentType isEqualToString:@"RCTResponseErrorBlock"]) {
    if (!(jsiArg.isObject() && jsiArg.asObject(runtime).isFunction(runtime))) {
      throw jsi::JSError(
          runtime, errorPrefix + "JavaScript argument must be a function. Got " + getType(runtime, jsiArg));
    }

    RCTResponseSenderBlock senderBlock =
        (RCTResponseSenderBlock)TurboModuleConvertUtils::convertJSIValueToObjCObject(runtime, jsiArg, jsInvoker_, YES);
    RCTResponseErrorBlock arg = ^(NSError *error) {
      senderBlock(@[ RCTJSErrorFromNSError(error) ]);
    };
    [retainedObjectsForInvocation addObject:arg];
    [inv setArgument:&arg atIndex:(index) + 2];
    return;
  }

  if ([argumentType isEqualToString:@"RCTPromiseResolveBlock"] ||
      [argumentType isEqualToString:@"RCTPromiseRejectBlock"]) {
    throw jsi::JSError(
        runtime,
        errorPrefix + "The TurboModule interop layer should not convert JavaScript arguments to " +
            [argumentType UTF8String] +
            " inside ObjCinteropTurboModule::setInvocationArg(). Please report this as an issue.");
  }

  if ([argumentType hasPrefix:@"JS::"]) {
    NSString *selectorNameForCxxType =
        [[argumentType stringByReplacingOccurrencesOfString:@"::" withString:@"_"] stringByAppendingString:@":"];
    selector = NSSelectorFromString(selectorNameForCxxType);

    bool isPlainObject = jsiArg.isObject() && !jsiArg.asObject(runtime).isFunction(runtime) &&
        !jsiArg.asObject(runtime).isArray(runtime);
    if (!isPlainObject) {
      throw jsi::JSError(
          runtime, errorPrefix + "JavaScript argument must be a plain object. Got " + getType(runtime, jsiArg));
    }

    id arg = TurboModuleConvertUtils::convertJSIValueToObjCObject(runtime, jsiArg, jsInvoker_, YES);

    RCTManagedPointer *(*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;
    RCTManagedPointer *box = convert([RCTCxxConvert class], selector, arg);

    void *pointer = box.voidPointer;
    [inv setArgument:&pointer atIndex:index + 2];
    [retainedObjectsForInvocation addObject:box];
    return;
  }
}

jsi::Value ObjCInteropTurboModule::convertReturnIdToJSIValue(
    jsi::Runtime &runtime,
    const char *methodNameCStr,
    TurboModuleMethodValueKind returnType,
    id result)
{
  if (returnType == VoidKind) {
    return jsi::Value::undefined();
  }

  if (result == (id)kCFNull || result == nil) {
    return jsi::Value::null();
  }

  jsi::Value returnValue = TurboModuleConvertUtils::convertObjCObjectToJSIValue(runtime, result);
  if (!returnValue.isUndefined()) {
    return returnValue;
  }

  std::string methodJsSignature = name_ + "." + methodNameCStr + "()";
  throw jsi::JSError(runtime, methodJsSignature + "Objective C type was unsupported.");
}

NSString *ObjCInteropTurboModule::getArgumentTypeName(jsi::Runtime &runtime, NSString *methodName, int argIndex)
{
  const char *methodNameCStr = [methodName UTF8String];
  std::string methodJsSignature = name_ + "." + methodNameCStr + "()";
  std::string errorPrefix =
      methodJsSignature + ": Error while trying to get Objective C type of parameter " + std::to_string(argIndex) + ".";

  if (methodArgumentTypeNames_[methodName] == nil) {
    throw jsi::JSError(runtime, errorPrefix + "No parameter types found for method.");
  }

  if ([methodArgumentTypeNames_[methodName] count] <= argIndex) {
    size_t paramCount = [methodArgumentTypeNames_[methodName] count];
    throw jsi::JSError(runtime, errorPrefix + "Method has only " + std::to_string(paramCount) + " parameter types.");
  }

  return methodArgumentTypeNames_[methodName][argIndex];
}

bool ObjCInteropTurboModule::exportsConstants()
{
  for (size_t i = 0; i < methodDescriptors_.size(); i += 1) {
    if (methodDescriptors_[i].methodName == "getConstants") {
      return true;
    }
  }

  return false;
}

const jsi::Value &ObjCInteropTurboModule::getConstants(jsi::Runtime &runtime)
{
  if (!constantsCache_.isUndefined()) {
    return constantsCache_;
  }

  if (!exportsConstants()) {
    constantsCache_ = jsi::Object(runtime);
    return constantsCache_;
  }

  jsi::Value getConstantsProp = get(runtime, jsi::PropNameID::forAscii(runtime, "getConstants"));

  if (getConstantsProp.isObject()) {
    jsi::Object getConstantsObj = getConstantsProp.asObject(runtime);
    if (getConstantsObj.isFunction(runtime)) {
      jsi::Function getConstantsFn = getConstantsObj.asFunction(runtime);
      getConstantsFn.call(runtime);
      return constantsCache_;
    }
  }

  // Unable to invoke the getConstants() method.
  // Maybe the module didn't define a getConstants() method.
  // Default constants to {}, so no constants are spread into the NativeModule
  constantsCache_ = jsi::Object(runtime);
  return constantsCache_;
}

std::vector<facebook::jsi::PropNameID> ObjCInteropTurboModule::getPropertyNames(facebook::jsi::Runtime &runtime)
{
  std::vector<facebook::jsi::PropNameID> propNames = ObjCTurboModule::getPropertyNames(runtime);

  jsi::Object constants = getConstants(runtime).asObject(runtime);
  jsi::Array constantNames = constants.getPropertyNames(runtime);

  for (size_t i = 0; i < constantNames.size(runtime); i += 1) {
    jsi::Value constantName = constantNames.getValueAtIndex(runtime, i);
    if (constantName.isString()) {
      propNames.push_back(jsi::PropNameID::forString(runtime, constantName.asString(runtime)));
    }
  }

  return propNames;
}

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_MODULE_INTEROP
