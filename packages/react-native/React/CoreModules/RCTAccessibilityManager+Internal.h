/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAccessibilityManager.h"

#import <React/RCTDefines.h>

NS_ASSUME_NONNULL_BEGIN

RCT_EXTERN_C_BEGIN

// Only to be used for testing and internal tooling. Do not use this in
// production.
void RCTAccessibilityManagerSetIsVoiceOverEnabled(
    RCTAccessibilityManager *accessibilityManager,
    BOOL isVoiceOverEnabled);

// Returns the raw settings behind getPreferences(), keyed by the
// AccessibilityPreferences field names. Returning nil reads the system.
typedef NSDictionary<NSString *, id> *_Nullable (^RCTAccessibilityPreferencesReader)(void);

// Replaces how this module reads the settings behind getPreferences(), and
// re-reads them without sending accessibilityPreferencesChanged. Pass nil to
// read the system settings again.
void RCTAccessibilityManagerSetPreferencesReader(
    RCTAccessibilityManager *accessibilityManager,
    RCTAccessibilityPreferencesReader _Nullable preferencesReader);

RCT_EXTERN_C_END

NS_ASSUME_NONNULL_END
