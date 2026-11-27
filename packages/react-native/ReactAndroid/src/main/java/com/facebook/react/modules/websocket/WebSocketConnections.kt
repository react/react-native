/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.websocket

import okhttp3.WebSocket

/** A slot remains owned until the transport reports its terminal callback. */
internal class WebSocketConnections {
  internal class Connection(val id: Int) {
    var socket: WebSocket? = null
    var opened = false
    var closing = false
    var finished = false
  }

  private val connections = mutableMapOf<Int, Connection>()
  private var retired = false

  @Synchronized
  fun create(id: Int): Connection {
    check(!retired && !connections.containsKey(id))
    return Connection(id).also { connections[id] = it }
  }

  fun attach(connection: Connection, socket: WebSocket) {
    val cancel =
        synchronized(this) {
          if (
              connections[connection.id] !== connection ||
                  connection.finished ||
                  (connection.closing && (!connection.opened || connection.socket !== socket))
          ) {
            true
          } else {
            check(connection.socket == null || connection.socket === socket)
            connection.socket = socket
            false
          }
        }
    if (cancel) socket.cancel()
  }

  fun opened(connection: Connection, socket: WebSocket): Boolean {
    val accepted =
        synchronized(this) {
          if (
              connections[connection.id] !== connection ||
                  connection.finished ||
                  connection.closing ||
                  (connection.socket != null && connection.socket !== socket)
          ) {
            false
          } else {
            connection.socket = socket
            connection.opened = true
            true
          }
        }
    if (!accepted) socket.cancel()
    return accepted
  }

  @Synchronized
  fun readable(connection: Connection, socket: WebSocket): Boolean =
      connections[connection.id] === connection &&
          connection.socket === socket &&
          connection.opened &&
          !connection.closing &&
          !connection.finished

  fun peerClosing(connection: Connection, socket: WebSocket, code: Int, reason: String) {
    synchronized(this) {
      if (!readable(connection, socket)) return
      connection.closing = true
    }
    // OkHttp reports 1005 for an empty peer Close frame. It is reserved on the wire.
    socket.close(if (code == 1005) 1000 else code, reason)
  }

  fun socketForSend(id: Int, onMissing: (Int) -> Unit): WebSocket? {
    val pendingSocket =
        synchronized(this) {
          val connection = connections[id] ?: return@synchronized null
          if (connection.closing) return null
          if (connection.opened) return connection.socket

          // The caller reports the error. Retire the slot before cancelling its transport.
          connections.remove(id)
          connection.finished = true
          connection.socket
        }
    pendingSocket?.cancel()
    onMissing(id)
    return null
  }

  fun close(id: Int, code: Int, reason: String) {
    val action =
        synchronized(this) {
          val connection = connections[id] ?: return
          if (connection.closing || connection.finished) return
          connection.closing = true
          Pair(connection.socket, connection.opened)
        }
    val socket = action.first ?: return // attach() cancels a handle that arrives later.
    if (!action.second) {
      socket.cancel()
      return
    }
    try {
      socket.close(code, reason)
    } catch (error: IllegalArgumentException) {
      // OkHttp rejected the close frame. Cancellation still delivers a terminal callback.
      socket.cancel()
      throw error
    }
  }

  @Synchronized
  fun finish(connection: Connection, socket: WebSocket?): Boolean {
    if (
        connections[connection.id] !== connection ||
            connection.finished ||
            (connection.socket != null && socket != null && connection.socket !== socket)
    )
        return false
    connection.finished = true
    connections.remove(connection.id)
    return true
  }

  fun invalidate() {
    val sockets =
        synchronized(this) {
          retired = true
          connections.values
              .mapNotNull { connection ->
                connection.finished = true
                connection.closing = true
                connection.socket?.let { Pair(it, connection.opened) }
              }
              .also { connections.clear() }
        }
    sockets.forEach { (socket, opened) ->
      if (opened) socket.close(1001, null) else socket.cancel()
    }
  }
}
