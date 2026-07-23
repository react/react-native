/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts

import com.facebook.react.interfaces.TaskInterface
import java.util.concurrent.Callable
import java.util.concurrent.CancellationException
import java.util.concurrent.Executor
import java.util.concurrent.TimeUnit

/**
 * Represents the result of an asynchronous operation.
 *
 * @param <TResult> The type of the result of the task.
 */
public class Task<TResult> : TaskInterface<TResult> {
  private val lock = Object()
  private var complete = false
  private var cancelled = false

  private var result: TResult? = null

  private var error: Exception? = null
  private val continuations: MutableList<Continuation<TResult, Unit>> = mutableListOf()

  internal constructor()

  private constructor(result: TResult?) {
    trySetResult(result)
  }

  private constructor(cancelled: Boolean) {
    if (cancelled) {
      trySetCancelled()
    } else {
      trySetResult(null)
    }
  }

  /**
   * @return `true` if the task completed (has a result, an error, or was cancelled. `false`
   *   otherwise.
   */
  override fun isCompleted(): Boolean =
      synchronized(lock) {
        return complete
      }

  /** @return `true` if the task was cancelled, `false` otherwise. */
  override fun isCancelled(): Boolean =
      synchronized(lock) {
        return cancelled
      }

  /** @return `true` if the task has an error, `false` otherwise. */
  override fun isFaulted(): Boolean =
      synchronized(lock) {
        return getError() != null
      }

  /** @return The result of the task, if set. `null` otherwise. */
  override fun getResult(): TResult? =
      synchronized(lock) {
        return result
      }

  /** @return The error for the task, if set. `null` otherwise. */
  override fun getError(): Exception? =
      synchronized(lock) {
        return error
      }

  /** Blocks until the task is complete. */
  @Throws(InterruptedException::class)
  override fun waitForCompletion(): Unit =
      synchronized(lock) {
        if (!isCompleted()) {
          lock.wait()
        }
      }

  /**
   * Blocks until the task is complete or times out.
   *
   * @return `true` if the task completed (has a result, an error, or was cancelled). `false`
   *   otherwise.
   */
  @Throws(InterruptedException::class)
  override fun waitForCompletion(duration: Long, timeUnit: TimeUnit): Boolean =
      synchronized(lock) {
        if (!isCompleted()) {
          lock.wait(timeUnit.toMillis(duration))
        }
        return isCompleted()
      }

  /** Turns a Task<T> into a Task<Void>, dropping any result */
  public fun makeVoid(): Task<Void> =
      continueWithTask({ task ->
        when {
          task.isCancelled() -> cancelled()
          task.isFaulted() -> forError(task.getError())
          else -> TASK_NULL
        }
      })

  /**
   * Adds a continuation that will be scheduled using the executor, returning a new task that
   * completes after the continuation has finished running. This allows the continuation to be
   * scheduled on different thread.
   */
  @JvmOverloads
  public fun <TContinuationResult> continueWith(
      continuation: Continuation<TResult, TContinuationResult>,
      executor: Executor = IMMEDIATE_EXECUTOR,
  ): Task<TContinuationResult> {
    val completed: Boolean
    val tcs = TaskCompletionSource<TContinuationResult>()
    synchronized(lock) {
      completed = this.isCompleted()
      if (!completed) {
        continuations.add(
            Continuation { task -> completeImmediately(tcs, continuation, task, executor) }
        )
      }
    }
    if (completed) {
      completeImmediately(tcs, continuation, this, executor)
    }
    return tcs.task
  }

  /**
   * Adds an Task-based continuation to this task that will be scheduled using the executor,
   * returning a new task that completes after the task returned by the continuation has completed.
   */
  @JvmOverloads
  public fun <TContinuationResult> continueWithTask(
      continuation: Continuation<TResult, Task<TContinuationResult>>,
      executor: Executor = IMMEDIATE_EXECUTOR,
  ): Task<TContinuationResult> {
    val completed: Boolean
    val tcs = TaskCompletionSource<TContinuationResult>()
    synchronized(lock) {
      completed = this.isCompleted()
      if (!completed) {
        continuations.add(
            Continuation { task -> completeAfterTask(tcs, continuation, task, executor) }
        )
      }
    }
    if (completed) {
      completeAfterTask(tcs, continuation, this, executor)
    }
    return tcs.task
  }

