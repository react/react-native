/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION_ERROR") // Conflicting okio versions

package com.facebook.react.modules.network

import android.content.Context
import android.net.Uri
import android.util.Base64
import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.net.URL
import java.nio.channels.Channels
import java.util.zip.GZIPOutputStream
import okhttp3.MediaType
import okhttp3.RequestBody
import okio.BufferedSink
import okio.ByteString
import okio.Okio
import okio.Source

/**
 * Helper class that provides the necessary methods for creating the [RequestBody] from a file
 * specification, such as a contentUri.
 */
internal object RequestBodyUtil {
  private const val CONTENT_ENCODING_GZIP = "gzip"
  private const val NAME = "RequestBodyUtil"
  private const val TEMP_FILE_SUFFIX = "temp"

  /** Returns whether encode type indicates the body needs to be gzip-ed. */
  @JvmStatic
  fun isGzipEncoding(encodingType: String?): Boolean {
    return CONTENT_ENCODING_GZIP.equals(encodingType, ignoreCase = true)
  }

  /**
   * Returns the input stream for a file given by its contentUri. Returns null if the file has not
   * been found or if an error as occurred.
   */
  @JvmStatic
  fun getFileInputStream(context: Context, fileContentUriStr: String): InputStream? {
    try {
      val fileContentUri = Uri.parse(fileContentUriStr)

      if (fileContentUri.scheme?.startsWith("http") == true) {
        return getDownloadFileInputStream(context, fileContentUri)
      }

      if (fileContentUriStr.startsWith("data:")) {
        val decodedDataUrString =
            Base64.decode(
                fileContentUriStr
                    .split(",".toRegex())
                    .dropLastWhile { it.isEmpty() }
                    .toTypedArray()[1],
                Base64.DEFAULT,
            )
        return ByteArrayInputStream(decodedDataUrString)
      }

      return context.contentResolver.openInputStream(fileContentUri)
    } catch (e: Exception) {
      FLog.e(ReactConstants.TAG, "Could not retrieve file for contentUri $fileContentUriStr", e)
      return null
    }
  }

  /**
   * Download and cache a file locally. This should be used when document picker returns a URI that
   * points to a file on the network. Returns input stream for the downloaded file.
   */
  @Throws(IOException::class)
  private fun getDownloadFileInputStream(context: Context, uri: Uri): InputStream {
    val outputDir = context.applicationContext.cacheDir
    val file = File.createTempFile(NAME, TEMP_FILE_SUFFIX, outputDir)
    file.deleteOnExit()

    val url = URL(uri.toString())
    FileOutputStream(file).use { stream ->
      url.openStream().use { `is` ->
        Channels.newChannel(`is`).use { channel ->
          stream.channel.transferFrom(channel, 0, Long.MAX_VALUE)
          return FileInputStream(file)
        }
      }
    }
  }

  /** Creates a [RequestBody] from a mediaType and gzip-ed body string. */
  @JvmStatic
  fun createGzip(mediaType: MediaType?, body: String): RequestBody? {
    val gzipByteArrayOutputStream = ByteArrayOutputStream()
    try {
      val gzipOutputStream: OutputStream = GZIPOutputStream(gzipByteArrayOutputStream)
      gzipOutputStream.write(body.toByteArray())
      gzipOutputStream.close()
    } catch (e: IOException) {
      return null
    }
    @Suppress("DEPRECATION")
    return RequestBody.create(mediaType, gzipByteArrayOutputStream.toByteArray())
  }

  /**
   * Reference:
   * https://github.com/square/okhttp/blob/8c8c3dbcfa91e28de2e13975ec414e07f153fde4/okhttp/src/commonMain/kotlin/okhttp3/internal/-UtilCommon.kt#L281-L288
   * Checked exceptions will be ignored
   */
  private fun closeQuietly(source: Source) {
    try {
      source.close()
    } catch (e: RuntimeException) {
      throw e
    } catch (e: Exception) {
      // no-op
    }
  }

  /** Creates a [RequestBody] from a mediaType and inputStream given. */
  @JvmStatic
  fun create(mediaType: MediaType?, inputStream: InputStream): RequestBody {
    return object : RequestBody() {
      override fun contentType(): MediaType? {
        return mediaType
      }

      override fun contentLength(): Long {
        return try {
          inputStream.available().toLong()
        } catch (e: IOException) {
          0
        }
      }

      override fun isOneShot(): Boolean = true

      @Throws(IOException::class)
      override fun writeTo(sink: BufferedSink) {
        var source: Source? = null
        try {
          source = Okio.source(inputStream)
          sink.writeAll(source)
        } finally {
          source?.let { closeQuietly(it) }
        }
      }
    }
  }

  /** Creates a [ProgressRequestBody] that can be used for showing uploading progress. */
  @JvmStatic
  fun createProgressRequest(
      requestBody: RequestBody,
      listener: ProgressListener,
  ): ProgressRequestBody {
    return ProgressRequestBody(requestBody, listener)
  }

  /** Creates an empty [RequestBody] if required by the http method spec, otherwise use null. */
  @JvmStatic
  fun getEmptyBody(method: String): RequestBody? {
    return if (method == "POST" || method == "PUT" || method == "PATCH") {
      @Suppress("DEPRECATION") RequestBody.create(null, ByteString.EMPTY)
    } else {
      null
    }
  }
}
