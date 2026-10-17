/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A floating capsule at the top of the screen, in a window of its own above the app, for messages shown during
 * development. It centers where a system alert would, keeps clear of the safe area and of a foldable's hinge, and
 * animates in and out. Banners stack: while several are visible, each sits below those with a lower stack level.
 * The dev loading banner is one; each instance hosts one capsule at a time, and subclasses shape theirs through the
 * hooks below.
 */
@interface RCTDevBanner : NSObject

/** Whether the capsule is on screen or animating out. Main queue only. */
@property (nonatomic, readonly, getter=isVisible) BOOL visible;

/** Shows the message, replacing any capsule already on screen. Callable from any thread. */
- (void)showMessage:(NSString *)message
              color:(UIColor *)color
    backgroundColor:(UIColor *)backgroundColor
      dismissButton:(BOOL)dismissButton;

/** Replaces the text of the capsule on screen, for updates that arrive quickly such as progress. Main queue only. */
- (void)updateMessage:(NSString *)message;

/** Animates the capsule out, after it has been on screen long enough to read. Callable from any thread. */
- (void)hide;

@end

/**
 * Hooks for subclasses, each with the loading banner's behavior by default. All run on the main queue.
 */
@interface RCTDevBanner (Subclassing)

/** The level of the banner's window. */
- (UIWindowLevel)windowLevel;

/** Whether the window dims the app beneath the capsule and swallows touches on it. */
- (BOOL)dimsBackground;

/** Banners with a lower level stack above those with a higher one. */
- (NSUInteger)stackLevel;

/** The capsule's minimum height. */
- (CGFloat)minimumHeight;

/** The space between the capsule's edges and its label, or its leading accessory view where there is one. */
- (NSDirectionalEdgeInsets)labelInsets;

/** A view shown before the label, such as an icon, sized by its own constraints; nil for none. Called once per capsule.
 */
- (nullable UIView *)makeLeadingAccessoryView;

/** The label's text for a message. */
- (NSAttributedString *)attributedTextForMessage:(NSString *)message textColor:(UIColor *)textColor;

/** The capsule's accessibility label, or nil to expose its subviews instead. */
- (nullable NSString *)accessibilityLabelForMessage:(NSString *)message;

/** What a tap on the capsule does. */
- (void)didTapCapsule;

@end

NS_ASSUME_NONNULL_END
