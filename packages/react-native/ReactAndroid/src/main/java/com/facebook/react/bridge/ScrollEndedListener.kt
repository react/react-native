/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.view.ViewGroup
import java.lang.ref.WeakReference
import java.util.concurrent.CopyOnWriteArrayList

/** Listener interface for scroll ended events. This is a native only event. */
public interface ScrollEndedListener {
  /**
   * Called when user-driven scrolling ends.
   *
   * @param scrollView The scroll view that has stopped scrolling
   */
  public fun onScrollEnded(scrollView: ViewGroup)
}

/**
 * Registry for managing ScrollEndedListener instances. This provides a decoupled mechanism for
 * scroll views to notify interested parties (like NativeAnimatedModule) when user-driven scrolling
 * ends, without creating circular dependencies between modules.
 *
 * This class is instantiated per ReactContext and can be accessed via
 * [com.facebook.react.bridge.ReactContext.getScrollEndedListeners].
 */
public class ScrollEndedListeners {
  private val listeners = CopyOnWriteArrayList<WeakReference<ScrollEndedListener>>()

  /**
   * Adds a scroll ended listener. This listener is called when user-driven scrolling ends.
   *
   * @param listener The listener to add
   */
  public fun addListener(listener: ScrollEndedListener) {
    listeners.add(WeakReference(listener))
  }

  /**
   * Removes a scroll ended listener.
   *
   * @param listener The listener to remove
   */
  public fun removeListener(listener: ScrollEndedListener) {
    val toRemove = ArrayList<WeakReference<ScrollEndedListener>>()
    for (ref in listeners) {
      val target = ref.get()
      if (target == null || target == listener) {
        toRemove.add(ref)
      }
    }
    listeners.removeAll(toRemove)
  }

  /**
   * Notifies all registered listeners that user-driven scrolling has ended.
   *
   * @param scrollView The scroll view that has stopped scrolling
   */
  public fun notifyScrollEnded(scrollView: ViewGroup) {
    for (listenerRef in listeners) {
      listenerRef.get()?.onScrollEnded(scrollView)
    }
  }
}
