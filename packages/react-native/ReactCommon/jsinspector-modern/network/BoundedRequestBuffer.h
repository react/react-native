/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <deque>
#include <memory>
#include <string>
#include <unordered_map>

namespace facebook::react::jsinspector_modern {

/**
 * Maximum memory size (in bytes) to store buffered text and image request
 * bodies.
 */
constexpr size_t REQUEST_BUFFER_MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

/**
 * A class to store network response previews keyed by requestId, with a fixed
 * memory limit. Evicts oldest responses when memory is exceeded.
 */
class BoundedRequestBuffer {
 public:
  struct ResponseBody {
    std::string data;
    bool base64Encoded;
  };

  /**
   * Store a response preview with the given requestId and data.
   * If adding the data exceeds the memory limit, removes oldest requests until
   * there is enough space or the buffer is empty.
   * \param requestId Unique identifier for the request.
   * \param data The request preview data (e.g. text or image body).
   * \param base64Encoded True if the data is base64-encoded, false otherwise.
   * \return True if the response body was stored, false otherwise.
   */
  bool put(
      const std::string& requestId,
      std::string_view data,
      bool base64Encoded) noexcept;

  /**
   * Retrieve a response preview by requestId.
   * \param requestId The unique identifier for the request.
   * \return A shared pointer to the request data if found, otherwise nullptr.
   */
  std::shared_ptr<const ResponseBody> get(const std::string& requestId) const;

  /**
   * Remove all entries from the buffer.
   */
  void clear();

 private:
  std::unordered_map<std::string, std::shared_ptr<const ResponseBody>>
      responses_;
  std::deque<std::string> order_;
  size_t currentSize_ = 0;
};

} // namespace facebook::react::jsinspector_modern
