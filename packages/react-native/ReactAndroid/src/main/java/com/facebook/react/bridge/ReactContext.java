/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static com.facebook.infer.annotation.ThreadConfined.UI;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.Window;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.interop.InteropModuleRegistry;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.interfaces.ExtraWindowEventListener;
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder;
import java.lang.ref.WeakReference;
import java.util.Collection;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Abstract ContextWrapper for Android application or activity {@link Context} and {@link
 * CatalystInstance}
 */
public abstract class ReactContext extends ContextWrapper {

  @DoNotStrip
  public interface RCTDeviceEventEmitter extends JavaScriptModule {

    void emit(@NonNull String eventName, @Nullable Object data);
  }

  private static final String TAG = "ReactContext";

  private final CopyOnWriteArraySet<LifecycleEventListener> mLifecycleEventListeners =
      new CopyOnWriteArraySet<>();
  private final CopyOnWriteArraySet<ActivityEventListener> mActivityEventListeners =
      new CopyOnWriteArraySet<>();
  private final CopyOnWriteArraySet<ExtraWindowEventListener> mExtraWindowEventListeners =
      new CopyOnWriteArraySet<>();
  private final CopyOnWriteArraySet<WindowFocusChangeListener> mWindowFocusEventListeners =
      new CopyOnWriteArraySet<>();
  private final ScrollEndedListeners mScrollEndedListeners = new ScrollEndedListeners();

  private LifecycleState mLifecycleState = LifecycleState.BEFORE_CREATE;

  private @Nullable LayoutInflater mInflater;
  private @Nullable ReactQueueConfiguration mQueueConfig;
  private @Nullable MessageQueueThread mUiMessageQueueThread;
  private @Nullable MessageQueueThread mNativeModulesMessageQueueThread;
  private @Nullable MessageQueueThread mJSMessageQueueThread;
  private @Nullable JSExceptionHandler mJSExceptionHandler;
  private @Nullable JSExceptionHandler mExceptionHandlerWrapper;
  private @Nullable WeakReference<Activity> mCurrentActivity;

  // NOTE: When converted to Kotlin, this field should be made internal due to
  // visibility restriction on InteropModuleRegistry otherwise it will be exposed to the public API.
  protected @Nullable InteropModuleRegistry mInteropModuleRegistry;
  private boolean mIsInitialized = false;

  public ReactContext(Context base) {
    super(base);
  }

  protected void initializeFromOther(ReactContext other) {
    if (other.hasReactInstance()) {
      initializeMessageQueueThreads(other.mQueueConfig);
    }
    mInteropModuleRegistry = other.mInteropModuleRegistry;
  }

  /** Initialize message queue threads using a ReactQueueConfiguration. */
  public synchronized void initializeMessageQueueThreads(ReactQueueConfiguration queueConfig) {
    FLog.d(TAG, "initializeMessageQueueThreads() is called.");
    if (mUiMessageQueueThread != null
        || mNativeModulesMessageQueueThread != null
        || mJSMessageQueueThread != null) {
      throw new IllegalStateException("Message queue threads already initialized");
    }
    mQueueConfig = queueConfig;
    mUiMessageQueueThread = queueConfig.getUIQueueThread();
    mNativeModulesMessageQueueThread = queueConfig.getNativeModulesQueueThread();
    mJSMessageQueueThread = queueConfig.getJSQueueThread();

    /** TODO(T85807990): Fail fast if any of the threads is null. */
    if (mUiMessageQueueThread == null) {
      throw new IllegalStateException("UI thread is null");
    }
    if (mNativeModulesMessageQueueThread == null) {
      throw new IllegalStateException("NativeModules thread is null");
    }
    if (mJSMessageQueueThread == null) {
      throw new IllegalStateException("JavaScript thread is null");
    }
    mIsInitialized = true;
  }

  protected void initializeInteropModules() {
    if (ReactBuildConfig.UNSTABLE_REMOVE_LEGACY_COMPONENT_INTEROP) {
      return;
    }
    mInteropModuleRegistry = new InteropModuleRegistry();
  }

  @Deprecated(since = "MessageQueueThread perf stats are no longer collected")
  public void resetPerfStats() {}

  public void setJSExceptionHandler(@Nullable JSExceptionHandler jSExceptionHandler) {
    mJSExceptionHandler = jSExceptionHandler;
  }

  // We override the following method so that views inflated with the inflater obtained from this
  // context return the ReactContext in #getContext(). The default implementation uses the base
  // context instead, so it couldn't be cast to ReactContext.
  // TODO: T7538796 Check requirement for Override of getSystemService ReactContext
  @Override
  public Object getSystemService(String name) {
    if (LAYOUT_INFLATER_SERVICE.equals(name)) {
      if (mInflater == null) {
        mInflater = LayoutInflater.from(getBaseContext()).cloneInContext(this);
      }
      return mInflater;
    }
    return getBaseContext().getSystemService(name);
  }

