/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

struct SHUnit;
struct SHRuntime;
using SHUnitCreator = SHUnit* (*)();
namespace hermes::vm {
class GCExecTrace;
class RuntimeConfig;
} // namespace hermes::vm

namespace facebook::hermes {

namespace sampling_profiler {
class Profile;
}

namespace debugger {
class Debugger;
}

/// IEventLoopControl is defined by the integrator to allow the Runtime to
/// schedule some task to be run when convenient, and to keep track of "Task
/// sources". After it is set to a Runtime, the integrator must ensure that the
/// `IEventLoopControl` instance outlives the Runtime. The IEventLoopControl
/// methods may be called by the Runtime from any thread, so they must be
/// thread-safe and cannot perform any VM operations.
struct IEventLoopControl {
  /// `scheduleTask` is a function used by the caller (the Runtime) to schedule
  /// some \p task. The scheduled task may perform VM operations. Thus, the
  /// integrator must only run the tasks when it had exclusive access to the
  /// Runtime.
  virtual void scheduleTask(const std::function<void()>& task) = 0;
  /// Used by the caller (the Runtime) to register a new source that can
  /// schedule new work via `scheduleTask`. This method return an uint64
  /// identifying the source registered. As an example, a WebWorker instance may
  /// schedule a message-processing task via `scheduleTask`, and thus is
  /// considered as a "task queue source". The Runtime may register each Worker
  /// using this method. This is useful for the integrator to keep track of
  /// active "sources".
  virtual uint64_t registerTaskQueueSource() = 0;
  /// Used by the caller to unregister a source when it is not allowed to invoke
  /// `scheduleTasks` anymore. The source is identified by \p sourceId, which is
  /// provided when the source was originally register in
  /// `registerTaskQueueSource`. As an example, after WebWorker instance is
  /// terminated, it will not schedule more tasks. The Runtime may unregister
  /// the Worker instance, and the integrator may exit the event-loop if there
  /// are no more active sources.
  virtual void unregisterTaskQueueSource(uint64_t sourceId) = 0;

 protected:
  ~IEventLoopControl() = default;
};

/// Interface for setting the IEventLoopControl in the Runtime.
struct JSI_EXPORT ISetEventLoopControl : public jsi::ICast {
 public:
  static constexpr jsi::UUID uuid{
      0x7b6902e6,
      0xfd38,
      0x11f0,
      0x8de9,
      0x0242ac120002};

  /// Configures the eventloop control mechanism using \p eventLoopControl.
  virtual void setEventLoopControl(IEventLoopControl* eventLoopControl) = 0;
  /// Retrieves the IEventLoopControl if it was set previously. Otherwise,
  /// return nullptr.
  virtual IEventLoopControl* getEventLoopControl() = 0;

 protected:
  ~ISetEventLoopControl() = default;
};

/// Integrator-provided interface used by the Worker implementation to load
/// worker scripts by URL and to configure/initialize worker runtimes. The
/// integrator implements this (deriving from jsi::ICast) and registers it via
/// ISetWorkerSetup. Hermes never takes ownership of it and never frees it.
/// Registering it on a runtime automatically propagates the same pointer to
/// every worker runtime spawned from that one (transitively), and each worker
/// thread captures it, so it must outlive that entire tree of workers -- i.e.
/// stay valid until every worker (direct or nested) has been terminated and its
/// thread joined -- not just the runtime it was registered on. Its methods may
/// be called from worker threads and must be thread-safe.
///
/// URL semantics live entirely here: Hermes has no notion of URL, Blob, or
/// fetch. `new Worker(url)` hands the URL string to resolveScript() and the
/// integrator decides what it means (file path, packager URL, custom scheme).
/// In particular, to support the standard web idiom
/// `new Worker(URL.createObjectURL(new Blob([...])))`, the *host* provides Blob
/// and URL.createObjectURL and backs `blob:` URLs with a resolveScript() that
/// looks up the object-URL registry. (`data:` URLs are the one scheme Hermes
/// can decode itself, opt-in via `new Worker(u, {allowData: true})`; everything
/// else is the integrator's responsibility.)
class JSI_EXPORT IWorkerSetup : public jsi::ICast {
 public:
  static constexpr jsi::UUID uuid{
      0xba59a683,
      0x17bd,
      0x40aa,
      0xa6b4,
      0xd1448db59983};

