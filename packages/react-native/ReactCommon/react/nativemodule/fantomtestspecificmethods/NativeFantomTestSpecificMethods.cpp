/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeFantomTestSpecificMethods.h"
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

#include "internal/FantomForcedCloneCommitHook.h"

#if RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule>
NativeFantomTestSpecificMethodsModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeFantomTestSpecificMethods>(
      std::move(jsInvoker));
}

namespace {

facebook::react::UIManager& getUIManagerFromRuntime(
    facebook::jsi::Runtime& runtime) {
  return facebook::react::UIManagerBinding::getBinding(runtime)->getUIManager();
}

} // namespace

namespace facebook::react {

NativeFantomTestSpecificMethods::NativeFantomTestSpecificMethods(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeFantomTestSpecificMethodsCxxSpec(std::move(jsInvoker)),
      fantomForcedCloneCommitHook_(
          std::make_shared<FantomForcedCloneCommitHook>()) {}

void NativeFantomTestSpecificMethods::registerForcedCloneCommitHook(
    jsi::Runtime& runtime) {
  auto& uiManager = getUIManagerFromRuntime(runtime);
  uiManager.registerCommitHook(*fantomForcedCloneCommitHook_);
}

void NativeFantomTestSpecificMethods::takeFunctionAndNoop(
    jsi::Runtime& /* runtime */,
    jsi::Function /* callback */) {}

void NativeFantomTestSpecificMethods::setRootNodeSize(
    jsi::Runtime& runtime,
    int surfaceId,
    float width,
    float height) {
  auto& uiManager = getUIManagerFromRuntime(runtime);

  uiManager.getShadowTreeRegistry().visit(
      surfaceId, [&](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& oldRootShadowNode)
                -> RootShadowNode::Unshared {
              PropsParserContext propsParserContext{
                  surfaceId, *uiManager.getContextContainer()};

              const auto& mainBranchRootProps =
                  oldRootShadowNode.getConcreteProps();
              const auto layoutContext = mainBranchRootProps.layoutContext;
              auto layoutConstraints = mainBranchRootProps.layoutConstraints;

              layoutConstraints.maximumSize.width = width;
              layoutConstraints.maximumSize.height = height;
              layoutConstraints.minimumSize.width = width;
              layoutConstraints.minimumSize.height = height;

              return oldRootShadowNode.clone(
                  propsParserContext, layoutConstraints, layoutContext);
            },
            {.source = ShadowTreeCommitSource::Unknown});
      });
}

} // namespace facebook::react
