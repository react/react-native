/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.annotation.SuppressLint
import android.content.res.AssetManager
import android.view.View
import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeExceptionsManagerSpec
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.infer.annotation.ThreadSafe
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.BuildConfig
import com.facebook.react.DebugCorePackage
import com.facebook.react.ReactPackage
import com.facebook.react.ViewManagerOnDemandReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JSBundleLoaderDelegate
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.NativeArray
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.RuntimeScheduler
import com.facebook.react.bridge.queue.MessageQueueThread
import com.facebook.react.bridge.queue.MessageQueueThreadSpec
import com.facebook.react.bridge.queue.QueueThreadExceptionHandler
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.bridge.queue.ReactQueueConfigurationImpl
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.devsupport.InspectorFlags.getIsProfilingBuild
import com.facebook.react.devsupport.StackTraceHelper
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.fabric.AnimationBackendChoreographer
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.fabric.FabricUIManagerBinding
import com.facebook.react.fabric.events.EventBeatManager
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler.ProcessedError
import com.facebook.react.internal.AndroidChoreographerProvider
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.turbomodule.core.TurboModuleManager
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.JavaTimerManager
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.facebook.react.turbomodule.core.NativeMethodCallInvokerHolderImpl
import com.facebook.react.uimanager.ComponentNameResolver
import com.facebook.react.uimanager.ComponentNameResolverBinding
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.UIConstantsProviderBinding
import com.facebook.react.uimanager.UIConstantsProviderBinding.ConstantsForViewManagerProvider
import com.facebook.react.uimanager.UIManagerModuleConstantsHelper
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.ViewManagerResolver
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.util.RNLog
import com.facebook.soloader.SoLoader
import com.facebook.systrace.Systrace
import com.facebook.systrace.SystraceMessage
import java.util.ArrayList
import java.util.HashMap
import java.util.HashSet
import kotlin.collections.Collection

/**
 * A replacement for [com.facebook.react.bridge.CatalystInstance] responsible for creating and
 * managing a React Native instance
 */
