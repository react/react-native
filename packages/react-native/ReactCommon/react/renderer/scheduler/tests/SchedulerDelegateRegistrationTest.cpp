/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/scheduler/SchedulerDelegateRegistration.h>

#include <atomic>
#include <functional>
#include <memory>
#include <semaphore>
#include <thread>

namespace facebook::react {
namespace {

class TestDelegate final : public SchedulerDelegate {
 public:
  std::function<void()> onCall;
  std::function<void()> onDestroy;

  ~TestDelegate() noexcept override {
    if (onDestroy) {
      onDestroy();
    }
  }

  void schedulerDidFinishTransaction(
      const std::shared_ptr<const MountingCoordinator>&) override {}
  void schedulerShouldRenderTransactions(
      const std::shared_ptr<const MountingCoordinator>&) override {}
  void schedulerShouldMergeReactRevision(SurfaceId) override {}
  void schedulerDidRequestPreliminaryViewAllocation(
      const ShadowNode&) override {}
  void schedulerDidDispatchCommand(
      const ShadowView&,
      const std::string&,
      const folly::dynamic&) override {}
  void schedulerDidSendAccessibilityEvent(const ShadowView&, const std::string&)
      override {}
  void schedulerDidSetIsJSResponder(const ShadowView&, bool, bool) override {}
  void schedulerShouldSynchronouslyUpdateViewOnUIThread(
      Tag,
      const folly::dynamic&) override {}
  void schedulerDidUpdateShadowTree(
      const std::unordered_map<Tag, folly::dynamic>&) override {}
  void schedulerDidCaptureViewSnapshot(Tag, SurfaceId) override {}
  void schedulerDidSetViewSnapshot(Tag, Tag, SurfaceId) override {}
  void schedulerDidClearPendingSnapshots() override {
    if (onCall) {
      onCall();
    }
  }
};

TEST(SchedulerDelegateRegistrationTest, EmptyRegistrationsHaveNoLease) {
  SchedulerDelegateRegistration borrowed(nullptr);
  SchedulerDelegateRegistration owned(std::shared_ptr<SchedulerDelegate>{});
  EXPECT_FALSE(borrowed.acquire());
  EXPECT_FALSE(owned.acquire());
  borrowed.retire();
  owned.retire();
  EXPECT_FALSE(borrowed.acquire());
  EXPECT_FALSE(owned.acquire());
}

TEST(
    SchedulerDelegateRegistrationTest,
    RetiredGenerationCannotAcquireReplacement) {
  auto first = std::make_shared<TestDelegate>();
  auto second = std::make_shared<TestDelegate>();
  SchedulerDelegateRegistration previous(first);
  SchedulerDelegateRegistration replacement(second);
  SchedulerDelegateRegistration independent(first);

  previous.retire();

  EXPECT_FALSE(previous.acquire());
  EXPECT_EQ(replacement.acquire().get(), second.get());
  EXPECT_EQ(independent.acquire().get(), first.get());
}

TEST(SchedulerDelegateRegistrationTest, RetiringBorrowedDelegateDoesNotOwnIt) {
  bool destroyed = false;
  auto delegate = std::make_unique<TestDelegate>();
  delegate->onDestroy = [&] { destroyed = true; };
  SchedulerDelegateRegistration registration(delegate.get());
  {
    auto lease = registration.acquire();
    EXPECT_EQ(lease.get(), delegate.get());
    registration.retire();
    EXPECT_FALSE(registration.acquire());
    EXPECT_FALSE(destroyed);
  }
  EXPECT_FALSE(destroyed);
  delegate.reset();
  EXPECT_TRUE(destroyed);
}

TEST(
    SchedulerDelegateRegistrationTest,
    AcquiredOwnedLeaseSurvivesConcurrentRetirement) {
  std::atomic<bool> destroyed{false};
  std::atomic<int> calls{0};
  std::binary_semaphore acquired{0};
  std::binary_semaphore invoke{0};
  auto delegate = std::make_shared<TestDelegate>();
  delegate->onDestroy = [&] { destroyed = true; };
  delegate->onCall = [&] { ++calls; };
  SchedulerDelegateRegistration registration(delegate);

  std::thread worker([&] {
    auto lease = registration.acquire();
    acquired.release();
    invoke.acquire();
    EXPECT_TRUE(lease);
    if (lease) {
      lease->schedulerDidClearPendingSnapshots();
    }
  });

  acquired.acquire();
  registration.retire();
  delegate.reset();
  EXPECT_FALSE(registration.acquire());
  EXPECT_FALSE(destroyed.load());
  invoke.release();
  worker.join();

  EXPECT_EQ(calls.load(), 1);
  EXPECT_TRUE(destroyed.load());
}

TEST(
    SchedulerDelegateRegistrationTest,
    DelegateCallbackCanRetireItsRegistration) {
  bool destroyed = false;
  auto delegate = std::make_shared<TestDelegate>();
  delegate->onDestroy = [&] { destroyed = true; };
  SchedulerDelegateRegistration registration(delegate);
  delegate->onCall = [&] {
    registration.retire();
    EXPECT_FALSE(registration.acquire());
    EXPECT_FALSE(destroyed);
  };
  delegate.reset();

  {
    auto lease = registration.acquire();
    ASSERT_TRUE(lease);
    lease->schedulerDidClearPendingSnapshots();
    EXPECT_FALSE(destroyed);
  }
  EXPECT_TRUE(destroyed);
}

TEST(
    SchedulerDelegateRegistrationTest,
    DelegateDestructorCanReenterRetirement) {
  bool destroyed = false;
  auto delegate = std::make_shared<TestDelegate>();
  SchedulerDelegateRegistration registration(delegate);
  delegate->onDestroy = [&] {
    EXPECT_FALSE(registration.acquire());
    registration.retire();
    destroyed = true;
  };
  delegate.reset();

  registration.retire();

  EXPECT_TRUE(destroyed);
}

TEST(
    SchedulerDelegateRegistrationTest,
    QueuedRegistrationDoesNotRetainRetiredDelegate) {
  auto delegate = std::make_shared<TestDelegate>();
  std::weak_ptr<TestDelegate> weakDelegate = delegate;
  auto registration = std::make_shared<SchedulerDelegateRegistration>(delegate);
  auto queued = [registration] { EXPECT_FALSE(registration->acquire()); };
  delegate.reset();
  registration->retire();
  registration.reset();

  EXPECT_TRUE(weakDelegate.expired());
  queued();
}

} // namespace
} // namespace facebook::react
