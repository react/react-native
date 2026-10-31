/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.share

import android.content.Intent
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.WritableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class, ShadowSoLoader::class])
@RunWith(RobolectricTestRunner::class)
class ShareModuleTest {

  private lateinit var shareModule: ShareModule
  private lateinit var activityController: ActivityController<FragmentActivity>

  @Before
  fun prepareModules() {
    ReactNativeFeatureFlagsForTests.setUp()
    activityController = Robolectric.buildActivity(FragmentActivity::class.java)
    val activity = activityController.create().start().resume().get()
    val applicationContext = ReactTestHelper.createTestReactApplicationContext()
    applicationContext.onNewIntent(activity, Intent())
    shareModule = ShareModule(applicationContext)
  }

  @Test
  fun testShareDialog() {
    val title = "Title"
    val message = "Message"
    val dialogTitle = "Dialog Title"

    val content = JavaOnlyMap()
    content.putString("title", title)
    content.putString("message", message)

    val promise = SimplePromise()

    shareModule.share(content, dialogTitle, promise)

    val chooserIntent = shadowOf(RuntimeEnvironment.getApplication()).nextStartedActivity
    assertThat(chooserIntent).isNotNull()
    assertThat(chooserIntent.action).isEqualTo(Intent.ACTION_CHOOSER)
    assertThat(chooserIntent.extras?.getString(Intent.EXTRA_TITLE)).isEqualTo(dialogTitle)

    val contentIntent = chooserIntent.extras?.getParcelable(Intent.EXTRA_INTENT, Intent::class.java)
    assertThat(contentIntent).isNotNull()
    assertThat(contentIntent?.action).isEqualTo(Intent.ACTION_SEND)

    assertThat(contentIntent?.extras?.getString(Intent.EXTRA_SUBJECT)).isEqualTo(title)
    assertThat(contentIntent?.extras?.getString(Intent.EXTRA_TEXT)).isEqualTo(message)

    assertThat(promise.resolved).isEqualTo(1)
  }

  @Test
  fun testInvalidContent() {
    val dialogTitle = "Dialog Title"

    val promise = SimplePromise()

    shareModule.share(null, dialogTitle, promise)

    assertThat(promise.rejected).isEqualTo(1)
    assertThat(promise.errorCode).isEqualTo(ShareModule.ERROR_INVALID_CONTENT)
  }

  internal class SimplePromise : Promise {
    companion object {
      private const val ERROR_DEFAULT_CODE = "EUNSPECIFIED"
      private const val ERROR_DEFAULT_MESSAGE = "Error not specified."
    }

    var resolved = 0
      private set

    var rejected = 0
      private set

    var value: Any? = null
      private set

    var errorCode: String? = null
      private set

    var errorMessage: String? = null
      private set

    override fun resolve(value: Any?) {
      resolved++
      this.value = value
    }

    override fun reject(code: String?, message: String?) {
      reject(code, message, null, null)
    }

    override fun reject(code: String?, throwable: Throwable?) {
      reject(code, null, throwable, null)
    }

    override fun reject(code: String?, message: String?, throwable: Throwable?) {
      reject(code, message, throwable, null)
    }

    override fun reject(throwable: Throwable) {
      reject(null, null, throwable, null)
    }

    override fun reject(throwable: Throwable, userInfo: WritableMap) {
      reject(null, null, throwable, userInfo)
    }

    override fun reject(code: String?, userInfo: WritableMap) {
      reject(code, null, null, userInfo)
    }

    override fun reject(code: String?, throwable: Throwable?, userInfo: WritableMap) {
      reject(code, null, throwable, userInfo)
    }

    override fun reject(code: String?, message: String?, userInfo: WritableMap) {
      reject(code, message, null, userInfo)
    }

    override fun reject(
        code: String?,
        message: String?,
        throwable: Throwable?,
        userInfo: WritableMap?,
    ) {
      rejected++

      errorCode = code ?: ERROR_DEFAULT_CODE
      errorMessage = message ?: throwable?.message ?: ERROR_DEFAULT_MESSAGE
    }

    @Deprecated("Method deprecated", ReplaceWith("reject(code, message)"))
    override fun reject(message: String) {
      reject(null, message, null, null)
    }
  }
}
