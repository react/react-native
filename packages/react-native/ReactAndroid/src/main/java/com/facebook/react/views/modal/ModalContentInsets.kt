/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.modal

import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn

// These must stay in sync with the window configuration applied by ReactModalHostView in
// contentView and updateProperties, including the app-wide edge-to-edge override.

/**
 * Whether the content of a Modal is laid out below the top system bar inset. With an opaque status
 * bar, the content FrameLayout fits the system windows.
 */
internal fun modalContentFitsTopInset(statusBarTranslucent: Boolean): Boolean =
    !(statusBarTranslucent || isEdgeToEdgeFeatureFlagOn)

/**
 * Whether the content of a Modal is laid out above the bottom system bar inset. Only a Modal with
 * both system bars translucent extends under the bottom inset: with an opaque status bar, the
 * content FrameLayout fits the system windows even if the Dialog window is edge-to-edge.
 */
internal fun modalContentFitsBottomInset(
    statusBarTranslucent: Boolean,
    navigationBarTranslucent: Boolean,
): Boolean =
    !((statusBarTranslucent || isEdgeToEdgeFeatureFlagOn) &&
        (navigationBarTranslucent || isEdgeToEdgeFeatureFlagOn))
