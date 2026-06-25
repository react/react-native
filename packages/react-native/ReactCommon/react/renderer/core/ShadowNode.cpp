/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowNode.h"
#include "DynamicPropsUtilities.h"

#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

#include <utility>

namespace facebook::react {

/*
 * Runtime shadow node reference updates should only run from one thread at all
 * times to avoid having more than one shadow tree updating the current fiber
 * tree simultaneously. This thread_local flag allows enabling the updates for
 * chosen threads.
 */
thread_local bool useRuntimeShadowNodeReferenceUpdateOnThread{false}; // NOLINT

/* static */ void ShadowNode::setUseRuntimeShadowNodeReferenceUpdateOnThread(
    bool isEnabled) {
  useRuntimeShadowNodeReferenceUpdateOnThread = isEnabled;
}

/* static */ bool ShadowNode::getUseRuntimeShadowNodeReferenceUpdateOnThread() {
  return useRuntimeShadowNodeReferenceUpdateOnThread;
}

std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>>
ShadowNode::emptySharedShadowNodeSharedList() {
  static const auto emptySharedShadowNodeSharedList =
      std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
  return emptySharedShadowNodeSharedList;
}

/*
 * On iOS, this method returns `props` if provided, `sourceShadowNode`'s props
 * otherwise. On Android, we forward props in case `sourceShadowNode` hasn't
 * been mounted. `Props::rawProps` are merged from `props` to a copy of
 * `sourceShadowNode.props_` and returned. This is necessary to enable
 * Background Executor and should be removed once reimplementation of JNI layer
 * is finished.
 */
Props::Shared ShadowNode::propsForClonedShadowNode(
    const ShadowNode& sourceShadowNode,
    const Props::Shared& props) {
#ifdef RN_SERIALIZABLE_STATE
  bool hasBeenMounted = sourceShadowNode.hasBeenMounted_;
  bool sourceNodeHasRawProps = !sourceShadowNode.getProps()->rawProps.empty();
  if (!hasBeenMounted && sourceNodeHasRawProps && props) {
    auto& castedProps = const_cast<Props&>(*props);
    castedProps.rawProps = mergeDynamicProps(
        sourceShadowNode.getProps()->rawProps,
        props->rawProps,
        NullValueStrategy::Override);
    return props;
  }
#endif
  return props ? props : sourceShadowNode.getProps();
}

bool ShadowNode::sameFamily(const ShadowNode& first, const ShadowNode& second) {
  return first.family_ == second.family_;
}

#pragma mark - Constructors

ShadowNode::ShadowNode(
    const ShadowNodeFragment& fragment,
    ShadowNodeFamily::Shared family,
    ShadowNodeTraits traits)
    :
#if RN_DEBUG_STRING_CONVERTIBLE
      revision_(1),
#endif
      props_(fragment.props),
      children_(
          fragment.children ? fragment.children
                            : emptySharedShadowNodeSharedList()),
      state_(fragment.state),
      orderIndex_(0),
      family_(std::move(family)),
      traits_(traits) {
  react_native_assert(props_);
  react_native_assert(children_);

  traits_.set(ShadowNodeTraits::Trait::ChildrenAreShared);

  for (const auto& child : *children_) {
    child->family_->setParent(family_);
  }

  propagateUncullableTraitsFromChildren();

  // The first node of the family gets its state committed automatically.
  family_->setMostRecentState(state_);
}

ShadowNode::ShadowNode(
    const ShadowNode& sourceShadowNode,
    const ShadowNodeFragment& fragment)
    :
#if RN_DEBUG_STRING_CONVERTIBLE
      revision_(sourceShadowNode.revision_ + 1),
#endif
      props_(propsForClonedShadowNode(sourceShadowNode, fragment.props)),
      children_(
          fragment.children ? fragment.children : sourceShadowNode.children_),
      state_(fragment.state ? fragment.state : sourceShadowNode.state_),
      orderIndex_(sourceShadowNode.orderIndex_),
      family_(sourceShadowNode.family_),
      traits_(sourceShadowNode.traits_) {

  react_native_assert(props_);
  react_native_assert(children_);
  traits_.set(ShadowNodeTraits::Trait::ChildrenAreShared);

  if (fragment.children) {
    for (const auto& child : *children_) {
      child->family_->setParent(family_);
    }
    propagateUncullableTraitsFromChildren();
  }
}

std::shared_ptr<ShadowNode> ShadowNode::clone(
    const ShadowNodeFragment& fragment) const {
  const auto& family = *family_;
  const auto& componentDescriptor = family.componentDescriptor_;
  if (family.nativeProps_DEPRECATED != nullptr) {
    auto propsParserContext = PropsParserContext{family_->getSurfaceId(), {}};
    if (fragment.props == ShadowNodeFragment::propsPlaceholder()) {
      // Clone existing `props_` with `family.nativeProps_DEPRECATED` to apply
      // previously set props via `setNativeProps` API.
      auto props = componentDescriptor.cloneProps(
          propsParserContext, props_, RawProps(*family.nativeProps_DEPRECATED));
      auto clonedNode = componentDescriptor.cloneShadowNode(
          *this,
          {.props = props,
           .children = fragment.children,
           .state = fragment.state});
      return clonedNode;
    } else {
      // TODO: We might need to merge fragment.props with
      // `family.nativeProps_DEPRECATED`.
      return componentDescriptor.cloneShadowNode(*this, fragment);
    }
  } else {
    return componentDescriptor.cloneShadowNode(*this, fragment);
  }
}

std::shared_ptr<const ContextContainer> ShadowNode::getContextContainer()
    const {
  return family_->componentDescriptor_.getContextContainer();
}

#pragma mark - Getters

ComponentName ShadowNode::getComponentName() const {
  return family_->getComponentName();
}

ComponentHandle ShadowNode::getComponentHandle() const {
  return family_->getComponentHandle();
}

const std::vector<std::shared_ptr<const ShadowNode>>& ShadowNode::getChildren()
    const {
  return *children_;
}

ShadowNodeTraits ShadowNode::getTraits() const {
  return traits_;
}

const Props::Shared& ShadowNode::getProps() const {
  return props_;
}

const SharedEventEmitter& ShadowNode::getEventEmitter() const {
  return family_->eventEmitter_;
}

jsi::Value ShadowNode::getInstanceHandle(jsi::Runtime& runtime) const {
  return family_->getInstanceHandle(runtime);
}

Tag ShadowNode::getTag() const {
  return family_->tag_;
}

SurfaceId ShadowNode::getSurfaceId() const {
  return family_->surfaceId_;
}

const ComponentDescriptor& ShadowNode::getComponentDescriptor() const {
  return family_->componentDescriptor_;
}

const State::Shared& ShadowNode::getState() const {
  return state_;
}

State::Shared ShadowNode::getMostRecentState() const {
  return family_->getMostRecentState();
}

int ShadowNode::getOrderIndex() const {
  return orderIndex_;
}

void ShadowNode::sealRecursive() const {
  if (getSealed()) {
    return;
  }

  seal();

  props_->seal();

  for (const auto& child : *children_) {
    child->sealRecursive();
  }
}

#pragma mark - Mutating Methods

void ShadowNode::appendChild(const std::shared_ptr<const ShadowNode>& child) {
  ensureUnsealed();

  cloneChildrenIfShared();
  auto& children =
      const_cast<std::vector<std::shared_ptr<const ShadowNode>>&>(*children_);
  children.push_back(child);

  child->family_->setParent(family_);
  propagateUncullableTraitsFromChildren();
}

void ShadowNode::replaceChild(
    const ShadowNode& oldChild,
    const std::shared_ptr<const ShadowNode>& newChild,
    size_t suggestedIndex) {
  ensureUnsealed();

  cloneChildrenIfShared();
  newChild->family_->setParent(family_);

  auto& children =
      const_cast<std::vector<std::shared_ptr<const ShadowNode>>&>(*children_);
  auto size = children.size();

  if (suggestedIndex != std::numeric_limits<size_t>::max() &&
      suggestedIndex < size) {
    // If provided `suggestedIndex` is accurate,
    // replacing in place using the index.
    if (children.at(suggestedIndex).get() == &oldChild) {
      children[suggestedIndex] = newChild;
      return;
    }
  }

  for (size_t index = 0; index < size; index++) {
    if (children.at(index).get() == &oldChild) {
      children[index] = newChild;
      return;
    }
  }

  react_native_assert(false && "Child to replace was not found.");
  propagateUncullableTraitsFromChildren();
}

void ShadowNode::cloneChildrenIfShared() {
  if (!traits_.check(ShadowNodeTraits::Trait::ChildrenAreShared)) {
    return;
  }

  traits_.unset(ShadowNodeTraits::Trait::ChildrenAreShared);
  children_ = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
      *children_);
}

