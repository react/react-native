/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInstance.h"

#import <memory>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/NSDataBigString.h>
#import <React/RCTAssert.h>
#import <React/RCTBridge+Inspector.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeModuleDecorator.h>
#import <React/RCTBridgeProxy+Cxx.h>
#import <React/RCTBridgeProxy.h>
#import <React/RCTComponentViewFactory.h>
#import <React/RCTConstants.h>
#import <React/RCTCxxUtils.h>
#import <React/RCTDevMenu.h>
#import <React/RCTDevMenuConfigurationDecorator.h>
#import <React/RCTDevSettings.h>
#import <React/RCTDisplayLink.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTLog.h>
#import <React/RCTLogBox.h>
#import <React/RCTModuleData.h>
#import <React/RCTPerformanceLogger.h>
#import <React/RCTRedBox.h>
#import <React/RCTSurfacePresenter.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <ReactCommon/RuntimeExecutor.h>
#import <cxxreact/ReactMarker.h>
#import <jsinspector-modern/InspectorFlags.h>
#import <jsinspector-modern/ReactCdp.h>
#import <jsireact/JSIExecutor.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#import <react/utils/ContextContainer.h>
#import <react/utils/FollyConvert.h>
#import <react/utils/ManagedObjectWrapper.h>

#import "ObjCTimerRegistry.h"
#import "RCTJSThreadManager.h"
#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP
#import "RCTLegacyUIManagerConstantsProvider.h"
#endif
#import "RCTPerformanceLoggerUtils.h"

#if RCT_DEV_MENU && __has_include(<React/RCTDevLoadingViewProtocol.h>)
#import <React/RCTDevLoadingViewProtocol.h>
#endif

using namespace facebook;
using namespace facebook::react;

static NSString *sRuntimeDiagnosticFlags = nil;
NSString *RCTInstanceRuntimeDiagnosticFlags(void)
{
  return sRuntimeDiagnosticFlags ? [sRuntimeDiagnosticFlags copy] : [NSString new];
}

void RCTInstanceSetRuntimeDiagnosticFlags(NSString *flags)
{
  if (!flags) {
    return;
  }
  sRuntimeDiagnosticFlags = [flags copy];
}

__attribute__((deprecated(
    "RCTBridgelessDisplayLinkModuleHolder is part of the legacy architecture and will be removed in a future React Native release.")))
@interface RCTBridgelessDisplayLinkModuleHolder : NSObject<RCTDisplayLinkModuleHolder>
- (instancetype)initWithModule:(id<RCTBridgeModule>)module;
@end

@implementation RCTBridgelessDisplayLinkModuleHolder {
  id<RCTBridgeModule> _module;
}
- (instancetype)initWithModule:(id<RCTBridgeModule>)module
{
  _module = module;
  return self;
}

- (id<RCTBridgeModule>)instance
{
  return _module;
}

- (Class)moduleClass
{
  return [_module class];
}

- (dispatch_queue_t)methodQueue
{
  return _module.methodQueue;
}
@end

@interface RCTInstance () <RCTTurboModuleManagerDelegate>
@end

@implementation RCTInstance {
  std::unique_ptr<ReactInstance> _reactInstance;
  std::shared_ptr<JSRuntimeFactory> _jsRuntimeFactory;
  __weak id<RCTTurboModuleManagerDelegate> _appTMMDelegate;
  __weak id<RCTInstanceDelegate> _delegate;
  RCTSurfacePresenter *_surfacePresenter;
  RCTPerformanceLogger *_performanceLogger;
  RCTDisplayLink *_displayLink;
  RCTTurboModuleManager *_turboModuleManager;
  RCTBridgeProxy *_bridgeProxy;
  std::mutex _invalidationMutex;
  std::atomic<bool> _valid;
  RCTJSThreadManager *_jsThreadManager;
  NSDictionary *_launchOptions;
  void (^_waitUntilModuleSetupComplete)();

  // APIs supporting interop with native modules and view managers
  RCTBridgeModuleDecorator *_bridgeModuleDecorator;
  RCTDevMenuConfigurationDecorator *_devMenuConfigurationDecorator;

  jsinspector_modern::HostTarget *_parentInspectorTarget;
}

