/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.textinput

import android.text.SpannableString
import android.util.DisplayMetrics
import android.view.Gravity
import androidx.core.content.res.ResourcesCompat.ID_NULL
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.text.ReactTextUpdate
import com.facebook.react.views.text.TextLayoutManager
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactEditTextSpannableCacheTest {

  private lateinit var manager: ReactTextInputManager
  private val oldRuntime = mock<ReactApplicationContext>()
  private val newRuntime = mock<ReactApplicationContext>()

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    manager = ReactTextInputManager()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
  }

  @After
  fun tearDown() {
    TextLayoutManager.destroySpannableCache(oldRuntime)
    TextLayoutManager.destroySpannableCache(newRuntime)
  }

  @Test
  fun `a view from a destroyed runtime does not evict a new runtime's spannable for the same tag`() {
    // Mirrors FabricUIManager's constructor and invalidate() across a React instance reload.
    TextLayoutManager.createSpannableCache(oldRuntime)
    val staleView = createViewWithCachedText(oldRuntime, "stale")
    TextLayoutManager.destroySpannableCache(oldRuntime)
    TextLayoutManager.createSpannableCache(newRuntime)

    assertThatThrownBy { cachedSpannable(newRuntime) }
        .isInstanceOf(IllegalStateException::class.java)

    val liveView = createViewWithCachedText(newRuntime, "live")
    runFinalizer(staleView)

    assertThat(YogaMeasureOutput.getHeight(measureCachedText(newRuntime))).isPositive()
    assertThat(cachedSpannable(newRuntime).toString()).isEqualTo("live")

    runFinalizer(liveView)

    assertThatThrownBy { cachedSpannable(newRuntime) }
        .isInstanceOf(IllegalStateException::class.java)
  }

  @Test
  fun `a view's spannable lands in the cache registered for its ReactApplicationContext`() {
    TextLayoutManager.createSpannableCache(newRuntime)
    val view = createViewWithCachedText(newRuntime, "live")

    assertThat(view.context).isInstanceOf(ThemedReactContext::class.java)
    assertThat(cachedSpannable(newRuntime).toString()).isEqualTo("live")
  }

  @Test
  fun `measureText through the cache id measures the instance's cached spannable`() {
    TextLayoutManager.createSpannableCache(newRuntime)
    createViewWithCachedText(newRuntime, "live")

    assertThat(YogaMeasureOutput.getHeight(measureCachedText(newRuntime))).isPositive()
  }

  @Test
  fun `measureText through the cache id after the runtime's cache is destroyed measures zero`() {
    TextLayoutManager.createSpannableCache(oldRuntime)
    createViewWithCachedText(oldRuntime, "stale")
    TextLayoutManager.destroySpannableCache(oldRuntime)

    val measurement = measureCachedText(oldRuntime)

    assertThat(YogaMeasureOutput.getWidth(measurement)).isZero()
    assertThat(YogaMeasureOutput.getHeight(measurement)).isZero()
  }

  @Test
  fun `measureText through the cache id after the view's finalizer evicts it measures zero`() {
    TextLayoutManager.createSpannableCache(newRuntime)
    runFinalizer(createViewWithCachedText(newRuntime, "evicted"))

    val measurement = measureCachedText(newRuntime)

    assertThat(YogaMeasureOutput.getWidth(measurement)).isZero()
    assertThat(YogaMeasureOutput.getHeight(measurement)).isZero()
  }

  private fun createViewWithCachedText(
      runtime: ReactApplicationContext,
      text: String,
  ): ReactEditText {
    val themedContext =
        ThemedReactContext(runtime, RuntimeEnvironment.getApplication(), null, ID_NULL)
    val view = manager.createViewInstance(themedContext)
    view.id = TAG
    view.stateWrapper = mock<StateWrapper>()
    view.maybeSetTextFromState(
        ReactTextUpdate(
            SpannableString(text),
            0,
            view.gravity and Gravity.HORIZONTAL_GRAVITY_MASK,
            0,
            0,
        ),
    )
    return view
  }

  private fun runFinalizer(view: ReactEditText) {
    ReactEditText::class.java.getDeclaredMethod("finalize").apply { isAccessible = true }(view)
  }

  private fun cachedSpannable(runtime: ReactApplicationContext) =
      checkNotNull(TextLayoutManager.getCachedSpannable(runtime, TAG))

  @OptIn(UnstableReactNativeAPI::class)
  private fun measureCachedText(runtime: ReactApplicationContext): Long =
      TextLayoutManager.measureText(
          RuntimeEnvironment.getApplication().assets,
          WritableMapBuffer().put(TextLayoutManager.AS_KEY_CACHE_ID, TAG),
          WritableMapBuffer()
              .put(TextLayoutManager.PA_KEY_TEXT_BREAK_STRATEGY, "simple")
              .put(TextLayoutManager.PA_KEY_HYPHENATION_FREQUENCY, "none"),
          100f,
          YogaMeasureMode.EXACTLY,
          100f,
          YogaMeasureMode.EXACTLY,
          null,
          null,
          null,
          runtime,
      )

  private companion object {
    const val TAG = 42
  }
}
