/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMountingManager.h"

#import <QuartzCore/QuartzCore.h>

#import <React/RCTAssert.h>
#import <React/RCTComponent.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <cxxreact/TraceSection.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/components/root/RootShadowNode.h>
#import <react/renderer/core/LayoutableShadowNode.h>
#import <react/renderer/core/RawProps.h>
#import <react/renderer/mounting/TelemetryController.h>
#import <react/utils/FollyConvert.h>

#import <React/RCTComponentViewProtocol.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTConversions.h>
#import <React/RCTMountingTransactionObserverCoordinator.h>

#include <deque>
#include <mutex>

using namespace facebook::react;

static SurfaceId RCTSurfaceIdForView(UIView *view)
{
  do {
    if (RCTIsReactRootView(@(view.tag))) {
      return view.tag;
    }
    view = view.superview;
  } while (view != nil);

  return -1;
}

static void RCTPerformMountInstructions(
    const ShadowViewMutationList &mutations,
    RCTComponentViewRegistry *registry,
    RCTMountingTransactionObserverCoordinator &observerCoordinator,
    SurfaceId surfaceId)
{
  TraceSection s("RCTPerformMountInstructions");

  for (const auto &mutation : mutations) {
    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        auto &newChildShadowView = mutation.newChildShadowView;
        auto &newChildViewDescriptor =
            [registry dequeueComponentViewWithComponentHandle:newChildShadowView.componentHandle
                                                          tag:newChildShadowView.tag];
        observerCoordinator.registerViewComponentDescriptor(newChildViewDescriptor, surfaceId);
        break;
      }

      case ShadowViewMutation::Delete: {
        auto &oldChildShadowView = mutation.oldChildShadowView;
        auto &oldChildViewDescriptor = [registry componentViewDescriptorWithTag:oldChildShadowView.tag];

        observerCoordinator.unregisterViewComponentDescriptor(oldChildViewDescriptor, surfaceId);

        [registry enqueueComponentViewWithComponentHandle:oldChildShadowView.componentHandle
                                                      tag:oldChildShadowView.tag
                                  componentViewDescriptor:oldChildViewDescriptor];
        break;
      }

      case ShadowViewMutation::Insert: {
        auto &newChildShadowView = mutation.newChildShadowView;
        auto &newChildViewDescriptor = [registry componentViewDescriptorWithTag:newChildShadowView.tag];
        auto &parentViewDescriptor = [registry componentViewDescriptorWithTag:mutation.parentTag];

        UIView<RCTComponentViewProtocol> *newChildComponentView = newChildViewDescriptor.view;

        RCTAssert(newChildShadowView.props, @"`newChildShadowView.props` must not be null.");

        [newChildComponentView updateProps:newChildShadowView.props oldProps:nullptr];
        [newChildComponentView updateEventEmitter:newChildShadowView.eventEmitter];
        [newChildComponentView updateState:newChildShadowView.state oldState:nullptr];
        [newChildComponentView updateLayoutMetrics:newChildShadowView.layoutMetrics
                                  oldLayoutMetrics:EmptyLayoutMetrics];
        [newChildComponentView finalizeUpdates:RNComponentViewUpdateMaskAll];

        [parentViewDescriptor.view mountChildComponentView:newChildComponentView index:mutation.index];
        break;
      }

      case ShadowViewMutation::Remove: {
        auto &oldChildShadowView = mutation.oldChildShadowView;
        auto &oldChildViewDescriptor = [registry componentViewDescriptorWithTag:oldChildShadowView.tag];
        auto &parentViewDescriptor = [registry componentViewDescriptorWithTag:mutation.parentTag];
        [parentViewDescriptor.view unmountChildComponentView:oldChildViewDescriptor.view index:mutation.index];
        break;
      }

      case ShadowViewMutation::Update: {
        auto &oldChildShadowView = mutation.oldChildShadowView;
        auto &newChildShadowView = mutation.newChildShadowView;
        auto &newChildViewDescriptor = [registry componentViewDescriptorWithTag:newChildShadowView.tag];
        UIView<RCTComponentViewProtocol> *newChildComponentView = newChildViewDescriptor.view;

        auto mask = RNComponentViewUpdateMask{};

        RCTAssert(newChildShadowView.props, @"`newChildShadowView.props` must not be null.");

        if (oldChildShadowView.props != newChildShadowView.props) {
          [newChildComponentView updateProps:newChildShadowView.props oldProps:oldChildShadowView.props];
          mask |= RNComponentViewUpdateMaskProps;
        }

        if (oldChildShadowView.eventEmitter != newChildShadowView.eventEmitter) {
          [newChildComponentView updateEventEmitter:newChildShadowView.eventEmitter];
          mask |= RNComponentViewUpdateMaskEventEmitter;
        }

        if (oldChildShadowView.state != newChildShadowView.state) {
          [newChildComponentView updateState:newChildShadowView.state oldState:oldChildShadowView.state];
          mask |= RNComponentViewUpdateMaskState;
        }

        if (oldChildShadowView.layoutMetrics != newChildShadowView.layoutMetrics) {
          [newChildComponentView updateLayoutMetrics:newChildShadowView.layoutMetrics
                                    oldLayoutMetrics:oldChildShadowView.layoutMetrics];
          mask |= RNComponentViewUpdateMaskLayoutMetrics;
        }

        if (mask != RNComponentViewUpdateMaskNone) {
          [newChildComponentView finalizeUpdates:mask];
        }

        break;
      }
    }
  }
}

