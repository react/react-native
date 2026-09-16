/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import android.graphics.Color
import android.graphics.PorterDuff
import com.facebook.common.logging.FLog
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.drawee.controller.AbstractDraweeControllerBuilder
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.views.image.ImageLoadEvent.Companion.eventNameForType
import com.facebook.react.views.image.ImageResizeMode.toScaleType
import com.facebook.react.views.image.ImageResizeMode.toTileMode

@ReactModule(name = ReactImageManager.REACT_CLASS)
public class ReactImageManager
@JvmOverloads
public constructor(
    private val draweeControllerBuilder: AbstractDraweeControllerBuilder<*, *, *, *>? = null,
    private val globalImageLoadListener: GlobalImageLoadListener? = null,
    private val callerContextFactory: ReactCallerContextFactory? = null,
) : SimpleViewManager<ReactImageView>() {

  // This is kept for backward compatibility but should eventually be removed together with
  // the constructor.
  private var callerContext: Any? = null

  /**
   * Alternative constructor which allows to provide a callerContext as an [Object]
   *
   * @deprecated Use the constructor with ReactCallerContextFactory instead
   */
  @Deprecated(
      message = "Use the constructor with ReactCallerContextFactory instead",
      replaceWith =
          ReplaceWith(
              expression =
                  "ReactImageManager(draweeControllerBuilder, globalImageLoadListener, callerContextFactory)",
          ),
  )
  public constructor(
      draweeControllerBuilder: AbstractDraweeControllerBuilder<*, *, *, *>?,
      callerContext: Any?,
  ) : this(draweeControllerBuilder, null, null) {
    this.callerContext = callerContext
  }

  /**
   * Alternative constructor which allows to provide a callerContext as an [Object]
   *
   * @deprecated Use the constructor with ReactCallerContextFactory instead
   */
  @Deprecated(
      message = "Use the constructor with ReactCallerContextFactory instead",
      replaceWith =
          ReplaceWith(
              expression =
                  "ReactImageManager(draweeControllerBuilder, globalImageLoadListener, callerContextFactory)",
          ),
  )
  public constructor(
      draweeControllerBuilder: AbstractDraweeControllerBuilder<*, *, *, *>?,
      globalImageLoadListener: GlobalImageLoadListener?,
      callerContext: Any?,
  ) : this(draweeControllerBuilder, globalImageLoadListener, null) {
    this.callerContext = callerContext
  }

  public override fun createViewInstance(context: ThemedReactContext): ReactImageView {
    val callerContext =
        this.callerContext
            ?: callerContextFactory?.getOrCreateCallerContext(context.moduleName, null)
    return ReactImageView(
        context,
        draweeControllerBuilder ?: Fresco.newDraweeControllerBuilder(),
        globalImageLoadListener,
        callerContext,
    )
  }

  public override fun getName(): String = REACT_CLASS

  @ReactProp(name = "accessible")
  public fun setAccessible(view: ReactImageView, accessible: Boolean) {
    view.isFocusable = accessible
  }

  // In JS this is Image.props.source
  @ReactProp(name = "src")
  public fun setSrc(view: ReactImageView, sources: ReadableArray?) {
    setSource(view, sources)
  }

  @ReactProp(name = "source")
  public fun setSource(view: ReactImageView, sources: ReadableArray?) {
    view.setSource(sources)
  }

  @ReactProp(name = "blurRadius")
  public fun setBlurRadius(view: ReactImageView, blurRadius: Float) {
    view.setBlurRadius(blurRadius)
  }

  @Suppress("FunctionName")
  @ReactProp(name = "internal_analyticTag")
  public fun setInternal_AnalyticsTag(view: ReactImageView, analyticTag: String?) {
    if (callerContextFactory != null) {
      view.updateCallerContext(
          callerContextFactory.getOrCreateCallerContext(
              (view.context as ThemedReactContext).moduleName,
              analyticTag,
          ),
      )
    }
  }

  @ReactProp(name = "defaultSource")
  public fun setDefaultSource(view: ReactImageView, source: Dynamic) {
    view.setDefaultSource(imageSourceUri(source))
  }

  @Deprecated(
      "Retained only for binary/source compatibility; the defaultSource prop is now delivered " +
          "through the Dynamic overload.",
  )
  public fun setDefaultSource(view: ReactImageView, source: String?) {
    view.setDefaultSource(source)
  }

  // In JS this is Image.props.loadingIndicatorSource.uri
  @ReactProp(name = "loadingIndicatorSrc")
  public fun setLoadingIndicatorSource(view: ReactImageView, source: Dynamic) {
    view.setLoadingIndicatorSource(imageSourceUri(source))
  }

  @Deprecated(
      "Retained only for binary/source compatibility; the loadingIndicatorSrc prop is now " +
          "delivered through the Dynamic overload.",
  )
  public fun setLoadingIndicatorSource(view: ReactImageView, source: String?) {
    view.setLoadingIndicatorSource(source)
  }

  /**
   * The legacy raw-props path delivers these props as a plain uri string, but the Props 2.0 diffing
   * path (`ImageProps::getDiffProps`) serializes the full ImageSource object. Accept both formats
   * so either pipeline (and either side of a JS/native version skew) keeps working.
   */
  private fun imageSourceUri(source: Dynamic): String? =
      when (source.type) {
        ReadableType.String -> source.asString()
        ReadableType.Map -> source.asMap()?.getString("uri")
        else -> null
      }

  @ReactProp(name = "borderColor", customType = "Color")
  public fun setBorderColor(view: ReactImageView, borderColor: Int?) {
    BackgroundStyleApplicator.setBorderColor(view, LogicalEdge.ALL, borderColor)
  }

  @ReactProp(name = "overlayColor", customType = "Color")
  public fun setOverlayColor(view: ReactImageView, overlayColor: Int?) {
    if (overlayColor == null) {
      view.setOverlayColor(Color.TRANSPARENT)
    } else {
      view.setOverlayColor(overlayColor)
    }
  }

  @ReactProp(name = "borderWidth")
  public fun setBorderWidth(view: ReactImageView, borderWidth: Float) {
    BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.ALL, borderWidth)
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_RADIUS,
              ViewProps.BORDER_TOP_LEFT_RADIUS,
              ViewProps.BORDER_TOP_RIGHT_RADIUS,
              ViewProps.BORDER_BOTTOM_RIGHT_RADIUS,
              ViewProps.BORDER_BOTTOM_LEFT_RADIUS,
          ],
  )
  public fun setBorderRadius(view: ReactImageView, index: Int, rawBorderRadius: Dynamic) {
    val borderRadius = LengthPercentage.setFromDynamic(rawBorderRadius)
    BackgroundStyleApplicator.setBorderRadius(view, BorderRadiusProp.values()[index], borderRadius)
  }

  @Deprecated(
      "Don't use setBorderRadius(view, index, Float) as it was deprecated in React Native 0.88.0.",
  )
  public fun setBorderRadius(view: ReactImageView, index: Int, borderRadius: Float) {
    // Keep a direct body rather than routing a Float through DynamicFromObject:
    // DynamicFromObject(Float).asDouble() throws (boxed Float cannot cast to
    // Double), and setFromDynamic would not map NaN back to null the way the
    // original Float path did.
    val radius =
        if (borderRadius.isNaN()) null
        else LengthPercentage(borderRadius, LengthPercentageType.POINT)
    BackgroundStyleApplicator.setBorderRadius(view, BorderRadiusProp.values()[index], radius)
  }

  @ReactProp(name = ViewProps.RESIZE_MODE)
  public fun setResizeMode(view: ReactImageView, resizeMode: String?) {
    view.setScaleType(toScaleType(resizeMode))
    view.setTileMode(toTileMode(resizeMode))
  }

  @ReactProp(name = ViewProps.RESIZE_METHOD)
  public fun setResizeMethod(view: ReactImageView, resizeMethod: String?) {
    view.setResizeMethod(ImageResizeMethod.parse(resizeMethod))
  }

  @ReactProp(name = "resizeMultiplier")
  public fun setResizeMultiplier(view: ReactImageView, resizeMultiplier: Float) {
    if (resizeMultiplier < 0.01f) {
      FLog.w(ReactConstants.TAG, "Invalid resize multiplier: '$resizeMultiplier'")
    }
    view.setResizeMultiplier(resizeMultiplier)
  }

  @ReactProp(name = "tintColor", customType = "Color")
  public fun setTintColor(view: ReactImageView, tintColor: Int?) {
    if (tintColor == null) {
      view.clearColorFilter()
    } else {
      view.setColorFilter(tintColor, PorterDuff.Mode.SRC_IN)
    }
  }

  @ReactProp(name = "progressiveRenderingEnabled")
  public fun setProgressiveRenderingEnabled(view: ReactImageView, enabled: Boolean) {
    view.setProgressiveRenderingEnabled(enabled)
  }

  @ReactProp(name = "fadeDuration")
  public fun setFadeDuration(view: ReactImageView, durationMs: Int) {
    view.setFadeDuration(durationMs)
  }

  @ReactProp(name = "shouldNotifyLoadEvents")
  public fun setLoadHandlersRegistered(view: ReactImageView, shouldNotifyLoadEvents: Boolean) {
    view.setShouldNotifyLoadEvents(shouldNotifyLoadEvents)
  }

  @ReactProp(name = "headers")
  public fun setHeaders(view: ReactImageView, headers: ReadableMap?) {
    if (headers != null) {
      view.setHeaders(headers)
    }
  }

  public override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
      (super.getExportedCustomDirectEventTypeConstants() ?: mutableMapOf<String, Any>()).apply {
        put(
            eventNameForType(ImageLoadEvent.ON_LOAD_START),
            mapOf(REGISTRATION_NAME to ON_LOAD_START),
        )
        put(eventNameForType(ImageLoadEvent.ON_PROGRESS), mapOf(REGISTRATION_NAME to ON_PROGRESS))
        put(eventNameForType(ImageLoadEvent.ON_LOAD), mapOf(REGISTRATION_NAME to ON_LOAD))
        put(eventNameForType(ImageLoadEvent.ON_ERROR), mapOf(REGISTRATION_NAME to ON_ERROR))
        put(eventNameForType(ImageLoadEvent.ON_LOAD_END), mapOf(REGISTRATION_NAME to ON_LOAD_END))
      }

  protected override fun onAfterUpdateTransaction(view: ReactImageView) {
    super.onAfterUpdateTransaction(view)
    view.maybeUpdateView()
  }

  public companion object {
    public const val REACT_CLASS: String = "RCTImageView"

    private const val REGISTRATION_NAME: String = "registrationName"
    private const val ON_LOAD_START: String = "onLoadStart"
    private const val ON_PROGRESS: String = "onProgress"
    private const val ON_LOAD: String = "onLoad"
    private const val ON_ERROR: String = "onError"
    private const val ON_LOAD_END: String = "onLoadEnd"
  }
}
