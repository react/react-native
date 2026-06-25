/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.swiperefresh

import android.graphics.Color
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.AndroidSwipeRefreshLayoutManagerDelegate
import com.facebook.react.viewmanagers.AndroidSwipeRefreshLayoutManagerInterface
import java.util.HashMap

/**
 * ViewManager for [ReactSwipeRefreshLayout] which allows the user to "pull to refresh" a child
 * view. Emits an `onRefresh` event when this happens.
 */
@ReactModule(name = SwipeRefreshLayoutManager.REACT_CLASS)
internal open class SwipeRefreshLayoutManager :
    ViewGroupManager<ReactSwipeRefreshLayout>(),
    AndroidSwipeRefreshLayoutManagerInterface<ReactSwipeRefreshLayout> {

  private val delegate: ViewManagerDelegate<ReactSwipeRefreshLayout> =
      AndroidSwipeRefreshLayoutManagerDelegate(this)

  override fun createViewInstance(reactContext: ThemedReactContext): ReactSwipeRefreshLayout =
      ReactSwipeRefreshLayout(reactContext)

  override fun getName(): String = REACT_CLASS

  @ReactProp(name = ViewProps.ENABLED, defaultBoolean = true)
  override fun setEnabled(view: ReactSwipeRefreshLayout, value: Boolean) {
    view.isEnabled = value
  }

  @ReactProp(name = "colors", customType = "ColorArray")
  override fun setColors(view: ReactSwipeRefreshLayout, value: ReadableArray?) {
    if (value != null) {
      val colorValues = IntArray(value.size())
      for (i in 0..<value.size()) {
        if (value.getType(i) == ReadableType.Map) {
          colorValues[i] = ColorPropConverter.getColor(value.getMap(i), view.context, 0)
        } else {
          colorValues[i] = value.getInt(i)
        }
      }
      view.setColorSchemeColors(*colorValues)
    } else {
      view.setColorSchemeColors()
    }
  }

  @ReactProp(name = "progressBackgroundColor", customType = "Color")
  override fun setProgressBackgroundColor(view: ReactSwipeRefreshLayout, value: Int?) {
    view.setProgressBackgroundColorSchemeColor(value ?: Color.TRANSPARENT)
  }

  // TODO(T46143833): Remove this method once the 'size' prop has been migrated to String in JS.
  fun setSize(view: ReactSwipeRefreshLayout, value: Int): Unit {
    view.setSize(value)
  }

  override fun setSize(view: ReactSwipeRefreshLayout, value: String?) {
    if (value == null || value.equals("default")) {
      view.setSize(SwipeRefreshLayout.DEFAULT)
    } else if (value.equals("large")) {
      view.setSize(SwipeRefreshLayout.LARGE)
    } else {
      throw IllegalArgumentException("Size must be 'default' or 'large', received: $value")
    }
  }

  // This prop temporarily takes both 0 and 1 as well as 'default' and 'large'.
  // 0 and 1 are deprecated and will be removed in a future release.
  // See T46143833
  @ReactProp(name = "size")
  fun setSize(view: ReactSwipeRefreshLayout, size: Dynamic): Unit {
    when {
      size.isNull -> view.setSize(SwipeRefreshLayout.DEFAULT)
      size.type == ReadableType.Number -> view.setSize(size.asInt())
      size.type == ReadableType.String -> this.setSize(view, size.asString())
      else -> throw IllegalArgumentException("Size must be 'default' or 'large'")
    }
  }

  @ReactProp(name = "refreshing")
  override fun setRefreshing(view: ReactSwipeRefreshLayout, value: Boolean) {
    view.isRefreshing = value
  }

  @ReactProp(name = "progressViewOffset", defaultFloat = 0f)
  override fun setProgressViewOffset(view: ReactSwipeRefreshLayout, value: Float) {
    view.setProgressViewOffset(value)
  }

  override fun setNativeRefreshing(view: ReactSwipeRefreshLayout, value: Boolean) {
    setRefreshing(view, value)
  }

  override fun addEventEmitters(reactContext: ThemedReactContext, view: ReactSwipeRefreshLayout) {
    view.setOnRefreshListener {
      val eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext)
      eventDispatcher?.dispatchEvent(RefreshEvent(UIManagerHelper.getSurfaceId(view), view.id))
    }
  }

  override fun getExportedViewConstants(): MutableMap<String, Any> =
      mutableMapOf(
          "SIZE" to
              mutableMapOf(
                  "DEFAULT" to SwipeRefreshLayout.DEFAULT,
                  "LARGE" to SwipeRefreshLayout.LARGE,
              )
      )

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    val baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants()
    val eventTypeConstants: MutableMap<String, Any> = baseEventTypeConstants ?: HashMap()
    eventTypeConstants.putAll(
        mutableMapOf("topRefresh" to mutableMapOf("registrationName" to "onRefresh"))
    )
    return eventTypeConstants
  }

  override fun getDelegate(): ViewManagerDelegate<ReactSwipeRefreshLayout> = delegate

  companion object {
    const val REACT_CLASS: String = "AndroidSwipeRefreshLayout"
  }
}
