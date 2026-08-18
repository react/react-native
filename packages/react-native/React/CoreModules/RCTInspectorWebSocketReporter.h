/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CFNetwork/CFNetwork.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * [Experimental] An interface for reporting WebSocket events to the modern
 * debugger server.
 *
 * In a production (non dev or profiling) build, CDP reporting is disabled
 * and all methods are a no-op.
 *
 * This is a helper class wrapping `facebook::react::NetworkReporter`.
 */
@interface RCTInspectorWebSocketReporter : NSObject

/**
 * Report that a WebSocket connection is about to be created.
 *
 * Corresponds to `Network.webSocketCreated` in CDP.
 */
+ (void)reportWebSocketCreated:(nullable NSString *)requestId url:(NSURL *)url;

/**
 * Report that a WebSocket handshake (HTTP upgrade) request is about to be
 * sent, along with its final request headers.
 *
 * Corresponds to `Network.webSocketWillSendHandshakeRequest` in CDP.
 */
+ (void)reportWillSendHandshakeRequest:(nullable NSString *)requestId request:(NSURLRequest *)request;

/**
 * Report that the WebSocket handshake response was received and the
 * connection is established. `httpMessage` is the raw handshake response,
 * e.g. `SRWebSocket.receivedHTTPHeaders`. If NULL or incomplete, a minimal
 * `101 Switching Protocols` response is reported instead.
 *
 * Corresponds to `Network.webSocketHandshakeResponseReceived` in CDP.
 */
+ (void)reportHandshakeResponseReceived:(nullable NSString *)requestId
                            httpMessage:(nullable CFHTTPMessageRef)httpMessage;

/**
 * Report a WebSocket message sent over an open connection. `message` must be
 * an `NSString` (text message) or `NSData` (binary message).
 *
 * Corresponds to `Network.webSocketFrameSent` in CDP.
 */
+ (void)reportMessageSent:(nullable NSString *)requestId message:(nullable id)message;

/**
 * Report a WebSocket message received over an open connection. `message`
 * must be an `NSString` (text message) or `NSData` (binary message).
 *
 * Corresponds to `Network.webSocketFrameReceived` in CDP.
 */
+ (void)reportMessageReceived:(nullable NSString *)requestId message:(nullable id)message;

/**
 * Report that a WebSocket connection was closed, whether cleanly or due to
 * an error.
 *
 * Corresponds to `Network.webSocketClosed` in CDP.
 */
+ (void)reportWebSocketClosed:(nullable NSString *)requestId;

@end

NS_ASSUME_NONNULL_END
