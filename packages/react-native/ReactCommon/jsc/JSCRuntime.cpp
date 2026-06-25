/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSCRuntime.h"

#include <JavaScriptCore/JavaScript.h>
#include <jsi/jsilib.h>
#include <array>
#include <atomic>
#include <condition_variable>
#include <cstdlib>
#include <deque>
#include <mutex>
#include <sstream>
#include <thread>

namespace facebook::jsc {

namespace detail {
class ArgsConverter;
} // namespace detail

class JSCRuntime;

struct Lock {
  void lock(const jsc::JSCRuntime& /*unused*/) const {}
  void unlock(const jsc::JSCRuntime& /*unused*/) const {}
};

class JSCRuntime : public jsi::Runtime {
 public:
  // Creates new context in new context group
  JSCRuntime();
  // Retains ctx
  JSCRuntime(JSGlobalContextRef ctx);
  ~JSCRuntime();

  std::shared_ptr<const jsi::PreparedJavaScript> prepareJavaScript(
      const std::shared_ptr<const jsi::Buffer>& buffer,
      std::string sourceURL) override;

  jsi::Value evaluatePreparedJavaScript(
      const std::shared_ptr<const jsi::PreparedJavaScript>& js) override;

  jsi::Value evaluateJavaScript(
      const std::shared_ptr<const jsi::Buffer>& buffer,
      const std::string& sourceURL) override;

  // If we use this interface to implement microtasks in the host we need to
  // polyfill `Promise` to use these methods, because JSC doesn't currently
  // support providing a custom queue for its built-in implementation.
  // Not doing this would result in a non-compliant behavior, as microtasks
  // wouldn't execute in the order in which they were queued.
  void queueMicrotask(const jsi::Function& callback) override;
  bool drainMicrotasks(int maxMicrotasksHint = -1) override;

  jsi::Object global() override;

  std::string description() override;

  bool isInspectable() override;

  void setDescription(const std::string& desc);

  // Please don't use the following two functions, only exposed for
  // integration efforts.
  JSGlobalContextRef getContext() {
    return ctx_;
  }

  // JSValueRef->JSValue (needs make.*Value so it must be member function)
  jsi::Value createValue(JSValueRef value) const;

  // Value->JSValueRef (similar to above)
  JSValueRef valueRef(const jsi::Value& value);

 protected:
  friend class detail::ArgsConverter;
  class JSCSymbolValue final : public PointerValue {
#ifndef NDEBUG
    JSCSymbolValue(
        JSGlobalContextRef ctx,
        const std::atomic<bool>& ctxInvalid,
        JSValueRef sym,
        std::atomic<intptr_t>& counter);
#else
    JSCSymbolValue(
        JSGlobalContextRef ctx,
        const std::atomic<bool>& ctxInvalid,
        JSValueRef sym);
#endif
    void invalidate() noexcept override;

    JSGlobalContextRef ctx_;
    const std::atomic<bool>& ctxInvalid_;
    // There is no C type in the JSC API to represent Symbol, so this stored
    // a JSValueRef which contains the Symbol.
    JSValueRef sym_;
#ifndef NDEBUG
    std::atomic<intptr_t>& counter_;
#endif
   protected:
    friend class JSCRuntime;
  };

  class JSCStringValue final : public PointerValue {
#ifndef NDEBUG
    JSCStringValue(JSStringRef str, std::atomic<intptr_t>& counter);
#else
    JSCStringValue(JSStringRef str);
#endif
    void invalidate() noexcept override;

    JSStringRef str_;
#ifndef NDEBUG
    std::atomic<intptr_t>& counter_;
#endif
   protected:
    friend class JSCRuntime;
  };

  class JSCObjectValue final : public PointerValue {
    JSCObjectValue(
        JSGlobalContextRef ctx,
        const std::atomic<bool>& ctxInvalid,
        JSObjectRef obj
#ifndef NDEBUG
        ,
        std::atomic<intptr_t>& counter
#endif
    );

    void invalidate() noexcept override;

    JSGlobalContextRef ctx_;
    const std::atomic<bool>& ctxInvalid_;
    JSObjectRef obj_;
#ifndef NDEBUG
    std::atomic<intptr_t>& counter_;
#endif
   protected:
    friend class JSCRuntime;
  };

  using IRuntime::getProperty;
  using IRuntime::hasProperty;
  using IRuntime::setPropertyValue;

  PointerValue* cloneSymbol(const Runtime::PointerValue* pv) override;
  PointerValue* cloneBigInt(const Runtime::PointerValue* pv) override;
  PointerValue* cloneString(const Runtime::PointerValue* pv) override;
  PointerValue* cloneObject(const Runtime::PointerValue* pv) override;
  PointerValue* clonePropNameID(const Runtime::PointerValue* pv) override;

  jsi::PropNameID createPropNameIDFromAscii(const char* str, size_t length)
      override;
  jsi::PropNameID createPropNameIDFromUtf8(const uint8_t* utf8, size_t length)
      override;
  jsi::PropNameID createPropNameIDFromString(const jsi::String& str) override;
  jsi::PropNameID createPropNameIDFromSymbol(const jsi::Symbol& sym) override;
  std::string utf8(const jsi::PropNameID& /*sym*/) override;
  bool compare(const jsi::PropNameID& /*a*/, const jsi::PropNameID& /*b*/)
      override;

  std::string symbolToString(const jsi::Symbol& /*sym*/) override;

  jsi::BigInt createBigIntFromInt64(int64_t /*unused*/) override;
  jsi::BigInt createBigIntFromUint64(uint64_t /*unused*/) override;
  bool bigintIsInt64(const jsi::BigInt& /*unused*/) override;
  bool bigintIsUint64(const jsi::BigInt& /*unused*/) override;
  uint64_t truncate(const jsi::BigInt& /*unused*/) override;
  jsi::String bigintToString(const jsi::BigInt& /*unused*/, int /*unused*/)
      override;

  jsi::String createStringFromAscii(const char* str, size_t length) override;
  jsi::String createStringFromUtf8(const uint8_t* utf8, size_t length) override;
  std::string utf8(const jsi::String& /*str*/) override;
  size_t length(const jsi::String& /*str*/) override;

  jsi::Object createObject() override;
  jsi::Object createObject(std::shared_ptr<jsi::HostObject> ho) override;
  virtual std::shared_ptr<jsi::HostObject> getHostObject(
      const jsi::Object& /*obj*/) override;
  jsi::HostFunctionType& getHostFunction(const jsi::Function& /*obj*/) override;

  bool hasNativeState(const jsi::Object& /*obj*/) override;
  std::shared_ptr<jsi::NativeState> getNativeState(
      const jsi::Object& /*obj*/) override;
  void setNativeState(
      const jsi::Object& /*obj*/,
      std::shared_ptr<jsi::NativeState> /*nativeState*/) override;

