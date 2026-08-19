/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.network

import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import java.io.IOException
import java.net.UnknownHostException
import kotlin.math.min
import okhttp3.Interceptor
import okhttp3.Response
import okhttp3.ResponseBody
import okio.Buffer
import okio.ForwardingSource
import okio.Okio

/**
 * [Experimental] An OkHttp application interceptor applying simulated network throttling for CDP
 * debugging (`Network.emulateNetworkConditions`).
 *
 * The real request runs at full speed; the response headers wait out the emulated latency floor,
 * and the response body is delivered in packet-sized (1500 byte) reads gated on the shared
 * throttling engine. When offline emulation is active, requests fail with an [UnknownHostException]
 * without touching the network.
 */
internal class InspectorNetworkEmulationInterceptor : Interceptor {
  @Throws(IOException::class)
  override fun intercept(chain: Interceptor.Chain): Response {
    if (!ReactNativeFeatureFlags.fuseboxNetworkThrottlingEnabled()) {
      return chain.proceed(chain.request())
    }
    if (InspectorNetworkEmulationSession.isOffline()) {
      throw UnknownHostException(
          "Unable to resolve host: offline mode is emulated by React Native DevTools",
      )
    }
    if (!InspectorNetworkEmulationSession.isThrottling()) {
      return chain.proceed(chain.request())
    }

    val token = InspectorNetworkEmulationSession.createRecordToken()
    // Approximates the real send-end time with the start of the call; the
    // emulated latency floor is measured from this point.
    val sendStartNanos = System.nanoTime()
    val response = chain.proceed(chain.request())

    val sendEndAgeMs = (System.nanoTime() - sendStartNanos) / 1e6
    var byteDebt = InspectorNetworkEmulationSession.awaitThrottle(token, 0, sendEndAgeMs, true)

    val body = response.body() ?: return response
    val throttledSource =
        object : ForwardingSource(body.source()) {
          @Throws(IOException::class)
          override fun read(sink: Buffer, byteCount: Long): Long {
            // Deliver the body in packet-sized increments, so progress feels
            // like a slow network rather than one long stall.
            val bytesRead = super.read(sink, min(byteCount, PACKET_SIZE))
            if (bytesRead > 0) {
              byteDebt =
                  InspectorNetworkEmulationSession.awaitThrottle(
                      token,
                      byteDebt + bytesRead,
                      0.0,
                      false,
                  )
            }
            return bytesRead
          }
        }
    return response
        .newBuilder()
        .body(
            ResponseBody.create(
                body.contentType(),
                body.contentLength(),
                Okio.buffer(throttledSource),
            ),
        )
        .build()
  }

  private companion object {
    private const val PACKET_SIZE = 1500L
  }
}
