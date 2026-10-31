/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeProxy.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTNetworkTask.h>
#import <React/RCTURLRequestHandler.h>

@protocol RCTNetworkingRequestHandler <NSObject>

// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (BOOL)canHandleNetworkingRequest:(NSDictionary *)data;
// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (NSDictionary *)handleNetworkingRequest:(NSDictionary *)data;

@end

@protocol RCTNetworkingResponseHandler <NSObject>

- (BOOL)canHandleNetworkingResponse:(NSString *)responseType;
- (id)handleNetworkingResponse:(NSURLResponse *)response data:(NSData *)data;

@end

@interface RCTNetworking : RCTEventEmitter

- (instancetype)init NS_DESIGNATED_INITIALIZER;

/**
 * Allows RCTNetworking instances to be initialized with handlers.
 * The handlers will be requested via the bridge's moduleForName method when required.
 */
- (instancetype)initWithHandlersProvider:(NSArray<id<RCTURLRequestHandler>> * (^)(RCTModuleRegistry *))getHandlers;

/**
 * Does a handler exist for the specified request?
 */
- (BOOL)canHandleRequest:(NSURLRequest *)request;

/**
 * Return an RCTNetworkTask for the specified request. This is useful for
 * invoking the React Native networking stack from within native code.
 */
- (RCTNetworkTask *)networkTaskWithRequest:(NSURLRequest *)request
                           completionBlock:(RCTURLRequestCompletionBlock)completionBlock;
- (RCTNetworkTask *)networkTaskWithDevToolsRequestId:(NSString *)devToolsRequestId
                                             request:(NSURLRequest *)request
                                     completionBlock:(RCTURLRequestCompletionBlock)completionBlock;

- (void)addRequestHandler:(id<RCTNetworkingRequestHandler>)handler;

- (void)addResponseHandler:(id<RCTNetworkingResponseHandler>)handler;

- (void)removeRequestHandler:(id<RCTNetworkingRequestHandler>)handler;

- (void)removeResponseHandler:(id<RCTNetworkingResponseHandler>)handler;

@end

@interface RCTBridgeProxy (RCTNetworking)

@property (nonatomic, readonly) RCTNetworking *networking;

@end

// HACK: When uploading images/video from PHAssetLibrary, we change the URL scheme to be
// ph-upload://. This is to ensure that we upload a full video when given a ph-upload:// URL,
// instead of just the thumbnail. Consider the following problem:
// The user has a video in their camera roll with URL ph://1B3E2DDB-0AD3-4E33-A7A1-9F4AA9A762AA/L0/001
// 1. We want to display that video in an <Image> and show the thumbnail
// 2. We later want to upload that video.
// At this point, if we use the same URL for both uses, there is no way to distinguish the intent
// and we will either upload the thumbnail (bad!) or try to show the video in an <Image> (bad!).
// Our solution is to change the URL scheme in the uploader.
extern NSString *const RCTNetworkingPHUploadHackScheme;
