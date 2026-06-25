/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

#import "CoreModulesPlugins.h"

#if RCT_DEV

#import <dlfcn.h>

#import <mach/mach.h>

#import <React/RCTDevSettings.h>

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <React/RCTFPSGraph.h>
#import <React/RCTInitializing.h>
#import <React/RCTInvalidating.h>
#import <React/RCTJavaScriptExecutor.h>
#import <React/RCTPerformanceLogger.h>
#import <React/RCTPerformanceLoggerLabels.h>
#import <React/RCTRootView.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>

#if __has_include(<React/RCTDevMenu.h>)
#import <React/RCTDevMenu.h>
#endif

static NSString *const RCTPerfMonitorCellIdentifier = @"RCTPerfMonitorCellIdentifier";

static const CGFloat RCTPerfMonitorBarHeight = 50;
static const CGFloat RCTPerfMonitorExpandHeight = 250;

NSArray<NSString *> *LabelsForRCTPerformanceLoggerTags();

static BOOL RCTJSCSetOption(const char *option)
{
  return NO;
}

static vm_size_t RCTGetResidentMemorySize(void)
{
  vm_size_t memoryUsageInByte = 0;
  task_vm_info_data_t vmInfo;
  mach_msg_type_number_t count = TASK_VM_INFO_COUNT;
  kern_return_t kernelReturn = task_info(mach_task_self(), TASK_VM_INFO, (task_info_t)&vmInfo, &count);
  if (kernelReturn == KERN_SUCCESS) {
    memoryUsageInByte = (vm_size_t)vmInfo.phys_footprint;
  }
  return memoryUsageInByte;
}

@interface RCTPerfMonitor
    : NSObject <RCTBridgeModule, RCTTurboModule, RCTInvalidating, UITableViewDataSource, UITableViewDelegate>

#if __has_include(<React/RCTDevMenu.h>)
@property (nonatomic, strong, readonly) RCTDevMenuItem *devMenuItem;
#endif
@property (nonatomic, strong, readonly) UIPanGestureRecognizer *gestureRecognizer;
@property (nonatomic, strong, readonly) UIView *container;
@property (nonatomic, strong, readonly) UILabel *memory;
@property (nonatomic, strong, readonly) UILabel *heap;
@property (nonatomic, strong, readonly) UILabel *views;
@property (nonatomic, strong, readonly) UITableView *metrics;
@property (nonatomic, strong, readonly) RCTFPSGraph *jsGraph;
@property (nonatomic, strong, readonly) RCTFPSGraph *uiGraph;
@property (nonatomic, strong, readonly) UILabel *jsGraphLabel;
@property (nonatomic, strong, readonly) UILabel *uiGraphLabel;

@end

@implementation RCTPerfMonitor {
#if __has_include(<React/RCTDevMenu.h>)
  RCTDevMenuItem *_devMenuItem;
#endif
  UIPanGestureRecognizer *_gestureRecognizer;
  UIView *_container;
  UILabel *_memory;
  UILabel *_heap;
  UILabel *_views;
  UILabel *_uiGraphLabel;
  UILabel *_jsGraphLabel;
  UITableView *_metrics;

  RCTFPSGraph *_uiGraph;
  RCTFPSGraph *_jsGraph;

  CADisplayLink *_uiDisplayLink;
  CADisplayLink *_jsDisplayLink;

  NSUInteger _heapSize;

  dispatch_queue_t _queue;
  dispatch_io_t _io;
  int _stderr;
  int _pipe[2];
  NSString *_remaining;

  CGRect _storedMonitorFrame;

  NSArray *_perfLoggerMarks;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  [self hide];
}

#if __has_include(<React/RCTDevMenu.h>)
- (RCTDevMenuItem *)devMenuItem
{
  if (_devMenuItem == nullptr) {
    __weak __typeof__(self) weakSelf = self;
    __weak RCTDevSettings *devSettings = [self->_moduleRegistry moduleForName:"DevSettings"];
    if (devSettings.isPerfMonitorShown) {
      [weakSelf show];
    }
    _devMenuItem = [RCTDevMenuItem
        buttonItemWithTitleBlock:^NSString * {
          return (devSettings.isPerfMonitorShown) ? @"Hide Perf Monitor" : @"Show Perf Monitor";
        }
        handler:^{
          if (devSettings.isPerfMonitorShown) {
            [weakSelf hide];
            devSettings.isPerfMonitorShown = NO;
          } else {
            [weakSelf show];
            devSettings.isPerfMonitorShown = YES;
          }
        }];
  }

  return _devMenuItem;
}
#endif

