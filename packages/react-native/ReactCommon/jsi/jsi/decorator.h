/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <tuple>

#include <jsi/instrumentation.h>
#include <jsi/jsi.h>

// This file contains objects to help API users create their own
// runtime adapters, i.e. if you want to compose runtimes to add your
// own behavior.

namespace facebook {
namespace jsi {

// Use this to wrap host functions. It will pass the member runtime as
// the first arg to the callback.  The first argument to the ctor
// should be the decorated runtime, not the plain one.
class DecoratedHostFunction {
 public:
  DecoratedHostFunction(Runtime& drt, HostFunctionType plainHF)
      : drt_(drt), plainHF_(std::move(plainHF)) {}

  Runtime& decoratedRuntime() {
    return drt_;
  }

  Value
  operator()(Runtime&, const Value& thisVal, const Value* args, size_t count) {
    return plainHF_(decoratedRuntime(), thisVal, args, count);
  }

 private:
  template <typename Plain, typename Base>
  friend class RuntimeDecorator;

  Runtime& drt_;
  HostFunctionType plainHF_;
};

// From the perspective of the caller, a plain HostObject is passed to
// the decorated Runtime, and the HostObject methods expect to get
// passed that Runtime.  But the plain Runtime will pass itself to its
// callback, so we need a helper here which curries the decorated
// Runtime, and calls the plain HostObject with it.
//
// If the concrete RuntimeDecorator derives DecoratedHostObject, it
// should call the base class get() and set() to invoke the plain
// HostObject functionality.  The Runtime& it passes does not matter,
// as it is not used.
class DecoratedHostObject : public HostObject {
 public:
  DecoratedHostObject(Runtime& drt, std::shared_ptr<HostObject> plainHO)
      : drt_(drt), plainHO_(plainHO) {}

  // The derived class methods can call this to get a reference to the
  // decorated runtime, since the rt passed to the callback will be
  // the plain runtime.
  Runtime& decoratedRuntime() {
    return drt_;
  }

  Value get(Runtime&, const PropNameID& name) override {
    return plainHO_->get(decoratedRuntime(), name);
  }

  void set(Runtime&, const PropNameID& name, const Value& value) override {
    plainHO_->set(decoratedRuntime(), name, value);
  }

  std::vector<PropNameID> getPropertyNames(Runtime&) override {
    return plainHO_->getPropertyNames(decoratedRuntime());
  }

 private:
  template <typename Plain, typename Base>
  friend class RuntimeDecorator;

  Runtime& drt_;
  std::shared_ptr<HostObject> plainHO_;
};

/// C++ variant on a standard Decorator pattern, using template
/// parameters.  The \c Plain template parameter type is the
/// undecorated Runtime type.  You can usually use \c Runtime here,
/// but if you know the concrete type ahead of time and it's final,
/// the compiler can devirtualize calls to the decorated
/// implementation.  The \c Base template parameter type will be used
/// as the base class of the decorated type.  Here, too, you can
/// usually use \c Runtime, but if you want the decorated type to
/// implement a derived class of Runtime, you can specify that here.
/// For an example, see threadsafe.h.
template <typename Plain = Runtime, typename Base = Runtime>
class RuntimeDecorator : public Base, private jsi::Instrumentation {
 public:
  Plain& plain() {
    static_assert(
        std::is_base_of<Runtime, Plain>::value,
        "RuntimeDecorator's Plain type must derive from jsi::Runtime");
    static_assert(
        std::is_base_of<Runtime, Base>::value,
        "RuntimeDecorator's Base type must derive from jsi::Runtime");
    return plain_;
  }
  const Plain& plain() const {
    return plain_;
  }

  ICast* castInterface(const UUID& interfaceUUID) override {
    return plain().castInterface(interfaceUUID);
  }

  Value evaluateJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      const std::string& sourceURL) override {
    return plain().evaluateJavaScript(buffer, sourceURL);
  }
  std::shared_ptr<const PreparedJavaScript> prepareJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      std::string sourceURL) override {
    return plain().prepareJavaScript(buffer, std::move(sourceURL));
  }
  Value evaluatePreparedJavaScript(
      const std::shared_ptr<const PreparedJavaScript>& js) override {
    return plain().evaluatePreparedJavaScript(js);
  }
  void queueMicrotask(const jsi::Function& callback) override {
    return plain().queueMicrotask(callback);
  }
  bool drainMicrotasks(int maxMicrotasksHint) override {
    return plain().drainMicrotasks(maxMicrotasksHint);
  }
  Object global() override {
    return plain().global();
  }
  std::string description() override {
    return plain().description();
  }
  bool isInspectable() override {
    return plain().isInspectable();
  }
  Instrumentation& instrumentation() override {
    return *this;
  }

