/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePresenter.h"

#import <mutex>
#import <shared_mutex>
#import <unordered_set>

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTConstants.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTI18nUtil.h>
#import <React/RCTMountingManager.h>
#import <React/RCTMountingManagerDelegate.h>
#import <React/RCTScheduler.h>
#import <React/RCTSurfaceRegistry.h>
#import <React/RCTSurfaceView+Internal.h>
#import <React/RCTSurfaceView.h>
#import <React/RCTUtils.h>
#import <react/utils/FollyConvert.h>

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#import <react/renderer/components/text/BaseTextProps.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/scheduler/SchedulerToolbox.h>
#import <react/utils/ContextContainer.h>
#import <react/utils/ManagedObjectWrapper.h>
#import "AppleEventBeat.h"

#import "PlatformRunLoopObserver.h"
#import "RCTConversions.h"

using namespace facebook;
using namespace facebook::react;

@interface RCTSurfacePresenter () <RCTSchedulerDelegate, RCTMountingManagerDelegate>
- (void)_drainPendingReactRevisionMerges;
@end

namespace {
class ReactRevisionMergeRunLoopObserverDelegate final : public RunLoopObserver::Delegate {
 public:
  explicit ReactRevisionMergeRunLoopObserverDelegate(RCTSurfacePresenter *surfacePresenter)
      : surfacePresenter_(surfacePresenter)
  {
  }

  void activityDidChange(const RunLoopObserver::Delegate * /*delegate*/, RunLoopObserver::Activity /*activity*/)
      const noexcept override
  {
    [surfacePresenter_ _drainPendingReactRevisionMerges];
  }

 private:
  __weak RCTSurfacePresenter *surfacePresenter_;
};
} // namespace

@implementation RCTSurfacePresenter {
  RCTMountingManager *_mountingManager; // Thread-safe.
  RCTSurfaceRegistry *_surfaceRegistry; // Thread-safe.

  std::mutex _schedulerAccessMutex;
  std::mutex _schedulerLifeCycleMutex;
  RCTScheduler *_Nullable _scheduler; // Thread-safe. Pointer is protected by `_schedulerAccessMutex`.
  std::shared_ptr<const ContextContainer> _contextContainer; // Protected by `_schedulerLifeCycleMutex`.
  RuntimeExecutor _runtimeExecutor; // Protected by `_schedulerLifeCycleMutex`.
  std::optional<RuntimeExecutor> _bridgelessBindingsExecutor; // Only used for installing bindings.

  std::shared_mutex _observerListMutex;
  std::vector<__weak id<RCTSurfacePresenterObserver>> _observers; // Protected by `_observerListMutex`.

  std::mutex _pendingReactRevisionMergesMutex;
  // Pending React revision merges, drained on the main run loop just before it sleeps.
  std::unordered_set<SurfaceId> _pendingReactRevisionMerges; // Protected by `_pendingReactRevisionMergesMutex`.
  std::shared_ptr<ReactRevisionMergeRunLoopObserverDelegate> _mergeRunLoopObserverDelegate;
  std::unique_ptr<const MainRunLoopObserver> _mergeRunLoopObserver;
}

- (instancetype)initWithContextContainer:(std::shared_ptr<const ContextContainer>)contextContainer
                         runtimeExecutor:(RuntimeExecutor)runtimeExecutor
              bridgelessBindingsExecutor:(std::optional<RuntimeExecutor>)bridgelessBindingsExecutor
{
  if (self = [super init]) {
    assert(contextContainer && "RuntimeExecutor must be not null.");
    _runtimeExecutor = runtimeExecutor;
    _bridgelessBindingsExecutor = bridgelessBindingsExecutor;
    _contextContainer = contextContainer;

    _surfaceRegistry = [RCTSurfaceRegistry new];
    _mountingManager = [RCTMountingManager new];
    _mountingManager.contextContainer = contextContainer;
    _mountingManager.delegate = self;

    if (ReactNativeFeatureFlags::enableFabricCommitBranching()) {
      _mergeRunLoopObserverDelegate = std::make_shared<ReactRevisionMergeRunLoopObserverDelegate>(self);
      _mergeRunLoopObserver = std::make_unique<const MainRunLoopObserver>(
          RunLoopObserver::Activity::BeforeWaiting, _mergeRunLoopObserverDelegate);
      _mergeRunLoopObserver->setDelegate(_mergeRunLoopObserverDelegate.get());
      _mergeRunLoopObserver->enable();
    }

    _scheduler = [self _createScheduler];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_applicationWillTerminate)
                                                 name:UIApplicationWillTerminateNotification
                                               object:nil];
  }

  return self;
}

