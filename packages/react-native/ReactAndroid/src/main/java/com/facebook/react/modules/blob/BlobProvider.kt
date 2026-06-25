/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.blob

import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import com.facebook.react.ReactApplication
import java.io.FileNotFoundException
import java.io.IOException
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

public class BlobProvider : ContentProvider() {
  private val executor: ExecutorService = Executors.newSingleThreadExecutor()

  override fun onCreate(): Boolean = true

  override fun query(
      uri: Uri,
      projection: Array<String>?,
      selection: String?,
      selectionArgs: Array<String>?,
      sortOrder: String?,
  ): Cursor? = null

  override fun getType(uri: Uri): String? = null

  override fun insert(uri: Uri, values: ContentValues?): Uri? = null

  override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int = 0

  override fun update(
      uri: Uri,
      values: ContentValues?,
      selection: String?,
      selectionArgs: Array<String>?,
  ): Int = 0

  @Throws(FileNotFoundException::class)
  override fun openFile(uri: Uri, mode: String): ParcelFileDescriptor? {
    if (mode != "r") {
      throw FileNotFoundException("Cannot open $uri in mode '$mode'")
    }

    var blobModule: BlobModule? = null
    val context = context?.applicationContext
    if (context is ReactApplication) {
      val reactContext =
          context.reactHost?.currentReactContext
              ?: throw RuntimeException("No ReactContext associated with BlobProvider")
      blobModule = reactContext.getNativeModule(BlobModule::class.java)
    }

    if (blobModule == null) {
      throw RuntimeException("No blob module associated with BlobProvider")
    }

    val data =
        blobModule.resolve(uri) ?: throw FileNotFoundException("Cannot open $uri, blob not found.")

    val pipe: Array<ParcelFileDescriptor>
    try {
      pipe = ParcelFileDescriptor.createPipe()
    } catch (exception: IOException) {
      return null
    }
    val readSide = pipe[0]
    val writeSide = pipe[1]

    if (data.size <= PIPE_CAPACITY) {
      // If the blob length is less than or equal to pipe capacity (64 KB),
      // we can write the data synchronously to the pipe buffer.
      try {
        ParcelFileDescriptor.AutoCloseOutputStream(writeSide).use { outputStream ->
          outputStream.write(data)
        }
      } catch (exception: IOException) {
        return null
      }
    } else {
      // For blobs larger than 64 KB, a synchronous write would fill up the whole buffer
      // and block forever, because there are no readers to empty the buffer.
      // Writing from a separate thread allows us to return the read side descriptor
      // immediately so that both writer and reader can work concurrently.
      // Reading from the pipe empties the buffer and allows the next chunks to be written.
      val writer = Runnable {
        try {
          ParcelFileDescriptor.AutoCloseOutputStream(writeSide).use { outputStream ->
            outputStream.write(data)
          }
        } catch (exception: IOException) {
          // no-op
        }
      }
      executor.submit(writer)
    }

    return readSide
  }

  private companion object {
    private const val PIPE_CAPACITY = 65536
  }
}