  /**
   * Runs a continuation when a task completes successfully, forwarding along [java.lang.Exception]
   * or cancellation.
   */
  public fun <TContinuationResult> onSuccess(
      continuation: Continuation<TResult, TContinuationResult>,
      executor: Executor = IMMEDIATE_EXECUTOR,
  ): Task<TContinuationResult> = continueWithTask(
      { task ->
        when {
          task.isCancelled() -> cancelled()
          task.isFaulted() -> forError(task.getError())
          else -> task.continueWith(continuation)
        }
      },
      executor,
  )

  /**
   * Runs a continuation when a task completes successfully, forwarding along [java.lang.Exception]s
   * or cancellation.
   */
  public fun <TContinuationResult> onSuccessTask(
      continuation: Continuation<TResult, Task<TContinuationResult>>,
      executor: Executor = IMMEDIATE_EXECUTOR,
  ): Task<TContinuationResult> = continueWithTask(
      { task ->
        when {
          task.isCancelled() -> cancelled()
          task.isFaulted() -> forError(task.getError())
          else -> task.continueWithTask(continuation)
        }
      },
      executor,
  )

  private fun runContinuations() =
      synchronized(lock) {
        for (continuation in continuations) {
          try {
            continuation.then(this)
          } catch (e: RuntimeException) {
            throw e
          } catch (e: Exception) {
            throw RuntimeException(e)
          }
        }
        continuations.clear()
      }

  /** Sets the cancelled flag on the Task if the Task hasn't already been completed. */
  internal fun trySetCancelled(): Boolean =
      synchronized(lock) {
        if (complete) {
          return false
        }
        this.complete = true
        this.cancelled = true
        lock.notifyAll()
        runContinuations()
        return true
      }

  /** Sets the result on the Task if the Task hasn't already been completed. */
  internal fun trySetResult(result: TResult?): Boolean =
      synchronized(lock) {
        if (complete) {
          return false
        }
        this.complete = true
        this.result = result
        lock.notifyAll()
        runContinuations()
        return true
      }

  /** Sets the error on the Task if the Task hasn't already been completed. */
  internal fun trySetError(error: Exception?): Boolean =
      synchronized(lock) {
        if (complete) {
          return false
        }
        this.complete = true
        this.error = error
        lock.notifyAll()
        runContinuations()
        return true
      }

