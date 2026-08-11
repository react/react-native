/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/textinput/basePrimitives.h>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

// iOS & Android.
enum class AutocapitalizationType {
  None,
  Words,
  Sentences,
  Characters,
};

// iOS-only
enum class KeyboardAppearance {
  Default,
  Light,
  Dark,
};

enum class ReturnKeyType {
  // Universal
  Default,
  Done,
  Go,
  Next,
  Search,
  Send,
  // Android-only
  None,
  Previous,
  // iOS-only
  EmergencyCall,
  Google,
  Join,
  Route,
  Yahoo,
  Continue,
};

// iOS-only
enum class TextInputAccessoryVisibilityMode {
  Never,
  WhileEditing,
  UnlessEditing,
  Always,
};

enum class KeyboardType {
  // Universal
  Default,
  EmailAddress,
  Numeric,
  PhonePad,
  NumberPad,
  DecimalPad,
  // iOS-only
  ASCIICapable,
  NumbersAndPunctuation,
  URL,
  NamePhonePad,
  Twitter,
  WebSearch,
  ASCIICapableNumberPad,
  // Android-only
  VisiblePassword,
};

class Selection final {
 public:
  int start{0};
  int end{0};
};

/*
 * Controls features of text inputs.
 */
class TextInputTraits final {
 public:
  /*
   * iOS & Android
   * Default value: `Sentences`.
   */
  AutocapitalizationType autocapitalizationType{
      AutocapitalizationType::Sentences};

  /*
   * Can be empty (`null` in JavaScript) which means `default`.
   * iOS & Android
   * Default value: `empty` (`null`).
   */
  std::optional<bool> autoCorrect{};

  /*
   * iOS & Android
   * Default value: `false`.
   */
  bool contextMenuHidden{false};

  /*
   * iOS & Android
   * Default value: `true`.
   */
  bool editable{true};

  /*
   * iOS-only (implemented only on iOS for now)
   * If `true`, will automatically disable return key when text widget has
   * zero-length contents, and will automatically enable when text widget has
   * non-zero-length contents.
   * Default value: `false`.
   */
  bool enablesReturnKeyAutomatically{false};

  /*
   * Some values iOS- or Android-only (inherently particular-OS-specific)
   * Default value: `Default`.
   */
  KeyboardAppearance keyboardAppearance{KeyboardAppearance::Default};

  /*
   * Controls the annotation of misspelled words for a text input.
   * iOS-only (implemented only on iOS for now)
   * Can be empty (`null` in JavaScript) which means `default`.
   * Default value: `empty` (`null`).
   */
  std::optional<bool> spellCheck{};

  /*
   * iOS & Android
   * Default value: `false`.
   */
  bool caretHidden{false};

  /*
   * Controls the visibility of a `Clean` button.
   * iOS-only (implemented only on iOS for now)
   * Default value: `Never`.
   */
  TextInputAccessoryVisibilityMode clearButtonMode{
      TextInputAccessoryVisibilityMode::Never};

  /*
   * iOS-only (implemented only on iOS for now)
   * Default value: `true`.
   */
  bool scrollEnabled{true};

  /*
   * iOS & Android
   * Default value: `false`.
   */
  bool secureTextEntry{false};

  /*
   * iOS-only (implemented only on iOS for now)
   * Default value: `false`.
   */
  bool clearTextOnFocus{false};

  /*
   * Some values iOS- or Android-only (inherently particular-OS-specific)
   * Default value: `Default`.
   */
  KeyboardType keyboardType{KeyboardType::Default};

  /*
   * iOS & Android
   * Default value: `true`.
   */
  bool showSoftInputOnFocus{true};

  /*
   * Some values iOS- or Android-only (inherently particular-OS-specific)
   * Default value: `Default`.
   */
  ReturnKeyType returnKeyType{ReturnKeyType::Default};

  /*
   * iOS & Android
   * Default value: `false`.
   */
  bool selectTextOnFocus{false};

  /*
   * iOS-only
   * Default value: `empty` (`null`).
   */
  std::vector<std::string> dataDetectorTypes{};

  /*
   * iOS-only (inherently iOS-specific)
   * Default value: `<empty string>` (default content type).
   */
  std::string textContentType{};

  /*
   * iOS-only (inherently iOS-specific)
   * Default value: `<empty string>` (no rules).
   */
  std::string passwordRules{};

  /*
   * If `false`, the iOS system will not insert an extra space after a paste
   * operation neither delete one or two spaces after a cut or delete operation.
   * iOS-only (inherently iOS-specific)
   * Can be empty (`null` in JavaScript) which means `default`.
   * Default value: `empty` (`null`).
   */
  std::optional<bool> smartInsertDelete{};
};

} // namespace facebook::react
