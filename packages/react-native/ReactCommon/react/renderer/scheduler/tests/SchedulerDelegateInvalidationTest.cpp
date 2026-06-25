/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Standalone reproduction of the use-after-free race between Scheduler
// teardown and pending rendering-update lambdas previously enqueued via
// runtimeScheduler_->scheduleRenderingUpdate inside
// Scheduler::uiManagerDidFinishTransaction (and its sibling
// uiManagerDidDispatchCommand). The lambda captures the delegate by raw
// pointer; if the delegate is destroyed (as part of an instance teardown
// triggered by an uncaught fatal error) before the lambda runs, the
// dereference is a use-after-free unless the invalidation-token guard in
// Scheduler::setDelegate is enabled at queue time.
//
// The test drives the *real* Scheduler::uiManagerDidFinishTransaction so the
// rendering-update lambda is enqueued via the regular code path into a real
// RuntimeScheduler's pending-rendering-updates queue. The teardown is
// initiated by an uncaught JSI host-function throw routed through
// RuntimeScheduler's onTaskError callback (the test's analog of the host
// fatal handler), then we trigger an event loop tick to drain the queue.
//
// Fantom is intentionally not used here: it shares the global runtime VM
// across tests, which would interfere with this test's contract that no
// further JS executes after a fatal-driven instance teardown.

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <ReactCommon/RuntimeExecutor.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/root/RootProps.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/core/EventDispatcher.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/MountingCoordinator.h>
#include <react/renderer/mounting/ShadowTreeRevision.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/scheduler/SchedulerDelegate.h>
#include <react/renderer/scheduler/SchedulerToolbox.h>
#include <react/renderer/scheduler/SurfaceHandler.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>
#include <react/renderer/uimanager/primitives.h>
#include <react/utils/ContextContainer.h>

#include <folly/dynamic.h>
#include <cstdint>
#include <functional>
#include <memory>
#include <queue>
#include <utility>

namespace facebook::react {

namespace {

// Magic sentinels embedded in RecordingDelegate to detect post-destruction
// access without requiring AddressSanitizer. The destructor flips kAlive ->
// kDestroyed as its first action; if a captured raw pointer is dereferenced
// after the destructor ran, the next read of aliveMagic_ will either see
// kDestroyed (best case) or whatever stomped the slab on heap reuse — both
// will fail the ASSERT_EQ check inside the recording delegate's methods.
constexpr uint64_t kAlive = 0xA11FED01A11FED01ULL;
constexpr uint64_t kDestroyed = 0xDEADBEEFDEADBEEFULL;

// Minimal SchedulerDelegate that records calls and, more importantly, guards
// every method body with a magic-sentinel check so a use-after-free shows up
// as an explicit gtest failure (or, when the binary runs under ASan, the
// sanitizer trips on the vptr load before our check even runs). aliveMagic_
// is intentionally the first member so it sits at a predictable offset for
// debugger / ASan inspection.
class RecordingDelegate : public SchedulerDelegate {
 public:
  RecordingDelegate() = default;

  ~RecordingDelegate() noexcept override {
    aliveMagic_ = kDestroyed;
  }

  void schedulerDidFinishTransaction(
      const std::shared_ptr<const MountingCoordinator>& /*unused*/) override {
    ASSERT_EQ(aliveMagic_, kAlive)
        << "schedulerDidFinishTransaction invoked after delegate destruction";
    ++didFinishTransactionCount_;
  }

  void schedulerShouldRenderTransactions(
      const std::shared_ptr<const MountingCoordinator>& /*unused*/) override {
    // This is the call the rendering-update lambda makes inside
    // Scheduler::uiManagerDidFinishTransaction. Reaching this method with
    // the magic sentinel flipped means the lambda raced past delegate
    // destruction — the use-after-free this test is designed to detect.
    ASSERT_EQ(aliveMagic_, kAlive)
        << "schedulerShouldRenderTransactions invoked after delegate "
        << "destruction (use-after-free)";
    ++shouldRenderTransactionsCount_;
  }

