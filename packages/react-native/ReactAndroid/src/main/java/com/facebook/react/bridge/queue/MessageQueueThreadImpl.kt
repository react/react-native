/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue

import android.os.Looper
import android.os.Process
import com.facebook.common.logging.FLog
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.AssertionException
import com.facebook.react.bridge.SoftAssertions
import com.facebook.react.bridge.queue.MessageQueueThreadSpec.ThreadType
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.futures.SimpleSettableFuture
import java.util.concurrent.Callable
import java.util.concurrent.Future
import kotlin.concurrent.Volatile

/** Encapsulates a Thread that has a [Looper] running on it that can accept Runnables. */
@DoNotStripAny
public class MessageQueueThreadImpl
private constructor(
    public val name: String,
    public val looper: Looper,
    exceptionHandler: QueueThreadExceptionHandler,
) : MessageQueueThread {
  private val handler = MessageQueueThreadHandler(looper, exceptionHandler)
  private val assertionErrorMessage = "Expected to be called from the '$name' thread!"

  @Volatile private var isFinished = false

  /**
   * Runs the given Runnable on this Thread. It will be submitted to the end of the event queue even
   * if it is being submitted from the same queue Thread.
   */
  public override fun runOnQueue(runnable: Runnable): Boolean {
    if (isFinished) {
      FLog.w(
          ReactConstants.TAG,
          "Tried to enqueue runnable on already finished thread: '$name... dropping Runnable.",
      )
      return false
    }
    handler.post(runnable)
    return true
  }

  public override fun <T> callOnQueue(callable: Callable<T>): Future<T> {
    val future = SimpleSettableFuture<T>()
    runOnQueue {
      try {
        future.set(callable.call())
      } catch (e: Exception) {
        future.setException(e)
      }
    }
    return future
  }

  /**
   * @return whether the current Thread is also the Thread associated with this MessageQueueThread.
   */
  override fun isOnThread(): Boolean = looper.thread === Thread.currentThread()

  /**
   * Asserts [isOnThread], throwing a [AssertionException] (NOT an [AssertionError]) if the
   * assertion fails.
   */
  @Throws(AssertionException::class)
  override fun assertIsOnThread() {
    SoftAssertions.assertCondition(isOnThread(), assertionErrorMessage)
  }

  /**
   * Asserts [isOnThread], throwing a [AssertionException] (NOT an [AssertionError]) if the
   * assertion fails.
   */
  @Throws(AssertionException::class)
  public override fun assertIsOnThread(message: String) {
    SoftAssertions.assertCondition(
        isOnThread(),
        StringBuilder().append(assertionErrorMessage).append(" ").append(message).toString(),
    )
  }

  /**
   * Quits this queue's Looper. If that Looper was running on a different Thread than the current
   * Thread, also waits for the last message being processed to finish and the Thread to die.
   */
  @Throws(RuntimeException::class)
  override fun quitSynchronous() {
    isFinished = true
    looper.quit()
    if (looper.thread !== Thread.currentThread()) {
      try {
        looper.thread.join()
      } catch (e: InterruptedException) {
        throw RuntimeException("Got interrupted waiting to join thread $name")
      }
    }
  }

  public override fun isIdle(): Boolean = looper.queue.isIdle

  public companion object {
    @JvmStatic
    @Throws(RuntimeException::class)
    public fun create(
        spec: MessageQueueThreadSpec,
        exceptionHandler: QueueThreadExceptionHandler,
    ): MessageQueueThreadImpl {
      return when (spec.threadType) {
        ThreadType.MAIN_UI -> createForMainThread(spec.name, exceptionHandler)

        ThreadType.NEW_BACKGROUND ->
            startNewBackgroundThread(spec.name, spec.stackSize, exceptionHandler)
      }
    }

    /** Returns a MessageQueueThreadImpl corresponding to Android's main UI thread. */
    private fun createForMainThread(
        name: String,
        exceptionHandler: QueueThreadExceptionHandler,
    ): MessageQueueThreadImpl =
        MessageQueueThreadImpl(name, Looper.getMainLooper(), exceptionHandler)

    /**
     * Creates and starts a new MessageQueueThreadImpl encapsulating a new Thread with a new Looper
     * running on it. Give it a name for easier debugging and optionally a suggested stack size.
     * When this method exits, the new MessageQueueThreadImpl is ready to receive events. throws a
     * Runtime exception if there was no looper for current thread or looper and stats couldn't be
     * made
     */
    @Throws(RuntimeException::class)
    private fun startNewBackgroundThread(
        name: String,
        stackSize: Long,
        exceptionHandler: QueueThreadExceptionHandler,
    ): MessageQueueThreadImpl {
      val looperFuture = SimpleSettableFuture<Looper?>()
      val bgThread =
          Thread(
              null,
              {
                Process.setThreadPriority(Process.THREAD_PRIORITY_DISPLAY)
                Looper.prepare()
                looperFuture.set(Looper.myLooper())
                Looper.loop()
              },
              "mqt_$name",
              stackSize,
          )
      bgThread.start()

      val looper =
          looperFuture.getOrThrow() ?: throw RuntimeException("Looper not found for thread")
      return MessageQueueThreadImpl(name, looper, exceptionHandler)
    }
  }
}
