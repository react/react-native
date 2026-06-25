/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@interface RCTTestInterface

- (void)normalMethod:(NSString *)name;

- (NSArray *)deprecatedMethod:(id)param __deprecated_msg("Use newMethod instead.");

- (instancetype)initWithURL:(NSURL *)url launchOptions:(NSDictionary *)launchOptions __deprecated;

@end

@interface RCTDeprecatedInterface

- (void)normalMethod;

- (void)oldMethod __deprecated_msg("Use newMethod instead.");

- (void)customBubblingEventTypes __deprecated_msg("Use RCTBubblingEventBlock props instead.");

- (void)legacyTitle __deprecated_msg("This API will be removed along with the legacy architecture.");

@end

@protocol RCTDeprecatedProtocol

- (void)normalProtocolMethod;

- (void)deprecatedProtocolMethod __deprecated_msg("Protocol method is deprecated.");

@end
