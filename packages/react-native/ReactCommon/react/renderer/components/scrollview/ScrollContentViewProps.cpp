/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollContentViewProps.h"

namespace facebook::react {

ScrollContentViewProps::ScrollContentViewProps(
    const PropsParserContext& context,
    const ScrollContentViewProps& sourceProps,
    const RawProps& rawProps)
    : ViewProps(context, sourceProps, rawProps) {}

} // namespace facebook::react
