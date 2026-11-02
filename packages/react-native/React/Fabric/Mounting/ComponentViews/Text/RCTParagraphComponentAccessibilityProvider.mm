/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTParagraphComponentAccessibilityProvider.h"

#import <Foundation/Foundation.h>
#import <react/renderer/components/text/ParagraphProps.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/renderer/textlayoutmanager/RCTTextLayoutManager.h>
#import <react/renderer/textlayoutmanager/TextLayoutManager.h>

#import "RCTAccessibilityElement.h"
#import "RCTConversions.h"
#import "RCTFabricComponentsPlugins.h"
#import "RCTLocalizationProvider.h"

using namespace facebook::react;

@implementation RCTParagraphComponentAccessibilityProvider {
  NSMutableArray<UIAccessibilityElement *> *_accessibilityElements;
  AttributedString _attributedString;
  RCTTextLayoutManager *_layoutManager;
  ParagraphAttributes _paragraphAttributes;
  CGRect _frame;
  __weak UIView *_view;
}

- (instancetype)initWithString:(facebook::react::AttributedString)attributedString
                 layoutManager:(RCTTextLayoutManager *)layoutManager
           paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                         frame:(CGRect)frame
                          view:(UIView *)view
{
  if (self = [super init]) {
    _attributedString = attributedString;
    _layoutManager = layoutManager;
    _paragraphAttributes = paragraphAttributes;
    _frame = frame;
    _view = view;
  }
  return self;
}

