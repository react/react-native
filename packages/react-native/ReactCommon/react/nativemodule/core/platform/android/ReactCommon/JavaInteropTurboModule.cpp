/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JavaInteropTurboModule.h"

#ifndef RCT_REMOVE_LEGACY_MODULE_INTEROP

namespace facebook::react {

namespace {

// This is used for generating short exception strings.
std::string getType(jsi::Runtime& rt, const jsi::Value& v) {
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
    return v.getObject(rt).isFunction(rt) ? "function" : "object";
  } else {
    return "unknown";
  }
}
} // namespace

JavaInteropTurboModule::JavaInteropTurboModule(
    const JavaTurboModule::InitParams& params,
    const std::vector<MethodDescriptor>& methodDescriptors)
    : JavaTurboModule(params),
      methodDescriptors_(methodDescriptors),
      methodIDs_(methodDescriptors.size()),
      constantsCache_(jsi::Value::undefined()) {
  for (const auto& methodDescriptor : methodDescriptors) {
    methodMap_[methodDescriptor.methodName] = MethodMetadata{
        .argCount = static_cast<size_t>(methodDescriptor.jsArgCount),
        .invoker = nullptr};
  }
}

jsi::Value JavaInteropTurboModule::create(
    jsi::Runtime& runtime,
    const jsi::PropNameID& propName) {
  for (size_t i = 0; i < methodDescriptors_.size(); i += 1) {
    if (methodDescriptors_[i].methodName == propName.utf8(runtime)) {
      if (propName.utf8(runtime) == "getConstants") {
        return jsi::Function::createFromHostFunction(
            runtime,
            propName,
            static_cast<unsigned int>(methodDescriptors_[i].jsArgCount),
            [this, i](
                jsi::Runtime& rt,
                const jsi::Value& /*thisVal*/,
                const jsi::Value* args,
                size_t count) mutable {
              if (!this->constantsCache_.isUndefined()) {
                return jsi::Value(rt, this->constantsCache_);
              }

              jsi::Value ret = this->invokeJavaMethod(
                  rt,
                  this->methodDescriptors_[i].jsiReturnKind,
                  this->methodDescriptors_[i].methodName,
                  this->methodDescriptors_[i].jniSignature,
                  args,
                  count,
                  this->methodIDs_[i]);

              bool isRetValid = ret.isUndefined() || ret.isNull() ||
                  (ret.isObject() && !ret.asObject(rt).isFunction(rt));

              if (!isRetValid) {
                throw new jsi::JSError(
                    rt,
                    "Expected NativeModule " + this->name_ +
                        ".getConstants() to return: null, undefined, or an object. But, got: " +
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
          [this, i](
              jsi::Runtime& rt,
              const jsi::Value& /*thisVal*/,
              const jsi::Value* args,
              size_t count) {
            return this->invokeJavaMethod(
                rt,
                this->methodDescriptors_[i].jsiReturnKind,
                this->methodDescriptors_[i].methodName,
                this->methodDescriptors_[i].jniSignature,
                args,
                count,
                this->methodIDs_[i]);
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

bool JavaInteropTurboModule::exportsConstants() {
  for (size_t i = 0; i < methodDescriptors_.size(); i += 1) {
    if (methodDescriptors_[i].methodName == "getConstants") {
      return true;
    }
  }

  return false;
}

const jsi::Value& JavaInteropTurboModule::getConstants(jsi::Runtime& runtime) {
  if (!constantsCache_.isUndefined()) {
    return constantsCache_;
  }

  if (!exportsConstants()) {
    constantsCache_ = jsi::Object(runtime);
    return constantsCache_;
  }

  jsi::Value getConstantsProp =
      get(runtime, jsi::PropNameID::forAscii(runtime, "getConstants"));

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

std::vector<facebook::jsi::PropNameID> JavaInteropTurboModule::getPropertyNames(
    facebook::jsi::Runtime& runtime) {
  std::vector<facebook::jsi::PropNameID> propNames =
      JavaTurboModule::getPropertyNames(runtime);

  jsi::Object constants = getConstants(runtime).asObject(runtime);
  jsi::Array constantNames = constants.getPropertyNames(runtime);

  for (size_t i = 0; i < constantNames.size(runtime); i += 1) {
    jsi::Value constantName = constantNames.getValueAtIndex(runtime, i);
    if (constantName.isString()) {
      propNames.push_back(
          jsi::PropNameID::forString(runtime, constantName.asString(runtime)));
    }
  }

  return propNames;
}

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_MODULE_INTEROP
