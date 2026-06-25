/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <exception>
#include <functional>
#include <memory>
#include <string>
#include <vector>

#ifndef JSI_EXPORT
#ifdef _MSC_VER
#ifdef CREATE_SHARED_LIBRARY
#define JSI_EXPORT __declspec(dllexport)
#else
#define JSI_EXPORT
#endif // CREATE_SHARED_LIBRARY
#else // _MSC_VER
#define JSI_EXPORT __attribute__((visibility("default")))
#endif // _MSC_VER
#endif // !defined(JSI_EXPORT)

class FBJSRuntime;
namespace facebook {
namespace jsi {

/// UUID version 1 implementation. This should be constructed with constant
/// arguments to identify fixed UUIDs.
class JSI_EXPORT UUID {
 public:
  // Construct from raw parts
  constexpr UUID(
      uint32_t timeLow,
      uint16_t timeMid,
      uint16_t timeHighAndVersion,
      uint16_t variantAndClockSeq,
      uint64_t node)
      : high(
            ((uint64_t)(timeLow) << 32) | ((uint64_t)(timeMid) << 16) |
            ((uint64_t)(timeHighAndVersion))),
        low(((uint64_t)(variantAndClockSeq) << 48) | node) {}

  // Default constructor (zero UUID)
  constexpr UUID() : high(0), low(0) {}

  constexpr UUID(const UUID&) = default;
  constexpr UUID& operator=(const UUID&) = default;

  constexpr bool operator==(const UUID& other) const {
    return high == other.high && low == other.low;
  }
  constexpr bool operator!=(const UUID& other) const {
    return !(*this == other);
  }

  // Ordering (for std::map, sorting, etc.)
  constexpr bool operator<(const UUID& other) const {
    return (high < other.high) || (high == other.high && low < other.low);
  }

  // Hash support for UUID (for unordered_map compatibility)
  struct Hash {
    std::size_t operator()(const UUID& uuid) const noexcept {
      return std::hash<uint64_t>{}(uuid.high) ^
          (std::hash<uint64_t>{}(uuid.low) << 1);
    }
  };

  // UUID format: 8-4-4-4-12
  std::string toString() const {
    std::string buffer(36, ' ');
    std::snprintf(
        buffer.data(),
        buffer.size() + 1,
        "%08x-%04x-%04x-%04x-%012llx",
        getTimeLow(),
        getTimeMid(),
        getTimeHighAndVersion(),
        getVariantAndClockSeq(),
        (unsigned long long)getNode());
    return buffer;
  }

  constexpr uint32_t getTimeLow() const {
    return (uint32_t)(high >> 32);
  }

  constexpr uint16_t getTimeMid() const {
    return (uint16_t)(high >> 16);
  }

  constexpr uint16_t getTimeHighAndVersion() const {
    return (uint16_t)high;
  }

  constexpr uint16_t getVariantAndClockSeq() const {
    return (uint16_t)(low >> 48);
  }

  constexpr uint64_t getNode() const {
    return low & 0xFFFFFFFFFFFF;
  }

 private:
  uint64_t high;
  uint64_t low;
};

/// Base interface that all JSI interfaces inherit from. Users should not try to
/// manipulate this base type directly, and should use castInterface to get the
/// appropriate subtype.
struct JSI_EXPORT ICast {
  /// If the current object can be cast into the interface specified by \p
  /// interfaceUUID, return a pointer to the object. Otherwise, return a null
  /// pointer.
  /// The returned interface has the same lifetime as the underlying object. It
  /// does not need to be released when not needed.
  virtual ICast* castInterface(const UUID& interfaceUUID) = 0;

 protected:
  /// Interfaces are not destructible, thus the destructor is intentionally
  /// protected to prevent delete calls on the interface.
  /// Additionally, the destructor is non-virtual to reduce the vtable
  /// complexity from inheritance.
  ~ICast() = default;
};

/// Base class for buffers of data or bytecode that need to be passed to the
/// runtime. The buffer is expected to be fully immutable, so the result of
/// size(), data(), and the contents of the pointer returned by data() must not
/// change after construction.
class JSI_EXPORT Buffer {
 public:
  virtual ~Buffer();
  virtual size_t size() const = 0;
  virtual const uint8_t* data() const = 0;
};

class JSI_EXPORT StringBuffer : public Buffer {
 public:
  StringBuffer(std::string s) : s_(std::move(s)) {}
  size_t size() const override {
    return s_.size();
  }
  const uint8_t* data() const override {
    return reinterpret_cast<const uint8_t*>(s_.data());
  }

 private:
  std::string s_;
};

/// Base class for buffers of data that need to be passed to the runtime. The
/// result of size() and data() must not change after construction. However, the
/// region pointed to by data() may be modified by the user or the runtime. The
/// user must ensure that access to the contents of the buffer is properly
/// synchronised.
class JSI_EXPORT MutableBuffer {
 public:
  virtual ~MutableBuffer();
  virtual size_t size() const = 0;
  virtual uint8_t* data() = 0;
};

/// PreparedJavaScript is a base class representing JavaScript which is in a
/// form optimized for execution, in a runtime-specific way. Construct one via
/// jsi::Runtime::prepareJavaScript().
/// ** This is an experimental API that is subject to change. **
class JSI_EXPORT PreparedJavaScript {
 protected:
  PreparedJavaScript() = default;

 public:
  virtual ~PreparedJavaScript() = 0;
};

class IRuntime;
class Runtime;
class Pointer;
class PropNameID;
class Symbol;
class BigInt;
class String;
class Object;
class WeakObject;
class Array;
class ArrayBuffer;
class Function;
class Value;
class Instrumentation;
class Scope;
class JSIException;
class JSError;
class TypedArray;
class Uint8Array;

/// A function which has this type can be registered as a function
/// callable from JavaScript using Function::createFromHostFunction().
/// When the function is called, args will point to the arguments, and
/// count will indicate how many arguments are passed.  The function
/// can return a Value to the caller, or throw an exception.  If a C++
/// exception is thrown, a JS Error will be created and thrown into
/// JS; if the C++ exception extends std::exception, the Error's
/// message will be whatever what() returns. Note that it is undefined whether
/// HostFunctions may or may not be called in strict mode; that is `thisVal`
/// can be any value - it will not necessarily be coerced to an object or
/// or set to the global object.
using HostFunctionType = std::function<
    Value(Runtime& rt, const Value& thisVal, const Value* args, size_t count)>;

/// An object which implements this interface can be registered as an
/// Object with the JS runtime.
class JSI_EXPORT HostObject {
 public:
  // The C++ object's dtor will be called when the GC finalizes this
  // object.  (This may be as late as when the Runtime is shut down.)
  // You have no control over which thread it is called on.  This will
  // be called from inside the GC, so it is unsafe to do any VM
  // operations which require a IRuntime&.  Derived classes' dtors
  // should also avoid doing anything expensive.  Calling the dtor on
  // a jsi object is explicitly ok.  If you want to do JS operations,
  // or any nontrivial work, you should add it to a work queue, and
  // manage it externally.
  virtual ~HostObject();

  // When JS wants a property with a given name from the HostObject,
  // it will call this method.  If it throws an exception, the call
  // will throw a JS \c Error object. By default this returns undefined.
  // \return the value for the property.
  virtual Value get(Runtime&, const PropNameID& name);

  // When JS wants to set a property with a given name on the HostObject,
  // it will call this method. If it throws an exception, the call will
  // throw a JS \c Error object. By default this throws a type error exception
  // mimicking the behavior of a frozen object in strict mode.
  virtual void set(Runtime&, const PropNameID& name, const Value& value);

  // When JS wants a list of property names for the HostObject, it will
  // call this method. If it throws an exception, the call will throw a
  // JS \c Error object. The default implementation returns empty vector.
  virtual std::vector<PropNameID> getPropertyNames(Runtime& rt);
};

/// Native state (and destructor) that can be attached to any JS object
/// using setNativeState.
class JSI_EXPORT NativeState {
 public:
  virtual ~NativeState();
};

// JSI_UNSTABLE gates features that will be released with a Hermes version in
// the future. Until released, these features may be subject to change. After
// release, these features will be moved out of JSI_UNSTABLE and become frozen.
#ifdef JSI_UNSTABLE
/// Opaque class that is used to store serialized object from a runtime. The
/// lifetime of this object is orthogonal to the original runtime object, and
/// may outlive the original object.
class JSI_EXPORT Serialized {
 public:
  /// Uses \p secretAddr to validate if the Serialized data is supported. If so,
  /// return the pointer to the underlying serialized data. Otherwise, return a
  /// nullptr. This should be used by the runtime to deserialize the data.
  virtual void* getPrivate(const void* secretAddr) = 0;
  virtual ~Serialized();
};

/// Provides a set of APIs that allows copying objects between different
/// runtime instances. The runtimes instances must be of the same type. As an
/// example, a serialized object from Hermes runtime may only be deserialized by
/// another Hermes runtime.
class JSI_EXPORT ISerialization : public ICast {
 public:
  static constexpr jsi::UUID uuid{
      0xd40fe0ec,
      0xa47c,
      0x42c9,
      0x8c09,
      0x661aeab832d8};

  /// Serializes the given Value \p value using the structured clone algorithm.
  /// It returns a shared pointer of an opaque Serialized object that can be
  /// deserialized multiple times. The lifetime of the Serialized object is not
  /// tied to the lifetime of the original object.
  virtual std::shared_ptr<Serialized> serialize(const Value& value) = 0;

  /// Given a Serialized object provided by \p serialized, deserialize it using
  /// the structured clone algorithm into a JS value in the current runtime.
  /// Returns the deserialized JS value.
  virtual Value deserialize(const std::shared_ptr<Serialized>& serialized) = 0;

  /// Serializes the given jsi::Value \p value using the structured clone
  /// algorithm. \p transferList must be a JS Array. Given the length property
  /// of \p transferList, this API will transfer everything at index [0, length
  /// - 1] to the serialized object. The transferred values will no longer be
  /// usable in the original runtime. It returns a unique pointer of an opaque
  /// Serialized object that can be deserialized once only by
  /// deserializeWithTransfer. The lifetime of the Serialized object is not tied
  /// to the lifetime of the original object.
  virtual std::unique_ptr<Serialized> serializeWithTransfer(
      const Value& value,
      const Array& transferList) = 0;