@implementation RCTMountingManager {
  RCTMountingTransactionObserverCoordinator _observerCoordinator;
  BOOL _transactionInFlight;
  BOOL _followUpTransactionRequired;
  std::shared_ptr<const ContextContainer> _contextContainer;
  // With `enableSameFrameMountForDiscreteEvents`, the main thread work that
  // other threads schedule (transactions, commands, accessibility events and
  // responder changes) goes through this one FIFO queue, so it runs in the
  // order it was scheduled whether the main queue or
  // `performPendingOperations` gets to it first.
  std::mutex _pendingOperationsMutex;
  std::deque<dispatch_block_t> _pendingOperations;
  BOOL _performingPendingOperations;
  // `performPendingOperations` was called while it could not run; the
  // transaction or the drain in progress runs it when it finishes.
  BOOL _pendingOperationsDeferred;
}

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewRegistry = [RCTComponentViewRegistry new];
  }

  return self;
}

- (void)setContextContainer:(std::shared_ptr<const ContextContainer>)contextContainer
{
  _contextContainer = contextContainer;
}

- (void)attachSurfaceToView:(UIView *)view surfaceId:(SurfaceId)surfaceId
{
  RCTAssertMainQueue();

  RCTAssert(view.subviews.count == 0, @"The view must not have any subviews.");

  RCTComponentViewDescriptor rootViewDescriptor =
      [_componentViewRegistry dequeueComponentViewWithComponentHandle:RootShadowNode::Handle() tag:surfaceId];
  [view addSubview:rootViewDescriptor.view];
}

- (void)detachSurfaceFromView:(UIView *)view surfaceId:(SurfaceId)surfaceId
{
  RCTAssertMainQueue();
  RCTComponentViewDescriptor rootViewDescriptor = [_componentViewRegistry componentViewDescriptorWithTag:surfaceId];

  [rootViewDescriptor.view removeFromSuperview];

  [_componentViewRegistry enqueueComponentViewWithComponentHandle:RootShadowNode::Handle()
                                                              tag:surfaceId
                                          componentViewDescriptor:rootViewDescriptor];
}

- (void)scheduleTransaction:(std::shared_ptr<const MountingCoordinator>)mountingCoordinator
{
  if (ReactNativeFeatureFlags::enableSameFrameMountForDiscreteEvents()) {
    [self _performInOrder:^{
      [self initiateTransaction:*mountingCoordinator];
    }];
    return;
  }

  if (RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to do expensive copy of all mutations;
    // * No need to allocate a block.
    [self initiateTransaction:*mountingCoordinator];
    return;
  }

  RCTExecuteOnMainQueue(^{
    RCTAssertMainQueue();
    [self initiateTransaction:*mountingCoordinator];
  });
}

