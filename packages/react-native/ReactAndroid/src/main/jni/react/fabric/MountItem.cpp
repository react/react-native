/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MountItem.h"

namespace facebook::react {

CppMountItem CppMountItem::CreateMountItem(const ShadowView& shadowView) {
  return {
      .type = CppMountItem::Type::Create,
      .parentTag = {},
      .oldChildShadowView = {},
      .newChildShadowView = shadowView,
      .index = -1};
}
CppMountItem CppMountItem::DeleteMountItem(const ShadowView& shadowView) {
  return {
      .type = CppMountItem::Type::Delete,
      .parentTag = {},
      .oldChildShadowView = shadowView,
      .newChildShadowView = {},
      .index = -1};
}
CppMountItem CppMountItem::InsertMountItem(
    Tag parentTag,
    const ShadowView& shadowView,
    int index) {
  return {
      .type = CppMountItem::Type::Insert,
      .parentTag = parentTag,
      .oldChildShadowView = {},
      .newChildShadowView = shadowView,
      .index = index};
}
CppMountItem CppMountItem::RemoveMountItem(
    Tag parentTag,
    const ShadowView& shadowView,
    int index) {
  return {
      .type = CppMountItem::Type::Remove,
      .parentTag = parentTag,
      .oldChildShadowView = shadowView,
      .newChildShadowView = {},
      .index = index};
}
CppMountItem CppMountItem::UpdatePropsMountItem(
    const ShadowView& oldShadowView,
    const ShadowView& newShadowView) {
  return {
      .type = CppMountItem::Type::UpdateProps,
      .parentTag = {},
      .oldChildShadowView = oldShadowView,
      .newChildShadowView = newShadowView,
      .index = -1};
}
CppMountItem CppMountItem::UpdateStateMountItem(const ShadowView& shadowView) {
  return {
      .type = CppMountItem::Type::UpdateState,
      .parentTag = {},
      .oldChildShadowView = {},
      .newChildShadowView = shadowView,
      .index = -1};
}
CppMountItem CppMountItem::UpdateLayoutMountItem(
    const ShadowView& shadowView,
    Tag parentTag) {
  return {
      .type = CppMountItem::Type::UpdateLayout,
      .parentTag = parentTag,
      .oldChildShadowView = {},
      .newChildShadowView = shadowView,
      .index = -1};
}
CppMountItem CppMountItem::UpdateEventEmitterMountItem(
    const ShadowView& shadowView) {
  return {
      .type = CppMountItem::Type::UpdateEventEmitter,
      .parentTag = kNoTag,
      .oldChildShadowView = {},
      .newChildShadowView = shadowView,
      .index = -1};
}
CppMountItem CppMountItem::UpdatePaddingMountItem(
    const ShadowView& shadowView) {
  return {
      .type = CppMountItem::Type::UpdatePadding,
      .parentTag = kNoTag,
      .oldChildShadowView = {},
      .newChildShadowView = shadowView,
      .index = -1};
}
CppMountItem CppMountItem::UpdateOverflowInsetMountItem(
    const ShadowView& shadowView) {
  return {
      .type = CppMountItem::Type::UpdateOverflowInset,
      .parentTag = kNoTag,
      .oldChildShadowView = {},
      .newChildShadowView = shadowView,
      .index = -1};
}

} // namespace facebook::react
