/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <node_api.h>

namespace facebook::react {

class NodeApiHost;

/**
 * The parts of loading a Node-API addon that depend on the JavaScript engine's
 * embedder API.
 */
class NodeApiEngine {
 public:
  virtual ~NodeApiEngine() = default;

  /**
   * Creates a Node-API environment in `runtime`, owned by the runtime and
   * served by `host`.
   */
  virtual napi_env createEnv(jsi::Runtime &runtime, NodeApiHost &host) = 0;

  /**
   * Loads the addon at `filename` into `env` and returns its exports through
   * `result`. On failure, leaves an exception pending on `env`.
   */
  virtual napi_status loadAddon(napi_env env, const char *filename, napi_value *result) = 0;
};

} // namespace facebook::react