  /// Using the structure clone algorithm, deserialize the object provided by \p
  /// serialized into a JS value in the current runtime. \p serialized must be
  /// created by serializeWithTransfer. If the current runtime does not support
  /// the serialization scheme in \p serialized, then this method will throw and
  /// \p serialized will remain unmodified. Otherwise, this will consume the
  /// serialized data entirely and make the serialized objects in the current
  /// runtime. Any transferred values in the serialized object will be owned by
  /// the current runtime.
  ///  This method returns an Array containing the deserialized values, where
  ///  the first element is the value passed into serializeWithTransfer,
  /// followed by all transferred values.
  virtual Array deserializeWithTransfer(
      std::unique_ptr<Serialized>& serialized) = 0;

 protected:
  ~ISerialization() = default;
};

#endif // JSI_UNSTABLE

/// An interface that provides various functionalities of the JS runtime.
/// The APIs must not be called from multiple threads concurrently. It is the
/// user's responsibility ensure thread safety when using IRuntime.
/// Users should cast their runtime to IRuntime to access these APIs. However,
/// for backward compatibility, these APIs are also accessible via the Runtime
/// object directly.
class JSI_EXPORT IRuntime : public ICast {
 public:
  static constexpr jsi::UUID uuid{
      0xc2e8e22e,
      0xd7a6,
      0x11f0,
      0x8de9,
      0x0242ac120002};

  /// Evaluates the given JavaScript \c buffer.  \c sourceURL is used
  /// to annotate the stack trace if there is an exception.  The
  /// contents may be utf8-encoded JS source code, or binary bytecode
  /// whose format is specific to the implementation.  If the input
  /// format is unknown, or evaluation causes an error, a JSIException
  /// will be thrown.
  /// Note this function should ONLY be used when there isn't another means
  /// through the JSI API. For example, it will be much slower to use this to
  /// call a global function than using the JSI APIs to read the function
  /// property from the global object and then calling it explicitly.
  virtual Value evaluateJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      const std::string& sourceURL) = 0;

  /// Prepares to evaluate the given JavaScript \c buffer by processing it into
  /// a form optimized for execution. This may include pre-parsing, compiling,
  /// etc. If the input is invalid (for example, cannot be parsed), a
  /// JSIException will be thrown. The resulting object is tied to the
  /// particular concrete type of Runtime from which it was created. It may be
  /// used (via evaluatePreparedJavaScript) in any Runtime of the same concrete
  /// type.
  /// The PreparedJavaScript object may be passed to multiple VM instances, so
  /// they can all share and benefit from the prepared script.
  /// As with evaluateJavaScript(), using JavaScript code should be avoided
  /// when the JSI API is sufficient.
  virtual std::shared_ptr<const PreparedJavaScript> prepareJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      std::string sourceURL) = 0;

  /// Evaluates a PreparedJavaScript. If evaluation causes an error, a
  /// JSIException will be thrown.
  /// As with evaluateJavaScript(), using JavaScript code should be avoided
  /// when the JSI API is sufficient.
  virtual Value evaluatePreparedJavaScript(
      const std::shared_ptr<const PreparedJavaScript>& js) = 0;

  /// Queues a microtask in the JavaScript VM internal Microtask (a.k.a. Job in
  /// ECMA262) queue, to be executed when the host drains microtasks in
  /// its event loop implementation.
  ///
  /// \param callback a function to be executed as a microtask.
  virtual void queueMicrotask(const jsi::Function& callback) = 0;

  /// Drain the JavaScript VM internal Microtask (a.k.a. Job in ECMA262) queue.
  ///
  /// \param maxMicrotasksHint a hint to tell an implementation that it should
  /// make a best effort not execute more than the given number. It's default
  /// to -1 for infinity (unbounded execution).
  /// \return true if the queue is drained or false if there is more work to do.
  ///
  /// When there were exceptions thrown from the execution of microtasks,
  /// implementations shall discard the exceptional jobs. An implementation may
  /// \throw a \c JSError object to signal the hosts to handle. In that case, an
  /// implementation may or may not suspend the draining.
  ///
  /// Hosts may call this function again to resume the draining if it was
  /// suspended due to either exceptions or the \p maxMicrotasksHint bound.
  /// E.g. a host may repetitively invoke this function until the queue is
  /// drained to implement the "microtask checkpoint" defined in WHATWG HTML
  /// event loop: https://html.spec.whatwg.org/C#perform-a-microtask-checkpoint.
  ///
  /// Note that error propagation is only a concern if a host needs to implement
  /// `queueMicrotask`, a recent API that allows enqueueing arbitrary functions
  /// (hence may throw) as microtasks. Exceptions from ECMA-262 Promise Jobs are
  /// handled internally to VMs and are never propagated to hosts.
  ///
  /// This API offers some queue management to hosts at its best effort due to
  /// different behaviors and limitations imposed by different VMs and APIs. By
  /// the time this is written, An implementation may swallow exceptions (JSC),
  /// may not pause (V8), and may not support bounded executions.
  virtual bool drainMicrotasks(int maxMicrotasksHint = -1) = 0;

  /// \return the global object
  virtual Object global() = 0;

  /// \return a short printable description of the instance.  It should
  /// at least include some human-readable indication of the runtime
  /// implementation.  This should only be used by logging, debugging,
  /// and other developer-facing callers.
  virtual std::string description() = 0;

  /// \return whether or not the underlying runtime supports debugging via the
  /// Chrome remote debugging protocol.
  ///
  /// NOTE: the API for determining whether a runtime is debuggable and
  /// registering a runtime with the debugger is still in flux, so please don't
  /// use this API unless you know what you're doing.
  virtual bool isInspectable() = 0;

  /// \return an interface to extract metrics from this \c Runtime.  The default
  /// implementation of this function returns an \c Instrumentation instance
  /// which returns no metrics.
  virtual Instrumentation& instrumentation() = 0;

  /// Stores the pointer \p data with the \p dataUUID in the runtime. This can
  /// be used to store some custom data within the runtime. When the runtime is
  /// destroyed, or if an entry at an existing key is overwritten, the runtime
  /// will release its ownership of the held object.
  virtual void setRuntimeData(
      const UUID& dataUUID,
      const std::shared_ptr<void>& data) = 0;
  /// Returns the data associated with the \p uuid in the runtime. If there's no
  /// data associated with the uuid, return a null pointer.
  virtual std::shared_ptr<void> getRuntimeData(const UUID& dataUUID) = 0;

  /// Stores the pointer \p data with the \p uuid in the runtime. This can be
  /// used to store some custom data within the runtime. When the runtime is
  /// destroyed, or if an entry at an existing key is overwritten, the runtime
  /// will release its ownership by calling \p deleter.
  virtual void setRuntimeDataImpl(
      const UUID& dataUUID,
      const void* data,
      void (*deleter)(const void* data)) = 0;

  /// Returns the data associated with the \p uuid in the runtime. If there's no
  /// data associated with the uuid, return a null pointer.
  virtual const void* getRuntimeDataImpl(const UUID& dataUUID) = 0;

  // Potential optimization: avoid the cloneFoo() virtual dispatch,
  // and instead just fix the number of fields, and copy them, since
  // in practice they are trivially copyable.  Sufficient use of
  // rvalue arguments/methods would also reduce the number of clones.

  struct PointerValue {
    virtual void invalidate() noexcept = 0;

   protected:
    virtual ~PointerValue() = default;
  };

  virtual PointerValue* cloneSymbol(const IRuntime::PointerValue* pv) = 0;
  virtual PointerValue* cloneBigInt(const IRuntime::PointerValue* pv) = 0;
  virtual PointerValue* cloneString(const IRuntime::PointerValue* pv) = 0;
  virtual PointerValue* cloneObject(const IRuntime::PointerValue* pv) = 0;
  virtual PointerValue* clonePropNameID(const IRuntime::PointerValue* pv) = 0;

  virtual PropNameID createPropNameIDFromAscii(
      const char* str,
      size_t length) = 0;
  virtual PropNameID createPropNameIDFromUtf8(
      const uint8_t* utf8,
      size_t length) = 0;
  virtual PropNameID createPropNameIDFromUtf16(
      const char16_t* utf16,
      size_t length) = 0;
  virtual PropNameID createPropNameIDFromString(const String& str) = 0;
  virtual PropNameID createPropNameIDFromSymbol(const Symbol& sym) = 0;
  virtual std::string utf8(const PropNameID&) = 0;
  virtual bool compare(const PropNameID&, const PropNameID&) = 0;

  virtual std::string symbolToString(const Symbol&) = 0;

  virtual BigInt createBigIntFromInt64(int64_t) = 0;
  virtual BigInt createBigIntFromUint64(uint64_t) = 0;
  virtual bool bigintIsInt64(const BigInt&) = 0;
  virtual bool bigintIsUint64(const BigInt&) = 0;
  virtual uint64_t truncate(const BigInt&) = 0;
  virtual String bigintToString(const BigInt&, int) = 0;

  virtual String createStringFromAscii(const char* str, size_t length) = 0;
  virtual String createStringFromUtf8(const uint8_t* utf8, size_t length) = 0;
  virtual String createStringFromUtf16(
      const char16_t* utf16,
      size_t length) = 0;
  virtual std::string utf8(const String&) = 0;

  // \return a \c Value created from a utf8-encoded JSON string. The default
  // implementation creates a \c String and invokes JSON.parse.
  virtual Value createValueFromJsonUtf8(const uint8_t* json, size_t length) = 0;

  virtual Object createObject() = 0;
  virtual Object createObject(std::shared_ptr<HostObject> ho) = 0;
  virtual std::shared_ptr<HostObject> getHostObject(const jsi::Object&) = 0;
  virtual HostFunctionType& getHostFunction(const jsi::Function&) = 0;

  // Creates a new Object with the custom prototype
  virtual Object createObjectWithPrototype(const Value& prototype) = 0;

  virtual bool hasNativeState(const jsi::Object&) = 0;
  virtual std::shared_ptr<NativeState> getNativeState(const jsi::Object&) = 0;
  virtual void setNativeState(
      const jsi::Object&,
      std::shared_ptr<NativeState> state) = 0;

  virtual void setPrototypeOf(const Object& object, const Value& prototype) = 0;
  virtual Value getPrototypeOf(const Object& object) = 0;

