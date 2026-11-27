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
import android.text.style.AbsoluteSizeSpan
import android.text.style.CharacterStyle
import android.text.style.ParagraphStyle
import android.util.DisplayMetrics
import androidx.core.content.res.ResourcesCompat.ID_NULL
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.text.TextLayoutManager
import com.facebook.react.views.text.internal.span.ReactSpan
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactEditTextMeasurementCacheTest {

  private lateinit var view: ReactEditText

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = createTestReactApplicationContext(RuntimeEnvironment.getApplication())
    val themedContext = ThemedReactContext(context, context.baseContext, null, ID_NULL)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    view = ReactTextInputManager().createViewInstance(themedContext)
    // The measurement cache is only written for a Fabric view that has a tag.
    view.id = VIEW_TAG
    view.stateWrapper = mock<StateWrapper>()
  }

  @After
  fun tearDown() {
    TextLayoutManager.deleteCachedSpannableForTag(VIEW_TAG)
  }

  @Test
  fun cachedCopyOfSecureTextHasNoSpanReferencingTheEditable() {
    // "Show password" makes PasswordTransformationMethod mark the last typed character with a
    // Visible span, which holds a reference to the view's Editable.
    Settings.System.putInt(
        RuntimeEnvironment.getApplication().contentResolver,
        Settings.System.TEXT_SHOW_PASSWORD,
        1,
    )
    view.transformationMethod = PasswordTransformationMethod.getInstance()

    val editable = checkNotNull(view.text)
    editable.append("a")

    // ViewReference also belongs to PasswordTransformationMethod, but it is a NoCopySpan.
    // Require the Visible span that holds a strong reference to the Editable.
    val visibleSpans =
        spansOf(editable).filter {
          it.javaClass.name == "android.text.method.PasswordTransformationMethod\$Visible"
        }
    assertThat(visibleSpans).hasSize(1)

    // Refresh the cache while the first character's Visible span is still in the Editable.
    editable.append("b")

    // Only spans that affect measurement may reach the cache.
    val cachedSpans = spansOf(cachedSpannable())
    assertThat(cachedSpans).doesNotContainAnyElementsOf(visibleSpans)
    assertThat(cachedSpans).isNotEmpty
    assertThat(cachedSpans).allMatch { isMeasurementSpan(it) }
  }

  @Test
  fun cachedCopyKeepsStyleSpans() {
    val editable = checkNotNull(view.text)
    editable.append("abc")
    val sizeSpan = AbsoluteSizeSpan(40)
    editable.setSpan(sizeSpan, 0, 1, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
    editable.append("d")

    assertThat(spansOf(cachedSpannable())).contains(sizeSpan)
  }

  private fun isMeasurementSpan(span: Any): Boolean =
      span is CharacterStyle || span is ParagraphStyle || span is ReactSpan

  private fun spansOf(text: Spannable): List<Any> =
      text.getSpans(0, text.length, Any::class.java).toList()

  @Suppress("UNCHECKED_CAST")
  private fun cachedSpannable(): Spannable {
    val cache =
        TextLayoutManager::class
            .java
            .getDeclaredField("tagToSpannableCache")
            .apply { isAccessible = true }
            .get(TextLayoutManager) as Map<Int, Spannable>
    return checkNotNull(cache[VIEW_TAG])
  }

  private companion object {
    const val VIEW_TAG = 42
  }
}