/*
 * Runs `operation` on the main thread after every operation scheduled before
 * it through this method. Called from another thread, the operation is queued
 * and a main queue block drains the queue (or `performPendingOperations` does,
 * earlier). Called on the main thread, the queue is drained first and the
 * operation runs right away, unless a transaction or a drain is in progress:
 * then the operation is nested inside it and runs right away, as it does
 * without the queue.
 */
- (void)_performInOrder:(dispatch_block_t)operation
{
  if (RCTIsMainQueue()) {
    if (!_transactionInFlight && !_performingPendingOperations) {
      [self performPendingOperations];
    }
    operation();
    return;
  }

  {
    std::lock_guard<std::mutex> lock(_pendingOperationsMutex);
    _pendingOperations.push_back(operation);
  }
  RCTExecuteOnMainQueue(^{
    [self performPendingOperations];
  });
}

- (void)performPendingOperations
{
  RCTAssertMainQueue();
  if (_transactionInFlight || _performingPendingOperations) {
    // Not re-entrant: the transaction or the drain in progress runs the queue
    // once it finishes.
    _pendingOperationsDeferred = YES;
    return;
  }

  _performingPendingOperations = YES;
  @try {
    while (true) {
      dispatch_block_t operation;
      {
        std::lock_guard<std::mutex> lock(_pendingOperationsMutex);
        if (_pendingOperations.empty()) {
          break;
        }
        operation = _pendingOperations.front();
        _pendingOperations.pop_front();
      }
      operation();
    }
  } @finally {
    _performingPendingOperations = NO;
  }
  // The loop above ran until the queue was empty; every operation queued
  // since has its own main queue block.
  _pendingOperationsDeferred = NO;
}

- (void)dispatchCommand:(ReactTag)reactTag commandName:(NSString *)commandName args:(NSArray *)args
{
  if (ReactNativeFeatureFlags::enableSameFrameMountForDiscreteEvents()) {
    [self _performInOrder:^{
      [self synchronouslyDispatchCommandOnUIThread:reactTag commandName:commandName args:args];
    }];
    return;
  }

  if (RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to allocate a block.
    [self synchronouslyDispatchCommandOnUIThread:reactTag commandName:commandName args:args];
    return;
  }

  RCTExecuteOnMainQueue(^{
    [self synchronouslyDispatchCommandOnUIThread:reactTag commandName:commandName args:args];
  });
}

- (void)sendAccessibilityEvent:(ReactTag)reactTag eventType:(NSString *)eventType
{
  if (ReactNativeFeatureFlags::enableSameFrameMountForDiscreteEvents()) {
    [self _performInOrder:^{
      [self synchronouslyDispatchAccessbilityEventOnUIThread:reactTag eventType:eventType];
    }];
    return;
  }

  if (RCTIsMainQueue()) {
    // Already on the proper thread, so:
    // * No need to do a thread jump;
    // * No need to allocate a block.
    [self synchronouslyDispatchAccessbilityEventOnUIThread:reactTag eventType:eventType];
    return;
  }

  RCTExecuteOnMainQueue(^{
    [self synchronouslyDispatchAccessbilityEventOnUIThread:reactTag eventType:eventType];
  });
}

- (void)initiateTransaction:(const MountingCoordinator &)mountingCoordinator
{
  TraceSection s("-[RCTMountingManager initiateTransaction:]");
  RCTAssertMainQueue();

  if (_transactionInFlight) {
    _followUpTransactionRequired = YES;
    return;
  }

  do {
    _followUpTransactionRequired = NO;
    _transactionInFlight = YES;
    [self performTransaction:mountingCoordinator];
    _transactionInFlight = NO;
  } while (_followUpTransactionRequired);

  if (_pendingOperationsDeferred) {
    [self performPendingOperations];
  }
}