  virtual Value getProperty(const Object&, const PropNameID& name) = 0;
  virtual Value getProperty(const Object&, const String& name) = 0;
  virtual Value getProperty(const Object&, const Value& name) = 0;
  virtual bool hasProperty(const Object&, const PropNameID& name) = 0;
  virtual bool hasProperty(const Object&, const String& name) = 0;
  virtual bool hasProperty(const Object&, const Value& name) = 0;
  virtual void setPropertyValue(
      const Object&,
      const PropNameID& name,
      const Value& value) = 0;
  virtual void
  setPropertyValue(const Object&, const String& name, const Value& value) = 0;
  virtual void
  setPropertyValue(const Object&, const Value& name, const Value& value) = 0;

  virtual void deleteProperty(const Object&, const PropNameID& name) = 0;
  virtual void deleteProperty(const Object&, const String& name) = 0;
  virtual void deleteProperty(const Object&, const Value& name) = 0;

  virtual bool isArray(const Object&) const = 0;
  virtual bool isArrayBuffer(const Object&) const = 0;
  virtual bool isTypedArray(const Object&) const = 0;
  virtual bool isUint8Array(const Object&) const = 0;
  virtual bool isFunction(const Object&) const = 0;
  virtual bool isHostObject(const jsi::Object&) const = 0;
  virtual bool isHostFunction(const jsi::Function&) const = 0;
  virtual Array getPropertyNames(const Object&) = 0;

  virtual WeakObject createWeakObject(const Object&) = 0;
  virtual Value lockWeakObject(const WeakObject&) = 0;

  virtual Array createArray(size_t length) = 0;
  virtual ArrayBuffer createArrayBuffer(
      std::shared_ptr<MutableBuffer> buffer) = 0;
  virtual size_t size(const Array&) = 0;
  virtual size_t size(const ArrayBuffer&) = 0;
  virtual uint8_t* data(const ArrayBuffer&) = 0;
  virtual bool detached(const ArrayBuffer&) = 0;
  virtual Value getValueAtIndex(const Array&, size_t i) = 0;
  virtual void
  setValueAtIndexImpl(const Array&, size_t i, const Value& value) = 0;
  virtual size_t push(const Array&, const Value*, size_t) = 0;

  virtual Function createFunctionFromHostFunction(
      const PropNameID& name,
      unsigned int paramCount,
      HostFunctionType func) = 0;
  virtual Value call(
      const Function&,
      const Value& jsThis,
      const Value* args,
      size_t count) = 0;
  virtual Value
  callAsConstructor(const Function&, const Value* args, size_t count) = 0;

  // Private data for managing scopes.
  struct ScopeState;
  virtual ScopeState* pushScope() = 0;
  virtual void popScope(ScopeState*) = 0;

  virtual bool strictEquals(const Symbol& a, const Symbol& b) const = 0;
  virtual bool strictEquals(const BigInt& a, const BigInt& b) const = 0;
  virtual bool strictEquals(const String& a, const String& b) const = 0;
  virtual bool strictEquals(const Object& a, const Object& b) const = 0;

  virtual bool instanceOf(const Object& o, const Function& f) = 0;

  /// See Object::setExternalMemoryPressure.
  virtual void setExternalMemoryPressure(
      const jsi::Object& obj,
      size_t amount) = 0;

  virtual std::u16string utf16(const String& str) = 0;
  virtual std::u16string utf16(const PropNameID& sym) = 0;

  /// Invokes the provided callback \p cb with the String content in \p str.
  /// The callback must take in three arguments: bool ascii, const void* data,
  /// and size_t num, respectively. \p ascii indicates whether the \p data
  /// passed to the callback should be interpreted as a pointer to a sequence of
  /// \p num ASCII characters or UTF16 characters. Depending on the internal
  /// representation of the string, the function may invoke the callback
  /// multiple times, with a different format on each invocation. The callback
  /// must not access runtime functionality, as any operation on the runtime may
  /// invalidate the data pointers.
  virtual void getStringData(
      const jsi::String& str,
      void* ctx,
      void (*cb)(void* ctx, bool ascii, const void* data, size_t num)) = 0;

  /// Invokes the provided callback \p cb with the PropNameID content in \p sym.
  /// The callback must take in three arguments: bool ascii, const void* data,
  /// and size_t num, respectively. \p ascii indicates whether the \p data
  /// passed to the callback should be interpreted as a pointer to a sequence of
  /// \p num ASCII characters or UTF16 characters. Depending on the internal
  /// representation of the string, the function may invoke the callback
  /// multiple times, with a different format on each invocation. The callback
  /// must not access runtime functionality, as any operation on the runtime may
  /// invalidate the data pointers.
  virtual void getPropNameIdData(
      const jsi::PropNameID& sym,
      void* ctx,
      void (*cb)(void* ctx, bool ascii, const void* data, size_t num)) = 0;

  /// If possible, returns the MutableBuffer representing \p arrayBuffer's
  /// underlying data, else return a nullptr. Importantly, the returned
  /// MutableBuffer directly points to \p arrayBuffer's data instead of copying
  /// the data over. The data's lifetime is valid for the lifetime of
  /// MutableBuffer, which is orthogonal from \p arrayBuffer.
  virtual std::shared_ptr<MutableBuffer> tryGetMutableBuffer(
      const jsi::ArrayBuffer& arrayBuffer) = 0;

  /// \return the underlying buffer of the \p typedArray.
  virtual ArrayBuffer buffer(const TypedArray& typedArray) = 0;
  /// \return the 'byteOffset' property of the \p typedArray.
  virtual size_t byteOffset(const TypedArray& typedArray) = 0;
  /// \return the 'byteLength' property of the \p typedArray.
  virtual size_t byteLength(const TypedArray& typedArray) = 0;
  /// \return the 'length; property of the \p typedArray.
  virtual size_t length(const TypedArray& typedArray) = 0;

  /// Create a JS UInt8Array with length \p length.
  virtual Uint8Array createUint8Array(size_t length) = 0;
  /// Create a JS UInt8Array using the ArrayBuffer \p buffer starting at byte
  /// offset \p offset and length \p length.
  virtual Uint8Array
  createUint8Array(const ArrayBuffer& buffer, size_t offset, size_t length) = 0;

  /// Create a new Error object with the message property set to \p message.
  virtual Value createError(const String& msg) = 0;
  /// Create a new EvalError object with the message property set to \p message.
  virtual Value createEvalError(const String& msg) = 0;
  /// Create a new RangeError object with the message property set to \p
  /// message.
  virtual Value createRangeError(const String& msg) = 0;
  /// Create a new ReferenceError object with the message property set to \p
  /// message.
  virtual Value createReferenceError(const String& msg) = 0;
  /// Create a new SyntaxError object with the message property set to \p
  /// message.
  virtual Value createSyntaxError(const String& msg) = 0;
  /// Create a new TypeError object with the message property set to \p message.
  virtual Value createTypeError(const String& msg) = 0;
  /// Create a new URIError object with the message property set to \p message.
  virtual Value createURIError(const String& msg) = 0;

  /// Returns the number of code units in the string, equivalent to 'length'
  /// property of a JS string.
  virtual size_t length(const String& str) = 0;

 protected:
  virtual ~IRuntime() = default;
};

/// Represents a JS runtime.  Movable, but not copyable.  Note that
/// this object may not be thread-aware, but cannot be used safely from
/// multiple threads at once.  The application is responsible for
/// ensuring that it is used safely.  This could mean using the
/// Runtime from a single thread, using a mutex, doing all work on a
/// serial queue, etc.  This restriction applies to the methods of
/// this class, and any method in the API which take a Runtime& as an
/// argument.  Destructors (all but ~Scope), operators, or other methods
/// which do not take Runtime& as an argument are safe to call from any
/// thread, but it is still forbidden to make write operations on a single
/// instance of any class from more than one thread.  In addition, to
/// make shutdown safe, destruction of objects associated with the Runtime
/// must be destroyed before the Runtime is destroyed, or from the
/// destructor of a managed HostObject or HostFunction.  Informally, this
/// means that the main source of unsafe behavior is to hold a jsi object
/// in a non-Runtime-managed object, and not clean it up before the Runtime
/// is shut down.  If your lifecycle is such that avoiding this is hard,
/// you will probably need to do use your own locks.
class JSI_EXPORT Runtime : public IRuntime {
 public:
  virtual ~Runtime() override;

  using IRuntime::getProperty;
  using IRuntime::hasProperty;
  using IRuntime::setPropertyValue;
  ICast* castInterface(const UUID& uuid) override;

  Instrumentation& instrumentation() override;

  /// Stores the pointer \p data with the \p uuid in the runtime. This can be
  /// used to store some custom data within the runtime. When the runtime is
  /// destroyed, or if an entry at an existing key is overwritten, the runtime
  /// will release its ownership of the held object.
  void setRuntimeData(const UUID& uuid, const std::shared_ptr<void>& data)
      override;

  /// Returns the data associated with the \p uuid in the runtime. If there's no
  /// data associated with the uuid, return a null pointer.
  std::shared_ptr<void> getRuntimeData(const UUID& uuid) override;

  Value getProperty(const Object&, const Value& name) override;
  bool hasProperty(const Object&, const Value& name) override;
  void setPropertyValue(const Object&, const Value& name, const Value& value)
      override;
  void deleteProperty(const Object&, const PropNameID& name) override;
  void deleteProperty(const Object&, const String& name) override;
  void deleteProperty(const Object&, const Value& name) override;

  void setRuntimeDataImpl(
      const UUID& uuid,
      const void* data,
      void (*deleter)(const void* data)) override;
  const void* getRuntimeDataImpl(const UUID& uuid) override;

  PropNameID createPropNameIDFromUtf16(const char16_t* utf16, size_t length)
      override;
  String createStringFromUtf16(const char16_t* utf16, size_t length) override;

  Value createValueFromJsonUtf8(const uint8_t* json, size_t length) override;

  Object createObjectWithPrototype(const Value& prototype) override;
  void setPrototypeOf(const Object& object, const Value& prototype) override;
  Value getPrototypeOf(const Object& object) override;

  ScopeState* pushScope() override;
  void popScope(ScopeState*) override;

  std::u16string utf16(const String& str) override;
  std::u16string utf16(const PropNameID& sym) override;

  void getStringData(
      const jsi::String& str,
      void* ctx,
      void (*cb)(void* ctx, bool ascii, const void* data, size_t num)) override;
  void getPropNameIdData(
      const jsi::PropNameID& sym,
      void* ctx,
      void (*cb)(void* ctx, bool ascii, const void* data, size_t num)) override;