#pragma mark - Public

- (instancetype)initWithDelegate:(id<RCTInstanceDelegate>)delegate
                jsRuntimeFactory:(std::shared_ptr<facebook::react::JSRuntimeFactory>)jsRuntimeFactory
                   bundleManager:(RCTBundleManager *)bundleManager
      turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)tmmDelegate
                  moduleRegistry:(RCTModuleRegistry *)moduleRegistry
           parentInspectorTarget:(jsinspector_modern::HostTarget *)parentInspectorTarget
                   launchOptions:(nullable NSDictionary *)launchOptions
{
  return [self initWithDelegate:delegate
                jsRuntimeFactory:jsRuntimeFactory
                   bundleManager:bundleManager
      turboModuleManagerDelegate:tmmDelegate
                  moduleRegistry:moduleRegistry
           parentInspectorTarget:parentInspectorTarget
                   launchOptions:launchOptions
            devMenuConfiguration:[RCTDevMenuConfiguration defaultConfiguration]];
}

- (instancetype)initWithDelegate:(id<RCTInstanceDelegate>)delegate
                jsRuntimeFactory:(std::shared_ptr<facebook::react::JSRuntimeFactory>)jsRuntimeFactory
                   bundleManager:(RCTBundleManager *)bundleManager
      turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)tmmDelegate
                  moduleRegistry:(RCTModuleRegistry *)moduleRegistry
           parentInspectorTarget:(jsinspector_modern::HostTarget *)parentInspectorTarget
                   launchOptions:(nullable NSDictionary *)launchOptions
            devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (self = [super init]) {
    _performanceLogger = [RCTPerformanceLogger new];
    registerPerformanceLoggerHooks(_performanceLogger);
    [_performanceLogger markStartForTag:RCTPLReactInstanceInit];

    _delegate = delegate;
    _jsRuntimeFactory = jsRuntimeFactory;
    _appTMMDelegate = tmmDelegate;
    _jsThreadManager = [RCTJSThreadManager new];
    _bridgeModuleDecorator = [[RCTBridgeModuleDecorator alloc] initWithViewRegistry:[RCTViewRegistry new]
                                                                     moduleRegistry:moduleRegistry
                                                                      bundleManager:bundleManager
                                                                  callableJSModules:[RCTCallableJSModules new]];
    _devMenuConfigurationDecorator =
#if RCT_DEV_MENU
        [[RCTDevMenuConfigurationDecorator alloc] initWithDevMenuConfiguration:devMenuConfiguration];
#else
        nil;
#endif

    _parentInspectorTarget = parentInspectorTarget;
    {
      __weak __typeof(self) weakSelf = self;
      [_bridgeModuleDecorator.callableJSModules
          setBridgelessJSModuleMethodInvoker:^(
              NSString *moduleName, NSString *methodName, NSArray *args, dispatch_block_t onComplete) {
            [weakSelf callFunctionOnJSModule:moduleName method:methodName args:args];
            if (onComplete) {
              [weakSelf
                  callFunctionOnBufferedRuntimeExecutor:[onComplete](facebook::jsi::Runtime &_) { onComplete(); }];
            }
          }];
    }
    _launchOptions = launchOptions;

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleMemoryWarning)
                                                 name:UIApplicationDidReceiveMemoryWarningNotification
                                               object:nil];

    [self _start];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIApplicationDidReceiveMemoryWarningNotification
                                                object:nil];
}

- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args
{
  if (_valid) {
    _reactInstance->callFunctionOnModule(
        [moduleName UTF8String], [method UTF8String], convertIdToFollyDynamic(args ? args : @[]));
  }
}

