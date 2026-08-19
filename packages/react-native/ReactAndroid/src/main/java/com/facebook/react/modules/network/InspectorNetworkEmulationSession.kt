/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.soloader.SoLoader
import java.io.IOException

/**
 * [Experimental] An interface to the simulated network throttling engine for CDP debugging
 * (`Network.emulateNetworkConditions`).
 *
 * This is a helper class wrapping `facebook::react::jsinspector_modern::NetworkThrottler`.
 */
@DoNotStripAny
internal object InspectorNetworkEmulationSession {
  init {
    SoLoader.loadLibrary("react_devsupportjni")
  }

  /**
   * Whether offline network emulation is active. Callers should fail new requests with a network
   * error without touching the network.
   */
  @JvmStatic external fun isOffline(): Boolean

  /** Whether any throttling behavior (latency or throughput) is active. */
  @JvmStatic external fun isThrottling(): Boolean

  /** Create an opaque token identifying one request's throttled operations. */
  @JvmStatic external fun createRecordToken(): Long

  /**
   * Block the calling thread until the throttling engine releases the operation.
   *
   * @param token Identifies the request (see [createRecordToken]).
   * @param bytes The request's cumulative outstanding byte debt: bytes newly received plus the
   *   (normally negative) remainder returned by the previous call.
   * @param sendEndAgeMs How long ago the request finished being sent, in milliseconds. Only
   *   meaningful when `isStart` is true; the emulated latency floor is measured from that point.
   * @param isStart Whether this is the response-headers stage (subject to the latency floor).
   * @return The new byte debt to carry into the next call.
   * @throws IOException if the request was failed by offline emulation.
   */
  @JvmStatic
  @Throws(IOException::class)
  external fun awaitThrottle(token: Long, bytes: Long, sendEndAgeMs: Double, isStart: Boolean): Long
}
