/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <react/renderer/attributedstring/AttributedString.h>
#import <react/renderer/attributedstring/ParagraphAttributes.h>
#import <react/renderer/core/LayoutConstraints.h>
#import <react/renderer/textlayoutmanager/TextLayoutContext.h>
#import <react/renderer/textlayoutmanager/TextMeasureCache.h>

NS_ASSUME_NONNULL_BEGIN

/**
 @abstract Enumeration block for text fragments.
*/

using RCTTextLayoutFragmentEnumerationBlock =
    void (^)(CGRect fragmentRect, NSString *_Nonnull fragmentText, NSString *value);

/**
 * iOS-specific TextLayoutManager
 */
@interface RCTTextLayoutManager : NSObject

- (facebook::react::TextMeasurement)measureAttributedString:(facebook::react::AttributedString)attributedString
                                        paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                              layoutContext:(facebook::react::TextLayoutContext)layoutContext
                                          layoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints;

- (facebook::react::TextMeasurement)measureNSAttributedString:(NSAttributedString *)attributedString
                                          paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                                layoutContext:(facebook::react::TextLayoutContext)layoutContext
                                            layoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints;

- (void)drawAttributedString:(facebook::react::AttributedString)attributedString
         paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame
           drawHighlightPath:(void (^_Nullable)(UIBezierPath *highlightPath))block;

- (facebook::react::LinesMeasurements)getLinesForAttributedString:(facebook::react::AttributedString)attributedString
                                              paragraphAttributes:
                                                  (facebook::react::ParagraphAttributes)paragraphAttributes
                                                             size:(CGSize)size;

- (std::shared_ptr<const facebook::react::EventEmitter>)
    getEventEmitterWithAttributeString:(facebook::react::AttributedString)attributedString
                   paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                 frame:(CGRect)frame
                               atPoint:(CGPoint)point;

- (void)getRectWithAttributedString:(facebook::react::AttributedString)attributedString
                paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                 enumerateAttribute:(NSString *)enumerateAttribute
                              frame:(CGRect)frame
                         usingBlock:(RCTTextLayoutFragmentEnumerationBlock)block;

@end

NS_ASSUME_NONNULL_END
