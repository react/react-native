/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParagraphComponentView.h"
#import "RCTParagraphComponentAccessibilityProvider.h"

#import <MobileCoreServices/UTCoreTypes.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/components/text/ParagraphComponentDescriptor.h>
#import <react/renderer/components/text/ParagraphProps.h>
#import <react/renderer/components/text/ParagraphState.h>
#import <react/renderer/components/text/RawTextComponentDescriptor.h>
#import <react/renderer/components/text/TextComponentDescriptor.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/renderer/textlayoutmanager/RCTTextLayoutManager.h>
#import <react/renderer/textlayoutmanager/TextLayoutManager.h>
#import <react/utils/ManagedObjectWrapper.h>

#import "RCTConversions.h"
#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface RCTTextLayoutManager (RCTParagraphComponentViewPrivate)

- (CGRect)drawingFrameForAttributedString:(facebook::react::AttributedString)attributedString
                      paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                    frame:(CGRect)frame
                           containerFrame:(CGRect *)containerFrame;

- (NSTextStorage *)textStorageForNSAttributedString:(NSAttributedString *)attributedString
                                paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                               size:(CGSize)size;

@end

// ParagraphTextView is an auxiliary view we set as contentView so the drawing
// can happen on top of the layers manipulated by RCTViewComponentView (the parent view)
@interface RCTParagraphTextView : UIView

@property (nonatomic) ParagraphShadowNode::ConcreteState::Shared state;
@property (nonatomic) ParagraphAttributes paragraphAttributes;
@property (nonatomic) LayoutMetrics layoutMetrics;
@property (nonatomic) CGRect drawingFrame;

@end

#if !TARGET_OS_TV
/*
 * Strips every attribute that paints, and keeps every attribute that lays out.
 *
 * `RCTTextLayoutManager` draws the paragraph itself, and it draws effects UIKit
 * knows nothing about: wavy, dotted and dashed decorations, and the pressed
 * highlight of a nested pressable <Text>. The selection text view must lay the
 * same glyphs out, because that is what places the selection rects, but it must
 * not paint them. So the font, the kerning, the paragraph style and the
 * attachments stay, and the colors, the decorations and the shadow go.
 */
static NSAttributedString *RCTUnpaintedAttributedString(NSAttributedString *attributedString)
{
  NSMutableAttributedString *unpainted = [attributedString mutableCopy];
  NSRange range = NSMakeRange(0, unpainted.length);

  [unpainted beginEditing];
  [unpainted addAttribute:NSForegroundColorAttributeName value:UIColor.clearColor range:range];
  [unpainted addAttribute:NSBackgroundColorAttributeName value:UIColor.clearColor range:range];
  [unpainted removeAttribute:NSUnderlineStyleAttributeName range:range];
  [unpainted removeAttribute:NSStrikethroughStyleAttributeName range:range];
  [unpainted removeAttribute:NSShadowAttributeName range:range];
  [unpainted endEditing];

  return unpainted;
}

/*
 * A non-editable `UITextView` that provides selection for a paragraph, and
 * nothing else.
 *
 * It is created with the very `NSTextContainer` that `RCTTextLayoutManager`
 * measured the paragraph with, so its layout matches the measurement by
 * construction rather than by coincidence. UIKit performs the selection; it
 * never performs the layout, and it never paints the text.
 */
@interface RCTSelectableTextView : UITextView

/*
 * The paragraph as it is painted, before `RCTUnpaintedAttributedString` strips
 * it. The text view lays the stripped copy out, so `copy:` must read the range
 * from this string instead, or the pasteboard receives clear text with no
 * decorations. Both strings hold the same characters, so the range maps
 * directly from one to the other.
 */
@property (nonatomic, copy, nullable) NSAttributedString *sourceAttributedText;

@end

@implementation RCTSelectableTextView {
  UITapGestureRecognizer *_dismissSelectionRecognizer;
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
  }
  return self;
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
  // The tap still reaches the component the user tapped.
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

@interface RCTParagraphComponentView ()
@end

@implementation RCTParagraphComponentView {
  ParagraphAttributes _paragraphAttributes;
  RCTParagraphComponentAccessibilityProvider *_accessibilityProvider;
  RCTParagraphTextView *_textView;
  CGRect _textLayoutFrame;
#if !TARGET_OS_TV
  // Selection state. `_selectableTextView` is non-nil only while `selectable` is set.
  RCTSelectableTextView *_selectableTextView;
  RCTTextLayoutManager *_selectionLayoutManager;
  NSAttributedString *_selectionRenderedText;
  CGSize _selectionRenderedSize;
#endif
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = ParagraphShadowNode::defaultSharedProps();

    self.opaque = NO;
    _textView = [RCTParagraphTextView new];
    _textView.backgroundColor = UIColor.clearColor;
    _textView.drawingFrame = self.bounds;
    self.contentView = _textView;
  }

  return self;
}

