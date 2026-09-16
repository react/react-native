/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.internal.tracing.PerformanceTracer
import kotlin.jvm.JvmStatic
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

/**
 * [PerformanceTracer] is JNI-backed (react_tracingjni); shadow it so code paths that check
 * [PerformanceTracer.isTracing] can run on the JVM. Tracing reports as disabled.
 */
@Implements(PerformanceTracer::class)
class ShadowPerformanceTracer {
  companion object {
    @JvmStatic @Implementation fun isTracing(): Boolean = false
  }
}
