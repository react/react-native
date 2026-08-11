/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTProfile.h"

#import <dlfcn.h>
#import <mach/mach.h>
#import <objc/message.h>
#import <objc/runtime.h>
#import <stdatomic.h>

#import <React/RCTDefines.h>
#import <UIKit/UIKit.h>

#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTComponentData.h"
#import "RCTLog.h"
#import "RCTModuleData.h"
#import "RCTReloadCommand.h"
#import "RCTUIManager.h"
#import "RCTUIManagerUtils.h"
#import "RCTUtils.h"

NSString *const RCTProfileDidStartProfiling = @"RCTProfileDidStartProfiling";
NSString *const RCTProfileDidEndProfiling = @"RCTProfileDidEndProfiling";

const uint64_t RCTProfileTagAlways = 1L << 0;

#if RCT_PROFILE

#pragma mark - Constants

static NSString *const kProfileTraceEvents = @"traceEvents";
static NSString *const kProfileSamples = @"samples";
static NSString *const kProfilePrefix = @"rct_profile_";

#pragma mark - Variables

static atomic_bool RCTProfileProfiling = NO;

static NSDictionary *RCTProfileInfo;
static NSMutableDictionary *RCTProfileOngoingEvents;
static NSTimeInterval RCTProfileStartTime;
static NSUInteger RCTProfileEventID = 0;
static CADisplayLink *RCTProfileDisplayLink;
static __weak RCTBridge *_RCTProfilingBridge;
static UIWindow *RCTProfileControlsWindow;

#pragma mark - Macros

#define RCTProfileAddEvent(type, props...) \
  [RCTProfileInfo[type] addObject:@{@"pid" : @([[NSProcessInfo processInfo] processIdentifier]), props}];

#define CHECK(...)                \
  if (!RCTProfileIsProfiling()) { \
    return __VA_ARGS__;           \
  }

#pragma mark - systrace glue code

static RCTProfileCallbacks *callbacks;
static char *systrace_buffer;

static systrace_arg_t *newSystraceArgsFromDictionary(NSDictionary<NSString *, NSString *> *args)
{
  if (args.count == 0) {
    return NULL;
  }

  systrace_arg_t *systrace_args = malloc(sizeof(systrace_arg_t) * args.count);
  if (systrace_args) {
    __block size_t i = 0;
    [args enumerateKeysAndObjectsUsingBlock:^(NSString *key, NSString *value, __unused BOOL *stop) {
      systrace_args[i].key = [key UTF8String];
      systrace_args[i].key_len = [key length];
      systrace_args[i].value = [value UTF8String];
      systrace_args[i].value_len = [value length];
      i++;
    }];
  }
  return systrace_args;
}

void RCTProfileRegisterCallbacks(RCTProfileCallbacks *cb)
{
  callbacks = cb;
}

#pragma mark - Private Helpers

static RCTBridge *RCTProfilingBridge(void)
{
  return _RCTProfilingBridge ?: [RCTBridge currentBridge];
}

static NSNumber *RCTProfileTimestamp(NSTimeInterval timestamp)
{
  return @((timestamp - RCTProfileStartTime) * 1e6);
}

static NSString *RCTProfileMemory(vm_size_t memory)
{
  double mem = ((double)memory) / 1024 / 1024;
  return [NSString stringWithFormat:@"%.2lfmb", mem];
}

static NSDictionary *RCTProfileGetMemoryUsage(void)
{
  struct task_basic_info info;
  mach_msg_type_number_t size = sizeof(info);
  kern_return_t kerr = task_info(mach_task_self(), TASK_BASIC_INFO, (task_info_t)&info, &size);
  if (kerr == KERN_SUCCESS) {
    return @{
      @"suspend_count" : @(info.suspend_count),
      @"virtual_size" : RCTProfileMemory(info.virtual_size),
      @"resident_size" : RCTProfileMemory(info.resident_size),
    };
  } else {
    return @{};
  }
}

