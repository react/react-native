/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

namespace facebook::react {

/*
NOTE: we keep this internal copy of folly/MoveWrapper.h to unblock
the the workstream of dropping the dependency on folly in RN!

For a technical explanation on why we still need this we defer
to the doc in folly/Function.h:

"There are some limitations in std::function that folly::Function tries to
avoid. std::function is copy-constructible and requires that the callable that
it wraps is copy-constructible as well, which is a constraint that is often
inconvenient. In most cases when using a std::function you don't make use of
its copy-constructibility, so you might sometimes feel like you get back very
little in return for a noticeable restriction. This restriction becomes
apparent when trying to use a lambda capturing a unique_ptr (or any
non-copyable type) as a callback for a folly::Future.

std::unique_ptr<Foo> foo_ptr = new Foo;

some_future.then(
    [foo_ptr = std::move(foo_ptr)] mutable
    (int x)
    { foo_ptr->setX(x); }
);

This piece of code did not compile before folly::Future started using
folly::Function instead of std::function to store the callback. Because the
lambda captures something non-copyable (the unique_ptr), it is not copyable
itself. And std::function can only store copyable callables.

The implementation of folly::Future did not make use of the
copy-constructibility of std::function at any point. There was no benefit from
the fact that the std::function is copy-constructible, but the fact that it can
only wrap copy-constructible callables posed a restriction.

A workaround was available: folly::MoveWrapper, which wraps an object that may
be non-copyable and implements copy operations by moving the embedded object.
Using a folly::MoveWrapper, you can capture non-copyable objects in a lambda,
and the lambda itself is still copyable and may be wrapped in a std::function.
It is a pragmatic solution for the above problem, but you have to be a little
careful. The problem is that you can’t use a MoveWrapper anywhere where copy
operations are assumed to behave like actual copy operations. Also, a
folly::MoveWrapper<std::unique_ptr<T>> essentially behaves like auto_ptr<T>. Ask
yourself whether you’d want to use lots of auto_ptrs in your codebase. And the
original question still persists: we very often don’t benefit from
copy-constructibility of std::function, so why do we have to live with this
restriction? I.e. why do we have to use MoveWrapper?"
*/

/** C++11 closures don't support move-in capture. Nor does std::bind.
    facepalm.

    http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2013/n3610.html

    "[...] a work-around that should make people's stomach crawl:
    write a wrapper that performs move-on-copy, much like the deprecated
    auto_ptr"

    Unlike auto_ptr, this doesn't require a heap allocation.
    */
template <class T>
class MoveWrapper {
 public:
  /** If value can be default-constructed, why not?
      Then we don't have to move it in */
  MoveWrapper() = default;

  /// Move a value in.
  explicit MoveWrapper(T&& t) : value(std::move(t)) {}

  /// copy is move
  MoveWrapper(const MoveWrapper& other) : value(std::move(other.value)) {}

  /// move is also move
  MoveWrapper(MoveWrapper&& other) noexcept : value(std::move(other.value)) {}

  const T& operator*() const {
    return value;
  }
  T& operator*() {
    return value;
  }

  const T* operator->() const {
    return &value;
  }
  T* operator->() {
    return &value;
  }

  /// move the value out (sugar for std::move(*moveWrapper))
  T&& move() {
    return std::move(value);
  }

  // If you want these you're probably doing it wrong, though they'd be
  // easy enough to implement
  MoveWrapper& operator=(const MoveWrapper&) = delete;
  MoveWrapper& operator=(MoveWrapper&&) = delete;

 private:
  mutable T value;
};

/// Make a MoveWrapper from the argument. Because the name "makeMoveWrapper"
/// is already quite transparent in its intent, this will work for lvalues as
/// if you had wrapped them in std::move.
template <class T, class T0 = typename std::remove_reference<T>::type>
MoveWrapper<T0> makeMoveWrapper(T&& t) {
  return MoveWrapper<T0>(std::forward<T0>(t));
}

} // namespace facebook::react
