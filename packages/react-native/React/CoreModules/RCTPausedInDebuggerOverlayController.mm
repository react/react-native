/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPausedInDebuggerOverlayController.h"

#import <React/RCTDevBanner.h>

// The debugger frontend sends a generic message with each pause; the banner shows React Native's own wording, which
// also tells someone who is not debugging what happened to the app.
static NSString *const RCTPausedInDebuggerMessage = @"App paused in debugger";
static NSString *const RCTPausedInDebuggerSubtitle = @"Tap to resume";

static const CGFloat RCTPausedInDebuggerBannerMinHeight = 46;
static const CGFloat RCTPausedInDebuggerIconSize = 28;
static const CGFloat RCTPausedInDebuggerSubtitleFontSize = 10.5;

/**
 * The paused-in-debugger state of the dev banner: a yellow capsule with a leading pause icon and a "Tap to resume"
 * line, over a dimmed app that takes no touches. It stays on top of any loading banner, and a tap on it resumes.
 */
@interface RCTPausedInDebuggerBanner : RCTDevBanner
@property (nonatomic, copy, nullable) dispatch_block_t onResume;
@end

@implementation RCTPausedInDebuggerBanner

- (void)show
{
  UIColor *backgroundColor = [UIColor colorWithDynamicProvider:^UIColor *(UITraitCollection *traits) {
    return traits.userInterfaceStyle == UIUserInterfaceStyleDark
        ? [UIColor colorWithRed:1 green:0.926 blue:0.595 alpha:1]
        : [UIColor colorWithRed:1 green:0.941 blue:0.676 alpha:1];
  }];
  [self showMessage:RCTPausedInDebuggerMessage
                color:UIColor.blackColor
      backgroundColor:backgroundColor
        dismissButton:NO];
}

// Below the loading banners' windows, so they stay readable and tappable above the dimming while the app is paused.
- (UIWindowLevel)windowLevel
{
  return UIWindowLevelStatusBar + 1;
}

- (BOOL)dimsBackground
{
  return YES;
}

- (NSUInteger)stackLevel
{
  return 0;
}

- (CGFloat)minimumHeight
{
  return RCTPausedInDebuggerBannerMinHeight;
}

- (NSDirectionalEdgeInsets)labelInsets
{
  CGFloat iconInset = (RCTPausedInDebuggerBannerMinHeight - RCTPausedInDebuggerIconSize) / 2;
  return NSDirectionalEdgeInsetsMake(7, iconInset, 7, 16);
}

- (UIView *)makeLeadingAccessoryView
{
  UIImageSymbolConfiguration *configuration =
      [[UIImageSymbolConfiguration configurationWithPointSize:RCTPausedInDebuggerIconSize]
          configurationByApplyingConfiguration:[UIImageSymbolConfiguration configurationWithPaletteColors:@[
            [UIColor colorWithRed:0.996 green:0.972 blue:0.869 alpha:1],
            [UIColor colorWithRed:0.343 green:0.269 blue:0.105 alpha:1],
          ]]];
  UIImageView *icon = [[UIImageView alloc] initWithImage:[UIImage systemImageNamed:@"pause.circle.fill"
                                                                 withConfiguration:configuration]];
  icon.contentMode = UIViewContentModeScaleAspectFit;
  icon.translatesAutoresizingMaskIntoConstraints = NO;
  [NSLayoutConstraint activateConstraints:@[
    [icon.widthAnchor constraintEqualToConstant:RCTPausedInDebuggerIconSize],
    [icon.heightAnchor constraintEqualToConstant:RCTPausedInDebuggerIconSize],
  ]];
  return icon;
}

- (NSAttributedString *)attributedTextForMessage:(NSString *)message textColor:(UIColor *)textColor
{
  NSMutableAttributedString *text = [[super attributedTextForMessage:message textColor:textColor] mutableCopy];
  NSMutableParagraphStyle *messageStyle = [[text attribute:NSParagraphStyleAttributeName atIndex:0
                                            effectiveRange:nil] mutableCopy];
  messageStyle.alignment = NSTextAlignmentNatural;
  [text addAttribute:NSParagraphStyleAttributeName value:messageStyle range:NSMakeRange(0, text.length)];
  NSMutableParagraphStyle *subtitleStyle = [messageStyle mutableCopy];
  subtitleStyle.alignment = NSTextAlignmentCenter;
  [text appendAttributedString:[[NSAttributedString alloc]
                                   initWithString:[@"\n" stringByAppendingString:RCTPausedInDebuggerSubtitle]
                                       attributes:@{
                                         NSParagraphStyleAttributeName : subtitleStyle,
                                         NSFontAttributeName :
                                             [UIFont systemFontOfSize:RCTPausedInDebuggerSubtitleFontSize
                                                               weight:UIFontWeightRegular],
                                         NSForegroundColorAttributeName : [textColor colorWithAlphaComponent:0.6],
                                       }]];
  return text;
}

- (NSString *)accessibilityLabelForMessage:(NSString *)message
{
  return [NSString stringWithFormat:@"%@. %@.", message, RCTPausedInDebuggerSubtitle];
}

- (void)didTapCapsule
{
  if (_onResume != nil) {
    _onResume();
  }
}

@end

@implementation RCTPausedInDebuggerOverlayController {
  // A dedicated banner, so the paused state neither replaces nor is replaced by the loading messages.
  RCTPausedInDebuggerBanner *_banner;
}

- (void)showWithMessage:(__unused NSString *)message onResume:(void (^)(void))onResume
{
  if (_banner == nil) {
    _banner = [RCTPausedInDebuggerBanner new];
  }
  _banner.onResume = onResume;
  [_banner show];
}

- (void)hide
{
  [_banner hide];
}

@end
