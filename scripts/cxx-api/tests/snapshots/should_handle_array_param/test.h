/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

struct PropNameID {};

struct Node {
  template <size_t N>
  static std::vector<PropNameID> names(PropNameID (&&propertyNames)[N]);

  void setArray(int (&arr)[10]);
};

} // namespace test
