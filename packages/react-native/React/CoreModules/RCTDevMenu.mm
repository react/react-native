/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDevMenu.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTDefines.h>
#import <React/RCTDevSettings.h>
#import <React/RCTKeyCommands.h>
#import <React/RCTLog.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>
#import "CoreModulesPlugins.h"

#if RCT_DEV_MENU
#if RCT_ENABLE_INSPECTOR
#import <React/RCTInspectorDevServerHelper.h>
#endif

@protocol RCTDevMenuItemProvider
- (RCTDevMenuItem *)devMenuItem;
@end

NSString *const RCTShowDevMenuNotification = @"RCTShowDevMenuNotification";

@implementation RCTDevMenuConfiguration
- (instancetype)initWithDevMenuEnabled:(BOOL)devMenuEnabled
                   shakeGestureEnabled:(BOOL)shakeGestureEnabled
              keyboardShortcutsEnabled:(BOOL)keyboardShortcutsEnabled
{
  if (self = [super init]) {
    _devMenuEnabled = devMenuEnabled;
    _shakeGestureEnabled = shakeGestureEnabled;
    _keyboardShortcutsEnabled = keyboardShortcutsEnabled;
  }
  return self;
}

+ (instancetype)defaultConfiguration
{
  return [[self alloc] initWithDevMenuEnabled:RCT_DEV_MENU
                          shakeGestureEnabled:RCT_DEV_MENU
                     keyboardShortcutsEnabled:RCT_DEV_MENU];
}
@end

@implementation UIWindow (RCTDevMenu)

- (void)RCT_motionEnded:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTShowDevMenuNotification object:nil];
  }
}

@end

@implementation RCTDevMenuItem {
  RCTDevMenuItemTitleBlock _titleBlock;
  dispatch_block_t _handler;
}

- (instancetype)initWithTitleBlock:(RCTDevMenuItemTitleBlock)titleBlock handler:(dispatch_block_t)handler
{
  if ((self = [super init]) != nullptr) {
    _titleBlock = [titleBlock copy];
    _handler = [handler copy];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

+ (instancetype)buttonItemWithTitleBlock:(NSString * (^)(void))titleBlock handler:(dispatch_block_t)handler
{
  return [[self alloc] initWithTitleBlock:titleBlock handler:handler];
}

+ (instancetype)buttonItemWithTitle:(NSString *)title handler:(dispatch_block_t)handler
{
  return [[self alloc]
      initWithTitleBlock:^NSString * {
        return title;
      }
                 handler:handler];
}

- (void)callHandler
{
  if (_handler != nullptr) {
    _handler();
  }
}

- (NSString *)title
{
  if (_titleBlock != nullptr) {
    return _titleBlock();
  }
  return nil;
}

@end

typedef void (^RCTDevMenuAlertActionHandler)(UIAlertAction *action);

@interface RCTDevMenu () <RCTBridgeModule, RCTInvalidating, NativeDevMenuSpec>

@end

@implementation RCTDevMenu {
  UIAlertController *_actionSheet;
  NSMutableArray<RCTDevMenuItem *> *_extraMenuItems;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;
@synthesize callableJSModules = _callableJSModules;
@synthesize bundleManager = _bundleManager;

RCT_EXPORT_MODULE()

+ (void)initialize
{
  // We're swizzling here because it's poor form to override methods in a category,
  // however UIWindow doesn't actually implement motionEnded:withEvent:, so there's
  // no need to call the original implementation.
  RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), @selector(RCT_motionEnded:withEvent:));
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if ((self = [super init]) != nullptr) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(showOnShake)
                                                 name:RCTShowDevMenuNotification
                                               object:nil];
    _extraMenuItems = [NSMutableArray new];

    _keyboardShortcutsEnabled = true;
    _devMenuEnabled = true;
    [self registerHotkeys];
  }
  return self;
}

- (void)registerHotkeys
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];
  __weak __typeof(self) weakSelf = self;

  // Toggle debug menu
  [commands registerKeyCommandWithInput:@"d"
                          modifierFlags:UIKeyModifierCommand
                                 action:^(__unused UIKeyCommand *command) {
                                   [weakSelf toggle];
                                 }];

  // Toggle element inspector
  [commands registerKeyCommandWithInput:@"i"
                          modifierFlags:UIKeyModifierCommand
                                 action:^(__unused UIKeyCommand *command) {
                                   [(RCTDevSettings *)[weakSelf.moduleRegistry moduleForName:"DevSettings"]
                                       toggleElementInspector];
                                 }];
#endif
}