  jsi::Value getProperty(const jsi::Object& /*obj*/, const jsi::String& name)
      override;
  jsi::Value getProperty(
      const jsi::Object& /*obj*/,
      const jsi::PropNameID& name) override;
  bool hasProperty(const jsi::Object& /*obj*/, const jsi::String& name)
      override;
  bool hasProperty(const jsi::Object& /*obj*/, const jsi::PropNameID& name)
      override;
  void setPropertyValue(
      const jsi::Object& /*object*/,
      const jsi::String& name,
      const jsi::Value& value) override;
  void setPropertyValue(
      const jsi::Object& /*object*/,
      const jsi::PropNameID& name,
      const jsi::Value& value) override;
  bool isArray(const jsi::Object& /*obj*/) const override;
  bool isArrayBuffer(const jsi::Object& /*obj*/) const override;
  bool isFunction(const jsi::Object& /*obj*/) const override;
  bool isHostObject(const jsi::Object& /*obj*/) const override;
  bool isHostFunction(const jsi::Function& /*obj*/) const override;
  jsi::Array getPropertyNames(const jsi::Object& /*obj*/) override;

  // TODO: revisit this implementation
  jsi::WeakObject createWeakObject(const jsi::Object& /*obj*/) override;
  jsi::Value lockWeakObject(const jsi::WeakObject& /*obj*/) override;

  jsi::Array createArray(size_t length) override;
  jsi::ArrayBuffer createArrayBuffer(
      std::shared_ptr<jsi::MutableBuffer> buffer) override;
  size_t size(const jsi::Array& /*arr*/) override;
  size_t size(const jsi::ArrayBuffer& /*obj*/) override;
  uint8_t* data(const jsi::ArrayBuffer& /*obj*/) override;
  jsi::Value getValueAtIndex(const jsi::Array& /*arr*/, size_t i) override;
  void setValueAtIndexImpl(
      const jsi::Array& /*arr*/,
      size_t i,
      const jsi::Value& value) override;

  jsi::Function createFunctionFromHostFunction(
      const jsi::PropNameID& name,
      unsigned int paramCount,
      jsi::HostFunctionType func) override;
  jsi::Value call(
      const jsi::Function& /*f*/,
      const jsi::Value& jsThis,
      const jsi::Value* args,
      size_t count) override;
  jsi::Value callAsConstructor(
      const jsi::Function& /*f*/,
      const jsi::Value* args,
      size_t count) override;

  bool strictEquals(const jsi::Symbol& a, const jsi::Symbol& b) const override;
  bool strictEquals(const jsi::BigInt& a, const jsi::BigInt& b) const override;
  bool strictEquals(const jsi::String& a, const jsi::String& b) const override;
  bool strictEquals(const jsi::Object& a, const jsi::Object& b) const override;
  bool instanceOf(const jsi::Object& o, const jsi::Function& f) override;
  void setExternalMemoryPressure(const jsi::Object& /*obj*/, size_t /*amount*/)
      override;

 private:
  // Basically convenience casts
  static JSValueRef symbolRef(const jsi::Symbol& str);
  static JSStringRef stringRef(const jsi::String& str);
  static JSStringRef stringRef(const jsi::PropNameID& sym);
  static JSObjectRef objectRef(const jsi::Object& obj);
  static JSObjectRef objectRef(const jsi::WeakObject& obj);

  // Factory methods for creating String/Object
  jsi::Symbol createSymbol(JSValueRef symbolRef) const;
  jsi::String createString(JSStringRef stringRef) const;
  jsi::PropNameID createPropNameID(JSStringRef stringRef);
  jsi::Object createObject(JSObjectRef objectRef) const;

  // Used by factory methods and clone methods
  jsi::Runtime::PointerValue* makeSymbolValue(JSValueRef sym) const;
  jsi::Runtime::PointerValue* makeStringValue(JSStringRef str) const;
  jsi::Runtime::PointerValue* makeObjectValue(JSObjectRef obj) const;

  JSValueRef getNativeStateSymbol();

  void checkException(JSValueRef exc);
  void checkException(JSValueRef res, JSValueRef exc);
  void checkException(JSValueRef exc, const char* msg);
  void checkException(JSValueRef res, JSValueRef exc, const char* msg);