- (NSString *)description
{
  NSString *superDescription = [super description];

  // Cutting the last `>` character.
  if (superDescription.length > 0 && [superDescription characterAtIndex:superDescription.length - 1] == '>') {
    superDescription = [superDescription substringToIndex:superDescription.length - 1];
  }

  return [NSString stringWithFormat:@"%@; attributedText = %@>", superDescription, self.attributedText];
}

- (NSAttributedString *_Nullable)attributedText
{
  if (!_textView.state) {
    return nil;
  }

  return RCTNSAttributedStringFromAttributedString(_textView.state->getData().attributedString);
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ParagraphComponentDescriptor>();
}

+ (std::vector<facebook::react::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders
{
  return {
      concreteComponentDescriptorProvider<RawTextComponentDescriptor>(),
      concreteComponentDescriptorProvider<TextComponentDescriptor>()};
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldParagraphProps = static_cast<const ParagraphProps &>(*_props);
  const auto &newParagraphProps = static_cast<const ParagraphProps &>(*props);

  _paragraphAttributes = newParagraphProps.paragraphAttributes;
  _textView.paragraphAttributes = _paragraphAttributes;

  if (newParagraphProps.isSelectable != oldParagraphProps.isSelectable) {
    if (newParagraphProps.isSelectable) {
      [self enableContextMenu];
    } else {
      [self disableContextMenu];
    }
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  _textView.state = std::static_pointer_cast<const ParagraphShadowNode::ConcreteState>(state);
  [_textView setNeedsDisplay];
#if !TARGET_OS_TV
  _selectionRenderedText = nil;
#endif
  [self setNeedsLayout];

  // If the attributed string has changed, we need to notify the accessibility system that something changed,
  // otherwise it may hold on to stale values (this happens most often when an element is updated async)
  // https://github.com/react/react-native/issues/58145
  if (state && oldState) {
    const auto &newData = std::static_pointer_cast<const ParagraphShadowNode::ConcreteState>(state)->getData();
    const auto &oldData = std::static_pointer_cast<const ParagraphShadowNode::ConcreteState>(oldState)->getData();
    if (!newData.attributedString.isContentEqual(oldData.attributedString)) {
      UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
    }
  }
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  // Using stored `_layoutMetrics` as `oldLayoutMetrics` here to avoid
  // re-applying individual sub-values which weren't changed.
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:_layoutMetrics];
  _textView.layoutMetrics = _layoutMetrics;
  _textLayoutFrame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());
  [_textView setNeedsDisplay];
  [self setNeedsLayout];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _textView.state = nullptr;
  _accessibilityProvider = nil;
#if !TARGET_OS_TV
  [self disableContextMenu];
#endif
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  CGRect textViewFrame = self.bounds;
  CGRect drawingFrame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

  if (ReactNativeFeatureFlags::enableIOSCompressedTextFrameAdjustment() && _textView.state &&
      drawingFrame.size.height > 0) {
    const auto &stateData = _textView.state->getData();
    auto textLayoutManager = stateData.layoutManager.lock();
    if (textLayoutManager) {
      RCTTextLayoutManager *nativeTextLayoutManager =
          (RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());
      CGRect drawingContainerFrame = drawingFrame;
      drawingFrame = [nativeTextLayoutManager drawingFrameForAttributedString:stateData.attributedString
                                                          paragraphAttributes:_paragraphAttributes
                                                                        frame:drawingFrame
                                                               containerFrame:&drawingContainerFrame];
      textViewFrame = CGRectUnion(textViewFrame, drawingContainerFrame);
    }
  }

  _textLayoutFrame = drawingFrame;
  _textView.frame = textViewFrame;
  _textView.drawingFrame = CGRectOffset(drawingFrame, -textViewFrame.origin.x, -textViewFrame.origin.y);

#if !TARGET_OS_TV
  const auto &paragraphProps = static_cast<const ParagraphProps &>(*_props);
  if (paragraphProps.isSelectable) {
    // `drawingFrame` is the frame `RCTParagraphTextView` draws the glyphs into,
    // compression adjustment included. The selection must use the same frame,
    // or the selection rects sit away from the glyphs they select.
    [self updateSelectableTextViewWithDrawingFrame:drawingFrame];
  }
#endif
}