  void schedulerShouldMergeReactRevision(SurfaceId /*unused*/) override {}
  void schedulerDidRequestPreliminaryViewAllocation(
      const ShadowNode& /*unused*/) override {}
  void schedulerDidDispatchCommand(
      const ShadowView& /*unused*/,
      const std::string& commandName,
      const folly::dynamic& /*unused*/) override {
    // Mirrors the schedulerShouldRenderTransactions guard above. This is the
    // call the rendering-update lambda enqueued by
    // Scheduler::uiManagerDidDispatchCommand makes (e.g. for `scrollTo`).
    ASSERT_EQ(aliveMagic_, kAlive)
        << "schedulerDidDispatchCommand invoked after delegate destruction "
        << "(commandName=" << commandName << ")";
    ++didDispatchCommandCount_;
  }
  void schedulerDidSendAccessibilityEvent(
      const ShadowView& /*unused*/,
      const std::string& /*unused*/) override {}
  void schedulerDidSetIsJSResponder(
      const ShadowView& /*unused*/,
      bool /*unused*/,
      bool /*unused*/) override {}
  void schedulerShouldSynchronouslyUpdateViewOnUIThread(
      Tag /*unused*/,
      const folly::dynamic& /*unused*/) override {}
  void schedulerDidUpdateShadowTree(
      const std::unordered_map<Tag, folly::dynamic>& /*unused*/) override {}
  void schedulerDidCaptureViewSnapshot(Tag /*unused*/, SurfaceId /*unused*/)
      override {}
  void schedulerDidSetViewSnapshot(
      Tag /*unused*/,
      Tag /*unused*/,
      SurfaceId /*unused*/) override {}
  void schedulerDidClearPendingSnapshots() override {}

  int didFinishTransactionCount() const {
    return didFinishTransactionCount_;
  }
  int shouldRenderTransactionsCount() const {
    return shouldRenderTransactionsCount_;
  }
  int didDispatchCommandCount() const {
    return didDispatchCommandCount_;
  }

 private:
  uint64_t aliveMagic_{kAlive};
  int didFinishTransactionCount_{0};
  int shouldRenderTransactionsCount_{0};
  int didDispatchCommandCount_{0};
};

// EventBeat stub. Scheduler instantiates one through the toolbox factory but
// our test never drives any platform-side beat, so the default request() and
// induce() implementations (which assume a scheduler-backed beat) are fine.
class StubEventBeat : public EventBeat {
 public:
  StubEventBeat(
      std::shared_ptr<OwnerBox> ownerBox,
      RuntimeScheduler& runtimeScheduler)
      : EventBeat(std::move(ownerBox), runtimeScheduler) {}
};

// A FIFO of work items installed as the runtime executor. The test drains it
// explicitly via tick()/flush() so the JS thread's progress is fully under
// test control relative to teardown. This keeps the cascade ordering
// deterministic across runs.
class TestExecutorQueue {
 public:
  void enqueue(std::function<void()> work) {
    queue_.push(std::move(work));
  }
  void tick() {
    if (queue_.empty()) {
      return;
    }
    auto work = std::move(queue_.front());
    queue_.pop();
    work();
  }
  void flush() {
    while (!queue_.empty()) {
      tick();
    }
  }

 private:
  std::queue<std::function<void()>> queue_;
};

// Feature flags relevant to this test:
//   - enableSchedulerDelegateInvalidation: the token guard under test.
//   - enableRuntimeSchedulerQueueClearingOnError: a RuntimeScheduler_Modern
//     fallback that drops queued work before host error handling tears down the
//     delegate.
//   - enableBridgelessArchitecture: forced ON so the Scheduler picks
//     RuntimeScheduler_Modern. Modern queues rendering updates in
//     pendingRenderingUpdates_ and drains them at end-of-tick, which is the
//     ordering required to expose the race. RuntimeScheduler_Legacy runs
//     scheduleRenderingUpdate inline, collapsing the window we want to test.
class TestFeatureFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  explicit TestFeatureFlags(
      bool guardEnabled,
      bool queueClearingOnErrorEnabled = false)
      : guardEnabled_(guardEnabled),
        queueClearingOnErrorEnabled_(queueClearingOnErrorEnabled) {}