void ShadowNode::propagateUncullableTraitsFromChildren() {
  if (ReactNativeFeatureFlags::enableViewCulling()) {
    if (traits_.check(ShadowNodeTraits::Trait::Unstable_uncullableView)) {
      return;
    }

    for (const auto& child : *children_) {
      if (child->getTraits().check(
              ShadowNodeTraits::Trait::Unstable_uncullableView) ||
          child->getTraits().check(
              ShadowNodeTraits::Trait::Unstable_uncullableTrace)) {
        traits_.set(ShadowNodeTraits::Trait::Unstable_uncullableTrace);
        return;
      }
    }
    traits_.unset(ShadowNodeTraits::Trait::Unstable_uncullableTrace);
  }
}

void ShadowNode::setMounted(bool mounted) const {
  if (mounted) {
    family_->setMostRecentState(getState());
    family_->setMounted();
    hasBeenMounted_ = mounted;
  }

  family_->eventEmitter_->setEnabled(mounted);
}

bool ShadowNode::getHasBeenPromoted() const {
  return hasBeenMounted_.load();
}

void ShadowNode::setRuntimeShadowNodeReference(
    const std::shared_ptr<ShadowNodeWrapper>& runtimeShadowNodeReference)
    const {
  runtimeShadowNodeReference_ = runtimeShadowNodeReference;
}

