/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInspectorWebSocketReporter.h"

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/networking/NetworkReporter.h>

using facebook::react::Headers;
using facebook::react::NetworkReporter;
using facebook::react::ReactNativeFeatureFlags;

namespace {

/**
 * Convert an `NSString` to a `std::string`, mapping `nil` (and any string whose
 * UTF-8 representation is unavailable) to an empty string.
 */
std::string toStdString(NSString *string)
{
  const char *utf8 = string.UTF8String;
  return utf8 != nullptr ? std::string(utf8) : std::string();
}

/**
 * Returns whether WebSocket events should be reported for the given request
 * ID. Reporting requires the `fuseboxWebSocketEventsEnabled` feature flag, and
 * a connected CDP debugger with the Network domain enabled (dev or profiling
 * builds only).
 */
BOOL isReportingEnabled(NSString *requestId)
{
  return requestId != nil && ReactNativeFeatureFlags::fuseboxWebSocketEventsEnabled() &&
      NetworkReporter::getInstance().isDebuggingEnabled();
}

Headers convertNSDictionaryToHeaders(const NSDictionary<NSString *, NSString *> *headers)
{
  Headers result;
  for (NSString *key in headers) {
    result[toStdString(key)] = toStdString(headers[key]);
  }
  return result;
}

/**
 * Convert an `NSString` (text) or `NSData` (binary) WebSocket message to a
 * CDP `payloadData` string — UTF-8 for text messages, base64 for binary.
 * \returns Whether the message was a supported type, writing to the out
 * params on success.
 */
bool convertMessageToPayloadData(id message, std::string &payloadData, bool &isBinary)
{
  if ([message isKindOfClass:[NSString class]]) {
    payloadData = toStdString((NSString *)message);
    isBinary = false;
    return true;
  }

  if ([message isKindOfClass:[NSData class]]) {
    payloadData = toStdString([(NSData *)message base64EncodedStringWithOptions:0]);
    isBinary = true;
    return true;
  }

  return false;
}

} // namespace

@implementation RCTInspectorWebSocketReporter

+ (void)reportWebSocketCreated:(NSString *)requestId url:(NSURL *)url
{
  if (!isReportingEnabled(requestId)) {
    return;
  }

  NetworkReporter::getInstance().reportWebSocketCreated(toStdString(requestId), toStdString(url.absoluteString));
}

+ (void)reportWillSendHandshakeRequest:(NSString *)requestId request:(NSURLRequest *)request
{
  if (!isReportingEnabled(requestId)) {
    return;
  }

  NetworkReporter::getInstance().reportWebSocketWillSendHandshakeRequest(
      toStdString(requestId), convertNSDictionaryToHeaders(request.allHTTPHeaderFields));
}

+ (void)reportHandshakeResponseReceived:(NSString *)requestId httpMessage:(nullable CFHTTPMessageRef)httpMessage
{
  if (!isReportingEnabled(requestId)) {
    return;
  }

  // Fall back to a minimal `101 Switching Protocols` response (guaranteed by
  // RFC 6455 for an open connection) if the handshake response is unavailable.
  uint16_t statusCode = 101;
  Headers headers;

  if (httpMessage != NULL && CFHTTPMessageIsHeaderComplete(httpMessage) != 0) {
    statusCode = (uint16_t)CFHTTPMessageGetResponseStatusCode(httpMessage);
    NSDictionary<NSString *, NSString *> *responseHeaders =
        (NSDictionary<NSString *, NSString *> *)CFBridgingRelease(CFHTTPMessageCopyAllHeaderFields(httpMessage));
    headers = convertNSDictionaryToHeaders(responseHeaders);
  }

  NetworkReporter::getInstance().reportWebSocketHandshakeResponseReceived(toStdString(requestId), statusCode, headers);
}

+ (void)reportMessageSent:(NSString *)requestId message:(id)message
{
  if (!isReportingEnabled(requestId)) {
    return;
  }

  std::string payloadData;
  bool isBinary = false;
  if (!convertMessageToPayloadData(message, payloadData, isBinary)) {
    return;
  }

  NetworkReporter::getInstance().reportWebSocketMessageSent(toStdString(requestId), payloadData, isBinary);
}

+ (void)reportMessageReceived:(NSString *)requestId message:(id)message
{
  if (!isReportingEnabled(requestId)) {
    return;
  }

  std::string payloadData;
  bool isBinary = false;
  if (!convertMessageToPayloadData(message, payloadData, isBinary)) {
    return;
  }

  NetworkReporter::getInstance().reportWebSocketMessageReceived(toStdString(requestId), payloadData, isBinary);
}

+ (void)reportWebSocketClosed:(NSString *)requestId
{
  if (!isReportingEnabled(requestId)) {
    return;
  }

  NetworkReporter::getInstance().reportWebSocketClosed(toStdString(requestId));
}

@end