#pragma mark - Module hooks

static const char *RCTProfileProxyClassName(Class class)
{
  return [kProfilePrefix stringByAppendingString:NSStringFromClass(class)].UTF8String;
}

static dispatch_group_t RCTProfileGetUnhookGroup(void)
{
  static dispatch_group_t unhookGroup;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    unhookGroup = dispatch_group_create();
  });

  return unhookGroup;
}

// Used by RCTProfileTrampoline assembly file to call libc`malloc
RCT_EXTERN void *RCTProfileMalloc(size_t size);
void *RCTProfileMalloc(size_t size)
{
  return malloc(size);
}

// Used by RCTProfileTrampoline assembly file to call libc`free
RCT_EXTERN void RCTProfileFree(void *buf);
void RCTProfileFree(void *buf)
{
  free(buf);
}

RCT_EXTERN IMP RCTProfileGetImplementation(id obj, SEL cmd);
IMP RCTProfileGetImplementation(id obj, SEL cmd)
{
  return class_getMethodImplementation([obj class], cmd);
}

/**
 * For the profiling we have to execute some code before and after every
 * function being profiled, the only way of doing that with pure Objective-C is
 * by using `-forwardInvocation:`, which is slow and could skew the profile
 * results.
 *
 * The alternative in assembly is much simpler, we just need to store all the
 * state at the beginning of the function, start the profiler, restore all the
 * state, call the actual function we want to profile and stop the profiler.
 *
 * The implementation can be found in RCTProfileTrampoline-<arch>.s where arch
 * is one of: i386, x86_64, arm, arm64.
 */
#if defined(__i386__) || defined(__x86_64__) || defined(__arm__) || defined(__arm64__)

RCT_EXTERN void RCTProfileTrampoline(void);
#else
static void *RCTProfileTrampoline = NULL;
#endif

RCT_EXTERN void RCTProfileTrampolineStart(id /*self*/, SEL /*cmd*/);
void RCTProfileTrampolineStart(id self, SEL cmd)
{
  /**
   * This call might be during dealloc, so we shouldn't retain the object in the
   * block.
   */
  Class klass = [self class];
  RCT_PROFILE_BEGIN_EVENT(
      RCTProfileTagAlways, ([NSString stringWithFormat:@"-[%s %s]", class_getName(klass), sel_getName(cmd)]), nil);
}

RCT_EXTERN void RCTProfileTrampolineEnd(void);
void RCTProfileTrampolineEnd(void)
{
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"objc_call,modules,auto");
}

static UIView *(*originalCreateView)(RCTComponentData *, SEL, NSNumber *, NSNumber *);
static UIView *RCTProfileCreateView(RCTComponentData *self, SEL _cmd, NSNumber *tag, NSNumber *rootTag)
{
  UIView *view = originalCreateView(self, _cmd, tag, rootTag);
  RCTProfileHookInstance(view);
  return view;
}

static void RCTProfileHookUIManager(RCTUIManager *uiManager)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    for (id view in [uiManager valueForKey:@"viewRegistry"]) {
      RCTProfileHookInstance([uiManager viewForReactTag:view]);
    }

    Method createView = class_getInstanceMethod([RCTComponentData class], @selector(createViewWithTag:rootTag:));

    if (method_getImplementation(createView) != (IMP)RCTProfileCreateView) {
      originalCreateView = (typeof(originalCreateView))method_getImplementation(createView);
      method_setImplementation(createView, (IMP)RCTProfileCreateView);
    }
  });
}

