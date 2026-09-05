/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import static com.facebook.infer.annotation.ThreadConfined.UI;
import static com.facebook.react.uimanager.BlendModeHelper.needsIsolatedLayer;
import static com.facebook.react.uimanager.common.UIManagerType.FABRIC;
import static com.facebook.systrace.Systrace.TRACE_TAG_REACT;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.BlendMode;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.view.WindowManager;
import android.widget.FrameLayout;
import androidx.annotation.Nullable;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Assertions;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMarker;
import com.facebook.react.bridge.ReactMarkerConstants;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.common.annotations.internal.LegacyArchitecture;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.modules.appregistry.AppRegistry;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.JSKeyDispatcher;
import com.facebook.react.uimanager.JSPointerDispatcher;
import com.facebook.react.uimanager.JSTouchDispatcher;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.ReactClippingProhibitedView;
import com.facebook.react.uimanager.ReactRoot;
import com.facebook.react.uimanager.ReactRootViewTagGenerator;
import com.facebook.react.uimanager.ReactStage;
import com.facebook.react.uimanager.RootView;
import com.facebook.react.uimanager.RootViewUtil;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.common.UIManagerType;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.systrace.Systrace;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Default root view for catalyst apps. Provides the ability to listen for size changes so that a UI
 * manager can re-layout its elements. It delegates handling touch events for itself and child views
 * and sending those events to JS by using JSTouchDispatcher. This view is overriding {@link
 * ViewGroup#onInterceptTouchEvent} method in order to be notified about the events for all of its
 * children and it's also overriding {@link ViewGroup#requestDisallowInterceptTouchEvent} to make
 * sure that {@link ViewGroup#onInterceptTouchEvent} will get events even when some child view start
 * intercepting it. In case when no child view is interested in handling some particular touch
 * event, this view's {@link View#onTouchEvent} will still return true in order to be notified about
 * all subsequent touch events related to that gesture (in case when JS code wants to handle that
 * gesture).
 */
public class ReactRootView extends FrameLayout implements RootView, ReactRoot {

  /** Listener interface for react root view events */
  public interface ReactRootViewEventListener {
    /** Called when the react context is attached to a ReactRootView. */
    void onAttachedToReactInstance(ReactRootView rootView);
  }

  private static final String TAG = "ReactRootView";
  private @Nullable ReactInstanceManager mReactInstanceManager;
  private @Nullable String mJSModuleName;
  private @Nullable Bundle mAppProperties;
  private @Nullable CustomGlobalLayoutListener mCustomGlobalLayoutListener;
  private @Nullable ReactRootViewEventListener mRootViewEventListener;
  private int mRootViewTag =
      0; /* This should be View.NO_ID, but for legacy reasons we haven't migrated yet */
  private boolean mIsAttachedToInstance;
  private boolean mShouldLogContentAppeared;
  private @Nullable JSTouchDispatcher mJSTouchDispatcher;
  private @Nullable JSPointerDispatcher mJSPointerDispatcher;
  private @Nullable JSKeyDispatcher mJSKeyDispatcher;
  private final ReactAndroidHWInputDeviceHelper mAndroidHWInputDeviceHelper =
      new ReactAndroidHWInputDeviceHelper();
  private boolean mWasMeasured = false;
  private int mWidthMeasureSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED);
  private int mHeightMeasureSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED);
  private int mLastWidth = 0;
  private int mLastHeight = 0;
  private int mLastOffsetX = Integer.MIN_VALUE;
  private int mLastOffsetY = Integer.MIN_VALUE;
  private final AtomicInteger mState = new AtomicInteger(STATE_STOPPED);

  public ReactRootView(Context context) {
    super(context);
    init();
  }

  public ReactRootView(Context context, AttributeSet attrs) {
    super(context, attrs);
    init();
  }

  public ReactRootView(Context context, AttributeSet attrs, int defStyle) {
    super(context, attrs, defStyle);
    init();
  }

  private void init() {
    setRootViewTag(ReactRootViewTagGenerator.getNextRootViewTag());
    setClipChildren(false);

    if (ReactNativeFeatureFlags.enableFontScaleChangesUpdatingLayout()) {
      DisplayMetricsHolder.initDisplayMetrics(getContext());
    }
  }

  @Override
  protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
    Systrace.beginSection(TRACE_TAG_REACT, "ReactRootView.onMeasure");
    ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_ON_MEASURE_START);
    try {
      boolean measureSpecsUpdated =
          widthMeasureSpec != mWidthMeasureSpec || heightMeasureSpec != mHeightMeasureSpec;
      mWidthMeasureSpec = widthMeasureSpec;
      mHeightMeasureSpec = heightMeasureSpec;

      int width = 0;
      int height = 0;
      int widthMode = MeasureSpec.getMode(widthMeasureSpec);
      if (widthMode == MeasureSpec.AT_MOST || widthMode == MeasureSpec.UNSPECIFIED) {
        for (int i = 0; i < getChildCount(); i++) {
          View child = getChildAt(i);
          int childSize =
              child.getLeft()
                  + child.getMeasuredWidth()
                  + child.getPaddingLeft()
                  + child.getPaddingRight();
          width = Math.max(width, childSize);
        }
      } else {
        width = MeasureSpec.getSize(widthMeasureSpec);
      }
      int heightMode = MeasureSpec.getMode(heightMeasureSpec);
      if (heightMode == MeasureSpec.AT_MOST || heightMode == MeasureSpec.UNSPECIFIED) {
        for (int i = 0; i < getChildCount(); i++) {
          View child = getChildAt(i);
          int childSize =
              child.getTop()
                  + child.getMeasuredHeight()
                  + child.getPaddingTop()
                  + child.getPaddingBottom();
          height = Math.max(height, childSize);
        }
      } else {
        height = MeasureSpec.getSize(heightMeasureSpec);
      }
      setMeasuredDimension(width, height);
      mWasMeasured = true;

      // Check if we were waiting for onMeasure to attach the root view.
      if (hasActiveReactInstance() && !isViewAttachedToReactInstance()) {
        attachToReactInstanceManager();
      } else if (measureSpecsUpdated || mLastWidth != width || mLastHeight != height) {
        updateRootLayoutSpecs(true, mWidthMeasureSpec, mHeightMeasureSpec);
      }
      mLastWidth = width;
      mLastHeight = height;

    } finally {
      ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_ON_MEASURE_END);
      Systrace.endSection(TRACE_TAG_REACT);
    }
  }

  @Override
  public void onChildStartedNativeGesture(View childView, MotionEvent ev) {
    if (!isDispatcherReady()) {
      return;
    }

    @Nullable ReactContext reactContext = getCurrentReactContext();
    if (reactContext == null) {
      return;
    }

    EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext);
    if (eventDispatcher != null) {
      mJSTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher, reactContext);
      if (childView != null && mJSPointerDispatcher != null) {
        mJSPointerDispatcher.onChildStartedNativeGesture(childView, ev, eventDispatcher);
      }
    }
  }

  @Override
  public void onChildEndedNativeGesture(View childView, MotionEvent ev) {
    if (!isDispatcherReady()) {
      return;
    }

    EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcher(getCurrentReactContext());
    if (eventDispatcher != null) {
      mJSTouchDispatcher.onChildEndedNativeGesture(ev, eventDispatcher);
      if (mJSPointerDispatcher != null) {
        mJSPointerDispatcher.onChildEndedNativeGesture();
      }
    }
  }

  private boolean isDispatcherReady() {
    if (!hasActiveReactContext() || !isViewAttachedToReactInstance()) {
      FLog.w(TAG, "Unable to dispatch touch to JS as the catalyst instance has not been attached");
      return false;
    }
    if (mJSTouchDispatcher == null) {
      FLog.w(TAG, "Unable to dispatch touch to JS before the dispatcher is available");
      return false;
    }
    if (ReactFeatureFlags.dispatchPointerEvents && mJSPointerDispatcher == null) {
      FLog.w(TAG, "Unable to dispatch pointer events to JS before the dispatcher is available");
      return false;
    }

    return true;
  }

  // By default the JS touch events are dispatched at the root view. This can be overridden in
  // subclasses as needed.
  public boolean shouldDispatchJSTouchEvent(MotionEvent ev) {
    return true;
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    if (shouldDispatchJSTouchEvent(ev)) {
      dispatchJSTouchEvent(ev);
    }
    dispatchJSPointerEvent(ev, true);
    return super.onInterceptTouchEvent(ev);
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    if (shouldDispatchJSTouchEvent(ev)) {
      dispatchJSTouchEvent(ev);
    }
    dispatchJSPointerEvent(ev, false);
    super.onTouchEvent(ev);
    // In case when there is no children interested in handling touch event, we return true from
    // the root view in order to receive subsequent events related to that gesture
    return true;
  }

  @Override
  public boolean onInterceptHoverEvent(MotionEvent ev) {
    dispatchJSPointerEvent(ev, true);
    return super.onInterceptHoverEvent(ev);
  }

  @Override
  public boolean onHoverEvent(MotionEvent ev) {
    dispatchJSPointerEvent(ev, false);
    return super.onHoverEvent(ev);
  }

  @Override
  protected void dispatchDraw(Canvas canvas) {
    try {
      super.dispatchDraw(canvas);
    } catch (StackOverflowError e) {
      // Adding special exception management for StackOverflowError for logging purposes.
      // This will be removed in the future.
      handleException(e);
    }
  }

  @Override
  protected boolean drawChild(Canvas canvas, View child, long drawingTime) {

    BlendMode mixBlendMode = null;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && needsIsolatedLayer(this)) {
      mixBlendMode = (BlendMode) child.getTag(R.id.mix_blend_mode);
      if (mixBlendMode != null) {
        Paint p = new Paint();
        p.setBlendMode(mixBlendMode);
        canvas.saveLayer(0, 0, getWidth(), getHeight(), p);
      }
    }

    boolean result = super.drawChild(canvas, child, drawingTime);

    if (mixBlendMode != null) {
      canvas.restore();
    }

    return result;
  }

  @Override
  public boolean dispatchKeyEvent(KeyEvent ev) {
    if (!hasActiveReactContext() || !isViewAttachedToReactInstance()) {
      FLog.w(TAG, "Unable to handle key event as the catalyst instance has not been attached");
      return super.dispatchKeyEvent(ev);
    }

    ReactContext context = getCurrentReactContext();
    if (context == null) {
      return super.dispatchKeyEvent(ev);
    }

    mAndroidHWInputDeviceHelper.handleKeyEvent(ev, context);

    // Dispatch during the capture phase before children handle the event as the focus could shift
    dispatchJSKeyEvent(ev);

    return super.dispatchKeyEvent(ev);
  }

  @Override
  protected void onFocusChanged(boolean gainFocus, int direction, Rect previouslyFocusedRect) {
    if (!hasActiveReactContext() || !isViewAttachedToReactInstance()) {
      FLog.w(
          TAG,
          "Unable to handle focus changed event as the catalyst instance has not been attached");
      super.onFocusChanged(gainFocus, direction, previouslyFocusedRect);
      return;
    }
    ReactContext context = getCurrentReactContext();
    if (context != null) {
      mAndroidHWInputDeviceHelper.clearFocus(context);

      if (mJSKeyDispatcher != null && ReactNativeFeatureFlags.enableKeyEvents()) {
        if (gainFocus) {
          @Nullable View focusedChild = getFocusedChild();
          if (focusedChild != null) {
            mJSKeyDispatcher.setFocusedView(focusedChild.getId());
          }
        } else {
          mJSKeyDispatcher.clearFocus();
        }
      }
    }
    super.onFocusChanged(gainFocus, direction, previouslyFocusedRect);
  }

  @Override
  public void requestChildFocus(View child, View focused) {
    if (!hasActiveReactContext() || !isViewAttachedToReactInstance()) {
      FLog.w(
          TAG,
          "Unable to handle child focus changed event as the catalyst instance has not been"
              + " attached");
      super.requestChildFocus(child, focused);
      return;
    }
    ReactContext context = getCurrentReactContext();
    if (context != null) {
      mAndroidHWInputDeviceHelper.onFocusChanged(focused, context);

      if (mJSKeyDispatcher != null && ReactNativeFeatureFlags.enableKeyEvents()) {
        mJSKeyDispatcher.setFocusedView(focused.getId());
      }
    }
    super.requestChildFocus(child, focused);
  }

  protected void dispatchJSPointerEvent(MotionEvent event, boolean isCapture) {
    if (!hasActiveReactContext() || !isViewAttachedToReactInstance()) {
      FLog.w(TAG, "Unable to dispatch touch to JS as the catalyst instance has not been attached");
      return;
    }
    if (mJSPointerDispatcher == null) {
      if (!ReactFeatureFlags.dispatchPointerEvents) {
        return;
      }
      FLog.w(TAG, "Unable to dispatch pointer events to JS before the dispatcher is available");
      return;
    }

    EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcher(getCurrentReactContext());
    if (eventDispatcher != null) {
      mJSPointerDispatcher.handleMotionEvent(event, eventDispatcher, isCapture);
    }
  }

  protected void dispatchJSTouchEvent(MotionEvent event) {
    if (!hasActiveReactContext() || !isViewAttachedToReactInstance()) {
      FLog.w(TAG, "Unable to dispatch touch to JS as the catalyst instance has not been attached");
      return;
    }
    if (mJSTouchDispatcher == null) {
      FLog.w(TAG, "Unable to dispatch touch to JS before the dispatcher is available");
      return;
    }

    EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcher(getCurrentReactContext());
    if (eventDispatcher != null) {
      mJSTouchDispatcher.handleTouchEvent(event, eventDispatcher, getCurrentReactContext());
    }
  }

  protected void dispatchJSKeyEvent(KeyEvent ev) {
    if (!ReactNativeFeatureFlags.enableKeyEvents()) {
      // Silently return early if key events are disabled
      return;
    }
    if (!hasActiveReactContext() || !isViewAttachedToReactInstance()) {
      FLog.w(
          TAG, "Unable to dispatch key event to JS as the catalyst instance has not been attached");
      return;
    }
    if (mJSKeyDispatcher == null) {
      FLog.w(TAG, "Unable to dispatch key event to JS before the dispatcher is available");
      return;
    }
    ReactContext context = getCurrentReactContext();
    if (context != null) {
      EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcher(context);
      int surfaceId = UIManagerHelper.getSurfaceId(context);
      if (eventDispatcher != null) {
        mJSKeyDispatcher.handleKeyEvent(ev, eventDispatcher, surfaceId);
      }
    }
  }

  @Override
  public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
    // Override in order to still receive events to onInterceptTouchEvent even when some other
    // views disallow that, but propagate it up the tree if possible.
    if (getParent() != null) {
      getParent().requestDisallowInterceptTouchEvent(disallowIntercept);
    }
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
    // No-op in non-Fabric since UIManagerModule handles actually laying out children.

    // In Fabric, update LayoutSpecs just so we update the offsetX and offsetY.
    if (mWasMeasured && isFabric()) {
      updateRootLayoutSpecs(false, mWidthMeasureSpec, mHeightMeasureSpec);
    }
  }

  private boolean isFabric() {
    return true;
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    if (isViewAttachedToReactInstance()) {
      removeOnGlobalLayoutListener();
      getViewTreeObserver().addOnGlobalLayoutListener(getCustomGlobalLayoutListener());
    }
  }

  @Override
  protected void onDetachedFromWindow() {
    super.onDetachedFromWindow();
    if (isViewAttachedToReactInstance()) {
      removeOnGlobalLayoutListener();
    }
  }

  private void removeOnGlobalLayoutListener() {
    getViewTreeObserver().removeOnGlobalLayoutListener(getCustomGlobalLayoutListener());
  }

  @Override
  public void onViewAdded(final View child) {
    super.onViewAdded(child);

    // See comments in {@code ReactRootViewProhibitedChildView} for why we want this mechanism.
    if (child instanceof ReactClippingProhibitedView) {
      UiThreadUtil.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              if (!child.isShown()) {
                ReactSoftExceptionLogger.logSoftException(
                    TAG,
                    new ReactNoCrashSoftException(
                        "A view was illegally added as a child of a ReactRootView. This View should"
                            + " not be a direct child of a ReactRootView, because it is not visible"
                            + " and will never be reachable. Child: "
                            + child.getClass().getCanonicalName().toString()
                            + " child ID: "
                            + child.getId()));
              }
            }
          });
    }

    if (mShouldLogContentAppeared) {
      mShouldLogContentAppeared = false;
      String jsModuleName = getJSModuleName();
      ReactMarker.logMarker(ReactMarkerConstants.CONTENT_APPEARED, jsModuleName, mRootViewTag);
    }
  }

  @Override
  public ViewGroup getRootViewGroup() {
    return this;
  }

  /** {@see #startReactApplication(ReactInstanceManager, String, android.os.Bundle)} */
  public void startReactApplication(ReactInstanceManager reactInstanceManager, String moduleName) {
    startReactApplication(reactInstanceManager, moduleName, null);
  }

  /**
   * Schedule rendering of the react component rendered by the JS application from the given JS
   * module (@{param moduleName}) using provided {@param reactInstanceManager} to attach to the JS
   * context of that manager. Extra parameter {@param initialProperties} can be used to pass initial
   * properties for the react component.
   */
  @ThreadConfined(UI)
  public void startReactApplication(
      ReactInstanceManager reactInstanceManager,
      String moduleName,
      @Nullable Bundle initialProperties) {
    Systrace.beginSection(TRACE_TAG_REACT, "startReactApplication");
    try {
      UiThreadUtil.assertOnUiThread();

      // TODO(6788889): Use POJO instead of bundle here, apparently we can't just use WritableMap
      // here as it may be deallocated in native after passing via JNI bridge, but we want to reuse
      // it in the case of re-creating the catalyst instance
      Assertions.assertCondition(
          mReactInstanceManager == null,
          "This root view has already been attached to a catalyst instance manager");

      mReactInstanceManager = reactInstanceManager;
      mJSModuleName = moduleName;
      mAppProperties = initialProperties;

      mReactInstanceManager.createReactContextInBackground();
      // if in this experiment, we initialize the root earlier in startReactApplication
      // instead of waiting for the initial measure
      if (ReactNativeFeatureFlags.enableEagerRootViewAttachment()) {
        if (!mWasMeasured) {
          // Ideally, those values will be used by default, but we only update them here to scope
          // this change to `enableEagerRootViewAttachment` experiment.
          setSurfaceConstraintsToScreenSize();
        }
        attachToReactInstanceManager();
      }
    } finally {
      Systrace.endSection(TRACE_TAG_REACT);
    }
  }

  private void setSurfaceConstraintsToScreenSize() {
    DisplayMetrics displayMetrics = getContext().getResources().getDisplayMetrics();
    mWidthMeasureSpec =
        MeasureSpec.makeMeasureSpec(displayMetrics.widthPixels, MeasureSpec.AT_MOST);
    mHeightMeasureSpec =
        MeasureSpec.makeMeasureSpec(displayMetrics.heightPixels, MeasureSpec.AT_MOST);
  }

  @Override
  public int getWidthMeasureSpec() {
    return mWidthMeasureSpec;
  }

  @Override
  public int getHeightMeasureSpec() {
    return mHeightMeasureSpec;
  }

  @Override
  public void setShouldLogContentAppeared(boolean shouldLogContentAppeared) {
    mShouldLogContentAppeared = shouldLogContentAppeared;
  }

  @Nullable
  @Override
  public String getSurfaceID() {
    Bundle appProperties = getAppProperties();
    return appProperties != null ? appProperties.getString("surfaceID") : null;
  }

  @Override
  public AtomicInteger getState() {
    return mState;
  }

  /**
   * Call whenever measure specs change, or if you want to force an update of offsetX/offsetY. If
   * measureSpecsChanged is false and the offsetX/offsetY don't change, updateRootLayoutSpecs will
   * not be called on the UIManager as a perf optimization.
   *
   * @param measureSpecsChanged
   * @param widthMeasureSpec
   * @param heightMeasureSpec
   */
  private void updateRootLayoutSpecs(
      boolean measureSpecsChanged, final int widthMeasureSpec, final int heightMeasureSpec) {
    ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_UPDATE_LAYOUT_SPECS_START);
    if (!hasActiveReactInstance()) {
      ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_UPDATE_LAYOUT_SPECS_END);
      FLog.w(TAG, "Unable to update root layout specs for uninitialized ReactInstanceManager");
      return;
    }
    // In Fabric we cannot call `updateRootLayoutSpecs` until a SurfaceId has been set.
    // Sometimes,
    boolean isFabricEnabled = isFabric();
    if (isFabricEnabled && !isRootViewTagSet()) {
      ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_UPDATE_LAYOUT_SPECS_END);
      FLog.e(TAG, "Unable to update root layout specs for ReactRootView: no rootViewTag set yet");
      return;
    }

    final ReactContext reactApplicationContext = getCurrentReactContext();

    if (reactApplicationContext != null) {
      @Nullable UIManager uiManager = UIManagerHelper.getUIManager(reactApplicationContext, FABRIC);
      // Ignore calling updateRootLayoutSpecs if UIManager is not properly initialized.
      if (uiManager != null) {
        // In Fabric only, get position of view within screen
        int offsetX = 0;
        int offsetY = 0;
        if (isFabricEnabled) {
          Point viewportOffset = RootViewUtil.getViewportOffset(this);
          offsetX = viewportOffset.x;
          offsetY = viewportOffset.y;
        }

        if (measureSpecsChanged || offsetX != mLastOffsetX || offsetY != mLastOffsetY) {
          uiManager.updateRootLayoutSpecs(
              getRootViewTag(), widthMeasureSpec, heightMeasureSpec, offsetX, offsetY);
        }
        mLastOffsetX = offsetX;
        mLastOffsetY = offsetY;
      }
    }

    ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_UPDATE_LAYOUT_SPECS_END);
  }

  /**
   * Unmount the react application at this root view, reclaiming any JS memory associated with that
   * application. If {@link #startReactApplication} is called, this method must be called before the
   * ReactRootView is garbage collected (typically in your Activity's onDestroy, or in your
   * Fragment's onDestroyView).
   */
  @ThreadConfined(UI)
  public void unmountReactApplication() {
    UiThreadUtil.assertOnUiThread();
    if (mReactInstanceManager != null && mIsAttachedToInstance) {
      mReactInstanceManager.detachRootView(this);
      mIsAttachedToInstance = false;
    }
    mReactInstanceManager = null;
    mShouldLogContentAppeared = false;
  }

  @Override
  public void onStage(@ReactStage int stage) {
    switch (stage) {
      case ReactStage.ON_ATTACH_TO_INSTANCE:
        onAttachedToReactInstance();
        break;
      default:
        break;
    }
  }

  public void onAttachedToReactInstance() {
    // Create the touch dispatcher here instead of having it always available, to make sure
    // that all touch events are only passed to JS after React/JS side is ready to consume
    // them. Otherwise, these events might break the states expected by JS.
    // Note that this callback was invoked from within the UI thread.
    mJSTouchDispatcher = new JSTouchDispatcher(this);

    if (ReactFeatureFlags.dispatchPointerEvents) {
      mJSPointerDispatcher = new JSPointerDispatcher(this);
    }

    if (ReactNativeFeatureFlags.enableKeyEvents()) {
      mJSKeyDispatcher = new JSKeyDispatcher();
    }

    if (mRootViewEventListener != null) {
      mRootViewEventListener.onAttachedToReactInstance(this);
    }
  }

  public void setEventListener(@Nullable ReactRootViewEventListener eventListener) {
    mRootViewEventListener = eventListener;
  }

  @Override
  public String getJSModuleName() {
    return Assertions.assertNotNull(mJSModuleName);
  }

  @Override
  public @Nullable Bundle getAppProperties() {
    return mAppProperties;
  }

  @ThreadConfined(UI)
  public void setAppProperties(@Nullable Bundle appProperties) {
    UiThreadUtil.assertOnUiThread();
    mAppProperties = appProperties;
    if (isRootViewTagSet()) {
      runApplication();
    }
  }

  /**
   * Calls into JS to start the React application. Can be called multiple times with the same
   * rootTag, which will re-render the application from the root.
   */
  @Override
  public void runApplication() {
    Systrace.beginSection(TRACE_TAG_REACT, "ReactRootView.runApplication");
    try {
      if (!hasActiveReactInstance() || !isViewAttachedToReactInstance()) {
        return;
      }

      ReactContext reactContext = getCurrentReactContext();
      if (reactContext == null) {
        return;
      }

      CatalystInstance catalystInstance = reactContext.getCatalystInstance();
      String jsAppModuleName = getJSModuleName();

      if (mWasMeasured) {
        updateRootLayoutSpecs(true, mWidthMeasureSpec, mHeightMeasureSpec);
      }

      WritableNativeMap appParams = new WritableNativeMap();
      appParams.putDouble("rootTag", getRootViewTag());
      @Nullable Bundle appProperties = getAppProperties();
      if (appProperties != null) {
        appParams.putMap("initialProps", Arguments.fromBundle(appProperties));
      }

      mShouldLogContentAppeared = true;

      catalystInstance.getJSModule(AppRegistry.class).runApplication(jsAppModuleName, appParams);
    } finally {
      Systrace.endSection(TRACE_TAG_REACT);
    }
  }

  @VisibleForTesting
  /* package */ void simulateCheckForKeyboardForTesting() {
    getCustomGlobalLayoutListener().checkForKeyboardEvents();
  }

  private CustomGlobalLayoutListener getCustomGlobalLayoutListener() {
    if (mCustomGlobalLayoutListener == null) {
      mCustomGlobalLayoutListener = new CustomGlobalLayoutListener();
    }
    return mCustomGlobalLayoutListener;
  }

  private void attachToReactInstanceManager() {
    Systrace.beginSection(TRACE_TAG_REACT, "attachToReactInstanceManager");
    ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_ATTACH_TO_REACT_INSTANCE_MANAGER_START);

    // React Native requires that the RootView id be managed entirely by React Native, and will
    // crash in addRootView/startSurface if the native View id isn't set to NO_ID.

    // This behavior can not be guaranteed in hybrid apps that have a native android layer over
    // which reactRootViews are added and the native views need to have ids on them in order to
    // work.
    // Hence this can cause unnecessary crashes at runtime for hybrid apps.
    // So converting this to a soft exception such that pure react-native devs can still see the
    // warning while hybrid apps continue to run without crashes

    if (getId() != View.NO_ID) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalViewOperationException(
              "Trying to attach a ReactRootView with an explicit id already set to ["
                  + getId()
                  + "]. React Native uses the id field to track react tags and will overwrite this"
                  + " field. If that is fine, explicitly overwrite the id field to View.NO_ID."));
    }

    try {
      if (mIsAttachedToInstance) {
        return;
      }

      mIsAttachedToInstance = true;
      Assertions.assertNotNull(mReactInstanceManager).attachRootView(this);
      getViewTreeObserver().addOnGlobalLayoutListener(getCustomGlobalLayoutListener());
    } finally {
      ReactMarker.logMarker(ReactMarkerConstants.ROOT_VIEW_ATTACH_TO_REACT_INSTANCE_MANAGER_END);
      Systrace.endSection(TRACE_TAG_REACT);
    }
  }

  @SuppressLint("ClassImplementsFinalize") // Used for memory leak detection during development.
  // The finalize method only performs an assertion check and doesn't do cleanup,
  // so the typical finalize() risks (performance, deadlocks) don't apply here.
  @Override
  protected void finalize() throws Throwable {
    super.finalize();
    Assertions.assertCondition(
        !mIsAttachedToInstance,
        "The application this ReactRootView was rendering was not unmounted before the"
            + " ReactRootView was garbage collected. This usually means that your application is"
            + " leaking large amounts of memory. To solve this, make sure to call"
            + " ReactRootView#unmountReactApplication in the onDestroy() of your hosting Activity"
            + " or in the onDestroyView() of your hosting Fragment.");
  }

  @Override
  public int getRootViewTag() {
    return mRootViewTag;
  }

  private boolean isRootViewTagSet() {
    return mRootViewTag != 0 && mRootViewTag != NO_ID;
  }

  @Override
  public void setRootViewTag(int rootViewTag) {
    mRootViewTag = rootViewTag;
  }

  @Override
  public void handleException(final Throwable t) {
    if (!hasActiveReactContext()) {
      throw new RuntimeException(t);
    }

    Exception e = new IllegalViewOperationException(t.getMessage(), this, t);
    getCurrentReactContext().handleException(e);
  }

  @LegacyArchitecture
  @Deprecated
  public void setIsFabric(boolean isFabric) {
    /* noop */
  }

  @Override
  public @UIManagerType int getUIManagerType() {
    return FABRIC;
  }

  @LegacyArchitecture
  @Nullable
  public ReactInstanceManager getReactInstanceManager() {
    return mReactInstanceManager;
  }

  /* package */ void sendEvent(String eventName, @Nullable WritableMap params) {
    if (hasActiveReactInstance()) {
      getCurrentReactContext().emitDeviceEvent(eventName, params);
    }
  }

  public boolean hasActiveReactInstance() {
    return mReactInstanceManager != null;
  }

  public boolean hasActiveReactContext() {
    return mReactInstanceManager != null && mReactInstanceManager.getCurrentReactContext() != null;
  }

  @Nullable
  public ReactContext getCurrentReactContext() {
    if (mReactInstanceManager == null) {
      return null;
    }
    return mReactInstanceManager.getCurrentReactContext();
  }

  public boolean isViewAttachedToReactInstance() {
    return mIsAttachedToInstance;
  }

  private class CustomGlobalLayoutListener implements ViewTreeObserver.OnGlobalLayoutListener {
    private final Rect mVisibleViewArea;

    private boolean mKeyboardIsVisible = false;
    private int mKeyboardHeight = 0;
    private int mDeviceRotation = 0;

    /* package */ CustomGlobalLayoutListener() {
      DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(getContext());
      mVisibleViewArea = new Rect();
    }

    @Override
    public void onGlobalLayout() {
      if (!hasActiveReactContext() || !isViewAttachedToReactInstance()) {
        return;
      }

      checkForKeyboardEvents();
      checkForDeviceOrientationChanges();
      checkForDeviceDimensionsChanges();
    }

    private void checkForKeyboardEvents() {
      getRootView().getWindowVisibleDisplayFrame(mVisibleViewArea);
      WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(getRootView());
      if (rootInsets == null) {
        return;
      }

      boolean keyboardIsVisible = rootInsets.isVisible(WindowInsetsCompat.Type.ime());
      Insets barInsets = rootInsets.getInsets(WindowInsetsCompat.Type.systemBars());

      if (keyboardIsVisible) {
        Insets imeInsets = rootInsets.getInsets(WindowInsetsCompat.Type.ime());
        int height = imeInsets.bottom - barInsets.bottom;

        // Re-emit on height change while keyboard stays visible (e.g., emoji
        // panel toggle); JS consumers cache endCoordinates from keyboardDidShow.
        if (!mKeyboardIsVisible || height != mKeyboardHeight) {
          mKeyboardIsVisible = true;
          mKeyboardHeight = height;

          ViewGroup.LayoutParams rootLayoutParams = getRootView().getLayoutParams();
          Assertions.assertCondition(rootLayoutParams instanceof WindowManager.LayoutParams);

          int softInputMode = ((WindowManager.LayoutParams) rootLayoutParams).softInputMode;
          int screenY =
              softInputMode == WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING
                  ? mVisibleViewArea.bottom - height
                  : mVisibleViewArea.bottom;

          sendEvent(
              "keyboardDidShow",
              createKeyboardEventPayload(
                  PixelUtil.toDIPFromPixel(screenY),
                  PixelUtil.toDIPFromPixel(mVisibleViewArea.left),
                  PixelUtil.toDIPFromPixel(mVisibleViewArea.width()),
                  PixelUtil.toDIPFromPixel(height)));
        }
      } else if (mKeyboardIsVisible) {
        mKeyboardIsVisible = false;
        mKeyboardHeight = 0;

        sendEvent(
            "keyboardDidHide",
            createKeyboardEventPayload(
                PixelUtil.toDIPFromPixel(mVisibleViewArea.bottom + barInsets.bottom),
                0,
                PixelUtil.toDIPFromPixel(mVisibleViewArea.width()),
                0));
      }
    }

    private void checkForDeviceOrientationChanges() {
      final int rotation =
          ((WindowManager) getContext().getSystemService(Context.WINDOW_SERVICE))
              .getDefaultDisplay()
              .getRotation();
      if (mDeviceRotation == rotation) {
        return;
      }
      mDeviceRotation = rotation;
      DisplayMetricsHolder.initDisplayMetrics(getContext());
      emitOrientationChanged(rotation);
    }

    private void checkForDeviceDimensionsChanges() {
      // DeviceInfoModule caches the last dimensions emitted to JS, so we don't need to check here.
      emitUpdateDimensionsEvent();
    }

    private void emitOrientationChanged(final int newRotation) {
      String name;
      double rotationDegrees;
      boolean isLandscape = false;

      switch (newRotation) {
        case Surface.ROTATION_0:
          name = "portrait-primary";
          rotationDegrees = 0.0;
          break;
        case Surface.ROTATION_90:
          name = "landscape-primary";
          rotationDegrees = -90.0;
          isLandscape = true;
          break;
        case Surface.ROTATION_180:
          name = "portrait-secondary";
          rotationDegrees = 180.0;
          break;
        case Surface.ROTATION_270:
          name = "landscape-secondary";
          rotationDegrees = 90.0;
          isLandscape = true;
          break;
        default:
          return;
      }
      WritableMap map = Arguments.createMap();
      map.putString("name", name);
      map.putDouble("rotationDegrees", rotationDegrees);
      map.putBoolean("isLandscape", isLandscape);

      sendEvent("namedOrientationDidChange", map);
    }

    private void emitUpdateDimensionsEvent() {
      ReactContext reactContext = getCurrentReactContext();
      if (reactContext == null) {
        return;
      }
      DeviceInfoModule deviceInfo = reactContext.getNativeModule(DeviceInfoModule.class);

      if (deviceInfo != null) {
        deviceInfo.emitUpdateDimensionsEvent();
      }
    }

    private WritableMap createKeyboardEventPayload(
        double screenY, double screenX, double width, double height) {
      WritableMap keyboardEventParams = Arguments.createMap();
      WritableMap endCoordinates = Arguments.createMap();

      endCoordinates.putDouble("height", height);
      endCoordinates.putDouble("screenX", screenX);
      endCoordinates.putDouble("width", width);
      endCoordinates.putDouble("screenY", screenY);

      keyboardEventParams.putMap("endCoordinates", endCoordinates);
      keyboardEventParams.putString("easing", "keyboard");
      keyboardEventParams.putDouble("duration", 0);
      return keyboardEventParams;
    }
  }
}
