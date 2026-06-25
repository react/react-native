/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <mach/mach_time.h>
#import <objc/runtime.h>
#import <atomic>

#import <ImageIO/ImageIO.h>

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTImageCache.h>
#import <React/RCTImageLoader.h>
#import <React/RCTImageLoaderWithAttributionProtocol.h>
#import <React/RCTImageUtils.h>
#import <React/RCTLog.h>
#import <React/RCTNetworking.h>
#import <React/RCTUtils.h>

#import "RCTImagePlugins.h"

using namespace facebook::react;

static NSInteger RCTImageBytesForImage(UIImage *image)
{
  NSInteger singleImageBytes = (NSInteger)(image.size.width * image.size.height * image.scale * image.scale * 4);
  return image.images ? image.images.count * singleImageBytes : singleImageBytes;
}

static auto currentRequestCount = std::atomic<uint64_t>(0);

static NSError *addResponseHeadersToError(NSError *originalError, NSHTTPURLResponse *response)
{
  NSMutableDictionary<NSString *, id> *_userInfo =
      (NSMutableDictionary<NSString *, id> *)originalError.userInfo.mutableCopy;
  _userInfo[@"httpStatusCode"] = [NSNumber numberWithInt:response.statusCode];
  _userInfo[@"httpResponseHeaders"] = response.allHeaderFields;
  NSError *error = [NSError errorWithDomain:originalError.domain code:originalError.code userInfo:_userInfo];

  return error;
}

@interface RCTImageLoader () <NativeImageLoaderIOSSpec, RCTImageLoaderWithAttributionProtocol>

@end

@implementation UIImage (React)

- (NSInteger)reactDecodedImageBytes
{
  NSNumber *imageBytes = objc_getAssociatedObject(self, _cmd);
  if (!imageBytes) {
    imageBytes = @(RCTImageBytesForImage(self));
  }
  return [imageBytes integerValue];
}

