/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTMultipartStreamReader.h>

@interface RCTMultipartFragmentedInputStream : NSInputStream
- (instancetype)initWithData:(NSData *)data readSize:(NSUInteger)readSize;
@end

@implementation RCTMultipartFragmentedInputStream {
  NSData *_data;
  NSUInteger _offset;
  NSUInteger _readSize;
}

- (instancetype)initWithData:(NSData *)data readSize:(NSUInteger)readSize
{
  if (self = [super init]) {
    _data = data;
    _readSize = readSize;
  }
  return self;
}

- (void)open
{
}

- (NSError *)streamError
{
  return nil;
}

- (NSInteger)read:(uint8_t *)buffer maxLength:(NSUInteger)length
{
  NSUInteger count = MIN(MIN(length, _readSize), _data.length - _offset);
  [_data getBytes:buffer range:NSMakeRange(_offset, count)];
  _offset += count;
  return count;
}

@end

@interface RCTMultipartStreamReaderTests : XCTestCase

@end

@implementation RCTMultipartStreamReaderTests

- (void)testSimpleCase
{
  NSString *response =
      @"preamble, should be ignored\r\n"
      @"--sample_boundary\r\n"
      @"Content-Type: application/json; charset=utf-8\r\n"
      @"Content-Length: 2\r\n\r\n"
      @"{}\r\n"
      @"--sample_boundary--\r\n"
      @"epilogue, should be ignored";

  NSInputStream *inputStream = [NSInputStream inputStreamWithData:[response dataUsingEncoding:NSUTF8StringEncoding]];
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:inputStream
                                                                                  boundary:@"sample_boundary"];
  __block NSInteger count = 0;
  BOOL success = [reader
      readAllPartsWithCompletionCallback:^(NSDictionary *headers, NSData *content, BOOL done) {
        XCTAssertTrue(done);
        XCTAssertEqualObjects(headers[@"Content-Type"], @"application/json; charset=utf-8");
        XCTAssertEqualObjects([[NSString alloc] initWithData:content encoding:NSUTF8StringEncoding], @"{}");
        count++;
      }
                        progressCallback:nil];
  XCTAssertTrue(success);
  XCTAssertEqual(count, 1);
}

- (void)testMultipleParts
{
  NSString *response =
      @"preamble, should be ignored\r\n"
      @"--sample_boundary\r\n"
      @"1\r\n"
      @"--sample_boundary\r\n"
      @"2\r\n"
      @"--sample_boundary\r\n"
      @"3\r\n"
      @"--sample_boundary--\r\n"
      @"epilogue, should be ignored";

  NSInputStream *inputStream = [NSInputStream inputStreamWithData:[response dataUsingEncoding:NSUTF8StringEncoding]];
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:inputStream
                                                                                  boundary:@"sample_boundary"];
  __block NSInteger count = 0;
  BOOL success = [reader
      readAllPartsWithCompletionCallback:^(__unused NSDictionary *headers, NSData *content, BOOL done) {
        count++;
        XCTAssertEqual(done, count == 3);
        NSString *expectedBody = [NSString stringWithFormat:@"%ld", (long)count];
        NSString *actualBody = [[NSString alloc] initWithData:content encoding:NSUTF8StringEncoding];
        XCTAssertEqualObjects(actualBody, expectedBody);
      }
                        progressCallback:nil];
  XCTAssertTrue(success);
  XCTAssertEqual(count, 3);
}

- (void)testNoDelimiter
{
  NSString *response = @"Yolo";

  NSInputStream *inputStream = [NSInputStream inputStreamWithData:[response dataUsingEncoding:NSUTF8StringEncoding]];
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:inputStream
                                                                                  boundary:@"sample_boundary"];
  __block NSInteger count = 0;
  BOOL success = [reader
      readAllPartsWithCompletionCallback:^(
          __unused NSDictionary *headers, __unused NSData *content, __unused BOOL done) {
        count++;
      }
                        progressCallback:nil];
  XCTAssertFalse(success);
  XCTAssertEqual(count, 0);
}

