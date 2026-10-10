/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParagraphComponentView.h"
#import "RCTParagraphComponentAccessibilityProvider.h"
#import "RCTSelectableTextView+Internal.h"

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
@interface RCTParagraphComponentView () <UIEditMenuInteractionDelegate>

@property (nonatomic, nullable) UIEditMenuInteraction *editMenuInteraction API_AVAILABLE(ios(16.0));

@end
#else
@interface RCTParagraphComponentView ()
@end
#endif

@implementation RCTParagraphComponentView {
  ParagraphAttributes _paragraphAttributes;
  RCTParagraphComponentAccessibilityProvider *_accessibilityProvider;
  UILongPressGestureRecognizer *_longPressGestureRecognizer;
  RCTParagraphTextView *_textView;
  CGRect _textLayoutFrame;
#if !TARGET_OS_TV
  RCTSelectableTextView *_selectableTextView;
  RCTTextLayoutManager *_selectionLayoutManager;
  NSAttributedString *_selectionRenderedText;
  CGSize _selectionRenderedSize;
  BOOL _selectableTextViewNeedsUpdate;
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
  [_textView setNeedsDisplay];
}

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask
{
  [super finalizeUpdates:updateMask];
  if ((updateMask & (RNComponentViewUpdateMaskState | RNComponentViewUpdateMaskLayoutMetrics)) != 0) {
    [self _updateTextViewFrame];
  }
#if !TARGET_OS_TV
  // `updateProps:` runs before the state and the layout of the same mutation,
  // and a change of `selectable` alone computes no frames. So the text view is
  // built here, after all of the mutation, from the drawing frame computed last.
  if (_selectableTextViewNeedsUpdate) {
    _selectableTextViewNeedsUpdate = NO;
    [self updateSelectableTextViewWithDrawingFrame:_textLayoutFrame];
  }
#endif
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _textView.state = nullptr;
  _accessibilityProvider = nil;
#if !TARGET_OS_TV
  // Recycling removes only the selection text view. The long press stays,
  // because the view keeps its `_props`: when the next paragraph is selectable
  // too, `updateProps:` sees no change and does not add the long press again.
  if (ReactNativeFeatureFlags::enableIOSPartialTextSelection()) {
    [self disableTextSelection];
  }
#endif
}

- (void)_updateTextViewFrame
{
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
  if (paragraphProps.isSelectable && ReactNativeFeatureFlags::enableIOSPartialTextSelection()) {
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
#if !TARGET_OS_TV
  // A drag of a selection handle starts on the glyphs the handle sits on, and
  // that is often a pressable <Text>. Adjusting a selection must not press it.
  // `resignFirstResponder` empties the range, so an empty range means no
  // selection is on screen and an ordinary press goes through.
  if (_selectableTextView.selectedRange.length > 0) {
    return nullptr;
  }
#endif

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
- (void)enableContextMenu
{
  if (ReactNativeFeatureFlags::enableIOSPartialTextSelection()) {
    [self enableTextSelection];
    return;
  }

  _longPressGestureRecognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self
                                                                              action:@selector(handleLongPress:)];

  if (@available(iOS 16.0, *)) {
    _editMenuInteraction = [[UIEditMenuInteraction alloc] initWithDelegate:self];
    [self addInteraction:_editMenuInteraction];
  }
  [self addGestureRecognizer:_longPressGestureRecognizer];
}

- (void)disableContextMenu
{
  if (ReactNativeFeatureFlags::enableIOSPartialTextSelection()) {
    [self disableTextSelection];
    return;
  }

  [self removeGestureRecognizer:_longPressGestureRecognizer];
  if (@available(iOS 16.0, *)) {
    [self removeInteraction:_editMenuInteraction];
    _editMenuInteraction = nil;
  }
  _longPressGestureRecognizer = nil;
}

- (void)handleLongPress:(UILongPressGestureRecognizer *)gesture
{
  if (@available(iOS 16.0, macCatalyst 16.0, *)) {
    CGPoint location = [gesture locationInView:self];
    UIEditMenuConfiguration *config = [UIEditMenuConfiguration configurationWithIdentifier:nil sourcePoint:location];
    if (_editMenuInteraction) {
      [_editMenuInteraction presentEditMenuWithConfiguration:config];
    }
  } else {
    UIMenuController *menuController = [UIMenuController sharedMenuController];

    if (menuController.isMenuVisible) {
      return;
    }

    [menuController showMenuFromView:self rect:self.bounds];
  }
}

- (BOOL)canBecomeFirstResponder
{
  // With partial selection, `_selectableTextView` is the responder that owns the selection.
  if (ReactNativeFeatureFlags::enableIOSPartialTextSelection()) {
    return NO;
  }

  const auto &paragraphProps = static_cast<const ParagraphProps &>(*_props);
  return paragraphProps.isSelectable;
}

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  // With partial selection, `_selectableTextView` copies the selected range.
  // This class implements `copy:` for the long-press menu, so the inherited
  // answer for `copy:` is YES and would make the paragraph copy all its text.
  if (ReactNativeFeatureFlags::enableIOSPartialTextSelection()) {
    return action != @selector(copy:) && [super canPerformAction:action withSender:sender];
  }

  const auto &paragraphProps = static_cast<const ParagraphProps &>(*_props);

  if (paragraphProps.isSelectable && action == @selector(copy:)) {
    return YES;
  }

  return [self.nextResponder canPerformAction:action withSender:sender];
}

