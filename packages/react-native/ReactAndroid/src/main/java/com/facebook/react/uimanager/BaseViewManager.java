/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.os.Build;
import android.text.TextUtils;
import android.view.View;
import android.view.View.OnFocusChangeListener;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityEvent;
import androidx.annotation.ColorInt;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.view.ViewCompat;
import com.facebook.common.logging.FLog;
import com.facebook.react.R;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole;
import com.facebook.react.uimanager.ReactAccessibilityDelegate.Role;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.BlurEvent;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.react.uimanager.events.FocusEvent;
import com.facebook.react.uimanager.events.PointerEventHelper;
import com.facebook.react.uimanager.style.OutlineStyle;
import com.facebook.react.uimanager.util.ReactFindViewUtil;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Base class that should be suitable for the majority of subclasses of {@link ViewManager}. It
 * provides support for base view properties such as backgroundColor, opacity, etc.
 */
public abstract class BaseViewManager<T extends View, C extends LayoutShadowNode>
    extends ViewManager<T, C> implements View.OnLayoutChangeListener {

  private static final int PERSPECTIVE_ARRAY_INVERTED_CAMERA_DISTANCE_INDEX = 2;
  private static final float CAMERA_DISTANCE_NORMALIZATION_MULTIPLIER = (float) Math.sqrt(5);

  private static final MatrixMathHelper.MatrixDecompositionContext sMatrixDecompositionContext =
      new MatrixMathHelper.MatrixDecompositionContext();
  private static final double[] sTransformDecompositionArray = new double[16];

  private static final String STATE_CHECKED = "checked"; // Special case for mixed state checkboxes
  private static final String STATE_BUSY = "busy";
  private static final String STATE_EXPANDED = "expanded";
  private static final String STATE_MIXED = "mixed";

  public BaseViewManager() {
    super(null);
  }

  public BaseViewManager(@Nullable ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  protected @Nullable T prepareToRecycleView(@NonNull ThemedReactContext reactContext, T view) {
    // Reset tags
    view.setTag(null);
    view.setTag(R.id.pointer_events, null);
    view.setTag(R.id.important_for_interaction, null);
    view.setTag(R.id.react_test_id, null);
    view.setTag(R.id.view_tag_native_id, null);
    view.setTag(R.id.labelled_by, null);
    view.setTag(R.id.accessibility_label, null);
    view.setTag(R.id.accessibility_hint, null);
    view.setTag(R.id.accessibility_role, null);
    view.setTag(R.id.accessibility_state, null);
    view.setTag(R.id.accessibility_actions, null);
    view.setTag(R.id.accessibility_value, null);
    view.setTag(R.id.accessibility_state_expanded, null);
    view.setTag(R.id.view_clipped, null);

    // This indirectly calls (and resets):
    // setTranslationX
    // setTranslationY
    // setRotation
    // setRotationX
    // setRotationY
    // setScaleX
    // setScaleY
    // setCameraDistance
    setTransformProperty(view, null, null);

    // RenderNode params not covered by setTransformProperty above
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      view.resetPivot();
    } else {
      // no way of resetting pivot, or knowing whether it is set
      return null;
    }
    view.setTop(0);
    view.setBottom(0);
    view.setLeft(0);
    view.setRight(0);
    view.setElevation(0);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      // failsafe - should already be set to null when animation finishes
      view.setAnimationMatrix(null);
    }

    view.setTag(R.id.transform, null);
    view.setTag(R.id.transform_origin, null);
    view.setTag(R.id.invalidate_transform, null);
    view.removeOnLayoutChangeListener(this);

    view.setTag(R.id.use_hardware_layer, null);
    view.setTag(R.id.filter, null);
    view.setTag(R.id.mix_blend_mode, null);
    LayerEffectsHelper.apply(view, null, null);

    // setShadowColor
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      view.setOutlineAmbientShadowColor(Color.BLACK);
      view.setOutlineSpotShadowColor(Color.BLACK);
    }

    // Focus IDs
    // Also see in AOSP source:
    // https://android.googlesource.com/platform/frameworks/base/+/a175a5b/core/java/android/view/View.java#4493
    view.setNextFocusDownId(View.NO_ID);
    view.setNextFocusForwardId(View.NO_ID);
    view.setNextFocusRightId(View.NO_ID);
    view.setNextFocusUpId(View.NO_ID);

    // This is possibly subject to change and overridable per-platform, but these
    // are the default view flags in View.java:
    // https://android.googlesource.com/platform/frameworks/base/+/a175a5b/core/java/android/view/View.java#2712
    // `mViewFlags = SOUND_EFFECTS_ENABLED | HAPTIC_FEEDBACK_ENABLED | LAYOUT_DIRECTION_INHERIT`

    // NOTE: setClickable MUST be called AFTER setOnClickListener because
    // the latter has the side effect of setting isClickable=true on some views!
    view.setOnClickListener(null);
    view.setClickable(false);
    view.setFocusable(false);
    view.setFocusableInTouchMode(false);

    // https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-mainline-12.0.0_r96/core/java/android/view/View.java#5491
    view.setElevation(0);

    // Predictably, alpha defaults to 1:
    // https://android.googlesource.com/platform/frameworks/base/+/a175a5b/core/java/android/view/View.java#2186
    // This accounts for resetting mBackfaceOpacity and mBackfaceVisibility
    view.setAlpha(1);

    // setPadding is a noop for most View types, but it is not for Text
    setPadding(view, 0, 0, 0, 0);

    // Other stuff
    view.setForeground(null);

    return view;
  }

  @Override
  protected void addEventEmitters(@NonNull ThemedReactContext reactContext, @NonNull T view) {
    super.addEventEmitters(reactContext, view);

    BaseVMFocusChangeListener focusChangeListener =
        new BaseVMFocusChangeListener(view.getOnFocusChangeListener());
    focusChangeListener.attach(view);
  }

  @Override
  public void onDropViewInstance(@NonNull T view) {
    super.onDropViewInstance(view);

    @Nullable OnFocusChangeListener focusChangeListener = view.getOnFocusChangeListener();
    if (focusChangeListener instanceof BaseVMFocusChangeListener) {
      ((BaseVMFocusChangeListener) focusChangeListener).detach(view);
    }

    if (view instanceof ViewGroup) {
      ((ViewGroup) view).setOnHierarchyChangeListener(null);
    }
  }

  // Currently, layout listener is only attached when transform or transformOrigin is set.
  @Override
  public void onLayoutChange(
      View v,
      int left,
      int top,
      int right,
      int bottom,
      int oldLeft,
      int oldTop,
      int oldRight,
      int oldBottom) {
    // Old width and height
    int oldWidth = oldRight - oldLeft;
    int oldHeight = oldBottom - oldTop;

    // Current width and height
    int currentWidth = right - left;
    int currentHeight = bottom - top;

    if ((currentHeight != oldHeight || currentWidth != oldWidth)) {
      ReadableArray transformOrigin = (ReadableArray) v.getTag(R.id.transform_origin);
      ReadableArray transforms = (ReadableArray) v.getTag(R.id.transform);
      if (transforms != null || transformOrigin != null) {
        setTransformProperty((T) v, transforms, transformOrigin);
      }
    }
  }

  @ReactProp(
      name = ViewProps.BACKGROUND_COLOR,
      defaultInt = Color.TRANSPARENT,
      customType = "Color")
  public void setBackgroundColor(@NonNull T view, @ColorInt int backgroundColor) {
    BackgroundStyleApplicator.setBackgroundColor(view, backgroundColor);
  }

  @ReactProp(name = ViewProps.FILTER, customType = "Filter")
  public void setFilter(@NonNull T view, @Nullable ReadableArray filter) {
    view.setTag(R.id.filter, filter);
  }

  @ReactProp(name = ViewProps.MIX_BLEND_MODE)
  public void setMixBlendMode(@NonNull T view, @Nullable String mixBlendMode) {
    view.setTag(R.id.mix_blend_mode, BlendModeHelper.parseMixBlendMode(mixBlendMode));
    // We need to trigger drawChild for the parent ViewGroup which will set the
    // mixBlendMode compositing on the child
    if (view.getParent() instanceof View) {
      ((View) view.getParent()).invalidate();
    }
  }

  @ReactProp(name = ViewProps.TRANSFORM)
  public void setTransform(@NonNull T view, @Nullable ReadableArray matrix) {
    @Nullable ReadableArray currentTransform = (ReadableArray) view.getTag(R.id.transform);
    if (!Objects.equals(currentTransform, matrix)) {
      view.setTag(R.id.transform, matrix);
      view.setTag(R.id.invalidate_transform, true);
    }
  }

  @ReactProp(name = ViewProps.TRANSFORM_ORIGIN)
  public void setTransformOrigin(@NonNull T view, @Nullable ReadableArray transformOrigin) {
    @Nullable
    ReadableArray currentTransformOrigin = (ReadableArray) view.getTag(R.id.transform_origin);
    if (!Objects.equals(currentTransformOrigin, transformOrigin)) {
      view.setTag(R.id.transform_origin, transformOrigin);
      view.setTag(R.id.invalidate_transform, true);
    }
  }

  @ReactProp(name = ViewProps.OPACITY, defaultFloat = 1.f)
  public void setOpacity(@NonNull T view, float opacity) {
    view.setAlpha(opacity);
  }

  @ReactProp(name = ViewProps.ELEVATION)
  public void setElevation(@NonNull T view, float elevation) {
    ViewCompat.setElevation(view, PixelUtil.toPixelFromDIP(elevation));
  }

  @ReactProp(name = ViewProps.SHADOW_COLOR, defaultInt = Color.BLACK, customType = "Color")
  public void setShadowColor(@NonNull T view, int shadowColor) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      view.setOutlineAmbientShadowColor(shadowColor);
      view.setOutlineSpotShadowColor(shadowColor);
    }
  }

  @ReactProp(name = ViewProps.Z_INDEX)
  public void setZIndex(@NonNull T view, float zIndex) {
    // No-op: Z-order is managed at the C++ layer in Fabric
  }

  @ReactProp(name = ViewProps.RENDER_TO_HARDWARE_TEXTURE)
  public void setRenderToHardwareTexture(@NonNull T view, boolean useHWTexture) {
    view.setTag(R.id.use_hardware_layer, useHWTexture);
  }

  @ReactProp(name = ViewProps.TEST_ID)
  public void setTestId(@NonNull T view, @Nullable String testId) {
    view.setTag(R.id.react_test_id, testId);

    // temporarily set the tag and keyed tags to avoid end to end test regressions
    view.setTag(testId);
  }

  @ReactProp(name = ViewProps.NATIVE_ID)
  public void setNativeId(@NonNull T view, @Nullable String nativeId) {
    view.setTag(R.id.view_tag_native_id, nativeId);

    ReactFindViewUtil.notifyViewRendered(view);
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_LABELLED_BY)
  public void setAccessibilityLabelledBy(@NonNull T view, @Nullable Dynamic nativeId) {
    if (nativeId == null || nativeId.isNull()) {
      view.setTag(R.id.labelled_by, null);
      return;
    }
    if (nativeId.getType() == ReadableType.String) {
      view.setTag(R.id.labelled_by, nativeId.asString());
    } else if (nativeId.getType() == ReadableType.Array) {
      // On Android, this takes a single View as labeledBy. If an array is specified, set the first
      // element in the tag.
      ReadableArray array = nativeId.asArray();
      view.setTag(R.id.labelled_by, array.size() > 0 ? array.getString(0) : null);
    }
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_LABEL)
  public void setAccessibilityLabel(@NonNull T view, @Nullable String accessibilityLabel) {
    view.setTag(R.id.accessibility_label, accessibilityLabel);
    updateViewContentDescription(view);
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_HINT)
  public void setAccessibilityHint(@NonNull T view, @Nullable String accessibilityHint) {
    view.setTag(R.id.accessibility_hint, accessibilityHint);
    updateViewContentDescription(view);
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_ROLE)
  public void setAccessibilityRole(@NonNull T view, @Nullable String accessibilityRole) {
    if (accessibilityRole == null) {
      view.setTag(R.id.accessibility_role, null);
    } else {
      view.setTag(R.id.accessibility_role, AccessibilityRole.fromValue(accessibilityRole));
    }
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_COLLECTION)
  public void setAccessibilityCollection(
      @NonNull T view, @Nullable ReadableMap accessibilityCollection) {
    view.setTag(R.id.accessibility_collection, accessibilityCollection);
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_COLLECTION_ITEM)
  public void setAccessibilityCollectionItem(
      @NonNull T view, @Nullable ReadableMap accessibilityCollectionItem) {
    view.setTag(R.id.accessibility_collection_item, accessibilityCollectionItem);
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_STATE)
  public void setViewState(@NonNull T view, @Nullable ReadableMap accessibilityState) {
    if (accessibilityState == null) {
      return;
    }
    if (accessibilityState.hasKey("expanded")) {
      view.setTag(R.id.accessibility_state_expanded, accessibilityState.getBoolean("expanded"));
    }
    if (accessibilityState.hasKey("selected")) {
      boolean prevSelected = view.isSelected();
      boolean nextSelected = accessibilityState.getBoolean("selected");
      view.setSelected(nextSelected);

      // For some reason, Android does not announce "unselected" when state changes.
      // This is inconsistent with other platforms, but also with the "checked" state.
      // So manually announce this.
      if (view.isAccessibilityFocused() && prevSelected && !nextSelected) {
        view.announceForAccessibility(
            view.getContext().getString(R.string.state_unselected_description));
      }
    } else {
      view.setSelected(false);
    }
    view.setTag(R.id.accessibility_state, accessibilityState);
    if (accessibilityState.hasKey("disabled")) {
      view.setEnabled(!accessibilityState.getBoolean("disabled"));
    }

    // For states which don't have corresponding methods in
    // AccessibilityNodeInfo, update the view's content description
    // here

    final ReadableMapKeySetIterator i = accessibilityState.keySetIterator();
    while (i.hasNextKey()) {
      final String state = i.nextKey();
      if (state.equals(STATE_BUSY)
          || state.equals(STATE_EXPANDED)
          || (state.equals(STATE_CHECKED)
              && accessibilityState.getType(STATE_CHECKED) == ReadableType.String)) {
        updateViewContentDescription(view);
        break;
      } else if (view.isAccessibilityFocused()) {
        // Internally Talkback ONLY uses TYPE_VIEW_CLICKED for "checked" and
        // "selected" announcements. Send a click event to make sure Talkback
        // get notified for the state changes that don't happen upon users' click.
        // For the state changes that happens immediately, Talkback will skip
        // the duplicated click event.
        view.sendAccessibilityEvent(AccessibilityEvent.TYPE_VIEW_CLICKED);
      }
    }
  }

  private void updateViewContentDescription(@NonNull T view) {
    final String accessibilityLabel = (String) view.getTag(R.id.accessibility_label);
    final ReadableMap accessibilityState = (ReadableMap) view.getTag(R.id.accessibility_state);
    final List<String> contentDescription = new ArrayList<>();
    final ReadableMap accessibilityValue = (ReadableMap) view.getTag(R.id.accessibility_value);
    if (accessibilityLabel != null) {
      contentDescription.add(accessibilityLabel);
    }
    if (accessibilityState != null) {
      final ReadableMapKeySetIterator i = accessibilityState.keySetIterator();
      while (i.hasNextKey()) {
        final String state = i.nextKey();
        final Dynamic value = accessibilityState.getDynamic(state);
        if (state.equals(STATE_CHECKED)
            && value.getType() == ReadableType.String
            && value.asString().equals(STATE_MIXED)) {
          contentDescription.add(view.getContext().getString(R.string.state_mixed_description));
        } else if (state.equals(STATE_BUSY)
            && value.getType() == ReadableType.Boolean
            && value.asBoolean()) {
          contentDescription.add(view.getContext().getString(R.string.state_busy_description));
        }
      }
    }
    if (accessibilityValue != null && accessibilityValue.hasKey("text")) {
      final Dynamic text = accessibilityValue.getDynamic("text");
      if (text != null && text.getType() == ReadableType.String) {
        contentDescription.add(text.asString());
      }
    }
    if (!contentDescription.isEmpty()) {
      view.setContentDescription(TextUtils.join(", ", contentDescription));
    }
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_ACTIONS)
  public void setAccessibilityActions(T view, ReadableArray accessibilityActions) {
    if (accessibilityActions == null) {
      return;
    }

    view.setTag(R.id.accessibility_actions, accessibilityActions);
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_VALUE)
  public void setAccessibilityValue(T view, ReadableMap accessibilityValue) {
    if (accessibilityValue == null) {
      view.setTag(R.id.accessibility_value, null);
      view.setContentDescription(null);
    } else {
      view.setTag(R.id.accessibility_value, accessibilityValue);
      if (accessibilityValue.hasKey("text")) {
        updateViewContentDescription(view);
      }
    }
  }

  @ReactProp(name = ViewProps.IMPORTANT_FOR_ACCESSIBILITY)
  public void setImportantForAccessibility(
      @NonNull T view, @Nullable String importantForAccessibility) {
    if (importantForAccessibility == null || importantForAccessibility.equals("auto")) {
      view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_AUTO);
    } else if (importantForAccessibility.equals("yes")) {
      view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_YES);
    } else if (importantForAccessibility.equals("no")) {
      view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
    } else if (importantForAccessibility.equals("no-hide-descendants")) {
      view.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);
    }
  }

  @ReactProp(name = ViewProps.SCREEN_READER_FOCUSABLE)
  public void setScreenReaderFocusable(@NonNull T view, boolean screenReaderFocusable) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      view.setScreenReaderFocusable(screenReaderFocusable);
    }
  }

  @ReactProp(name = ViewProps.ROLE)
  public void setRole(@NonNull T view, @Nullable String role) {
    if (role == null) {
      view.setTag(R.id.role, null);
    } else {
      view.setTag(R.id.role, Role.fromValue(role));
    }
  }

  @Deprecated
  @ReactProp(name = ViewProps.ROTATION)
  public void setRotation(@NonNull T view, float rotation) {
    view.setRotation(rotation);
  }

  @Deprecated
  @ReactProp(name = ViewProps.SCALE_X, defaultFloat = 1f)
  public void setScaleX(@NonNull T view, float scaleX) {
    view.setScaleX(scaleX);
  }

  @Deprecated
  @ReactProp(name = ViewProps.SCALE_Y, defaultFloat = 1f)
  public void setScaleY(@NonNull T view, float scaleY) {
    view.setScaleY(scaleY);
  }

  @Deprecated
  @ReactProp(name = ViewProps.TRANSLATE_X, defaultFloat = 0f)
  public void setTranslateX(@NonNull T view, float translateX) {
    view.setTranslationX(PixelUtil.toPixelFromDIP(translateX));
  }

  @Deprecated
  @ReactProp(name = ViewProps.TRANSLATE_Y, defaultFloat = 0f)
  public void setTranslateY(@NonNull T view, float translateY) {
    view.setTranslationY(PixelUtil.toPixelFromDIP(translateY));
  }

  @ReactProp(name = ViewProps.ACCESSIBILITY_LIVE_REGION)
  public void setAccessibilityLiveRegion(@NonNull T view, @Nullable String liveRegion) {
    if (liveRegion == null || liveRegion.equals("none")) {
      ViewCompat.setAccessibilityLiveRegion(view, ViewCompat.ACCESSIBILITY_LIVE_REGION_NONE);
    } else if (liveRegion.equals("polite")) {
      ViewCompat.setAccessibilityLiveRegion(view, ViewCompat.ACCESSIBILITY_LIVE_REGION_POLITE);
    } else if (liveRegion.equals("assertive")) {
      ViewCompat.setAccessibilityLiveRegion(view, ViewCompat.ACCESSIBILITY_LIVE_REGION_ASSERTIVE);
    }
  }

  // Extracting helper method to inner class to avoid reflection on older Android versions
  // hitting the unknown BlendMode type
  private static class LayerEffectsHelper {
    public static void apply(
        @NonNull View view, @Nullable ReadableArray filter, @Nullable Boolean useHWLayer) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        view.setRenderEffect(null);
      }

      @Nullable Paint p = null;

      if (filter != null) {
        if (FilterHelper.isOnlyColorMatrixFilters(filter)) {
          p = new Paint();
          p.setColorFilter(FilterHelper.parseColorMatrixFilters(filter));
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          view.setRenderEffect(FilterHelper.parseFilters(filter));
        }
      }

      if (p == null) {
        int layerType =
            useHWLayer != null && useHWLayer ? View.LAYER_TYPE_HARDWARE : View.LAYER_TYPE_NONE;
        view.setLayerType(layerType, null);
      } else {
        view.setLayerType(View.LAYER_TYPE_HARDWARE, p);
      }
    }
  }

  protected void setTransformProperty(
      @NonNull T view,
      @Nullable ReadableArray transforms,
      @Nullable ReadableArray transformOrigin) {
    if (transforms == null) {
      view.setTranslationX(PixelUtil.toPixelFromDIP(0));
      view.setTranslationY(PixelUtil.toPixelFromDIP(0));
      view.setRotation(0);
      view.setRotationX(0);
      view.setRotationY(0);
      view.setScaleX(1);
      view.setScaleY(1);
      view.setCameraDistance(0);
      clearSkewAnimationMatrixIfActive(view);
      return;
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
        && SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)) {
      Matrix affine =
          SkewMatrixHelper.buildAffine2DMatrix(
              transforms,
              PixelUtil.toDIPFromPixel(view.getWidth()),
              PixelUtil.toDIPFromPixel(view.getHeight()),
              transformOrigin);
      view.setTranslationX(0);
      view.setTranslationY(0);
      view.setRotation(0);
      view.setRotationX(0);
      view.setRotationY(0);
      view.setScaleX(1);
      view.setScaleY(1);
      view.setCameraDistance(0);
      view.setAnimationMatrix(affine);
      // Tag value is the matrix itself so TouchTargetHelper can use it for hit testing -- View's
      // own getMatrix() does not compose mAnimationMatrix, so without this fallback the React
      // hit-test path would still see the original rectangular bounds.
      view.setTag(R.id.skew_animation_matrix, affine);
      return;
    }

    sMatrixDecompositionContext.reset();
    TransformHelper.processTransform(
        transforms,
        sTransformDecompositionArray,
        PixelUtil.toDIPFromPixel(view.getWidth()),
        PixelUtil.toDIPFromPixel(view.getHeight()),
        transformOrigin);
    MatrixMathHelper.decomposeMatrix(sTransformDecompositionArray, sMatrixDecompositionContext);
    view.setTranslationX(
        PixelUtil.toPixelFromDIP(
            sanitizeFloatPropertyValue((float) sMatrixDecompositionContext.translation[0])));
    view.setTranslationY(
        PixelUtil.toPixelFromDIP(
            sanitizeFloatPropertyValue((float) sMatrixDecompositionContext.translation[1])));
    view.setRotation(
        sanitizeFloatPropertyValue((float) sMatrixDecompositionContext.rotationDegrees[2]));
    view.setRotationX(
        sanitizeFloatPropertyValue((float) sMatrixDecompositionContext.rotationDegrees[0]));
    view.setRotationY(
        sanitizeFloatPropertyValue((float) sMatrixDecompositionContext.rotationDegrees[1]));
    view.setScaleX(sanitizeFloatPropertyValue((float) sMatrixDecompositionContext.scale[0]));
    view.setScaleY(sanitizeFloatPropertyValue((float) sMatrixDecompositionContext.scale[1]));

    double[] perspectiveArray = sMatrixDecompositionContext.perspective;

    if (perspectiveArray.length > PERSPECTIVE_ARRAY_INVERTED_CAMERA_DISTANCE_INDEX) {
      float invertedCameraDistance =
          (float) perspectiveArray[PERSPECTIVE_ARRAY_INVERTED_CAMERA_DISTANCE_INDEX];
      if (invertedCameraDistance == 0) {
        // Default camera distance, before scale multiplier (1280)
        invertedCameraDistance = 0.00078125f;
      }
      float cameraDistance = -1 / invertedCameraDistance;
      float scale = DisplayMetricsHolder.getScreenDisplayMetrics().density;

      // The following converts the matrix's perspective to a camera distance
      // such that the camera perspective looks the same on Android and iOS.
      // The native Android implementation removed the screen density from the
      // calculation, so squaring and a normalization value of
      // sqrt(5) produces an exact replica with iOS.
      // For more information, see https://github.com/facebook/react-native/pull/18302
      float normalizedCameraDistance =
          sanitizeFloatPropertyValue(
              scale * scale * cameraDistance * CAMERA_DISTANCE_NORMALIZATION_MULTIPLIER);
      view.setCameraDistance(normalizedCameraDistance);
    }

    clearSkewAnimationMatrixIfActive(view);
  }

  // setAnimationMatrix is called only on the transition out of a skew matrix; calling it
  // unconditionally would invalidate the View's RenderNode every frame for any non-skew animation.
  private static <T extends View> void clearSkewAnimationMatrixIfActive(@NonNull T view) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      return;
    }
    if (view.getTag(R.id.skew_animation_matrix) == null) {
      return;
    }
    view.setAnimationMatrix(null);
    view.setTag(R.id.skew_animation_matrix, null);
  }

  /**
   * Prior to Android P things like setScaleX() allowed passing float values that were bogus such as
   * Float.NaN. If the app is targeting Android P or later then passing these values will result in
   * an exception being thrown. Since JS might still send Float.NaN, we want to keep the code
   * backward compatible and continue using the fallback value if an invalid float is passed.
   */
  private static float sanitizeFloatPropertyValue(float value) {
    if (value >= -Float.MAX_VALUE && value <= Float.MAX_VALUE) {
      return value;
    }
    if (value < -Float.MAX_VALUE || value == Float.NEGATIVE_INFINITY) {
      return -Float.MAX_VALUE;
    }
    if (value > Float.MAX_VALUE || value == Float.POSITIVE_INFINITY) {
      return Float.MAX_VALUE;
    }
    if (Float.isNaN(value)) {
      return 0;
    }
    // Shouldn't be possible to reach this point.
    throw new IllegalStateException("Invalid float property value: " + value);
  }

  protected void updateViewAccessibility(@NonNull T view) {
    ReactAccessibilityDelegate.setDelegate(
        view, view.isFocusable(), view.getImportantForAccessibility());
  }

  @Override
  protected void onAfterUpdateTransaction(@NonNull T view) {
    super.onAfterUpdateTransaction(view);
    updateViewAccessibility(view);

    Boolean invalidateTransform = (Boolean) view.getTag(R.id.invalidate_transform);
    if (invalidateTransform != null && invalidateTransform) {
      view.addOnLayoutChangeListener(this);
      ReadableArray transformOrigin = (ReadableArray) view.getTag(R.id.transform_origin);
      ReadableArray transforms = (ReadableArray) view.getTag(R.id.transform);
      setTransformProperty(view, transforms, transformOrigin);
      view.setTag(R.id.invalidate_transform, false);
    }

    ReadableArray filter = (ReadableArray) view.getTag(R.id.filter);
    Boolean useHWLayer = (Boolean) view.getTag(R.id.use_hardware_layer);

    LayerEffectsHelper.apply(view, filter, useHWLayer);
  }

  @Override
  public @Nullable Map<String, Object> getExportedCustomBubblingEventTypeConstants() {
    Map<String, Object> baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants();
    Map<String, Object> eventTypeConstants =
        baseEventTypeConstants == null ? new HashMap<String, Object>() : baseEventTypeConstants;
    eventTypeConstants.putAll(
        MapBuilder.<String, Object>builder()
            .put(
                "topPointerCancel",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of(
                        "bubbled", "onPointerCancel", "captured", "onPointerCancelCapture")))
            .put(
                "topPointerDown",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onPointerDown", "captured", "onPointerDownCapture")))
            .put(
                "topPointerEnter",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of(
                        "bubbled",
                        "onPointerEnter",
                        "captured",
                        "onPointerEnterCapture",
                        "skipBubbling",
                        true)))
            .put(
                "topPointerLeave",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of(
                        "bubbled",
                        "onPointerLeave",
                        "captured",
                        "onPointerLeaveCapture",
                        "skipBubbling",
                        true)))
            .put(
                "topPointerMove",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onPointerMove", "captured", "onPointerMoveCapture")))
            .put(
                "topPointerUp",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onPointerUp", "captured", "onPointerUpCapture")))
            .put(
                "topPointerOut",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onPointerOut", "captured", "onPointerOutCapture")))
            .put(
                "topPointerOver",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onPointerOver", "captured", "onPointerOverCapture")))
            .put(
                "topClick",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onClick", "captured", "onClickCapture")))
            .put(
                "topBlur",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onBlur", "captured", "onBlurCapture")))
            .put(
                "topFocus",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onFocus", "captured", "onFocusCapture")))
            .put(
                "topKeyDown",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onKeyDown", "captured", "onKeyDownCapture")))
            .put(
                "topKeyUp",
                MapBuilder.of(
                    "phasedRegistrationNames",
                    MapBuilder.of("bubbled", "onKeyUp", "captured", "onKeyUpCapture")))
            .build());
    return eventTypeConstants;
  }

  @Override
  public @Nullable Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    @Nullable
    Map<String, Object> baseEventTypeConstants = super.getExportedCustomDirectEventTypeConstants();
    Map<String, Object> eventTypeConstants =
        baseEventTypeConstants == null ? new HashMap<String, Object>() : baseEventTypeConstants;
    eventTypeConstants.putAll(
        MapBuilder.<String, Object>builder()
            .put(
                "topAccessibilityAction",
                MapBuilder.of("registrationName", "onAccessibilityAction"))
            .build());
    return eventTypeConstants;
  }

  // TODO: These are all pretty silly, since they do nothing, support less props and shapes than
  // View, and the only external usage is RNSVG which just calls the superclass ViewManager version.
  public void setBorderRadius(T view, float borderRadius) {
    logUnsupportedPropertyWarning(ViewProps.BORDER_RADIUS);
  }

  public void setBorderBottomLeftRadius(T view, float borderRadius) {
    logUnsupportedPropertyWarning(ViewProps.BORDER_BOTTOM_LEFT_RADIUS);
  }

  public void setBorderBottomRightRadius(T view, float borderRadius) {
    logUnsupportedPropertyWarning(ViewProps.BORDER_BOTTOM_RIGHT_RADIUS);
  }

  public void setBorderTopLeftRadius(T view, float borderRadius) {
    logUnsupportedPropertyWarning(ViewProps.BORDER_TOP_LEFT_RADIUS);
  }

  public void setBorderTopRightRadius(T view, float borderRadius) {
    logUnsupportedPropertyWarning(ViewProps.BORDER_TOP_RIGHT_RADIUS);
  }

  @ReactProp(name = ViewProps.OUTLINE_COLOR, customType = "Color")
  public void setOutlineColor(T view, @Nullable Integer color) {
    BackgroundStyleApplicator.setOutlineColor(view, color);
  }

  @ReactProp(name = ViewProps.OUTLINE_OFFSET)
  public void setOutlineOffset(T view, float offset) {
    BackgroundStyleApplicator.setOutlineOffset(view, offset);
  }

  @ReactProp(name = ViewProps.OUTLINE_STYLE)
  public void setOutlineStyle(T view, @Nullable String outlineStyle) {
    @Nullable
    OutlineStyle parsedOutlineStyle =
        outlineStyle == null ? null : OutlineStyle.fromString(outlineStyle);
    BackgroundStyleApplicator.setOutlineStyle(view, parsedOutlineStyle);
  }

  @ReactProp(name = ViewProps.OUTLINE_WIDTH)
  public void setOutlineWidth(T view, float width) {
    BackgroundStyleApplicator.setOutlineWidth(view, width);
  }

  @ReactProp(name = ViewProps.BOX_SHADOW, customType = "BoxShadow")
  public void setBoxShadow(T view, @Nullable ReadableArray shadows) {
    BackgroundStyleApplicator.setBoxShadow(view, shadows);
  }

  private void logUnsupportedPropertyWarning(String propName) {
    FLog.w(ReactConstants.TAG, "%s doesn't support property '%s'", getName(), propName);
  }

  private static void setPointerEventsFlag(
      @NonNull View view, PointerEventHelper.EVENT event, boolean isListening) {
    Integer tag = (Integer) view.getTag(R.id.pointer_events);
    int currentValue = tag != null ? tag.intValue() : 0;
    int flag = 1 << event.ordinal();
    view.setTag(R.id.pointer_events, isListening ? (currentValue | flag) : (currentValue & ~flag));
  }

  /* Experimental W3C Pointer events start */
  @ReactProp(name = ViewProps.ON_POINTER_ENTER)
  public void setPointerEnter(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.ENTER, value);
  }

  @ReactProp(name = ViewProps.ON_POINTER_ENTER_CAPTURE)
  public void setPointerEnterCapture(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.ENTER_CAPTURE, value);
  }

  @ReactProp(name = ViewProps.ON_POINTER_OVER)
  public void setPointerOver(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.OVER, value);
  }

  @ReactProp(name = ViewProps.ON_POINTER_OVER_CAPTURE)
  public void setPointerOverCapture(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.OVER_CAPTURE, value);
  }

  @ReactProp(name = ViewProps.ON_POINTER_OUT)
  public void setPointerOut(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.OUT, value);
  }

  @ReactProp(name = ViewProps.ON_POINTER_OUT_CAPTURE)
  public void setPointerOutCapture(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.OUT_CAPTURE, value);
  }

  @ReactProp(name = ViewProps.ON_POINTER_LEAVE)
  public void setPointerLeave(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.LEAVE, value);
  }

  @ReactProp(name = ViewProps.ON_POINTER_LEAVE_CAPTURE)
  public void setPointerLeaveCapture(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.LEAVE_CAPTURE, value);
  }

  @ReactProp(name = ViewProps.ON_POINTER_MOVE)
  public void setPointerMove(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.MOVE, value);
  }

  @ReactProp(name = ViewProps.ON_POINTER_MOVE_CAPTURE)
  public void setPointerMoveCapture(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.MOVE_CAPTURE, value);
  }

  @ReactProp(name = ViewProps.ON_CLICK)
  public void setClick(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.CLICK, value);
  }

  @ReactProp(name = ViewProps.ON_CLICK_CAPTURE)
  public void setClickCapture(@NonNull T view, boolean value) {
    setPointerEventsFlag(view, PointerEventHelper.EVENT.CLICK_CAPTURE, value);
  }

  /* Experimental W3C Pointer events end */

  @ReactProp(name = "onMoveShouldSetResponder")
  public void setMoveShouldSetResponder(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onMoveShouldSetResponderCapture")
  public void setMoveShouldSetResponderCapture(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onStartShouldSetResponder")
  public void setStartShouldSetResponder(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onStartShouldSetResponderCapture")
  public void setStartShouldSetResponderCapture(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onResponderGrant")
  public void setResponderGrant(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onResponderReject")
  public void setResponderReject(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onResponderStart")
  public void setResponderStart(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onResponderEnd")
  public void setResponderEnd(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onResponderRelease")
  public void setResponderRelease(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onResponderMove")
  public void setResponderMove(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onResponderTerminate")
  public void setResponderTerminate(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onResponderTerminationRequest")
  public void setResponderTerminationRequest(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onShouldBlockNativeResponder")
  public void setShouldBlockNativeResponder(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onTouchStart")
  public void setTouchStart(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onTouchMove")
  public void setTouchMove(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onTouchEnd")
  public void setTouchEnd(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  @ReactProp(name = "onTouchCancel")
  public void setTouchCancel(@NonNull T view, boolean value) {
    // no-op, handled by JSResponder
  }

  // Please add new props to BaseViewManagerDelegate as well!

  /**
   * A helper class to keep track of the original focus change listener if one is set. This is
   * especially helpful for views that are recycled so we can retain and restore the original
   * listener upon recycling (onDropViewInstance).
   */
  private static class BaseVMFocusChangeListener implements OnFocusChangeListener {
    private @Nullable OnFocusChangeListener mOriginalFocusChangeListener;

    public BaseVMFocusChangeListener(@Nullable OnFocusChangeListener originalFocusChangeListener) {
      mOriginalFocusChangeListener = originalFocusChangeListener;
    }

    public void attach(View view) {
      view.setOnFocusChangeListener(this);
    }

    public void detach(View view) {
      view.setOnFocusChangeListener(mOriginalFocusChangeListener);
    }

    @Override
    public void onFocusChange(View view, boolean hasFocus) {
      if (mOriginalFocusChangeListener != null) {
        mOriginalFocusChangeListener.onFocusChange(view, hasFocus);
      }
      int surfaceId = UIManagerHelper.getSurfaceId(view.getContext());
      if (surfaceId == View.NO_ID) {
        return;
      }
      if (view.getContext() instanceof ThemedReactContext) {
        ThemedReactContext themedReactContext = (ThemedReactContext) view.getContext();
        @Nullable
        EventDispatcher eventDispatcher = UIManagerHelper.getEventDispatcher(themedReactContext);
        if (eventDispatcher != null) {
          if (hasFocus) {
            eventDispatcher.dispatchEvent(new FocusEvent(surfaceId, view.getId()));
          } else {
            eventDispatcher.dispatchEvent(new BlurEvent(surfaceId, view.getId()));
          }
        }
      }
    }
  }
}
