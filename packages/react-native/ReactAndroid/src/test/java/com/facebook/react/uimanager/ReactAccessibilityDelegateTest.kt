/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import android.os.Bundle
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.R
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.testutils.shadows.ShadowArguments
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class ReactAccessibilityDelegateTest {
  private lateinit var view: ReactViewGroup
  private lateinit var reactContext: BridgeReactContext
  private lateinit var themedReactContext: ThemedReactContext
  private lateinit var accessibilityDelegate: ReactAccessibilityDelegate

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
    themedReactContext = ThemedReactContext(reactContext, reactContext, null, -1)
    view = ReactViewGroup(themedReactContext).apply { id = 100 }
    accessibilityDelegate = ReactAccessibilityDelegate(view, false, 0)
  }

  @Test
  fun testPerformAccessibilityAction_actionCollapse_setsExpandedTagToFalse() {
    view.setTag(R.id.accessibility_state_expanded, true)

    val accessibilityActions = JavaOnlyArray()
    val action =
        JavaOnlyMap().apply {
          putString("name", "collapse")
          putString("label", "Collapse")
        }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    val result =
        accessibilityDelegate.performAccessibilityAction(
            view,
            AccessibilityNodeInfoCompat.ACTION_COLLAPSE,
            null,
        )

    assertThat(result).isTrue()
    assertThat(view.getTag(R.id.accessibility_state_expanded)).isEqualTo(false)
  }

  @Test
  fun testPerformAccessibilityAction_actionExpand_setsExpandedTagToTrue() {
    view.setTag(R.id.accessibility_state_expanded, false)

    val accessibilityActions = JavaOnlyArray()
    val action =
        JavaOnlyMap().apply {
          putString("name", "expand")
          putString("label", "Expand")
        }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    val result =
        accessibilityDelegate.performAccessibilityAction(
            view,
            AccessibilityNodeInfoCompat.ACTION_EXPAND,
            null,
        )

    assertThat(result).isTrue()
    assertThat(view.getTag(R.id.accessibility_state_expanded)).isEqualTo(true)
  }

  @Test
  fun testPerformAccessibilityAction_customAction_dispatchesAccessibilityActionEvent() {
    val accessibilityActions = JavaOnlyArray()
    val action =
        JavaOnlyMap().apply {
          putString("name", "customAction")
          putString("label", "Custom Action")
        }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    val customActionId = 0x3f000000
    val result = accessibilityDelegate.performAccessibilityAction(view, customActionId, null)

    assertThat(result).isTrue()
  }

  @Test
  fun testPerformAccessibilityAction_activateAction_dispatchesEvent() {
    val accessibilityActions = JavaOnlyArray()
    val action =
        JavaOnlyMap().apply {
          putString("name", "activate")
          putString("label", "Activate")
        }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    val result =
        accessibilityDelegate.performAccessibilityAction(
            view,
            AccessibilityNodeInfoCompat.ACTION_CLICK,
            null,
        )

    assertThat(result).isTrue()
  }

  @Test
  fun testPerformAccessibilityAction_longpressAction_dispatchesEvent() {
    val accessibilityActions = JavaOnlyArray()
    val action =
        JavaOnlyMap().apply {
          putString("name", "longpress")
          putString("label", "Long Press")
        }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    val result =
        accessibilityDelegate.performAccessibilityAction(
            view,
            AccessibilityNodeInfoCompat.ACTION_LONG_CLICK,
            null,
        )

    assertThat(result).isTrue()
  }

  @Test
  fun testPerformAccessibilityAction_adjustableRole_scrollForward_callsSuper() {
    val accessibilityActions = JavaOnlyArray()
    val action = JavaOnlyMap().apply { putString("name", "increment") }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)
    view.setTag(R.id.accessibility_role, ReactAccessibilityDelegate.AccessibilityRole.ADJUSTABLE)

    val accessibilityValue =
        JavaOnlyMap().apply {
          putInt("min", 0)
          putInt("now", 5)
          putInt("max", 10)
        }
    view.setTag(R.id.accessibility_value, accessibilityValue)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    accessibilityDelegate.performAccessibilityAction(
        view,
        AccessibilityNodeInfoCompat.ACTION_SCROLL_FORWARD,
        null,
    )
  }

  @Test
  fun testPerformAccessibilityAction_adjustableRole_scrollBackward_callsSuper() {
    val accessibilityActions = JavaOnlyArray()
    val action = JavaOnlyMap().apply { putString("name", "decrement") }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)
    view.setTag(R.id.accessibility_role, ReactAccessibilityDelegate.AccessibilityRole.ADJUSTABLE)

    val accessibilityValue =
        JavaOnlyMap().apply {
          putInt("min", 0)
          putInt("now", 5)
          putInt("max", 10)
        }
    view.setTag(R.id.accessibility_value, accessibilityValue)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    accessibilityDelegate.performAccessibilityAction(
        view,
        AccessibilityNodeInfoCompat.ACTION_SCROLL_BACKWARD,
        null,
    )
  }

  @Test
  fun testPerformAccessibilityAction_adjustableRoleWithTextValue_doesNotScheduleEvent() {
    val accessibilityActions = JavaOnlyArray()
    val action = JavaOnlyMap().apply { putString("name", "increment") }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)
    view.setTag(R.id.accessibility_role, ReactAccessibilityDelegate.AccessibilityRole.ADJUSTABLE)

    val accessibilityValue =
        JavaOnlyMap().apply {
          putInt("min", 0)
          putInt("now", 5)
          putInt("max", 10)
          putString("text", "5 units")
        }
    view.setTag(R.id.accessibility_value, accessibilityValue)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    accessibilityDelegate.performAccessibilityAction(
        view,
        AccessibilityNodeInfoCompat.ACTION_SCROLL_FORWARD,
        null,
    )
  }

  @Test
  fun testPerformAccessibilityAction_unknownAction_callsSuperAndReturnsFalse() {
    val unknownActionId = 999999

    val result = accessibilityDelegate.performAccessibilityAction(view, unknownActionId, null)

    assertThat(result).isFalse()
  }

  @Test
  fun testPerformAccessibilityAction_withBundleArgs_handlesArgsCorrectly() {
    val accessibilityActions = JavaOnlyArray()
    val action =
        JavaOnlyMap().apply {
          putString("name", "customAction")
          putString("label", "Custom Action")
        }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    val args = Bundle()
    args.putString("key", "value")

    val customActionId = 0x3f000000
    val result = accessibilityDelegate.performAccessibilityAction(view, customActionId, args)

    assertThat(result).isTrue()
  }

  @Test
  fun testPerformAccessibilityAction_multipleCustomActions_eachHasUniqueId() {
    val accessibilityActions = JavaOnlyArray()

    val action1 =
        JavaOnlyMap().apply {
          putString("name", "action1")
          putString("label", "Action 1")
        }
    accessibilityActions.pushMap(action1)

    val action2 =
        JavaOnlyMap().apply {
          putString("name", "action2")
          putString("label", "Action 2")
        }
    accessibilityActions.pushMap(action2)

    view.setTag(R.id.accessibility_actions, accessibilityActions)

    val nodeInfo = AccessibilityNodeInfoCompat.obtain()
    accessibilityDelegate.onInitializeAccessibilityNodeInfo(view, nodeInfo)

    assertThat(nodeInfo.actionList.size).isGreaterThanOrEqualTo(2)
  }

  @Test
  fun testPerformAccessibilityAction_expandAction_fromAccessibilityActions() {
    val accessibilityActions = JavaOnlyArray()
    val action =
        JavaOnlyMap().apply {
          putString("name", "expand")
          putString("label", "Expand")
        }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    val result =
        accessibilityDelegate.performAccessibilityAction(
            view,
            AccessibilityNodeInfoCompat.ACTION_EXPAND,
            null,
        )

    assertThat(result).isTrue()
    assertThat(view.getTag(R.id.accessibility_state_expanded)).isEqualTo(true)
  }

  @Test
  fun testAccessibilityRole_fromValue_tabbar_resolvesInsteadOfThrowing() {
    val role = ReactAccessibilityDelegate.AccessibilityRole.fromValue("tabbar")

    assertThat(role).isEqualTo(ReactAccessibilityDelegate.AccessibilityRole.TABBAR)
    assertThat(ReactAccessibilityDelegate.AccessibilityRole.getValue(role))
        .isEqualTo("android.view.View")
  }

  @Test
  fun testPerformAccessibilityAction_collapseAction_fromAccessibilityActions() {
    val accessibilityActions = JavaOnlyArray()
    val action =
        JavaOnlyMap().apply {
          putString("name", "collapse")
          putString("label", "Collapse")
        }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)

    accessibilityDelegate.onInitializeAccessibilityNodeInfo(
        view,
        AccessibilityNodeInfoCompat.obtain(),
    )

    val result =
        accessibilityDelegate.performAccessibilityAction(
            view,
            AccessibilityNodeInfoCompat.ACTION_COLLAPSE,
            null,
        )

    assertThat(result).isTrue()
    assertThat(view.getTag(R.id.accessibility_state_expanded)).isEqualTo(false)
  }
}
