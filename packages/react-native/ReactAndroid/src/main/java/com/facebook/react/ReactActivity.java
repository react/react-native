/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import android.view.KeyEvent;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.util.AndroidVersion;
import org.jetbrains.annotations.NotNull;

/** Base Activity for React Native applications. */
public abstract class ReactActivity extends AppCompatActivity
    implements DefaultHardwareBackBtnHandler, PermissionAwareActivity {

  private final ReactActivityDelegate mDelegate;

  // Due to enforced predictive back on targetSdk 36, 'onBackPressed()' is disabled by default.
  // Using a workaround to trigger it manually.
  private final OnBackPressedCallback mBackPressedCallback =
      new OnBackPressedCallback(true) {
        @Override
        public void handleOnBackPressed() {
          setEnabled(false);
          onBackPressed();
          setEnabled(true);
        }
      };

  protected ReactActivity() {
    mDelegate = createReactActivityDelegate();
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component. e.g. "MoviesApp"
   */
  protected @Nullable String getMainComponentName() {
    return null;
  }

  /** Called at construction time, override if you have a custom delegate implementation. */
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegate(this, getMainComponentName());
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    mDelegate.onCreate(savedInstanceState);
    if (AndroidVersion.isAtLeastTargetSdk36(this)) {
      getOnBackPressedDispatcher().addCallback(this, mBackPressedCallback);
    }
  }

  @Override
  protected void onPause() {
    super.onPause();
    mDelegate.onPause();
  }

  @Override
  protected void onResume() {
    super.onResume();
    mDelegate.onResume();
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();
    mDelegate.onDestroy();
  }

  public @Nullable ReactDelegate getReactDelegate() {
    return mDelegate.getReactDelegate();
  }

  public ReactActivityDelegate getReactActivityDelegate() {
    return mDelegate;
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    mDelegate.onActivityResult(requestCode, resultCode, data);
  }

  @Override
  public boolean onKeyDown(int keyCode, KeyEvent event) {
    return mDelegate.onKeyDown(keyCode, event) || super.onKeyDown(keyCode, event);
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    return mDelegate.onKeyUp(keyCode, event) || super.onKeyUp(keyCode, event);
  }

  @Override
  public boolean onKeyLongPress(int keyCode, KeyEvent event) {
    return mDelegate.onKeyLongPress(keyCode, event) || super.onKeyLongPress(keyCode, event);
  }

  @Override
  public void onBackPressed() {
    if (!mDelegate.onBackPressed()) {
      super.onBackPressed();
    }
  }

  @Override
  public void invokeDefaultOnBackPressed() {
    // Disabling callback so the fallback logic (finish activity) can run
    // as super.onBackPressed() will call all enabled callbacks in the dispatcher.
    mBackPressedCallback.setEnabled(false);
    super.onBackPressed();
    // Re-enable callback to ensure custom back handling works after activity resume
    // Without this, the callback remains disabled when the app returns from background
    mBackPressedCallback.setEnabled(true);
  }

  @Override
  public void onNewIntent(Intent intent) {
    if (!mDelegate.onNewIntent(intent)) {
      super.onNewIntent(intent);
    }
  }

  @Override
  public void onUserLeaveHint() {
    super.onUserLeaveHint();
    mDelegate.onUserLeaveHint();
  }

  @Override
  public void requestPermissions(
      String[] permissions, int requestCode, PermissionListener listener) {
    mDelegate.requestPermissions(permissions, requestCode, listener);
  }

  @Override
  public void onRequestPermissionsResult(
      int requestCode, @NotNull String[] permissions, @NotNull int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    mDelegate.onRequestPermissionsResult(requestCode, permissions, grantResults);
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    mDelegate.onWindowFocusChanged(hasFocus);
  }

  @Override
  public void onConfigurationChanged(@NotNull Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    mDelegate.onConfigurationChanged(newConfig);
  }

  protected final ReactNativeHost getReactNativeHost() {
    return mDelegate.getReactNativeHost();
  }

  protected ReactHost getReactHost() {
    return mDelegate.getReactHost();
  }

  protected final ReactInstanceManager getReactInstanceManager() {
    return mDelegate.getReactInstanceManager();
  }

  protected final void loadApp(String appKey) {
    mDelegate.loadApp(appKey);
  }
}
