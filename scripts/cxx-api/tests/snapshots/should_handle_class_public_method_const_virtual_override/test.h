/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

class Clss {
 public:
  Clss();
  virtual ~Clss();

  int fn();
  const int constFn();
  const int testFnConst() const;

  virtual int virtualFn();
  virtual const int constVirtualFn();
  virtual const int testVirtualFnConst() const;

  int overrideFn() override;
  const int constOverrideFn() override;
  const int testOverrideFnConst() const override;
};

} // namespace test
