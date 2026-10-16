/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import android.view.View
import android.view.View.OnFocusChangeListener
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.FrameLayout
import androidx.core.view.ViewCompat
import com.facebook.react.R
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.touch.JSResponderHandler
import com.facebook.react.views.scroll.ReactHorizontalScrollViewManager
import com.facebook.react.views.scroll.ReactNestedScrollViewManager
import com.facebook.react.views.scroll.ReactScrollViewAccessibilityDelegate
import com.facebook.react.views.scroll.ReactScrollViewManager
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import com.facebook.testutils.shadows.ShadowArguments
import java.util.Locale
import org.assertj.core.api.Assertions
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class BaseViewManagerTest {
  private lateinit var viewManager: BaseViewManager<ReactViewGroup, *>
  private lateinit var view: ReactViewGroup
  private lateinit var themedReactContext: ThemedReactContext

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableViewRecycling(): Boolean = true
        },
    )
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
    viewManager = ReactViewManager()
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    themedReactContext = ThemedReactContext(context, context, null, -1)
    view = ReactViewGroup(themedReactContext)
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun testAccessibilityRoleNone() {
    viewManager.setAccessibilityRole(view, "none")
    Assertions.assertThat(view.getTag(R.id.accessibility_role))
        .isEqualTo(ReactAccessibilityDelegate.AccessibilityRole.NONE)
  }

  @Test
  fun testAccessibilityRoleTurkish() {
    Locale.setDefault(Locale.forLanguageTag("tr-TR"))
    viewManager.setAccessibilityRole(view, "image")
    Assertions.assertThat(view.getTag(R.id.accessibility_role))
        .isEqualTo(ReactAccessibilityDelegate.AccessibilityRole.IMAGE)
  }

  @Test
  fun testAccessibilityStateSelected() {
    val accessibilityState = JavaOnlyMap()
    accessibilityState.putBoolean("selected", true)
    viewManager.setViewState(view, accessibilityState)
    Assertions.assertThat(view.getTag(R.id.accessibility_state)).isEqualTo(accessibilityState)
    Assertions.assertThat(view.isSelected).isEqualTo(true)
  }

  @Test
  fun testClearingAccessibilityDisabledRestoresTapTarget() {
    val root = FrameLayout(themedReactContext)
    root.id = 1
    root.layout(0, 0, 300, 300)
    view.id = 3
    root.addView(view)
    view.layout(0, 0, 200, 100)

    for (state in listOf(JavaOnlyMap(), JavaOnlyMap.of("disabled", null), null)) {
      viewManager.setViewState(view, JavaOnlyMap.of("disabled", true))
      Assertions.assertThat(TouchTargetHelper.findTargetTagForTouch(20f, 50f, root)).isEqualTo(1)

      viewManager.setViewState(view, state)

      Assertions.assertThat(view.isEnabled).isTrue()
      Assertions.assertThat(TouchTargetHelper.findTargetTagForTouch(20f, 50f, root)).isEqualTo(3)
      Assertions.assertThat(view.getTag(R.id.accessibility_state_disabled)).isNull()
    }
  }

  @Test
  fun testClearingAccessibilityDisabledPreservesOtherState() {
    val state = JavaOnlyMap.of("busy", true, "checked", "mixed")
    viewManager.setViewState(view, JavaOnlyMap.of("disabled", true))

    viewManager.setViewState(view, state)

    val nativeState = view.getTag(R.id.accessibility_state) as ReadableMap
    Assertions.assertThat(view.isEnabled).isTrue()
    Assertions.assertThat(nativeState.getBoolean("busy")).isTrue()
    Assertions.assertThat(nativeState.getString("checked")).isEqualTo("mixed")
    Assertions.assertThat(state.hasKey("disabled")).isFalse()
  }

  @Test
  fun testViewManagerSubclassPreservesDisabledDuringPartialUpdates() {
    val subclassManager = object : ReactViewManager() {}
    subclassManager.setViewState(view, JavaOnlyMap.of("disabled", true))

    subclassManager.setViewState(view, JavaOnlyMap.of("busy", true))

    Assertions.assertThat(view.isEnabled).isFalse()
  }

  @Test
  fun testAccessibilityStateDisabledRemovedReenablesView() {
    viewManager.setViewState(view, JavaOnlyMap.of("disabled", true))
    Assertions.assertThat(view.isEnabled).isFalse()

    viewManager.setViewState(view, JavaOnlyMap())
    Assertions.assertThat(view.isEnabled).isTrue()
  }

  @Test
  fun testAccessibilityStateNullReenablesView() {
    viewManager.setViewState(view, JavaOnlyMap.of("disabled", true))
    viewManager.setViewState(view, null)
    Assertions.assertThat(view.isEnabled).isTrue()
  }

  @Test
  fun testAccessibilityStateDisabledNullDoesNotCrash() {
    viewManager.setViewState(view, JavaOnlyMap.of("disabled", true))
    viewManager.setViewState(view, JavaOnlyMap.of("disabled", null))
    Assertions.assertThat(view.isEnabled).isTrue()
  }

  @Test
  fun testAccessibilityStateWithoutDisabledKeepsViewDisabledByOtherProps() {
    view.isEnabled = false
    viewManager.setViewState(view, JavaOnlyMap())
    Assertions.assertThat(view.isEnabled).isFalse()
    viewManager.setViewState(view, null)
    Assertions.assertThat(view.isEnabled).isFalse()
  }

  @Test
  fun testRoleList() {
    viewManager.setRole(view, "list")
    Assertions.assertThat(view.getTag(R.id.role)).isEqualTo(ReactAccessibilityDelegate.Role.LIST)
  }

  @Test
  fun testAddEventEmittersDoesNotOverrideExistingEventEmitters() {
    val originalFocusListener = mock<OnFocusChangeListener>()
    view.onFocusChangeListener = originalFocusListener
    viewManager.addEventEmitters(themedReactContext, view)
    Assertions.assertThat(view.onFocusChangeListener).isNotEqualTo(originalFocusListener)
    view.onFocusChangeListener.onFocusChange(view, true)
    verify(originalFocusListener, times(1)).onFocusChange(view, true)
  }

  @Test
  fun testDroppingViewInstanceRestoresFocusChangeListener() {
    val originalFocusListener = mock<OnFocusChangeListener>()
    view.onFocusChangeListener = originalFocusListener
    viewManager.addEventEmitters(themedReactContext, view)
    Assertions.assertThat(view.onFocusChangeListener).isNotEqualTo(originalFocusListener)

    view.onFocusChangeListener.onFocusChange(view, true)
    verify(originalFocusListener, times(1)).onFocusChange(view, true)
    Assertions.assertThat(originalFocusListener).isNotEqualTo(view.onFocusChangeListener)

    viewManager.onDropViewInstance(view)
    view.onFocusChangeListener.onFocusChange(view, true)
    verify(originalFocusListener, times(2)).onFocusChange(view, true)
    Assertions.assertThat(originalFocusListener).isEqualTo(view.onFocusChangeListener)
  }

  @Test
  fun testAccessibilityLabelledByString() {
    viewManager.setAccessibilityLabelledBy(view, DynamicFromObject("target_id"))
    Assertions.assertThat(view.getTag(R.id.labelled_by)).isEqualTo("target_id")
  }

  @Test
  fun testAccessibilityLabelledByArray() {
    val array = JavaOnlyArray.of("first_id", "second_id")
    viewManager.setAccessibilityLabelledBy(view, DynamicFromObject(array))
    Assertions.assertThat(view.getTag(R.id.labelled_by)).isEqualTo("first_id")
  }

  @Test
  fun testAccessibilityLabelledByNullClearsTag() {
    view.setTag(R.id.labelled_by, "stale_id")
    viewManager.setAccessibilityLabelledBy(view, DynamicFromObject(null))
    Assertions.assertThat(view.getTag(R.id.labelled_by)).isNull()
  }

  @Test
  fun testAccessibilityLabelledByEmptyArrayDoesNotCrash() {
    view.setTag(R.id.labelled_by, "stale_id")
    viewManager.setAccessibilityLabelledBy(view, DynamicFromObject(JavaOnlyArray()))
    Assertions.assertThat(view.getTag(R.id.labelled_by)).isNull()
  }

  @Test
  fun testRecycledViewHasTheAccessibilityStateOfANewView() {
    val recycled =
        recycleView(
            JavaOnlyMap.of(
                ViewProps.ACCESSIBILITY_LABEL,
                "Dismiss sheet",
                ViewProps.ACCESSIBILITY_STATE,
                JavaOnlyMap.of("selected", true),
                ViewProps.ACCESSIBILITY_LIVE_REGION,
                "assertive",
                ViewProps.IMPORTANT_FOR_ACCESSIBILITY,
                "no-hide-descendants",
                ViewProps.SCREEN_READER_FOCUSABLE,
                true,
            )
        )

    Assertions.assertThat(recycled.contentDescription).isEqualTo(view.contentDescription)
    Assertions.assertThat(recycled.isSelected).isEqualTo(view.isSelected)
    Assertions.assertThat(recycled.accessibilityLiveRegion).isEqualTo(view.accessibilityLiveRegion)
    Assertions.assertThat(recycled.importantForAccessibility)
        .isEqualTo(view.importantForAccessibility)
    Assertions.assertThat(recycled.isScreenReaderFocusable).isEqualTo(view.isScreenReaderFocusable)
  }

  @Test
  fun testRecycledViewDropsTheRoleAndCollectionOfItsPreviousProps() {
    val recycled =
        recycleView(
            JavaOnlyMap.of(
                ViewProps.ROLE,
                "list",
                ViewProps.ACCESSIBILITY_COLLECTION,
                JavaOnlyMap.of("rowCount", 1, "columnCount", 1, "hierarchical", false),
                ViewProps.ACCESSIBILITY_COLLECTION_ITEM,
                JavaOnlyMap.of(
                    "rowIndex",
                    0,
                    "rowSpan",
                    1,
                    "columnIndex",
                    0,
                    "columnSpan",
                    1,
                    "heading",
                    false,
                ),
            )
        )

    Assertions.assertThat(recycled.getTag(R.id.role)).isNull()
    Assertions.assertThat(recycled.getTag(R.id.accessibility_collection)).isNull()
    Assertions.assertThat(recycled.getTag(R.id.accessibility_collection_item)).isNull()
  }

  @Test
  fun testRecycledScrollViewsKeepTheAccessibilityDelegateTheirConstructorsInstall() {
    ReactNativeFeatureFlags.dangerouslyReset()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableViewRecycling(): Boolean = true

          override fun enableViewRecyclingForScrollView(): Boolean = true
        },
    )

    val recycledScrollViews =
        listOf(
            recycleView(ReactScrollViewManager(), JavaOnlyMap()),
            recycleView(ReactHorizontalScrollViewManager(), JavaOnlyMap()),
            recycleView(ReactNestedScrollViewManager(), JavaOnlyMap()),
        )

    for (recycled in recycledScrollViews) {
      Assertions.assertThat(ViewCompat.getAccessibilityDelegate(recycled))
          .isInstanceOf(ReactScrollViewAccessibilityDelegate::class.java)
    }
  }

  @Test
  fun testRecycledViewPerformsItsOwnAccessibilityClick() {
    val recycled =
        recycleView(
            JavaOnlyMap.of(
                ViewProps.ACCESSIBILITY_ACTIONS,
                JavaOnlyArray.of(JavaOnlyMap.of("name", "activate")),
            )
        ) { previous ->
          previous.createAccessibilityNodeInfo()
        }
    var clicks = 0
    recycled.setOnClickListener { clicks++ }

    recycled.performAccessibilityAction(AccessibilityNodeInfo.ACTION_CLICK, null)

    Assertions.assertThat(clicks).isEqualTo(1)
  }

  @Test
  fun testRecycledViewDropsTheAccessibilityOrderOfItsPreviousProps() {
    ReactNativeFeatureFlags.dangerouslyReset()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableViewRecycling(): Boolean = true

          override fun enableAccessibilityOrder(): Boolean = true
        },
    )

    val recycled =
        recycleView(JavaOnlyMap.of(ViewProps.ACCESSIBILITY_ORDER, JavaOnlyArray.of("first")))

    Assertions.assertThat(recycled.axOrderList).isNull()
  }

  @Test
  fun testRecycledViewDropsTheAccessibilityOrderItsParentApplied() {
    val parent = ReactViewGroup(themedReactContext)

    val recycled =
        recycleView(JavaOnlyMap()) { previous ->
          ReactAxOrderHelper.buildAxOrderList(
              previous,
              parent,
              mutableListOf<String>(),
              arrayOfNulls(0),
          )
          ReactAxOrderHelper.disableFocusForSubtree(previous, mutableListOf<String>())
        }

    Assertions.assertThat(recycled.getTag(R.id.accessibility_order_parent)).isNull()
    Assertions.assertThat(recycled.getTag(R.id.original_focusability)).isNull()
  }

  private fun recycleView(
      previousProps: JavaOnlyMap,
      beforeDrop: (ReactViewGroup) -> Unit = {},
  ): ReactViewGroup = recycleView(viewManager, previousProps, beforeDrop)

  private fun <T : View> recycleView(
      manager: ViewManager<T, *>,
      previousProps: JavaOnlyMap,
      beforeDrop: (T) -> Unit = {},
  ): T {
    val previous = createView(manager, previousProps)
    beforeDrop(previous)
    manager.onDropViewInstance(previous)
    val recycled = createView(manager, JavaOnlyMap())
    Assertions.assertThat(recycled).isSameAs(previous)
    return recycled
  }

  private fun createView(props: JavaOnlyMap): ReactViewGroup = createView(viewManager, props)

  private fun <T : View> createView(manager: ViewManager<T, *>, props: JavaOnlyMap): T =
      manager.createView(
          1,
          themedReactContext,
          ReactStylesDiffMap(props),
          null,
          JSResponderHandler(),
      )
}
