/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawPropsKey.h"

#include <array>
#include <cassert>
#include <cstring>

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/RawPropsPrimitives.h>

namespace facebook::react {

void RawPropsKey::render(char* buffer, RawPropsPropNameLength* length)
    const noexcept {
  *length = 0;

  // Prefix
  if (prefix != nullptr) {
    auto prefixLength =
        static_cast<RawPropsPropNameLength>(std::strlen(prefix));
    std::memcpy(buffer, prefix, prefixLength);
    *length = prefixLength;
  }

  // Name
  auto nameLength = static_cast<RawPropsPropNameLength>(std::strlen(name));
  std::memcpy(buffer + *length, name, nameLength);
  *length += nameLength;

  // Suffix
  if (suffix != nullptr) {
    auto suffixLength =
        static_cast<RawPropsPropNameLength>(std::strlen(suffix));
    std::memcpy(buffer + *length, suffix, suffixLength);
    *length += suffixLength;
  }
  react_native_assert(*length < kPropNameLengthHardCap);
}

RawPropsKey::operator std::string() const noexcept {
  auto buffer = std::array<char, kPropNameLengthHardCap>();
  RawPropsPropNameLength length = 0;
  render(buffer.data(), &length);
  react_native_assert(length < kPropNameLengthHardCap);
  return std::string{buffer.data(), length};
}

static bool areFieldsEqual(const char* lhs, const char* rhs) {
  if (lhs == nullptr || rhs == nullptr) {
    return lhs == rhs;
  }
  return lhs == rhs || strcmp(lhs, rhs) == 0;
}

bool operator==(const RawPropsKey& lhs, const RawPropsKey& rhs) noexcept {
  // Note: We check the name first.
  return areFieldsEqual(lhs.name, rhs.name) &&
      areFieldsEqual(lhs.prefix, rhs.prefix) &&
      areFieldsEqual(lhs.suffix, rhs.suffix);
}

bool operator!=(const RawPropsKey& lhs, const RawPropsKey& rhs) noexcept {
  return !(lhs == rhs);
}

} // namespace facebook::react
