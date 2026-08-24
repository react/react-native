/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React/RCTArrayBuffer.h>
#import <React/RCTBlobManager.h>
#import <React/RCTMockDef.h>

RCT_MOCK_REF(RCTBlobManager, dispatch_async);

@interface RCTBlobManagerTests : XCTestCase

@end

@implementation RCTBlobManagerTests {
  RCTBlobManager *_module;
  NSMutableData *_data;
  NSString *_blobId;
}

- (void)setUp
{
  [super setUp];

  _module = [RCTBlobManager new];
  [_module setValue:nil forKey:@"bridge"];
  [_module initialize];
  NSInteger size = 120;
  _data = [NSMutableData dataWithCapacity:size];
  for (NSInteger i = 0; i < size / 4; i++) {
    uint32_t randomBits = arc4random();
    [_data appendBytes:(void *)&randomBits length:4];
  }
  _blobId = [NSUUID UUID].UUIDString;
  [_module store:_data withId:_blobId];
}

- (void)testResolve
{
  XCTAssertTrue([_data isEqualToData:[_module resolve:_blobId offset:0 size:_data.length]]);
  NSData *rangeData = [_data subdataWithRange:NSMakeRange(30, _data.length - 30)];
  XCTAssertTrue([rangeData isEqualToData:[_module resolve:_blobId offset:30 size:_data.length - 30]]);
}

- (void)testResolveMap
{
  NSDictionary<NSString *, id> *map = @{
    @"blobId" : _blobId,
    @"size" : @(_data.length),
    @"offset" : @0,
  };
  XCTAssertTrue([_data isEqualToData:[_module resolve:map]]);
}

- (void)testResolveURL
{
  NSURLComponents *components = [NSURLComponents new];
  [components setPath:_blobId];
  [components setQuery:[NSString stringWithFormat:@"offset=0&size=%lu", (unsigned long)_data.length]];
  XCTAssertTrue([_data isEqualToData:[_module resolveURL:[components URL]]]);
}

- (void)testRemove
{
  XCTAssertNotNil([_module resolve:_blobId offset:0 size:_data.length]);
  [_module remove:_blobId];
  XCTAssertNil([_module resolve:_blobId offset:0 size:_data.length]);
}

static void dispatch_async_mock([[maybe_unused]] dispatch_queue_t queue, dispatch_block_t block)
{
  if (block) {
    block();
  }
}

- (void)testCreateFromParts
{
  RCT_MOCK_SET(RCTBlobManager, dispatch_async, dispatch_async_mock);

  NSDictionary<NSString *, id> *blobData = @{
    @"blobId" : _blobId,
    @"offset" : @0,
    @"size" : @(_data.length),
  };
  NSDictionary<NSString *, id> *blob = @{
    @"data" : blobData,
    @"type" : @"blob",
  };
  NSString *stringData = @"i \u2665 dogs";
  NSDictionary<NSString *, id> *string = @{
    @"data" : stringData,
    @"type" : @"string",
  };
  NSString *resultId = [NSUUID UUID].UUIDString;
  NSArray<id> *parts = @[ blob, string ];

  [_module createFromParts:parts binaryParts:@[] withId:resultId];

  NSMutableData *expectedData = [NSMutableData new];
  [expectedData appendData:_data];
  [expectedData appendData:[stringData dataUsingEncoding:NSUTF8StringEncoding]];

  NSData *result = [_module resolve:resultId offset:0 size:expectedData.length];

  XCTAssertTrue([expectedData isEqualToData:result]);

  RCT_MOCK_RESET(RCTBlobManager, dispatch_async);
}

- (void)testCreateFromPartsWithBinaryParts
{
  RCT_MOCK_SET(RCTBlobManager, dispatch_async, dispatch_async_mock);

  NSString *stringData = @"A";
  NSDictionary<NSString *, id> *string = @{
    @"data" : stringData,
    @"type" : @"string",
  };

  uint8_t binaryBytes[] = {66, 67};
  NSData *binaryData = [NSData dataWithBytes:binaryBytes length:sizeof(binaryBytes)];
  RCTArrayBuffer *binaryBuffer = [RCTArrayBuffer arrayBufferWithCopiedBytes:binaryData.bytes length:binaryData.length];
  NSDictionary<NSString *, id> *binaryPart = @{
    @"data" : @0,
    @"type" : @"binaryPart",
  };

  NSDictionary<NSString *, id> *blobData = @{
    @"blobId" : _blobId,
    @"offset" : @0,
    @"size" : @(_data.length),
  };
  NSDictionary<NSString *, id> *blob = @{
    @"data" : blobData,
    @"type" : @"blob",
  };

  NSString *resultId = [NSUUID UUID].UUIDString;
  NSArray<id> *parts = @[ string, binaryPart, blob ];

  [_module createFromParts:parts binaryParts:@[ binaryBuffer ] withId:resultId];

  NSMutableData *expectedData = [NSMutableData new];
  [expectedData appendData:[stringData dataUsingEncoding:NSUTF8StringEncoding]];
  [expectedData appendData:binaryData];
  [expectedData appendData:_data];

  NSData *result = [_module resolve:resultId offset:0 size:expectedData.length];
  XCTAssertTrue([expectedData isEqualToData:result]);

  RCT_MOCK_RESET(RCTBlobManager, dispatch_async);
}

- (void)testCreateFromPartsWithOutOfRangeBinaryPartIndex
{
  NSDictionary<NSString *, id> *binaryPart = @{
    @"data" : @3,
    @"type" : @"binaryPart",
  };
  NSString *resultId = [NSUUID UUID].UUIDString;

  XCTAssertThrows([_module createFromParts:@[ binaryPart ] binaryParts:@[] withId:resultId]);
}

- (void)testCreateFromPartsWithInvalidBinaryPartType
{
  NSDictionary<NSString *, id> *binaryPart = @{
    @"data" : @0,
    @"type" : @"binaryPart",
  };
  NSString *resultId = [NSUUID UUID].UUIDString;

  XCTAssertThrows([_module createFromParts:@[ binaryPart ] binaryParts:@[ [NSNull null] ] withId:resultId]);
}

@end
