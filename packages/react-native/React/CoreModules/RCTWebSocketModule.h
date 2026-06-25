/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeProxy.h>
#import <React/RCTEventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTWebSocketContentHandler <NSObject>

- (id)processWebsocketMessage:(id __nullable)message
                  forSocketID:(NSNumber *)socketID
                     withType:(NSString *__nonnull __autoreleasing *__nonnull)type;

@end

@class SRWebSocket;

typedef SRWebSocket * (^SRWebSocketProvider)(NSURLRequest *request);

RCT_EXTERN void RCTSetCustomSRWebSocketProvider(SRWebSocketProvider provider);

@interface RCTWebSocketModule : RCTEventEmitter

// Register a custom handler for a specific websocket. The handler will be strongly held by the WebSocketModule.
- (void)setContentHandler:(id<RCTWebSocketContentHandler> __nullable)handler forSocketID:(NSNumber *)socketID;

- (void)sendData:(NSData *)data forSocketID:(nonnull NSNumber *)socketID;

@end

@interface RCTBridge (RCTWebSocketModule)

- (RCTWebSocketModule *)webSocketModule;

@end

@interface RCTBridgeProxy (RCTWebSocketModule)

- (RCTWebSocketModule *)webSocketModule;

@end

NS_ASSUME_NONNULL_END