void RCTProfileHookInstance(id instance)
{
  Class moduleClass = object_getClass(instance);

  /**
   * We swizzle the instance -class method to return the original class, but
   * object_getClass will return the actual class.
   *
   * If they are different, it means that the object is returning the original
   * class, but it's actual class is the proxy subclass we created.
   */
  if ([instance class] != moduleClass) {
    return;
  }

  Class proxyClass = objc_allocateClassPair(moduleClass, RCTProfileProxyClassName(moduleClass), 0);

  if (!proxyClass) {
    proxyClass = objc_getClass(RCTProfileProxyClassName(moduleClass));
    if (proxyClass) {
      object_setClass(instance, proxyClass);
    }
    return;
  }

  unsigned int methodCount;
  Method *methods = class_copyMethodList(moduleClass, &methodCount);
  for (NSUInteger i = 0; i < methodCount; i++) {
    Method method = methods[i];
    SEL selector = method_getName(method);

    /**
     * Bail out on struct returns (except arm64) - we don't use it enough
     * to justify writing a stret version
     */
#ifdef __arm64__
    BOOL returnsStruct = NO;
#else
    const char *typeEncoding = method_getTypeEncoding(method);
    // bail out on structs and unions (since they might contain structs)
    BOOL returnsStruct = typeEncoding[0] == '{' || typeEncoding[0] == '(';
#endif

    /**
     * Avoid hooking into NSObject methods, methods generated by React Native
     * and special methods that start `.` (e.g. .cxx_destruct)
     */
    if ([NSStringFromSelector(selector) hasPrefix:@"rct"] || [NSObject instancesRespondToSelector:selector] ||
        sel_getName(selector)[0] == '.' || returnsStruct) {
      continue;
    }

    const char *types = method_getTypeEncoding(method);
    class_addMethod(proxyClass, selector, (IMP)RCTProfileTrampoline, types);
  }
  free(methods);

  class_replaceMethod(
      object_getClass(proxyClass),
      @selector(initialize),
      imp_implementationWithBlock(^{
      }),
      "v@:");

  for (Class cls in @[ proxyClass, object_getClass(proxyClass) ]) {
    Method oldImp = class_getInstanceMethod(cls, @selector(class));
    class_replaceMethod(
        cls,
        @selector(class),
        imp_implementationWithBlock(^{
          return moduleClass;
        }),
        method_getTypeEncoding(oldImp));
  }

  objc_registerClassPair(proxyClass);
  object_setClass(instance, proxyClass);

  if (moduleClass == [RCTUIManager class]) {
    RCTProfileHookUIManager((RCTUIManager *)instance);
  }
}

void RCTProfileHookModules(RCTBridge *bridge)
{
  _RCTProfilingBridge = bridge;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wtautological-pointer-compare"
#pragma clang diagnostic ignored "-Wunreachable-code-return"
  if (RCTProfileTrampoline == NULL) {
    return;
  }
#pragma clang diagnostic pop

  RCT_PROFILE_BEGIN_EVENT(RCTProfileTagAlways, @"RCTProfileHookModules", nil);
  for (RCTModuleData *moduleData in [bridge valueForKey:@"moduleDataByID"]) {
    // Only hook modules with an instance, to prevent initializing everything
    if ([moduleData hasInstance]) {
      [bridge
          dispatchBlock:^{
            RCTProfileHookInstance(moduleData.instance);
          }
                  queue:moduleData.methodQueue];
    }
  }
  RCT_PROFILE_END_EVENT(RCTProfileTagAlways, @"");
}

static void RCTProfileUnhookInstance(id instance)
{
  if ([instance class] != object_getClass(instance)) {
    object_setClass(instance, [instance class]);
  }
}

void RCTProfileUnhookModules(RCTBridge *bridge)
{
  _RCTProfilingBridge = nil;

  dispatch_group_enter(RCTProfileGetUnhookGroup());

  NSDictionary *moduleDataByID = [bridge valueForKey:@"moduleDataByID"];
  for (RCTModuleData *moduleData in moduleDataByID) {
    if ([moduleData hasInstance]) {
      RCTProfileUnhookInstance(moduleData.instance);
    }
  }

  if ([bridge moduleIsInitialized:[RCTUIManager class]]) {
    dispatch_async(dispatch_get_main_queue(), ^{
      for (id view in [bridge.uiManager valueForKey:@"viewRegistry"]) {
        RCTProfileUnhookInstance([bridge.uiManager viewForReactTag:view]);
      }

      dispatch_group_leave(RCTProfileGetUnhookGroup());
    });
  }
}

