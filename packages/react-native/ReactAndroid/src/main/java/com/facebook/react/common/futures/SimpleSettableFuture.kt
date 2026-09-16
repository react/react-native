/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.futures

import java.util.concurrent.CountDownLatch
import java.util.concurrent.ExecutionException
import java.util.concurrent.Future
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException

/**
 * A super simple Future-like class that can safely notify another Thread when a value is ready.
 * Does not support canceling.
 */
internal class SimpleSettableFuture<T> : Future<T> {

  private val readyLatch = CountDownLatch(1)
  private var result: T? = null
  private var exception: Exception? = null

  /**
   * Sets the result. If another thread has called [get], they will immediately receive the value.
   * set or setException must only be called once.
   */
  fun set(result: T?) {
    checkNotSet()
    this.result = result
    readyLatch.countDown()
  }

  /**
   * Sets the exception. If another thread has called [get], they will immediately receive the
   * exception. set or setException must only be called once.
   */
  fun setException(exception: Exception) {
    checkNotSet()
    this.exception = exception
    readyLatch.countDown()
  }

  override fun cancel(mayInterruptIfRunning: Boolean): Boolean {
    throw UnsupportedOperationException()
  }

  override fun isCancelled(): Boolean = false

  override fun isDone(): Boolean = readyLatch.count == 0L

  @Throws(InterruptedException::class, ExecutionException::class)
  override fun get(): T? {
    readyLatch.await()
    if (exception != null) {
      throw ExecutionException(exception)
    }
    return result
  }

  /**
   * Wait up to the timeout time for another Thread to set a value on this future. If a value has
   * already been set, this method will return immediately.
   *
   * NB: For simplicity, we catch and wrap InterruptedException. Do NOT use this class if you are in
   * the 1% of cases where you actually want to handle that.
   */
  @Throws(InterruptedException::class, ExecutionException::class, TimeoutException::class)
  override fun get(timeout: Long, unit: TimeUnit): T? {
    if (!readyLatch.await(timeout, unit)) {
      throw TimeoutException("Timed out waiting for result")
    }
    if (exception != null) {
      throw ExecutionException(exception)
    }
    return result
  }

  /** Convenience wrapper for [get()] that re-throws get()'s Exceptions as RuntimeExceptions. */
  fun getOrThrow(): T? =
      try {
        get()
      } catch (e: InterruptedException) {
        throw RuntimeException(e)
      } catch (e: ExecutionException) {
        throw RuntimeException(e)
      }

  /**
   * Convenience wrapper for [get(long, TimeUnit)] that re-throws get()'s Exceptions as
   * RuntimeExceptions.
   */
  fun getOrThrow(timeout: Long, unit: TimeUnit): T? =
      try {
        get(timeout, unit)
      } catch (e: InterruptedException) {
        throw RuntimeException(e)
      } catch (e: ExecutionException) {
        throw RuntimeException(e)
      } catch (e: TimeoutException) {
        throw RuntimeException(e)
      }

  private fun checkNotSet() {
    if (readyLatch.count == 0L) {
      throw RuntimeException("Result has already been set!")
    }
  }
}
