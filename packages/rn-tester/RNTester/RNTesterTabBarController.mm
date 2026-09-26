/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNTesterTabBarController.h"

#if __has_include(<React/RCTReactNativeFactory.h>)
#import <React/RCTReactNativeFactory.h>
#else
#import <RCTReactNativeFactory.h>
#endif

static NSString *const kScreenModuleName = @"RNTesterScreen";

@interface RNTesterScreenViewController : UIViewController
@end

@implementation RNTesterScreenViewController {
  RCTReactNativeFactory *_reactNativeFactory;
  NSDictionary *_initialProperties;
  NSDictionary *_launchOptions;
  NSURL *_documentationURL;
  BOOL _hidesChrome;
  NSLayoutConstraint *_rootViewBottomConstraint;
}

- (instancetype)initWithReactNativeFactory:(RCTReactNativeFactory *)reactNativeFactory
                                     title:(NSString *)title
                         initialProperties:(NSDictionary *)initialProperties
                             launchOptions:(NSDictionary *)launchOptions
                          documentationURL:(NSURL *)documentationURL
                               hidesChrome:(BOOL)hidesChrome
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _reactNativeFactory = reactNativeFactory;
    _initialProperties = initialProperties;
    _launchOptions = launchOptions;
    _documentationURL = documentationURL;
    _hidesChrome = hidesChrome;

    self.title = title;
    self.hidesBottomBarWhenPushed = hidesChrome;

    if (documentationURL != nil) {
      UIBarButtonItem *documentationItem = [[UIBarButtonItem alloc] initWithImage:[UIImage systemImageNamed:@"book"]
                                                                            style:UIBarButtonItemStylePlain
                                                                           target:self
                                                                           action:@selector(openDocumentation)];
      documentationItem.accessibilityLabel = @"Documentation";
      self.navigationItem.rightBarButtonItem = documentationItem;
    }
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  // Matches the screen's GroupedBackgroundColor, showing through outside the safe area.
  self.view.backgroundColor = [UIColor systemGroupedBackgroundColor];

  // Draws the header's background behind the transparent navigation bar, spanning only the safe area's
  // width so it stays clear of side cutouts and a side tab bar.
  UIView *headerBackgroundView = [UIView new];
  headerBackgroundView.backgroundColor = [UIColor systemBackgroundColor];
  headerBackgroundView.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:headerBackgroundView];

  // React Native scroll views don't adjust for bars or cutouts they sit under, so the surface is
  // kept clear of them.
  UIView *rootView = [_reactNativeFactory.rootViewFactory viewWithModuleName:kScreenModuleName
                                                           initialProperties:_initialProperties
                                                               launchOptions:_launchOptions
                                                         bundleConfiguration:_reactNativeFactory.bundleConfiguration
                                                        devMenuConfiguration:_reactNativeFactory.devMenuConfiguration];
  rootView.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:rootView];

  UILayoutGuide *safeArea = self.view.safeAreaLayoutGuide;
  _rootViewBottomConstraint = [rootView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor];
  [NSLayoutConstraint activateConstraints:@[
    [headerBackgroundView.topAnchor constraintEqualToAnchor:self.view.topAnchor],
    [headerBackgroundView.bottomAnchor constraintEqualToAnchor:safeArea.topAnchor],
    [headerBackgroundView.leadingAnchor constraintEqualToAnchor:safeArea.leadingAnchor],
    [headerBackgroundView.trailingAnchor constraintEqualToAnchor:safeArea.trailingAnchor],
    [rootView.topAnchor constraintEqualToAnchor:safeArea.topAnchor],
    _rootViewBottomConstraint,
    [rootView.leadingAnchor constraintEqualToAnchor:safeArea.leadingAnchor],
    [rootView.trailingAnchor constraintEqualToAnchor:safeArea.trailingAnchor],
  ]];
}

- (void)viewSafeAreaInsetsDidChange
{
  [super viewSafeAreaInsetsDidChange];
  // The window's own bottom inset (the home indicator) only applies beneath a bottom tab bar, which
  // already clears it. With the tab bar at the side or hidden, the surface runs to the bottom edge.
  CGFloat bottomInset = self.view.safeAreaInsets.bottom;
  BOOL hasBottomBar = bottomInset > self.view.window.safeAreaInsets.bottom;
  _rootViewBottomConstraint.constant = hasBottomBar ? -bottomInset : 0;
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];
  [self.navigationController setNavigationBarHidden:_hidesChrome animated:animated];
}

