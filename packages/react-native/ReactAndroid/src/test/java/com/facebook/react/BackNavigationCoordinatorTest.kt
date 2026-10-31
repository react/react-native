/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * Licensed under the MIT license in the root directory of this source tree.
 */
package com.facebook.react

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class BackNavigationCoordinatorTest {
  @Test
  fun nativeFallbackSuppressesJSAndRestoresOwnershipEvenOnThrow() {
    val coordinator = BackNavigationCoordinator()
    coordinator.update(Any(), true, true)
    val states = mutableListOf<Boolean>()
    coordinator.addListener { states.add(coordinator.isJavaScriptEnabled) }
    try {
      coordinator.withNativeFallback {
        assertThat(coordinator.isJavaScriptEnabled).isFalse()
        throw IllegalStateException("test")
      }
    } catch (expected: IllegalStateException) {
      assertThat(expected.message).isEqualTo("test")
    }
    assertThat(states).containsExactly(false, true)
    assertThat(coordinator.isJavaScriptEnabled).isTrue()
  }

  @Test
  fun ownershipTransitionsPreserveLegacyUntilExplicitOptIn() {
    val coordinator = BackNavigationCoordinator()
    val owner = Any()
    assertThat(coordinator.isJavaScriptEnabled).isTrue()
    coordinator.update(owner, true, false)
    assertThat(coordinator.isJavaScriptEnabled).isFalse()
    coordinator.update(owner, true, true)
    assertThat(coordinator.isJavaScriptEnabled).isTrue()
    coordinator.update(owner, false, false)
    assertThat(coordinator.isJavaScriptEnabled).isTrue()
  }

  @Test
  fun staleContextTeardownCannotReleaseCurrentOwner() {
    val coordinator = BackNavigationCoordinator()
    val old = Any()
    val current = Any()
    coordinator.update(old, true, false)
    coordinator.update(current, true, true)
    coordinator.release(old)
    assertThat(coordinator.isNativeNavigationEnabled).isTrue()
    assertThat(coordinator.hasJavaScriptHandlers()).isTrue()
    coordinator.release(current)
    assertThat(coordinator.isNativeNavigationEnabled).isFalse()
  }

  @Test
  fun removedListenersDoNotObserveLaterTransitions() {
    val coordinator = BackNavigationCoordinator()
    val owner = Any()
    var calls = 0
    lateinit var listener: Runnable
    listener = Runnable {
      calls++
      coordinator.removeListener(listener)
    }
    coordinator.addListener(listener)
    coordinator.update(owner, true, false)
    coordinator.update(owner, true, true)
    assertThat(calls).isEqualTo(1)
  }
}