#pragma mark - Accessibility

- (NSString *)accessibilityLabel
{
  NSString *label = super.accessibilityLabel;
  if ([label length] > 0) {
    return label;
  }
  return self.attributedText.string;
}

- (NSString *)accessibilityLabelForCoopting
{
  return self.accessibilityLabel;
}

- (BOOL)isAccessibilityElement
{
  // All accessibility functionality of the component is implemented in `accessibilityElements` method below.
  // Hence to avoid calling all other methods from `UIAccessibilityContainer` protocol (most of them have default
  // implementations), we return here `NO`.
  return NO;
}

- (NSArray *)accessibilityElements
{
  const auto &paragraphProps = static_cast<const ParagraphProps &>(*_props);

  // If the component is not `accessible`, we return an empty array.
  // We do this because logically all nested <Text> components represent the content of the <Paragraph> component;
  // in other words, all nested <Text> components individually have no sense without the <Paragraph>.
  if (!_textView.state || !paragraphProps.accessible) {
    return [NSArray new];
  }

  auto &data = _textView.state->getData();

  if (![_accessibilityProvider isUpToDate:data.attributedString]) {
    auto textLayoutManager = data.layoutManager.lock();
    if (textLayoutManager) {
      RCTTextLayoutManager *nativeTextLayoutManager =
          (RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());
      CGRect frame = _textLayoutFrame;
      _accessibilityProvider =
          [[RCTParagraphComponentAccessibilityProvider alloc] initWithString:data.attributedString
                                                               layoutManager:nativeTextLayoutManager
                                                         paragraphAttributes:data.paragraphAttributes
                                                                       frame:frame
                                                                        view:self];
    }
  }

  NSArray<UIAccessibilityElement *> *elements = _accessibilityProvider.accessibilityElements;
  if ([elements count] > 0) {
    elements[0].isAccessibilityElement =
        elements[0].accessibilityTraits & UIAccessibilityTraitLink || ![self isAccessibilityCoopted];
  }
  return elements;
}

- (BOOL)isAccessibilityCoopted
{
  UIView *ancestor = self.superview;
  NSMutableSet<UIView *> *cooptingCandidates = [NSMutableSet new];
  while (ancestor) {
    if ([ancestor isKindOfClass:[RCTViewComponentView class]]) {
      if ([((RCTViewComponentView *)ancestor) accessibilityLabelForCoopting]) {
        // We found a label above us. That would be coopted before we would be
        return NO;
      } else if ([((RCTViewComponentView *)ancestor) wantsToCooptLabel]) {
        // We found an view that is looking to coopt a label below it
        [cooptingCandidates addObject:ancestor];
      }

      NSArray *elements = ancestor.accessibilityElements;
      if ([elements count] > 0 && [cooptingCandidates count] > 0) {
        for (NSObject *element in elements) {
          if ([element isKindOfClass:[UIView class]] && [cooptingCandidates containsObject:((UIView *)element)]) {
            return YES;
          }
        }
      }
    } else if (![ancestor isKindOfClass:[RCTViewComponentView class]] && ancestor.accessibilityLabel) {
      // Same as above, for UIView case. Cannot call this on RCTViewComponentView
      // as it is recursive and quite expensive.
      return NO;
    }
    ancestor = ancestor.superview;
  }

  return NO;
}

- (UIAccessibilityTraits)accessibilityTraits
{
  return [super accessibilityTraits] | UIAccessibilityTraitStaticText;
}

#pragma mark - RCTTouchableComponentViewProtocol

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  const auto &state = _textView.state;
  if (!state) {
    return _eventEmitter;
  }

  const auto &stateData = state->getData();
  auto textLayoutManager = stateData.layoutManager.lock();

  if (!textLayoutManager) {
    return _eventEmitter;
  }

  RCTTextLayoutManager *nativeTextLayoutManager =
      (RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());
  CGRect frame = _textLayoutFrame;

  auto eventEmitter = [nativeTextLayoutManager getEventEmitterWithAttributeString:stateData.attributedString
                                                              paragraphAttributes:_paragraphAttributes
                                                                            frame:frame
                                                                          atPoint:point];

  if (!eventEmitter) {
    return _eventEmitter;
  }

  assert(std::dynamic_pointer_cast<const TouchEventEmitter>(eventEmitter));
  return std::static_pointer_cast<const TouchEventEmitter>(eventEmitter);
}

#pragma mark - Context Menu

