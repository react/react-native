/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

class Clss {
  struct PrivateStruct {
    int a;
  };

 public:
  void hello();
};

} // namespace test