  /// Resolve \p url to worker script bytes, returned as an immutable
  /// jsi::Buffer holding either precompiled Hermes bytecode or UTF-8 source
  /// (the caller sniffs the magic number). The buffer may be memory-mapped or
  /// otherwise externally owned; for bytecode it is referenced (not copied) for
  /// the life of the worker runtime, so it must remain valid until the returned
  /// shared_ptr is released. On failure returns nullptr and sets \p error to a
  /// human-readable message. Called on the worker thread; must NOT perform
  /// operations on the worker runtime.
  virtual std::shared_ptr<const jsi::Buffer> resolveScript(
      const std::string& url,
      std::string& error) = 0;

  /// Run one-time JS setup in a freshly created worker runtime \p rt, after the
  /// standard extensions are installed and before the worker script runs.
  /// Called on the worker thread. May throw jsi::JSError (routed to onerror).
  virtual void initWorkerRuntime(jsi::Runtime& rt) = 0;

  /// Adjust the RuntimeConfig used to create a worker runtime. \p config is
  /// seeded with the Hermes default; the integrator may rebuild it in place
  /// (e.g. `config = config.rebuild().withGCConfig(...).build();`). Called on
  /// the constructor thread.
  virtual void configureWorkerRuntime(::hermes::vm::RuntimeConfig& config) = 0;

 protected:
  ~IWorkerSetup() = default;
};

/// Interface for registering an IWorkerSetup on a Runtime. The stored
/// pointer is opaque (jsi::ICast*) so additional provider capabilities can be
/// added later as new cast interfaces without changing this ABI.
struct JSI_EXPORT ISetWorkerSetup : public jsi::ICast {
 public:
  static constexpr jsi::UUID uuid{
      0xc0174a1d,
      0x73bd,
      0x494a,
      0xaa3c,
      0x007f7965e31f};

  /// Register \p provider. Must be called at most once, and before any Worker
  /// is created on this runtime. \p provider is propagated to every worker
  /// runtime created from this one (transitively) and captured by their worker
  /// threads, so it must outlive all of them (until each has terminated and
  /// joined); Hermes never frees it. Calling it more than once, or after a
  /// Worker has been created, throws a std::logic_error.
  virtual void setWorkerSetup(jsi::ICast* provider) = 0;

  /// Return the provider previously registered via setWorkerSetup, or
  /// nullptr. The result is an opaque jsi::ICast*; cast it to
  /// IWorkerSetup (or a future provider interface) with
  /// jsi::castInterface.
  virtual jsi::ICast* getWorkerSetup() = 0;

 protected:
  ~ISetWorkerSetup() = default;
};

/// Interface for Hermes-specific runtime methods.The actual implementations of
/// the pure virtual methods are provided by Hermes API.
class JSI_EXPORT IHermes : public jsi::ICast {
 public:
  static constexpr jsi::UUID uuid{
      0xe85cfa22,
      0xdfae,
      0x11ef,
      0xa6f7,
      0x325096b39f47};

  struct DebugFlags {
    // Looking for the .lazy flag? It's no longer necessary.
    // Source is evaluated lazily by default. See
    // RuntimeConfig::CompilationMode.
  };

  /// Evaluate the given code in an unoptimized form, used for debugging.
  /// This will be no-op if the implementation does not have debugger enabled.
  virtual void debugJavaScript(
      const std::string& src,
      const std::string& sourceURL,
      const DebugFlags& debugFlags) = 0;

  /// Return a ICast pointer to an object that be cast into the interface
  /// IHermesRootAPI. This root API object has static lifetime.
  virtual ICast* getHermesRootAPI() = 0;

  /// Dump sampled stack trace for a given runtime to a data structure that can
  /// be used by third parties.
  virtual sampling_profiler::Profile dumpSampledTraceToProfile() = 0;

  /// Serialize the sampled stack to the format expected by DevTools'
  /// Profiler.stop return type.
  virtual void sampledTraceToStreamInDevToolsFormat(std::ostream& stream) = 0;

  /// Resets the timezone offset cache used by Hermes for performance
  /// optimization. Hermes maintains a cached timezone offset to accelerate date
  /// and time calculations. However, this cache does not automatically detect
  /// changes to the system timezone. When the system timezone changes, the
  /// integration layer (e.g., React Native) must call this method to invalidate
  /// the cache and ensure correct time calculations.
  ///
  /// \note Call this method immediately after detecting any timezone change in
  /// the integrator.
  virtual void resetTimezoneCache() = 0;

  /// Load a new segment into the Runtime.
  /// The \param context must be a valid RequireContext retrieved from JS
  /// using `require.context`.
  virtual void loadSegment(
      std::unique_ptr<const jsi::Buffer> buffer,
      const jsi::Value& context) = 0;

