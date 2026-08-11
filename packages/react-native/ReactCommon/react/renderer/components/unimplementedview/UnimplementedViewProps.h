/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>

namespace facebook::react {

/*
 * It's a normal `ViewProps` with additional information about the component
 * name which is being updated manually in `ComponentDescriptor`.
 */
class UnimplementedViewProps final : public ViewProps {
 public:
  using ViewProps::ViewProps;

  /*
   * Should be called from a `ComponentDescriptor` to store information about
   * the name of a particular component.
   */
  void setComponentName(ComponentName componentName);
  ComponentName getComponentName() const;

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic getDiffProps(const Props* prevProps) const override;
#endif

 private:
  mutable ComponentName componentName_{};
};

} // namespace facebook::react
