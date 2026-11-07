/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/cxxstableapi/FrameworksGuard.h>

#import <Foundation/Foundation.h>
#import <jsi/jsi.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Synchronously assigns each entry of globals to a property of globalThis.
 * Must be called on the runtime's JavaScript thread. Dictionary keys and values
 * use React Native's native-to-JSI conversion without additional validation.
 * Passing nil or an empty dictionary leaves the runtime unchanged.
 */
void RCTInstallRuntimeGlobals(facebook::jsi::Runtime &runtime, NSDictionary<NSString *, id> *_Nullable globals);

NS_ASSUME_NONNULL_END