- (void)invalidate
{
  std::lock_guard<std::mutex> lock(_invalidationMutex);
  _valid = false;
  if (_reactInstance) {
    _reactInstance->unregisterFromInspector();
  }
  [_surfacePresenter suspend];
  [_jsThreadManager dispatchToJSThread:^{
    /**
     * Every TurboModule is invalidated on its own method queue.
     * TurboModuleManager invalidate blocks the calling thread until all TurboModules are invalidated.
     */
    [self->_turboModuleManager invalidate];

    // Clean up all the Resources
    self->_reactInstance = nullptr;
    self->_jsRuntimeFactory = nullptr;
    self->_appTMMDelegate = nil;
    self->_delegate = nil;
    [self->_displayLink invalidate];
    self->_displayLink = nil;

    self->_turboModuleManager = nil;
    self->_performanceLogger = nil;

    // Terminate the JavaScript thread, so that no other work executes after this block.
    self->_jsThreadManager = nil;
  }];
}

- (void)registerSegmentWithId:(NSNumber *)segmentId path:(NSString *)path
{
  if (_valid) {
    _reactInstance->registerSegment(static_cast<uint32_t>([segmentId unsignedIntValue]), path.UTF8String);
  }
}

#pragma mark - RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  return [_appTMMDelegate getModuleClassFromName:name];
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  id<RCTTurboModule> module = [_appTMMDelegate getModuleInstanceFromClass:moduleClass];

  if (!module) {
    module = [moduleClass new];
  }

  [self _attachBridgelessAPIsToModule:module];
  return module;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  if ([_appTMMDelegate respondsToSelector:@selector(getTurboModule:jsInvoker:)]) {
    return [_appTMMDelegate getTurboModule:name jsInvoker:jsInvoker];
  }

  return nullptr;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  if ([_appTMMDelegate respondsToSelector:@selector(extraModulesForBridge:)]) {
    return [_appTMMDelegate extraModulesForBridge:nil];
  }

  return @[];
}

- (nullable id<RCTModuleProvider>)getModuleProvider:(const char *)name
{
  if ([_appTMMDelegate respondsToSelector:@selector(getModuleProvider:)]) {
    return [_appTMMDelegate getModuleProvider:name];
  }
  return nil;
}

#pragma mark - Private

- (void)_start
{
  // Set up timers
  auto objCTimerRegistry = std::make_unique<ObjCTimerRegistry>();
  auto timing = objCTimerRegistry->timing;
  auto *objCTimerRegistryRawPtr = objCTimerRegistry.get();

  auto timerManager = std::make_shared<TimerManager>(std::move(objCTimerRegistry));
  objCTimerRegistryRawPtr->setTimerManager(timerManager);

  __weak __typeof(self) weakSelf = self;
  auto onJsError = [=](jsi::Runtime &runtime, const JsErrorHandler::ProcessedError &error) {
    [weakSelf _handleJSError:error withRuntime:runtime];
  };

  // Create the React Instance
  _reactInstance = std::make_unique<ReactInstance>(
      _jsRuntimeFactory->createJSRuntime(_jsThreadManager.jsMessageThread),
      _jsThreadManager.jsMessageThread,
      timerManager,
      onJsError,
      _parentInspectorTarget);
  _valid = true;

  RuntimeExecutor bufferedRuntimeExecutor = _reactInstance->getBufferedRuntimeExecutor();
  timerManager->setRuntimeExecutor(bufferedRuntimeExecutor);

  auto jsCallInvoker = make_shared<RuntimeSchedulerCallInvoker>(_reactInstance->getRuntimeScheduler());
  RCTBridgeProxy *bridgeProxy =
      [[RCTBridgeProxy alloc] initWithViewRegistry:_bridgeModuleDecorator.viewRegistry_DEPRECATED
          moduleRegistry:_bridgeModuleDecorator.moduleRegistry
          bundleManager:_bridgeModuleDecorator.bundleManager
          callableJSModules:_bridgeModuleDecorator.callableJSModules
          dispatchToJSThread:^(dispatch_block_t block) {
            __strong __typeof(self) strongSelf = weakSelf;
            if (strongSelf && strongSelf->_valid) {
              strongSelf->_reactInstance->getBufferedRuntimeExecutor()([=](jsi::Runtime &runtime) { block(); });
            }
          }
          registerSegmentWithId:^(NSNumber *segmentId, NSString *path) {
            __strong __typeof(self) strongSelf = weakSelf;
            if (strongSelf && strongSelf->_valid) {
              [strongSelf registerSegmentWithId:segmentId path:path];
            }
          }
          runtime:_reactInstance->getJavaScriptContext()
          launchOptions:_launchOptions];
  bridgeProxy.jsCallInvoker = jsCallInvoker;
  bridgeProxy.performanceLogger = _performanceLogger;
  _bridgeProxy = bridgeProxy;
  [RCTBridge setCurrentBridge:(RCTBridge *)bridgeProxy];

  // Set up TurboModules
  _turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridgeProxy:bridgeProxy
                                                     bridgeModuleDecorator:_bridgeModuleDecorator
                                                                  delegate:self
                                                                 jsInvoker:jsCallInvoker
                                             devMenuConfigurationDecorator:_devMenuConfigurationDecorator];

