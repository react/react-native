/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <react/timing/primitives.h>

#include <optional>
#include <string>
#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/// Arbitrary data structure, which represents payload of the "ProfileChunk"
/// Trace Event.
struct TraceEventProfileChunk {
  /// Deltas between timestamps of chronolocigally sorted samples.
  /// Will be sent as part of the "ProfileChunk" trace event.
  using TimeDeltas = std::vector<HighResDuration>;

  /// Contains Profile information that will be emitted in this chunk: nodes and
  /// sample root node ids.
  struct CPUProfile {
    /// Unique node in the profile tree, has unique id, call frame and
    /// optionally
    /// id of its parent node. Only root node has no parent.
    struct Node {
      /// Unique call frame in the call stack.
      struct CallFrame {
        std::string codeType;
        uint32_t scriptId;
        std::string functionName;
        std::optional<std::string> url;
        std::optional<uint32_t> lineNumber;
        std::optional<uint32_t> columnNumber;
      };

      uint32_t id;
      CallFrame callFrame;
      std::optional<uint32_t> parentId;
    };

    std::vector<Node> nodes;
    std::vector<uint32_t> samples;
  };

  CPUProfile cpuProfile;
  TimeDeltas timeDeltas;
};

} // namespace facebook::react::jsinspector_modern::tracing