  JSGlobalContextRef ctx_;
  std::atomic<bool> ctxInvalid_;
  std::string desc_;
  JSValueRef nativeStateSymbol_ = nullptr;
  std::deque<jsi::Function> microtaskQueue_;
#ifndef NDEBUG
  mutable std::atomic<intptr_t> objectCounter_;
  mutable std::atomic<intptr_t> symbolCounter_;
  mutable std::atomic<intptr_t> stringCounter_;
#endif
};

#ifndef __has_builtin
#define __has_builtin(x) 0
#endif

#if __has_builtin(__builtin_expect) || defined(__GNUC__)
#define JSC_LIKELY(EXPR) __builtin_expect((bool)(EXPR), true)
#define JSC_UNLIKELY(EXPR) __builtin_expect((bool)(EXPR), false)
#else
#define JSC_LIKELY(EXPR) (EXPR)
#define JSC_UNLIKELY(EXPR) (EXPR)
#endif

#define JSC_ASSERT(x)          \
  do {                         \
    if (JSC_UNLIKELY(!!(x))) { \
      abort();                 \
    }                          \
  } while (0)

#if defined(__IPHONE_OS_VERSION_MIN_REQUIRED)
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 160400
#define _JSC_HAS_INSPECTABLE
#endif
#endif

// JSStringRef utilities
namespace {
std::string JSStringToSTLString(JSStringRef str) {
  // Small string optimization: Avoid one heap allocation for strings that fit
  // in stackBuffer.size() bytes of UTF-8 (including the null terminator).
  std::array<char, 20> stackBuffer;
  std::unique_ptr<char[]> heapBuffer;
  char* buffer;
  // NOTE: By definition, maxBytes >= 1 since the null terminator is included.
  size_t maxBytes = JSStringGetMaximumUTF8CStringSize(str);
  if (maxBytes <= stackBuffer.size()) {
    buffer = stackBuffer.data();
  } else {
    heapBuffer = std::make_unique<char[]>(maxBytes);
    buffer = heapBuffer.get();
  }
  size_t actualBytes = JSStringGetUTF8CString(str, buffer, maxBytes);
  if (actualBytes == 0u) {
    // Happens if maxBytes == 0 (never the case here) or if str contains
    // invalid UTF-16 data, since JSStringGetUTF8CString attempts a strict
    // conversion.
    // When converting an invalid string, JSStringGetUTF8CString writes a null
    // terminator before returning. So we can reliably treat our buffer as a C
    // string and return the truncated data to our caller. This is slightly
    // slower than if we knew the length (like below) but better than crashing.
    // TODO(T62295565): Perform a non-strict, best effort conversion of the
    // full string instead, like we did before the JSI migration.
    return std::string(buffer);
  }
  return std::string(buffer, actualBytes - 1);
}

JSStringRef getLengthString() {
  static JSStringRef length = JSStringCreateWithUTF8CString("length");
  return length;
}

JSStringRef getNameString() {
  static JSStringRef name = JSStringCreateWithUTF8CString("name");
  return name;
}

JSStringRef getFunctionString() {
  static JSStringRef func = JSStringCreateWithUTF8CString("Function");
  return func;
}
} // namespace

// std::string utility
namespace {
std::string to_string(void* value) {
  std::ostringstream ss;
  ss << value;
  return ss.str();
}
} // namespace

JSCRuntime::JSCRuntime()
    : JSCRuntime(JSGlobalContextCreateInGroup(nullptr, nullptr)) {
  JSGlobalContextRelease(ctx_);
}

JSCRuntime::JSCRuntime(JSGlobalContextRef ctx)
    : ctx_(JSGlobalContextRetain(ctx)),
      ctxInvalid_(false)
#ifndef NDEBUG
      ,
      objectCounter_(0),
      stringCounter_(0)
#endif
{
#ifndef NDEBUG
#ifdef _JSC_HAS_INSPECTABLE
  if (__builtin_available(macOS 13.3, iOS 16.4, tvOS 16.4, *)) {
    JSGlobalContextSetInspectable(ctx_, true);
  }
#endif
#endif
}

JSCRuntime::~JSCRuntime() {
  // We need to clear the microtask queue to remove all references to the
  // callbacks, so objectCounter_ would be 0 below.
  microtaskQueue_.clear();

  // On shutting down and cleaning up: when JSC is actually torn down,
  // it calls JSC::Heap::lastChanceToFinalize internally which
  // finalizes anything left over.  But at this point,
  // JSValueUnprotect() can no longer be called.  We use an
  // atomic<bool> to avoid unsafe unprotects happening after shutdown
  // has started.
  ctxInvalid_ = true;
  // No need to unprotect nativeStateSymbol_ since the heap is getting torn down
  // anyway
  JSGlobalContextRelease(ctx_);
#ifndef NDEBUG
  assert(
      objectCounter_ == 0 && "JSCRuntime destroyed with a dangling API object");
  assert(
      stringCounter_ == 0 && "JSCRuntime destroyed with a dangling API string");
#endif
}

std::shared_ptr<const jsi::PreparedJavaScript> JSCRuntime::prepareJavaScript(
    const std::shared_ptr<const jsi::Buffer>& buffer,
    std::string sourceURL) {
  return std::make_shared<jsi::SourceJavaScriptPreparation>(
      buffer, std::move(sourceURL));
}

jsi::Value JSCRuntime::evaluatePreparedJavaScript(
    const std::shared_ptr<const jsi::PreparedJavaScript>& js) {
  assert(
      dynamic_cast<const jsi::SourceJavaScriptPreparation*>(js.get()) &&
      "preparedJavaScript must be a SourceJavaScriptPreparation");
  auto sourceJs =
      std::static_pointer_cast<const jsi::SourceJavaScriptPreparation>(js);
  return evaluateJavaScript(sourceJs, sourceJs->sourceURL());
}

jsi::Value JSCRuntime::evaluateJavaScript(
    const std::shared_ptr<const jsi::Buffer>& buffer,
    const std::string& sourceURL) {
  std::string tmp(
      reinterpret_cast<const char*>(buffer->data()), buffer->size());
  JSStringRef sourceRef = JSStringCreateWithUTF8CString(tmp.c_str());
  JSStringRef sourceURLRef = nullptr;
  if (!sourceURL.empty()) {
    sourceURLRef = JSStringCreateWithUTF8CString(sourceURL.c_str());
  }
  JSValueRef exc = nullptr;
  JSValueRef res =
      JSEvaluateScript(ctx_, sourceRef, nullptr, sourceURLRef, 0, &exc);
  JSStringRelease(sourceRef);
  if (sourceURLRef != nullptr) {
    JSStringRelease(sourceURLRef);
  }
  checkException(res, exc);
  return createValue(res);
}

void JSCRuntime::queueMicrotask(const jsi::Function& callback) {
  microtaskQueue_.emplace_back(callback.getFunction(*this));
}

bool JSCRuntime::drainMicrotasks(int /*maxMicrotasksHint*/) {
  // Note that new jobs can be enqueued during the draining.
  while (!microtaskQueue_.empty()) {
    jsi::Function callback = std::move(microtaskQueue_.front());

    // We need to pop before calling the callback because that might throw.
    // When that happens, the host will call `drainMicrotasks` again to execute
    // the remaining microtasks, and this one shouldn't run again.
    microtaskQueue_.pop_front();

    callback.call(*this);
  }

  return true;
}

jsi::Object JSCRuntime::global() {
  return createObject(JSContextGetGlobalObject(ctx_));
}

std::string JSCRuntime::description() {
  if (desc_.empty()) {
    desc_ = std::string("<JSCRuntime@") + to_string(this) + ">";
  }
  return desc_;
}

bool JSCRuntime::isInspectable() {
  return false;
}

JSCRuntime::JSCSymbolValue::JSCSymbolValue(
    JSGlobalContextRef ctx,
    const std::atomic<bool>& ctxInvalid,
    JSValueRef sym
#ifndef NDEBUG
    ,
    std::atomic<intptr_t>& counter
#endif
    )
    : ctx_(ctx),
      ctxInvalid_(ctxInvalid),
      sym_(sym)
#ifndef NDEBUG
      ,
      counter_(counter)
#endif
{
  assert(JSValueIsSymbol(ctx_, sym_));
  JSValueProtect(ctx_, sym_);
#ifndef NDEBUG
  counter_ += 1;
#endif
}

void JSCRuntime::JSCSymbolValue::invalidate() noexcept {
#ifndef NDEBUG
  counter_ -= 1;
#endif

  if (!ctxInvalid_) {
    JSValueUnprotect(ctx_, sym_);
  }
  delete this;
}

#ifndef NDEBUG
JSCRuntime::JSCStringValue::JSCStringValue(
    JSStringRef str,
    std::atomic<intptr_t>& counter)
    : str_(JSStringRetain(str)), counter_(counter) {
  // Since std::atomic returns a copy instead of a reference when calling
  // operator+= we must do this explicitly in the constructor
  counter_ += 1;
}
#else
JSCRuntime::JSCStringValue::JSCStringValue(JSStringRef str)
    : str_(JSStringRetain(str)) {}
#endif

void JSCRuntime::JSCStringValue::invalidate() noexcept {
  // These JSC{String,Object}Value objects are implicitly owned by the
  // {String,Object} objects, thus when a String/Object is destructed
  // the JSC{String,Object}Value should be released.
#ifndef NDEBUG
  counter_ -= 1;
#endif
  JSStringRelease(str_);
  // Angery reaccs only
  delete this;
}

JSCRuntime::JSCObjectValue::JSCObjectValue(
    JSGlobalContextRef ctx,
    const std::atomic<bool>& ctxInvalid,
    JSObjectRef obj
#ifndef NDEBUG
    ,
    std::atomic<intptr_t>& counter
#endif
    )
    : ctx_(ctx),
      ctxInvalid_(ctxInvalid),
      obj_(obj)
#ifndef NDEBUG
      ,
      counter_(counter)
#endif
{
  JSValueProtect(ctx_, obj_);
#ifndef NDEBUG
  counter_ += 1;
#endif
}

void JSCRuntime::JSCObjectValue::invalidate() noexcept {
#ifndef NDEBUG
  counter_ -= 1;
#endif
  // When shutting down the VM, if there is a HostObject which
  // contains or otherwise owns a jsi::Object, then the final GC will
  // finalize the HostObject, leading to a call to invalidate().  But
  // at that point, making calls to JSValueUnprotect will crash.
  // It is up to the application to make sure that any other calls to
  // invalidate() happen before VM destruction; see the comment on
  // jsi::Runtime.
  //
  // Another potential concern here is that in the non-shutdown case,
  // if a HostObject is GCd, JSValueUnprotect will be called from the
  // JSC finalizer.  The documentation warns against this: "You must
  // not call any function that may cause a garbage collection or an
  // allocation of a garbage collected object from within a
  // JSObjectFinalizeCallback. This includes all functions that have a
  // JSContextRef parameter." However, an audit of the source code for
  // JSValueUnprotect in late 2018 shows that it cannot cause
  // allocation or a GC, and further, this code has not changed in
  // about two years.  In the future, we may choose to reintroduce the
  // mechanism previously used here which uses a separate thread for
  // JSValueUnprotect, in order to conform to the documented API, but
  // use the "unsafe" synchronous version on iOS 11 and earlier.

  if (!ctxInvalid_) {
    JSValueUnprotect(ctx_, obj_);
  }
  delete this;
}

jsi::Runtime::PointerValue* JSCRuntime::cloneSymbol(
    const jsi::Runtime::PointerValue* pv) {
  if (pv == nullptr) {
    return nullptr;
  }
  const JSCSymbolValue* symbol = static_cast<const JSCSymbolValue*>(pv);
  return makeSymbolValue(symbol->sym_);
}

jsi::Runtime::PointerValue* JSCRuntime::cloneBigInt(
    const Runtime::PointerValue* /*pv*/) {
  throw std::logic_error("Not implemented");
}

jsi::Runtime::PointerValue* JSCRuntime::cloneString(
    const jsi::Runtime::PointerValue* pv) {
  if (pv == nullptr) {
    return nullptr;
  }
  const JSCStringValue* string = static_cast<const JSCStringValue*>(pv);
  return makeStringValue(string->str_);
}

jsi::Runtime::PointerValue* JSCRuntime::cloneObject(
    const jsi::Runtime::PointerValue* pv) {
  if (pv == nullptr) {
    return nullptr;
  }
  const JSCObjectValue* object = static_cast<const JSCObjectValue*>(pv);
  assert(
      object->ctx_ == ctx_ &&
      "Don't try to clone an object backed by a different Runtime");
  return makeObjectValue(object->obj_);
}

jsi::Runtime::PointerValue* JSCRuntime::clonePropNameID(
    const jsi::Runtime::PointerValue* pv) {
  if (pv == nullptr) {
    return nullptr;
  }
  const JSCStringValue* string = static_cast<const JSCStringValue*>(pv);
  return makeStringValue(string->str_);
}

jsi::PropNameID JSCRuntime::createPropNameIDFromAscii(
    const char* str,
    size_t length) {
  // For system JSC this must is identical to a string
  std::string tmp(str, length);
  JSStringRef strRef = JSStringCreateWithUTF8CString(tmp.c_str());
  auto res = createPropNameID(strRef);
  JSStringRelease(strRef);
  return res;
}

jsi::PropNameID JSCRuntime::createPropNameIDFromUtf8(
    const uint8_t* utf8,
    size_t length) {
  std::string tmp(reinterpret_cast<const char*>(utf8), length);
  JSStringRef strRef = JSStringCreateWithUTF8CString(tmp.c_str());
  auto res = createPropNameID(strRef);
  JSStringRelease(strRef);
  return res;
}

jsi::PropNameID JSCRuntime::createPropNameIDFromString(const jsi::String& str) {
  return createPropNameID(stringRef(str));
}

jsi::PropNameID JSCRuntime::createPropNameIDFromSymbol(const jsi::Symbol& sym) {
  // TODO(T204185517): Support for symbols through the native API in JSC is very
  // limited. While we could construct a PropNameID here, we would not be able
  // to get a symbol property through the C++ API.
  throw std::logic_error("Not implemented");
}

std::string JSCRuntime::utf8(const jsi::PropNameID& sym) {
  return JSStringToSTLString(stringRef(sym));
}

bool JSCRuntime::compare(const jsi::PropNameID& a, const jsi::PropNameID& b) {
  return JSStringIsEqual(stringRef(a), stringRef(b));
}

std::string JSCRuntime::symbolToString(const jsi::Symbol& sym) {
  return jsi::Value(*this, sym).toString(*this).utf8(*this);
}

jsi::BigInt JSCRuntime::createBigIntFromInt64(int64_t /*unused*/) {
  throw std::logic_error("Not implemented");
}

jsi::BigInt JSCRuntime::createBigIntFromUint64(uint64_t /*unused*/) {
  throw std::logic_error("Not implemented");
}

bool JSCRuntime::bigintIsInt64(const jsi::BigInt& /*unused*/) {
  throw std::logic_error("Not implemented");
}

bool JSCRuntime::bigintIsUint64(const jsi::BigInt& /*unused*/) {
  throw std::logic_error("Not implemented");
}

uint64_t JSCRuntime::truncate(const jsi::BigInt& /*unused*/) {
  throw std::logic_error("Not implemented");
}

jsi::String JSCRuntime::bigintToString(
    const jsi::BigInt& /*unused*/,
    int /*unused*/) {
  throw std::logic_error("Not implemented");
}

jsi::String JSCRuntime::createStringFromAscii(const char* str, size_t length) {
  // Yes we end up double casting for semantic reasons (UTF8 contains ASCII,
  // not the other way around)
  return this->createStringFromUtf8(
      reinterpret_cast<const uint8_t*>(str), length);
}

jsi::String JSCRuntime::createStringFromUtf8(
    const uint8_t* str,
    size_t length) {
  std::string tmp(reinterpret_cast<const char*>(str), length);
  JSStringRef stringRef = JSStringCreateWithUTF8CString(tmp.c_str());
  auto result = createString(stringRef);
  JSStringRelease(stringRef);
  return result;
}

std::string JSCRuntime::utf8(const jsi::String& str) {
  return JSStringToSTLString(stringRef(str));
}

size_t JSCRuntime::length(const jsi::String& str) {
  return JSStringGetLength(stringRef(str));
}

jsi::Object JSCRuntime::createObject() {
  return createObject(static_cast<JSObjectRef>(nullptr));
}

// HostObject details
namespace {
struct HostObjectProxyBase {
  HostObjectProxyBase(
      JSCRuntime& rt,
      const std::shared_ptr<jsi::HostObject>& sho)
      : runtime(rt), hostObject(sho) {}

