/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.Log;
import android.view.KeyEvent;
import android.view.ViewConfiguration;
import android.window.BackEvent;
import android.window.OnBackAnimationCallback;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.util.AndroidVersion;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.jetbrains.annotations.NotNull;

/** Base Activity for React Native applications. */
public abstract class ReactActivity extends AppCompatActivity
    implements DefaultHardwareBackBtnHandler, PermissionAwareActivity {

  private static final String PREDICTIVE_BACK_TAG = "PredictiveBack";
  private static final PredictiveBackEvent EMPTY_PREDICTIVE_BACK_EVENT =
      new PredictiveBackEvent(0f, PredictiveBackEvent.EDGE_NONE, 0f, 0f);

  private final ReactActivityDelegate mDelegate;

  // Keeps JS BackHandler working. On targetSdk 36+ the system no longer calls
  // Activity.onBackPressed(), so this callback is what turns a committed back into a JS
  // hardwareBackPress; below 36 it only has to be enabled to win the dispatcher.
  //
  // Being enabled is also what claims the gesture: it suppresses the system predictive-back
  // animation and keeps FragmentManager from receiving the swipe. On 36+ progress-carrying back
  // goes through InAppPredictiveBack instead (see updateConsumeCallback), which keeps this
  // callback disabled while it is active.
  //
  // Claiming is not reserved: React Native registers at the platform default priority, the same
  // one FragmentManager uses, so the gesture goes to whichever enabled callback registered last.
  // A navigation library that wants it for itself (react-native-screens, so that FragmentManager
  // can animate a transition) takes it through setInterceptEnabled / addPredictiveBackHandler, or
  // by disabling this callback via getBackPressedCallback().
  private final OnBackPressedCallback mBackPressedCallback =
      new OnBackPressedCallback(true) {
        @Override
        public void handleOnBackPressed() {
          setEnabled(false);
          finishPredictiveBackCommit();
          setEnabled(true);
        }
      };

  // Registered only on API 36+. Typed as Object so ReactActivity can load on older devices
  // that do not have android.window.OnBackInvokedCallback.
  private @Nullable Object mSystemNavigationObserver;

  // In-app OnBackAnimationCallback. Typed as Object for the same older-device class loading.
  private @Nullable Object mInAppPredictiveBack;

  private boolean mJsInterceptEnabled;
  private final List<PredictiveBackHandler> mPredictiveBackHandlers = new CopyOnWriteArrayList<>();
  private final List<PredictiveBackProgressListener> mPredictiveBackProgressListeners =
      new CopyOnWriteArrayList<>();
  private PredictiveBackEvent mLastPredictiveBackEvent = EMPTY_PREDICTIVE_BACK_EVENT;

  @SuppressWarnings("this-escape")
  protected ReactActivity() {
    mDelegate = createReactActivityDelegate();
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component. e.g. "MoviesApp"
   */
  protected @Nullable String getMainComponentName() {
    return null;
  }

  /** Called at construction time, override if you have a custom delegate implementation. */
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName());
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mDelegate.onCreate(savedInstanceState);
    if (AndroidVersion.isAtLeastTargetSdk36(this)) {
      getOnBackPressedDispatcher().addCallback(this, mBackPressedCallback);
      mSystemNavigationObserver = SystemNavigationBackObserver.register(this);
    }
  }

  @Override
  protected void onPause() {
    super.onPause();
    mDelegate.onPause();
  }

  @Override
  protected void onResume() {
    super.onResume();
    mDelegate.onResume();
  }

  @Override
  protected void onDestroy() {
    if (AndroidVersion.isAtLeastTargetSdk36(this)) {
      if (mSystemNavigationObserver != null) {
        SystemNavigationBackObserver.unregister(this, mSystemNavigationObserver);
        mSystemNavigationObserver = null;
      }
      if (mInAppPredictiveBack != null) {
        InAppPredictiveBack.unregister(this, mInAppPredictiveBack);
        mInAppPredictiveBack = null;
      }
    }
    super.onDestroy();
    mDelegate.onDestroy();
  }

  public @Nullable ReactDelegate getReactDelegate() {
    return mDelegate.getReactDelegate();
  }

  public ReactActivityDelegate getReactActivityDelegate() {
    return mDelegate;
  }

  /**
   * Returns the {@link OnBackPressedCallback} React Native registers on Android 16+ (targetSdk 36)
   * to keep JS {@code BackHandler} working after {@code Activity.onBackPressed()} stopped being
   * called.
   *
   * <p>While this callback is enabled, Android will not play the system predictive-back animation,
   * and FragmentManager will not receive the gesture. Navigation libraries that implement
   * predictive back should disable it:
   *
   * <pre>{@code
   * getBackPressedCallback().setEnabled(false);
   * }</pre>
   *
   * <p>Disabling the callback means JS {@code BackHandler} can no longer prevent back. The system
   * or the next enabled callback (for example FragmentManager) handles the gesture instead. On
   * Android 16+, a {@code PRIORITY_SYSTEM_NAVIGATION_OBSERVER} still delivers the committed
   * app-exit event to {@code BackHandler} without suppressing the predictive-back animation.
   * Returning {@code true} from a listener cannot cancel an exit that is already in progress.
   */
  public OnBackPressedCallback getBackPressedCallback() {
    return mBackPressedCallback;
  }

  /**
   * Called when the system is handling back (app exit) and this activity's consuming callback is
   * disabled. Notifies JS without consuming the gesture, so the predictive-back animation can run.
   */
  void onSystemNavigationBackInvoked() {
    if (mBackPressedCallback.isEnabled() || mInAppPredictiveBack != null) {
      return;
    }
    Log.i(PREDICTIVE_BACK_TAG, "observer: system back committed, notifying JS");
    mDelegate.onBackPressed();
  }

  /**
   * When {@code true}, React Native consumes the back gesture so JS {@code BackHandler} can pop an
   * in-app screen. On Android 16+ (targetSdk 36) this registers a platform {@link
   * OnBackAnimationCallback} that delivers progress to {@link PredictiveBackHandler} and {@link
   * PredictiveBackProgressListener} (used by {@code PredictiveBackAnimatedView}). When {@code
   * false} and no native handler is registered, the system predictive-back animation can run.
   *
   * <p>Consuming does not reserve the gesture. The in-app callback is registered at {@code
   * PRIORITY_DEFAULT}, the same priority AndroidX' FragmentManager uses, so whichever was
   * registered last enabled receives the swipe. A library that needs the gesture for itself (for
   * example react-native-screens, so FragmentManager can seek a transition) takes it by disabling
   * this activity's consuming callback -- see {@link #getBackPressedCallback()}.
   */
  public void setInterceptEnabled(boolean enabled) {
    mJsInterceptEnabled = enabled;
    updateConsumeCallback();
  }

  /**
   * Registers a native plugin (for example react-native-screens) as an owner of the back gesture.
   * While any handler is registered, React Native consumes the gesture. If a handler returns {@code
   * true} from {@link PredictiveBackHandler#onPredictiveBackCommitted()}, JS {@code
   * hardwareBackPress} is not emitted.
   */
  public void addPredictiveBackHandler(PredictiveBackHandler handler) {
    if (!mPredictiveBackHandlers.contains(handler)) {
      mPredictiveBackHandlers.add(handler);
    }
    updateConsumeCallback();
  }

  public void removePredictiveBackHandler(PredictiveBackHandler handler) {
    mPredictiveBackHandlers.remove(handler);
    updateConsumeCallback();
  }

  /**
   * Observes gesture progress without consuming the swipe. Used by {@code
   * PredictiveBackAnimatedView} so Animated / Reanimated can drive UI-thread animations.
   */
  public void addPredictiveBackProgressListener(PredictiveBackProgressListener listener) {
    if (!mPredictiveBackProgressListeners.contains(listener)) {
      mPredictiveBackProgressListeners.add(listener);
    }
  }

  public void removePredictiveBackProgressListener(PredictiveBackProgressListener listener) {
    mPredictiveBackProgressListeners.remove(listener);
  }

  private void updateConsumeCallback() {
    boolean consume = mJsInterceptEnabled || !mPredictiveBackHandlers.isEmpty();
    if (!AndroidVersion.isAtLeastTargetSdk36(this)) {
      mBackPressedCallback.setEnabled(consume);
      return;
    }
    // Keep the commit-only callback off so it does not steal the gesture without progress.
    mBackPressedCallback.setEnabled(false);
    if (consume) {
      if (mInAppPredictiveBack == null) {
        mInAppPredictiveBack = InAppPredictiveBack.register(this);
      }
    } else if (mInAppPredictiveBack != null) {
      InAppPredictiveBack.unregister(this, mInAppPredictiveBack);
      mInAppPredictiveBack = null;
    }
  }

  void dispatchPredictiveBackStarted(PredictiveBackEvent event) {
    mLastPredictiveBackEvent = event;
    for (int i = mPredictiveBackHandlers.size() - 1; i >= 0; i--) {
      mPredictiveBackHandlers.get(i).onPredictiveBackStarted(event);
    }
    notifyPredictiveBackProgressListeners(event, PredictiveBackEvent.PHASE_START);
  }

  void dispatchPredictiveBackProgressed(PredictiveBackEvent event) {
    mLastPredictiveBackEvent = event;
    for (int i = mPredictiveBackHandlers.size() - 1; i >= 0; i--) {
      mPredictiveBackHandlers.get(i).onPredictiveBackProgressed(event);
    }
    notifyPredictiveBackProgressListeners(event, PredictiveBackEvent.PHASE_PROGRESS);
  }

  void dispatchPredictiveBackCancelled() {
    for (int i = mPredictiveBackHandlers.size() - 1; i >= 0; i--) {
      mPredictiveBackHandlers.get(i).onPredictiveBackCancelled();
    }
    PredictiveBackEvent reset =
        new PredictiveBackEvent(
            0f,
            mLastPredictiveBackEvent.swipeEdge,
            mLastPredictiveBackEvent.touchX,
            mLastPredictiveBackEvent.touchY);
    notifyPredictiveBackProgressListeners(reset, PredictiveBackEvent.PHASE_CANCEL);
  }

  void finishPredictiveBackCommit() {
    boolean consumed = false;
    for (int i = mPredictiveBackHandlers.size() - 1; i >= 0; i--) {
      if (mPredictiveBackHandlers.get(i).onPredictiveBackCommitted()) {
        consumed = true;
        break;
      }
    }
    PredictiveBackEvent done =
        new PredictiveBackEvent(
            1f,
            mLastPredictiveBackEvent.swipeEdge,
            mLastPredictiveBackEvent.touchX,
            mLastPredictiveBackEvent.touchY);
    notifyPredictiveBackProgressListeners(done, PredictiveBackEvent.PHASE_COMMIT);
    if (!consumed) {
      notifyJsHardwareBackPressed();
    }
  }

  private void notifyPredictiveBackProgressListeners(PredictiveBackEvent event, int phase) {
    for (int i = mPredictiveBackProgressListeners.size() - 1; i >= 0; i--) {
      mPredictiveBackProgressListeners.get(i).onPredictiveBackProgress(event, phase);
    }
  }

  void notifyJsHardwareBackPressed() {
    mDelegate.onBackPressed();
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    mDelegate.onActivityResult(requestCode, resultCode, data);
  }

  @Override
  public boolean onKeyDown(int keyCode, KeyEvent event) {
    return mDelegate.onKeyDown(keyCode, event) || super.onKeyDown(keyCode, event);
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    return mDelegate.onKeyUp(keyCode, event) || super.onKeyUp(keyCode, event);
  }

  @Override
  public boolean onKeyLongPress(int keyCode, KeyEvent event) {
    return mDelegate.onKeyLongPress(keyCode, event) || super.onKeyLongPress(keyCode, event);
  }

  @Override
  public void onBackPressed() {
    if (!mDelegate.onBackPressed()) {
      super.onBackPressed();
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    // System predictive back may already be finishing the activity. Calling super again would
    // re-enter the dispatcher after JS BackHandler.exitApp().
    if (isFinishing()) {
      return;
    }
    // Temporarily disable so super.onBackPressed() can run the fallback (finish the activity)
    // instead of re-entering this callback. Restore the previous enabled state so that
    // libraries which disabled the callback for predictive back stay disabled after resume.
    boolean enabled = mBackPressedCallback.isEnabled();
    mBackPressedCallback.setEnabled(false);
    super.onBackPressed();
    mBackPressedCallback.setEnabled(enabled);
  }

  @Override
  public void onNewIntent(Intent intent) {
    if (!mDelegate.onNewIntent(intent)) {
      super.onNewIntent(intent);
    }
  }

  @Override
  public void onUserLeaveHint() {
    super.onUserLeaveHint();
    mDelegate.onUserLeaveHint();
  }

  @Override
  public void requestPermissions(
      String[] permissions, int requestCode, PermissionListener listener) {
    mDelegate.requestPermissions(permissions, requestCode, listener);
  }

  @Override
  public void onRequestPermissionsResult(
      int requestCode, @NotNull String[] permissions, @NotNull int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    mDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    mDelegate.onWindowFocusChanged(hasFocus);
  }

  @Override
  public void onConfigurationChanged(@NotNull Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    mDelegate.onConfigurationChanged(newConfig);
  }

  protected final ReactNativeHost getReactNativeHost() {
    return mDelegate.getReactNativeHost();
  }

  protected ReactHost getReactHost() {
    return mDelegate.getReactHost();
  }

  protected final ReactInstanceManager getReactInstanceManager() {
    return mDelegate.getReactInstanceManager();
  }

  protected final void loadApp(String appKey) {
    mDelegate.loadApp(appKey);
  }

  /**
   * Isolated so that {@link OnBackAnimationCallback} (API 34) is only loaded when in-app predictive
   * back is enabled, and not from {@link ReactActivity} fields or method signatures.
   */
  @RequiresApi(34)
  private static final class InAppPredictiveBack {

    static Object register(ReactActivity activity) {
      Callback callback = new Callback(activity);
      activity
          .getOnBackInvokedDispatcher()
          .registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, callback);
      return callback;
    }

    static void unregister(ReactActivity activity, Object callback) {
      if (callback instanceof OnBackInvokedCallback) {
        activity
            .getOnBackInvokedDispatcher()
            .unregisterOnBackInvokedCallback((OnBackInvokedCallback) callback);
      }
    }

    private static final class Callback implements OnBackAnimationCallback {
      // System progress hits 1.0 well before a full-screen swipe. Decide commit
      // from actual travel so a short drag snaps back instead of popping.
      private static final float COMMIT_DISTANCE_FRACTION = 0.25f;
      private static final float COMMIT_VELOCITY_DP_PER_S = 900f;

      private final ReactActivity activity;
      private boolean gestureCancelled;
      private int swipeEdge;
      private float startTouchX;
      private float lastTouchX;
      private long lastEventTimeMs;
      private float velocityPxPerS;
      private float lastProgress;

      Callback(ReactActivity activity) {
        this.activity = activity;
      }

      @Override
      public void onBackStarted(BackEvent backEvent) {
        gestureCancelled = false;
        swipeEdge = backEvent.getSwipeEdge();
        startTouchX = backEvent.getTouchX();
        lastTouchX = startTouchX;
        lastEventTimeMs = SystemClock.uptimeMillis();
        velocityPxPerS = 0f;
        lastProgress = 0f;
        Log.i(PREDICTIVE_BACK_TAG, "in-app: back started");
        activity.dispatchPredictiveBackStarted(toPredictiveBackEvent(backEvent));
      }

      @Override
      public void onBackProgressed(BackEvent backEvent) {
        updateGestureMetrics(backEvent);
        activity.dispatchPredictiveBackProgressed(toPredictiveBackEvent(backEvent));
      }

      @Override
      public void onBackCancelled() {
        Log.i(PREDICTIVE_BACK_TAG, "in-app: back cancelled");
        gestureCancelled = true;
        activity.dispatchPredictiveBackCancelled();
      }

      @Override
      public void onBackInvoked() {
        if (gestureCancelled) {
          return;
        }
        if (!shouldCommit()) {
          Log.i(
              PREDICTIVE_BACK_TAG,
              "in-app: swipe too short, snapping back distance="
                  + Math.abs(lastTouchX - startTouchX)
                  + " progress="
                  + lastProgress);
          onBackCancelled();
          return;
        }
        Log.i(PREDICTIVE_BACK_TAG, "in-app: back committed");
        activity.finishPredictiveBackCommit();
      }

      private boolean shouldCommit() {
        float width = activity.getWindow().getDecorView().getWidth();
        float distancePx = Math.abs(lastTouchX - startTouchX);
        int touchSlop = ViewConfiguration.get(activity).getScaledTouchSlop();
        if (distancePx <= touchSlop) {
          // No drag reported. Either a 3-button press, or touch coords were
          // missing; fall back to progress so a short gesture can still cancel.
          return lastProgress < 0.05f || lastProgress >= 0.5f;
        }
        boolean farEnough = width > 0 && distancePx >= width * COMMIT_DISTANCE_FRACTION;
        float density = activity.getResources().getDisplayMetrics().density;
        float commitVelocityPx = COMMIT_VELOCITY_DP_PER_S * density;
        float commitVelocity =
            swipeEdge == BackEvent.EDGE_LEFT ? velocityPxPerS : -velocityPxPerS;
        boolean flung = commitVelocity >= commitVelocityPx;
        return farEnough || flung;
      }

      private void updateGestureMetrics(BackEvent backEvent) {
        long now = SystemClock.uptimeMillis();
        float touchX = backEvent.getTouchX();
        if (lastEventTimeMs > 0 && now > lastEventTimeMs) {
          velocityPxPerS = (touchX - lastTouchX) * 1000f / (now - lastEventTimeMs);
        }
        lastTouchX = touchX;
        lastEventTimeMs = now;
        lastProgress = backEvent.getProgress();
        swipeEdge = backEvent.getSwipeEdge();
      }

      private static PredictiveBackEvent toPredictiveBackEvent(BackEvent backEvent) {
        return new PredictiveBackEvent(
            backEvent.getProgress(),
            backEvent.getSwipeEdge(),
            backEvent.getTouchX(),
            backEvent.getTouchY());
      }
    }
  }

  /**
   * Isolated so that {@link OnBackInvokedCallback} (API 33) is only loaded when predictive back is
   * active, and not from {@link ReactActivity} fields or method signatures.
   */
  @RequiresApi(36)
  private static final class SystemNavigationBackObserver {

    // android.window.OnBackInvokedDispatcher.PRIORITY_SYSTEM_NAVIGATION_OBSERVER (API 36).
    // Inlined because this codebase is also compiled against older SDKs that lack the constant.
    private static final int PRIORITY_SYSTEM_NAVIGATION_OBSERVER = -2;

    @SuppressLint("WrongConstant")
    static @Nullable Object register(ReactActivity activity) {
      OnBackInvokedCallback callback = activity::onSystemNavigationBackInvoked;
      try {
        activity
            .getOnBackInvokedDispatcher()
            .registerOnBackInvokedCallback(PRIORITY_SYSTEM_NAVIGATION_OBSERVER, callback);
        return callback;
      } catch (IllegalArgumentException e) {
        // Observer priority is a flagged API and may be rejected on some devices.
        return null;
      }
    }

    static void unregister(ReactActivity activity, Object observer) {
      if (observer instanceof OnBackInvokedCallback) {
        activity
            .getOnBackInvokedDispatcher()
            .unregisterOnBackInvokedCallback((OnBackInvokedCallback) observer);
      }
    }
  }
}
