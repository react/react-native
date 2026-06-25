/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

__deprecated_msg("This API will be removed along with the legacy architecture.") @interface RCTSurface
    : NSObject<RCTSurfaceProtocol>

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties;

@property (atomic, assign, readonly) CGSize minimumSize;

@end