- (void)setReactDecodedImageBytes:(NSInteger)bytes
{
  objc_setAssociatedObject(self, @selector(reactDecodedImageBytes), @(bytes), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

@end

@implementation RCTImageLoader {
  std::atomic<BOOL> _didSetup;
  std::mutex _setupLock;
  NSArray<id<RCTImageURLLoader>> * (^_loadersProvider)(RCTModuleRegistry *);
  NSArray<id<RCTImageDataDecoder>> * (^_decodersProvider)(RCTModuleRegistry *);
  NSArray<id<RCTImageURLLoader>> *_loaders;
  NSArray<id<RCTImageDataDecoder>> *_decoders;
  NSOperationQueue *_imageDecodeQueue;
  dispatch_queue_t _URLRequestQueue;
  id<RCTImageCache> _imageCache;
  NSMutableArray *_pendingTasks;
  NSInteger _activeTasks;
  NSMutableArray *_pendingDecodes;
  NSInteger _scheduledDecodes;
  NSUInteger _activeBytes;
  __weak id<RCTImageRedirectProtocol> _redirectDelegate;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;
@synthesize maxConcurrentLoadingTasks = _maxConcurrentLoadingTasks;
@synthesize maxConcurrentDecodingTasks = _maxConcurrentDecodingTasks;
@synthesize maxConcurrentDecodingBytes = _maxConcurrentDecodingBytes;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  return [self initWithRedirectDelegate:nil];
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)initWithRedirectDelegate:(id<RCTImageRedirectProtocol>)redirectDelegate
{
  if (self = [super init]) {
    _redirectDelegate = redirectDelegate;
    _didSetup = NO;
  }
  return self;
}

- (instancetype)initWithRedirectDelegate:(id<RCTImageRedirectProtocol>)redirectDelegate
                         loadersProvider:(NSArray<id<RCTImageURLLoader>> * (^)(RCTModuleRegistry *))getLoaders
                        decodersProvider:(NSArray<id<RCTImageDataDecoder>> * (^)(RCTModuleRegistry *))getHandlers
{
  if (self = [self initWithRedirectDelegate:redirectDelegate]) {
    _loadersProvider = getLoaders;
    _decodersProvider = getHandlers;
  }
  return self;
}

- (void)setUp
{
  std::lock_guard<std::mutex> guard(_setupLock);
  if (!_didSetup) {
    // Set defaults
    _maxConcurrentLoadingTasks = _maxConcurrentLoadingTasks ?: 4;
    _maxConcurrentDecodingTasks = _maxConcurrentDecodingTasks ?: 2;
    _maxConcurrentDecodingBytes = _maxConcurrentDecodingBytes ?: 30 * 1024 * 1024; // 30MB

    _URLRequestQueue = dispatch_queue_create("com.facebook.react.ImageLoaderURLRequestQueue", DISPATCH_QUEUE_SERIAL);

    // Get loaders, sorted in reverse priority order (highest priority first)
    if (_loadersProvider != nil) {
      _loaders = _loadersProvider(self.moduleRegistry);
    } else {
      RCTAssert(_bridge, @"Trying to find RCTImageURLLoaders and bridge not set.");
      _loaders = [_bridge modulesConformingToProtocol:@protocol(RCTImageURLLoader)];
    }
    _loaders =
        [_loaders sortedArrayUsingComparator:^NSComparisonResult(id<RCTImageURLLoader> a, id<RCTImageURLLoader> b) {
          float priorityA = [a respondsToSelector:@selector(loaderPriority)] ? [a loaderPriority] : 0;
          float priorityB = [b respondsToSelector:@selector(loaderPriority)] ? [b loaderPriority] : 0;
          if (priorityA > priorityB) {
            return NSOrderedAscending;
          } else if (priorityA < priorityB) {
            return NSOrderedDescending;
          } else {
            return NSOrderedSame;
          }
        }];

    // Get decoders, sorted in reverse priority order (highest priority first)
    if (_decodersProvider != nil) {
      _decoders = _decodersProvider(self.moduleRegistry);
    } else {
      RCTAssert(_bridge, @"Trying to find RCTImageDataDecoders and bridge not set.");
      _decoders = [_bridge modulesConformingToProtocol:@protocol(RCTImageDataDecoder)];
    }
    _decoders = [_decoders
        sortedArrayUsingComparator:^NSComparisonResult(id<RCTImageDataDecoder> a, id<RCTImageDataDecoder> b) {
          float priorityA = [a respondsToSelector:@selector(decoderPriority)] ? [a decoderPriority] : 0;
          float priorityB = [b respondsToSelector:@selector(decoderPriority)] ? [b decoderPriority] : 0;
          if (priorityA > priorityB) {
            return NSOrderedAscending;
          } else if (priorityA < priorityB) {
            return NSOrderedDescending;
          } else {
            return NSOrderedSame;
          }
        }];

    _didSetup = YES;
  }
}

- (float)handlerPriority
{
  return 2;
}
#pragma mark - RCTImageLoaderProtocol 1/3

- (id<RCTImageCache>)imageCache
{
  if (!_imageCache) {
    // set up with default cache
    _imageCache = [RCTImageCache new];
  }
  return _imageCache;
}

- (void)setImageCache:(id<RCTImageCache>)cache
{
  if (_imageCache) {
    RCTLogWarn(@"RCTImageCache was already set and has now been overridden.");
  }
  _imageCache = cache;
}

- (id<RCTImageURLLoader>)imageURLLoaderForURL:(NSURL *)URL
{
  if (!_didSetup) {
    [self setUp];
  }

  NSArray<id<RCTImageURLLoader>> *loaders = _loaders;

  if (RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<RCTImageURLLoader> previousLoader = nil;
    for (id<RCTImageURLLoader> loader in loaders) {
      float priority = [loader respondsToSelector:@selector(loaderPriority)] ? [loader loaderPriority] : 0;
      if (previousLoader && priority < previousPriority) {
        return previousLoader;
      }
      if ([loader canLoadImageURL:URL]) {
        if (previousLoader) {
          if (priority == previousPriority) {
            RCTLogError(
                @"The RCTImageURLLoaders %@ and %@ both reported that"
                 " they can load the URL %@, and have equal priority"
                 " (%g). This could result in non-deterministic behavior.",
                loader,
                previousLoader,
                URL,
                priority);
          }
        } else {
          previousLoader = loader;
          previousPriority = priority;
        }
      }
    }
    return previousLoader;
  }

  // Normal code path
  for (id<RCTImageURLLoader> loader in loaders) {
    if ([loader canLoadImageURL:URL]) {
      return loader;
    }
  }
  return nil;
}

#pragma mark - Private Image Decoding & Resizing

- (id<RCTImageDataDecoder>)imageDataDecoderForData:(NSData *)data
{
  if (!_didSetup) {
    [self setUp];
  }

  NSArray<id<RCTImageDataDecoder>> *decoders = _decoders;

  if (RCT_DEBUG) {
    // Check for handler conflicts
    float previousPriority = 0;
    id<RCTImageDataDecoder> previousDecoder = nil;
    for (id<RCTImageDataDecoder> decoder in decoders) {
      float priority = [decoder respondsToSelector:@selector(decoderPriority)] ? [decoder decoderPriority] : 0;
      if (previousDecoder && priority < previousPriority) {
        return previousDecoder;
      }
      if ([decoder canDecodeImageData:data]) {
        if (previousDecoder) {
          if (priority == previousPriority) {
            RCTLogError(
                @"The RCTImageDataDecoders %@ and %@ both reported that"
                 " they can decode the data <NSData %p; %tu bytes>, and"
                 " have equal priority (%g). This could result in"
                 " non-deterministic behavior.",
                decoder,
                previousDecoder,
                data,
                data.length,
                priority);
          }
        } else {
          previousDecoder = decoder;
          previousPriority = priority;
        }
      }
    }
    return previousDecoder;
  }

  // Normal code path
  for (id<RCTImageDataDecoder> decoder in decoders) {
    if ([decoder canDecodeImageData:data]) {
      return decoder;
    }
  }
  return nil;
}

static UIImage *RCTResizeImageIfNeeded(UIImage *image, CGSize size, CGFloat scale, RCTResizeMode resizeMode)
{
  if (CGSizeEqualToSize(size, CGSizeZero) || CGSizeEqualToSize(image.size, CGSizeZero) ||
      CGSizeEqualToSize(image.size, size)) {
    return image;
  }
  CGRect targetSize = RCTTargetRect(image.size, size, scale, resizeMode);
  CGAffineTransform transform = RCTTransformFromTargetRect(image.size, targetSize);
  image = RCTTransformImage(image, size, scale, transform);
  return image;
}

/*
 * This function abstracts away the migration from loadImageForURL to loadImageURL by handling checking whether
 * the interface responds to the new function signature and calling the appropriate function based on the result.
 */
static RCTImageLoaderCancellationBlock RCTLoadImageURLFromLoader(
    id<RCTImageURLLoader> loadHandler,
    NSURL *imageURL,
    CGSize size,
    CGFloat scale,
    RCTResizeMode resizeMode,
    RCTImageLoaderProgressBlock progressHandler,
    RCTImageLoaderPartialLoadBlock partialLoadHandler,
    RCTImageLoaderCompletionBlockWithMetadata completionHandler)
{
  if ([loadHandler
          respondsToSelector:@selector
          (loadImageForURL:size:scale:resizeMode:progressHandler:partialLoadHandler:completionHandlerWithMetadata:)]) {
    return [loadHandler loadImageForURL:imageURL
                                   size:size
                                  scale:scale
                             resizeMode:resizeMode
                        progressHandler:progressHandler
                     partialLoadHandler:partialLoadHandler
          completionHandlerWithMetadata:^(NSError *error, UIImage *image, id metadata) {
            completionHandler(error, image, metadata);
          }];
  } else {
    return [loadHandler loadImageForURL:imageURL
                                   size:size
                                  scale:scale
                             resizeMode:resizeMode
                        progressHandler:progressHandler
                     partialLoadHandler:partialLoadHandler
                      completionHandler:^(NSError *error, UIImage *image) {
                        completionHandler(error, image, nil);
                      }];
  }
}

#pragma mark - RCTImageLoaderProtocol 2/3

- (nullable RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                           callback:(RCTImageLoaderCompletionBlock)callback
{
  return [self loadImageWithURLRequest:imageURLRequest priority:RCTImageLoaderPriorityImmediate callback:callback];
}

- (nullable RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                           priority:(RCTImageLoaderPriority)priority
                                                           callback:(RCTImageLoaderCompletionBlock)callback
{
  return [self loadImageWithURLRequest:imageURLRequest
                                  size:CGSizeZero
                                 scale:1
                               clipped:YES
                            resizeMode:RCTResizeModeStretch
                              priority:priority
                         progressBlock:nil
                      partialLoadBlock:nil
                       completionBlock:callback];
}

- (nullable RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                               size:(CGSize)size
                                                              scale:(CGFloat)scale
                                                            clipped:(BOOL)clipped
                                                         resizeMode:(RCTResizeMode)resizeMode
                                                      progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                                   partialLoadBlock:(RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                                    completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  return [self loadImageWithURLRequest:imageURLRequest
                                  size:size
                                 scale:scale
                               clipped:clipped
                            resizeMode:resizeMode
                              priority:RCTImageLoaderPriorityImmediate
                         progressBlock:progressBlock
                      partialLoadBlock:partialLoadBlock
                       completionBlock:completionBlock];
}

- (nullable RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                               size:(CGSize)size
                                                              scale:(CGFloat)scale
                                                            clipped:(BOOL)clipped
                                                         resizeMode:(RCTResizeMode)resizeMode
                                                           priority:(RCTImageLoaderPriority)priority
                                                      progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                                   partialLoadBlock:(RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                                    completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  RCTImageURLLoaderRequest *request = [self loadImageWithURLRequest:imageURLRequest
                                                               size:size
                                                              scale:scale
                                                            clipped:clipped
                                                         resizeMode:resizeMode
                                                           priority:priority
                                                        attribution:{}
                                                      progressBlock:progressBlock
                                                   partialLoadBlock:partialLoadBlock
                                                    completionBlock:^(NSError *error, UIImage *image, id metadata) {
                                                      completionBlock(error, image);
                                                    }];
  return ^{
    [request cancel];
  };
}

#pragma mark - Private Downloader Methods

- (void)dequeueTasks
{
  dispatch_async(_URLRequestQueue, ^{
    // Remove completed tasks
    NSMutableArray *tasksToRemove = nil;
    for (RCTNetworkTask *task in self->_pendingTasks.reverseObjectEnumerator) {
      switch (task.status) {
        case RCTNetworkTaskFinished:
          if (!tasksToRemove) {
            tasksToRemove = [NSMutableArray new];
          }
          [tasksToRemove addObject:task];
          self->_activeTasks--;
          break;
        case RCTNetworkTaskPending:
          break;
        case RCTNetworkTaskInProgress:
          // Check task isn't "stuck"
          if (task.requestToken == nil) {
            RCTLogWarn(@"Task orphaned for request %@", task.request);
            if (!tasksToRemove) {
              tasksToRemove = [NSMutableArray new];
            }
            [tasksToRemove addObject:task];
            self->_activeTasks--;
            [task cancel];
          }
          break;
      }
    }

    if (tasksToRemove) {
      [self->_pendingTasks removeObjectsInArray:tasksToRemove];
    }

    // Start queued decode
    NSInteger activeDecodes = self->_scheduledDecodes - self->_pendingDecodes.count;
    while (activeDecodes == 0 ||
           (self->_activeBytes <= self->_maxConcurrentDecodingBytes &&
            activeDecodes <= self->_maxConcurrentDecodingTasks)) {
      dispatch_block_t decodeBlock = self->_pendingDecodes.firstObject;
      if (decodeBlock) {
        [self->_pendingDecodes removeObjectAtIndex:0];
        decodeBlock();
      } else {
        break;
      }
    }

    // Start queued tasks
    for (RCTNetworkTask *task in self->_pendingTasks) {
      if (MAX(self->_activeTasks, self->_scheduledDecodes) >= self->_maxConcurrentLoadingTasks) {
        break;
      }
      if (task.status == RCTNetworkTaskPending) {
        [task start];
        self->_activeTasks++;
      }
    }
  });
}

/**
 * This returns either an image, or raw image data, depending on the loading
 * path taken. This is useful if you want to skip decoding, e.g. when preloading
 * the image, or retrieving metadata.
 */
- (RCTImageURLLoaderRequest *)_loadImageOrDataWithURLRequest:(NSURLRequest *)request
                                                        size:(CGSize)size
                                                       scale:(CGFloat)scale
                                                  resizeMode:(RCTResizeMode)resizeMode
                                                    priority:(RCTImageLoaderPriority)priority
                                                 attribution:(const ImageURLLoaderAttribution &)attribution
                                               progressBlock:(RCTImageLoaderProgressBlock)progressHandler
                                            partialLoadBlock:(RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                             completionBlock:(void (^)(
                                                                 NSError *error,
                                                                 id imageOrData,
                                                                 id imageMetadata,
                                                                 BOOL cacheResult,
                                                                 NSURLResponse *response))completionBlock
{
  {
    NSMutableURLRequest *mutableRequest = [request mutableCopy];
    [NSURLProtocol setProperty:@"RCTImageLoader" forKey:@"trackingName" inRequest:mutableRequest];

    // Add missing png extension
    if (request.URL.fileURL && request.URL.pathExtension.length == 0) {
      // Check if there exists a file with that url on disk already
      // This should fix issue https://github.com/facebook/react-native/issues/46870
      if ([[NSFileManager defaultManager] fileExistsAtPath:request.URL.path]) {
        mutableRequest.URL = request.URL;
      } else {
        // This is the default behavior in case there is no file on disk with no extension.
        // We assume that the extension is `png`.
        mutableRequest.URL = [request.URL URLByAppendingPathExtension:@"png"];
      }
    }
    if (_redirectDelegate != nil) {
      mutableRequest.URL = [_redirectDelegate redirectAssetsURL:mutableRequest.URL];
    }
    request = mutableRequest;
  }

  // Create a copy here so the value is retained when accessed in the blocks below.
  ImageURLLoaderAttribution attributionCopy(attribution);

  // Find suitable image URL loader
  id<RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:request.URL];
  BOOL requiresScheduling =
      [loadHandler respondsToSelector:@selector(requiresScheduling)] ? [loadHandler requiresScheduling] : YES;

  BOOL cacheResult =
      [loadHandler respondsToSelector:@selector(shouldCacheLoadedImages)] ? [loadHandler shouldCacheLoadedImages] : YES;

  if (request.cachePolicy == NSURLRequestReloadIgnoringLocalCacheData) {
    cacheResult = NO;
  }

  if (cacheResult && partialLoadHandler) {
    UIImage *image = [[self imageCache] imageForUrl:request.URL.absoluteString
                                               size:size
                                              scale:scale
                                         resizeMode:resizeMode];
    if (image) {
      partialLoadHandler(image);
    }
  }

  auto cancelled = std::make_shared<std::atomic<int>>(0);
  __block dispatch_block_t cancelLoad = nil;
  __block NSLock *cancelLoadLock = [NSLock new];
  NSString *requestId = [NSString stringWithFormat:@"%@-%llu", [[NSUUID UUID] UUIDString], currentRequestCount++];

  void (^completionHandler)(NSError *, id, id, NSURLResponse *) =
      ^(NSError *error, id imageOrData, id imageMetadata, NSURLResponse *response) {
        [cancelLoadLock lock];
        cancelLoad = nil;
        [cancelLoadLock unlock];

        // If we've received an image, we should try to set it synchronously,
        // if it's data, do decoding on a background thread.
        if (RCTIsMainQueue() && ![imageOrData isKindOfClass:[UIImage class]]) {
          // Most loaders do not return on the main thread, so caller is probably not
          // expecting it, and may do expensive post-processing in the callback
          dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            if (!std::atomic_load(cancelled.get())) {
              completionBlock(error, imageOrData, imageMetadata, cacheResult, response);
            }
          });
        } else if (!std::atomic_load(cancelled.get())) {
          if (response && error && [response isKindOfClass:[NSHTTPURLResponse class]]) {
            NSHTTPURLResponse *_httpResp = (NSHTTPURLResponse *)response;
            error = addResponseHeadersToError(error, _httpResp);
          }
          completionBlock(error, imageOrData, imageMetadata, cacheResult, response);
        }
      };

  // If the loader doesn't require scheduling we call it directly on
  // the main queue.
  if (loadHandler && !requiresScheduling) {
    if ([loadHandler conformsToProtocol:@protocol(RCTImageURLLoaderWithAttribution)]) {
      return [(id<RCTImageURLLoaderWithAttribution>)loadHandler
             loadImageForURL:request.URL
                        size:size
                       scale:scale
                  resizeMode:resizeMode
                   requestId:requestId
                    priority:priority
                 attribution:attributionCopy
             progressHandler:progressHandler
          partialLoadHandler:partialLoadHandler
           completionHandler:^(NSError *error, UIImage *image, id metadata) {
             completionHandler(error, image, metadata, nil);
           }];
    }

    RCTImageLoaderCancellationBlock cb = RCTLoadImageURLFromLoader(
        loadHandler,
        request.URL,
        size,
        scale,
        resizeMode,
        progressHandler,
        partialLoadHandler,
        ^(NSError *error, UIImage *image, id metadata) {
          completionHandler(error, image, metadata, nil);
        });
    return [[RCTImageURLLoaderRequest alloc] initWithRequestId:nil imageURL:request.URL cancellationBlock:cb];
  }

  // All access to URL cache must be serialized
  if (!_didSetup) {
    [self setUp];
  }

  __weak RCTImageLoader *weakSelf = self;
  dispatch_async(_URLRequestQueue, ^{
    __typeof(self) strongSelf = weakSelf;
    if (atomic_load(cancelled.get()) || !strongSelf) {
      return;
    }

    if (loadHandler) {
      dispatch_block_t cancelLoadLocal;
      if ([loadHandler conformsToProtocol:@protocol(RCTImageURLLoaderWithAttribution)]) {
        RCTImageURLLoaderRequest *loaderRequest = [(id<RCTImageURLLoaderWithAttribution>)loadHandler
               loadImageForURL:request.URL
                          size:size
                         scale:scale
                    resizeMode:resizeMode
                     requestId:requestId
                      priority:priority
                   attribution:attributionCopy
               progressHandler:progressHandler
            partialLoadHandler:partialLoadHandler
             completionHandler:^(NSError *error, UIImage *image, id metadata) {
               completionHandler(error, image, metadata, nil);
             }];
        cancelLoadLocal = loaderRequest.cancellationBlock;
      } else {
        cancelLoadLocal = RCTLoadImageURLFromLoader(
            loadHandler,
            request.URL,
            size,
            scale,
            resizeMode,
            progressHandler,
            partialLoadHandler,
            ^(NSError *error, UIImage *image, id metadata) {
              completionHandler(error, image, metadata, nil);
            });
      }
      [cancelLoadLock lock];
      cancelLoad = cancelLoadLocal;
      [cancelLoadLock unlock];
    } else {
      UIImage *image;
      if (cacheResult) {
        image = [[strongSelf imageCache] imageForUrl:request.URL.absoluteString
                                                size:size
                                               scale:scale
                                          resizeMode:resizeMode];
      }

      if (image) {
        completionHandler(nil, image, nil, nil);
      } else {
        // Use networking module to load image
        dispatch_block_t cancelLoadLocal =
            [strongSelf _loadURLRequest:request
                          progressBlock:progressHandler
                        completionBlock:^(NSError *error, id imageOrData, NSURLResponse *response) {
                          completionHandler(error, imageOrData, nil, response);
                        }];
        [cancelLoadLock lock];
        cancelLoad = cancelLoadLocal;
        [cancelLoadLock unlock];
      }
    }
  });

  return [[RCTImageURLLoaderRequest alloc] initWithRequestId:requestId
                                                    imageURL:request.URL
                                           cancellationBlock:^{
                                             BOOL alreadyCancelled = atomic_fetch_or(cancelled.get(), 1) ? YES : NO;
                                             if (alreadyCancelled) {
                                               return;
                                             }
                                             [cancelLoadLock lock];
                                             dispatch_block_t cancelLoadLocal = cancelLoad;
                                             cancelLoad = nil;
                                             [cancelLoadLock unlock];
                                             if (cancelLoadLocal) {
                                               cancelLoadLocal();
                                             }
                                           }];
}

- (RCTImageLoaderCancellationBlock)_loadURLRequest:(NSURLRequest *)request
                                     progressBlock:(RCTImageLoaderProgressBlock)progressHandler
                                   completionBlock:(void (^)(NSError *error, id imageOrData, NSURLResponse *response))
                                                       completionHandler
{
  RCTNetworking *networking = [_moduleRegistry moduleForName:"Networking"];
  if (!networking) {
    RCTLogError(
        @"No suitable image URL loader found for %@. You may need to "
         " import the RCTNetwork library in order to load images.",
        request.URL.absoluteString);
    completionHandler(RCTErrorWithMessage(@"RCTNetworking module is not available"), nil, nil);
    return NULL;
  }

  // Check if networking module can load image
  if (![networking canHandleRequest:request]) {
    RCTLogError(@"No suitable image URL loader found for %@", request.URL.absoluteString);
    completionHandler(RCTErrorWithMessage(@"No suitable URL loader for request"), nil, nil);
    return NULL;
  }

  // Use networking module to load image
  RCTURLRequestCompletionBlock processResponse = ^(NSURLResponse *response, NSData *data, NSError *error) {
    // Check for system errors
    if (error) {
      completionHandler(error, nil, response);
      return;
    } else if (!response) {
      completionHandler(RCTErrorWithMessage(@"Response metadata error"), nil, response);
      return;
    } else if (!data) {
      completionHandler(RCTErrorWithMessage(@"Unknown image download error"), nil, response);
      return;
    }

    // Check for http errors
    if ([response isKindOfClass:[NSHTTPURLResponse class]]) {
      NSInteger statusCode = ((NSHTTPURLResponse *)response).statusCode;
      if (statusCode != 200) {
        NSString *errorMessage = [NSString stringWithFormat:@"Failed to load %@", response.URL];
        NSDictionary *userInfo = @{NSLocalizedDescriptionKey : errorMessage};
        completionHandler(
            [[NSError alloc] initWithDomain:NSURLErrorDomain code:statusCode userInfo:userInfo], nil, response);
        return;
      }
    }

    // Call handler
    completionHandler(nil, data, response);
  };

  // Download image
  __weak __typeof(self) weakSelf = self;
  __block RCTNetworkTask *task =
      [networking networkTaskWithRequest:request
                         completionBlock:^(NSURLResponse *response, NSData *data, NSError *error) {
                           __typeof(self) strongSelf = weakSelf;
                           if (!strongSelf) {
                             return;
                           }

                           if (error || !response || !data) {
                             NSError *someError = nil;
                             if (error) {
                               someError = error;
                             } else if (!response) {
                               someError = RCTErrorWithMessage(@"Response metadata error");
                             } else {
                               someError = RCTErrorWithMessage(@"Unknown image download error");
                             }
                             completionHandler(someError, nil, response);
                             [strongSelf dequeueTasks];
                             return;
                           }

                           dispatch_async(strongSelf->_URLRequestQueue, ^{
                             // Process image data
                             processResponse(response, data, nil);

                             // Prepare for next task
                             [strongSelf dequeueTasks];
                           });
                         }];

  task.downloadProgressBlock = ^(int64_t progress, int64_t total) {
    if (progressHandler) {
      progressHandler(progress, total);
    }
  };

  if (task) {
    if (!_pendingTasks) {
      _pendingTasks = [NSMutableArray new];
    }
    [_pendingTasks addObject:task];
    [self dequeueTasks];
  }

  return ^{
    __typeof(self) strongSelf = weakSelf;
    if (!strongSelf || !task) {
      return;
    }
    dispatch_async(strongSelf->_URLRequestQueue, ^{
      [task cancel];
      task = nil;
    });
    [strongSelf dequeueTasks];
  };
}

#pragma mark - RCTImageLoaderWithAttributionProtocol

- (RCTImageURLLoaderRequest *)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                 size:(CGSize)size
                                                scale:(CGFloat)scale
                                              clipped:(BOOL)clipped
                                           resizeMode:(RCTResizeMode)resizeMode
                                             priority:(RCTImageLoaderPriority)priority
                                          attribution:(const ImageURLLoaderAttribution &)attribution
                                        progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                     partialLoadBlock:(RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                      completionBlock:(RCTImageLoaderCompletionBlockWithMetadata)completionBlock
{
  auto cancelled = std::make_shared<std::atomic<int>>(0);
  __block dispatch_block_t cancelLoad = nil;
  __block NSLock *cancelLoadLock = [NSLock new];
  dispatch_block_t cancellationBlock = ^{
    BOOL alreadyCancelled = atomic_fetch_or(cancelled.get(), 1) ? YES : NO;
    if (alreadyCancelled) {
      return;
    }
    [cancelLoadLock lock];
    dispatch_block_t cancelLoadLocal = cancelLoad;
    cancelLoad = nil;
    [cancelLoadLock unlock];
    if (cancelLoadLocal) {
      cancelLoadLocal();
    }
  };

  __weak RCTImageLoader *weakSelf = self;
  void (^completionHandler)(NSError *, id, id, BOOL, NSURLResponse *) =
      ^(NSError *error, id imageOrData, id imageMetadata, BOOL cacheResult, NSURLResponse *response) {
        __typeof(self) strongSelf = weakSelf;
        if (std::atomic_load(cancelled.get()) || !strongSelf) {
          return;
        }

        if (!imageOrData || [imageOrData isKindOfClass:[UIImage class]]) {
          [cancelLoadLock lock];
          cancelLoad = nil;
          [cancelLoadLock unlock];
          completionBlock(error, imageOrData, imageMetadata);
          return;
        }

        RCTImageLoaderCompletionBlock decodeCompletionHandler = ^(NSError *error_, UIImage *image) {
          if (cacheResult && image) {
            // Store decoded image in cache
            [[strongSelf imageCache] addImageToCache:image
                                                 URL:imageURLRequest.URL.absoluteString
                                                size:size
                                               scale:scale
                                          resizeMode:resizeMode
                                            response:response];
          }
          [cancelLoadLock lock];
          cancelLoad = nil;
          [cancelLoadLock unlock];
          completionBlock(error_, image, nil);
        };
        dispatch_block_t cancelLoadLocal = [strongSelf decodeImageData:imageOrData
                                                                  size:size
                                                                 scale:scale
                                                               clipped:clipped
                                                            resizeMode:resizeMode
                                                       completionBlock:decodeCompletionHandler];
        [cancelLoadLock lock];
        cancelLoad = cancelLoadLocal;
        [cancelLoadLock unlock];
      };

  RCTImageURLLoaderRequest *loaderRequest = [self _loadImageOrDataWithURLRequest:imageURLRequest
                                                                            size:size
                                                                           scale:scale
                                                                      resizeMode:resizeMode
                                                                        priority:priority
                                                                     attribution:attribution
                                                                   progressBlock:progressBlock
                                                                partialLoadBlock:partialLoadBlock
                                                                 completionBlock:completionHandler];
  [cancelLoadLock lock];
  cancelLoad = loaderRequest.cancellationBlock;
  [cancelLoadLock unlock];
  return [[RCTImageURLLoaderRequest alloc] initWithRequestId:loaderRequest.requestId
                                                    imageURL:imageURLRequest.URL
                                           cancellationBlock:cancellationBlock];
}

- (BOOL)shouldEnablePerfLoggingForRequestUrl:(NSURL *)url
{
  id<RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:url];
  if ([loadHandler respondsToSelector:@selector(shouldEnablePerfLogging)]) {
    return [(id<RCTImageLoaderLoggable>)loadHandler shouldEnablePerfLogging];
  }
  return NO;
}

- (void)trackURLImageVisibilityForRequest:(RCTImageURLLoaderRequest *)loaderRequest imageView:(UIView *)imageView
{
  if (!loaderRequest || !imageView) {
    return;
  }

  id<RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:loaderRequest.imageURL];
  if ([loadHandler respondsToSelector:@selector(trackURLImageVisibilityForRequest:imageView:)]) {
    [(id<RCTImageURLLoaderWithAttribution>)loadHandler trackURLImageVisibilityForRequest:loaderRequest
                                                                               imageView:imageView];
  }
}

- (void)trackURLImageRequestDidDestroy:(RCTImageURLLoaderRequest *)loaderRequest
{
  if (!loaderRequest) {
    return;
  }

  id<RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:loaderRequest.imageURL];
  if ([loadHandler respondsToSelector:@selector(trackURLImageRequestDidDestroy:)]) {
    [(id<RCTImageURLLoaderWithAttribution>)loadHandler trackURLImageRequestDidDestroy:loaderRequest];
  }
}

- (void)trackURLImageDidDestroy:(RCTImageURLLoaderRequest *)loaderRequest
{
  if (!loaderRequest) {
    return;
  }

  id<RCTImageURLLoader> loadHandler = [self imageURLLoaderForURL:loaderRequest.imageURL];
  if ([loadHandler respondsToSelector:@selector(trackURLImageDidDestroy:)]) {
    [(id<RCTImageURLLoaderWithAttribution>)loadHandler trackURLImageDidDestroy:loaderRequest];
  }
}

#pragma mark - RCTImageLoaderProtocol 3/3

- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)data
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                           clipped:(BOOL)clipped
                                        resizeMode:(RCTResizeMode)resizeMode
                                   completionBlock:(RCTImageLoaderCompletionBlock)completionBlock
{
  if (data.length == 0) {
    completionBlock(RCTErrorWithMessage(@"No image data"), nil);
    return ^{
    };
  }

  auto cancelled = std::make_shared<std::atomic<int>>(0);
  void (^completionHandler)(NSError *, UIImage *) = ^(NSError *error, UIImage *image) {
    if (RCTIsMainQueue()) {
      // Most loaders do not return on the main thread, so caller is probably not
      // expecting it, and may do expensive post-processing in the callback
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        if (!std::atomic_load(cancelled.get())) {
          completionBlock(error, clipped ? RCTResizeImageIfNeeded(image, size, scale, resizeMode) : image);
        }
      });
    } else if (!std::atomic_load(cancelled.get())) {
      completionBlock(error, clipped ? RCTResizeImageIfNeeded(image, size, scale, resizeMode) : image);
    }
  };

  id<RCTImageDataDecoder> imageDecoder = [self imageDataDecoderForData:data];
  if (imageDecoder) {
    return [imageDecoder decodeImageData:data
                                    size:size
                                   scale:scale
                              resizeMode:resizeMode
                       completionHandler:completionHandler]
        ?: ^{
          };
  } else {
    dispatch_block_t decodeBlock = ^{
      // Calculate the size, in bytes, that the decompressed image will require
      NSInteger decodedImageBytes = (NSInteger)((size.width * scale) * (size.height * scale) * 4);

      // Mark these bytes as in-use
      self->_activeBytes += decodedImageBytes;

      // Do actual decompression on a concurrent background queue
      dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        if (!std::atomic_load(cancelled.get())) {
          // Decompress the image data (this may be CPU and memory intensive)
          UIImage *image = RCTDecodeImageWithData(data, size, scale, resizeMode);

#if RCT_DEV
          CGSize imagePixelSize = RCTSizeInPixels(image.size, image.scale);
          CGSize screenPixelSize = RCTSizeInPixels(RCTScreenSize(), RCTScreenScale());
          if (imagePixelSize.width * imagePixelSize.height > screenPixelSize.width * screenPixelSize.height) {
            RCTLogInfo(
                @"[PERF ASSETS] Loading image at size %@, which is larger "
                 "than the screen size %@",
                NSStringFromCGSize(imagePixelSize),
                NSStringFromCGSize(screenPixelSize));
          }
#endif

          if (image) {
            completionHandler(nil, image);
          } else {
            NSString *errorMessage =
                [NSString stringWithFormat:@"Error decoding image data <NSData %p; %tu bytes>", data, data.length];
            NSError *finalError = RCTErrorWithMessage(errorMessage);
            completionHandler(finalError, nil);
          }
        }

        // We're no longer retaining the uncompressed data, so now we'll mark
        // the decoding as complete so that the loading task queue can resume.
        dispatch_async(self->_URLRequestQueue, ^{
          self->_scheduledDecodes--;
          self->_activeBytes -= decodedImageBytes;
          [self dequeueTasks];
        });
      });
    };

    if (!_didSetup) {
      [self setUp];
    }
    dispatch_async(_URLRequestQueue, ^{
      // The decode operation retains the compressed image data until it's
      // complete, so we'll mark it as having started, in order to block
      // further image loads from happening until we're done with the data.
      self->_scheduledDecodes++;

      if (!self->_pendingDecodes) {
        self->_pendingDecodes = [NSMutableArray new];
      }
      NSInteger activeDecodes = self->_scheduledDecodes - self->_pendingDecodes.count - 1;
      if (activeDecodes == 0 ||
          (self->_activeBytes <= self->_maxConcurrentDecodingBytes &&
           activeDecodes <= self->_maxConcurrentDecodingTasks)) {
        decodeBlock();
      } else {
        [self->_pendingDecodes addObject:decodeBlock];
      }
    });

    return ^{
      std::atomic_store(cancelled.get(), 1);
    };
  }
}