  /**
   * @return handle to the specified JS module for the CatalystInstance associated with this Context
   */
  public abstract <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface);

  public abstract <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface);

  public abstract Collection<NativeModule> getNativeModules();

  /**
   * @return the instance of the specified module interface associated with this ReactContext.
   */
  @Nullable
  public abstract <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface);

  /**
   * @return the instance of the specified module interface associated with this ReactContext.
   */
  public abstract @Nullable NativeModule getNativeModule(String moduleName);

  /**
   * Calls RCTDeviceEventEmitter.emit to JavaScript, with given event name and an optional list of
   * arguments.
   */
  public void emitDeviceEvent(String eventName, @Nullable Object args) {
    RCTDeviceEventEmitter eventEmitter = getJSModule(RCTDeviceEventEmitter.class);
    if (eventEmitter != null) {
      eventEmitter.emit(eventName, args);
    }
  }

  public void emitDeviceEvent(String eventName) {
    emitDeviceEvent(eventName, null);
  }

  public abstract CatalystInstance getCatalystInstance();

  /**
   * This API has been deprecated due to naming consideration, please use hasActiveReactInstance()
   * instead
   *
   * @return
   */
  @Deprecated
  public abstract boolean hasActiveCatalystInstance();

  /**
   * @return true if there is an non-null, alive react native instance
   */
  public abstract boolean hasActiveReactInstance();

  /**
   * This API has been deprecated due to naming consideration, please use hasReactInstance() instead
   *
   * @return
   */
  @Deprecated
  public abstract boolean hasCatalystInstance();

  public abstract boolean hasReactInstance();

  public LifecycleState getLifecycleState() {
    return mLifecycleState;
  }

  /**
   * Returns the {@link RuntimeExecutor} for the underlying JavaScript runtime, or {@code null} if
   * the runtime has not been initialized. Works in both bridged and bridgeless modes.
   */
  public abstract @Nullable RuntimeExecutor getRuntimeExecutor();

  /**
   * This allows scroll views to notify NativeAnimatedModule when user-driven scrolling ends.
   *
   * @return The ScrollEndedListeners instance
   */
  public ScrollEndedListeners getScrollEndedListeners() {
    return mScrollEndedListeners;
  }

  public void addLifecycleEventListener(final LifecycleEventListener listener) {
    mLifecycleEventListeners.add(listener);
    if (hasActiveReactInstance() || isBridgeless()) {
      switch (mLifecycleState) {
        case BEFORE_CREATE:
        case BEFORE_RESUME:
          break;
        case RESUMED:
          runOnUiQueueThread(
              new Runnable() {
                @Override
                public void run() {
                  if (!mLifecycleEventListeners.contains(listener)) {
                    return;
                  }
                  try {
                    listener.onHostResume();
                  } catch (RuntimeException e) {
                    handleException(e);
                  }
                }
              });
          break;
        default:
          throw new IllegalStateException("Unhandled lifecycle state.");
      }
    }
  }

  public void removeLifecycleEventListener(LifecycleEventListener listener) {
    mLifecycleEventListeners.remove(listener);
  }

  public void addActivityEventListener(ActivityEventListener listener) {
    mActivityEventListeners.add(listener);
  }

  public void removeActivityEventListener(ActivityEventListener listener) {
    mActivityEventListeners.remove(listener);
  }

  public void addExtraWindowEventListener(ExtraWindowEventListener listener) {
    mExtraWindowEventListeners.add(listener);
  }

  public void removeExtraWindowEventListener(ExtraWindowEventListener listener) {
    mExtraWindowEventListeners.remove(listener);
  }

  public void addWindowFocusChangeListener(WindowFocusChangeListener listener) {
    mWindowFocusEventListeners.add(listener);
  }

  public void removeWindowFocusChangeListener(WindowFocusChangeListener listener) {
    mWindowFocusEventListeners.remove(listener);
  }

  /** Should be called by the hosting Fragment in {@link Fragment#onResume} */
  @ThreadConfined(UI)
  public void onHostResume(@Nullable Activity activity) {
    mLifecycleState = LifecycleState.RESUMED;
    mCurrentActivity = new WeakReference<>(activity);
    ReactMarker.logMarker(ReactMarkerConstants.ON_HOST_RESUME_START);
    for (LifecycleEventListener listener : mLifecycleEventListeners) {
      try {
        listener.onHostResume();
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
    ReactMarker.logMarker(ReactMarkerConstants.ON_HOST_RESUME_END);
  }

  @ThreadConfined(UI)
  public void onUserLeaveHint(@Nullable Activity activity) {
    ReactMarker.logMarker(ReactMarkerConstants.ON_USER_LEAVE_HINT_START);
    for (ActivityEventListener listener : mActivityEventListeners) {
      try {
        listener.onUserLeaveHint(activity);
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
    ReactMarker.logMarker(ReactMarkerConstants.ON_USER_LEAVE_HINT_END);
  }

  @ThreadConfined(UI)
  public void onNewIntent(@Nullable Activity activity, Intent intent) {
    UiThreadUtil.assertOnUiThread();
    mCurrentActivity = new WeakReference<>(activity);
    for (ActivityEventListener listener : mActivityEventListeners) {
      try {
        listener.onNewIntent(intent);
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
  }

  /** Should be called by the hosting Fragment in {@link Fragment#onPause} */
  @ThreadConfined(UI)
  public void onHostPause() {
    mLifecycleState = LifecycleState.BEFORE_RESUME;
    ReactMarker.logMarker(ReactMarkerConstants.ON_HOST_PAUSE_START);
    for (LifecycleEventListener listener : mLifecycleEventListeners) {
      try {
        listener.onHostPause();
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
    ReactMarker.logMarker(ReactMarkerConstants.ON_HOST_PAUSE_END);
  }

  /** Should be called by the hosting Fragment in {@link Fragment#onDestroy} */
  @ThreadConfined(UI)
  public void onHostDestroy() {
    onHostDestroyImpl();
    mCurrentActivity = null;
  }

  @ThreadConfined(UI)
  public void onHostDestroy(boolean keepActivity) {
    if (!keepActivity) {
      onHostDestroy();
    } else {
      onHostDestroyImpl();
    }
  }

  @ThreadConfined(UI)
  private void onHostDestroyImpl() {
    UiThreadUtil.assertOnUiThread();
    mLifecycleState = LifecycleState.BEFORE_CREATE;
    for (LifecycleEventListener listener : mLifecycleEventListeners) {
      try {
        listener.onHostDestroy();
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
  }

  /** Destroy this instance, making it unusable. */
  @ThreadConfined(UI)
  public abstract void destroy();

  /** Should be called by the hosting Fragment in {@link Fragment#onActivityResult} */
  public void onActivityResult(
      Activity activity, int requestCode, int resultCode, @Nullable Intent data) {
    for (ActivityEventListener listener : mActivityEventListeners) {
      try {
        listener.onActivityResult(activity, requestCode, resultCode, data);
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
  }

  @ThreadConfined(UI)
  public void onExtraWindowCreate(Window window) {
    UiThreadUtil.assertOnUiThread();
    for (ExtraWindowEventListener listener : mExtraWindowEventListeners) {
      try {
        listener.onExtraWindowCreate(window);
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
  }

  @ThreadConfined(UI)
  public void onExtraWindowDestroy(Window window) {
    UiThreadUtil.assertOnUiThread();
    for (ExtraWindowEventListener listener : mExtraWindowEventListeners) {
      try {
        listener.onExtraWindowDestroy(window);
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
  }

  @ThreadConfined(UI)
  public void onWindowFocusChange(boolean hasFocus) {
    UiThreadUtil.assertOnUiThread();
    for (WindowFocusChangeListener listener : mWindowFocusEventListeners) {
      try {
        listener.onWindowFocusChange(hasFocus);
      } catch (RuntimeException e) {
        handleException(e);
      }
    }
  }

  public void assertOnUiQueueThread() {
    Assertions.assertNotNull(mUiMessageQueueThread).assertIsOnThread();
  }

  public boolean isOnUiQueueThread() {
    return Assertions.assertNotNull(mUiMessageQueueThread).isOnThread();
  }

  public void runOnUiQueueThread(Runnable runnable) {
    Assertions.assertNotNull(mUiMessageQueueThread).runOnQueue(runnable);
  }

  public void assertOnNativeModulesQueueThread() {
    /** TODO(T85807990): Fail fast if the ReactContext isn't initialized */
    if (!mIsInitialized) {
      throw new IllegalStateException(
          "Tried to call assertOnNativeModulesQueueThread() on an uninitialized ReactContext");
    }
    Assertions.assertNotNull(mNativeModulesMessageQueueThread).assertIsOnThread();
  }

  public void assertOnNativeModulesQueueThread(String message) {
    /** TODO(T85807990): Fail fast if the ReactContext isn't initialized */
    if (!mIsInitialized) {
      throw new IllegalStateException(
          "Tried to call assertOnNativeModulesQueueThread(message) on an uninitialized"
              + " ReactContext");
    }
    Assertions.assertNotNull(mNativeModulesMessageQueueThread).assertIsOnThread(message);
  }

  public boolean isOnNativeModulesQueueThread() {
    return Assertions.assertNotNull(mNativeModulesMessageQueueThread).isOnThread();
  }

  public void runOnNativeModulesQueueThread(Runnable runnable) {
    Assertions.assertNotNull(mNativeModulesMessageQueueThread).runOnQueue(runnable);
  }

  public void assertOnJSQueueThread() {
    Assertions.assertNotNull(mJSMessageQueueThread).assertIsOnThread();
  }

  public boolean isOnJSQueueThread() {
    return Assertions.assertNotNull(mJSMessageQueueThread).isOnThread();
  }

  public boolean runOnJSQueueThread(Runnable runnable) {
    return Assertions.assertNotNull(mJSMessageQueueThread).runOnQueue(runnable);
  }

  public @Nullable MessageQueueThread getJSMessageQueueThread() {
    return mJSMessageQueueThread;
  }

  public @Nullable MessageQueueThread getNativeModulesMessageQueueThread() {
    return mNativeModulesMessageQueueThread;
  }

  public @Nullable MessageQueueThread getUiMessageQueueThread() {
    return mUiMessageQueueThread;
  }

  /**
   * Passes the given exception to the current {@link JSExceptionHandler} if one exists, rethrowing
   * otherwise.
   */
  public abstract void handleException(Exception e);

  public class ExceptionHandlerWrapper implements JSExceptionHandler {

    @Override
    public void handleException(Exception e) {
      ReactContext.this.handleException(e);
    }
  }

  public JSExceptionHandler getExceptionHandler() {
    if (mExceptionHandlerWrapper == null) {
      mExceptionHandlerWrapper = new ExceptionHandlerWrapper();
    }
    return mExceptionHandlerWrapper;
  }

  public JSExceptionHandler getJSExceptionHandler() {
    return mJSExceptionHandler;
  }

  public boolean hasCurrentActivity() {
    return mCurrentActivity != null && mCurrentActivity.get() != null;
  }

  /**
   * Same as {@link Activity#startActivityForResult(Intent, int)}, this just redirects the call to
   * the current activity. Returns whether the activity was started, as this might fail if this was
   * called before the context is in the right state.
   */
  public boolean startActivityForResult(Intent intent, int code, Bundle bundle) {
    Activity activity = getCurrentActivity();
    if (activity != null) {
      activity.startActivityForResult(intent, code, bundle);
      return true;
    }
    return false;
  }

  /**
   * Get the activity to which this context is currently attached, or {@code null} if not attached.
   * DO NOT HOLD LONG-LIVED REFERENCES TO THE OBJECT RETURNED BY THIS METHOD, AS THIS WILL CAUSE
   * MEMORY LEAKS.
   */
  public @Nullable Activity getCurrentActivity() {
    if (mCurrentActivity == null) {
      return null;
    }
    return mCurrentActivity.get();
  }

  /**
   * @deprecated DO NOT USE, this method will be removed in the near future.
   */
  @Deprecated
  public abstract boolean isBridgeless();

  /**
   * Get the C pointer (as a long) to the JavaScriptCore context associated with this instance. Use
   * the following pattern to ensure that the JS context is not cleared while you are using it:
   * JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder()
   * synchronized(jsContext) { nativeThingNeedingJsContext(jsContext.get()); }
   */
  public abstract @Nullable JavaScriptContextHolder getJavaScriptContextHolder();

  /**
   * Returns a hybrid object that contains a pointer to a JS CallInvoker, which is used to schedule
   * work on the JS Thread.
   */
  public abstract @Nullable CallInvokerHolder getJSCallInvokerHolder();

  @Deprecated(
      since = "This method is deprecated, please use UIManagerHelper.getUIManager() instead.")
  /**
   * Get the UIManager for Fabric from the CatalystInstance.
   *
   * @return The UIManager when CatalystInstance is active.
   */
  public abstract @Nullable UIManager getFabricUIManager();

  /**
   * Get the sourceURL for the JS bundle from the CatalystInstance. This method is needed for
   * compatibility with bridgeless mode, which has no CatalystInstance.
   *
   * @return The JS bundle URL set when the bundle was loaded
   */
  public abstract @Nullable String getSourceURL();

  /**
   * Register a JS segment after loading it from cache or server, make sure mCatalystInstance is
   * properly initialised and not null before calling.
   */
  public abstract void registerSegment(int segmentId, String path, Callback callback);

  /**
   * Register a {@link JavaScriptModule} within the Interop Layer so that can be consumed whenever
   * getJSModule is invoked.
   *
   * <p>This method is internal to React Native and should not be used externally.
   */
  public <T extends JavaScriptModule> void internal_registerInteropModule(
      Class<T> interopModuleInterface, Object interopModule) {
    if (ReactBuildConfig.UNSTABLE_REMOVE_LEGACY_COMPONENT_INTEROP) {
      return;
    }
    if (mInteropModuleRegistry != null) {
      mInteropModuleRegistry.registerInteropModule(interopModuleInterface, interopModule);
    }
  }
}
