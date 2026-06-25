/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUITextView.h>

#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#import <React/RCTBackedTextInputDelegateAdapter.h>

@implementation RCTUITextView {
  UILabel *_placeholderView;
  UITextView *_detachedTextView;
  RCTBackedTextViewDelegateAdapter *_textInputDelegateAdapter;
  NSDictionary<NSAttributedStringKey, id> *_defaultTextAttributes;
  NSArray<UIBarButtonItemGroup *> *_initialValueLeadingBarButtonGroups;
  NSArray<UIBarButtonItemGroup *> *_initialValueTrailingBarButtonGroups;
  NSArray<NSString *> *_acceptDragAndDropTypes;
  BOOL _disableKeyboardShortcuts;
}

static UIFont *defaultPlaceholderFont(void)
{
  return [UIFont preferredFontForTextStyle:UIFontTextStyleBody];
}

static UIColor *defaultPlaceholderColor(void)
{
  // Default placeholder color from UITextField.
  return [UIColor placeholderTextColor];
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(textDidChange)
                                                 name:UITextViewTextDidChangeNotification
                                               object:self];

    _placeholderView = [[UILabel alloc] initWithFrame:self.bounds];
    _placeholderView.isAccessibilityElement = NO;
    _placeholderView.numberOfLines = 0;
    [self addSubview:_placeholderView];

    _textInputDelegateAdapter = [[RCTBackedTextViewDelegateAdapter alloc] initWithTextView:self];

    self.backgroundColor = [UIColor clearColor];
    self.textColor = [UIColor blackColor];
    // This line actually removes 5pt (default value) left and right padding in UITextView.
    self.textContainer.lineFragmentPadding = 0;
#if !TARGET_OS_TV
    self.scrollsToTop = NO;
#endif
    self.scrollEnabled = YES;
    _initialValueLeadingBarButtonGroups = nil;
    _initialValueTrailingBarButtonGroups = nil;
  }

  return self;
}

- (void)setDelegate:(id<UITextViewDelegate>)delegate
{
  // Delegate is set inside `[RCTBackedTextViewDelegateAdapter initWithTextView]` and
  // it cannot be changed from outside.
  if (super.delegate) {
    return;
  }
  [super setDelegate:delegate];
}

#pragma mark - Accessibility

- (void)setIsAccessibilityElement:(BOOL)isAccessibilityElement
{
  // UITextView is accessible by default (some nested views are) and disabling that is not supported.
  // On iOS accessible elements cannot be nested, therefore enabling accessibility for some container view
  // (even in a case where this view is a part of public API of TextInput on iOS) shadows some features implemented
  // inside the component.
}

