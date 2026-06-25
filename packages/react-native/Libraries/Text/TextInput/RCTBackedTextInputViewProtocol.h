/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@protocol RCTBackedTextInputDelegate;

NS_ASSUME_NONNULL_BEGIN

@protocol RCTBackedTextInputViewProtocol <UITextInput>

@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, strong, nullable) UIColor *placeholderColor;
@property (nonatomic, assign, readonly) BOOL textWasPasted;
@property (nonatomic, assign, readonly) BOOL dictationRecognizing;
@property (nonatomic, assign) UIEdgeInsets textContainerInset;
@property (nonatomic, strong, nullable) UIView *inputAccessoryView;
@property (nonatomic, strong, nullable) UIView *inputView;
@property (nonatomic, weak, nullable) id<RCTBackedTextInputDelegate> textInputDelegate;
@property (nonatomic, readonly) CGSize contentSize;
@property (nonatomic, strong, nullable) NSDictionary<NSAttributedStringKey, id> *defaultTextAttributes;
@property (nonatomic, assign) BOOL contextMenuHidden;
@property (nonatomic, assign, getter=isEditable) BOOL editable;
@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL enablesReturnKeyAutomatically;
@property (nonatomic, assign) UITextFieldViewMode clearButtonMode;
@property (nonatomic, assign) UIDataDetectorTypes dataDetectorTypes;
@property (nonatomic, getter=isScrollEnabled) BOOL scrollEnabled;
@property (nonatomic, strong, nullable) NSString *inputAccessoryViewID;
@property (nonatomic, strong, nullable) NSString *inputAccessoryViewButtonLabel;
@property (nonatomic, assign, readonly) CGFloat zoomScale;
@property (nonatomic, assign, readonly) CGPoint contentOffset;
@property (nonatomic, assign, readonly) UIEdgeInsets contentInset;
@property (nullable, nonatomic, copy) NSDictionary<NSAttributedStringKey, id> *typingAttributes;
@property (nonatomic, strong, nullable) NSArray<NSString *> *acceptDragAndDropTypes;

// This protocol disallows direct access to `selectedTextRange` property because
// unwise usage of it can break the `delegate` behavior. So, we always have to
// explicitly specify should `delegate` be notified about the change or not.
// If the change was initiated programmatically, we must NOT notify the delegate.
// If the change was a result of user actions (like typing or touches), we MUST notify the delegate.
- (void)setSelectedTextRange:(nullable UITextRange *)selectedTextRange NS_UNAVAILABLE;
- (void)setSelectedTextRange:(nullable UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate;
- (void)scrollRangeToVisible:(NSRange)selectedTextRange;

// This protocol disallows direct access to `text` property because
// unwise usage of it can break the `attributeText` behavior.
// Use `attributedText.string` instead.
@property (nonatomic, copy, nullable) NSString *text NS_UNAVAILABLE;

@property (nonatomic, assign) BOOL disableKeyboardShortcuts;

@end

NS_ASSUME_NONNULL_END