#pragma mark - Private ObjC class only used for the vSYNC CADisplayLink target

@interface RCTProfile : NSObject
@end

@implementation RCTProfile

+ (void)vsync:(CADisplayLink *)displayLink
{
  RCTProfileImmediateEvent(RCTProfileTagAlways, @"VSYNC", displayLink.timestamp, 'g');
}

+ (void)reload
{
  RCTTriggerReloadCommandListeners(@"Profiling controls");
}

+ (void)toggle:(UIButton *)target
{
  BOOL isProfiling = RCTProfileIsProfiling();

  // Start and Stop are switched here, since we're going to toggle isProfiling
  [target setTitle:isProfiling ? @"Start" : @"Stop" forState:UIControlStateNormal];

  if (isProfiling) {
    RCTProfileEnd(RCTProfilingBridge(), ^(NSString *result) {
      NSString *outFile = [NSTemporaryDirectory() stringByAppendingString:@"tmp_trace.json"];
      [result writeToFile:outFile atomically:YES encoding:NSUTF8StringEncoding error:nil];
#if !TARGET_OS_TV
      UIActivityViewController *activityViewController =
          [[UIActivityViewController alloc] initWithActivityItems:@[ [NSURL fileURLWithPath:outFile] ]
                                            applicationActivities:nil];
      activityViewController.completionWithItemsHandler =
          ^(__unused UIActivityType activityType,
            __unused BOOL completed,
            __unused NSArray *items,
            __unused NSError *error) {
            RCTProfileControlsWindow.hidden = NO;
          };
      RCTProfileControlsWindow.hidden = YES;
      dispatch_async(dispatch_get_main_queue(), ^{
        [[RCTKeyWindow() rootViewController] presentViewController:activityViewController animated:YES completion:nil];
      });
#else
      RCTProfileControlsWindow.hidden = NO;
#endif
    });
  } else {
    RCTProfileInit(RCTProfilingBridge());
  }
}

+ (void)drag:(UIPanGestureRecognizer *)gestureRecognizer
{
  CGPoint translation = [gestureRecognizer translationInView:RCTProfileControlsWindow];
  RCTProfileControlsWindow.center =
      CGPointMake(RCTProfileControlsWindow.center.x + translation.x, RCTProfileControlsWindow.center.y + translation.y);
  [gestureRecognizer setTranslation:CGPointMake(0, 0) inView:RCTProfileControlsWindow];
}

@end

#pragma mark - Public Functions

dispatch_queue_t RCTProfileGetQueue(void)
{
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.react.Profiler", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
}

BOOL RCTProfileIsProfiling(void)
{
  return atomic_load(&RCTProfileProfiling);
}

void RCTProfileInit(RCTBridge *bridge)
{
  // TODO: enable assert JS thread from any file (and assert here)
  BOOL wasProfiling = atomic_fetch_or(&RCTProfileProfiling, 1);
  if (wasProfiling) {
    return;
  }

  if (callbacks != NULL) {
    systrace_buffer = callbacks->start();
  } else {
    NSTimeInterval time = CACurrentMediaTime();
    dispatch_async(RCTProfileGetQueue(), ^{
      RCTProfileStartTime = time;
      RCTProfileOngoingEvents = [NSMutableDictionary new];
      RCTProfileInfo = @{
        kProfileTraceEvents : [NSMutableArray new],
        kProfileSamples : [NSMutableArray new],
      };
    });
  }

  // Set up thread ordering
  dispatch_async(RCTProfileGetQueue(), ^{
    NSArray *orderedThreads =
        @[ @"JS async", @"RCTPerformanceLogger", @"com.facebook.react.JavaScript", @(RCTUIManagerQueueName), @"main" ];
    [orderedThreads enumerateObjectsUsingBlock:^(NSString *thread, NSUInteger idx, __unused BOOL *stop) {
      RCTProfileAddEvent(
          kProfileTraceEvents,
          @"ph" : @"M", // metadata event
          @"name" : @"thread_sort_index",
          @"tid" : thread,
          @"args" :
          @{@"sort_index" : @(-1000 + (NSInteger)idx)});
    }];
  });

  RCTProfileHookModules(bridge);

  RCTProfileDisplayLink = [CADisplayLink displayLinkWithTarget:[RCTProfile class] selector:@selector(vsync:)];
  [RCTProfileDisplayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTProfileDidStartProfiling object:bridge];
}

