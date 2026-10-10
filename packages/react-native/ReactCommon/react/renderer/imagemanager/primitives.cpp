/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/imagemanager/primitives.h>

#if RN_DEBUG_STRING_CONVERTIBLE
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#endif

namespace facebook::react {

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ImageSource::getDebugProps(
    const std::string& prefix) const {
  ImageSource imageSource{};

  SharedDebugStringConvertibleList headersList;
  for (const auto& header : headers) {
    headersList.push_back(debugStringConvertibleItem(
        prefix + "-header-" + header.first, header.second));
  }

  return headersList +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem(
              prefix + "-type", toString(type), toString(imageSource.type)),
          debugStringConvertibleItem(prefix + "-uri", uri, imageSource.uri),
          debugStringConvertibleItem(
              prefix + "-bundle", bundle, imageSource.bundle),
          debugStringConvertibleItem(
              prefix + "-scale", scale, imageSource.scale),
          debugStringConvertibleItem(
              prefix + "-size",
              react::toString(size),
              react::toString(imageSource.size)),
          debugStringConvertibleItem(prefix + "-body", body, imageSource.body),
          debugStringConvertibleItem(
              prefix + "-method", method, imageSource.method),
          debugStringConvertibleItem(
              prefix + "-cache", toString(cache), toString(imageSource.cache)),
      };
}
#endif

} // namespace facebook::react
