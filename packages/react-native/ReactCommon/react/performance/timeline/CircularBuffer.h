/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <functional>
#include <vector>

namespace facebook::react {

/**
 * A container for storing entries of type T, with the following properties:
 * - It can only grow up to a specified max size
 * - It's a circular buffer (the oldest elements are dropped if reached max
 * size and adding a new element)
 *
 * Note that the space for maxSize elements is reserved on construction. This
 * ensures that pointers to elements remain stable across add() operations.
 */
template <class T>
class CircularBuffer {
 public:
  explicit CircularBuffer(size_t maxSize) : maxSize_(maxSize) {
    entries_.reserve(maxSize_);
  }

  /**
   * Adds (pushes) element into the buffer.
   *
   * Returns the result of the operation, which will depend on whether the
   * buffer reached the max allowed size, in which case `true` is returned. If
   * no items were overridden `false` is returned.
   */
  bool add(const T& el) {
    if (entries_.size() < maxSize_) {
      // Haven't reached max buffer size yet, just add and grow the buffer
      entries_.emplace_back(el);
      return false;
    } else {
      // Overwrite the oldest (but already consumed) element in the buffer
      entries_[position_] = el;
      position_ = (position_ + 1) % entries_.size();
      return true;
    }
  }

  T& operator[](size_t idx) {
    return entries_[(position_ + idx) % entries_.size()];
  }

  size_t size() const {
    return entries_.size();
  }

  void clear() {
    entries_.clear();
    position_ = 0;
  }

  /**
   * Clears buffer entries by predicate
   */
  void clear(std::function<bool(const T&)> predicate) {
    std::vector<T> entries;

    entries.reserve(maxSize_);
    for (size_t i = 0; i < entries_.size(); i++) {
      T& el = entries_[(i + position_) % entries_.size()];
      if (predicate(el)) {
        continue;
      }

      entries.push_back(std::move(el));
    }

    position_ = 0;
    entries.swap(entries_);
  }

  /**
   * Retrieves buffer entries, whether consumed or not
   */
  std::vector<T> getEntries() const {
    std::vector<T> res;
    getEntries(res);
    return res;
  }

  /**
   * Retrieves buffer entries, whether consumed or not, with predicate
   */
  std::vector<T> getEntries(std::function<bool(const T&)> predicate) const {
    std::vector<T> res;
    getEntries(res, predicate);
    return res;
  }

  void getEntries(std::vector<T>& res) const {
    const size_t oldSize = res.size();
    res.resize(oldSize + entries_.size());
    std::copy(
        entries_.begin() + position_, entries_.end(), res.begin() + oldSize);
    std::copy(
        entries_.begin(),
        entries_.begin() + position_,
        res.begin() + oldSize + entries_.size() - position_);
  }

  void getEntries(std::vector<T>& res, std::function<bool(const T&)> predicate)
      const {
    for (size_t i = 0; i < entries_.size(); i++) {
      const T& el = entries_[(i + position_) % entries_.size()];
      if (predicate(el)) {
        res.push_back(el);
      }
    }
  }

 private:
  std::vector<T> entries_;
  const size_t maxSize_;

  // Current starting position in the circular buffer:
  size_t position_{0};
};

} // namespace facebook::react