- (UIPanGestureRecognizer *)gestureRecognizer
{
  if (_gestureRecognizer == nullptr) {
    _gestureRecognizer = [[UIPanGestureRecognizer alloc] initWithTarget:self action:@selector(gesture:)];
  }

  return _gestureRecognizer;
}

- (UIView *)container
{
  if (_container == nullptr) {
    UIEdgeInsets safeInsets = RCTKeyWindow().safeAreaInsets;

    _container =
        [[UIView alloc] initWithFrame:CGRectMake(safeInsets.left, safeInsets.top, 180, RCTPerfMonitorBarHeight)];
    _container.layer.borderWidth = 2;
    _container.layer.borderColor = [UIColor lightGrayColor].CGColor;
    [_container addGestureRecognizer:self.gestureRecognizer];
    [_container addGestureRecognizer:[[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(tap)]];

#if TARGET_OS_TV
    _container.backgroundColor = [UIColor whiteColor];
#else
    _container.backgroundColor = [UIColor systemBackgroundColor];
#endif
  }

  return _container;
}

- (UILabel *)memory
{
  if (_memory == nullptr) {
    _memory = [[UILabel alloc] initWithFrame:CGRectMake(0, 0, 44, RCTPerfMonitorBarHeight)];
    _memory.font = [UIFont systemFontOfSize:12];
    _memory.numberOfLines = 3;
    _memory.textAlignment = NSTextAlignmentCenter;
  }

  return _memory;
}

- (UILabel *)heap
{
  if (_heap == nullptr) {
    _heap = [[UILabel alloc] initWithFrame:CGRectMake(44, 0, 44, RCTPerfMonitorBarHeight)];
    _heap.font = [UIFont systemFontOfSize:12];
    _heap.numberOfLines = 3;
    _heap.textAlignment = NSTextAlignmentCenter;
  }

  return _heap;
}

- (UILabel *)views
{
  if (_views == nullptr) {
    _views = [[UILabel alloc] initWithFrame:CGRectMake(88, 0, 44, RCTPerfMonitorBarHeight)];
    _views.font = [UIFont systemFontOfSize:12];
    _views.numberOfLines = 3;
    _views.textAlignment = NSTextAlignmentCenter;
  }

  return _views;
}

- (RCTFPSGraph *)uiGraph
{
  if (_uiGraph == nullptr) {
    _uiGraph = [[RCTFPSGraph alloc] initWithFrame:CGRectMake(134, 14, 40, 30) color:[UIColor lightGrayColor]];
  }
  return _uiGraph;
}

- (RCTFPSGraph *)jsGraph
{
  if (_jsGraph == nullptr) {
    _jsGraph = [[RCTFPSGraph alloc] initWithFrame:CGRectMake(178, 14, 40, 30) color:[UIColor lightGrayColor]];
  }
  return _jsGraph;
}

- (UILabel *)uiGraphLabel
{
  if (_uiGraphLabel == nullptr) {
    _uiGraphLabel = [[UILabel alloc] initWithFrame:CGRectMake(134, 3, 40, 10)];
    _uiGraphLabel.font = [UIFont systemFontOfSize:11];
    _uiGraphLabel.textAlignment = NSTextAlignmentCenter;
    _uiGraphLabel.text = @"UI";
  }

  return _uiGraphLabel;
}

- (UILabel *)jsGraphLabel
{
  if (_jsGraphLabel == nullptr) {
    _jsGraphLabel = [[UILabel alloc] initWithFrame:CGRectMake(178, 3, 38, 10)];
    _jsGraphLabel.font = [UIFont systemFontOfSize:11];
    _jsGraphLabel.textAlignment = NSTextAlignmentCenter;
    _jsGraphLabel.text = @"JS";
  }

  return _jsGraphLabel;
}

- (UITableView *)metrics
{
  if (_metrics == nullptr) {
    _metrics = [[UITableView alloc] initWithFrame:CGRectMake(
                                                      0,
                                                      RCTPerfMonitorBarHeight,
                                                      self.container.frame.size.width,
                                                      self.container.frame.size.height - RCTPerfMonitorBarHeight)];
    _metrics.dataSource = self;
    _metrics.delegate = self;
    _metrics.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    [_metrics registerClass:[UITableViewCell class] forCellReuseIdentifier:RCTPerfMonitorCellIdentifier];
  }

  return _metrics;
}

- (void)show
{
  if (_container != nullptr) {
    return;
  }

  [self.container addSubview:self.memory];
  [self.container addSubview:self.heap];
  [self.container addSubview:self.views];
  [self.container addSubview:self.uiGraph];
  [self.container addSubview:self.uiGraphLabel];

  [self redirectLogs];

  RCTJSCSetOption("logGC=1");

  [self updateStats];

  [RCTKeyWindow() addSubview:self.container];

  _uiDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(threadUpdate:)];
  [_uiDisplayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];

  self.container.frame =
      (CGRect){self.container.frame.origin, {self.container.frame.size.width + 44, self.container.frame.size.height}};
  [self.container addSubview:self.jsGraph];
  [self.container addSubview:self.jsGraphLabel];

  [_bridge
      dispatchBlock:^{
        self->_jsDisplayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(threadUpdate:)];
        [self->_jsDisplayLink addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSRunLoopCommonModes];
      }
              queue:RCTJSThread];
}

