/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.intent

import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatCode
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class IntentModuleTest {

  private lateinit var context: ReactApplicationContext
  private lateinit var intentModule: IntentModule

  @Before
  fun setUp() {
    context = mock<ReactApplicationContext>()
    intentModule = IntentModule(context)
  }

  /**
   * Regression test for the ConcurrentModificationException thrown from onHostResume. When the
   * current activity is still null at resume time, draining pendingOpenURLPromises re-enters
   * getInitialURL -> waitForActivityAndGetInitialURL, which adds back into the same list. Before
   * the fix this mutated the list mid-iteration and crashed. The synchronized guard does not help:
   * the re-entrancy is on the same thread and already holds the lock.
   */
  @Test
  fun getInitialURL_onHostResumeWithNullActivity_doesNotThrowAndPreservesPromise() {
    // No current activity: getInitialURL queues the promise and registers a lifecycle listener.
    whenever(context.currentActivity).thenReturn(null)

    val promise = SimplePromise()
    intentModule.getInitialURL(promise)

    val listenerCaptor = argumentCaptor<LifecycleEventListener>()
    verify(context).addLifecycleEventListener(listenerCaptor.capture())

    // Resume while the activity is still null (e.g. a deep link landing mid activity-transition).
    // The drain re-queues the promise; before the fix this threw ConcurrentModificationException.
    assertThatCode { listenerCaptor.firstValue.onHostResume() }.doesNotThrowAnyException()

    // The promise was re-queued rather than silently dropped: a fresh listener is registered for
    // the next resume, and the promise is left pending (neither resolved nor rejected).
    verify(context, times(2)).addLifecycleEventListener(any())
    assertThat(promise.resolved).isEqualTo(0)
    assertThat(promise.rejected).isEqualTo(0)
  }

  internal class SimplePromise : Promise {
    companion object {
      private const val ERROR_DEFAULT_CODE = "EUNSPECIFIED"
      private const val ERROR_DEFAULT_MESSAGE = "Error not specified."
    }

    var resolved = 0
      private set

    var rejected = 0
      private set

    var value: Any? = null
      private set

    var errorCode: String? = null
      private set

    var errorMessage: String? = null
      private set

    override fun resolve(value: Any?) {
      resolved++
      this.value = value
    }

    override fun reject(code: String?, message: String?) {
      reject(code, message, null, null)
    }

    override fun reject(code: String?, throwable: Throwable?) {
      reject(code, null, throwable, null)
    }

    override fun reject(code: String?, message: String?, throwable: Throwable?) {
      reject(code, message, throwable, null)
    }

    override fun reject(throwable: Throwable) {
      reject(null, null, throwable, null)
    }

    override fun reject(throwable: Throwable, userInfo: WritableMap) {
      reject(null, null, throwable, userInfo)
    }

    override fun reject(code: String?, userInfo: WritableMap) {
      reject(code, null, null, userInfo)
    }

    override fun reject(code: String?, throwable: Throwable?, userInfo: WritableMap) {
      reject(code, null, throwable, userInfo)
    }

    override fun reject(code: String?, message: String?, userInfo: WritableMap) {
      reject(code, message, null, userInfo)
    }

    override fun reject(
        code: String?,
        message: String?,
        throwable: Throwable?,
        userInfo: WritableMap?,
    ) {
      rejected++

      errorCode = code ?: ERROR_DEFAULT_CODE
      errorMessage = message ?: throwable?.message ?: ERROR_DEFAULT_MESSAGE
    }

    @Deprecated("Method deprecated", ReplaceWith("reject(code, message)"))
    override fun reject(message: String) {
      reject(null, message, null, null)
    }
  }
}
