/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBackgroundImageURLLoader.h"

#import <React/RCTImageResponseObserverProxy.h>
#import <React/RCTLog.h>
#import <react/renderer/components/view/ViewState.h>

#include <map>
#include <memory>
#include <string>

using namespace facebook::react;

@implementation RCTBackgroundImageURLLoader {
  ViewShadowNode::ConcreteState::Shared _state;
  std::map<std::string, std::shared_ptr<RCTImageResponseObserverProxy>> _uriToObserver;
  NSMutableDictionary<NSString *, UIImage *> *_loadedImages;
  NSMutableSet<NSString *> *_completedUris;
}

- (instancetype)init
{
  if (self = [super init]) {
    _loadedImages = [NSMutableDictionary new];
    _completedUris = [NSMutableSet new];
  }
  return self;
}

- (void)updateStateWithNewState:(ViewShadowNode::ConcreteState::Shared)state
                       oldState:(ViewShadowNode::ConcreteState::Shared)oldState
{
  const auto *oldRequests = oldState ? &oldState->getData().getBackgroundImageRequests() : nullptr;
  const auto *newRequests = state ? &state->getData().getBackgroundImageRequests() : nullptr;

  if (oldRequests && newRequests && *oldRequests == *newRequests) {
    return;
  }

  if (oldRequests) {
    for (const auto &request : *oldRequests) {
      if (request.imageRequest) {
        auto it = _uriToObserver.find(request.imageSource.uri);
        if (it != _uriToObserver.end()) {
          auto &observerCoordinator = request.imageRequest->getObserverCoordinator();
          observerCoordinator.removeObserver(it->second);
        }
      }
    }
  }

  _state = state;
  _uriToObserver.clear();
  [_loadedImages removeAllObjects];
  [_completedUris removeAllObjects];

  if (newRequests) {
    // `addObserver` replays a cached image synchronously, so register every uri
    // first. Otherwise the completion check in notifyDelegateIfAllImagesLoaded
    // runs against a half-filled map.
    for (const auto &request : *newRequests) {
      if (request.imageRequest) {
        _uriToObserver.try_emplace(request.imageSource.uri);
      }
    }

    for (const auto &request : *newRequests) {
      if (request.imageRequest) {
        auto it = _uriToObserver.find(request.imageSource.uri);
        // A null entry is a uri that has not been attached yet. Duplicated uris
        // share a single observer, matching the previous behaviour.
        if (it != _uriToObserver.end() && it->second == nullptr) {
          it->second = std::make_shared<RCTImageResponseObserverProxy>(self);
          auto &observerCoordinator = request.imageRequest->getObserverCoordinator();
          observerCoordinator.addObserver(it->second);
        }
      }
    }
  }
}

- (UIImage *)loadedImageForUri:(NSString *)uri
{
  return _loadedImages[uri];
}

- (void)reset
{
  if (_state) {
    const auto &requests = _state->getData().getBackgroundImageRequests();
    for (const auto &request : requests) {
      if (request.imageRequest) {
        auto it = _uriToObserver.find(request.imageSource.uri);
        if (it != _uriToObserver.end()) {
          auto &observerCoordinator = request.imageRequest->getObserverCoordinator();
          observerCoordinator.removeObserver(it->second);
        }
      }
    }
  }

  _state = nullptr;
  _uriToObserver.clear();
  [_loadedImages removeAllObjects];
  [_completedUris removeAllObjects];
}

#pragma mark - RCTImageResponseDelegate

- (void)didReceiveImage:(UIImage *)image metadata:(id)metadata fromObserver:(const void *)observer
{
  for (const auto &[uri, observerProxy] : _uriToObserver) {
    if (observerProxy.get() == observer) {
      NSString *nsUri = [NSString stringWithUTF8String:uri.c_str()];
      _loadedImages[nsUri] = image;
      [_completedUris addObject:nsUri];
      break;
    }
  }

  [self notifyDelegateIfAllImagesLoaded];
}

- (void)didReceiveProgress:(float)progress
                    loaded:(int64_t)loaded
                     total:(int64_t)total
              fromObserver:(const void *)observer
{
  // Progress tracking not needed for background images
}

- (void)didReceiveFailure:(NSError *)error fromObserver:(const void *)observer
{
  for (const auto &[uri, observerProxy] : _uriToObserver) {
    if (observerProxy.get() == observer) {
      NSString *nsUri = [NSString stringWithUTF8String:uri.c_str()];
      RCTLogWarn(@"Failed to load background image: %@ - %@", nsUri, error);
      [_completedUris addObject:nsUri];
      break;
    }
  }

  [self notifyDelegateIfAllImagesLoaded];
}

- (void)notifyDelegateIfAllImagesLoaded
{
  if (_completedUris.count == _uriToObserver.size()) {
    [_delegate backgroundImagesDidLoad];
  }
}

@end