- (void)unregisterHotkeys
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];

  [commands unregisterKeyCommandWithInput:@"d" modifierFlags:UIKeyModifierCommand];
  [commands unregisterKeyCommandWithInput:@"i" modifierFlags:UIKeyModifierCommand];
#endif
}

- (BOOL)isHotkeysRegistered
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];

  return [commands isKeyCommandRegisteredForInput:@"d" modifierFlags:UIKeyModifierCommand] &&
      [commands isKeyCommandRegisteredForInput:@"i" modifierFlags:UIKeyModifierCommand];
#else
  return NO;
#endif
}

- (BOOL)isReloadCommandRegistered
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];
  return [commands isKeyCommandRegisteredForInput:@"r" modifierFlags:UIKeyModifierCommand];
#else
  return NO;
#endif
}

- (void)unregisterReloadCommand
{
#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
  RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];
  [commands unregisterKeyCommandWithInput:@"r" modifierFlags:UIKeyModifierCommand];
#endif
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  _presentedItems = nil;
  [_actionSheet dismissViewControllerAnimated:YES
                                   completion:^(void){
                                   }];
}

- (void)showOnShake
{
  if ([((RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]) isShakeToShowDevMenuEnabled]) {
    NSMutableArray<UIWindow *> *windows = [NSMutableArray new];
    for (UIWindowScene *scene in RCTSharedApplication().connectedScenes) {
      [windows addObjectsFromArray:scene.windows];
    }
    for (UIWindow *window in windows) {
      NSString *recursiveDescription = [window valueForKey:@"recursiveDescription"];
      if ([recursiveDescription containsString:@"RCTView"]) {
        [self show];
        return;
      }
    }
  }
}

- (void)toggle
{
  if (_actionSheet.isBeingPresented || _actionSheet.beingDismissed) {
    return;
  }
  if (_actionSheet != nullptr) {
    [_actionSheet dismissViewControllerAnimated:YES
                                     completion:^(void) {
                                       self->_actionSheet = nil;
                                     }];

  } else {
    [self show];
  }
}

- (BOOL)isActionSheetShown
{
  return _actionSheet != nil;
}

- (void)addItem:(NSString *)title handler:(void (^)(void))handler
{
  [self addItem:[RCTDevMenuItem buttonItemWithTitle:title handler:handler]];
}

- (void)addItem:(RCTDevMenuItem *)item
{
  [_extraMenuItems addObject:item];
}

- (void)setKeyboardShortcutsEnabled:(BOOL)keyboardShortcutsEnabled
{
  if (_keyboardShortcutsEnabled != keyboardShortcutsEnabled) {
    [self setHotkeysEnabled:keyboardShortcutsEnabled];

    if (!keyboardShortcutsEnabled) {
      [self disableReloadCommand];
    }
  }
}

- (void)setDefaultJSBundle
{
  [[RCTBundleURLProvider sharedSettings] resetToDefaults];
  self->_bundleManager.bundleURL = [[RCTBundleURLProvider sharedSettings] jsBundleURLForFallbackExtension:nil];
  RCTTriggerReloadCommandListeners(@"Dev menu - reset to default");
}

