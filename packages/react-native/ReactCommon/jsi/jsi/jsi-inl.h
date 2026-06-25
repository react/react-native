/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace jsi {
namespace detail {

inline Value toValue(IRuntime&, std::nullptr_t) {
  return Value::null();
}
inline Value toValue(IRuntime&, bool b) {
  return Value(b);
}
inline Value toValue(IRuntime&, double d) {
  return Value(d);
}
inline Value toValue(IRuntime&, float f) {
  return Value(static_cast<double>(f));
}
inline Value toValue(IRuntime&, int i) {
  return Value(i);
}
inline Value toValue(IRuntime& runtime, const char* str) {
  return String::createFromAscii(runtime, str);
}
inline Value toValue(IRuntime& runtime, const std::string& str) {
  return String::createFromUtf8(runtime, str);
}
template <typename T>
inline Value toValue(IRuntime& runtime, const T& other) {
  static_assert(
      std::is_base_of<Pointer, T>::value,
      "This type cannot be converted to Value");
  return Value(runtime, other);
}
inline Value toValue(IRuntime& runtime, const Value& value) {
  return Value(runtime, value);
}
inline Value&& toValue(IRuntime&, Value&& value) {
  return std::move(value);
}

inline PropNameID toPropNameID(IRuntime& runtime, const char* name) {
  return PropNameID::forAscii(runtime, name);
}
inline PropNameID toPropNameID(IRuntime& runtime, const std::string& name) {
  return PropNameID::forUtf8(runtime, name);
}
inline PropNameID&& toPropNameID(IRuntime&, PropNameID&& name) {
  return std::move(name);
}

/// Helper to throw while still compiling with exceptions turned off.
template <typename E, typename... Args>
[[noreturn]] inline void throwOrDie(Args&&... args) {
  std::rethrow_exception(
      std::make_exception_ptr(E{std::forward<Args>(args)...}));
}

} // namespace detail

template <typename T>
inline T Runtime::make(Runtime::PointerValue* pv) {
  return T(pv);
}

inline Runtime::PointerValue* Runtime::getPointerValue(jsi::Pointer& pointer) {
  return pointer.ptr_;
}

inline const Runtime::PointerValue* Runtime::getPointerValue(
    const jsi::Pointer& pointer) {
  return pointer.ptr_;
}

inline const Runtime::PointerValue* Runtime::getPointerValue(
    const jsi::Value& value) {
  return value.data_.pointer.ptr_;
}

inline void Runtime::setRuntimeData(
    const UUID& dataUUID,
    const std::shared_ptr<void>& data) {
  auto* dataPtr = new std::shared_ptr<void>(data);
  setRuntimeDataImpl(dataUUID, dataPtr, [](const void* data) {
    delete (const std::shared_ptr<void>*)data;
  });
}

inline std::shared_ptr<void> Runtime::getRuntimeData(const UUID& dataUUID) {
  auto* data = (const std::shared_ptr<void>*)getRuntimeDataImpl(dataUUID);
  return data ? *data : nullptr;
}

Value Object::getPrototype(IRuntime& runtime) const {
  return runtime.getPrototypeOf(*this);
}

inline Value Object::getProperty(IRuntime& runtime, const char* name) const {
  return getProperty(runtime, String::createFromAscii(runtime, name));
}

inline Value Object::getProperty(IRuntime& runtime, const String& name) const {
  return runtime.getProperty(*this, name);
}

inline Value Object::getProperty(IRuntime& runtime, const PropNameID& name)
    const {
  return runtime.getProperty(*this, name);
}

inline Value Object::getProperty(IRuntime& runtime, const Value& name) const {
  return runtime.getProperty(*this, name);
}

inline bool Object::hasProperty(IRuntime& runtime, const char* name) const {
  return hasProperty(runtime, String::createFromAscii(runtime, name));
}

inline bool Object::hasProperty(IRuntime& runtime, const String& name) const {
  return runtime.hasProperty(*this, name);
}

inline bool Object::hasProperty(IRuntime& runtime, const PropNameID& name)
    const {
  return runtime.hasProperty(*this, name);
}

inline bool Object::hasProperty(IRuntime& runtime, const Value& name) const {
  return runtime.hasProperty(*this, name);
}

template <typename T>
void Object::setProperty(IRuntime& runtime, const char* name, T&& value) const {
  setProperty(
      runtime, String::createFromAscii(runtime, name), std::forward<T>(value));
}

template <typename T>
void Object::setProperty(IRuntime& runtime, const String& name, T&& value)
    const {
  setPropertyValue(
      runtime, name, detail::toValue(runtime, std::forward<T>(value)));
}

template <typename T>
void Object::setProperty(IRuntime& runtime, const PropNameID& name, T&& value)
    const {
  setPropertyValue(
      runtime, name, detail::toValue(runtime, std::forward<T>(value)));
}

template <typename T>
void Object::setProperty(IRuntime& runtime, const Value& name, T&& value)
    const {
  setPropertyValue(
      runtime, name, detail::toValue(runtime, std::forward<T>(value)));
}

inline void Object::deleteProperty(IRuntime& runtime, const char* name) const {
  deleteProperty(runtime, String::createFromAscii(runtime, name));
}

inline void Object::deleteProperty(IRuntime& runtime, const String& name)
    const {
  runtime.deleteProperty(*this, name);
}

inline void Object::deleteProperty(IRuntime& runtime, const PropNameID& name)
    const {
  runtime.deleteProperty(*this, name);
}

inline void Object::deleteProperty(IRuntime& runtime, const Value& name) const {
  runtime.deleteProperty(*this, name);
}

inline Array Object::getArray(IRuntime& runtime) const& {
  assert(runtime.isArray(*this));
  (void)runtime; // when assert is disabled we need to mark this as used
  return Array(runtime.cloneObject(ptr_));
}

inline Array Object::getArray(IRuntime& runtime) && {
  assert(runtime.isArray(*this));
  (void)runtime; // when assert is disabled we need to mark this as used
  Runtime::PointerValue* value = ptr_;
  ptr_ = nullptr;
  return Array(value);
}

inline ArrayBuffer Object::getArrayBuffer(IRuntime& runtime) const& {
  assert(runtime.isArrayBuffer(*this));
  (void)runtime; // when assert is disabled we need to mark this as used
  return ArrayBuffer(runtime.cloneObject(ptr_));
}

inline ArrayBuffer Object::getArrayBuffer(IRuntime& runtime) && {
  assert(runtime.isArrayBuffer(*this));
  (void)runtime; // when assert is disabled we need to mark this as used
  Runtime::PointerValue* value = ptr_;
  ptr_ = nullptr;
  return ArrayBuffer(value);
}

inline TypedArray Object::getTypedArray(IRuntime& runtime) const& {
  assert(runtime.isTypedArray(*this));
  return TypedArray(runtime.cloneObject(ptr_));
}

inline Uint8Array Object::getUint8Array(IRuntime& runtime) const& {
  assert(runtime.isUint8Array(*this));
  return Uint8Array(runtime.cloneObject(ptr_));
}

inline Function Object::getFunction(IRuntime& runtime) const& {
  assert(runtime.isFunction(*this));
  return Function(runtime.cloneObject(ptr_));
}

inline Function Object::getFunction(IRuntime& runtime) && {
  assert(runtime.isFunction(*this));
  (void)runtime; // when assert is disabled we need to mark this as used
  Runtime::PointerValue* value = ptr_;
  ptr_ = nullptr;
  return Function(value);
}

template <typename T>
inline bool Object::isHostObject(IRuntime& runtime) const {
  return runtime.isHostObject(*this) &&
      std::dynamic_pointer_cast<T>(runtime.getHostObject(*this));
}

template <>
inline bool Object::isHostObject<HostObject>(IRuntime& runtime) const {
  return runtime.isHostObject(*this);
}

template <typename T>
inline std::shared_ptr<T> Object::getHostObject(IRuntime& runtime) const {
  assert(isHostObject<T>(runtime));
  return std::static_pointer_cast<T>(runtime.getHostObject(*this));
}

template <typename T>
inline std::shared_ptr<T> Object::asHostObject(IRuntime& runtime) const {
  if (!isHostObject<T>(runtime)) {
    detail::throwOrDie<JSINativeException>(
        "Object is not a HostObject of desired type");
  }
  return std::static_pointer_cast<T>(runtime.getHostObject(*this));
}

template <>
inline std::shared_ptr<HostObject> Object::getHostObject<HostObject>(
    IRuntime& runtime) const {
  assert(runtime.isHostObject(*this));
  return runtime.getHostObject(*this);
}

template <typename T>
inline bool Object::hasNativeState(IRuntime& runtime) const {
  return runtime.hasNativeState(*this) &&
      std::dynamic_pointer_cast<T>(runtime.getNativeState(*this));
}

template <>
inline bool Object::hasNativeState<NativeState>(IRuntime& runtime) const {
  return runtime.hasNativeState(*this);
}

template <typename T>
inline std::shared_ptr<T> Object::getNativeState(IRuntime& runtime) const {
  assert(hasNativeState<T>(runtime));
  return std::static_pointer_cast<T>(runtime.getNativeState(*this));
}

inline void Object::setNativeState(
    IRuntime& runtime,
    std::shared_ptr<NativeState> state) const {
  runtime.setNativeState(*this, state);
}

inline void Object::setExternalMemoryPressure(IRuntime& runtime, size_t amt)
    const {
  runtime.setExternalMemoryPressure(*this, amt);
}

inline Array Object::getPropertyNames(IRuntime& runtime) const {
  return runtime.getPropertyNames(*this);
}

inline Value WeakObject::lock(IRuntime& runtime) const {
  return runtime.lockWeakObject(*this);
}

template <typename T>
void Array::setValueAtIndex(IRuntime& runtime, size_t i, T&& value) const {
  setValueAtIndexImpl(
      runtime, i, detail::toValue(runtime, std::forward<T>(value)));
}

inline Value Array::getValueAtIndex(IRuntime& runtime, size_t i) const {
  return runtime.getValueAtIndex(*this, i);
}

inline Function Function::createFromHostFunction(
    IRuntime& runtime,
    const jsi::PropNameID& name,
    unsigned int paramCount,
    jsi::HostFunctionType func) {
  return runtime.createFunctionFromHostFunction(
      name, paramCount, std::move(func));
}

inline Value Function::call(IRuntime& runtime, const Value* args, size_t count)
    const {
  return runtime.call(*this, Value::undefined(), args, count);
}

inline Value Function::call(
    IRuntime& runtime,
    std::initializer_list<Value> args) const {
  return call(runtime, args.begin(), args.size());
}

template <typename... Args>
inline Value Function::call(IRuntime& runtime, Args&&... args) const {
  // A more awesome version of this would be able to create raw values
  // which can be used directly without wrapping and unwrapping, but
  // this will do for now.
  return call(runtime, {detail::toValue(runtime, std::forward<Args>(args))...});
}

inline Value Function::callWithThis(
    IRuntime& runtime,
    const Object& jsThis,
    const Value* args,
    size_t count) const {
  return runtime.call(*this, Value(runtime, jsThis), args, count);
}

inline Value Function::callWithThis(
    IRuntime& runtime,
    const Object& jsThis,
    std::initializer_list<Value> args) const {
  return callWithThis(runtime, jsThis, args.begin(), args.size());
}

template <typename... Args>
inline Value Function::callWithThis(
    IRuntime& runtime,
    const Object& jsThis,
    Args&&... args) const {
  // A more awesome version of this would be able to create raw values
  // which can be used directly without wrapping and unwrapping, but
  // this will do for now.
  return callWithThis(
      runtime, jsThis, {detail::toValue(runtime, std::forward<Args>(args))...});
}

template <typename... Args>
inline Array Array::createWithElements(IRuntime& runtime, Args&&... args) {
  return createWithElements(
      runtime, {detail::toValue(runtime, std::forward<Args>(args))...});
}

template <typename... Args>
inline size_t Array::push(IRuntime& runtime, Args&&... args) {
  return push(runtime, {detail::toValue(runtime, std::forward<Args>(args))...});
}

inline size_t Array::push(
    IRuntime& runtime,
    std::initializer_list<Value> elements) {
  return push(runtime, elements.begin(), elements.size());
}

inline size_t
Array::push(IRuntime& runtime, const Value* elements, size_t count) {
  return runtime.push(*this, elements, count);
}

template <typename... Args>
inline std::vector<PropNameID> PropNameID::names(
    IRuntime& runtime,
    Args&&... args) {
  return names({detail::toPropNameID(runtime, std::forward<Args>(args))...});
}

template <size_t N>
inline std::vector<PropNameID> PropNameID::names(
    PropNameID (&&propertyNames)[N]) {
  std::vector<PropNameID> result;
  result.reserve(N);
  for (auto& name : propertyNames) {
    result.push_back(std::move(name));
  }
  return result;
}

inline Value Function::callAsConstructor(
    IRuntime& runtime,
    const Value* args,
    size_t count) const {
  return runtime.callAsConstructor(*this, args, count);
}

inline Value Function::callAsConstructor(
    IRuntime& runtime,
    std::initializer_list<Value> args) const {
  return callAsConstructor(runtime, args.begin(), args.size());
}

template <typename... Args>
inline Value Function::callAsConstructor(IRuntime& runtime, Args&&... args)
    const {
  return callAsConstructor(
      runtime, {detail::toValue(runtime, std::forward<Args>(args))...});
}

String BigInt::toString(IRuntime& runtime, int radix) const {
  return runtime.bigintToString(*this, radix);
}

} // namespace jsi
} // namespace facebook