  size_t push(const Array&, const Value*, size_t) override;

  std::shared_ptr<MutableBuffer> tryGetMutableBuffer(
      const jsi::ArrayBuffer& arrayBuffer) override;

  bool detached(const ArrayBuffer&) override;

  ArrayBuffer buffer(const TypedArray& typedArray) override;
  size_t byteOffset(const TypedArray& typedArray) override;
  size_t byteLength(const TypedArray& typedArray) override;
  size_t length(const TypedArray& typedArray) override;

  bool isTypedArray(const Object&) const override;
  bool isUint8Array(const Object&) const override;
  Uint8Array createUint8Array(size_t length) override;
  Uint8Array createUint8Array(
      const ArrayBuffer& buffer,
      size_t offset,
      size_t length) override;

  Value createError(const String& msg) override;
  Value createEvalError(const String& msg) override;
  Value createRangeError(const String& msg) override;
  Value createReferenceError(const String& msg) override;
  Value createSyntaxError(const String& msg) override;
  Value createTypeError(const String& msg) override;
  Value createURIError(const String& msg) override;

  size_t length(const String& str) override;

 protected:
  friend class Pointer;
  friend class PropNameID;
  friend class Symbol;
  friend class BigInt;
  friend class String;
  friend class Object;
  friend class WeakObject;
  friend class Array;
  friend class ArrayBuffer;
  friend class Function;
  friend class Value;
  friend class Scope;
  friend class JSError;

  // These exist so derived classes can access the private parts of
  // Value, Symbol, String, and Object, which are all friends of Runtime.
  template <typename T>
  static T make(PointerValue* pv);
  static PointerValue* getPointerValue(Pointer& pointer);
  static const PointerValue* getPointerValue(const Pointer& pointer);
  static const PointerValue* getPointerValue(const Value& value);

  friend class ::FBJSRuntime;
  template <typename Plain, typename Base>
  friend class RuntimeDecorator;
};

// Base class for pointer-storing types.
class JSI_EXPORT Pointer {
 protected:
  explicit Pointer(Pointer&& other) noexcept : ptr_(other.ptr_) {
    other.ptr_ = nullptr;
  }

  ~Pointer() {
    if (ptr_) {
      ptr_->invalidate();
    }
  }

  Pointer& operator=(Pointer&& other) noexcept;

  friend class Runtime;
  friend class Value;

  explicit Pointer(Runtime::PointerValue* ptr) : ptr_(ptr) {}

  typename Runtime::PointerValue* ptr_;
};

/// Represents something that can be a JS property key.  Movable, not copyable.
class JSI_EXPORT PropNameID : public Pointer {
 public:
  using Pointer::Pointer;

  PropNameID(IRuntime& runtime, const PropNameID& other)
      : Pointer(runtime.clonePropNameID(other.ptr_)) {}

  PropNameID(PropNameID&& other) = default;
  PropNameID& operator=(PropNameID&& other) = default;

  /// Create a JS property name id from ascii values.  The data is
  /// copied.
  static PropNameID
  forAscii(IRuntime& runtime, const char* str, size_t length) {
    return runtime.createPropNameIDFromAscii(str, length);
  }

  /// Create a property name id from a nul-terminated C ascii name.  The data is
  /// copied.
  static PropNameID forAscii(IRuntime& runtime, const char* str) {
    return forAscii(runtime, str, strlen(str));
  }

  /// Create a PropNameID from a C++ string. The string is copied.
  static PropNameID forAscii(IRuntime& runtime, const std::string& str) {
    return forAscii(runtime, str.c_str(), str.size());
  }

  /// Create a PropNameID from utf8 values.  The data is copied.
  /// Results are undefined if \p utf8 contains invalid code points.
  static PropNameID
  forUtf8(IRuntime& runtime, const uint8_t* utf8, size_t length) {
    return runtime.createPropNameIDFromUtf8(utf8, length);
  }

  /// Create a PropNameID from utf8-encoded octets stored in a
  /// std::string.  The string data is transformed and copied.
  /// Results are undefined if \p utf8 contains invalid code points.
  static PropNameID forUtf8(IRuntime& runtime, const std::string& utf8) {
    return runtime.createPropNameIDFromUtf8(
        reinterpret_cast<const uint8_t*>(utf8.data()), utf8.size());
  }

  /// Given a series of UTF-16 encoded code units, create a PropNameId. The
  /// input may contain unpaired surrogates, which will be interpreted as a code
  /// point of the same value.
  static PropNameID
  forUtf16(IRuntime& runtime, const char16_t* utf16, size_t length) {
    return runtime.createPropNameIDFromUtf16(utf16, length);
  }

  /// Given a series of UTF-16 encoded code units stored inside std::u16string,
  /// create a PropNameId.  The input may contain unpaired surrogates, which
  /// will be interpreted as a code point of the same value.
  static PropNameID forUtf16(IRuntime& runtime, const std::u16string& str) {
    return runtime.createPropNameIDFromUtf16(str.data(), str.size());
  }

  /// Create a PropNameID from a JS string.
  static PropNameID forString(IRuntime& runtime, const jsi::String& str) {
    return runtime.createPropNameIDFromString(str);
  }

  /// Create a PropNameID from a JS symbol.
  static PropNameID forSymbol(IRuntime& runtime, const jsi::Symbol& sym) {
    return runtime.createPropNameIDFromSymbol(sym);
  }

  // Creates a vector of PropNameIDs constructed from given arguments.
  template <typename... Args>
  static std::vector<PropNameID> names(IRuntime& runtime, Args&&... args);

  // Creates a vector of given PropNameIDs.
  template <size_t N>
  static std::vector<PropNameID> names(PropNameID (&&propertyNames)[N]);

  /// Copies the data in a PropNameID as utf8 into a C++ string.
  std::string utf8(IRuntime& runtime) const {
    return runtime.utf8(*this);
  }

  /// Copies the data in a PropNameID as utf16 into a C++ string.
  std::u16string utf16(IRuntime& runtime) const {
    return runtime.utf16(*this);
  }

  /// Invokes the user provided callback to process the content in PropNameId.
  /// The callback must take in three arguments: bool ascii, const void* data,
  /// and size_t num, respectively. \p ascii indicates whether the \p data
  /// passed to the callback should be interpreted as a pointer to a sequence of
  /// \p num ASCII characters or UTF16 characters. The function may invoke the
  /// callback multiple times, with a different format on each invocation. The
  /// callback must not access runtime functionality, as any operation on the
  /// runtime may invalidate the data pointers.
  template <typename CB>
  void getPropNameIdData(IRuntime& runtime, CB& cb) const {
    runtime.getPropNameIdData(
        *this, &cb, [](void* ctx, bool ascii, const void* data, size_t num) {
          (*((CB*)ctx))(ascii, data, num);
        });
  }

  static bool compare(
      IRuntime& runtime,
      const jsi::PropNameID& a,
      const jsi::PropNameID& b) {
    return runtime.compare(a, b);
  }

  friend class Runtime;
  friend class Value;
};

/// Represents a JS Symbol (es6).  Movable, not copyable.
/// TODO T40778724: this is a limited implementation sufficient for
/// the debugger not to crash when a Symbol is a property in an Object
/// or element in an array.  Complete support for creating will come
/// later.
class JSI_EXPORT Symbol : public Pointer {
 public:
  using Pointer::Pointer;

  Symbol(Symbol&& other) = default;
  Symbol& operator=(Symbol&& other) = default;

  /// \return whether a and b refer to the same symbol.
  static bool
  strictEquals(IRuntime& runtime, const Symbol& a, const Symbol& b) {
    return runtime.strictEquals(a, b);
  }

  /// Converts a Symbol into a C++ string as JS .toString would.  The output
  /// will look like \c Symbol(description) .
  std::string toString(IRuntime& runtime) const {
    return runtime.symbolToString(*this);
  }

  friend class Runtime;
  friend class Value;
};

/// Represents a JS BigInt.  Movable, not copyable.
class JSI_EXPORT BigInt : public Pointer {
 public:
  using Pointer::Pointer;

  BigInt(BigInt&& other) = default;
  BigInt& operator=(BigInt&& other) = default;

  /// Create a BigInt representing the signed 64-bit \p value.
  static BigInt fromInt64(IRuntime& runtime, int64_t value) {
    return runtime.createBigIntFromInt64(value);
  }

  /// Create a BigInt representing the unsigned 64-bit \p value.
  static BigInt fromUint64(IRuntime& runtime, uint64_t value) {
    return runtime.createBigIntFromUint64(value);
  }

  /// \return whether a === b.
  static bool
  strictEquals(IRuntime& runtime, const BigInt& a, const BigInt& b) {
    return runtime.strictEquals(a, b);
  }

  /// \returns This bigint truncated to a signed 64-bit integer.
  int64_t getInt64(IRuntime& runtime) const {
    return runtime.truncate(*this);
  }

  /// \returns Whether this bigint can be losslessly converted to int64_t.
  bool isInt64(IRuntime& runtime) const {
    return runtime.bigintIsInt64(*this);
  }

  /// \returns This bigint truncated to a signed 64-bit integer. Throws a
  /// JSIException if the truncation is lossy.
  int64_t asInt64(IRuntime& runtime) const;

  /// \returns This bigint truncated to an unsigned 64-bit integer.
  uint64_t getUint64(IRuntime& runtime) const {
    return runtime.truncate(*this);
  }

  /// \returns Whether this bigint can be losslessly converted to uint64_t.
  bool isUint64(IRuntime& runtime) const {
    return runtime.bigintIsUint64(*this);
  }

  /// \returns This bigint truncated to an unsigned 64-bit integer. Throws a
  /// JSIException if the truncation is lossy.
  uint64_t asUint64(IRuntime& runtime) const;

  /// \returns this BigInt converted to a String in base \p radix. Throws a
  /// JSIException if radix is not in the [2, 36] range.
  inline String toString(IRuntime& runtime, int radix = 10) const;

  friend class Runtime;
  friend class Value;
};

/// Represents a JS String.  Movable, not copyable.
class JSI_EXPORT String : public Pointer {
 public:
  using Pointer::Pointer;

  String(String&& other) = default;
  String& operator=(String&& other) = default;

