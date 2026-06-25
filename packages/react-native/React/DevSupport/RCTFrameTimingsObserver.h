/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus
#import <jsinspector-modern/tracing/FrameTimingSequence.h>

using RCTFrameTimingCallback = void (^)(facebook::react::jsinspector_modern::tracing::FrameTimingSequence);
#endif

@interface RCTFrameTimingsObserver : NSObject

#ifdef __cplusplus
- (instancetype)initWithScreenshotsEnabled:(BOOL)screenshotsEnabled callback:(RCTFrameTimingCallback)callback;
#endif
- (void)start;
- (void)stop;

@end
