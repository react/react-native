/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate

/**
 * A utility class that allows you to simplify the setup of a [ReactActivityDelegate] for new apps
 * in Open Source.
 *
 * Specifically, with this class you can simply control if Fabric is enabled for an Activity using
 * the boolean flag in the constructor.
 *
 * @param fabricEnabled Whether Fabric should be enabled for the RootView of this Activity.
 */
public open class DefaultReactActivityDelegate(
    activity: ReactActivity,
    mainComponentName: String,
) : ReactActivityDelegate(activity, mainComponentName) {

  @Deprecated(
      message = "Creating DefaultReactActivityDelegate with flags is deprecated.",
      level = DeprecationLevel.WARNING,
      replaceWith = ReplaceWith("DefaultReactActivityDelegate(activity, mainComponentName)"),
  )
  public constructor(
      activity: ReactActivity,
      mainComponentName: String,
      @Suppress("UNUSED_PARAMETER") fabricEnabled: Boolean,
      @Suppress("UNUSED_PARAMETER") concurrentReactEnabled: Boolean,
  ) : this(activity, mainComponentName)

  @Deprecated(
      message = "Creating DefaultReactActivityDelegate with flags is deprecated.",
      level = DeprecationLevel.WARNING,
      replaceWith = ReplaceWith("DefaultReactActivityDelegate(activity, mainComponentName)"),
  )
  public constructor(
      activity: ReactActivity,
      mainComponentName: String,
      @Suppress("UNUSED_PARAMETER") fabricEnabled: Boolean,
  ) : this(activity, mainComponentName)
}
