/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection

import android.os.Handler
import android.os.Looper
import android.util.Base64
import com.facebook.common.logging.FLog
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.IOException
import org.json.JSONObject

public class FileIoHandler : Runnable {

  private class TtlFileInputStream(path: String?) {
    private val stream = FileInputStream(path)
    private var ttl: Long = System.currentTimeMillis() + FILE_TTL

    private fun extendTtl() {
      ttl = System.currentTimeMillis() + FILE_TTL
    }

    fun expiredTtl(): Boolean = System.currentTimeMillis() >= ttl

    @Throws(IOException::class)
    fun read(size: Int): String {
      extendTtl()
      val buffer = ByteArray(size)
      val bytesRead = stream.read(buffer)
      return Base64.encodeToString(buffer, 0, bytesRead, Base64.DEFAULT)
    }

    @Throws(IOException::class)
    fun close() {
      stream.close()
    }
  }

  private var nextHandle = 1
  private val handler = Handler(Looper.getMainLooper())
  private val openFiles: MutableMap<Int, TtlFileInputStream> = mutableMapOf()
  private val requestHandlers: MutableMap<String, RequestHandler> = mutableMapOf()

  init {
    requestHandlers["fopen"] =
        object : RequestOnlyHandler() {
          override fun onRequest(params: Any?, responder: Responder) {
            synchronized(openFiles) {
              try {
                val paramsObj =
                    params as JSONObject?
                        ?: throw Exception(
                            "params must be an object { mode: string, filename: string }",
                        )
                val mode = paramsObj.optString("mode") ?: throw Exception("missing params.mode")
                val filename =
                    paramsObj.optString("filename") ?: throw Exception("missing params.filename")
                require(mode == "r") { "unsupported mode: $mode" }

                responder.respond(addOpenFile(filename))
              } catch (e: Exception) {
                responder.error(e.toString())
              }
            }
          }
        }
    requestHandlers["fclose"] =
        object : RequestOnlyHandler() {
          override fun onRequest(params: Any?, responder: Responder) {
            synchronized(openFiles) {
              try {
                if (params !is Number) {
                  throw Exception("params must be a file handle")
                }
                val stream =
                    openFiles[params]
                        ?: throw Exception("invalid file handle, it might have timed out")

                openFiles.remove(params)
                stream.close()
                responder.respond("")
              } catch (e: Exception) {
                responder.error(e.toString())
              }
            }
          }
        }
    requestHandlers["fread"] =
        object : RequestOnlyHandler() {
          override fun onRequest(params: Any?, responder: Responder) {
            synchronized(openFiles) {
              try {
                val paramsObj =
                    params as JSONObject?
                        ?: throw Exception(
                            "params must be an object { file: handle, size: number }",
                        )
                val file = paramsObj.optInt("file")
                if (file == 0) {
                  throw Exception("invalid or missing file handle")
                }
                val size = paramsObj.optInt("size")
                if (size == 0) {
                  throw Exception("invalid or missing read size")
                }
                val stream =
                    openFiles[file]
                        ?: throw Exception("invalid file handle, it might have timed out")

                responder.respond(stream.read(size))
              } catch (e: Exception) {
                responder.error(e.toString())
              }
            }
          }
        }
  }

  public fun handlers(): Map<String, RequestHandler> = requestHandlers

  @Throws(FileNotFoundException::class)
  private fun addOpenFile(filename: String): Int {
    val handle = nextHandle++
    openFiles[handle] = TtlFileInputStream(filename)
    if (openFiles.size == 1) {
      handler.postDelayed(this@FileIoHandler, FILE_TTL)
    }
    return handle
  }

  override fun run() {
    // clean up files that are past their expiry date
    synchronized(openFiles) {
      openFiles.entries.removeAll { (_, stream) ->
        if (stream.expiredTtl()) {
          try {
            stream.close()
          } catch (e: IOException) {
            FLog.e(TAG, "Failed to close expired file", e)
          }
          true
        } else {
          false
        }
      }

      if (openFiles.isNotEmpty()) {
        handler.postDelayed(this, FILE_TTL)
      }
    }
  }

  private companion object {
    private val TAG: String = JSPackagerClient::class.java.simpleName
    private const val FILE_TTL = 30_000L
  }
}