void ShadowNode::updateRuntimeShadowNodeReference(
    const std::shared_ptr<const ShadowNode>& destinationShadowNode) const {
  if (auto reference = runtimeShadowNodeReference_.lock()) {
    reference->shadowNode = destinationShadowNode;
  }
}

void ShadowNode::transferRuntimeShadowNodeReference(
    const std::shared_ptr<const ShadowNode>& destinationShadowNode) const {
  destinationShadowNode->runtimeShadowNodeReference_ =
      runtimeShadowNodeReference_;

  if (!ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit() &&
      !ReactNativeFeatureFlags::
          updateRuntimeShadowNodeReferencesOnCommitThread()) {
    updateRuntimeShadowNodeReference(destinationShadowNode);
  }
}

void ShadowNode::transferRuntimeShadowNodeReference(
    const std::shared_ptr<const ShadowNode>& destinationShadowNode,
    const ShadowNodeFragment& fragment) const {
  if ((ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit() ||
       ReactNativeFeatureFlags::
           updateRuntimeShadowNodeReferencesOnCommitThread() ||
       useRuntimeShadowNodeReferenceUpdateOnThread) &&
      fragment.runtimeShadowNodeReference) {
    transferRuntimeShadowNodeReference(destinationShadowNode);
  }
}

const ShadowNodeFamily& ShadowNode::getFamily() const {
  return *family_;
}

ShadowNodeFamily::Shared ShadowNode::getFamilyShared() const {
  return family_;
}

std::shared_ptr<ShadowNode> ShadowNode::cloneTree(
    const ShadowNodeFamily& shadowNodeFamily,
    const std::function<std::shared_ptr<ShadowNode>(
        const ShadowNode& oldShadowNode)>& callback) const {
  auto ancestors = shadowNodeFamily.getAncestors(*this);

  if (ancestors.empty()) {
    return std::shared_ptr<ShadowNode>{nullptr};
  }

  auto& parent = ancestors.back();
  auto& oldShadowNode = parent.first.get().getChildren().at(parent.second);

  auto newShadowNode = callback(*oldShadowNode);

  react_native_assert(
      newShadowNode &&
      "`callback` returned `nullptr` which is not allowed value.");

  auto childNode = newShadowNode;

  for (auto it = ancestors.rbegin(); it != ancestors.rend(); ++it) {
    auto& parentNode = it->first.get();
    auto childIndex = it->second;

    auto children = parentNode.getChildren();
    react_native_assert(
        ShadowNode::sameFamily(*children.at(childIndex), *childNode));
    children[childIndex] = childNode;

    childNode = parentNode.clone(
        {.children =
             std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
                 children)});
  }

  return std::const_pointer_cast<ShadowNode>(childNode);
}

