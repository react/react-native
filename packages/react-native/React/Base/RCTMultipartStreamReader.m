/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMultipartStreamReader.h"
#import <QuartzCore/QuartzCore.h>
#import <TargetConditionals.h>

#if RCT_USE_KMP && TARGET_OS_IOS && !TARGET_OS_MACCATALYST
#define RCT_MULTIPART_USE_KMP 1
#import <ReactNativeShared/ReactNativeShared.h>
#else
#define RCT_MULTIPART_USE_KMP 0
#endif

#define CRLF @"\r\n"

@implementation RCTMultipartStreamReader {
  __strong NSInputStream *_stream;
  __strong NSString *_boundary;
  CFTimeInterval _lastDownloadProgress;
}

- (instancetype)initWithInputStream:(NSInputStream *)stream boundary:(NSString *)boundary
{
  if (self = [super init]) {
    _stream = stream;
    _boundary = boundary;
    _lastDownloadProgress = CACurrentMediaTime();
  }
  return self;
}

- (NSDictionary *)parseHeaders:(NSData *)data
{
  NSMutableDictionary *headers = [NSMutableDictionary new];
  NSString *text = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
#if RCT_MULTIPART_USE_KMP
  for (RNSMultipartHeader *header in [RNSMultipartHeaders.shared parseText:text ?: @""]) {
    NSString *value = [header.value stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    [headers setValue:value forKey:header.name];
  }
#else
  NSArray<NSString *> *lines = [text componentsSeparatedByString:CRLF];
  for (NSString *line in lines) {
    NSUInteger location = [line rangeOfString:@":"].location;
    if (location == NSNotFound) {
      continue;
    }
    NSString *key = [line substringToIndex:location];
    NSString *value = [[line substringFromIndex:location + 1]
        stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    [headers setValue:value forKey:key];
  }
#endif
  return headers;
}

- (void)emitChunk:(NSData *)data headers:(NSDictionary *)headers callback:(RCTMultipartCallback)callback done:(BOOL)done
{
  NSData *marker = [CRLF CRLF dataUsingEncoding:NSUTF8StringEncoding];
  NSRange range = [data rangeOfData:marker options:0 range:NSMakeRange(0, data.length)];
  if (range.location == NSNotFound) {
    callback(nil, data, done);
  } else if (headers != nil) {
    // If headers were parsed already just use that to avoid doing it twice.
    NSInteger bodyStart = range.location + marker.length;
    NSData *bodyData = [data subdataWithRange:NSMakeRange(bodyStart, data.length - bodyStart)];
    callback(headers, bodyData, done);
  } else {
    NSData *headersData = [data subdataWithRange:NSMakeRange(0, range.location)];
    NSInteger bodyStart = range.location + marker.length;
    NSData *bodyData = [data subdataWithRange:NSMakeRange(bodyStart, data.length - bodyStart)];
    callback([self parseHeaders:headersData], bodyData, done);
  }
}

- (void)emitProgress:(NSDictionary *)headers
       contentLength:(NSUInteger)contentLength
               final:(BOOL)final
            callback:(RCTMultipartProgressCallback)callback
{
  if (headers == nil) {
    return;
  }
  // Throttle progress events so we don't send more that around 60 per second.
  CFTimeInterval currentTime = CACurrentMediaTime();

  NSInteger headersContentLength = headers[@"Content-Length"] != nil ? [headers[@"Content-Length"] integerValue] : 0;
  if (callback && (currentTime - _lastDownloadProgress > 0.016 || final)) {
    _lastDownloadProgress = currentTime;
    callback(headers, @(headersContentLength), @(contentLength));
  }
}

- (BOOL)readAllPartsWithCompletionCallback:(RCTMultipartCallback)callback
                          progressCallback:(RCTMultipartProgressCallback)progressCallback
{
  NSData *delimiter =
      [[NSString stringWithFormat:@"%@--%@%@", CRLF, _boundary, CRLF] dataUsingEncoding:NSUTF8StringEncoding];
  NSData *closeDelimiter =
      [[NSString stringWithFormat:@"%@--%@--%@", CRLF, _boundary, CRLF] dataUsingEncoding:NSUTF8StringEncoding];
#if RCT_MULTIPART_USE_KMP
  RNSMultipartFraming *framing = [[RNSMultipartFraming alloc] initWithDelimiterLength:(int32_t)delimiter.length
                                                                 closeDelimiterLength:(int32_t)closeDelimiter.length];
#else
  NSInteger chunkStart = 0;
  NSInteger bytesSeen = 0;
#endif
  NSMutableData *content = [[NSMutableData alloc] initWithCapacity:1];
  NSDictionary *currentHeaders = nil;
  NSUInteger currentHeadersLength = 0;

  const NSUInteger bufferLen = 4 * 1024;
  uint8_t buffer[bufferLen];

  [_stream open];
  while (true) {
    BOOL isCloseDelimiter = NO;
#if RCT_MULTIPART_USE_KMP
    NSInteger searchStart = [framing searchStartBufferOffset:0];
    NSInteger chunkStart = [framing partStartBufferOffset:0];
#else
    // Preserve overlap when a delimiter is split between reads.
    NSInteger searchStart = MAX(bytesSeen - (NSInteger)closeDelimiter.length, chunkStart);
#endif
    NSRange remainingBufferRange = NSMakeRange(searchStart, content.length - searchStart);

    // Check for delimiters.
    NSRange range = [content rangeOfData:delimiter options:0 range:remainingBufferRange];
    if (range.location == NSNotFound) {
      isCloseDelimiter = YES;
      range = [content rangeOfData:closeDelimiter options:0 range:remainingBufferRange];
    }

#if RCT_MULTIPART_USE_KMP
    NSInteger index = range.location == NSNotFound ? -1 : (NSInteger)range.location;
    RNSMultipartChunk *chunk = [framing nextChunkBufferLength:content.length
                                                 bufferOffset:0
                                               delimiterIndex:isCloseDelimiter ? -1 : index
                                          closeDelimiterIndex:isCloseDelimiter ? index : -1];
#endif

    if (range.location == NSNotFound) {
      if (currentHeaders == nil) {
        // Check for the headers delimiter.
        NSData *headersMarker = [CRLF CRLF dataUsingEncoding:NSUTF8StringEncoding];
        NSRange headersRange = [content rangeOfData:headersMarker options:0 range:remainingBufferRange];
        if (headersRange.location != NSNotFound) {
          NSData *headersData = [content subdataWithRange:NSMakeRange(chunkStart, headersRange.location - chunkStart)];
          currentHeadersLength = headersData.length;
          currentHeaders = [self parseHeaders:headersData];
        }
      } else {
        // When headers are loaded start sending progress callbacks.
        [self emitProgress:currentHeaders
             contentLength:content.length - currentHeadersLength
                     final:NO
                  callback:progressCallback];
      }

#if !RCT_MULTIPART_USE_KMP
      bytesSeen = content.length;
#endif
      NSInteger bytesRead = [_stream read:buffer maxLength:bufferLen];
      if (bytesRead <= 0 || _stream.streamError) {
        return NO;
      }
      [content appendBytes:buffer length:bytesRead];
      continue;
    }

#if RCT_MULTIPART_USE_KMP
    NSInteger chunkEnd = chunk.end;
    BOOL isPart = chunk.isPart;
    isCloseDelimiter = chunk.isLast;
#else
    NSInteger chunkEnd = range.location;
    BOOL isPart = chunkStart > 0;
    bytesSeen = chunkEnd;
#endif
    NSInteger length = chunkEnd - chunkStart;

    // Ignore preamble
    if (isPart) {
      NSData *chunk = [content subdataWithRange:NSMakeRange(chunkStart, length)];
      [self emitProgress:currentHeaders
           contentLength:chunk.length - currentHeadersLength
                   final:YES
                callback:progressCallback];
      [self emitChunk:chunk headers:currentHeaders callback:callback done:isCloseDelimiter];
      currentHeaders = nil;
      currentHeadersLength = 0;
    }

    if (isCloseDelimiter) {
      return YES;
    }

#if !RCT_MULTIPART_USE_KMP
    chunkStart = chunkEnd + delimiter.length;
#endif
  }
}

@end
