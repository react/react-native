/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HermesNodeApiEngine.h"

#include <jsi/hermes-interfaces.h>
#include <napi/hermes_napi.h>
#include <react/nativemodule/nodeapi/NodeApiHost.h>

namespace facebook::react {

napi_env HermesNodeApiEngine::createEnv(
    jsi::Runtime& runtime,
    NodeApiHost& host) {
  auto* hermes = jsi::castInterface<hermes::IHermes>(&runtime);
  if (hermes == nullptr) {
    return nullptr;
  }
  if (hermesHost_ == nullptr) {
    // Leaked: Hermes reads the struct during runtime teardown, after this
    // engine is gone. The host is retained for the same reason.
    hermesHost_ = new hermes_napi_host{
        .post_work = &NodeApiHost::postWork,
        .cancel_work = &NodeApiHost::cancelWork,
        .post_task = &NodeApiHost::postTask,
        .data = &host,
        .uv_loop = nullptr,
        .fatal_exception = &NodeApiHost::fatalException,
        .ref_loop = nullptr,
        .unref_loop = nullptr,
    };
  }
  return hermes_napi_create_env(hermes->getVMRuntimeUnsafe(), hermesHost_);
}

napi_status HermesNodeApiEngine::loadAddon(
    napi_env env,
    const char* filename,
    napi_value* result) {
  return hermes_napi_load_module(env, filename, result);
}

} // namespace facebook::react
