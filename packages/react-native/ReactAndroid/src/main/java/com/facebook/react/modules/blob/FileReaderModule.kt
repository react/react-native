/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.blob

import android.util.Base64
import com.facebook.fbreact.specs.NativeFileReaderModuleSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeFileReaderModuleSpec.NAME)
public class FileReaderModule(reactContext: ReactApplicationContext) :
    NativeFileReaderModuleSpec(reactContext) {

  private fun getBlobModule(reason: String): BlobModule? {
    val reactApplicationContext = getReactApplicationContextIfActiveOrWarn()

    return reactApplicationContext?.getNativeModule(BlobModule::class.java)
  }

  public override fun readAsText(blob: ReadableMap, encoding: String, promise: Promise) {
    val blobModule = getBlobModule("readAsText")

    if (blobModule == null) {
      promise.reject(IllegalStateException("Could not get BlobModule from ReactApplicationContext"))
      return
    }

    val blobId = blob.getString("blobId")
    if (blobId == null) {
      promise.reject(ERROR_INVALID_BLOB, "The specified blob does not contain a blobId")
      return
    }

    val bytes = blobModule.resolve(blobId, blob.getInt("offset"), blob.getInt("size"))

    if (bytes == null) {
      promise.reject(ERROR_INVALID_BLOB, "The specified blob is invalid")
      return
    }

    try {
      promise.resolve(String(bytes, charset(encoding)))
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  public override fun readAsArrayBuffer(blob: ReadableMap, promise: Promise) {
    val blobModule = getBlobModule("readAsArrayBuffer")

    if (blobModule == null) {
      promise.reject(IllegalStateException("Could not get BlobModule from ReactApplicationContext"))
      return
    }

    val blobId = blob.getString("blobId")
    if (blobId == null) {
      promise.reject(ERROR_INVALID_BLOB, "The specified blob does not contain a blobId")
      return
    }

    val buffer = blobModule.resolveBuffer(blobId, blob.getInt("offset"), blob.getInt("size"))
    if (buffer == null) {
      promise.reject(ERROR_INVALID_BLOB, "The specified blob is invalid")
      return
    }

    promise.resolve(buffer)
  }

  public override fun readAsDataURL(blob: ReadableMap, promise: Promise) {
    val blobModule = getBlobModule("readAsDataURL")

    if (blobModule == null) {
      promise.reject(IllegalStateException("Could not get BlobModule from ReactApplicationContext"))
      return
    }

    val blobId = blob.getString("blobId")
    if (blobId == null) {
      promise.reject(ERROR_INVALID_BLOB, "The specified blob does not contain a blobId")
      return
    }

    val bytes = blobModule.resolve(blobId, blob.getInt("offset"), blob.getInt("size"))

    if (bytes == null) {
      promise.reject(ERROR_INVALID_BLOB, "The specified blob is invalid")
      return
    }

    try {
      val sb = StringBuilder()
      sb.append("data:")

      if (blob.hasKey("type") && !blob.getString("type").isNullOrEmpty()) {
        sb.append(blob.getString("type"))
      } else {
        sb.append("application/octet-stream")
      }

      sb.append(";base64,")
      sb.append(Base64.encodeToString(bytes, Base64.NO_WRAP))

      promise.resolve(sb.toString())
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  public companion object {
    public val NAME: String = NativeFileReaderModuleSpec.NAME
    private const val ERROR_INVALID_BLOB = "ERROR_INVALID_BLOB"
  }
}