#if RCT_DEV
  /**
   * Instantiating DevMenu has the side-effect of registering
   * shortcuts for CMD + d, CMD + i,  and CMD + n via RCTDevMenu.
   * Therefore, when TurboModules are enabled, we must manually create this
   * NativeModule.
   */
  [_turboModuleManager moduleForName:"RCTDevMenu"];
#endif // end RCT_DEV

  // Initialize RCTModuleRegistry so that TurboModules can require other TurboModules.
  [_bridgeModuleDecorator.moduleRegistry setTurboModuleRegistry:_turboModuleManager];

  /**
   * Some native modules need to capture uikit objects on the main thread.
   * Start initializing those modules on the main queue here. The JavaScript thread
   * will wait until this module init finishes, before executing the js bundle.
   */
  NSArray<NSString *> *modulesRequiringMainQueueSetup = [_delegate unstableModulesRequiringMainQueueSetup];

  dispatch_semaphore_t moduleSetupComplete = dispatch_semaphore_create(0);

  _waitUntilModuleSetupComplete = ^{
    dispatch_semaphore_wait(moduleSetupComplete, DISPATCH_TIME_FOREVER);
  };

  // TODO(T218039767): Integrate perf logging into main queue module init
  RCTExecuteOnMainQueue(^{
    for (NSString *moduleName in modulesRequiringMainQueueSetup) {
      [self->_bridgeModuleDecorator.moduleRegistry moduleForName:[moduleName UTF8String]];
    }

    RCTScreenSize();
    RCTScreenScale();
    RCTSwitchSize();

    dispatch_semaphore_signal(moduleSetupComplete);
  });

  RCTLogSetBridgelessModuleRegistry(_bridgeModuleDecorator.moduleRegistry);
  RCTLogSetBridgelessCallableJSModules(_bridgeModuleDecorator.callableJSModules);

  auto contextContainer = std::make_shared<ContextContainer>();
  [_delegate didCreateContextContainer:contextContainer];

  contextContainer->insert(
      "RCTImageLoader", facebook::react::wrapManagedObject([_turboModuleManager moduleForName:"RCTImageLoader"]));
  contextContainer->insert(
      "RCTEventDispatcher",
      facebook::react::wrapManagedObject([_turboModuleManager moduleForName:"RCTEventDispatcher"]));
  contextContainer->insert("RCTBridgeModuleDecorator", facebook::react::wrapManagedObject(_bridgeModuleDecorator));
  contextContainer->insert(RuntimeSchedulerKey, std::weak_ptr<RuntimeScheduler>(_reactInstance->getRuntimeScheduler()));
  contextContainer->insert("RCTBridgeProxy", facebook::react::wrapManagedObject(bridgeProxy));

  _surfacePresenter = [[RCTSurfacePresenter alloc]
        initWithContextContainer:contextContainer
                 runtimeExecutor:bufferedRuntimeExecutor
      bridgelessBindingsExecutor:std::optional(_reactInstance->getUnbufferedRuntimeExecutor())];

  // This enables RCTViewRegistry in modules to return UIViews from its viewForReactTag method
  __weak RCTSurfacePresenter *weakSurfacePresenter = _surfacePresenter;
  [_bridgeModuleDecorator.viewRegistry_DEPRECATED setBridgelessComponentViewProvider:^UIView *(NSNumber *reactTag) {
    RCTSurfacePresenter *strongSurfacePresenter = weakSurfacePresenter;
    if (strongSurfacePresenter == nil) {
      return nil;
    }

    return [strongSurfacePresenter findComponentViewWithTag_DO_NOT_USE_DEPRECATED:reactTag.integerValue];
  }];

  // DisplayLink is used to call timer callbacks.
  _displayLink = [RCTDisplayLink new];

  auto &inspectorFlags = jsinspector_modern::InspectorFlags::getInstance();
  ReactInstance::JSRuntimeFlags options = {
      .isProfiling = inspectorFlags.getIsProfilingBuild(),
      .runtimeDiagnosticFlags = [RCTInstanceRuntimeDiagnosticFlags() UTF8String]};
  _reactInstance->initializeRuntime(options, [=](jsi::Runtime &runtime) {
    __strong __typeof(self) strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    [strongSelf->_turboModuleManager installJSBindings:runtime];
    facebook::react::bindNativeLogger(runtime, [](const std::string &message, unsigned int logLevel) {
      _RCTLogJavaScriptInternal(static_cast<RCTLogLevel>(logLevel), [NSString stringWithUTF8String:message.c_str()]);
    });
    RCTInstallNativeComponentRegistryBinding(runtime);

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP
    if (ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode()) {
      installLegacyUIManagerConstantsProviderBinding(runtime);
    }
#endif

    [strongSelf->_delegate instance:strongSelf didInitializeRuntime:runtime];

// Set up Display Link
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    id<RCTDisplayLinkModuleHolder> moduleHolder = [[RCTBridgelessDisplayLinkModuleHolder alloc] initWithModule:timing];
    [strongSelf->_displayLink registerModuleForFrameUpdates:timing withModuleHolder:moduleHolder];
#pragma clang diagnostic pop
    [strongSelf->_displayLink addToRunLoop:[NSRunLoop currentRunLoop]];

    // Attempt to load bundle synchronously, fallback to asynchronously.
    [strongSelf->_performanceLogger markStartForTag:RCTPLScriptDownload];
    [strongSelf _loadJSBundle:[strongSelf->_bridgeModuleDecorator.bundleManager bundleURL]];
  });

  [_performanceLogger markStopForTag:RCTPLReactInstanceInit];
}

