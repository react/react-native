/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/cxxstableapi/FrameworksGuard.h>

#import <Foundation/Foundation.h>

#import <react/utils/ContextContainer.h>

@protocol RCTContextContainerHandling <NSObject>

- (void)didCreateContextContainer:(std::shared_ptr<facebook::react::ContextContainer>)contextContainer;

@end
