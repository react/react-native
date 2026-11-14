/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Conflicting okhttp versions
@file:Suppress("DEPRECATION_ERROR")

package com.facebook.react.modules.network

import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.IOException
import java.util.zip.GZIPInputStream
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okio.Buffer
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class RequestBodyUtilTest {

  @Test
  fun testIsGzipEncoding() {
    assertThat(RequestBodyUtil.isGzipEncoding("gzip")).isTrue()
    assertThat(RequestBodyUtil.isGzipEncoding("GzIp")).isTrue()
    assertThat(RequestBodyUtil.isGzipEncoding("identity")).isFalse()
    assertThat(RequestBodyUtil.isGzipEncoding(null)).isFalse()
  }

  @Test
  fun testCreateWithDataUri() {
    val context = mock<Context>()
    val fileUri = "data:text/plain;base64,SGVsbG8gV29ybGQ="

    val result = checkNotNull(RequestBodyUtil.create(context, TEXT, fileUri))

    assertThat(result.contentType()).isEqualTo(TEXT)
    assertThat(result.contentLength()).isEqualTo("Hello World".length.toLong())
    assertThat(writeToString(result)).isEqualTo("Hello World")
    // The body can be written again, as when OkHttp retries the request
    assertThat(writeToString(result)).isEqualTo("Hello World")
  }

  @Test
  fun testCreateWithContentUri() {
    val file = createTempFile("Sample Content")
    val contentResolver = mockContentResolver(file)

    val result = createBody(contentResolver)

    assertThat(result.contentType()).isEqualTo(TEXT)
    assertThat(result.contentLength()).isEqualTo("Sample Content".length.toLong())
    assertThat(result.isOneShot()).isFalse()
    assertThat(writeToString(result)).isEqualTo("Sample Content")
    // The body can be written again, as when OkHttp retries the request
    assertThat(writeToString(result)).isEqualTo("Sample Content")
  }

  @Test
  fun testContentUriIsOnlyReopenedForRetries() {
    val file = createTempFile("Sample Content")
    val contentResolver = mockContentResolver(file)

    val result = createBody(contentResolver)
    // Once to check the file can be read and get its size
    verify(contentResolver, times(1)).openInputStream(CONTENT_URI)

    // The first write uses that stream rather than opening the file again
    writeToString(result)
    verify(contentResolver, times(1)).openInputStream(CONTENT_URI)

    // A retry opens a new stream
    writeToString(result)
    verify(contentResolver, times(2)).openInputStream(CONTENT_URI)
  }

  @Test
  fun testCreateWithFileUri() {
    val file = createTempFile("Sample Content")
    val context = RuntimeEnvironment.getApplication()

    val result = checkNotNull(RequestBodyUtil.create(context, TEXT, Uri.fromFile(file).toString()))

    assertThat(result.contentLength()).isEqualTo("Sample Content".length.toLong())
    assertThat(writeToString(result)).isEqualTo("Sample Content")
    assertThat(writeToString(result)).isEqualTo("Sample Content")
  }

  @Test
  fun testCreateWithMissingContentUri() {
    val contentResolver = mock<ContentResolver>()
    whenever(contentResolver.openInputStream(CONTENT_URI))
        .thenThrow(FileNotFoundException("missing"))

    val result = RequestBodyUtil.create(mockContext(contentResolver), TEXT, CONTENT_URI.toString())

    assertThat(result).isNull()
  }

  @Test
  fun testWriteToThrowsWhenContentUriCannotBeReopened() {
    val file = createTempFile("Sample Content")
    val contentResolver = mockContentResolver(file)
    val result = createBody(contentResolver)
    writeToString(result)
    whenever(contentResolver.openInputStream(CONTENT_URI)).thenReturn(null)

    // A retry's writeTo must throw, not write an empty body, when the file can't be reopened
    assertThatThrownBy { writeToString(result) }.isInstanceOf(IOException::class.java)
  }

  @Test
  fun testMultipartUploadCanBeWrittenAgainForRetry() {
    // The bug path: OkHttp resends a request on a stale pooled connection by calling writeTo
    // again on the ProgressRequestBody that wraps the MultipartBody holding the file part
    val file = createTempFile("Sample Content")
    val filePart = createBody(mockContentResolver(file))
    val multipart =
        MultipartBody.Builder("test-boundary")
            .setType(MultipartBody.FORM)
            .addFormDataPart("description", "a file")
            .addFormDataPart("file", "file.txt", filePart)
            .build()
    val requestBody =
        RequestBodyUtil.createProgressRequest(
            multipart,
            object : ProgressListener {
              override fun onProgress(bytesWritten: Long, contentLength: Long, done: Boolean) = Unit
            },
        )

    val firstAttempt = writeToString(requestBody)
    val secondAttempt = writeToString(requestBody)

    assertThat(firstAttempt).contains("Sample Content")
    assertThat(secondAttempt).isEqualTo(firstAttempt)
    assertThat(firstAttempt.length.toLong()).isEqualTo(requestBody.contentLength())
  }

  @Test
  fun testGetFileInputStreamWithHttpUri() {
    val context = mock<Context>()
    val fileUri = "http://example.com/file"

    // Since downloadFile is private and not mocked, it will throw an exception.
    val result = RequestBodyUtil.getFileInputStream(context, fileUri)

    assertThat(result).isNull() // Expected null due to exception handling
  }

  @Test
  fun testGetFileInputStreamWithDataUri() {
    val context = mock<Context>()
    val fileUri = "data:text/plain;base64,SGVsbG8gV29ybGQ="

    val result = RequestBodyUtil.getFileInputStream(context, fileUri)

    assertThat("Hello World").isEqualTo(result?.bufferedReader()?.use { it.readText() })
  }

  @Test
  fun testGetFileInputStreamWithContentUri() {
    val context = mock<Context>()
    val contentResolver = mock<ContentResolver>()
    whenever(context.contentResolver).thenReturn(contentResolver)

    val fileUri = "content://com.example.provider/file"
    val testInputStream = ByteArrayInputStream("Sample Content".toByteArray())

    whenever(contentResolver.openInputStream(Uri.parse(fileUri))).thenReturn(testInputStream)

    val result = RequestBodyUtil.getFileInputStream(context, fileUri)

    assertThat("Sample Content").isEqualTo(result?.bufferedReader()?.use { it.readText() })
  }

  @Test
  fun testGetFileInputStreamWithInvalidUri() {
    val context = mock<Context>()
    val invalidUri = "invalid-uri"

    val result = RequestBodyUtil.getFileInputStream(context, invalidUri)

    assertThat(result).isNull() // Expected null due to exception handling
  }

  @Test
  fun testCreateGzipWithValidInput() {
    val mediaType = checkNotNull(MediaType.parse("text/plain"))
    val input = "Hello Gzip"

    val requestBody = RequestBodyUtil.createGzip(mediaType, input)

    checkNotNull(requestBody)

    val buffer = Buffer()
    requestBody.writeTo(buffer)

    val gzipInputStream = GZIPInputStream(ByteArrayInputStream(buffer.readByteArray()))
    val result = gzipInputStream.bufferedReader().use { it.readText() }

    assertThat(input).isEqualTo(result)
  }

  @Test
  fun testCreateGzipWithEmptyInput() {
    val mediaType = checkNotNull(MediaType.parse("text/plain"))
    val input = ""

    val requestBody = RequestBodyUtil.createGzip(mediaType, input)

    checkNotNull(requestBody)

    val buffer = Buffer()
    requestBody.writeTo(buffer)

    val gzipInputStream = GZIPInputStream(ByteArrayInputStream(buffer.readByteArray()))
    val result = gzipInputStream.bufferedReader().use { it.readText() }

    assertThat(input).isEqualTo(result)
  }

  @Test
  fun testCreateGzipWithNullInput() {
    val mediaType = checkNotNull(MediaType.parse("text/plain"))

    val requestBody = RequestBodyUtil.createGzip(mediaType, "")

    checkNotNull(requestBody)

    val buffer = Buffer()
    requestBody.writeTo(buffer)

    val gzipInputStream = GZIPInputStream(ByteArrayInputStream(buffer.readByteArray()))
    val result = gzipInputStream.bufferedReader().use { it.readText() }

    assertThat(result).isEmpty()
  }

  @Test
  fun testCreateWithInputStream() {
    val mediaType = checkNotNull(MediaType.parse("text/plain"))
    val inputStream = ByteArrayInputStream("Test InputStream".toByteArray())

    val requestBody = RequestBodyUtil.create(mediaType, inputStream)

    checkNotNull(requestBody)

    val buffer = Buffer()
    requestBody.writeTo(buffer)

    assertThat("Test InputStream").isEqualTo(buffer.readUtf8())
  }

  private fun createTempFile(content: String): File {
    val file = File.createTempFile("RequestBodyUtilTest", null)
    file.deleteOnExit()
    file.writeText(content)
    return file
  }

  private fun mockContentResolver(file: File): ContentResolver {
    val contentResolver = mock<ContentResolver>()
    whenever(contentResolver.openInputStream(CONTENT_URI)).thenAnswer { FileInputStream(file) }
    return contentResolver
  }

  private fun createBody(contentResolver: ContentResolver): RequestBody =
      checkNotNull(
          RequestBodyUtil.create(mockContext(contentResolver), TEXT, CONTENT_URI.toString())
      )

  private fun mockContext(contentResolver: ContentResolver): Context {
    val context = mock<Context>()
    whenever(context.contentResolver).thenReturn(contentResolver)
    return context
  }

  private fun writeToString(requestBody: RequestBody): String {
    val buffer = Buffer()
    requestBody.writeTo(buffer)
    return buffer.readUtf8()
  }

  private companion object {
    val TEXT: MediaType = checkNotNull(MediaType.parse("text/plain"))
    val CONTENT_URI: Uri = Uri.parse("content://com.example.provider/file")
  }
}