- (void)_attachBridgelessAPIsToModule:(id<RCTTurboModule>)module
{
  __weak RCTInstance *weakSelf = self;
  if ([module respondsToSelector:@selector(setDispatchToJSThread:)]) {
    ((id<RCTJSDispatcherModule>)module).dispatchToJSThread = ^(dispatch_block_t block) {
      __strong __typeof(self) strongSelf = weakSelf;

      if (strongSelf && strongSelf->_valid) {
        strongSelf->_reactInstance->getBufferedRuntimeExecutor()([=](jsi::Runtime &runtime) { block(); });
      }
    };
  }

  if ([module respondsToSelector:@selector(setSurfacePresenter:)]) {
    [module performSelector:@selector(setSurfacePresenter:) withObject:_surfacePresenter];
  }

  // Replaces bridge.isInspectable
  if ([module respondsToSelector:@selector(setIsInspectable:)]) {
#if RCT_DEV_MENU
    if (_valid) {
      _reactInstance->getBufferedRuntimeExecutor()([module](jsi::Runtime &runtime) {
        ((id<RCTDevSettingsInspectable>)module).isInspectable = runtime.isInspectable();
      });
    }
#endif
  }
}

- (void)callFunctionOnBufferedRuntimeExecutor:(std::function<void(facebook::jsi::Runtime &)> &&)executor
{
  _reactInstance->getBufferedRuntimeExecutor()([=](jsi::Runtime &runtime) {
    if (executor) {
      executor(runtime);
    }
  });
}

