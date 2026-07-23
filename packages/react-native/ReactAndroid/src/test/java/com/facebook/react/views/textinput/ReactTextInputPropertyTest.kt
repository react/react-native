/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO T207169925: Migrate CatalystInstance to Reacthost and remove the Suppress("DEPRECATION")
// annotation
@file:Suppress("DEPRECATION")

package com.facebook.react.views.textinput

import android.graphics.Color
import android.os.Build
import android.text.InputFilter
import android.text.InputFilter.AllCaps
import android.text.InputType
import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.util.DisplayMetrics
import android.view.Gravity
import android.view.View
import android.view.inputmethod.EditorInfo
import androidx.autofill.HintConstants
import androidx.core.content.res.ResourcesCompat.ID_NULL
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.text.DefaultStyleValuesUtil.getDefaultTextColorHint
import com.facebook.react.views.text.ReactTextUpdate
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Verify {@link EditText} view property being applied properly by {@link ReactTextInputManager} */
@RunWith(RobolectricTestRunner::class)
class ReactTextInputPropertyTest {

  private lateinit var context: BridgeReactContext
  private lateinit var catalystInstanceMock: CatalystInstance
  private lateinit var themedContext: ThemedReactContext
  private lateinit var manager: ReactTextInputManager
  private lateinit var view: ReactEditText

