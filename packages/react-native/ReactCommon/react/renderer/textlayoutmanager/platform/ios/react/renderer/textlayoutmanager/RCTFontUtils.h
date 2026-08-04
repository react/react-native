/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <React/RCTDefines.h>
#import <UIKit/UIKit.h>
#import <react/renderer/textlayoutmanager/RCTFontProperties.h>

NS_ASSUME_NONNULL_BEGIN

using RCTDefaultFontResolver = UIFont *__nullable (^)(const RCTFontProperties &);

/**
 * React Native will use the System font for rendering by default. If you want to
 * provide a different base font, use this override.
 */
RCT_EXTERN void RCTSetDefaultFontResolver(RCTDefaultFontResolver handler);

/**
 * Parses comma-separated, quoted four-byte ASCII axis tags and finite numeric
 * values into CoreText axis values. `normal`, an empty string, and invalid
 * settings normalize to an empty dictionary. Because text inheritance is
 * resolved before platform parsing, invalid child settings do not fall back to
 * inherited settings.
 */
RCT_EXTERN NSDictionary<NSNumber *, NSNumber *> *RCTParseFontVariationSettings(NSString *variationSettings);

/**
 * Returns UIFont instance corresponded to given font properties.
 */
RCT_EXTERN UIFont *RCTFontWithFontProperties(RCTFontProperties fontProperties);

NS_ASSUME_NONNULL_END
