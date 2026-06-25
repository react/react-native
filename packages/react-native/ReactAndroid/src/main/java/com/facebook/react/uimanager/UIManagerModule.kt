/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")

package com.facebook.react.uimanager

import android.annotation.SuppressLint
import android.content.ComponentCallbacks2
import android.content.res.Configuration
import android.view.View
import com.facebook.common.logging.FLog
import com.facebook.debug.holder.PrinterHolder
import com.facebook.debug.tags.ReactDebugOverlayTags
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_CONSTANTS_END
import com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_CONSTANTS_START
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.BlackHoleEventDispatcher
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.internal.LegacyArchitectureShadowNodeLogger
import com.facebook.systrace.Systrace
import com.facebook.systrace.SystraceMessage
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Native module to allow JS to create and update native Views.
 *
 * ## Transactional Requirement
 *
 * A requirement of this class is to make sure that transactional UI updates occur all at once,
 * meaning that no intermediate state is ever rendered to the screen. For example, if a JS
 * application update changes the background of View A to blue and the width of View B to 100, both
 * need to appear at once. Practically, this means that all UI update code related to a single
 * transaction must be executed as a single code block on the UI thread. Executing as multiple code
 * blocks could allow the platform UI system to interrupt and render a partial UI state.
 *
 * To facilitate this, this module enqueues operations that are then applied to native view
 * hierarchy through [NativeViewHierarchyManager] at the end of each transaction.
 *
 * ## CSSNodes
 *
 * In order to allow layout and measurement to occur on a non-UI thread, this module also operates
 * on intermediate CSSNodeDEPRECATED objects that correspond to a native view. These
 * CSSNodeDEPRECATED are able to calculate layout according to their styling rules, and then the
 * resulting x/y/width/height of that layout is scheduled as an operation that will be applied to
 * native view hierarchy at the end of current batch.
 *
 * TODO(5241856): Investigate memory usage of creating many small objects in UIManageModule and
 *   consider implementing a pool
 * TODO(5483063): Don't dispatch the view hierarchy at the end of a batch if no UI changes occurred
 */
@SuppressLint("InvalidNativeModuleSuperClass")
@ReactModule(name = UIManagerModule.NAME)
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated("This class is part of Legacy Architecture and will be removed in a future release")
@OptIn(UnstableReactNativeAPI::class)
public open class UIManagerModule : ReactContextBaseJavaModule, LifecycleEventListener, UIManager {

  /** Resolves a name coming from native side to a name of the event that is exposed to JS. */
  public fun interface CustomEventNamesResolver {
    /** Returns custom event name by the provided event name. */
    public fun resolveCustomEventName(eventName: String): String?
  }

  private val mModuleConstants: Map<String, Any>
  private val mCustomDirectEvents: Map<String, Any>
  private val mViewManagerRegistry: ViewManagerRegistry
  private val mMemoryTrimCallback: MemoryTrimCallback = MemoryTrimCallback()
  private val mUIManagerListeners: CopyOnWriteArrayList<UIManagerListener> = CopyOnWriteArrayList()

  public constructor(
      reactContext: ReactApplicationContext,
      viewManagerResolver: ViewManagerResolver,
      minTimeLeftInFrameForNonBatchedOperationMs: Int,
  ) : super(reactContext) {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(reactContext)
    mModuleConstants = createConstants(viewManagerResolver)
    mCustomDirectEvents = UIManagerModuleConstants.directEventTypeConstants
    mViewManagerRegistry = ViewManagerRegistry(viewManagerResolver)
    reactContext.addLifecycleEventListener(this)
  }

