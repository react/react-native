/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/nativemodule/nodeapi/NodeApiEngine.h>

struct hermes_napi_host;

namespace facebook::react {

class HermesNodeApiEngine : public NodeApiEngine {
 public:
  napi_env createEnv(jsi::Runtime &runtime, NodeApiHost &host) override;
  napi_status loadAddon(napi_env env, const char *filename, napi_value *result) override;

 private:
  hermes_napi_host *hermesHost_ = nullptr;
};

} // namespace facebook::react