 protected:
  // plain is generally going to be a reference to an object managed
  // by a derived class.  We cache it here so this class can be
  // concrete, and avoid making virtual calls to find the plain
  // Runtime.  Note that the ctor and dtor do not access through the
  // reference, so passing a reference to an object before its
  // lifetime has started is ok.
  RuntimeDecorator(Plain& plain) : plain_(plain) {}

  Runtime::PointerValue* cloneSymbol(const Runtime::PointerValue* pv) override {
    return plain_.cloneSymbol(pv);
  }
  Runtime::PointerValue* cloneBigInt(const Runtime::PointerValue* pv) override {
    return plain_.cloneBigInt(pv);
  }
  Runtime::PointerValue* cloneString(const Runtime::PointerValue* pv) override {
    return plain_.cloneString(pv);
  }
  Runtime::PointerValue* cloneObject(const Runtime::PointerValue* pv) override {
    return plain_.cloneObject(pv);
  }
  Runtime::PointerValue* clonePropNameID(
      const Runtime::PointerValue* pv) override {
    return plain_.clonePropNameID(pv);
  }

  PropNameID createPropNameIDFromAscii(const char* str, size_t length)
      override {
    return plain_.createPropNameIDFromAscii(str, length);
  }
  PropNameID createPropNameIDFromUtf8(const uint8_t* utf8, size_t length)
      override {
    return plain_.createPropNameIDFromUtf8(utf8, length);
  }
  PropNameID createPropNameIDFromString(const String& str) override {
    return plain_.createPropNameIDFromString(str);
  }
  PropNameID createPropNameIDFromUtf16(const char16_t* utf16, size_t length)
      override {
    return plain_.createPropNameIDFromUtf16(utf16, length);
  }
  PropNameID createPropNameIDFromSymbol(const Symbol& sym) override {
    return plain_.createPropNameIDFromSymbol(sym);
  }
  std::string utf8(const PropNameID& id) override {
    return plain_.utf8(id);
  }
  bool compare(const PropNameID& a, const PropNameID& b) override {
    return plain_.compare(a, b);
  }

  std::string symbolToString(const Symbol& sym) override {
    return plain_.symbolToString(sym);
  }

  BigInt createBigIntFromInt64(int64_t value) override {
    return plain_.createBigIntFromInt64(value);
  }
  BigInt createBigIntFromUint64(uint64_t value) override {
    return plain_.createBigIntFromUint64(value);
  }
  bool bigintIsInt64(const BigInt& b) override {
    return plain_.bigintIsInt64(b);
  }
  bool bigintIsUint64(const BigInt& b) override {
    return plain_.bigintIsUint64(b);
  }
  uint64_t truncate(const BigInt& b) override {
    return plain_.truncate(b);
  }
  String bigintToString(const BigInt& bigint, int radix) override {
    return plain_.bigintToString(bigint, radix);
  }

  String createStringFromAscii(const char* str, size_t length) override {
    return plain_.createStringFromAscii(str, length);
  }
  String createStringFromUtf8(const uint8_t* utf8, size_t length) override {
    return plain_.createStringFromUtf8(utf8, length);
  }
  String createStringFromUtf16(const char16_t* utf16, size_t length) override {
    return plain_.createStringFromUtf16(utf16, length);
  }
  std::string utf8(const String& s) override {
    return plain_.utf8(s);
  }

  std::u16string utf16(const String& str) override {
    return plain_.utf16(str);
  }
  std::u16string utf16(const PropNameID& sym) override {
    return plain_.utf16(sym);
  }

  void getStringData(
      const jsi::String& str,
      void* ctx,
      void (
          *cb)(void* ctx, bool ascii, const void* data, size_t num)) override {
    plain_.getStringData(str, ctx, cb);
  }

  void getPropNameIdData(
      const jsi::PropNameID& sym,
      void* ctx,
      void (
          *cb)(void* ctx, bool ascii, const void* data, size_t num)) override {
    plain_.getPropNameIdData(sym, ctx, cb);
  }

  Object createObjectWithPrototype(const Value& prototype) override {
    return plain_.createObjectWithPrototype(prototype);
  }

  Object createObject() override {
    return plain_.createObject();
  }

