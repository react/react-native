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
  void (^_cleanup)(void);
  std::vector<uint8_t> _copiedBytes;
}

@synthesize mutableBytes = _bytes;
@synthesize length = _length;
@synthesize owningBytes = _owningBytes;

#pragma mark - Initializers

- (instancetype)initWithBytesNoCopy:(void *)bytes
                             length:(NSUInteger)length
                        owningBytes:(BOOL)owningBytes
                            cleanup:(void (^)(void))cleanup
{
  if (bytes == NULL && length != 0) {
    // Nothing else will ever release whatever `bytes` was meant to be once this fails.
    if (cleanup != nil) {
      cleanup();
    }
    [NSException raise:NSInvalidArgumentException
                format:@"RCTArrayBuffer: NULL bytes with length %lu", (unsigned long)length];
  }

  if ((self = [super init]) != nil) {
    // `mutableBytes` is documented as NULL exactly when empty.
    _bytes = length == 0 ? NULL : bytes;
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
  if ((self = [self initWithBytesNoCopy:copy.data() length:length owningBytes:YES cleanup:nil]) != nil) {
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
  // Runs on whichever thread drops the last reference, so cleanup blocks must be thread-agnostic.
  if (_cleanup != nil) {
    _cleanup();
  }
}

@end