- (NSString *)accessibilityLabel
{
  NSMutableString *accessibilityLabel = [NSMutableString new];

  NSString *superAccessibilityLabel = [super accessibilityLabel];
  if (superAccessibilityLabel.length > 0) {
    [accessibilityLabel appendString:superAccessibilityLabel];
  }

  if (self.placeholder.length > 0 && self.attributedText.string.length == 0) {
    if (accessibilityLabel.length > 0) {
      [accessibilityLabel appendString:@" "];
    }
    [accessibilityLabel appendString:self.placeholder];
  }

  return accessibilityLabel;
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

- (void)setPlaceholder:(NSString *)placeholder
{
  _placeholder = placeholder;
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
  self.typingAttributes = defaultTextAttributes;
  [self _updatePlaceholder];
}

- (NSDictionary<NSAttributedStringKey, id> *)defaultTextAttributes
{
  return _defaultTextAttributes;
}

- (void)textDidChange
{
  _textWasPasted = NO;
  [self _invalidatePlaceholderVisibility];
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

- (BOOL)disableKeyboardShortcuts
{
  return _disableKeyboardShortcuts;
}

#pragma mark - Overrides

- (void)setFont:(UIFont *)font
{
  [super setFont:font];
  [self _updatePlaceholder];
}

- (void)setTextAlignment:(NSTextAlignment)textAlignment
{
  [super setTextAlignment:textAlignment];
  _placeholderView.textAlignment = textAlignment;
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  [super setAttributedText:attributedText];
  [self textDidChange];
}

- (void)setSelectedTextRange:(UITextRange *)selectedTextRange notifyDelegate:(BOOL)notifyDelegate
{
  if (!notifyDelegate) {
    // We have to notify an adapter that following selection change was initiated programmatically,
    // so the adapter must not generate a notification for it.
    [_textInputDelegateAdapter skipNextTextInputDidChangeSelectionEventWithTextRange:selectedTextRange];
  }

  [super setSelectedTextRange:selectedTextRange];
}

// After restoring the previous cursor position, we manually trigger the scroll to the new cursor position (PR 38679).
- (void)scrollRangeToVisible:(NSRange)range
{
  [super scrollRangeToVisible:range];
}

- (void)paste:(id)sender
{
  _textWasPasted = YES;
  [super paste:sender];
}

// Turn off scroll animation to fix flaky scrolling.
// This is only necessary for iOS < 14.
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED < 140000
- (void)setContentOffset:(CGPoint)contentOffset animated:(__unused BOOL)animated
{
  [super setContentOffset:contentOffset animated:NO];
}
#endif

- (void)selectAll:(id)sender
{
  [super selectAll:sender];

  // `selectAll:` does not work for UITextView when it's being called inside UITextView's delegate methods.
  dispatch_async(dispatch_get_main_queue(), ^{
    UITextRange *selectionRange = [self textRangeFromPosition:self.beginningOfDocument toPosition:self.endOfDocument];
    [self setSelectedTextRange:selectionRange notifyDelegate:NO];
  });
}

#pragma mark - Layout

- (CGFloat)preferredMaxLayoutWidth
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return _preferredMaxLayoutWidth ?: self.placeholderSize.width;
}

- (CGSize)placeholderSize
{
  UIEdgeInsets textContainerInset = self.textContainerInset;
  NSString *placeholder = self.placeholder ?: @"";
  CGSize maxPlaceholderSize =
      CGSizeMake(UIEdgeInsetsInsetRect(self.bounds, textContainerInset).size.width, CGFLOAT_MAX);
  CGSize placeholderSize = [placeholder boundingRectWithSize:maxPlaceholderSize
                                                     options:NSStringDrawingUsesLineFragmentOrigin
                                                  attributes:[self _placeholderTextAttributes]
                                                     context:nil]
                               .size;
  placeholderSize = CGSizeMake(RCTCeilPixelValue(placeholderSize.width), RCTCeilPixelValue(placeholderSize.height));
  placeholderSize.width += textContainerInset.left + textContainerInset.right;
  placeholderSize.height += textContainerInset.top + textContainerInset.bottom;
  // Returning size DOES contain `textContainerInset` (aka `padding`; as `sizeThatFits:` does).
  return placeholderSize;
}

- (CGSize)contentSize
{
  CGSize contentSize = super.contentSize;
  CGSize placeholderSize = _placeholderView.isHidden ? CGSizeZero : self.placeholderSize;
  // When a text input is empty, it actually displays a placeholder.
  // So, we have to consider `placeholderSize` as a minimum `contentSize`.
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return CGSizeMake(MAX(contentSize.width, placeholderSize.width), MAX(contentSize.height, placeholderSize.height));
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  CGRect textFrame = UIEdgeInsetsInsetRect(self.bounds, self.textContainerInset);
  CGFloat placeholderHeight = [_placeholderView sizeThatFits:textFrame.size].height;
  textFrame.size.height = MIN(placeholderHeight, textFrame.size.height);
  _placeholderView.frame = textFrame;
}

- (CGSize)intrinsicContentSize
{
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return [self sizeThatFits:CGSizeMake(self.preferredMaxLayoutWidth, CGFLOAT_MAX)];
}

- (CGSize)sizeThatFits:(CGSize)size
{
  // Returned fitting size depends on text size and placeholder size.
  CGSize textSize = [super sizeThatFits:size];
  CGSize placeholderSize = self.placeholderSize;
  // Returning size DOES contain `textContainerInset` (aka `padding`).
  return CGSizeMake(MAX(textSize.width, placeholderSize.width), MAX(textSize.height, placeholderSize.height));
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
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 170000 && !TARGET_OS_TV
  if (@available(iOS 17.0, *)) {
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

#pragma mark - Placeholder

- (void)_invalidatePlaceholderVisibility
{
  BOOL isVisible = _placeholder.length != 0 && self.attributedText.length == 0;
  _placeholderView.hidden = !isVisible;
}

- (void)_updatePlaceholder
{
  _placeholderView.attributedText = [[NSAttributedString alloc] initWithString:_placeholder ?: @""
                                                                    attributes:[self _placeholderTextAttributes]];
  [self _invalidatePlaceholderVisibility];
}

- (NSDictionary<NSAttributedStringKey, id> *)_placeholderTextAttributes
{
  NSMutableDictionary<NSAttributedStringKey, id> *textAttributes =
      [_defaultTextAttributes mutableCopy] ?: [NSMutableDictionary new];

  [textAttributes setValue:self.placeholderColor ?: defaultPlaceholderColor() forKey:NSForegroundColorAttributeName];

  if (![textAttributes objectForKey:NSFontAttributeName]) {
    [textAttributes setValue:defaultPlaceholderFont() forKey:NSFontAttributeName];
  }

  return textAttributes;
}

#pragma mark - Caret Manipulation

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }

  return [super caretRectForPosition:position];
}

#pragma mark - Utility Methods

@end