- (void)copy:(id)sender
{
  NSAttributedString *attributedText = self.attributedText;

  NSMutableDictionary *item = [NSMutableDictionary new];

  NSData *rtf = [attributedText dataFromRange:NSMakeRange(0, attributedText.length)
                           documentAttributes:@{NSDocumentTypeDocumentAttribute : NSRTFDTextDocumentType}
                                        error:nil];

  if (rtf) {
    [item setObject:rtf forKey:(id)kUTTypeFlatRTFD];
  }

  [item setObject:attributedText.string forKey:(id)kUTTypeUTF8PlainText];

  UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
  pasteboard.items = @[ item ];
}

#pragma mark - Text Selection

/*
 * Selection is provided by a `UITextView` laid out with the paragraph's own
 * TextKit stack, which gives the platform behaviour users expect: long press to
 * select a word, drag handles to extend the range and an edit menu that copies
 * only what is selected.
 */
- (void)enableTextSelection
{
  _selectableTextViewNeedsUpdate = YES;
}

- (void)disableTextSelection
{
  _selectableTextViewNeedsUpdate = NO;
  [self removeSelectableTextView];
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
 * A `UITextView` binds its text container at initialisation, so the selectable
 * text view is rebuilt only when the text or the available size changes.
 */
- (void)updateSelectableTextViewWithDrawingFrame:(CGRect)drawingFrame
{
  NSAttributedString *attributedText = self.attributedText;
  if (attributedText.length == 0 || CGRectIsEmpty(drawingFrame)) {
    [self removeSelectableTextView];
    return;
  }

  // The layout string decides the rebuild, and the painted string does not. A
  // press on a nested pressable <Text> paints a highlight, which changes the
  // painted string. A rebuild in the middle of that touch destroys the text
  // view before its long press starts, so the paragraph never selects.
  NSAttributedString *layoutText = RCTUnpaintedAttributedString(attributedText);

  BOOL needsRebuild = _selectableTextView == nil || ![layoutText isEqualToAttributedString:_selectionRenderedText] ||
      !CGSizeEqualToSize(drawingFrame.size, _selectionRenderedSize);

  if (needsRebuild) {
    if (_selectionLayoutManager == nil) {
      _selectionLayoutManager = [RCTTextLayoutManager new];
    }
    NSTextStorage *textStorage = [_selectionLayoutManager textStorageForNSAttributedString:layoutText
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

    _selectionRenderedText = [layoutText copy];
    _selectionRenderedSize = drawingFrame.size;
  }

  _selectableTextView.frame = drawingFrame;
  _selectableTextView.sourceAttributedText = attributedText;
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
