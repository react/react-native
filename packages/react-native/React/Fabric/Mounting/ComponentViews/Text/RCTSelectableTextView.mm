/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSelectableTextView+Internal.h"

#if !TARGET_OS_TV

#import <MobileCoreServices/UTCoreTypes.h>
#import <React/RCTSurfaceTouchHandler.h>
#import <React/RCTViewComponentView.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>

NSAttributedString *RCTUnpaintedAttributedString(NSAttributedString *attributedString)
{
  NSMutableAttributedString *unpainted = [attributedString mutableCopy];
  NSRange range = NSMakeRange(0, unpainted.length);

  [unpainted beginEditing];
  [unpainted addAttribute:NSForegroundColorAttributeName value:UIColor.clearColor range:range];
  [unpainted addAttribute:NSBackgroundColorAttributeName value:UIColor.clearColor range:range];
  [unpainted removeAttribute:NSUnderlineStyleAttributeName range:range];
  [unpainted removeAttribute:NSStrikethroughStyleAttributeName range:range];
  [unpainted removeAttribute:NSShadowAttributeName range:range];
  [unpainted removeAttribute:RCTAttributedStringIsHighlightedAttributeName range:range];
  [unpainted endEditing];

  return unpainted;
}

@implementation RCTSelectableTextView {
  UITapGestureRecognizer *_dismissSelectionRecognizer;
  BOOL _didCancelTouchesForSelection;
}

- (instancetype)initWithFrame:(CGRect)frame textContainer:(NSTextContainer *)textContainer
{
  if (self = [super initWithFrame:frame textContainer:textContainer]) {
    self.backgroundColor = UIColor.clearColor;
    self.editable = NO;
    self.selectable = YES;
    self.scrollEnabled = NO;
    self.contentInset = UIEdgeInsetsZero;
    self.textContainerInset = UIEdgeInsetsZero;
    self.adjustsFontForContentSizeCategory = NO;
    // `RCTTextLayoutManager` already applies the padding it wants.
    self.textContainer.lineFragmentPadding = 0.0;
    // The paragraph owns its layout; the text view must never reflow it.
    self.textContainer.widthTracksTextView = NO;
    self.textContainer.heightTracksTextView = NO;
    // <Paragraph> publishes its own accessibility elements, one per link, through
    // `RCTParagraphComponentAccessibilityProvider`. Keeping the text view out of
    // the accessibility tree leaves that contract exactly as it was.
    self.accessibilityElementsHidden = YES;
    self.delegate = self;
  }
  return self;
}

#pragma mark - Giving the touch to the selection

/*
 * The selection gesture and `RCTSurfaceTouchHandler` track the same touch, and
 * neither cancels the other. `RCTSurfaceTouchHandler` resolves its event
 * emitter when the finger lands, before any selection exists, so lifting the
 * finger after a long press presses the <Text> under it. Selecting a link
 * follows the link.
 *
 * Once a selection exists the touch belongs to the selection, so the other
 * recognizer has to let go. Disabling a recognizer cancels what it tracks,
 * which reaches React Native as a cancelled touch and stops the press.
 */
- (void)textViewDidChangeSelection:(UITextView *)textView
{
  BOOL hasSelection = textView.selectedRange.length > 0;
  if (hasSelection && !_didCancelTouchesForSelection) {
    _didCancelTouchesForSelection = YES;
    [self _cancelSurfaceTouches];
  } else if (!hasSelection) {
    _didCancelTouchesForSelection = NO;
  }
}

- (void)_cancelSurfaceTouches
{
  for (UIView *ancestor = self.superview; ancestor != nil; ancestor = ancestor.superview) {
    for (UIGestureRecognizer *recognizer in ancestor.gestureRecognizers) {
      if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]] && recognizer.isEnabled) {
        recognizer.enabled = NO;
        recognizer.enabled = YES;
      }
    }
  }
}

#pragma mark - Dismissing the selection