- (RCTImageLoaderCancellationBlock)getImageSizeForURLRequest:(NSURLRequest *)imageURLRequest
                                                       block:(void (^)(NSError *error, CGSize size))callback
{
  void (^completion)(NSError *, id, id, BOOL, NSURLResponse *) =
      ^(NSError *error, id imageOrData, id imageMetadata, BOOL cacheResult, NSURLResponse *response) {
        CGSize size;
        if ([imageOrData isKindOfClass:[NSData class]]) {
          NSDictionary *meta = RCTGetImageMetadata(imageOrData);

          NSInteger imageOrientation = [meta[(id)kCGImagePropertyOrientation] integerValue];
          switch (imageOrientation) {
            case kCGImagePropertyOrientationLeft:
            case kCGImagePropertyOrientationRight:
            case kCGImagePropertyOrientationLeftMirrored:
            case kCGImagePropertyOrientationRightMirrored:
              // swap width and height
              size = (CGSize){
                  [meta[(id)kCGImagePropertyPixelHeight] floatValue],
                  [meta[(id)kCGImagePropertyPixelWidth] floatValue],
              };
              break;
            case kCGImagePropertyOrientationUp:
            case kCGImagePropertyOrientationDown:
            case kCGImagePropertyOrientationUpMirrored:
            case kCGImagePropertyOrientationDownMirrored:
            default:
              size = (CGSize){
                  [meta[(id)kCGImagePropertyPixelWidth] floatValue],
                  [meta[(id)kCGImagePropertyPixelHeight] floatValue],
              };
              break;
          }
        } else {
          UIImage *image = imageOrData;
          size = (CGSize){
              image.size.width * image.scale,
              image.size.height * image.scale,
          };
        }
        callback(error, size);
      };

  RCTImageURLLoaderRequest *loaderRequest = [self _loadImageOrDataWithURLRequest:imageURLRequest
                                                                            size:CGSizeZero
                                                                           scale:1
                                                                      resizeMode:RCTResizeModeStretch
                                                                        priority:RCTImageLoaderPriorityImmediate
                                                                     attribution:{}
                                                                   progressBlock:NULL
                                                                partialLoadBlock:NULL
                                                                 completionBlock:completion];
  return loaderRequest.cancellationBlock;
}

