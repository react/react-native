/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <Foundation/Foundation.h>

/**
 * An interface for reporting network events to the modern debugger server and
 * Web Performance APIs.
 *
 * In a production (non dev or profiling) build, CDP reporting is disabled.
 *
 * This is a helper class wrapping `facebook::react::NetworkReporter`, and is
 * the integration point for third-party networking stacks that replace React
 * Native's networking modules.
 *
 * This is an unstable API. Its exact location and shape may change over time.
 */
@interface RCTInspectorNetworkReporter : NSObject

/**
 * Report a network request that is about to be sent.
 *
 * - Corresponds to `Network.requestWillBeSent` in CDP.
 * - Corresponds to `PerformanceResourceTiming.requestStart` (specifically,
 *   marking when the native request was initiated).
 */
+ (void)reportRequestStart:(NSString *)requestId
                   request:(NSURLRequest *)request
         encodedDataLength:(int)encodedDataLength;

/**
 * Report timestamp for sending the network request, and (in a debug build)
 * provide final headers to be reported via CDP.
 *
 * - Corresponds to `Network.requestWillBeSentExtraInfo` in CDP.
 * - Corresponds to `PerformanceResourceTiming.domainLookupStart`,
 *   `PerformanceResourceTiming.connectStart`. Defined as "immediately before
 *   the browser starts to establish the connection to the server".
 */
+ (void)reportConnectionTiming:(NSString *)requestId request:(NSURLRequest *)request;

/**
 * Report when HTTP response headers have been received, corresponding to
 * when the first byte of the response is available.
 *
 * - Corresponds to `Network.responseReceived` in CDP.
 * - Corresponds to `PerformanceResourceTiming.responseStart`.
 */
+ (void)reportResponseStart:(NSString *)requestId
                   response:(NSURLResponse *)response
                 statusCode:(int)statusCode
                    headers:(NSDictionary<NSString *, NSString *> *)headers;

/**
 * Report when additional chunks of the response body have been received.
 *
 * Corresponds to `Network.dataReceived` in CDP.
 */
+ (void)reportDataReceived:(NSString *)requestId data:(NSData *)data;

/**
 * Report when a network request is complete and we are no longer receiving
 * response data.
 *
 * - Corresponds to `Network.loadingFinished` in CDP.
 * - Corresponds to `PerformanceResourceTiming.responseEnd`.
 */
+ (void)reportResponseEnd:(NSString *)requestId encodedDataLength:(int)encodedDataLength;

/**
 * Report when a network request has failed.
 *
 * - Corresponds to `Network.loadingFailed` in CDP.
 */
+ (void)reportRequestFailed:(NSString *)requestId cancelled:(BOOL)cancelled;

/**
 * Store response body preview. This is an optional reporting method, and is a
 * no-op if CDP debugging is disabled.
 */
+ (void)maybeStoreResponseBody:(NSString *)requestId data:(NSData *)data base64Encoded:(bool)base64Encoded;

/**
 * Incrementally store a response body preview, when a string response is
 * received in chunks. Buffered contents will be flushed to `NetworkReporter`
 * with `reportResponseEnd`.
 *
 * As with `maybeStoreResponseBody`, calling this method is optional and a
 * no-op if CDP debugging is disabled.
 */
+ (void)maybeStoreResponseBodyIncremental:(NSString *)requestId data:(NSString *)data;

@end
