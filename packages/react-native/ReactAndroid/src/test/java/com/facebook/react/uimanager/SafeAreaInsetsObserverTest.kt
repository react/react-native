/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.annotation.SuppressLint
import android.graphics.Matrix
import android.graphics.Rect
import android.util.DisplayMetrics
import android.view.View
import android.view.WindowInsets
import android.widget.FrameLayout
import androidx.core.graphics.Insets
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.R
import com.facebook.react.bridge.WritableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.EventDispatcherProvider
import com.facebook.react.uimanager.events.RCTModernEventEmitter
import com.facebook.react.uimanager.events.SafeAreaInsetsChangeEvent
import com.facebook.react.uimanager.internal.SafeAreaInsetsObserver
import com.facebook.testutils.shadows.ShadowArguments
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowArguments::class])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class SafeAreaInsetsObserverTest {
  private lateinit var root: FrameLayout
  private val events = mutableListOf<SafeAreaInsetsChangeEvent>()
  private var windowInsets = Insets.of(40, 100, 40, 100)

  // BridgeReactContext provides a concrete fixture without starting a React runtime.
  @Before
  @Suppress("DEPRECATION")
  @SuppressLint("DeprecatedSuperclass")
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 1f })
    val dispatcher = mock<EventDispatcher>()
    doAnswer { invocation ->
          events.add(invocation.getArgument(0))
          null
        }
        .whenever(dispatcher)
        .dispatchEvent(any())
    val application = RuntimeEnvironment.getApplication()
    val reactContext =
        object :
            com.facebook.react.bridge.BridgeReactContext(application), EventDispatcherProvider {
          override fun getEventDispatcher(): EventDispatcher = dispatcher
        }
    val context = ThemedReactContext(reactContext, application, null, 1)
    root =
        object : FrameLayout(context) {
          override fun getRootWindowInsets(): WindowInsets =
              checkNotNull(
                  WindowInsetsCompat.Builder()
                      .setInsets(WindowInsetsCompat.Type.systemBars(), windowInsets)
                      .build()
                      .toWindowInsets(),
              )
        }
    root.layout(0, 0, 500, 1000)
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun fullWindow_reportsAllEdges() {
    val view = addView(root, 0, 0, 500, 1000)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view))
        .isEqualTo(Insets.of(40, 100, 40, 100))
  }

  @Test
  fun insideSafeArea_reportsZero() {
    val view = addView(root, 40, 100, 460, 900)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.NONE)
  }

  @Test
  fun paddingKeepsObserversInsetsAndChildInsideSafeAreaReportsZero() {
    val parent = addParent(0, 0, 500, 1000)
    parent.setPadding(40, 100, 40, 100)
    val child = addView(parent, 40, 100, 460, 900)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(parent))
        .isEqualTo(Insets.of(40, 100, 40, 100))
    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(child)).isEqualTo(Insets.NONE)
  }

  @Test
  fun scaledObserver_reportsTheSameWindowInsetsBeforeAndAfterPadding() {
    val parent = addParent(125, 250, 375, 750)
    parent.scaleX = 2f
    parent.scaleY = 2f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(parent))
        .isEqualTo(Insets.of(40, 100, 40, 100))
    parent.setPadding(40, 100, 40, 100)
    val child = addView(parent, 40, 100, 210, 400)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(parent))
        .isEqualTo(Insets.of(40, 100, 40, 100))
    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(child)).isEqualTo(Insets.NONE)
  }

  @Test
  fun coincidentRenderedBounds_reportSameInsetsRegardlessOfScale() {
    val unscaled = addView(root, 0, 0, 500, 1000)
    val enlarged = addView(root, 125, 250, 375, 750)
    enlarged.scaleX = 2f
    enlarged.scaleY = 2f
    val reduced = addView(root, -250, -500, 750, 1500)
    reduced.scaleX = 0.5f
    reduced.scaleY = 0.5f

    val expected = Insets.of(40, 100, 40, 100)
    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(unscaled)).isEqualTo(expected)
    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(enlarged)).isEqualTo(expected)
    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(reduced)).isEqualTo(expected)
  }

  @Test
  fun scaledView_reportsTopAndBottomInWindowCoordinates() {
    val view = addView(root, 40, 0, 460, 500)
    view.pivotY = 0f
    view.scaleY = 2f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(0, 100, 0, 100))
  }

  @Test
  fun scaledView_reportsLeftAndRightInWindowCoordinates() {
    val view = addView(root, 0, 100, 250, 900)
    view.pivotX = 0f
    view.scaleX = 2f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(40, 0, 40, 0))
  }

  @Test
  fun scaledAncestor_isIncluded() {
    val parent = addParent(0, 0, 500, 500)
    parent.pivotY = 0f
    parent.scaleY = 2f
    val view = addView(parent, 40, 0, 460, 500)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(0, 100, 0, 100))
  }

  @Test
  fun nestedScales_areComposed() {
    val parent = addParent(0, 0, 500, 500)
    parent.clipChildren = false
    parent.pivotY = 0f
    parent.scaleY = 2f
    val view = addView(parent, 40, 0, 460, 1000)
    view.pivotY = 0f
    view.scaleY = 0.5f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(0, 100, 0, 100))
  }

  @Test
  fun scaleAroundDefaultPivot_includesPivotTranslation() {
    val view = addView(root, 40, 250, 460, 750)
    view.scaleY = 2f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(0, 100, 0, 100))
  }

  @Test
  fun ancestorScrollAndTranslation_areIncluded() {
    val parent = addParent(0, 0, 500, 1000)
    val view = addView(parent, 40, 100, 460, 1100)
    parent.scrollTo(0, 125)
    parent.translationY = 25f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(0, 100, 0, 100))
  }

  @Test
  fun rootLayoutOrigin_isNotAddedToRootLocalBounds() {
    root.layout(70, 120, 570, 1120)
    val view = addView(root, 0, 0, 500, 1000)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view))
        .isEqualTo(Insets.of(40, 100, 40, 100))
  }

  @Test
  fun topClipping_doesNotInventBottomInset() {
    val parent = addParent(0, 200, 500, 900)
    val view = addView(parent, 40, -50, 460, 660)
    val visibleRect = Rect()
    assertThat(view.getGlobalVisibleRect(visibleRect)).isTrue()
    assertThat(visibleRect).isEqualTo(Rect(40, 200, 460, 860))

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.NONE)
  }

  @Test
  fun leftClipping_doesNotInventRightInset() {
    val parent = addParent(100, 0, 400, 1000)
    val view = addView(parent, -50, 100, 340, 900)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.NONE)
  }

  @Test
  fun bottomClipping_doesNotShortenLayoutBounds() {
    val parent = addParent(0, 0, 500, 900)
    val view = addView(parent, 40, 100, 460, 1000)
    val visibleRect = Rect()
    assertThat(view.getGlobalVisibleRect(visibleRect)).isTrue()
    assertThat(visibleRect.bottom).isEqualTo(900)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(0, 0, 0, 100))
  }

  @Test
  fun fullyClipped_returnsNull() {
    val parent = addParent(0, 100, 500, 900)
    val view = addView(parent, 0, -200, 500, -100)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
  }

  @Test
  fun zeroScale_returnsNull() {
    val view = addView(root, 0, 0, 500, 1000)
    view.scaleY = 0f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
  }

  @Test
  fun arbitraryRotation_returnsNull() {
    val view = addView(root, 0, 0, 500, 1000)
    view.rotation = 45f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
  }

  @Test
  fun counterRotatedAncestorAndView_reportAxisAlignedInsets() {
    val parent = addParent(0, 0, 500, 1000)
    parent.clipChildren = false
    parent.pivotX = 0f
    parent.pivotY = 0f
    parent.rotation = 30f
    val view = addView(parent, 0, 0, 500, 1000)
    view.pivotX = 0f
    view.pivotY = 0f
    view.rotation = -30f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view))
        .isEqualTo(Insets.of(40, 100, 40, 100))
  }

  @Test
  fun threeCancellingRotations_reportAxisAlignedInsets() {
    val outer = addParent(0, 0, 500, 1000)
    outer.clipChildren = false
    outer.pivotX = 0f
    outer.pivotY = 0f
    outer.rotation = 10f
    val inner = FrameLayout(root.context)
    outer.addView(inner)
    inner.layout(0, 0, 500, 1000)
    inner.clipChildren = false
    inner.pivotX = 0f
    inner.pivotY = 0f
    inner.rotation = 20f
    val view = addView(inner, 0, 0, 500, 1000)
    view.pivotX = 0f
    view.pivotY = 0f
    view.rotation = -30f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view))
        .isEqualTo(Insets.of(40, 100, 40, 100))
  }

  @Test
  fun rotatedAncestor_returnsNull() {
    val parent = addParent(0, 0, 500, 1000)
    val view = addView(parent, 0, 0, 500, 1000)
    parent.rotation = 45f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
  }

  @Test
  fun skewedAncestor_returnsNull() {
    val matrix = Matrix().apply { setSkew(0.25f, 0f) }
    val parent =
        object : FrameLayout(root.context) {
          override fun getMatrix(): Matrix = matrix
        }
    root.addView(parent)
    parent.layout(0, 0, 500, 1000)
    val view = addView(parent, 0, 0, 500, 1000)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
  }

  @Test
  fun skewBeyondAxisAlignmentErrorBudget_returnsNull() {
    for (matrix in
        arrayOf(
            Matrix().apply { setSkew(-0.000002f, 0f) },
            Matrix().apply { setSkew(0.000002f, 0f) },
            Matrix().apply { setSkew(0f, -0.000002f) },
            Matrix().apply { setSkew(0f, 0.000002f) },
        )) {
      val view =
          object : View(root.context) {
            override fun getMatrix(): Matrix = matrix
          }
      root.addView(view)
      view.layout(0, 0, 10000, 10000)

      assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
      root.removeView(view)
    }
  }

  @Test
  fun perspectiveRotation_returnsNull() {
    val view = addView(root, 0, 0, 500, 1000)
    view.rotationX = 45f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
  }

  @Test
  fun reflectedView_preservesWindowEdges() {
    windowInsets = Insets.of(40, 100, 20, 60)
    val view = addView(root, 0, 0, 500, 1000)
    view.scaleX = -1f
    view.scaleY = -1f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(40, 100, 20, 60))
  }

  @Test
  fun verticallyReflectedScaledView_preservesAsymmetricWindowEdges() {
    windowInsets = Insets.of(40, 100, 20, 60)
    val view = addView(root, 0, 250, 500, 750)
    view.scaleY = -2f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(40, 100, 20, 60))
  }

  @Test
  fun horizontallyReflectedScaledAncestor_preservesAsymmetricWindowEdges() {
    windowInsets = Insets.of(40, 100, 20, 60)
    val parent = addParent(125, 0, 375, 1000)
    parent.scaleX = -2f
    val view = addView(parent, 0, 0, 250, 1000)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(40, 100, 20, 60))
  }

  @Test
  fun quarterTurn_returnsNull() {
    val view = addView(root, 0, 0, 1000, 500)
    view.pivotX = 0f
    view.pivotY = 0f
    view.rotation = 90f
    view.translationX = 500f

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
    view.rotation = 270f
    view.translationX = 0f
    view.translationY = 1000f
    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
  }

  @Test
  fun scaledAncestorScroll_isComposedInParentCoordinates() {
    val parent = addParent(0, 0, 500, 500)
    parent.pivotY = 0f
    parent.scaleY = 2f
    parent.scrollTo(0, 50)
    val view = addView(parent, 40, 50, 460, 550)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(0, 100, 0, 100))
  }

  @Test
  fun oversizedInsets_doNotInventASafeRegionAndRecoveryReEmits() {
    val view = addView(root, 0, 0, 250, 1000)
    view.pivotX = 0f
    view.scaleX = 2f
    val observer = observe(view)
    observer.onPreDraw()
    windowInsets = Insets.of(400, 100, 200, 100)
    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
    observer.onPreDraw()
    assertThat(events).hasSize(1)
    windowInsets = Insets.of(40, 100, 40, 100)
    observer.onPreDraw()

    assertThat(events).hasSize(2)
  }

  @Test
  fun emptySafeArea_returnsNull() {
    windowInsets = Insets.of(250, 100, 250, 100)
    val view = addView(root, 0, 0, 500, 1000)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isNull()
  }

  @Test
  fun smallView_insetsAreClampedToItsBounds() {
    val view = addView(root, 0, 0, 20, 30)

    assertThat(SafeAreaInsetsObserver.getSafeAreaInsets(view)).isEqualTo(Insets.of(20, 30, 0, 0))
  }

  // receiveEvent is deprecated, but exercises the emitted JS payload rather than native values
  // alone.
  @Test
  @Suppress("DEPRECATION")
  @SuppressLint("DeprecatedMethod")
  fun event_convertsDensityOnceWithoutUndoingScaleAndPreservesFractionalPixels() {
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 2f })
    windowInsets = Insets.of(40, 101, 40, 101)
    val view = addView(root, 40, 0, 460, 500)
    view.pivotY = 0f
    view.scaleY = 2f
    view.translationY = 0.5f
    val observer = observe(view)

    observer.onPreDraw()

    assertThat(events).hasSize(1)
    val event = events.single()
    val emitter = mock<RCTModernEventEmitter>()
    val payload = argumentCaptor<WritableMap>()
    event.dispatchModern(emitter)
    verify(emitter)
        .receiveEvent(
            eq(1),
            eq(2),
            eq("topSafeAreaInsetsChange"),
            any(),
            any(),
            payload.capture(),
            any(),
        )
    val insets = checkNotNull(payload.firstValue.getMap("insets"))
    assertThat(insets.getDouble("top")).isEqualTo(50.25)
    assertThat(insets.getDouble("bottom")).isEqualTo(50.75)
    assertThat(insets.getDouble("left")).isZero()
    assertThat(insets.getDouble("right")).isZero()
  }

  @Test
  fun unchangedInsets_areDeduplicated() {
    val observer = observe(addView(root, 0, 0, 500, 1000))

    observer.onPreDraw()
    observer.onPreDraw()

    assertThat(events).hasSize(1)
  }

  @Test
  @Suppress("DEPRECATION")
  @SuppressLint("DeprecatedMethod")
  fun subpixelChanges_emitOnlyBeyondOnePhysicalPixelWithoutRoundingPayload() {
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 2f })
    val view = addView(root, 0, 0, 500, 1000)
    val observer = observe(view)
    observer.onPreDraw()
    view.translationY = 0.5f
    observer.onPreDraw()
    view.translationY = 1f
    observer.onPreDraw()
    assertThat(events).hasSize(1)

    view.translationY = 1.25f
    observer.onPreDraw()
    observer.onPreDraw()
    assertThat(events).hasSize(2)
    val emitter = mock<RCTModernEventEmitter>()
    val payload = argumentCaptor<WritableMap>()
    events.last().dispatchModern(emitter)
    verify(emitter)
        .receiveEvent(
            eq(1),
            eq(2),
            eq("topSafeAreaInsetsChange"),
            any(),
            any(),
            payload.capture(),
            any(),
        )
    val insets = checkNotNull(payload.firstValue.getMap("insets"))
    assertThat(insets.getDouble("top")).isEqualTo(49.375)
    assertThat(insets.getDouble("bottom")).isEqualTo(50.625)
  }

  @Test
  fun supportedUnsupportedSupported_reEmitsAfterRecovery() {
    val view = addView(root, 0, 0, 500, 1000)
    val observer = observe(view)
    observer.onPreDraw()
    view.rotation = 45f
    observer.onPreDraw()
    observer.onPreDraw()
    assertThat(events).hasSize(1)
    view.rotation = 0f
    observer.onPreDraw()
    observer.onPreDraw()
    observer.onPreDraw()

    assertThat(events).hasSize(2)
  }

  @Test
  fun fullyClippedAndVisible_reEmitsAfterRecovery() {
    val parent = addParent(0, 100, 500, 900)
    val view = addView(parent, 40, 0, 460, 800)
    val observer = observe(view)
    observer.onPreDraw()
    view.layout(40, -200, 460, -100)
    observer.onPreDraw()
    observer.onPreDraw()
    assertThat(events).hasSize(1)
    view.layout(40, 0, 460, 800)
    observer.onPreDraw()
    observer.onPreDraw()
    observer.onPreDraw()

    assertThat(events).hasSize(2)
  }

  @Test
  fun detachAndReattach_reEmitsUnchangedInsetsOnNextPreDraw() {
    val view = addView(root, 0, 0, 500, 1000)
    val observer = observe(view)
    observer.onPreDraw()
    observer.onViewDetachedFromWindow(view)
    observer.onViewAttachedToWindow(view)

    assertThat(view.getTag(R.id.safe_area_insets_observer)).isSameAs(observer)
    assertThat(events).hasSize(1)
    observer.onPreDraw()
    observer.onPreDraw()
    assertThat(events).hasSize(2)
  }

  @Test
  fun disabledObserver_isRemovedAndReenableStartsFresh() {
    val view = addView(root, 0, 0, 500, 1000)
    val observer = observe(view)
    observer.onPreDraw()
    SafeAreaInsetsObserver.setEnabled(view, false)
    assertThat(view.getTag(R.id.safe_area_insets_observer)).isNull()
    val nextObserver = observe(view)
    nextObserver.onPreDraw()

    assertThat(nextObserver).isNotSameAs(observer)
    assertThat(events).hasSize(2)
  }

  private fun observe(view: View): SafeAreaInsetsObserver {
    view.id = 2
    SafeAreaInsetsObserver.setEnabled(view, true)
    return view.getTag(R.id.safe_area_insets_observer) as SafeAreaInsetsObserver
  }

  private fun addParent(left: Int, top: Int, right: Int, bottom: Int): FrameLayout =
      FrameLayout(root.context).also { parent ->
        root.addView(parent)
        parent.layout(left, top, right, bottom)
      }

  private fun addView(parent: FrameLayout, left: Int, top: Int, right: Int, bottom: Int): View =
      View(parent.context).also { view ->
        parent.addView(view)
        view.layout(left, top, right, bottom)
      }
}