/*
 * A tap outside the text clears the selection, which is what Android does and
 * what a user expects. Nothing else in React Native takes first responder on a
 * tap, so without this the selection stays on screen forever.
 */
- (BOOL)becomeFirstResponder
{
  BOOL didBecomeFirstResponder = [super becomeFirstResponder];
  if (didBecomeFirstResponder) {
    [self _addDismissSelectionRecognizer];
  }
  return didBecomeFirstResponder;
}

- (BOOL)resignFirstResponder
{
  BOOL didResignFirstResponder = [super resignFirstResponder];
  if (didResignFirstResponder) {
    [self _removeDismissSelectionRecognizer];
    self.selectedRange = NSMakeRange(0, 0);
  }
  return didResignFirstResponder;
}

- (void)willMoveToWindow:(UIWindow *)newWindow
{
  [super willMoveToWindow:newWindow];
  if (newWindow == nil) {
    // The recognizer holds this view, so it has to go when the view does.
    [self _removeDismissSelectionRecognizer];
  }
}

- (void)_addDismissSelectionRecognizer
{
  if (_dismissSelectionRecognizer != nil) {
    return;
  }

  // The recognizer belongs on the topmost React Native view, and not on the
  // window: `RCTSurfaceTouchHandler` gives way to a recognizer that sits
  // outside the surface, so a recognizer on the window would make every touch
  // in the application wait for this one.
  UIView *rootView = nil;
  for (UIView *ancestor = self.superview; ancestor != nil; ancestor = ancestor.superview) {
    if ([ancestor isKindOfClass:[RCTViewComponentView class]]) {
      rootView = ancestor;
    }
  }
  if (rootView == nil) {
    return;
  }

  _dismissSelectionRecognizer =
      [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTapToDismissSelection:)];
  _dismissSelectionRecognizer.cancelsTouchesInView = NO;
  _dismissSelectionRecognizer.delaysTouchesBegan = NO;
  _dismissSelectionRecognizer.delaysTouchesEnded = NO;
  [rootView addGestureRecognizer:_dismissSelectionRecognizer];
}

- (void)_removeDismissSelectionRecognizer
{
  [_dismissSelectionRecognizer.view removeGestureRecognizer:_dismissSelectionRecognizer];
  _dismissSelectionRecognizer = nil;
}

- (void)_handleTapToDismissSelection:(UITapGestureRecognizer *)recognizer
{
  // A tap on the text itself belongs to the text view, which moves or clears
  // the selection on its own.
  if ([self pointInside:[recognizer locationInView:self] withEvent:nil]) {
    return;
  }

  [self resignFirstResponder];
}

#pragma mark - Copying

/*
 * Writes the selected range to the pasteboard as rich text and as plain text,
 * which is what `RCTParagraphComponentView` did for the whole paragraph before
 * selection existed. `UITextView` would otherwise copy from its own storage,
 * and that storage carries no colour and no decorations.
 */
- (void)copy:(id)sender
{
  NSRange selectedRange = self.selectedRange;
  NSAttributedString *sourceAttributedText = _sourceAttributedText;

  if (sourceAttributedText == nil || selectedRange.length == 0 ||
      NSMaxRange(selectedRange) > sourceAttributedText.length) {
    [super copy:sender];
    return;
  }

  NSAttributedString *selectedText = [sourceAttributedText attributedSubstringFromRange:selectedRange];
  NSMutableDictionary *item = [NSMutableDictionary new];

  NSData *rtf = [selectedText dataFromRange:NSMakeRange(0, selectedText.length)
                         documentAttributes:@{NSDocumentTypeDocumentAttribute : NSRTFDTextDocumentType}
                                      error:nil];

  if (rtf) {
    [item setObject:rtf forKey:(id)kUTTypeFlatRTFD];
  }

  [item setObject:selectedText.string forKey:(id)kUTTypeUTF8PlainText];

  UIPasteboard.generalPasteboard.items = @[ item ];
}

@end

#endif // !TARGET_OS_TV
