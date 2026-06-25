/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@interface RCTTestMacros

- (instancetype)initWithName:(NSString *)name NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithDelegate:(id)delegate options:(NSDictionary *)options NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;

+ (instancetype)new NS_UNAVAILABLE;

- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@property (nonatomic, strong, readonly) dispatch_queue_t methodQueue RCT_DEPRECATED;

@property (nonatomic, weak, readonly) id bridge RCT_DEPRECATED;

@property (nonatomic, copy, nullable) NSString *text NS_UNAVAILABLE;

- (void)deprecatedMethod RCT_DEPRECATED;

+ (UIUserInterfaceStyle)userInterfaceStyle API_AVAILABLE(ios(12));

- (void)start;

@end

RCT_EXTERN void RCTExternFunction(const char *input, NSString **output);

RCT_EXTERN NSString *RCTParseType(const char **input);

@protocol RCTTestProtocol

- (void)normalMethod;

- (void)requiredMethod NS_DESIGNATED_INITIALIZER;

@property (nonatomic, readonly) NSString *name RCT_DEPRECATED;

- (void)setSelectedTextRange:(nullable UITextRange *)selectedTextRange NS_UNAVAILABLE;

@end