- (NSDictionary *)getImageCacheStatus:(NSArray *)requests
{
  NSMutableDictionary *results = [NSMutableDictionary dictionary];
  for (id request in requests) {
    NSURLRequest *urlRequest = [RCTConvert NSURLRequest:request];
    if (urlRequest) {
      NSCachedURLResponse *cachedResponse = [NSURLCache.sharedURLCache cachedResponseForRequest:urlRequest];
      if (cachedResponse) {
        if (cachedResponse.storagePolicy == NSURLCacheStorageAllowedInMemoryOnly) {
          results[urlRequest.URL.absoluteString] = @"memory";
        } else if (NSURLCache.sharedURLCache.currentMemoryUsage == 0) {
          // We can't check whether the file is cached on disk or memory.
          // However, if currentMemoryUsage is disabled, it must be read from disk.
          results[urlRequest.URL.absoluteString] = @"disk";
        } else {
          results[urlRequest.URL.absoluteString] = @"disk/memory";
        }
      }
    }
  }
  return results;
}

#pragma mark - RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  NSURL *requestURL = request.URL;

  // If the data being loaded is a video, return NO
  // Even better may be to implement this on the RCTImageURLLoader that would try to load it,
  // but we'd have to run the logic both in RCTPhotoLibraryImageLoader and
  // RCTAssetsLibraryRequestHandler. Once we drop iOS7 though, we'd drop
  // RCTAssetsLibraryRequestHandler and can move it there.
  static NSRegularExpression *videoRegex;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSError *error = nil;
    videoRegex = [NSRegularExpression regularExpressionWithPattern:@"(?:&|^)ext=MOV(?:&|$)"
                                                           options:NSRegularExpressionCaseInsensitive
                                                             error:&error];
    if (error) {
      RCTLogError(@"%@", error);
    }
  });

  NSString *query = requestURL.query;
  if (query != nil && [videoRegex firstMatchInString:query options:0 range:NSMakeRange(0, query.length)]) {
    return NO;
  }

  if (!_didSetup) {
    [self setUp];
  }
  for (id<RCTImageURLLoader> loader in _loaders) {
    // Don't use RCTImageURLLoader protocol for modules that already conform to
    // RCTURLRequestHandler as it's inefficient to decode an image and then
    // convert it back into data
    if (![loader conformsToProtocol:@protocol(RCTURLRequestHandler)] && [loader canLoadImageURL:requestURL]) {
      return YES;
    }
  }

  return NO;
}

