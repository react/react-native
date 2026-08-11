/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <atomic>

#include <react/debug/flags.h>

namespace facebook::react {

/*
 * Represents an object which can be *sealed* (imperatively marked as
 * immutable).
 *
 * The `sealed` flag is tight to a particular instance of the class and resets
 * to `false` for all newly created (by copy-constructor, assignment operator
 * and so on) derivative objects.
 *
 * Why do we need this? In Fabric, some objects are semi-immutable
 * even if they are explicitly marked as `const`. It means that in some special
 * cases those objects can be const-casted-away and then mutated. That comes
 * from the fact that we share some object's life-cycle responsibilities with
 * React and the immutability is guaranteed by some logic split between
 * native and JavaScript worlds (which makes it impossible to fully use
 * immutability enforcement at a language level). To detect possible errors as
 * early as possible we additionally mark objects as *sealed* after some stages
 * and then enforce this at run-time.
 *
 * How to use:
 *   1. Inherit your class from `Sealable`.
 *   2. Call `ensureUnsealed()` in all cases where the object might be mutated:
 *      a. At the beginning of all *always* mutating `non-const` methods;
 *      b. Right before the place where actual mutation happens in all
 * *possible* mutating `non-const` methods; c. Right after performing
 * `const_cast`. (Optionally. This is not strictly necessary but might help
 * detect problems earlier.)
 *   3. Call `seal()` at some point from which any modifications
 *      must be prevented.
 */

#ifndef REACT_NATIVE_DEBUG

// Release-mode, production version
class Sealable {
 public:
  inline void seal() const {}
  inline bool getSealed() const {
    return true;
  }
  inline void ensureUnsealed() const {}
};

#else

// Debug version
class Sealable {
 public:
  Sealable();
  Sealable(const Sealable& other);
  Sealable(Sealable&& other) noexcept;
  ~Sealable() noexcept;
  Sealable& operator=(const Sealable& other);
  Sealable& operator=(Sealable&& other) noexcept;

  /*
   * Seals the object. This operation is irreversible;
   * the object cannot be "unsealed" after being sealed.
   */
  void seal() const;

  /*
   * Returns if the object already sealed or not.
   */
  bool getSealed() const;

  /*
   * Throws an exception if the object is sealed.
   * Call this from all non-`const` methods.
   */
  void ensureUnsealed() const;

 private:
  mutable std::atomic<bool> sealed_{false};
};

#endif

} // namespace facebook::react
