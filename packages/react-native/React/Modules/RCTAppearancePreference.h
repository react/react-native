/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>

// Used by the `Appearance` module and by Fabric, so both use the same color scheme.
RCT_EXTERN void RCTEnableAppearancePreference(BOOL enabled);
RCT_EXTERN void RCTOverrideAppearancePreference(NSString * /*colorSchemeOverride*/);
RCT_EXTERN void RCTUseKeyWindowForSystemStyle(BOOL useMainScreen);
RCT_EXTERN NSString *RCTCurrentOverrideAppearancePreference(void);
RCT_EXTERN NSString *RCTColorSchemePreference(UITraitCollection *traitCollection);
