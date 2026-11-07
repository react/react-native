/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>

#if !TARGET_OS_TV

NS_ASSUME_NONNULL_BEGIN

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
RCT_EXTERN NSAttributedString *RCTUnpaintedAttributedString(NSAttributedString *attributedString);

/*
 * A non-editable `UITextView` that provides selection for a paragraph, and
 * nothing else.
 *
 * It is created with the very `NSTextContainer` that `RCTTextLayoutManager`
 * measured the paragraph with, so its layout matches the measurement by
 * construction rather than by coincidence. UIKit performs the selection; it
 * never performs the layout, and it never paints the text.
 */
@interface RCTSelectableTextView : UITextView <UITextViewDelegate>

/*
 * The paragraph as it is painted, before `RCTUnpaintedAttributedString` strips
 * it. The text view lays the stripped copy out, so `copy:` must read the range
 * from this string instead, or the pasteboard receives clear text with no
 * decorations. Both strings hold the same characters, so the range maps
 * directly from one to the other.
 */
@property (nonatomic, copy, nullable) NSAttributedString *sourceAttributedText;

/*
 * YES while a selection shows and the touches on this view belong to it: a
 * handle drag, or a tap on the selected text. The paragraph hands out no event
 * emitter for such a touch. It turns on once the touches that made the
 * selection are cancelled, and off when the selection clears.
 */
@property (nonatomic, readonly) BOOL selectionOwnsTouches;

/*
 * Whether a touch at `point`, in this view's coordinates, belongs to the
 * selection: it lands on the text, or on one of the two selection handles.
 * The handle knobs sit outside the bounds, above the first line and below the
 * last, so a bounds check alone lets a handle drag through.
 */
- (BOOL)selectionOwnsTouchAtPoint:(CGPoint)point;

@end

NS_ASSUME_NONNULL_END

#endif // !TARGET_OS_TV
