/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.content.pm.PackageManager
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner

class PermissionAwareTestFragment : ReactFragment() {
  private fun markLifecycleCalled() {
    val calledField = Fragment::class.java.getDeclaredField("mCalled")
    calledField.isAccessible = true
    calledField.setBoolean(this, true)
  }

  override fun onCreate(savedInstanceState: android.os.Bundle?) {
    markLifecycleCalled()
  }

  override fun onCreateView(
      inflater: LayoutInflater,
      container: ViewGroup?,
      savedInstanceState: android.os.Bundle?,
  ): View? = null

  override fun onResume() {
    markLifecycleCalled()
  }
}

class PermissionStubFragmentActivity : FragmentActivity() {
  var checkPermissionResult = PackageManager.PERMISSION_DENIED
  var checkSelfPermissionResult = PackageManager.PERMISSION_DENIED

  override fun checkPermission(permission: String, pid: Int, uid: Int): Int {
    return checkPermissionResult
  }

  override fun checkSelfPermission(permission: String): Int {
    return checkSelfPermissionResult
  }
}

@RunWith(RobolectricTestRunner::class)
class ReactFragmentTest {

  @Test
  fun checkPermissions_withoutAttachedActivity_shouldReturnDenied() {
    val fragment = ReactFragment()

    assertThat(fragment.checkPermission("android.permission.CAMERA", 0, 0))
        .isEqualTo(PackageManager.PERMISSION_DENIED)
    assertThat(fragment.checkSelfPermission("android.permission.CAMERA"))
        .isEqualTo(PackageManager.PERMISSION_DENIED)
  }

  @Test
  fun checkPermissions_withAttachedActivity_shouldDelegateToActivity() {
    val fragment = PermissionAwareTestFragment()
    val activity = Robolectric.buildActivity(PermissionStubFragmentActivity::class.java).setup().get()
    val permission = "android.permission.CAMERA"
    val pid = 42
    val uid = 99

    activity.checkPermissionResult = PackageManager.PERMISSION_GRANTED
    activity.checkSelfPermissionResult = PackageManager.PERMISSION_GRANTED

    activity.supportFragmentManager.beginTransaction().add(fragment, "react_fragment").commitNow()

    assertThat(fragment.activity).isSameAs(activity)
    assertThat(fragment.checkPermission(permission, pid, uid))
        .isEqualTo(PackageManager.PERMISSION_GRANTED)
    assertThat(fragment.checkSelfPermission(permission)).isEqualTo(PackageManager.PERMISSION_GRANTED)
  }
}
