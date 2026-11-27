/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTURLRequestDelegate.h>
#import <React/RCTURLRequestHandler.h>

typedef void (^RCTURLRequestCompletionBlock)(NSURLResponse *response, NSData *data, NSError *error);
typedef void (^RCTURLRequestCancellationBlock)(void);
typedef void (^RCTURLRequestIncrementalDataBlock)(NSData *data, int64_t progress, int64_t total);
typedef void (^RCTURLRequestProgressBlock)(int64_t progress, int64_t total);
typedef void (^RCTURLRequestResponseBlock)(NSURLResponse *response);

typedef NS_ENUM(NSInteger, RCTNetworkTaskStatus) {
  RCTNetworkTaskPending = 0,
  RCTNetworkTaskInProgress,
  RCTNetworkTaskFinished,
};

@interface RCTNetworkTask : NSObject <RCTURLRequestDelegate>

@property (nonatomic, readonly) NSURLRequest *request;
@property (nonatomic, readonly) NSNumber *requestID;
@property (nonatomic, readonly, weak) id requestToken;
@property (nonatomic, readonly) NSURLResponse *response;
@property (nonatomic, readonly) NSString *devToolsRequestId;

@property (nonatomic, copy) RCTURLRequestCompletionBlock completionBlock;
@property (nonatomic, copy) RCTURLRequestProgressBlock downloadProgressBlock;
@property (nonatomic, copy) RCTURLRequestIncrementalDataBlock incrementalDataBlock;
@property (nonatomic, copy) RCTURLRequestResponseBlock responseBlock;
@property (nonatomic, copy) RCTURLRequestProgressBlock uploadProgressBlock;

/**
 * Whether the task keeps the response data it receives, to give it to the completion block.
 * The default is YES. Set it to NO before `start` when the incremental data block uses each chunk
 * and the completion block does not need the full response. The completion block then gets nil data.
 * This stops a long-lived response, for example a stream of server-sent events, from keeping all of
 * its data in memory until it ends.
 */
@property (nonatomic, assign) BOOL buffersResponseData;

@property (atomic, readonly) RCTNetworkTaskStatus status;

- (instancetype)initWithRequest:(NSURLRequest *)request
                        handler:(id<RCTURLRequestHandler>)handler
                  callbackQueue:(dispatch_queue_t)callbackQueue NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithDevToolsRequestId:(NSString *)devToolsRequestId
                                  request:(NSURLRequest *)request
                                  handler:(id<RCTURLRequestHandler>)handler
                            callbackQueue:(dispatch_queue_t)callbackQueue;
- (void)start;
- (void)cancel;

@end