  /// Create a JS string from ascii values.  The string data is
  /// copied.
  static String
  createFromAscii(IRuntime& runtime, const char* str, size_t length) {
    return runtime.createStringFromAscii(str, length);
  }

  /// Create a JS string from a nul-terminated C ascii string.  The
  /// string data is copied.
  static String createFromAscii(IRuntime& runtime, const char* str) {
    return createFromAscii(runtime, str, strlen(str));
  }

  /// Create a JS string from a C++ string.  The string data is
  /// copied.
  static String createFromAscii(IRuntime& runtime, const std::string& str) {
    return createFromAscii(runtime, str.c_str(), str.size());
  }

  /// Create a JS string from utf8-encoded octets.  The string data is
  /// transformed and copied.  Results are undefined if \p utf8 contains invalid
  /// code points.
  static String
  createFromUtf8(IRuntime& runtime, const uint8_t* utf8, size_t length) {
    return runtime.createStringFromUtf8(utf8, length);
  }

  /// Create a JS string from utf8-encoded octets stored in a
  /// std::string.  The string data is transformed and copied.  Results are
  /// undefined if \p utf8 contains invalid code points.
  static String createFromUtf8(IRuntime& runtime, const std::string& utf8) {
    return runtime.createStringFromUtf8(
        reinterpret_cast<const uint8_t*>(utf8.data()), utf8.length());
  }

  /// Given a series of UTF-16 encoded code units, create a JS String. The input
  /// may contain unpaired surrogates, which will be interpreted as a code point
  /// of the same value.
  static String
  createFromUtf16(IRuntime& runtime, const char16_t* utf16, size_t length) {
    return runtime.createStringFromUtf16(utf16, length);
  }

  /// Given a series of UTF-16 encoded code units stored inside std::u16string,
  /// create a JS String. The input may contain unpaired surrogates, which will
  /// be interpreted as a code point of the same value.
  static String createFromUtf16(
      IRuntime& runtime,
      const std::u16string& utf16) {
    return runtime.createStringFromUtf16(utf16.data(), utf16.length());
  }

  /// \return whether a and b contain the same characters.
  static bool
  strictEquals(IRuntime& runtime, const String& a, const String& b) {
    return runtime.strictEquals(a, b);
  }

  /// \return the 'length' property of this JS string.
  size_t length(IRuntime& runtime) const {
    return runtime.length(*this);
  }

  /// Copies the data in a JS string as utf8 into a C++ string.
  std::string utf8(IRuntime& runtime) const {
    return runtime.utf8(*this);
  }

  /// Copies the data in a JS string as utf16 into a C++ string.
  std::u16string utf16(IRuntime& runtime) const {
    return runtime.utf16(*this);
  }

  /// Invokes the user provided callback to process content in String. The
  /// callback must take in three arguments: bool ascii, const void* data, and
  /// size_t num, respectively. \p ascii indicates whether the \p data passed to
  /// the callback should be interpreted as a pointer to a sequence of \p num
  /// ASCII characters or UTF16 characters. The function may invoke the callback
  /// multiple times, with a different format on each invocation. The callback
  /// must not access runtime functionality, as any operation on the runtime may
  /// invalidate the data pointers.
  template <typename CB>
  void getStringData(IRuntime& runtime, CB& cb) const {
    runtime.getStringData(
        *this, &cb, [](void* ctx, bool ascii, const void* data, size_t num) {
          (*((CB*)ctx))(ascii, data, num);
        });
  }

  friend class Runtime;
  friend class Value;
};

class Array;
class Function;

/// Represents a JS Object.  Movable, not copyable.
class JSI_EXPORT Object : public Pointer {
 public:
  using Pointer::Pointer;

  Object(Object&& other) = default;
  Object& operator=(Object&& other) = default;

  /// Creates a new Object instance, like '{}' in JS.
  explicit Object(IRuntime& runtime) : Object(runtime.createObject()) {}

  static Object createFromHostObject(
      IRuntime& runtime,
      std::shared_ptr<HostObject> ho) {
    return runtime.createObject(ho);
  }

  /// Creates a new Object with the custom prototype
  static Object create(IRuntime& runtime, const Value& prototype) {
    return runtime.createObjectWithPrototype(prototype);
  }

  /// \return whether this and \c obj are the same JSObject or not.
  static bool
  strictEquals(IRuntime& runtime, const Object& a, const Object& b) {
    return runtime.strictEquals(a, b);
  }

  /// \return the result of `this instanceOf ctor` in JS.
  bool instanceOf(IRuntime& rt, const Function& ctor) const {
    return rt.instanceOf(*this, ctor);
  }

  /// Sets \p prototype as the prototype of the object. The prototype must be
  /// either an Object or null. If the prototype was not set successfully, this
  /// method will throw.
  void setPrototype(IRuntime& runtime, const Value& prototype) const {
    return runtime.setPrototypeOf(*this, prototype);
  }

  /// \return the prototype of the object
  inline Value getPrototype(IRuntime& runtime) const;

  /// \return the property of the object with the given ascii name.
  /// If the name isn't a property on the object, returns the
  /// undefined value.
  Value getProperty(IRuntime& runtime, const char* name) const;

  /// \return the property of the object with the String name.
  /// If the name isn't a property on the object, returns the
  /// undefined value.
  Value getProperty(IRuntime& runtime, const String& name) const;

  /// \return the property of the object with the given JS PropNameID
  /// name.  If the name isn't a property on the object, returns the
  /// undefined value.
  Value getProperty(IRuntime& runtime, const PropNameID& name) const;

  /// \return the Property of the object with the given JS Value name. If the
  /// name isn't a property on the object, returns the undefined value.This
  /// attempts to convert the JS Value to convert to a property key. If the
  /// conversion fails, this method may throw.
  Value getProperty(IRuntime& runtime, const Value& name) const;

  /// \return true if and only if the object has a property with the
  /// given ascii name.
  bool hasProperty(IRuntime& runtime, const char* name) const;

  /// \return true if and only if the object has a property with the
  /// given String name.
  bool hasProperty(IRuntime& runtime, const String& name) const;

  /// \return true if and only if the object has a property with the
  /// given PropNameID name.
  bool hasProperty(IRuntime& runtime, const PropNameID& name) const;

  /// \return true if and only if the object has a property with the given
  /// JS Value name. This attempts to convert the JS Value to convert to a
  /// property key. If the conversion fails, this method may throw.
  bool hasProperty(IRuntime& runtime, const Value& name) const;

  /// Sets the property value from a Value or anything which can be
  /// used to make one: nullptr_t, bool, double, int, const char*,
  /// String, or Object.
  template <typename T>
  void setProperty(IRuntime& runtime, const char* name, T&& value) const;

  /// Sets the property value from a Value or anything which can be
  /// used to make one: nullptr_t, bool, double, int, const char*,
  /// String, or Object.
  template <typename T>
  void setProperty(IRuntime& runtime, const String& name, T&& value) const;

  /// Sets the property value from a Value or anything which can be
  /// used to make one: nullptr_t, bool, double, int, const char*,
  /// String, or Object.
  template <typename T>
  void setProperty(IRuntime& runtime, const PropNameID& name, T&& value) const;

  /// Sets the property value from a Value or anything which can be
  /// used to make one: nullptr_t, bool, double, int, const char*,
  /// String, or Object. This takes a JS Value as the property name, and
  /// attempts to convert to a property key. If the conversion fails, this
  /// method may throw.
  template <typename T>
  void setProperty(IRuntime& runtime, const Value& name, T&& value) const;

  /// Delete the property with the given ascii name. Throws if the deletion
  /// failed.
  void deleteProperty(IRuntime& runtime, const char* name) const;

  /// Delete the property with the given String name. Throws if the deletion
  /// failed.
  void deleteProperty(IRuntime& runtime, const String& name) const;

  /// Delete the property with the given PropNameID name. Throws if the deletion
  /// failed.
  void deleteProperty(IRuntime& runtime, const PropNameID& name) const;

  /// Delete the property with the given Value name. Throws if the deletion
  /// failed.
  void deleteProperty(IRuntime& runtime, const Value& name) const;

  /// \return true iff JS \c Array.isArray() would return \c true.  If
  /// so, then \c getArray() will succeed.
  bool isArray(IRuntime& runtime) const {
    return runtime.isArray(*this);
  }

  /// \return true iff the Object is an ArrayBuffer. If so, then \c
  /// getArrayBuffer() will succeed.
  bool isArrayBuffer(IRuntime& runtime) const {
    return runtime.isArrayBuffer(*this);
  }

  /// \return true iff the Object is a TypedArray (Uint8Array, Int32Array,
  /// Float64Array, etc.). If so, then \c getTypedArray() will succeed.
  bool isTypedArray(IRuntime& runtime) const {
    return runtime.isTypedArray(*this);
  }

  /// \return true iff the Object is an Uint8Array. If so, then \c
  /// getUint8Array() will succeed
  bool isUint8Array(IRuntime& runtime) const {
    return runtime.isUint8Array(*this);
  }

  /// \return true iff the Object is callable.  If so, then \c
  /// getFunction will succeed.
  bool isFunction(IRuntime& runtime) const {
    return runtime.isFunction(*this);
  }

  /// \return true iff the Object was initialized with \c createFromHostObject
  /// and the HostObject passed is of type \c T. If returns \c true then
  /// \c getHostObject<T> will succeed.
  template <typename T = HostObject>
  bool isHostObject(IRuntime& runtime) const;

  /// \return an Array instance which refers to the same underlying
  /// object.  If \c isArray() would return false, this will assert.
  Array getArray(IRuntime& runtime) const&;

  /// \return an Array instance which refers to the same underlying
  /// object.  If \c isArray() would return false, this will assert.
  Array getArray(IRuntime& runtime) &&;

  /// \return an Array instance which refers to the same underlying
  /// object.  If \c isArray() would return false, this will throw
  /// JSIException.
  Array asArray(IRuntime& runtime) const&;

  /// \return an Array instance which refers to the same underlying
  /// object.  If \c isArray() would return false, this will throw
  /// JSIException.
  Array asArray(IRuntime& runtime) &&;

  /// \return a TypedArray instance which refers to the same underlying
  /// object. If \c isTypedArray() would return false, this will throw
  /// JSIException.
  TypedArray asTypedArray(IRuntime& runtime) const&;

