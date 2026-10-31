/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * Licensed under the MIT license in the root directory of this source tree.
 */
package com.facebook.react;

import androidx.annotation.UiThread;
import java.util.LinkedHashSet;
import java.util.Set;

/** Activity-scoped ownership shared by native navigators and JavaScript BackHandler. */
@UiThread
public final class BackNavigationCoordinator {
  private int nativeFallbackDepth;
  private Object owner;
  private boolean nativeNavigationEnabled;
  private boolean javaScriptHandlers;
  private final Set<Runnable> listeners = new LinkedHashSet<>();

  public boolean isNativeNavigationEnabled() {
    return nativeNavigationEnabled;
  }

  public boolean hasJavaScriptHandlers() {
    return javaScriptHandlers;
  }

  public boolean isJavaScriptEnabled() {
    return nativeFallbackDepth == 0 && (!nativeNavigationEnabled || javaScriptHandlers);
  }

  /** Dispatches an unhandled JS Back to native owners without re-entering JS. */
  public void withNativeFallback(Runnable dispatch) {
    nativeFallbackDepth++;
    try {
      notifyListeners();
      dispatch.run();
    } finally {
      nativeFallbackDepth--;
      notifyListeners();
    }
  }

  private void notifyListeners() {
    for (Runnable listener : listeners.toArray(new Runnable[0])) listener.run();
  }

  public void addListener(Runnable listener) {
    listeners.add(listener);
  }

  public void removeListener(Runnable listener) {
    listeners.remove(listener);
  }

  public void release(Object previousOwner) {
    if (owner != previousOwner) return;
    owner = null;
    updateState(false, false);
  }

  public void update(Object nextOwner, boolean enabled, boolean hasHandlers) {
    owner = nextOwner;
    updateState(enabled, hasHandlers);
  }

  private void updateState(boolean enabled, boolean hasHandlers) {
    if (nativeNavigationEnabled == enabled && javaScriptHandlers == hasHandlers) return;
    nativeNavigationEnabled = enabled;
    javaScriptHandlers = hasHandlers;
    notifyListeners();
  }
}
