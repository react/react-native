/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBackgroundImageURLLoader.h"

#import <React/RCTAssert.h>
#import <React/RCTImageResponseDelegate.h>
#import <React/RCTImageResponseObserverProxy.h>
#import <React/RCTLog.h>
#import <react/renderer/imagemanager/ImageManager.h>

#include <algorithm>
#include <optional>

using namespace facebook::react;

/*
 * The image for one uri. It is the delegate of its own observer proxy. A
 * callback that is queued on the main queue retains it, so the callback
 * always reaches the entry it was made for, even after a cancel.
 */
@interface RCTBackgroundImageURLEntry : NSObject <RCTImageResponseDelegate>

@property (nonatomic, readonly) std::string uri;
@property (nonatomic, readonly, nullable) UIImage *image;

- (instancetype)initWithURI:(std::string)uri onLoad:(void (^)(void))onLoad;
- (void)startWithImageManager:(const ImageManager &)imageManager surfaceId:(SurfaceId)surfaceId;
- (void)cancel;

@end

@implementation RCTBackgroundImageURLEntry {
  void (^_onLoad)(void);
  std::optional<ImageRequest> _imageRequest;
  std::shared_ptr<RCTImageResponseObserverProxy> _observer;
  BOOL _cancelled;
}

- (instancetype)initWithURI:(std::string)uri onLoad:(void (^)(void))onLoad
{
  if (self = [super init]) {
    _uri = std::move(uri);
    _onLoad = onLoad;
  }
  return self;
}

- (void)dealloc
{
  [self cancel];
}

- (void)startWithImageManager:(const ImageManager &)imageManager surfaceId:(SurfaceId)surfaceId
{
  ImageSource imageSource;
  imageSource.type = ImageSource::Type::Remote;
  imageSource.uri = _uri;
  // CSS treats one image pixel as one point. Bundled assets send their
  // natural size in props instead.
  imageSource.scale = 1;
  _imageRequest.emplace(imageManager.requestImage(imageSource, surfaceId));
  _observer = std::make_shared<RCTImageResponseObserverProxy>(self);
  // Can deliver a cached response synchronously.
  _imageRequest->getObserverCoordinator().addObserver(_observer);
}

- (void)cancel
{
  _cancelled = YES;
  if (_imageRequest) {
    // Removing the last observer cancels the load if it is still running.
    _imageRequest->getObserverCoordinator().removeObserver(_observer);
  }
}

#pragma mark - RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image metadata:(id)metadata fromObserver:(const void *)observer
{
  if (_cancelled) {
    return;
  }
  _image = image;
  _onLoad();
}

- (void)didReceiveProgress:(float)progress
                    loaded:(int64_t)loaded
                     total:(int64_t)total
              fromObserver:(const void *)observer
{
}

- (void)didReceiveFailure:(NSError *)error fromObserver:(const void *)observer
{
  if (_cancelled) {
    return;
  }
  RCTLogWarn(@"Failed to load background image: %s - %@", _uri.c_str(), error);
}

@end

@implementation RCTBackgroundImageURLLoader {
  std::shared_ptr<ImageManager> _imageManager;
  void (^_onLoad)(void);
  NSArray<RCTBackgroundImageURLEntry *> *_entries;
}

- (instancetype)initWithImageManager:(std::shared_ptr<ImageManager>)imageManager onLoad:(void (^)(void))onLoad
{
  if (self = [super init]) {
    _imageManager = std::move(imageManager);
    _onLoad = onLoad;
    _entries = @[];
  }
  return self;
}

- (void)dealloc
{
  for (RCTBackgroundImageURLEntry *entry in _entries) {
    [entry cancel];
  }
}

- (void)loadBackgroundImages:(const std::vector<BackgroundImage> &)backgroundImages surfaceId:(SurfaceId)surfaceId
{
  RCTAssertMainQueue();

  std::vector<std::string> uris;
  for (const auto &backgroundImage : backgroundImages) {
    if (const auto *urlBackgroundImage = std::get_if<URLBackgroundImage>(&backgroundImage)) {
      const auto &uri = urlBackgroundImage->uri;
      if (!uri.empty() && std::ranges::find(uris, uri) == uris.end()) {
        uris.push_back(uri);
      }
    }
  }

  BOOL unchanged = uris.size() == _entries.count;
  for (NSUInteger i = 0; unchanged && i < uris.size(); i++) {
    unchanged = _entries[i].uri == uris[i];
  }
  if (unchanged) {
    return;
  }

  NSMutableArray<RCTBackgroundImageURLEntry *> *entries = [NSMutableArray arrayWithCapacity:uris.size()];
  NSMutableArray<RCTBackgroundImageURLEntry *> *newEntries = [NSMutableArray new];
  for (const auto &uri : uris) {
    RCTBackgroundImageURLEntry *entry = [self entryForURI:uri];
    if (entry == nil) {
      entry = [[RCTBackgroundImageURLEntry alloc] initWithURI:uri onLoad:_onLoad];
      [newEntries addObject:entry];
    }
    [entries addObject:entry];
  }

  for (RCTBackgroundImageURLEntry *entry in _entries) {
    if (![entries containsObject:entry]) {
      [entry cancel];
    }
  }

  _entries = entries;
  for (RCTBackgroundImageURLEntry *entry in newEntries) {
    [entry startWithImageManager:*_imageManager surfaceId:surfaceId];
  }
}

- (UIImage *)imageForURI:(const std::string &)uri
{
  return [self entryForURI:uri].image;
}

- (nullable RCTBackgroundImageURLEntry *)entryForURI:(const std::string &)uri
{
  for (RCTBackgroundImageURLEntry *entry in _entries) {
    if (entry.uri == uri) {
      return entry;
    }
  }
  return nil;
}

@end