  /// \return an Uint8Array instance which refers to the same underlying
  /// object. If \c isUint8Array() would return false, this will throw
  /// JSIException.
  Uint8Array asUint8Array(IRuntime& runtime) const&;

  /// \return an ArrayBuffer instance which refers to the same underlying
  /// object.  If \c isArrayBuffer() would return false, this will assert.
  ArrayBuffer getArrayBuffer(IRuntime& runtime) const&;

  /// \return an ArrayBuffer instance which refers to the same underlying
  /// object.  If \c isArrayBuffer() would return false, this will assert.
  ArrayBuffer getArrayBuffer(IRuntime& runtime) &&;

  /// \return a TypedArray instance which refers to the same underlying
  /// object. If \c isTypedArray() would return false, this will assert.
  TypedArray getTypedArray(IRuntime& runtime) const&;

  /// \return an Uint8Array instance which refers to the same underlying
  /// object. If \c isUint8Array() would return false, this will assert.
  Uint8Array getUint8Array(IRuntime& runtime) const&;

  /// \return a Function instance which refers to the same underlying
  /// object.  If \c isFunction() would return false, this will assert.
  Function getFunction(IRuntime& runtime) const&;

  /// \return a Function instance which refers to the same underlying
  /// object.  If \c isFunction() would return false, this will assert.
  Function getFunction(IRuntime& runtime) &&;

  /// \return a Function instance which refers to the same underlying
  /// object.  If \c isFunction() would return false, this will throw
  /// JSIException.
  Function asFunction(IRuntime& runtime) const&;

  /// \return a Function instance which refers to the same underlying
  /// object.  If \c isFunction() would return false, this will throw
  /// JSIException.
  Function asFunction(IRuntime& runtime) &&;

  /// \return a shared_ptr<T> which refers to the same underlying
  /// \c HostObject that was used to create this object. If \c isHostObject<T>
  /// is false, this will assert. Note that this does a type check and will
  /// assert if the underlying HostObject isn't of type \c T
  template <typename T = HostObject>
  std::shared_ptr<T> getHostObject(IRuntime& runtime) const;

  /// \return a shared_ptr<T> which refers to the same underlying
  /// \c HostObject that was used to create this object. If \c isHostObject<T>
  /// is false, this will throw.
  template <typename T = HostObject>
  std::shared_ptr<T> asHostObject(IRuntime& runtime) const;

  /// \return whether this object has native state of type T previously set by
  /// \c setNativeState.
  template <typename T = NativeState>
  bool hasNativeState(IRuntime& runtime) const;

  /// \return a shared_ptr to the state previously set by \c setNativeState.
  /// If \c hasNativeState<T> is false, this will assert. Note that this does a
  /// type check and will assert if the native state isn't of type \c T
  template <typename T = NativeState>
  std::shared_ptr<T> getNativeState(IRuntime& runtime) const;

  /// Set the internal native state property of this object, overwriting any old
  /// value. Creates a new shared_ptr to the object managed by \p state, which
  /// will live until the value at this property becomes unreachable.
  ///
  /// Throws a type error if this object is a proxy or host object.
  void setNativeState(IRuntime& runtime, std::shared_ptr<NativeState> state)
      const;

  /// \return same as \c getProperty(name).asObject(), except with
  /// a better exception message.
  Object getPropertyAsObject(IRuntime& runtime, const char* name) const;

  /// \return similar to \c
  /// getProperty(name).getObject().getFunction(), except it will
  /// throw JSIException instead of asserting if the property is
  /// not an object, or the object is not callable.
  Function getPropertyAsFunction(IRuntime& runtime, const char* name) const;

  /// \return an Array consisting of all enumerable property names in
  /// the object and its prototype chain.  All values in the return
  /// will be isString().  (This is probably not optimal, but it
  /// works.  I only need it in one place.)
  Array getPropertyNames(IRuntime& runtime) const;

  /// Inform the runtime that there is additional memory associated with a given
  /// JavaScript object that is not visible to the GC. This can be used if an
  /// object is known to retain some native memory, and may be used to guide
  /// decisions about when to run garbage collection.
  /// This method may be invoked multiple times on an object, and subsequent
  /// calls will overwrite any previously set value. Once the object is garbage
  /// collected, the associated external memory will be considered freed and may
  /// no longer factor into GC decisions.
  void setExternalMemoryPressure(IRuntime& runtime, size_t amt) const;

 protected:
  void setPropertyValue(
      IRuntime& runtime,
      const String& name,
      const Value& value) const {
    return runtime.setPropertyValue(*this, name, value);
  }

  void setPropertyValue(
      IRuntime& runtime,
      const PropNameID& name,
      const Value& value) const {
    return runtime.setPropertyValue(*this, name, value);
  }

  void setPropertyValue(
      IRuntime& runtime,
      const Value& name,
      const Value& value) const {
    return runtime.setPropertyValue(*this, name, value);
  }

  friend class Runtime;
  friend class Value;
};

/// Represents a weak reference to a JS Object.  If the only reference
/// to an Object are these, the object is eligible for GC.  Method
/// names are inspired by C++ weak_ptr.  Movable, not copyable.
class JSI_EXPORT WeakObject : public Pointer {
 public:
  using Pointer::Pointer;

  WeakObject(WeakObject&& other) = default;
  WeakObject& operator=(WeakObject&& other) = default;

  /// Create a WeakObject from an Object.
  WeakObject(IRuntime& runtime, const Object& o)
      : WeakObject(runtime.createWeakObject(o)) {}

  /// \return a Value representing the underlying Object if it is still valid;
  /// otherwise returns \c undefined.  Note that this method has nothing to do
  /// with threads or concurrency.  The name is based on std::weak_ptr::lock()
  /// which serves a similar purpose.
  Value lock(IRuntime& runtime) const;

  friend class Runtime;
};

/// Represents a JS Object which can be efficiently used as an array
/// with integral indices.
class JSI_EXPORT Array : public Object {
 public:
  Array(Array&&) = default;
  /// Creates a new Array instance, with \c length undefined elements.
  Array(IRuntime& runtime, size_t length)
      : Array(runtime.createArray(length)) {}

  Array& operator=(Array&&) = default;

  /// \return the size of the Array, according to its length property.
  /// (C++ naming convention)
  size_t size(IRuntime& runtime) const {
    return runtime.size(*this);
  }

  /// \return the size of the Array, according to its length property.
  /// (JS naming convention)
  size_t length(IRuntime& runtime) const {
    return size(runtime);
  }

  /// \return the property of the array at index \c i.  If there is no
  /// such property, returns the undefined value.  If \c i is out of
  /// range [ 0..\c length ] throws a JSIException.
  Value getValueAtIndex(IRuntime& runtime, size_t i) const;

  /// Sets the property of the array at index \c i.  The argument
  /// value behaves as with Object::setProperty().  If \c i is out of
  /// range [ 0..\c length ] throws a JSIException.
  template <typename T>
  void setValueAtIndex(IRuntime& runtime, size_t i, T&& value) const;

  /// Appends provides values to the end of the Array in the order they appear.
  /// Returns the new length of the array.
  template <typename... Args>
  size_t push(IRuntime& runtime, Args&&... args);

  /// Appends everything in \p elements to the end of the Array in the order
  /// they appear. Returns the new length of the array.
  size_t push(IRuntime& runtime, std::initializer_list<Value> elements);

  /// Appends \p count elements at \p elements to the end of the Array in the
  /// order they appear.
  size_t push(IRuntime& runtime, const Value* elements, size_t count);

  /// Creates a new Array instance from provided values
  template <typename... Args>
  static Array createWithElements(IRuntime&, Args&&... args);

  /// Creates a new Array instance from initializer list.
  static Array createWithElements(
      IRuntime& runtime,
      std::initializer_list<Value> elements);

 private:
  friend class Object;
  friend class Value;
  friend class Runtime;

  void setValueAtIndexImpl(IRuntime& runtime, size_t i, const Value& value)
      const {
    return runtime.setValueAtIndexImpl(*this, i, value);
  }

  Array(Runtime::PointerValue* value) : Object(value) {}
};

/// Represents a JSArrayBuffer
class JSI_EXPORT ArrayBuffer : public Object {
 public:
  ArrayBuffer(ArrayBuffer&&) = default;
  ArrayBuffer& operator=(ArrayBuffer&&) = default;

  ArrayBuffer(IRuntime& runtime, std::shared_ptr<MutableBuffer> buffer)
      : ArrayBuffer(runtime.createArrayBuffer(std::move(buffer))) {}

  /// \return the size of the ArrayBuffer storage. This is not affected by
  /// overriding the byteLength property.
  /// (C++ naming convention)
  size_t size(IRuntime& runtime) const {
    return runtime.size(*this);
  }

  size_t length(IRuntime& runtime) const {
    return runtime.size(*this);
  }

  uint8_t* data(IRuntime& runtime) const {
    return runtime.data(*this);
  }

  std::shared_ptr<MutableBuffer> tryGetMutableBuffer(IRuntime& runtime) const {
    return runtime.tryGetMutableBuffer(*this);
  }

  /// \return true if the ArrayBuffer is detached, false otherwise.
  bool detached(IRuntime& runtime) const {
    return runtime.detached(*this);
  }

 private:
  friend class Object;
  friend class Value;
  friend class Runtime;

  ArrayBuffer(Runtime::PointerValue* value) : Object(value) {}
};

/// Represents a JS Object which is guaranteed to be Callable.
class JSI_EXPORT Function : public Object {
 public:
  Function(Function&&) = default;
  Function& operator=(Function&&) = default;

  /// Create a function which, when invoked, calls C++ code. If the
  /// function throws an exception, a JS Error will be created and
  /// thrown.
  /// \param name the name property for the function.
  /// \param paramCount the length property for the function, which
  /// may not be the number of arguments the function is passed.
  /// \note The std::function's dtor will be called when the GC finalizes this
  /// function. As with HostObject, this may be as late as when the Runtime is
  /// shut down, and may occur on an arbitrary thread. If the function contains
  /// any captured values, you are responsible for ensuring that their
  /// destructors are safe to call on any thread.
  static Function createFromHostFunction(
      IRuntime& runtime,
      const jsi::PropNameID& name,
      unsigned int paramCount,
      jsi::HostFunctionType func);