  /// Gets a guaranteed unique id for an Object (or, respectively, String
  /// or PropNameId), which is assigned at allocation time and is
  /// static throughout that object's (or string's, or PropNameID's)
  /// lifetime.
  virtual uint64_t getUniqueID(const jsi::Object& o) const = 0;
  virtual uint64_t getUniqueID(const jsi::BigInt& s) const = 0;
  virtual uint64_t getUniqueID(const jsi::String& s) const = 0;
  virtual uint64_t getUniqueID(const jsi::PropNameID& pni) const = 0;
  virtual uint64_t getUniqueID(const jsi::Symbol& sym) const = 0;

  /// Same as the other \c getUniqueID, except it can return 0 for some values.
  /// 0 means there is no ID associated with the value.
  virtual uint64_t getUniqueID(const jsi::Value& val) const = 0;

  /// From an ID retrieved from \p getUniqueID, go back to the object.
  /// NOTE: This is much slower in general than the reverse operation, and takes
  /// up more memory. Don't use this unless it's absolutely necessary.
  /// \return a jsi::Object if a matching object is found, else returns null.
  virtual jsi::Value getObjectForID(uint64_t id) = 0;

  /// Get a structure representing the execution history (currently just of
  /// GC, but will be generalized as necessary), to aid in debugging
  /// non-deterministic execution.
  virtual const ::hermes::vm::GCExecTrace& getGCExecTrace() const = 0;

  /// Get IO tracking (aka HBC page access) info as a JSON string.
  /// See hermes::vm::Runtime::getIOTrackingInfoJSON() for conditions
  /// needed for there to be useful output.
  virtual std::string getIOTrackingInfoJSON() = 0;

  /// \return a reference to the Debugger for this Runtime.
  virtual debugger::Debugger& getDebugger() = 0;

  /// Register this runtime and thread for sampling profiler. Before using the
  /// runtime on another thread, invoke this function again from the new thread
  /// to make the sampling profiler target the new thread (and forget the old
  /// thread).
  virtual void registerForProfiling() = 0;
  /// Unregister this runtime for sampling profiler.
  virtual void unregisterForProfiling() = 0;

  /// Define methods to interrupt JS execution and set time limits.
  /// All JS compiled to bytecode via prepareJS, or evaluateJS, will support
  /// interruption and time limit monitoring if the runtime is configured with
  /// AsyncBreakCheckInEval. If JS prepared in other ways is executed, care must
  /// be taken to ensure that it is compiled in a mode that supports it (i.e.,
  /// the emitted code contains async break checks).

  /// Asynchronously terminates the current execution. This can be called on
  /// any thread.
  virtual void asyncTriggerTimeout() = 0;

  /// Register this runtime for execution time limit monitoring, with a time
  /// limit of \p timeoutInMs milliseconds.
  /// See compilation notes above.
  virtual void watchTimeLimit(uint32_t timeoutInMs) = 0;
  /// Unregister this runtime for execution time limit monitoring.
  virtual void unwatchTimeLimit() = 0;

  /// Same as \c evaluate JavaScript but with a source map, which will be
  /// applied to exception traces and debug information.
  ///
  /// This is an experimental Hermes-specific API. In the future it may be
  /// renamed, moved or combined with another API, but the provided
  /// functionality will continue to be available in some form.
  virtual jsi::Value evaluateJavaScriptWithSourceMap(
      const std::shared_ptr<const jsi::Buffer>& buffer,
      const std::shared_ptr<const jsi::Buffer>& sourceMapBuf,
      const std::string& sourceURL) = 0;

  /// Associate the SHUnit returned by \p shUnitCreator with this runtime and
  /// run its initialization code. The unit will be freed when the runtime is
  /// destroyed.
  virtual jsi::Value evaluateSHUnit(SHUnitCreator shUnitCreator) = 0;

  /// Retrieve the underlying SHRuntime.
  virtual SHRuntime* getSHRuntime() noexcept = 0;

  /// Returns the underlying low level Hermes VM runtime instance.
  /// This function is considered unsafe and unstable.
  /// Direct use of a vm::Runtime should be avoided as the lower level APIs are
  /// unsafe and they can change without notice.
  virtual void* getVMRuntimeUnsafe() const = 0;

 protected:
  ~IHermes() = default;
};

/// Interface for provide Hermes backend specific methods.
class IHermesSHUnit : public jsi::ICast {
 public:
  static constexpr jsi::UUID uuid{
      0x52a2d522,
      0xcbc6,
      0x4236,
      0x8d5d,
      0x2636c320ed65,
  };

  /// Get the unit creating function pointer which can be passed to
  /// evaluateSHUnit() for evaluation.
  virtual SHUnitCreator getSHUnitCreator() const = 0;

 protected:
  ~IHermesSHUnit() = default;
};
} // namespace facebook::hermes
