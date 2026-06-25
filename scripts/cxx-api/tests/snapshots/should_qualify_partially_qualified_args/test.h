/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {

namespace yoga {

struct Node {};

struct Result {};

} // namespace yoga

namespace react {

void processNode(yoga::Node node);
yoga::Result getResult(yoga::Node node, int flags);

} // namespace react

} // namespace facebook