  bool enableBridgelessArchitecture() override {
    return true;
  }
  bool enableRuntimeSchedulerQueueClearingOnError() override {
    return queueClearingOnErrorEnabled_;
  }
  bool enableSchedulerDelegateInvalidation() override {
    return guardEnabled_;
  }

 private:
  bool guardEnabled_;
  bool queueClearingOnErrorEnabled_;
};

// Builds a ComponentRegistryFactory with just the descriptors needed for the
// test's shadow tree (Root + View). Matches the signature SchedulerToolbox
// expects.
ComponentRegistryFactory makeComponentRegistryFactory() {
  return [](const EventDispatcher::Weak& eventDispatcher,
            const std::shared_ptr<const ContextContainer>& contextContainer)
             -> SharedComponentDescriptorRegistry {
    ComponentDescriptorProviderRegistry providerRegistry{};
    providerRegistry.add(
        concreteComponentDescriptorProvider<RootComponentDescriptor>());
    providerRegistry.add(
        concreteComponentDescriptorProvider<ViewComponentDescriptor>());
    return providerRegistry.createComponentDescriptorRegistry(
        ComponentDescriptorParameters{
            .eventDispatcher = eventDispatcher,
            .contextContainer = contextContainer,
            .flavor = nullptr});
  };
}

// Test fixture: stands up the minimum infrastructure required to construct
// a real Scheduler and drive uiManagerDidFinishTransaction end-to-end.
class SchedulerDelegateInvalidationTest : public ::testing::Test {
 protected:
  void setUp(bool guardEnabled, bool queueClearingOnErrorEnabled = false) {
    ReactNativeFeatureFlags::override(
        std::make_unique<TestFeatureFlags>(
            guardEnabled, queueClearingOnErrorEnabled));

    runtime_ = facebook::hermes::makeHermesRuntime(
        ::hermes::vm::RuntimeConfig::Builder()
            .withMicrotaskQueue(true)
            .build());
    executorQueue_ = std::make_unique<TestExecutorQueue>();

    RuntimeExecutor runtimeExecutor =
        [this](
            std::function<void(facebook::jsi::Runtime & runtime)>&& callback) {
          executorQueue_->enqueue(
              [this, callback = std::move(callback)]() mutable {
                callback(*runtime_);
              });
        };

    // onTaskError stands in for a host-side fatal handler that initiates an
    // instance teardown. When a JS task throws (uncaught at the JSI host
    // boundary), RuntimeScheduler routes the error here; the test fixture
    // treats that as a fatal and tears down the instance in the same order
    // a host-side invalidate path would:
    //   1. unregister all surfaces (clears their per-surface UIManager
    //      pointer; a real host would also stop running surfaces first),
    //   2. clear the scheduler delegate (setDelegate(nullptr)),
    //   3. drop the surface presenter that backed the delegate.
    //
    // Note: step 1 does NOT drain RuntimeScheduler_Modern's
    // pendingRenderingUpdates_. That's exactly the point of the test —
    // surface-level shutdown can't reach the lambda race; the race lives in
    // the runtime scheduler's queue and is only closed by the invalidation
    // token guard added in Scheduler::setDelegate or by runtime-scheduler-level
    // queue clearing on error.
    auto onTaskError = [this](
                           jsi::Runtime& /*runtime*/, jsi::JSError& /*error*/) {
      jsThrowObserved_ = true;
      if (scheduler_ && surfaceHandler_ &&
          surfaceHandler_->getStatus() !=
              SurfaceHandler::Status::Unregistered) {
        scheduler_->unregisterSurface(*surfaceHandler_);
      }
      if (scheduler_) {
        scheduler_->setDelegate(nullptr);
      }
      delegate_.reset();
    };

    runtimeScheduler_ = std::make_shared<RuntimeScheduler>(
        runtimeExecutor,
        []() { return HighResTimeStamp::now(); },
        std::move(onTaskError));

    contextContainer_ = std::make_shared<ContextContainer>();
    contextContainer_->insert(
        RuntimeSchedulerKey,
        std::weak_ptr<RuntimeScheduler>(runtimeScheduler_));

    SchedulerToolbox toolbox{};
    toolbox.contextContainer = contextContainer_;
    toolbox.runtimeExecutor = runtimeExecutor;
    toolbox.componentRegistryFactory = makeComponentRegistryFactory();
    toolbox.eventBeatFactory =
        [this](std::shared_ptr<EventBeat::OwnerBox> ownerBox) {
          return std::make_unique<StubEventBeat>(
              std::move(ownerBox), *runtimeScheduler_);
        };

    delegate_ = std::make_unique<RecordingDelegate>();
    scheduler_ = std::make_unique<Scheduler>(
        toolbox, /*animationDelegate=*/nullptr, delegate_.get());

    // Register a surface with the scheduler so the teardown path mirrors
    // production cascade ordering (per-surface unregister BEFORE delegate
    // drop). The handler is intentionally not started — we never run the
    // surface through the UIManager, since the test feeds a coordinator
    // directly to uiManagerDidFinishTransaction. SurfaceHandler must reach
    // Status::Unregistered before destruction, so TearDown also handles
    // the case where onTaskError didn't run.
    surfaceHandler_ = std::make_unique<SurfaceHandler>(
        /*moduleName=*/"", /*surfaceId=*/11);
    scheduler_->registerSurface(*surfaceHandler_);

    coordinator_ = makeCoordinator(/*surfaceId=*/11);
  }

