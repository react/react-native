/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <algorithm>
#include <functional>
#include <optional>
#include <vector>

#include <react/timing/primitives.h>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * The currentBufferStartTime_ is initialized once first element is pushed.
 */
constexpr HighResTimeStamp kCurrentBufferStartTimeUninitialized = HighResTimeStamp::min();

template <typename T>
class TimeWindowedBuffer {
 public:
  using TimestampAccessor = std::function<HighResTimeStamp(const T &)>;

  TimeWindowedBuffer() : timestampAccessor_(std::nullopt), windowSize_(std::nullopt) {}

  TimeWindowedBuffer(TimestampAccessor timestampAccessor, HighResDuration windowSize)
      : timestampAccessor_(std::move(timestampAccessor)), windowSize_(windowSize)
  {
  }

  void push(const T &element)
  {
    if (timestampAccessor_) {
      auto timestamp = (*timestampAccessor_)(element);
      enqueueElement(element, timestamp);
    } else {
      enqueueElement(element, HighResTimeStamp::now());
    }
  }

  void push(T &&element)
  {
    if (timestampAccessor_) {
      auto timestamp = (*timestampAccessor_)(element);
      enqueueElement(std::move(element), timestamp);
    } else {
      enqueueElement(std::move(element), HighResTimeStamp::now());
    }
  }

  void clear()
  {
    primaryBuffer_.clear();
    alternativeBuffer_.clear();
    currentBufferIndex_ = BufferIndex::Primary;
    currentBufferStartTime_ = kCurrentBufferStartTimeUninitialized;
  }

  /**
   * Forces immediate removal of elements that are outside the time window.
   * The right boundary of the window is the reference timestamp passed as an argument.
   */
  std::vector<T> pruneExpiredAndExtract(HighResTimeStamp windowRightBoundary = HighResTimeStamp::now())
  {
    std::vector<T> result;

    for (auto &wrappedElement : getPreviousBuffer()) {
      if (isInsideTimeWindow(wrappedElement, windowRightBoundary)) {
        result.push_back(std::move(wrappedElement.element));
      }
    }

    for (auto &wrappedElement : getCurrentBuffer()) {
      if (isInsideTimeWindow(wrappedElement, windowRightBoundary)) {
        result.push_back(std::move(wrappedElement.element));
      }
    }

    clear();
    return result;
  }

 private:
  enum class BufferIndex { Primary, Alternative };

  struct TimestampedElement {
    T element;
    HighResTimeStamp timestamp;
  };

  std::vector<TimestampedElement> &getCurrentBuffer()
  {
    return currentBufferIndex_ == BufferIndex::Primary ? primaryBuffer_ : alternativeBuffer_;
  }

  std::vector<TimestampedElement> &getPreviousBuffer()
  {
    return currentBufferIndex_ == BufferIndex::Primary ? alternativeBuffer_ : primaryBuffer_;
  }

  void enqueueElement(const T &element, HighResTimeStamp timestamp)
  {
    if (windowSize_) {
      if (currentBufferStartTime_ == kCurrentBufferStartTimeUninitialized) {
        currentBufferStartTime_ = timestamp;
      } else if (timestamp > currentBufferStartTime_ + *windowSize_) {
        // We moved past the current buffer. We need to switch the other buffer as current.
        currentBufferIndex_ =
            currentBufferIndex_ == BufferIndex::Primary ? BufferIndex::Alternative : BufferIndex::Primary;
        getCurrentBuffer().clear();
        currentBufferStartTime_ = timestamp;
      }
    }

    getCurrentBuffer().push_back({element, timestamp});
  }

  void enqueueElement(T &&element, HighResTimeStamp timestamp)
  {
    if (windowSize_) {
      if (currentBufferStartTime_ == kCurrentBufferStartTimeUninitialized) {
        currentBufferStartTime_ = timestamp;
      } else if (timestamp > currentBufferStartTime_ + *windowSize_) {
        // We moved past the current buffer. We need to switch the other buffer as current.
        currentBufferIndex_ =
            currentBufferIndex_ == BufferIndex::Primary ? BufferIndex::Alternative : BufferIndex::Primary;
        getCurrentBuffer().clear();
        currentBufferStartTime_ = timestamp;
      }
    }

    getCurrentBuffer().push_back({std::move(element), timestamp});
  }

  bool isInsideTimeWindow(const TimestampedElement &element, HighResTimeStamp windowRightBoundary) const
  {
    if (!windowSize_) {
      return true;
    }

    return element.timestamp >= windowRightBoundary - *windowSize_ && element.timestamp <= windowRightBoundary;
  }

  std::optional<TimestampAccessor> timestampAccessor_;
  std::optional<HighResDuration> windowSize_;

  std::vector<TimestampedElement> primaryBuffer_;
  std::vector<TimestampedElement> alternativeBuffer_;
  BufferIndex currentBufferIndex_ = BufferIndex::Primary;
  HighResTimeStamp currentBufferStartTime_{kCurrentBufferStartTimeUninitialized};
};

} // namespace facebook::react::jsinspector_modern::tracing
