/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <algorithm>
#include <memory>
#include <utility>

#include <gtest/gtest.h>

#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/MountingCoordinator.h>

namespace facebook::react {

class MountingCoordinatorTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_{simpleComponentBuilder()};
  RootShadowNode::Unshared withChild_;
  RootShadowNode::Unshared withoutChild_;

  void SetUp() override {
    auto props = std::make_shared<ViewProps>();
    props->collapsable = false;
    withChild_ = builder_.build(
        Element<RootShadowNode>().tag(1).surfaceId(1).children(
            {Element<ViewShadowNode>().tag(2).surfaceId(1).props(props)}));
    withChild_->layoutIfNeeded();
    withoutChild_ =
        std::static_pointer_cast<RootShadowNode>(withChild_->ShadowNode::clone(
            {.children = ShadowNode::emptySharedShadowNodeSharedList()}));
    withoutChild_->layoutIfNeeded();
  }

  static void push(
      const MountingCoordinator& coordinator,
      ShadowTreeRevision revision) {
    coordinator.push(std::move(revision));
  }

  static bool hasMutation(
      const MountingTransaction& transaction,
      ShadowViewMutation::Type type) {
    const auto& mutations = transaction.getMutations();
    return std::any_of(
        mutations.begin(), mutations.end(), [&](const auto& mutation) {
          return mutation.type == type &&
              (mutation.oldChildShadowView.tag == 2 ||
               mutation.newChildShadowView.tag == 2);
        });
  }
};

TEST_F(MountingCoordinatorTest, lateRevisionDoesNotRecreateRemovedView) {
  MountingCoordinator coordinator{{withChild_, 1, {}}};

  // Revision 3 removes the view while revision 2 is delayed between commit
  // and push. Pulling clears lastRevision_, but revision 3 remains the base.
  push(coordinator, {withoutChild_, 3, {}});
  auto removal = coordinator.pullTransaction();
  ASSERT_TRUE(removal.has_value());
  ASSERT_TRUE(hasMutation(*removal, ShadowViewMutation::Type::Delete));

  push(coordinator, {withChild_, 2, {}});
  EXPECT_FALSE(coordinator.pullTransaction().has_value());
  EXPECT_EQ(coordinator.getBaseRevision().number, 3);
  EXPECT_EQ(coordinator.getBaseRevision().rootShadowNode, withoutChild_);

  // A subsequent navigation may legitimately create the view again.
  push(coordinator, {withChild_, 4, {}});
  auto insertion = coordinator.pullTransaction();
  ASSERT_TRUE(insertion.has_value());
  EXPECT_TRUE(hasMutation(*insertion, ShadowViewMutation::Type::Create));
  EXPECT_EQ(coordinator.getBaseRevision().number, 4);
}

TEST_F(MountingCoordinatorTest, lateRevisionPreservesNewerPendingRevision) {
  MountingCoordinator coordinator{{withChild_, 1, {}}};
  push(coordinator, {withoutChild_, 3, {}});
  push(coordinator, {withChild_, 2, {}});

  auto removal = coordinator.pullTransaction();
  ASSERT_TRUE(removal.has_value());
  EXPECT_TRUE(hasMutation(*removal, ShadowViewMutation::Type::Delete));
  EXPECT_EQ(coordinator.getBaseRevision().number, 3);
  EXPECT_EQ(coordinator.getBaseRevision().rootShadowNode, withoutChild_);
  EXPECT_FALSE(coordinator.pullTransaction().has_value());
}

} // namespace facebook::react
