/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/renderer/mounting/ShadowView.h>

namespace facebook::react {

struct JMountItem : public jni::JavaClass<JMountItem> {
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/fabric/mounting/mountitems/MountItem;";
};

struct CppMountItem final {
#pragma mark - Designated Initializers

  static CppMountItem CreateMountItem(const ShadowView& shadowView);

  static CppMountItem DeleteMountItem(const ShadowView& shadowView);

  static CppMountItem
  InsertMountItem(Tag parentTag, const ShadowView& shadowView, int index);

  static CppMountItem
  RemoveMountItem(Tag parentTag, const ShadowView& shadowView, int index);

  static CppMountItem UpdatePropsMountItem(
      const ShadowView& oldShadowView,
      const ShadowView& newShadowView);

  static CppMountItem UpdateStateMountItem(const ShadowView& shadowView);

  static CppMountItem UpdateLayoutMountItem(
      const ShadowView& shadowView,
      Tag parentTag);

  static CppMountItem UpdateEventEmitterMountItem(const ShadowView& shadowView);

  static CppMountItem UpdatePaddingMountItem(const ShadowView& shadowView);

  static CppMountItem UpdateOverflowInsetMountItem(
      const ShadowView& shadowView);

#pragma mark - Type

  enum Type {
    Undefined = -1,
    Multiple = 1,
    Create = 2,
    Delete = 4,
    Insert = 8,
    Remove = 16,
    UpdateProps = 32,
    UpdateState = 64,
    UpdateLayout = 128,
    UpdateEventEmitter = 256,
    UpdatePadding = 512,
    UpdateOverflowInset = 1024
  };

#pragma mark - Fields

  Type type = {Create};
  Tag parentTag = -1;
  ShadowView oldChildShadowView = {};
  ShadowView newChildShadowView = {};
  int index = {};
};

} // namespace facebook::react
