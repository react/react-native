/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@interface RCTInterfaceWithBlockProperty : NSObject

@property (nonatomic, copy, nullable) void (^eventInterceptor)
    (NSString *eventName, NSDictionary *event, NSNumber *reactTag);
@property (nonatomic, copy) void (^simpleBlock)(void);
@property (nonatomic, copy) NSString * (^blockWithReturn)(int value);

@end
