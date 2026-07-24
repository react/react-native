/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

/**
 * Fragment for creating a React View. This allows the developer to "embed" a React Application
 * inside native components such as a Drawer, ViewPager, etc.
 */
public open class ReactFragment : Fragment(), PermissionAwareActivity {
  protected lateinit var reactDelegate: ReactDelegate
  private var disableHostLifecycleEvents = false
  private var permissionListener: PermissionListener? = null

  public override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    var mainComponentName: String? = null
    var launchOptions: Bundle? = null
    arguments?.let { args ->
      mainComponentName = args.getString(ARG_COMPONENT_NAME)
      launchOptions = args.getBundle(ARG_LAUNCH_OPTIONS)
      @Suppress("DEPRECATION")
      disableHostLifecycleEvents = args.getBoolean(ARG_DISABLE_HOST_LIFECYCLE_EVENTS)
    }
    checkNotNull(mainComponentName) { "Cannot loadApp if component name is null" }

    reactDelegate = ReactDelegate(requireActivity(), reactHost, mainComponentName, launchOptions)
  }

  /**
   * Get the [ReactHost] used by this app. By default, assumes [Activity.getApplication] is an
   * instance of [ReactApplication] and calls [ReactApplication.reactHost]. Override this method if
   * your application class does not implement `ReactApplication` or you simply have a different
   * mechanism for storing a `ReactHost`, e.g. as a static field somewhere.
   */
  protected open val reactHost: ReactHost?
    get() = (activity?.application as ReactApplication?)?.reactHost

  public override fun onCreateView(
      inflater: LayoutInflater,
      container: ViewGroup?,
      savedInstanceState: Bundle?,
  ): View? {
    reactDelegate.loadApp()
    return reactDelegate.reactRootView
  }

  public override fun onResume() {
    super.onResume()
    if (!disableHostLifecycleEvents) {
      reactDelegate.onHostResume()
    }
  }

  public override fun onPause() {
    super.onPause()
    if (!disableHostLifecycleEvents) {
      reactDelegate.onHostPause()
    }
  }

  public override fun onDestroy() {
    super.onDestroy()
    if (!disableHostLifecycleEvents) {
      reactDelegate.onHostDestroy()
    } else {
      reactDelegate.unloadApp()
    }
  }

  @Deprecated("Deprecated in Java")
  public override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    @Suppress("DEPRECATION") super.onActivityResult(requestCode, resultCode, data)
    reactDelegate.onActivityResult(requestCode, resultCode, data, false)
  }

  /**
   * Helper to forward hardware back presses to our React Native Host.
   *
   * This must be called via a forward from your host Activity.
   */
  public open fun onBackPressed(): Boolean = reactDelegate.onBackPressed()

  /**
   * Helper to forward onKeyUp commands from our host Activity. This allows [ReactFragment] to
   * handle double tap reloads and dev menus.
   *
   * This must be called via a forward from your host Activity.
   *
   * @param keyCode keyCode
   * @param event event
   * @return true if we handled onKeyUp
   */
  public open fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean =
      reactDelegate.shouldShowDevMenuOrReload(keyCode, event)

  @Deprecated("Deprecated in Java")
  public override fun onRequestPermissionsResult(
      requestCode: Int,
      permissions: Array<String>,
      grantResults: IntArray,
  ) {
    @Suppress("DEPRECATION")
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    permissionListener?.let {
      if (it.onRequestPermissionsResult(requestCode, permissions, grantResults)) {
        permissionListener = null
      }
    }
  }

  override fun checkPermission(permission: String, pid: Int, uid: Int): Int =
      activity?.checkPermission(permission, pid, uid) ?: 0

  override fun checkSelfPermission(permission: String): Int =
      activity?.checkSelfPermission(permission) ?: 0

  @Suppress("DEPRECATION")
  override fun requestPermissions(
      permissions: Array<String>,
      requestCode: Int,
      listener: PermissionListener?,
  ) {
    permissionListener = listener
    requestPermissions(permissions, requestCode)
  }

  /** Builder class to help instantiate a ReactFragment. */
  public class Builder {
    public var componentName: String? = null
    public var launchOptions: Bundle? = null
    public var fabricEnabled: Boolean = false

    /**
     * Set the Component name for our React Native instance.
     *
     * @param componentName The name of the component
     * @return Builder
     */
    public fun setComponentName(componentName: String): Builder {
      this.componentName = componentName
      return this
    }

    /**
     * Set the Launch Options for our React Native instance.
     *
     * @param launchOptions launchOptions
     * @return Builder
     */
    public fun setLaunchOptions(launchOptions: Bundle): Builder {
      this.launchOptions = launchOptions
      return this
    }

    public fun build(): ReactFragment = newInstance(componentName, launchOptions, fabricEnabled)

    @Deprecated(
        "You should not change call ReactFragment.setFabricEnabled. Instead enable the NewArchitecture for the whole application with newArchEnabled=true in your gradle.properties file"
    )
    public fun setFabricEnabled(fabricEnabled: Boolean): Builder {
      this.fabricEnabled = fabricEnabled
      return this
    }
  }

  public companion object {
    protected const val ARG_COMPONENT_NAME: String = "arg_component_name"
    protected const val ARG_LAUNCH_OPTIONS: String = "arg_launch_options"
    protected const val ARG_FABRIC_ENABLED: String = "arg_fabric_enabled"

    @Deprecated(
        "We will remove this and use a different solution for handling Fragment lifecycle events."
    )
    protected const val ARG_DISABLE_HOST_LIFECYCLE_EVENTS: String =
        "arg_disable_host_lifecycle_events"

    /**
     * @param componentName The name of the react native component
     * @param launchOptions The launch options for the react native component
     * @param fabricEnabled Flag to enable Fabric for ReactFragment
     * @return A new instance of fragment ReactFragment.
     */
    private fun newInstance(
        componentName: String?,
        launchOptions: Bundle?,
        fabricEnabled: Boolean,
    ): ReactFragment {
      val args =
          Bundle().apply {
            putString(ARG_COMPONENT_NAME, componentName)
            putBundle(ARG_LAUNCH_OPTIONS, launchOptions)
            putBoolean(ARG_FABRIC_ENABLED, fabricEnabled)
          }
      return ReactFragment().apply { setArguments(args) }
    }
  }
}
