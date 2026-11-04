/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

/**
 * RCTBridgeConstants are constants that are only used in the legacy architecture.
 * Please place constants used in the new architecture into RCTConstants.
 */
/**
 * DEPRECATED - Use RCTReloadCommand instead. This notification fires just before the bridge starts
 * processing a request to reload.
 */
RCT_EXTERN NSString *const RCTBridgeWillReloadNotification __deprecated_msg("Use RCTReloadCommand instead.");

/**
 * This notification fires whenever a fast refresh happens.
 */
RCT_EXTERN NSString *const RCTBridgeFastRefreshNotification;

/**
 * This notification fires right after the bridge is about to invalidate NativeModule
 * instances during teardown. Handle this notification to perform additional invalidation.
 */
RCT_EXTERN NSString *const RCTBridgeWillInvalidateModulesNotification
    __deprecated_msg("Never posted; will be removed.");

/**
 * This notification fires right after the bridge finishes invalidating NativeModule
 * instances during teardown. Handle this notification to perform additional invalidation.
 */
RCT_EXTERN NSString *const RCTBridgeDidInvalidateModulesNotification __deprecated_msg("Never posted; will be removed.");
