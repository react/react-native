/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <React/RCTAssert.h>
#import <React/RCTConstants.h>

#import <React/RCTImageComponentView.h>
#import <React/RCTParagraphComponentView.h>
#import <React/RCTViewComponentView.h>
#import <unordered_map>

using namespace facebook;
using namespace facebook::react;

const NSInteger RCTComponentViewRegistryRecyclePoolMaxSize = 1024;

@implementation RCTComponentViewRegistry {
  std::unordered_map<Tag, RCTComponentViewDescriptor> _registry;
  std::unordered_map<ComponentHandle, std::vector<RCTComponentViewDescriptor>> _recyclePool;
  std::shared_ptr<ImageManager> _imageManager;
}

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewFactory = [RCTComponentViewFactory currentComponentViewFactory];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleApplicationDidReceiveMemoryWarningNotification)
                                                 name:UIApplicationDidReceiveMemoryWarningNotification
                                               object:nil];
  }

  return self;
}

- (const RCTComponentViewDescriptor &)dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                                                          tag:(Tag)tag
{
  RCTAssertMainQueue();

  RCTAssert(
      _registry.find(tag) == _registry.end(),
      @"RCTComponentViewRegistry: Attempt to dequeue already registered component.");

  auto componentViewDescriptor = [self _dequeueComponentViewWithComponentHandle:componentHandle];
  componentViewDescriptor.view.tag = tag;
  auto it = _registry.insert({tag, componentViewDescriptor});
  return it.first->second;
}

- (void)enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                            tag:(Tag)tag
                        componentViewDescriptor:(RCTComponentViewDescriptor)componentViewDescriptor
{
  RCTAssertMainQueue();

  RCTAssert(
      _registry.find(tag) != _registry.end(), @"RCTComponentViewRegistry: Attempt to enqueue unregistered component.");

  _registry.erase(tag);
  componentViewDescriptor.view.tag = 0;
  [self _enqueueComponentViewWithComponentHandle:componentHandle componentViewDescriptor:componentViewDescriptor];
}

- (const RCTComponentViewDescriptor &)componentViewDescriptorWithTag:(Tag)tag
{
  RCTAssertMainQueue();
  auto iterator = _registry.find(tag);
  RCTAssert(iterator != _registry.end(), @"RCTComponentViewRegistry: Attempt to query unregistered component.");
  return iterator->second;
}

- (nullable UIView<RCTComponentViewProtocol> *)findComponentViewWithTag:(Tag)tag
{
  RCTAssertMainQueue();
  auto iterator = _registry.find(tag);
  if (iterator == _registry.end()) {
    return nil;
  }
  return iterator->second.view;
}

- (RCTComponentViewDescriptor)_dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  RCTAssertMainQueue();
  auto &recycledViews = _recyclePool[componentHandle];

  if (recycledViews.empty()) {
    auto componentViewDescriptor = [self.componentViewFactory createComponentViewWithComponentHandle:componentHandle];
    if (_imageManager && [componentViewDescriptor.view isKindOfClass:[RCTViewComponentView class]]) {
      [(RCTViewComponentView *)componentViewDescriptor.view setBackgroundImageManager:_imageManager];
    }
    return componentViewDescriptor;
  }

  auto componentViewDescriptor = recycledViews.back();
  recycledViews.pop_back();
  return componentViewDescriptor;
}

- (void)_enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                         componentViewDescriptor:(RCTComponentViewDescriptor)componentViewDescriptor
{
  RCTAssertMainQueue();
  auto &recycledViews = _recyclePool[componentHandle];

  if (recycledViews.size() > RCTComponentViewRegistryRecyclePoolMaxSize || !componentViewDescriptor.shouldBeRecycled) {
    [componentViewDescriptor.view invalidate];
    return;
  }

  RCTAssert(
      componentViewDescriptor.view.superview == nil, @"RCTComponentViewRegistry: Attempt to recycle a mounted view.");
  [componentViewDescriptor.view prepareForRecycle];

  recycledViews.push_back(componentViewDescriptor);
}

- (void)setImageManager:(std::shared_ptr<ImageManager>)imageManager
{
  _imageManager = std::move(imageManager);
}

- (void)handleApplicationDidReceiveMemoryWarningNotification
{
  _recyclePool.clear();
}

@end
