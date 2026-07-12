/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <string>

#include <cxxreact/TraceSection.h>
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <jsi/jsi.h>
#include <react/utils/MoveWrapper.h>

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModulePerfLogger.h>
#include <jsi/JSIDynamic.h>
#include <react/bridging/Bridging.h>
#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/jni/JDynamicNative.h>
#include <react/jni/NativeMap.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/jni/WritableNativeMap.h>

#include "JavaTurboModule.h"

namespace facebook::react {

namespace TMPL = TurboModulePerfLogger;

JavaTurboModule::JavaTurboModule(const InitParams& params)
    : TurboModule(params.moduleName, params.jsInvoker),
      instance_(jni::make_global(params.instance)),
      nativeMethodCallInvoker_(params.nativeMethodCallInvoker) {}

JavaTurboModule::~JavaTurboModule() {
  /**
   * TODO(T75896241): In E2E tests, instance_ is null. Investigate why. Can we
   * get rid of this null check?
   */
  if (!instance_) {
    return;
  }

  nativeMethodCallInvoker_->invokeAsync(
      "~" + name_, [instance = std::move(instance_)]() mutable {
        /**
         * Reset the global NativeModule ref on the NativeModules thread. Why:
         *   - ~JavaTurboModule() can be called on a non-JVM thread. If we reset
         * the global ref in ~JavaTurboModule(), we might access the JVM from a
         *     non-JVM thread, which will crash the app.
         */
        instance.reset();
      });
}

namespace {

struct JNIArgs {
  JNIArgs(size_t count) : args(count) {}
  JNIArgs(const JNIArgs&) = delete;
  JNIArgs(JNIArgs&& jniArgs) noexcept = default;

  JNIArgs& operator=(const JNIArgs& other) = delete;
  JNIArgs& operator=(JNIArgs&& other) noexcept = default;

  std::vector<jvalue> args;
  std::vector<jobject> globalRefs;

  ~JNIArgs() {
    JNIEnv* env = jni::Environment::current();
    for (auto globalRef : globalRefs) {
      env->DeleteGlobalRef(globalRef);
    }
  }
};

jsi::Value createJSRuntimeError(jsi::Runtime& runtime, jsi::Value&& message) {
  return runtime.global()
      .getPropertyAsFunction(runtime, "Error")
      .call(runtime, std::move(message));
}

jsi::Value createJSRuntimeError(
    jsi::Runtime& runtime,
    const std::string& message) {
  return createJSRuntimeError(
      runtime, jsi::String::createFromUtf8(runtime, message));
}

jsi::Value createRejectionError(jsi::Runtime& rt, const folly::dynamic& args) {
  react_native_assert(
      args.size() == 1 && "promise reject should has only one argument");

  auto value = jsi::valueFromDynamic(rt, args[0]);
  react_native_assert(value.isObject() && "promise reject should return a map");

  const jsi::Object& valueAsObject = value.asObject(rt);
  auto jsError =
      createJSRuntimeError(rt, valueAsObject.getProperty(rt, "message"));

  auto jsErrorAsObject = jsError.asObject(rt);
  auto propertyNames = valueAsObject.getPropertyNames(rt);
  for (size_t i = 0; i < propertyNames.size(rt); ++i) {
    auto propertyName = jsi::PropNameID::forString(
        rt, propertyNames.getValueAtIndex(rt, i).asString(rt));
    jsErrorAsObject.setProperty(
        rt, propertyName, valueAsObject.getProperty(rt, propertyName));
  }
  return jsError;
}

auto createJavaCallback(
    jsi::Runtime& rt,
    jsi::Function&& function,
    std::shared_ptr<CallInvoker> jsInvoker) {
  std::optional<AsyncCallback<>> callback(
      {rt, std::move(function), std::move(jsInvoker)});
  return JCxxCallbackImpl::newObjectCxxArgs(
      [callback = std::move(callback)](folly::dynamic args) mutable {
        if (!callback) {
          LOG(FATAL) << "Callback arg cannot be called more than once";
          return;
        }
        callback->call([args = std::move(args)](
                           jsi::Runtime& rt, jsi::Function& jsFunction) {
          std::vector<jsi::Value> jsArgs;
          jsArgs.reserve(args.size());
          for (const auto& val : args) {
            jsArgs.emplace_back(jsi::valueFromDynamic(rt, val));
          }
          jsFunction.call(rt, (const jsi::Value*)jsArgs.data(), jsArgs.size());
        });
        callback = std::nullopt;
      });
}

auto createJavaRejectCallback(
    jsi::Runtime& rt,
    jsi::Function&& function,
    std::shared_ptr<CallInvoker> jsInvoker) {
  std::optional<AsyncCallback<>> callback(
      {rt, std::move(function), std::move(jsInvoker)});
  return JCxxCallbackImpl::newObjectCxxArgs(
      [callback = std::move(callback)](folly::dynamic args) mutable {
        if (!callback) {
          LOG(FATAL) << "Callback arg cannot be called more than once";
          return;
        }
        callback->call([args = std::move(args)](
                           jsi::Runtime& rt, jsi::Function& jsFunction) {
          jsFunction.call(rt, createRejectionError(rt, args));
        });
        callback = std::nullopt;
      });
}

struct JPromiseImpl : public jni::JavaClass<JPromiseImpl> {
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/PromiseImpl;";

