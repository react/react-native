/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <node_api.h>

#include <functional>
#include <memory>

namespace facebook::react {

/**
 * The host integration a Node-API engine needs from React Native: a worker
 * pool for napi_queue_async_work, dispatch onto the JS thread for thread-safe
 * functions, and handling of napi_fatal_exception. The callbacks have C
 * signatures so an engine adapter can hand them to its embedder API, passing
 * the host as their `data`.
 *
 * One instance exists per React Native runtime.
 */
class NodeApiHost : public std::enable_shared_from_this<NodeApiHost> {
 public:
  /**
   * Dispatches a function onto the JS thread, returning whether it was
   * accepted. Must be callable from any thread, must never run the function
   * inline, and must deliver accepted functions in order. Returning false is
   * only acceptable once the runtime is gone.
   */
  using JsDispatcher = std::function<bool(std::function<void()> &&)>;

  static std::shared_ptr<NodeApiHost> create(JsDispatcher dispatchToJs);

  /**
   * Engines may read the host after the last env cleanup hook has run, so no
   * hook can tell when a host is no longer used.
   */
  static void retainForProcessLifetime(std::shared_ptr<NodeApiHost> host);

  bool dispatchToJs(std::function<void()> &&fn)
  {
    return dispatchToJs_(std::move(fn));
  }

  static void postWork(
      void *data,
      void *workData,
      void (*execute)(void *workData),
      void (*complete)(void *workData, napi_status status)) noexcept;
  static bool cancelWork(void *data, void *workData) noexcept;
  static void postTask(void *data, void *taskData, void (*callback)(void *taskData)) noexcept;
  static void fatalException(void *data, napi_env env, napi_value error) noexcept;

  // The callbacks cast `data` back to the host, so it must not be copied.
  NodeApiHost(const NodeApiHost &) = delete;
  NodeApiHost &operator=(const NodeApiHost &) = delete;

 private:
  explicit NodeApiHost(JsDispatcher dispatchToJs);

  JsDispatcher dispatchToJs_;
  bool inFatalException_ = false;
};

} // namespace facebook::react
