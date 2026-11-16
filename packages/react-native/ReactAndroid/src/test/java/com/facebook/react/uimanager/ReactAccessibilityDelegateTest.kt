/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import android.os.Bundle
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.R
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.WritableMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.RCTEventEmitter
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.testutils.shadows.ShadowArguments
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.spy
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class, ShadowSoLoader::class])
@RunWith(RobolectricTestRunner::class)
class ReactAccessibilityDelegateTest {
  private lateinit var view: ReactViewGroup
  private lateinit var reactContext: ReactApplicationContext
  private lateinit var themedReactContext: ThemedReactContext
  private lateinit var accessibilityDelegate: ReactAccessibilityDelegate

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    reactContext = spy(createTestReactApplicationContext())
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
  fun testPerformAccessibilityAction_setProgressAction_isExposedAndHandled() {
    val accessibilityActions = JavaOnlyArray()
    val action = JavaOnlyMap().apply { putString("name", "setProgress") }
    accessibilityActions.pushMap(action)
    view.setTag(R.id.accessibility_actions, accessibilityActions)

    val nodeInfo = AccessibilityNodeInfoCompat.obtain()
    accessibilityDelegate.onInitializeAccessibilityNodeInfo(view, nodeInfo)

    assertThat(nodeInfo.actionList.map { it.id })
        .contains(AccessibilityNodeInfo.AccessibilityAction.ACTION_SET_PROGRESS.id)

    val args =
        Bundle().apply { putFloat(AccessibilityNodeInfoCompat.ACTION_ARGUMENT_PROGRESS_VALUE, 42f) }
    val eventDispatcher = mock<EventDispatcher>()
    val uiManager = mock<UIManager>()
    whenever(uiManager.eventDispatcher).thenReturn(eventDispatcher)
    val uiManagerHelper = mockStatic(UIManagerHelper::class.java)
    try {
      doReturn(true).whenever(reactContext).hasActiveReactInstance()
      uiManagerHelper
          .`when`<UIManager?> {
            UIManagerHelper.getUIManager(themedReactContext, UIManagerType.FABRIC)
          }
          .thenReturn(uiManager)

      val result =
          accessibilityDelegate.performAccessibilityAction(
              view,
              AccessibilityNodeInfo.AccessibilityAction.ACTION_SET_PROGRESS.id,
              args,
          )

      assertThat(result).isTrue()
      val eventCaptor = argumentCaptor<Event<*>>()
      verify(eventDispatcher).dispatchEvent(eventCaptor.capture())
      val eventEmitter = mock<RCTEventEmitter>()
      eventCaptor.firstValue.dispatch(eventEmitter)
      val eventDataCaptor = argumentCaptor<WritableMap>()
      verify(eventEmitter)
          .receiveEvent(
              eq(view.id),
              eq(ReactAccessibilityDelegate.TOP_ACCESSIBILITY_ACTION_EVENT),
              eventDataCaptor.capture(),
          )
      assertThat(eventDataCaptor.firstValue.getString("actionName")).isEqualTo("setProgress")
      assertThat(eventDataCaptor.firstValue.getDouble("value")).isEqualTo(42.0)
    } finally {
      uiManagerHelper.close()
    }
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
  fun testAccessibilityRole_fromValue_invalidRole_returnsNone() {
    val role = ReactAccessibilityDelegate.AccessibilityRole.fromValue("invalid-role")

    assertThat(role).isEqualTo(ReactAccessibilityDelegate.AccessibilityRole.NONE)
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
