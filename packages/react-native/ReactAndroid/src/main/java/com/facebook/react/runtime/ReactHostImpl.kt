/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.nfc.NfcAdapter
import android.os.Bundle
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.graphics.createBitmap
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.infer.annotation.ThreadSafe
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.MemoryPressureRouter
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.MemoryPressureListener
import com.facebook.react.bridge.NativeArray
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.common.LifecycleState
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.devsupport.DefaultDevSupportManagerFactory
import com.facebook.react.devsupport.DevMenuConfiguration
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.InspectorFlags
import com.facebook.react.devsupport.inspector.FrameTimingsObserver
import com.facebook.react.devsupport.inspector.InspectorNetworkHelper
import com.facebook.react.devsupport.inspector.InspectorNetworkRequestListener
import com.facebook.react.devsupport.inspector.TracingState
import com.facebook.react.devsupport.inspector.TracingStateListener
import com.facebook.react.devsupport.interfaces.BundleLoadCallback
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.DevSupportManager.PausedInDebuggerOverlayCommandListener
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags
import com.facebook.react.modules.appearance.AppearanceModule
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.react.runtime.internal.bolts.Task
import com.facebook.react.runtime.internal.bolts.TaskCompletionSource
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.events.BlackHoleEventDispatcher
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper
import java.lang.ref.WeakReference
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import kotlin.Unit
import kotlin.concurrent.Volatile
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * A ReactHost is an object that manages a single [ReactInstance]. A ReactHost can be constructed
 * without initializing the ReactInstance, and it will continue to exist after the instance is
 * destroyed. This class ensures safe access to the ReactInstance and the JS runtime; methods that
 * operate on the instance use Bolts Tasks to defer the operation until the instance has been
 * initialized. They also return a Task so the caller can be notified of completion.
 *
 * @see [Bolts Android](https://github.com/BoltsFramework/Bolts-Android.tasks)
 */
@DoNotStrip
@ThreadSafe
@OptIn(UnstableReactNativeAPI::class, FrameworkAPI::class)
public class ReactHostImpl(
    private val context: Context,
    private val reactHostDelegate: ReactHostDelegate,
    private val componentFactory: ComponentFactory,
    private val bgExecutor: Executor = Executors.newSingleThreadExecutor(),
    private val uiExecutor: Executor = Task.UI_THREAD_EXECUTOR,
    private val allowPackagerServerAccess: Boolean,
    private val useDevSupport: Boolean,
    devSupportManagerFactory: DevSupportManagerFactory? = null,
) : ReactHost {
  private val reactHostImplDevHelper = ReactHostImplDevHelper(this)

  public override val devSupportManager: DevSupportManager =
      (devSupportManagerFactory ?: DefaultDevSupportManagerFactory())
          .create(
              applicationContext = context.applicationContext,
              reactInstanceManagerHelper = reactHostImplDevHelper,
              packagerPathForJSBundleName = reactHostDelegate.jsMainModulePath,
              useDevSupport = useDevSupport,
          )
          .also { devSupportManager ->
            // Wire up the tracing state provider
            if (devSupportManager is DevSupportManagerBase) {
              devSupportManager.setTracingStateProvider(reactHostImplDevHelper)
            }
          }
  public override val memoryPressureRouter: MemoryPressureRouter = MemoryPressureRouter(context)

  private val attachedSurfaces: MutableSet<ReactSurfaceImpl> = HashSet()

  // todo: T192399917 This no longer needs to store the react instance
  private val createReactInstanceTaskRef = BridgelessAtomicRef(Task.forResult<ReactInstance>(null))
  private var reactInstance: ReactInstance? = null

  private val bridgelessReactContextRef = BridgelessAtomicRef<BridgelessReactContext>()
  private val id = counter.getAndIncrement()

  private val activity = AtomicReference<Activity?>()
  private val lastUsedActivityRef = AtomicReference(WeakReference<Activity?>(null))
  private val stateTracker = ReactHostStateTracker(id)
  private val reactLifecycleStateManager = ReactLifecycleStateManager(stateTracker)
  private var memoryPressureListener: MemoryPressureListener? = null
  private var defaultHardwareBackBtnHandler: DefaultHardwareBackBtnHandler? = null

  private val reactInstanceEventListeners: MutableList<ReactInstanceEventListener> =
      CopyOnWriteArrayList()
  private val beforeDestroyListeners: MutableList<() -> Unit> = CopyOnWriteArrayList()

  internal var reactHostInspectorTarget: ReactHostInspectorTarget? = null
  private var frameTimingsObserver: FrameTimingsObserver? = null

  @Volatile private var hostInvalidated = false

  @JvmOverloads
  public constructor(
      context: Context,
      delegate: ReactHostDelegate,
      componentFactory: ComponentFactory,
      allowPackagerServerAccess: Boolean,
      useDevSupport: Boolean,
      devSupportManagerFactory: DevSupportManagerFactory? = null,
  ) : this(
      context,
      delegate,
      componentFactory,
      Executors.newSingleThreadExecutor(),
      Task.UI_THREAD_EXECUTOR,
      allowPackagerServerAccess,
      useDevSupport,
      devSupportManagerFactory,
  )

  public override val lifecycleState: LifecycleState
    get() = reactLifecycleStateManager.lifecycleState

  /**
   * This function can be used to initialize the ReactInstance in a background thread before a
   * surface needs to be rendered. It is not necessary to call this function; startSurface() will
   * initialize the ReactInstance if it hasn't been preloaded.
   *
   * @return A Task that completes when the instance is initialized. The task will be faulted if any
   *   errors occur during initialization, and will be cancelled if ReactHost.destroy() is called
   *   before it completes.
   */
  override fun start(): TaskInterface<Void> = Task.call({ getOrCreateStartTask() }, bgExecutor)

  /** Initialize and run a React Native surface in a background without mounting real views. */
  internal fun prerenderSurface(surface: ReactSurfaceImpl): TaskInterface<Void> {
    val method = "prerenderSurface(surfaceId = ${surface.surfaceID})"
    stateTracker.enterState(method, "Schedule")

    attachSurface(surface)
    return callAfterGetOrCreateReactInstance(method, bgExecutor) { reactInstance: ReactInstance ->
      stateTracker.enterState(method, "Execute")
      reactInstance.prerenderSurface(surface)
    }
  }

  /**
   * Start rendering a React Native surface on screen.
   *
   * @param surface The ReactSurface to render
   * @return A Task that will complete when startSurface has been called.
   */
  internal fun startSurface(surface: ReactSurfaceImpl): TaskInterface<Void> {
    val method = "startSurface(surfaceId = ${surface.surfaceID})"
    stateTracker.enterState(method, "Schedule")

    attachSurface(surface)
    return callAfterGetOrCreateReactInstance(method, bgExecutor) { reactInstance: ReactInstance ->
      stateTracker.enterState(method, "Execute")
      reactInstance.startSurface(surface)
    }
  }

  /**
   * Stop rendering a React Native surface.
   *
   * @param surface The surface to stop
   * @return A Task that will complete when stopSurface has been called.
   */
  internal fun stopSurface(surface: ReactSurfaceImpl): TaskInterface<Void> {
    val method = "stopSurface(surfaceId = ${surface.surfaceID})"
    stateTracker.enterState(method, "Schedule")

    detachSurface(surface)
    return callWithExistingReactInstance(method, bgExecutor) { reactInstance: ReactInstance ->
          stateTracker.enterState(method, "Execute")
          reactInstance.stopSurface(surface)
        }
        .makeVoid()
  }

  /**
   * To be called when the host activity is resumed.
   *
   * @param activity The host activity
   */
  @ThreadConfined(ThreadConfined.UI)
  override fun onHostResume(
      activity: Activity?,
      defaultBackButtonImpl: DefaultHardwareBackBtnHandler?,
  ) {
    defaultHardwareBackBtnHandler = defaultBackButtonImpl
    onHostResume(activity)
  }

  @ThreadConfined(ThreadConfined.UI)
  override fun onHostResume(activity: Activity?) {
    stateTracker.enterState("onHostResume(activity)")

    currentActivity = activity
    frameTimingsObserver?.setCurrentWindow(activity?.window)

    maybeEnableDevSupport(true)
    reactLifecycleStateManager.moveToOnHostResume(currentReactContext, activity)
  }

  @ThreadConfined(ThreadConfined.UI)
  override fun onHostLeaveHint(activity: Activity?) {
    stateTracker.enterState("onUserLeaveHint(activity)")

    currentReactContext?.onUserLeaveHint(activity)
  }

  @ThreadConfined(ThreadConfined.UI)
  override fun onHostPause(activity: Activity?) {
    val method = "onHostPause(activity)"
    stateTracker.enterState(method)

    val currentActivity = this.currentActivity
    if (currentActivity != null) {
      val isSameActivity = activity === currentActivity
      if (!isSameActivity) {
        val currentActivityClass = currentActivity.javaClass.simpleName
        val activityClass = if (activity == null) "null" else activity.javaClass.simpleName
        val isNotSameActivityMessage =
            "Pausing an activity that is not the current activity, this is incorrect! Current activity: $currentActivityClass Paused activity: $activityClass"
        if (ReactNativeFeatureFlags.skipActivityIdentityAssertionOnHostPause()) {
          FLog.w(TAG, method, isNotSameActivityMessage)
        } else {
          Assertions.assertCondition(isSameActivity, isNotSameActivityMessage)
        }
      }
    }

    maybeEnableDevSupport(false)
    defaultHardwareBackBtnHandler = null
    reactLifecycleStateManager.moveToOnHostPause(currentReactContext, currentActivity)
  }

  /** To be called when the host activity is paused. */
  @ThreadConfined(ThreadConfined.UI)
  override fun onHostPause() {
    stateTracker.enterState("onHostPause()")

    maybeEnableDevSupport(false)
    defaultHardwareBackBtnHandler = null
    reactLifecycleStateManager.moveToOnHostPause(currentReactContext, currentActivity)
  }

  /** To be called when the host activity is destroyed. */
  @ThreadConfined(ThreadConfined.UI)
  override fun onHostDestroy() {
    stateTracker.enterState("onHostDestroy()")

    maybeEnableDevSupport(false)
    moveToHostDestroy(currentReactContext)
  }

  @ThreadConfined(ThreadConfined.UI)
  override fun onHostDestroy(activity: Activity?) {
    stateTracker.enterState("onHostDestroy(activity)")

    val currentActivity = this.currentActivity

    if (currentActivity === activity) {
      maybeEnableDevSupport(false)
      moveToHostDestroy(currentReactContext)
    }
  }

  private fun maybeEnableDevSupport(enabled: Boolean) {
    if (useDevSupport) {
      devSupportManager.devSupportEnabled = enabled
    }
  }

  public override val currentReactContext: ReactContext?
    /**
     * Returns current ReactContext which could be nullable if ReactInstance hasn't been created.
     *
     * @return The [BridgelessReactContext] associated with ReactInstance.
     */
    get() = bridgelessReactContextRef.value

  override fun createSurface(
      context: Context,
      moduleName: String,
      initialProps: Bundle?,
  ): ReactSurface {
    val surface = ReactSurfaceImpl(context, moduleName, initialProps)
    val surfaceView = ReactSurfaceView(context, surface)
    surfaceView.setShouldLogContentAppeared(true)
    surface.attachView(surfaceView)
    surface.attach(this)
    return surface
  }

  internal val isInstanceInitialized: Boolean
    get() = reactInstance != null

  @ThreadConfined(ThreadConfined.UI)
  override fun onBackPressed(): Boolean {
    UiThreadUtil.assertOnUiThread()
    val reactInstance = reactInstance ?: return false

    val deviceEventManagerModule =
        reactInstance.getNativeModule(DeviceEventManagerModule::class.java) ?: return false

    deviceEventManagerModule.emitHardwareBackPressed()
    return true
  }

  public override val reactQueueConfiguration: ReactQueueConfiguration?
    get() = reactInstance?.reactQueueConfiguration

  /** Add a listener to be notified of ReactInstance events. */
  override fun addReactInstanceEventListener(listener: ReactInstanceEventListener) {
    reactInstanceEventListeners.add(listener)
  }

  /** Remove a listener previously added with [addReactInstanceEventListener]. */
  override fun removeReactInstanceEventListener(listener: ReactInstanceEventListener) {
    reactInstanceEventListeners.remove(listener)
  }

  override fun setDevMenuConfiguration(config: DevMenuConfiguration) {
    devSupportManager.devMenuEnabled = config.devMenuEnabled
    devSupportManager.shakeGestureEnabled = config.shakeGestureEnabled
    devSupportManager.keyboardShortcutsEnabled = config.keyboardShortcutsEnabled
  }

  /**
   * Entrypoint to reload the ReactInstance. If the ReactInstance is destroying, will wait until
   * destroy is finished, before reloading.
   *
   * @param reason [String] describing why ReactHost is being reloaded (e.g. js error, user tap on
   *   reload button)
   * @return A task that completes when React Native reloads
   */
  override fun reload(reason: String): TaskInterface<Void> =
      Task.call(
          {
            val reloadTask =
                (destroyTask?.let { destroyTask ->
                      stateTracker.enterState(
                          "reload()",
                          "Waiting for destroy to finish, before reloading React Native.",
                      )
                      destroyTask.continueWithTask({ getOrCreateReloadTask(reason) }, bgExecutor)
                    } ?: getOrCreateReloadTask(reason))
                    .makeVoid()
            reloadTask.continueWithTask(
                { task ->
                  if (task.isFaulted()) {
                    val ex = checkNotNull(task.getError())
                    if (useDevSupport) {
                      devSupportManager.handleException(ex)
                    } else {
                      reactHostDelegate.handleInstanceException(ex)
                    }
                    getOrCreateDestroyTask("Reload failed", ex)
                  } else {
                    task
                  }
                },
                bgExecutor,
            )
          },
          bgExecutor,
      )

  @DoNotStrip
  private fun setPausedInDebuggerMessage(message: String?) {
    if (message == null) {
      devSupportManager.hidePausedInDebuggerOverlay()
    } else {
      devSupportManager.showPausedInDebuggerOverlay(
          message,
          object : PausedInDebuggerOverlayCommandListener {
            override fun onResume() {
              UiThreadUtil.assertOnUiThread()
              reactHostInspectorTarget?.sendDebuggerResumeCommand()
            }
          },
      )
    }
  }

  @get:DoNotStrip
  private val hostMetadata: Map<String, String?>
    get() = AndroidInfoHelpers.getInspectorHostMetadata(context)

  @DoNotStrip
  private fun loadNetworkResource(url: String, listener: InspectorNetworkRequestListener) {
    InspectorNetworkHelper.loadNetworkResource(url, listener)
  }

  @DoNotStrip
  private fun setEmulatedMedia(colorScheme: String) {
    UiThreadUtil.runOnUiThread {
      val mode =
          when (colorScheme) {
            "dark" -> AppCompatDelegate.MODE_NIGHT_YES
            "light" -> AppCompatDelegate.MODE_NIGHT_NO
            else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
          }
      AppCompatDelegate.setDefaultNightMode(mode)
    }
  }

  @DoNotStrip
  private fun captureScreenshot(format: String, quality: Int): String? {
    val activity = currentActivity ?: return null
    val window = activity.window ?: return null
    val decorView = window.decorView.rootView

    val width = decorView.width
    val height = decorView.height
    if (width <= 0 || height <= 0) {
      return null
    }

    val bitmap = createBitmap(width, height)
    val canvas = android.graphics.Canvas(bitmap)
    decorView.draw(canvas)

    val outputStream = java.io.ByteArrayOutputStream()
    val compressFormat =
        when (format) {
          "jpeg" -> android.graphics.Bitmap.CompressFormat.JPEG
          "webp" ->
              if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                android.graphics.Bitmap.CompressFormat.WEBP_LOSSY
              } else {
                @Suppress("DEPRECATION") android.graphics.Bitmap.CompressFormat.WEBP
              }
          else -> android.graphics.Bitmap.CompressFormat.PNG
        }
    val compressQuality = if (quality in 0..100) quality else 80

    bitmap.compress(compressFormat, compressQuality, outputStream)
    bitmap.recycle()

    val bytes = outputStream.toByteArray()
    return android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
  }

  /**
   * Entrypoint to destroy the ReactInstance. If the ReactInstance is reloading, will wait until
   * reload is finished, before destroying.
   *
   * The destroy operation is asynchronous and the task returned by this method will complete when
   * React Native gets destroyed. Note that the destroy operation will execute in multiple threads,
   * in particular some of the sub-tasks will run in the UIThread. Calling
   * [TaskInterface#waitForCompletion()] from the UIThread will lead into a deadlock. Use
   * onDestroyFinished callback to be notified when React Native gets destroyed.
   *
   * @param reason describing why ReactHost is being destroyed (e.g. memory pressure)
   * @param ex exception that caused the trigger to destroy ReactHost (or null) This exception will
   *   be used to log properly the cause of destroy operation.
   * @param onDestroyFinished callback that will be called when React Native gets destroyed, the
   *   callback will run on a background thread.
   * @return A task that completes when React Native gets destroyed.
   */
  override fun destroy(
      reason: String,
      ex: Exception?,
      onDestroyFinished: (instanceDestroyedSuccessfully: Boolean) -> Unit,
  ): TaskInterface<Void> {
    val destroyTask = destroy(reason, ex) as Task<Void>
    return destroyTask.continueWith({ task: Task<Void> ->
      val instanceDestroyedSuccessfully = task.isCompleted() && !task.isFaulted()
      onDestroyFinished(instanceDestroyedSuccessfully)
      null
    })
  }

  /**
   * Entrypoint to destroy the ReactInstance. If the ReactInstance is reloading, will wait until
   * reload is finished, before destroying.
   *
   * The destroy operation is asynchronous and the task returned by this method will complete when
   * React Native gets destroyed. Note that the destroy operation will execute in multiple threads,
   * in particular some of the sub-tasks will run in the UIThread. Calling
   * [TaskInterface#waitForCompletion()] from the UIThread will lead into a deadlock.
   *
   * @param reason [String] describing why ReactHost is being destroyed (e.g. memory pressure)
   * @param ex [Exception] exception that caused the trigger to destroy ReactHost (or null). This
   *   exception will be used to log properly the cause of destroy operation.
   * @return A task that completes when React Native gets destroyed.
   */
  override fun destroy(reason: String, ex: Exception?): TaskInterface<Void> =
      Task.call(
          {
            val reloadTask = reloadTask
            if (reloadTask != null) {
              stateTracker.enterState(
                  "destroy()",
                  "Reloading React Native. Waiting for reload to finish before destroying React Native.",
              )
              reloadTask.continueWithTask<Void>({ getOrCreateDestroyTask(reason, ex) }, bgExecutor)
            } else {
              getOrCreateDestroyTask(reason, ex)
            }
          },
          bgExecutor,
      )

  private fun createMemoryPressureListener(reactInstance: ReactInstance): MemoryPressureListener {
    val weakReactInstance = WeakReference(reactInstance)
    return MemoryPressureListener { level: Int ->
      bgExecutor.execute {
        val strongReactInstance = weakReactInstance.get()
        strongReactInstance?.handleMemoryPressure(level)
      }
    }
  }

  internal var currentActivity: Activity?
    get() = activity.get()
    private set(activity) {
      this.activity.set(activity)
      if (activity != null) {
        lastUsedActivityRef.set(WeakReference(activity))
      }
    }

  internal val lastUsedActivity: Activity?
    get() = lastUsedActivityRef.get()?.get()

  internal val eventDispatcher: EventDispatcher
    /**
     * Get the [EventDispatcher] from the [FabricUIManager]. This always returns an EventDispatcher,
     * even if the instance isn't alive; in that case, it returns a [BlackHoleEventDispatcher] which
     * no-ops.
     *
     * @return The real [EventDispatcher] if the instance is alive; otherwise, a
     *   [BlackHoleEventDispatcher].
     */
    get() = reactInstance?.eventDispatcher ?: BlackHoleEventDispatcher

  internal val uiManager: FabricUIManager?
    get() = reactInstance?.fabricUIManager

  internal fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean =
      reactInstance?.hasNativeModule<T>(nativeModuleInterface) ?: false

  internal val nativeModules: Collection<NativeModule>
    get() = reactInstance?.nativeModules ?: listOf()

  @Suppress("DEPRECATION")
  internal fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T? {
    if (
        !ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE &&
            nativeModuleInterface == com.facebook.react.uimanager.UIManagerModule::class.java
    ) {
      ReactSoftExceptionLogger.logSoftExceptionVerbose(
          TAG,
          ReactNoCrashSoftException(
              "getNativeModule(UIManagerModule.class) cannot be called when the bridge is disabled"
          ),
      )
    }

    return reactInstance?.getNativeModule(nativeModuleInterface)
  }

  internal fun getNativeModule(nativeModuleName: String): NativeModule? =
      reactInstance?.getNativeModule(nativeModuleName)

  internal val runtimeExecutor: RuntimeExecutor?
    get() {
      reactInstance?.apply {
        return getBufferedRuntimeExecutor()
      }

      raiseSoftException(
          "getRuntimeExecutor()",
          "Tried to get runtime executor while instance is not ready",
      )
      return null
    }

  internal val jsCallInvokerHolder: CallInvokerHolder?
    get() {
      reactInstance?.apply {
        return getJSCallInvokerHolder()
      }

      raiseSoftException(
          "getJSCallInvokerHolder()",
          "Tried to get JSCallInvokerHolder while instance is not ready",
      )
      return null
    }

  /**
   * To be called when the host activity receives an activity result.
   *
   * @param activity The host activity
   */
  @ThreadConfined(ThreadConfined.UI)
  override fun onActivityResult(
      activity: Activity,
      requestCode: Int,
      resultCode: Int,
      data: Intent?,
  ) {
    val method =
        "onActivityResult(activity = \"$activity\", requestCode = \"$requestCode\", resultCode = \"$resultCode\", data = \"$data\")"

    val currentContext = currentReactContext
    if (currentContext != null) {
      currentContext.onActivityResult(activity, requestCode, resultCode, data)
    } else {
      raiseSoftException(method, "Tried to access onActivityResult while context is not ready")
    }
  }

  /* To be called when focus has changed for the hosting window. */
  @ThreadConfined(ThreadConfined.UI)
  override fun onWindowFocusChange(hasFocus: Boolean) {
    val currentContext = currentReactContext
    if (currentContext != null) {
      currentContext.onWindowFocusChange(hasFocus)
    } else {
      val method = "onWindowFocusChange(hasFocus = \"$hasFocus\")"
      raiseSoftException(method, "Tried to access onWindowFocusChange while context is not ready")
    }
  }

  /**
   * This method will give JS the opportunity to receive intents via Linking.
   *
   * @param intent The incoming intent
   */
  @ThreadConfined(ThreadConfined.UI)
  override fun onNewIntent(intent: Intent) {
    val currentContext = currentReactContext
    if (currentContext != null) {
      val action = intent.action
      val uri = intent.data

      if (
          uri != null &&
              (Intent.ACTION_VIEW == action || NfcAdapter.ACTION_NDEF_DISCOVERED == action)
      ) {
        val deviceEventManagerModule =
            currentContext.getNativeModule(DeviceEventManagerModule::class.java)
        deviceEventManagerModule?.emitNewIntentReceived(uri)
      }
      currentContext.onNewIntent(currentActivity, intent)
    } else {
      val method = "onNewIntent(intent = \"$intent\")"
      raiseSoftException(method, "Tried to access onNewIntent while context is not ready")
    }
  }

  @ThreadConfined(value = ThreadConfined.UI)
  override fun setBundleSource(filePath: String) {
    devSupportManager.bundleFilePath = filePath
    reload("Change bundle source")
  }

  @ThreadConfined(value = ThreadConfined.UI)
  override fun setBundleSource(
      debugServerHost: String,
      moduleName: String,
      queryMapper: (Map<String, String>) -> Map<String, String>,
  ) {
    CoroutineScope(Dispatchers.Default).launch {
      (devSupportManager as DevSupportManagerBase).devServerHelper.closePackagerConnection()
      val packagerConnectionSettings = devSupportManager.devSettings.packagerConnectionSettings
      packagerConnectionSettings.setPackagerOptionsUpdater(queryMapper)
      packagerConnectionSettings.debugServerHost = debugServerHost
      devSupportManager.jsAppBundleName = moduleName
      reload("Changed bundle source")
    }
  }

  @ThreadConfined(ThreadConfined.UI)
  override fun onConfigurationChanged(context: Context) {
    val currentReactContext = this.currentReactContext
    if (currentReactContext != null) {
      if (ReactNativeFeatureFlags.enableFontScaleChangesUpdatingLayout()) {
        val previousFontScale = PixelUtil.toPixelFromSP(1.0)
        DisplayMetricsHolder.initDisplayMetrics(currentReactContext)
        val newFontScale = PixelUtil.toPixelFromSP(1.0)

        if (previousFontScale != newFontScale) {
          synchronized(attachedSurfaces) {
            attachedSurfaces.forEach { surface -> surface.view?.requestLayout() }
          }
        }
      }

      val appearanceModule = currentReactContext.getNativeModule(AppearanceModule::class.java)
      appearanceModule?.onConfigurationChanged(context)
    }
  }

  internal val javaScriptContextHolder: JavaScriptContextHolder?
    get() = reactInstance?.javaScriptContextHolder

  internal val defaultBackButtonHandler: DefaultHardwareBackBtnHandler
    get() = DefaultHardwareBackBtnHandler {
      UiThreadUtil.assertOnUiThread()
      defaultHardwareBackBtnHandler?.invokeDefaultOnBackPressed()
    }

  internal fun loadBundle(bundleLoader: JSBundleLoader): Task<Boolean> {
    val method = "loadBundle()"
    stateTracker.enterState(method, "Schedule")

    return callWithExistingReactInstance(method) { reactInstance: ReactInstance ->
      stateTracker.enterState(method, "Execute")
      reactInstance.loadJSBundle(bundleLoader)
    }
  }

  internal fun registerSegment(segmentId: Int, path: String, callback: Callback?): Task<Boolean> {
    val method = "registerSegment(segmentId = \"$segmentId\", path = \"$path\")"
    stateTracker.enterState(method, "Schedule")

    return callWithExistingReactInstance(method) { reactInstance: ReactInstance ->
      stateTracker.enterState(method, "Execute")
      reactInstance.registerSegment(segmentId, path)
      checkNotNull(callback).invoke()
    }
  }

  internal fun handleHostException(e: Exception) {
    val method = "handleHostException(message = \"${e.message}\")"
    stateTracker.enterState(method)

    if (useDevSupport) {
      devSupportManager.handleException(e)
    } else {
      reactHostDelegate.handleInstanceException(e)
    }
    destroy(method, e)
  }

  /**
   * Call a function on a JS module that has been registered as callable.
   *
   * @param moduleName The name of the JS module
   * @param methodName The function to call
   * @param args Arguments to be passed to the function
   * @return A Task that will complete when the function call has been enqueued on the JS thread.
   */
  internal fun callFunctionOnModule(
      moduleName: String,
      methodName: String,
      args: NativeArray?,
  ): Task<Boolean> {
    val method = "callFunctionOnModule(\"$moduleName\", \"$methodName\")"
    return callWithExistingReactInstance(method) { reactInstance: ReactInstance ->
      reactInstance.callFunctionOnModule(moduleName, methodName, args)
    }
  }

  internal fun attachSurface(surface: ReactSurfaceImpl) {
    stateTracker.enterState("attachSurface(surfaceId = ${surface.surfaceID})")
    synchronized(attachedSurfaces) { attachedSurfaces.add(surface) }
  }

  internal fun detachSurface(surface: ReactSurfaceImpl) {
    stateTracker.enterState("detachSurface(surfaceId = ${surface.surfaceID})")
    synchronized(attachedSurfaces) { attachedSurfaces.remove(surface) }
  }

  internal fun isSurfaceAttached(surface: ReactSurfaceImpl): Boolean =
      synchronized(attachedSurfaces) {
        return attachedSurfaces.contains(surface)
      }

  internal fun isSurfaceWithModuleNameAttached(moduleName: String): Boolean =
      synchronized(attachedSurfaces) {
        return attachedSurfaces.any { surface -> surface.moduleName == moduleName }
      }

  override fun addBeforeDestroyListener(onBeforeDestroy: () -> Unit) {
    beforeDestroyListeners.add(onBeforeDestroy)
  }

  override fun removeBeforeDestroyListener(onBeforeDestroy: () -> Unit) {
    beforeDestroyListeners.remove(onBeforeDestroy)
  }

  @ThreadConfined("ReactHost") private var startTask: Task<Void>? = null

  @ThreadConfined("ReactHost")
  private fun getOrCreateStartTask(): Task<Void> {
    startTask?.let {
      return it
    }

    stateTracker.enterState("getOrCreateStartTask()", "Schedule")
    if (ReactBuildConfig.DEBUG) {
      Assertions.assertCondition(
          ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture(),
          "enableBridgelessArchitecture FeatureFlag must be set to start ReactNative.",
      )
    }
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      Assertions.assertCondition(
          !ReactNativeNewArchitectureFeatureFlags.useFabricInterop(),
          "useFabricInterop FeatureFlag must be false when UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE == true.",
      )
      Assertions.assertCondition(
          !ReactNativeNewArchitectureFeatureFlags.useTurboModuleInterop(),
          "useTurboModuleInterop FeatureFlag must be false when UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE == true.",
      )
    }

    return waitThenCallGetOrCreateReactInstanceTask()
        .continueWithTask(
            { task ->
              if (task.isFaulted()) {
                val ex = checkNotNull(task.getError())
                if (useDevSupport) {
                  devSupportManager.handleException(ex)
                } else {
                  reactHostDelegate.handleInstanceException(ex)
                }
                // Wait for destroy to finish
                getOrCreateDestroyTask("getOrCreateStartTask() failure: ${ex.message}", ex)
                    .continueWithTask({ Task.forError(ex) })
              } else {
                task.makeVoid()
              }
            },
            bgExecutor,
        )
        .also { startTask = it }
  }

  @ThreadConfined(ThreadConfined.UI)
  private fun moveToHostDestroy(currentContext: ReactContext?) {
    reactLifecycleStateManager.moveToOnHostDestroy(currentContext)
    currentActivity = null
    frameTimingsObserver?.setCurrentWindow(null)
  }

  private fun raiseSoftException(
      callingMethod: String,
      message: String,
      throwable: Throwable? = null,
  ) {
    val method = "raiseSoftException($callingMethod)"
    stateTracker.enterState(method, message)
    ReactSoftExceptionLogger.logSoftException(
        TAG,
        ReactNoCrashSoftException("$method: $message", throwable),
    )
  }

  /** Schedule work on a ReactInstance that is already created. */
  private fun callWithExistingReactInstance(
      callingMethod: String,
      executor: Executor = Task.IMMEDIATE_EXECUTOR,
      runnable: (reactInstance: ReactInstance) -> Unit,
  ): Task<Boolean> =
      createReactInstanceTaskRef
          .get()
          .onSuccess(
              { task ->
                val reactInstance = task.getResult()
                if (reactInstance == null) {
                  raiseSoftException(
                      "callWithExistingReactInstance($callingMethod)",
                      "Execute: reactInstance is null. Dropping work.",
                  )
                  false
                } else {
                  runnable(reactInstance)
                  true
                }
              },
              executor,
          )

  /** Create a ReactInstance if it doesn't exist already, and schedule work on it. */
  private fun callAfterGetOrCreateReactInstance(
      callingMethod: String,
      executor: Executor = Task.IMMEDIATE_EXECUTOR,
      runnable: (reactInstance: ReactInstance) -> Unit,
  ): Task<Void> =
      getOrCreateReactInstance()
          .onSuccess<Void>(
              { task ->
                val reactInstance = task.getResult()
                if (reactInstance == null) {
                  raiseSoftException(
                      "callAfterGetOrCreateReactInstance($callingMethod)",
                      "Execute: reactInstance is null. Dropping work.",
                  )
                } else {
                  runnable(reactInstance)
                }
                null
              },
              executor,
          )

  /**
   * Entrypoint to create the ReactInstance.
   *
   * If the ReactInstance is reloading, will return the reload task. If the ReactInstance is
   * destroying, will wait until destroy is finished, before creating.
   */
  private fun getOrCreateReactInstance(): Task<ReactInstance> =
      Task.call({ waitThenCallGetOrCreateReactInstanceTask() }, bgExecutor)

  @ThreadConfined("ReactHost")
  private fun waitThenCallGetOrCreateReactInstanceTask(): Task<ReactInstance> =
      waitThenCallGetOrCreateReactInstanceTaskWithRetries(0, 4)

  @ThreadConfined("ReactHost")
  private fun waitThenCallGetOrCreateReactInstanceTaskWithRetries(
      tryNum: Int,
      maxTries: Int,
  ): Task<ReactInstance> {
    val method = "waitThenCallGetOrCreateReactInstanceTaskWithRetries"
    reloadTask?.let { task ->
      stateTracker.enterState(method, "React Native is reloading. Return reload task.")
      return task
    }

    destroyTask?.let { task ->
      val shouldTryAgain = tryNum < maxTries
      if (shouldTryAgain) {
        stateTracker.enterState(
            method,
            "React Native is tearing down.Wait for teardown to finish, before trying again (try count = $tryNum).",
        )
        return task.onSuccessTask(
            { waitThenCallGetOrCreateReactInstanceTaskWithRetries(tryNum + 1, maxTries) },
            bgExecutor,
        )
      }

      raiseSoftException(
          method,
          "React Native is tearing down. Not wait for teardown to finish: reached max retries.",
      )
    }

    return getOrCreateReactInstanceTask()
  }

  private class CreationResult(
      val instance: ReactInstance,
      val context: ReactContext,
      val isReloading: Boolean,
  )

  @ThreadConfined("ReactHost")
  private fun getOrCreateReactInstanceTask(): Task<ReactInstance> {
    val method = "getOrCreateReactInstanceTask()"
    stateTracker.enterState(method)

    return createReactInstanceTaskRef.getOrCreate {
      stateTracker.enterState(method, "Start")
      Assertions.assertCondition(
          !hostInvalidated,
          "Cannot start a new ReactInstance on an invalidated ReactHost",
      )

      ReactMarker.logMarker(
          ReactMarkerConstants.REACT_BRIDGELESS_LOADING_START,
          BRIDGELESS_MARKER_INSTANCE_KEY,
      )

      val creationTask =
          jsBundleLoader.onSuccess(
              { task ->
                val bundleLoader = checkNotNull(task.getResult())
                val reactContext = bridgelessReactContextRef.getOrCreate {
                  stateTracker.enterState(method, "Creating BridgelessReactContext")
                  BridgelessReactContext(context, this)
                }
                reactContext.jsExceptionHandler = devSupportManager

                stateTracker.enterState(method, "Creating ReactInstance")
                val instance = ReactInstance(
                    reactContext,
                    reactHostDelegate,
                    componentFactory,
                    devSupportManager,
                    { e: Exception -> this.handleHostException(e) },
                    useDevSupport,
                    getOrCreateReactHostInspectorTarget(),
                )
                reactInstance = instance

                val memoryPressureListener = createMemoryPressureListener(instance)
                this.memoryPressureListener = memoryPressureListener
                memoryPressureRouter.addMemoryPressureListener(memoryPressureListener)

                // Eagerly initialize turbo modules in parallel with JS bundle execution
                // as TurboModuleManager will handle any concurrent access
                instance.initializeEagerTurboModules()

                stateTracker.enterState(method, "Loading JS Bundle")
                instance.loadJSBundle(bundleLoader)

                stateTracker.enterState(
                    method,
                    "DevSupportManager.onNewReactContextCreated()",
                )
                devSupportManager.onNewReactContextCreated(reactContext)

                reactContext.runOnJSQueueThread {
                  // Executing on the JS thread to ensure that we're done
                  // loading the JS bundle.
                  // TODO T76081936 Move this if we switch to a sync RTE
                  ReactMarker.logMarker(
                      ReactMarkerConstants.REACT_BRIDGELESS_LOADING_END,
                      BRIDGELESS_MARKER_INSTANCE_KEY,
                  )
                }
                CreationResult(instance, reactContext, reloadTask != null)
              },
              bgExecutor,
          )

      val lifecycleUpdateTask = task@{ task: Task<CreationResult> ->
        if (task.isFaulted()) {
          // handleHostException may throw, so move it outside of the task scheduler
          uiExecutor.execute { handleHostException(checkNotNull(task.getError())) }
          return@task
        }

        val result = checkNotNull(task.getResult())
        val reactContext = result.context
        val isReloading = result.isReloading
        val isManagerResumed = reactLifecycleStateManager.lifecycleState == LifecycleState.RESUMED

        /**
         * ReactContext.onHostResume() should only be called when the user navigates to the first
         * React Native screen.
         *
         * During init: The application puts the React manager in a resumed state, when the user
         * navigates to a React Native screen. Two types of init: (1) If React Native init happens
         * when the user navigates to a React Native screen, the React manager will get resumed on
         * init start, so ReactContext.onHostResume() will be executed here. (2) If React Native
         * init happens before the user navigates to a React Native screen (i.e: React Native is
         * preloaded), the React manager won't be in a resumed state here. So
         * ReactContext.onHostResume() won't be executed here. But, when the user navigates to their
         * first React Native screen, the application will call ReactHost.onHostResume(). That will
         * call ReactContext.onHostResume().
         *
         * During reloads, if the manager isn't resumed, call ReactContext.onHostResume(). If React
         * Native is reloading, it seems reasonable to assume that: (1) We must have navigated to a
         * React Native screen in the past, or (2) We must be on a React Native screen.
         */
        if (isReloading && !isManagerResumed) {
          reactLifecycleStateManager.moveToOnHostResume(reactContext, currentActivity)
        } else {
          /**
           * Call ReactContext.onHostResume() only when already in the resumed state which aligns
           * with the bridge https://fburl.com/diffusion/2qhxmudv.
           */
          reactLifecycleStateManager.resumeReactContextIfHostResumed(reactContext, currentActivity)
        }

        stateTracker.enterState(method, "Executing ReactInstanceEventListeners")
        for (listener in reactInstanceEventListeners) {
          listener.onReactContextInitialized(reactContext)
        }
      }

      creationTask.continueWith(lifecycleUpdateTask, uiExecutor)
      creationTask.onSuccess({ task -> checkNotNull(task.getResult()).instance })
    }
  }

  private val jsBundleLoader: Task<JSBundleLoader>
    get() {
      stateTracker.enterState("getJSBundleLoader()")

      if (devSupportManager.bundleFilePath != null) {
        return try {
          Task.forResult(
              JSBundleLoader.createFileLoader(checkNotNull(devSupportManager.bundleFilePath))
          )
        } catch (e: Exception) {
          Task.forError(e)
        }
      }

      if (useDevSupport && allowPackagerServerAccess) {
        return isMetroRunning.onSuccessTask(
            { task ->
              val isMetroRunning = checkNotNull(task.getResult())
              if (isMetroRunning) {
                // Since metro is running, fetcxception(method, "ReactContext is null. Reload
                // reason: $h the JS bundle from the server
                loadJSBundleFromMetro()
              } else {
                Task.forResult(reactHostDelegate.jsBundleLoader)
              }
            },
            bgExecutor,
        )
      } else {
        if (ReactBuildConfig.DEBUG) {
          FLog.d(TAG, "Packager server access is disabled in this environment")
        }

        /**
         * In prod mode: fall back to the JS bundle loader from the delegate.
         *
         * Note: Create the prod JSBundleLoader inside a Task.call. Why: If JSBundleLoader creation
         * throws an exception, the task will fault, and we'll go through the ReactHost error
         * reporting pipeline.
         */
        return try {
          Task.forResult(reactHostDelegate.jsBundleLoader)
        } catch (e: Exception) {
          Task.forError(e)
        }
      }
    }

  private val isMetroRunning: Task<Boolean>
    get() {
      val method = "isMetroRunning()"
      stateTracker.enterState(method)

      val taskCompletionSource = TaskCompletionSource<Boolean>()
      val asyncDevSupportManager = devSupportManager

      asyncDevSupportManager.isPackagerRunning { packagerIsRunning: Boolean ->
        stateTracker.enterState(method, "Async result = $packagerIsRunning")
        taskCompletionSource.setResult(packagerIsRunning)
      }

      return taskCompletionSource.task
    }

  private fun loadJSBundleFromMetro(): Task<JSBundleLoader> {
    val method = "loadJSBundleFromMetro()"
    stateTracker.enterState(method)

    val taskCompletionSource = TaskCompletionSource<JSBundleLoader>()
    val asyncDevSupportManager = devSupportManager as DevSupportManagerBase
    val bundleURL =
        asyncDevSupportManager.devServerHelper.getDevServerBundleURL(
            checkNotNull(asyncDevSupportManager.jsAppBundleName)
        )

    asyncDevSupportManager.reloadJSFromServer(
        bundleURL,
        object : BundleLoadCallback {
          override fun onSuccess() {
            stateTracker.enterState(method, "Creating BundleLoader")
            val bundleLoader =
                JSBundleLoader.createCachedBundleFromNetworkLoader(
                    bundleURL,
                    asyncDevSupportManager.downloadedJSBundleFile,
                )
            taskCompletionSource.setResult(bundleLoader)
          }

          override fun onError(cause: Exception) {
            taskCompletionSource.setError(cause)
          }
        },
    )

    return taskCompletionSource.task
  }

  private fun stopAttachedSurfaces(method: String, reactInstance: ReactInstance) {
    stateTracker.enterState(method, "Stopping all React Native surfaces")
    synchronized(attachedSurfaces) {
      for (surface in attachedSurfaces) {
        reactInstance.stopSurface(surface)
        surface.clear()
      }
    }
  }

  private fun startAttachedSurfaces(method: String, reactInstance: ReactInstance) {
    stateTracker.enterState(method, "Restarting previously running React Native Surfaces")
    synchronized(attachedSurfaces) {
      for (surface in attachedSurfaces) {
        reactInstance.startSurface(surface)
      }
    }
  }

  @ThreadConfined("ReactHost") private var reloadTask: Task<ReactInstance>? = null

  private fun createReactInstanceUnwrapper(
      tag: String,
      method: String,
      reason: String,
  ): (task: Task<ReactInstance>, stage: String) -> ReactInstance? =
      unwrap@{ task: Task<ReactInstance>, stage: String ->
        val reactInstance = task.getResult()
        val currentReactInstance = this.reactInstance

        val stageLabel = "Stage: $stage"
        val reasonLabel = "$tag reason: $reason"
        if (task.isFaulted()) {
          val ex = checkNotNull(task.getError())
          val faultLabel = "Fault reason: ${ex.message}"
          raiseSoftException(
              method,
              "$tag: ReactInstance task faulted. $stageLabel. $faultLabel. $reasonLabel",
          )
          return@unwrap currentReactInstance
        }

        if (task.isCancelled()) {
          raiseSoftException(
              method,
              "$tag: ReactInstance task cancelled. $stageLabel. $reasonLabel",
          )
          return@unwrap currentReactInstance
        }

        if (reactInstance == null) {
          raiseSoftException(
              method,
              "$tag: ReactInstance task returned null. $stageLabel. $reasonLabel",
          )
          return@unwrap currentReactInstance
        }

        if (currentReactInstance != null && reactInstance != currentReactInstance) {
          raiseSoftException(
              method,
              ("$tag: Detected two different ReactInstances. Returning old. $stageLabel. $reasonLabel"),
          )
        }
        reactInstance
      }

  /**
   * The ReactInstance is loaded. Tear it down, and re-create it.
   *
   * If the ReactInstance is in an "invalid state", make a "best effort" attempt to clean up React.
   * "invalid state" means: ReactInstance task is faulted; ReactInstance is null; React instance
   * task is cancelled; BridgelessReactContext is null. This can typically happen if the
   * ReactInstance task work throws an exception.
   */
  @ThreadConfined("ReactHost")
  private fun getOrCreateReloadTask(reason: String): Task<ReactInstance> {
    val method = "getOrCreateReloadTask()"
    stateTracker.enterState(method)

    reloadTask?.let {
      return it
    }

    val taskUnwrapper = createReactInstanceUnwrapper("Reload", method, reason)

    // When using the immediate executor, we want to avoid scheduling any further work immediately
    // when destruction is kicked off.
    stateTracker.enterState(method, "Resetting createReactInstance task ref")
    return createReactInstanceTaskRef.andReset
        .continueWithTask(
            { task ->
              stateTracker.enterState(method, "Starting React Native reload")
              val reactInstance = taskUnwrapper(task, "1: Starting reload")

              unregisterInstanceFromInspector(reactInstance)

              val reactContext = bridgelessReactContextRef.value
              if (reactContext == null) {
                raiseSoftException(method, "ReactContext is null. Reload reason: $reason")
              }

              if (
                  reactContext != null &&
                      reactLifecycleStateManager.lifecycleState == LifecycleState.RESUMED
              ) {
                stateTracker.enterState(method, "Calling ReactContext.onHostPause()")
                reactContext.onHostPause()
              }
              Task.forResult(reactInstance)
            },
            uiExecutor,
        )
        .continueWithTask(
            { task: Task<ReactInstance> ->
              val reactInstance = taskUnwrapper(task, "2: Surface shutdown")
              if (reactInstance == null) {
                raiseSoftException(method, "Skipping surface shutdown: ReactInstance null")
              } else {
                stopAttachedSurfaces(method, reactInstance)
              }
              task
            },
            bgExecutor,
        )
        .continueWithTask(
            { task: Task<ReactInstance> ->
              taskUnwrapper(task, "3: Destroying ReactContext")
              for (destroyListener in beforeDestroyListeners) {
                destroyListener.invoke()
              }

              memoryPressureListener?.let { listener ->
                stateTracker.enterState(method, "Removing memory pressure listener")
                memoryPressureRouter.removeMemoryPressureListener(listener)
              }

              val reactContext = bridgelessReactContextRef.value
              if (reactContext != null) {
                stateTracker.enterState(method, "Resetting ReactContext ref")
                bridgelessReactContextRef.reset()

                stateTracker.enterState(method, "Destroying ReactContext")
                reactContext.destroy()
              }

              if (useDevSupport && reactContext != null) {
                stateTracker.enterState(
                    method,
                    "Calling DevSupportManager.onReactInstanceDestroyed(reactContext)",
                )
                devSupportManager.onReactInstanceDestroyed(reactContext)
              }
              task
            },
            uiExecutor,
        )
        .continueWithTask(
            { task: Task<ReactInstance> ->
              val reactInstance = taskUnwrapper(task, "4: Destroying ReactInstance")
              if (reactInstance == null) {
                raiseSoftException(method, "Skipping ReactInstance.destroy(): ReactInstance null")
              } else {
                stateTracker.enterState(method, "Resetting ReactInstance ptr")
                this.reactInstance = null

                stateTracker.enterState(method, "Destroying ReactInstance")
                reactInstance.destroy()
              }

              stateTracker.enterState(method, "Resetting start task ref")
              startTask = null

              // Kickstart a new ReactInstance create
              getOrCreateReactInstanceTask()
            },
            bgExecutor,
        )
        .continueWithTask(
            { task: Task<ReactInstance> ->
              val reactInstance = taskUnwrapper(task, "5: Restarting surfaces")
              if (reactInstance == null) {
                raiseSoftException(method, "Skipping surface restart: ReactInstance null")
              } else {
                startAttachedSurfaces(method, reactInstance)
              }
              task
            },
            bgExecutor,
        )
        .continueWithTask(
            { task: Task<ReactInstance> ->
              if (task.isFaulted()) {
                val fault = checkNotNull(task.getError())
                raiseSoftException(
                    method,
                    ("Error during reload. ReactInstance task faulted. Fault reason: ${fault.message}. Reload reason: $reason"),
                    task.getError(),
                )
              }
              if (task.isCancelled()) {
                raiseSoftException(
                    method,
                    "Error during reload. ReactInstance task cancelled. Reload reason: $reason",
                )
              }

              stateTracker.enterState(method, "Resetting reload task ref")
              reloadTask = null
              task
            },
            bgExecutor,
        )
        .also { reloadTask = it }
  }

  @ThreadConfined("ReactHost") private var destroyTask: Task<Void>? = null

  /**
   * The ReactInstance is loaded. Tear it down.
   *
   * If the ReactInstance is in an "invalid state", make a "best effort" attempt to clean up React.
   * "invalid state" means: ReactInstance task is faulted; ReactInstance is null; React instance
   * task is cancelled; BridgelessReactContext is null. This can typically happen if the *
   * ReactInstance task work throws an exception.
   */
  @ThreadConfined("ReactHost")
  private fun getOrCreateDestroyTask(reason: String, ex: Exception?): Task<Void> {
    val method = "getOrCreateDestroyTask()"
    stateTracker.enterState(method)

    destroyTask?.let {
      return it
    }

    val taskUnwrapper = createReactInstanceUnwrapper("Destroy", method, reason)

    // When using the immediate executor, we want to avoid scheduling any further work immediately
    // when destruction is kicked off.
    stateTracker.enterState(method, "Resetting createReactInstance task ref")
    return createReactInstanceTaskRef.andReset
        .continueWithTask(
            { task: Task<ReactInstance> ->
              stateTracker.enterState(method, "Starting React Native destruction")
              val reactInstance = taskUnwrapper(task, "1: Starting destroy")

              unregisterInstanceFromInspector(reactInstance)

              if (hostInvalidated) {
                // If the host has been invalidated, now that the current context/instance
                // has been unregistered, we can safely destroy the host's inspector
                // target.
                destroyReactHostInspectorTarget()
              }

              // Step 1: Destroy DevSupportManager
              if (useDevSupport) {
                stateTracker.enterState(method, "DevSupportManager cleanup")
                // TODO(T137233065): Disable DevSupportManager here
                devSupportManager.stopInspector()
              }

              val reactContext = bridgelessReactContextRef.value
              if (reactContext == null) {
                raiseSoftException(method, "ReactContext is null. Destroy reason: $reason")
              }

              // Step 2: Move React Native to onHostDestroy()
              stateTracker.enterState(method, "Move ReactHost to onHostDestroy()")
              reactLifecycleStateManager.moveToOnHostDestroy(reactContext)
              Task.forResult<ReactInstance>(reactInstance)
            },
            uiExecutor,
        )
        .continueWithTask(
            { task: Task<ReactInstance> ->
              val reactInstance = taskUnwrapper(task, "2: Stopping surfaces")
              if (reactInstance == null) {
                raiseSoftException(method, "Skipping surface shutdown: ReactInstance null")
              } else {
                // Step 3: Stop all React Native surfaces
                stopAttachedSurfaces(method, reactInstance)
                synchronized(attachedSurfaces) { attachedSurfaces.clear() }
              }
              task
            },
            bgExecutor,
        )
        .continueWithTask(
            { task: Task<ReactInstance> ->
              taskUnwrapper(task, "3: Destroying ReactContext")
              for (destroyListener in beforeDestroyListeners) {
                destroyListener.invoke()
              }

              val reactContext = bridgelessReactContextRef.value
              if (reactContext == null) {
                raiseSoftException(method, "ReactContext is null. Destroy reason: $reason")
              }

              // Step 4: De-register the memory pressure listener
              stateTracker.enterState(method, "Destroying MemoryPressureRouter")
              memoryPressureRouter.destroy(context)

              if (reactContext != null) {
                stateTracker.enterState(method, "Resetting ReactContext ref")
                bridgelessReactContextRef.reset()

                stateTracker.enterState(method, "Destroying ReactContext")
                reactContext.destroy()
              }

              // Reset current activity
              currentActivity = null

              // Clear ResourceIdleDrawableIdMap
              ResourceDrawableIdHelper.clear()
              task
            },
            uiExecutor,
        )
        .continueWithTask(
            { task: Task<ReactInstance> ->
              val reactInstance = taskUnwrapper(task, "4: Destroying ReactInstance")
              if (reactInstance == null) {
                raiseSoftException(method, "Skipping ReactInstance.destroy(): ReactInstance null")
              } else {
                stateTracker.enterState(method, "Resetting ReactInstance ptr")
                this.reactInstance = null

                stateTracker.enterState(method, "Destroying ReactInstance")
                reactInstance.destroy()
              }

              stateTracker.enterState(method, "Resetting start/destroy task ref")
              startTask = null
              destroyTask = null
              task
            },
            bgExecutor,
        )
        .continueWith<Void>({ task: Task<ReactInstance> ->
          if (task.isFaulted()) {
            val fault = checkNotNull(task.getError())
            raiseSoftException(
                method,
                ("React destruction failed. ReactInstance task faulted. Fault reason: ${fault.message}. Destroy reason: $reason"),
                task.getError(),
            )
          }
          if (task.isCancelled()) {
            raiseSoftException(
                method,
                "React destruction failed. ReactInstance task cancelled. Destroy reason: $reason",
            )
          }
          null
        })
        .also { destroyTask = it }
  }

  internal fun getOrCreateReactHostInspectorTarget(): ReactHostInspectorTarget? {
    if (reactHostInspectorTarget == null && InspectorFlags.getFuseboxEnabled()) {
      reactHostInspectorTarget = createReactHostInspectorTarget()
    }

    return reactHostInspectorTarget
  }

  private fun createReactHostInspectorTarget(): ReactHostInspectorTarget {
    // NOTE: ReactHostInspectorTarget only retains a weak reference to `this`.
    val inspectorTarget = ReactHostInspectorTarget(this)
    inspectorTarget.registerTracingStateListener(
        TracingStateListener { state: TracingState, _screenshotsEnabled: Boolean ->
          when (state) {
            TracingState.ENABLED_IN_BACKGROUND_MODE,
            TracingState.ENABLED_IN_CDP_MODE -> {
              if (InspectorFlags.getFrameRecordingEnabled()) {
                val observer = FrameTimingsObserver(
                    _screenshotsEnabled,
                    { frameTimingsSequence ->
                      inspectorTarget.recordFrameTimings(frameTimingsSequence)
                    },
                )
                observer.setCurrentWindow(currentActivity?.window)
                observer.start()
                frameTimingsObserver = observer
              }
            }
            TracingState.DISABLED -> {
              frameTimingsObserver?.stop()
              frameTimingsObserver = null
            }
          }
        }
    )

    return inspectorTarget
  }

  private fun destroyReactHostInspectorTarget() {
    frameTimingsObserver?.stop()
    frameTimingsObserver = null

    reactHostInspectorTarget?.close()
    reactHostInspectorTarget = null
  }

  @ThreadConfined(ThreadConfined.UI)
  internal fun unregisterInstanceFromInspector(reactInstance: ReactInstance?) {
    if (reactInstance != null) {
      if (InspectorFlags.getFuseboxEnabled()) {
        Assertions.assertCondition(
            reactHostInspectorTarget?.isValid() == true,
            "Host inspector target destroyed before instance was unregistered",
        )
      }
      reactInstance.unregisterFromInspector()
    }
  }

  override fun invalidate() {
    FLog.d(TAG, "ReactHostImpl.invalidate()")
    hostInvalidated = true
    destroy("ReactHostImpl.invalidate()", null)
  }

  private companion object {
    private const val TAG = "ReactHost"
    private const val BRIDGELESS_MARKER_INSTANCE_KEY = 1
    private val counter = AtomicInteger(0)
  }
}
