/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkEmulationSession.h"

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include <jsinspector-modern/network/NetworkThrottler.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#endif

#include <cassert>
#include <mutex>
#include <utility>

namespace facebook::react {

#ifdef REACT_NATIVE_DEBUGGER_ENABLED

using jsinspector_modern::NetworkThrottler;

/**
 * Shared session state, kept alive by any in-flight throttler callback so a
 * release can never target a destroyed session.
 */
struct NetworkEmulationSession::State {
  explicit State(NetworkThrottler& throttler)
      : throttler(&throttler), token(throttler.createRecordToken()) {}

  NetworkThrottler* throttler;
  const uint64_t token;

  std::mutex mutex;
  int64_t byteDebt{0};
  std::chrono::steady_clock::time_point sendEnd{
      std::chrono::steady_clock::now()};
  bool pending{false};
  bool cancelled{false};
};

#else

struct NetworkEmulationSession::State {};

#endif

/* static */ bool NetworkEmulationSession::isActive() {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  if (!ReactNativeFeatureFlags::fuseboxNetworkThrottlingEnabled()) {
    return false;
  }
  auto& throttler = NetworkThrottler::getInstance();
  return throttler.isThrottling() || throttler.isOffline();
#else
  return false;
#endif
}

/* static */ bool NetworkEmulationSession::isOffline() {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  return ReactNativeFeatureFlags::fuseboxNetworkThrottlingEnabled() &&
      NetworkThrottler::getInstance().isOffline();
#else
  return false;
#endif
}

NetworkEmulationSession::NetworkEmulationSession() {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  state_ = std::make_shared<State>(NetworkThrottler::getInstance());
#endif
}

NetworkEmulationSession::NetworkEmulationSession(
    jsinspector_modern::NetworkThrottler& throttler) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  state_ = std::make_shared<State>(throttler);
#endif
}

NetworkEmulationSession::~NetworkEmulationSession() {
  cancel();
}

void NetworkEmulationSession::noteRequestSent() {
  noteRequestSentAt(std::chrono::steady_clock::now());
}

void NetworkEmulationSession::noteRequestSentAt(
    std::chrono::steady_clock::time_point sendEnd) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  if (state_ != nullptr) {
    std::lock_guard<std::mutex> lock(state_->mutex);
    state_->sendEnd = sendEnd;
  }
#else
  (void)sendEnd;
#endif
}

NetworkEmulationSession::Result NetworkEmulationSession::throttleHeaders(
    Callback callback) {
  return submit(0, true, std::move(callback));
}

NetworkEmulationSession::Result NetworkEmulationSession::throttleBody(
    int64_t bytesReceived,
    Callback callback) {
  return submit(bytesReceived, false, std::move(callback));
}

NetworkEmulationSession::Result NetworkEmulationSession::submit(
    int64_t bytes,
    bool isStart,
    Callback callback) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  if (state_ == nullptr) {
    return Result::PassThrough;
  }
  auto state = state_;

  int64_t cumulativeBytes = 0;
  std::chrono::steady_clock::time_point sendEnd;
  {
    std::lock_guard<std::mutex> lock(state->mutex);
    if (state->cancelled) {
      return Result::PassThrough;
    }
    assert(!state->pending && "Await the previous callback before submitting");
    if (state->pending) {
      return Result::PassThrough;
    }
    state->byteDebt += bytes;
    cumulativeBytes = state->byteDebt;
    sendEnd = state->sendEnd;
    // Set before startThrottle: the release may fire from the timer thread
    // before this function returns.
    state->pending = true;
  }

  auto result = state->throttler->startThrottle(
      state->token,
      cumulativeBytes,
      sendEnd,
      isStart,
      /* isUpload */ false,
      [state, callback = std::move(callback)](
          bool disconnected, int64_t newDebt) {
        {
          std::lock_guard<std::mutex> lock(state->mutex);
          state->pending = false;
          if (state->cancelled) {
            return;
          }
          // Carry the (negative) remainder into the next operation, so
          // quantization error does not accumulate.
          state->byteDebt = newDebt;
        }
        callback(disconnected);
      });

  switch (result) {
    case NetworkThrottler::StartResult::PassThrough: {
      std::lock_guard<std::mutex> lock(state->mutex);
      state->pending = false;
      return Result::PassThrough;
    }
    case NetworkThrottler::StartResult::Disconnected: {
      std::lock_guard<std::mutex> lock(state->mutex);
      state->pending = false;
      return Result::Disconnected;
    }
    case NetworkThrottler::StartResult::Pending:
      return Result::Pending;
  }
  return Result::PassThrough;
#else
  (void)bytes;
  (void)isStart;
  (void)callback;
  return Result::PassThrough;
#endif
}

int64_t NetworkEmulationSession::recommendedReadLength(int64_t bufLen) const {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  return state_ != nullptr ? state_->throttler->getReadBufLen(bufLen) : bufLen;
#else
  return bufLen;
#endif
}

void NetworkEmulationSession::cancel() {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED
  if (state_ == nullptr) {
    return;
  }
  {
    std::lock_guard<std::mutex> lock(state_->mutex);
    if (state_->cancelled) {
      return;
    }
    state_->cancelled = true;
  }
  state_->throttler->stopThrottle(state_->token);
#endif
}

} // namespace facebook::react
