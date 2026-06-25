/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

struct Event {
  enum Type {
    NodeAllocation,
    NodeDeallocation,
  };

  template <Type E>
  struct TypedData {};
};

template <>
struct Event::TypedData<Event::NodeAllocation> {
  int config;
};

template <>
struct Event::TypedData<Event::NodeDeallocation> {
  int config;
};

} // namespace test