- (RCTMountingManager *)mountingManager
{
  return _mountingManager;
}

- (RCTScheduler *_Nullable)scheduler
{
  std::lock_guard<std::mutex> lock(_schedulerAccessMutex);
  return _scheduler;
}

- (std::shared_ptr<const ContextContainer>)contextContainer
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);
  return _contextContainer;
}

- (void)setRuntimeExecutor:(RuntimeExecutor)runtimeExecutor
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);
  _runtimeExecutor = runtimeExecutor;
}

#pragma mark - Internal Surface-dedicated Interface

- (void)registerSurface:(RCTFabricSurface *)surface
{
  [_surfaceRegistry registerSurface:surface];
  RCTScheduler *scheduler = [self scheduler];
  if (scheduler) {
    [scheduler registerSurface:surface.surfaceHandler];
  }
}

- (void)unregisterSurface:(RCTFabricSurface *)surface
{
  RCTScheduler *scheduler = [self scheduler];
  if (scheduler) {
    [scheduler unregisterSurface:surface.surfaceHandler];
  }
  [_surfaceRegistry unregisterSurface:surface];
}

- (RCTFabricSurface *)surfaceForRootTag:(ReactTag)rootTag
{
  return [_surfaceRegistry surfaceForRootTag:rootTag];
}

- (id<RCTSurfaceProtocol>)createFabricSurfaceForModuleName:(NSString *)moduleName
                                         initialProperties:(NSDictionary *)initialProperties
{
  return [[RCTFabricSurface alloc] initWithSurfacePresenter:self
                                                 moduleName:moduleName
                                          initialProperties:initialProperties];
}

- (UIView *)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag
{
  UIView<RCTComponentViewProtocol> *componentView =
      [_mountingManager.componentViewRegistry findComponentViewWithTag:tag];
  return componentView;
}

- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag props:(NSDictionary *)props
{
  ReactTag tag = [reactTag integerValue];
  [self schedulerDidSynchronouslyUpdateViewOnUIThread:tag props:convertIdToFollyDynamic(props)];
}

- (void)schedulerDidSynchronouslyUpdateViewOnUIThread:(ReactTag)tag props:(folly::dynamic)props
{
  RCTScheduler *scheduler = [self scheduler];
  if (!scheduler) {
    return;
  }

  UIView<RCTComponentViewProtocol> *componentView =
      [_mountingManager.componentViewRegistry findComponentViewWithTag:tag];
  if (componentView == nil) {
    return; // This view probably isn't managed by Fabric
  }
  ComponentHandle handle = [[componentView class] componentDescriptorProvider].handle;
  auto *componentDescriptor = [scheduler findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:handle];

  if (!componentDescriptor) {
    return;
  }

  [_mountingManager synchronouslyUpdateViewOnUIThread:tag
                                         changedProps:std::move(props)
                                  componentDescriptor:*componentDescriptor];
}

- (void)setupAnimationDriverWithSurfaceHandler:(const facebook::react::SurfaceHandler &)surfaceHandler
{
  [[self scheduler] setupAnimationDriver:surfaceHandler];
}

- (BOOL)suspend
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);

  RCTScheduler *scheduler;
  {
    std::lock_guard<std::mutex> accessLock(_schedulerAccessMutex);

    if (!_scheduler) {
      return NO;
    }
    scheduler = _scheduler;
    _scheduler = nil;
  }

  [self _stopAllSurfacesWithScheduler:scheduler];

  return YES;
}

- (BOOL)resume
{
  std::lock_guard<std::mutex> lock(_schedulerLifeCycleMutex);

  RCTScheduler *scheduler;
  {
    std::lock_guard<std::mutex> accessLock(_schedulerAccessMutex);

    if (_scheduler) {
      return NO;
    }
    scheduler = [self _createScheduler];
  }

  [self _startAllSurfacesWithScheduler:scheduler];

  {
    std::lock_guard<std::mutex> accessLock(_schedulerAccessMutex);
    _scheduler = scheduler;
  }

  return YES;
}

