/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.progressbar

import android.content.Context
import android.util.Pair
import android.view.View
import android.widget.ProgressBar
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.ReactConstants
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BaseViewManager
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.PixelUtil.toDIPFromPixel
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.AndroidProgressBarManagerDelegate
import com.facebook.react.viewmanagers.AndroidProgressBarManagerInterface
import com.facebook.yoga.YogaMeasureMode
import com.facebook.yoga.YogaMeasureOutput
import java.util.WeakHashMap

/**
 * Manages instances of [ProgressBar]. [ProgressBar] is wrapped in a [ProgressBarContainerView]
 * because the style of the [ProgressBar] can only be set in the constructor, whenever the style of
 * a [ProgressBar] changes, we have to drop the existing [ProgressBar] (if there is one) and create
 * a new one with the style given.
 */
@ReactModule(name = ReactProgressBarViewManager.REACT_CLASS)
internal class ReactProgressBarViewManager :
    BaseViewManager<ProgressBarContainerView, LayoutShadowNode>(),
    AndroidProgressBarManagerInterface<ProgressBarContainerView> {
  @Suppress("IDENTITY_SENSITIVE_OPERATIONS_WITH_VALUE_TYPE")
  private val measuredStyles = WeakHashMap<Int, Pair<Int, Int>>()

  private val delegate: ViewManagerDelegate<ProgressBarContainerView> =
      AndroidProgressBarManagerDelegate(this)

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(context: ThemedReactContext): ProgressBarContainerView {
    return ProgressBarContainerView(context)
  }

  @ReactProp(name = PROP_STYLE)
  override fun setStyleAttr(view: ProgressBarContainerView, value: String?) {
    view.setStyle(value)
  }

  @ReactProp(name = ViewProps.COLOR, customType = "Color")
  override fun setColor(view: ProgressBarContainerView, value: Int?) {
    view.color = value
  }

  @ReactProp(name = PROP_INDETERMINATE)
  override fun setIndeterminate(view: ProgressBarContainerView, value: Boolean) {
    view.indeterminate = value
  }

  @ReactProp(name = PROP_PROGRESS)
  override fun setProgress(view: ProgressBarContainerView, value: Double) {
    view.progress = value
  }

  @ReactProp(name = PROP_ANIMATING)
  override fun setAnimating(view: ProgressBarContainerView, value: Boolean) {
    view.animating = value
  }

  override fun setTestID(view: ProgressBarContainerView, value: String?) {
    super.setTestId(view, value)
  }

  @ReactProp(name = PROP_ATTR)
  override fun setTypeAttr(view: ProgressBarContainerView, value: String?): Unit = Unit

  override fun createShadowNodeInstance(): LayoutShadowNode = LayoutShadowNode()

  override fun getShadowNodeClass(): Class<LayoutShadowNode> = LayoutShadowNode::class.java

  override fun updateExtraData(root: ProgressBarContainerView, extraData: Any) {
    // do nothing
  }

  override fun onAfterUpdateTransaction(view: ProgressBarContainerView) {
    view.apply()
  }

  override fun getDelegate(): ViewManagerDelegate<ProgressBarContainerView> = delegate

  override fun measure(
      context: Context,
      localData: ReadableMap?,
      props: ReadableMap?,
      state: ReadableMap?,
      width: Float,
      widthMode: YogaMeasureMode,
      height: Float,
      heightMode: YogaMeasureMode,
      attachmentsPositions: FloatArray?,
  ): Long {
    val style = getStyleFromString(props?.getString(PROP_STYLE))
    val value =
        measuredStyles.getOrPut(style) {
          val progressBar = createProgressBar(context, style)
          val spec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
          progressBar.measure(spec, spec)
          Pair.create(progressBar.measuredWidth, progressBar.measuredHeight)
        }

    return YogaMeasureOutput.make(
        toDIPFromPixel(value.first.toFloat()),
        toDIPFromPixel(value.second.toFloat()),
    )
  }

  companion object {
    const val REACT_CLASS: String = "AndroidProgressBar"

    const val PROP_STYLE: String = "styleAttr"
    const val PROP_ATTR: String = "typeAttr"
    const val PROP_INDETERMINATE: String = "indeterminate"
    const val PROP_PROGRESS: String = "progress"
    const val PROP_ANIMATING: String = "animating"
    const val DEFAULT_STYLE: String = "Normal"

    private val progressBarCtorLock = Any()

    /**
     * We create ProgressBars on both the UI and shadow threads. There is a race condition in the
     * ProgressBar constructor that may cause crashes when two ProgressBars are constructed at the
     * same time on two different threads. This static ctor wrapper protects against that.
     */
    fun createProgressBar(context: Context?, style: Int): ProgressBar {
      synchronized(progressBarCtorLock) {
        return ProgressBar(context, null, style)
      }
    }

    internal fun getStyleFromString(styleStr: String?): Int {
      when (styleStr) {
        null -> {
          FLog.w(ReactConstants.TAG, "ProgressBar needs to have a style, null received")
          return android.R.attr.progressBarStyle
        }
        "Horizontal" -> return android.R.attr.progressBarStyleHorizontal
        "Small" -> return android.R.attr.progressBarStyleSmall
        "Large" -> return android.R.attr.progressBarStyleLarge
        "Inverse" -> return android.R.attr.progressBarStyleInverse
        "SmallInverse" -> return android.R.attr.progressBarStyleSmallInverse
        "LargeInverse" -> return android.R.attr.progressBarStyleLargeInverse
        "Normal" -> return android.R.attr.progressBarStyle
        else -> {
          FLog.w(ReactConstants.TAG, "Unknown ProgressBar style: $styleStr")
          return android.R.attr.progressBarStyle
        }
      }
    }
  }
}
