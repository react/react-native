/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Hosts RNTester's tabs in a UITabBarController, so the tab bar adapts to the
 * device (a bottom bar, or a sidebar on wide layouts) while the app stays a
 * single React Native root.
 *
 * The React children are the selected tab's content: they are mounted into a
 * single container view, which moves into the selected tab's view controller.
 */
@interface RNTesterTabsIOSComponentView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END
