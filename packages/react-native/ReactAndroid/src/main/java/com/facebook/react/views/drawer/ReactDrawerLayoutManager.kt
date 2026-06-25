/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.drawer

import android.view.Gravity
import android.view.View
import androidx.drawerlayout.widget.DrawerLayout
import androidx.drawerlayout.widget.DrawerLayout.DrawerListener
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.viewmanagers.AndroidDrawerLayoutManagerDelegate
import com.facebook.react.viewmanagers.AndroidDrawerLayoutManagerInterface
import com.facebook.react.views.drawer.events.DrawerClosedEvent
import com.facebook.react.views.drawer.events.DrawerOpenedEvent
import com.facebook.react.views.drawer.events.DrawerSlideEvent
import com.facebook.react.views.drawer.events.DrawerStateChangedEvent

/** View Manager for [ReactDrawerLayout] components. */
@ReactModule(name = ReactDrawerLayoutManager.REACT_CLASS)
public class ReactDrawerLayoutManager :
    ViewGroupManager<ReactDrawerLayout>(), AndroidDrawerLayoutManagerInterface<ReactDrawerLayout> {

  private val delegate: ViewManagerDelegate<ReactDrawerLayout> =
      AndroidDrawerLayoutManagerDelegate(this)

  public override fun getName(): String = REACT_CLASS

  protected override fun addEventEmitters(
      reactContext: ThemedReactContext,
      view: ReactDrawerLayout,
  ) {
    val eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext) ?: return
    view.addDrawerListener(DrawerEventEmitter(view, eventDispatcher))
  }

  protected override fun createViewInstance(context: ThemedReactContext): ReactDrawerLayout =
      ReactDrawerLayout(context)

  public override fun setDrawerPosition(view: ReactDrawerLayout, value: String?): Unit =
      if (value == null) {
        view.setDrawerPosition(Gravity.START)
      } else {
        setDrawerPositionInternal(view, value)
      }

  @ReactProp(name = "drawerPosition")
  public fun setDrawerPosition(view: ReactDrawerLayout, drawerPosition: Dynamic) {
    when {
      drawerPosition.isNull -> view.setDrawerPosition(Gravity.START)
      drawerPosition.type == ReadableType.Number -> {
        val drawerPositionNum = drawerPosition.asInt()
        if (Gravity.START == drawerPositionNum || Gravity.END == drawerPositionNum) {
          view.setDrawerPosition(drawerPositionNum)
        } else {
          FLog.w(ReactConstants.TAG, "Unknown drawerPosition $drawerPositionNum")
          view.setDrawerPosition(Gravity.START)
        }
      }

      drawerPosition.type == ReadableType.String ->
          setDrawerPositionInternal(view, checkNotNull(drawerPosition.asString()))

      else -> {
        FLog.w(ReactConstants.TAG, "drawerPosition must be a string or int")
        view.setDrawerPosition(Gravity.START)
      }
    }
  }

  private fun setDrawerPositionInternal(view: ReactDrawerLayout, drawerPosition: String) {
    when (drawerPosition) {
      "left" -> view.setDrawerPosition(Gravity.START)
      "right" -> view.setDrawerPosition(Gravity.END)
      else -> {
        FLog.w(
            ReactConstants.TAG,
            "drawerPosition must be 'left' or 'right', received$drawerPosition",
        )
        view.setDrawerPosition(Gravity.START)
      }
    }
  }

  @ReactProp(name = "drawerWidth", defaultFloat = Float.NaN)
  public fun setDrawerWidth(view: ReactDrawerLayout, width: Float) {
    val widthInPx =
        if (width.isNaN()) {
          ReactDrawerLayout.DEFAULT_DRAWER_WIDTH
        } else {
          Math.round(width.dpToPx())
        }
    view.setDrawerWidth(widthInPx)
  }

  public override fun setDrawerWidth(view: ReactDrawerLayout, value: Float?) {
    val widthInPx = value?.let { Math.round(it.dpToPx()) } ?: ReactDrawerLayout.DEFAULT_DRAWER_WIDTH
    view.setDrawerWidth(widthInPx)
  }

  @ReactProp(name = "drawerLockMode")
  public override fun setDrawerLockMode(view: ReactDrawerLayout, value: String?) {
    when (value) {
      null,
      "unlocked" -> view.setDrawerLockMode(DrawerLayout.LOCK_MODE_UNLOCKED)
      "locked-closed" -> view.setDrawerLockMode(DrawerLayout.LOCK_MODE_LOCKED_CLOSED)
      "locked-open" -> view.setDrawerLockMode(DrawerLayout.LOCK_MODE_LOCKED_OPEN)
      else -> {
        FLog.w(ReactConstants.TAG, "Unknown drawerLockMode $value")
        view.setDrawerLockMode(DrawerLayout.LOCK_MODE_UNLOCKED)
      }
    }
  }

  public override fun openDrawer(view: ReactDrawerLayout): Unit = view.openDrawer()

  public override fun closeDrawer(view: ReactDrawerLayout): Unit = view.closeDrawer()

  @ReactProp(name = "keyboardDismissMode")
  public override fun setKeyboardDismissMode(view: ReactDrawerLayout, value: String?): Unit = Unit

  @ReactProp(name = "drawerBackgroundColor", customType = "Color")
  public override fun setDrawerBackgroundColor(view: ReactDrawerLayout, value: Int?): Unit = Unit

  @ReactProp(name = "statusBarBackgroundColor", customType = "Color")
  public override fun setStatusBarBackgroundColor(view: ReactDrawerLayout, value: Int?): Unit = Unit

  public override fun setElevation(view: ReactDrawerLayout, elevation: Float) {
    view.drawerElevation = elevation.dpToPx()
  }

  public override fun needsCustomLayoutForChildren(): Boolean {
    // Return true, since DrawerLayout will lay out it's own children.
    return true
  }

  public override fun getCommandsMap(): Map<String, Int> =
      mapOf(
          COMMAND_OPEN_DRAWER to OPEN_DRAWER,
          COMMAND_CLOSE_DRAWER to CLOSE_DRAWER,
      )

  @Deprecated(
      message =
          "This method is deprecated. Use receiveCommand(ReactDrawerLayout, String, ReadableArray) instead",
      replaceWith = ReplaceWith("receiveCommand(ReactDrawerLayout, String, ReadableArray)"),
  )
  public override fun receiveCommand(
      view: ReactDrawerLayout,
      commandId: Int,
      args: ReadableArray?,
  ): Unit {
    when (commandId) {
      OPEN_DRAWER -> view.openDrawer()
      CLOSE_DRAWER -> view.closeDrawer()
    }
  }

  public override fun getExportedViewConstants(): Map<String, Any> =
      mapOf(
          DRAWER_POSITION to
              mapOf(
                  DRAWER_POSITION_LEFT to Gravity.START,
                  DRAWER_POSITION_RIGHT to Gravity.END,
              )
      )

  public override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> {
    val eventTypeConstants = super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf()
    return eventTypeConstants.apply {
      put(DrawerSlideEvent.EVENT_NAME, mapOf("registrationName" to "onDrawerSlide"))
      put(DrawerOpenedEvent.EVENT_NAME, mapOf("registrationName" to "onDrawerOpen"))
      put(DrawerClosedEvent.EVENT_NAME, mapOf("registrationName" to "onDrawerClose"))
      put(DrawerStateChangedEvent.EVENT_NAME, mapOf("registrationName" to "onDrawerStateChanged"))
    }
  }

  /**
   * This method is overridden because of two reasons:
   * 1. A drawer must have exactly two children
   * 2. The second child that is added, is the navigationView, which gets panned from the side.
   */
  public override fun addView(parent: ReactDrawerLayout, child: View, index: Int) {
    if (getChildCount(parent) >= 2) {
      throw JSApplicationIllegalArgumentException("The Drawer cannot have more than two children")
    }
    if (index != 0 && index != 1) {
      throw JSApplicationIllegalArgumentException(
          "The only valid indices for drawer's child are 0 or 1. Got $index instead."
      )
    }
    parent.addView(child, index)
    parent.setDrawerProperties()
  }

  public override fun getDelegate(): ViewManagerDelegate<ReactDrawerLayout> = delegate

  internal class DrawerEventEmitter(
      private val drawerLayout: DrawerLayout,
      private val eventDispatcher: EventDispatcher,
  ) : DrawerListener {
    override fun onDrawerSlide(view: View, v: Float) {
      eventDispatcher.dispatchEvent(
          DrawerSlideEvent(UIManagerHelper.getSurfaceId(drawerLayout), drawerLayout.id, v)
      )
    }

    override fun onDrawerOpened(view: View) {
      eventDispatcher.dispatchEvent(
          DrawerOpenedEvent(UIManagerHelper.getSurfaceId(drawerLayout), drawerLayout.id)
      )
    }

    override fun onDrawerClosed(view: View) {
      eventDispatcher.dispatchEvent(
          DrawerClosedEvent(UIManagerHelper.getSurfaceId(drawerLayout), drawerLayout.id)
      )
    }

    override fun onDrawerStateChanged(i: Int) {
      eventDispatcher.dispatchEvent(
          DrawerStateChangedEvent(UIManagerHelper.getSurfaceId(drawerLayout), drawerLayout.id, i)
      )
    }
  }

  public companion object {
    public const val REACT_CLASS: String = "AndroidDrawerLayout"

    public const val OPEN_DRAWER: Int = 1
    public const val CLOSE_DRAWER: Int = 2

    public const val COMMAND_OPEN_DRAWER: String = "openDrawer"
    public const val COMMAND_CLOSE_DRAWER: String = "closeDrawer"

    private const val DRAWER_POSITION: String = "DrawerPosition"
    private const val DRAWER_POSITION_LEFT: String = "Left"
    private const val DRAWER_POSITION_RIGHT: String = "Right"
  }
}
