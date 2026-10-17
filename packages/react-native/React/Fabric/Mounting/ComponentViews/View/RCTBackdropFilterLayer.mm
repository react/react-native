/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBackdropFilterLayer.h"

#import <Metal/Metal.h>
#import <React/RCTBackdropFilterUtils.h>
#import <UIKit/UIKit.h>

// Layers whose host view was off-screen when -display fired. Stored as weak refs so
// deallocated layers vanish automatically. A single CADisplayLink polls their visibility
// every frame and calls -setNeedsDisplay once a layer scrolls into view, then stops
// itself when the set is empty (no CPU cost while idle).
static NSHashTable<RCTBackdropFilterLayer *> *sPendingLayers;
static CADisplayLink *sVisibilityLink;

// Shared CIContext backed by Metal. CIContext creation (MTLCreateSystemDefaultDevice +
// contextWithMTLDevice:) can take 200–500 ms on first call; pre-warming in +initialize
// on a background queue ensures it is ready before the first -display fires.
static CIContext *sSharedCIContext;

@implementation RCTBackdropFilterLayer

+ (void)initialize
{
  if (self == [RCTBackdropFilterLayer class]) {
    sPendingLayers = [NSHashTable weakObjectsHashTable];
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
      // CSS filter functions are defined to operate in sRGB. Forcing the working colour space
      // to sRGB here matches Android (ColorMatrix in sRGB) and avoids vivid/saturated artefacts
      // that occur when Core Image processes in its default linear/Display-P3 working space.
      CGColorSpaceRef srgb = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
      NSDictionary *options = @{
        kCIContextWorkingColorSpace : (__bridge id)srgb,
        kCIContextOutputColorSpace : (__bridge id)srgb,
      };
      CGColorSpaceRelease(srgb);
      id<MTLDevice> device = MTLCreateSystemDefaultDevice();
      CIContext *ctx =
          device ? [CIContext contextWithMTLDevice:device options:options] : [CIContext contextWithOptions:options];
      // Pointer-sized store is atomic on ARM64; benign race — worst case another thread
      // creates a second context and stores it, both are valid.
      sSharedCIContext = ctx;
    });
  }
}

static BOOL IsHostVisible(UIView *host)
{
  if (!host.window) {
    return NO;
  }
  // Check visibility relative to the nearest scroll view ancestor so that
  // navigation slide-in transitions (which transform the whole screen in
  // window coordinates) don't incorrectly defer on-screen content.
  for (UIView *v = host.superview; v != nil; v = v.superview) {
    if ([v isKindOfClass:[UIWindow class]]) {
      break;
    }
    if ([v isKindOfClass:[UIScrollView class]]) {
      CGRect hostInSV = [host convertRect:host.bounds toView:v];
      return CGRectIntersectsRect(hostInSV, v.bounds);
    }
  }
  return YES;
}

+ (void)_visibilityLinkFired:(CADisplayLink *)__unused link
{
  for (RCTBackdropFilterLayer *layer in sPendingLayers.allObjects) {
    UIView *host = layer.hostView;
    if (host && IsHostVisible(host)) {
      [sPendingLayers removeObject:layer];
      [layer setNeedsDisplay];
    }
  }
  if (sPendingLayers.count == 0) {
    [sVisibilityLink invalidate];
    sVisibilityLink = nil;
  }
}

