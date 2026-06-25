/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <type_traits>

namespace test {

class Symbol {};
class BigInt {};
class String {};
class Object {};

struct Value {
  template <
      typename T,
      typename = std::enable_if_t<
          std::is_base_of<Symbol, T>::value || std::is_base_of<BigInt, T>::value || std::is_base_of<String, T>::value ||
          std::is_base_of<Object, T>::value>>
  /* implicit */ Value(T &&other)
  {
  }
};

} // namespace test
