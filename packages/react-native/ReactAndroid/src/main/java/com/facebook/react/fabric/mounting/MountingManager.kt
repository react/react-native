/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.view.View
import androidx.annotation.AnyThread
import androidx.annotation.UiThread
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.RetryableMountingLayerException
import com.facebook.react.bridge.UiThreadUtil.assertOnUiThread
import com.facebook.react.bridge.WritableMap
import com.facebook.react.fabric.events.EventEmitterWrapper
import com.facebook.react.fabric.mounting.mountitems.MountItem
import com.facebook.react.touch.JSResponderHandler
import com.facebook.react.uimanager.RootViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.EventCategoryDef
import com.facebook.yoga.YogaMeasureMode
import java.util.Queue
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Class responsible for actually dispatching view updates enqueued via
 * [com.facebook.react.fabric.FabricUIManager.scheduleMountItem] on the UI thread.
 */
internal class MountingManager(
    private val viewManagerRegistry: ViewManagerRegistry,
    private val mountItemExecutor: MountItemExecutor,
) {
  private val surfaceIdToManager = ConcurrentHashMap<Int, SurfaceMountingManager>() // any thread

  private val stoppedSurfaceIds = CopyOnWriteArrayList<Int>()

  private var mostRecentSurfaceMountingManager: SurfaceMountingManager? = null
  private var lastQueriedSurfaceMountingManager: SurfaceMountingManager? = null

  private val jsResponderHandler = JSResponderHandler()
  private val rootViewManager = RootViewManager()

  internal fun interface MountItemExecutor {
    @UiThread @ThreadConfined(ThreadConfined.UI) fun executeItems(items: Queue<MountItem>)
  }

  /**
   * Starts surface without attaching the view. All view operations executed against that surface
   * will be queued until the view is attached.
   */
  @AnyThread
  fun startSurface(
      surfaceId: Int,
      reactContext: ThemedReactContext?,
      rootView: View?,
  ): SurfaceMountingManager {
    val surfaceMountingManager = SurfaceMountingManager(
        surfaceId,
        jsResponderHandler,
        viewManagerRegistry,
        rootViewManager,
        mountItemExecutor,
        checkNotNull(reactContext),
    )

    // There could technically be a race condition here if addRootView is called twice from
    // different threads, though this is (probably) extremely unlikely, and likely an error.
    // This logic to protect against race conditions is a holdover from older code, and we don't
    // know if it actually happens in practice - so, we're logging soft exceptions for now.
    // This *will* crash in Debug mode, but not in production.
    surfaceIdToManager.putIfAbsent(surfaceId, surfaceMountingManager)
    if (surfaceIdToManager[surfaceId] !== surfaceMountingManager) {
      logSoftException(
          TAG,
          IllegalStateException(
              "Called startSurface more than once for the SurfaceId [$surfaceId]"
          ),
      )
    }

    mostRecentSurfaceMountingManager = surfaceIdToManager[surfaceId]

    if (rootView != null) {
      surfaceMountingManager.attachRootView(rootView, reactContext)
    }

    return surfaceMountingManager
  }

  @AnyThread
  fun attachRootView(surfaceId: Int, rootView: View, themedReactContext: ThemedReactContext) {
    val surfaceMountingManager = getSurfaceManagerEnforced(surfaceId, "attachView")
    surfaceMountingManager.attachRootView(rootView, themedReactContext)
  }

  @AnyThread
  fun stopSurface(surfaceId: Int) {
    val surfaceMountingManager = surfaceIdToManager[surfaceId]
    if (surfaceMountingManager != null) {
      // Maximum number of stopped surfaces to keep track of
      while (stoppedSurfaceIds.size >= MAX_STOPPED_SURFACE_IDS_LENGTH) {
        val staleStoppedId = stoppedSurfaceIds[0]
        checkNotNull(staleStoppedId)
        surfaceIdToManager.remove(staleStoppedId)
        stoppedSurfaceIds.remove(staleStoppedId)
        FLog.d(TAG, "Removing stale SurfaceMountingManager: [%d]", staleStoppedId)
      }
      stoppedSurfaceIds.add(surfaceId)

      surfaceMountingManager.stopSurface()

      if (mostRecentSurfaceMountingManager === surfaceMountingManager) {
        mostRecentSurfaceMountingManager = null
      }
      if (lastQueriedSurfaceMountingManager === surfaceMountingManager) {
        lastQueriedSurfaceMountingManager = null
      }
    } else {
      logSoftException(
          TAG,
          IllegalStateException("Cannot call stopSurface on non-existent surface: [$surfaceId]"),
      )
    }
  }

  fun getSurfaceManager(surfaceId: Int): SurfaceMountingManager? {
    if (lastQueriedSurfaceMountingManager?.surfaceId == surfaceId) {
      return lastQueriedSurfaceMountingManager
    }

    if (mostRecentSurfaceMountingManager?.surfaceId == surfaceId) {
      return mostRecentSurfaceMountingManager
    }

    val surfaceMountingManager = surfaceIdToManager[surfaceId]
    lastQueriedSurfaceMountingManager = surfaceMountingManager
    return surfaceMountingManager
  }

  fun getSurfaceManagerEnforced(surfaceId: Int, context: String): SurfaceMountingManager =
      getSurfaceManager(surfaceId)
          ?: throw RetryableMountingLayerException(
              ("Unable to find SurfaceMountingManager for surfaceId: [$surfaceId]. Context: $context")
          )

  fun surfaceIsStopped(surfaceId: Int): Boolean {
    if (stoppedSurfaceIds.contains(surfaceId)) {
      return true
    }

    val surfaceMountingManager = getSurfaceManager(surfaceId)
    return surfaceMountingManager != null && surfaceMountingManager.isStopped
  }

  fun isWaitingForViewAttach(surfaceId: Int): Boolean {
    val mountingManager = getSurfaceManager(surfaceId) ?: return false

    if (mountingManager.isStopped) {
      return false
    }

    return !mountingManager.isRootViewAttached
  }

  /**
   * Get SurfaceMountingManager associated with a ReactTag. Unfortunately, this requires lookups
   * over N maps, where N is the number of active or recently-stopped Surfaces. Each lookup will
   * cost `log(M)` operations where M is the number of reactTags in the surface, so the total cost
   * per lookup is `O(N * log(M))`.
   *
   * To mitigate this cost, we attempt to keep track of the "most recent" SurfaceMountingManager and
   * do lookups in it first. For the vast majority of use-cases, except for events or operations
   * sent to off-screen surfaces, or use-cases where multiple surfaces are visible and interactable,
   * this will reduce the lookup time to `O(log(M))`. Someone smarter than me could probably figure
   * out an amortized time.
   *
   * @param reactTag
   * @return
   */
  fun getSurfaceManagerForView(reactTag: Int): SurfaceMountingManager? {
    if (mostRecentSurfaceMountingManager?.getViewExists(reactTag) == true) {
      return mostRecentSurfaceMountingManager
    }

    for ((_, smm) in surfaceIdToManager) {
      if (smm !== mostRecentSurfaceMountingManager && smm.getViewExists(reactTag)) {
        if (mostRecentSurfaceMountingManager == null) {
          mostRecentSurfaceMountingManager = smm
        }
        return smm
      }
    }
    return null
  }

  @AnyThread
  fun getSurfaceManagerForViewEnforced(reactTag: Int): SurfaceMountingManager =
      getSurfaceManagerForView(reactTag)
          ?: throw RetryableMountingLayerException(
              "Unable to find SurfaceMountingManager for tag: [$reactTag]"
          )

  fun getViewExists(reactTag: Int): Boolean = getSurfaceManagerForView(reactTag) != null

  @Deprecated(
      "receiveCommand with Int is deprecated, you should use receiveCommand with commandId:String",
      ReplaceWith("receiveCommand(Int,Int,String,ReadableArray)"),
  )
  fun receiveCommand(surfaceId: Int, reactTag: Int, commandId: Int, commandArgs: ReadableArray) {
    assertOnUiThread()
    @Suppress("DEPRECATION")
    getSurfaceManagerEnforced(surfaceId, "receiveCommand:int")
        .receiveCommand(reactTag, commandId, commandArgs)
  }

  fun receiveCommand(
      surfaceId: Int,
      reactTag: Int,
      commandId: String?,
      commandArgs: ReadableArray,
  ) {
    assertOnUiThread()
    getSurfaceManagerEnforced(surfaceId, "receiveCommand:string")
        .receiveCommand(reactTag, checkNotNull(commandId), commandArgs)
  }

  /**
   * Send an accessibility eventType to a Native View. eventType is any valid `AccessibilityEvent.X`
   * value.
   *
   * Why accept {@ViewUtil.NO_SURFACE_ID}(-1) SurfaceId? Currently there are calls to
   * UIManager.sendAccessibilityEvent which is a legacy API and accepts only reactTag. We will have
   * to investigate and migrate away from those calls over time.
   *
   * @param surfaceId that identifies the surface or {@ViewUtil.NO_SURFACE_ID}(-1) to temporarily
   *   support backward compatibility.
   * @param reactTag that identifies the react Tag of the view.
   * @param eventType that identifies Android eventType. see [View.sendAccessibilityEvent]
   */
  fun sendAccessibilityEvent(surfaceId: Int, reactTag: Int, eventType: Int) {
    assertOnUiThread()
    if (surfaceId == View.NO_ID) {
      getSurfaceManagerForViewEnforced(reactTag).sendAccessibilityEvent(reactTag, eventType)
    } else {
      getSurfaceManagerEnforced(surfaceId, "sendAccessibilityEvent")
          .sendAccessibilityEvent(reactTag, eventType)
    }
  }

  @UiThread
  fun storeSynchronousMountPropsOverride(reactTag: Int, props: ReadableMap?) {
    assertOnUiThread()
    if (props == null) {
      return
    }

    getSurfaceManagerForView(reactTag)?.storeSynchronousMountPropsOverride(reactTag, props)
  }

  @UiThread
  fun updatePropsSynchronously(reactTag: Int, props: ReadableMap?) {
    assertOnUiThread()
    if (props == null) {
      return
    }

    getSurfaceManagerForView(reactTag)?.updatePropsSynchronously(reactTag, props)
  }

  /**
   * Clears the JS Responder specified by [SurfaceMountingManager.setJSResponder]. After this method
   * is called, all the touch events are going to be handled by JS.
   */
  @UiThread
  fun clearJSResponder() {
    // MountingManager and SurfaceMountingManagers all share the same JSResponderHandler.
    // Must be called on MountingManager instead of SurfaceMountingManager, because we don't
    // know what surfaceId it's being called for.
    jsResponderHandler.clearJSResponder()
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  fun getEventEmitter(surfaceId: Int, reactTag: Int): EventEmitterWrapper? =
      getSurfaceMountingManager(surfaceId, reactTag)?.getEventEmitter(reactTag)

  /**
   * Measure a component, given localData, props, state, and measurement information. This needs to
   * remain here for now - and not in SurfaceMountingManager - because sometimes measures are made
   * outside of the context of a Surface; especially from C++ before StartSurface is called.
   */
  @AnyThread
  fun measure(
      context: ReactContext?,
      componentName: String?,
      localData: ReadableMap?,
      props: ReadableMap?,
      state: ReadableMap?,
      width: Float,
      widthMode: YogaMeasureMode?,
      height: Float,
      heightMode: YogaMeasureMode?,
      attachmentsPositions: FloatArray?,
  ): Long =
      viewManagerRegistry
          .get(checkNotNull(componentName))
          .measure(
              context,
              localData,
              props,
              state,
              width,
              widthMode,
              height,
              heightMode,
              attachmentsPositions,
          )

  fun dispatchEvent(
      surfaceId: Int,
      reactTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      params: WritableMap?,
      @EventCategoryDef eventCategory: Int,
      eventTimestamp: Long,
  ) {
    val smm = getSurfaceMountingManager(surfaceId, reactTag)
    if (smm == null) {
      FLog.i(
          TAG,
          "Unable to invoke event %s for tag [%d] in surfaceId [%d]",
          eventName,
          reactTag,
          surfaceId,
      )
      return
    }
    smm.dispatchEvent(reactTag, eventName, canCoalesceEvent, params, eventCategory, eventTimestamp)
  }

  private fun getSurfaceMountingManager(surfaceId: Int, reactTag: Int): SurfaceMountingManager? =
      if (surfaceId == ViewUtil.NO_SURFACE_ID) getSurfaceManagerForView(reactTag)
      else getSurfaceManager(surfaceId)

  companion object {
    val TAG: String = MountingManager::class.java.simpleName
    private const val MAX_STOPPED_SURFACE_IDS_LENGTH = 15
  }
}