- (void)testNoCloseDelimiter
{
  NSString *response =
      @"preamble, should be ignored\r\n"
      @"--sample_boundary\r\n"
      @"Content-Type: application/json; charset=utf-8\r\n"
      @"Content-Length: 2\r\n\r\n"
      @"{}\r\n"
      @"--sample_boundary\r\n"
      @"incomplete message...";

  NSInputStream *inputStream = [NSInputStream inputStreamWithData:[response dataUsingEncoding:NSUTF8StringEncoding]];
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:inputStream
                                                                                  boundary:@"sample_boundary"];
  __block NSInteger count = 0;
  BOOL success = [reader
      readAllPartsWithCompletionCallback:^(
          __unused NSDictionary *headers, __unused NSData *content, __unused BOOL done) {
        count++;
      }
                        progressCallback:nil];
  XCTAssertFalse(success);
  XCTAssertEqual(count, 1);
}

- (void)testDelimitersAcrossEveryReadBoundary
{
  NSString *body = @"binary\0\r\n--samplX\r\n--sample-\r\n";
  NSString *response =
      [NSString stringWithFormat:@"preamble\r\n--sample\r\n%@\r\n--sample\r\nsecond\r\n--sample--\r\nepilogue", body];
  NSData *data = [response dataUsingEncoding:NSUTF8StringEncoding];
  for (NSUInteger readSize = 1; readSize <= data.length; readSize++) {
    NSInputStream *stream = [[RCTMultipartFragmentedInputStream alloc] initWithData:data readSize:readSize];
    RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:stream boundary:@"sample"];
    NSMutableArray *parts = [NSMutableArray new];
    NSMutableArray *last = [NSMutableArray new];
    BOOL success = [reader
        readAllPartsWithCompletionCallback:^(__unused NSDictionary *headers, NSData *content, BOOL done) {
          [parts addObject:content];
          [last addObject:@(done)];
        }
                          progressCallback:nil];
    XCTAssertTrue(success, @"read size %lu", (unsigned long)readSize);
    XCTAssertEqualObjects(
        parts,
        (@[ [body dataUsingEncoding:NSUTF8StringEncoding], [@"second" dataUsingEncoding:NSUTF8StringEncoding] ]));
    XCTAssertEqualObjects(last, (@[ @NO, @YES ]));
  }
}

- (void)testHeaderWhitespaceDuplicatesAndColonValues
{
  NSString *response =
      @"\r\n--sample\r\n X-Name : first\r\nx-name: second:extra \r\nx-name: last:extra \r\ninvalid\r\n\r\nbody\r\n--sample--\r\n";
  NSInputStream *stream = [NSInputStream inputStreamWithData:[response dataUsingEncoding:NSUTF8StringEncoding]];
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:stream boundary:@"sample"];
  __block NSUInteger calls = 0;
  BOOL success = [reader
      readAllPartsWithCompletionCallback:^(NSDictionary *headers, NSData *content, BOOL done) {
        calls++;
        // Apple keeps header names verbatim and only trims values.
        XCTAssertEqualObjects(headers, (@{@" X-Name " : @"first", @"x-name" : @"last:extra"}));
        XCTAssertEqualObjects(content, [@"body" dataUsingEncoding:NSUTF8StringEncoding]);
        XCTAssertTrue(done);
      }
                        progressCallback:nil];
  XCTAssertTrue(success);
  XCTAssertEqual(calls, 1);
}

- (void)testFinalProgressForFragmentedBody
{
  NSString *body = [@"" stringByPaddingToLength:64 * 1024 withString:@"x" startingAtIndex:0];
  NSString *response = [NSString stringWithFormat:@"\r\n--sample\r\nContent-Length: %lu\r\n\r\n%@\r\n--sample--\r\n",
                                                  (unsigned long)body.length,
                                                  body];
  NSInputStream *stream = [NSInputStream inputStreamWithData:[response dataUsingEncoding:NSUTF8StringEncoding]];
  RCTMultipartStreamReader *reader = [[RCTMultipartStreamReader alloc] initWithInputStream:stream boundary:@"sample"];
  __block NSUInteger calls = 0;
  __block NSNumber *lastLength;
  __block NSNumber *lastLoaded;
  BOOL success = [reader
      readAllPartsWithCompletionCallback:^(
          __unused NSDictionary *headers, __unused NSData *content, __unused BOOL done) {
        calls++;
      }
      progressCallback:^(__unused NSDictionary *headers, NSNumber *length, NSNumber *loaded) {
        lastLength = length;
        lastLoaded = loaded;
      }];
  XCTAssertTrue(success);
  XCTAssertEqual(calls, 1);
  XCTAssertEqualObjects(lastLength, @(body.length));
  // Preserve Apple's existing progress accounting, including the header/body separator.
  XCTAssertEqualObjects(lastLoaded, @(body.length + 4));
}

@end
