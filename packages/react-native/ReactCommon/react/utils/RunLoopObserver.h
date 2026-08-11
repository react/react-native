/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <atomic>
#include <functional>
#include <memory>

namespace facebook::react {

/*
 * A cross-platform abstraction for observing a run loop life cycle.
 */
class RunLoopObserver {
 public:
  /*
   * The concept of an owner.
   * A run loop observer normally observes a run loop running on a different
   * thread. That implies that this other thread (the run loop thread) will call
   * methods of this class owned by some other thread. To make it safe, we need
   * to ensure that at the moment of the calling the observer still exists. To
   * do so, we use an owner object (a weak pointer) that must retain (possibly
   * indirectly) the observer. The platform-specific code should convert the
   * weak pointer (owner) to a strong one right before calling the observer,
   * ensuring the safety of calling; right after the call, the strong pointer
   * should be safely released.
   *
   * Note, in the case when the pointer to the actual owner will be available
   * later, only after calling the constructor of the class, the caller can
   * create a dummy pointer beforehand and then merge it (using
   * `shared_ptr<X>(shared_ptr<Y> const &, X *)`) with the actual one (sharing
   * the control block).
   */
  using Owner = std::shared_ptr<const void>;
  using WeakOwner = std::weak_ptr<const void>;

  /*
   * Run loop activity stages which run loop observers can be observe.
   */
  enum Activity : int32_t {
    None = 0,
    BeforeWaiting = 1 << 0,
    AfterWaiting = 1 << 1,
  };

  /*
   * A delegate interface.
   */
  class Delegate {
   public:
    /*
     * Called on every run loop tick at moments corresponding to requested
     * activities.
     *
     * A platform-specific implementation guarantees that the owner pointer
     * is retained during this call.
     * Will be called on the thread associated with the run loop.
     */
    virtual void activityDidChange(const Delegate* delegate, Activity activity)
        const noexcept = 0;

    virtual ~Delegate() noexcept = default;
  };

  using Factory = std::function<std::unique_ptr<RunLoopObserver>(
      Activity activities,
      const WeakOwner& owner)>;

  /*
   * Constructs a run loop observer.
   */
  RunLoopObserver(Activity activities, WeakOwner owner) noexcept;
  virtual ~RunLoopObserver() noexcept = default;

  /*
   * Sets the delegate.
   * Must be called just once.
   */
  void setDelegate(const Delegate* delegate) const noexcept;

  /*
   * Enables or disables run loop observing.
   * It can be used to save CPU cycles during periods of time when observing
   * is not required.
   * A newly constructed run time observer is initially disabled.
   */
  void enable() const noexcept;
  void disable() const noexcept;

  /*
   * Returns true if called on a thread associated with the run loop.
   * Must be implemented in subclasses.
   */
  virtual bool isOnRunLoopThread() const noexcept = 0;

  /*
   * Returns an owner associated with the observer.
   * It might be useful to ensure the safety of consequent asynchronous calls.
   */
  WeakOwner getOwner() const noexcept;

 protected:
  /*
   * Must be implemented in subclasses.
   */
  virtual void startObserving() const noexcept = 0;
  virtual void stopObserving() const noexcept = 0;

  /*
   * Called by subclasses to generate a call on a delegate.
   */
  void activityDidChange(Activity activity) const noexcept;

  const Activity activities_{};
  const WeakOwner owner_;
  mutable const Delegate* delegate_{nullptr};
  mutable std::atomic<bool> enabled_{false};
};

} // namespace facebook::react