- (void)_deferUntilVisible
{
  self.contents = nil;
  [sPendingLayers addObject:self];
  if (!sVisibilityLink) {
    sVisibilityLink = [CADisplayLink displayLinkWithTarget:[self class] selector:@selector(_visibilityLinkFired:)];
    [sVisibilityLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
}

- (CIContext *)_ciContext
{
  if (!sSharedCIContext) {
    // Background pre-warm hasn't finished yet; create synchronously and cache.
    CGColorSpaceRef srgb = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    NSDictionary *options = @{
      kCIContextWorkingColorSpace : (__bridge id)srgb,
      kCIContextOutputColorSpace : (__bridge id)srgb,
    };
    CGColorSpaceRelease(srgb);
    id<MTLDevice> device = MTLCreateSystemDefaultDevice();
    sSharedCIContext =
        device ? [CIContext contextWithMTLDevice:device options:options] : [CIContext contextWithOptions:options];
  }
  return sSharedCIContext;
}

- (void)_flushPendingDisplayInSubtree:(CALayer *)layer
                      renderRootLayer:(CALayer *)rootLayer
                          captureRect:(CGRect)captureRect
{
  if (layer == self) {
    return;
  }

  NSString *delegateClass =
      layer.delegate ? NSStringFromClass([layer.delegate class]) : NSStringFromClass([layer class]);
  // Match both legacy RCTParagraphTextView and Fabric RCTParagraphComponentView.
  BOOL isTextLayer = [delegateClass containsString:@"Paragraph"];

  if (isTextLayer) {
    // Force display regardless of dirty state: recycled/first-render text views may have
    // needsDisplay=NO with nil or stale contents. Calling display directly triggers
    // drawRect:, which renders fresh content or clears the stale backing store.
    [layer display];
  } else if (layer.needsDisplay && ![layer isKindOfClass:[RCTBackdropFilterLayer class]]) {
    [layer displayIfNeeded];
  }
  for (CALayer *sub in layer.sublayers) {
    [self _flushPendingDisplayInSubtree:sub renderRootLayer:rootLayer captureRect:captureRect];
  }
}

- (void)display
{
  UIView *host = self.hostView;

  if (!host || !host.superview || !self.superlayer) {
    self.contents = nil;
    return;
  }

  CGSize captureSize = self.bounds.size;

  if (captureSize.width <= 0 || captureSize.height <= 0) {
    self.contents = nil;
    return;
  }

  // Lazy rendering: skip the expensive capture+filter work when the host is off-screen
  // (e.g. scrolled below the fold). The display link re-triggers -setNeedsDisplay once
  // the host scrolls into view, spreading cost over time instead of paying it all upfront.
  if (!IsHostVisible(host)) {
    [self _deferUntilVisible];
    return;
  }

  UIView *renderRoot = host.superview;
  for (UIView *candidate = host.superview.superview; candidate != nil; candidate = candidate.superview) {
    // A clipping ancestor already constrains what can be seen behind the host —
    // nothing outside renderRoot.bounds can bleed through, so there is no point
    // walking further up the tree (and renderInContext: on a huge parent is expensive).
    if (renderRoot.clipsToBounds) {
      break;
    }
    if ([candidate isKindOfClass:[UIScrollView class]] || [candidate isKindOfClass:[UIWindow class]]) {
      break;
    }
    if ([candidate.nextResponder isKindOfClass:[UIViewController class]]) {
      break;
    }
    UIView *parentView = candidate.superview;
    if (parentView) {
      CGRect hostRectInParent = [host convertRect:host.bounds toView:parentView];
      for (UIView *sibling in parentView.subviews) {
        if (sibling != candidate && CGRectIntersectsRect(sibling.frame, hostRectInParent)) {
          goto doneWalking;
        }
      }
    }
    renderRoot = candidate;
  }
doneWalking:;

  CGFloat scale = UIScreen.mainScreen.scale;
  CGRect hostRectInRoot = [host convertRect:host.bounds toView:renderRoot];

  [self _flushPendingDisplayInSubtree:renderRoot.layer renderRootLayer:renderRoot.layer captureRect:hostRectInRoot];

  // Find the opaque background colour visible behind renderRoot so that transparent gaps
  // in the captured image are filled with the actual screen background rather than (0,0,0,0).
  // Without this, filters such as invert() incorrectly keep transparent areas transparent,
  // which composites as white on the iOS screen — matching what Android (pre-filled white) does.
  UIColor *backdropFill = nil;
  for (UIView *ancestor = renderRoot.superview; ancestor != nil; ancestor = ancestor.superview) {
    CGColorRef bg = ancestor.layer.backgroundColor;
    if (bg != NULL && CGColorGetAlpha(bg) >= 1.0f - 1e-4f) {
      backdropFill = [UIColor colorWithCGColor:bg];
      break;
    }
    if ([ancestor isKindOfClass:[UIWindow class]]) {
      break;
    }
  }
  if (!backdropFill) {
    backdropFill = UIColor.systemBackgroundColor;
  }

  host.layer.hidden = YES;

  UIGraphicsImageRendererFormat *captureFmt = [UIGraphicsImageRendererFormat preferredFormat];
  captureFmt.scale = scale;
  UIGraphicsImageRenderer *captureRenderer = [[UIGraphicsImageRenderer alloc] initWithSize:captureSize
                                                                                    format:captureFmt];
  UIImage *backdropImage = [captureRenderer imageWithActions:^(UIGraphicsImageRendererContext *rendererCtx) {
    [backdropFill setFill];
    UIRectFill(CGRectMake(0, 0, captureSize.width, captureSize.height));
    CGContextTranslateCTM(rendererCtx.CGContext, -hostRectInRoot.origin.x, -hostRectInRoot.origin.y);
    [renderRoot.layer renderInContext:rendererCtx.CGContext];
  }];

  host.layer.hidden = NO;

  CIContext *ciContext = [self _ciContext];
  CIImage *ciImage = [[CIImage alloc] initWithImage:backdropImage];
  CIImage *filtered = [RCTBackdropFilterUtils applyCIFilterFunctions:_filterFunctions toImage:ciImage scale:scale];

  CGColorRef bgColor = host.layer.backgroundColor;
  if (!bgColor) {
    bgColor = self.hostBackgroundColorLayer.backgroundColor;
  }
  if (bgColor && CGColorGetAlpha(bgColor) > 0) {
    CIColor *ciColor = [[CIColor alloc] initWithCGColor:bgColor];
    CIImage *tint = [[CIImage imageWithColor:ciColor] imageByCroppingToRect:filtered.extent];
    CIFilter *over = [CIFilter filterWithName:@"CISourceOverCompositing"];
    [over setValue:tint forKey:kCIInputImageKey];
    [over setValue:filtered forKey:kCIInputBackgroundImageKey];
    filtered = over.outputImage;
  }

  CGImageRef cgImage = [ciContext createCGImage:filtered fromRect:filtered.extent];

  if (!cgImage) {
    self.contents = nil;
    return;
  }

  self.contents = (__bridge id)cgImage;
  self.contentsScale = scale;
  CGImageRelease(cgImage);
}

@end
