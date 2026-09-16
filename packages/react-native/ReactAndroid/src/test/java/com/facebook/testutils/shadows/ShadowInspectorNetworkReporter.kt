/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

/**
 * Robolectric shadow that stubs out `InspectorNetworkReporter`'s JNI methods, so that tests
 * exercising `NetworkEventUtil` do not attempt to call into the `react_devsupportjni` native
 * library. `isDebuggingEnabled` returns `false`, which also short-circuits the reporting wrappers
 * that guard on it (e.g. `reportDataReceived`, `maybeStoreResponseBody`).
 */
@Suppress("UNUSED_PARAMETER")
@Implements(className = "com.facebook.react.modules.network.InspectorNetworkReporter")
class ShadowInspectorNetworkReporter {
  companion object {
    @JvmStatic @Implementation fun isDebuggingEnabled(): Boolean = false

    @JvmStatic
    @Implementation
    fun reportRequestStart(
        requestId: String,
        requestUrl: String,
        requestMethod: String,
        requestHeaders: Map<String, String>,
        requestBody: String,
        encodedDataLength: Long,
    ) {}

    @JvmStatic
    @Implementation
    fun reportConnectionTiming(requestId: String, headers: Map<String, String>) {}

    @JvmStatic
    @Implementation
    fun reportResponseStart(
        requestId: String,
        requestUrl: String,
        responseStatus: Int,
        responseHeaders: Map<String, String>,
        expectedDataLength: Long,
    ) {}

    @JvmStatic @Implementation fun reportResponseEnd(requestId: String, encodedDataLength: Long) {}

    @JvmStatic @Implementation fun reportRequestFailed(requestId: String, cancelled: Boolean) {}
  }
}