namespace {

std::shared_ptr<ShadowNode> cloneMultipleRecursive(
    const ShadowNode& shadowNode,
    const std::unordered_map<Tag, int>& childrenCount,
    const std::function<std::shared_ptr<
        ShadowNode>(const ShadowNode&, const ShadowNodeFragment&)>& callback) {
  auto& children = shadowNode.getChildren();
  std::shared_ptr<std::vector<std::shared_ptr<const ShadowNode>>> newChildren;
  auto count = childrenCount.at(shadowNode.getTag());

  for (size_t i = 0; count > 0 && i < children.size(); i++) {
    const auto childTag = children[i]->getTag();
    if (childrenCount.contains(childTag)) {
      count--;
      if (!newChildren) {
        newChildren =
            std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>(
                children);
      }
      (*newChildren)[i] =
          cloneMultipleRecursive(*children[i], childrenCount, callback);
    }
  }

  return callback(shadowNode, {.children = newChildren});
}

} // namespace

std::shared_ptr<ShadowNode> ShadowNode::cloneMultiple(
    const std::unordered_set<std::shared_ptr<const ShadowNodeFamily>>&
        familiesToUpdate,
    const std::function<std::shared_ptr<ShadowNode>(
        const ShadowNode& oldShadowNode,
        const ShadowNodeFragment& fragment)>& callback) const {
  std::unordered_map<Tag, int> childrenCount;

  for (const auto& family : familiesToUpdate) {
    if (childrenCount.contains(family->getTag())) {
      continue;
    }

    childrenCount[family->getTag()] = 0;

    auto ancestor = family->parent_.lock();
    while ((ancestor != nullptr) && ancestor != family_) {
      auto ancestorTag = ancestor->getTag();
      auto ancestorIt = childrenCount.find(ancestorTag);
      if (ancestorIt != childrenCount.end()) {
        ancestorIt->second++;
        break;
      }
      childrenCount[ancestorTag] = 1;

      ancestor = ancestor->parent_.lock();
    }

    if (ancestor == family_) {
      childrenCount[ancestor->getTag()]++;
    }
  }

  if (!childrenCount.contains(getTag())) {
    return nullptr;
  }

  return cloneMultipleRecursive(*this, childrenCount, callback);
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
std::string ShadowNode::getDebugName() const {
  return getComponentName();
}

std::string ShadowNode::getDebugValue() const {
  return "r" + std::to_string(revision_) + "/sr" +
      std::to_string(state_ ? state_->getRevision() : 0) +
      (getSealed() ? "/sealed" : "") +
      (getProps()->nativeId.empty() ? "" : "/id=" + getProps()->nativeId);
}

SharedDebugStringConvertibleList ShadowNode::getDebugChildren() const {
  auto debugChildren = SharedDebugStringConvertibleList{};

  for (const auto& child : *children_) {
    auto debugChild =
        std::dynamic_pointer_cast<const DebugStringConvertible>(child);
    if (debugChild) {
      debugChildren.push_back(debugChild);
    }
  }

  return debugChildren;
}

SharedDebugStringConvertibleList ShadowNode::getDebugProps() const {
  return props_->getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem("tag", std::to_string(getTag()))};
}
#endif

// Explicitly define destructors here, as they have to exist in order to act as
// a "key function" for the ShadowNodeWrapper class -- this allows for RTTI to
// work properly across dynamic library boundaries (i.e. dynamic_cast that is
// used by getNativeState method)
ShadowNodeWrapper::~ShadowNodeWrapper() = default;

} // namespace facebook::react
