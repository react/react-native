/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <string>

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook::react {

void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, ImageSource &result);

std::string toString(const ImageSource &value);

void fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, ImageResizeMode &result);

std::string toString(const ImageResizeMode &value);

} // namespace facebook::react