- (void)hide
{
  if (_container == nullptr) {
    return;
  }

  [self.container removeFromSuperview];
  _container = nil;
  _jsGraph = nil;
  _uiGraph = nil;

  RCTJSCSetOption("logGC=0");

  [self stopLogs];

  [_uiDisplayLink invalidate];
  [_jsDisplayLink invalidate];

  _uiDisplayLink = nil;
  _jsDisplayLink = nil;
}

- (void)redirectLogs
{
  _stderr = dup(STDERR_FILENO);

  if (pipe(_pipe) != 0) {
    return;
  }

  dup2(_pipe[1], STDERR_FILENO);
  close(_pipe[1]);

  __weak __typeof__(self) weakSelf = self;
  _queue = dispatch_queue_create("com.facebook.react.RCTPerfMonitor", DISPATCH_QUEUE_SERIAL);
  _io = dispatch_io_create(
      DISPATCH_IO_STREAM,
      _pipe[0],
      _queue,
      ^(__unused int error){
      });

  dispatch_io_set_low_water(_io, 20);

  dispatch_io_read(_io, 0, SIZE_MAX, _queue, ^(__unused bool done, dispatch_data_t data, __unused int error) {
    if (data == nullptr) {
      return;
    }

    dispatch_data_apply(
        data, ^bool(__unused dispatch_data_t region, __unused size_t offset, const void *buffer, size_t size) {
          write(self->_stderr, buffer, size);

          NSString *log = [[NSString alloc] initWithBytes:buffer length:size encoding:NSUTF8StringEncoding];
          [weakSelf parse:log];
          return true;
        });
  });
}

- (void)stopLogs
{
  dup2(_stderr, STDERR_FILENO);
  dispatch_io_close(_io, 0);
}

- (void)parse:(NSString *)log
{
  static NSRegularExpression *GCRegex;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *pattern =
        @"\\[GC: [\\d\\.]+ \\wb => (Eden|Full)Collection, (?:Skipped copying|Did copy), ([\\d\\.]+) \\wb, [\\d.]+ \\ws\\]";
    GCRegex = [NSRegularExpression regularExpressionWithPattern:pattern options:0 error:nil];
  });

  if (_remaining != nullptr) {
    log = [_remaining stringByAppendingString:log];
    _remaining = nil;
  }

  NSArray<NSString *> *lines = [log componentsSeparatedByString:@"\n"];
  if (lines.count == 1) { // no newlines
    _remaining = log;
    return;
  }

  for (NSString *line in lines) {
    NSTextCheckingResult *match = [GCRegex firstMatchInString:line options:0 range:NSMakeRange(0, line.length)];
    if (match != nullptr) {
      NSString *heapSizeStr = [line substringWithRange:[match rangeAtIndex:2]];
      _heapSize = [heapSizeStr integerValue];
    }
  }
}

