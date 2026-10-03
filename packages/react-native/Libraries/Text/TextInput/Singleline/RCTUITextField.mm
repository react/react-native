/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUITextField.h>

#import <React/RCTBackedTextInputDelegateAdapter.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

// Must match RCTAttributedStringEventEmitterKey in RCTAttributedTextUtils.h
// (cannot import directly — Libraries/Text must not depend on ReactCommon).
static NSString *const kRCTEventEmitterAttributeKey = @"EventEmitter";

@implementation RCTUITextField {
  RCTBackedTextFieldDelegateAdapter *_textInputDelegateAdapter;
  NSDictionary<NSAttributedStringKey, id> *_defaultTextAttributes;
  NSArray<UIBarButtonItemGroup *> *_initialValueLeadingBarButtonGroups;
  NSArray<UIBarButtonItemGroup *> *_initialValueTrailingBarButtonGroups;
  NSArray<NSString *> *_acceptDragAndDropTypes;
}

// This should not be needed but internal build were failing without it.
// This variable is unused.
@synthesize dataDetectorTypes;

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_textDidChange)
                                                 name:UITextFieldTextDidChangeNotification
                                               object:self];

    _textInputDelegateAdapter = [[RCTBackedTextFieldDelegateAdapter alloc] initWithTextField:self];
    _scrollEnabled = YES;
    _initialValueLeadingBarButtonGroups = nil;
    _initialValueTrailingBarButtonGroups = nil;
  }

  return self;
}

- (void)_textDidChange
{
  _textWasPasted = NO;
}

#pragma mark - Accessibility

- (void)setIsAccessibilityElement:(BOOL)isAccessibilityElement
{
  // UITextField is accessible by default (some nested views are) and disabling that is not supported.
  // On iOS accessible elements cannot be nested, therefore enabling accessibility for some container view
  // (even in a case where this view is a part of public API of TextInput on iOS) shadows some features implemented
  // inside the component.
}

#pragma mark - Properties

- (void)setAcceptDragAndDropTypes:(NSArray<NSString *> *)acceptDragAndDropTypes
{
  _acceptDragAndDropTypes = acceptDragAndDropTypes;
}

- (nullable NSArray<NSString *> *)acceptDragAndDropTypes
{
  return _acceptDragAndDropTypes;
}

- (void)setTextContainerInset:(UIEdgeInsets)textContainerInset
{
  _textContainerInset = textContainerInset;
  [self setNeedsLayout];
}

- (void)setPlaceholder:(NSString *)placeholder
{
  [super setPlaceholder:placeholder];
  [self _updatePlaceholder];
}

- (void)setPlaceholderColor:(UIColor *)placeholderColor
{
  _placeholderColor = placeholderColor;
  [self _updatePlaceholder];
}

- (void)setDefaultTextAttributes:(NSDictionary<NSAttributedStringKey, id> *)defaultTextAttributes
{
  if ([_defaultTextAttributes isEqualToDictionary:defaultTextAttributes]) {
    return;
  }

  _defaultTextAttributes = defaultTextAttributes;
  // Strip attributes that interfere with UIKit's IME composition underline rendering.
  // NSShadow and NSBackgroundColor prevent UIKit from drawing the composition underline
  // on marked text, but only remove them when they are no-op defaults (empty shadow,
  // clear background) — preserve user-specified values.
  // EventEmitter is a React-internal attribute (NSData wrapping C++ weak_ptr).
  NSMutableDictionary *uikitAttrs = [defaultTextAttributes mutableCopy];
  [uikitAttrs removeObjectForKey:kRCTEventEmitterAttributeKey];
  NSShadow *shadow = uikitAttrs[NSShadowAttributeName];
  if (shadow && CGSizeEqualToSize(shadow.shadowOffset, CGSizeZero) && shadow.shadowBlurRadius == 0) {
    [uikitAttrs removeObjectForKey:NSShadowAttributeName];
  }
  UIColor *bgColor = uikitAttrs[NSBackgroundColorAttributeName];
  if (bgColor && CGColorGetAlpha(bgColor.CGColor) == 0) {
    [uikitAttrs removeObjectForKey:NSBackgroundColorAttributeName];
  }
  [super setDefaultTextAttributes:uikitAttrs];
  [self _updatePlaceholder];
}

- (NSDictionary<NSAttributedStringKey, id> *)defaultTextAttributes
{
  return _defaultTextAttributes;
}

- (void)_updatePlaceholder
{
  self.attributedPlaceholder = [[NSAttributedString alloc] initWithString:self.placeholder ?: @""
                                                               attributes:[self _placeholderTextAttributes]];
}

- (BOOL)isEditable
{
  return self.isEnabled;
}

- (void)setEditable:(BOOL)editable
{
  self.enabled = editable;
}

