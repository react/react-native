/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.content.Context
import android.os.Bundle
import android.view.View
import android.view.View.MeasureSpec
import androidx.annotation.UiThread
import com.facebook.infer.annotation.ThreadSafe
import com.facebook.react.ReactHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.fabric.SurfaceHandlerBinding
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.runtime.internal.bolts.Task
import com.facebook.react.uimanager.events.EventDispatcher
import java.util.concurrent.atomic.AtomicReference

/** A class responsible for creating and rendering a full-screen React surface. */
@ThreadSafe
@OptIn(FrameworkAPI::class, UnstableReactNativeAPI::class)
public class ReactSurfaceImpl
@VisibleForTesting
internal constructor(
    // Prevent mangling of surfaceHandler name for JVM
    // Remove when ReactInstance is Kotlin
    @get:JvmName("getSurfaceHandler") internal val surfaceHandler: SurfaceHandlerBinding,
    context: Context,
) : ReactSurface {

  /**
   * Surface can hold two types of context: one used to init the surface without view (e.g. during
   * prerendering), and themed view context later, whenever it is available. The assumption is that
   * custom theming is applied to both the same way, so changing them SHOULD NOT change the visual
   * output.
   */
  override var context: Context = context
    private set

  private val surfaceViewRef = AtomicReference<ReactSurfaceView?>(null)

  private val reactHostRef = AtomicReference<ReactHostImpl?>(null)

  internal val reactHost: ReactHostImpl?
    get() = reactHostRef.get()

  /**
   * @param context The Android Context to use to render the ReactSurfaceView
   * @param moduleName The string key used to register this surface in JS with SurfaceRegistry
   * @param initialProps A Bundle of properties to be passed to the root React component
   */
  public constructor(
      context: Context,
      moduleName: String,
      initialProps: Bundle?,
  ) : this(SurfaceHandlerBinding(moduleName), context) {
    val nativeProps = initialProps?.let { Arguments.fromBundle(it) as NativeMap }
    surfaceHandler.setProps(nativeProps)

    val displayMetrics = context.resources.displayMetrics
    surfaceHandler.setLayoutConstraints(
        MeasureSpec.makeMeasureSpec(displayMetrics.widthPixels, MeasureSpec.AT_MOST),
        MeasureSpec.makeMeasureSpec(displayMetrics.heightPixels, MeasureSpec.AT_MOST),
        0,
        0,
        doRTLSwap(context),
        isRTL(context),
        displayMetrics.density,
        getFontScale(context),
    )
  }

  /**
   * Attach a ReactHost to the ReactSurface.
   *
   * @param host The ReactHost to attach.
   */
  public fun attach(host: ReactHost) {
    require(host is ReactHostImpl) { "ReactSurfaceImpl.attach can only attach to ReactHostImpl." }
    check(reactHostRef.compareAndSet(null, host)) { "This surface is already attached to a host!" }
  }

  /**
   * Attaches a view to the surface. View can be attached only once and should not be detached
   * after.
   */
  public fun attachView(view: ReactSurfaceView) {
    check(surfaceViewRef.compareAndSet(null, view)) {
      "Trying to call ReactSurface.attachView(), but the view is already attached."
    }
    // re: thread safety. Context can be changed only once, during view init, so view atomic above
    // already guards the context update.
    context = view.context
  }

  public fun updateInitProps(newProps: Bundle) {
    surfaceHandler.setProps(Arguments.fromBundle(newProps) as NativeMap)
  }

  /** Detach the ReactSurface from its ReactHost. */
  override fun detach() {
    reactHostRef.set(null)
  }

  public override val view: ReactSurfaceView?
    get() = surfaceViewRef.get()

  override fun prerender(): TaskInterface<Void> {
    val host =
        reactHost
            ?: return Task.forError(
                IllegalStateException(
                    "Trying to call ReactSurface.prerender(), but no ReactHost is attached.",
                ),
            )
    return host.prerenderSurface(this)
  }

  override fun start(): TaskInterface<Void> {
    if (surfaceViewRef.get() == null) {
      return Task.forError(
          IllegalStateException("Trying to call ReactSurface.start(), but view is not created."),
      )
    }

    val host =
        reactHost
            ?: return Task.forError(
                IllegalStateException(
                    "Trying to call ReactSurface.start(), but no ReactHost is attached.",
                ),
            )
    return host.startSurface(this)
  }

  override fun stop(): TaskInterface<Void> {
    val host =
        reactHost
            ?: return Task.forError(
                IllegalStateException(
                    "Trying to call ReactSurface.stop(), but no ReactHost is attached.",
                ),
            )
    return host.stopSurface(this)
  }

  public override val surfaceID: Int
    get() = surfaceHandler.surfaceId

  public override val moduleName: String
    get() = surfaceHandler.moduleName

  override fun clear() {
    UiThreadUtil.runOnUiThread {
      val view = view
      if (view != null) {
        view.removeAllViews()
        view.id = View.NO_ID
      }
    }
  }

  @UiThread
  @Synchronized
  internal fun updateLayoutSpecs(
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
      offsetX: Int,
      offsetY: Int,
  ) {
    surfaceHandler.setLayoutConstraints(
        widthMeasureSpec,
        heightMeasureSpec,
        offsetX,
        offsetY,
        doRTLSwap(context),
        isRTL(context),
        context.resources.displayMetrics.density,
        getFontScale(context),
    )
  }

  internal val eventDispatcher: EventDispatcher?
    get() = reactHost?.eventDispatcher

  internal val isAttached: Boolean
    get() = reactHost != null

  public override val isRunning: Boolean
    get() = surfaceHandler.isRunning

  internal companion object {
    @JvmStatic
    public fun createWithView(
        context: Context,
        moduleName: String,
        initialProps: Bundle?,
    ): ReactSurfaceImpl {
      val surface = ReactSurfaceImpl(context, moduleName, initialProps)
      surface.attachView(ReactSurfaceView(context, surface))
      return surface
    }

    private fun isRTL(context: Context): Boolean = I18nUtil.instance.isRTL(context)

    private fun getFontScale(context: Context): Float =
        if (ReactNativeFeatureFlags.enableFontScaleChangesUpdatingLayout())
            context.resources.configuration.fontScale
        else 1f

    private fun doRTLSwap(context: Context): Boolean =
        I18nUtil.instance.doLeftAndRightSwapInRTL(context)
  }
}
