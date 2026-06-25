/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <string_view>

namespace facebook::react::unstable_redbox {

/**
 * These functions are for handling of query-string free URLs, necessitated
 * by query string stripping of URLs in JavaScriptCore stack traces
 * introduced in iOS 16.4. This is a direct port of https://www.npmjs.com/package/jsc-safe-url.
 *
 * See https://github.com/facebook/react-native/issues/36794 for context.
 */

bool isJscSafeUrl(std::string_view url);
std::string toNormalUrl(std::string url);
std::string toJscSafeUrl(std::string url);

} // namespace facebook::react::unstable_redbox