  public constructor(
      reactContext: ReactApplicationContext,
      viewManagersList: List<ViewManager<*, *>>,
      minTimeLeftInFrameForNonBatchedOperationMs: Int,
  ) : super(reactContext) {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(reactContext)
    mCustomDirectEvents = MapBuilder.newHashMap()
    mModuleConstants = createConstants(viewManagersList, null, mCustomDirectEvents)
    mViewManagerRegistry = ViewManagerRegistry(viewManagersList)
    if (ReactBuildConfig.DEBUG) {
      for (viewManager in viewManagersList) {
        LegacyArchitectureShadowNodeLogger.assertUnsupportedViewManager(
            reactContext,
            viewManager.shadowNodeClass,
            viewManager.javaClass.simpleName,
        )
      }
    }

    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = NAME

  override fun getConstants(): Map<String, Any> = mModuleConstants

  override fun initialize() {
    getReactApplicationContext().registerComponentCallbacks(mMemoryTrimCallback)
    getReactApplicationContext().registerComponentCallbacks(mViewManagerRegistry)
  }

  override fun onHostResume(): Unit = Unit

  override fun onHostPause(): Unit = Unit

  override fun onHostDestroy(): Unit = Unit

  override fun invalidate() {
    super.invalidate()

    val reactApplicationContext = getReactApplicationContext()
    reactApplicationContext.unregisterComponentCallbacks(mMemoryTrimCallback)
    reactApplicationContext.unregisterComponentCallbacks(mViewManagerRegistry)
    ViewManagerPropertyUpdater.clear()
  }

  override fun markActiveTouchForTag(surfaceId: Int, reactTag: Int) {
    // Not implemented for Paper.
  }

  override fun sweepActiveTouchForTag(surfaceId: Int, reactTag: Int) {
    // Not implemented for Paper.
  }

  /**
   * This method is intended to reuse the [ViewManagerRegistry] with FabricUIManager. Do not use
   * this method as this will be removed in the near future.
   */
  @Deprecated("Do not use this method as this will be removed in the near future.")
  public open fun getViewManagerRegistry_DO_NOT_USE(): ViewManagerRegistry = mViewManagerRegistry

  @ReactMethod(isBlockingSynchronousMethod = true)
  public open fun getConstantsForViewManager(viewManagerName: String): WritableMap? {
    val targetView = mViewManagerRegistry.getViewManagerIfExists(viewManagerName) ?: return null
    return UIManagerModule.getConstantsForViewManager(targetView, mCustomDirectEvents)
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public open fun getDefaultEventTypes(): WritableMap =
      Arguments.makeNativeMap(UIManagerModuleConstantsHelper.defaultExportableEventTypes)

  /** Resolves Direct Event name exposed to JS from the one known to the Native side. */
  @Deprecated("Use resolveCustomDirectEventName instead.")
  public open val directEventNamesResolver: CustomEventNamesResolver
    get() =
        object : CustomEventNamesResolver {
          override fun resolveCustomEventName(eventName: String): String? {
            return resolveCustomDirectEventName(eventName)
          }
        }

  @Deprecated("This method is deprecated.")
  @Suppress("UNCHECKED_CAST")
  override fun resolveCustomDirectEventName(eventName: String): String? {
    val customEventType = mCustomDirectEvents[eventName] as? Map<String, String>
    if (customEventType != null) {
      return customEventType["registrationName"]
    }
    return eventName
  }

  override fun profileNextBatch(): Unit = Unit

  override val performanceCounters: Map<String, Long>
    get() = HashMap()

  /** Adds a root view with no initial properties. */
  public open fun <T : View> addRootView(rootView: T): Int = addRootView(rootView, null)

  /**
   * Used by native animated module to bypass the process of updating the values through the shadow
   * view hierarchy. This method will directly update native views, which means that updates for
   * layout-related propertied won't be handled properly. Make sure you know what you're doing
   * before calling this method :)
   */
  override fun synchronouslyUpdateViewOnUIThread(reactTag: Int, props: ReadableMap): Unit = Unit

  /**
   * Registers a new root view. JS can use the returned tag with manageChildren to add/remove
   * children to this view.
   *
   * Calling addRootView through UIManagerModule calls addRootView in the non-Fabric renderer,
   * always. This is deprecated in favor of calling startSurface in Fabric, which must be done
   * directly through the FabricUIManager.
   *
   * Note that this must be called after getWidth()/getHeight() actually return something. See
   * CatalystApplicationFragment as an example.
   *
   * TODO(6242243): Make addRootView thread safe NB: this method is horribly not-thread-safe.
   */
  override fun <T : View> addRootView(rootView: T, initialProps: WritableMap?): Int {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "UIManagerModule.addRootView")
    val tag = ReactRootViewTagGenerator.getNextRootViewTag()
    Systrace.endSection(Systrace.TRACE_TAG_REACT)
    return tag
  }

  override fun <T : View?> startSurface(
      rootView: T,
      moduleName: String,
      initialProps: WritableMap?,
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
  ): Int {
    throw UnsupportedOperationException()
  }

  override fun stopSurface(surfaceId: Int) {
    throw UnsupportedOperationException()
  }

  /** Unregisters a new root view. */
  @ReactMethod public open fun removeRootView(rootViewTag: Int): Unit = Unit

  /** Updates the size of a node. */
  public open fun updateNodeSize(nodeViewTag: Int, newWidth: Int, newHeight: Int): Unit = Unit

  /** Updates the insets padding for a node. */
  public open fun updateInsetsPadding(
      nodeViewTag: Int,
      top: Int,
      left: Int,
      bottom: Int,
      right: Int,
  ): Unit = Unit

  /**
   * Sets local data for a shadow node corresponded with given tag. In some cases we need a way to
   * specify some environmental data to shadow node to improve layout (or do something similar), so
   * [data] serves these needs. For example, any stateful embedded native views may benefit from
   * this. Have in mind that this data is not supposed to interfere with the state of the shadow
   * view. Please respect one-directional data flow of React.
   */
  public open fun setViewLocalData(tag: Int, data: Any): Unit = Unit

  @ReactMethod
  public open fun createView(tag: Int, className: String, rootViewTag: Int, props: ReadableMap?) {
    if (DEBUG) {
      val message = "(UIManager.createView) tag: $tag, class: $className, props: $props"
      FLog.d(ReactConstants.TAG, message)
      PrinterHolder.printer.logMessage(ReactDebugOverlayTags.UI_MANAGER, message)
    }
  }

  @ReactMethod
  public open fun updateView(tag: Int, className: String, props: ReadableMap?) {
    if (DEBUG) {
      val message = "(UIManager.updateView) tag: $tag, class: $className, props: $props"
      FLog.d(ReactConstants.TAG, message)
      PrinterHolder.printer.logMessage(ReactDebugOverlayTags.UI_MANAGER, message)
    }
  }

  /**
   * Interface for adding/removing/moving views within a parent view from JS.
   *
   * @param viewTag the view tag of the parent view
   * @param moveFrom a list of indices in the parent view to move views from
   * @param moveTo parallel to moveFrom, a list of indices in the parent view to move views to
   * @param addChildTags a list of tags of views to add to the parent
   * @param addAtIndices parallel to addChildTags, a list of indices to insert those children at
   * @param removeFrom a list of indices of views to permanently remove. The memory for the
   *   corresponding views and data structures should be reclaimed.
   */
  @ReactMethod
  public open fun manageChildren(
      viewTag: Int,
      moveFrom: ReadableArray?,
      moveTo: ReadableArray?,
      addChildTags: ReadableArray?,
      addAtIndices: ReadableArray?,
      removeFrom: ReadableArray?,
  ) {
    if (DEBUG) {
      val message =
          "(UIManager.manageChildren) tag: $viewTag, moveFrom: $moveFrom, moveTo: $moveTo, addTags: $addChildTags, atIndices: $addAtIndices, removeFrom: $removeFrom"
      FLog.d(ReactConstants.TAG, message)
      PrinterHolder.printer.logMessage(ReactDebugOverlayTags.UI_MANAGER, message)
    }
  }

  /**
   * Interface for fast tracking the initial adding of views. Children view tags are assumed to be
   * in order.
   *
   * @param viewTag the view tag of the parent view
   * @param childrenTags an array of tags to add to the parent in order
   */
  @ReactMethod
  public open fun setChildren(viewTag: Int, childrenTags: ReadableArray) {
    if (DEBUG) {
      val message = "(UIManager.setChildren) tag: $viewTag, children: $childrenTags"
      FLog.d(ReactConstants.TAG, message)
      PrinterHolder.printer.logMessage(ReactDebugOverlayTags.UI_MANAGER, message)
    }
  }

  /**
   * Determines the location on screen, width, and height of the given view and returns the values
   * via an async callback.
   */
  @ReactMethod public open fun measure(reactTag: Int, callback: Callback): Unit = Unit

  /**
   * Determines the location on screen, width, and height of the given view relative to the device
   * screen and returns the values via an async callback. This is the absolute position including
   * things like the status bar.
   */
  @ReactMethod public open fun measureInWindow(reactTag: Int, callback: Callback): Unit = Unit

  /**
   * Measures the view specified by tag relative to the given ancestorTag. This means that the
   * returned x, y are relative to the origin x, y of the ancestor view. Results are stored in the
   * given outputBuffer. We allow ancestor view and measured view to be the same, in which case the
   * position always will be (0, 0) and method will only measure the view dimensions.
   *
   * NB: Unlike [measure], this will measure relative to the view layout, not the visible window
   * which can cause unexpected results when measuring relative to things like ScrollViews that can
   * have offset content on the screen.
   */
  @ReactMethod
  public open fun measureLayout(
      tag: Int,
      ancestorTag: Int,
      errorCallback: Callback,
      successCallback: Callback,
  ): Unit = Unit

  /**
   * Find the touch target child native view in the supplied root view hierarchy, given a react
   * target location.
   *
   * This method is currently used only by Element Inspector DevTool.
   *
   * @param reactTag the tag of the root view to traverse
   * @param point an array containing both X and Y target location
   * @param callback will be called if with the identified child view react ID, and measurement
   *   info. If no view was found, callback will be invoked with no data.
   */
  @ReactMethod
  public open fun findSubviewIn(reactTag: Int, point: ReadableArray, callback: Callback): Unit =
      Unit

  /**
   * Check if the first shadow node is the descendant of the second shadow node.
   *
   * @deprecated this method will not be available in FabricUIManager class.
   */
  @ReactMethod
  @Deprecated("This method will not be available in FabricUIManager class.")
  public open fun viewIsDescendantOf(
      reactTag: Int,
      ancestorReactTag: Int,
      callback: Callback,
  ): Unit = Unit

  @ReactMethod
  public open fun setJSResponder(reactTag: Int, blockNativeResponder: Boolean): Unit = Unit

  @ReactMethod public open fun clearJSResponder(): Unit = Unit

  @ReactMethod
  public open fun dispatchViewManagerCommand(
      reactTag: Int,
      commandId: Dynamic,
      commandArgs: ReadableArray?,
  ) {
    // Fabric dispatchCommands should go through the JSI API - this will crash in Fabric.
    val uiManager: UIManager? =
        UIManagerHelper.getUIManager(getReactApplicationContext(), UIManagerType.FABRIC)
    if (uiManager == null) {
      return
    }

    if (commandId.type == ReadableType.Number) {
      uiManager.dispatchCommand(reactTag, commandId.asInt(), commandArgs)
    } else if (commandId.type == ReadableType.String) {
      val command = commandId.asString() ?: return
      uiManager.dispatchCommand(reactTag, command, commandArgs)
    }
  }

  /** Deprecated, use [dispatchCommand] with String commandId instead. */
  @Deprecated("Use dispatchCommand(int, String, ReadableArray) instead.")
  override fun dispatchCommand(reactTag: Int, commandId: Int, commandArgs: ReadableArray?): Unit =
      Unit

  override fun dispatchCommand(
      reactTag: Int,
      commandId: String,
      commandArgs: ReadableArray?,
  ): Unit = Unit

  /**
   * LayoutAnimation API on Android is currently experimental. Therefore, it needs to be enabled
   * explicitly in order to avoid regression in existing application written for iOS using this API.
   *
   * Warning : This method will be removed in future version of React Native, and layout animation
   * will be enabled by default, so always check for its existence before invoking it.
   *
   * @param enabled whether layout animation is enabled or not
   *
   * TODO(9139831) : remove this method once layout animation is fully stable.
   */
  @ReactMethod public open fun setLayoutAnimationEnabledExperimental(enabled: Boolean): Unit = Unit

  /**
   * Configure an animation to be used for the native layout changes, and native views creation. The
   * animation will only apply during the current batch operations.
   *
   * @param config the configuration of the animation for view addition/removal/update.
   * @param success will be called when the animation completes, or when the animation get
   *   interrupted. In this case, callback parameter will be false.
   * @param error will be called if there was an error processing the animation
   *
   * TODO(7728153) : animating view deletion is currently not supported.
   */
  @ReactMethod
  public open fun configureNextLayoutAnimation(
      config: ReadableMap,
      success: Callback,
      error: Callback,
  ): Unit = Unit

  // Java original returned null, but the UIManager interface requires non-null.
  // BlackHoleEventDispatcher silently discards events, matching the legacy no-op behavior.
  override val eventDispatcher: EventDispatcher
    get() = BlackHoleEventDispatcher

  @ReactMethod
  override fun sendAccessibilityEvent(reactTag: Int, eventType: Int) {
    // TODO: T65793557 Refactor sendAccessibilityEvent to use ViewCommands
    val fabricUIManager: UIManager? =
        UIManagerHelper.getUIManager(getReactApplicationContext(), UIManagerType.FABRIC)
    if (fabricUIManager != null) {
      fabricUIManager.sendAccessibilityEvent(reactTag, eventType)
    }
  }

  /**
   * Schedule a block to be executed on the UI thread. Useful if you need to execute view logic
   * after all currently queued view updates have completed.
   *
   * @param block that contains UI logic you want to execute.
   * @deprecated This method is a no-op stub retained for backward compatibility. Use
   *   [UIManagerListener] or View Commands instead.
   */
  @Deprecated("This method is a no-op stub. Use UIManagerListener or View Commands instead.")
  public open fun addUIBlock(block: UIBlock): Unit = Unit

  /**
   * Schedule a block to be executed on the UI thread. Useful if you need to execute view logic
   * before all currently queued view updates have completed.
   *
   * @param block that contains UI logic you want to execute.
   * @deprecated This method is a no-op stub retained for backward compatibility. Use
   *   [UIManagerListener] or View Commands instead.
   */
  @Deprecated("This method is a no-op stub. Use UIManagerListener or View Commands instead.")
  public open fun prependUIBlock(block: UIBlock): Unit = Unit

  override fun addUIManagerEventListener(listener: UIManagerListener) {
    mUIManagerListeners.add(listener)
  }

  override fun removeUIManagerEventListener(listener: UIManagerListener) {
    mUIManagerListeners.remove(listener)
  }

  /**
   * Given a reactTag from a component, find its root node tag, if possible. Otherwise, this will
   * return 0. If the reactTag belongs to a root node, this will return the same reactTag.
   *
   * @param reactTag the component tag
   * @return the rootTag
   * @deprecated this method is not going to be supported in the near future, use
   *   [ViewUtil.isRootTag] to verify if a react Tag is a root or not
   *
   *     TODO: T63569137 Delete the method UIManagerModule.resolveRootTagFromReactTag
   */
  @Deprecated("Use ViewUtil.isRootTag(int) to verify if a react Tag is a root or not.")
  public open fun resolveRootTagFromReactTag(reactTag: Int): Int =
      if (ViewUtil.isRootTag(reactTag)) reactTag else 0

  /** Dirties the node associated with the given react tag. */
  public open fun invalidateNodeLayout(tag: Int): Unit = Unit

  /**
   * Updates the styles of the [ReactShadowNode] based on the Measure specs received by parameters.
   * offsetX and offsetY aren't used in non-Fabric, so they're ignored here.
   */
  override fun updateRootLayoutSpecs(
      rootTag: Int,
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
      offsetX: Int,
      offsetY: Int,
  ): Unit = Unit

  /** Listener that drops the CSSNode pool on low memory when the app is backgrounded. */
  private class MemoryTrimCallback : ComponentCallbacks2 {
    override fun onTrimMemory(level: Int): Unit = Unit

    override fun onConfigurationChanged(newConfig: Configuration): Unit = Unit

    override fun onLowMemory(): Unit = Unit
  }

  override fun resolveView(reactTag: Int): View? {
    UiThreadUtil.assertOnUiThread()
    return null
  }

  override fun receiveEvent(reactTag: Int, eventName: String, event: WritableMap?) {
    receiveEvent(-1, reactTag, eventName, event)
  }

  override fun receiveEvent(surfaceId: Int, reactTag: Int, eventName: String, event: WritableMap?) {
    assert(false)
  }

  public companion object {
    /** The name of this module. */
    public const val NAME: String = "UIManager"

    /** Tag for logging. */
    @JvmField public val TAG: String = UIManagerModule::class.java.simpleName

    private val DEBUG: Boolean =
        PrinterHolder.printer.shouldDisplayLogMessage(ReactDebugOverlayTags.UI_MANAGER)

    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "UIManagerModule",
          LegacyArchitectureLogLevel.ERROR,
      )
    }

