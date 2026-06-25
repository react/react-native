/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.Context
import android.view.View
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import java.lang.reflect.Method

/**
 * This class is responsible for holding view manager property setters and is used in a process of
 * updating views with the new properties set in JS.
 */
@Suppress("DEPRECATION") // ReactShadowNode is @Deprecated but still required by this cache.
internal object ViewManagersPropertyCache {

  private val CLASS_PROPS_CACHE: MutableMap<Class<*>, Map<String, PropSetter>> = HashMap()
  private val EMPTY_PROPS_MAP: MutableMap<String, PropSetter> = HashMap()

  @JvmStatic
  fun clear() {
    CLASS_PROPS_CACHE.clear()
    EMPTY_PROPS_MAP.clear()
  }

  internal abstract class PropSetter {

    val propName: String
    val propType: String
    protected val setter: Method
    protected val index: Int? // non-null only for group setters

    protected constructor(prop: ReactProp, defaultType: String, setter: Method) {
      propName = prop.name
      propType = if (ReactProp.USE_DEFAULT_TYPE == prop.customType) defaultType else prop.customType
      this.setter = setter
      this.index = null
    }

    protected constructor(prop: ReactPropGroup, defaultType: String, setter: Method, index: Int) {
      propName = prop.names[index]
      propType =
          if (ReactPropGroup.USE_DEFAULT_TYPE == prop.customType) defaultType else prop.customType
      this.setter = setter
      this.index = index
    }

    fun updateViewProp(viewManager: ViewManager<*, *>, viewToUpdate: View, value: Any?) {
      try {
        val resolved = getValueOrDefault(value, viewToUpdate.context)
        if (index == null) {
          setter.invoke(viewManager, viewToUpdate, resolved)
        } else {
          setter.invoke(viewManager, viewToUpdate, index, resolved)
        }
      } catch (t: Throwable) {
        FLog.e(ViewManager::class.java, "Error while updating prop $propName", t)
        throw JSApplicationIllegalArgumentException(
            "Error while updating property '$propName' of a view managed by: ${viewManager.name}",
            t,
        )
      }
    }

    fun updateShadowNodeProp(nodeToUpdate: ReactShadowNode<*>, value: Any?) {
      try {
        val resolved = getValueOrDefault(value, nodeToUpdate.getThemedContext())
        if (index == null) {
          setter.invoke(nodeToUpdate, resolved)
        } else {
          setter.invoke(nodeToUpdate, index, resolved)
        }
      } catch (t: Throwable) {
        FLog.e(ViewManager::class.java, "Error while updating prop $propName", t)
        throw JSApplicationIllegalArgumentException(
            "Error while updating property '$propName' in shadow node of type: ${nodeToUpdate.getViewClass()}",
            t,
        )
      }
    }

    protected abstract fun getValueOrDefault(value: Any?, context: Context): Any?
  }

  private class DynamicPropSetter : PropSetter {

    constructor(prop: ReactProp, setter: Method) : super(prop, "mixed", setter)

    constructor(
        prop: ReactPropGroup,
        setter: Method,
        index: Int,
    ) : super(prop, "mixed", setter, index)

    override fun getValueOrDefault(value: Any?, context: Context): Any =
        if (value is Dynamic) value else DynamicFromObject(value)
  }

  private class IntPropSetter : PropSetter {

    private val defaultValue: Int

    constructor(
        prop: ReactProp,
        setter: Method,
        defaultValue: Int,
    ) : super(prop, "number", setter) {
      this.defaultValue = defaultValue
    }

    constructor(
        prop: ReactPropGroup,
        setter: Method,
        index: Int,
        defaultValue: Int,
    ) : super(prop, "number", setter, index) {
      this.defaultValue = defaultValue
    }

    override fun getValueOrDefault(value: Any?, context: Context): Any {
      // All numbers from JS are Doubles which can't be simply cast to Integer
      return if (value == null) defaultValue else (value as Double).toInt()
    }
  }

  private class DoublePropSetter : PropSetter {

    private val defaultValue: Double

    constructor(
        prop: ReactProp,
        setter: Method,
        defaultValue: Double,
    ) : super(prop, "number", setter) {
      this.defaultValue = defaultValue
    }