  void TearDown() override {
    if (surfaceHandler_ && scheduler_ &&
        surfaceHandler_->getStatus() != SurfaceHandler::Status::Unregistered) {
      scheduler_->unregisterSurface(*surfaceHandler_);
    }
    surfaceHandler_.reset();
    scheduler_.reset();
    delegate_.reset();
    coordinator_.reset();
    rootShadowNode_.reset();
    runtimeScheduler_.reset();
    contextContainer_.reset();
    executorQueue_.reset();
    runtime_.reset();
    ReactNativeFeatureFlags::dangerouslyReset();
  }

  // Builds a real RootShadowNode at the given surfaceId and wraps it in a
  // ShadowTreeRevision + MountingCoordinator. This is what
  // Scheduler::uiManagerDidFinishTransaction reads getSurfaceId() from at
  // queue time. Saves the rootShadowNode in the fixture so dispatch-command
  // tests can pass it to Scheduler::uiManagerDidDispatchCommand.
  std::shared_ptr<MountingCoordinator> makeCoordinator(SurfaceId surfaceId) {
    auto builder = simpleComponentBuilder(contextContainer_);
    std::shared_ptr<RootShadowNode> rootShadowNode;
    auto element = Element<RootShadowNode>()
                       .reference(rootShadowNode)
                       .surfaceId(surfaceId)
                       .tag(1)
                       .props([] {
                         auto props = std::make_shared<RootProps>();
                         return props;
                       });
    builder.build(element);
    rootShadowNode_ = rootShadowNode;

    ShadowTreeRevision revision{
        .rootShadowNode = rootShadowNode, .number = 1, .telemetry = {}};
    return std::make_shared<MountingCoordinator>(revision);
  }

  // Drives one event-loop tick by scheduling a no-op task and processing the
  // resulting executor queue entries. The end-of-tick drain in
  // RuntimeScheduler_Modern flushes pendingRenderingUpdates_, where the
  // lambda enqueued by uiManagerDidFinishTransaction lives.
  void runOneEventLoopTick() {
    runtimeScheduler_->scheduleWork(
        [](jsi::Runtime& /*unused*/) { /* no-op */ });
    executorQueue_->flush();
  }