- (void)updateStats
{
  NSDictionary<NSNumber *, UIView *> *views = [_bridge.uiManager valueForKey:@"viewRegistry"];
  NSUInteger viewCount = views.count;
  NSUInteger visibleViewCount = 0;
  for (UIView *view in views.allValues) {
    if ((view.window != nullptr) || (view.superview.window != nullptr)) {
      visibleViewCount++;
    }
  }

  // Ensure the container always stays on top of newly added views
  if ([_container.superview.subviews lastObject] != _container) {
    [_container.superview bringSubviewToFront:_container];
  }

  double mem = (double)RCTGetResidentMemorySize() / 1024 / 1024;
  self.memory.text = [NSString stringWithFormat:@"RAM\n%.2lf\nMB", mem];
  self.heap.text = [NSString stringWithFormat:@"JSC\n%.2lf\nMB", (double)_heapSize / 1024];
  self.views.text =
      [NSString stringWithFormat:@"Views\n%lu\n%lu", (unsigned long)visibleViewCount, (unsigned long)viewCount];

  __weak __typeof__(self) weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    __strong __typeof__(weakSelf) strongSelf = weakSelf;
    if ((strongSelf != nullptr) && (strongSelf->_container.superview != nullptr)) {
      [strongSelf updateStats];
    }
  });
}

- (void)gesture:(UIPanGestureRecognizer *)gestureRecognizer
{
  CGPoint translation = [gestureRecognizer translationInView:self.container.superview];
  self.container.center = CGPointMake(self.container.center.x + translation.x, self.container.center.y + translation.y);
  [gestureRecognizer setTranslation:CGPointMake(0, 0) inView:self.container.superview];
}

- (void)tap
{
  [self loadPerformanceLoggerData];
  if (CGRectIsEmpty(_storedMonitorFrame)) {
    UIEdgeInsets safeInsets = RCTKeyWindow().safeAreaInsets;
    _storedMonitorFrame =
        CGRectMake(safeInsets.left, safeInsets.top, self.container.window.frame.size.width, RCTPerfMonitorExpandHeight);
    [self.container addSubview:self.metrics];
  } else {
    [_metrics reloadData];
  }

  [UIView animateWithDuration:.25
                   animations:^{
                     CGRect tmp = self.container.frame;
                     self.container.frame = self->_storedMonitorFrame;
                     self->_storedMonitorFrame = tmp;
                   }];
}

- (void)threadUpdate:(CADisplayLink *)displayLink
{
  RCTFPSGraph *graph = displayLink == _jsDisplayLink ? _jsGraph : _uiGraph;
  [graph onTick:displayLink.timestamp];
}

- (void)loadPerformanceLoggerData
{
  NSUInteger i = 0;
  NSMutableArray<NSString *> *data = [NSMutableArray new];
  RCTPerformanceLogger *performanceLogger = [_bridge performanceLogger];
  NSArray<NSNumber *> *values = [performanceLogger valuesForTags];
  for (NSString *label in LabelsForRCTPerformanceLoggerTags()) {
    long long value = values[i + 1].longLongValue - values[i].longLongValue;
    NSString *unit = @"ms";
    if ([label hasSuffix:@"Size"]) {
      unit = @"b";
    } else if ([label hasSuffix:@"Count"]) {
      unit = @"";
    }
    [data addObject:[NSString stringWithFormat:@"%@: %lld%@", label, value, unit]];
    i += 2;
  }
  _perfLoggerMarks = [data copy];
}

#pragma mark - UITableViewDataSource

- (NSInteger)numberOfSectionsInTableView:(__unused UITableView *)tableView
{
  return 1;
}

- (NSInteger)tableView:(__unused UITableView *)tableView numberOfRowsInSection:(__unused NSInteger)section
{
  return _perfLoggerMarks.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:RCTPerfMonitorCellIdentifier
                                                          forIndexPath:indexPath];

  if (cell == nullptr) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault
                                  reuseIdentifier:RCTPerfMonitorCellIdentifier];
  }

  cell.textLabel.text = _perfLoggerMarks[indexPath.row];
  cell.textLabel.font = [UIFont systemFontOfSize:12];

  return cell;
}

#pragma mark - UITableViewDelegate

- (CGFloat)tableView:(__unused UITableView *)tableView heightForRowAtIndexPath:(__unused NSIndexPath *)indexPath
{
  return 20;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

NSArray<NSString *> *LabelsForRCTPerformanceLoggerTags()
{
  NSMutableArray<NSString *> *labels = [NSMutableArray new];
  for (int i = 0; i < RCTPLSize; i++) {
    [labels addObject:RCTPLLabelForTag((RCTPLTag)i)];
  }
  return labels;
}

#endif

Class RCTPerfMonitorCls(void)
{
#if RCT_DEV
  return RCTPerfMonitor.class;
#else
  return nil;
#endif
}
