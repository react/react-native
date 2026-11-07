/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.intent.IntentModule
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.android.controller.ActivityController

@RunWith(RobolectricTestRunner::class)
class ReactActivityTest {

  @Test
  fun onNewIntent_makesTheDeliveredIntentTheActivityIntent() {
    val controller = createActivity(FIRST_LINK)
    val link = viewIntent(SECOND_LINK)

    controller.newIntent(link)

    assertThat(controller.get().intent).isSameAs(link)
  }

  @Test
  fun getInitialURL_answersTheLinkDeliveredAfterLaunch() {
    val controller = createActivity(FIRST_LINK)
    controller.newIntent(viewIntent(SECOND_LINK))

    verify(requestInitialURL(controller.get())).resolve(SECOND_LINK)
  }

  @Test
  fun getInitialURL_answersTheLaunchLinkWhenNoOtherArrives() {
    val controller = createActivity(FIRST_LINK)

    verify(requestInitialURL(controller.get())).resolve(FIRST_LINK)
  }

  private fun createActivity(link: String): ActivityController<TestReactActivity> {
    val controller = Robolectric.buildActivity(TestReactActivity::class.java, viewIntent(link))
    controller.get().setTheme(R.style.Theme_ReactNative_AppCompat_Light)
    return controller.create()
  }

  private fun requestInitialURL(activity: ReactActivity): Promise {
    val context = mock<ReactApplicationContext>()
    whenever(context.currentActivity).thenReturn(activity)
    val promise = mock<Promise>()
    IntentModule(context).getInitialURL(promise)
    return promise
  }

  private fun viewIntent(link: String): Intent = Intent(Intent.ACTION_VIEW, Uri.parse(link))

  /** Hands every new intent to a React host that is not ready yet, as a relaunch does. */
  class TestReactActivity : ReactActivity() {
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        object : ReactActivityDelegate(this, "Test") {
          override fun onCreate(savedInstanceState: Bundle?) = Unit

          override fun onNewIntent(intent: Intent?): Boolean = true
        }
  }

  private companion object {
    const val FIRST_LINK = "rntester://first"
    const val SECOND_LINK = "rntester://second"
  }
}
