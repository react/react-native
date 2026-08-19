/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkThrottler.h"

#include <algorithm>
#include <cmath>
#include <utility>

namespace facebook::react::jsinspector_modern {

namespace {

using DoubleSeconds = std::chrono::duration<double>;
using DoubleMillis = std::chrono::duration<double, std::milli>;

NetworkThrottler::Clock::duration latencyDuration(
    const NetworkConditions& conditions) {
  return std::chrono::duration_cast<NetworkThrottler::Clock::duration>(
      DoubleMillis(std::max(0.0, conditions.latencyMs)));
}

} // namespace

/* static */ NetworkThrottler& NetworkThrottler::getInstance() {
  static NetworkThrottler instance;
  return instance;
}

NetworkThrottler::NetworkThrottler()
    : clock_(&Clock::now), useTimerThread_(true) {}

NetworkThrottler::NetworkThrottler(ClockFunction clock)
    : clock_(std::move(clock)), useTimerThread_(false) {}

NetworkThrottler::~NetworkThrottler() {
  {
    std::lock_guard<std::mutex> lock(mutex_);
    shutdown_ = true;
  }
  timerCv_.notify_all();
  if (timerThread_.joinable()) {
    timerThread_.join();
  }
}

/* static */ double NetworkThrottler::tickLengthSeconds(double throughputBps) {
  // 1 microsecond guards against division by zero; with no throughput limit,
  // records complete on the next timer fire.
  return throughputBps > 0 ? static_cast<double>(kPacketSize) / throughputBps
                           : 1e-6;
}

void NetworkThrottler::updateConditions(const NetworkConditions& conditions) {
  std::vector<PendingCallback> callbacks;
  {
    std::lock_guard<std::mutex> lock(mutex_);
    auto now = clock_();

    // Flush accounting under the old conditions
    updateTickAccounting(now, callbacks);

    // Normalize: negative values ("no limit" per CDP) are stored as 0
    conditions_ = NetworkConditions{
        .offline = conditions.offline,
        .latencyMs = std::max(0.0, conditions.latencyMs),
        .downloadThroughputBps =
            std::max(0.0, conditions.downloadThroughputBps),
        .uploadThroughputBps = std::max(0.0, conditions.uploadThroughputBps),
    };

    if (conditions_.offline || !conditions_.isThrottling()) {
      // Immediately finish all queued and suspended records, with the
      // disconnect error if going offline.
      for (auto* queue : {&download_, &upload_, &suspended_}) {
        for (auto& record : *queue) {
          callbacks.emplace_back(
              std::move(record.callback),
              std::make_pair(conditions_.offline, record.bytes));
        }
        queue->clear();
      }
      timerDeadline_.reset();
      timerCv_.notify_all();
    } else {
      offset_ = now;
      downloadLastTick_ = 0;
      uploadLastTick_ = 0;
      downloadTickLength_ =
          tickLengthSeconds(conditions_.downloadThroughputBps);
      uploadTickLength_ = tickLengthSeconds(conditions_.uploadThroughputBps);
      updateSuspended(now);
      collectFinished(download_, callbacks);
      collectFinished(upload_, callbacks);
      armTimer(now);
    }
  }
  firePendingCallbacks(callbacks);
}

NetworkConditions NetworkThrottler::getConditions() const {
  std::lock_guard<std::mutex> lock(mutex_);
  return conditions_;
}

bool NetworkThrottler::isOffline() const {
  std::lock_guard<std::mutex> lock(mutex_);
  return conditions_.offline;
}

bool NetworkThrottler::isThrottling() const {
  std::lock_guard<std::mutex> lock(mutex_);
  return conditions_.isThrottling();
}

uint64_t NetworkThrottler::createRecordToken() {
  std::lock_guard<std::mutex> lock(mutex_);
  return nextToken_++;
}

NetworkThrottler::StartResult NetworkThrottler::startThrottle(
    uint64_t token,
    int64_t bytes,
    TimePoint sendEnd,
    bool isStart,
    bool isUpload,
    ThrottleCallback callback) {
  std::vector<PendingCallback> callbacks;
  {
    std::lock_guard<std::mutex> lock(mutex_);
    auto now = clock_();

    if (conditions_.offline) {
      // Downloads fail with a "not connected" error; uploads pass through
      // with their real result.
      return isUpload ? StartResult::PassThrough : StartResult::Disconnected;
    }

    double throughput = isUpload ? conditions_.uploadThroughputBps
                                 : conditions_.downloadThroughputBps;

    if (isStart && conditions_.latencyMs > 0) {
      // Park until `latency` ms have elapsed since the request was actually
      // sent. updateTickAccounting below may release it immediately.
      suspended_.push_back(
          ThrottleRecord{token, bytes, sendEnd, isUpload, std::move(callback)});
      updateTickAccounting(now, callbacks);
    } else if (throughput > 0) {
      // Flush elapsed ticks first, so the new record gets no retroactive
      // byte budget.
      updateTickAccounting(now, callbacks);
      (isUpload ? upload_ : download_)
          .push_back(
              ThrottleRecord{
                  token, bytes, sendEnd, isUpload, std::move(callback)});
    } else {
      // No latency and no throughput for this direction and stage.
      return StartResult::PassThrough;
    }

    armTimer(now);
  }
  firePendingCallbacks(callbacks);
  return StartResult::Pending;
}

void NetworkThrottler::stopThrottle(uint64_t token) {
  std::lock_guard<std::mutex> lock(mutex_);
  for (auto* queue : {&download_, &upload_, &suspended_}) {
    queue->erase(
        std::remove_if(
            queue->begin(),
            queue->end(),
            [token](const ThrottleRecord& record) {
              return record.token == token;
            }),
        queue->end());
  }
  armTimer(clock_());
}

int64_t NetworkThrottler::getReadBufLen(int64_t bufLen) const {
  std::lock_guard<std::mutex> lock(mutex_);
  return conditions_.downloadThroughputBps > 0 ? std::min(bufLen, kPacketSize)
                                               : bufLen;
}

int64_t NetworkThrottler::updateThrottledRecords(
    TimePoint now,
    std::vector<ThrottleRecord>& records,
    int64_t lastTick,
    double tickLengthSeconds) {
  if (tickLengthSeconds <= 0) {
    return lastTick;
  }

  auto newTick = static_cast<int64_t>(
      std::floor(DoubleSeconds(now - offset_).count() / tickLengthSeconds));
  int64_t ticks = newTick - lastTick;

  auto n = static_cast<int64_t>(records.size());
  if (n == 0) {
    return newTick;
  }

  // Divide the elapsed ticks equally, round-robin, across every record.
  int64_t shift = ticks % n;
  for (int64_t i = 0; i < n; i++) {
    records[i].bytes -=
        (ticks / n) * kPacketSize + (i < shift ? kPacketSize : 0);
  }
  // Rotate so the remainder packets go to different records next time.
  std::rotate(records.begin(), records.begin() + shift, records.end());

  return newTick;
}

void NetworkThrottler::updateSuspended(TimePoint now) {
  if (conditions_.offline) {
    return;
  }

  TimePoint activationBaseline = now - latencyDuration(conditions_);
  std::vector<ThrottleRecord> stillSuspended;
  for (auto& record : suspended_) {
    if (record.sendEnd <= activationBaseline) {
      // Latency satisfied: release into the byte queue.
      (record.isUpload ? upload_ : download_).push_back(std::move(record));
    } else {
      stillSuspended.push_back(std::move(record));
    }
  }
  suspended_ = std::move(stillSuspended);
}

void NetworkThrottler::collectFinished(
    std::vector<ThrottleRecord>& records,
    std::vector<PendingCallback>& callbacks) {
  // A record is finished when its byte debt goes strictly below zero. The
  // negative remainder is passed back to be carried into the next operation.
  auto it = records.begin();
  while (it != records.end()) {
    if (it->bytes < 0) {
      callbacks.emplace_back(
          std::move(it->callback), std::make_pair(false, it->bytes));
      it = records.erase(it);
    } else {
      ++it;
    }
  }
}

void NetworkThrottler::updateTickAccounting(
    TimePoint now,
    std::vector<PendingCallback>& callbacks) {
  downloadLastTick_ = updateThrottledRecords(
      now, download_, downloadLastTick_, downloadTickLength_);
  uploadLastTick_ =
      updateThrottledRecords(now, upload_, uploadLastTick_, uploadTickLength_);
  updateSuspended(now);
  collectFinished(download_, callbacks);
  collectFinished(upload_, callbacks);
}

NetworkThrottler::TimePoint NetworkThrottler::calculateDesiredTime(
    const std::vector<ThrottleRecord>& records,
    int64_t lastTick,
    double tickLengthSeconds) const {
  int64_t minTicksLeft = INT64_MAX;
  auto n = static_cast<int64_t>(records.size());
  for (int64_t i = 0; i < n; i++) {
    auto packetsLeft = static_cast<int64_t>(
        std::ceil(static_cast<double>(records[i].bytes) / kPacketSize));
    int64_t ticksLeft = (i + 1) + n * (packetsLeft - 1);
    minTicksLeft = std::min(minTicksLeft, ticksLeft);
  }
  // At least one further tick must elapse before any record can go strictly
  // negative; this also prevents scheduling in the past.
  minTicksLeft = std::max<int64_t>(minTicksLeft, 1);
  return offset_ +
      std::chrono::duration_cast<Clock::duration>(DoubleSeconds(
          static_cast<double>(lastTick + minTicksLeft) * tickLengthSeconds));
}

void NetworkThrottler::armTimer(TimePoint now) {
  TimePoint desired = TimePoint::max();
  if (!download_.empty()) {
    desired = std::min(
        desired,
        calculateDesiredTime(
            download_, downloadLastTick_, downloadTickLength_));
  }
  if (!upload_.empty()) {
    desired = std::min(
        desired,
        calculateDesiredTime(upload_, uploadLastTick_, uploadTickLength_));
  }
  for (const auto& record : suspended_) {
    desired = std::min(desired, record.sendEnd + latencyDuration(conditions_));
  }

  if (desired == TimePoint::max()) {
    timerDeadline_.reset();
    return;
  }

  timerDeadline_ = std::max(desired, now);
  if (useTimerThread_ && !timerThread_.joinable()) {
    // Lazily start the timer thread on first use, so no thread is created
    // unless throttling is actually engaged.
    timerThread_ = std::thread([this] { timerThreadLoop(); });
  }
  timerCv_.notify_all();
}

void NetworkThrottler::timerThreadLoop() {
  std::unique_lock<std::mutex> lock(mutex_);
  while (!shutdown_) {
    if (!timerDeadline_) {
      timerCv_.wait(lock);
      continue;
    }
    auto deadline = *timerDeadline_;
    if (Clock::now() < deadline) {
      timerCv_.wait_until(lock, deadline);
      // Re-evaluate: the deadline may have moved, or shutdown requested.
      continue;
    }
    timerDeadline_.reset();
    std::vector<PendingCallback> callbacks;
    auto now = clock_();
    updateTickAccounting(now, callbacks);
    armTimer(now);
    lock.unlock();
    firePendingCallbacks(callbacks);
    lock.lock();
  }
}

void NetworkThrottler::onTimerFired() {
  std::vector<PendingCallback> callbacks;
  {
    std::lock_guard<std::mutex> lock(mutex_);
    auto now = clock_();
    timerDeadline_.reset();
    updateTickAccounting(now, callbacks);
    armTimer(now);
  }
  firePendingCallbacks(callbacks);
}

std::optional<NetworkThrottler::TimePoint>
NetworkThrottler::getTimerDeadlineForTest() const {
  std::lock_guard<std::mutex> lock(mutex_);
  return timerDeadline_;
}

void NetworkThrottler::firePendingCallbacks(
    std::vector<PendingCallback>& callbacks) {
  for (auto& [callback, result] : callbacks) {
    callback(result.first, result.second);
  }
}

} // namespace facebook::react::jsinspector_modern