  public companion object {
    /**
     * An [java.util.concurrent.Executor] that executes tasks in the current thread unless the stack
     * runs too deep, at which point it will delegate to [Task#BACKGROUND_EXECUTOR] in order to trim
     * the stack.
     */
    @JvmField public val IMMEDIATE_EXECUTOR: Executor = Executors.IMMEDIATE

    /** An [java.util.concurrent.Executor] that executes tasks on the UI thread. */
    @JvmField public val UI_THREAD_EXECUTOR: Executor = Executors.UI_THREAD

    @JvmStatic
    internal fun <TResult> create(): TaskCompletionSource<TResult> {
      return TaskCompletionSource()
    }

    /** Creates a completed task with the given value. */
    @JvmStatic
    @Suppress("UNCHECKED_CAST")
    public fun <TResult> forResult(value: TResult?): Task<TResult> {
      if (value == null) {
        return TASK_NULL as Task<TResult>
      }
      if (value is Boolean) {
        return (if (value) TASK_TRUE else TASK_FALSE) as Task<TResult>
      }
      val tcs = TaskCompletionSource<TResult>()
      tcs.setResult(value)
      return tcs.task
    }

    /** Creates a faulted task with the given error. */
    @JvmStatic
    public fun <TResult> forError(error: Exception?): Task<TResult> {
      val tcs = TaskCompletionSource<TResult>()
      tcs.setError(error)
      return tcs.task
    }

    /** Creates a cancelled task. */
    @JvmStatic
    public fun <TResult> cancelled(): Task<TResult> {
      @Suppress("UNCHECKED_CAST")
      return TASK_CANCELLED as Task<TResult>
    }

    /**
     * Invokes the callable using the given executor, returning a Task to represent the operation.
     */
    @JvmStatic
    public fun <TResult> call(
        callable: Callable<Task<TResult>>,
        executor: Executor,
    ): Task<TResult> {
      val tcs = TaskCompletionSource<TResult>()
      try {
        executor.execute {
          val continuation = Continuation { task: Task<TResult> ->
            when {
              task.isCancelled() -> tcs.setCancelled()
              task.isFaulted() -> tcs.setError(task.getError())
              else -> tcs.setResult(task.getResult())
            }
          }
          try {
            val task = callable.call()
            synchronized(task.lock) {
              if (task.isCompleted()) {
                continuation.then(task)
              } else {
                task.continuations.add(continuation)
              }
            }
          } catch (e: CancellationException) {
            tcs.setCancelled()
          } catch (e: Exception) {
            tcs.setError(e)
          }
        }
      } catch (e: Exception) {
        tcs.setError(ExecutorException(e))
      }

      return tcs.task
    }

    /**
     * Handles the non-async (i.e. the continuation doesn't return a Task) continuation case,
     * passing the results of the given Task through to the given continuation and using the results
     * of that call to set the result of the TaskContinuationSource.
     *
     * @param tcs The TaskContinuationSource that will be orchestrated by this call.
     * @param continuation The non-async continuation.
     * @param task The task being completed.
     * @param executor The executor to use when running the continuation (allowing the continuation
     *   to be scheduled on a different thread).
     */
    private fun <TContinuationResult, TResult> completeImmediately(
        tcs: TaskCompletionSource<TContinuationResult>,
        continuation: Continuation<TResult, TContinuationResult>,
        task: Task<TResult>,
        executor: Executor,
    ) {
      try {
        executor.execute {
          try {
            val result = continuation.then(task)
            tcs.setResult(result)
          } catch (e: CancellationException) {
            tcs.setCancelled()
          } catch (e: Exception) {
            tcs.setError(e)
          }
        }
      } catch (e: Exception) {
        tcs.setError(ExecutorException(e))
      }
    }

    /**
     * Handles the async (i.e. the continuation does return a Task) continuation case, passing the
     * results of the given Task through to the given continuation to get a new Task. The
     * TaskCompletionSource's results are only set when the new Task has completed, unwrapping the
     * results of the task returned by the continuation.
     *
     * @param tcs The TaskContinuationSource that will be orchestrated by this call.
     * @param continuation The async continuation.
     * @param task The task being completed.
     * @param executor The executor to use when running the continuation (allowing the continuation
     *   to be scheduled on a different thread).
     */
    private fun <TContinuationResult, TResult> completeAfterTask(
        tcs: TaskCompletionSource<TContinuationResult>,
        continuation: Continuation<TResult, Task<TContinuationResult>>,
        task: Task<TResult>,
        executor: Executor,
    ) {
      try {
        executor.execute {
          try {
            val result = continuation.then(task)
            if (result == null) {
              tcs.setResult(null)
            } else {
              result.continueWith({ task ->
                when {
                  task.isCancelled() -> tcs.setCancelled()
                  task.isFaulted() -> tcs.setError(task.getError())
                  else -> tcs.setResult(task.getResult())
                }
              })
            }
          } catch (e: CancellationException) {
            tcs.setCancelled()
          } catch (e: Exception) {
            tcs.setError(e)
          }
        }
      } catch (e: Exception) {
        tcs.setError(ExecutorException(e))
      }
    }

    private val TASK_NULL: Task<Void> = Task(null)
    private val TASK_TRUE = Task(result = true)
    private val TASK_FALSE = Task(result = false)
    private val TASK_CANCELLED: Task<Any?> = Task(cancelled = true)
  }
}
