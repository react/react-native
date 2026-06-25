/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.annotation.SuppressLint
import android.app.Activity
import android.app.ActivityManager
import android.app.AlertDialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.DialogInterface
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Typeface
import android.hardware.SensorManager
import android.os.Build
import android.util.Pair
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.LinearLayout
import android.widget.ListAdapter
import android.widget.TextView
import android.widget.Toast
import androidx.annotation.UiThread
import androidx.core.util.Supplier
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.DefaultJSExceptionHandler
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.DebugServerException
import com.facebook.react.common.JavascriptException
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.ShakeDetector
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.DebugOverlayController.Companion.requestPermission
import com.facebook.react.devsupport.DevServerHelper.PackagerCommandListener
import com.facebook.react.devsupport.InspectorFlags.getFuseboxEnabled
import com.facebook.react.devsupport.StackTraceHelper.convertJavaStackTrace
import com.facebook.react.devsupport.StackTraceHelper.convertJsStackTrace
import com.facebook.react.devsupport.inspector.TracingState
import com.facebook.react.devsupport.inspector.TracingStateProvider
import com.facebook.react.devsupport.interfaces.BundleLoadCallback
import com.facebook.react.devsupport.interfaces.DebuggerFrontendPanelName
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevOptionHandler
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.DevSupportManager.PackagerLocationCustomizer
import com.facebook.react.devsupport.interfaces.DevSupportManager.PausedInDebuggerOverlayCommandListener
import com.facebook.react.devsupport.interfaces.ErrorCustomizer
import com.facebook.react.devsupport.interfaces.ErrorType
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.devsupport.interfaces.StackFrame
import com.facebook.react.devsupport.perfmonitor.PerfMonitorDevHelper
import com.facebook.react.devsupport.perfmonitor.PerfMonitorOverlayManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags
import com.facebook.react.modules.core.RCTNativeAppEventEmitter
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.RequestHandler
import com.facebook.react.views.common.UiModeUtils
import com.facebook.react.views.text.DefaultStyleValuesUtil
import java.io.File
import java.net.MalformedURLException
import java.net.URL
import java.util.Locale