#pragma mark - Private

- (RCTScheduler *)_createScheduler
{
  auto componentRegistryFactory = [factory =
                                       wrapManagedObject(_mountingManager.componentViewRegistry.componentViewFactory)](
                                      const EventDispatcher::Weak &eventDispatcher,
                                      const std::shared_ptr<const ContextContainer> &contextContainer) {
    return [(RCTComponentViewFactory *)unwrapManagedObject(factory)
        createComponentDescriptorRegistryWithParameters:{.eventDispatcher = eventDispatcher,
                                                         .contextContainer = contextContainer}];
  };

  auto runtimeExecutor = _runtimeExecutor;

  auto toolbox = SchedulerToolbox{};
  toolbox.contextContainer = _contextContainer;
  toolbox.componentRegistryFactory = componentRegistryFactory;

  auto weakRuntimeScheduler = _contextContainer->find<std::weak_ptr<RuntimeScheduler>>(RuntimeSchedulerKey);
  auto runtimeScheduler = weakRuntimeScheduler.has_value() ? weakRuntimeScheduler.value().lock() : nullptr;
  if (runtimeScheduler) {
    runtimeExecutor = [runtimeScheduler](std::function<void(jsi::Runtime & runtime)> &&callback) {
      runtimeScheduler->scheduleWork(std::move(callback));
    };
  }

  toolbox.runtimeExecutor = runtimeExecutor;
  toolbox.bridgelessBindingsExecutor = _bridgelessBindingsExecutor;

  toolbox.eventBeatFactory =
      [runtimeScheduler](std::shared_ptr<EventBeat::OwnerBox> ownerBox) -> std::unique_ptr<EventBeat> {
    auto runLoopObserver =
        std::make_unique<const MainRunLoopObserver>(RunLoopObserver::Activity::BeforeWaiting, ownerBox->owner);
    return std::make_unique<AppleEventBeat>(std::move(ownerBox), std::move(runLoopObserver), *runtimeScheduler);
  };

  RCTScheduler *scheduler = [[RCTScheduler alloc] initWithToolbox:toolbox];
  scheduler.delegate = self;

  return scheduler;
}

- (void)_startAllSurfacesWithScheduler:(RCTScheduler *)scheduler
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<RCTFabricSurface *> *enumerator) {
    for (RCTFabricSurface *surface in enumerator) {
      [scheduler registerSurface:surface.surfaceHandler];
      [surface start];
    }
  }];
}

- (void)_stopAllSurfacesWithScheduler:(RCTScheduler *)scheduler
{
  [_surfaceRegistry enumerateWithBlock:^(NSEnumerator<RCTFabricSurface *> *enumerator) {
    for (RCTFabricSurface *surface in enumerator) {
      [surface stop];
      [scheduler unregisterSurface:surface.surfaceHandler];
    }
  }];
}

- (void)_applicationWillTerminate
{
  [self suspend];
}

#pragma mark - RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(std::shared_ptr<const MountingCoordinator>)mountingCoordinator
{
  // no-op, we will flush the transaction from schedulerShouldRenderTransactions
}

- (void)schedulerShouldRenderTransactions:(std::shared_ptr<const MountingCoordinator>)mountingCoordinator
{
  [_mountingManager scheduleTransaction:mountingCoordinator];
}

- (void)schedulerShouldMergeReactRevision:(SurfaceId)surfaceId
{
  if (RCTIsMainQueue()) {
    [self _mergeReactRevisionForSurfaceId:surfaceId];
    return;
  }

  bool needsWake = false;
  {
    std::lock_guard<std::mutex> lock(_pendingReactRevisionMergesMutex);
    needsWake = _pendingReactRevisionMerges.empty();
    _pendingReactRevisionMerges.insert(surfaceId);
  }

  if (needsWake) {
    CFRunLoopWakeUp(CFRunLoopGetMain());
  }
}

- (void)_mergeReactRevisionForSurfaceId:(SurfaceId)surfaceId
{
  RCTAssertMainQueue();
  RCTScheduler *scheduler = [self scheduler];
  if (!scheduler) {
    return;
  }

  auto uiManager = scheduler.uiManager;
  if (!uiManager) {
    return;
  }

  uiManager->getShadowTreeRegistry().visit(
      surfaceId, [](const ShadowTree &shadowTree) { shadowTree.mergeReactRevision(); });
}

