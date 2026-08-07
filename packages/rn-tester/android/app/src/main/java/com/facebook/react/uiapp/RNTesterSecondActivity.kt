/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp

/**
 * A second ReactActivity, distinct from [RNTesterActivity], used to exercise multi-Activity
 * navigation against ActivityResultContract launchers registered on the ReactContext (see
 * SampleTurboModule.startSecondActivity and com.facebook.react.activityresult).
 *
 * When this Activity starts on top of [RNTesterActivity], its onHostResume fires while the first
 * Activity is still alive, so the launchers must rebind to this Activity's
 * ActivityResultRegistry -- a launch from here must dispatch from and deliver its result to *this*
 * Activity, not the one the launchers were first bound to.
 */
internal class RNTesterSecondActivity : RNTesterActivity()