  Object createObject(std::shared_ptr<HostObject> ho) override {
    return plain_.createObject(
        std::make_shared<DecoratedHostObject>(*this, std::move(ho)));
  }
  std::shared_ptr<HostObject> getHostObject(const jsi::Object& o) override {
    std::shared_ptr<HostObject> dho = plain_.getHostObject(o);
    return static_cast<DecoratedHostObject&>(*dho).plainHO_;
  }
  HostFunctionType& getHostFunction(const jsi::Function& f) override {
    HostFunctionType& dhf = plain_.getHostFunction(f);
    // This will fail if a cpp file including this header is not compiled
    // with RTTI.
    return dhf.target<DecoratedHostFunction>()->plainHF_;
  }

  bool hasNativeState(const Object& o) override {
    return plain_.hasNativeState(o);
  }
  std::shared_ptr<NativeState> getNativeState(const Object& o) override {
    return plain_.getNativeState(o);
  }
  void setNativeState(const Object& o, std::shared_ptr<NativeState> state)
      override {
    plain_.setNativeState(o, state);
  }

  void setExternalMemoryPressure(const Object& obj, size_t amt) override {
    plain_.setExternalMemoryPressure(obj, amt);
  }

  void setPrototypeOf(const Object& object, const Value& prototype) override {
    plain_.setPrototypeOf(object, prototype);
  }

  Value getPrototypeOf(const Object& object) override {
    return plain_.getPrototypeOf(object);
  }

  Value getProperty(const Object& o, const PropNameID& name) override {
    return plain_.getProperty(o, name);
  }
  Value getProperty(const Object& o, const String& name) override {
    return plain_.getProperty(o, name);
  }
  Value getProperty(const Object& o, const Value& name) override {
    return plain_.getProperty(o, name);
  }
  bool hasProperty(const Object& o, const PropNameID& name) override {
    return plain_.hasProperty(o, name);
  }
  bool hasProperty(const Object& o, const String& name) override {
    return plain_.hasProperty(o, name);
  }
  bool hasProperty(const Object& o, const Value& name) override {
    return plain_.hasProperty(o, name);
  }
  void setPropertyValue(
      const Object& o,
      const PropNameID& name,
      const Value& value) override {
    plain_.setPropertyValue(o, name, value);
  }
  void setPropertyValue(const Object& o, const String& name, const Value& value)
      override {
    plain_.setPropertyValue(o, name, value);
  }
  void setPropertyValue(const Object& o, const Value& name, const Value& value)
      override {
    plain_.setPropertyValue(o, name, value);
  }

  void deleteProperty(const Object& object, const PropNameID& name) override {
    plain_.deleteProperty(object, name);
  }

  void deleteProperty(const Object& object, const String& name) override {
    plain_.deleteProperty(object, name);
  }

  void deleteProperty(const Object& object, const Value& name) override {
    plain_.deleteProperty(object, name);
  }

  bool isArray(const Object& o) const override {
    return plain_.isArray(o);
  }
  bool isArrayBuffer(const Object& o) const override {
    return plain_.isArrayBuffer(o);
  }
  bool isTypedArray(const Object& o) const override {
    return plain_.isTypedArray(o);
  }
  bool isUint8Array(const Object& o) const override {
    return plain_.isUint8Array(o);
  }
  bool isFunction(const Object& o) const override {
    return plain_.isFunction(o);
  }
  bool isHostObject(const jsi::Object& o) const override {
    return plain_.isHostObject(o);
  }
  bool isHostFunction(const jsi::Function& f) const override {
    return plain_.isHostFunction(f);
  }
  Array getPropertyNames(const Object& o) override {
    return plain_.getPropertyNames(o);
  }

  WeakObject createWeakObject(const Object& o) override {
    return plain_.createWeakObject(o);
  }
  Value lockWeakObject(const WeakObject& wo) override {
    return plain_.lockWeakObject(wo);
  }

  Array createArray(size_t length) override {
    return plain_.createArray(length);
  }
  ArrayBuffer createArrayBuffer(
      std::shared_ptr<MutableBuffer> buffer) override {
    return plain_.createArrayBuffer(std::move(buffer));
  }
  size_t size(const Array& a) override {
    return plain_.size(a);
  }
  size_t size(const ArrayBuffer& ab) override {
    return plain_.size(ab);
  }
  uint8_t* data(const ArrayBuffer& ab) override {
    return plain_.data(ab);
  }
  bool detached(const ArrayBuffer& ab) override {
    return plain_.detached(ab);
  }
  Value getValueAtIndex(const Array& a, size_t i) override {
    return plain_.getValueAtIndex(a, i);
  }
  void setValueAtIndexImpl(const Array& a, size_t i, const Value& value)
      override {
    plain_.setValueAtIndexImpl(a, i, value);
  }

