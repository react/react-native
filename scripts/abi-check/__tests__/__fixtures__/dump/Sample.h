/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react {

enum Implicit {
  First,
  /// Documented, so clang adds a comment node.
  Second [[deprecated]],
  Fifth = 4,
  Sixth,
};

enum class Fixed : unsigned char { Low = 1, High = Low + 200 };

enum class Signed : int { Negative = -3, Next };

enum class Wide : unsigned long long { Max = 0xffffffffffffffffull };

struct Holder {
  enum { Unnamed = 7 };
  int value;
};

template <typename T>
struct Dependent {
  enum Size { Value = sizeof(T) };
};

class ProtectedDestructor {
 public:
  virtual void run();

 protected:
  virtual ~ProtectedDestructor();
};

class NonVirtualProtectedDestructor {
 public:
  virtual void install();

 protected:
  ~NonVirtualProtectedDestructor();
};

struct Interface {
  virtual void run() = 0;
};

struct Overrider : Interface {
  void run() override;
};

struct DeletedDestructor {
  virtual ~DeletedDestructor() = delete;
  virtual void run();
};

struct Overloaded {
  virtual void set(int value);
  virtual void set(double value);
};

class PrivateVirtual {
 public:
  ~PrivateVirtual();

 private:
  virtual void hook();
};

struct VirtualDestructorBase {
  virtual ~VirtualDestructorBase();
};

struct InheritsVirtualDestructor : VirtualDestructorBase {};

} // namespace facebook::react

namespace other {

enum Outside { Value };

} // namespace other
