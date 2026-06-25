/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@interface NullabilityTest : NSObject

// Different nullability annotation styles that should be normalized
- (nonnull NSString *)nonnullMethod;
- (nullable NSString *)nullableMethod;
- (NSString *__nonnull)legacyNonnullMethod;
- (NSString *__nullable)legacyNullableMethod;
- (NSString *_Nonnull)modernNonnullMethod;
- (NSString *_Nullable)modernNullableMethod;

@property (nonatomic, nonnull) NSString *nonnullProperty;
@property (nonatomic, nullable) NSString *nullableProperty;

@end
