/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION", "DEPRECATION_ERROR") // Conflicting okhttp versions

package com.facebook.react.modules.blob

import android.net.Uri
import android.provider.MediaStore
import android.webkit.MimeTypeMap
import com.facebook.fbreact.specs.NativeBlobModuleSpec
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.buildReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.network.NetworkingModule
import com.facebook.react.modules.websocket.WebSocketModule
import com.facebook.react.turbomodule.core.interfaces.BindingsInstallerHolder
import com.facebook.react.turbomodule.core.interfaces.TurboModuleWithJSIBindings
import com.facebook.soloader.SoLoader
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileNotFoundException
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.charset.Charset
import java.util.ArrayList
import java.util.Arrays
import java.util.HashMap
import java.util.UUID
import okhttp3.MediaType
import okhttp3.RequestBody
import okio.ByteString

@ReactModule(name = NativeBlobModuleSpec.NAME)
public class BlobModule(reactContext: ReactApplicationContext) :
    NativeBlobModuleSpec(reactContext), TurboModuleWithJSIBindings {

  private val blobs = HashMap<String, ByteArray>()

  private val webSocketContentHandler =
      object : WebSocketModule.ContentHandler {
        override fun onMessage(text: String, params: WritableMap) {
          params.putString("data", text)
        }

        override fun onMessage(byteString: ByteString, params: WritableMap) {
          val data = byteString.toByteArray()

          val blob = buildReadableMap {
            put("blobId", store(data))
            put("offset", 0)
            put("size", data.size)
          }

          params.putMap("data", blob)
          params.putString("type", "blob")
        }
      }

  internal val networkingUriHandler =
      object : NetworkingModule.UriHandler {
        override fun supports(uri: Uri, responseType: String): Boolean {
          val scheme = uri.scheme
          val isRemote = scheme == "http" || scheme == "https"
          return !isRemote && responseType == "blob"
        }

        override fun fetch(uri: Uri): Pair<WritableMap, ByteArray> {
          val data = getBytesFromUri(uri)

          val blob = Arguments.createMap()
          blob.putString("blobId", store(data))
          blob.putInt("offset", 0)
          blob.putInt("size", data.size)
          blob.putString("type", getMimeTypeFromUri(uri))

          // Needed for files
          blob.putString("name", getNameFromUri(uri))
          blob.putDouble("lastModified", getLastModifiedFromUri(uri))

          return blob to data
        }
      }

  private val networkingRequestBodyHandler =
      object : NetworkingModule.RequestBodyHandler {
        override fun supports(map: ReadableMap): Boolean {
          return map.hasKey("blob")
        }

        override fun toRequestBody(map: ReadableMap, contentType: String?): RequestBody {
          var type: String? = contentType
          if (map.hasKey("type") && !map.getString("type").isNullOrEmpty()) {
            type = map.getString("type")
          }
          if (type == null) {
            type = "application/octet-stream"
          }

          val blob = checkNotNull(map.getMap("blob"))
          val bytes =
              checkNotNull(
                  resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"))
              )

          return RequestBody.create(MediaType.parse(type), bytes)
        }
      }

  private val networkingResponseHandler =
      object : NetworkingModule.ResponseHandler {
        override fun supports(responseType: String): Boolean {
          return responseType == "blob"
        }

        override fun toResponseData(data: ByteArray): WritableMap {
          val blob = Arguments.createMap()
          blob.putString("blobId", store(data))
          blob.putInt("offset", 0)
          blob.putInt("size", data.size)
          return blob
        }
      }

  public override fun getTypedExportedConstants(): Map<String, Any> {
    val resources = reactApplicationContext.resources
    val packageName = reactApplicationContext.packageName
    val resourceId = resources.getIdentifier("blob_provider_authority", "string", packageName)
    if (resourceId == 0) {
      return mapOf()
    }

    return mapOf("BLOB_URI_SCHEME" to "content", "BLOB_URI_HOST" to resources.getString(resourceId))
  }

  public fun store(data: ByteArray): String {
    val blobId = UUID.randomUUID().toString()
    store(data, blobId)
    return blobId
  }

  public fun store(data: ByteArray, blobId: String) {
    synchronized(blobs) { blobs[blobId] = data }
  }

  @DoNotStrip
  public fun getLengthOfBlob(blobId: String): Long {
    synchronized(blobs) {
      val data = blobs[blobId]
      return data?.size?.toLong() ?: 0
    }
  }

  @DoNotStrip
  public fun remove(blobId: String) {
    synchronized(blobs) { blobs.remove(blobId) }
  }

  public fun resolve(uri: Uri): ByteArray? {
    val blobId = uri.lastPathSegment
    var offset = 0
    var size = -1
    val offsetParam = uri.getQueryParameter("offset")
    if (offsetParam != null) {
      offset = offsetParam.toInt()
    }
    val sizeParam = uri.getQueryParameter("size")
    if (sizeParam != null) {
      size = sizeParam.toInt()
    }
    return resolve(blobId, offset, size)
  }

  public fun resolve(blobId: String?, offset: Int, size: Int): ByteArray? {
    synchronized(blobs) {
      val data = blobs[blobId]
      if (data == null) {
        return null
      }
      var newSize = size
      if (newSize == -1) {
        newSize = data.size - offset
      }
      if (offset > 0 || newSize != data.size) {
        return Arrays.copyOfRange(data, offset, offset + newSize)
      }
      return data
    }
  }

  public fun resolve(blob: ReadableMap): ByteArray? {
    return resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"))
  }

  @Throws(IOException::class)
  private fun getBytesFromUri(contentUri: Uri): ByteArray {
    val inputStream =
        reactApplicationContext.contentResolver.openInputStream(contentUri)
            ?: throw FileNotFoundException("File not found for $contentUri")

    try {
      var buffer = ByteArray(maxOf(1024, inputStream.available()))
      var len: Int
      var prevBuffer = ByteArray(1024)
      var prevLen = 0

      val byteBuffer = ByteArrayOutputStream()
      while (inputStream.read(buffer).also { len = it } != -1) {
        byteBuffer.write(prevBuffer, 0, prevLen)
        // swap buffers
        val temp = prevBuffer
        prevBuffer = buffer
        buffer = temp
        // set prevLen = length of data in prevBuffer
        prevLen = len
      }

      if (byteBuffer.size() == 0 && prevBuffer.size == prevLen) {
        // If EOF AND prevBuffer contains entire stream avoid using ByteArrayOutputStream
        return prevBuffer
      }
      byteBuffer.write(prevBuffer, 0, prevLen)
      return byteBuffer.toByteArray()
    } finally {
      inputStream.close()
    }
  }

  private fun getNameFromUri(contentUri: Uri): String? {
    if (contentUri.scheme == "file") {
      return contentUri.lastPathSegment
    }
    val projection = arrayOf(MediaStore.MediaColumns.DISPLAY_NAME)
    val metaCursor =
        reactApplicationContext.contentResolver.query(contentUri, projection, null, null, null)
    metaCursor?.use {
      if (it.moveToFirst()) {
        return it.getString(0)
      }
    }
    return contentUri.lastPathSegment
  }

  private fun getLastModifiedFromUri(contentUri: Uri): Double {
    return if (contentUri.scheme == "file") {
      File(contentUri.toString()).lastModified().toDouble()
    } else 0.0
  }

  private fun getMimeTypeFromUri(contentUri: Uri): String {
    var type = reactApplicationContext.contentResolver.getType(contentUri)
    if (type == null) {
      val ext = MimeTypeMap.getFileExtensionFromUrl(contentUri.path)
      if (ext != null) {
        type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext)
      }
    }
    return type.orEmpty()
  }

  private val webSocketModule: WebSocketModule?
    get() = reactApplicationContext.getNativeModule(WebSocketModule::class.java)

  public override fun addNetworkingHandler() {
    val networkingModule =
        checkNotNull(reactApplicationContext.getNativeModule(NetworkingModule::class.java))
    networkingModule.addUriHandler(networkingUriHandler)
    networkingModule.addRequestBodyHandler(networkingRequestBodyHandler)
    networkingModule.addResponseHandler(networkingResponseHandler)
  }

  public override fun addWebSocketHandler(idDouble: Double) {
    val id = idDouble.toInt()
    webSocketModule?.setContentHandler(id, webSocketContentHandler)
  }

  public override fun removeWebSocketHandler(idDouble: Double) {
    val id = idDouble.toInt()
    webSocketModule?.setContentHandler(id, null)
  }

  public override fun sendOverSocket(blob: ReadableMap, idDouble: Double) {
    val id = idDouble.toInt()
    webSocketModule?.let {
      val data = resolve(blob.getString("blobId"), blob.getInt("offset"), blob.getInt("size"))
      data?.let { bytes -> it.sendBinary(ByteString.of(ByteBuffer.wrap(bytes)), id) }
    }
  }

  public override fun createFromParts(parts: ReadableArray, blobId: String) {
    var totalBlobSize = 0
    val partList = ArrayList<ByteArray>(parts.size())

    for (i in 0 until parts.size()) {
      val part = checkNotNull(parts.getMap(i))
      val type = checkNotNull(part.getString("type"))
      when (type) {
        "blob" -> {
          val blob = checkNotNull(part.getMap("data"))
          totalBlobSize += blob.getInt("size")
          partList.add(i, checkNotNull(resolve(blob)))
        }
        "string" -> {
          val data = checkNotNull(part.getString("data"))
          val bytes = data.toByteArray(Charset.forName("UTF-8"))
          totalBlobSize += bytes.size
          partList.add(i, bytes)
        }
        else -> throw IllegalArgumentException("Invalid type for blob: ${part.getString("type")}")
      }
    }

    val buffer = ByteBuffer.allocate(totalBlobSize)
    for (bytes in partList) {
      buffer.put(bytes)
    }
    store(buffer.array(), blobId)
  }

  public override fun release(blobId: String) {
    remove(blobId)
  }

  @DoNotStrip external override fun getBindingsInstaller(): BindingsInstallerHolder

  public companion object {
    init {
      SoLoader.loadLibrary("reactnativeblob")
    }

    public const val NAME: String = NativeBlobModuleSpec.NAME
  }
}
