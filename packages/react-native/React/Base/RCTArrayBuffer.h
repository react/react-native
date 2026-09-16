/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * A fixed-length byte buffer shared between JS `ArrayBuffer`s and ObjC TurboModules. Fixed
 * length lets the backing store alias JS memory; `NSMutableData` cannot do that.
 *
 * `isOwningBytes`:
 *  - `YES` — safe to retain and use from any thread (synchronize if aliasing JS
 *     memory).
 *  - `NO` — valid only during the synchronous call on the calling thread; copy with
 *    `arrayBufferWithCopiedBytes:length:` to keep the bytes.
 */
@interface RCTArrayBuffer : NSObject

/**
 * NULL when `length` is 0, non-NULL otherwise, matching `NSData.bytes`.
 */
@property (nonatomic, readonly, nullable) void *mutableBytes NS_RETURNS_INNER_POINTER;

@property (nonatomic, readonly) NSUInteger length;

/** Whether the buffer owns its bytes. See the class comment. */
@property (nonatomic, readonly, getter=isOwningBytes) BOOL owningBytes;

/**
 * A new zero-filled owning buffer.
 */
+ (instancetype)arrayBufferWithLength:(NSUInteger)length;

/**
 * A new owning buffer holding a copy of `bytes`. Passing NULL zero-fills.
 */
+ (instancetype)arrayBufferWithCopiedBytes:(const void *_Nullable)bytes length:(NSUInteger)length;

/**
 * An owning buffer aliasing `bytes` without copying. If `cleanup` is non-nil, it runs on dealloc,
 * like `-[NSData dataWithBytesNoCopy:length:freeWhenDone:YES]`; if nil, the caller must keep
 * `bytes` valid until dealloc. NULL `bytes` with non-zero `length` raises NSInvalidArgumentException.
 */
+ (instancetype)arrayBufferWithOwnedBytes:(nullable void *)bytes
                                   length:(NSUInteger)length
                                  cleanup:(nullable void (^)(void))cleanup;

/**
 * A non-owning, zero-copy alias of `bytes`. See the class comment for lifetime rules. NULL `bytes`
 * with non-zero `length` raises NSInvalidArgumentException.
 */
+ (instancetype)arrayBufferWithUnownedBytes:(nullable void *)bytes length:(NSUInteger)length;

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