- (NSArray<RCTDevMenuItem *> *)_menuItemsToPresent
{
  NSMutableArray<RCTDevMenuItem *> *items = [NSMutableArray new];

  // Add built-in items
  __weak RCTDevSettings *devSettings = [_moduleRegistry moduleForName:"DevSettings"];
  __weak RCTDevMenu *weakSelf = self;
  __weak RCTBundleManager *bundleManager = _bundleManager;

  [items addObject:[RCTDevMenuItem buttonItemWithTitle:@"Reload"
                                               handler:^{
                                                 RCTTriggerReloadCommandListeners(@"Dev menu - reload");
                                               }]];

  if (!devSettings.isProfilingEnabled) {
#if RCT_ENABLE_INSPECTOR
    if (devSettings.isDeviceDebuggingAvailable) {
      // On-device JS debugging (CDP). Render action to open debugger frontend.
      BOOL isDisconnected = RCTInspectorDevServerHelper.isPackagerDisconnected;
      NSString *title = isDisconnected
          ? [NSString stringWithFormat:@"Connect to %@ to debug JavaScript", RCT_PACKAGER_NAME]
          : @"Open DevTools";
      RCTDevMenuItem *item = [RCTDevMenuItem
          buttonItemWithTitle:title
                      handler:^{
                        [RCTInspectorDevServerHelper
                                openDebugger:bundleManager.bundleURL
                            withErrorMessage:
                                @"Failed to open debugger. Please check that the dev server is running and reload the app."];
                      }];
      [item setDisabled:isDisconnected];
      [items addObject:item];
    }
#endif
  }

  [items addObject:[RCTDevMenuItem
                       buttonItemWithTitleBlock:^NSString * {
                         return @"Toggle Element Inspector";
                       }
                       handler:^{
                         [devSettings toggleElementInspector];
                       }]];

  if (devSettings.isHotLoadingAvailable) {
    [items addObject:[RCTDevMenuItem
                         buttonItemWithTitleBlock:^NSString * {
                           // Previously known as "Hot Reloading". We won't use this term anymore.
                           return devSettings.isHotLoadingEnabled ? @"Disable Fast Refresh" : @"Enable Fast Refresh";
                         }
                         handler:^{
                           devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled;
                         }]];
  }

  id perfMonitorItemOpaque = [_moduleRegistry moduleForName:"PerfMonitor"];
  SEL devMenuItem = @selector(devMenuItem);
  if ([perfMonitorItemOpaque respondsToSelector:devMenuItem]) {
    RCTDevMenuItem *perfMonitorItem = [perfMonitorItemOpaque devMenuItem];
    [items addObject:perfMonitorItem];
  }

  [items
      addObject:[RCTDevMenuItem
                    buttonItemWithTitleBlock:^NSString * {
                      return @"Configure Bundler";
                    }
                    handler:^{
                      UIAlertController *alertController = [UIAlertController
                          alertControllerWithTitle:@"Configure Bundler"
                                           message:@"Provide a custom bundler address, port, and entrypoint."
                                    preferredStyle:UIAlertControllerStyleAlert];
                      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
                        textField.placeholder = @"0.0.0.0";
                      }];
                      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
                        textField.placeholder = @"8081";
                      }];
                      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
                        textField.placeholder = @"index";
                      }];
                      [alertController
                          addAction:[UIAlertAction
                                        actionWithTitle:@"Apply Changes"
                                                  style:UIAlertActionStyleDefault
                                                handler:^(__unused UIAlertAction *action) {
                                                  NSArray *textfields = alertController.textFields;
                                                  UITextField *ipTextField = textfields[0];
                                                  UITextField *portTextField = textfields[1];
                                                  UITextField *bundleRootTextField = textfields[2];
                                                  NSString *bundleRoot = bundleRootTextField.text;
                                                  if (ipTextField.text.length == 0 && portTextField.text.length == 0) {
                                                    [weakSelf setDefaultJSBundle];
                                                    return;
                                                  }
                                                  NSNumberFormatter *formatter = [NSNumberFormatter new];
                                                  formatter.numberStyle = NSNumberFormatterDecimalStyle;
                                                  NSNumber *portNumber =
                                                      [formatter numberFromString:portTextField.text];
                                                  if (portNumber == nil) {
                                                    portNumber = [NSNumber numberWithInt:RCT_METRO_PORT];
                                                  }
                                                  [RCTBundleURLProvider sharedSettings].jsLocation = [NSString
                                                      stringWithFormat:@"%@:%d", ipTextField.text, portNumber.intValue];
                                                  if (bundleRoot.length == 0) {
                                                    [bundleManager resetBundleURL];
                                                  } else {
                                                    bundleManager.bundleURL = [[RCTBundleURLProvider sharedSettings]
                                                        jsBundleURLForBundleRoot:bundleRoot];
                                                  }

                                                  RCTTriggerReloadCommandListeners(@"Dev menu - apply changes");
                                                }]];
                      [alertController addAction:[UIAlertAction actionWithTitle:@"Reset to Default"
                                                                          style:UIAlertActionStyleDefault
                                                                        handler:^(__unused UIAlertAction *action) {
                                                                          [weakSelf setDefaultJSBundle];
                                                                        }]];
                      UIAlertAction *configCancelAction =
                          [UIAlertAction actionWithTitle:@"Cancel"
                                                   style:UIAlertActionStyleCancel
                                                 handler:^(__unused UIAlertAction *action) {
                                                   return;
                                                 }];
                      [configCancelAction setValue:[UIColor systemRedColor] forKey:@"titleTextColor"];
                      [alertController addAction:configCancelAction];
                      [RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
                    }]];

  [items addObjectsFromArray:_extraMenuItems];
  return items;
}

