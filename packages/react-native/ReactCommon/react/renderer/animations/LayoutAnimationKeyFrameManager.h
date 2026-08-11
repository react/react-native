/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <react/renderer/animations/LayoutAnimationCallbackWrapper.h>
#include <react/renderer/animations/primitives.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/debug/flags.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/uimanager/LayoutAnimationStatusDelegate.h>
#include <react/renderer/uimanager/UIManagerAnimationDelegate.h>

#include <optional>
#include <unordered_set>

namespace facebook::react {

#ifdef LAYOUT_ANIMATION_VERBOSE_LOGGING
void PrintMutationInstruction(
    std::string message,
    const ShadowViewMutation& mutation);
void PrintMutationInstructionRelative(
    std::string message,
    const ShadowViewMutation& mutation,
    const ShadowViewMutation& relativeMutation);
#else
#define PrintMutationInstruction(a, b)
#define PrintMutationInstructionRelative(a, b, c)
#endif

class LayoutAnimationKeyFrameManager : public UIManagerAnimationDelegate,
                                       public MountingOverrideDelegate {
 public:
  LayoutAnimationKeyFrameManager(
      RuntimeExecutor runtimeExecutor,
      std::shared_ptr<const ContextContainer>& contextContainer,
      LayoutAnimationStatusDelegate* delegate);

#pragma mark - UIManagerAnimationDelegate methods

  void uiManagerDidConfigureNextLayoutAnimation(
      jsi::Runtime& runtime,
      const RawValue& config,
      const jsi::Value& successCallbackValue,
      const jsi::Value& failureCallbackValue) const override;

  void setComponentDescriptorRegistry(const SharedComponentDescriptorRegistry&
                                          componentDescriptorRegistry) override;

  // TODO: add SurfaceId to this API as well
  bool shouldAnimateFrame() const override;

  void stopSurface(SurfaceId surfaceId) override;

#pragma mark - MountingOverrideDelegate methods

  bool shouldOverridePullTransaction() const override;

  // This is used to "hijack" the diffing process to figure out which mutations
  // should be animated. The mutations returned by this function will be
  // executed immediately.
  std::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      const TransactionTelemetry& telemetry,
      ShadowViewMutationList mutations) const override;

  // Exposed for testing.
  void uiManagerDidConfigureNextLayoutAnimation(
      LayoutAnimation layoutAnimation) const;

  // LayoutAnimationStatusDelegate - this is for the platform to get
  // signal when animations start and complete. Setting and resetting this
  // delegate is protected by a mutex; ALL method calls into this delegate are
  // also protected by the mutex! The only way to set this without a mutex is
  // via a constructor.
  void setLayoutAnimationStatusDelegate(
      LayoutAnimationStatusDelegate* delegate) const;

  void setClockNow(std::function<uint64_t()> now);

 protected:
  SharedComponentDescriptorRegistry componentDescriptorRegistry_;
  mutable std::optional<LayoutAnimation> currentAnimation_{};
  mutable std::mutex currentAnimationMutex_;

  /**
   * All mutations of inflightAnimations_ are thread-safe as long as
   * we keep the contract of: only mutate it within the context of
   * `pullTransaction`. If that contract is held, this is implicitly protected
   * by the MountingCoordinator's mutex.
   */
  mutable std::vector<LayoutAnimation> inflightAnimations_{};

  bool hasComponentDescriptorForShadowView(const ShadowView& shadowView) const;
  const ComponentDescriptor& getComponentDescriptorForShadowView(
      const ShadowView& shadowView) const;

  /**
   * Given a `progress` between 0 and 1, a mutation and LayoutAnimation config,
   * return a ShadowView with mutated props and/or LayoutMetrics.
   *
   * @param progress the current progress for the animation
   * @param startingView the initial configuration of the ShadowView
   * @param finalView the final configuration of the ShadowView
   * @return the current ShadowView
   */
  ShadowView createInterpolatedShadowView(
      Float progress,
      const ShadowView& startingView,
      const ShadowView& finalView) const;

  void callCallback(const LayoutAnimationCallbackWrapper& callback) const;

  virtual void animationMutationsForFrame(
      SurfaceId surfaceId,
      ShadowViewMutation::List& mutationsList,
      uint64_t now) const = 0;

  /**
   * Queue (and potentially synthesize) final mutations for a finished keyframe.
   * Keyframe animation may have timed-out, or be canceled due to a conflict.
   */
  void queueFinalMutationsForCompletedKeyFrame(
      const AnimationKeyFrame& keyframe,
      ShadowViewMutation::List& mutationsList,
      bool interrupted,
      const std::string& logPrefix) const;

 private:
  RuntimeExecutor runtimeExecutor_;
  std::shared_ptr<const ContextContainer> contextContainer_;

  mutable std::mutex layoutAnimationStatusDelegateMutex_;
  mutable LayoutAnimationStatusDelegate* layoutAnimationStatusDelegate_{};
  mutable std::mutex surfaceIdsToStopMutex_;
  mutable std::unordered_set<SurfaceId> surfaceIdsToStop_{};

  // Function that returns current time in milliseconds
  std::function<uint64_t()> now_;

  void adjustImmediateMutationIndicesForDelayedMutations(
      SurfaceId surfaceId,
      ShadowViewMutation& mutation,
      bool skipLastAnimation = false,
      bool lastAnimationOnly = false) const;

  void adjustDelayedMutationIndicesForMutation(
      SurfaceId surfaceId,
      const ShadowViewMutation& mutation,
      bool skipLastAnimation = false) const;

  void getAndEraseConflictingAnimations(
      SurfaceId surfaceId,
      const ShadowViewMutationList& mutations,
      std::vector<AnimationKeyFrame>& conflictingAnimations) const;

  /*
   * Removes animations from `inflightAnimations_` for stopped surfaces.
   */
  void deleteAnimationsForStoppedSurfaces() const;

  void simulateImagePropsMemoryAccess(
      const ShadowViewMutationList& mutations) const;

  /**
   * Interpolates the props values.
   */
  Props::Shared interpolateProps(
      const ComponentDescriptor& componentDescriptor,
      const PropsParserContext& context,
      Float animationProgress,
      const Props::Shared& props,
      const Props::Shared& newProps,
      const Size& size) const;
};

} // namespace facebook::react
