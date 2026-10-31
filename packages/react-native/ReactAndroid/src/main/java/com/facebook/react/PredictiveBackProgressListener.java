/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

/**
 * Observes in-app predictive-back progress without owning the gesture. Unlike {@link
 * PredictiveBackHandler}, registering this does not consume the swipe.
 *
 * <p>Used by {@code PredictiveBackAnimatedView} to emit Fabric events that {@code Animated.event}
 * (native driver) and Reanimated {@code useEvent} can consume on the UI thread.
 */
public interface PredictiveBackProgressListener {

  /**
   * @param phase one of {@link PredictiveBackEvent#PHASE_START}, {@link
   *     PredictiveBackEvent#PHASE_PROGRESS}, {@link PredictiveBackEvent#PHASE_CANCEL}, {@link
   *     PredictiveBackEvent#PHASE_COMMIT}
   */
  void onPredictiveBackProgress(PredictiveBackEvent event, int phase);
}
