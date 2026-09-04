/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBackedTextInputDelegate.h>
#import <React/RCTBackedTextInputViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Mirrors `facebook::react::TextAlignmentVertical` (kept private to avoid
 * exposing C++ types from this ObjC header). Keep the integer values in
 * sync with `enum class TextAlignmentVertical` in
 * `ReactCommon/react/renderer/attributedstring/primitives.h`.
 */
typedef NS_ENUM(NSInteger, RCTUITextViewTextAlignmentVertical) {
  RCTUITextViewTextAlignmentVerticalAuto = 0,
  RCTUITextViewTextAlignmentVerticalTop,
  RCTUITextViewTextAlignmentVerticalBottom,
  RCTUITextViewTextAlignmentVerticalCenter,
};

/*
 * Just regular UITextView... but much better!
 */
@interface RCTUITextView : UITextView <RCTBackedTextInputViewProtocol>

- (instancetype)initWithFrame:(CGRect)frame textContainer:(nullable NSTextContainer *)textContainer NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

@property (nonatomic, weak) id<RCTBackedTextInputDelegate> textInputDelegate;

@property (nonatomic, assign) BOOL contextMenuHidden;
@property (nonatomic, assign, readonly) BOOL textWasPasted;
@property (nonatomic, assign, readonly) BOOL dictationRecognizing;
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, strong, nullable) UIColor *placeholderColor;

@property (nonatomic, assign) CGFloat preferredMaxLayoutWidth;

// The `clearButtonMode` property actually is not supported yet;
// it's declared here only to conform to the interface.
@property (nonatomic, assign) UITextFieldViewMode clearButtonMode;

@property (nonatomic, assign) BOOL caretHidden;

/*
 * Block-axis alignment of the text within the host view's bounds, mirroring
 * Android's `textAlignVertical`. Applied via `contentInset.top` so a short
 * multiline value can sit centered or pushed to the bottom of a tall fixed
 * frame. Defaults to `Auto` (top-aligned, current behavior).
 */
@property (nonatomic, assign) RCTUITextViewTextAlignmentVertical textAlignVertical;

@property (nonatomic, strong, nullable) NSString *inputAccessoryViewID;
@property (nonatomic, strong, nullable) NSString *inputAccessoryViewButtonLabel;

@property (nonatomic, assign) BOOL disableKeyboardShortcuts;

@end

NS_ASSUME_NONNULL_END
