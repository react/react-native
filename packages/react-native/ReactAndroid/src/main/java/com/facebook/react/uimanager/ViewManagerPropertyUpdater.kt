/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ViewManagersPropertyCache.PropSetter
import java.util.HashMap

@Suppress("DEPRECATION")
public object ViewManagerPropertyUpdater {
  public fun interface Settable {
    public fun getProperties(props: MutableMap<String, String>)
  }

  @Suppress("FINITE_BOUNDS_VIOLATION_IN_JAVA")
  public interface ViewManagerSetter<T : ViewManager<V, *>, V : View> : Settable {
    public fun setProperty(manager: T, view: V, name: String, value: Any?)
  }

  @Suppress("FINITE_BOUNDS_VIOLATION_IN_JAVA")
  public interface ShadowNodeSetter<@Suppress("DEPRECATION") in T : ReactShadowNode<*>> : Settable {
    public fun setProperty(node: T, name: String, value: Any?)
  }

  private const val TAG = "ViewManagerPropertyUpdater"

  private val VIEW_MANAGER_SETTER_MAP: MutableMap<Class<*>, ViewManagerSetter<*, *>> = HashMap()
  private val SHADOW_NODE_SETTER_MAP: MutableMap<Class<*>, ShadowNodeSetter<*>> = HashMap()

  @JvmStatic
  public fun clear() {
    ViewManagersPropertyCache.clear()
    VIEW_MANAGER_SETTER_MAP.clear()
    SHADOW_NODE_SETTER_MAP.clear()
  }

  @JvmStatic
  @Deprecated("Use ViewManager#updateProperties to update a view's properties")
  public fun <T : ViewManagerDelegate<V>, V : View> updateProps(
      delegate: T,
      view: V,
      props: ReactStylesDiffMap,
  ) {
    val iterator = props.backingMap.entryIterator
    while (iterator.hasNext()) {
      val entry = iterator.next()
      delegate.setProperty(view, entry.key, entry.value)
    }
  }

  @JvmStatic
  @Deprecated("Use ViewManager#updateProperties to update a view's properties")
  public fun <V : View> updateProps(
      manager: ViewManager<V, *>,
      view: V,
      props: ReactStylesDiffMap,
  ) {
    val setter = findManagerSetter(manager.javaClass)
    val iterator = props.backingMap.entryIterator
    while (iterator.hasNext()) {
      val entry = iterator.next()
      setter.setProperty(manager, view, entry.key, entry.value)
    }
  }

  @JvmStatic
  @Deprecated("Use ViewManager#updateProperties to update a view's properties")
  public fun <@Suppress("DEPRECATION") T : ReactShadowNode<T>> updateProps(
      node: T,
      props: ReactStylesDiffMap,
  ) {
    val setter = findNodeSetter(node.javaClass)
    val iterator = props.backingMap.entryIterator
    while (iterator.hasNext()) {
      val entry = iterator.next()
      setter.setProperty(node, entry.key, entry.value)
    }
  }

  @JvmStatic
  public fun getNativeProps(
      viewManagerTopClass: Class<out ViewManager<Nothing, *>>,
      shadowNodeTopClass: Class<out Nothing>?,
  ): Map<String, String> {
    val props: MutableMap<String, String> = HashMap()
    findManagerSetter(viewManagerTopClass).getProperties(props)
    if (shadowNodeTopClass != null) {
      findNodeSetter(shadowNodeTopClass).getProperties(props)
    }
    return props
  }

  private fun <V : View> findManagerSetter(
      managerClass: Class<out ViewManager<V, *>>,
  ): ViewManagerSetter<ViewManager<V, *>, V> {
    var setter = VIEW_MANAGER_SETTER_MAP[managerClass]
    if (setter == null) {
      setter = findGeneratedSetter(managerClass)
      if (setter == null) {
        setter = FallbackViewManagerSetter(managerClass)
      }
      VIEW_MANAGER_SETTER_MAP[managerClass] = setter
    }
    @Suppress("UNCHECKED_CAST")
    return setter as ViewManagerSetter<ViewManager<V, *>, V>
  }

  private fun <@Suppress("DEPRECATION") T : ReactShadowNode<T>> findNodeSetter(
      nodeClass: Class<out T>,
  ): ShadowNodeSetter<T> {
    var setter = SHADOW_NODE_SETTER_MAP[nodeClass]
    if (setter == null) {
      setter = findGeneratedSetter(nodeClass)
      if (setter == null) {
        @Suppress("UNCHECKED_CAST")
        setter = FallbackShadowNodeSetter(nodeClass as Class<Nothing>)
      }
      SHADOW_NODE_SETTER_MAP[nodeClass] = setter
    }
    @Suppress("UNCHECKED_CAST")
    return setter as ShadowNodeSetter<T>
  }

  private fun <T> findGeneratedSetter(cls: Class<*>): T? {
    val clsName = cls.name
    try {
      val setterClass = Class.forName("$clsName$\$PropsSetter")
      @Suppress("DEPRECATION", "UNCHECKED_CAST")
      return setterClass.newInstance() as T
    } catch (e: ClassNotFoundException) {
      FLog.w(TAG, "Could not find generated setter for $cls")
      return null
    } catch (e: InstantiationException) {
      throw RuntimeException("Unable to instantiate methods getter for $clsName", e)
    } catch (e: IllegalAccessException) {
      throw RuntimeException("Unable to instantiate methods getter for $clsName", e)
    }
  }

  private class FallbackViewManagerSetter<V : View>(
      viewManagerClass: Class<out ViewManager<V, *>>,
  ) : ViewManagerSetter<ViewManager<V, *>, V> {
    private val propSetters: Map<String, PropSetter> =
        ViewManagersPropertyCache.getNativePropSettersForViewManagerClass(viewManagerClass)

    override fun setProperty(manager: ViewManager<V, *>, view: V, name: String, value: Any?) {
      val setter = propSetters[name]
      setter?.updateViewProp(manager, view, value)
    }

    override fun getProperties(props: MutableMap<String, String>) {
      for (setter in propSetters.values) {
        props[setter.propName] = setter.propType
      }
    }
  }

  private class FallbackShadowNodeSetter(shadowNodeClass: Class<out Nothing>) :
      ShadowNodeSetter<ReactShadowNode<*>> {
    private val propSetters: Map<String, PropSetter> =
        ViewManagersPropertyCache.getNativePropSettersForShadowNodeClass(shadowNodeClass)

    override fun setProperty(node: ReactShadowNode<*>, name: String, value: Any?) {
      val setter = propSetters[name]
      setter?.updateShadowNodeProp(node, value)
    }

    override fun getProperties(props: MutableMap<String, String>) {
      for (setter in propSetters.values) {
        props[setter.propName] = setter.propType
      }
    }
  }

  internal class GenericViewManagerDelegate<T : View>(private val manager: ViewManager<T, *>) :
      ViewManagerDelegate<T> {
    private val setter = findManagerSetter(manager.javaClass)

    @Suppress("ACCIDENTAL_OVERRIDE")
    override fun setProperty(view: T, propName: String, value: Any?) {
      setter.setProperty(manager, view, propName, value)
    }

    @Suppress("ACCIDENTAL_OVERRIDE")
    override fun receiveCommand(view: T, commandName: String, args: ReadableArray) = Unit
  }
}
