/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // CatalystInstance is deprecated

package com.facebook.react.uimanager

import android.content.Context
import android.content.ContextWrapper
import android.view.View
import android.widget.EditText
import androidx.core.view.ViewCompat
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.UIManager
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.EventDispatcherProvider

/** Helper class for [UIManager]. */
public object UIManagerHelper {
  private const val TAG = "UIManagerHelper"
  public const val PADDING_START_INDEX: Int = 0
  public const val PADDING_END_INDEX: Int = 1
  public const val PADDING_TOP_INDEX: Int = 2
  public const val PADDING_BOTTOM_INDEX: Int = 3

  /** @return a [UIManager] that can handle the react tag received by parameter. */
  @JvmStatic
  public fun getUIManagerForReactTag(context: ReactContext, reactTag: Int): UIManager? =
      getUIManager(context, UIManagerType.FABRIC)

  /** @return a [UIManager] that can handle the react tag received by parameter. */
  @JvmStatic
  public fun getUIManager(context: ReactContext, @UIManagerType uiManagerType: Int): UIManager? {
    if (!context.hasActiveReactInstance()) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          ReactNoCrashSoftException(
              "Cannot get UIManager because the context doesn't contain an active React instance."
          ),
      )
      return null
    }

    val uiManager = context.getFabricUIManager()
    if (uiManager == null) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          ReactNoCrashSoftException(
              "Cannot get UIManager because the instance hasn't been initialized yet."
          ),
      )
    }
    return uiManager
  }

  /** @return the [EventDispatcher] that handles events for the given [ReactContext]. */
  @JvmStatic
  public fun getEventDispatcher(context: ReactContext): EventDispatcher? {
    var localContext = context
    if (localContext is ThemedReactContext) {
      localContext = localContext.reactApplicationContext
    }
    return (localContext as EventDispatcherProvider).getEventDispatcher()
  }

  /** @return the [EventDispatcher] that handles events for the reactTag received as a parameter. */
  @JvmStatic
  @Deprecated("reactTag is no longer needed", ReplaceWith("getEventDispatcher(context)"))
  public fun getEventDispatcherForReactTag(context: ReactContext, reactTag: Int): EventDispatcher? =
      getEventDispatcher(context)

  /**
   * @return the [EventDispatcher] that handles events for the [UIManagerType] received as a
   *   parameter.
   */
  @JvmStatic
  @Deprecated("UIManagerType is no longer needed", ReplaceWith("getEventDispatcher(context)"))
  public fun getEventDispatcher(
      context: ReactContext,
      @UIManagerType uiManagerType: Int,
  ): EventDispatcher? = getEventDispatcher(context)

  /**
   * @return The [ReactContext] associated to the [View] received as a parameter.
   *
   * We can't rely that the method View.getContext() will return the same context that was passed as
   * a parameter during the construction of the View.
   *
   * For example the AppCompatEditText class wraps the context received as a parameter in the
   * constructor of the View into a TintContextWrapper object. See:
   * https://android.googlesource.com/platform/frameworks/support/+/dd55716/v7/appcompat/src/android/support/v7/widget/AppCompatEditText.java#55
   */
  @JvmStatic
  public fun getReactContext(view: View): ReactContext {
    var context = view.context
    if (context !is ReactContext && context is ContextWrapper) {
      context = context.baseContext
    }
    return context as ReactContext
  }

  /**
   * @return Gets the surfaceId for the [ThemedReactContext] associated with a View, if possible,
   *   and then call getSurfaceId on it. See above [getReactContext] for additional context.
   *
   * For RootViews, the root's rootViewTag is returned.
   *
   * Returns -1 for non-Fabric views.
   */
  @JvmStatic
  public fun getSurfaceId(view: View): Int {
    if (view is ReactRoot) {
      val rootView = view as ReactRoot
      return rootView.getRootViewTag()
    }

    var context = view.context
    if (context !is ThemedReactContext && context is ContextWrapper) {
      context = context.baseContext
    }

    val surfaceId = getSurfaceId(context)
    if (surfaceId == -1) {
      // All Fabric-managed Views (should) have a ThemedReactContext attached.
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException(
              "Fabric View [${view.id}] does not have SurfaceId associated with it"
          ),
      )
    }
    return surfaceId
  }

  @JvmStatic
  public fun getSurfaceId(context: Context?): Int =
      if (context is ThemedReactContext) {
        context.surfaceId
      } else {
        -1
      }

  /**
   * @return the default padding used by Android EditText's. This method returns the padding in an
   *   array to avoid extra classloading during hot-path of RN Android.
   */
  @JvmStatic
  public fun getDefaultTextInputPadding(context: Context?): FloatArray {
    val editText = EditText(context)
    val padding = FloatArray(4)
    padding[PADDING_START_INDEX] =
        PixelUtil.toDIPFromPixel(ViewCompat.getPaddingStart(editText).toFloat())
    padding[PADDING_END_INDEX] =
        PixelUtil.toDIPFromPixel(ViewCompat.getPaddingEnd(editText).toFloat())
    padding[PADDING_TOP_INDEX] = PixelUtil.toDIPFromPixel(editText.paddingTop.toFloat())
    padding[PADDING_BOTTOM_INDEX] = PixelUtil.toDIPFromPixel(editText.paddingBottom.toFloat())
    return padding
  }
}