void RCTProfileEnd(RCTBridge *bridge, void (^callback)(NSString *))
{
  // assert JavaScript thread here again
  BOOL wasProfiling = atomic_fetch_and(&RCTProfileProfiling, 0);
  if (!wasProfiling) {
    return;
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTProfileDidEndProfiling object:bridge];

  [RCTProfileDisplayLink invalidate];
  RCTProfileDisplayLink = nil;

  RCTProfileUnhookModules(bridge);

  if (callbacks != NULL) {
    if (systrace_buffer) {
      callbacks->stop();
      callback(@(systrace_buffer));
    }
  } else {
    dispatch_async(RCTProfileGetQueue(), ^{
      NSString *log = RCTJSONStringify(RCTProfileInfo, NULL);
      RCTProfileEventID = 0;
      RCTProfileInfo = nil;
      RCTProfileOngoingEvents = nil;

      callback(log);
    });
  }
}

static NSMutableArray<NSArray *> *RCTProfileGetThreadEvents(NSThread *thread)
{
  static NSString *const RCTProfileThreadEventsKey = @"RCTProfileThreadEventsKey";
  NSMutableArray<NSArray *> *threadEvents = thread.threadDictionary[RCTProfileThreadEventsKey];
  if (!threadEvents) {
    threadEvents = [NSMutableArray new];
    thread.threadDictionary[RCTProfileThreadEventsKey] = threadEvents;
  }
  return threadEvents;
}

void _RCTProfileBeginEvent(
    NSThread *calleeThread,
    NSTimeInterval time,
    uint64_t tag,
    NSString *name,
    NSDictionary<NSString *, NSString *> *args)
{
  CHECK();

  if (callbacks != NULL) {
    systrace_arg_t *systraceArgs = newSystraceArgsFromDictionary(args);
    callbacks->begin_section(tag, name.UTF8String, args.count, systraceArgs);
    free(systraceArgs);
    return;
  }

  dispatch_async(RCTProfileGetQueue(), ^{
    NSMutableArray *events = RCTProfileGetThreadEvents(calleeThread);
    [events addObject:@[
      RCTProfileTimestamp(time),
      name,
      RCTNullIfNil(args),
    ]];
  });
}

void _RCTProfileEndEvent(
    NSThread *calleeThread,
    NSString *threadName,
    NSTimeInterval time,
    uint64_t tag,
    NSString *category)
{
  CHECK();

  if (callbacks != NULL) {
    callbacks->end_section(tag, 0, nil);
    return;
  }

  dispatch_async(RCTProfileGetQueue(), ^{
    NSMutableArray<NSArray *> *events = RCTProfileGetThreadEvents(calleeThread);
    NSArray *event = events.lastObject;
    [events removeLastObject];

    if (!event) {
      return;
    }

    NSNumber *start = event[0];
    RCTProfileAddEvent(
        kProfileTraceEvents,
        @"tid" : threadName,
        @"name" : event[1],
        @"cat" : category,
        @"ph" : @"X",
        @"ts" : start,
        @"dur" : @(RCTProfileTimestamp(time).doubleValue - start.doubleValue),
        @"args" : event[2], );
  });
}

