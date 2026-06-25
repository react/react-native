/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFrameTimingsObserver.h"

#import <UIKit/UIKit.h>

#import <mach/thread_act.h>
#import <pthread.h>

#import <atomic>
#import <chrono>
#import <mutex>
#import <optional>
#import <vector>

#import <react/timing/primitives.h>

using namespace facebook::react;

static constexpr CGFloat kScreenshotScaleFactor = 1.0;
static constexpr CGFloat kScreenshotJPEGQuality = 0.8;

namespace {

// Stores a captured frame screenshot and its associated metadata, used for
// buffering frames during dynamic sampling.
struct FrameData {
  UIImage *image;
  uint64_t frameId;
  jsinspector_modern::tracing::ThreadId threadId;
  HighResTimeStamp beginTimestamp;
  HighResTimeStamp endTimestamp;
};

} // namespace

@implementation RCTFrameTimingsObserver {
  BOOL _screenshotsEnabled;
  RCTFrameTimingCallback _callback;
  CADisplayLink *_displayLink;
  uint64_t _frameCounter;
  // Serial queue for encoding work (single background thread). We limit to 1
  // thread to minimize the performance impact of screenshot recording.
  dispatch_queue_t _encodingQueue;
  std::atomic<bool> _running;
  uint64_t _lastScreenshotHash;

  // Stores the most recently captured frame to opportunistically encode after
  // the current frame. Replaced frames are emitted as timings without
  // screenshots.
  std::mutex _lastFrameMutex;
  std::optional<FrameData> _lastFrameData;

  std::atomic<bool> _encodingInProgress;
}

- (instancetype)initWithScreenshotsEnabled:(BOOL)screenshotsEnabled callback:(RCTFrameTimingCallback)callback
{
  if (self = [super init]) {
    _screenshotsEnabled = screenshotsEnabled;
    _callback = [callback copy];
    _frameCounter = 0;
    _encodingQueue = dispatch_queue_create("com.facebook.react.frame-timings-observer", DISPATCH_QUEUE_SERIAL);
    _running.store(false);
    _lastScreenshotHash = 0;
    _encodingInProgress.store(false);
  }
  return self;
}

- (void)start
{
  _running.store(true, std::memory_order_relaxed);
  _frameCounter = 0;
  _lastScreenshotHash = 0;
  _encodingInProgress.store(false, std::memory_order_relaxed);
  {
    std::lock_guard<std::mutex> lock(_lastFrameMutex);
    _lastFrameData.reset();
  }

  // Emit initial frame event
  auto now = HighResTimeStamp::now();
  [self _emitFrameTimingWithBeginTimestamp:now endTimestamp:now];

  _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(_displayLinkTick:)];
  [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)stop
{
  _running.store(false, std::memory_order_relaxed);
  [_displayLink invalidate];
  _displayLink = nil;
  {
    std::lock_guard<std::mutex> lock(_lastFrameMutex);
    _lastFrameData.reset();
  }
}

- (void)_displayLinkTick:(CADisplayLink *)sender
{
  // CADisplayLink.timestamp and targetTimestamp are in the same timebase as
  // CACurrentMediaTime() / mach_absolute_time(), which on Apple platforms maps
  // to CLOCK_UPTIME_RAW — the same clock backing std::chrono::steady_clock.
  auto beginNanos = static_cast<int64_t>(sender.timestamp * 1e9);
  auto endNanos = static_cast<int64_t>(sender.targetTimestamp * 1e9);

  auto beginTimestamp = HighResTimeStamp::fromChronoSteadyClockTimePoint(
      std::chrono::steady_clock::time_point(std::chrono::nanoseconds(beginNanos)));
  auto endTimestamp = HighResTimeStamp::fromChronoSteadyClockTimePoint(
      std::chrono::steady_clock::time_point(std::chrono::nanoseconds(endNanos)));

  [self _emitFrameTimingWithBeginTimestamp:beginTimestamp endTimestamp:endTimestamp];
}

- (void)_emitFrameTimingWithBeginTimestamp:(HighResTimeStamp)beginTimestamp endTimestamp:(HighResTimeStamp)endTimestamp
{
  uint64_t frameId = _frameCounter++;
  auto threadId = static_cast<jsinspector_modern::tracing::ThreadId>(pthread_mach_thread_np(pthread_self()));

  if (!_screenshotsEnabled) {
    // Screenshots disabled - emit without screenshot
    [self _emitFrameEventWithFrameId:frameId
                            threadId:threadId
                      beginTimestamp:beginTimestamp
                        endTimestamp:endTimestamp
                          screenshot:std::nullopt];
    return;
  }

  UIImage *image = [self _captureScreenshot];
  if (image == nil) {
    // Failed to capture (e.g. no window, duplicate hash) - emit without screenshot
    [self _emitFrameEventWithFrameId:frameId
                            threadId:threadId
                      beginTimestamp:beginTimestamp
                        endTimestamp:endTimestamp
                          screenshot:std::nullopt];
    return;
  }

  FrameData frameData{image, frameId, threadId, beginTimestamp, endTimestamp};

  bool expected = false;
  if (_encodingInProgress.compare_exchange_strong(expected, true)) {
    // Not encoding - encode this frame immediately
    [self _encodeFrame:std::move(frameData)];
  } else {
    // Encoding thread busy - store current screenshot in buffer for tail-capture
    std::optional<FrameData> oldFrame;
    {
      std::lock_guard<std::mutex> lock(_lastFrameMutex);
      oldFrame = std::move(_lastFrameData);
      _lastFrameData = std::move(frameData);
    }
    if (oldFrame.has_value()) {
      // Skipped frame - emit event without screenshot
      [self _emitFrameEventWithFrameId:oldFrame->frameId
                              threadId:oldFrame->threadId
                        beginTimestamp:oldFrame->beginTimestamp
                          endTimestamp:oldFrame->endTimestamp
                            screenshot:std::nullopt];
    }
  }
}

