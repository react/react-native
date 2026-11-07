/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.SpannableString
import android.text.Spanned
import android.text.style.ClickableSpan
import android.view.View
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import com.facebook.react.R
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactTextViewAccessibilityDelegateTest {

  private val view = PreparedLayoutTextView(RuntimeEnvironment.getApplication())

  @Test
  fun `the first update installs the text delegate`() {
    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("Hello"))

    assertThat(delegate()).isInstanceOf(ReactTextViewAccessibilityDelegate::class.java)
    assertThat(view.getTag(R.id.accessibility_links)).isNull()
  }

  @Test
  fun `updates without links keep the delegate`() {
    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("Hello"))
    val first = delegate()

    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("World"))

    assertThat(delegate()).isSameAs(first)
  }

  @Test
  fun `adding and removing links resets the delegate`() {
    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("Hello"))
    val plain = delegate()

    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, textWithLink())
    val withLink = delegate()
    assertThat(withLink).isNotSameAs(plain)
    assertThat(view.getTag(R.id.accessibility_links)).isNotNull()

    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("Hello"))
    assertThat(delegate()).isNotSameAs(withLink)
    assertThat(view.getTag(R.id.accessibility_links)).isNull()
  }

  @Test
  fun `a view set back to auto is important for accessibility after an update`() {
    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("Hello"))
    view.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_AUTO

    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("World"))

    assertThat(view.importantForAccessibility).isEqualTo(View.IMPORTANT_FOR_ACCESSIBILITY_YES)
  }

  private fun delegate(): AccessibilityDelegateCompat? = ViewCompat.getAccessibilityDelegate(view)

  private fun textWithLink(): Spanned =
      SpannableString("Read the docs here").apply {
        setSpan(
            object : ClickableSpan() {
              override fun onClick(widget: View) = Unit
            },
            9,
            13,
            Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
        )
      }
}