- (NSArray<UIAccessibilityElement *> *)accessibilityElements
{
  if (_accessibilityElements) {
    return _accessibilityElements;
  }

  __block NSInteger numberOfLinks = 0;
  __block NSInteger numberOfButtons = 0;
  __block NSString *truncatedText;
  // build an array of the accessibleElements
  NSMutableArray<UIAccessibilityElement *> *elements = [NSMutableArray new];

  NSString *accessibilityLabel = _view.accessibilityLabel;
  if (accessibilityLabel.length == 0) {
    accessibilityLabel = RCTNSStringFromString(_attributedString.getString());
  }
  // add first element has the text for the whole textview in order to read out the whole text
  RCTAccessibilityElement *firstElement = [[RCTAccessibilityElement alloc] initWithAccessibilityContainer:_view];
  firstElement.isAccessibilityElement = YES;
  firstElement.accessibilityTraits = _view.accessibilityTraits;
  firstElement.accessibilityLabel = accessibilityLabel;
  firstElement.accessibilityLanguage = _view.accessibilityLanguage;
  [firstElement setAccessibilityActivationPoint:CGPointMake(
                                                    firstElement.accessibilityFrame.origin.x + 1.0,
                                                    firstElement.accessibilityFrame.origin.y + 1.0)];

  [elements addObject:firstElement];

  // The rects below are relative to the text, which starts after the padding.
  const CGPoint textOrigin = _frame.origin;
  const CGPoint textOriginOnScreen = CGPointMake(
      firstElement.accessibilityFrame.origin.x + textOrigin.x, firstElement.accessibilityFrame.origin.y + textOrigin.y);

  // add additional elements for those parts of text with embedded link so VoiceOver could specially recognize links
  [_layoutManager getRectWithAttributedString:_attributedString
                          paragraphAttributes:_paragraphAttributes
                            dataDetectorTypes:_dataDetectorTypes
                           enumerateAttribute:RCTTextAttributesAccessibilityRoleAttributeName
                                        frame:_frame
                                   usingBlock:^(CGRect fragmentRect, NSString *_Nonnull fragmentText, NSString *value) {
                                     if ((![value isEqualToString:@"button"] && ![value isEqualToString:@"link"])) {
                                       return;
                                     }

                                     if ([fragmentText isEqualToString:firstElement.accessibilityLabel]) {
                                       if ([value isEqualToString:@"link"]) {
                                         firstElement.accessibilityTraits |= UIAccessibilityTraitLink;
                                         firstElement.accessibilityActivationPoint = CGPointMake(
                                             textOriginOnScreen.x + CGRectGetMidX(fragmentRect),
                                             textOriginOnScreen.y + CGRectGetMidY(fragmentRect));
                                       } else if ([value isEqualToString:@"button"]) {
                                         firstElement.accessibilityTraits |= UIAccessibilityTraitButton;
                                       }
                                       // The fragment is the entire paragraph. This is handled as `firstElement`.
                                       return;
                                     }

                                     if ([value isEqualToString:@"button"] &&
                                         ([fragmentText isEqualToString:@"See Less"] ||
                                          [fragmentText isEqualToString:@"See More"])) {
                                       truncatedText = fragmentText;
                                       return;
                                     }
                                     RCTAccessibilityElement *element =
                                         [[RCTAccessibilityElement alloc] initWithAccessibilityContainer:self->_view];
                                     element.isAccessibilityElement = YES;
                                     if ([value isEqualToString:@"link"]) {
                                       element.accessibilityTraits = UIAccessibilityTraitLink;
                                       numberOfLinks++;
                                     } else if ([value isEqualToString:@"button"]) {
                                       element.accessibilityTraits = UIAccessibilityTraitButton;
                                       numberOfButtons++;
                                     }
                                     element.accessibilityLabel = fragmentText;
                                     element.frameInContainerSpace =
                                         CGRectOffset(fragmentRect, textOrigin.x, textOrigin.y);
                                     [elements addObject:element];
                                   }];

  if (numberOfLinks > 0 || numberOfButtons > 0) {
    __block NSInteger indexOfLink = 1;
    __block NSInteger indexOfButton = 1;
    [elements enumerateObjectsUsingBlock:^(UIAccessibilityElement *element, NSUInteger idx, BOOL *_Nonnull stop) {
      if (idx == 0) {
        return;
      }
      if (element.accessibilityTraits & UIAccessibilityTraitLink) {
        NSString *test = [RCTLocalizationProvider RCTLocalizedString:@"Link %ld of %ld."
                                                     withDescription:@"index of the link"];
        element.accessibilityHint = [NSString stringWithFormat:test, (long)indexOfLink++, (long)numberOfLinks];
      } else {
        element.accessibilityHint =
            [NSString stringWithFormat:[RCTLocalizationProvider RCTLocalizedString:@"Button %ld of %ld."
                                                                   withDescription:@"index of the button"],
                                       (long)indexOfButton++,
                                       (long)numberOfButtons];
      }
    }];
  }

  if (numberOfLinks > 0 && numberOfButtons > 0) {
    firstElement.accessibilityHint =
        [RCTLocalizationProvider RCTLocalizedString:@"Links and buttons are found, swipe to move to them."
                                    withDescription:@"accessibility hint for links and buttons inside text"];

  } else if (numberOfLinks > 0) {
    NSString *firstElementHint = (numberOfLinks == 1)
        ? [RCTLocalizationProvider RCTLocalizedString:@"One link found, swipe to move to the link."
                                      withDescription:@"accessibility hint for one link inside text"]
        : [NSString stringWithFormat:[RCTLocalizationProvider
                                         RCTLocalizedString:@"%ld links found, swipe to move to the first link."
                                            withDescription:@"accessibility hint for multiple links inside text"],
                                     (long)numberOfLinks];
    firstElement.accessibilityHint = firstElementHint;

  } else if (numberOfButtons > 0) {
    NSString *firstElementHint = (numberOfButtons == 1)
        ? [RCTLocalizationProvider RCTLocalizedString:@"One button found, swipe to move to the button."
                                      withDescription:@"accessibility hint for one button inside text"]
        : [NSString stringWithFormat:[RCTLocalizationProvider
                                         RCTLocalizedString:@"%ld buttons found, swipe to move to the first button."
                                            withDescription:@"accessibility hint for multiple buttons inside text"],
                                     (long)numberOfButtons];
    firstElement.accessibilityHint = firstElementHint;
  }

  if (truncatedText && truncatedText.length > 0) {
    firstElement.accessibilityHint = (numberOfLinks > 0 || numberOfButtons > 0)
        ? [NSString
              stringWithFormat:@"%@ %@",
                               firstElement.accessibilityHint,
                               [RCTLocalizationProvider
                                   RCTLocalizedString:[NSString stringWithFormat:@"Double tap to %@.", truncatedText]
                                      withDescription:@"accessibility hint for truncated text with links or buttons"]]
        : [RCTLocalizationProvider RCTLocalizedString:[NSString stringWithFormat:@"Double tap to %@.", truncatedText]
                                      withDescription:@"accessibility hint for truncated text"];
  }

  // add accessible element for truncation attributed string for automation purposes only
  _accessibilityElements = elements;
  return _accessibilityElements;
}

- (BOOL)isUpToDate:(facebook::react::AttributedString)currentAttributedString
{
  return currentAttributedString == _attributedString;
}

@end
