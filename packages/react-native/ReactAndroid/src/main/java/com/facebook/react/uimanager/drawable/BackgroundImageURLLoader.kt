/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.graphics.Bitmap
import android.net.Uri
import com.facebook.common.executors.CallerThreadExecutor
import com.facebook.common.logging.FLog
import com.facebook.common.references.CloseableReference
import com.facebook.datasource.DataSource
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.imagepipeline.datasource.BaseBitmapDataSubscriber
import com.facebook.imagepipeline.image.CloseableImage
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.react.bridge.UiThreadUtil
import java.util.concurrent.ConcurrentHashMap

internal class BackgroundImageURLLoader {
  private companion object {
    private const val TAG = "BackgroundImageURLLoader"
  }

  private val pendingRequests = mutableMapOf<String, DataSource<CloseableReference<CloseableImage>>>()
  private val loadedBitmaps = ConcurrentHashMap<String, Bitmap>()
  private var onComplete: (() -> Unit)? = null

  fun loadImages(
    uris: List<String>,
    onComplete: () -> Unit
  ) {
    cancelAllRequests()

    if (uris.isEmpty()) {
      onComplete()
      return
    }

    this.onComplete = onComplete
    for (uri in uris) {
      val imageRequest = ImageRequestBuilder.newBuilderWithSource(Uri.parse(uri)).build()
      val imagePipeline = Fresco.getImagePipeline()
      val dataSource = imagePipeline.fetchDecodedImage(imageRequest, null)

      pendingRequests[uri] = dataSource

      dataSource.subscribe(
        object : BaseBitmapDataSubscriber() {
          override fun onNewResultImpl(bitmap: Bitmap?) {
            if (bitmap != null) {
              loadedBitmaps[uri] = bitmap.copy(bitmap.config ?: Bitmap.Config.ARGB_8888, false)
            }
            onRequestComplete(uri)
          }

          override fun onFailureImpl(dataSource: DataSource<CloseableReference<CloseableImage>>) {
            FLog.w(TAG, "Failed to load background image: $uri-${dataSource.failureCause}")
            onRequestComplete(uri)
          }
        },
        CallerThreadExecutor.getInstance()
      )
    }
  }

  fun loadedBitmapForUri(uri: String): Bitmap? = loadedBitmaps[uri]

  private fun onRequestComplete(uri: String) {
    pendingRequests.remove(uri)
    if (pendingRequests.isEmpty()) {
      UiThreadUtil.runOnUiThread { onComplete?.invoke() }
    }
  }

  fun cancelAllRequests() {
    for (dataSource in pendingRequests.values) {
      dataSource.close()
    }
    pendingRequests.clear()
    loadedBitmaps.clear()
    onComplete = null
  }
}
