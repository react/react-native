/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTImageComponentView.h"

#import <React/RCTAssert.h>
#import <React/RCTConversions.h>
#import <React/RCTImageBlurUtils.h>
#import <React/RCTImageResponseObserverProxy.h>
#import <react/renderer/components/image/ImageComponentDescriptor.h>
#import <react/renderer/components/image/ImageEventEmitter.h>
#import <react/renderer/components/image/ImageProps.h>
#import <react/renderer/imagemanager/ImageRequest.h>
#import <react/renderer/imagemanager/RCTImagePrimitivesConversions.h>

using namespace facebook::react;

@implementation RCTImageComponentView {
  ImageShadowNode::ConcreteState::Shared _state;
  std::shared_ptr<RCTImageResponseObserverProxy> _imageResponseObserverProxy;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    const auto &defaultProps = ImageShadowNode::defaultSharedProps();
    _props = defaultProps;

    _imageView = [RCTUIImageViewAnimated new];
    _imageView.clipsToBounds = YES;
    _imageView.contentMode = RCTContentModeFromImageResizeMode(defaultProps->resizeMode);
    _imageView.layer.minificationFilter = kCAFilterTrilinear;
    _imageView.layer.magnificationFilter = kCAFilterTrilinear;

    _imageResponseObserverProxy = std::make_shared<RCTImageResponseObserverProxy>(self);

    self.contentView = _imageView;
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ImageComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldImageProps = static_cast<const ImageProps &>(*_props);
  const auto &newImageProps = static_cast<const ImageProps &>(*props);

  // `resizeMode`
  if (oldImageProps.resizeMode != newImageProps.resizeMode) {
    _imageView.contentMode = RCTContentModeFromImageResizeMode(newImageProps.resizeMode);
  }

  // `tintColor`
  if (oldImageProps.tintColor != newImageProps.tintColor) {
    _imageView.tintColor = RCTUIColorFromSharedColor(newImageProps.tintColor);
  }

  [super updateProps:props oldProps:oldProps];
}

- (NSObject *)accessibilityElement
{
  return _imageView;
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  RCTAssert(state, @"`state` must not be null.");
  RCTAssert(
      std::dynamic_pointer_cast<const ImageShadowNode::ConcreteState>(state),
      @"`state` must be a pointer to `ImageShadowNode::ConcreteState`.");

  auto oldImageState = std::static_pointer_cast<const ImageShadowNode::ConcreteState>(_state);
  auto newImageState = std::static_pointer_cast<const ImageShadowNode::ConcreteState>(state);

  [self _setStateAndResubscribeImageResponseObserver:newImageState];

  bool havePreviousData = oldImageState && oldImageState->getData().getImageSource() != ImageSource{};

  if (!havePreviousData ||
      (newImageState && newImageState->getData().getImageSource() != oldImageState->getData().getImageSource())) {
    // Loading actually starts a little before this, but this is the first time we know
    // the image is loading and can fire an event from this component
    static_cast<const ImageEventEmitter &>(*_eventEmitter).onLoadStart();

    // TODO (T58941612): Tracking for visibility should be done directly on this class.
    // For now, we consolidate instrumentation logic in the image loader, so that pre-Fabric gets the same treatment.
  }
}

- (void)_setStateAndResubscribeImageResponseObserver:(const ImageShadowNode::ConcreteState::Shared &)state
{
  if (_state) {
    const auto &imageRequest = _state->getData().getImageRequest();
    auto &observerCoordinator = imageRequest.getObserverCoordinator();
    observerCoordinator.removeObserver(_imageResponseObserverProxy);
  }

  _state = state;

  if (_state) {
    auto &observerCoordinator = _state->getData().getImageRequest().getObserverCoordinator();
    observerCoordinator.addObserver(_imageResponseObserverProxy);
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  [self _setStateAndResubscribeImageResponseObserver:nullptr];
  _imageView.image = nil;
}

#pragma mark - RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image metadata:(id)metadata fromObserver:(const void *)observer
{
  if (!_eventEmitter || !_state) {
    // Notifications are delivered asynchronously and might arrive after the view is already recycled.
    // In the future, we should incorporate an `EventEmitter` into a separate object owned by `ImageRequest` or `State`.
    // See for more info: T46311063.
    return;
  }

  auto imageSource = _state->getData().getImageSource();
  imageSource.size = {.width = image.size.width, .height = image.size.height};

  static_cast<const ImageEventEmitter &>(*_eventEmitter).onLoad(imageSource);
  static_cast<const ImageEventEmitter &>(*_eventEmitter).onLoadEnd();

  const auto &imageProps = static_cast<const ImageProps &>(*_props);

  if (imageProps.tintColor) {
    image = [image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
  }

  if (imageProps.resizeMode == ImageResizeMode::Repeat) {
    image = [image resizableImageWithCapInsets:RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeTile];
  } else if (imageProps.capInsets != EdgeInsets()) {
    // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired.
    image = [image resizableImageWithCapInsets:RCTUIEdgeInsetsFromEdgeInsets(imageProps.capInsets)
                                  resizingMode:UIImageResizingModeStretch];
  }

  if (imageProps.blurRadius > __FLT_EPSILON__) {
    // Blur on a background thread to avoid blocking interaction.
    CGFloat blurRadius = imageProps.blurRadius;
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
      UIImage *blurredImage = RCTBlurredImageWithRadius(image, blurRadius);
      RCTExecuteOnMainQueue(^{
        self->_imageView.image = blurredImage;
      });
    });
  } else {
    self->_imageView.image = image;
  }
}

- (void)didReceiveProgress:(float)progress
                    loaded:(int64_t)loaded
                     total:(int64_t)total
              fromObserver:(const void *)observer
{
  if (!_eventEmitter) {
    return;
  }

  static_cast<const ImageEventEmitter &>(*_eventEmitter).onProgress(progress, loaded, total);
}

- (void)didReceiveFailure:(NSError *)error fromObserver:(const void *)observer
{
  _imageView.image = nil;

  if (!_eventEmitter) {
    return;
  }

  ImageErrorInfo info;

  if (error) {
    info.error = std::string([error.localizedDescription UTF8String]);
    id code = error.userInfo[@"httpStatusCode"];
    if (code) {
      info.responseCode = [code intValue];
    }
    id rspHeaders = error.userInfo[@"httpResponseHeaders"];
    if (rspHeaders) {
      for (NSString *key in rspHeaders) {
        id value = rspHeaders[key];
        info.httpResponseHeaders.push_back(
            std::pair<std::string, std::string>(std::string([key UTF8String]), std::string([value UTF8String])));
      }
    }
  }
  static_cast<const ImageEventEmitter &>(*_eventEmitter).onError(ImageErrorInfo(info));
  static_cast<const ImageEventEmitter &>(*_eventEmitter).onLoadEnd();
}

@end

#ifdef __cplusplus
extern "C" {
#endif

// Can't the import generated Plugin.h because plugins are not in this BUCK target
Class<RCTComponentViewProtocol> RCTImageCls(void);

#ifdef __cplusplus
}
#endif

Class<RCTComponentViewProtocol> RCTImageCls(void)
{
  return RCTImageComponentView.class;
}
