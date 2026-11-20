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

  @Synchronized
  fun openSocket(id: Int): WebSocket? {
    val connection = connections[id] ?: return null
    return if (connection.opened && !connection.closing && !connection.finished) connection.socket
    else null
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
    if (action.second) socket.close(code, reason) else socket.cancel()
  }

  /** The caller publishes its own terminal error after retiring the connection. */
  fun retire(id: Int) {
    val socket =
        synchronized(this) {
          val connection = connections.remove(id) ?: return
          connection.finished = true
          connection.closing = true
          connection.socket
        }
    socket?.cancel()
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