  JSCRuntime& runtime;
  std::shared_ptr<jsi::HostObject> hostObject;
};

std::once_flag hostObjectClassOnceFlag;
JSClassRef hostObjectClass{};
} // namespace

jsi::Object JSCRuntime::createObject(std::shared_ptr<jsi::HostObject> ho) {
  struct HostObjectProxy : public HostObjectProxyBase {
    static JSValueRef getProperty(
        JSContextRef ctx,
        JSObjectRef object,
        JSStringRef propName,
        JSValueRef* exception) {
      auto proxy = static_cast<HostObjectProxy*>(JSObjectGetPrivate(object));
      auto& rt = proxy->runtime;
      jsi::PropNameID sym = rt.createPropNameID(propName);
      jsi::Value ret;
      try {
        ret = proxy->hostObject->get(rt, sym);
      } catch (const jsi::JSError& error) {
        *exception = rt.valueRef(error.value());
        return JSValueMakeUndefined(ctx);
      } catch (const std::exception& ex) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(
                    rt,
                    std::string("Exception in HostObject::get(propName:") +
                        JSStringToSTLString(propName) + std::string("): ") +
                        ex.what());
        *exception = rt.valueRef(excValue);
        return JSValueMakeUndefined(ctx);
      } catch (...) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(
                    rt,
                    std::string("Exception in HostObject::get(propName:") +
                        JSStringToSTLString(propName) +
                        std::string("): <unknown>"));
        *exception = rt.valueRef(excValue);
        return JSValueMakeUndefined(ctx);
      }
      return rt.valueRef(ret);
    }

#define JSC_UNUSED(x) (void)(x);