NSUInteger RCTProfileBeginAsyncEvent(uint64_t tag, NSString *name, NSDictionary<NSString *, NSString *> *args)
{
  CHECK(0);

  static NSUInteger eventID = 0;

  NSTimeInterval time = CACurrentMediaTime();
  NSUInteger currentEventID = ++eventID;

  if (callbacks != NULL) {
    systrace_arg_t *systraceArgs = newSystraceArgsFromDictionary(args);
    callbacks->begin_async_section(tag, name.UTF8String, (int)(currentEventID % INT_MAX), args.count, systraceArgs);
    free(systraceArgs);
  } else {
    dispatch_async(RCTProfileGetQueue(), ^{
      RCTProfileOngoingEvents[@(currentEventID)] = @[
        RCTProfileTimestamp(time),
        name,
        RCTNullIfNil(args),
      ];
    });
  }

  return currentEventID;
}

void RCTProfileEndAsyncEvent(uint64_t tag, NSString *category, NSUInteger cookie, NSString *name, NSString *threadName)
{
  CHECK();

  if (callbacks != NULL) {
    callbacks->end_async_section(tag, name.UTF8String, (int)(cookie % INT_MAX), 0, nil);
    return;
  }

  NSTimeInterval time = CACurrentMediaTime();

  dispatch_async(RCTProfileGetQueue(), ^{
    NSArray *event = RCTProfileOngoingEvents[@(cookie)];

    if (event) {
      NSNumber *endTimestamp = RCTProfileTimestamp(time);

      RCTProfileAddEvent(
          kProfileTraceEvents,
          @"tid" : threadName,
          @"name" : event[1],
          @"cat" : category,
          @"ph" : @"X",
          @"ts" : event[0],
          @"dur" : @(endTimestamp.doubleValue - [event[0] doubleValue]),
          @"args" : event[2], );
      [RCTProfileOngoingEvents removeObjectForKey:@(cookie)];
    }
  });
}

void RCTProfileImmediateEvent(uint64_t tag, NSString *name, NSTimeInterval time, char scope)
{
  CHECK();

  if (callbacks != NULL) {
    callbacks->instant_section(tag, name.UTF8String, scope);
    return;
  }

  NSString *threadName = RCTCurrentThreadName();

  dispatch_async(RCTProfileGetQueue(), ^{
    RCTProfileAddEvent(
        kProfileTraceEvents,
        @"tid" : threadName,
        @"name" : name,
        @"ts" : RCTProfileTimestamp(time),
        @"scope" : @(scope),
        @"ph" : @"i",
        @"args" : RCTProfileGetMemoryUsage(), );
  });
}

NSUInteger _RCTProfileBeginFlowEvent(void)
{
  static NSUInteger flowID = 0;

  CHECK(0);

  NSUInteger cookie = ++flowID;
  if (callbacks != NULL) {
    callbacks->begin_async_flow(1, "flow", (int)cookie);
    return cookie;
  }

  NSTimeInterval time = CACurrentMediaTime();
  NSString *threadName = RCTCurrentThreadName();

  dispatch_async(RCTProfileGetQueue(), ^{
    RCTProfileAddEvent(
        kProfileTraceEvents,
        @"tid" : threadName,
        @"name" : @"flow",
        @"id" : @(cookie),
        @"cat" : @"flow",
        @"ph" : @"s",
        @"ts" : RCTProfileTimestamp(time), );
  });

  return cookie;
}

void _RCTProfileEndFlowEvent(NSUInteger cookie)
{
  CHECK();

  if (callbacks != NULL) {
    callbacks->end_async_flow(1, "flow", (int)cookie);
    return;
  }

  NSTimeInterval time = CACurrentMediaTime();
  NSString *threadName = RCTCurrentThreadName();

  dispatch_async(RCTProfileGetQueue(), ^{
    RCTProfileAddEvent(
        kProfileTraceEvents,
        @"tid" : threadName,
        @"name" : @"flow",
        @"id" : @(cookie),
        @"cat" : @"flow",
        @"ph" : @"f",
        @"ts" : RCTProfileTimestamp(time), );
  });
}