- (void)performTransaction:(const MountingCoordinator &)mountingCoordinator
{
  TraceSection s("-[RCTMountingManager performTransaction:]");
  RCTAssertMainQueue();

  auto surfaceId = mountingCoordinator.getSurfaceId();

  mountingCoordinator.getTelemetryController().pullTransaction(
      [&](const MountingTransaction &transaction, const SurfaceTelemetry &surfaceTelemetry) {
        [self.delegate mountingManager:self willMountComponentsWithRootTag:surfaceId];
        _observerCoordinator.notifyObserversMountingTransactionWillMount(transaction, surfaceTelemetry);
      },
      [&](const MountingTransaction &transaction, const SurfaceTelemetry &surfaceTelemetry) {
        RCTPerformMountInstructions(
            transaction.getMutations(), _componentViewRegistry, _observerCoordinator, surfaceId);
      },
      [&](const MountingTransaction &transaction, const SurfaceTelemetry &surfaceTelemetry) {
        _observerCoordinator.notifyObserversMountingTransactionDidMount(transaction, surfaceTelemetry);
        [self.delegate mountingManager:self didMountComponentsWithRootTag:surfaceId];
      });
}

- (void)setIsJSResponder:(BOOL)isJSResponder
    blockNativeResponder:(BOOL)blockNativeResponder
           forShadowView:(const facebook::react::ShadowView &)shadowView
{
  ReactTag reactTag = shadowView.tag;
  dispatch_block_t operation = ^{
    UIView<RCTComponentViewProtocol> *componentView = [self->_componentViewRegistry findComponentViewWithTag:reactTag];
    [componentView setIsJSResponder:isJSResponder];
  };
  if (ReactNativeFeatureFlags::enableSameFrameMountForDiscreteEvents()) {
    [self _performInOrder:operation];
    return;
  }
  RCTExecuteOnMainQueue(operation);
}

- (void)synchronouslyUpdateViewOnUIThread:(ReactTag)reactTag
                             changedProps:(folly::dynamic)props
                      componentDescriptor:(const ComponentDescriptor &)componentDescriptor
{
  RCTAssertMainQueue();
  bool updatesTransform = props.find("transform") != props.items().end();
  bool updatesOpacity = props.find("opacity") != props.items().end();

  UIView<RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:reactTag];
  if (!componentView) {
    RCTLogWarn(@"Attempted to update view with tag %ld, but it no longer exists", (long)reactTag);
    return;
  }

  NSSet<NSString *> *propKeys = componentView.propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN ?: [NSSet new];

  if (!ReactNativeFeatureFlags::useSharedAnimatedBackend()) {
    NSArray<NSString *> *propsKeysToBeUpdated = extractKeysFromFollyDynamic(props);
    propKeys = [propKeys setByAddingObjectsFromArray:propsKeysToBeUpdated];
  }

  SurfaceId surfaceId = RCTSurfaceIdForView(componentView);
  Props::Shared oldProps = [componentView props];
  Props::Shared newProps = componentDescriptor.cloneProps(
      PropsParserContext{surfaceId, *_contextContainer}, oldProps, RawProps(std::move(props)));

  componentView.propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN = nil;
  [componentView updateProps:newProps oldProps:oldProps];
  componentView.propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN = propKeys;

  const auto &newViewProps = static_cast<const ViewProps &>(*newProps);

  if (updatesTransform) {
    auto layoutMetrics = LayoutMetrics();
    layoutMetrics.frame.size.width = componentView.layer.bounds.size.width;
    layoutMetrics.frame.size.height = componentView.layer.bounds.size.height;
    CATransform3D newTransform = RCTCATransform3DFromTransformMatrix(newViewProps.resolveTransform(layoutMetrics));
    if (!CATransform3DEqualToTransform(newTransform, componentView.layer.transform)) {
      componentView.layer.transform = newTransform;
    }
  }
  if (updatesOpacity && componentView.layer.opacity != (float)newViewProps.opacity) {
    componentView.layer.opacity = newViewProps.opacity;
  }

  [componentView finalizeUpdates:RNComponentViewUpdateMaskProps];
}

- (void)synchronouslyDispatchCommandOnUIThread:(ReactTag)reactTag
                                   commandName:(NSString *)commandName
                                          args:(NSArray *)args
{
  RCTAssertMainQueue();
  UIView<RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:reactTag];
  [componentView handleCommand:commandName args:args];
}

- (void)synchronouslyDispatchAccessbilityEventOnUIThread:(ReactTag)reactTag eventType:(NSString *)eventType
{
  if ([@"focus" isEqualToString:eventType]) {
    UIView<RCTComponentViewProtocol> *componentView = [_componentViewRegistry findComponentViewWithTag:reactTag];
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, componentView);
  }
}

@end
