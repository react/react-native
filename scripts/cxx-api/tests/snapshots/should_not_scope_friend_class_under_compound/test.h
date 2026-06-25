/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

class ProviderRegistry;

class Registry {
 public:
  Registry(const ProviderRegistry &provider);
  bool hasItem(int handle) const;

 private:
  friend class ProviderRegistry;
};

class ProviderRegistry {};

} // namespace test
