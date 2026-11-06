/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.provider.Settings
import android.text.Spannable
import android.text.method.PasswordTransformationMethod
import android.util.DisplayMetrics
import androidx.core.content.res.ResourcesCompat.ID_NULL
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.text.TextLayoutManager
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactEditTextCachedSpannableTest {

  private lateinit var view: ReactEditText

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = createTestReactApplicationContext(RuntimeEnvironment.getApplication())
    val themedContext = ThemedReactContext(context, context.baseContext, null, ID_NULL)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    view = ReactTextInputManager().createViewInstance(themedContext)
    view.id = 42
    view.stateWrapper = mock<StateWrapper>()
  }

  @Test
  fun testCachedSpannableDoesNotKeepPasswordSpans() {
    Settings.System.putInt(
        RuntimeEnvironment.getApplication().contentResolver,
        Settings.System.TEXT_SHOW_PASSWORD,
        1,
    )
    view.transformationMethod = PasswordTransformationMethod.getInstance()

    view.text?.append("a")
    view.text?.append("b")

    assertThat(spanOwners(checkNotNull(view.text)))
        .contains(PasswordTransformationMethod::class.java)
    assertThat(spanOwners(getCachedSpannable(view.id)))
        .doesNotContain(PasswordTransformationMethod::class.java)
  }

  private fun spanOwners(text: Spannable): List<Class<*>?> =
      text.getSpans(0, text.length, Any::class.java).map { it.javaClass.enclosingClass }

  @Suppress("UNCHECKED_CAST")
  private fun getCachedSpannable(tag: Int): Spannable {
    val cache =
        TextLayoutManager::class
            .java
            .getDeclaredField("tagToSpannableCache")
            .apply { isAccessible = true }
            .get(null) as Map<Int, Spannable>
    return checkNotNull(cache[tag])
  }
}