  static jni::local_ref<javaobject> create(
      jni::local_ref<JCallback::javaobject> resolve,
      jni::local_ref<JCallback::javaobject> reject) {
    return newInstance(resolve, reject);
  }
};

// This is used for generating short exception strings.
std::string stringifyJSIValue(const jsi::Value& v, jsi::Runtime* rt = nullptr) {
  if (v.isUndefined()) {
    return "undefined";
  }

  if (v.isNull()) {
    return "null";
  }

  if (v.isBool()) {
    return std::string("a boolean (") + (v.getBool() ? "true" : "false") + ")";
  }

  if (v.isNumber()) {
    return "a number (" + std::to_string(v.getNumber()) + ")";
  }

  if (v.isString()) {
    return "a string (\"" + v.getString(*rt).utf8(*rt) + "\")";
  }

  react_native_assert(v.isObject() && "Expecting object.");
  return rt != nullptr && v.getObject(*rt).isFunction(*rt) ? "a function"
                                                           : "an object";
}

class JavaTurboModuleArgumentConversionException : public std::runtime_error {
 public:
  JavaTurboModuleArgumentConversionException(
      const std::string& expectedType,
      int index,
      const std::string& methodName,
      const jsi::Value* arg,
      jsi::Runtime* rt)
      : std::runtime_error(
            "Expected argument " + std::to_string(index) + " of method \"" +
            methodName + "\" to be a " + expectedType + ", but got " +
            stringifyJSIValue(*arg, rt)) {}
};

class JavaTurboModuleInvalidArgumentTypeException : public std::runtime_error {
 public:
  JavaTurboModuleInvalidArgumentTypeException(
      const std::string& actualType,
      int argIndex,
      const std::string& methodName)
      : std::runtime_error(
            "Called method \"" + methodName + "\" with unsupported type " +
            actualType + " at argument " + std::to_string(argIndex)) {}
};

class JavaTurboModuleInvalidArgumentCountException : public std::runtime_error {
 public:
  JavaTurboModuleInvalidArgumentCountException(
      const std::string& methodName,
      int actualArgCount,
      int expectedArgCount)
      : std::runtime_error(
            "TurboModule method \"" + methodName + "\" called with " +
            std::to_string(actualArgCount) +
            " arguments (expected argument count: " +
            std::to_string(expectedArgCount) + ").") {}
};

/**
 * See
 * https://docs.oracle.com/javase/7/docs/technotes/guides/jni/spec/types.html
 * for a description of Java method signature structure.
 */
std::vector<std::string> getMethodArgTypesFromSignature(
    const std::string& methodSignature) {
  std::vector<std::string> methodArgs;

  for (auto it = methodSignature.begin(); it != methodSignature.end();
       it += 1) {
    if (*it == '(') {
      continue;
    }

    if (*it == ')') {
      break;
    }

    std::string type;

    if (*it == '[') {
      type += *it;
      it += 1;
    }

    if (*it == 'L') {
      for (; it != methodSignature.end(); it += 1) {
        type += *it;

        if (*it == ';') {
          break;
        }
      }
    } else {
      type += *it;
    }

    methodArgs.push_back(type);
  }

  return methodArgs;
}

int32_t getUniqueId() {
  static int32_t counter = 0;
  return counter++;
}

// fbjni already does this conversion, but since we are using plain JNI, this
// needs to be done again
// TODO (axe) Reuse existing implementation as needed - the exist in
// MethodInvoker.cpp
JNIArgs convertJSIArgsToJNIArgs(
    JNIEnv* env,
    jsi::Runtime& rt,
    const std::string& methodName,
    const std::vector<std::string>& methodArgTypes,
    const jsi::Value* args,
    size_t count,
    const std::shared_ptr<CallInvoker>& jsInvoker,
    TurboModuleMethodValueKind valueKind) {
  size_t expectedArgumentCount = valueKind == PromiseKind
      ? methodArgTypes.size() - 1
      : methodArgTypes.size();

  if (expectedArgumentCount != count) {
    throw JavaTurboModuleInvalidArgumentCountException(
        methodName,
        static_cast<int>(count),
        static_cast<int>(expectedArgumentCount));
  }

  JNIArgs jniArgs(valueKind == PromiseKind ? count + 1 : count);
  auto& jargs = jniArgs.args;
  auto& globalRefs = jniArgs.globalRefs;

  auto makeGlobalIfNecessary = [&](jobject obj) {
    if (valueKind == VoidKind || valueKind == PromiseKind) {
      jobject globalObj = env->NewGlobalRef(obj);
      globalRefs.push_back(globalObj);
      env->DeleteLocalRef(obj);
      return globalObj;
    }

    return obj;
  };

  for (unsigned int argIndex = 0; argIndex < count; argIndex += 1) {
    const std::string& type = methodArgTypes.at(argIndex);

    const jsi::Value* arg = &args[argIndex];
    jvalue* jarg = &jargs[argIndex];

    if (type == "D") {
      if (!arg->isNumber()) {
        throw JavaTurboModuleArgumentConversionException(
            "number", argIndex, methodName, arg, &rt);
      }
      jarg->d = arg->getNumber();
      continue;
    }

    if (type == "F") {
      if (!arg->isNumber()) {
        throw JavaTurboModuleArgumentConversionException(
            "number", argIndex, methodName, arg, &rt);
      }
      jarg->f = (float)arg->getNumber();
      continue;
    }

    if (type == "I") {
      if (!arg->isNumber()) {
        throw JavaTurboModuleArgumentConversionException(
            "number", argIndex, methodName, arg, &rt);
      }
      jarg->i = (int)arg->getNumber();
      continue;
    }

    if (type == "Z") {
      if (!arg->isBool()) {
        throw JavaTurboModuleArgumentConversionException(
            "boolean", argIndex, methodName, arg, &rt);
      }
      jarg->z = (jboolean)arg->getBool();
      continue;
    }

    // Dynamic encapsulates the Null type so we don't want to return null here.
    if ((arg->isNull() && type != "Lcom/facebook/react/bridge/Dynamic;") ||
        arg->isUndefined()) {
      jarg->l = nullptr;
    } else if (type == "Ljava/lang/Double;") {
      if (!arg->isNumber()) {
        throw JavaTurboModuleArgumentConversionException(
            "number", argIndex, methodName, arg, &rt);
      }
      jarg->l = makeGlobalIfNecessary(
          jni::JDouble::valueOf(arg->getNumber()).release());
    } else if (type == "Ljava/lang/Float;") {
      if (!arg->isNumber()) {
        throw JavaTurboModuleArgumentConversionException(
            "number", argIndex, methodName, arg, &rt);
      }
      jarg->l = makeGlobalIfNecessary(
          jni::JFloat::valueOf(arg->getNumber()).release());
    } else if (type == "Ljava/lang/Integer;") {
      if (!arg->isNumber()) {
        throw JavaTurboModuleArgumentConversionException(
            "number", argIndex, methodName, arg, &rt);
      }
      jarg->l = makeGlobalIfNecessary(
          jni::JInteger::valueOf(arg->getNumber()).release());
    } else if (type == "Ljava/lang/Boolean;") {
      if (!arg->isBool()) {
        throw JavaTurboModuleArgumentConversionException(
            "boolean", argIndex, methodName, arg, &rt);
      }
      jarg->l = makeGlobalIfNecessary(
          jni::JBoolean::valueOf(static_cast<unsigned char>(arg->getBool()))
              .release());
    } else if (type == "Ljava/lang/String;") {
      if (!arg->isString()) {
        throw JavaTurboModuleArgumentConversionException(
            "string", argIndex, methodName, arg, &rt);
      }
      jarg->l = makeGlobalIfNecessary(
          env->NewStringUTF(arg->getString(rt).utf8(rt).c_str()));
    } else if (type == "Lcom/facebook/react/bridge/Callback;") {
      if (!(arg->isObject() && arg->getObject(rt).isFunction(rt))) {
        throw JavaTurboModuleArgumentConversionException(
            "Function", argIndex, methodName, arg, &rt);
      }
      jsi::Function fn = arg->getObject(rt).getFunction(rt);
      jarg->l = makeGlobalIfNecessary(
          createJavaCallback(rt, std::move(fn), jsInvoker).release());
    } else if (type == "Lcom/facebook/react/bridge/ReadableArray;") {
      if (!(arg->isObject() && arg->getObject(rt).isArray(rt))) {
        throw JavaTurboModuleArgumentConversionException(
            "Array", argIndex, methodName, arg, &rt);
      }
      auto dynamicFromValue = jsi::dynamicFromValue(rt, *arg);
      auto jParams =
          ReadableNativeArray::newObjectCxxArgs(std::move(dynamicFromValue));
      jarg->l = makeGlobalIfNecessary(jParams.release());
    } else if (type == "Lcom/facebook/react/bridge/ReadableMap;") {
      if (!(arg->isObject())) {
        throw JavaTurboModuleArgumentConversionException(
            "Object", argIndex, methodName, arg, &rt);
      }
      auto dynamicFromValue = jsi::dynamicFromValue(rt, *arg);
      auto jParams =
          ReadableNativeMap::createWithContents(std::move(dynamicFromValue));
      jarg->l = makeGlobalIfNecessary(jParams.release());
    } else if (type == "Lcom/facebook/react/bridge/Dynamic;") {
      auto dynamicFromValue = jsi::dynamicFromValue(rt, *arg);
      auto jParams = JDynamicNative::newObjectCxxArgs(dynamicFromValue);
      jarg->l = makeGlobalIfNecessary(jParams.release());
    } else {
      throw JavaTurboModuleInvalidArgumentTypeException(
          type, argIndex, methodName);
    }
  }

  return jniArgs;
}

jsi::Value convertFromJMapToValue(JNIEnv* env, jsi::Runtime& rt, jobject arg) {
  // We currently use Java Argument.makeNativeMap() method to do this conversion
  // This could also be done purely in C++, but iterative over map methods
  // but those may end up calling reflection methods anyway
  // TODO (axe) Investigate the best way to convert Java Map to Value
  jclass jArguments = env->FindClass("com/facebook/react/bridge/Arguments");
  static jmethodID jMakeNativeMap = env->GetStaticMethodID(
      jArguments,
      "makeNativeMap",
      "(Ljava/util/Map;)Lcom/facebook/react/bridge/WritableNativeMap;");
  auto constants = env->CallStaticObjectMethod(jArguments, jMakeNativeMap, arg);
  auto jResult = jni::adopt_local(constants);
  auto result = jni::static_ref_cast<NativeMap::jhybridobject>(jResult);
  return jsi::valueFromDynamic(rt, result->cthis()->consume());
}

/**
 * Creates JSError with current JS runtime stack and Throwable stack trace.
 */
jsi::JSError convertThrowableToJSError(
    jsi::Runtime& runtime,
    jni::alias_ref<jni::JThrowable> throwable) {
  auto stackTrace = throwable->getStackTrace();

  jsi::Array stackElements(runtime, stackTrace->size());
  for (int i = 0; i < stackTrace->size(); ++i) {
    auto frame = stackTrace->getElement(i);

    jsi::Object frameObject(runtime);
    frameObject.setProperty(runtime, "className", frame->getClassName());
    frameObject.setProperty(runtime, "fileName", frame->getFileName());
    frameObject.setProperty(runtime, "lineNumber", frame->getLineNumber());
    frameObject.setProperty(runtime, "methodName", frame->getMethodName());
    stackElements.setValueAtIndex(runtime, i, std::move(frameObject));
  }

  jsi::Object cause(runtime);
  auto name = throwable->getClass()->getCanonicalName()->toStdString();
  auto messageStr = throwable->getMessage();
  auto message = messageStr != nullptr ? messageStr->toStdString() : name;
  cause.setProperty(runtime, "name", name);
  cause.setProperty(runtime, "message", message);
  cause.setProperty(runtime, "stackElements", std::move(stackElements));

  jsi::Value error =
      createJSRuntimeError(runtime, "Exception in HostFunction: " + message);
  error.asObject(runtime).setProperty(runtime, "cause", std::move(cause));
  return {runtime, std::move(error)};
}

void rejectWithException(
    AsyncCallback<>& reject,
    std::exception_ptr exception,
    std::optional<std::string>& jsInvocationStack) {
  auto throwable = jni::getJavaExceptionForCppException(exception);
  reject.call([jsInvocationStack, throwable = jni::make_global(throwable)](
                  jsi::Runtime& rt, jsi::Function& jsFunction) {
    auto jsError = convertThrowableToJSError(rt, throwable);
    if (jsInvocationStack.has_value()) {
      jsError.value().asObject(rt).setProperty(
          rt, "stack", jsInvocationStack.value());
    }
    jsFunction.call(rt, jsError.value());
  });
}

} // namespace

jsi::Value JavaTurboModule::invokeJavaMethod(
    jsi::Runtime& runtime,
    TurboModuleMethodValueKind valueKind,
    const std::string& methodNameStr,
    const std::string& methodSignature,
    const jsi::Value* args,
    size_t argCount,
    jmethodID& methodID) {
  const char* methodName = methodNameStr.c_str();
  const char* moduleName = name_.c_str();

  bool isMethodSync = valueKind != VoidKind && valueKind != PromiseKind;

  if (isMethodSync) {
    TMPL::syncMethodCallStart(moduleName, methodName);
    TMPL::syncMethodCallArgConversionStart(moduleName, methodName);
  } else {
    TMPL::asyncMethodCallStart(moduleName, methodName);
    TMPL::asyncMethodCallArgConversionStart(moduleName, methodName);
  }

  JNIEnv* env = jni::Environment::current();
  auto instance = instance_.get();

  /**
   * To account for jclasses and other misc LocalReferences we create.
   */
  unsigned int buffer = 6;
  /**
   * For promises, we have to create a resolve fn, a reject fn, and a promise
   * object. For normal returns, we just create the return object.
   */
  unsigned int maxReturnObjects = 3;

  /**
   * When the return type is void, all JNI LocalReferences are converted to
   * GlobalReferences. The LocalReferences are then promptly deleted
   * after the conversion.
   */
  unsigned int actualArgCount =
      valueKind == VoidKind ? 0 : static_cast<unsigned int>(argCount);
  unsigned int estimatedLocalRefCount =
      actualArgCount + maxReturnObjects + buffer;

  /**
   * This will push a new JNI stack frame for the LocalReferences in this
   * function call. When the stack frame for invokeJavaMethod is popped,
   * all LocalReferences are deleted.
   *
   * In total, there can be at most kJniLocalRefMax (= 512) Jni
   * LocalReferences alive at a time. estimatedLocalRefCount is provided
   * so that PushLocalFrame can throw an out of memory error when the total
   * number of alive LocalReferences is estimatedLocalRefCount smaller than
   * kJniLocalRefMax.
   */
  jni::JniLocalScope scope(env, estimatedLocalRefCount);

  auto checkJNIErrorForMethodCall = [&]() -> void {
    try {
      FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
    } catch (...) {
      if (isMethodSync) {
        TMPL::syncMethodCallFail(moduleName, methodName);
      } else {
        TMPL::asyncMethodCallFail(moduleName, methodName);
      }
      auto exception = std::current_exception();
      auto throwable = jni::getJavaExceptionForCppException(exception);
      throw convertThrowableToJSError(runtime, throwable);
    }
  };

  if (methodID == nullptr) {
    jclass cls = env->GetObjectClass(instance);
    methodID = env->GetMethodID(cls, methodName, methodSignature.c_str());

    // If the method signature doesn't match, show a redbox here instead of
    // crashing later.
    checkJNIErrorForMethodCall();
  }

  // TODO(T43933641): Refactor to remove this special-casing
  if (methodNameStr == "getConstants") {
    TMPL::syncMethodCallArgConversionEnd(moduleName, methodName);
    TMPL::syncMethodCallExecutionStart(moduleName, methodName);

    auto constantsMap = (jobject)env->CallObjectMethod(instance, methodID);
    checkJNIErrorForMethodCall();

    TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
    TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

    jsi::Value returnValue = constantsMap == nullptr
        ? jsi::Value::undefined()
        : convertFromJMapToValue(env, runtime, constantsMap);

    TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
    TMPL::syncMethodCallEnd(moduleName, methodName);
    return returnValue;
  }

  std::vector<std::string> methodArgTypes =
      getMethodArgTypesFromSignature(methodSignature);

  JNIArgs jniArgs = convertJSIArgsToJNIArgs(
      env,
      runtime,
      methodNameStr,
      methodArgTypes,
      args,
      argCount,
      jsInvoker_,
      valueKind);

  if (isMethodSync && valueKind != PromiseKind) {
    TMPL::syncMethodCallArgConversionEnd(moduleName, methodName);
    TMPL::syncMethodCallExecutionStart(moduleName, methodName);
  }

  auto& jargs = jniArgs.args;
  auto& globalRefs = jniArgs.globalRefs;

  switch (valueKind) {
    case BooleanKind: {
      std::string returnType =
          methodSignature.substr(methodSignature.find_last_of(')') + 1);
      if (returnType == "Ljava/lang/Boolean;") {
        auto returnObject =
            env->CallObjectMethodA(instance, methodID, jargs.data());
        checkJNIErrorForMethodCall();

        TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
        TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

        auto returnValue = jsi::Value::null();
        if (returnObject != nullptr) {
          auto booleanObj = jni::adopt_local(
              static_cast<jni::JBoolean::javaobject>(returnObject));
          returnValue = jsi::Value(static_cast<bool>(booleanObj->value()));
        }

        TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
        TMPL::syncMethodCallEnd(moduleName, methodName);
        return returnValue;
      } else {
        bool returnBoolean =
            (bool)env->CallBooleanMethodA(instance, methodID, jargs.data());
        checkJNIErrorForMethodCall();

        TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
        TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

        jsi::Value returnValue = jsi::Value(returnBoolean);

        TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
        TMPL::syncMethodCallEnd(moduleName, methodName);

        return returnValue;
      }
    }
    case NumberKind: {
      std::string returnType =
          methodSignature.substr(methodSignature.find_last_of(')') + 1);
      if (returnType == "Ljava/lang/Double;" ||
          returnType == "Ljava/lang/Float;" ||
          returnType == "Ljava/lang/Integer;") {
        auto returnObject =
            env->CallObjectMethodA(instance, methodID, jargs.data());
        checkJNIErrorForMethodCall();

        TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
        TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

        auto returnValue = jsi::Value::null();
        if (returnObject != nullptr) {
          if (returnType == "Ljava/lang/Double;") {
            auto doubleObj = jni::adopt_local(
                static_cast<jni::JDouble::javaobject>(returnObject));
            returnValue = jsi::Value(doubleObj->value());
          } else if (returnType == "Ljava/lang/Float;") {
            auto floatObj = jni::adopt_local(
                static_cast<jni::JFloat::javaobject>(returnObject));
            returnValue = jsi::Value((double)floatObj->value());
          } else if (returnType == "Ljava/lang/Integer;") {
            auto intObj = jni::adopt_local(
                static_cast<jni::JInteger::javaobject>(returnObject));
            returnValue = jsi::Value(intObj->value());
          }
        }

        TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
        TMPL::syncMethodCallEnd(moduleName, methodName);
        return returnValue;
      } else if (returnType == "D" || returnType == "F" || returnType == "I") {
        jsi::Value returnValue = jsi::Value::undefined();
        if (returnType == "D") {
          auto returnDouble = static_cast<double>(
              env->CallDoubleMethodA(instance, methodID, jargs.data()));
          checkJNIErrorForMethodCall();

          TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
          TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

          returnValue = jsi::Value(returnDouble);
        } else if (returnType == "F") {
          auto returnFloat = static_cast<float>(
              env->CallFloatMethodA(instance, methodID, jargs.data()));
          checkJNIErrorForMethodCall();

          TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
          TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

          returnValue = jsi::Value((double)returnFloat);
        } else if (returnType == "I") {
          int returnInt = static_cast<int>(
              env->CallIntMethodA(instance, methodID, jargs.data()));
          checkJNIErrorForMethodCall();

          TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
          TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

          returnValue = jsi::Value(returnInt);
        }

        TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
        TMPL::syncMethodCallEnd(moduleName, methodName);
        return returnValue;
      }
    }
    case StringKind: {
      auto returnString =
          (jstring)env->CallObjectMethodA(instance, methodID, jargs.data());
      checkJNIErrorForMethodCall();

      TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
      TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

      jsi::Value returnValue = jsi::Value::null();
      if (returnString != nullptr) {
        const char* js = env->GetStringUTFChars(returnString, nullptr);
        std::string result = js;
        env->ReleaseStringUTFChars(returnString, js);
        returnValue =
            jsi::Value(runtime, jsi::String::createFromUtf8(runtime, result));
      }

      TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
      TMPL::syncMethodCallEnd(moduleName, methodName);
      return returnValue;
    }
    case ObjectKind: {
      auto returnObject =
          env->CallObjectMethodA(instance, methodID, jargs.data());
      checkJNIErrorForMethodCall();

      TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
      TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

      jsi::Value returnValue = jsi::Value::null();
      if (returnObject != nullptr) {
        auto jResult = jni::adopt_local(returnObject);
        auto result = jni::static_ref_cast<NativeMap::jhybridobject>(jResult);
        returnValue =
            jsi::valueFromDynamic(runtime, result->cthis()->consume());
      }

      TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
      TMPL::syncMethodCallEnd(moduleName, methodName);
      return returnValue;
    }
    case ArrayKind: {
      auto returnObject =
          (jobject)env->CallObjectMethodA(instance, methodID, jargs.data());
      checkJNIErrorForMethodCall();

      TMPL::syncMethodCallExecutionEnd(moduleName, methodName);
      TMPL::syncMethodCallReturnConversionStart(moduleName, methodName);

      jsi::Value returnValue = jsi::Value::null();
      if (returnObject != nullptr) {
        auto jResult = jni::adopt_local(returnObject);
        auto result = jni::static_ref_cast<NativeArray::jhybridobject>(jResult);
        returnValue =
            jsi::valueFromDynamic(runtime, result->cthis()->consume());
      }

      TMPL::syncMethodCallReturnConversionEnd(moduleName, methodName);
      TMPL::syncMethodCallEnd(moduleName, methodName);
      return returnValue;
    }
    case VoidKind: {
      TMPL::asyncMethodCallArgConversionEnd(moduleName, methodName);
      TMPL::asyncMethodCallDispatch(moduleName, methodName);

      nativeMethodCallInvoker_->invokeAsync(
          methodName,
          [jniArgs = makeMoveWrapper(std::move(jniArgs)),
           methodID,
           instance_ = jni::make_weak(instance_),
           moduleNameStr = name_,
           methodNameStr,
           id = getUniqueId()]() mutable {
            TraceSection s(
                "JavaTurboModuleAsyncMethodInvocation",
                "module",
                moduleNameStr,
                "method",
                methodNameStr,
                "returnType",
                "void");

            auto instance = instance_.lockLocal();
            if (!instance) {
              return;
            }

            // Require the env from the current scope, which may be
            // different from the original invocation's scope
            JNIEnv* env = jni::Environment::current();
            const char* moduleName = moduleNameStr.c_str();
            const char* methodName = methodNameStr.c_str();

            TMPL::asyncMethodCallExecutionStart(moduleName, methodName, id);
            env->CallVoidMethodA(
                instance.get(), methodID, jniArgs->args.data());
            try {
              FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
            } catch (...) {
              TMPL::asyncMethodCallExecutionFail(moduleName, methodName, id);
              throw;
            }
            TMPL::asyncMethodCallExecutionEnd(moduleName, methodName, id);
          });

      TMPL::asyncMethodCallEnd(moduleName, methodName);
      return jsi::Value::undefined();
    }
    case PromiseKind: {
      // We could use AsyncPromise here, but this avoids the overhead of
      // the shared_ptr for PromiseHolder
      jsi::Function Promise =
          runtime.global().getPropertyAsFunction(runtime, "Promise");

      // The callback is used for auto rejecting if error is caught from method
      // invocation
      std::optional<AsyncCallback<>> nativeRejectCallback;

      // The promise constructor runs its arg immediately, so this is safe
      jobject javaPromise = nullptr;
      jsi::Value jsPromise = Promise.callAsConstructor(
          runtime,
          jsi::Function::createFromHostFunction(
              runtime,
              jsi::PropNameID::forAscii(runtime, "fn"),
              2,
              [&](jsi::Runtime& runtime,
                  const jsi::Value&,
                  const jsi::Value* args,
                  size_t argCount) {
                if (argCount != 2) {
                  throw jsi::JSError(runtime, "Incorrect number of arguments");
                }

                nativeRejectCallback = AsyncCallback(
                    runtime,
                    args[1].getObject(runtime).getFunction(runtime),
                    jsInvoker_);

                auto resolve = createJavaCallback(
                    runtime,
                    args[0].getObject(runtime).getFunction(runtime),
                    jsInvoker_);
                auto reject = createJavaRejectCallback(
                    runtime,
                    args[1].getObject(runtime).getFunction(runtime),
                    jsInvoker_);
                javaPromise = JPromiseImpl::create(resolve, reject).release();

                return jsi::Value::undefined();
              }));

      jobject globalPromise = env->NewGlobalRef(javaPromise);
      globalRefs.push_back(globalPromise);
      env->DeleteLocalRef(javaPromise);
      jargs[argCount].l = globalPromise;

      // JS Stack at the time when the promise is created.
      std::optional<std::string> jsInvocationStack;
      if (ReactNativeFeatureFlags::
              traceTurboModulePromiseRejectionsOnAndroid()) {
        jsInvocationStack =
            createJSRuntimeError(runtime, jsi::Value::undefined())
                .asObject(runtime)
                .getProperty(runtime, "stack")
                .toString(runtime)
                .utf8(runtime);
      }

      const char* moduleName = name_.c_str();
      const char* methodName = methodNameStr.c_str();
      TMPL::asyncMethodCallArgConversionEnd(moduleName, methodName);
      TMPL::asyncMethodCallDispatch(moduleName, methodName);
      nativeMethodCallInvoker_->invokeAsync(
          methodName,
          [jniArgs = makeMoveWrapper(std::move(jniArgs)),
           rejectCallback = std::move(nativeRejectCallback),
           jsInvocationStack = std::move(jsInvocationStack),
           methodID,
           instance_ = jni::make_weak(instance_),
           moduleNameStr = name_,
           methodNameStr,
           id = getUniqueId()]() mutable {
            TraceSection s(
                "JavaTurboModuleAsyncMethodInvocation",
                "module",
                moduleNameStr,
                "method",
                methodNameStr,
                "returnType",
                "promise");

            auto instance = instance_.lockLocal();
            if (!instance) {
              return;
            }

            // Require the env from the current scope, which may be
            // different from the original invocation's scope
            JNIEnv* env = jni::Environment::current();
            const char* moduleName = moduleNameStr.c_str();
            const char* methodName = methodNameStr.c_str();
            TMPL::asyncMethodCallExecutionStart(moduleName, methodName, id);
            env->CallVoidMethodA(
                instance.get(), methodID, jniArgs->args.data());
            try {
              FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
            } catch (...) {
              if (rejectCallback) {
                auto exception = std::current_exception();
                rejectWithException(
                    *rejectCallback, exception, jsInvocationStack);
                rejectCallback = std::nullopt;
              } else {
                TMPL::asyncMethodCallExecutionFail(moduleName, methodName, id);
                throw;
              }
            }
            TMPL::asyncMethodCallExecutionEnd(moduleName, methodName, id);
          });
      TMPL::asyncMethodCallEnd(moduleName, methodName);
      return jsPromise;
    }
    default:
      throw std::runtime_error(
          "Unable to find method module: " + methodNameStr + "(" +
          methodSignature + ")");
  }
}

void JavaTurboModule::configureEventEmitterCallback() {
  JNIEnv* env = jni::Environment::current();
  static jmethodID cachedMethodId = nullptr;
  if (cachedMethodId == nullptr) {
    jclass cls = env->GetObjectClass(instance_.get());
    cachedMethodId = env->GetMethodID(
        cls,
        "setEventEmitterCallback",
        "(Lcom/facebook/react/bridge/CxxCallbackImpl;)V");
    FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
  }

  auto callback = JCxxCallbackImpl::newObjectCxxArgs([&](folly::dynamic args) {
    auto eventName = args.at(0).asString();
    auto& eventEmitter = static_cast<AsyncEventEmitter<folly::dynamic>&>(
        *eventEmitterMap_[eventName].get());
    eventEmitter.emit(args.size() > 1 ? std::move(args).at(1) : nullptr);
  });

  jvalue args[1];
  args[0].l = callback.release();

  // CallVoidMethod is replaced with CallVoidMethodA as it's unsafe on 32bit and
  // causes crashes https://github.com/facebook/react-native/issues/51628
  env->CallVoidMethodA(instance_.get(), cachedMethodId, args);
  FACEBOOK_JNI_THROW_PENDING_EXCEPTION();
}

} // namespace facebook::react
