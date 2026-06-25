/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

template <typename T>
struct ConverterBase {
  ConverterBase() = default;
};

template <typename T>
struct Converter {};

template <>
struct Converter<int> : public ConverterBase<int> {
  using ConverterBase<int>::ConverterBase;
  void doSomething();
};

} // namespace test
