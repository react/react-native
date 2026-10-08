/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTPrimitives.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTSurfaceStage.h>
#import <React/Utils.h>
#import <ReactCommon/RuntimeExecutor.h>
#import <react/renderer/scheduler/SurfaceHandler.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTFabricSurface;
@class RCTImageLoader;
@class RCTMountingManager;
@class RCTScheduler;

/**
 * Coordinates presenting of React Native Surfaces and represents application
 * facing interface of running React Native core.
 */
@interface RCTSurfacePresenter : NSObject

- (instancetype)initWithContextContainer:(std::shared_ptr<const facebook::react::ContextContainer>)contextContainer
                         runtimeExecutor:(facebook::react::RuntimeExecutor)runtimeExecutor
              bridgelessBindingsExecutor:(std::optional<facebook::react::RuntimeExecutor>)bridgelessBindingsExecutor;

@property (nonatomic) std::shared_ptr<const facebook::react::ContextContainer> contextContainer;
@property (nonatomic) facebook::react::RuntimeExecutor runtimeExecutor;

/*
 * Suspends/resumes all surfaces associated with the presenter.
 * Suspending is a process or graceful stopping all surfaces and destroying all underlying infrastructure
 * with a future possibility of recreating the infrastructure and restarting the surfaces from scratch.
 * Suspending is usually a part of a bundle reloading process.
 * Can be called on any thread.
 */
- (BOOL)suspend;
- (BOOL)resume;

@end

@interface RCTSurfacePresenter (Surface) <RCTSurfacePresenterStub>

/*
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(RCTFabricSurface *)surface;
- (void)unregisterSurface:(RCTFabricSurface *)surface;

@property (readonly) RCTMountingManager *mountingManager;
@property (readonly, nullable) RCTScheduler *scheduler;

/*
 * Allow callers to initialize a new fabric surface without adding Fabric as a Buck dependency.
 */
- (id<RCTSurfaceProtocol>)createFabricSurfaceForModuleName:(NSString *)moduleName
                                         initialProperties:(NSDictionary *)initialProperties;

- (nullable RCTFabricSurface *)surfaceForRootTag:(ReactTag)rootTag;

- (void)synchronouslyUpdateViewOnUIThread:(NSNumber *)reactTag props:(NSDictionary *)props;
- (void)schedulerDidSynchronouslyUpdateViewOnUIThread:(ReactTag)tag props:(folly::dynamic)props;

- (void)setupAnimationDriverWithSurfaceHandler:(const facebook::react::SurfaceHandler &)surfaceHandler;

/*
 * Deprecated.
 * Use `RCTMountingTransactionObserverCoordinator` instead.
 */
- (void)addObserver:(id<RCTSurfacePresenterObserver>)observer;
- (void)removeObserver:(id<RCTSurfacePresenterObserver>)observer;

/*
 * Please do not use this, this will be deleted soon.
 */
- (nullable UIView *)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag;

@end

NS_ASSUME_NONNULL_END