- (id)sendRequest:(NSURLRequest *)request withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  __block RCTImageLoaderCancellationBlock requestToken;
  requestToken = [self loadImageWithURLRequest:request
                                      callback:^(NSError *error, UIImage *image) {
                                        if (error) {
                                          [delegate URLRequest:requestToken didCompleteWithError:error];
                                          return;
                                        }

                                        NSString *mimeType = nil;
                                        NSData *imageData = nil;
                                        if (RCTImageHasAlpha(image.CGImage)) {
                                          mimeType = @"image/png";
                                          imageData = UIImagePNGRepresentation(image);
                                        } else {
                                          mimeType = @"image/jpeg";
                                          imageData = UIImageJPEGRepresentation(image, 1.0);
                                        }

                                        NSURLResponse *response = [[NSURLResponse alloc] initWithURL:request.URL
                                                                                            MIMEType:mimeType
                                                                               expectedContentLength:imageData.length
                                                                                    textEncodingName:nil];

                                        [delegate URLRequest:requestToken didReceiveResponse:response];
                                        [delegate URLRequest:requestToken didReceiveData:imageData];
                                        [delegate URLRequest:requestToken didCompleteWithError:nil];
                                      }];

  return requestToken;
}

- (void)cancelRequest:(id)requestToken
{
  if (requestToken) {
    ((RCTImageLoaderCancellationBlock)requestToken)();
  }
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeImageLoaderIOSSpecJSI>(params);
}

