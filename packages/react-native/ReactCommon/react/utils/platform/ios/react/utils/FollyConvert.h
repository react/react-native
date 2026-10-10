/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <Foundation/Foundation.h>

#include <folly/dynamic.h>

namespace facebook::react {

folly::dynamic convertIdToFollyDynamic(id json);
id convertFollyDynamicToId(const folly::dynamic &dyn);
NSArray<NSString *> *extractKeysFromFollyDynamic(const folly::dynamic &dyn);

} // namespace facebook::react