@ThreadSafe
@DoNotStrip
@FrameworkAPI
@UnstableReactNativeAPI
internal class ReactInstance(
    private val context: BridgelessReactContext,
    delegate: ReactHostDelegate,
    componentFactory: ComponentFactory,
    devSupportManager: DevSupportManager,
    exceptionHandler: QueueThreadExceptionHandler,
    useDevSupport: Boolean,
    reactHostInspectorTarget: ReactHostInspectorTarget?,
) {
  @Suppress("NoHungarianNotation") @DoNotStrip private val mHybridData: HybridData

  private val turboModuleManager: TurboModuleManager
  private val javaTimerManager: JavaTimerManager
  private val viewManagerResolver: BridgelessViewManagerResolver

  val reactQueueConfiguration: ReactQueueConfiguration
  val fabricUIManager: FabricUIManager
  val javaScriptContextHolder: JavaScriptContextHolder

  val nativeModules: Collection<NativeModule>
    get() = turboModuleManager.modules

  val eventDispatcher: EventDispatcher
    /** @return The [EventDispatcher] used by [FabricUIManager] to emit UI events to JS. */
    get() = fabricUIManager.eventDispatcher

  init {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactInstance.initialize")

    /**
     * Prepare the ReactInstance by installing JSI bindings, initializing Fabric + TurboModules, and
     * loading the JS bundle.
     */
    val spec =
        ReactQueueConfigurationSpec(
            MessageQueueThreadSpec.newBackgroundThreadSpec("v_native"),
            MessageQueueThreadSpec.newBackgroundThreadSpec("v_js"),
        )
    reactQueueConfiguration = ReactQueueConfigurationImpl.create(spec, exceptionHandler)
    FLog.d(TAG, "Calling initializeMessageQueueThreads()")
    context.initializeMessageQueueThreads(reactQueueConfiguration)
    val jsMessageQueueThread = reactQueueConfiguration.getJSQueueThread()
    val nativeModulesMessageQueueThread = reactQueueConfiguration.getNativeModulesQueueThread()

    ReactChoreographer.initialize(AndroidChoreographerProvider.getInstance())
    devSupportManager.startInspector()

    val jsTimerExecutor = JSTimerExecutor()
    javaTimerManager =
        JavaTimerManager(
            context,
            jsTimerExecutor,
            ReactChoreographer.getInstance(),
            devSupportManager,
        )

    // Notify JS if profiling is enabled
    val isProfiling =
        BuildConfig.ENABLE_PERFETTO ||
            Systrace.isTracing(Systrace.TRACE_TAG_REACT) ||
            getIsProfilingBuild()

    mHybridData =
        initHybrid(
            delegate.jsRuntimeFactory,
            jsMessageQueueThread,
            nativeModulesMessageQueueThread,
            javaTimerManager,
            jsTimerExecutor,
            ReactJsExceptionHandlerImpl(exceptionHandler),
            delegate.bindingsInstaller,
            isProfiling,
            reactHostInspectorTarget,
        )

    javaScriptContextHolder = JavaScriptContextHolder(getJavaScriptContext())

    // Set up TurboModules
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactInstance.initialize#initTurboModules")

    val reactPackages: MutableList<ReactPackage> = ArrayList<ReactPackage>()
    reactPackages.add(
        CoreReactPackage(context.devSupportManager, context.defaultHardwareBackBtnHandler)
    )
    if (useDevSupport) {
      reactPackages.add(DebugCorePackage())
    }
    reactPackages.addAll(delegate.reactPackages)

    val turboModuleManagerDelegate =
        delegate.turboModuleManagerDelegateBuilder
            .setPackages(reactPackages)
            .setReactApplicationContext(context)
            .build()

    val unbufferedRuntimeExecutor = getUnbufferedRuntimeExecutor()
    turboModuleManager =
        TurboModuleManager( // Use unbuffered RuntimeExecutor to install binding
            unbufferedRuntimeExecutor,
            turboModuleManagerDelegate,
            getJSCallInvokerHolder(),
            getNativeMethodCallInvokerHolder(),
        )
    Systrace.endSection(Systrace.TRACE_TAG_REACT)

    // Set up Fabric
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactInstance.initialize#initFabric")

    viewManagerResolver = BridgelessViewManagerResolver(reactPackages, context)

    // Initialize function for JS's UIManager.hasViewManagerConfig()
    // Use unbuffered RuntimeExecutor to install binding
    ComponentNameResolverBinding.install(
        unbufferedRuntimeExecutor,
        object : ComponentNameResolver {
          override val componentNames: Array<String>
            get() {
              val viewManagerNames = viewManagerResolver.getViewManagerNames()
              if (viewManagerNames.isEmpty()) {
                FLog.e(TAG, "No ViewManager names found")
                return arrayOf()
              }
              return viewManagerNames.toTypedArray<String>()
            }
        },
    )

    // Initialize function for JS's UIManager.getViewManagerConfig()
    // It should come after getTurboModuleManagerDelegate as it relies on react packages being
    // initialized.
    // This happens inside getTurboModuleManagerDelegate getter.
    if (ReactNativeFeatureFlags.useNativeViewConfigsInBridgelessMode()) {
      val customDirectEvents: MutableMap<String, Any> = HashMap()

      UIConstantsProviderBinding.install(
          // Use unbuffered RuntimeExecutor to install binding
          unbufferedRuntimeExecutor,
          // Here we are construncting the return value for UManager.getConstants call.
          // The old architectre relied on the constatnts struct to contain:
          // 1. Eagerly loaded view configs for all native components.
          // 2. genericBubblingEventTypes.
          // 3. genericDirectEventTypes.
          // We want to match this beahavior.
          { Arguments.makeNativeMap(UIManagerModuleConstantsHelper.defaultExportableEventTypes) },
          ConstantsForViewManagerProvider { viewManagerName: String ->
            val viewManager =
                viewManagerResolver.getViewManager(viewManagerName)
                    ?: return@ConstantsForViewManagerProvider null
            getConstantsForViewManager(viewManager, customDirectEvents)
          },
          {
            val viewManagers: List<ViewManager<*, *>> =
                ArrayList(viewManagerResolver.eagerViewManagerMap.values)
            val constants = createConstants(viewManagers, customDirectEvents)

            val lazyViewManagers = viewManagerResolver.lazyViewManagerNames
            if (!lazyViewManagers.isEmpty()) {
              constants["ViewManagerNames"] = ArrayList(lazyViewManagers)
              constants["LazyViewManagersEnabled"] = true
            }
            Arguments.makeNativeMap(constants)
          },
      )
    }

    val eventBeatManager = EventBeatManager()
    fabricUIManager =
        FabricUIManager(context, ViewManagerRegistry(viewManagerResolver), eventBeatManager)

    // Misc initialization that needs to be done before Fabric init
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context)

    val animationBackendChoreographer = AnimationBackendChoreographer(context)

    val binding = FabricUIManagerBinding()
    binding.register(
        getBufferedRuntimeExecutor(),
        getRuntimeScheduler(),
        fabricUIManager,
        eventBeatManager,
        componentFactory,
        animationBackendChoreographer,
    )

    // Initialize the FabricUIManager
    fabricUIManager.initialize()

    Systrace.endSection(Systrace.TRACE_TAG_REACT)
    Systrace.endSection(Systrace.TRACE_TAG_REACT)
  }

  fun initializeEagerTurboModules() {
    reactQueueConfiguration.getNativeModulesQueueThread().runOnQueue {
      Systrace.beginSection(Systrace.TRACE_TAG_REACT, "initializeEagerTurboModules")
      // Eagerly initialize TurboModules
      for (moduleName in turboModuleManager.eagerInitModuleNames) {
        turboModuleManager.getModule(moduleName)
      }
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }
  }

  private inner class ReactJsExceptionHandlerImpl(
      private val queueThreadExceptionHandler: QueueThreadExceptionHandler
  ) : ReactJsExceptionHandler {

    override fun reportJsException(errorMap: ProcessedError) {
      val data = StackTraceHelper.convertProcessedError(errorMap)
      try {
        val exceptionsManager =
            checkNotNull(
                getNativeModule<NativeExceptionsManagerSpec>(NativeExceptionsManagerSpec.NAME)
            )
        exceptionsManager.reportException(data)
      } catch (e: Exception) {
        // Sometimes (e.g: always with the default exception manager) the native module exceptions
        // manager can throw. In those cases, call into the lower-level queue thread exceptions
        // handler.
        queueThreadExceptionHandler.handleException(e)
      }
    }
  }

  fun loadJSBundle(bundleLoader: JSBundleLoader) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactInstance.loadJSBundle")
    bundleLoader.loadScript(
        object : JSBundleLoaderDelegate {
          override fun loadScriptFromFile(
              fileName: String,
              sourceURL: String,
              loadSynchronously: Boolean,
          ) {
            context.sourceURL = sourceURL
            loadJSBundleFromFile(fileName, sourceURL)
          }

          override fun loadSplitBundleFromFile(fileName: String, sourceURL: String) {
            loadJSBundleFromFile(fileName, sourceURL)
          }

          override fun loadScriptFromAssets(
              assetManager: AssetManager,
              assetURL: String,
              loadSynchronously: Boolean,
          ) {
            context.sourceURL = assetURL
            loadJSBundleFromAssets(assetManager, assetURL)
          }

          override fun setSourceURLs(deviceURL: String, remoteURL: String) {
            context.sourceURL = deviceURL
          }
        }
    )
    Systrace.endSection(Systrace.TRACE_TAG_REACT)
  }

  fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean {
    val annotation = nativeModuleInterface.getAnnotation(ReactModule::class.java)
    if (annotation != null) {
      return turboModuleManager.hasModule(annotation.name)
    }
    return false
  }

  fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T? {
    val annotation = nativeModuleInterface.getAnnotation(ReactModule::class.java)
    if (annotation != null) {
      return getNativeModule<T>(annotation.name)
    }
    return null
  }

  @SuppressLint("KotlinGenericsCast")
  fun <T : NativeModule> getNativeModule(nativeModuleName: String): T? {
    synchronized(turboModuleManager) {
      @Suppress("UNCHECKED_CAST")
      return turboModuleManager.getModule(nativeModuleName) as T?
    }
  }

  @ThreadConfined("ReactHost")
  fun prerenderSurface(surface: ReactSurfaceImpl) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactInstance.prerenderSurface")
    FLog.d(TAG, "call prerenderSurface with surface: ${surface.moduleName}")
    fabricUIManager.startSurface(surface.surfaceHandler, surface.context, null)
    Systrace.endSection(Systrace.TRACE_TAG_REACT)
  }

  /**
   * Renders a React Native surface.
   *
   * @param surface The [com.facebook.react.interfaces.fabric.ReactSurface] to render.
   */
  @ThreadConfined("ReactHost")
  fun startSurface(surface: ReactSurfaceImpl) {
    FLog.d(TAG, "startSurface() is called with surface: ${surface.surfaceID}")
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "ReactInstance.startSurface")

    val view = surface.view
    checkNotNull(view) {
      "Starting surface without a view is not supported, use prerenderSurface instead."
    }

    /**
     * This is a temporary mitigation for 646912b2590a6d5e760316cc064d1e27,
     *
     * <p>TODO T83828172 investigate why surface.getView() has id NOT equal to View.NO_ID
     */
    if (view.id != View.NO_ID) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalViewOperationException(
              "surfaceView's is NOT equal to View.NO_ID before calling startSurface."
          ),
      )
      view.id = View.NO_ID
    }
    if (surface.isRunning) {
      // surface was initialized beforehand, only attaching view
      fabricUIManager.attachRootView(surface.surfaceHandler, view)
    } else {
      fabricUIManager.startSurface(surface.surfaceHandler, surface.context, view)
    }
    Systrace.endSection(Systrace.TRACE_TAG_REACT)
  }

  @ThreadConfined("ReactHost")
  fun stopSurface(surface: ReactSurfaceImpl) {
    FLog.d(TAG, "stopSurface() is called with surface: ${surface.surfaceID}")
    fabricUIManager.stopSurface(surface.surfaceHandler)
  }

  /* --- Lifecycle methods --- */
  @ThreadConfined("ReactHost")
  fun destroy() {
    FLog.d(TAG, "ReactInstance.destroy() is called.")
    reactQueueConfiguration.destroy()
    turboModuleManager.invalidate()
    fabricUIManager.invalidate()
    javaTimerManager.onInstanceDestroy()
    mHybridData.resetNative()
    javaScriptContextHolder.clear()
  }

  /* --- Native methods --- */
  @DoNotStrip
  private external fun initHybrid(
      jsRuntimeFactory: JSRuntimeFactory,
      jsMessageQueueThread: MessageQueueThread,
      nativeModulesMessageQueueThread: MessageQueueThread,
      timerManager: JavaTimerManager,
      jsTimerExecutor: JSTimerExecutor,
      jReactExceptionsManager: ReactJsExceptionHandler,
      jBindingsInstaller: BindingsInstaller?,
      isProfiling: Boolean,
      reactHostInspectorTarget: ReactHostInspectorTarget?,
  ): HybridData

  private external fun loadJSBundleFromFile(fileName: String, sourceURL: String)

  private external fun loadJSBundleFromAssets(assetManager: AssetManager, assetURL: String)

  external fun getJSCallInvokerHolder(): CallInvokerHolderImpl

  private external fun getNativeMethodCallInvokerHolder(): NativeMethodCallInvokerHolderImpl

  private external fun getUnbufferedRuntimeExecutor(): RuntimeExecutor

  external fun getBufferedRuntimeExecutor(): RuntimeExecutor

  private external fun getRuntimeScheduler(): RuntimeScheduler

  private external fun getJavaScriptContext(): Long

  external fun callFunctionOnModule(moduleName: String, methodName: String, args: NativeArray?)

  private external fun registerSegmentNative(segmentId: Int, segmentPath: String)

  private external fun handleMemoryPressureJs(pressureLevel: Int)

  @ThreadConfined(ThreadConfined.UI) external fun unregisterFromInspector()

  fun handleMemoryPressure(level: Int) {
    try {
      handleMemoryPressureJs(level)
    } catch (e: NullPointerException) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          ReactNoCrashSoftException(
              "Native method handleMemoryPressureJs is called earlier than librninstance.so got ready."
          ),
      )
    }
  }

  fun registerSegment(segmentId: Int, path: String) {
    registerSegmentNative(segmentId, path)
  }

  private class BridgelessViewManagerResolver(
      private val reactPackages: List<ReactPackage>,
      private val context: BridgelessReactContext,
  ) : ViewManagerResolver {
    private val lazyViewManagerMap: MutableMap<String, ViewManager<*, *>> = HashMap()

    override fun getViewManager(viewManagerName: String): ViewManager<*, *>? {
      val viewManager = getLazyViewManager(viewManagerName)
      if (viewManager != null) {
        return viewManager
      }

      // Once a view manager is not found in all react packages via lazy loading, fall back to
      // default implementation: eagerly initialize all view managers
      return eagerViewManagerMap[viewManagerName]
    }

    override fun getViewManagerNames(): Collection<String> {
      val allViewManagerNames: MutableSet<String> = HashSet()
      allViewManagerNames.addAll(lazyViewManagerNames)
      allViewManagerNames.addAll(eagerViewManagerMap.keys)
      return allViewManagerNames
    }

    private lateinit var _eagerViewManagerMap: Map<String, ViewManager<*, *>>

    @get:Synchronized
    val eagerViewManagerMap: Map<String, ViewManager<*, *>>
      get() {
        if (::_eagerViewManagerMap.isInitialized) {
          return _eagerViewManagerMap
        }

        val viewManagerMap: MutableMap<String, ViewManager<*, *>> = HashMap()
        for (reactPackage in reactPackages) {
          if (reactPackage is ViewManagerOnDemandReactPackage) {
            continue
          }

          val viewManagersInPackage = reactPackage.createViewManagers(context)
          for (viewManager in viewManagersInPackage) {
            // TODO(T173624687): Should we throw/warn when the same view manager name is registered
            // twice?
            viewManagerMap[viewManager.name] = viewManager
          }
        }

        _eagerViewManagerMap = viewManagerMap
        return viewManagerMap
      }

    @Synchronized
    fun getLazyViewManager(viewManagerName: String): ViewManager<*, *>? {
      if (lazyViewManagerMap.containsKey(viewManagerName)) {
        return lazyViewManagerMap[viewManagerName]
      }

      for (reactPackage in reactPackages) {
        if (reactPackage is ViewManagerOnDemandReactPackage) {
          val viewManager = reactPackage.createViewManager(context, viewManagerName)
          if (viewManager != null) {
            // TODO(T173624687): Should we throw/warn when the same view manager name is registered
            // twice?
            lazyViewManagerMap[viewManagerName] = viewManager
            return viewManager
          }
        }
      }

      return null
    }

    @get:Synchronized
    val lazyViewManagerNames: Collection<String>
      get() {
        val uniqueNames: MutableSet<String> = HashSet()
        for (reactPackage in reactPackages) {
          if (reactPackage is ViewManagerOnDemandReactPackage) {
            val names = reactPackage.getViewManagerNames(context)
            // We need to null check here because some Java implementation of the
            // `ViewManagerOnDemandReactPackage` interface could still return null even
            // if the method is marked as returning a non-nullable collection in Kotlin.
            // See https://github.com/facebook/react-native/issues/52014
            @Suppress("SENSELESS_COMPARISON")
            if (names == null) {
              RNLog.w(
                  context,
                  "The ReactPackage called: `${reactPackage.javaClass.simpleName}` is returning null for getViewManagerNames(). This is violating the signature of the method. That method should be updated to return an empty collection.",
              )
            } else {
              uniqueNames.addAll(names)
            }
          }
        }
        return uniqueNames
      }
  }

  companion object {
    private val TAG: String = ReactInstance::class.java.simpleName

    init {
      SoLoader.loadLibrary("rninstance")
    }

    private fun createConstants(
        viewManagers: List<ViewManager<in Nothing, in Nothing>>,
        customDirectEvents: MutableMap<String, Any>?,
    ): MutableMap<String, Any> {
      ReactMarker.logMarker(ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_CONSTANTS_START)
      SystraceMessage.beginSection(Systrace.TRACE_TAG_REACT, "CreateUIManagerConstants")
          .arg("Lazy", false)
          .flush()
      try {
        return UIManagerModuleConstantsHelper.createConstants(
            viewManagers,
            null,
            customDirectEvents,
        )
      } finally {
        Systrace.endSection(Systrace.TRACE_TAG_REACT)
        ReactMarker.logMarker(ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_CONSTANTS_END)
      }
    }

    private fun getConstantsForViewManager(
        viewManager: ViewManager<*, *>,
        customDirectEvents: MutableMap<String, Any>,
    ): NativeMap {
      SystraceMessage.beginSection(
              Systrace.TRACE_TAG_REACT,
              "ReactInstance.getConstantsForViewManager",
          )
          .arg("ViewManager", viewManager.name)
          .arg("Lazy", true)
          .flush()
      try {
        val viewManagerConstants: Map<String, Any> =
            UIManagerModuleConstantsHelper.createConstantsForViewManager(
                viewManager,
                null,
                null,
                null,
                customDirectEvents,
            )
        return Arguments.makeNativeMap(viewManagerConstants)
      } finally {
        SystraceMessage.endSection(Systrace.TRACE_TAG_REACT).flush()
      }
    }
  }
}
