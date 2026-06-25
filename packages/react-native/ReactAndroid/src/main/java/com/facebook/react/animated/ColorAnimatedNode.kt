/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import android.content.Context
import android.graphics.Color
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.views.view.ColorUtil.normalize

/** Animated node that represents a color. */
internal class ColorAnimatedNode(
    config: ReadableMap,
    private val nativeAnimatedNodesManager: NativeAnimatedNodesManager,
    private val reactApplicationContext: ReactApplicationContext,
) : AnimatedNode(), AnimatedNodeWithUpdateableConfig {
  private var rNodeId = 0
  private var gNodeId = 0
  private var bNodeId = 0
  private var aNodeId = 0
  private var nativeColor: ReadableMap? = null
  private var nativeColorApplied = false

  val color: Int
    get() {
      tryApplyNativeColor()
      val rNode = nativeAnimatedNodesManager.getNodeById(rNodeId) as ValueAnimatedNode?
      val gNode = nativeAnimatedNodesManager.getNodeById(gNodeId) as ValueAnimatedNode?
      val bNode = nativeAnimatedNodesManager.getNodeById(bNodeId) as ValueAnimatedNode?
      val aNode = nativeAnimatedNodesManager.getNodeById(aNodeId) as ValueAnimatedNode?
      val r = rNode?.nodeValue ?: 0.0
      val g = gNode?.nodeValue ?: 0.0
      val b = bNode?.nodeValue ?: 0.0
      val a = aNode?.nodeValue ?: 0.0
      return normalize(r, g, b, a)
    }

  private val context: Context?
    get() {
      // There are cases where the activity may not exist (such as for VRShell panel apps). In this
      // case we will search for a view associated with a PropsAnimatedNode to get the context.
      return reactApplicationContext.currentActivity ?: getContextHelper(this)
    }

  init {
    onUpdateConfig(config)
  }

  override fun onUpdateConfig(config: ReadableMap?) {
    if (config != null) {
      rNodeId = config.getInt("r")
      gNodeId = config.getInt("g")
      bNodeId = config.getInt("b")
      aNodeId = config.getInt("a")
      nativeColor = config.getMap("nativeColor")
      nativeColorApplied = false
      tryApplyNativeColor()
    } else {
      rNodeId = 0
      gNodeId = 0
      bNodeId = 0
      aNodeId = 0
      nativeColor = null
      nativeColorApplied = false
    }
  }

  override fun prettyPrint(): String =
      "ColorAnimatedNode[$tag]: r: $rNodeId  g: $gNodeId b: $bNodeId a: $aNodeId"

  private fun tryApplyNativeColor() {
    if (nativeColor == null || nativeColorApplied) {
      return
    }
    val context = context ?: return
    val color = ColorPropConverter.getColor(nativeColor, context) ?: return
    val rNode = nativeAnimatedNodesManager.getNodeById(rNodeId) as ValueAnimatedNode?
    val gNode = nativeAnimatedNodesManager.getNodeById(gNodeId) as ValueAnimatedNode?
    val bNode = nativeAnimatedNodesManager.getNodeById(bNodeId) as ValueAnimatedNode?
    val aNode = nativeAnimatedNodesManager.getNodeById(aNodeId) as ValueAnimatedNode?
    rNode?.nodeValue = Color.red(color).toDouble()
    gNode?.nodeValue = Color.green(color).toDouble()
    bNode?.nodeValue = Color.blue(color).toDouble()
    aNode?.nodeValue = Color.alpha(color) / 255.0
    nativeColorApplied = true
  }

  companion object {
    private fun getContextHelper(node: AnimatedNode): Context? {
      // Search children depth-first until we get to a PropsAnimatedNode, from which we can
      // get the view and its context
      node.children?.let { children ->
        for (child in children) {
          return if (child is PropsAnimatedNode) {
            val view = child.connectedView
            view?.context
          } else {
            getContextHelper(child)
          }
        }
      }
      return null
    }
  }
}
