/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.app.Application
import java.io.PrintWriter

@Suppress("UNUSED_PARAMETER")
internal object FBRNTesterEndToEndHelper {
  fun initializeConfig(application: Application) = Unit

  fun onCreate(application: Application) {
    // no-op This is an empty implementation to stub out Meta's internal test coverage
    // instrumentation.
  }

  fun maybeDump(prefix: String, writer: PrintWriter, args: Array<String>?) {
    // no-op This is an empty implementation to stub out Meta's internal dumpsys helper.
  }
}