    private fun createConstants(viewManagerResolver: ViewManagerResolver): Map<String, Any> {
      ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_CONSTANTS_START)
      SystraceMessage.beginSection(Systrace.TRACE_TAG_REACT, "CreateUIManagerConstants")
          .arg("Lazy", true)
          .flush()
      try {
        return UIManagerModuleConstantsHelper.createConstants(viewManagerResolver)
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT)
        ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_CONSTANTS_END)
      }
    }

    /** Creates constants for the given list of view managers. */
    @JvmStatic
    public fun createConstants(
        viewManagers: List<ViewManager<*, *>>,
        customBubblingEvents: Map<String, Any>?,
        customDirectEvents: Map<String, Any>?,
    ): Map<String, Any> {
      ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_CONSTANTS_START)
      SystraceMessage.beginSection(Systrace.TRACE_TAG_REACT, "CreateUIManagerConstants")
          .arg("Lazy", false)
          .flush()
      try {
        @Suppress("UNCHECKED_CAST")
        return UIManagerModuleConstantsHelper.createConstants(
            viewManagers as List<ViewManager<in Nothing, in Nothing>>,
            customBubblingEvents as? MutableMap<String, Any>,
            customDirectEvents as? MutableMap<String, Any>,
        )
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT)
        ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_CONSTANTS_END)
      }
    }

    /** Returns constants for the given view manager. */
    @JvmStatic
    public fun getConstantsForViewManager(
        viewManager: ViewManager<*, *>,
        customDirectEvents: Map<String, Any>,
    ): WritableMap? {
      SystraceMessage.beginSection(
              Systrace.TRACE_TAG_REACT,
              "UIManagerModule.getConstantsForViewManager",
          )
          .arg("ViewManager", viewManager.name)
          .arg("Lazy", true)
          .flush()
      try {
        @Suppress("UNCHECKED_CAST")
        val viewManagerConstants =
            UIManagerModuleConstantsHelper.createConstantsForViewManager(
                viewManager as ViewManager<in Nothing, in Nothing>,
                null,
                null,
                null,
                customDirectEvents as? MutableMap<String, Any>,
            )
        return Arguments.makeNativeMap(viewManagerConstants)
      } finally {
        SystraceMessage.endSection(Systrace.TRACE_TAG_REACT).flush()
      }
    }
  }
}