  size_t push(const Array& a, const Value* elements, size_t count) override {
    return plain_.push(a, elements, count);
  }

  Function createFunctionFromHostFunction(
      const PropNameID& name,
      unsigned int paramCount,
      HostFunctionType func) override {
    return plain_.createFunctionFromHostFunction(
        name, paramCount, DecoratedHostFunction(*this, std::move(func)));
  }
  Value call(
      const Function& f,
      const Value& jsThis,
      const Value* args,
      size_t count) override {
    return plain_.call(f, jsThis, args, count);
  }
  Value callAsConstructor(const Function& f, const Value* args, size_t count)
      override {
    return plain_.callAsConstructor(f, args, count);
  }

  void setRuntimeDataImpl(
      const UUID& uuid,
      const void* data,
      void (*deleter)(const void* data)) override {
    return plain_.setRuntimeDataImpl(uuid, data, deleter);
  }

  const void* getRuntimeDataImpl(const UUID& uuid) override {
    return plain_.getRuntimeDataImpl(uuid);
  }

  std::shared_ptr<MutableBuffer> tryGetMutableBuffer(
      const jsi::ArrayBuffer& arrayBuffer) override {
    return plain_.tryGetMutableBuffer(arrayBuffer);
  }

  ArrayBuffer buffer(const TypedArray& typedArray) override {
    return plain_.buffer(typedArray);
  }
  size_t byteOffset(const TypedArray& typedArray) override {
    return plain_.byteOffset(typedArray);
  }
  size_t byteLength(const TypedArray& typedArray) override {
    return plain_.byteLength(typedArray);
  }
  size_t length(const TypedArray& typedArray) override {
    return plain_.length(typedArray);
  }

  Uint8Array createUint8Array(size_t length) override {
    return plain_.createUint8Array(length);
  }

  Uint8Array createUint8Array(
      const ArrayBuffer& buffer,
      size_t offset,
      size_t length) override {
    return plain_.createUint8Array(buffer, offset, length);
  }

  // Private data for managing scopes.
  Runtime::ScopeState* pushScope() override {
    return plain_.pushScope();
  }
  void popScope(Runtime::ScopeState* ss) override {
    plain_.popScope(ss);
  }

  bool strictEquals(const Symbol& a, const Symbol& b) const override {
    return plain_.strictEquals(a, b);
  }
  bool strictEquals(const BigInt& a, const BigInt& b) const override {
    return plain_.strictEquals(a, b);
  }
  bool strictEquals(const String& a, const String& b) const override {
    return plain_.strictEquals(a, b);
  }
  bool strictEquals(const Object& a, const Object& b) const override {
    return plain_.strictEquals(a, b);
  }

  bool instanceOf(const Object& o, const Function& f) override {
    return plain_.instanceOf(o, f);
  }

  // jsi::Instrumentation methods

  std::string getRecordedGCStats() override {
    return plain().instrumentation().getRecordedGCStats();
  }

  std::unordered_map<std::string, int64_t> getHeapInfo(
      bool includeExpensive) override {
    return plain().instrumentation().getHeapInfo(includeExpensive);
  }

  void collectGarbage(std::string cause) override {
    plain().instrumentation().collectGarbage(std::move(cause));
  }

  void startTrackingHeapObjectStackTraces(
      std::function<void(
          uint64_t,
          std::chrono::microseconds,
          std::vector<HeapStatsUpdate>)> callback) override {
    plain().instrumentation().startTrackingHeapObjectStackTraces(
        std::move(callback));
  }

  void stopTrackingHeapObjectStackTraces() override {
    plain().instrumentation().stopTrackingHeapObjectStackTraces();
  }

  void startHeapSampling(size_t samplingInterval) override {
    plain().instrumentation().startHeapSampling(samplingInterval);
  }

  void stopHeapSampling(std::ostream& os) override {
    plain().instrumentation().stopHeapSampling(os);
  }

  void createSnapshotToFile(
      const std::string& path,
      const HeapSnapshotOptions& options) override {
    plain().instrumentation().createSnapshotToFile(path, options);
  }

  void createSnapshotToStream(
      std::ostream& os,
      const HeapSnapshotOptions& options) override {
    plain().instrumentation().createSnapshotToStream(os, options);
  }

  std::string flushAndDisableBridgeTrafficTrace() override {
    return const_cast<Plain&>(plain())
        .instrumentation()
        .flushAndDisableBridgeTrafficTrace();
  }

