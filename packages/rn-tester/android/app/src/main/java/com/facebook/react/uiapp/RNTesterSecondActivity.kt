/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp

/**
 * A second ReactActivity used by the PhotoPickerAndroid example (via
 * SampleTurboModule.startSecondActivity) to verify that ActivityResultContract launchers rebind to
 * the current Activity's registry under multi-Activity navigation.
 */
internal class RNTesterSecondActivity : RNTesterActivity()
