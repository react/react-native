/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTArrayBuffer.h"

#include <cstdint>
#include <cstring>
#include <utility>
#include <vector>

@interface RCTArrayBuffer ()

- (instancetype)initWithBytesNoCopy:(nullable void *)bytes
                             length:(NSUInteger)length
                        owningBytes:(BOOL)owningBytes
                            cleanup:(nullable void (^)(void))cleanup NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithCopiedBytes:(const void *_Nullable)bytes length:(NSUInteger)length;

@end

@implementation RCTArrayBuffer {
  void *_bytes;
  NSUInteger _length;
  BOOL _owningBytes;
  void (^_cleanup)(void);
  std::vector<uint8_t> _copiedBytes;
}

#pragma mark - Initializers

- (instancetype)initWithBytesNoCopy:(void *)bytes
                             length:(NSUInteger)length
                        owningBytes:(BOOL)owningBytes
                            cleanup:(void (^)(void))cleanup
{
  if (bytes == NULL && length != 0) {
    [NSException raise:NSInvalidArgumentException
                format:@"RCTArrayBuffer: NULL bytes with length %lu", (unsigned long)length];
  }

  if (self = [super init]) {
    _bytes = bytes;
    _length = length;
    _owningBytes = owningBytes;
    _cleanup = [cleanup copy];
  }
  return self;
}

- (instancetype)initWithCopiedBytes:(const void *)bytes length:(NSUInteger)length
{
  if (length == 0) {
    return [self initWithBytesNoCopy:NULL length:0 owningBytes:YES cleanup:nil];
  }

  std::vector<uint8_t> copy(length);
  if (bytes != NULL) {
    std::memcpy(copy.data(), bytes, length);
  }

  // Moving a vector hands over its heap buffer, so `data()` stays valid in `_copiedBytes`.
  if (self = [self initWithBytesNoCopy:copy.data() length:length owningBytes:YES cleanup:nil]) {
    _copiedBytes = std::move(copy);
  }
  return self;
}

+ (instancetype)arrayBufferWithLength:(NSUInteger)length
{
  return [[self alloc] initWithCopiedBytes:NULL length:length];
}

+ (instancetype)arrayBufferWithCopiedBytes:(const void *)bytes length:(NSUInteger)length
{
  return [[self alloc] initWithCopiedBytes:bytes length:length];
}

+ (instancetype)arrayBufferWithOwnedBytes:(void *)bytes
                                   length:(NSUInteger)length
                                  cleanup:(nullable void (^)(void))cleanup
{
  return [[self alloc] initWithBytesNoCopy:bytes length:length owningBytes:YES cleanup:cleanup];
}

+ (instancetype)arrayBufferWithUnownedBytes:(void *)bytes length:(NSUInteger)length
{
  return [[self alloc] initWithBytesNoCopy:bytes length:length owningBytes:NO cleanup:nil];
}

#pragma mark - Accessors

- (void *)mutableBytes
{
  return _bytes;
}

- (NSUInteger)length
{
  return _length;
}

- (BOOL)isOwningBytes
{
  return _owningBytes;
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; length = %lu; owningBytes = %@>",
                                    NSStringFromClass([self class]),
                                    self,
                                    (unsigned long)_length,
                                    _owningBytes ? @"YES" : @"NO"];
}

- (void)dealloc
{
  if (_cleanup != nil) {
    _cleanup();
  }
}

@end
