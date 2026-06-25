/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

template <typename T>
struct Strct {
  static const Strct<T> VALUE;
};

template <typename T>
const Strct<T> Strct<T>::VALUE = {};

} // namespace test
