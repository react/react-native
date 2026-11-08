/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeNodeApi.h"

#include <cassert>
#include <cstdio>
#include <string>

namespace facebook::react {

namespace {

// Node-API has no bridge from napi_value to jsi::Value, so the value crosses
// through a global property named after the env, removed straight after.
jsi::Value toJsiValue(jsi::Runtime& runtime, napi_env env, napi_value value) {
  char name[32];
  snprintf(name, sizeof(name), "RN$NodeApi_%p", static_cast<void*>(env));

  napi_value global = nullptr;
  [[maybe_unused]] napi_status status = napi_get_global(env, &global);
  assert(status == napi_ok);
  status = napi_set_named_property(env, global, name, value);
  assert(status == napi_ok);

  jsi::Value result = runtime.global().getProperty(runtime, name);

  napi_value key = nullptr;
  status = napi_create_string_utf8(env, name, NAPI_AUTO_LENGTH, &key);
  assert(status == napi_ok);
  [[maybe_unused]] bool deleted = false;
  status = napi_delete_property(env, global, key, &deleted);
  assert(status == napi_ok && deleted);
  return result;
}

// Takes the exception left pending on `env`, or creates an error from `status`
// if there is none.
napi_value takeLoadError(napi_env env, napi_status status) {
  napi_value error = nullptr;
  if (napi_get_and_clear_last_exception(env, &error) == napi_ok &&
      error != nullptr) {
    napi_valuetype type = napi_undefined;
    if (napi_typeof(env, error, &type) == napi_ok && type != napi_undefined) {
      return error;
    }
  }
  std::string message = "Node-API status " + std::to_string(status);
  napi_value messageValue = nullptr;
  [[maybe_unused]] napi_status createStatus = napi_create_string_utf8(
      env, message.c_str(), message.size(), &messageValue);
  assert(createStatus == napi_ok);
  createStatus = napi_create_error(env, nullptr, messageValue, &error);
  assert(createStatus == napi_ok);
  return error;
}

} // namespace

NativeNodeApi::NativeNodeApi(
    std::shared_ptr<NodeApiEngine> engine,
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeNodeApiCxxSpec(std::move(jsInvoker)), engine_(std::move(engine)) {
  // A dropped function implies the runtime, and every env it owns, is gone.
  host_ = NodeApiHost::create(
      [weakInvoker = std::weak_ptr(jsInvoker_)](std::function<void()>&& fn) {
        auto invoker = weakInvoker.lock();
        if (!invoker) {
          return false;
        }
        invoker->invokeAsync(std::move(fn));
        return true;
      });
  NodeApiHost::retainForProcessLifetime(host_);
}

void NativeNodeApi::dlopen(
    jsi::Runtime& runtime,
    jsi::Object module,
    jsi::String filename) {
  // Each load gets its own env, as in Node.
  napi_env env = engine_->createEnv(runtime, *host_);
  if (env == nullptr) {
    throw jsi::JSError(runtime, "Failed to create a Node-API environment");
  }

  napi_handle_scope scope = nullptr;
  [[maybe_unused]] napi_status status = napi_open_handle_scope(env, &scope);
  assert(status == napi_ok);

  napi_value exports = nullptr;
  std::string path = filename.utf8(runtime);
  status = engine_->loadAddon(env, path.c_str(), &exports);
  bool failed = status != napi_ok;
  jsi::Value result =
      toJsiValue(runtime, env, failed ? takeLoadError(env, status) : exports);

  [[maybe_unused]] napi_status closeStatus =
      napi_close_handle_scope(env, scope);
  assert(closeStatus == napi_ok);

  if (failed) {
    throw jsi::JSError(runtime, std::move(result));
  }
  module.setProperty(runtime, "exports", std::move(result));
}

} // namespace facebook::react
