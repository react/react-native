/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

/** Utility class for Fabric components, this will be removed */
internal object FabricNameComponentMapping {
  private val componentNames: Map<String, String> =
      mapOf(
          // TODO T97384889: unify component names between JS - Android - iOS - C++
          "View" to "RCTView",
          "Image" to "RCTImageView",
          "ScrollView" to "RCTScrollView",
          "Slider" to "RCTSlider",
          "ModalHostView" to "RCTModalHostView",
          "Paragraph" to "RCTText",
          "SelectableParagraph" to "RCTSelectableText",
          "Text" to "RCTText",
          "RawText" to "RCTRawText",
          "ActivityIndicatorView" to "AndroidProgressBar",
          "ShimmeringView" to "RKShimmeringView",
          "TemplateView" to "RCTTemplateView",
          "AxialGradientView" to "RCTAxialGradientView",
          "Video" to "RCTVideo",
          "Map" to "RCTMap",
          "WebView" to "RCTWebView",
          "Keyframes" to "RCTKeyframes",
          "ImpressionTrackingView" to "RCTImpressionTrackingView",
      )

  /** @return the name of component in the Fabric environment */
  @JvmStatic
  fun getFabricComponentName(componentName: String): String {
    return componentNames[componentName] ?: componentName
  }
}