    static bool setProperty(
        JSContextRef ctx,
        JSObjectRef object,
        JSStringRef propName,
        JSValueRef value,
        JSValueRef* exception) {
      JSC_UNUSED(ctx);
      auto proxy = static_cast<HostObjectProxy*>(JSObjectGetPrivate(object));
      auto& rt = proxy->runtime;
      jsi::PropNameID sym = rt.createPropNameID(propName);
      try {
        proxy->hostObject->set(rt, sym, rt.createValue(value));
      } catch (const jsi::JSError& error) {
        *exception = rt.valueRef(error.value());
        return false;
      } catch (const std::exception& ex) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(
                    rt,
                    std::string("Exception in HostObject::set(propName:") +
                        JSStringToSTLString(propName) + std::string("): ") +
                        ex.what());
        *exception = rt.valueRef(excValue);
        return false;
      } catch (...) {
        auto excValue =
            rt.global()
                .getPropertyAsFunction(rt, "Error")
                .call(
                    rt,
                    std::string("Exception in HostObject::set(propName:") +
                        JSStringToSTLString(propName) +
                        std::string("): <unknown>"));
        *exception = rt.valueRef(excValue);
        return false;
      }
      return true;
    }

    // JSC does not provide means to communicate errors from this callback,
    // so the error handling strategy is very brutal - we'll just crash
    // due to noexcept.
    static void getPropertyNames(
        JSContextRef ctx,
        JSObjectRef object,
        JSPropertyNameAccumulatorRef propertyNames) noexcept {
      JSC_UNUSED(ctx);
      auto proxy = static_cast<HostObjectProxy*>(JSObjectGetPrivate(object));
      auto& rt = proxy->runtime;
      auto names = proxy->hostObject->getPropertyNames(rt);
      for (auto& name : names) {
        JSPropertyNameAccumulatorAddName(propertyNames, stringRef(name));
      }
    }

#undef JSC_UNUSED

    static void finalize(JSObjectRef obj) {
      auto hostObject = static_cast<HostObjectProxy*>(JSObjectGetPrivate(obj));
      JSObjectSetPrivate(obj, nullptr);
      delete hostObject;
    }

    using HostObjectProxyBase::HostObjectProxyBase;
  };

  std::call_once(hostObjectClassOnceFlag, []() {
    JSClassDefinition hostObjectClassDef = kJSClassDefinitionEmpty;
    hostObjectClassDef.version = 0;
    hostObjectClassDef.attributes = kJSClassAttributeNoAutomaticPrototype;
    hostObjectClassDef.finalize = HostObjectProxy::finalize;
    hostObjectClassDef.getProperty = HostObjectProxy::getProperty;
    hostObjectClassDef.setProperty = HostObjectProxy::setProperty;
    hostObjectClassDef.getPropertyNames = HostObjectProxy::getPropertyNames;
    hostObjectClass = JSClassCreate(&hostObjectClassDef);
  });

  JSObjectRef obj =
      JSObjectMake(ctx_, hostObjectClass, new HostObjectProxy(*this, ho));
  return createObject(obj);
}

std::shared_ptr<jsi::HostObject> JSCRuntime::getHostObject(
    const jsi::Object& obj) {
  // We are guaranteed at this point to have isHostObject(obj) == true
  // so the private data should be HostObjectMetadata
  JSObjectRef object = objectRef(obj);
  auto metadata = static_cast<HostObjectProxyBase*>(JSObjectGetPrivate(object));
  assert(metadata);
  return metadata->hostObject;
}

// NativeState details
namespace {
struct NativeStateContainer {
  NativeStateContainer(std::shared_ptr<jsi::NativeState> state)
      : nativeState(std::move(state)) {}

  std::shared_ptr<jsi::NativeState> nativeState;

  static void finalize(JSObjectRef obj) {
    auto container =
        static_cast<NativeStateContainer*>(JSObjectGetPrivate(obj));
    delete container;
  }
};

JSClassRef getNativeStateClass() {
  static JSClassRef nativeStateClass = [] {
    JSClassDefinition nativeStateClassDef = kJSClassDefinitionEmpty;
    nativeStateClassDef.version = 0;
    nativeStateClassDef.attributes = kJSClassAttributeNoAutomaticPrototype;
    nativeStateClassDef.finalize = NativeStateContainer::finalize;
    return JSClassCreate(&nativeStateClassDef);
  }();
  return nativeStateClass;
}
} // namespace

JSValueRef JSCRuntime::getNativeStateSymbol() {
  if (nativeStateSymbol_ == nullptr) {
    JSStringRef symbolName =
        JSStringCreateWithUTF8CString("__internal_nativeState");
    JSValueRef symbol = JSValueMakeSymbol(ctx_, symbolName);
    JSValueProtect(ctx_, symbol);
    nativeStateSymbol_ = symbol;
    JSStringRelease(symbolName);
  }
  return nativeStateSymbol_;
}

bool JSCRuntime::hasNativeState(const jsi::Object& obj) {
  JSValueRef exc = nullptr;
  JSValueRef state = JSObjectGetPropertyForKey(
      ctx_, objectRef(obj), getNativeStateSymbol(), &exc);
  checkException(exc);

  return JSValueIsObjectOfClass(ctx_, state, getNativeStateClass());
}

std::shared_ptr<jsi::NativeState> JSCRuntime::getNativeState(
    const jsi::Object& obj) {
  JSValueRef exc = nullptr;
  JSValueRef state = JSObjectGetPropertyForKey(
      ctx_, objectRef(obj), getNativeStateSymbol(), &exc);
  checkException(exc);

  JSObjectRef stateObj = JSValueToObject(ctx_, state, &exc);
  checkException(exc);

  auto container =
      static_cast<NativeStateContainer*>(JSObjectGetPrivate(stateObj));
  assert(container);
  return container->nativeState;
}

void JSCRuntime::setNativeState(
    const jsi::Object& obj,
    std::shared_ptr<jsi::NativeState> nativeState) {
  JSValueRef nativeStateSymbol = getNativeStateSymbol();

  JSValueRef exc = nullptr;
  JSValueRef state =
      JSObjectGetPropertyForKey(ctx_, objectRef(obj), nativeStateSymbol, &exc);
  checkException(exc);
  if (JSValueIsUndefined(ctx_, state)) {
    JSObjectRef stateObj = JSObjectMake(
        ctx_,
        getNativeStateClass(),
        new NativeStateContainer(std::move(nativeState)));
    JSObjectSetPropertyForKey(
        ctx_,
        objectRef(obj),
        nativeStateSymbol,
        stateObj,
        kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontEnum |
            kJSPropertyAttributeDontDelete,
        &exc);
    checkException(exc);
  } else {
    JSObjectRef stateObj = JSValueToObject(ctx_, state, &exc);
    checkException(exc);

    auto container =
        static_cast<NativeStateContainer*>(JSObjectGetPrivate(stateObj));
    assert(container);
    container->nativeState = std::move(nativeState);
  }
}