    constructor(
        prop: ReactPropGroup,
        setter: Method,
        index: Int,
        defaultValue: Double,
    ) : super(prop, "number", setter, index) {
      this.defaultValue = defaultValue
    }

    override fun getValueOrDefault(value: Any?, context: Context): Any =
        if (value == null) defaultValue else value as Double
  }

  private class ColorPropSetter : PropSetter {

    private val defaultValue: Int

    constructor(prop: ReactProp, setter: Method) : this(prop, setter, 0)

    constructor(
        prop: ReactProp,
        setter: Method,
        defaultValue: Int,
    ) : super(prop, "mixed", setter) {
      this.defaultValue = defaultValue
    }

    constructor(
        prop: ReactPropGroup,
        setter: Method,
        index: Int,
        defaultValue: Int,
    ) : super(prop, "mixed", setter, index) {
      this.defaultValue = defaultValue
    }

    override fun getValueOrDefault(value: Any?, context: Context): Any? {
      if (value == null) {
        return defaultValue
      }
      return ColorPropConverter.getColor(value, context)
    }
  }

  private class BooleanPropSetter(
      prop: ReactProp,
      setter: Method,
      private val defaultValue: Boolean,
  ) : PropSetter(prop, "boolean", setter) {

    override fun getValueOrDefault(value: Any?, context: Context): Any {
      val v = if (value == null) defaultValue else value as Boolean
      return if (v) java.lang.Boolean.TRUE else java.lang.Boolean.FALSE
    }
  }

  private class FloatPropSetter : PropSetter {

    private val defaultValue: Float

    constructor(
        prop: ReactProp,
        setter: Method,
        defaultValue: Float,
    ) : super(prop, "number", setter) {
      this.defaultValue = defaultValue
    }

    constructor(
        prop: ReactPropGroup,
        setter: Method,
        index: Int,
        defaultValue: Float,
    ) : super(prop, "number", setter, index) {
      this.defaultValue = defaultValue
    }

    override fun getValueOrDefault(value: Any?, context: Context): Any {
      // All numbers from JS are Doubles which can't be simply cast to Float
      return if (value == null) defaultValue else (value as Double).toFloat()
    }
  }

  private class ArrayPropSetter(prop: ReactProp, setter: Method) :
      PropSetter(prop, "Array", setter) {

    override fun getValueOrDefault(value: Any?, context: Context): Any? = value as ReadableArray?
  }

  private class MapPropSetter(prop: ReactProp, setter: Method) : PropSetter(prop, "Map", setter) {

    override fun getValueOrDefault(value: Any?, context: Context): Any? = value as ReadableMap?
  }

  private class StringPropSetter(prop: ReactProp, setter: Method) :
      PropSetter(prop, "String", setter) {

    override fun getValueOrDefault(value: Any?, context: Context): Any? = value as String?
  }

  private class BoxedBooleanPropSetter(prop: ReactProp, setter: Method) :
      PropSetter(prop, "boolean", setter) {

    override fun getValueOrDefault(value: Any?, context: Context): Any? {
      if (value != null) {
        return if (value as Boolean) java.lang.Boolean.TRUE else java.lang.Boolean.FALSE
      }
      return null
    }
  }

  private class BoxedIntPropSetter : PropSetter {

    constructor(prop: ReactProp, setter: Method) : super(prop, "number", setter)

    constructor(
        prop: ReactPropGroup,
        setter: Method,
        index: Int,
    ) : super(prop, "number", setter, index)

    override fun getValueOrDefault(value: Any?, context: Context): Any? {
      if (value != null) {
        return if (value is Double) value.toInt() else value as Int
      }
      return null
    }
  }

  private class BoxedColorPropSetter : PropSetter {

    constructor(prop: ReactProp, setter: Method) : super(prop, "mixed", setter)

    constructor(
        prop: ReactPropGroup,
        setter: Method,
        index: Int,
    ) : super(prop, "mixed", setter, index)

    override fun getValueOrDefault(value: Any?, context: Context): Any? {
      if (value != null) {
        return ColorPropConverter.getColor(value, context)
      }
      return null
    }
  }

