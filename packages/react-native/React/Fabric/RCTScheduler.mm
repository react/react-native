/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScheduler.h"

#import <QuartzCore/CADisplayLink.h>
#import <cxxreact/TraceSection.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/animations/LayoutAnimationDriver.h>
#import <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#import <react/renderer/scheduler/Scheduler.h>
#import <react/renderer/scheduler/SchedulerDelegate.h>
#import <react/utils/RunLoopObserver.h>

#import "PlatformRunLoopObserver.h"
#import "RCTConversions.h"

using namespace facebook::react;

class SchedulerDelegateProxy : public SchedulerDelegate {
 public:
  SchedulerDelegateProxy(void *scheduler) : scheduler_(scheduler) {}

  void schedulerDidFinishTransaction(const std::shared_ptr<const MountingCoordinator> &mountingCoordinator) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidFinishTransaction:mountingCoordinator];
  }

  void schedulerShouldRenderTransactions(const std::shared_ptr<const MountingCoordinator> &mountingCoordinator) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerShouldRenderTransactions:mountingCoordinator];
  }

  void schedulerShouldMergeReactRevision(SurfaceId surfaceId) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerShouldMergeReactRevision:surfaceId];
  }

  void schedulerDidRequestPreliminaryViewAllocation(const ShadowNode &shadowNode) override
  {
    // Does nothing.
    // This delegate method is not currently used on iOS.
  }

  void schedulerDidDispatchCommand(
      const ShadowView &shadowView,
      const std::string &commandName,
      const folly::dynamic &args) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidDispatchCommand:shadowView commandName:commandName args:args];
  }

  void schedulerDidSetIsJSResponder(const ShadowView &shadowView, bool isJSResponder, bool blockNativeResponder)
      override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidSetIsJSResponder:isJSResponder
                                blockNativeResponder:blockNativeResponder
                                       forShadowView:shadowView];
  }

  void schedulerDidSendAccessibilityEvent(const ShadowView &shadowView, const std::string &eventType) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidSendAccessibilityEvent:shadowView eventType:eventType];
  }

  void schedulerShouldSynchronouslyUpdateViewOnUIThread(facebook::react::Tag tag, const folly::dynamic &props) override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler.delegate schedulerDidSynchronouslyUpdateViewOnUIThread:tag props:props];
  }

  void schedulerDidUpdateShadowTree(const std::unordered_map<Tag, folly::dynamic> &tagToProps) override
  {
    // Does nothing.
    // This delegate method is not currently used on iOS.
  }

  void schedulerDidCaptureViewSnapshot(Tag tag, SurfaceId surfaceId) override
  {
    // Does nothing.
    // View transition snapshots are not currently implemented on iOS.
  }

  void schedulerDidSetViewSnapshot(Tag sourceTag, Tag targetTag, SurfaceId surfaceId) override
  {
    // Does nothing.
    // View transition snapshots are not currently implemented on iOS.
  }

  void schedulerDidClearPendingSnapshots() override
  {
    // Does nothing.
    // View transition snapshots are not currently implemented on iOS.
  }

 private:
  void *scheduler_;
};

class LayoutAnimationDelegateProxy : public LayoutAnimationStatusDelegate, public RunLoopObserver::Delegate {
 public:
  LayoutAnimationDelegateProxy(void *scheduler) : scheduler_(scheduler) {}
  virtual ~LayoutAnimationDelegateProxy() {}

  void onAnimationStarted() override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler onAnimationStarted];
  }

  /**
   * Called when the LayoutAnimation engine completes all pending animations.
   */
  void onAllAnimationsComplete() override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler onAllAnimationsComplete];
  }

  void activityDidChange(const RunLoopObserver::Delegate *delegate, RunLoopObserver::Activity activity)
      const noexcept override
  {
    RCTScheduler *scheduler = (__bridge RCTScheduler *)scheduler_;
    [scheduler animationTick];
  }

 private:
  void *scheduler_;
};

@interface RCTAnimationChoreographerDisplayLinkTarget : NSObject
@property (nonatomic, assign) AnimationChoreographer *choreographer;
- (void)displayLinkTick:(CADisplayLink *)sender;
@end

@implementation RCTAnimationChoreographerDisplayLinkTarget
- (void)displayLinkTick:(CADisplayLink *)sender
{
  if (_choreographer != nullptr) {
    _choreographer->onAnimationFrame(std::chrono::duration<double>(sender.targetTimestamp));
  }
}
@end