public abstract class DevSupportManagerBase(
    protected val applicationContext: Context,
    public val reactInstanceDevHelper: ReactInstanceDevHelper,
    @get:JvmName("getJSAppBundleName") public var jsAppBundleName: String?,
    enableOnCreate: Boolean,
    public override val redBoxHandler: RedBoxHandler?,
    private val devBundleDownloadListener: DevBundleDownloadListener?,
    minNumShakes: Int,
    private val customPackagerCommandHandlers: Map<String, RequestHandler>?,
    private val surfaceDelegateFactory: SurfaceDelegateFactory?,
    public var devLoadingViewManager: DevLoadingViewManager?,
    private var pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?,
) : DevSupportManager {

  public interface CallbackWithBundleLoader {
    public fun onSuccess(bundleLoader: JSBundleLoader)

    public fun onError(url: String, cause: Throwable)
  }

  protected abstract val uniqueTag: String

  public final override var currentReactContext: ReactContext? = null
    private set

  public final override val devSettings: DeveloperSettings =
      DevInternalSettings(
          applicationContext,
          object : DevInternalSettings.Listener {
            override fun onInternalSettingsChanged() {
              this@DevSupportManagerBase.reloadSettings()
            }
          },
      )

  override val currentActivity: Activity?
    get() = reactInstanceDevHelper.currentActivity

  /**
   * [com.facebook.react.ReactInstanceManager] is responsible for enabling/disabling dev support
   * when a React view is attached/detached or when application state changes (e.g. the application
   * is backgrounded).
   */
  final override var devSupportEnabled: Boolean
    get() = isDevSupportEnabled
    set(isDevSupportEnabled) {
      this.isDevSupportEnabled = isDevSupportEnabled
      reloadSettings()
    }

  final override var shakeGestureEnabled: Boolean = true
    get() = field
    set(value) {
      if (field == value) {
        return
      }

      if (value) {
        startShakeDetector()
      } else {
        stopShakeDetector()
      }

      field = value
    }

  override var bundleFilePath: String? = null
    get() = field
    set(value) {
      field = value
    }

  override val sourceMapUrl: String
    get() = jsAppBundleName?.let { devServerHelper.getSourceMapUrl(it) } ?: ""

  override val sourceUrl: String
    get() = jsAppBundleName?.let { devServerHelper.getSourceUrl(it) } ?: ""

  override val downloadedJSBundleFile: String
    get() = jsBundleDownloadedFile.absolutePath

  public val devServerHelper: DevServerHelper =
      DevServerHelper(devSettings, applicationContext, devSettings.packagerConnectionSettings)

  public final override var lastErrorTitle: String? = null
  public final override var lastErrorStack: Array<StackFrame>? = null
  public final override var lastErrorType: ErrorType? = null
  public final override var lastErrorCookie: Int = 0

  // Prepare shake gesture detector (will be started/stopped from #reload)
  private val shakeDetector: ShakeDetector =
      ShakeDetector({ this.showDevOptionsDialog() }, minNumShakes)

  // Prepare reload APP broadcast receiver (will be registered/unregistered from #reload)
  private val reloadAppBroadcastReceiver: BroadcastReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          val action = intent.action
          if (getReloadAppAction(context) == action) {
            handleReloadJS()
          }
        }
      }
  private val customDevOptions = LinkedHashMap<String, DevOptionHandler>()
  private val jsBundleDownloadedFile: File
  private val jsSplitBundlesDir: File
  private val defaultJSExceptionHandler: DefaultJSExceptionHandler = DefaultJSExceptionHandler()
  private var redBoxSurfaceDelegate: SurfaceDelegate? = null
  private var devOptionsDialog: AlertDialog? = null
  private var debugOverlayController: DebugOverlayController? = null
  private var devLoadingViewVisible = false
  private var pendingJSSplitBundleRequests = 0
  private var isReceiverRegistered = false
  private var isShakeDetectorStarted = false
  private var isDevSupportEnabled = false
  private var isPackagerConnected = false
  private val errorCustomizers: MutableList<ErrorCustomizer> = mutableListOf()
  private var packagerLocationCustomizer: PackagerLocationCustomizer? = null
  private val jSExecutorDescription: String?
    get() =
        try {
          reactInstanceDevHelper.javaScriptExecutorFactory.toString()
        } catch (e: IllegalStateException) {
          null
        }

  private var perfMonitorOverlayManager: PerfMonitorOverlayManager? = null
  private var perfMonitorInitialized = false
  private var tracingStateProvider: TracingStateProvider? = null

  public override var keyboardShortcutsEnabled: Boolean = true
  public override var devMenuEnabled: Boolean = true

  init {
    // We store JS bundle loaded from dev server in a single destination in app's data dir.
    // In case when someone schedule 2 subsequent reloads it may happen that JS thread will
    // start reading first reload output while the second reload starts writing to the same
    // file. As this should only be the case in dev mode we leave it as it is.
    // TODO(6418010): Fix readers-writers problem in debug reload from HTTP server
    val subclassTag = uniqueTag
    val bundleFile = subclassTag + "ReactNativeDevBundle.js"
    jsBundleDownloadedFile = File(applicationContext.filesDir, bundleFile)
    val splitBundlesDir = subclassTag.lowercase() + "_dev_js_split_bundles"
    jsSplitBundlesDir = applicationContext.getDir(splitBundlesDir, Context.MODE_PRIVATE)
    devSupportEnabled = enableOnCreate
    if (devLoadingViewManager == null) {
      devLoadingViewManager = DefaultDevLoadingViewImplementation(reactInstanceDevHelper)
    }
    if (pausedInDebuggerOverlayManager == null) {
      pausedInDebuggerOverlayManager =
          PausedInDebuggerOverlayDialogManager(
              Supplier {
                val context = reactInstanceDevHelper.currentActivity
                if (context == null || context.isFinishing) {
                  return@Supplier null
                }
                context
              }
          )
    }
    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() &&
            ReactNativeFeatureFlags.perfMonitorV2Enabled() &&
            reactInstanceDevHelper is PerfMonitorDevHelper
    ) {
      perfMonitorOverlayManager =
          PerfMonitorOverlayManager(
              reactInstanceDevHelper,
              { openDebugger(DebuggerFrontendPanelName.PERFORMANCE.toString()) },
          )
    }
  }

  override fun handleException(e: Exception) {
    if (isDevSupportEnabled) {
      logJSException(e)
    } else {
      defaultJSExceptionHandler.handleException(e)
    }
  }

  override fun showNewJavaError(message: String?, e: Throwable) {
    FLog.e(ReactConstants.TAG, "Exception in native call", e)
    showNewError(message, convertJavaStackTrace(e), JAVA_ERROR_COOKIE, ErrorType.NATIVE)
  }

  /**
   * Add option item to dev settings dialog displayed by this manager. In the case user select given
   * option from that dialog, the appropriate handler passed as {@param optionHandler} will be
   * called.
   */
  override fun addCustomDevOption(optionName: String, optionHandler: DevOptionHandler) {
    customDevOptions[optionName] = optionHandler
  }

  override fun showNewJSError(message: String?, details: ReadableArray?, errorCookie: Int) {
    showNewError(message, convertJsStackTrace(details), errorCookie, ErrorType.JS)
  }

  override fun registerErrorCustomizer(errorCustomizer: ErrorCustomizer) {
    errorCustomizers.add(errorCustomizer)
  }

  override fun processErrorCustomizers(
      errorInfo: Pair<String, Array<StackFrame>>
  ): Pair<String, Array<StackFrame>> {
    var errorInfoLocal = errorInfo
    for (errorCustomizer in errorCustomizers) {
      errorInfoLocal = errorCustomizer.customizeErrorInfo(errorInfo)
    }
    return errorInfoLocal
  }

  override fun hideRedboxDialog() {
    redBoxSurfaceDelegate?.hide()
  }

  override fun createRootView(appKey: String): View? = reactInstanceDevHelper.createRootView(appKey)

  override fun destroyRootView(rootView: View?) {
    rootView?.let { reactInstanceDevHelper.destroyRootView(it) }
  }

  private fun logJSException(e: Exception) {
    val message = StringBuilder(e.message ?: "Exception in native call from JS")
    var cause = e.cause
    while (cause != null) {
      message.append("\n\n").append(cause.message)
      cause = cause.cause
    }
    if (e is JavascriptException) {
      FLog.e(ReactConstants.TAG, "Exception in native call from JS", e)
      showNewError(e.message, arrayOf(), JSEXCEPTION_ERROR_COOKIE, ErrorType.JS)
    } else {
      showNewJavaError(message.toString(), e)
    }
  }

  private fun hideDevOptionsDialog() {
    devOptionsDialog?.dismiss()
    devOptionsDialog = null
  }

  private fun showNewError(
      message: String?,
      stack: Array<StackFrame>,
      errorCookie: Int,
      errorType: ErrorType,
  ) {
    UiThreadUtil.runOnUiThread {
      // Keep a copy of the latest error to be shown by the RedBoxSurface
      updateLastErrorInfo(message, stack, errorCookie, errorType)

      if (redBoxSurfaceDelegate == null) {
        this.redBoxSurfaceDelegate =
            createSurfaceDelegate("RedBox")
                ?: RedBoxDialogSurfaceDelegate(this@DevSupportManagerBase).apply {
                  createContentView("RedBox")
                }
      }

      if (redBoxSurfaceDelegate?.isShowing() == true) {
        // Sometimes errors cause multiple errors to be thrown in JS in quick succession. Only
        // show the first and most actionable one.
        return@runOnUiThread
      }
      redBoxSurfaceDelegate?.show()
    }
  }

  override fun showDevOptionsDialog() {
    if (
        devOptionsDialog != null ||
            !isDevSupportEnabled ||
            !devMenuEnabled ||
            ActivityManager.isUserAMonkey()
    ) {
      return
    }
    val options = LinkedHashMap<String, DevOptionHandler>()
    val disabledItemKeys: MutableSet<String?> = HashSet() /* register standard options */
    options[applicationContext.getString(R.string.catalyst_reload)] = DevOptionHandler {
      if (!devSettings.isJSDevModeEnabled && devSettings.isHotModuleReplacementEnabled) {
        Toast.makeText(
                applicationContext,
                applicationContext.getString(R.string.catalyst_hot_reloading_auto_disable),
                Toast.LENGTH_LONG,
            )
            .show()
        devSettings.isHotModuleReplacementEnabled = false
      }
      handleReloadJS()
    }

    if (devSettings.isDeviceDebugEnabled) {
      // On-device JS debugging (CDP). Render action to open debugger frontend.
      val isConnected = isPackagerConnected
      val debuggerItemString =
          applicationContext.getString(
              if (isConnected) R.string.catalyst_debug_open
              else R.string.catalyst_debug_open_disabled
          )
      if (!isConnected) {
        disabledItemKeys.add(debuggerItemString)
      }
      options[debuggerItemString] = DevOptionHandler { this.openDebugger() }
    }

    if (ReactNativeFeatureFlags.perfMonitorV2Enabled()) {
      val isConnected = isPackagerConnected
      val tracingState = tracingStateProvider?.getTracingState() ?: TracingState.DISABLED

      val analyzePerformanceItemString =
          when (tracingState) {
            TracingState.ENABLED_IN_BACKGROUND_MODE ->
                applicationContext.getString(R.string.catalyst_performance_background)
            TracingState.ENABLED_IN_CDP_MODE ->
                applicationContext.getString(R.string.catalyst_performance_cdp)
            TracingState.DISABLED ->
                applicationContext.getString(R.string.catalyst_performance_disabled)
          }

      if (!isConnected || tracingState == TracingState.ENABLED_IN_CDP_MODE) {
        disabledItemKeys.add(analyzePerformanceItemString)
      }

      options[analyzePerformanceItemString] =
          when (tracingState) {
            TracingState.ENABLED_IN_BACKGROUND_MODE ->
                DevOptionHandler {
                  UiThreadUtil.runOnUiThread {
                    if (reactInstanceDevHelper is PerfMonitorDevHelper) {
                      reactInstanceDevHelper.inspectorTarget?.let { target ->
                        if (!target.pauseAndAnalyzeBackgroundTrace()) {
                          openDebugger(DebuggerFrontendPanelName.PERFORMANCE.toString())
                        }
                      }
                    }
                  }
                }
            TracingState.DISABLED ->
                DevOptionHandler {
                  if (reactInstanceDevHelper is PerfMonitorDevHelper)
                      reactInstanceDevHelper.inspectorTarget?.resumeBackgroundTrace()
                }
            TracingState.ENABLED_IN_CDP_MODE -> DevOptionHandler {}
          }
    }

    if (ReactNativeFeatureFlags.perfMonitorV2Enabled()) {
      val isConnected = isPackagerConnected

      val togglePerfMonitorItemString =
          if (perfMonitorOverlayManager?.isEnabled == true)
              applicationContext.getString(R.string.catalyst_performance_disable)
          else applicationContext.getString(R.string.catalyst_performance_enable)

      if (!isConnected) {
        disabledItemKeys.add(togglePerfMonitorItemString)
      }

      options[togglePerfMonitorItemString] =
          if (perfMonitorOverlayManager?.isEnabled == true)
              DevOptionHandler { perfMonitorOverlayManager?.disable() }
          else DevOptionHandler { perfMonitorOverlayManager?.enable() }
    }

    options[applicationContext.getString(R.string.catalyst_change_bundle_location)] =
        DevOptionHandler {
          val context = reactInstanceDevHelper.currentActivity
          if (context == null || context.isFinishing) {
            FLog.e(
                ReactConstants.TAG,
                "Unable to launch change bundle location because react activity is not available",
            )
            return@DevOptionHandler
          }

          ChangeBundleLocationDialog.show(context, devSettings) { host: String ->
            devSettings.packagerConnectionSettings.debugServerHost = host
            handleReloadJS()
          }
        }

    options[applicationContext.getString(R.string.catalyst_inspector_toggle)] = DevOptionHandler {
      devSettings.isElementInspectorEnabled = !devSettings.isElementInspectorEnabled
      reactInstanceDevHelper.toggleElementInspector()
    }

    val hotReloadLabel =
        if (devSettings.isHotModuleReplacementEnabled) {
          applicationContext.getString(R.string.catalyst_hot_reloading_stop)
        } else {
          applicationContext.getString(R.string.catalyst_hot_reloading)
        }
    options[hotReloadLabel] = DevOptionHandler {
      val nextEnabled = !devSettings.isHotModuleReplacementEnabled
      devSettings.isHotModuleReplacementEnabled = nextEnabled
      val reactContext = currentReactContext
      if (reactContext != null) {
        if (nextEnabled) {
          reactContext.getJSModule(HMRClient::class.java)?.enable()
        } else {
          reactContext.getJSModule(HMRClient::class.java)?.disable()
        }
      }
      if (nextEnabled && !devSettings.isJSDevModeEnabled) {
        Toast.makeText(
                applicationContext,
                applicationContext.getString(R.string.catalyst_hot_reloading_auto_enable),
                Toast.LENGTH_LONG,
            )
            .show()
        devSettings.isJSDevModeEnabled = true
        handleReloadJS()
      }
    }

    // Do not show legacy performance overlay if V2 is enabled
    if (!ReactNativeFeatureFlags.perfMonitorV2Enabled()) {
      val fpsDebugLabel =
          if (devSettings.isFpsDebugEnabled)
              applicationContext.getString(R.string.catalyst_perf_monitor_stop)
          else applicationContext.getString(R.string.catalyst_perf_monitor)
      options[fpsDebugLabel] = DevOptionHandler {
        if (!devSettings.isFpsDebugEnabled) {
          // Request overlay permission if needed when "Show Perf Monitor" option is selected
          val context: Context? = reactInstanceDevHelper.currentActivity
          if (context == null) {
            FLog.e(ReactConstants.TAG, "Unable to get reference to react activity")
          } else {
            requestPermission(context)
          }
        }
        devSettings.isFpsDebugEnabled = !devSettings.isFpsDebugEnabled
      }
      options[applicationContext.getString(R.string.catalyst_settings)] = DevOptionHandler {
        val intent = Intent(applicationContext, DevSettingsActivity::class.java)
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        applicationContext.startActivity(intent)
      }
    }

    if (customDevOptions.isNotEmpty()) {
      options.putAll(customDevOptions)
    }
    val optionHandlers = options.values.toTypedArray<DevOptionHandler>()

    val context = reactInstanceDevHelper.currentActivity
    if (context == null || context.isFinishing) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to launch dev options menu because react activity " + "isn't available",
      )
      return
    }

    val header = LinearLayout(context)
    header.orientation = LinearLayout.VERTICAL

    TextView(context).apply {
      text = context.getString(R.string.catalyst_dev_menu_header)
      setPadding(0, 50, 0, 0)
      gravity = Gravity.CENTER
      textSize = 16f
      setTypeface(typeface, Typeface.BOLD)
      header.addView(this)
    }

    val jsExecutorDescription = jSExecutorDescription

    if (jsExecutorDescription != null) {
      TextView(context).apply {
        text = context.getString(R.string.catalyst_dev_menu_sub_header, jsExecutorDescription)
        setPadding(0, 20, 0, 0)
        gravity = Gravity.CENTER
        textSize = 14f
        header.addView(this)
      }
    }

    val adapter: ListAdapter =
        object :
            ArrayAdapter<String?>(
                context,
                android.R.layout.simple_list_item_1,
                options.keys.toTypedArray<String>(),
            ) {
          override fun areAllItemsEnabled(): Boolean = false

          override fun isEnabled(position: Int): Boolean =
              !disabledItemKeys.contains(getItem(position))

          override fun getView(position: Int, convertView: View?, parent: ViewGroup): View =
              super.getView(position, convertView, parent).apply {
                isEnabled = isEnabled(position)
                if (this is TextView) {
                  setTextColor(
                      if (isEnabled) {
                        safeGetDefaultTextColor(context)
                      } else {
                        safeGetTextColorSecondary(context)
                      }
                  )
                }
              }
        }

    devOptionsDialog =
        AlertDialog.Builder(context)
            .setCustomTitle(header)
            .setAdapter(adapter) { _: DialogInterface?, which: Int ->
              optionHandlers[which].onOptionSelected()
              devOptionsDialog = null
            }
            .setOnCancelListener { devOptionsDialog = null }
            .create()

    devOptionsDialog?.show()

    // Prior to Android 12, the list view in AlertDialogs did not match
    // their content size.
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
      devOptionsDialog?.getListView()?.let { listView ->
        val displayMetrics = context.resources.displayMetrics
        val maxHeight = (displayMetrics.heightPixels * 0.7).toInt()

        val layoutParams =
            listView.layoutParams
                ?: ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                )
        layoutParams.height = maxHeight
        listView.layoutParams = layoutParams
      }
    }

    val reactContext = currentReactContext
    reactContext?.getJSModule(RCTNativeAppEventEmitter::class.java)?.emit("RCTDevMenuShown", null)
  }

  override fun onNewReactContextCreated(reactContext: ReactContext) {
    if (!perfMonitorInitialized && reactInstanceDevHelper is PerfMonitorDevHelper) {
      perfMonitorOverlayManager?.let { manager ->
        reactInstanceDevHelper.inspectorTarget?.addPerfMonitorListener(manager)
      }
      if (isPackagerConnected) {
        perfMonitorOverlayManager?.enable()
        perfMonitorOverlayManager?.startBackgroundTrace()
      }
      perfMonitorInitialized = true
    }

    resetCurrentContext(reactContext)
  }

  override fun onReactInstanceDestroyed(reactContext: ReactContext) {
    if (reactContext === currentReactContext) {
      // only call reset context when the destroyed context matches the one that is currently set
      // for this manager
      resetCurrentContext(null)
    }

    // If some JNI types (e.g. jni::HybridClass) are used in JSI (e.g. jsi::HostObject), they might
    // not be immediately deleted on an app refresh as both Java and JavaScript are
    // garbage-collected languages and the memory might float around for a while. For C++
    // developers, this will be hard to debug as destructors might be called at a later point, so in
    // this case we trigger a Java GC to maybe eagerly collect such objects when the app
    // reloads.
    System.gc()
  }

  /**
   * @return `true` if [com.facebook.react.ReactInstanceManager] should use downloaded JS bundle
   *   file instead of using JS file from assets. This may happen when app has not been updated
   *   since the last time we fetched the bundle.
   */
  override fun hasUpToDateJSBundleInCache(): Boolean {
    if (isDevSupportEnabled && jsBundleDownloadedFile.exists()) {
      try {
        val packageName = applicationContext.packageName
        val packageManager = applicationContext.packageManager
        if (packageManager != null) {
          val thisPackage = packageManager.getPackageInfo(packageName, 0)
          if (jsBundleDownloadedFile.lastModified() > thisPackage.lastUpdateTime) {
            // Base APK has not been updated since we downloaded JS, but if app is using exopackage
            // it may only be a single dex that has been updated. We check for exopackage dir update
            // time in that case.
            val exopackageDir =
                File(String.format(Locale.US, EXOPACKAGE_LOCATION_FORMAT, packageName))
            if (exopackageDir.exists()) {
              return jsBundleDownloadedFile.lastModified() > exopackageDir.lastModified()
            }
            return true
          }
        }
      } catch (e: PackageManager.NameNotFoundException) {
        // Ignore this error and just fallback to loading JS from assets
        FLog.e(ReactConstants.TAG, "DevSupport is unable to get current app info")
      }
    }
    return false
  }

  private fun resetCurrentContext(reactContext: ReactContext?) {
    if (currentReactContext === reactContext) {
      // new context is the same as the old one - do nothing
      return
    }
    currentReactContext = reactContext

    // Recreate debug overlay controller with new CatalystInstance object
    debugOverlayController?.setFpsDebugViewVisible(false)
    reactContext?.let { debugOverlayController = DebugOverlayController(it) }

    if (reactContext != null) {
      try {
        val sourceUrl = URL(sourceUrl)
        var path = sourceUrl.path
        if (path != null) {
          path = path.substring(1) // strip initial slash in path
        }
        val host = sourceUrl.host
        val scheme = sourceUrl.protocol
        val port = if (sourceUrl.port != -1) sourceUrl.port else sourceUrl.defaultPort
        reactContext
            .getJSModule(HMRClient::class.java)
            .setup("android", path, host, port, devSettings.isHotModuleReplacementEnabled, scheme)
      } catch (e: MalformedURLException) {
        showNewJavaError(e.message, e)
      }
    }

    reloadSettings()
  }

  override fun reloadSettings() {
    if (UiThreadUtil.isOnUiThread()) {
      reload()
    } else {
      UiThreadUtil.runOnUiThread { this.reload() }
    }
  }

  @UiThread
  private fun showDevLoadingViewForUrl(bundleUrl: String) {
    val parsedURL: URL

    try {
      parsedURL = URL(bundleUrl)
    } catch (e: MalformedURLException) {
      FLog.e(ReactConstants.TAG, "Bundle url format is invalid. \n\n$e")
      return
    }

    val port = if (parsedURL.port != -1) parsedURL.port else parsedURL.defaultPort
    devLoadingViewManager?.showMessage(
        applicationContext.getString(
            R.string.catalyst_loading_from_url,
            parsedURL.host + ":" + port,
        )
    )
    devLoadingViewVisible = true
  }

  @UiThread
  protected fun showDevLoadingViewForRemoteJSEnabled() {
    devLoadingViewManager?.showMessage(
        applicationContext.getString(R.string.catalyst_debug_connecting)
    )
    devLoadingViewVisible = true
  }

  @UiThread
  protected fun hideDevLoadingView() {
    devLoadingViewManager?.hide()
    devLoadingViewVisible = false
  }

  public fun fetchSplitBundleAndCreateBundleLoader(
      bundlePath: String,
      callback: CallbackWithBundleLoader,
  ) {
    val bundleUrl = devServerHelper.getDevServerSplitBundleURL(bundlePath)
    // The bundle path may contain the '/' character, which is not allowed in file names.
    val bundleFile = File(jsSplitBundlesDir, bundlePath.replace("/".toRegex(), "_") + ".jsbundle")
    UiThreadUtil.runOnUiThread {
      showSplitBundleDevLoadingView(bundleUrl)
      devServerHelper.downloadBundleFromURL(
          object : DevBundleDownloadListener {
            override fun onSuccess() {
              UiThreadUtil.runOnUiThread { hideSplitBundleDevLoadingView() }

              val context: ReactContext? = this@DevSupportManagerBase.currentReactContext
              if (context == null || !context.hasActiveReactInstance()) {
                return
              }

              val bundleLoader =
                  JSBundleLoader.createCachedSplitBundleFromNetworkLoader(
                      bundleUrl,
                      bundleFile.absolutePath,
                  )
              callback.onSuccess(bundleLoader)
            }

            override fun onProgress(status: String?, done: Int?, total: Int?, percent: Int?) {
              devLoadingViewManager?.updateProgress(status, done, total, percent)
            }

            override fun onFailure(cause: Exception) {
              UiThreadUtil.runOnUiThread {
                this@DevSupportManagerBase.hideSplitBundleDevLoadingView()
              }
              callback.onError(bundleUrl, cause)
            }
          },
          bundleFile,
          bundleUrl,
          null,
      )
    }
  }

  @UiThread
  private fun showSplitBundleDevLoadingView(bundleUrl: String) {
    showDevLoadingViewForUrl(bundleUrl)
    pendingJSSplitBundleRequests++
  }

  @UiThread
  private fun hideSplitBundleDevLoadingView() {
    if (--pendingJSSplitBundleRequests == 0) {
      hideDevLoadingView()
    }
  }

  override fun isPackagerRunning(callback: PackagerStatusCallback) {
    val checkPackagerRunning = Runnable { devServerHelper.isPackagerRunning(callback) }
    packagerLocationCustomizer?.run(checkPackagerRunning) ?: checkPackagerRunning.run()
  }

  override fun downloadBundleResourceFromUrlSync(resourceURL: String, outputFile: File): File? =
      devServerHelper.downloadBundleResourceFromUrlSync(resourceURL, outputFile)

  private fun updateLastErrorInfo(
      message: String?,
      stack: Array<StackFrame>,
      errorCookie: Int,
      errorType: ErrorType,
  ) {
    lastErrorTitle = message
    lastErrorStack = stack
    lastErrorCookie = errorCookie
    lastErrorType = errorType
  }

  override fun reloadJSFromServer(bundleURL: String, callback: BundleLoadCallback) {
    ReactMarker.logMarker(ReactMarkerConstants.DOWNLOAD_START)

    showDevLoadingViewForUrl(bundleURL)

    val bundleInfo = BundleDownloader.BundleInfo()

    devServerHelper.downloadBundleFromURL(
        object : DevBundleDownloadListener {
          override fun onSuccess() {
            hideDevLoadingView()
            devBundleDownloadListener?.onSuccess()
            ReactMarker.logMarker(ReactMarkerConstants.DOWNLOAD_END, bundleInfo.toJSONString())
            callback.onSuccess()
          }

          override fun onProgress(status: String?, done: Int?, total: Int?, percent: Int?) {
            devLoadingViewManager?.updateProgress(status, done, total, percent)
            devBundleDownloadListener?.onProgress(status, done, total, percent)
          }

          override fun onFailure(cause: Exception) {
            hideDevLoadingView()
            devBundleDownloadListener?.onFailure(cause)
            FLog.e(ReactConstants.TAG, "Unable to download JS bundle", cause)
            reportBundleLoadingFailure(cause)
            callback.onError(cause)
          }
        },
        jsBundleDownloadedFile,
        bundleURL,
        bundleInfo,
    )
  }

  private fun reportBundleLoadingFailure(cause: Exception) {
    UiThreadUtil.runOnUiThread {
      if (cause is DebugServerException) {
        showNewJavaError(cause.message, cause)
      } else {
        showNewJavaError(applicationContext.getString(R.string.catalyst_reload_error), cause)
      }
    }
  }

  override fun startInspector() {
    if (isDevSupportEnabled) {
      devServerHelper.openInspectorConnection()
    }
  }

  override fun stopInspector() {
    devServerHelper.closeInspectorConnection()
  }

  override fun setHotModuleReplacementEnabled(isHotModuleReplacementEnabled: Boolean) {
    if (!isDevSupportEnabled) {
      return
    }

    UiThreadUtil.runOnUiThread {
      devSettings.isHotModuleReplacementEnabled = isHotModuleReplacementEnabled
      handleReloadJS()
    }
  }

  override fun setFpsDebugEnabled(isFpsDebugEnabled: Boolean) {
    if (!isDevSupportEnabled) {
      return
    }

    UiThreadUtil.runOnUiThread { devSettings.isFpsDebugEnabled = isFpsDebugEnabled }
  }

  override fun toggleElementInspector() {
    if (!isDevSupportEnabled) {
      return
    }

    UiThreadUtil.runOnUiThread {
      devSettings.isElementInspectorEnabled = !devSettings.isElementInspectorEnabled
      reactInstanceDevHelper.toggleElementInspector()
    }
  }

  private fun startShakeDetector() {
    val sensorManager = applicationContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    shakeDetector.start(sensorManager)
    isShakeDetectorStarted = true
  }

  private fun stopShakeDetector() {
    shakeDetector.stop()
    isShakeDetectorStarted = false
  }

  private fun reload() {
    UiThreadUtil.assertOnUiThread()

    // reload settings, show/hide debug overlay if required & start/stop shake detector
    if (isDevSupportEnabled) {
      // update visibility of FPS debug overlay depending on the settings
      debugOverlayController?.setFpsDebugViewVisible(devSettings.isFpsDebugEnabled)

      // start shake gesture detector
      if (!isShakeDetectorStarted && shakeGestureEnabled) {
        startShakeDetector()
      }

      // register reload app broadcast receiver
      if (!isReceiverRegistered) {
        val filter = IntentFilter()
        filter.addAction(getReloadAppAction(applicationContext))
        compatRegisterReceiver(applicationContext, reloadAppBroadcastReceiver, filter, true)
        isReceiverRegistered = true
      }

      // show the dev loading if it should be
      if (devLoadingViewVisible) {
        devLoadingViewManager?.showMessage("Reloading...")
      }

      devServerHelper.openPackagerConnection(
          javaClass.simpleName,
          object : PackagerCommandListener {
            override fun onPackagerConnected() {
              isPackagerConnected = true
              perfMonitorOverlayManager?.enable()
              perfMonitorOverlayManager?.startBackgroundTrace()
            }

            override fun onPackagerDisconnected() {
              isPackagerConnected = false
              perfMonitorOverlayManager?.disable()
              perfMonitorOverlayManager?.stopBackgroundTrace()
            }

            override fun onPackagerReloadCommand() {
              if (!getFuseboxEnabled()) {
                // Disable debugger to resume the JsVM & avoid thread locks while reloading
                devServerHelper.disableDebugger()
              }
              UiThreadUtil.runOnUiThread { handleReloadJS() }
            }

            override fun onPackagerDevMenuCommand() {
              UiThreadUtil.runOnUiThread { showDevOptionsDialog() }
            }

            override fun customCommandHandlers(): Map<String, RequestHandler>? {
              return customPackagerCommandHandlers
            }
          },
      )
    } else {
      // hide FPS debug overlay
      debugOverlayController?.setFpsDebugViewVisible(false)

      // stop shake gesture detector
      if (isShakeDetectorStarted) {
        stopShakeDetector()
      }

      // unregister app reload broadcast receiver
      if (isReceiverRegistered) {
        applicationContext.unregisterReceiver(reloadAppBroadcastReceiver)
        isReceiverRegistered = false
      }

      hideRedboxDialog()
      hideDevOptionsDialog()
      devLoadingViewManager?.hide()
      perfMonitorOverlayManager?.disable()

      devServerHelper.closePackagerConnection()
    }
  }

  override fun setPackagerLocationCustomizer(
      packagerLocationCustomizer: PackagerLocationCustomizer
  ) {
    this.packagerLocationCustomizer = packagerLocationCustomizer
  }

  override fun createSurfaceDelegate(moduleName: String): SurfaceDelegate? =
      surfaceDelegateFactory?.createSurfaceDelegate(moduleName)

  /**
   * Starting with Android 14, apps and services that target Android 14 and use context-registered
   * receivers are required to specify a flag to indicate whether or not the receiver should be
   * exported to all other apps on the device: either RECEIVER_EXPORTED or RECEIVER_NOT_EXPORTED
   *
   * https://developer.android.com/about/versions/14/behavior-changes-14#runtime-receivers-exported
   */
  private fun compatRegisterReceiver(
      context: Context,
      receiver: BroadcastReceiver,
      filter: IntentFilter,
      exported: Boolean,
  ) {
    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    if (
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE &&
            context.applicationInfo.targetSdkVersion >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE
    ) {
      context.registerReceiver(
          receiver,
          filter,
          if (exported) Context.RECEIVER_EXPORTED else Context.RECEIVER_NOT_EXPORTED,
      )
    } else {
      context.registerReceiver(receiver, filter)
    }
  }

  private fun safeGetDefaultTextColor(context: Context): ColorStateList {
    return DefaultStyleValuesUtil.getDefaultTextColor(context)
        ?: if (UiModeUtils.isDarkMode(context)) ColorStateList.valueOf(android.graphics.Color.WHITE)
        else ColorStateList.valueOf(android.graphics.Color.BLACK)
  }

  private fun safeGetTextColorSecondary(context: Context): ColorStateList {
    return DefaultStyleValuesUtil.getTextColorSecondary(context)
        ?: ColorStateList.valueOf(android.graphics.Color.GRAY)
  }

  override fun openDebugger(panel: String?) {
    devServerHelper.openDebugger(
        currentReactContext,
        applicationContext.getString(R.string.catalyst_open_debugger_error),
        panel,
    )
  }

  override fun showPausedInDebuggerOverlay(
      message: String,
      listener: PausedInDebuggerOverlayCommandListener,
  ) {
    pausedInDebuggerOverlayManager?.showPausedInDebuggerOverlay(message, listener)
  }

  override fun hidePausedInDebuggerOverlay() {
    pausedInDebuggerOverlayManager?.hidePausedInDebuggerOverlay()
  }

  override fun setAdditionalOptionForPackager(name: String, value: String) {
    devSettings.packagerConnectionSettings.setAdditionalOptionForPackager(name, value)
  }

  /**
   * Sets the background tracing state provider for bridgeless architecture. This is called
   * internally by the ReactHost implementation.
   */
  internal fun setTracingStateProvider(provider: TracingStateProvider?) {
    tracingStateProvider = provider
  }

  public companion object {
    private const val JAVA_ERROR_COOKIE = -1
    private const val JSEXCEPTION_ERROR_COOKIE = -1
    private const val RELOAD_APP_ACTION_SUFFIX = ".RELOAD_APP_ACTION"
    private const val EXOPACKAGE_LOCATION_FORMAT = "/data/local/tmp/exopackage/%s//secondary-dex"

    /** Intent action for reloading the JS */
    private fun getReloadAppAction(context: Context): String =
        context.packageName + RELOAD_APP_ACTION_SUFFIX
  }
}
