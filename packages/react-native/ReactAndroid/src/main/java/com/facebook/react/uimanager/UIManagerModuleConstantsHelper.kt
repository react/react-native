/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import androidx.annotation.VisibleForTesting
import com.facebook.common.logging.FLog
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags.useFabricInterop
import java.util.Locale

/**
 * Helps generate constants map for [UIManagerModule] by collecting and merging constants from
 * registered view managers.
 */
internal object UIManagerModuleConstantsHelper {
  private const val TAG = "UIManagerModuleConstantsHelper"
  private const val BUBBLING_EVENTS_KEY = "bubblingEventTypes"
  private const val DIRECT_EVENTS_KEY = "directEventTypes"

  /**
   * Generates a lazy discovery enabled version of [UIManagerModule] constants. It only contains a
   * list of view manager names, so that JS side is aware of the managers there are. Actual
   * ViewManager instantiation happens when `UIManager.getViewManagerConfig('SpecificViewManager')`
   * call happens. The View Manager is then registered on the JS side with the help of
   * `UIManagerModule.getConstantsForViewManager`.
   */
  @JvmStatic
  @JvmName("internal_createConstants")
  internal fun createConstants(resolver: ViewManagerResolver): Map<String, Any> =
      UIManagerModuleConstants.constants.plus(
          mapOf(
              "ViewManagerNames" to ArrayList<String?>(resolver.getViewManagerNames()),
              "LazyViewManagersEnabled" to true,
          )
      )

  @JvmStatic
  val defaultExportableEventTypes: Map<String, Any>
    get() =
        mapOf(
            BUBBLING_EVENTS_KEY to UIManagerModuleConstants.bubblingEventTypeConstants,
            DIRECT_EVENTS_KEY to UIManagerModuleConstants.directEventTypeConstants,
        )

  private fun validateDirectEventNames(
      viewManagerName: String,
      directEvents: MutableMap<String, Any>?,
  ) {
    if (!ReactBuildConfig.DEBUG || directEvents == null) {
      return
    }

    for ((key, value) in directEvents) {
      if (value is MutableMap<*, *>) {
        val regName = value["registrationName"] as String?
        if (
            regName != null &&
                key.startsWith("top") &&
                regName.startsWith("on") &&
                (key.substring(3) != regName.substring(2))
        ) {
          FLog.e(
              TAG,
              "Direct event name for '$viewManagerName' doesn't correspond to the naming convention," +
                  " expected 'topEventName'->'onEventName', got '$key'->'$regName'",
          )
        }
      }
    }
  }

  /**
   * Generates map of constants that is then exposed by [UIManagerModule]. Provided list of {@param
   * viewManagers} is then used to populate content of those predefined fields using
   * [ViewManager.getExportedCustomBubblingEventTypeConstants] and
   * [ViewManager.getExportedCustomDirectEventTypeConstants] respectively. Each view manager is in
   * addition allowed to expose viewmanager-specific constants that are placed under the key that
   * corresponds to the view manager's name (see [ViewManager.getName]). Constants are merged into
   * the map of [UIManagerModule] base constants that is stored in [UIManagerModuleConstants].
   *
   * TODO(6845124): Create a test for this
   */
  @JvmStatic
  @JvmName("internal_createConstants")
  internal fun createConstants(
      viewManagers: List<ViewManager<in Nothing, in Nothing>>,
      allBubblingEventTypes: MutableMap<String, Any>?,
      allDirectEventTypes: MutableMap<String, Any>?,
  ): MutableMap<String, Any> {
    val constants: MutableMap<String, Any> = UIManagerModuleConstants.constants.toMutableMap()

    // Generic/default event types:
    // All view managers are capable of dispatching these events.
    // They will be automatically registered with React Fiber.
    val genericBubblingEventTypes: Map<String, Any> =
        UIManagerModuleConstants.bubblingEventTypeConstants
    val genericDirectEventTypes: Map<String, Any> =
        UIManagerModuleConstants.directEventTypeConstants

    // Cumulative event types:
    // View manager specific event types are collected as views are loaded.
    // This information is used later when events are dispatched.
    allBubblingEventTypes?.putAll(genericBubblingEventTypes)
    allDirectEventTypes?.putAll(genericDirectEventTypes)

    for (viewManager in viewManagers) {
      val viewManagerName = viewManager.getName()

      val viewManagerConstants: MutableMap<*, *> =
          createConstantsForViewManager(
              viewManager,
              null,
              null,
              allBubblingEventTypes,
              allDirectEventTypes,
          )
      if (!viewManagerConstants.isEmpty()) {
        constants[viewManagerName] = viewManagerConstants
      }
    }

    constants["genericBubblingEventTypes"] = genericBubblingEventTypes
    constants["genericDirectEventTypes"] = genericDirectEventTypes
    return constants
  }

