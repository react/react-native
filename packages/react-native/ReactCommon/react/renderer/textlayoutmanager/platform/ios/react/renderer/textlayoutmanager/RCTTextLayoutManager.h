/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/cxxstableapi/FrameworksGuard.h>

#import <UIKit/UIKit.h>

#import <React/RendererCore.h>
#import <react/renderer/attributedstring/AttributedString.h>
#import <react/renderer/attributedstring/ParagraphAttributes.h>
#import <react/renderer/textlayoutmanager/TextLayoutContext.h>
#import <react/renderer/textlayoutmanager/TextMeasureCache.h>

NS_ASSUME_NONNULL_BEGIN

/**
 @abstract Enumeration block for text fragments.
*/

using RCTTextLayoutFragmentEnumerationBlock =
    void (^)(CGRect fragmentRect, NSString *_Nonnull fragmentText, NSString *value);

/**
 * The kinds of data to make tappable, as chosen by the `dataDetectorType` prop of `Text`.
 */
typedef NS_OPTIONS(NSUInteger, RCTTextDataDetectorTypes) {
  RCTTextDataDetectorTypeNone = 0,
  RCTTextDataDetectorTypePhoneNumber = 1 << 0,
  RCTTextDataDetectorTypeLink = 1 << 1,
  RCTTextDataDetectorTypeEmail = 1 << 2,
};

/**
 * iOS-specific TextLayoutManager
 */
@interface RCTTextLayoutManager : NSObject

- (facebook::react::TextMeasurement)measureAttributedString:(const facebook::react::AttributedString &)attributedString
                                        paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                              layoutContext:(facebook::react::TextLayoutContext)layoutContext
                                          layoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints;

- (facebook::react::TextMeasurement)measureNSAttributedString:(NSAttributedString *)attributedString
                                          paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                                layoutContext:(facebook::react::TextLayoutContext)layoutContext
                                            layoutConstraints:(facebook::react::LayoutConstraints)layoutConstraints;

- (void)drawAttributedString:(const facebook::react::AttributedString &)attributedString
         paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                       frame:(CGRect)frame
           drawHighlightPath:(void (^_Nullable)(UIBezierPath *highlightPath))block;

- (void)drawAttributedString:(const facebook::react::AttributedString &)attributedString
         paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
           dataDetectorTypes:(RCTTextDataDetectorTypes)dataDetectorTypes
                       frame:(CGRect)frame
           drawHighlightPath:(void (^_Nullable)(UIBezierPath *highlightPath))block;

- (facebook::react::LinesMeasurements)
    getLinesForAttributedString:(const facebook::react::AttributedString &)attributedString
            paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                           size:(CGSize)size;

- (std::shared_ptr<const facebook::react::EventEmitter>)
    getEventEmitterWithAttributeString:(const facebook::react::AttributedString &)attributedString
                   paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                 frame:(CGRect)frame
                               atPoint:(CGPoint)point;

/**
 * Returns the URL of the data detected at a point in the coordinates of `frame`'s parent, if any.
 */
- (nullable NSURL *)detectedURLWithAttributedString:(const facebook::react::AttributedString &)attributedString
                                paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                                  dataDetectorTypes:(RCTTextDataDetectorTypes)dataDetectorTypes
                                              frame:(CGRect)frame
                                            atPoint:(CGPoint)point;

- (void)getRectWithAttributedString:(const facebook::react::AttributedString &)attributedString
                paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                 enumerateAttribute:(NSString *)enumerateAttribute
                              frame:(CGRect)frame
                         usingBlock:(RCTTextLayoutFragmentEnumerationBlock)block;

- (void)getRectWithAttributedString:(const facebook::react::AttributedString &)attributedString
                paragraphAttributes:(facebook::react::ParagraphAttributes)paragraphAttributes
                  dataDetectorTypes:(RCTTextDataDetectorTypes)dataDetectorTypes
                 enumerateAttribute:(NSString *)enumerateAttribute
                              frame:(CGRect)frame
                         usingBlock:(RCTTextLayoutFragmentEnumerationBlock)block;

@end

NS_ASSUME_NONNULL_END
