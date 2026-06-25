/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.devsupport.inspector

import java.io.IOException
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Request
import okhttp3.Response

internal object InspectorNetworkHelper {

  @JvmStatic
  fun loadNetworkResource(url: String, listener: InspectorNetworkRequestListener) {

    val request =
        try {
          Request.Builder().url(url).build()
        } catch (e: IllegalArgumentException) {
          listener.onError("Not a valid URL: $url")
          return
        }

    // TODO(T196951523): Assign cancel function to listener
    val call = DevSupportHttpClient.httpClient.newCall(request)

    call.enqueue(
        object : Callback {
          override fun onFailure(call: Call, e: IOException) {
            if (call.isCanceled()) {
              return
            }

            listener.onError(e.message)
          }

          override fun onResponse(call: Call, response: Response) {
            val headers = response.headers()
            val headersMap = HashMap<String?, String?>()

            for (name in headers.names()) {
              headersMap[name] = headers[name]
            }

            listener.onHeaders(response.code(), headersMap)

            try {
              response.body().use { responseBody ->
                if (responseBody != null) {
                  val inputStream = responseBody.byteStream()
                  val chunkSize = 8 * 1024 // 8Kb
                  val buffer = ByteArray(chunkSize)
                  var bytesRead: Int

                  inputStream.use { stream ->
                    while ((stream.read(buffer).also { bytesRead = it }) != -1) {
                      val chunk = String(buffer, 0, bytesRead)
                      listener.onData(chunk)
                    }
                  }
                }
                listener.onCompletion()
              }
            } catch (e: IOException) {
              listener.onError(e.message)
            }
          }
        }
    )
  }
}
