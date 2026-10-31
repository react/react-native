/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

/**
 * Progress of an in-app predictive-back gesture. Native libraries (for example
 * react-native-screens) receive this on the UI thread. JavaScript animates via {@code
 * PredictiveBackAnimatedView} and {@code Animated.event}.
 */
public final class PredictiveBackEvent {

  public static final int EDGE_LEFT = 0;
  public static final int EDGE_RIGHT = 1;
  public static final int EDGE_NONE = 2;

  public static final int PHASE_START = 0;
  public static final int PHASE_PROGRESS = 1;
  public static final int PHASE_CANCEL = 2;
  public static final int PHASE_COMMIT = 3;

  public final float progress;
  public final int swipeEdge;
  public final float touchX;
  public final float touchY;

  public PredictiveBackEvent(float progress, int swipeEdge, float touchX, float touchY) {
    this.progress = progress;
    this.swipeEdge = swipeEdge;
    this.touchX = touchX;
    this.touchY = touchY;
  }
}
