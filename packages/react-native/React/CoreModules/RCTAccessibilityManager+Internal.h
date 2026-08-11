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
    RCTAccessibilityManager* accessibilityManager,
    BOOL isVoiceOverEnabled);

RCT_EXTERN_C_END

NS_ASSUME_NONNULL_END
