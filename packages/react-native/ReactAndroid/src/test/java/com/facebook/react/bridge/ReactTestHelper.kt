/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.app.Application
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.runtime.BridgelessReactContext
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.internal.bolts.Task
import org.mockito.kotlin.mock
import org.mockito.kotlin.spy
import org.robolectric.RuntimeEnvironment

/** Utility for creating pre-configured instances of core react components for tests. */
object ReactTestHelper {

  @OptIn(UnstableReactNativeAPI::class)
  @JvmOverloads
  fun createTestReactApplicationContext(
      application: Application = RuntimeEnvironment.getApplication()
  ): ReactApplicationContext {
    val reactHost =
        spy(
            ReactHostImpl(
                RuntimeEnvironment.getApplication(),
                mock(),
                mock(),
                Task.Companion.IMMEDIATE_EXECUTOR,
                Task.Companion.IMMEDIATE_EXECUTOR,
                false /* allowPackagerServerAccess */,
                false /* useDevSupport */,
            ),
        )
    return BridgelessReactContext(application, reactHost)
  }
}
