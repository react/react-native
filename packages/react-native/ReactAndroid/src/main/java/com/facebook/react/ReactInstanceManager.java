/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import static com.facebook.infer.annotation.ThreadConfined.UI;
import static com.facebook.react.bridge.ReactMarkerConstants.ATTACH_MEASURED_ROOT_VIEWS_END;
import static com.facebook.react.bridge.ReactMarkerConstants.ATTACH_MEASURED_ROOT_VIEWS_START;
import static com.facebook.react.bridge.ReactMarkerConstants.CHANGE_THREAD_PRIORITY;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_VIEW_MANAGERS_END;
import static com.facebook.react.bridge.ReactMarkerConstants.CREATE_VIEW_MANAGERS_START;
import static com.facebook.react.bridge.ReactMarkerConstants.PRE_SETUP_REACT_CONTEXT_END;
import static com.facebook.react.bridge.ReactMarkerConstants.PRE_SETUP_REACT_CONTEXT_START;
import static com.facebook.react.bridge.ReactMarkerConstants.REACT_CONTEXT_THREAD_END;
import static com.facebook.react.bridge.ReactMarkerConstants.REACT_CONTEXT_THREAD_START;
import static com.facebook.react.bridge.ReactMarkerConstants.SETUP_REACT_CONTEXT_END;
import static com.facebook.react.bridge.ReactMarkerConstants.SETUP_REACT_CONTEXT_START;
import static com.facebook.react.bridge.ReactMarkerConstants.VM_INIT;
import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;
import static com.facebook.systrace.Systrace.TRACE_TAG_REACT;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.nfc.NfcAdapter;
import android.os.Bundle;
import android.os.Process;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import com.facebook.common.logging.FLog;
import com.facebook.debug.holder.PrinterHolder;
import com.facebook.debug.tags.ReactDebugOverlayTags;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.infer.annotation.ThreadSafe;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JSExceptionHandler;
import com.facebook.react.bridge.JavaScriptExecutor;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UIManagerProvider;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.common.SurfaceDelegateFactory;
import com.facebook.react.common.annotations.internal.LegacyArchitecture;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel;
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger;
import com.facebook.react.devsupport.DevSupportManagerFactory;
import com.facebook.react.devsupport.ReactInstanceDevHelper;
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener;
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback;
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager;
import com.facebook.react.devsupport.interfaces.RedBoxHandler;
import com.facebook.react.interfaces.TaskInterface;
import com.facebook.react.internal.AndroidChoreographerProvider;
import com.facebook.react.internal.ChoreographerProvider;
import com.facebook.react.modules.appearance.AppearanceModule;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.packagerconnection.RequestHandler;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.ReactRoot;
import com.facebook.react.uimanager.ReactStage;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.imagehelper.ResourceDrawableIdHelper;
import com.facebook.soloader.SoLoader;
import com.facebook.systrace.Systrace;
import com.facebook.systrace.SystraceMessage;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * This class is managing instances of {@link CatalystInstance}. It exposes a way to configure
 * catalyst instance using {@link ReactPackage} and keeps track of the lifecycle of that instance.
 * It also sets up connection between the instance and developers support functionality of the
 * framework.
 *
 * <p>An instance of this manager is required to start JS application in {@link ReactRootView} (see
 * {@link ReactRootView#startReactApplication} for more info).
 *
 * <p>The lifecycle of the instance of {@link ReactInstanceManager} should be bound to the activity
 * that owns the {@link ReactRootView} that is used to render react application using this instance
 * manager (see {@link ReactRootView#startReactApplication}). It's required to pass owning
 * activity's lifecycle events to the instance manager (see {@link #onHostPause}, {@link
 * #onHostDestroy} and {@link #onHostResume}).
 *
 * <p>To instantiate an instance of this class use {@link #builder}.
 */
@ThreadSafe
@LegacyArchitecture
@Deprecated(
    since = "This class is part of Legacy Architecture and will be removed in a future release")
public class ReactInstanceManager {

  static {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "ReactInstanceManager", LegacyArchitectureLogLevel.WARNING);
  }

  private static final String TAG = ReactInstanceManager.class.getSimpleName();

  /**
   * Listener interface for react instance events. This class extends {@Link
   * com.facebook.react.ReactInstanceEventListener} as a mitigation for both bridgeless and OSS
   * compatibility: We create a separate ReactInstanceEventListener class to remove dependency on
   * ReactInstanceManager which is a bridge-specific class, but in the mean time we have to keep
   * ReactInstanceManager.ReactInstanceEventListener so OSS won't break.
   */
  @Deprecated
  public interface ReactInstanceEventListener
      extends com.facebook.react.ReactInstanceEventListener {}

  private final Set<ReactRoot> mAttachedReactRoots = Collections.synchronizedSet(new HashSet<>());

  private volatile LifecycleState mLifecycleState;

  private @Nullable @ThreadConfined(UI) ReactContextInitParams mPendingReactContextInitParams;
  private volatile @Nullable Thread mCreateReactContextThread;
  /* accessed from any thread */
  private final JavaScriptExecutorFactory mJavaScriptExecutorFactory;

  // See {@code ReactInstanceManagerBuilder} for description of all flags here.
  private @Nullable Collection<String> mViewManagerNames = null;
  private final @Nullable JSBundleLoader mBundleLoader;
  private final @Nullable String mJSMainModulePath; /* path to JS bundle root on Metro */
  private final List<ReactPackage> mPackages;
  private final DevSupportManager mDevSupportManager;
  private final boolean mUseDeveloperSupport;
  private final boolean mRequireActivity;
  private final boolean mKeepActivity;
  private final Object mReactContextLock = new Object();
  private @Nullable volatile ReactContext mCurrentReactContext;
  private final Context mApplicationContext;
  private @Nullable @ThreadConfined(UI) DefaultHardwareBackBtnHandler mDefaultBackButtonImpl;
  private @Nullable Activity mCurrentActivity;
  private final Collection<com.facebook.react.ReactInstanceEventListener>
      mReactInstanceEventListeners =
          Collections.synchronizedList(
              new ArrayList<com.facebook.react.ReactInstanceEventListener>());
  // Identifies whether the instance manager is or soon will be initialized (on background thread)
  private volatile boolean mHasStartedCreatingInitialContext = false;
  // Identifies whether the instance manager destroy function is in process,
  // while true any spawned create thread should wait for proper clean up before initializing
  private volatile Boolean mHasStartedDestroying = false;
  private final MemoryPressureRouter mMemoryPressureRouter;
  private final @Nullable JSExceptionHandler mJSExceptionHandler;
  private final @Nullable UIManagerProvider mUIManagerProvider;
  private final @Nullable ReactPackageTurboModuleManagerDelegate.Builder mTMMDelegateBuilder;
  private List<ViewManager> mViewManagers;
  private boolean mUseFallbackBundle = true;
  private volatile boolean mInstanceManagerInvalidated = false;

  private static class ReactContextInitParams {
    private final JavaScriptExecutorFactory mJsExecutorFactory;
    private final JSBundleLoader mJsBundleLoader;

    public ReactContextInitParams(
        JavaScriptExecutorFactory jsExecutorFactory, JSBundleLoader jsBundleLoader) {
      mJsExecutorFactory = Assertions.assertNotNull(jsExecutorFactory);
      mJsBundleLoader = Assertions.assertNotNull(jsBundleLoader);
    }

    public JavaScriptExecutorFactory getJsExecutorFactory() {
      return mJsExecutorFactory;
    }

    public JSBundleLoader getJsBundleLoader() {
      return mJsBundleLoader;
    }
  }

  /** Creates a builder that is capable of creating an instance of {@link ReactInstanceManager}. */
  public static ReactInstanceManagerBuilder builder() {
    return new ReactInstanceManagerBuilder();
  }

  /**
   * @noinspection deprecation
   */
  /* package */ ReactInstanceManager(
      Context applicationContext,
      @Nullable Activity currentActivity,
      @Nullable DefaultHardwareBackBtnHandler defaultHardwareBackBtnHandler,
      JavaScriptExecutorFactory javaScriptExecutorFactory,
      @Nullable JSBundleLoader bundleLoader,
      @Nullable String jsMainModulePath,
      List<ReactPackage> packages,
      boolean useDeveloperSupport,
      DevSupportManagerFactory devSupportManagerFactory,
      boolean requireActivity,
      boolean keepActivity,
      LifecycleState initialLifecycleState,
      JSExceptionHandler jSExceptionHandler,
      @Nullable RedBoxHandler redBoxHandler,
      boolean lazyViewManagersEnabled,
      @Nullable DevBundleDownloadListener devBundleDownloadListener,
      int minNumShakes,
      int minTimeLeftInFrameForNonBatchedOperationMs,
      @Nullable UIManagerProvider uIManagerProvider,
      @Nullable Map<String, RequestHandler> customPackagerCommandHandlers,
      @Nullable ReactPackageTurboModuleManagerDelegate.Builder tmmDelegateBuilder,
      @Nullable SurfaceDelegateFactory surfaceDelegateFactory,
      @Nullable DevLoadingViewManager devLoadingViewManager,
      @Nullable ChoreographerProvider choreographerProvider,
      @Nullable PausedInDebuggerOverlayManager pausedInDebuggerOverlayManager) {
    FLog.d(TAG, "ReactInstanceManager.ctor()");
    initializeSoLoaderIfNecessary(applicationContext);

    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(applicationContext);

    // See {@code ReactInstanceManagerBuilder} for description of all flags here.
    mApplicationContext = applicationContext;
    mCurrentActivity = currentActivity;
    mDefaultBackButtonImpl = defaultHardwareBackBtnHandler;
    mJavaScriptExecutorFactory = javaScriptExecutorFactory;
    mBundleLoader = bundleLoader;
    mJSMainModulePath = jsMainModulePath;
    mPackages = new ArrayList<>();
    mUseDeveloperSupport = useDeveloperSupport;
    mRequireActivity = requireActivity;
    mKeepActivity = keepActivity;
    Systrace.beginSection(TRACE_TAG_REACT, "ReactInstanceManager.initDevSupportManager");
    mDevSupportManager =
        devSupportManagerFactory.create(
            applicationContext,
            createDevHelperInterface(),
            mJSMainModulePath,
            useDeveloperSupport,
            redBoxHandler,
            devBundleDownloadListener,
            minNumShakes,
            customPackagerCommandHandlers,
            surfaceDelegateFactory,
            devLoadingViewManager,
            pausedInDebuggerOverlayManager);
    Systrace.endSection(TRACE_TAG_REACT);
    mLifecycleState = initialLifecycleState;
    mMemoryPressureRouter = new MemoryPressureRouter(applicationContext);
    mJSExceptionHandler = jSExceptionHandler;
    mTMMDelegateBuilder = tmmDelegateBuilder;
    synchronized (mPackages) {
      PrinterHolder.getPrinter()
          .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: Use Split Packages");
      if (mUseDeveloperSupport) {
        mPackages.add(new DebugCorePackage());
      }
      mPackages.addAll(packages);
    }
    mUIManagerProvider = uIManagerProvider;

    // Instantiate ReactChoreographer in UI thread.
    ReactChoreographer.initialize(
        choreographerProvider != null
            ? choreographerProvider
            : AndroidChoreographerProvider.getInstance());
    if (mUseDeveloperSupport) {
      mDevSupportManager.startInspector();
    }

    // Legacy architecture of React Native is deprecated and can't be initialized anymore.
    // More details on:
    // https://github.com/react-native-community/discussions-and-proposals/blob/nc/legacy-arch-removal/proposals/0929-legacy-architecture-removal.md
    throw new UnsupportedOperationException(
        "ReactInstanceManager.createReactContext is unsupported.");
  }

  private ReactInstanceDevHelper createDevHelperInterface() {
    return new ReactInstanceDevHelper() {
      @Override
      public void onJSBundleLoadedFromServer() {
        ReactInstanceManager.this.onJSBundleLoadedFromServer();
      }

      @Override
      public void toggleElementInspector() {
        ReactInstanceManager.this.toggleElementInspector();
      }

      @Override
      public @Nullable Activity getCurrentActivity() {
        return ReactInstanceManager.this.mCurrentActivity;
      }

      @Override
      public JavaScriptExecutorFactory getJavaScriptExecutorFactory() {
        return ReactInstanceManager.this.getJSExecutorFactory();
      }

      @Override
      public @Nullable View createRootView(String appKey) {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
          ReactRootView rootView = new ReactRootView(currentActivity);
          rootView.startReactApplication(ReactInstanceManager.this, appKey, new Bundle());
          return rootView;
        }

        return null;
      }

      @Override
      public void destroyRootView(View rootView) {
        if (rootView instanceof ReactRootView) {
          ((ReactRootView) rootView).unmountReactApplication();
        }
      }

      @Override
      public void reload(String reason) {
        // no-op not implemented for Bridge Mode
      }

      @Override
      public TaskInterface<Boolean> loadBundle(JSBundleLoader bundleLoader) {
        // no-op not implemented for Bridge Mode
        return null;
      }

      @Override
      public ReactContext getCurrentReactContext() {
        // no-op not implemented for Bridge Mode
        return null;
      }
    };
  }

  public synchronized void setUseFallbackBundle(boolean useFallbackBundle) {
    mUseFallbackBundle = useFallbackBundle;
  }

  private JavaScriptExecutorFactory getJSExecutorFactory() {
    return mJavaScriptExecutorFactory;
  }

  public DevSupportManager getDevSupportManager() {
    return mDevSupportManager;
  }

  public MemoryPressureRouter getMemoryPressureRouter() {
    return mMemoryPressureRouter;
  }

  public List<ReactPackage> getPackages() {
    return new ArrayList<>(mPackages);
  }

  public void handleCxxError(Exception e) {
    mDevSupportManager.handleException(e);
  }

  static void initializeSoLoaderIfNecessary(Context applicationContext) {
    // Call SoLoader.initialize here, this is required for apps that does not use exopackage and
    // does not use SoLoader for loading other native code except from the one used by React Native
    // This way we don't need to require others to have additional initialization code and to
    // subclass android.app.Application.

    // Method SoLoader.init is idempotent, so if you wish to use native exopackage, just call
    // SoLoader.init with appropriate args before initializing ReactInstanceManager
    SoLoader.init(applicationContext, /* native exopackage */ false);
  }

  /**
   * Trigger react context initialization asynchronously in a background async task. This enables
   * applications to pre-load the application JS, and execute global code before {@link
   * ReactRootView} is available and measured.
   *
   * <p>Called from UI thread.
   */
  @ThreadConfined(UI)
  public void createReactContextInBackground() {
    FLog.d(TAG, "ReactInstanceManager.createReactContextInBackground()");
    UiThreadUtil
        .assertOnUiThread(); // Assert before setting mHasStartedCreatingInitialContext = true
    if (!mHasStartedCreatingInitialContext) {
      mHasStartedCreatingInitialContext = true;
      recreateReactContextInBackgroundInner();
    }
  }

  /**
   * Recreate the react application and context. This should be called if configuration has changed
   * or the developer has requested the app to be reloaded. It should only be called after an
   * initial call to createReactContextInBackground.
   *
   * <p>Called from UI thread.
   */
  @ThreadConfined(UI)
  public void recreateReactContextInBackground() {
    Assertions.assertCondition(
        mHasStartedCreatingInitialContext,
        "recreateReactContextInBackground should only be called after the initial "
            + "createReactContextInBackground call.");
    recreateReactContextInBackgroundInner();
  }

  @ThreadConfined(UI)
  private void recreateReactContextInBackgroundInner() {
    FLog.d(TAG, "ReactInstanceManager.recreateReactContextInBackgroundInner()");
    PrinterHolder.getPrinter()
        .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: recreateReactContextInBackground");
    UiThreadUtil.assertOnUiThread();

    if (mUseDeveloperSupport && mJSMainModulePath != null) {
      if (!Systrace.isTracing(TRACE_TAG_REACT)) {
        if (mBundleLoader == null) {
          mDevSupportManager.handleReloadJS();
        } else {
          mDevSupportManager.isPackagerRunning(
              new PackagerStatusCallback() {
                @Override
                public void onPackagerStatusFetched(final boolean packagerIsRunning) {
                  UiThreadUtil.runOnUiThread(
                      () -> {
                        // ReactInstanceManager is no longer valid, ignore callback
                        if (mInstanceManagerInvalidated) {
                          return;
                        }

                        if (packagerIsRunning) {
                          mDevSupportManager.handleReloadJS();
                        } else if (mDevSupportManager.hasUpToDateJSBundleInCache()
                            && !mUseFallbackBundle) {
                          // If there is a up-to-date bundle downloaded from server,
                          // with remote JS debugging disabled, always use that.
                          onJSBundleLoadedFromServer();
                        } else {
                          recreateReactContextInBackgroundFromBundleLoader();
                        }
                      });
                }
              });
        }
        return;
      }
    }

    recreateReactContextInBackgroundFromBundleLoader();
  }

  @ThreadConfined(UI)
  private void recreateReactContextInBackgroundFromBundleLoader() {
    FLog.d(TAG, "ReactInstanceManager.recreateReactContextInBackgroundFromBundleLoader()");
    PrinterHolder.getPrinter()
        .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from BundleLoader");
    recreateReactContextInBackground(mJavaScriptExecutorFactory, mBundleLoader);
  }

  /**
   * @return whether createReactContextInBackground has been called. Will return false after
   *     onDestroy until a new initial context has been created.
   */
  public boolean hasStartedCreatingInitialContext() {
    return mHasStartedCreatingInitialContext;
  }

  /**
   * This method will give JS the opportunity to consume the back button event. If JS does not
   * consume the event, mDefaultBackButtonImpl will be invoked at the end of the round trip to JS.
   */
  public void onBackPressed() {
    UiThreadUtil.assertOnUiThread();
    ReactContext reactContext = mCurrentReactContext;
    if (reactContext == null) {
      // Invoke without round trip to JS.
      FLog.w(TAG, "Instance detached from instance manager");
      invokeDefaultOnBackPressed();
    } else {
      DeviceEventManagerModule deviceEventManagerModule =
          reactContext.getNativeModule(DeviceEventManagerModule.class);
      if (deviceEventManagerModule != null) {
        deviceEventManagerModule.emitHardwareBackPressed();
      }
    }
  }

  private void invokeDefaultOnBackPressed() {
    UiThreadUtil.assertOnUiThread();
    if (mDefaultBackButtonImpl != null) {
      mDefaultBackButtonImpl.invokeDefaultOnBackPressed();
    }
  }

  /** This method will give JS the opportunity to receive intents via Linking. */
  @ThreadConfined(UI)
  public void onNewIntent(Intent intent) {
    UiThreadUtil.assertOnUiThread();
    ReactContext currentContext = getCurrentReactContext();
    if (currentContext == null) {
      FLog.w(TAG, "Instance detached from instance manager");
    } else {
      String action = intent.getAction();
      Uri uri = intent.getData();

      if (uri != null
          && (Intent.ACTION_VIEW.equals(action)
              || NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action))) {
        DeviceEventManagerModule deviceEventManagerModule =
            currentContext.getNativeModule(DeviceEventManagerModule.class);
        if (deviceEventManagerModule != null) {
          deviceEventManagerModule.emitNewIntentReceived(uri);
        }
      }
      currentContext.onNewIntent(mCurrentActivity, intent);
    }
  }

  private void toggleElementInspector() {
    ReactContext currentContext = getCurrentReactContext();
    if (currentContext != null && currentContext.hasActiveReactInstance()) {
      currentContext.emitDeviceEvent("toggleElementInspector");
    } else {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new ReactNoCrashSoftException(
              "Cannot toggleElementInspector, CatalystInstance not available"));
    }
  }

  /**
   * Call this from {@link Activity#onPause()}. This notifies any listening modules so they can do
   * any necessary cleanup.
   *
   * @deprecated Use {@link #onHostPause(Activity)} instead.
   */
  @ThreadConfined(UI)
  @Deprecated
  public void onHostPause() {
    UiThreadUtil.assertOnUiThread();

    mDefaultBackButtonImpl = null;
    if (mUseDeveloperSupport) {
      mDevSupportManager.setDevSupportEnabled(false);
    }

    moveToBeforeResumeLifecycleState();
  }

  /**
   * This method should be called from {@link Activity#onUserLeaveHint()}. It notifies all listening
   * modules that the user is about to leave the activity. The passed Activity is has to be the
   * current Activity.
   *
   * @param activity the activity being backgrounded as a result of user action
   */
  @ThreadConfined(UI)
  public void onUserLeaveHint(@Nullable Activity activity) {
    if (mCurrentActivity != null && activity == mCurrentActivity) {
      UiThreadUtil.assertOnUiThread();

      ReactContext currentContext = getCurrentReactContext();
      if (currentContext != null) {
        currentContext.onUserLeaveHint(activity);
      }
    }
  }

  /**
   * Call this from {@link Activity#onPause()}. This notifies any listening modules so they can do
   * any necessary cleanup. The passed Activity is the current Activity being paused. This is
   * expected to be the foreground activity that would be returned by {@link
   * ReactContext#getCurrentActivity()}. If the passed activity does not match the current activity,
   * a warning will be logged instead of crashing.
   *
   * @param activity the activity being paused
   */
  @SuppressLint("ReflectionMethodUse")
  @ThreadConfined(UI)
  public void onHostPause(@Nullable Activity activity) {
    if (mRequireActivity) {
      if (mCurrentActivity == null) {
        String message = "ReactInstanceManager.onHostPause called with null activity";
        FLog.e(TAG, message);
        StackTraceElement[] stackTrace = Thread.currentThread().getStackTrace();
        for (StackTraceElement element : stackTrace) {
          FLog.e(TAG, element.toString());
        }
      }
      Assertions.assertCondition(mCurrentActivity != null);
    }
    if (mCurrentActivity != null && activity != mCurrentActivity) {
      FLog.w(
          TAG,
          "Pausing an activity that is not the current activity, this is incorrect! "
              + "Current activity: "
              + mCurrentActivity.getClass().getSimpleName()
              + " "
              + "Paused activity: "
              + (activity == null ? "null" : activity.getClass().getSimpleName()));
    }
    onHostPause();
  }

  /**
   * Use this method when the activity resumes to enable invoking the back button directly from JS.
   *
   * <p>This method retains an instance to provided mDefaultBackButtonImpl. Thus it's important to
   * pass from the activity instance that owns this particular instance of {@link
   * ReactInstanceManager}, so that once this instance receive {@link #onHostDestroy} event it will
   * clear the reference to that defaultBackButtonImpl.
   *
   * @param defaultBackButtonImpl a {@link DefaultHardwareBackBtnHandler} from an Activity that owns
   *     this instance of {@link ReactInstanceManager}.
   */
  @ThreadConfined(UI)
  public void onHostResume(
      @Nullable Activity activity, DefaultHardwareBackBtnHandler defaultBackButtonImpl) {
    UiThreadUtil.assertOnUiThread();

    mDefaultBackButtonImpl = defaultBackButtonImpl;
    onHostResume(activity);
  }

  /** Use this method when the activity resumes. */
  @ThreadConfined(UI)
  public void onHostResume(@Nullable Activity activity) {
    UiThreadUtil.assertOnUiThread();

    mCurrentActivity = activity;

    if (mUseDeveloperSupport) {
      // Resume can be called from one of three different states:
      // a) when activity was paused
      // b) when activity has just been created
      // c) when there is no activity
      // In case of (a) the activity is attached to window and it is ok to add new views to it or
      // open dialogs. In case of (b) there is often a slight delay before such a thing happens.
      // As dev support manager can add views or open dialogs immediately after it gets enabled
      // (e.g. in the case when JS bundle is being fetched in background) we only want to enable
      // it once we know for sure the current activity is attached.
      // We want to enable the various devsupport tools in case of (c) even without any activity

      if (mCurrentActivity != null) {
        // We check if activity is attached to window by checking if decor view is attached
        final View decorView = mCurrentActivity.getWindow().getDecorView();
        if (!ViewCompat.isAttachedToWindow(decorView)) {
          decorView.addOnAttachStateChangeListener(
              new View.OnAttachStateChangeListener() {
                @Override
                public void onViewAttachedToWindow(View v) {
                  // we can drop listener now that we know the view is attached
                  decorView.removeOnAttachStateChangeListener(this);
                  mDevSupportManager.setDevSupportEnabled(true);
                }

                @Override
                public void onViewDetachedFromWindow(View v) {
                  // do nothing
                }
              });
        } else {
          // activity is attached to window, we can enable dev support immediately
          mDevSupportManager.setDevSupportEnabled(true);
        }
      } else if (!mRequireActivity) {
        // there is no activity, but we can enable dev support
        mDevSupportManager.setDevSupportEnabled(true);
      }
    }

    moveToResumedLifecycleState(false);
  }

  /**
   * Call this from {@link Activity#onDestroy()}. This notifies any listening modules so they can do
   * any necessary cleanup.
   *
   * @deprecated use {@link #onHostDestroy(Activity)} instead
   */
  @ThreadConfined(UI)
  @Deprecated
  public void onHostDestroy() {
    UiThreadUtil.assertOnUiThread();

    if (mUseDeveloperSupport) {
      mDevSupportManager.setDevSupportEnabled(false);
    }

    moveToBeforeCreateLifecycleState();
    if (!mKeepActivity) {
      mCurrentActivity = null;
    }
  }

  /**
   * Call this from {@link Activity#onDestroy()}. This notifies any listening modules so they can do
   * any necessary cleanup. If the activity being destroyed is not the current activity, no modules
   * are notified.
   *
   * @param activity the activity being destroyed
   */
  @ThreadConfined(UI)
  public void onHostDestroy(@Nullable Activity activity) {
    // In some cases, Activity may (correctly) be null.
    // See mRequireActivity flag.
    if (activity == mCurrentActivity) {
      onHostDestroy();
    }
  }

  /** Temporary: due to T67035147, log sources of destroy calls. TODO T67035147: delete */
  private void logOnDestroy() {
    FLog.d(
        TAG,
        "ReactInstanceManager.destroy called",
        new RuntimeException("ReactInstanceManager.destroy called"));
  }

  /** Destroy this React instance and the attached JS context. */
  @ThreadConfined(UI)
  public void destroy() {
    UiThreadUtil.assertOnUiThread();
    PrinterHolder.getPrinter().logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: Destroy");

    logOnDestroy();

    if (mHasStartedDestroying) {
      FLog.e(
          ReactConstants.TAG, "ReactInstanceManager.destroy called: bail out, already destroying");
      return;
    }

    mHasStartedDestroying = true;

    if (mUseDeveloperSupport) {
      mDevSupportManager.setDevSupportEnabled(false);
      mDevSupportManager.stopInspector();
    }

    moveToBeforeCreateLifecycleState();
    mMemoryPressureRouter.destroy(mApplicationContext);

    mCreateReactContextThread = null;
    synchronized (mAttachedReactRoots) {
      synchronized (mReactContextLock) {
        if (mCurrentReactContext != null) {
          for (ReactRoot reactRoot : mAttachedReactRoots) {
            detachRootViewFromInstance(reactRoot, mCurrentReactContext);
          }

          mCurrentReactContext.destroy();
          mCurrentReactContext = null;
        }
      }
    }

    mHasStartedCreatingInitialContext = false;
    if (!mKeepActivity) {
      mCurrentActivity = null;
    }

    ResourceDrawableIdHelper.getInstance().clear();

    mHasStartedDestroying = false;
    synchronized (mHasStartedDestroying) {
      mHasStartedDestroying.notifyAll();
    }
    synchronized (mPackages) {
      mViewManagerNames = null;
    }
    FLog.d(ReactConstants.TAG, "ReactInstanceManager has been destroyed");
  }

  private synchronized void moveToResumedLifecycleState(boolean force) {
    ReactContext currentContext = getCurrentReactContext();
    if (currentContext != null) {
      // we currently don't have an onCreate callback so we call onResume for both transitions
      if (force
          || mLifecycleState == LifecycleState.BEFORE_RESUME
          || mLifecycleState == LifecycleState.BEFORE_CREATE) {
        currentContext.onHostResume(mCurrentActivity);
      }
    }
    mLifecycleState = LifecycleState.RESUMED;
  }

  private synchronized void moveToBeforeResumeLifecycleState() {
    ReactContext currentContext = getCurrentReactContext();
    if (currentContext != null) {
      if (mLifecycleState == LifecycleState.BEFORE_CREATE) {
        currentContext.onHostResume(mCurrentActivity);
        currentContext.onHostPause();
      } else if (mLifecycleState == LifecycleState.RESUMED) {
        currentContext.onHostPause();
      }
    }
    mLifecycleState = LifecycleState.BEFORE_RESUME;
  }

  private synchronized void moveToBeforeCreateLifecycleState() {
    ReactContext currentContext = getCurrentReactContext();
    if (currentContext != null) {
      if (mLifecycleState == LifecycleState.RESUMED) {
        currentContext.onHostPause();
        mLifecycleState = LifecycleState.BEFORE_RESUME;
      }
      if (mLifecycleState == LifecycleState.BEFORE_RESUME) {
        currentContext.onHostDestroy(mKeepActivity);
      }
    }
    mLifecycleState = LifecycleState.BEFORE_CREATE;
  }

  private synchronized void moveReactContextToCurrentLifecycleState() {
    if (mLifecycleState == LifecycleState.RESUMED) {
      moveToResumedLifecycleState(true);
    }
  }

  @ThreadConfined(UI)
  public void onActivityResult(
      Activity activity, int requestCode, int resultCode, @Nullable Intent data) {
    ReactContext currentContext = getCurrentReactContext();
    if (currentContext != null) {
      currentContext.onActivityResult(activity, requestCode, resultCode, data);
    }
  }

  @ThreadConfined(UI)
  public void onWindowFocusChange(boolean hasFocus) {
    UiThreadUtil.assertOnUiThread();
    ReactContext currentContext = getCurrentReactContext();
    if (currentContext != null) {
      currentContext.onWindowFocusChange(hasFocus);
    }
  }

  /** Call this from {@link Activity#onConfigurationChanged()}. */
  @ThreadConfined(UI)
  public void onConfigurationChanged(Context updatedContext, @Nullable Configuration newConfig) {
    UiThreadUtil.assertOnUiThread();

    ReactContext currentReactContext = getCurrentReactContext();
    if (currentReactContext != null) {
      AppearanceModule appearanceModule =
          currentReactContext.getNativeModule(AppearanceModule.class);

      if (appearanceModule != null) {
        appearanceModule.onConfigurationChanged(updatedContext);
      }
    }
  }

  @ThreadConfined(UI)
  public void showDevOptionsDialog() {
    UiThreadUtil.assertOnUiThread();
    mDevSupportManager.showDevOptionsDialog();
  }

  @ThreadConfined(UI)
  private void clearReactRoot(ReactRoot reactRoot) {
    UiThreadUtil.assertOnUiThread();
    reactRoot.getState().compareAndSet(ReactRoot.STATE_STARTED, ReactRoot.STATE_STOPPED);
    ViewGroup rootViewGroup = reactRoot.getRootViewGroup();
    rootViewGroup.removeAllViews();
    rootViewGroup.setId(View.NO_ID);
  }

  /**
   * Attach given {@param reactRoot} to a catalyst instance manager and start JS application using
   * JS module provided by {@link ReactRootView#getJSModuleName}. If the react context is currently
   * being (re)-created, or if react context has not been created yet, the JS application associated
   * with the provided reactRoot reactRoot will be started asynchronously, i.e this method won't
   * block. This reactRoot will then be tracked by this manager and in case of catalyst instance
   * restart it will be re-attached.
   *
   * @deprecated This method should be internal to ReactRootView and ReactInstanceManager
   */
  @Deprecated
  @ThreadConfined(UI)
  public void attachRootView(ReactRoot reactRoot) {
    UiThreadUtil.assertOnUiThread();
    synchronized (mAttachedReactRoots) {
      // Calling clearReactRoot is necessary to initialize the Id on reactRoot
      // This is necessary independently if the RN Bridge has been initialized or not.
      // Ideally reactRoot should be initialized with id == NO_ID
      if (mAttachedReactRoots.add(reactRoot)) {
        clearReactRoot(reactRoot);
      } else {
        FLog.e(ReactConstants.TAG, "ReactRoot was attached multiple times");
      }

      // If react context is being created in the background, JS application will be started
      // automatically when creation completes, as reactRoot is part of the attached
      // reactRoot list.
      ReactContext currentContext = getCurrentReactContext();
      if (mCreateReactContextThread == null && currentContext != null) {
        attachRootViewToInstance(reactRoot);
      }
    }
  }

  /**
   * Detach given {@param reactRoot} from current catalyst instance. It's safe to call this method
   * multiple times on the same {@param reactRoot} - in that case view will be detached with the
   * first call.
   *
   * @deprecated This method should be internal to ReactRootView and ReactInstanceManager
   */
  @Deprecated
  @ThreadConfined(UI)
  public void detachRootView(ReactRoot reactRoot) {
    UiThreadUtil.assertOnUiThread();
    if (!mAttachedReactRoots.remove(reactRoot)) {
      return;
    }

    ReactContext reactContext = mCurrentReactContext;
    if (reactContext != null && reactContext.hasActiveReactInstance()) {
      detachRootViewFromInstance(reactRoot, reactContext);
    }
  }

  /** Uses configured {@link ReactPackage} instances to create all view managers. */
  public List<ViewManager> getOrCreateViewManagers(
      ReactApplicationContext catalystApplicationContext) {
    ReactMarker.logMarker(CREATE_VIEW_MANAGERS_START);
    Systrace.beginSection(TRACE_TAG_REACT, "createAllViewManagers");
    try {
      if (mViewManagers == null) {
        synchronized (mPackages) {
          if (mViewManagers == null) {
            ArrayList<ViewManager> viewManagers = new ArrayList<>();
            for (ReactPackage reactPackage : mPackages) {
              viewManagers.addAll(reactPackage.createViewManagers(catalystApplicationContext));
            }
            mViewManagers = viewManagers;
            return mViewManagers;
          }
        }
      }
      return mViewManagers;
    } finally {
      Systrace.endSection(TRACE_TAG_REACT);
      ReactMarker.logMarker(CREATE_VIEW_MANAGERS_END);
    }
  }

  public @Nullable ViewManager createViewManager(String viewManagerName) {
    ReactApplicationContext context;
    synchronized (mReactContextLock) {
      context = (ReactApplicationContext) getCurrentReactContext();
      if (context == null || !context.hasActiveReactInstance()) {
        return null;
      }
    }

    synchronized (mPackages) {
      for (ReactPackage reactPackage : mPackages) {
        if (reactPackage instanceof ViewManagerOnDemandReactPackage) {
          ViewManager viewManager =
              ((ViewManagerOnDemandReactPackage) reactPackage)
                  .createViewManager(context, viewManagerName);
          if (viewManager != null) {
            return viewManager;
          }
        }
      }
    }
    return null;
  }

  public Collection<String> getViewManagerNames() {
    Systrace.beginSection(TRACE_TAG_REACT, "ReactInstanceManager.getViewManagerNames");
    try {
      Collection<String> viewManagerNames = mViewManagerNames;
      if (viewManagerNames != null) {
        return viewManagerNames;
      }
      ReactApplicationContext context;
      synchronized (mReactContextLock) {
        context = (ReactApplicationContext) getCurrentReactContext();
        if (context == null || !context.hasActiveReactInstance()) {
          FLog.w(ReactConstants.TAG, "Calling getViewManagerNames without active context");
          return Collections.emptyList();
        }
      }

      synchronized (mPackages) {
        if (mViewManagerNames == null) {
          Set<String> uniqueNames = new HashSet<>();
          for (ReactPackage reactPackage : mPackages) {
            SystraceMessage.beginSection(TRACE_TAG_REACT, "ReactInstanceManager.getViewManagerName")
                .arg("Package", reactPackage.getClass().getSimpleName())
                .flush();
            if (reactPackage instanceof ViewManagerOnDemandReactPackage) {
              Collection<String> names =
                  ((ViewManagerOnDemandReactPackage) reactPackage).getViewManagerNames(context);
              // When converting this class to Kotlin, you need to retain this null check
              // or wrap around a try/catch otherwise this will cause a crash for OSS libraries
              // that are not migrated to Kotlin yet and are returning null for
              // `getViewManagerNames`
              if (names != null) {
                uniqueNames.addAll(names);
              }
            } else {
              FLog.w(
                  ReactConstants.TAG,
                  "Package %s is not a ViewManagerOnDemandReactPackage, view managers will not be"
                      + " loaded",
                  reactPackage.getClass().getSimpleName());
            }
            Systrace.endSection(TRACE_TAG_REACT);
          }
          mViewManagerNames = uniqueNames;
        }
        return mViewManagerNames;
      }
    } finally {
      Systrace.endSection(TRACE_TAG_REACT);
    }
  }

  /** Add a listener to be notified of react instance events. */
  public void addReactInstanceEventListener(
      com.facebook.react.ReactInstanceEventListener listener) {
    mReactInstanceEventListeners.add(listener);
  }

  /** Remove a listener previously added with {@link #addReactInstanceEventListener}. */
  public void removeReactInstanceEventListener(
      com.facebook.react.ReactInstanceEventListener listener) {
    mReactInstanceEventListeners.remove(listener);
  }

  /**
   * @return current ReactApplicationContext
   */
  public @Nullable ReactContext getCurrentReactContext() {
    synchronized (mReactContextLock) {
      return mCurrentReactContext;
    }
  }

  public LifecycleState getLifecycleState() {
    return mLifecycleState;
  }

  public String getJsExecutorName() {
    return mJavaScriptExecutorFactory.toString();
  }

  /**
   * Permanently destroys the ReactInstanceManager, including the CatalystInstance (if any). The
   * application MUST NOT call any further methods on an invalidated ReactInstanceManager.
   *
   * <p>Applications where the ReactInstanceManager may be destroyed before the end of the process
   * SHOULD call invalidate() before releasing the reference to the ReactInstanceManager, to ensure
   * resources are freed in a timely manner.
   *
   * <p>NOTE: This method is designed for complex integrations. Integrators MAY instead hold a
   * long-lived reference to a single ReactInstanceManager for the lifetime of the Application,
   * without ever calling invalidate(). This is explicitly allowed.
   */
  @ThreadConfined(UI)
  public void invalidate() {
    FLog.d(ReactConstants.TAG, "ReactInstanceManager.invalidate()");
    mInstanceManagerInvalidated = true;
    destroy();
  }

  @ThreadConfined(UI)
  private void onJSBundleLoadedFromServer() {
    FLog.d(ReactConstants.TAG, "ReactInstanceManager.onJSBundleLoadedFromServer()");

    JSBundleLoader bundleLoader =
        JSBundleLoader.createCachedBundleFromNetworkLoader(
            mDevSupportManager.getSourceUrl(), mDevSupportManager.getDownloadedJSBundleFile());

    recreateReactContextInBackground(mJavaScriptExecutorFactory, bundleLoader);
  }

  @ThreadConfined(UI)
  private void recreateReactContextInBackground(
      JavaScriptExecutorFactory jsExecutorFactory, JSBundleLoader jsBundleLoader) {
    FLog.d(ReactConstants.TAG, "ReactInstanceManager.recreateReactContextInBackground()");
    UiThreadUtil.assertOnUiThread();

    final ReactContextInitParams initParams =
        new ReactContextInitParams(jsExecutorFactory, jsBundleLoader);
    if (mCreateReactContextThread == null) {
      runCreateReactContextOnNewThread(initParams);
    } else {
      mPendingReactContextInitParams = initParams;
    }
  }

  @ThreadConfined(UI)
  private void runCreateReactContextOnNewThread(final ReactContextInitParams initParams) {
    FLog.d(ReactConstants.TAG, "ReactInstanceManager.runCreateReactContextOnNewThread()");
    UiThreadUtil.assertOnUiThread();
    Assertions.assertCondition(
        !mInstanceManagerInvalidated,
        "Cannot create a new React context on an invalidated ReactInstanceManager");

    // Mark start of bridge loading
    ReactMarker.logMarker(ReactMarkerConstants.REACT_BRIDGE_LOADING_START);
    synchronized (mAttachedReactRoots) {
      synchronized (mReactContextLock) {
        if (mCurrentReactContext != null) {
          tearDownReactContext(mCurrentReactContext);
          mCurrentReactContext = null;
        }
      }
    }

    mCreateReactContextThread =
        new Thread(
            null,
            () -> {
              ReactMarker.logMarker(REACT_CONTEXT_THREAD_END);
              synchronized (ReactInstanceManager.this.mHasStartedDestroying) {
                while (ReactInstanceManager.this.mHasStartedDestroying) {
                  try {
                    ReactInstanceManager.this.mHasStartedDestroying.wait();
                  } catch (InterruptedException e) {
                    // Interrupted while waiting for destruction to complete, just retry
                    continue;
                  }
                }
              }
              // As destroy() may have run and set this to false, ensure that it is true before we
              // create
              mHasStartedCreatingInitialContext = true;

              final ReactApplicationContext reactApplicationContext;
              try {
                Process.setThreadPriority(Process.THREAD_PRIORITY_DISPLAY);
                ReactMarker.logMarker(VM_INIT);
                reactApplicationContext =
                    createReactContext(
                        initParams.getJsExecutorFactory().create(), initParams.getJsBundleLoader());
              } catch (Exception e) {
                // Reset state and bail out. This lets us try again later.
                mHasStartedCreatingInitialContext = false;
                mCreateReactContextThread = null;
                mDevSupportManager.handleException(e);
                return;
              }
              try {
                mCreateReactContextThread = null;
                ReactMarker.logMarker(PRE_SETUP_REACT_CONTEXT_START);
                final Runnable maybeRecreateReactContextRunnable =
                    () -> {
                      if (mPendingReactContextInitParams != null) {
                        runCreateReactContextOnNewThread(mPendingReactContextInitParams);
                        mPendingReactContextInitParams = null;
                      }
                    };
                Runnable setupReactContextRunnable =
                    () -> {
                      try {
                        setupReactContext(reactApplicationContext);
                      } catch (Exception e) {
                        mDevSupportManager.handleException(e);
                      }
                    };

                reactApplicationContext.runOnNativeModulesQueueThread(setupReactContextRunnable);
                UiThreadUtil.runOnUiThread(maybeRecreateReactContextRunnable);
              } catch (Exception e) {
                mDevSupportManager.handleException(e);
              }
            },
            "create_react_context");
    ReactMarker.logMarker(REACT_CONTEXT_THREAD_START);
    mCreateReactContextThread.start();
  }

  private void setupReactContext(final ReactApplicationContext reactContext) {
    FLog.d(ReactConstants.TAG, "ReactInstanceManager.setupReactContext()");
    ReactMarker.logMarker(PRE_SETUP_REACT_CONTEXT_END);
    ReactMarker.logMarker(SETUP_REACT_CONTEXT_START);
    Systrace.beginSection(TRACE_TAG_REACT, "setupReactContext");
    synchronized (mAttachedReactRoots) {
      synchronized (mReactContextLock) {
        mCurrentReactContext = Assertions.assertNotNull(reactContext);
      }

      CatalystInstance catalystInstance =
          Assertions.assertNotNull(reactContext.getCatalystInstance());

      catalystInstance.initialize();

      mDevSupportManager.onNewReactContextCreated(reactContext);
      mMemoryPressureRouter.addMemoryPressureListener(catalystInstance);

      ReactMarker.logMarker(ATTACH_MEASURED_ROOT_VIEWS_START);
      for (ReactRoot reactRoot : mAttachedReactRoots) {
        attachRootViewToInstance(reactRoot);
      }
      ReactMarker.logMarker(ATTACH_MEASURED_ROOT_VIEWS_END);
    }

    // There is a race condition here - `finalListeners` can contain null entries
    // See usage below for more details.
    com.facebook.react.ReactInstanceEventListener[] listeners =
        new com.facebook.react.ReactInstanceEventListener[mReactInstanceEventListeners.size()];
    final com.facebook.react.ReactInstanceEventListener[] finalListeners =
        mReactInstanceEventListeners.toArray(listeners);

    UiThreadUtil.runOnUiThread(
        () -> {
          moveReactContextToCurrentLifecycleState();

          for (com.facebook.react.ReactInstanceEventListener listener : finalListeners) {
            // Sometimes this listener is null - probably due to race
            // condition between allocating listeners with a certain
            // size, and getting a `final` version of the array on
            // the following line.
            if (listener != null) {
              listener.onReactContextInitialized(reactContext);
            }
          }
        });
    reactContext.runOnJSQueueThread(
        () -> {
          Process.setThreadPriority(Process.THREAD_PRIORITY_DEFAULT);
          ReactMarker.logMarker(CHANGE_THREAD_PRIORITY, "js_default");
        });
    reactContext.runOnNativeModulesQueueThread(
        () -> Process.setThreadPriority(Process.THREAD_PRIORITY_DEFAULT));

    Systrace.endSection(TRACE_TAG_REACT);
    ReactMarker.logMarker(SETUP_REACT_CONTEXT_END);
    // Mark end of bridge loading
    ReactMarker.logMarker(ReactMarkerConstants.REACT_BRIDGE_LOADING_END);
  }

  private void attachRootViewToInstance(final ReactRoot reactRoot) {
    FLog.d(ReactConstants.TAG, "ReactInstanceManager.attachRootViewToInstance()");
    if (!reactRoot.getState().compareAndSet(ReactRoot.STATE_STOPPED, ReactRoot.STATE_STARTED)) {
      // Already started
      return;
    }

    Systrace.beginSection(TRACE_TAG_REACT, "attachRootViewToInstance");

    @Nullable UIManager uiManager = UIManagerHelper.getUIManager(mCurrentReactContext, FABRIC);

    // If we can't get a UIManager something has probably gone horribly wrong
    if (uiManager == null) {
      throw new IllegalStateException(
          "Unable to attach a rootView to ReactInstance when UIManager is not properly"
              + " initialized.");
    }

    @Nullable Bundle initialProperties = reactRoot.getAppProperties();

    final int rootTag =
        uiManager.startSurface(
            reactRoot.getRootViewGroup(),
            reactRoot.getJSModuleName(),
            initialProperties == null
                ? new WritableNativeMap()
                : Arguments.fromBundle(initialProperties),
            reactRoot.getWidthMeasureSpec(),
            reactRoot.getHeightMeasureSpec());
    reactRoot.setShouldLogContentAppeared(true);

    Systrace.beginAsyncSection(TRACE_TAG_REACT, "pre_rootView.onAttachedToReactInstance", rootTag);
    UiThreadUtil.runOnUiThread(
        () -> {
          Systrace.endAsyncSection(
              TRACE_TAG_REACT, "pre_rootView.onAttachedToReactInstance", rootTag);
          reactRoot.onStage(ReactStage.ON_ATTACH_TO_INSTANCE);
        });
    Systrace.endSection(TRACE_TAG_REACT);
  }

  private void detachRootViewFromInstance(ReactRoot reactRoot, ReactContext reactContext) {
    FLog.d(ReactConstants.TAG, "ReactInstanceManager.detachRootViewFromInstance()");
    UiThreadUtil.assertOnUiThread();

    if (!reactRoot.getState().compareAndSet(ReactRoot.STATE_STARTED, ReactRoot.STATE_STOPPED)) {
      // ReactRoot was already stopped
      return;
    }

    // Stop surface in Fabric.
    // Calling FabricUIManager.stopSurface causes the C++ Binding.stopSurface
    // to be called synchronously over the JNI, which causes an empty tree
    // to be committed via the Scheduler, which will cause mounting instructions
    // to be queued up and synchronously executed to delete and remove
    // all the views in the hierarchy.
    final int surfaceId = reactRoot.getRootViewTag();
    if (surfaceId != View.NO_ID) {
      UIManager uiManager = UIManagerHelper.getUIManager(reactContext, FABRIC);
      if (uiManager != null) {
        uiManager.stopSurface(surfaceId);
      } else {
        FLog.w(ReactConstants.TAG, "Failed to stop surface, UIManager has already gone away");
      }
    } else {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new RuntimeException(
              "detachRootViewFromInstance called with ReactRootView with invalid id"));
    }

    clearReactRoot(reactRoot);
  }

  @ThreadConfined(UI)
  private void tearDownReactContext(ReactContext reactContext) {
    FLog.d(ReactConstants.TAG, "ReactInstanceManager.tearDownReactContext()");
    UiThreadUtil.assertOnUiThread();
    if (mLifecycleState == LifecycleState.RESUMED) {
      reactContext.onHostPause();
    }

    synchronized (mAttachedReactRoots) {
      for (ReactRoot reactRoot : mAttachedReactRoots) {
        detachRootViewFromInstance(reactRoot, reactContext);
      }
    }

    // Remove memory pressure listener before tearing down react context
    // We cannot access the CatalystInstance after destroying the ReactContext.
    mMemoryPressureRouter.removeMemoryPressureListener(reactContext.getCatalystInstance());

    reactContext.destroy();
    mDevSupportManager.onReactInstanceDestroyed(reactContext);
  }

  /**
   * @return instance of {@link ReactContext} configured a {@link CatalystInstance} set
   */
  private ReactApplicationContext createReactContext(
      JavaScriptExecutor jsExecutor, JSBundleLoader jsBundleLoader) {
    // CatalystInstanceImpl has been removed as part of the Legacy Architecture cleanup.
    throw new UnsupportedOperationException(
        "ReactInstanceManager.createReactContext is unsupported. CatalystInstanceImpl has been"
            + " removed.");
  }
}
