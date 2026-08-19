/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>
#include <cstdint>
#include <functional>
#include <memory>

namespace facebook::react {

namespace jsinspector_modern {
class NetworkThrottler;
}

/**
 * [Experimental] Per-request participation in simulated network conditions
 * (`Network.emulateNetworkConditions`) for CDP debugging.
 *
 * This is the supported integration point for networking stacks, including
 * third-party replacements for React Native's networking modules. Create one
 * session per request when `isActive()`, then gate delivery of the response
 * to the consumer on this session:
 *
 * 1. Fail new requests without touching the network when `isOffline()`.
 * 2. Call `noteRequestSent` when the request has been sent.
 * 3. Gate delivery of response headers on `throttleHeaders`.
 * 4. Gate delivery of each body chunk (sized via `recommendedReadLength`) on
 *    `throttleBody`.
 * 5. Report the request's CDP events (`NetworkReporter`) only after each
 *    delivery is released, so the DevTools waterfall reflects the emulated
 *    timings.
 *
 * The session encapsulates the throttling engine's bookkeeping (byte debt
 * carried across reads, and the one-outstanding-operation-per-request
 * invariant: await each callback before submitting the next operation).
 *
 * Thread safety: methods may be called from any thread. Callbacks are
 * invoked from an arbitrary thread; once `cancel()` has been called, no
 * further callbacks begin.
 *
 * In a production (non dev or profiling) build, emulation is never active
 * and all operations pass through.
 */
class NetworkEmulationSession {
 public:
  /**
   * Whether requests should currently be routed through an emulation
   * session: requires the `fuseboxNetworkThrottlingEnabled` feature flag and
   * active emulated network conditions.
   */
  static bool isActive();

  /**
   * Whether offline emulation is active (implies `isActive()`). Callers
   * should fail new requests with a platform "not connected" error without
   * touching the network.
   */
  static bool isOffline();

  /**
   * The result of submitting an operation for throttling.
   */
  enum class Result {
    /** Not throttled. Deliver immediately; the callback will not be called. */
    PassThrough,
    /**
     * Failed by offline emulation. Fail the request and stop submitting
     * operations; the callback will not be called.
     */
    Disconnected,
    /** Queued. The callback fires when delivery is released. */
    Pending,
  };

  /**
   * Callback invoked (from an arbitrary thread) when a pending operation is
   * released. `disconnected` is true if the operation was failed by going
   * offline; treat it as `Result::Disconnected`.
   */
  using Callback = std::function<void(bool disconnected)>;

  NetworkEmulationSession();
  ~NetworkEmulationSession();
  NetworkEmulationSession(const NetworkEmulationSession &) = delete;
  NetworkEmulationSession &operator=(const NetworkEmulationSession &) = delete;

  /**
   * Record that the request has finished being sent. The emulated latency
   * floor for the response-headers stage is measured from this point.
   */
  void noteRequestSent();

  /**
   * Variant of `noteRequestSent` accepting the real send-end time, when the
   * platform networking stack can provide it retrospectively.
   */
  void noteRequestSentAt(std::chrono::steady_clock::time_point sendEnd);

  /**
   * Submit the response-headers stage, subject to the emulated latency
   * floor.
   */
  Result throttleHeaders(Callback callback);

  /**
   * Submit received body bytes, subject to download throughput emulation.
   * Deliver the bytes to the consumer only once released.
   */
  Result throttleBody(int64_t bytesReceived, Callback callback);

  /**
   * Clamp a read (or delivery chunk) length while download throttling is
   * active, so response bodies progress in packet-sized increments.
   */
  int64_t recommendedReadLength(int64_t bufLen) const;

  /**
   * Cancel the session on request teardown. Any pending operation is
   * removed and no further callbacks are invoked. Implied by destruction.
   */
  void cancel();

 private:
  friend class NetworkEmulationSessionTest;

  /** Test-only constructor binding to a specific throttling engine. */
  explicit NetworkEmulationSession(jsinspector_modern::NetworkThrottler &throttler);

  Result submit(int64_t bytes, bool isStart, Callback callback);

  struct State;
  std::shared_ptr<State> state_;
};

} // namespace facebook::react
