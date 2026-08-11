/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <utility>

#include <jsinspector-modern/tracing/RuntimeSamplingProfile.h>

namespace facebook::react::jsinspector_modern::tracing {

/*
 * Auxiliary data structure used for creating Profile tree and identifying
 * identical frames.
 */
class ProfileTreeNode {
 public:
  /*
   * For Chromium & V8 this could also be WASM, this is not the case for us.
   */
  enum class CodeType {
    JavaScript,
    Other,
  };

  static constexpr uint32_t NO_PARENT = UINT32_MAX;

  ProfileTreeNode(
      uint32_t id,
      CodeType codeType,
      RuntimeSamplingProfile::SampleCallStackFrame callFrame,
      uint32_t parentId = NO_PARENT)
      : id_(id),
        codeType_(codeType),
        parentId_(parentId),
        callFrame_(std::move(callFrame)) {}

  uint32_t getId() const {
    return id_;
  }

  CodeType getCodeType() const {
    return codeType_;
  }

  inline bool hasParent() const {
    return parentId_ != NO_PARENT;
  }

  uint32_t getParentId() const {
    return parentId_;
  }

  /**
   * \return call frame information that is represented by this node.
   */
  const RuntimeSamplingProfile::SampleCallStackFrame& getCallFrame() const {
    return callFrame_;
  }

  /**
   * \return a pointer if the node already contains a child with the same
   * codeType and callFrame, nullptr otherwise.
   */
  ProfileTreeNode* getIfAlreadyExists(
      CodeType childCodeType,
      const RuntimeSamplingProfile::SampleCallStackFrame& childCallFrame) {
    for (auto& existingChild : children_) {
      if (existingChild.getCodeType() == childCodeType &&
          existingChild.getCallFrame() == childCallFrame) {
        return &existingChild;
      }
    }

    return nullptr;
  }

  /**
   * Creates a ProfileTreeNode and links it as a child to this node.
   * \return a pointer to the child node.
   */
  ProfileTreeNode* addChild(
      uint32_t childId,
      CodeType childCodeType,
      RuntimeSamplingProfile::SampleCallStackFrame childCallFrame) {
    return &children_.emplace_back(
        childId, childCodeType, std::move(childCallFrame), id_);
  }

 private:
  /**
   * Unique id of the node.
   */
  uint32_t id_;
  /**
   * Type of the code that is represented by this node. Either JavaScript or
   * Other.
   */
  CodeType codeType_;
  /**
   * Unique id of the parent node. NO_PARENT if this is root node.
   */
  uint32_t parentId_;
  /**
   * List of children nodes, should be unique by codeType and callFrame among
   * each other.
   */
  std::vector<ProfileTreeNode> children_;
  /**
   * Information about the corresponding call frame that is represented by this
   * node.
   */
  RuntimeSamplingProfile::SampleCallStackFrame callFrame_;
};

} // namespace facebook::react::jsinspector_modern::tracing
