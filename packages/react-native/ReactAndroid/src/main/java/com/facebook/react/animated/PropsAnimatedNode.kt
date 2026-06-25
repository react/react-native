/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import android.view.View
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UIManager

/**
 * Animated node that represents view properties. There is a special handling logic implemented for
 * the nodes of this type in [NativeAnimatedNodesManager] that is responsible for extracting a map
 * of updated properties, which can be then passed down to the view.
 */
internal class PropsAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager,
) : AnimatedNode() {
  private var connectedViewTag = -1
  private val propNodeMapping: MutableMap<String, Int>
  private val propMap = JavaOnlyMap()
  private var connectedViewUIManager: UIManager? = null

  val connectedView: View?
    // resolveView throws an [IllegalViewOperationException] when the view doesn't exist
    // (this can happen if the surface is being deallocated).
    get() = runCatching { connectedViewUIManager?.resolveView(connectedViewTag) }.getOrNull()

  init {
    val props = config.getMap("props")
    val iter = props?.keySetIterator()
    propNodeMapping = mutableMapOf()
    while (iter != null && iter.hasNextKey()) {
      val propKey = iter.nextKey()
      val nodeIndex = props.getInt(propKey)
      propNodeMapping[propKey] = nodeIndex
    }
  }

  fun connectToView(viewTag: Int, uiManager: UIManager?) {
    if (connectedViewTag != -1) {
      throw JSApplicationIllegalArgumentException(
          "Animated node $tag is already attached to a view: $connectedViewTag"
      )
    }
    connectedViewTag = viewTag
    connectedViewUIManager = uiManager
  }

  fun disconnectFromView(viewTag: Int) {
    if (connectedViewTag != viewTag && connectedViewTag != -1) {
      throw JSApplicationIllegalArgumentException(
          "Attempting to disconnect view that has " +
              "not been connected with the given animated node: $viewTag " +
              "but is connected to view $connectedViewTag"
      )
    }
    connectedViewTag = -1
  }

  fun restoreDefaultValues() {
    // In Fabric, we don't restore default values since the FabricUIManager doesn't have access
    // to the ShadowNode layer. This method was only relevant for the legacy Paper renderer.
  }

  fun updateView() {
    if (connectedViewTag == -1) {
      return
    }
    for ((key, value) in propNodeMapping) {
      val node = nativeAnimatedNodesManager.getNodeById(value)
      // The mapped node can be dropped mid-teardown (e.g. component unmounts during
      // navigation) while this prop update is still in flight. Skip it instead of
      // throwing, mirroring the connectedViewTag == -1 guard.
      if (node == null) {
        continue
      }
      if (node is StyleAnimatedNode) {
        node.collectViewUpdates(propMap)
      } else if (node is ValueAnimatedNode) {
        val animatedObject = node.getAnimatedObject()
        if (animatedObject is Int) {
          propMap.putInt(key, animatedObject)
        } else if (animatedObject is String) {
          propMap.putString(key, animatedObject)
        } else {
          propMap.putDouble(key, node.getValue())
        }
      } else if (node is ColorAnimatedNode) {
        propMap.putInt(key, node.color)
      } else if (node is ObjectAnimatedNode) {
        node.collectViewUpdates(key, propMap)
      } else {
        throw IllegalArgumentException(
            "Unsupported type of node used in property node ${node.javaClass}"
        )
      }
    }
    connectedViewUIManager?.synchronouslyUpdateViewOnUIThread(connectedViewTag, propMap)
  }

  override fun prettyPrint(): String =
      "PropsAnimatedNode[$tag] connectedViewTag: $connectedViewTag " +
          "propNodeMapping: $propNodeMapping propMap: $propMap"
}