jsi::Value JSCRuntime::getProperty(
    const jsi::Object& obj,
    const jsi::String& name) {
  JSObjectRef objRef = objectRef(obj);
  JSValueRef exc = nullptr;
  JSValueRef res = JSObjectGetProperty(ctx_, objRef, stringRef(name), &exc);
  checkException(exc);
  return createValue(res);
}

jsi::Value JSCRuntime::getProperty(
    const jsi::Object& obj,
    const jsi::PropNameID& name) {
  JSObjectRef objRef = objectRef(obj);
  JSValueRef exc = nullptr;
  JSValueRef res = JSObjectGetProperty(ctx_, objRef, stringRef(name), &exc);
  checkException(exc);
  return createValue(res);
}

bool JSCRuntime::hasProperty(const jsi::Object& obj, const jsi::String& name) {
  JSObjectRef objRef = objectRef(obj);
  return JSObjectHasProperty(ctx_, objRef, stringRef(name));
}

bool JSCRuntime::hasProperty(
    const jsi::Object& obj,
    const jsi::PropNameID& name) {
  JSObjectRef objRef = objectRef(obj);
  return JSObjectHasProperty(ctx_, objRef, stringRef(name));
}

void JSCRuntime::setPropertyValue(
    const jsi::Object& object,
    const jsi::PropNameID& name,
    const jsi::Value& value) {
  JSValueRef exc = nullptr;
  JSObjectSetProperty(
      ctx_,
      objectRef(object),
      stringRef(name),
      valueRef(value),
      kJSPropertyAttributeNone,
      &exc);
  checkException(exc);
}

void JSCRuntime::setPropertyValue(
    const jsi::Object& object,
    const jsi::String& name,
    const jsi::Value& value) {
  JSValueRef exc = nullptr;
  JSObjectSetProperty(
      ctx_,
      objectRef(object),
      stringRef(name),
      valueRef(value),
      kJSPropertyAttributeNone,
      &exc);
  checkException(exc);
}

bool JSCRuntime::isArray(const jsi::Object& obj) const {
  // JSValueIsArray only returns true if the object is a JS array. There's no
  // public JSC API equivalent to Array.isArray, so we call the JS function
  // through JSI directly.
  auto constRt = const_cast<JSCRuntime*>(this);
  auto isArrayFn = constRt->global()
                       .getPropertyAsObject(*constRt, "Array")
                       .getPropertyAsFunction(*constRt, "isArray");
  return isArrayFn.call(*constRt, obj).asBool();
}

bool JSCRuntime::isArrayBuffer(const jsi::Object& obj) const {
  auto typedArrayType = JSValueGetTypedArrayType(ctx_, objectRef(obj), nullptr);
  return typedArrayType == kJSTypedArrayTypeArrayBuffer;
}

uint8_t* JSCRuntime::data(const jsi::ArrayBuffer& obj) {
  return static_cast<uint8_t*>(
      JSObjectGetArrayBufferBytesPtr(ctx_, objectRef(obj), nullptr));
}

size_t JSCRuntime::size(const jsi::ArrayBuffer& obj) {
  return JSObjectGetArrayBufferByteLength(ctx_, objectRef(obj), nullptr);
}

bool JSCRuntime::isFunction(const jsi::Object& obj) const {
  return JSObjectIsFunction(ctx_, objectRef(obj));
}

bool JSCRuntime::isHostObject(const jsi::Object& obj) const {
  auto cls = hostObjectClass;
  return cls != nullptr && JSValueIsObjectOfClass(ctx_, objectRef(obj), cls);
}

// Very expensive
jsi::Array JSCRuntime::getPropertyNames(const jsi::Object& obj) {
  JSPropertyNameArrayRef names =
      JSObjectCopyPropertyNames(ctx_, objectRef(obj));
  size_t len = JSPropertyNameArrayGetCount(names);
  // Would be better if we could create an array with explicit elements
  auto result = createArray(len);
  for (size_t i = 0; i < len; i++) {
    JSStringRef str = JSPropertyNameArrayGetNameAtIndex(names, i);
    result.setValueAtIndex(*this, i, createString(str));
  }
  JSPropertyNameArrayRelease(names);
  return result;
}

jsi::WeakObject JSCRuntime::createWeakObject(const jsi::Object& obj) {
  // TODO: revisit this implementation
  JSObjectRef objRef = objectRef(obj);
  return make<jsi::WeakObject>(makeObjectValue(objRef));
}

jsi::Value JSCRuntime::lockWeakObject(const jsi::WeakObject& obj) {
  // TODO: revisit this implementation
  JSObjectRef objRef = objectRef(obj);
  return jsi::Value(createObject(objRef));
}

jsi::Array JSCRuntime::createArray(size_t length) {
  JSValueRef exc = nullptr;
  JSObjectRef obj = JSObjectMakeArray(ctx_, 0, nullptr, &exc);
  checkException(obj, exc);
  JSObjectSetProperty(
      ctx_,
      obj,
      getLengthString(),
      JSValueMakeNumber(ctx_, static_cast<double>(length)),
      0,
      &exc);
  checkException(exc);
  return createObject(obj).getArray(*this);
}

jsi::ArrayBuffer JSCRuntime::createArrayBuffer(
    std::shared_ptr<jsi::MutableBuffer> buffer) {
  throw std::logic_error("Not implemented");
}

size_t JSCRuntime::size(const jsi::Array& arr) {
  return static_cast<size_t>(
      getProperty(arr, createPropNameID(getLengthString())).getNumber());
}

jsi::Value JSCRuntime::getValueAtIndex(const jsi::Array& arr, size_t i) {
  JSValueRef exc = nullptr;
  auto res = JSObjectGetPropertyAtIndex(ctx_, objectRef(arr), (int)i, &exc);
  checkException(exc);
  return createValue(res);
}

void JSCRuntime::setValueAtIndexImpl(
    const jsi::Array& arr,
    size_t i,
    const jsi::Value& value) {
  JSValueRef exc = nullptr;
  JSObjectSetPropertyAtIndex(
      ctx_, objectRef(arr), (int)i, valueRef(value), &exc);
  checkException(exc);
}

namespace {
std::once_flag hostFunctionClassOnceFlag;
JSClassRef hostFunctionClass{};

class HostFunctionProxy {
 public:
  HostFunctionProxy(jsi::HostFunctionType hostFunction)
      : hostFunction_(hostFunction) {}

  jsi::HostFunctionType& getHostFunction() {
    return hostFunction_;
  }

 protected:
  jsi::HostFunctionType hostFunction_;
};
} // namespace

