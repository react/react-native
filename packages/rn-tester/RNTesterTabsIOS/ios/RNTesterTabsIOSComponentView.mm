/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNTesterTabsIOSComponentView.h"

#import <React/RCTConversions.h>
#import <React/RCTLog.h>
#import <React/UIView+React.h>
#import <react/renderer/components/AppSpecs/ComponentDescriptors.h>
#import <react/renderer/components/AppSpecs/EventEmitters.h>
#import <react/renderer/components/AppSpecs/Props.h>

#if __has_include(<React/RCTFabricComponentsPlugins.h>)
#import <React/RCTFabricComponentsPlugins.h>
#else
#import "RCTFabricComponentsPlugins.h"
#endif

using namespace facebook::react;

// Preserve RNTester's existing example bounds on compact bottom-tab layouts.
static constexpr CGFloat LegacyTopInset = 50;
static constexpr CGFloat LegacyBottomInset = 65;

/**
 * A tab's view controller, which reports when the tab bar or window changes
 * the area its content needs to clear.
 */
@interface RNTesterTabViewController : UIViewController
@property (nonatomic, copy) void (^safeAreaInsetsDidChange)(UIEdgeInsets insets);
@end

@implementation RNTesterTabViewController

- (void)viewSafeAreaInsetsDidChange
{
  [super viewSafeAreaInsetsDidChange];
  if (self.safeAreaInsetsDidChange != nil) {
    self.safeAreaInsetsDidChange(self.view.safeAreaInsets);
  }
}

@end

@interface RNTesterTabsIOSComponentView () <UITabBarControllerDelegate>
@end

@implementation RNTesterTabsIOSComponentView {
  UITabBarController *_tabBarController;
  // Holds the mounted React children, and moves into the selected tab.
  UIView *_containerView;
  NSArray<NSString *> *_tabKeys;
  UIEdgeInsets _contentInsets;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<RNTesterTabsIOSComponentDescriptor>();
}

// The view owns a view controller, which is not worth resetting for reuse.
+ (BOOL)shouldBeRecycled
{
  return NO;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const RNTesterTabsIOSProps>();
    _props = defaultProps;

    _containerView = [UIView new];
    _containerView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

    _tabBarController = [UITabBarController new];
    _tabBarController.delegate = self;
    self.contentView = _tabBarController.view;
  }
  return self;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  if (self.window == nil) {
    [_tabBarController willMoveToParentViewController:nil];
    [_tabBarController removeFromParentViewController];
    return;
  }

  UIViewController *parentViewController = self.reactViewController;
  if (parentViewController != nil && _tabBarController.parentViewController == nil) {
    [parentViewController addChildViewController:_tabBarController];
    [_tabBarController didMoveToParentViewController:parentViewController];
  }
}

#pragma mark - Children

// Children are laid out against this view's bounds, which the tab's view shares, so they keep their
// frames wherever the container moves.
- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_containerView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

#pragma mark - Props

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldTabsProps = static_cast<const RNTesterTabsIOSProps &>(*_props);
  const auto &newTabsProps = static_cast<const RNTesterTabsIOSProps &>(*props);

  // RNTester's tabs are a constant, so they are built once, from the first props.
  bool tabsCreated = _tabKeys == nil;
  if (tabsCreated) {
    [self createTabs:newTabsProps.tabs];
  } else if (![[self keysForTabs:newTabsProps.tabs] isEqualToArray:_tabKeys]) {
    RCTLogError(@"RNTesterTabsIOS builds its tabs once, and does not support changing them after mount.");
  }
  if (tabsCreated || oldTabsProps.selectedTab != newTabsProps.selectedTab) {
    [self selectTab:newTabsProps.selectedTab];
  }
  if (oldTabsProps.tabBarHidden != newTabsProps.tabBarHidden) {
    if (@available(iOS 18.0, tvOS 18.0, *)) {
      [_tabBarController setTabBarHidden:newTabsProps.tabBarHidden animated:NO];
    } else {
      _tabBarController.tabBar.hidden = newTabsProps.tabBarHidden;
    }
  }

  [super updateProps:props oldProps:oldProps];
}

- (NSArray<NSString *> *)keysForTabs:(const std::vector<RNTesterTabsIOSTabsStruct> &)tabs
{
  NSMutableArray<NSString *> *keys = [NSMutableArray arrayWithCapacity:tabs.size()];
  for (const auto &tab : tabs) {
    [keys addObject:RCTNSStringFromString(tab.key)];
  }
  return keys;
}

