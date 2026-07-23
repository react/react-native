/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.accessibility.AccessibilityEvent
import android.widget.ImageView
import com.facebook.react.uimanager.events.TouchEventType

/** Constants exposed to JS from [UIManagerModule]. */
internal object UIManagerModuleConstants {
  @JvmField
  val bubblingEventTypeConstants: Map<String, Any> = mapOf(
      "topChange" to
          mapOf(
              "phasedRegistrationNames" to
                  mapOf("bubbled" to "onChange", "captured" to "onChangeCapture")
          ),
      "topSelect" to
          mapOf(
              "phasedRegistrationNames" to
                  mapOf("bubbled" to "onSelect", "captured" to "onSelectCapture")
          ),
      TouchEventType.getJSEventName(TouchEventType.START) to
          mapOf(
              "phasedRegistrationNames" to
                  mapOf("bubbled" to "onTouchStart", "captured" to "onTouchStartCapture")
          ),
      TouchEventType.getJSEventName(TouchEventType.MOVE) to
          mapOf(
              "phasedRegistrationNames" to
                  mapOf("bubbled" to "onTouchMove", "captured" to "onTouchMoveCapture")
          ),
      TouchEventType.getJSEventName(TouchEventType.END) to
          mapOf(
              "phasedRegistrationNames" to
                  mapOf("bubbled" to "onTouchEnd", "captured" to "onTouchEndCapture")
          ),
      TouchEventType.getJSEventName(TouchEventType.CANCEL) to
          mapOf(
              "phasedRegistrationNames" to
                  mapOf("bubbled" to "onTouchCancel", "captured" to "onTouchCancelCapture")
          ),
  )

  @JvmField
  val directEventTypeConstants: Map<String, Any> = run {
    val rn = "registrationName"
    mapOf(
        "topContentSizeChange" to mapOf(rn to "onContentSizeChange"),
        "topLayout" to mapOf(rn to "onLayout"),
        "topLoadingError" to mapOf(rn to "onLoadingError"),
        "topLoadingFinish" to mapOf(rn to "onLoadingFinish"),
        "topLoadingStart" to mapOf(rn to "onLoadingStart"),
        "topSelectionChange" to mapOf(rn to "onSelectionChange"),
        "topMessage" to mapOf(rn to "onMessage"),

        // Scroll events are added as per task T22348735.
        // Subject for further improvement.
        "topScrollBeginDrag" to mapOf(rn to "onScrollBeginDrag"),
        "topScrollEndDrag" to mapOf(rn to "onScrollEndDrag"),
        "topScroll" to mapOf(rn to "onScroll"),
        "topMomentumScrollBegin" to mapOf(rn to "onMomentumScrollBegin"),
        "topMomentumScrollEnd" to mapOf(rn to "onMomentumScrollEnd"),
    )
  }

  @JvmField
  val constants: Map<String, Any> = mapOf(
      "UIView" to
          mapOf(
              "ContentMode" to
                  mapOf(
                      "ScaleAspectFit" to ImageView.ScaleType.FIT_CENTER.ordinal,
                      "ScaleAspectFill" to ImageView.ScaleType.CENTER_CROP.ordinal,
                      "ScaleAspectCenter" to ImageView.ScaleType.CENTER_INSIDE.ordinal,
                  )
          ),
      "StyleConstants" to
          mapOf(
              "PointerEventsValues" to
                  mapOf(
                      "none" to PointerEvents.NONE.ordinal,
                      "boxNone" to PointerEvents.BOX_NONE.ordinal,
                      "boxOnly" to PointerEvents.BOX_ONLY.ordinal,
                      "unspecified" to PointerEvents.AUTO.ordinal,
                  )
          ),
      "AccessibilityEventTypes" to
          mapOf(
              "typeWindowStateChanged" to AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED,
              "typeViewFocused" to AccessibilityEvent.TYPE_VIEW_FOCUSED,
              "typeViewClicked" to AccessibilityEvent.TYPE_VIEW_CLICKED,
          ),
  )
}
