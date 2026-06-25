/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTSurfaceProtocol.h>
#import <React/RCTSurfaceStage.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTBridge;
@class RCTSurfaceView;
@protocol RCTSurfaceDelegate;

/**
 * RCTSurface instance represents React Native-powered piece of a user interface
 * which can be a full-screen app, separate modal view controller,
 * or even small widget.
 * It is called "Surface".
 *
 * The RCTSurface instance is completely thread-safe by design;
 * it can be created on any thread, and any its method can be called from
 * any thread (if the opposite is not mentioned explicitly).
 *
 * The primary goals of the RCTSurface are:
 *  * ability to measure and layout the surface in a thread-safe
 *    and synchronous manner;
 *  * ability to create a UIView instance on demand (later);
 *  * ability to communicate the current stage of the surface granularly.
 */
#pragma clang diagnostic push
#pragma clang diagnostic warning "-Wdeprecated"
__deprecated_msg("This API will be removed along with the legacy architecture.") @interface RCTSurface
    : NSObject<RCTSurfaceProtocol>
#pragma clang diagnostic pop

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties;

#pragma mark - Layout: Setting the size constrains

/**
 * Previously set `minimumSize` layout constraint.
 * Defaults to `{0, 0}`.
 */
@property (atomic, assign, readonly) CGSize minimumSize;

/**
 * Previously set `maximumSize` layout constraint.
 * Defaults to `{CGFLOAT_MAX, CGFLOAT_MAX}`.
 */
@property (atomic, assign, readonly) CGSize maximumSize;

/**
 * Simple shortcut to `-[RCTSurface setMinimumSize:size maximumSize:size]`.
 */
- (void)setSize:(CGSize)size;

#pragma mark - Synchronous waiting

/**
 * Synchronously blocks the current thread up to given `timeout` until
 * the Surface reaches `stage`.
 * Limitations:
 *  - Do nothing, if called on `UIManager` queue.
 *  - Calling on the main queue with `RCTSurfaceStageSurfaceDidInitialMounting`
 *    stage temporary is not supported; in this case the stage will be
 *    downgraded to `RCTSurfaceStageSurfaceDidInitialLayout`.
 */
- (BOOL)synchronouslyWaitForStage:(RCTSurfaceStage)stage timeout:(NSTimeInterval)timeout;

#pragma mark - Mounting/Unmounting of React components

/**
 * Mount the React component specified by the given moduleName. This is typically
 * calling runApplication.js from the native side.
 */
- (void)mountReactComponentWithBridge:(RCTBridge *)bridge
                           moduleName:(NSString *)moduleName
                               params:(NSDictionary *)params;

/**
 * Unmount the React component specified by the given rootViewTag, called from native.
 */
- (void)unmountReactComponentWithBridge:(RCTBridge *)bridge rootViewTag:(NSNumber *)rootViewTag;

@end

NS_ASSUME_NONNULL_END
