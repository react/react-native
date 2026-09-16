/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <QuartzCore/QuartzCore.h>
#import <React/RCTMultipartStreamReader.h>

@interface RCTMultipartStreamReaderBaseline : NSObject
- (instancetype)initWithInputStream:(NSInputStream *)stream boundary:(NSString *)boundary;
- (BOOL)readAllPartsWithCompletionCallback:(RCTMultipartCallback)callback
                          progressCallback:(RCTMultipartProgressCallback)progressCallback;
@end

@interface FragmentedMultipartStream : NSInputStream
- (instancetype)initWithData:(NSData *)data readSize:(NSUInteger)readSize;
@end

@implementation FragmentedMultipartStream {
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

static NSDictionary *Read(Class readerClass, NSData *data, NSUInteger readSize, BOOL retainBodies)
{
  NSInputStream *stream = [[FragmentedMultipartStream alloc] initWithData:data readSize:readSize];
  RCTMultipartStreamReader *reader = [[readerClass alloc] initWithInputStream:stream boundary:@"sample"];
  NSMutableArray *parts = [NSMutableArray new];
  NSMutableArray *completedProgress = [NSMutableArray new];
  __block NSArray *progress;
  BOOL success = [reader
      readAllPartsWithCompletionCallback:^(NSDictionary *headers, NSData *body, BOOL done) {
        [parts addObject:@[ headers ?: @{}, retainBodies ? (id)body : @(body.length), @(done) ]];
        [completedProgress addObject:progress ?: @[]];
        progress = nil;
      }
      progressCallback:^(NSDictionary *headers, NSNumber *length, NSNumber *loaded) {
        progress = @[ headers, length, loaded ];
      }];
  return @{@"success" : @(success), @"parts" : parts, @"finalProgress" : completedProgress};
}

static void Require(BOOL condition, NSString *message)
{
  if (!condition) {
    fprintf(stderr, "FAIL: %s\n", message.UTF8String);
    exit(1);
  }
}

static NSData *Response(NSUInteger size)
{
  NSMutableData *data = [[NSString stringWithFormat:@"preamble\r\n--sample\r\nContent-Length: %lu\r\n\r\n",
                                                    (unsigned long)size] dataUsingEncoding:NSUTF8StringEncoding]
                            .mutableCopy;
  NSMutableData *body = [NSMutableData dataWithLength:size];
  // Deterministic binary content, without a valid delimiter or header separator.
  uint8_t *bytes = body.mutableBytes;
  for (NSUInteger i = 0; i < size; i++)
    bytes[i] = (uint8_t)(i % 251);
  [data appendData:body];
  [data appendData:[@"\r\n--sample--\r\nepilogue" dataUsingEncoding:NSUTF8StringEncoding]];
  return data;
}

static double Measure(Class readerClass, NSData *data, NSUInteger size)
{
  CFTimeInterval start = CACurrentMediaTime();
  @autoreleasepool {
    NSDictionary *result = Read(readerClass, data, 4096, NO);
    Require([result[@"success"] boolValue], @"benchmark completion");
    Require(
        [result[@"parts"] count] == 1 && [result[@"parts"][0][1] unsignedIntegerValue] == size,
        @"benchmark body length");
  }
  return (CACurrentMediaTime() - start) * 1000;
}

int main(int argc, const char *argv[])
{
  @autoreleasepool {
    Class native = RCTMultipartStreamReaderBaseline.class;
    Class shared = RCTMultipartStreamReader.class;
    if (argc == 2 && strcmp(argv[1], "--benchmark") == 0) {
      for (NSNumber *megabytes in @[ @2, @20 ]) {
        NSUInteger size = megabytes.unsignedIntegerValue * 1024 * 1024;
        NSData *data = Response(size);
        Require([Read(native, data, 4096, YES) isEqual:Read(shared, data, 4096, YES)], @"large body exact parity");
        for (NSUInteger i = 0; i < 5; i++) {
          Measure(native, data, size);
          Measure(shared, data, size);
        }
        NSMutableArray *nativeSamples = [NSMutableArray new];
        NSMutableArray *sharedSamples = [NSMutableArray new];
        for (NSUInteger i = 0; i < 21; i++) {
          if (i % 2 == 0) {
            [nativeSamples addObject:@(Measure(native, data, size))];
            [sharedSamples addObject:@(Measure(shared, data, size))];
          } else {
            [sharedSamples addObject:@(Measure(shared, data, size))];
            [nativeSamples addObject:@(Measure(native, data, size))];
          }
        }
        double baseline = [[nativeSamples sortedArrayUsingSelector:@selector(compare:)][10] doubleValue];
        double kmp = [[sharedSamples sortedArrayUsingSelector:@selector(compare:)][10] doubleValue];
        NSDictionary *result = @{
          @"bytes" : @(size),
          @"iterations" : @21,
          @"nativeMedianMs" : @(baseline),
          @"kmpMedianMs" : @(kmp),
          @"ratio" : @(kmp / baseline),
          @"nativeSamplesMs" : nativeSamples,
          @"kmpSamplesMs" : sharedSamples
        };
        puts([[NSString alloc] initWithData:[NSJSONSerialization dataWithJSONObject:result options:0 error:nil]
                                   encoding:NSUTF8StringEncoding]
                 .UTF8String);
      }
      return 0;
    }

    NSArray *inputs = @[
      @"Yolo",
      @"preamble\r\n--sample--\r\n",
      @"\r\n--sample\r\none\r\n--sample\r\ntwo\r\n--sample--\r\nepilogue",
      @"\r\n--sample\r\nX: a:b\r\nx: c\r\n invalid \r\n\r\nbody\r\n--sample--\r\n",
      @"\r\n--sample\r\nfirst\r\n--sample\r\nincomplete",
      @"\r\n--sample\r\nbinary\0\r\n--samplX\r\n--sample-\r\n--sample--\r\n"
    ];
    NSUInteger cases = 0;
    for (NSString *input in inputs) {
      NSData *data = [input dataUsingEncoding:NSUTF8StringEncoding];
      for (NSUInteger readSize = 1; readSize <= data.length; readSize++) {
        Require(
            [Read(native, data, readSize, YES) isEqual:Read(shared, data, readSize, YES)],
            [NSString stringWithFormat:@"native/KMP parity case %lu read %lu",
                                       (unsigned long)cases,
                                       (unsigned long)readSize]);
        cases++;
      }
    }
    for (NSNumber *size in @[ @4095, @4096, @4097, @65536 ]) {
      NSData *data = Response(size.unsignedIntegerValue);
      Require([Read(native, data, 4096, YES) isEqual:Read(shared, data, 4096, YES)], @"binary body/progress parity");
      cases++;
    }
    printf("PASS: %lu real Apple multipart adapter parity cases\n", (unsigned long)cases);
  }
  return 0;
}