void RCTProfileSendResult(RCTBridge *bridge, NSString *route, NSData *data)
{
  if (![bridge.bundleURL.scheme hasPrefix:@"http"]) {
    RCTLogWarn(
        @"Cannot upload profile information because you're not connected to the packager. The profiling data is still saved in the app container.");
    return;
  }

  NSURL *URL = [NSURL URLWithString:[@"/" stringByAppendingString:route] relativeToURL:bridge.bundleURL];

  NSMutableURLRequest *URLRequest = [NSMutableURLRequest requestWithURL:URL];
  URLRequest.HTTPMethod = @"POST";
  [URLRequest setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];

  NSURLSessionTask *task = [[NSURLSession sharedSession]
      uploadTaskWithRequest:URLRequest
                   fromData:data
          completionHandler:^(NSData *responseData, __unused NSURLResponse *response, NSError *error) {
            if (error) {
              RCTLogError(@"%@", error.localizedDescription);
            } else {
              NSString *message = [[NSString alloc] initWithData:responseData encoding:NSUTF8StringEncoding];

              if (message.length) {
                dispatch_async(dispatch_get_main_queue(), ^{
                  UIAlertController *alertController =
                      [UIAlertController alertControllerWithTitle:@"Profile"
                                                          message:message
                                                   preferredStyle:UIAlertControllerStyleAlert];
                  [alertController addAction:[UIAlertAction actionWithTitle:@"OK"
                                                                      style:UIAlertActionStyleCancel
                                                                    handler:nil]];
                  [RCTPresentedViewController() presentViewController:alertController animated:YES completion:nil];
                });
              }
            }
          }];

  [task resume];
}

void RCTProfileShowControls(void)
{
  static const CGFloat height = 30;
  static const CGFloat width = 60;

  UIWindow *window = [[UIWindow alloc] initWithFrame:CGRectMake(20, 80, width * 2, height)];
  window.windowLevel = UIWindowLevelAlert + 1000;
  window.hidden = NO;
  window.backgroundColor = [UIColor lightGrayColor];
  window.layer.borderColor = [UIColor grayColor].CGColor;
  window.layer.borderWidth = 1;
  window.alpha = 0.8;

  UIButton *startOrStop = [[UIButton alloc] initWithFrame:CGRectMake(0, 0, width, height)];
  [startOrStop setTitle:RCTProfileIsProfiling() ? @"Stop" : @"Start" forState:UIControlStateNormal];
  [startOrStop addTarget:[RCTProfile class] action:@selector(toggle:) forControlEvents:UIControlEventTouchUpInside];
  startOrStop.titleLabel.font = [UIFont systemFontOfSize:12];

  UIButton *reload = [[UIButton alloc] initWithFrame:CGRectMake(width, 0, width, height)];
  [reload setTitle:@"Reload" forState:UIControlStateNormal];
  [reload addTarget:[RCTProfile class] action:@selector(reload) forControlEvents:UIControlEventTouchUpInside];
  reload.titleLabel.font = [UIFont systemFontOfSize:12];

  [window addSubview:startOrStop];
  [window addSubview:reload];

  UIPanGestureRecognizer *gestureRecognizer = [[UIPanGestureRecognizer alloc] initWithTarget:[RCTProfile class]
                                                                                      action:@selector(drag:)];
  [window addGestureRecognizer:gestureRecognizer];

  RCTProfileControlsWindow = window;
}

void RCTProfileHideControls(void)
{
  RCTProfileControlsWindow.hidden = YES;
  RCTProfileControlsWindow = nil;
}

#endif
