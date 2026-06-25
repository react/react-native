/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

struct MyType {};

template <typename T>
inline constexpr T default_value = T{};

template <>
inline constexpr MyType default_value<MyType> = MyType{};

template <typename T>
inline T *null_ptr = nullptr;

template <>
inline MyType *null_ptr<MyType> = nullptr;

} // namespace test
