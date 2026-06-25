/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.common.annotations.UnstableReactNativeAPI;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.common.mapbuffer.MapBuffer;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags;
import com.facebook.react.touch.JSResponderHandler;
import com.facebook.react.touch.ReactInterceptingViewGroup;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.annotations.ReactPropGroup;
import com.facebook.react.uimanager.annotations.ReactPropertyHolder;
import com.facebook.yoga.YogaMeasureMode;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Stack;

/**
 * Class responsible for knowing how to create and update catalyst Views of a given type. It is also
 * responsible for creating and updating CSSNodeDEPRECATED subclasses used for calculating position
 * and size for the corresponding native view.
 */
@ReactPropertyHolder
public abstract class ViewManager<T extends View, C extends ReactShadowNode>
    extends BaseJavaModule {

  private static final String TAG = "ViewManager";

  private @Nullable ViewManagerDelegate<T> mDelegate = null;

  /**
   * For View recycling: we store a Stack of unused, dead Views. This is null by default, and when
   * null signals that View Recycling is disabled. `enableViewRecycling` must be explicitly called
   * in a concrete constructor to enable View Recycling per ViewManager.
   */
  @Nullable private Map<Integer, Stack<T>> mRecyclableViews = null;

  public ViewManager() {
    super(null);
  }

  public ViewManager(@Nullable ReactApplicationContext reactContext) {
    super(reactContext);
  }

  /** Call in constructor of concrete ViewManager class to enable. */
  protected void setupViewRecycling() {
    if (ReactNativeFeatureFlags.enableViewRecycling()) {
      mRecyclableViews = new HashMap<>();
    }
  }

  /**
   * Returns the stack of recycled views for the surface, if enabled
   *
   * @param create Whether to create a new stack if not found for the {@code surfaceId}. Should be
   *     {@code false} if it's possible the surface has been stopped.
   */
  private @Nullable Stack<T> getRecyclableViewStack(int surfaceId, boolean create) {
    if (mRecyclableViews == null) {
      return null;
    }
    if (create && !mRecyclableViews.containsKey(surfaceId)) {
      mRecyclableViews.put(surfaceId, new Stack<T>());
    }
    return mRecyclableViews.get(surfaceId);
  }

  /**
   * For the vast majority of ViewManagers, you will not need to override this. Only override this
   * if you really know what you're doing and have a very unique use-case.
   *
   * @param viewToUpdate {@link T} View instance that will be updated with the props received by
   *     parameter.
   * @param props {@link ReactStylesDiffMap} props to update the view with
   */
  public void updateProperties(@NonNull T viewToUpdate, ReactStylesDiffMap props) {
    ViewManagerDelegate<T> delegate = getOrCreateViewManagerDelegate();
    Iterator<Map.Entry<String, Object>> iterator = props.internal_backingMap().getEntryIterator();
    while (iterator.hasNext()) {
      Map.Entry<String, Object> entry = iterator.next();
      delegate.setProperty(viewToUpdate, entry.getKey(), entry.getValue());
    }
    onAfterUpdateTransaction(viewToUpdate);
  }

  /**
   * Override this method and return an instance of {@link ViewManagerDelegate} if the props of the
   * view managed by this view manager should be set via this delegate. The provided instance will
   * then get calls to {@link ViewManagerDelegate#setProperty(View, String, Object)} for every prop
   * that must be updated and it's the delegate's responsibility to apply these values to the view.
   *
   * <p>By default, this methods returns a generic {@link ViewManagerDelegate} which uses {@link
   * ViewManagerSetter} to apply property updates.
   *
   * @return an instance of {@link ViewManagerDelegate} if the props of the view managed by this
   *     view manager should be set via this delegate
   */
  protected ViewManagerDelegate<T> getDelegate() {
    if (this instanceof ViewManagerWithGeneratedInterface) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new ReactNoCrashSoftException(
              "ViewManager using codegen must override getDelegate method (name: "
                  + getName()
                  + ")."));
    }
    return new ViewManagerPropertyUpdater.GenericViewManagerDelegate<>(this);
  }

  private ViewManagerDelegate<T> getOrCreateViewManagerDelegate() {
    ViewManagerDelegate<T> delegate = mDelegate;
    if (delegate == null) {
      delegate = getDelegate();
      mDelegate = delegate;
    }
    return delegate;
  }

  /** Creates a view with knowledge of props and state. */
  public @NonNull T createView(
      int reactTag,
      @NonNull ThemedReactContext reactContext,
      @Nullable ReactStylesDiffMap props,
      @Nullable StateWrapper stateWrapper,
      JSResponderHandler jsResponderHandler) {
    T view = createViewInstance(reactTag, reactContext, props, stateWrapper);
    if (view instanceof ReactInterceptingViewGroup) {
      ((ReactInterceptingViewGroup) view).setOnInterceptTouchEventListener(jsResponderHandler);
    }
    return view;
  }

  /**
   * @return the name of this view manager. This will be the name used to reference this view
   *     manager from JavaScript in createReactNativeComponentClass.
   */
  public abstract @NonNull String getName();

  /**
   * This method should return a subclass of {@link ReactShadowNode} which will be then used for
   * measuring position and size of the view. In most of the cases this should just return an
   * instance of {@link ReactShadowNode}
   */
  public C createShadowNodeInstance() {
    throw new RuntimeException("ViewManager subclasses must implement createShadowNodeInstance()");
  }

  public @NonNull C createShadowNodeInstance(@NonNull ReactApplicationContext context) {
    return createShadowNodeInstance();
  }

  /**
   * This method should return {@link Class} instance that represent type of shadow node that this
   * manager will return from {@link #createShadowNodeInstance}.
   *
   * <p>This method will be used in the bridge initialization phase to collect properties exposed
   * using {@link ReactProp} (or {@link ReactPropGroup}) annotation from the {@link ReactShadowNode}
   * subclass specific for native view this manager provides.
   *
   * @return {@link Class} object that represents type of shadow node used by this view manager.
   */
  public abstract Class<? extends C> getShadowNodeClass();

  /**
   * Subclasses should return a new View instance of the proper type.
   *
   * @param reactContext
   */
  protected abstract @NonNull T createViewInstance(@NonNull ThemedReactContext reactContext);

  /**
   * Subclasses should return a new View instance of the proper type. This is an optional method
   * that will call createViewInstance for you. Override it if you need props upon creation of the
   * view, or state.
   *
   * <p>If you override this method, you *must* guarantee that you you're handling updateProperties,
   * view.setId, addEventEmitters, and updateState/updateExtraData properly!
   *
   * @param reactTag reactTag that should be set as ID of the view instance
   * @param reactContext ReactContext used to initialize view instance
   * @param initialProps initial props for the view instance
   * @param stateWrapper initial state for the view instance
   */
  protected @NonNull T createViewInstance(
      int reactTag,
      @NonNull ThemedReactContext reactContext,
      @Nullable ReactStylesDiffMap initialProps,
      @Nullable StateWrapper stateWrapper) {
    T view = null;
    @Nullable Stack<T> recyclableViews = getRecyclableViewStack(reactContext.getSurfaceId(), true);
    if (recyclableViews != null && !recyclableViews.empty()) {
      T recyclableView = recyclableViews.pop();

      // When view recycling isn't enabled for all components, a recyclable view could still be
      // attached to a non-recyclable view. This guarantees that recycled view have been removed
      // from their parent.
      if (ReactNativeFeatureFlags.enableViewRecycling() && recyclableView.getParent() != null) {
        ((ViewGroup) recyclableView.getParent()).removeView(recyclableView);
      }

      view = recycleView(reactContext, recyclableView);
    } else {
      view = createViewInstance(reactContext);
    }
    view.setId(reactTag);
    addEventEmitters(reactContext, view);
    if (initialProps != null) {
      updateProperties(view, initialProps);
    }
    // Only present in Fabric; but always present in Fabric.
    if (stateWrapper != null) {
      Object extraData = updateState(view, initialProps, stateWrapper);
      if (extraData != null) {
        updateExtraData(view, extraData);
      }
    }
    return view;
  }

  /**
   * Called when view is detached from view hierarchy and allows for some additional cleanup by the
   * {@link ViewManager} subclass.
   */
  public void onDropViewInstance(@NonNull T view) {
    // Some legacy components will return an Activity here instead of a ThemedReactContext
    Context viewContext = view.getContext();
    if (viewContext == null) {
      // Who knows! Anything is possible. Checking instanceof on null is an NPE,
      // So this is not redundant.
      FLog.e(TAG, "onDropViewInstance: view [" + view.getId() + "] has a null context");
      return;
    }
    if (!(viewContext instanceof ThemedReactContext)) {
      FLog.e(
          TAG,
          "onDropViewInstance: view ["
              + view.getId()
              + "] has a context that is not a ThemedReactContext: "
              + viewContext);
      return;
    }

    // View recycling
    ThemedReactContext themedReactContext = (ThemedReactContext) viewContext;
    int surfaceId = themedReactContext.getSurfaceId();
    @Nullable Stack<T> recyclableViews = getRecyclableViewStack(surfaceId, false);
    if (recyclableViews != null) {
      T recyclableView = prepareToRecycleView(themedReactContext, view);
      if (recyclableView != null) {
        recyclableViews.push(recyclableView);
      }
    }
  }

  /**
   * Called when a View is removed from the hierarchy. This should be used to reset any properties.
   *
   * @return {@code view} if it was properly recycled, or {@code null} if it could not be recycled
   */
  protected abstract @Nullable T prepareToRecycleView(
      @NonNull ThemedReactContext reactContext, @NonNull T view);

  /** Called when a View is going to be reused. */
  protected T recycleView(@NonNull ThemedReactContext reactContext, @NonNull T view) {
    return view;
  }

  /**
   * Subclasses can override this method to install custom event emitters on the given View. You
   * might want to override this method if your view needs to emit events besides basic touch events
   * to JS (e.g. scroll events).
   */
  protected void addEventEmitters(@NonNull ThemedReactContext reactContext, @NonNull T view) {}

  /**
   * Callback that will be triggered after all properties are updated in current update transaction
   * (all @ReactProp handlers for properties updated in current transaction have been called). If
   * you want to override this method you should call super.onAfterUpdateTransaction from it as the
   * parent class of the ViewManager may rely on callback being executed.
   */
  protected void onAfterUpdateTransaction(@NonNull T view) {}

  /**
   * Subclasses can implement this method to receive an optional extra data enqueued from the
   * corresponding instance of {@link ReactShadowNode} in {@link
   * ReactShadowNode#onCollectExtraUpdates}.
   *
   * <p>Since css layout step and ui updates can be executed in separate thread apart of setting
   * x/y/width/height this is the recommended and thread-safe way of passing extra data from css
   * node to the native view counterpart.
   *
   * <p>TODO T7247021: Replace updateExtraData with generic update props mechanism after D2086999
   */
  public abstract void updateExtraData(@NonNull T view, Object extraData);

  /**
   * Subclasses may use this method to receive events/commands directly from JS through the {@link
   * UIManager}. Good example of such a command would be {@code scrollTo} request with coordinates
   * for a {@link ScrollView} instance.
   *
   * <p>This method is deprecated use {@link #receiveCommand(View, String, ReadableArray)} instead.
   *
   * @param view View instance that should receive the command
   * @param commandId code of the command
   * @param args optional arguments for the command
   */
  @Deprecated
  public void receiveCommand(@NonNull T view, int commandId, ReadableArray args) {}

  /**
   * Subclasses may use this method to receive events/commands directly from JS through the {@link
   * UIManager}. Good example of such a command would be {@code scrollTo} request with coordinates
   * for a {@link ReactScrollView} instance.
   *
   * @param view View instance that should receive the command
   * @param commandId code of the command
   * @param args optional arguments for the command
   */
  public void receiveCommand(@NonNull T view, String commandId, ReadableArray args) {
    getOrCreateViewManagerDelegate().receiveCommand(view, commandId, args);
  }

  /**
   * Subclasses of {@link ViewManager} that expect to receive commands through {@link
   * UIManagerModule#dispatchViewManagerCommand} should override this method returning the map
   * between names of the commands and IDs that are then used in {@link #receiveCommand} method
   * whenever the command is dispatched for this particular {@link ViewManager}.
   *
   * @return map of string to int mapping of the expected commands
   */
  public @Nullable Map<String, Integer> getCommandsMap() {
    return null;
  }

  /**
   * Returns a map of config data passed to JS that defines eligible events that can be placed on
   * native views. This should return bubbling directly-dispatched event types and specify what
   * names should be used to subscribe to either form (bubbling/capturing).
   *
   * <p>Returned map should be of the form:
   *
   * <pre>
   * {
   *   "onTwirl": {
   *     "phasedRegistrationNames": {
   *       "bubbled": "onTwirl",
   *       "captured": "onTwirlCaptured"
   *     }
   *   }
   * }
   * </pre>
   */
  public @Nullable Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
    return null;
  }

  /**
   * Returns a map of config data passed to JS that defines eligible events that can be placed on
   * native views. This should return non-bubbling directly-dispatched event types.
   *
   * <p>Returned map should be of the form:
   *
   * <pre>
   * {
   *   "onTwirl": {
   *     "registrationName": "onTwirl"
   *   }
   * }
   * </pre>
   */
  public @Nullable Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return null;
  }

  /**
   * Returns a map of view-specific constants that are injected to JavaScript. These constants are
   * made accessible via UIManager.<ViewName>.Constants.
   */
  public @Nullable Map<String, Object> getExportedViewConstants() {
    return null;
  }

  /**
   * Returns a {@link Map<String, String>} representing the native props of the view manager. The
   * Map contains the names (key) and types (value) of the ViewManager's props.
   */
  public Map<String, String> getNativeProps() {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE
        && ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()) {
      // TODO: review if we need to check fabricInterop here
      return ViewManagerPropertyUpdater.getNativeProps(getClass(), null);
    } else {
      return ViewManagerPropertyUpdater.getNativeProps(getClass(), getShadowNodeClass());
    }
  }

  /**
   * Subclasses can implement this method to receive state updates shared between all instances of
   * this component type.
   */
  public @Nullable Object updateState(
      @NonNull T view, ReactStylesDiffMap props, StateWrapper stateWrapper) {
    return null;
  }

  /**
   * Subclasses can override this method to implement custom measure functions for the ViewManager.
   * This function is never called automatically, but may be called manually via
   * FabricUIManager.measure().
   *
   * @param context {@link com.facebook.react.bridge.ReactContext} used for the view.
   * @param localData {@link ReadableMap} containing "local data" defined in C++
   * @param props {@link ReadableMap} containing JS props
   * @param state {@link ReadableMap} containing state defined in C++
   * @param width width of the constraint, if YogaMeasureMode.EXACTLY or YogaMeasureMode.AT_MOST
   * @param widthMode MeasureMode used during calculation of layout
   * @param height height of the constraint, if YogaMeasureMode.EXACTLY or YogaMeasureMode.AT_MOST
   * @param heightMode MeasureMode used during calculation of layout
   * @param attachmentsPositions Always null. Only present for backwards compatibility.
   * @return bit-packed width and height created via YogaMeasureOutput.make().
   */
  public long measure(
      Context context,
      @Nullable ReadableMap localData,
      @Nullable ReadableMap props,
      @Nullable ReadableMap state,
      float width,
      YogaMeasureMode widthMode,
      float height,
      YogaMeasureMode heightMode,
      @Nullable float[] attachmentsPositions) {
    return 0;
  }

  /**
   * Subclasses can override this method to set padding for the given View in Fabric. Since not all
   * components support setting padding, the default implementation of this method does nothing.
   */
  public void setPadding(T view, int left, int top, int right, int bottom) {}

  /**
   * Lifecycle method: called when a surface is stopped. Currently only used for View Recycling
   * cleanup. There is no corresponding startSurface lifecycle event for ViewManagers because we
   * currently only need this for recycling cleanup. Only called in Fabric.
   */
  public void onSurfaceStopped(int surfaceId) {
    if (mRecyclableViews != null) {
      mRecyclableViews.remove(surfaceId);
    }
  }

  /** With even slight memory pressure, we immediately evict all recyclable Views. */
  /* package */ void trimMemory() {
    // Wipe out all existing recyclable Views, but do not disable View Recycling entirely.
    // We only take any action if View Recycling is already enabled.
    if (mRecyclableViews != null) {
      mRecyclableViews = new HashMap<>();
    }
  }

  /**
   * THIS PREFETCH METHOD IS EXPERIMENTAL, DO NOT USE IT FOR PRODUCTION CODE, MOST LIKELY IT WILL
   * CHANGE OR BE REMOVED IN THE FUTURE.
   *
   * <p>Subclasses can override this method to implement custom resource prefetching for the
   * ViewManager.
   *
   * @param surfaceId surface ID
   * @param reactContext {@link com.facebook.react.bridge.ReactContext} used for the view.
   * @param params {@link MapBuffer} prefetch request params defined in C++
   */
  @UnstableReactNativeAPI
  public void experimental_prefetchResources(
      int surfaceId, ThemedReactContext reactContext, MapBuffer params) {
    return;
  }

  @UnstableReactNativeAPI
  protected boolean experimental_isPrefetchingEnabled() {
    return ReactNativeFeatureFlags.enableImagePrefetchingAndroid();
  }
}