  // Schedules a JS task whose host function throws an uncaught Error. When
  // the task runs and the throw escapes the host-function boundary,
  // RuntimeScheduler routes it through the onTaskError callback installed
  // in setUp(), which in turn simulates a host-driven instance-teardown
  // cascade by dropping the delegate.
  void scheduleJSThrowingTask() {
    auto throwingHostFn = jsi::Function::createFromHostFunction(
        *runtime_,
        jsi::PropNameID::forUtf8(*runtime_, "throwUncaught"),
        0,
        [](jsi::Runtime& runtime,
           const jsi::Value& /*unused*/,
           const jsi::Value* /*args*/,
           size_t /*count*/) -> jsi::Value {
          // Simulates an uncaught JS error at the JSI host-function boundary
          // — the same shape as the "Exception in HostFunction" surfaces
          // that propagate to a host-side fatal handler in production.
          throw jsi::JSError(runtime, "simulated uncaught fatal");
        });
    runtimeScheduler_->scheduleTask(
        SchedulerPriority::NormalPriority, std::move(throwingHostFn));
  }

  void schedulePostErrorTask() {
    runtimeScheduler_->scheduleTask(
        SchedulerPriority::NormalPriority,
        [this](jsi::Runtime& /*runtime*/) { postErrorTaskRan_ = true; });
  }

  std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<TestExecutorQueue> executorQueue_;
  std::shared_ptr<RuntimeScheduler> runtimeScheduler_;
  std::shared_ptr<ContextContainer> contextContainer_;
  std::unique_ptr<RecordingDelegate> delegate_;
  std::unique_ptr<Scheduler> scheduler_;
  std::unique_ptr<SurfaceHandler> surfaceHandler_;
  std::shared_ptr<MountingCoordinator> coordinator_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  bool jsThrowObserved_{false};
  bool postErrorTaskRan_{false};
};

} // namespace

// ---------------------------------------------------------------------------
// Test 1 — Sanity: with the delegate alive, uiManagerDidFinishTransaction
// enqueues a lambda that calls schedulerShouldRenderTransactions on the
// next event loop tick. Establishes the baseline behavior that the next
// two tests perturb.
// ---------------------------------------------------------------------------
TEST_F(
    SchedulerDelegateInvalidationTest,
    Sanity_LambdaRunsOnNextTickWhenDelegateAlive) {
  setUp(/*guardEnabled=*/true);

  scheduler_->uiManagerDidFinishTransaction(
      coordinator_, /*mountSynchronously=*/false);

  // Synchronously, schedulerDidFinishTransaction was called once
  // (Scheduler.cpp dispatches it unconditionally, before the
  // scheduleRenderingUpdate enqueue). schedulerShouldRenderTransactions
  // has NOT been called yet — that one sits in the rendering-update queue.
  EXPECT_EQ(delegate_->didFinishTransactionCount(), 1);
  EXPECT_EQ(delegate_->shouldRenderTransactionsCount(), 0);

  runOneEventLoopTick();

  EXPECT_EQ(delegate_->shouldRenderTransactionsCount(), 1);
}

// ---------------------------------------------------------------------------
// Test 2 — JS-throw-initiated teardown, guard ENABLED.
//
// Cascade replicated in C++:
//   (a) earlier transaction enqueued a rendering-update lambda into
//       pendingRenderingUpdates_ via Scheduler::uiManagerDidFinishTransaction
//   (b) JS throws — uncaught at the JSI host-function boundary
//   (c) RuntimeScheduler routes the error to onTaskError, which simulates a
//       host-driven instance teardown by dropping the delegate
//   (d) the next tick drains the previously-queued rendering update
//
// With the guard ON, step (c) flipped the invalidation token; the pending
// lambda observes that and returns before touching the freed delegate. Safe.
// ---------------------------------------------------------------------------
TEST_F(
    SchedulerDelegateInvalidationTest,
    GuardEnabled_JSThrowInitiatedTeardownIsSafe) {
  setUp(/*guardEnabled=*/true);

  // (a) Pre-throw transaction: lambda lands in pendingRenderingUpdates_.
  scheduler_->uiManagerDidFinishTransaction(
      coordinator_, /*mountSynchronously=*/false);
  EXPECT_EQ(delegate_->shouldRenderTransactionsCount(), 0);

  // (b) Schedule a JS task that throws uncaught. Draining the executor queue
  // runs the task; the throw flows through to onTaskError → teardown.
  scheduleJSThrowingTask();
  executorQueue_->flush();

  // Sanity: the simulated fatal cascade fired and the delegate is gone.
  EXPECT_TRUE(jsThrowObserved_);
  EXPECT_EQ(scheduler_->getDelegate(), nullptr);

  // (d) Drain the pending rendering update. Guard is on → lambda no-ops.
  runOneEventLoopTick();

  SUCCEED();
}