  /// Calls the function with \c count \c args.  The \c this value of the JS
  /// function will not be set by the C++ caller, similar to calling
  /// Function.prototype.apply(undefined, args) in JS.
  /// \b Note: as with Function.prototype.apply, \c this may not always be
  /// \c undefined in the function itself.  If the function is non-strict,
  /// \c this will be set to the global object.
  Value call(IRuntime& runtime, const Value* args, size_t count) const;

  /// Calls the function with a \c std::initializer_list of Value
  /// arguments.  The \c this value of the JS function will not be set by the
  /// C++ caller, similar to calling Function.prototype.apply(undefined, args)
  /// in JS.
  /// \b Note: as with Function.prototype.apply, \c this may not always be
  /// \c undefined in the function itself.  If the function is non-strict,
  /// \c this will be set to the global object.
  Value call(IRuntime& runtime, std::initializer_list<Value> args) const;

  /// Calls the function with any number of arguments similarly to
  /// Object::setProperty().  The \c this value of the JS function will not be
  /// set by the C++ caller, similar to calling
  /// Function.prototype.call(undefined, ...args) in JS.
  /// \b Note: as with Function.prototype.call, \c this may not always be
  /// \c undefined in the function itself.  If the function is non-strict,
  /// \c this will be set to the global object.
  template <typename... Args>
  Value call(IRuntime& runtime, Args&&... args) const;

  /// Calls the function with \c count \c args and \c jsThis value passed
  /// as the \c this value.
  Value callWithThis(
      IRuntime& Runtime,
      const Object& jsThis,
      const Value* args,
      size_t count) const;

  /// Calls the function with a \c std::initializer_list of Value
  /// arguments and \c jsThis passed as the \c this value.
  Value callWithThis(
      IRuntime& runtime,
      const Object& jsThis,
      std::initializer_list<Value> args) const;

  /// Calls the function with any number of arguments similarly to
  /// Object::setProperty(), and with \c jsThis passed as the \c this value.
  template <typename... Args>
  Value callWithThis(IRuntime& runtime, const Object& jsThis, Args&&... args)
      const;

  /// Calls the function as a constructor with \c count \c args. Equivalent
  /// to calling `new Func` where `Func` is the js function reqresented by
  /// this.
  Value callAsConstructor(IRuntime& runtime, const Value* args, size_t count)
      const;

  /// Same as above `callAsConstructor`, except use an initializer_list to
  /// supply the arguments.
  Value callAsConstructor(IRuntime& runtime, std::initializer_list<Value> args)
      const;

  /// Same as above `callAsConstructor`, but automatically converts/wraps
  /// any argument with a jsi Value.
  template <typename... Args>
  Value callAsConstructor(IRuntime& runtime, Args&&... args) const;

  /// Returns whether this was created with Function::createFromHostFunction.
  /// If true then you can use getHostFunction to get the underlying
  /// HostFunctionType.
  bool isHostFunction(IRuntime& runtime) const {
    return runtime.isHostFunction(*this);
  }

  /// Returns the underlying HostFunctionType iff isHostFunction returns true
  /// and asserts otherwise. You can use this to use std::function<>::target
  /// to get the object that was passed to create the HostFunctionType.
  ///
  /// Note: The reference returned is borrowed from the JS object underlying
  ///       \c this, and thus only lasts as long as the object underlying
  ///       \c this does.
  HostFunctionType& getHostFunction(IRuntime& runtime) const {
    assert(isHostFunction(runtime));
    return runtime.getHostFunction(*this);
  }

 private:
  friend class Object;
  friend class Value;
  friend class Runtime;

  Function(Runtime::PointerValue* value) : Object(value) {}
};

/// Represents a JS TypedArray
class JSI_EXPORT TypedArray : public Object {
 public:
  TypedArray(TypedArray&&) = default;
  TypedArray& operator=(TypedArray&&) = default;

  // Gets the buffer of this TypedArray
  ArrayBuffer buffer(IRuntime& runtime) {
    return runtime.buffer(*this);
  }

  // Gets the byte offset of this TypedArray
  size_t byteOffset(IRuntime& runtime) {
    return runtime.byteOffset(*this);
  }

  // Gets the byte length of this TypedArray
  size_t byteLength(IRuntime& runtime) {
    return runtime.byteLength(*this);
  }

  // Gets the element length of this TypedArray
  size_t length(IRuntime& runtime) {
    return runtime.length(*this);
  }

 private:
  friend class Object;
  friend class Value;
  friend class Runtime;
  friend class Uint8Array;

  explicit TypedArray(Runtime::PointerValue* value) : Object(value) {}
};

// Represents a JS Uint8Array
class JSI_EXPORT Uint8Array : public TypedArray {
 public:
  Uint8Array(Uint8Array&&) = default;
  Uint8Array& operator=(Uint8Array&&) = default;

  Uint8Array(IRuntime& runtime, size_t length)
      : Uint8Array(runtime.createUint8Array(length)) {}
  Uint8Array(
      IRuntime& runtime,
      const ArrayBuffer& buffer,
      size_t offset,
      size_t length)
      : Uint8Array(runtime.createUint8Array(buffer, offset, length)) {}

 private:
  friend class Object;
  friend class Value;
  friend class Runtime;

  explicit Uint8Array(Runtime::PointerValue* value) : TypedArray(value) {}
};

/// Represents any JS Value (undefined, null, boolean, number, symbol,
/// string, or object).  Movable, or explicitly copyable (has no copy
/// ctor).
class JSI_EXPORT Value {
 public:
  /// Default ctor creates an \c undefined JS value.
  Value() noexcept : Value(UndefinedKind) {}

  /// Creates a \c null JS value.
  /* implicit */ Value(std::nullptr_t) : kind_(NullKind) {}

  /// Creates a boolean JS value.
  /* implicit */ Value(bool b) : Value(BooleanKind) {
    data_.boolean = b;
  }

  /// Creates a number JS value.
  /* implicit */ Value(double d) : Value(NumberKind) {
    data_.number = d;
  }

  /// Creates a number JS value.
  /* implicit */ Value(int i) : Value(NumberKind) {
    data_.number = i;
  }

  /// Moves a Symbol, String, or Object rvalue into a new JS value.
  template <
      typename T,
      typename = std::enable_if_t<
          std::is_base_of<Symbol, T>::value ||
          std::is_base_of<BigInt, T>::value ||
          std::is_base_of<String, T>::value ||
          std::is_base_of<Object, T>::value>>
  /* implicit */ Value(T&& other) : Value(kindOf(other)) {
    new (&data_.pointer) T(std::move(other));
  }

  /// Value("foo") will treat foo as a bool.  This makes doing that a
  /// compile error.
  template <typename T = void>
  Value(const char*) {
    static_assert(
        !std::is_same<void, T>::value,
        "Value cannot be constructed directly from const char*");
  }

  Value(Value&& other) noexcept;

  /// Copies a Symbol lvalue into a new JS value.
  Value(IRuntime& runtime, const Symbol& sym) : Value(SymbolKind) {
    new (&data_.pointer) Symbol(runtime.cloneSymbol(sym.ptr_));
  }

  /// Copies a BigInt lvalue into a new JS value.
  Value(IRuntime& runtime, const BigInt& bigint) : Value(BigIntKind) {
    new (&data_.pointer) BigInt(runtime.cloneBigInt(bigint.ptr_));
  }

  /// Copies a String lvalue into a new JS value.
  Value(IRuntime& runtime, const String& str) : Value(StringKind) {
    new (&data_.pointer) String(runtime.cloneString(str.ptr_));
  }

  /// Copies a Object lvalue into a new JS value.
  Value(IRuntime& runtime, const Object& obj) : Value(ObjectKind) {
    new (&data_.pointer) Object(runtime.cloneObject(obj.ptr_));
  }

  /// Creates a JS value from another Value lvalue.
  Value(IRuntime& runtime, const Value& value);

  /// Value(rt, "foo") will treat foo as a bool.  This makes doing
  /// that a compile error.
  template <typename T = void>
  Value(IRuntime&, const char*) {
    static_assert(
        !std::is_same<T, void>::value,
        "Value cannot be constructed directly from const char*");
  }

  ~Value();
  // \return the undefined \c Value.
  static Value undefined() {
    return Value();
  }

  // \return the null \c Value.
  static Value null() {
    return Value(nullptr);
  }

  // \return a \c Value created from a utf8-encoded JSON string.
  static Value
  createFromJsonUtf8(IRuntime& runtime, const uint8_t* json, size_t length) {
    return runtime.createValueFromJsonUtf8(json, length);
  }

  /// \return according to the Strict Equality Comparison algorithm, see:
  /// https://262.ecma-international.org/11.0/#sec-strict-equality-comparison
  static bool strictEquals(IRuntime& runtime, const Value& a, const Value& b);

  Value& operator=(Value&& other) noexcept {
    this->~Value();
    new (this) Value(std::move(other));
    return *this;
  }

  bool isUndefined() const {
    return kind_ == UndefinedKind;
  }

  bool isNull() const {
    return kind_ == NullKind;
  }

  bool isBool() const {
    return kind_ == BooleanKind;
  }

  bool isNumber() const {
    return kind_ == NumberKind;
  }

  bool isString() const {
    return kind_ == StringKind;
  }

  bool isBigInt() const {
    return kind_ == BigIntKind;
  }

  bool isSymbol() const {
    return kind_ == SymbolKind;
  }

  bool isObject() const {
    return kind_ == ObjectKind;
  }

  /// \returns true if `Number.isInteger(value)` returns true, false otherwise.
  bool isInteger() const {
    // 1. If number is an integral Number, return true.
    // 2. Return false.

    // The spec's definition of integral number:
    // When the term integer is used in this specification, it refers to a
    // mathematical value which is in the set of integers, unless otherwise
    // stated. When the term integral Number is used in this specification, it
    // refers to a finite Number value whose mathematical value is in the set of
    // integers.

    if (!isNumber()) {
      return false;
    }
    auto number = data_.number;
    if (!std::isfinite(number)) {
      return false;
    }
    return number == std::trunc(number);
  }

  /// \return the boolean value, or asserts if not a boolean.
  bool getBool() const {
    assert(isBool());
    return data_.boolean;
  }

  /// \return the boolean value, or throws JSIException if not a
  /// boolean.
  bool asBool() const;

  /// \return the number value, or asserts if not a number.
  double getNumber() const {
    assert(isNumber());
    return data_.number;
  }

  /// \return the number value, or throws JSIException if not a
  /// number.
  double asNumber() const;

