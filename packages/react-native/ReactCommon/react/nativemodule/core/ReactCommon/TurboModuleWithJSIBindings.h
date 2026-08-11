/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

namespace facebook::react {

class TurboModule;

class TurboModuleWithJSIBindings {
 public:
  virtual ~TurboModuleWithJSIBindings() = default;

  static void installJSIBindings(
      const std::shared_ptr<TurboModule>& cxxModule,
      jsi::Runtime& runtime);

 private:
  virtual void installJSIBindingsWithRuntime(jsi::Runtime& runtime) = 0;
};

} // namespace facebook::react