RCT_EXPORT_METHOD(
    getSize : (NSString *)uri resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  NSURLRequest *request = [RCTConvert NSURLRequest:uri];
  [self getImageSizeForURLRequest:request
                            block:^(NSError *error, CGSize size) {
                              if (error) {
                                reject(
                                    @"E_GET_SIZE_FAILURE",
                                    [NSString stringWithFormat:@"Failed to getSize of %@", uri],
                                    error);
                              } else {
                                resolve(@[ @(size.width), @(size.height) ]);
                              }
                            }];
}

RCT_EXPORT_METHOD(
    getSizeWithHeaders : (NSString *)uri headers : (NSDictionary *)headers resolve : (RCTPromiseResolveBlock)
        resolve reject : (RCTPromiseRejectBlock)reject)
{
  NSURL *URL = [RCTConvert NSURL:uri];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
    [request addValue:[RCTConvert NSString:value] forHTTPHeaderField:key];
  }];
  [self getImageSizeForURLRequest:request
                            block:^(NSError *error, CGSize size) {
                              if (error) {
                                reject(@"E_GET_SIZE_FAILURE", nil, error);
                                return;
                              }
                              resolve(@{@"width" : @(size.width), @"height" : @(size.height)});
                            }];
}

RCT_EXPORT_METHOD(
    prefetchImage : (NSString *)uri resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  [self prefetchImageWithMetadata:uri queryRootName:nil rootTag:0 resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(
    prefetchImageWithMetadata : (NSString *)uri queryRootName : (NSString *)queryRootName rootTag : (double)
        rootTag resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  NSURLRequest *request = [RCTConvert NSURLRequest:uri];
  [self loadImageWithURLRequest:request
                           size:CGSizeZero
                          scale:1
                        clipped:YES
                     resizeMode:RCTResizeModeStretch
                       priority:RCTImageLoaderPriorityPrefetch
                    attribution:{
                                    .queryRootName = queryRootName ? [queryRootName UTF8String] : "",
                                    .surfaceId = (int)rootTag,
                                }
                  progressBlock:nil
               partialLoadBlock:nil
                completionBlock:^(NSError *error, UIImage *image, id completionMetadata) {
                  if (error) {
                    reject(@"E_PREFETCH_FAILURE", nil, error);
                    return;
                  }
                  resolve(@YES);
                }];
}

RCT_EXPORT_METHOD(
    queryCache : (NSArray *)uris resolve : (RCTPromiseResolveBlock)resolve reject : (RCTPromiseRejectBlock)reject)
{
  resolve([self getImageCacheStatus:uris]);
}
@end

/**
 * DEPRECATED!! DO NOT USE
 * Instead use `[_bridge moduleForClass:[RCTImageLoader class]]`
 */
@implementation RCTBridge (RCTImageLoader)

- (RCTImageLoader *)imageLoader
{
  RCTLogWarn(
      @"Calling bridge.imageLoader is deprecated and will not work in newer versions of RN. Please update to the "
       "moduleForClass API or turboModuleRegistry API.");
  return [self moduleForClass:[RCTImageLoader class]];
}

@end

@implementation RCTBridgeProxy (RCTImageLoader)

- (RCTImageLoader *)imageLoader
{
  return [self moduleForClass:[RCTImageLoader class]];
}

@end

Class RCTImageLoaderCls(void)
{
  return RCTImageLoader.class;
}