- (void)handleBundleLoadingError:(NSError *)error
{
  if (!_valid) {
    return;
  }

  RCTRedBox *redBox = [_turboModuleManager moduleForName:"RedBox"];

  RCTExecuteOnMainQueue(^{
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidFailToLoadNotification
                                                        object:self
                                                      userInfo:@{@"error" : error}];
    [redBox showErrorMessage:[error localizedDescription]];

    RCTFatal(error);
  });
}

- (void)_loadJSBundle:(NSURL *)sourceURL
{
#if RCT_DEV_MENU && __has_include(<React/RCTDevLoadingViewProtocol.h>)
  {
    id<RCTDevLoadingViewProtocol> loadingView =
        (id<RCTDevLoadingViewProtocol>)[_turboModuleManager moduleForName:"DevLoadingView"];
    [loadingView showWithURL:sourceURL];
  }
#endif

  __weak __typeof(self) weakSelf = self;
  [_delegate loadBundleAtURL:sourceURL
      onProgress:^(RCTLoadingProgress *progressData) {
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf) {
          return;
        }

#if RCT_DEV_MENU && __has_include(<React/RCTDevLoadingViewProtocol.h>)
        id<RCTDevLoadingViewProtocol> loadingView =
            (id<RCTDevLoadingViewProtocol>)[strongSelf->_turboModuleManager moduleForName:"DevLoadingView"];
        [loadingView updateProgress:progressData];
#endif
      }
      onComplete:^(NSError *error, RCTSource *source) {
        __typeof(self) strongSelf = weakSelf;
        if (!strongSelf) {
          return;
        }

        if (error) {
          [strongSelf handleBundleLoadingError:error];
          return;
        }
        // DevSettings module is needed by _loadScriptFromSource's callback so prior initialization is required
        RCTDevSettings *const devSettings =
            (RCTDevSettings *)[strongSelf->_turboModuleManager moduleForName:"DevSettings"];
        [strongSelf _loadScriptFromSource:source];
        // Set up hot module reloading in Dev only.
        [strongSelf->_performanceLogger markStopForTag:RCTPLScriptDownload];
        [devSettings setupHMRClientWithBundleURL:sourceURL];
#if RCT_DEV
        [strongSelf _logOldArchitectureWarnings];
#endif
      }];
}

- (void)_logOldArchitectureWarnings
{
  if (!RCTAreLegacyLogsEnabled()) {
    return;
  }

  NSArray<NSString *> *modulesInOldArchMode = [getModulesLoadedWithOldArch() copy];
  if (modulesInOldArchMode.count > 0) {
    NSMutableString *moduleList = [NSMutableString new];
    for (NSString *moduleName in modulesInOldArchMode) {
      [moduleList appendFormat:@"- %@\n", moduleName];
    }
    RCTLogWarn(
        @"The following modules have been registered using a RCT_EXPORT_MODULE. That's a Legacy Architecture API. Please migrate to the new approach as described in the https://reactnative.dev/docs/next/turbo-native-modules-introduction#register-the-native-module-in-your-app website or open a PR in the library repository:\n%@",
        moduleList);
  }
}