  void writeBasicBlockProfileTraceToFile(
      const std::string& fileName) const override {
    const_cast<Plain&>(plain())
        .instrumentation()
        .writeBasicBlockProfileTraceToFile(fileName);
  }

  void dumpOpcodeStats(std::ostream& os) const override {
    const_cast<Plain&>(plain()).instrumentation().dumpOpcodeStats(os);
  }

  /// Dump external profiler symbols to the given file name.
  void dumpProfilerSymbolsToFile(const std::string& fileName) const override {
    const_cast<Plain&>(plain()).instrumentation().dumpProfilerSymbolsToFile(
        fileName);
  }

 private:
  Plain& plain_;
};

namespace detail {

// This metaprogramming allows the With type's methods to be
// optional.

template <typename T, typename U = void>
struct BeforeCaller {
  static void before(T&) {}
};

template <typename T, typename U = void>
struct AfterCaller {
  static void after(T&) {}
};

// decltype((void)&...) is either SFINAE, or void.
// So, if SFINAE does not happen for T, then this specialization exists
// for BeforeCaller<T, void>, and always applies.  If not, only the
// default above exists, and that is used instead.
template <typename T>
struct BeforeCaller<T, decltype((void)&T::before)> {
  static void before(T& t) {
    t.before();
  }
};

template <typename T>
struct AfterCaller<T, decltype((void)&T::after)> {
  static void after(T& t) {
    t.after();
  }
};

// It's possible to use multiple decorators by nesting
// WithRuntimeDecorator<...>, but this specialization allows use of
// std::tuple of decorator classes instead.  See testlib.cpp for an
// example.
template <typename... T>
struct BeforeCaller<std::tuple<T...>> {
  static void before(std::tuple<T...>& tuple) {
    all_before<0, T...>(tuple);
  }

 private:
  template <size_t N, typename U, typename... Rest>
  static void all_before(std::tuple<T...>& tuple) {
    detail::BeforeCaller<U>::before(std::get<N>(tuple));
    all_before<N + 1, Rest...>(tuple);
  }

  template <size_t N>
  static void all_before(std::tuple<T...>&) {}
};

template <typename... T>
struct AfterCaller<std::tuple<T...>> {
  static void after(std::tuple<T...>& tuple) {
    all_after<0, T...>(tuple);
  }

 private:
  template <size_t N, typename U, typename... Rest>
  static void all_after(std::tuple<T...>& tuple) {
    all_after<N + 1, Rest...>(tuple);
    detail::AfterCaller<U>::after(std::get<N>(tuple));
  }

  template <size_t N>
  static void all_after(std::tuple<T...>&) {}
};

} // namespace detail

// A decorator which implements an around idiom.  A With instance is
// RAII constructed before each call to the undecorated class; the
// ctor is passed a single argument of type WithArg&.  Plain and Base
// are used as in the base class.
template <typename With, typename Plain = Runtime, typename Base = Runtime>
class WithRuntimeDecorator : public RuntimeDecorator<Plain, Base> {
 public:
  using RD = RuntimeDecorator<Plain, Base>;

  // The reference arguments to the ctor are stored, but not used by
  // the ctor, and there is no ctor, so they can be passed members of
  // the derived class.
  WithRuntimeDecorator(Plain& plain, With& with) : RD(plain), with_(with) {}

  ICast* castInterface(const UUID& interfaceUUID) override {
    Around around{with_};
    return RD::castInterface(interfaceUUID);
  }

