/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <include/core/SkBitmap.h>

#include <jsi/jsi.h>
#include <memory>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

class Screenshot : public jsi::HostObject, public std::enable_shared_from_this<Screenshot> {
 public:
  using Surface = SkBitmap;

  explicit Screenshot(Surface surface);
  size_t getMemorySize() const;
  const std::string &getHash();
  bool isEqual(const Screenshot &other) const;
  const std::vector<unsigned char> &getPNG();
  void saveToFile(const std::string &filePath);
  jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override;

 private:
  Surface surface_;
  std::optional<std::string> hash_;
  std::optional<std::vector<unsigned char>> png_;
};

} // namespace facebook::react
