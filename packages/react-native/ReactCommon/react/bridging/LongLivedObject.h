/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <jsi/jsi.h>
#include <memory>
#include <mutex>
#include <thread>
#include <unordered_set>
#include <utility>

namespace facebook::react {

class CallInvoker;

/**
 * A simple wrapper class that can be registered to a collection that keep it
 * alive for extended period of time. This object can be removed from the
 * collection when needed.
 *
 * The subclass of this class must be created using std::make_shared<T>().
 * After creation, add it to the `LongLivedObjectCollection`. When done with the
 * object, call `allowRelease()` to reclaim its memory. Prefer
 * `LongLivedObjectHandle` for automatic JavaScript-value ownership and release.
 *
 * When using LongLivedObject to keep JS values alive, ensure you only hold weak
 * references to the object outside the JS thread to avoid accessing deallocated
 * values when the JS VM is shutdown.
 */
class LongLivedObject {
 public:
  virtual void allowRelease();

 protected:
  explicit LongLivedObject(jsi::Runtime &runtime) : runtime_(runtime) {}
  virtual ~LongLivedObject() = default;
  jsi::Runtime &runtime_;
};

/**
 * A singleton, thread-safe, write-only collection for the `LongLivedObject`s.
 * Clear with exclusive access to the still-live runtime during teardown, even
 * when native handles outlive it or queued release tasks cannot execute.
 */
class LongLivedObjectCollection {
 public:
  static LongLivedObjectCollection &get(jsi::Runtime &runtime);

  LongLivedObjectCollection() = default;
  LongLivedObjectCollection(const LongLivedObjectCollection &) = delete;
  void operator=(const LongLivedObjectCollection &) = delete;

  void add(std::shared_ptr<LongLivedObject> o);
  void remove(const LongLivedObject *o);
  void clear();
  size_t size() const;

 private:
  std::unordered_set<std::shared_ptr<LongLivedObject>> collection_;
  mutable std::mutex collectionMutex_;
};

namespace detail {
void releaseLongLivedObjectOnJS(std::weak_ptr<LongLivedObject> object, std::weak_ptr<CallInvoker> jsInvoker) noexcept;

// A derived weak pointer can transiently acquire strong ownership when converted.
template <typename T>
void releaseLongLivedObjectOnJS(std::weak_ptr<T>, std::weak_ptr<CallInvoker>) = delete;
} // namespace detail

/**
 * Owns a collection registration without retaining its JavaScript value on a
 * native thread. Construct and lock on the JavaScript thread; move and destroy
 * on any thread. The runtime host owns the call invoker; this handle retains it
 * weakly. The collection must be cleared before its runtime is destroyed.
 */
template <typename T>
class LongLivedObjectHandle {
 public:
  // All strong references to this holder, including copies, must stay on the JavaScript thread.
  struct Holder : LongLivedObject {
    Holder(jsi::Runtime &runtime, T value) : LongLivedObject(runtime), value(std::move(value)) {}

    T value;
  };

  LongLivedObjectHandle() = default;

  LongLivedObjectHandle(jsi::Runtime &runtime, T value, std::shared_ptr<CallInvoker> jsInvoker)
  {
    if (!jsInvoker) {
      throw jsi::JSError(runtime, "LongLivedObjectHandle requires a call invoker");
    }
    jsThread_ = std::this_thread::get_id();
    jsInvoker_ = jsInvoker;
    auto holder = std::make_shared<Holder>(runtime, std::move(value));
    LongLivedObjectCollection::get(runtime).add(holder);
    holder_ = holder;
  }

  LongLivedObjectHandle(const LongLivedObjectHandle &) = delete;
  LongLivedObjectHandle &operator=(const LongLivedObjectHandle &) = delete;
  LongLivedObjectHandle(LongLivedObjectHandle &&) noexcept = default;

  LongLivedObjectHandle &operator=(LongLivedObjectHandle &&other) noexcept
  {
    if (this != &other) {
      reset();
      holder_ = std::move(other.holder_);
      jsInvoker_ = std::move(other.jsInvoker_);
      jsThread_ = std::exchange(other.jsThread_, {});
    }
    return *this;
  }

  ~LongLivedObjectHandle()
  {
    reset();
  }

  bool expired() const noexcept
  {
    return holder_.expired();
  }

  std::shared_ptr<CallInvoker> lockInvoker() const noexcept
  {
    return holder_.expired() ? nullptr : jsInvoker_.lock();
  }

  // Require this handle's runtime as proof that the caller has access to it;
  // runtime identity is not checked. Keep the returned strong reference on the
  // JavaScript thread, including its destruction.
  std::shared_ptr<Holder> lockJSValue(jsi::Runtime & /*runtime*/) const noexcept
  {
    return std::static_pointer_cast<Holder>(holder_.lock());
  }

  void reset() noexcept
  {
    auto holder = std::exchange(holder_, {});
    auto jsInvoker = std::exchange(jsInvoker_, {});
    auto jsThread = std::exchange(jsThread_, {});
    if (std::this_thread::get_id() == jsThread) {
      if (auto locked = holder.lock()) {
        locked->allowRelease();
      }
    } else {
      detail::releaseLongLivedObjectOnJS(std::move(holder), std::move(jsInvoker));
    }
  }

 private:
  // Converting weak pointers can promote the object; keep the helper's base type
  // so off-thread release only moves weak references.
  std::weak_ptr<LongLivedObject> holder_;
  std::weak_ptr<CallInvoker> jsInvoker_;
  // Cache affinity without promoting the JavaScript-value holder on a native thread.
  std::thread::id jsThread_;
};

} // namespace facebook::react