  Value evaluateJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      const std::string& sourceURL) override {
    Around around{with_};
    return RD::evaluateJavaScript(buffer, sourceURL);
  }
  std::shared_ptr<const PreparedJavaScript> prepareJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      std::string sourceURL) override {
    Around around{with_};
    return RD::prepareJavaScript(buffer, std::move(sourceURL));
  }
  Value evaluatePreparedJavaScript(
      const std::shared_ptr<const PreparedJavaScript>& js) override {
    Around around{with_};
    return RD::evaluatePreparedJavaScript(js);
  }
  void queueMicrotask(const Function& callback) override {
    Around around{with_};
    RD::queueMicrotask(callback);
  }
  bool drainMicrotasks(int maxMicrotasksHint) override {
    Around around{with_};
    return RD::drainMicrotasks(maxMicrotasksHint);
  }
  Object global() override {
    Around around{with_};
    return RD::global();
  }
  std::string description() override {
    Around around{with_};
    return RD::description();
  }
  bool isInspectable() override {
    Around around{with_};
    return RD::isInspectable();
  }

  // The jsi:: prefix is necessary because MSVC compiler complains C2247:
  // Instrumentation is not accessible because RuntimeDecorator uses private
  // to inherit from Instrumentation.
  // TODO(T40821815) Consider removing this workaround when updating MSVC
  jsi::Instrumentation& instrumentation() override {
    Around around{with_};
    return RD::instrumentation();
  }

 protected:
  Runtime::PointerValue* cloneSymbol(const Runtime::PointerValue* pv) override {
    Around around{with_};
    return RD::cloneSymbol(pv);
  }
  Runtime::PointerValue* cloneBigInt(const Runtime::PointerValue* pv) override {
    Around around{with_};
    return RD::cloneBigInt(pv);
  }
  Runtime::PointerValue* cloneString(const Runtime::PointerValue* pv) override {
    Around around{with_};
    return RD::cloneString(pv);
  }
  Runtime::PointerValue* cloneObject(const Runtime::PointerValue* pv) override {
    Around around{with_};
    return RD::cloneObject(pv);
  }
  Runtime::PointerValue* clonePropNameID(
      const Runtime::PointerValue* pv) override {
    Around around{with_};
    return RD::clonePropNameID(pv);
  }

  PropNameID createPropNameIDFromAscii(const char* str, size_t length)
      override {
    Around around{with_};
    return RD::createPropNameIDFromAscii(str, length);
  }
  PropNameID createPropNameIDFromUtf8(const uint8_t* utf8, size_t length)
      override {
    Around around{with_};
    return RD::createPropNameIDFromUtf8(utf8, length);
  }
  PropNameID createPropNameIDFromUtf16(const char16_t* utf16, size_t length)
      override {
    Around around{with_};
    return RD::createPropNameIDFromUtf16(utf16, length);
  }
  PropNameID createPropNameIDFromString(const String& str) override {
    Around around{with_};
    return RD::createPropNameIDFromString(str);
  }
  PropNameID createPropNameIDFromSymbol(const Symbol& sym) override {
    Around around{with_};
    return RD::createPropNameIDFromSymbol(sym);
  }
  std::string utf8(const PropNameID& id) override {
    Around around{with_};
    return RD::utf8(id);
  }
  bool compare(const PropNameID& a, const PropNameID& b) override {
    Around around{with_};
    return RD::compare(a, b);
  }

  std::string symbolToString(const Symbol& sym) override {
    Around around{with_};
    return RD::symbolToString(sym);
  }

  BigInt createBigIntFromInt64(int64_t i) override {
    Around around{with_};
    return RD::createBigIntFromInt64(i);
  }
  BigInt createBigIntFromUint64(uint64_t i) override {
    Around around{with_};
    return RD::createBigIntFromUint64(i);
  }
  bool bigintIsInt64(const BigInt& bi) override {
    Around around{with_};
    return RD::bigintIsInt64(bi);
  }
  bool bigintIsUint64(const BigInt& bi) override {
    Around around{with_};
    return RD::bigintIsUint64(bi);
  }
  uint64_t truncate(const BigInt& bi) override {
    Around around{with_};
    return RD::truncate(bi);
  }
  String bigintToString(const BigInt& bi, int i) override {
    Around around{with_};
    return RD::bigintToString(bi, i);
  }

  String createStringFromAscii(const char* str, size_t length) override {
    Around around{with_};
    return RD::createStringFromAscii(str, length);
  }
  String createStringFromUtf8(const uint8_t* utf8, size_t length) override {
    Around around{with_};
    return RD::createStringFromUtf8(utf8, length);
  }
  String createStringFromUtf16(const char16_t* utf16, size_t length) override {
    Around around{with_};
    return RD::createStringFromUtf16(utf16, length);
  }
  std::string utf8(const String& s) override {
    Around around{with_};
    return RD::utf8(s);
  }

  std::u16string utf16(const String& str) override {
    Around around{with_};
    return RD::utf16(str);
  }
  std::u16string utf16(const PropNameID& sym) override {
    Around around{with_};
    return RD::utf16(sym);
  }

  void getStringData(
      const jsi::String& str,
      void* ctx,
      void (
          *cb)(void* ctx, bool ascii, const void* data, size_t num)) override {
    Around around{with_};
    RD::getStringData(str, ctx, cb);
  }

  void getPropNameIdData(
      const jsi::PropNameID& sym,
      void* ctx,
      void (
          *cb)(void* ctx, bool ascii, const void* data, size_t num)) override {
    Around around{with_};
    RD::getPropNameIdData(sym, ctx, cb);
  }

  Value createValueFromJsonUtf8(const uint8_t* json, size_t length) override {
    Around around{with_};
    return RD::createValueFromJsonUtf8(json, length);
  }

  Object createObjectWithPrototype(const Value& prototype) override {
    Around around{with_};
    return RD::createObjectWithPrototype(prototype);
  }

  Object createObject() override {
    Around around{with_};
    return RD::createObject();
  }
  Object createObject(std::shared_ptr<HostObject> ho) override {
    Around around{with_};
    return RD::createObject(std::move(ho));
  }
  std::shared_ptr<HostObject> getHostObject(const jsi::Object& o) override {
    Around around{with_};
    return RD::getHostObject(o);
  }
  HostFunctionType& getHostFunction(const jsi::Function& f) override {
    Around around{with_};
    return RD::getHostFunction(f);
  }

  bool hasNativeState(const Object& o) override {
    Around around{with_};
    return RD::hasNativeState(o);
  }
  std::shared_ptr<NativeState> getNativeState(const Object& o) override {
    Around around{with_};
    return RD::getNativeState(o);
  }
  void setNativeState(const Object& o, std::shared_ptr<NativeState> state)
      override {
    Around around{with_};
    RD::setNativeState(o, state);
  }

  void setPrototypeOf(const Object& object, const Value& prototype) override {
    Around around{with_};
    RD::setPrototypeOf(object, prototype);
  }

  Value getPrototypeOf(const Object& object) override {
    Around around{with_};
    return RD::getPrototypeOf(object);
  }

  Value getProperty(const Object& o, const PropNameID& name) override {
    Around around{with_};
    return RD::getProperty(o, name);
  }
  Value getProperty(const Object& o, const String& name) override {
    Around around{with_};
    return RD::getProperty(o, name);
  }
  Value getProperty(const Object& o, const Value& name) override {
    Around around{with_};
    return RD::getProperty(o, name);
  }
  bool hasProperty(const Object& o, const PropNameID& name) override {
    Around around{with_};
    return RD::hasProperty(o, name);
  }
  bool hasProperty(const Object& o, const String& name) override {
    Around around{with_};
    return RD::hasProperty(o, name);
  }
  bool hasProperty(const Object& o, const Value& name) override {
    Around around{with_};
    return RD::hasProperty(o, name);
  }
  void setPropertyValue(
      const Object& o,
      const PropNameID& name,
      const Value& value) override {
    Around around{with_};
    RD::setPropertyValue(o, name, value);
  }
  void setPropertyValue(const Object& o, const String& name, const Value& value)
      override {
    Around around{with_};
    RD::setPropertyValue(o, name, value);
  }
  void setPropertyValue(const Object& o, const Value& name, const Value& value)
      override {
    Around around{with_};
    RD::setPropertyValue(o, name, value);
  }

  void deleteProperty(const Object& object, const PropNameID& name) override {
    Around around{with_};
    RD::deleteProperty(object, name);
  }

  void deleteProperty(const Object& object, const String& name) override {
    Around around{with_};
    RD::deleteProperty(object, name);
  }

  void deleteProperty(const Object& object, const Value& name) override {
    Around around{with_};
    RD::deleteProperty(object, name);
  }

  bool isArray(const Object& o) const override {
    Around around{with_};
    return RD::isArray(o);
  }
  bool isArrayBuffer(const Object& o) const override {
    Around around{with_};
    return RD::isArrayBuffer(o);
  }
  bool isTypedArray(const Object& o) const override {
    Around around{with_};
    return RD::isTypedArray(o);
  }
  bool isUint8Array(const Object& o) const override {
    Around around{with_};
    return RD::isUint8Array(o);
  }
  bool isFunction(const Object& o) const override {
    Around around{with_};
    return RD::isFunction(o);
  }
  bool isHostObject(const jsi::Object& o) const override {
    Around around{with_};
    return RD::isHostObject(o);
  }
  bool isHostFunction(const jsi::Function& f) const override {
    Around around{with_};
    return RD::isHostFunction(f);
  }
  Array getPropertyNames(const Object& o) override {
    Around around{with_};
    return RD::getPropertyNames(o);
  }

  WeakObject createWeakObject(const Object& o) override {
    Around around{with_};
    return RD::createWeakObject(o);
  }
  Value lockWeakObject(const WeakObject& wo) override {
    Around around{with_};
    return RD::lockWeakObject(wo);
  }

  Array createArray(size_t length) override {
    Around around{with_};
    return RD::createArray(length);
  }
  ArrayBuffer createArrayBuffer(
      std::shared_ptr<MutableBuffer> buffer) override {
    return RD::createArrayBuffer(std::move(buffer));
  }
  size_t size(const Array& a) override {
    Around around{with_};
    return RD::size(a);
  }
  size_t size(const ArrayBuffer& ab) override {
    Around around{with_};
    return RD::size(ab);
  }
  uint8_t* data(const ArrayBuffer& ab) override {
    Around around{with_};
    return RD::data(ab);
  }
  bool detached(const ArrayBuffer& ab) override {
    Around around{with_};
    return RD::detached(ab);
  }
  Value getValueAtIndex(const Array& a, size_t i) override {
    Around around{with_};
    return RD::getValueAtIndex(a, i);
  }
  void setValueAtIndexImpl(const Array& a, size_t i, const Value& value)
      override {
    Around around{with_};
    RD::setValueAtIndexImpl(a, i, value);
  }
  size_t push(const Array& a, const Value* elements, size_t count) override {
    Around around{with_};
    return RD::push(a, elements, count);
  }

  Function createFunctionFromHostFunction(
      const PropNameID& name,
      unsigned int paramCount,
      HostFunctionType func) override {
    Around around{with_};
    return RD::createFunctionFromHostFunction(
        name, paramCount, std::move(func));
  }
  Value call(
      const Function& f,
      const Value& jsThis,
      const Value* args,
      size_t count) override {
    Around around{with_};
    return RD::call(f, jsThis, args, count);
  }
  Value callAsConstructor(const Function& f, const Value* args, size_t count)
      override {
    Around around{with_};
    return RD::callAsConstructor(f, args, count);
  }

  std::shared_ptr<MutableBuffer> tryGetMutableBuffer(
      const jsi::ArrayBuffer& arrayBuffer) override {
    Around around{with_};
    return RD::tryGetMutableBuffer(arrayBuffer);
  }

  ArrayBuffer buffer(const TypedArray& typedArray) override {
    Around around{with_};
    return RD::buffer(typedArray);
  }
  size_t byteOffset(const TypedArray& typedArray) override {
    Around around{with_};
    return RD::byteOffset(typedArray);
  }
  size_t byteLength(const TypedArray& typedArray) override {
    Around around{with_};
    return RD::byteLength(typedArray);
  }
  size_t length(const TypedArray& typedArray) override {
    Around around{with_};
    return RD::length(typedArray);
  }

  Uint8Array createUint8Array(size_t length) override {
    Around around{with_};
    return RD::createUint8Array(length);
  }
  Uint8Array createUint8Array(
      const ArrayBuffer& buffer,
      size_t offset,
      size_t length) override {
    Around around{with_};
    return RD::createUint8Array(buffer, offset, length);
  }

  // Private data for managing scopes.
  Runtime::ScopeState* pushScope() override {
    Around around{with_};
    return RD::pushScope();
  }
  void popScope(Runtime::ScopeState* ss) override {
    Around around{with_};
    RD::popScope(ss);
  }

  bool strictEquals(const Symbol& a, const Symbol& b) const override {
    Around around{with_};
    return RD::strictEquals(a, b);
  }
  bool strictEquals(const BigInt& a, const BigInt& b) const override {
    Around around{with_};
    return RD::strictEquals(a, b);
  }

  bool strictEquals(const String& a, const String& b) const override {
    Around around{with_};
    return RD::strictEquals(a, b);
  }
  bool strictEquals(const Object& a, const Object& b) const override {
    Around around{with_};
    return RD::strictEquals(a, b);
  }

  bool instanceOf(const Object& o, const Function& f) override {
    Around around{with_};
    return RD::instanceOf(o, f);
  }

  void setExternalMemoryPressure(const jsi::Object& obj, size_t amount)
      override {
    Around around{with_};
    RD::setExternalMemoryPressure(obj, amount);
  }

  void setRuntimeDataImpl(
      const UUID& uuid,
      const void* data,
      void (*deleter)(const void* data)) override {
    Around around{with_};
    RD::setRuntimeDataImpl(uuid, data, deleter);
  }

  const void* getRuntimeDataImpl(const UUID& uuid) override {
    Around around{with_};
    return RD::getRuntimeDataImpl(uuid);
  }

 private:
  // Wrap an RAII type around With& to guarantee after always happens.
  struct Around {
    Around(With& with) : with_(with) {
      detail::BeforeCaller<With>::before(with_);
    }
    ~Around() {
      detail::AfterCaller<With>::after(with_);
    }

    With& with_;
  };

  With& with_;
};

} // namespace jsi
} // namespace facebook