// ---------------------------------------------------------------------------
// Test 3 — JS-throw-initiated teardown, guard DISABLED but runtime-scheduler
// queue clearing ENABLED.
//
// Same cascade as Test 2 but with the scheduler invalidation guard OFF. The
// runtime scheduler clears pendingRenderingUpdates_ before onTaskError tears
// down the delegate, so the later tick has no stale delegate lambda to drain.
// ---------------------------------------------------------------------------
TEST_F(
    SchedulerDelegateInvalidationTest,
    GuardDisabled_QueueClearingOnError_JSThrowInitiatedTeardownIsSafe) {
  setUp(
      /*guardEnabled=*/false,
      /*queueClearingOnErrorEnabled=*/true);

  scheduler_->uiManagerDidFinishTransaction(
      coordinator_, /*mountSynchronously=*/false);
  EXPECT_EQ(delegate_->shouldRenderTransactionsCount(), 0);

  scheduleJSThrowingTask();
  schedulePostErrorTask();
  executorQueue_->flush();
  EXPECT_TRUE(jsThrowObserved_);
  EXPECT_EQ(scheduler_->getDelegate(), nullptr);
  EXPECT_FALSE(postErrorTaskRan_);

  runOneEventLoopTick();

  SUCCEED();
}

// ---------------------------------------------------------------------------
// Test 4 — JS-throw-initiated teardown, guard DISABLED.
//
// Same cascade as Test 2 but with the guard OFF. The previously-enqueued
// lambda has no working token check, so when the rendering-update drain
// runs after teardown it dereferences the destroyed delegate.
//
// EXPECT_DEATH catches the abort: either RecordingDelegate's magic-sentinel
// ASSERT_EQ inside schedulerShouldRenderTransactions trips, or ASan reports
// heap-use-after-free on the vptr load before our assertion runs.
// ---------------------------------------------------------------------------
#if GTEST_HAS_DEATH_TEST
TEST_F(
    SchedulerDelegateInvalidationTest,
    GuardDisabled_JSThrowInitiatedTeardownIsUAF) {
  EXPECT_DEATH(
      {
        setUp(/*guardEnabled=*/false);

        // (a) Pre-throw transaction: lambda lands in
        // pendingRenderingUpdates_.
        scheduler_->uiManagerDidFinishTransaction(
            coordinator_, /*mountSynchronously=*/false);

        // (b) Uncaught JS throw → onTaskError → teardown drops the delegate.
        // (c) Note: with guard DISABLED, setDelegate(nullptr) does NOT flip
        // the invalidation token — Scheduler::setDelegate gates that branch
        // on the feature flag — so the pending lambda has no signal that
        // the delegate is going away.
        scheduleJSThrowingTask();
        executorQueue_->flush();

        // (d) Drain the pending rendering update. The lambda dereferences
        // the destroyed delegate → UAF.
        runOneEventLoopTick();
      },
      "");
}
#endif

