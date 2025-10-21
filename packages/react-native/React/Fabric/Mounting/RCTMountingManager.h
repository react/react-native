/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTMountingManagerDelegate.h>
#import <React/RCTPrimitives.h>
#import <React/RCTFabricSurface.h>
#import <react/renderer/core/ComponentDescriptor.h>
#import <react/renderer/core/RawProps.h>
#import <react/renderer/core/ReactPrimitives.h>
#import <react/renderer/mounting/MountingCoordinator.h>
#import <react/renderer/mounting/ShadowView.h>
#import <react/utils/ContextContainer.h>

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

- (void)measureAsyncOnUI:(ReactTag)reactTag rootView:(UIView*)rootView callback:(const std::function<void (folly::dynamic)> &)callback;
@end

NS_ASSUME_NONNULL_END
