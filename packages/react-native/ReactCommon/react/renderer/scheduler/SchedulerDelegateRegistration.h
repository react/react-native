/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <atomic>
#include <memory>
#include <utility>
#include <variant>

namespace facebook::react {

class SchedulerDelegate;

/*
 * One delegate generation. Queued work retains the registration, not its target.
 * Retirement prevents new leases while existing owned leases may finish.
 * Borrowed delegates still require the caller to outlive every active lease.
 */
class SchedulerDelegateRegistration final {
  using Target = std::variant<SchedulerDelegate *, std::shared_ptr<SchedulerDelegate>>;

 public:
  class Lease final {
   public:
    explicit operator bool() const
    {
      return target_ != nullptr;
    }

    SchedulerDelegate *operator->() const
    {
      return get();
    }

    SchedulerDelegate *get() const
    {
      if (!target_) {
        return nullptr;
      }
      if (auto borrowed = std::get_if<SchedulerDelegate *>(target_.get())) {
        return *borrowed;
      }
      return std::get<std::shared_ptr<SchedulerDelegate>>(*target_).get();
    }

   private:
    friend class SchedulerDelegateRegistration;
    explicit Lease(std::shared_ptr<const Target> target) : target_(std::move(target)) {}
    std::shared_ptr<const Target> target_;
  };

  explicit SchedulerDelegateRegistration(SchedulerDelegate *delegate)
      : target_(delegate ? std::make_shared<const Target>(delegate) : nullptr)
  {
  }

  explicit SchedulerDelegateRegistration(std::shared_ptr<SchedulerDelegate> delegate)
      : target_(delegate ? std::make_shared<const Target>(std::move(delegate)) : nullptr)
  {
  }

  Lease acquire() const
  {
    return Lease(std::atomic_load(&target_));
  }

  void retire()
  {
    // The last owner is released after the atomic operation's internal lock.
    // Delegate destruction may reenter Scheduler, just like delegate methods.
    auto previous = std::atomic_exchange(&target_, std::shared_ptr<const Target>{});
  }

 private:
  std::shared_ptr<const Target> target_;
};

} // namespace facebook::react