#if !TARGET_OS_TV
/*
 * Selection is provided by a `UITextView` laid out with the paragraph's own
 * TextKit stack, which gives the platform behaviour users expect: long press to
 * select a word, drag handles to extend the range and an edit menu that copies
 * only what is selected.
 */
- (void)enableContextMenu
{
  if (_selectionLayoutManager == nil) {
    _selectionLayoutManager = [RCTTextLayoutManager new];
  }
  _selectionRenderedText = nil;
  [self setNeedsLayout];
}

- (void)disableContextMenu
{
  [self removeSelectableTextView];
  // Nothing else uses it while the paragraph is not selectable.
  _selectionLayoutManager = nil;
}

- (void)removeSelectableTextView
{
  [_selectableTextView removeFromSuperview];
  _selectableTextView = nil;
  _selectionRenderedText = nil;
  _selectionRenderedSize = CGSizeZero;
}

/*
 * Builds or repositions the selectable text view. A `UITextView` binds its text
 * container at initialisation, so it is rebuilt only when the text or the
 * available size actually changes.
 */
- (void)updateSelectableTextViewWithDrawingFrame:(CGRect)drawingFrame
{
  NSAttributedString *attributedText = self.attributedText;
  if (attributedText.length == 0 || CGRectIsEmpty(drawingFrame)) {
    [self removeSelectableTextView];
    return;
  }

  BOOL needsRebuild = _selectableTextView == nil ||
      ![attributedText isEqualToAttributedString:_selectionRenderedText] ||
      !CGSizeEqualToSize(drawingFrame.size, _selectionRenderedSize);

  if (needsRebuild) {
    NSTextStorage *textStorage =
        [_selectionLayoutManager textStorageForNSAttributedString:RCTUnpaintedAttributedString(attributedText)
                                              paragraphAttributes:_paragraphAttributes
                                                             size:drawingFrame.size];
    NSTextContainer *textContainer = textStorage.layoutManagers.firstObject.textContainers.firstObject;

    [_selectableTextView removeFromSuperview];
    _selectableTextView = [[RCTSelectableTextView alloc] initWithFrame:drawingFrame textContainer:textContainer];
    // Under the drawn paragraph, which is how a native text view stacks the two:
    // UIKit paints the selection, and the glyphs go on top of it. The drawn
    // paragraph passes touches through, so the text view still gets them.
    UIView *container = _textView.superview;
    if (container != nil) {
      [container insertSubview:_selectableTextView belowSubview:_textView];
    } else {
      [self addSubview:_selectableTextView];
    }

    _selectionRenderedText = [attributedText copy];
    _selectionRenderedSize = drawingFrame.size;
  }

  _selectableTextView.frame = drawingFrame;
  // Copy reads the range from the painted string, not from the stripped copy
  // the text view lays out.
  _selectableTextView.sourceAttributedText = attributedText;
}

- (BOOL)canBecomeFirstResponder
{
  // While selectable, `_selectableTextView` is the responder that owns the selection.
  return NO;
}

#else
- (void)enableContextMenu
{
}

- (void)disableContextMenu
{
}
#endif

@end

Class<RCTComponentViewProtocol> RCTParagraphCls(void)
{
  return RCTParagraphComponentView.class;
}

@implementation RCTParagraphTextView {
  CAShapeLayer *_highlightLayer;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  return nil;
}

- (void)drawRect:(CGRect)rect
{
  if (!_state) {
    return;
  }

  const auto &stateData = _state->getData();
  auto textLayoutManager = stateData.layoutManager.lock();
  if (!textLayoutManager) {
    return;
  }

  RCTTextLayoutManager *nativeTextLayoutManager =
      (RCTTextLayoutManager *)unwrapManagedObject(textLayoutManager->getNativeTextLayoutManager());

  CGRect frame = _drawingFrame;

  [nativeTextLayoutManager drawAttributedString:stateData.attributedString
                            paragraphAttributes:_paragraphAttributes
                                          frame:frame
                              drawHighlightPath:^(UIBezierPath *highlightPath) {
                                if (highlightPath) {
                                  if (!self->_highlightLayer) {
                                    self->_highlightLayer = [CAShapeLayer layer];
                                    self->_highlightLayer.fillColor = [UIColor colorWithWhite:0 alpha:0.25].CGColor;
                                    [self.layer addSublayer:self->_highlightLayer];
                                  }
                                  self->_highlightLayer.position = frame.origin;
                                  self->_highlightLayer.path = highlightPath.CGPath;
                                } else {
                                  [self->_highlightLayer removeFromSuperlayer];
                                  self->_highlightLayer = nil;
                                }
                              }];
}

@end