- (void)setSecureTextEntry:(BOOL)secureTextEntry
{
  if (self.secureTextEntry == secureTextEntry) {
    return;
  }

  [super setSecureTextEntry:secureTextEntry];

  // Fix for trailing whitespate issue
  // Read more:
  // https://stackoverflow.com/questions/14220187/uitextfield-has-trailing-whitespace-after-securetextentry-toggle/22537788#22537788
  NSAttributedString *originalText = [self.attributedText copy];
  self.attributedText = [NSAttributedString new];
  self.attributedText = originalText;
}

- (void)setDisableKeyboardShortcuts:(BOOL)disableKeyboardShortcuts
{
  _disableKeyboardShortcuts = disableKeyboardShortcuts;
#if TARGET_OS_IOS
  // Initialize the initial values only once
  if (_initialValueLeadingBarButtonGroups == nil) {
    // Capture initial values of leading and trailing button groups
    _initialValueLeadingBarButtonGroups = self.inputAssistantItem.leadingBarButtonGroups;
    _initialValueTrailingBarButtonGroups = self.inputAssistantItem.trailingBarButtonGroups;
  }

  if (disableKeyboardShortcuts) {
    self.inputAssistantItem.leadingBarButtonGroups = @[];
    self.inputAssistantItem.trailingBarButtonGroups = @[];
  } else {
    // Restore the initial values
    self.inputAssistantItem.leadingBarButtonGroups = _initialValueLeadingBarButtonGroups;
    self.inputAssistantItem.trailingBarButtonGroups = _initialValueTrailingBarButtonGroups;
  }
#endif
}

#pragma mark - Placeholder

- (NSDictionary<NSAttributedStringKey, id> *)_placeholderTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *textAttributes =
      [_defaultTextAttributes mutableCopy] ?: [NSMutableDictionary new];

  if (self.placeholderColor) {
    [textAttributes setValue:self.placeholderColor forKey:NSForegroundColorAttributeName];
  } else {
    [textAttributes removeObjectForKey:NSForegroundColorAttributeName];
  }

  return textAttributes;
}

#pragma mark - Context Menu

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  if (_contextMenuHidden) {
    return NO;
  }

  return [super canPerformAction:action withSender:sender];
}

- (void)buildMenuWithBuilder:(id<UIMenuBuilder>)builder
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 170000
  if (@available(iOS 17.0, tvOS 17.0, *)) {
    if (_contextMenuHidden) {
      [builder removeMenuForIdentifier:UIMenuAutoFill];
    }
  }
#endif

  [super buildMenuWithBuilder:builder];
}

#pragma mark - Dictation

- (void)dictationRecordingDidEnd
{
  _dictationRecognizing = YES;
}

- (void)removeDictationResultPlaceholder:(id)placeholder willInsertResult:(BOOL)willInsertResult
{
  [super removeDictationResultPlaceholder:placeholder willInsertResult:willInsertResult];
  _dictationRecognizing = NO;
}

#pragma mark - Caret Manipulation

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }

  return [super caretRectForPosition:position];
}

#pragma mark - Positioning Overrides

- (CGRect)textRectForBounds:(CGRect)bounds
{
  return UIEdgeInsetsInsetRect([super textRectForBounds:bounds], _textContainerInset);
}

- (CGRect)editingRectForBounds:(CGRect)bounds
{
  return [self textRectForBounds:bounds];
}

#pragma mark - Overrides

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
// Overrides selectedTextRange setter to get notify when selectedTextRange changed.
- (void)setSelectedTextRange:(UITextRange *)selectedTextRange
{
  [super setSelectedTextRange:selectedTextRange];
  [_textInputDelegateAdapter selectedTextRangeWasSet];
}
#pragma clang diagnostic pop

- (void)setSelectedTextRange:(UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
{
  if (!notifyDelegate) {
    // We have to notify an adapter that following selection change was initiated programmatically,
    // so the adapter must not generate a notification for it.
    [_textInputDelegateAdapter skipNextTextInputDidChangeSelectionEventWithTextRange:selectedTextRange];
  }

  [super setSelectedTextRange:selectedTextRange];
}

- (void)scrollRangeToVisible:(NSRange)range
{
  // Singleline TextInput does not require scrolling after calling setSelectedTextRange (PR 38679).
}

- (void)paste:(id)sender
{
  _textWasPasted = YES;
  [super paste:sender];
}

#pragma mark - Layout

- (CGSize)contentSize
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return self.intrinsicContentSize;
}

- (CGSize)intrinsicContentSize
{
  // Note: `placeholder` defines intrinsic size for `<TextInput>`.
  NSString *text = self.placeholder ?: @"";
  CGSize size = [text sizeWithAttributes:[self _placeholderTextAttributes]];
  size = CGSizeMake(RCTCeilPixelValue(size.width), RCTCeilPixelValue(size.height));
  size.width += _textContainerInset.left + _textContainerInset.right;
  size.height += _textContainerInset.top + _textContainerInset.bottom;
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return size;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  // All size values here contain `textContainerInset` (aka `padding`).
  CGSize intrinsicSize = self.intrinsicContentSize;
  return CGSizeMake(MIN(size.width, intrinsicSize.width), MIN(size.height, intrinsicSize.height));
}

@end
