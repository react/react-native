/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <list>
#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * A list that holds weak pointers to objects of type `T`. Null pointers are not
 * considered to be in the list.
 *
 * The list is not thread-safe! The caller is responsible for synchronization.
 */
template <typename T>
class WeakList {
 public:
  /**
   * Call the given function for every element in the list, ensuring the element
   * is not destroyed for the duration of the call. Elements are visited in the
   * order they were inserted.
   *
   * As a side effect, any null pointers in the underlying list (corresponding
   * to destroyed elements) will be removed during iteration.
   */
  template <typename Fn>
  void forEach(Fn &&fn)
  {
    for (auto it = ptrs_.begin(); it != ptrs_.end();) {
      if (auto ptr = it->lock()) {
        fn(*ptr);
        ++it;
      } else {
        it = ptrs_.erase(it);
      }
    }
  }

  /**
   * Call the given function for every element in the list, ensuring the element
   * is not destroyed for the duration of the call. Elements are visited in the
   * order they were inserted.
   *
   * As a side effect, any null pointers in the underlying list (corresponding
   * to destroyed elements) will be removed during iteration.
   */
  template <typename Fn>
  void forEach(Fn &&fn) const
  {
    for (auto it = ptrs_.cbegin(); it != ptrs_.cend();) {
      if (auto ptr = it->lock()) {
        fn(*ptr);
        ++it;
      } else {
        it = ptrs_.erase(it);
      }
    }
  }

  /**
   * Returns true if the given function returns true for any element in the
   * list, ensuring the element is not destroyed for the duration of the call.
   *
   * As a side effect, any null pointers in the underlying list (corresponding
   * to destroyed elements) will be removed during iteration.
   */
  template <typename Fn>
  bool anyOf(Fn &&fn)
  {
    bool found = false;
    forEach([&](auto &element) {
      if (!found && fn(element)) {
        found = true;
      }
    });
    return found;
  }

  /**
   * Returns true if the given function returns true for any element in the
   * list, ensuring the element is not destroyed for the duration of the call.
   *
   * As a side effect, any null pointers in the underlying list (corresponding
   * to destroyed elements) will be removed during iteration.
   */
  template <typename Fn>
  bool anyOf(Fn &&fn) const
  {
    bool found = false;
    forEach([&](const auto &element) {
      if (!found && fn(element)) {
        found = true;
      }
    });
    return found;
  }

  /**
   * Returns the number of (non-null) elements in the list. The count will only
   * remain accurate as long as the list is not modified and elements are
   * not destroyed.
   *
   * As a side effect, any null pointers in the underlying list (corresponding
   * to destroyed elements) will be removed during this method.
   */
  size_t size() const
  {
    size_t count{0};
    forEach([&count](const auto &) { ++count; });
    return count;
  }

  /**
   * Returns true if there are no elements in the list.
   *
   * As a side effect, any null pointers in the underlying list (corresponding
   * to destroyed elements) will be removed during this method.
   */
  bool empty() const
  {
    return !size();
  }

  /**
   * Inserts an element into the list.
   */
  void insert(std::weak_ptr<T> ptr)
  {
    ptrs_.push_back(ptr);
  }

 private:
  mutable std::list<std::weak_ptr<T>> ptrs_;
};

} // namespace facebook::react::jsinspector_modern