  @JvmStatic
  @JvmName("internal_createConstantsForViewManager")
  internal fun createConstantsForViewManager(
      viewManager: ViewManager<in Nothing, in Nothing>,
      defaultBubblingEvents: MutableMap<String, Any>?,
      defaultDirectEvents: MutableMap<String, Any>?,
      cumulativeBubblingEventTypes: MutableMap<String, Any>?,
      cumulativeDirectEventTypes: MutableMap<String, Any>?,
  ): MutableMap<String, Any> {
    val viewManagerConstants: MutableMap<String, Any> = mutableMapOf()

    var viewManagerBubblingEvents: MutableMap<String, Any>? =
        viewManager.exportedCustomBubblingEventTypeConstants
    if (viewManagerBubblingEvents != null) {
      if (!ReactBuildConfig.UNSTABLE_REMOVE_LEGACY_COMPONENT_INTEROP && useFabricInterop()) {
        // For Fabric, events needs to be fired with a "top" prefix.
        // For the sake of Fabric Interop, here we normalize events adding "top" in their
        // name if the user hasn't provided it.
        viewManagerBubblingEvents = normalizeEventTypes(viewManagerBubblingEvents)
      }
      recursiveMerge(cumulativeBubblingEventTypes, viewManagerBubblingEvents)
      recursiveMerge(viewManagerBubblingEvents, defaultBubblingEvents)
      viewManagerConstants.put(BUBBLING_EVENTS_KEY, viewManagerBubblingEvents)
    } else if (defaultBubblingEvents != null) {
      viewManagerConstants.put(BUBBLING_EVENTS_KEY, defaultBubblingEvents)
    }

    var viewManagerDirectEvents: MutableMap<String, Any>? =
        viewManager.exportedCustomDirectEventTypeConstants
    validateDirectEventNames(viewManager.getName(), viewManagerDirectEvents)
    if (viewManagerDirectEvents != null) {
      if (!ReactBuildConfig.UNSTABLE_REMOVE_LEGACY_COMPONENT_INTEROP && useFabricInterop()) {
        // For Fabric, events needs to be fired with a "top" prefix.
        // For the sake of Fabric Interop, here we normalize events adding "top" in their
        // name if the user hasn't provided it.
        viewManagerDirectEvents = normalizeEventTypes(viewManagerDirectEvents)
      }
      recursiveMerge(cumulativeDirectEventTypes, viewManagerDirectEvents)
      recursiveMerge(viewManagerDirectEvents, defaultDirectEvents)
      viewManagerConstants.put(DIRECT_EVENTS_KEY, viewManagerDirectEvents)
    } else if (defaultDirectEvents != null) {
      viewManagerConstants.put(DIRECT_EVENTS_KEY, defaultDirectEvents)
    }

    val customViewConstants: MutableMap<String, Any>? = viewManager.exportedViewConstants
    if (customViewConstants != null) {
      viewManagerConstants.put("Constants", customViewConstants)
    }
    val viewManagerCommands: MutableMap<String, Int>? = viewManager.commandsMap
    if (viewManagerCommands != null) {
      viewManagerConstants.put("Commands", viewManagerCommands)
    }
    val viewManagerNativeProps = viewManager.nativeProps
    if (!viewManagerNativeProps.isEmpty()) {
      viewManagerConstants.put("NativeProps", viewManagerNativeProps)
    }

    return viewManagerConstants
  }

  @VisibleForTesting
  internal fun normalizeEventTypes(
      eventsToNormalize: MutableMap<String, Any>
  ): MutableMap<String, Any> {
    var events = eventsToNormalize
    val keysToNormalize: MutableSet<String> = hashSetOf()
    for (key in events.keys) {
      val keyString = key
      if (!keyString.startsWith("top")) {
        keysToNormalize.add(keyString)
      }
    }
    // When providing one event in Kotlin, it will create a SingletonMap by default
    // which will throw on trying to add new element to it
    if (events !is HashMap<*, *>) {
      events = HashMap(events)
    }
    for (oldKey in keysToNormalize) {
      val value = checkNotNull(events[oldKey])
      val baseKey =
          if (oldKey.startsWith("on")) {
            // Drop "on" prefix.
            oldKey.substring(2)
          } else {
            // Capitalize first letter.
            oldKey.substring(0, 1).uppercase(Locale.getDefault()) + oldKey.substring(1)
          }
      val newKey = "top$baseKey"
      events.put(newKey, value)
    }
    return events
  }

  /** Merges [source] map into [dest] map recursively */
  private fun recursiveMerge(dest: MutableMap<String, Any>?, source: MutableMap<String, Any>?) {
    if (dest == null || source == null || source.isEmpty()) {
      return
    }

    for ((key, sourceValue) in source) {
      var destValue = dest[key]
      if (
          destValue != null && (sourceValue is MutableMap<*, *>) && (destValue is MutableMap<*, *>)
      ) {
        // Since event maps are client based Map interface, it could be immutable
        if (destValue !is HashMap<*, *>) {
          destValue = HashMap(destValue)
          dest.replace(key, destValue as MutableMap<*, *>)
        }
        @Suppress("UNCHECKED_CAST")
        recursiveMerge(destValue as MutableMap<String, Any>, sourceValue as MutableMap<String, Any>)
      } else {
        dest.put(key, sourceValue)
      }
    }
  }
}
