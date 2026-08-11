/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/TurboModule.h>

namespace facebook::react {

struct DefaultTurboModules {
  static std::shared_ptr<TurboModule> getTurboModule(
      const std::string& name,
      const std::shared_ptr<CallInvoker>& jsInvoker);
};

} // namespace facebook::react
