/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <RCTAnimatedModuleProvider/RCTAnimatedModuleProvider.h>

@interface RCTAnimatedModuleProvider (Private)

/**
 * When true, animated frames are skipped while the application is inactive (between
 * `UIApplicationWillEnterForeground` -> `UIApplicationDidBecomeActive`), default is false.
 */
- (instancetype)initWithSkipFramesDuringForegroundTransition:(BOOL)skipFramesDuringForegroundTransition;

@end