- (void)show
{
  if ((_actionSheet != nullptr) || RCTRunningInAppExtension() || !_devMenuEnabled) {
    return;
  }

  // On larger devices we don't have an anchor point for the action sheet
  UIAlertControllerStyle style = [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone
      ? UIAlertControllerStyleActionSheet
      : UIAlertControllerStyleAlert;

  _actionSheet = [UIAlertController alertControllerWithTitle:@"React Native Dev Menu" message:nil preferredStyle:style];

  NSAttributedString *title =
      [[NSAttributedString alloc] initWithString:@"React Native Dev Menu"
                                      attributes:@{NSFontAttributeName : [UIFont boldSystemFontOfSize:17]}];
  [_actionSheet setValue:title forKey:@"_attributedTitle"];

  NSArray<RCTDevMenuItem *> *items = [self _menuItemsToPresent];
  for (RCTDevMenuItem *item in items) {
    UIAlertAction *action = [UIAlertAction actionWithTitle:item.title
                                                     style:UIAlertActionStyleDefault
                                                   handler:[self alertActionHandlerForDevItem:item]];
    [action setEnabled:!item.isDisabled];
    [_actionSheet addAction:action];
  }

  UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:@"Cancel"
                                                         style:UIAlertActionStyleCancel
                                                       handler:[self alertActionHandlerForDevItem:nil]];
  [cancelAction setValue:[UIColor systemRedColor] forKey:@"titleTextColor"];
  [_actionSheet addAction:cancelAction];

  _presentedItems = items;
  [RCTPresentedViewController() presentViewController:_actionSheet animated:YES completion:nil];

  [_callableJSModules invokeModule:@"RCTNativeAppEventEmitter" method:@"emit" withArgs:@[ @"RCTDevMenuShown" ]];
}

- (RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(RCTDevMenuItem *__nullable)item
{
  return ^(__unused UIAlertAction *action) {
    if (item != nullptr) {
      [item callHandler];
    }

    self->_actionSheet = nil;
  };
}

#pragma mark - deprecated methods and properties

#define WARN_DEPRECATED_DEV_MENU_EXPORT() \
  RCTLogWarn(@"Using deprecated method %s, use RCTDevSettings instead", __func__)

- (void)setShakeToShow:(BOOL)shakeToShow
{
  [[_moduleRegistry moduleForName:"DevSettings"] setIsShakeToShowDevMenuEnabled:shakeToShow];
}

- (BOOL)shakeToShow
{
  return ((RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isShakeToShowDevMenuEnabled;
}

- (void)reload
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  RCTTriggerReloadCommandListeners(@"Unknown from JS");
}

- (void)setProfilingEnabled:(BOOL)enabled
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ((RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isProfilingEnabled = enabled;
}

- (BOOL)profilingEnabled
{
  return ((RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isProfilingEnabled;
}

- (void)setHotLoadingEnabled:(BOOL)enabled
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  ((RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isHotLoadingEnabled = enabled;
}

- (BOOL)hotLoadingEnabled
{
  return ((RCTDevSettings *)[_moduleRegistry moduleForName:"DevSettings"]).isHotLoadingEnabled;
}

- (void)setHotkeysEnabled:(BOOL)enabled
{
  if (enabled) {
    [self registerHotkeys];
  } else {
    [self unregisterHotkeys];
  }
}

- (BOOL)hotkeysEnabled
{
  return [self isHotkeysRegistered];
}

- (void)disableReloadCommand
{
  if ([self isReloadCommandRegistered]) {
    [self unregisterReloadCommand];
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeDevMenuSpecJSI>(params);
}

@end

#else // Unavailable when not in dev mode

@interface RCTDevMenu () <NativeDevMenuSpec>
@end

@implementation RCTDevMenuConfiguration

+ (instancetype)defaultConfiguration
{
  return nil;
}

@end

@implementation RCTDevMenu

- (void)show
{
}
- (void)reload
{
}
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler
{
}
- (void)addItem:(RCTDevMenu *)item
{
}

- (void)disableReloadCommand
{
}

- (BOOL)isActionSheetShown
{
  return NO;
}
+ (NSString *)moduleName
{
  return @"DevMenu";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeDevMenuSpecJSI>(params);
}

@end

@implementation RCTDevMenuItem

+ (instancetype)buttonItemWithTitle:(NSString *)title handler:(void (^)(void))handler
{
  return nil;
}
+ (instancetype)buttonItemWithTitleBlock:(NSString * (^)(void))titleBlock handler:(void (^)(void))handler
{
  return nil;
}

@end

#endif

@implementation RCTBridge (RCTDevMenu)

- (RCTDevMenu *)devMenu
{
#if RCT_DEV_MENU
  return [self moduleForClass:[RCTDevMenu class]];
#else
  return nil;
#endif
}

@end

@implementation RCTBridgeProxy (RCTDevMenu)

- (RCTDevMenu *)devMenu
{
#if RCT_DEV_MENU
  return [self moduleForClass:[RCTDevMenu class]];
#else
  return nil;
#endif
}

@end

Class RCTDevMenuCls(void)
{
  return RCTDevMenu.class;
}