- (void)_drainPendingReactRevisionMerges
{
  RCTAssertMainQueue();

  std::unordered_set<SurfaceId> pending;
  {
    std::lock_guard<std::mutex> lock(_pendingReactRevisionMergesMutex);
    if (_pendingReactRevisionMerges.empty()) {
      return;
    }

    pending.swap(_pendingReactRevisionMerges);
  }

  for (auto surfaceId : pending) {
    [self _mergeReactRevisionForSurfaceId:surfaceId];
  }
}

- (void)schedulerDidDispatchCommand:(const ShadowView &)shadowView
                        commandName:(const std::string &)commandName
                               args:(const folly::dynamic &)args
{
  ReactTag tag = shadowView.tag;
  NSString *commandStr = [[NSString alloc] initWithUTF8String:commandName.c_str()];
  NSArray *argsArray = convertFollyDynamicToId(args);

  [_mountingManager dispatchCommand:tag commandName:commandStr args:argsArray];
}

- (void)schedulerDidSendAccessibilityEvent:(const facebook::react::ShadowView &)shadowView
                                 eventType:(const std::string &)eventType
{
  ReactTag tag = shadowView.tag;
  NSString *eventTypeStr = [[NSString alloc] initWithUTF8String:eventType.c_str()];

  [_mountingManager sendAccessibilityEvent:tag eventType:eventTypeStr];
}

- (void)schedulerDidSetIsJSResponder:(BOOL)isJSResponder
                blockNativeResponder:(BOOL)blockNativeResponder
                       forShadowView:(const facebook::react::ShadowView &)shadowView;
{
  [_mountingManager setIsJSResponder:isJSResponder blockNativeResponder:blockNativeResponder forShadowView:shadowView];
}

- (void)addObserver:(id<RCTSurfacePresenterObserver>)observer
{
  std::unique_lock lock(_observerListMutex);
  _observers.push_back(observer);
}

- (void)removeObserver:(id<RCTSurfacePresenterObserver>)observer
{
  std::unique_lock lock(_observerListMutex);
  std::vector<__weak id<RCTSurfacePresenterObserver>>::const_iterator it =
      std::find(_observers.begin(), _observers.end(), observer);
  if (it != _observers.end()) {
    _observers.erase(it);
  }
}

#pragma mark - RCTMountingManagerDelegate

- (void)mountingManager:(RCTMountingManager *)mountingManager willMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTAssertMainQueue();

  NSArray<id<RCTSurfacePresenterObserver>> *observersCopy;
  {
    std::shared_lock lock(_observerListMutex);
    observersCopy = [self _getObservers];
  }

  for (id<RCTSurfacePresenterObserver> observer in observersCopy) {
    if ([observer respondsToSelector:@selector(willMountComponentsWithRootTag:)]) {
      [observer willMountComponentsWithRootTag:rootTag];
    }
  }
}

- (void)mountingManager:(RCTMountingManager *)mountingManager didMountComponentsWithRootTag:(ReactTag)rootTag
{
  RCTAssertMainQueue();

  NSArray<id<RCTSurfacePresenterObserver>> *observersCopy;
  {
    std::shared_lock lock(_observerListMutex);
    observersCopy = [self _getObservers];
  }

  for (id<RCTSurfacePresenterObserver> observer in observersCopy) {
    if ([observer respondsToSelector:@selector(didMountComponentsWithRootTag:)]) {
      [observer didMountComponentsWithRootTag:rootTag];
    }
  }

  RCTScheduler *scheduler = [self scheduler];
  if (scheduler) {
    // Notify mount when the effects are visible and prevent mount hooks to
    // delay paint.
    dispatch_async(dispatch_get_main_queue(), ^{
      [scheduler reportMount:rootTag];
    });
  }
}

- (NSArray<id<RCTSurfacePresenterObserver>> *)_getObservers
{
  NSMutableArray<id<RCTSurfacePresenterObserver>> *observersCopy = [NSMutableArray new];
  for (id<RCTSurfacePresenterObserver> observer : _observers) {
    if (observer) {
      [observersCopy addObject:observer];
    }
  }

  return observersCopy;
}

@end