- (void)_loadScriptFromSource:(RCTSource *)source
{
  std::lock_guard<std::mutex> lock(_invalidationMutex);
  if (!_valid) {
    return;
  }

  auto script = std::make_unique<NSDataBigString>(source.data);
  const auto *url = deriveSourceURL(source.url).UTF8String;

  auto beforeLoad = [waitUntilModuleSetupComplete = self->_waitUntilModuleSetupComplete](jsi::Runtime &_) {
    if (waitUntilModuleSetupComplete) {
      waitUntilModuleSetupComplete();
    }
  };
  __weak __typeof(self) weakSelf = self;
  auto afterLoad = [weakSelf](jsi::Runtime &) {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTInstanceDidLoadBundle" object:nil];
    __strong __typeof(weakSelf) strongSelf = weakSelf;
    if (strongSelf) {
      RCTBridgeProxy *bridgeProxy = strongSelf->_bridgeProxy;
      // afterLoad runs on the JS thread; post on main like the legacy bridge so
      // RCTJavaScriptDidLoadNotification observers aren't invoked off-main.
      RCTExecuteOnMainQueue(^{
        [[NSNotificationCenter defaultCenter] postNotificationName:RCTJavaScriptDidLoadNotification
                                                            object:strongSelf
                                                          userInfo:bridgeProxy ? @{@"bridge" : bridgeProxy} : @{}];
      });
    }
  };
  _reactInstance->loadScript(std::move(script), url, beforeLoad, afterLoad);
}

- (void)_handleJSError:(const JsErrorHandler::ProcessedError &)error withRuntime:(jsi::Runtime &)runtime
{
  NSMutableDictionary<NSString *, id> *errorData = [NSMutableDictionary new];
  errorData[@"message"] = @(error.message.c_str());
  if (error.originalMessage) {
    errorData[@"originalMessage"] = @(error.originalMessage->c_str());
  }
  if (error.name) {
    errorData[@"name"] = @(error.name->c_str());
  }
  if (error.componentStack) {
    errorData[@"componentStack"] = @(error.componentStack->c_str());
  }

  NSMutableArray<NSDictionary<NSString *, id> *> *stack = [NSMutableArray new];
  for (const JsErrorHandler::ProcessedError::StackFrame &frame : error.stack) {
    NSMutableDictionary<NSString *, id> *stackFrame = [NSMutableDictionary new];
    if (frame.file) {
      stackFrame[@"file"] = @(frame.file->c_str());
    }
    stackFrame[@"methodName"] = @(frame.methodName.c_str());
    if (frame.lineNumber) {
      stackFrame[@"lineNumber"] = @(*frame.lineNumber);
    }
    if (frame.column) {
      stackFrame[@"column"] = @(*frame.column);
    }
    [stack addObject:stackFrame];
  }

  errorData[@"stack"] = stack;
  errorData[@"id"] = @(error.id);
  errorData[@"isFatal"] = @(error.isFatal);

  id extraData =
      TurboModuleConvertUtils::convertJSIValueToObjCObject(runtime, jsi::Value(runtime, error.extraData), nullptr);
  if (extraData) {
    errorData[@"extraData"] = extraData;
  }

  if (![_delegate instance:self
          didReceiveJSErrorStack:errorData[@"stack"]
                         message:errorData[@"message"]
                 originalMessage:errorData[@"originalMessage"]
                            name:errorData[@"name"]
                  componentStack:errorData[@"componentStack"]
                     exceptionId:error.id
                         isFatal:[errorData[@"isFatal"] boolValue]
                       extraData:errorData[@"extraData"]]) {
    JS::NativeExceptionsManager::ExceptionData jsErrorData{errorData};
    id<NativeExceptionsManagerSpec> exceptionsManager = [_turboModuleManager moduleForName:"ExceptionsManager"];
    [exceptionsManager reportException:jsErrorData];
  }
}

- (void)_handleMemoryWarning
{
  if (_valid) {
    // Memory Pressure Unloading Level 15 represents TRIM_MEMORY_RUNNING_CRITICAL.
    static constexpr int unloadLevel = 15;
    _reactInstance->handleMemoryPressureJs(unloadLevel);
  }
}

@end