- (void)createTabs:(const std::vector<RNTesterTabsIOSTabsStruct> &)tabs
{
  __weak RNTesterTabsIOSComponentView *weakSelf = self;
  NSMutableArray<UIViewController *> *viewControllers = [NSMutableArray arrayWithCapacity:tabs.size()];

  for (const auto &tab : tabs) {
    auto *viewController = [RNTesterTabViewController new];
    viewController.tabBarItem =
        [[UITabBarItem alloc] initWithTitle:RCTNSStringFromString(tab.title)
                                      image:[UIImage systemImageNamed:RCTNSStringFromString(tab.systemImage)]
                                        tag:0];
    viewController.tabBarItem.accessibilityIdentifier = RCTNSStringFromString(tab.testID);
    viewController.safeAreaInsetsDidChange = ^(UIEdgeInsets insets) {
      [weakSelf tabSafeAreaInsetsDidChange:insets];
    };
    [viewControllers addObject:viewController];
  }

  _tabKeys = [self keysForTabs:tabs];
  _tabBarController.viewControllers = viewControllers;
}

- (void)selectTab:(const std::string &)key
{
  NSUInteger index = [_tabKeys indexOfObject:RCTNSStringFromString(key)];
  if (index == NSNotFound) {
    return;
  }
  _tabBarController.selectedIndex = index;

  UIView *tabView = _tabBarController.selectedViewController.view;
  _containerView.frame = tabView.bounds;
  [tabView addSubview:_containerView];
}

#pragma mark - UITabBarControllerDelegate

- (BOOL)tabBarController:(UITabBarController *)tabBarController
    shouldSelectViewController:(UIViewController *)viewController
{
  NSUInteger index = [tabBarController.viewControllers indexOfObject:viewController];
  if (index != NSNotFound && _eventEmitter != nullptr) {
    static_cast<const RNTesterTabsIOSEventEmitter &>(*_eventEmitter)
        .onTabPress({.key = RCTStringFromNSString(_tabKeys[index])});
  }
  // JS selects the tab by updating `selectedTab`.
  return NO;
}

#pragma mark - Insets

- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter
{
  [super updateEventEmitter:eventEmitter];
  // The insets can settle before the first event emitter arrives.
  UIViewController *selectedViewController = _tabBarController.selectedViewController;
  if (selectedViewController.isViewLoaded && selectedViewController.view.window != nil) {
    _contentInsets = UIEdgeInsetsZero;
    [self tabSafeAreaInsetsDidChange:selectedViewController.view.safeAreaInsets];
  }
}

- (void)tabSafeAreaInsetsDidChange:(UIEdgeInsets)insets
{
  CGRect tabBarFrame = _tabBarController.tabBar.frame;
  CGRect bounds = _tabBarController.view.bounds;
  BOOL hasBottomTabBar = !_tabBarController.tabBar.hidden && CGRectGetWidth(tabBarFrame) >= CGRectGetWidth(bounds) &&
      CGRectGetMaxY(tabBarFrame) >= CGRectGetMaxY(bounds);
  if (hasBottomTabBar) {
    insets.top = MAX(insets.top, LegacyTopInset);
    // Never go below the system inset: anything less leaves content under the tab bar, where taps switch tabs.
    insets.bottom = MAX(insets.bottom, LegacyBottomInset);
  } else {
    insets.bottom = 0;
    // A window with no status bar along the top, such as the iPhone Duo's, reports no top inset. Keep
    // content a small distance from the display's rounded top edge.
    if (insets.top == 0) {
      insets.top = 16;
    }
  }
  if (UIEdgeInsetsEqualToEdgeInsets(insets, _contentInsets) || _eventEmitter == nullptr) {
    return;
  }
  _contentInsets = insets;
  static_cast<const RNTesterTabsIOSEventEmitter &>(*_eventEmitter)
      .onContentInsetsChange({
          .top = insets.top,
          .left = insets.left,
          .bottom = insets.bottom,
          .right = insets.right,
      });
}

@end

Class<RCTComponentViewProtocol> RNTesterTabsIOSCls(void)
{
  return RNTesterTabsIOSComponentView.class;
}
