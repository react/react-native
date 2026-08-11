/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "TraceEvent.h"

#include <memory>
#include <optional>
#include <string>
#include <string_view>
#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/// Opaque class to represent the original runtime profile returned by the
/// Runtime. RuntimeSamplingProfile class is designed to be agnostic to the
/// Runtime where sampling occurred.
class RawRuntimeProfile {
 public:
  virtual ~RawRuntimeProfile() = default;
};

/// Contains relevant information about the sampled runtime from start to
/// finish.
struct RuntimeSamplingProfile {
 public:
  /// Represents a single frame inside the captured sample stack.
  struct SampleCallStackFrame {
   public:
    /// Represents type of frame inside of recorded call stack.
    enum class Kind {
      JSFunction, /// JavaScript function frame.
      NativeFunction, /// Native built-in functions, like arrayPrototypeMap.
      HostFunction, /// Native functions, defined by Host, a.k.a. Host
                    /// functions.
      GarbageCollector, /// Garbage collection frame.
    };

    inline bool operator==(const SampleCallStackFrame& rhs) const noexcept =
        default;

    /// type of the call stack frame
    Kind kind;
    /// id of the corresponding script in the VM.
    uint32_t scriptId;
    /// name of the function that represents call frame.
    /// Storing a std::string_view should be considered safe here, beacause
    /// the lifetime of the string contents are guaranteed as long as the raw
    // Sampling Profiler object from Hermes is allocated.
    std::string_view functionName;
    /// source url of the corresponding script in the VM.
    /// Storing a std::string_view should be considered safe here, beacause
    /// the lifetime of the string contents are guaranteed as long as the raw
    // Sampling Profiler object from Hermes is allocated.
    std::optional<std::string_view> scriptURL = std::nullopt;
    /// 0-based line number of the corresponding call frame.
    std::optional<uint32_t> lineNumber = std::nullopt;
    /// 0-based column number of the corresponding call frame.
    std::optional<uint32_t> columnNumber = std::nullopt;
  };

  /// A pair of a timestamp and a snapshot of the call stack at this point in
  /// time.
  struct Sample {
   public:
    Sample(
        uint64_t timestamp,
        ThreadId threadId,
        std::vector<SampleCallStackFrame> callStack)
        : timestamp(timestamp),
          threadId(threadId),
          callStack(std::move(callStack)) {}

    // Movable.
    Sample& operator=(Sample&&) = default;
    Sample(Sample&&) = default;

    // Not copyable.
    Sample(const Sample&) = delete;
    Sample& operator=(const Sample&) = delete;

    ~Sample() = default;

    /// When the call stack snapshot was taken (μs).
    uint64_t timestamp;
    /// Thread id where sample was recorded.
    ThreadId threadId;
    /// Snapshot of the call stack. The first element of the vector is
    /// the lowest frame in the stack.
    std::vector<SampleCallStackFrame> callStack;
  };

  RuntimeSamplingProfile(
      std::string runtimeName,
      ProcessId processId,
      std::vector<Sample> samples,
      std::unique_ptr<RawRuntimeProfile> rawRuntimeProfile)
      : runtimeName(std::move(runtimeName)),
        processId(processId),
        samples(std::move(samples)),
        rawRuntimeProfile(std::move(rawRuntimeProfile)) {}

  // Movable.
  RuntimeSamplingProfile& operator=(RuntimeSamplingProfile&&) = default;
  RuntimeSamplingProfile(RuntimeSamplingProfile&&) = default;

  // Not copyable.
  RuntimeSamplingProfile(const RuntimeSamplingProfile&) = delete;
  RuntimeSamplingProfile& operator=(const RuntimeSamplingProfile&) = delete;

  ~RuntimeSamplingProfile() = default;

  /// Name of the runtime, where sampling occurred: Hermes, V8, etc.
  std::string runtimeName;
  /// The ID of the OS-level process where the sampling occurred.
  ProcessId processId;
  /// List of recorded samples, should be chronologically sorted.
  std::vector<Sample> samples;
  /// A unique pointer to the original raw runtime profile, collected from the
  /// runtime in RuntimeTargetDelegate. Keeping a pointer to the original
  /// profile allows it to remain alive as long as RuntimeSamplingProfile is
  /// alive, since it may be using the same std::string_view.
  std::unique_ptr<RawRuntimeProfile> rawRuntimeProfile;
};

} // namespace facebook::react::jsinspector_modern::tracing
