/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NodeApiHost.h"

#include <logger/react_native_log.h>

#include <condition_variable>
#include <deque>
#include <mutex>
#include <optional>
#include <string>
#include <thread>
#include <vector>

namespace facebook::react {

namespace {

struct WorkItem {
  // Matched together with workData on cancellation, since a freed
  // napi_async_work address can be reused by another runtime's env.
  void* data = nullptr;
  std::shared_ptr<NodeApiHost> host;
  void* workData = nullptr;
  void (*execute)(void* workData) = nullptr;
  void (*complete)(void* workData, napi_status status) = nullptr;
};

class WorkerPool {
 public:
  static WorkerPool& instance() {
    // Leaked with detached threads, like libuv's thread pool: it outlives
    // every runtime and has no safe point to be joined.
    static auto* pool = new WorkerPool();
    return *pool;
  }

  void enqueue(WorkItem&& item) {
    {
      std::lock_guard lock(mutex_);
      for (const WorkItem& queued : queue_) {
        if (queued.data == item.data && queued.workData == item.workData) {
          // Queueing the same work twice would complete it twice, and the
          // second completion would follow napi_delete_async_work.
          react_native_log_warn(
              "Node-API: dropping napi_async_work that is already queued");
          return;
        }
      }
      queue_.push_back(std::move(item));
    }
    cv_.notify_one();
  }

  bool tryRemove(void* data, void* workData, WorkItem& result) {
    std::lock_guard lock(mutex_);
    for (auto it = queue_.begin(); it != queue_.end(); ++it) {
      if (it->data == data && it->workData == workData) {
        result = std::move(*it);
        queue_.erase(it);
        return true;
      }
    }
    return false;
  }

 private:
  // libuv's default thread pool size.
  static constexpr size_t kThreadCount = 4;

  WorkerPool() {
    for (size_t i = 0; i < kThreadCount; i++) {
      std::thread([this] { workerMain(); }).detach();
    }
  }

  [[noreturn]] void workerMain() {
    for (;;) {
      WorkItem item;
      {
        std::unique_lock lock(mutex_);
        cv_.wait(lock, [this] { return !queue_.empty(); });
        item = std::move(queue_.front());
        queue_.pop_front();
      }
      item.execute(item.workData);
      bool accepted = item.host->dispatchToJs(
          [workData = item.workData, complete = item.complete] {
            complete(workData, napi_ok);
          });
      if (!accepted) {
        react_native_log_warn(
            "Node-API: dropping an async work completion posted after runtime teardown");
      }
    }
  }

  std::mutex mutex_;
  std::condition_variable cv_;
  std::deque<WorkItem> queue_;
};

std::optional<std::string> stringValue(napi_env env, napi_value value) {
  size_t length = 0;
  if (napi_get_value_string_utf8(env, value, nullptr, 0, &length) != napi_ok) {
    return std::nullopt;
  }
  std::string result(length, '\0');
  if (napi_get_value_string_utf8(
          env, value, result.data(), length + 1, nullptr) != napi_ok) {
    return std::nullopt;
  }
  return result;
}

std::string describeError(napi_env env, napi_value error) {
  napi_value stack = nullptr;
  napi_valuetype type = napi_undefined;
  if (napi_get_named_property(env, error, "stack", &stack) == napi_ok &&
      napi_typeof(env, stack, &type) == napi_ok && type == napi_string) {
    if (auto text = stringValue(env, stack)) {
      return *text;
    }
  }
  napi_value coerced = nullptr;
  if (napi_coerce_to_string(env, error, &coerced) == napi_ok) {
    if (auto text = stringValue(env, coerced)) {
      return *text;
    }
  }
  return "(unable to stringify the error)";
}

[[noreturn]] void abortWithFatalException(napi_env env, napi_value error) {
  std::string message = "napi_fatal_exception: " + describeError(env, error);
  react_native_log_fatal(message.c_str());
  abort();
}

// Routes the error through ErrorUtils.reportFatalError, React Native's
// equivalent of Node's 'uncaughtException'. On failure, clears any pending
// exception so the caller's fallback can make Node-API calls.
bool tryReportFatalError(napi_env env, napi_value error) {
  napi_value global = nullptr;
  if (napi_get_global(env, &global) != napi_ok) {
    return false;
  }

  napi_valuetype type = napi_undefined;
  napi_value errorUtils = nullptr;
  if (napi_get_named_property(env, global, "ErrorUtils", &errorUtils) !=
          napi_ok ||
      napi_typeof(env, errorUtils, &type) != napi_ok || type != napi_object) {
    return false;
  }

  napi_value reportFatalError = nullptr;
  if (napi_get_named_property(
          env, errorUtils, "reportFatalError", &reportFatalError) != napi_ok ||
      napi_typeof(env, reportFatalError, &type) != napi_ok ||
      type != napi_function) {
    return false;
  }

  napi_value argv[] = {error};
  if (napi_call_function(env, errorUtils, reportFatalError, 1, argv, nullptr) !=
      napi_ok) {
    bool isPending = false;
    if (napi_is_exception_pending(env, &isPending) == napi_ok && isPending) {
      napi_value discarded = nullptr;
      napi_get_and_clear_last_exception(env, &discarded);
    }
    return false;
  }
  return true;
}

} // namespace

NodeApiHost::NodeApiHost(JsDispatcher dispatchToJs)
    : dispatchToJs_(std::move(dispatchToJs)) {}

std::shared_ptr<NodeApiHost> NodeApiHost::create(JsDispatcher dispatchToJs) {
  return std::shared_ptr<NodeApiHost>(new NodeApiHost(std::move(dispatchToJs)));
}

void NodeApiHost::retainForProcessLifetime(std::shared_ptr<NodeApiHost> host) {
  static auto* mutex = new std::mutex();
  static auto* retained = new std::vector<std::shared_ptr<NodeApiHost>>();
  std::lock_guard lock(*mutex);
  retained->push_back(std::move(host));
}

void NodeApiHost::postWork(
    void* data,
    void* workData,
    void (*execute)(void* workData),
    void (*complete)(void* workData, napi_status status)) noexcept {
  auto* self = static_cast<NodeApiHost*>(data);
  WorkerPool::instance().enqueue(
      WorkItem{
          .data = data,
          .host = self->shared_from_this(),
          .workData = workData,
          .execute = execute,
          .complete = complete,
      });
}

bool NodeApiHost::cancelWork(void* data, void* workData) noexcept {
  WorkItem item;
  if (!WorkerPool::instance().tryRemove(data, workData, item)) {
    return false;
  }
  // Only report success while the cancelled completion can still be delivered.
  return item.host->dispatchToJs(
      [workData = item.workData, complete = item.complete] {
        complete(workData, napi_cancelled);
      });
}

void NodeApiHost::postTask(
    void* data,
    void* taskData,
    void (*callback)(void* taskData)) noexcept {
  auto* self = static_cast<NodeApiHost*>(data);
  if (!self->dispatchToJs_([taskData, callback] { callback(taskData); })) {
    react_native_log_warn(
        "Node-API: dropping a thread-safe function call posted after runtime teardown");
  }
}

void NodeApiHost::fatalException(
    void* data,
    napi_env env,
    napi_value error) noexcept {
  // Runs synchronously on the JS thread.
  auto* self = static_cast<NodeApiHost*>(data);
  if (self->inFatalException_) {
    abortWithFatalException(env, error);
  }
  self->inFatalException_ = true;
  bool reported = tryReportFatalError(env, error);
  self->inFatalException_ = false;
  if (!reported) {
    abortWithFatalException(env, error);
  }
}

} // namespace facebook::react