class RCTAnimationChoreographer : public AnimationChoreographer {
  CADisplayLink *_animationDisplayLink;
  RCTAnimationChoreographerDisplayLinkTarget *_displayLinkTarget;

 public:
  RCTAnimationChoreographer() : _displayLinkTarget([[RCTAnimationChoreographerDisplayLinkTarget alloc] init])
  {
    _displayLinkTarget.choreographer = this;
  }
  ~RCTAnimationChoreographer() override
  {
    if (_animationDisplayLink != nil) {
      [_animationDisplayLink invalidate];
      _animationDisplayLink = nil;
    }
    _displayLinkTarget.choreographer = nullptr;
  }
  void resume() override
  {
    if (_animationDisplayLink == nil) {
      _animationDisplayLink = [CADisplayLink displayLinkWithTarget:_displayLinkTarget
                                                          selector:@selector(displayLinkTick:)];
      [_animationDisplayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
    }
    [_animationDisplayLink setPaused:NO];
  }
  void pause() override
  {
    [_animationDisplayLink setPaused:YES];
  }
};

@implementation RCTScheduler {
  std::unique_ptr<Scheduler> _scheduler;
  std::shared_ptr<LayoutAnimationDriver> _animationDriver;
  std::unique_ptr<SchedulerDelegateProxy> _delegateProxy;
  std::shared_ptr<LayoutAnimationDelegateProxy> _layoutAnimationDelegateProxy;
  std::unique_ptr<const PlatformRunLoopObserver> _uiRunLoopObserver;
}

- (instancetype)initWithToolbox:(SchedulerToolbox)toolbox
{
  if (self = [super init]) {
    _delegateProxy = std::make_unique<SchedulerDelegateProxy>((__bridge void *)self);

    if (ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS()) {
      _layoutAnimationDelegateProxy = std::make_shared<LayoutAnimationDelegateProxy>((__bridge void *)self);
      _animationDriver = std::make_shared<LayoutAnimationDriver>(
          toolbox.runtimeExecutor, toolbox.contextContainer, _layoutAnimationDelegateProxy.get());

      _uiRunLoopObserver = std::make_unique<MainRunLoopObserver>(
          RunLoopObserver::Activity::BeforeWaiting, _layoutAnimationDelegateProxy);

      _uiRunLoopObserver->setDelegate(_layoutAnimationDelegateProxy.get());
    }

    if (ReactNativeFeatureFlags::useSharedAnimatedBackend()) {
      toolbox.animationChoreographer = std::make_shared<RCTAnimationChoreographer>();
    }

    _scheduler = std::make_unique<Scheduler>(
        toolbox, (_animationDriver ? _animationDriver.get() : nullptr), _delegateProxy.get());
  }

  return self;
}

- (void)animationTick
{
  _scheduler->animationTick();
}

- (void)reportMount:(facebook::react::SurfaceId)surfaceId
{
  _scheduler->reportMount(surfaceId);
}

- (void)dealloc
{
  if (_animationDriver) {
    _animationDriver->setLayoutAnimationStatusDelegate(nullptr);
  }

  _scheduler->setDelegate(nullptr);
}

- (void)registerSurface:(const facebook::react::SurfaceHandler &)surfaceHandler
{
  _scheduler->registerSurface(surfaceHandler);
}

- (void)unregisterSurface:(const facebook::react::SurfaceHandler &)surfaceHandler
{
  _scheduler->unregisterSurface(surfaceHandler);
}

- (const ComponentDescriptor *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:(ComponentHandle)handle
{
  return _scheduler->findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(handle);
}

- (void)setupAnimationDriver:(const facebook::react::SurfaceHandler &)surfaceHandler
{
  surfaceHandler.getMountingCoordinator()->setMountingOverrideDelegate(_animationDriver);
}

- (void)onAnimationStarted
{
  if (_uiRunLoopObserver) {
    _uiRunLoopObserver->enable();
  }
}

- (void)onAllAnimationsComplete
{
  if (_uiRunLoopObserver) {
    _uiRunLoopObserver->disable();
  }
}

- (void)addEventListener:(const std::shared_ptr<EventListener> &)listener
{
  return _scheduler->addEventListener(listener);
}

- (void)removeEventListener:(const std::shared_ptr<EventListener> &)listener
{
  return _scheduler->removeEventListener(listener);
}

- (const std::shared_ptr<facebook::react::UIManager>)uiManager
{
  return _scheduler->getUIManager();
}

@end
