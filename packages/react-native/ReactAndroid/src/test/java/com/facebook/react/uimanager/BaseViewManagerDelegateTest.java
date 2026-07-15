/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.facebook.react.bridge.BridgeReactContext;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

@RunWith(RobolectricTestRunner.class)
public class BaseViewManagerDelegateTest {
  private ReactViewManager viewManager;
  private ReactViewGroup view;
  private BaseViewManagerDelegate<ReactViewGroup, ReactViewManager> delegate;

  @Before
  public void setUp() {
    viewManager = mock(ReactViewManager.class);
    BridgeReactContext context = new BridgeReactContext(RuntimeEnvironment.getApplication());
    ThemedReactContext themedReactContext = new ThemedReactContext(context, context, null, -1);
    view = new ReactViewGroup(themedReactContext);
    delegate = new BaseViewManagerDelegate<>(viewManager) {};
  }

  @Test
  public void setOutlineColorConvertsDoubleToInt() {
    int color = 0xFF336699;

    delegate.setProperty(view, ViewProps.OUTLINE_COLOR, (double) color);

    verify(viewManager).setOutlineColor(view, color);
  }
}