  private val generalKeyboardTypeFlags: Int =
      (InputType.TYPE_CLASS_NUMBER or
          InputType.TYPE_NUMBER_FLAG_DECIMAL or
          InputType.TYPE_NUMBER_FLAG_SIGNED or
          InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS or
          InputType.TYPE_CLASS_TEXT or
          InputType.TYPE_CLASS_PHONE or
          InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD and
          InputType.TYPE_TEXT_VARIATION_PASSWORD.inv())

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = BridgeReactContext(RuntimeEnvironment.getApplication())
    catalystInstanceMock = createMockCatalystInstance()
    context.initializeWithInstance(catalystInstanceMock)
    themedContext = ThemedReactContext(context, context.baseContext, null, ID_NULL)
    manager = ReactTextInputManager()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    view = manager.createViewInstance(themedContext)
  }

  @Test
  fun testAutoCorrect() {
    manager.updateProperties(view, buildStyles())
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero

    manager.updateProperties(view, buildStyles("autoCorrect", true))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero

    manager.updateProperties(view, buildStyles("autoCorrect", false))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero

    manager.updateProperties(view, buildStyles("autoCorrect", null))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero
  }

  @Test
  fun testAutoCapitalize() {
    manager.updateProperties(view, buildStyles())
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero

    manager.updateProperties(
        view,
        buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_SENTENCES),
    )
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero

    manager.updateProperties(
        view,
        buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_WORDS),
    )
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_WORDS).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero

    manager.updateProperties(
        view,
        buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS),
    )
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isNotZero

    manager.updateProperties(view, buildStyles("autoCapitalize", InputType.TYPE_CLASS_TEXT))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_WORDS).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS).isZero
  }

  @Test
  fun testAutoCapitalizeDoesNotStripNumericFlags() {
    val numericTypeFlags =
        (InputType.TYPE_CLASS_NUMBER or
            InputType.TYPE_NUMBER_FLAG_DECIMAL or
            InputType.TYPE_NUMBER_FLAG_SIGNED)

    manager.updateProperties(view, buildStyles("keyboardType", "numeric"))
    assertThat(view.inputType and numericTypeFlags).isEqualTo(numericTypeFlags)

    manager.updateProperties(
        view,
        buildStyles("autoCapitalize", InputType.TYPE_TEXT_FLAG_CAP_SENTENCES),
    )
    assertThat(view.inputType and InputType.TYPE_NUMBER_FLAG_SIGNED).isNotZero
    assertThat(view.inputType and InputType.TYPE_NUMBER_FLAG_DECIMAL).isNotZero
  }

  @Test
  fun testAutoCapitalizeAndNumericKeyboardInSameTransaction() {
    val numericTypeFlags =
        (InputType.TYPE_CLASS_NUMBER or
            InputType.TYPE_NUMBER_FLAG_DECIMAL or
            InputType.TYPE_NUMBER_FLAG_SIGNED)

    manager.updateProperties(
        view,
        buildStyles(
            "autoCapitalize",
            InputType.TYPE_TEXT_FLAG_CAP_SENTENCES,
            "keyboardType",
            "numeric",
        ),
    )
    assertThat(view.inputType and numericTypeFlags).isEqualTo(numericTypeFlags)
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero
  }

  @Test
  fun testAutoCapitalizeReappliesWhenKeyboardTypeChangesFromNumericToText() {
    // CAP_SENTENCES (0x4000) doesn't share a bit position with any numeric flag,
    // unlike CAP_WORDS (0x2000) / CAP_CHARACTERS (0x1000).
    manager.updateProperties(
        view,
        buildStyles(
            "autoCapitalize",
            InputType.TYPE_TEXT_FLAG_CAP_SENTENCES,
            "keyboardType",
            "numeric",
        ),
    )
    assertThat(view.inputType and InputType.TYPE_MASK_CLASS).isEqualTo(InputType.TYPE_CLASS_NUMBER)
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isZero

    manager.updateProperties(view, buildStyles("keyboardType", "default"))
    assertThat(view.inputType and InputType.TYPE_MASK_CLASS).isEqualTo(InputType.TYPE_CLASS_TEXT)
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_CAP_SENTENCES).isNotZero
  }

  @Test
  fun testPlaceholder() {
    manager.updateProperties(view, buildStyles())
    assertThat(view.hint).isNull()

    manager.updateProperties(view, buildStyles("placeholder", "sometext"))
    assertThat(view.hint).isEqualTo("sometext")

    manager.updateProperties(view, buildStyles("placeholder", null))
    assertThat(view.hint).isNull()
  }

  @Test
  fun testEditable() {
    manager.updateProperties(view, buildStyles())
    assertThat(view.isEnabled).isTrue

    manager.updateProperties(view, buildStyles("editable", false))
    assertThat(view.isEnabled).isFalse

    manager.updateProperties(view, buildStyles("editable", null))
    assertThat(view.isEnabled).isTrue

    manager.updateProperties(view, buildStyles("editable", false))
    assertThat(view.isEnabled).isFalse

    manager.updateProperties(view, buildStyles("editable", true))
    assertThat(view.isEnabled).isTrue
  }

  @Test
  fun testAutoCompleteExtendedHints() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }

    val expectedHints = listOf(
        "2fa-app-otp" to HintConstants.AUTOFILL_HINT_2FA_APP_OTP,
        "email-otp" to HintConstants.AUTOFILL_HINT_EMAIL_OTP,
        "flight-confirmation-code" to HintConstants.AUTOFILL_HINT_FLIGHT_CONFIRMATION_CODE,
        "flight-number" to HintConstants.AUTOFILL_HINT_FLIGHT_NUMBER,
        "gift-card-number" to HintConstants.AUTOFILL_HINT_GIFT_CARD_NUMBER,
        "gift-card-pin" to HintConstants.AUTOFILL_HINT_GIFT_CARD_PIN,
        "loyalty-account-number" to HintConstants.AUTOFILL_HINT_LOYALTY_ACCOUNT_NUMBER,
        "postal-address-dependent-locality" to
            HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_DEPENDENT_LOCALITY,
        "postal-address-unit" to HintConstants.AUTOFILL_HINT_POSTAL_ADDRESS_APT_NUMBER,
        "promo-code" to HintConstants.AUTOFILL_HINT_PROMO_CODE,
        "upi-vpa" to HintConstants.AUTOFILL_HINT_UPI_VPA,
        "wifi-password" to HintConstants.AUTOFILL_HINT_WIFI_PASSWORD,
    )

    expectedHints.forEach { (autoComplete, expectedHint) ->
      manager.updateProperties(view, buildStyles("autoComplete", autoComplete))

      assertThat(view.importantForAutofill).isEqualTo(View.IMPORTANT_FOR_AUTOFILL_YES)
      assertThat(view.autofillHints?.toList()).containsExactly(expectedHint)
    }
  }

  @Test
  fun testPlaceholderTextColor() {
    val defaultPlaceholderColorStateList = getDefaultTextColorHint(view.context)
    var colors = view.hintTextColors
    assertThat(colors).isEqualTo(defaultPlaceholderColorStateList)

    manager.updateProperties(view, buildStyles("placeholderTextColor", null))
    colors = view.hintTextColors
    assertThat(colors).isEqualTo(defaultPlaceholderColorStateList)

    manager.updateProperties(view, buildStyles("placeholderTextColor", Color.RED))
    colors = view.hintTextColors
    assertThat(colors.defaultColor).isEqualTo(Color.RED)

    manager.updateProperties(view, buildStyles("placeholderTextColor", null))
    colors = view.hintTextColors
    assertThat(colors).isEqualTo(defaultPlaceholderColorStateList)
  }

  @Test
  fun testMultiline() {
    manager.updateProperties(view, buildStyles())
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero

    manager.updateProperties(view, buildStyles("multiline", false))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero

    manager.updateProperties(view, buildStyles("multiline", true))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero

    manager.updateProperties(view, buildStyles("multiline", null))
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero
  }

  @Test
  fun testBlurMultiline() {
    val editorInfo =
        EditorInfo().apply {
          imeOptions = EditorInfo.IME_ACTION_DONE or EditorInfo.IME_FLAG_NO_ENTER_ACTION
        }
    manager.updateProperties(view, buildStyles("multiline", true))
    manager.updateProperties(view, buildStyles("submitBehavior", "blurAndSubmit"))
    view.onCreateInputConnection(editorInfo)
    assertThat(editorInfo.imeOptions).isEqualTo(EditorInfo.IME_ACTION_DONE)
  }

  @Test
  fun testNumLines() {
    manager.updateProperties(view, buildStyles())
    assertThat(view.minLines).isEqualTo(1)

    manager.updateProperties(view, buildStyles("numberOfLines", 5))
    assertThat(view.minLines).isEqualTo(5)

    manager.updateProperties(view, buildStyles("numberOfLines", 4))
    assertThat(view.minLines).isEqualTo(4)
  }

  @Test
  fun testKeyboardTypeClassText() {
    manager.updateProperties(view, buildStyles("keyboardType", null))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_TEXT)

    manager.updateProperties(view, buildStyles())
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_TEXT)

    manager.updateProperties(view, buildStyles("keyboardType", "text"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_TEXT)
  }

  @Test
  fun testKeyboardTypePad() {
    val numberPadTypeFlags = InputType.TYPE_CLASS_NUMBER
    val decimalPadTypeFlags = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL

    manager.updateProperties(view, buildStyles("keyboardType", "phone-pad"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(InputType.TYPE_CLASS_PHONE)

    manager.updateProperties(view, buildStyles("keyboardType", "number-pad"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(numberPadTypeFlags)

    manager.updateProperties(view, buildStyles("keyboardType", "decimal-pad"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(decimalPadTypeFlags)
  }

  @Test
  fun testKeyboardTypeNumeric() {
    val numericTypeFlags =
        (InputType.TYPE_CLASS_NUMBER or
            InputType.TYPE_NUMBER_FLAG_DECIMAL or
            InputType.TYPE_NUMBER_FLAG_SIGNED)

    manager.updateProperties(view, buildStyles("keyboardType", "numeric"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(numericTypeFlags)
  }

  @Test
  fun testKeyboardTypeEmail() {
    val emailTypeFlags = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS or InputType.TYPE_CLASS_TEXT

    manager.updateProperties(view, buildStyles("keyboardType", "email-address"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(emailTypeFlags)
  }

  @Test
  fun testKeyboardTypeUrl() {
    manager.updateProperties(view, buildStyles("keyboardType", "url"))
    assertThat(view.inputType and generalKeyboardTypeFlags)
        .isEqualTo(InputType.TYPE_TEXT_VARIATION_URI)
  }

  @Test
  fun testKeyboardTypeVisiblePassword() {
    val passwordVisibilityFlag =
        InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD and
            InputType.TYPE_TEXT_VARIATION_PASSWORD.inv()

    manager.updateProperties(view, buildStyles("keyboardType", "visible-password"))
    assertThat(view.inputType and generalKeyboardTypeFlags).isEqualTo(passwordVisibilityFlag)
  }

  @Test
  fun testPasswordInput() {
    manager.updateProperties(view, buildStyles())
    assertThat(view.inputType and InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero

    manager.updateProperties(view, buildStyles("secureTextEntry", false))
    assertThat(view.inputType and InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero

    manager.updateProperties(view, buildStyles("secureTextEntry", true))
    assertThat(view.inputType and InputType.TYPE_TEXT_VARIATION_PASSWORD).isNotZero

    manager.updateProperties(view, buildStyles("secureTextEntry", null))
    assertThat(view.inputType and InputType.TYPE_TEXT_VARIATION_PASSWORD).isZero
  }

  @Test
  fun testIncrementalInputTypeUpdates() {
    manager.updateProperties(view, buildStyles())
    assertThat(view.inputType and InputType.TYPE_CLASS_NUMBER).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero

    manager.updateProperties(view, buildStyles("multiline", true))
    assertThat(view.inputType and InputType.TYPE_CLASS_NUMBER).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isZero

    manager.updateProperties(view, buildStyles("autoCorrect", false))
    assertThat(view.inputType and InputType.TYPE_CLASS_NUMBER).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero

    manager.updateProperties(view, buildStyles("keyboardType", "NUMERIC"))
    assertThat(view.inputType and InputType.TYPE_CLASS_NUMBER).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero

    manager.updateProperties(view, buildStyles("multiline", null))
    assertThat(view.inputType and InputType.TYPE_CLASS_NUMBER).isNotZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_MULTI_LINE).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_AUTO_CORRECT).isZero
    assertThat(view.inputType and InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS).isNotZero
  }

  @Test
  fun testTextAlign() {
    val defaultGravity = view.gravity
    val defaultHorizontalGravity = defaultGravity and Gravity.HORIZONTAL_GRAVITY_MASK
    val defaultVerticalGravity = defaultGravity and Gravity.VERTICAL_GRAVITY_MASK

    assertThat(view.gravity).isNotEqualTo(Gravity.NO_GRAVITY)

    // region TextAlign
    manager.updateProperties(view, buildStyles("textAlign", "left"))
    assertThat(view.gravity and Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(Gravity.LEFT)

    manager.updateProperties(view, buildStyles("textAlign", "right"))
    assertThat(view.gravity and Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(Gravity.RIGHT)

    manager.updateProperties(view, buildStyles("textAlign", "center"))
    assertThat(view.gravity and Gravity.HORIZONTAL_GRAVITY_MASK)
        .isEqualTo(Gravity.CENTER_HORIZONTAL)

    manager.updateProperties(view, buildStyles("textAlign", "start"))
    assertThat(
            view.gravity and
                (Gravity.HORIZONTAL_GRAVITY_MASK or Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK)
        )
        .isEqualTo(Gravity.START)

    manager.updateProperties(view, buildStyles("textAlign", "end"))
    assertThat(
            view.gravity and
                (Gravity.HORIZONTAL_GRAVITY_MASK or Gravity.RELATIVE_HORIZONTAL_GRAVITY_MASK)
        )
        .isEqualTo(Gravity.END)

    manager.updateProperties(view, buildStyles("textAlign", null))
    assertThat(view.gravity and Gravity.HORIZONTAL_GRAVITY_MASK).isEqualTo(defaultHorizontalGravity)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.updateProperties(view, buildStyles("textAlign", "justify"))
      assertThat(view.justificationMode).isEqualTo(Layout.JUSTIFICATION_MODE_INTER_WORD)
    }
    // endregion

    // region TextAlignVertical
    manager.updateProperties(view, buildStyles("textAlignVertical", "top"))
    assertThat(view.gravity and Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.TOP)

    manager.updateProperties(view, buildStyles("textAlignVertical", "bottom"))
    assertThat(view.gravity and Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.BOTTOM)

    manager.updateProperties(view, buildStyles("textAlignVertical", "center"))
    assertThat(view.gravity and Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(Gravity.CENTER_VERTICAL)

    manager.updateProperties(view, buildStyles("textAlignVertical", null))
    assertThat(view.gravity and Gravity.VERTICAL_GRAVITY_MASK).isEqualTo(defaultVerticalGravity)
    // endregion

    // region TextAlign + TextAlignVertical
    manager.updateProperties(
        view,
        buildStyles("textAlign", "center", "textAlignVertical", "center"),
    )
    assertThat(view.gravity).isEqualTo(Gravity.CENTER)

    manager.updateProperties(view, buildStyles("textAlign", "right", "textAlignVertical", "bottom"))
    assertThat(view.gravity).isEqualTo(Gravity.RIGHT or Gravity.BOTTOM)

    manager.updateProperties(view, buildStyles("textAlign", null, "textAlignVertical", null))
    assertThat(view.gravity).isEqualTo(defaultGravity)
    // endregion
  }

  @Test
  fun testMaxLength() {
    val filters = arrayOf<InputFilter>(AllCaps())
    view.filters = filters
    manager.setMaxLength(view, null)
    assertThat(view.filters).isEqualTo(filters)
  }

  @Test
  fun testSecureTextDoesNotReplaceSameTextFromJS() {
    val markerSpan = MarkerSpan()
    val textUpdate =
        SpannableString("secret").apply {
          setSpan(markerSpan, 0, length, Spanned.SPAN_INCLUSIVE_INCLUSIVE)
        }

    manager.updateProperties(view, buildStyles("secureTextEntry", true))
    view.setText("secret")

    view.maybeSetTextFromJS(
        ReactTextUpdate(
            textUpdate,
            0,
            view.gravity and Gravity.HORIZONTAL_GRAVITY_MASK,
            Layout.BREAK_STRATEGY_HIGH_QUALITY,
            0,
        )
    )

    assertThat(checkNotNull(view.text).getSpans(0, view.length(), MarkerSpan::class.java)).isEmpty()
  }

  private fun buildStyles(vararg keysAndValues: Any?): ReactStylesDiffMap {
    return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
  }

  private class MarkerSpan
}
