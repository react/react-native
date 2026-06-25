/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

using MyType = int;

template <typename T>
T convert(T value);

template <>
MyType convert<MyType>(MyType value);

template <typename T>
void process(T *ptr);

template <>
void process<MyType>(MyType *ptr);

} // namespace test
