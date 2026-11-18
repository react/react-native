/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountingManagerDelegate.h>
#import <React/RCTPrimitives.h>
#import <React/RendererCore.h>
#import <React/Utils.h>
#import <react/renderer/mounting/MountingCoordinator.h>
#import <react/renderer/mounting/ShadowView.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface RCTMountingManager : NSObject

@property (nonatomic, weak) id<RCTMountingManagerDelegate> delegate;
@property (nonatomic, strong) RCTComponentViewRegistry *componentViewRegistry;

- (void)setContextContainer:(std::shared_ptr<const facebook::react::ContextContainer>)contextContainer;

/**
 * Designates the view as a rendering viewport of a React Native surface.
 * The provided view must not have any subviews, and the caller is not supposed to interact with the view hierarchy
 * inside the provided view. The view hierarchy created by mounting infrastructure inside the provided view does not
 * influence the intrinsic size of the view and cannot be measured using UIView/UIKit layout API.
 * Must be called on the main thead.
 */
- (void)attachSurfaceToView:(UIView *)view surfaceId:(facebook::react::SurfaceId)surfaceId;

/**
 * Stops designating the view as a rendering viewport of a React Native surface.
 */
- (void)detachSurfaceFromView:(UIView *)view surfaceId:(facebook::react::SurfaceId)surfaceId;

/**
 * Schedule a mounting transaction to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)scheduleTransaction:(std::shared_ptr<const facebook::react::MountingCoordinator>)mountingCoordinator;

/**
 * With `enableSameFrameMountForDiscreteEvents`, runs right away, in the order they were scheduled, the transactions,
 * commands, accessibility events and responder changes that other threads scheduled and the main queue has not run
 * yet. Their main queue blocks then find nothing left to do. Called while a transaction or another drain is in
 * progress, it runs once that finishes instead. Without the flag nothing is queued and this does nothing.
 * For React Native's event beat; must be called on the main thread.
 */
- (void)performPendingOperations;

/**
 * Dispatch a command to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)dispatchCommand:(ReactTag)reactTag commandName:(NSString *)commandName args:(NSArray *)args;

/**
 * Dispatch an accessibility event to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)sendAccessibilityEvent:(ReactTag)reactTag eventType:(NSString *)eventType;

- (void)setIsJSResponder:(BOOL)isJSResponder
    blockNativeResponder:(BOOL)blockNativeResponder
           forShadowView:(const facebook::react::ShadowView &)shadowView;

- (void)synchronouslyUpdateViewOnUIThread:(ReactTag)reactTag
                             changedProps:(folly::dynamic)props
                      componentDescriptor:(const facebook::react::ComponentDescriptor &)componentDescriptor;
@end

NS_ASSUME_NONNULL_END