  @JvmStatic
  internal fun getNativePropsForView(
      viewManagerTopClass: Class<out ViewManager<*, *>>,
      shadowNodeTopClass: Class<out ReactShadowNode<*>>,
  ): Map<String, String> {
    val nativeProps: MutableMap<String, String> = HashMap()

    val viewManagerProps = getNativePropSettersForViewManagerClass(viewManagerTopClass)
    for (setter in viewManagerProps.values) {
      nativeProps[setter.propName] = setter.propType
    }

    val shadowNodeProps = getNativePropSettersForShadowNodeClass(shadowNodeTopClass)
    for (setter in shadowNodeProps.values) {
      nativeProps[setter.propName] = setter.propType
    }

    return nativeProps
  }

  /**
   * Returns map from property name to setter instances for all the property setters annotated with
   * [ReactProp] in the given [ViewManager] class plus all the setter declared by its parent
   * classes.
   */
  @JvmStatic
  internal fun getNativePropSettersForViewManagerClass(
      cls: Class<out ViewManager<*, *>>
  ): Map<String, PropSetter> {
    if (cls == ViewManager::class.java) {
      return EMPTY_PROPS_MAP
    }
    CLASS_PROPS_CACHE[cls]?.let {
      return it
    }
    // This is to include all the setters from parent classes. Once calculated the result will be
    // stored in CLASS_PROPS_CACHE so that we only scan for @ReactProp annotations once per class.
    @Suppress("UNCHECKED_CAST")
    val props: MutableMap<String, PropSetter> =
        HashMap(
            getNativePropSettersForViewManagerClass(cls.superclass as Class<out ViewManager<*, *>>)
        )
    extractPropSettersFromViewManagerClassDefinition(cls, props)
    CLASS_PROPS_CACHE[cls] = props
    return props
  }

  /**
   * Returns map from property name to setter instances for all the property setters annotated with
   * [ReactProp] (or [ReactPropGroup] in the given [ReactShadowNode] subclass plus all the setters
   * declared by its parent classes up to [ReactShadowNode] which is treated as a base class.
   */
  @JvmStatic
  internal fun getNativePropSettersForShadowNodeClass(
      cls: Class<out ReactShadowNode<*>>
  ): Map<String, PropSetter> {
    for (iface in cls.interfaces) {
      if (iface == ReactShadowNode::class.java) {
        return EMPTY_PROPS_MAP
      }
    }
    CLASS_PROPS_CACHE[cls]?.let {
      return it
    }
    // Recurse up to (but not past) the ReactShadowNode interface. If we run out of class
    // hierarchy (superclass is null), there are no parent setters to inherit.
    @Suppress("UNCHECKED_CAST") val superclass = cls.superclass as? Class<out ReactShadowNode<*>>
    val parentProps =
        if (superclass != null) getNativePropSettersForShadowNodeClass(superclass)
        else EMPTY_PROPS_MAP
    val props: MutableMap<String, PropSetter> = HashMap(parentProps)
    extractPropSettersFromShadowNodeClassDefinition(cls, props)
    CLASS_PROPS_CACHE[cls] = props
    return props
  }

  private fun createPropSetter(
      annotation: ReactProp,
      method: Method,
      propTypeClass: Class<*>,
  ): PropSetter =
      when (propTypeClass) {
        Dynamic::class.java -> DynamicPropSetter(annotation, method)
        Boolean::class.javaPrimitiveType ->
            BooleanPropSetter(annotation, method, annotation.defaultBoolean)
        Int::class.javaPrimitiveType ->
            if ("Color" == annotation.customType) {
              ColorPropSetter(annotation, method, annotation.defaultInt)
            } else {
              IntPropSetter(annotation, method, annotation.defaultInt)
            }
        Float::class.javaPrimitiveType ->
            FloatPropSetter(annotation, method, annotation.defaultFloat)
        Double::class.javaPrimitiveType ->
            DoublePropSetter(annotation, method, annotation.defaultDouble)
        String::class.java -> StringPropSetter(annotation, method)
        java.lang.Boolean::class.java -> BoxedBooleanPropSetter(annotation, method)
        java.lang.Integer::class.java ->
            if ("Color" == annotation.customType) {
              BoxedColorPropSetter(annotation, method)
            } else {
              BoxedIntPropSetter(annotation, method)
            }
        ReadableArray::class.java -> ArrayPropSetter(annotation, method)
        ReadableMap::class.java -> MapPropSetter(annotation, method)
        else ->
            throw RuntimeException(
                "Unrecognized type: $propTypeClass for method: ${method.declaringClass.name}#${method.name}"
            )
      }

