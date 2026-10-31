/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class RCTBridge;
@class RCTRootView;

#ifdef __cplusplus

#import <ReactCommon/RCTTurboModuleManager.h>

@protocol RCTDependencyProvider;

RCT_EXTERN NSArray<NSString *> *RCTAppSetupUnstableModulesRequiringMainQueueSetup(
    id<RCTDependencyProvider> dependencyProvider);

RCT_EXTERN id<RCTTurboModule> RCTAppSetupDefaultModuleFromClass(
    Class moduleClass,
    id<RCTDependencyProvider> dependencyProvider);

#endif // __cplusplus