- (void)_emitFrameEventWithFrameId:(uint64_t)frameId
                          threadId:(jsinspector_modern::tracing::ThreadId)threadId
                    beginTimestamp:(HighResTimeStamp)beginTimestamp
                      endTimestamp:(HighResTimeStamp)endTimestamp
                        screenshot:(std::optional<std::vector<uint8_t>>)screenshot
{
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_DEFAULT, 0), ^{
    if (!self->_running.load(std::memory_order_relaxed)) {
      return;
    }
    jsinspector_modern::tracing::FrameTimingSequence sequence{
        frameId, threadId, beginTimestamp, endTimestamp, std::move(screenshot)};
    self->_callback(std::move(sequence));
  });
}

- (void)_encodeFrame:(FrameData)frameData
{
  dispatch_async(_encodingQueue, ^{
    if (!self->_running.load(std::memory_order_relaxed)) {
      return;
    }

    auto screenshot = [self _encodeScreenshot:frameData.image];
    [self _emitFrameEventWithFrameId:frameData.frameId
                            threadId:frameData.threadId
                      beginTimestamp:frameData.beginTimestamp
                        endTimestamp:frameData.endTimestamp
                          screenshot:std::move(screenshot)];

    // Clear encoding flag early, allowing new frames to start fresh encoding
    // sessions
    self->_encodingInProgress.store(false, std::memory_order_release);

    // Opportunistically encode tail frame (if present) without blocking new
    // frames
    std::optional<FrameData> tailFrame;
    {
      std::lock_guard<std::mutex> lock(self->_lastFrameMutex);
      tailFrame = std::move(self->_lastFrameData);
      self->_lastFrameData.reset();
    }
    if (tailFrame.has_value()) {
      if (!self->_running.load(std::memory_order_relaxed)) {
        return;
      }
      auto tailScreenshot = [self _encodeScreenshot:tailFrame->image];
      [self _emitFrameEventWithFrameId:tailFrame->frameId
                              threadId:tailFrame->threadId
                        beginTimestamp:tailFrame->beginTimestamp
                          endTimestamp:tailFrame->endTimestamp
                            screenshot:std::move(tailScreenshot)];
    }
  });
}

// Captures a screenshot of the current window. Must be called on the main
// thread. Returns nil if capture fails or if the frame content is unchanged.
- (UIImage *)_captureScreenshot
{
  UIWindow *keyWindow = [self _getKeyWindow];
  if (keyWindow == nil) {
    return nil;
  }

  UIView *rootView = keyWindow.rootViewController.view ?: keyWindow;
  CGSize viewSize = rootView.bounds.size;
  CGSize scaledSize = CGSizeMake(viewSize.width * kScreenshotScaleFactor, viewSize.height * kScreenshotScaleFactor);

  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat defaultFormat];
  format.scale = 1.0;
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:scaledSize format:format];

  UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
    [rootView drawViewHierarchyInRect:CGRectMake(0, 0, scaledSize.width, scaledSize.height) afterScreenUpdates:NO];
  }];

  // Skip duplicate frames via sampled FNV-1a pixel hash
  CGImageRef cgImage = image.CGImage;
  CFDataRef pixelData = CGDataProviderCopyData(CGImageGetDataProvider(cgImage));
  uint64_t hash = 0xcbf29ce484222325ULL;
  const uint8_t *ptr = CFDataGetBytePtr(pixelData);
  CFIndex length = CFDataGetLength(pixelData);
  // Use prime stride to prevent row alignment on power-of-2 pixel widths
  for (CFIndex i = 0; i < length; i += 67) {
    hash ^= ptr[i];
    hash *= 0x100000001b3ULL;
  }
  CFRelease(pixelData);

  if (hash == _lastScreenshotHash) {
    return nil;
  }
  _lastScreenshotHash = hash;

  return image;
}

- (std::optional<std::vector<uint8_t>>)_encodeScreenshot:(UIImage *)image
{
  NSData *jpegData = UIImageJPEGRepresentation(image, kScreenshotJPEGQuality);
  if (jpegData == nil) {
    return std::nullopt;
  }

  const auto *bytes = static_cast<const uint8_t *>(jpegData.bytes);
  return std::vector<uint8_t>(bytes, bytes + jpegData.length);
}

- (UIWindow *)_getKeyWindow
{
  for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
    if (scene.activationState == UISceneActivationStateForegroundActive &&
        [scene isKindOfClass:[UIWindowScene class]]) {
      auto windowScene = (UIWindowScene *)scene;
      for (UIWindow *window = nullptr in windowScene.windows) {
        if (window.isKeyWindow) {
          return window;
        }
      }
    }
  }
  return nil;
}

@end