  private fun createPropSetters(
      annotation: ReactPropGroup,
      method: Method,
      propTypeClass: Class<*>,
      props: MutableMap<String, PropSetter>,
  ) {
    val names = annotation.names
    when (propTypeClass) {
      Dynamic::class.java ->
          for (i in names.indices) {
            props[names[i]] = DynamicPropSetter(annotation, method, i)
          }
      Int::class.javaPrimitiveType ->
          for (i in names.indices) {
            props[names[i]] =
                if ("Color" == annotation.customType) {
                  ColorPropSetter(annotation, method, i, annotation.defaultInt)
                } else {
                  IntPropSetter(annotation, method, i, annotation.defaultInt)
                }
          }
      Float::class.javaPrimitiveType ->
          for (i in names.indices) {
            props[names[i]] = FloatPropSetter(annotation, method, i, annotation.defaultFloat)
          }
      Double::class.javaPrimitiveType ->
          for (i in names.indices) {
            props[names[i]] = DoublePropSetter(annotation, method, i, annotation.defaultDouble)
          }
      java.lang.Integer::class.java ->
          for (i in names.indices) {
            props[names[i]] =
                if ("Color" == annotation.customType) {
                  BoxedColorPropSetter(annotation, method, i)
                } else {
                  BoxedIntPropSetter(annotation, method, i)
                }
          }
      else ->
          throw RuntimeException(
              "Unrecognized type: $propTypeClass for method: ${method.declaringClass.name}#${method.name}"
          )
    }
  }

  private fun extractPropSettersFromViewManagerClassDefinition(
      cls: Class<out ViewManager<*, *>>,
      props: MutableMap<String, PropSetter>,
  ) {
    for (method in cls.declaredMethods) {
      val annotation = method.getAnnotation(ReactProp::class.java)
      if (annotation != null) {
        val paramTypes = method.parameterTypes
        if (paramTypes.size != 2) {
          throw RuntimeException("Wrong number of args for prop setter: ${cls.name}#${method.name}")
        }
        if (!View::class.java.isAssignableFrom(paramTypes[0])) {
          throw RuntimeException(
              "First param should be a view subclass to be updated: ${cls.name}#${method.name}"
          )
        }
        props[annotation.name] = createPropSetter(annotation, method, paramTypes[1])
      }

      val groupAnnotation = method.getAnnotation(ReactPropGroup::class.java)
      if (groupAnnotation != null) {
        val paramTypes = method.parameterTypes
        if (paramTypes.size != 3) {
          throw RuntimeException(
              "Wrong number of args for group prop setter: ${cls.name}#${method.name}"
          )
        }
        if (!View::class.java.isAssignableFrom(paramTypes[0])) {
          throw RuntimeException(
              "First param should be a view subclass to be updated: ${cls.name}#${method.name}"
          )
        }
        if (paramTypes[1] != Int::class.javaPrimitiveType) {
          throw RuntimeException(
              "Second argument should be property index: ${cls.name}#${method.name}"
          )
        }
        createPropSetters(groupAnnotation, method, paramTypes[2], props)
      }
    }
  }

  private fun extractPropSettersFromShadowNodeClassDefinition(
      cls: Class<out ReactShadowNode<*>>,
      props: MutableMap<String, PropSetter>,
  ) {
    for (method in cls.declaredMethods) {
      val annotation = method.getAnnotation(ReactProp::class.java)
      if (annotation != null) {
        val paramTypes = method.parameterTypes
        if (paramTypes.size != 1) {
          throw RuntimeException("Wrong number of args for prop setter: ${cls.name}#${method.name}")
        }
        props[annotation.name] = createPropSetter(annotation, method, paramTypes[0])
      }

      val groupAnnotation = method.getAnnotation(ReactPropGroup::class.java)
      if (groupAnnotation != null) {
        val paramTypes = method.parameterTypes
        if (paramTypes.size != 2) {
          throw RuntimeException(
              "Wrong number of args for group prop setter: ${cls.name}#${method.name}"
          )
        }
        if (paramTypes[0] != Int::class.javaPrimitiveType) {
          throw RuntimeException(
              "Second argument should be property index: ${cls.name}#${method.name}"
          )
        }
        createPropSetters(groupAnnotation, method, paramTypes[1], props)
      }
    }
  }
}
