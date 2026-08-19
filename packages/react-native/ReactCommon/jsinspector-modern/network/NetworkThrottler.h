/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "NetworkConditions.h"

#include <chrono>
#include <condition_variable>
#include <cstdint>
#include <functional>
#include <mutex>
#include <optional>
#include <thread>
#include <vector>

namespace facebook::react::jsinspector_modern {

/**
 * [Experimental] Simulated network throttling engine for CDP debugging.
 *
 * This is a port of Chrome's request-level throttling model
 * (`services/network/throttling/throttling_network_interceptor.cc`). Real
 * requests go out at full speed; the throttler delays the delivery of
 * already-received bytes to the consumer. Time is quantized into ticks of
 * one 1500-byte packet, with elapsed ticks divided equally, round-robin,
 * across all in-flight transfers. Latency is a minimum duration for the
 * response-headers stage, measured from when the request finished sending.
 */
class NetworkThrottler {
 public:
  using Clock = std::chrono::steady_clock;
  using TimePoint = Clock::time_point;
  using ClockFunction = std::function<TimePoint()>;

  /**
   * Callback invoked (from an arbitrary thread) when a pending throttled
   * operation is released.
   *
   * \param disconnected Whether the operation was failed by going offline.
   * The caller should fail the request with a platform "not connected" error
   * and latch the failure for the rest of the request.
   * \param bytes The remaining byte debt for the transaction, normally
   * negative. The caller must carry this value into the `bytes` argument of
   * its next `startThrottle` call for the same transaction, so quantization
   * error does not accumulate.
   */
  using ThrottleCallback = std::function<void(bool disconnected, int64_t bytes)>;

  /**
   * Synchronous result of `startThrottle`.
   */
  enum class StartResult {
    /** Not throttled. Deliver immediately; no callback will fire. */
    PassThrough,
    /** Offline. Fail the request immediately; no callback will fire. */
    Disconnected,
    /** Queued. The callback will fire when the operation is released. */
    Pending,
  };

  /** The throttling quantum: tick budget and read buffer cap, in bytes. */
  static constexpr int64_t kPacketSize = 1500;

  /**
   * Get the global throttler instance, backed by the real clock and an
   * internal timer thread (started lazily on first use).
   */
  static NetworkThrottler &getInstance();

  /**
   * Create a throttler with an injected clock and no timer thread, for
   * deterministic testing. Call `onTimerFired` manually to advance work.
   */
  explicit NetworkThrottler(ClockFunction clock);

  ~NetworkThrottler();
  NetworkThrottler(const NetworkThrottler &) = delete;
  NetworkThrottler &operator=(const NetworkThrottler &) = delete;

  /**
   * Replace the current network conditions. Accounting for in-flight records
   * is flushed under the old conditions first. If the new conditions are
   * offline or non-throttling, all queued and suspended records are finished
   * immediately (with `disconnected` = true if offline).
   */
  void updateConditions(const NetworkConditions &conditions);

  NetworkConditions getConditions() const;

  bool isOffline() const;

  /** Whether any throttling behavior is currently active. */
  bool isThrottling() const;

  /**
   * Create an opaque token identifying one pending throttled operation, for
   * use with `startThrottle`/`stopThrottle`.
   */
  uint64_t createRecordToken();

  /**
   * Submit an operation for throttling.
   *
   * \param token Identifies the operation (see `createRecordToken`).
   * \param bytes The transaction's cumulative outstanding byte debt: bytes
   * newly received plus any (negative) remainder carried from the previous
   * callback.
   * \param sendEnd The real time at which the request finished being sent.
   * Only meaningful when `isStart` is true.
   * \param isStart Whether this is the response-headers stage (subject to
   * the latency floor). Body reads must pass false.
   * \param isUpload Whether this operation counts against upload throughput.
   */
  StartResult startThrottle(
      uint64_t token,
      int64_t bytes,
      TimePoint sendEnd,
      bool isStart,
      bool isUpload,
      ThrottleCallback callback);

  /**
   * Remove any pending record for `token` without firing its callback. Call
   * on request cancellation or teardown.
   */
  void stopThrottle(uint64_t token);

  /**
   * Clamp a read buffer length to the packet size while download throttling
   * is active, so response bodies are delivered in packet-sized increments.
   */
  int64_t getReadBufLen(int64_t bufLen) const;

  /**
   * Process elapsed ticks and release any completed or unsuspended records.
   * Called by the internal timer thread; public for use in tests.
   */
  void onTimerFired();

  /**
   * The next scheduled timer deadline, if any. Exposed for tests.
   */
  std::optional<TimePoint> getTimerDeadlineForTest() const;

 private:
  struct ThrottleRecord {
    uint64_t token;
    int64_t bytes;
    TimePoint sendEnd;
    bool isUpload;
    ThrottleCallback callback;
  };

  /** Constructs the shared instance (real clock + timer thread). */
  NetworkThrottler();

  using PendingCallback = std::pair<ThrottleCallback, std::pair<bool, int64_t>>;

  int64_t updateThrottledRecords(
      TimePoint now,
      std::vector<ThrottleRecord> &records,
      int64_t lastTick,
      double tickLengthSeconds);
  void updateSuspended(TimePoint now);
  void collectFinished(std::vector<ThrottleRecord> &records, std::vector<PendingCallback> &callbacks);
  void updateTickAccounting(TimePoint now, std::vector<PendingCallback> &callbacks);
  TimePoint calculateDesiredTime(const std::vector<ThrottleRecord> &records, int64_t lastTick, double tickLengthSeconds)
      const;
  void armTimer(TimePoint now);
  void timerThreadLoop();
  void firePendingCallbacks(std::vector<PendingCallback> &callbacks);
  static double tickLengthSeconds(double throughputBps);

  ClockFunction clock_;
  bool useTimerThread_{false};

  mutable std::mutex mutex_;
  NetworkConditions conditions_{};
  TimePoint offset_{};
  std::vector<ThrottleRecord> download_{};
  std::vector<ThrottleRecord> upload_{};
  std::vector<ThrottleRecord> suspended_{};
  int64_t downloadLastTick_{0};
  int64_t uploadLastTick_{0};
  double downloadTickLength_{0};
  double uploadTickLength_{0};
  uint64_t nextToken_{1};

  std::optional<TimePoint> timerDeadline_{};
  std::condition_variable timerCv_;
  std::thread timerThread_;
  bool shutdown_{false};
};

} // namespace facebook::react::jsinspector_modern
