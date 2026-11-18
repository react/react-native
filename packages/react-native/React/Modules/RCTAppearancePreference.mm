/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppearancePreference.h"

#import <React/RCTUtils.h>

NSString *const RCTAppearanceColorSchemeLight = @"light";
NSString *const RCTAppearanceColorSchemeDark = @"dark";

static BOOL sAppearancePreferenceEnabled = YES;
void RCTEnableAppearancePreference(BOOL enabled)
{
  sAppearancePreferenceEnabled = enabled;
}

static NSString *sColorSchemeOverride = nil;
void RCTOverrideAppearancePreference(NSString *const colorSchemeOverride)
{
  sColorSchemeOverride = colorSchemeOverride;
}

static BOOL sUseKeyWindowForSystemStyle = NO;
void RCTUseKeyWindowForSystemStyle(BOOL useMainScreen)
{
  sUseKeyWindowForSystemStyle = useMainScreen;
}

NSString *RCTCurrentOverrideAppearancePreference()
{
  return sColorSchemeOverride;
}

NSString *RCTColorSchemePreference(UITraitCollection *traitCollection)
{
  static NSDictionary *appearances;
  static dispatch_once_t onceToken;

  if (sColorSchemeOverride) {
    return sColorSchemeOverride;
  }

  dispatch_once(&onceToken, ^{
    appearances = @{
      @(UIUserInterfaceStyleLight) : RCTAppearanceColorSchemeLight,
      @(UIUserInterfaceStyleDark) : RCTAppearanceColorSchemeDark
    };
  });

  if (!sAppearancePreferenceEnabled) {
    // Return the default if the app doesn't allow different color schemes.
    return RCTAppearanceColorSchemeLight;
  }

  if (!traitCollection) {
    traitCollection = [UITraitCollection currentTraitCollection];
  }

  UIUserInterfaceStyle systemStyle = sUseKeyWindowForSystemStyle ? RCTKeyWindow().traitCollection.userInterfaceStyle
                                                                 : traitCollection.userInterfaceStyle;

  return appearances[@(systemStyle)] ?: RCTAppearanceColorSchemeLight;
}
