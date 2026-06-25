/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.graphics.Rect
import android.os.Bundle
import android.text.Layout
import android.text.Spanned
import android.text.style.ClickableSpan
import android.view.View
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.view.accessibility.AccessibilityNodeProviderCompat
import com.facebook.react.R
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.views.text.internal.span.ReactClickableSpan

@OptIn(UnstableReactNativeAPI::class)
internal class ReactTextViewAccessibilityDelegate(
    view: View,
    originalFocus: Boolean,
    originalImportantForAccessibility: Int,
) : ReactAccessibilityDelegate(view, originalFocus, originalImportantForAccessibility) {
  private var accessibilityLinks: AccessibilityLinks? = null

  init {
    accessibilityLinks = hostView.getTag(R.id.accessibility_links) as AccessibilityLinks?
  }

  companion object {
    fun setDelegate(view: View, originalFocus: Boolean, originalImportantForAccessibility: Int) {
      // if a view already has an accessibility delegate, replacing it could cause
      // problems,so leave it alone.
      if (
          !ViewCompat.hasAccessibilityDelegate(view) &&
              (view.getTag(R.id.accessibility_role) != null ||
                  view.getTag(R.id.accessibility_state) != null ||
                  view.getTag(R.id.accessibility_actions) != null ||
                  view.getTag(R.id.react_test_id) != null ||
                  view.getTag(R.id.accessibility_collection_item) != null ||
                  view.getTag(R.id.accessibility_links) != null ||
                  view.getTag(R.id.role) != null)
      ) {
        ViewCompat.setAccessibilityDelegate(
            view,
            ReactTextViewAccessibilityDelegate(
                view,
                originalFocus,
                originalImportantForAccessibility,
            ),
        )
      }
    }

    fun resetDelegate(view: View, originalFocus: Boolean, originalImportantForAccessibility: Int) {
      ViewCompat.setAccessibilityDelegate(
          view,
          ReactTextViewAccessibilityDelegate(
              view,
              originalFocus,
              originalImportantForAccessibility,
          ),
      )
    }
  }

  override fun onVirtualViewKeyboardFocusChanged(virtualViewId: Int, hasFocus: Boolean) {
    if (accessibilityLinks == null) {
      return
    }

    val link = accessibilityLinks?.getLinkById(virtualViewId) ?: return

    val span = getFirstSpan(link.start, link.end, ClickableSpan::class.java) ?: return

    if (span is ReactClickableSpan && hostView is TextView) {
      span.isKeyboardFocused = hasFocus
      span.focusBgColor = (hostView as TextView).highlightColor
      hostView.invalidate()
    } else if (hostView is PreparedLayoutTextView) {
      if (hasFocus) {
        (hostView as PreparedLayoutTextView).setSelection(link.start, link.end)
      } else {
        (hostView as PreparedLayoutTextView).clearSelection()
      }
    }
  }

  override fun onPerformActionForVirtualView(
      virtualViewId: Int,
      action: Int,
      arguments: Bundle?,
  ): Boolean {
    if (accessibilityLinks == null) {
      return false
    }

    val link = accessibilityLinks?.getLinkById(virtualViewId) ?: return false

    val span = getFirstSpan(link.start, link.end, ClickableSpan::class.java) ?: return false

    if (action == AccessibilityNodeInfoCompat.ACTION_CLICK) {
      span.onClick(hostView)
      return true
    }

    return false
  }

  override fun getVisibleVirtualViews(virtualViewIds: MutableList<Int>) {
    val accessibilityLinks = accessibilityLinks ?: return

    for (i in 0 until accessibilityLinks.size()) {
      virtualViewIds.add(i)
    }
  }

  override fun getVirtualViewAt(x: Float, y: Float): Int {
    val accessibilityLinks = accessibilityLinks ?: return INVALID_ID
    if (
        accessibilityLinks.size() == 0 ||
            (hostView !is TextView && hostView !is PreparedLayoutTextView)
    ) {
      return INVALID_ID
    }

    var localX = x
    var localY = y
    localX -= hostView.paddingLeft.toFloat()
    localY -= hostView.paddingTop.toFloat()
    localX += hostView.scrollX.toFloat()
    localY += hostView.scrollY.toFloat()

    val layout = getLayoutFromHost() ?: return INVALID_ID
    val line = layout.getLineForVertical(localY.toInt())
    val charOffset = layout.getOffsetForHorizontal(line, localX)

    val clickableSpan =
        getFirstSpan(charOffset, charOffset, ClickableSpan::class.java) ?: return INVALID_ID

    val spanned = getSpannedFromHost() ?: return INVALID_ID
    val start = spanned.getSpanStart(clickableSpan)
    val end = spanned.getSpanEnd(clickableSpan)

    val link: AccessibilityLinks.AccessibleLink? = accessibilityLinks.getLinkBySpanPos(start, end)
    return link?.id ?: INVALID_ID
  }

  private fun getLayoutFromHost(): Layout? {
    return if (hostView is PreparedLayoutTextView) {
      (hostView as PreparedLayoutTextView).preparedLayout?.layout
    } else if (hostView is ReactTextView && (hostView as ReactTextView).preparedLayout != null) {
      (hostView as ReactTextView).preparedLayout?.layout
    } else if (hostView is TextView) {
      (hostView as TextView).layout
    } else {
      null
    }
  }

  protected fun <T> getFirstSpan(start: Int, end: Int, classType: Class<T>?): T? {
    val spanned = getSpannedFromHost() ?: return null
    val spans = spanned.getSpans(start, end, classType)
    return if (spans.isNotEmpty()) spans[0] else null
  }

  private fun getSpannedFromHost(): Spanned? {
    val host = hostView
    return if (host is PreparedLayoutTextView) {
      host.preparedLayout?.layout?.text as? Spanned
    } else if (host is ReactTextView && host.preparedLayout != null) {
      host.preparedLayout?.layout?.text as? Spanned
    } else if (host is TextView) {
      host.text as? Spanned
    } else {
      null
    }
  }

  override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
    super.onInitializeAccessibilityNodeInfo(host, info)
    // PreparedLayoutTextView isn't actually a TextView, so we need to teach it about its text that
    // it is holding so TalkBack knows what to announce when focusing it.
    if (host is PreparedLayoutTextView) {
      info.text = host.text
    }
  }

  @Suppress("DEPRECATION")
  override fun onPopulateNodeForVirtualView(virtualViewId: Int, node: AccessibilityNodeInfoCompat) {
    // If we get an invalid virtualViewId for some reason (which is known to happen in API 19 and
    // below), return an "empty" node to prevent from crashing. This will never be presented to
    // the user, as Talkback filters out nodes with no content to announce.
    val accessibilityLinks = accessibilityLinks
    if (accessibilityLinks == null) {
      node.contentDescription = ""
      node.setBoundsInParent(Rect(0, 0, 1, 1))
      return
    }

    val accessibleTextSpan: AccessibilityLinks.AccessibleLink? =
        accessibilityLinks.getLinkById(virtualViewId)
    if (accessibleTextSpan == null) {
      node.contentDescription = ""
      node.setBoundsInParent(Rect(0, 0, 1, 1))
      return
    }

    // NOTE: The span may not actually have visible bounds within its parent,
    // due to line limits, etc.
    val bounds = getBoundsInParent(accessibleTextSpan)
    if (bounds == null) {
      node.contentDescription = ""
      node.setBoundsInParent(Rect(0, 0, 1, 1))
      return
    }

    node.contentDescription = accessibleTextSpan.description
    node.addAction(AccessibilityNodeInfoCompat.ACTION_CLICK)
    node.setBoundsInParent(bounds)
    node.setClickable(true)
    node.roleDescription = hostView.resources.getString(R.string.link_description)
    node.className = AccessibilityRole.getValue(AccessibilityRole.BUTTON)
  }

  private fun getBoundsInParent(accessibleLink: AccessibilityLinks.AccessibleLink): Rect? {
    // This view is not a text view, so return the entire views bounds.
    if (hostView !is TextView && hostView !is PreparedLayoutTextView) {
      return Rect(0, 0, hostView.width, hostView.height)
    }

    val textViewLayout = getLayoutFromHost() ?: return Rect(0, 0, hostView.width, hostView.height)

    val startOffset = accessibleLink.start
    val endOffset = accessibleLink.end

    // Ensure the link hasn't been ellipsized away; in such cases,
    // getPrimaryHorizontal will crash (and the link isn't rendered anyway).
    val startOffsetLineNumber = textViewLayout.getLineForOffset(startOffset)
    val startLineEndOffset = textViewLayout.getLineEnd(startOffsetLineNumber)
    val endOffsetLineNumber = textViewLayout.getLineForOffset(endOffset)
    val endLineEndOffset = textViewLayout.getLineEnd(endOffsetLineNumber)
    if (startOffset > startLineEndOffset || endOffset > endLineEndOffset) {
      return null
    }

    val rootRect = Rect()

    val startXCoordinates = textViewLayout.getPrimaryHorizontal(startOffset).toDouble()

    val isMultiline = startOffsetLineNumber != endOffsetLineNumber
    textViewLayout.getLineBounds(startOffsetLineNumber, rootRect)

    val verticalOffset = hostView.scrollY + hostView.paddingTop
    rootRect.top += verticalOffset
    rootRect.bottom += verticalOffset
    rootRect.left =
        (rootRect.left + (startXCoordinates + hostView.paddingLeft - hostView.scrollX)).toInt()

    // The bounds for multi-line strings should *only* include the first line. This is because for
    // API 25 and below, Talkback's click is triggered at the center point of these bounds, and if
    // that center point is outside the spannable, it will click on something else. There is no
    // harm in not outlining the wrapped part of the string, as the text for the whole string will
    // be read regardless of the bounding box.
    if (isMultiline) {
      return Rect(rootRect.left, rootRect.top, rootRect.right, rootRect.bottom)
    }
    val endXCoordinates = textViewLayout.getPrimaryHorizontal(endOffset).toDouble()
    return Rect(rootRect.left, rootRect.top, endXCoordinates.toInt(), rootRect.bottom)
  }

  override fun getAccessibilityNodeProvider(host: View): AccessibilityNodeProviderCompat? {
    // Only set a NodeProvider if we have virtual views, otherwise just return null here so that
    // we fall back to the View class's default behavior. If we don't do this, then Views with
    // no virtual children will fall back to using ExploreByTouchHelper's onPopulateNodeForHost
    // method to populate their AccessibilityNodeInfo, which defaults to doing nothing, so no
    // AccessibilityNodeInfo will be created. Alternatively, we could override
    // onPopulateNodeForHost instead, and have it create an AccessibilityNodeInfo for the host
    // but this is what the default View class does by itself, so we may as well defer to it.
    if (accessibilityLinks != null) {
      return superGetAccessibilityNodeProvider(host)
    }

    return null
  }

  class AccessibilityLinks(text: Spanned) {
    private val links: List<AccessibleLink>

    init {
      val accessibleLinks = mutableListOf<AccessibleLink>()
      val spans = text.getSpans(0, text.length, ClickableSpan::class.java)

      // Do not generate virtual views if whole text is a single link
      if (!isWholeTextSingleLink(text, spans)) {
        spans.sortBy { text.getSpanStart(it) }
        for (i in spans.indices) {
          val span = spans[i]
          val start = text.getSpanStart(span)
          val end = text.getSpanEnd(span)
          // zero length spans, and out of range spans should not be included.
          if (start == end || start < 0 || end < 0 || start > text.length || end > text.length) {
            continue
          }

          val link = AccessibleLink()
          link.description = text.subSequence(start, end).toString()
          link.start = start
          link.end = end
          link.id = i
          accessibleLinks.add(link)
        }
      }
      links = accessibleLinks
    }

    fun getLinkById(id: Int): AccessibleLink? {
      for (link in links) {
        if (link.id == id) {
          return link
        }
      }

      return null
    }

    fun getLinkBySpanPos(start: Int, end: Int): AccessibleLink? {
      for (link in links) {
        if (link.start == start && link.end == end) {
          return link
        }
      }

      return null
    }

    fun size(): Int {
      return links.size
    }

    class AccessibleLink {
      var description: String? = null
      var start: Int = 0
      var end: Int = 0
      var id: Int = 0
    }
  }
}

private fun isWholeTextSingleLink(text: Spanned, spans: Array<ClickableSpan>): Boolean {
  if (spans.size != 1) {
    return false
  }

  val span = spans[0]
  val start = text.getSpanStart(span)
  val end = text.getSpanEnd(span)
  return start == 0 && end == text.length
}
