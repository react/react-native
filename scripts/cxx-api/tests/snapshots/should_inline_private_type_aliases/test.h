/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

template <typename... ArgumentT>
class Clss {
  using T = void(ArgumentT...);
  typedef int MyType;
  typedef void (*MyFunction)(MyType);

 public:
  void test1(std::function<T> &&function);
  void test2(MyType val) const;
  void test3(MyFunction val) const;
};

} // namespace test
