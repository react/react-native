/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParagraphComponentView.h"
#import "RCTParagraphComponentAccessibilityProvider.h"

#import <MobileCoreServices/UTCoreTypes.h>
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

// ParagraphTextView is an auxiliary view we set as contentView so the drawing
// can happen on top of the layers manipulated by RCTViewComponentView (the parent view)
@interface RCTParagraphTextView : UIView

@property (nonatomic) ParagraphShadowNode::ConcreteState::Shared state;
@property (nonatomic) ParagraphAttributes paragraphAttributes;
@property (nonatomic) LayoutMetrics layoutMetrics;

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
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = ParagraphShadowNode::defaultSharedProps();

    self.opaque = NO;
    _textView = [RCTParagraphTextView new];
    _textView.backgroundColor = UIColor.clearColor;
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
  [self setNeedsLayout];
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  // Using stored `_layoutMetrics` as `oldLayoutMetrics` here to avoid
  // re-applying individual sub-values which weren't changed.
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:_layoutMetrics];
  _textView.layoutMetrics = _layoutMetrics;
  [_textView setNeedsDisplay];
  [self setNeedsLayout];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _textView.state = nullptr;
  _accessibilityProvider = nil;
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  _textView.frame = self.bounds;
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
      CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());
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
  CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

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
  const auto &paragraphProps = static_cast<const ParagraphProps &>(*_props);
  return paragraphProps.isSelectable;
}

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
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

  CGRect frame = RCTCGRectFromRect(_layoutMetrics.getContentFrame());

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
