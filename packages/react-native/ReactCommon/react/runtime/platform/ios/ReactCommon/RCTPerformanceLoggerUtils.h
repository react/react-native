/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/cxxstableapi/FrameworksGuard.h>

#import <Foundation/Foundation.h>

@class RCTPerformanceLogger;

NS_ASSUME_NONNULL_BEGIN

extern void registerPerformanceLoggerHooks(RCTPerformanceLogger *performanceLogger);

NS_ASSUME_NONNULL_END
