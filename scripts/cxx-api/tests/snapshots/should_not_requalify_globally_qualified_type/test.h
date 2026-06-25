/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {
namespace inner {

struct MyType {
  int value;
};

} // namespace inner
} // namespace test

namespace other {

struct Consumer {
  void process(const ::test::inner::MyType &param);
  void processPtr(::test::inner::MyType *param);
  ::test::inner::MyType create();
};

} // namespace other
