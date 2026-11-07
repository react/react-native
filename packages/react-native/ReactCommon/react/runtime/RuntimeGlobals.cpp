/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeGlobals.h"

#include <jsi/JSIDynamic.h>

#include <memory>

namespace facebook::react {

void installRuntimeGlobals(
    jsi::Runtime& runtime,
    const folly::dynamic& globals) {
  auto global = runtime.global();
  for (const auto& entry : globals.items()) {
    global.setProperty(
        runtime,
        jsi::PropNameID::forUtf8(runtime, entry.first.getString()),
        jsi::valueFromDynamic(runtime, entry.second));
  }
}

ReactInstance::BindingsInstallFunc createRuntimeGlobalsInstaller(
    folly::dynamic globals,
    ReactInstance::BindingsInstallFunc additionalBindings) {
  return [globals = std::make_shared<const folly::dynamic>(std::move(globals)),
          additionalBindings =
              std::move(additionalBindings)](jsi::Runtime& runtime) {
    installRuntimeGlobals(runtime, *globals);
    if (additionalBindings) {
      additionalBindings(runtime);
    }
  };
}

} // namespace facebook::react