jsi::Function JSCRuntime::createFunctionFromHostFunction(
    const jsi::PropNameID& name,
    unsigned int paramCount,
    jsi::HostFunctionType func) {
  class HostFunctionMetadata : public HostFunctionProxy {
   public:
    static void initialize(JSContextRef ctx, JSObjectRef object) {
      // We need to set up the prototype chain properly here. In theory we
      // could set func.prototype.prototype = Function.prototype to get the
      // same result. Not sure which approach is better.
      HostFunctionMetadata* metadata =
          static_cast<HostFunctionMetadata*>(JSObjectGetPrivate(object));

      JSValueRef exc = nullptr;
      JSObjectSetProperty(
          ctx,
          object,
          getLengthString(),
          JSValueMakeNumber(ctx, metadata->argCount),
          kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontEnum |
              kJSPropertyAttributeDontDelete,
          &exc);
      if (exc != nullptr) {
        // Silently fail to set length
        exc = nullptr;
      }

      JSStringRef name = nullptr;
      std::swap(metadata->name, name);
      JSObjectSetProperty(
          ctx,
          object,
          getNameString(),
          JSValueMakeString(ctx, name),
          kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontEnum |
              kJSPropertyAttributeDontDelete,
          &exc);
      JSStringRelease(name);
      if (exc != nullptr) {
        // Silently fail to set name
        exc = nullptr;
      }

      JSObjectRef global = JSContextGetGlobalObject(ctx);
      JSValueRef value =
          JSObjectGetProperty(ctx, global, getFunctionString(), &exc);
      // If we don't have Function then something bad is going on.
      if (JSC_UNLIKELY(exc)) {
        abort();
      }
      JSObjectRef funcCtor = JSValueToObject(ctx, value, &exc);
      if (funcCtor == nullptr) {
        // We can't do anything if Function is not an object
        return;
      }
      JSValueRef funcProto = JSObjectGetPrototype(ctx, funcCtor);
      JSObjectSetPrototype(ctx, object, funcProto);
    }

    static JSValueRef makeError(JSCRuntime& rt, const std::string& desc) {
      jsi::Value value =
          rt.global().getPropertyAsFunction(rt, "Error").call(rt, desc);
      return rt.valueRef(value);
    }

    static JSValueRef call(
        JSContextRef ctx,
        JSObjectRef function,
        JSObjectRef thisObject,
        size_t argumentCount,
        const JSValueRef arguments[],
        JSValueRef* exception) {
      HostFunctionMetadata* metadata =
          static_cast<HostFunctionMetadata*>(JSObjectGetPrivate(function));
      JSCRuntime& rt = *(metadata->runtime);
      const unsigned maxStackArgCount = 8;
      jsi::Value stackArgs[maxStackArgCount];
      std::unique_ptr<jsi::Value[]> heapArgs;
      jsi::Value* args;
      if (argumentCount > maxStackArgCount) {
        heapArgs = std::make_unique<jsi::Value[]>(argumentCount);
        for (size_t i = 0; i < argumentCount; i++) {
          heapArgs[i] = rt.createValue(arguments[i]);
        }
        args = heapArgs.get();
      } else {
        for (size_t i = 0; i < argumentCount; i++) {
          stackArgs[i] = rt.createValue(arguments[i]);
        }
        args = stackArgs;
      }
      JSValueRef res;
      jsi::Value thisVal(rt.createObject(thisObject));
      try {
        res = rt.valueRef(
            metadata->hostFunction_(rt, thisVal, args, argumentCount));
      } catch (const jsi::JSError& error) {
        *exception = rt.valueRef(error.value());
        res = JSValueMakeUndefined(ctx);
      } catch (const std::exception& ex) {
        std::string exceptionString("Exception in HostFunction: ");
        exceptionString += ex.what();
        *exception = makeError(rt, exceptionString);
        res = JSValueMakeUndefined(ctx);
      } catch (const std::string& ex) {
        std::string exceptionString("Exception in HostFunction: ");
        exceptionString += ex;
        *exception = makeError(rt, exceptionString);
        res = JSValueMakeUndefined(ctx);
      } catch (...) {
        std::string exceptionString("Exception in HostFunction: <unknown>");
        *exception = makeError(rt, exceptionString);
        res = JSValueMakeUndefined(ctx);
      }
      return res;
    }

    static void finalize(JSObjectRef object) {
      HostFunctionMetadata* metadata =
          static_cast<HostFunctionMetadata*>(JSObjectGetPrivate(object));
      JSObjectSetPrivate(object, nullptr);
      delete metadata;
    }

    HostFunctionMetadata(
        JSCRuntime* rt,
        jsi::HostFunctionType hf,
        unsigned ac,
        JSStringRef n)
        : HostFunctionProxy(hf),
          runtime(rt),
          argCount(ac),
          name(JSStringRetain(n)) {}

    JSCRuntime* runtime;
    unsigned argCount;
    JSStringRef name;
  };

  std::call_once(hostFunctionClassOnceFlag, []() {
    JSClassDefinition functionClass = kJSClassDefinitionEmpty;
    functionClass.version = 0;
    functionClass.attributes = kJSClassAttributeNoAutomaticPrototype;
    functionClass.initialize = HostFunctionMetadata::initialize;
    functionClass.finalize = HostFunctionMetadata::finalize;
    functionClass.callAsFunction = HostFunctionMetadata::call;

    hostFunctionClass = JSClassCreate(&functionClass);
  });

  JSObjectRef funcRef = JSObjectMake(
      ctx_,
      hostFunctionClass,
      new HostFunctionMetadata(this, func, paramCount, stringRef(name)));
  return createObject(funcRef).getFunction(*this);
}

namespace detail {

class ArgsConverter {
 public:
  ArgsConverter(JSCRuntime& rt, const jsi::Value* args, size_t count) {
    JSValueRef* destination = inline_;
    if (count > maxStackArgs) {
      outOfLine_ = std::make_unique<JSValueRef[]>(count);
      destination = outOfLine_.get();
    }

    for (size_t i = 0; i < count; ++i) {
      destination[i] = rt.valueRef(args[i]);
    }
  }

  operator JSValueRef*() {
    return outOfLine_ ? outOfLine_.get() : inline_;
  }

 private:
  constexpr static unsigned maxStackArgs = 8;
  JSValueRef inline_[maxStackArgs];
  std::unique_ptr<JSValueRef[]> outOfLine_;
};
} // namespace detail

bool JSCRuntime::isHostFunction(const jsi::Function& obj) const {
  auto cls = hostFunctionClass;
  return cls != nullptr && JSValueIsObjectOfClass(ctx_, objectRef(obj), cls);
}

jsi::HostFunctionType& JSCRuntime::getHostFunction(const jsi::Function& obj) {
  // We know that isHostFunction(obj) is true here, so its safe to proceed
  auto proxy =
      static_cast<HostFunctionProxy*>(JSObjectGetPrivate(objectRef(obj)));
  return proxy->getHostFunction();
}

jsi::Value JSCRuntime::call(
    const jsi::Function& f,
    const jsi::Value& jsThis,
    const jsi::Value* args,
    size_t count) {
  JSValueRef exc = nullptr;
  auto res = JSObjectCallAsFunction(
      ctx_,
      objectRef(f),
      jsThis.isUndefined() ? nullptr : objectRef(jsThis.getObject(*this)),
      count,
      detail::ArgsConverter(*this, args, count),
      &exc);
  checkException(exc);
  return createValue(res);
}

