/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowViewMutation.h"

#include <utility>

namespace facebook::react {

ShadowViewMutation ShadowViewMutation::CreateMutation(ShadowView shadowView) {
  return {
      /* .type = */ Create,
      /* .parentTag = */ kNoTag,
      /* .oldChildShadowView = */ {},
      /* .newChildShadowView = */ std::move(shadowView),
      /* .index = */ -1,
  };
}

ShadowViewMutation ShadowViewMutation::DeleteMutation(ShadowView shadowView) {
  return {
      /* .type = */ Delete,
      /* .parentTag = */ kNoTag,
      /* .oldChildShadowView = */ std::move(shadowView),
      /* .newChildShadowView = */ {},
      /* .index = */ -1,
  };
}

ShadowViewMutation ShadowViewMutation::InsertMutation(
    Tag parentTag,
    ShadowView childShadowView,
    int index) {
  return {
      /* .type = */ Insert,
      /* .parentTag = */ parentTag,
      /* .oldChildShadowView = */ {},
      /* .newChildShadowView = */ std::move(childShadowView),
      /* .index = */ index,
  };
}

ShadowViewMutation ShadowViewMutation::RemoveMutation(
    Tag parentTag,
    ShadowView childShadowView,
    int index) {
  return {
      /* .type = */ Remove,
      /* .parentTag = */ parentTag,
      /* .oldChildShadowView = */ std::move(childShadowView),
      /* .newChildShadowView = */ {},
      /* .index = */ index,
  };
}

ShadowViewMutation ShadowViewMutation::UpdateMutation(
    ShadowView oldChildShadowView,
    ShadowView newChildShadowView,
    Tag parentTag) {
  return {
      /* .type = */ Update,
      /* .parentTag = */ parentTag,
      /* .oldChildShadowView = */ std::move(oldChildShadowView),
      /* .newChildShadowView = */ std::move(newChildShadowView),
      /* .index = */ -1,
  };
}

bool ShadowViewMutation::mutatedViewIsVirtual() const {
  bool viewIsVirtual = false;

#ifdef ANDROID
  // Explanation: Even for non-virtual views,
  //              for "Insert" mutations, oldChildShadowView is always empty.
  //              for "Remove" mutations, newChildShadowView is always empty.
  // Thus, to see if a view is virtual, we need to always check both the old and
  // new View.
  viewIsVirtual = newChildShadowView.layoutMetrics == EmptyLayoutMetrics &&
      oldChildShadowView.layoutMetrics == EmptyLayoutMetrics;
#endif

  return viewIsVirtual;
}

ShadowViewMutation::ShadowViewMutation(
    Type type,
    Tag parentTag,
    ShadowView oldChildShadowView,
    ShadowView newChildShadowView,
    int index)
    : type(type),
      parentTag(parentTag),
      oldChildShadowView(std::move(oldChildShadowView)),
      newChildShadowView(std::move(newChildShadowView)),
      index(index) {}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const ShadowViewMutation& mutation) {
  switch (mutation.type) {
    case ShadowViewMutation::Create:
      return "Create";
    case ShadowViewMutation::Delete:
      return "Delete";
    case ShadowViewMutation::Insert:
      return "Insert";
    case ShadowViewMutation::Remove:
      return "Remove";
    case ShadowViewMutation::Update:
      return "Update";
  }
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    const ShadowViewMutation& mutation,
    DebugStringConvertibleOptions options) {
  return {
      mutation.oldChildShadowView.componentHandle != 0
          ? DebugStringConvertibleObject{"oldChild",
                                         getDebugDescription(
                                             mutation.oldChildShadowView,
                                             options)}
          : DebugStringConvertibleObject{},
      mutation.newChildShadowView.componentHandle != 0
          ? DebugStringConvertibleObject{"newChild",
                                         getDebugDescription(
                                             mutation.newChildShadowView,
                                             options)}
          : DebugStringConvertibleObject{},
      mutation.parentTag != kNoTag
          ? DebugStringConvertibleObject{"parent",
                                         getDebugDescription(
                                             mutation.parentTag,
                                             options)}
          : DebugStringConvertibleObject{},
      mutation.index != -1
          ? DebugStringConvertibleObject{"index",
                                         getDebugDescription(
                                             mutation.index, options)}
          : DebugStringConvertibleObject{},
  };
}

#endif

} // namespace facebook::react