// ---------------------------------------------------------------------------
// Test 5 — Same race as Test 2, but enqueued via the second lambda site:
// Scheduler::uiManagerDidDispatchCommand. This is the path the in-app
// reproduction observed (a `scrollTo` command issued from a tap, queued
// just before the cascade fatal). With the guard ON the lambda observes
// the invalidation token and no-ops.
// ---------------------------------------------------------------------------
TEST_F(
    SchedulerDelegateInvalidationTest,
    GuardEnabled_DispatchCommandLambda_JSThrowInitiatedTeardownIsSafe) {
  setUp(/*guardEnabled=*/true);
  ASSERT_NE(rootShadowNode_, nullptr);

  // (a) Pre-throw command: enqueues a rendering-update lambda inside
  // Scheduler::uiManagerDidDispatchCommand that captures the delegate by
  // raw pointer and the invalidation token by shared_ptr.
  scheduler_->uiManagerDidDispatchCommand(
      rootShadowNode_, "scrollTo", folly::dynamic::array());
  EXPECT_EQ(delegate_->didDispatchCommandCount(), 0);

  // (b) Uncaught JS throw → onTaskError → unregister surface → drop delegate.
  scheduleJSThrowingTask();
  executorQueue_->flush();
  EXPECT_TRUE(jsThrowObserved_);
  EXPECT_EQ(scheduler_->getDelegate(), nullptr);

  // (c) Drain the pending rendering update. Guard ON → lambda no-ops.
  runOneEventLoopTick();

  SUCCEED();
}

// ---------------------------------------------------------------------------
// Test 6 — Same race as Test 3, but enqueued via
// Scheduler::uiManagerDidDispatchCommand. Guard OFF → lambda dereferences
// the destroyed delegate → UAF caught by the magic sentinel inside
// schedulerDidDispatchCommand or by ASan on the vptr load.
// ---------------------------------------------------------------------------
#if GTEST_HAS_DEATH_TEST
TEST_F(
    SchedulerDelegateInvalidationTest,
    GuardDisabled_DispatchCommandLambda_JSThrowInitiatedTeardownIsUAF) {
  EXPECT_DEATH(
      {
        setUp(/*guardEnabled=*/false);
        ASSERT_NE(rootShadowNode_, nullptr);

        scheduler_->uiManagerDidDispatchCommand(
            rootShadowNode_, "scrollTo", folly::dynamic::array());

        scheduleJSThrowingTask();
        executorQueue_->flush();

        runOneEventLoopTick();
      },
      "");
}
#endif

// ---------------------------------------------------------------------------
// Test 7 — Architectural assertion: surface-shutdown alone does NOT drain
// pendingRenderingUpdates_ in RuntimeScheduler_Modern.
//
// This is the explicit refutation of the implicit reading "if the host just
// stops/unregisters all surfaces before dropping the delegate, the lambda
// race wouldn't be reachable." It would not — surface-shutdown clears the
// per-surface UIManager pointer but doesn't touch the runtime scheduler's
// pending-rendering-updates queue. The lambda still runs and still calls
// the delegate. Only the invalidation-token guard (or, longer-term, a
// runtime-scheduler-level shutdown signal) closes this race.
// ---------------------------------------------------------------------------
TEST_F(
    SchedulerDelegateInvalidationTest,
    UnregisterSurface_DoesNotDrainPendingRenderingUpdates) {
  setUp(/*guardEnabled=*/true);

  // (a) Enqueue a rendering-update lambda for the registered surface.
  scheduler_->uiManagerDidFinishTransaction(
      coordinator_, /*mountSynchronously=*/false);
  EXPECT_EQ(delegate_->shouldRenderTransactionsCount(), 0);

  // (b) Unregister the surface — the host's per-surface shutdown step.
  // Crucially, no JS throw and no setDelegate(nullptr) here: the delegate
  // remains alive, only the surface's UIManager pointer is cleared.
  ASSERT_NE(scheduler_->getDelegate(), nullptr);
  scheduler_->unregisterSurface(*surfaceHandler_);
  EXPECT_EQ(surfaceHandler_->getStatus(), SurfaceHandler::Status::Unregistered);
  EXPECT_NE(scheduler_->getDelegate(), nullptr);

  // (c) Drain the rendering-update queue. The pending lambda was NOT
  // affected by the surface unregister — it still runs and still calls the
  // (still-alive) delegate.
  runOneEventLoopTick();
  EXPECT_EQ(delegate_->shouldRenderTransactionsCount(), 1);
}

} // namespace facebook::react
