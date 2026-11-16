/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import android.graphics.Color;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;
import com.facebook.testutils.shadows.ShadowSoLoader;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

@RunWith(RobolectricTestRunner.class)
@Config(shadows = ShadowSoLoader.class)
public class BaseViewManagerDelegateTest {
  private ReactViewManager viewManager;
  private ReactViewGroup view;
  private BaseViewManagerDelegate<ReactViewGroup, ReactViewManager> delegate;

  @Before
  public void setUp() {
    // Constructing a ReactViewGroup reads a native-backed feature flag; install the local
    // (non-JNI) accessor so Robolectric doesn't try to load react_featureflagsjni.
    ReactNativeFeatureFlagsForTests.INSTANCE.setUp();
    viewManager = mock(ReactViewManager.class);
    ReactApplicationContext context = ReactTestHelper.createTestReactApplicationContext();
    ThemedReactContext themedReactContext = new ThemedReactContext(context, context, null, -1);
    view = new ReactViewGroup(themedReactContext);
    delegate = new BaseViewManagerDelegate<>(viewManager) {};
  }

  @After
  public void tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset();
  }

  @Test
  public void setOutlineColorConvertsDoubleToInt() {
    int color = 0xFF336699;

    delegate.setProperty(view, ViewProps.OUTLINE_COLOR, (double) color);

    verify(viewManager).setOutlineColor(view, color);
  }

  @Test
  public void setOutlineColorPreservesNull() {
    delegate.setProperty(view, ViewProps.OUTLINE_COLOR, null);

    verify(viewManager).setOutlineColor(view, null);
  }

  @Test
  public void setShadowColorResetsToBlack() {
    delegate.setProperty(view, ViewProps.SHADOW_COLOR, null);

    verify(viewManager).setShadowColor(view, Color.BLACK);
  }

  @Test
  public void setOutlineOffsetResetsToZero() {
    delegate.setProperty(view, ViewProps.OUTLINE_OFFSET, null);

    verify(viewManager).setOutlineOffset(view, 0f);
  }

  @Test
  public void setOutlineWidthResetsToZero() {
    delegate.setProperty(view, ViewProps.OUTLINE_WIDTH, null);

    verify(viewManager).setOutlineWidth(view, 0f);
  }
}
