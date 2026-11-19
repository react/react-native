/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Filter.h>

#import <QuartzCore/QuartzCore.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A CALayer that renders CSS backdrop-filter on iOS using a Metal pipeline.
 *
 * On each display, CARenderer captures the composited content behind the host
 * view into a MTLTexture (GPU-only), then a Metal-backed CIContext applies the
 * CSS filter chain. The result is set as the layer's contents and inserted
 * as the first sublayer of the host view's layer so it renders behind all
 * of the view's own content.
 *
 * Call setNeedsDisplay whenever the backdrop or filter functions change.
 */
@interface RCTBackdropFilterLayer : CALayer

@property (nonatomic) std::vector<facebook::react::FilterFunction> filterFunctions;

/**
 * The UIView whose superview provides the backdrop source.
 * Must be set before the layer renders.
 */
@property (nonatomic, weak, nullable) UIView *hostView;
@property (nonatomic, weak, nullable) CALayer *hostBackgroundColorLayer;

@end

NS_ASSUME_NONNULL_END
