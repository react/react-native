/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <optional>

#import <React/RCTBackedTextInputViewProtocol.h>
#import <react/renderer/components/iostextinput/primitives.h>

NS_ASSUME_NONNULL_BEGIN

void RCTCopyBackedTextInput(
    UIView<RCTBackedTextInputViewProtocol> *fromTextInput,
    UIView<RCTBackedTextInputViewProtocol> *toTextInput);

UITextAutocorrectionType RCTUITextAutocorrectionTypeFromOptionalBool(std::optional<bool> autoCorrect);

UITextAutocapitalizationType RCTUITextAutocapitalizationTypeFromAutocapitalizationType(
    facebook::react::AutocapitalizationType autocapitalizationType);

UIKeyboardAppearance RCTUIKeyboardAppearanceFromKeyboardAppearance(
    facebook::react::KeyboardAppearance keyboardAppearance);

UITextSpellCheckingType RCTUITextSpellCheckingTypeFromOptionalBool(std::optional<bool> spellCheck);

UITextFieldViewMode RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(
    facebook::react::TextInputAccessoryVisibilityMode mode);

UIKeyboardType RCTUIKeyboardTypeFromKeyboardType(facebook::react::KeyboardType keyboardType);

UIReturnKeyType RCTUIReturnKeyTypeFromReturnKeyType(facebook::react::ReturnKeyType returnKeyType);

UITextContentType RCTUITextContentTypeFromString(const std::string &contentType);

UITextInputPasswordRules *RCTUITextInputPasswordRulesFromString(const std::string &passwordRules);

UITextSmartInsertDeleteType RCTUITextSmartInsertDeleteTypeFromOptionalBool(std::optional<bool> smartInsertDelete);

#if !TARGET_OS_TV
UIDataDetectorTypes RCTUITextViewDataDetectorTypesFromStringVector(const std::vector<std::string> &dataDetectorTypes);
#endif

NS_ASSUME_NONNULL_END
