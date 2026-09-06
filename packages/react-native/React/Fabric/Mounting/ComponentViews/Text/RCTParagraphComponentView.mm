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
 * A non-editable `UITextView` used to render a selectable paragraph.
 *
 * It is created with the very `NSTextContainer` that `RCTTextLayoutManager`
 * measured the paragraph with, so its layout matches the measurement by
 * construction rather than by coincidence. UIKit performs the selection; it
 * never performs the layout.
 */
@interface RCTSelectableTextView : UITextView
@end

@implementation RCTSelectableTextView

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
    [self updateSelectableTextViewWithFrame:RCTCGRectFromRect(_layoutMetrics.getContentFrame())];
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
  [_selectableTextView removeFromSuperview];
  _selectableTextView = nil;
  _selectionRenderedText = nil;
  _selectionRenderedSize = CGSizeZero;
  _textView.hidden = NO;
}

/*
 * Builds or repositions the selectable text view. A `UITextView` binds its text
 * container at initialisation, so it is rebuilt only when the text or the
 * available size actually changes.
 */
- (void)updateSelectableTextViewWithFrame:(CGRect)contentFrame
{
  NSAttributedString *attributedText = self.attributedText;
  if (attributedText == nil || CGRectIsEmpty(contentFrame)) {
    [_selectableTextView removeFromSuperview];
    _selectableTextView = nil;
    _selectionRenderedText = nil;
    _textView.hidden = NO;
    return;
  }

  BOOL needsRebuild = _selectableTextView == nil ||
      ![attributedText isEqualToAttributedString:_selectionRenderedText] ||
      !CGSizeEqualToSize(contentFrame.size, _selectionRenderedSize);

  if (needsRebuild) {
    NSTextStorage *textStorage = [_selectionLayoutManager textStorageForNSAttributedString:attributedText
                                                                       paragraphAttributes:_paragraphAttributes
                                                                                      size:contentFrame.size];
    NSTextContainer *textContainer = textStorage.layoutManagers.firstObject.textContainers.firstObject;

    [_selectableTextView removeFromSuperview];
    _selectableTextView = [[RCTSelectableTextView alloc] initWithFrame:contentFrame textContainer:textContainer];
    [self addSubview:_selectableTextView];

    _selectionRenderedText = [attributedText copy];
    _selectionRenderedSize = contentFrame.size;
  }

  _selectableTextView.frame = contentFrame;
  // The text view renders the paragraph, so the drawn copy must stay hidden.
  _textView.hidden = YES;
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