  /// \return the Symbol value, or asserts if not a symbol.
  Symbol getSymbol(IRuntime& runtime) const& {
    assert(isSymbol());
    return Symbol(runtime.cloneSymbol(data_.pointer.ptr_));
  }

  /// \return the Symbol value, or asserts if not a symbol.
  /// Can be used on rvalue references to avoid cloning more symbols.
  Symbol getSymbol(IRuntime&) && {
    assert(isSymbol());
    auto ptr = data_.pointer.ptr_;
    data_.pointer.ptr_ = nullptr;
    return static_cast<Symbol>(ptr);
  }

  /// \return the Symbol value, or throws JSIException if not a
  /// symbol
  Symbol asSymbol(IRuntime& runtime) const&;
  Symbol asSymbol(IRuntime& runtime) &&;

  /// \return the BigInt value, or asserts if not a bigint.
  BigInt getBigInt(IRuntime& runtime) const& {
    assert(isBigInt());
    return BigInt(runtime.cloneBigInt(data_.pointer.ptr_));
  }

  /// \return the BigInt value, or asserts if not a bigint.
  /// Can be used on rvalue references to avoid cloning more bigints.
  BigInt getBigInt(IRuntime&) && {
    assert(isBigInt());
    auto ptr = data_.pointer.ptr_;
    data_.pointer.ptr_ = nullptr;
    return static_cast<BigInt>(ptr);
  }

  /// \return the BigInt value, or throws JSIException if not a
  /// bigint
  BigInt asBigInt(IRuntime& runtime) const&;
  BigInt asBigInt(IRuntime& runtime) &&;

  /// \return the String value, or asserts if not a string.
  String getString(IRuntime& runtime) const& {
    assert(isString());
    return String(runtime.cloneString(data_.pointer.ptr_));
  }

  /// \return the String value, or asserts if not a string.
  /// Can be used on rvalue references to avoid cloning more strings.
  String getString(IRuntime&) && {
    assert(isString());
    auto ptr = data_.pointer.ptr_;
    data_.pointer.ptr_ = nullptr;
    return static_cast<String>(ptr);
  }

  /// \return the String value, or throws JSIException if not a
  /// string.
  String asString(IRuntime& runtime) const&;
  String asString(IRuntime& runtime) &&;

  /// \return the Object value, or asserts if not an object.
  Object getObject(IRuntime& runtime) const& {
    assert(isObject());
    return Object(runtime.cloneObject(data_.pointer.ptr_));
  }

  /// \return the Object value, or asserts if not an object.
  /// Can be used on rvalue references to avoid cloning more objects.
  Object getObject(IRuntime&) && {
    assert(isObject());
    auto ptr = data_.pointer.ptr_;
    data_.pointer.ptr_ = nullptr;
    return static_cast<Object>(ptr);
  }

  /// \return the Object value, or throws JSIException if not an
  /// object.
  Object asObject(IRuntime& runtime) const&;
  Object asObject(IRuntime& runtime) &&;

  // \return a String like JS .toString() would do.
  String toString(IRuntime& runtime) const;

 private:
  friend class Runtime;

  enum ValueKind {
    UndefinedKind,
    NullKind,
    BooleanKind,
    NumberKind,
    SymbolKind,
    BigIntKind,
    StringKind,
    ObjectKind,
    PointerKind = SymbolKind,
  };

  union Data {
    // Value's ctor and dtor will manage the lifecycle of the contained Data.
    Data() {
      static_assert(
          sizeof(Data) == sizeof(uint64_t),
          "Value data should fit in a 64-bit register");
    }
    ~Data() {}

    // scalars
    bool boolean;
    double number;
    // pointers
    Pointer pointer; // Symbol, String, Object, Array, Function
  };

  Value(ValueKind kind) : kind_(kind) {}

  constexpr static ValueKind kindOf(const Symbol&) {
    return SymbolKind;
  }
  constexpr static ValueKind kindOf(const BigInt&) {
    return BigIntKind;
  }
  constexpr static ValueKind kindOf(const String&) {
    return StringKind;
  }
  constexpr static ValueKind kindOf(const Object&) {
    return ObjectKind;
  }

  ValueKind kind_;
  Data data_;

  // In the future: Value becomes NaN-boxed. See T40538354.
};

/// Not movable and not copyable RAII marker advising the underlying
/// JavaScript VM to track resources allocated since creation until
/// destruction so that they can be recycled eagerly when the Scope
/// goes out of scope instead of floating in the air until the next
/// garbage collection or any other delayed release occurs.
///
/// This API should be treated only as advice, implementations can
/// choose to ignore the fact that Scopes are created or destroyed.
///
/// This class is an exception to the rule allowing destructors to be
/// called without proper synchronization (see Runtime documentation).
/// The whole point of this class is to enable all sorts of clean ups
/// when the destructor is called and this proper synchronization is
/// required at that time.
///
/// Instances of this class are intended to be created as automatic stack
/// variables in which case destructor calls don't require any additional
/// locking, provided that the lock (if any) is managed with RAII helpers.
class JSI_EXPORT Scope {
 public:
  explicit Scope(IRuntime& rt) : rt_(rt), prv_(rt.pushScope()) {}
  ~Scope() {
    rt_.popScope(prv_);
  }

  Scope(const Scope&) = delete;
  Scope(Scope&&) = delete;

  Scope& operator=(const Scope&) = delete;
  Scope& operator=(Scope&&) = delete;

  template <typename F>
  static auto callInNewScope(IRuntime& rt, F f) -> decltype(f()) {
    Scope s(rt);
    return f();
  }

 private:
  IRuntime& rt_;
  Runtime::ScopeState* prv_;
};

/// Base class for jsi exceptions
class JSI_EXPORT JSIException : public std::exception {
 protected:
  JSIException() {}
  JSIException(std::string what) : what_(std::move(what)) {}

 public:
  JSIException(const JSIException&) = default;

  virtual const char* what() const noexcept override {
    return what_.c_str();
  }

  virtual ~JSIException() override;

 protected:
  std::string what_;
};

/// This exception will be thrown by API functions on errors not related to
/// JavaScript execution.
class JSI_EXPORT JSINativeException : public JSIException {
 public:
  JSINativeException(std::string what) : JSIException(std::move(what)) {}

  JSINativeException(const JSINativeException&) = default;

  virtual ~JSINativeException();
};

/// This exception will be thrown by API functions whenever a JS
/// operation causes an exception as described by the spec, or as
/// otherwise described.
class JSI_EXPORT JSError : public JSIException {
 public:
  /// Creates a JSError referring to provided \c value
  JSError(IRuntime& r, Value&& value);

  /// Creates a JSError referring to new \c Error instance capturing current
  /// JavaScript stack. The error message property is set to given \c message.
  JSError(IRuntime& rt, std::string message);

  /// Creates a JSError referring to new \c Error instance capturing current
  /// JavaScript stack. The error message property is set to given \c message.
  JSError(IRuntime& rt, const char* message)
      : JSError(rt, std::string(message)) {}

  /// Creates a JSError referring to a JavaScript Object having message and
  /// stack properties set to provided values.
  JSError(IRuntime& rt, std::string message, std::string stack);

  /// Creates a JSError referring to provided value and what string
  /// set to provided message.  This argument order is a bit weird,
  /// but necessary to avoid ambiguity with the above.
  JSError(std::string what, IRuntime& rt, Value&& value);

  /// Creates a JSError referring to the provided value, message and stack. This
  /// constructor does not take a Runtime parameter, and therefore cannot result
  /// in recursively invoking the JSError constructor.
  JSError(Value&& value, std::string message, std::string stack);

  /// Creates a JSError referring to new \c EvalError instance. The error
  /// message property is set to given \c message.
  static JSError createEvalError(IRuntime& rt, const std::string& message);

  /// Creates a JSError referring to new \c RangeError instance. The error
  /// message property is set to given \c message.
  static JSError createRangeError(IRuntime& rt, const std::string& message);

  /// Creates a JSError referring to new \c ReferenceError instance. The error
  /// message property is set to given \c message.
  static JSError createReferenceError(IRuntime& rt, const std::string& message);

  /// Creates a JSError referring to new \c SyntaxError instance. The error
  /// message property is set to given \c message.
  static JSError createSyntaxError(IRuntime& rt, const std::string& message);

  /// Creates a JSError referring to new \c TypeError instance. The error
  /// message property is set to given \c message.
  static JSError createTypeError(IRuntime& rt, const std::string& message);

  /// Creates a JSError referring to new \c URIError instance. The error
  /// message property is set to given \c message.
  static JSError createURIError(IRuntime& rt, const std::string& message);

  JSError(const JSError&) = default;

  virtual ~JSError();

  const std::string& getStack() const {
    return stack_;
  }

  const std::string& getMessage() const {
    return message_;
  }

  const jsi::Value& value() const {
    assert(value_);
    return *value_;
  }

 private:
  // This initializes the value_ member and does some other
  // validation, so it must be called by every branch through the
  // constructors.
  void setValue(IRuntime& rt, Value&& value);

  // This needs to be on the heap, because throw requires the object
  // be copyable, and Value is not.
  std::shared_ptr<jsi::Value> value_;
  std::string message_;
  std::string stack_;
};

/// Helper function to cast the object pointed to by \p ptr into an interface
/// specified by \c U. If cast is successful, return a pointer to the object
/// as a raw pointer of \c U. Otherwise, return nullptr.
/// The returned interface same lifetime as the object referenced by \p ptr.
template <typename U, typename T>
U* castInterface(T* ptr) {
  if (ptr) {
    return static_cast<U*>(ptr->castInterface(U::uuid));
  }
  return nullptr;
}

/// Helper function to cast the object managed by the shared_ptr \p ptr into an
/// interface specified by \c U. If the cast is successful, return a shared_ptr
/// of type \c U to the object. Otherwise, return an empty pointer.
/// The returned shared_ptr shares ownership of the object with \p ptr.
template <typename U, typename T>
std::shared_ptr<U> dynamicInterfaceCast(T&& ptr) {
  auto* p = ptr->castInterface(U::uuid);
  U* res = static_cast<U*>(p);
  if (res) {
    return std::shared_ptr<U>(std::forward<T>(ptr), res);
  }
  return nullptr;
}

} // namespace jsi
} // namespace facebook

#include <jsi/jsi-inl.h>