- (void)openDocumentation
{
  [[UIApplication sharedApplication] openURL:_documentationURL options:@{} completionHandler:nil];
}

@end

@implementation RNTesterTabBarController {
  RCTReactNativeFactory *_reactNativeFactory;
  UINavigationController *_componentsNavigationController;
}

- (instancetype)initWithReactNativeFactory:(RCTReactNativeFactory *)reactNativeFactory
                         initialProperties:(NSDictionary *)initialProperties
                             launchOptions:(NSDictionary *)launchOptions
{
  if (self = [super initWithNibName:nil bundle:nil]) {
    _reactNativeFactory = reactNativeFactory;

    _componentsNavigationController = [self navigationControllerForScreen:@"components"
                                                                    title:@"Components"
                                                                    image:@"square.stack.3d.up"
                                                                   testID:@"components-tab"
                                                        initialProperties:initialProperties
                                                            launchOptions:launchOptions];
    self.viewControllers = @[
      _componentsNavigationController,
      [self navigationControllerForScreen:@"apis"
                                    title:@"APIs"
                                    image:@"curlybraces"
                                   testID:@"apis-tab"
                        initialProperties:initialProperties
                            launchOptions:launchOptions],
      [self navigationControllerForScreen:@"playgrounds"
                                    title:@"Playground"
                                    image:@"play.rectangle"
                                   testID:@"playground-tab"
                        initialProperties:initialProperties
                            launchOptions:launchOptions],
    ];
  }
  return self;
}

- (UINavigationController *)navigationControllerForScreen:(NSString *)screen
                                                    title:(NSString *)title
                                                    image:(NSString *)imageName
                                                   testID:(NSString *)testID
                                        initialProperties:(NSDictionary *)initialProperties
                                            launchOptions:(NSDictionary *)launchOptions
{
  NSMutableDictionary *screenProperties = [initialProperties mutableCopy];
  screenProperties[@"screen"] = screen;

  RNTesterScreenViewController *rootViewController =
      [[RNTesterScreenViewController alloc] initWithReactNativeFactory:_reactNativeFactory
                                                                 title:title
                                                     initialProperties:screenProperties
                                                         launchOptions:launchOptions
                                                      documentationURL:nil
                                                           hidesChrome:NO];
  UINavigationController *navigationController =
      [[UINavigationController alloc] initWithRootViewController:rootViewController];
  // Each screen draws the header's background itself, see RNTesterScreenViewController.
  UINavigationBarAppearance *navigationBarAppearance = [UINavigationBarAppearance new];
  [navigationBarAppearance configureWithTransparentBackground];
  navigationController.navigationBar.standardAppearance = navigationBarAppearance;
  navigationController.navigationBar.scrollEdgeAppearance = navigationBarAppearance;
  navigationController.tabBarItem = [[UITabBarItem alloc] initWithTitle:title
                                                                  image:[UIImage systemImageNamed:imageName]
                                                                    tag:0];
  navigationController.tabBarItem.accessibilityIdentifier = testID;
  return navigationController;
}

- (void)pushRoute:(NSDictionary *)route
{
  auto *navigationController = (UINavigationController *)self.selectedViewController;
  [navigationController pushViewController:[self viewControllerForRoute:route] animated:YES];
}

- (void)pushRouteFromDeepLink:(NSDictionary *)route
{
  self.selectedViewController = _componentsNavigationController;
  [_componentsNavigationController popToRootViewControllerAnimated:NO];
  [_componentsNavigationController pushViewController:[self viewControllerForRoute:route] animated:NO];
}

- (UIViewController *)viewControllerForRoute:(NSDictionary *)route
{
  NSMutableDictionary *screenProperties = [NSMutableDictionary dictionary];
  screenProperties[@"moduleKey"] = route[@"moduleKey"];
  if ([route[@"exampleKey"] isKindOfClass:[NSString class]]) {
    screenProperties[@"exampleKey"] = route[@"exampleKey"];
  }

  NSURL *documentationURL = nil;
  if ([route[@"documentationURL"] isKindOfClass:[NSString class]]) {
    documentationURL = [NSURL URLWithString:route[@"documentationURL"]];
  }

  return [[RNTesterScreenViewController alloc] initWithReactNativeFactory:_reactNativeFactory
                                                                    title:route[@"title"]
                                                        initialProperties:screenProperties
                                                            launchOptions:nil
                                                         documentationURL:documentationURL
                                                              hidesChrome:[route[@"hidesChrome"] boolValue]];
}

@end
