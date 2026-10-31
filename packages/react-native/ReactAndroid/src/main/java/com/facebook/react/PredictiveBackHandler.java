/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

/**
 * Native plugin for predictive back. Register on {@link ReactActivity} with {@link
 * ReactActivity#addPredictiveBackHandler}. While at least one handler is registered, React Native
 * consumes the Android back gesture and delivers progress here instead of (or in addition to) JS.
 *
 * <p>To observe progress without owning the gesture (for Animated / Reanimated), use {@link
 * PredictiveBackProgressListener} or the JS {@code PredictiveBackAnimatedView} instead.
 *
 * <p>If {@link #onPredictiveBackCommitted()} returns {@code true}, JS {@code hardwareBackPress} is
 * not emitted, so JS and this handler cannot both pop.
 */
public interface PredictiveBackHandler {

  void onPredictiveBackStarted(PredictiveBackEvent event);

  void onPredictiveBackProgressed(PredictiveBackEvent event);

  void onPredictiveBackCancelled();

  /**
   * @return {@code true} if this handler consumed the commit (for example popped a native screen).
   */
  boolean onPredictiveBackCommitted();
}