jsi::Value JSCRuntime::callAsConstructor(
    const jsi::Function& f,
    const jsi::Value* args,
    size_t count) {
  JSValueRef exc = nullptr;
  auto res = JSObjectCallAsConstructor(
      ctx_,
      objectRef(f),
      count,
      detail::ArgsConverter(*this, args, count),
      &exc);
  checkException(exc);
  return createValue(res);
}

bool JSCRuntime::strictEquals(const jsi::Symbol& a, const jsi::Symbol& b)
    const {
  JSValueRef exc = nullptr;
  bool ret = JSValueIsEqual(ctx_, symbolRef(a), symbolRef(b), &exc);
  const_cast<JSCRuntime*>(this)->checkException(exc);
  return ret;
}

bool JSCRuntime::strictEquals(const jsi::BigInt& a, const jsi::BigInt& b)
    const {
  throw std::logic_error("Not implemented");
}

bool JSCRuntime::strictEquals(const jsi::String& a, const jsi::String& b)
    const {
  return JSStringIsEqual(stringRef(a), stringRef(b));
}

bool JSCRuntime::strictEquals(const jsi::Object& a, const jsi::Object& b)
    const {
  return objectRef(a) == objectRef(b);
}

bool JSCRuntime::instanceOf(const jsi::Object& o, const jsi::Function& f) {
  JSValueRef exc = nullptr;
  bool res =
      JSValueIsInstanceOfConstructor(ctx_, objectRef(o), objectRef(f), &exc);
  checkException(exc);
  return res;
}

void JSCRuntime::setExternalMemoryPressure(
    const jsi::Object& /*obj*/,
    size_t /*amount*/) {}

jsi::Runtime::PointerValue* JSCRuntime::makeSymbolValue(
    JSValueRef symbolRef) const {
#ifndef NDEBUG
  return new JSCSymbolValue(ctx_, ctxInvalid_, symbolRef, symbolCounter_);
#else
  return new JSCSymbolValue(ctx_, ctxInvalid_, symbolRef);
#endif
}

namespace {
JSStringRef getEmptyString() {
  static JSStringRef empty = JSStringCreateWithUTF8CString("");
  return empty;
}
} // namespace

jsi::Runtime::PointerValue* JSCRuntime::makeStringValue(
    JSStringRef stringRef) const {
  if (stringRef == nullptr) {
    stringRef = getEmptyString();
  }
#ifndef NDEBUG
  return new JSCStringValue(stringRef, stringCounter_);
#else
  return new JSCStringValue(stringRef);
#endif
}

jsi::Symbol JSCRuntime::createSymbol(JSValueRef sym) const {
  return make<jsi::Symbol>(makeSymbolValue(sym));
}

jsi::String JSCRuntime::createString(JSStringRef str) const {
  return make<jsi::String>(makeStringValue(str));
}

jsi::PropNameID JSCRuntime::createPropNameID(JSStringRef str) {
  return make<jsi::PropNameID>(makeStringValue(str));
}

jsi::Runtime::PointerValue* JSCRuntime::makeObjectValue(
    JSObjectRef objectRef) const {
  if (objectRef == nullptr) {
    objectRef = JSObjectMake(ctx_, nullptr, nullptr);
  }
#ifndef NDEBUG
  return new JSCObjectValue(ctx_, ctxInvalid_, objectRef, objectCounter_);
#else
  return new JSCObjectValue(ctx_, ctxInvalid_, objectRef);
#endif
}

jsi::Object JSCRuntime::createObject(JSObjectRef obj) const {
  return make<jsi::Object>(makeObjectValue(obj));
}

jsi::Value JSCRuntime::createValue(JSValueRef value) const {
  JSType type = JSValueGetType(ctx_, value);

  switch (type) {
    case kJSTypeNumber:
      return jsi::Value(JSValueToNumber(ctx_, value, nullptr));
    case kJSTypeBoolean:
      return jsi::Value(JSValueToBoolean(ctx_, value));
    case kJSTypeNull:
      return jsi::Value(nullptr);
    case kJSTypeUndefined:
      return jsi::Value();
    case kJSTypeString: {
      JSStringRef str = JSValueToStringCopy(ctx_, value, nullptr);
      auto result = jsi::Value(createString(str));
      JSStringRelease(str);
      return result;
    }
    case kJSTypeObject: {
      JSObjectRef objRef = JSValueToObject(ctx_, value, nullptr);
      return jsi::Value(createObject(objRef));
    }
    case kJSTypeSymbol:
      return jsi::Value(createSymbol(value));
    case kJSTypeBigInt:
    default:
      // WHAT ARE YOU
      abort();
  }
}

JSValueRef JSCRuntime::valueRef(const jsi::Value& value) {
  // I would rather switch on value.kind_
  if (value.isUndefined()) {
    return JSValueMakeUndefined(ctx_);
  } else if (value.isNull()) {
    return JSValueMakeNull(ctx_);
  } else if (value.isBool()) {
    return JSValueMakeBoolean(ctx_, value.getBool());
  } else if (value.isNumber()) {
    return JSValueMakeNumber(ctx_, value.getNumber());
  } else if (value.isSymbol()) {
    return symbolRef(value.getSymbol(*this));
  } else if (value.isString()) {
    return JSValueMakeString(ctx_, stringRef(value.getString(*this)));
  } else if (value.isObject()) {
    return objectRef(value.getObject(*this));
  } else {
    // What are you?
    abort();
  }
}

JSValueRef JSCRuntime::symbolRef(const jsi::Symbol& sym) {
  return static_cast<const JSCSymbolValue*>(getPointerValue(sym))->sym_;
}

JSStringRef JSCRuntime::stringRef(const jsi::String& str) {
  return static_cast<const JSCStringValue*>(getPointerValue(str))->str_;
}

JSStringRef JSCRuntime::stringRef(const jsi::PropNameID& sym) {
  return static_cast<const JSCStringValue*>(getPointerValue(sym))->str_;
}

JSObjectRef JSCRuntime::objectRef(const jsi::Object& obj) {
  return static_cast<const JSCObjectValue*>(getPointerValue(obj))->obj_;
}

JSObjectRef JSCRuntime::objectRef(const jsi::WeakObject& obj) {
  // TODO: revisit this implementation
  return static_cast<const JSCObjectValue*>(getPointerValue(obj))->obj_;
}

void JSCRuntime::checkException(JSValueRef exc) {
  if (JSC_UNLIKELY(exc)) {
    throw jsi::JSError(*this, createValue(exc));
  }
}

void JSCRuntime::checkException(JSValueRef res, JSValueRef exc) {
  if (JSC_UNLIKELY(!res)) {
    throw jsi::JSError(*this, createValue(exc));
  }
}

void JSCRuntime::checkException(JSValueRef exc, const char* msg) {
  if (JSC_UNLIKELY(exc)) {
    throw jsi::JSError(std::string(msg), *this, createValue(exc));
  }
}

void JSCRuntime::checkException(
    JSValueRef res,
    JSValueRef exc,
    const char* msg) {
  if (JSC_UNLIKELY(!res)) {
    throw jsi::JSError(std::string(msg), *this, createValue(exc));
  }
}

std::unique_ptr<jsi::Runtime> makeJSCRuntime() {
  return std::make_unique<JSCRuntime>();
}

} // namespace facebook::jsc
