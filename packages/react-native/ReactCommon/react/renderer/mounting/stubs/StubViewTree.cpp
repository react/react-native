/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StubViewTree.h"

#include <folly/json.h>
#include <glog/logging.h>
#include <react/debug/react_native_assert.h>
#include <sstream>

#ifdef STUB_VIEW_TREE_VERBOSE
#define STUB_VIEW_LOG(code) code
#else
#define STUB_VIEW_LOG(code)
#endif

namespace facebook::react {

namespace {
std::string getComponentName(const ShadowView& shadowView) {
  return std::string{"\""} + shadowView.componentName + "\"";
}
} // namespace

StubViewTree::StubViewTree(const ShadowView& shadowView)
    : rootTag_(shadowView.tag) {
  auto view = std::make_shared<StubView>();
  view->update(shadowView);

  registry_[shadowView.tag] = view;
}

const StubView& StubViewTree::getRootStubView() const {
  return *registry_.at(rootTag_);
}

const StubView& StubViewTree::getStubView(Tag tag) const {
  return *registry_.at(tag);
}

size_t StubViewTree::size() const {
  return registry_.size();
}

void StubViewTree::mutate(const ShadowViewMutationList& mutations) {
  STUB_VIEW_LOG({ LOG(ERROR) << "StubView: Mutating Begin"; });
  for (const auto& mutation : mutations) {
    switch (mutation.type) {
      case ShadowViewMutation::Create: {
        react_native_assert(mutation.parentTag == -1);
        react_native_assert(mutation.oldChildShadowView == ShadowView{});
        react_native_assert(mutation.newChildShadowView.props);
        auto stubView = std::make_shared<StubView>();
        stubView->update(mutation.newChildShadowView);
        auto tag = mutation.newChildShadowView.tag;
        STUB_VIEW_LOG({
          LOG(ERROR) << "StubView: Create [" << tag << "] ##"
                     << std::hash<ShadowView>{}((ShadowView)*stubView);
        });
        if (hasTag(tag)) {
          LOG(ERROR) << "StubView: Create [" << tag << "]: tag already exists"
                     << (tag == rootTag_ ? " (and it's the root tag)" : "")
                     << ". The current registry: ";
          dumpTags(LOG(ERROR));
        }
        react_native_assert(!hasTag(tag));
        registry_[tag] = stubView;

        recordMutation(mutation);

        break;
      }

      case ShadowViewMutation::Delete: {
        STUB_VIEW_LOG({
          LOG(ERROR) << "StubView: Delete [" << mutation.oldChildShadowView.tag
                     << "] ##"
                     << std::hash<ShadowView>{}(mutation.oldChildShadowView);
        });
        react_native_assert(mutation.parentTag == -1);
        react_native_assert(mutation.newChildShadowView == ShadowView{});
        auto tag = mutation.oldChildShadowView.tag;
        react_native_assert(hasTag(tag));
        auto stubView = registry_[tag];

        registry_.erase(tag);
        recordMutation(mutation);

        break;
      }

      case ShadowViewMutation::Insert: {
        if (!mutation.mutatedViewIsVirtual()) {
          react_native_assert(mutation.oldChildShadowView == ShadowView{});
          auto parentTag = mutation.parentTag;
          auto childTag = mutation.newChildShadowView.tag;
          if (!hasTag(parentTag)) {
            LOG(ERROR)
                << "StubView: ASSERT FAILURE: INSERT mutation assertion failure: parentTag not found: ["
                << parentTag << "] inserting child: [" << childTag << "]";
          }
          if (!hasTag(childTag)) {
            LOG(ERROR)
                << "StubView: ASSERT FAILURE: INSERT mutation assertion failure: childTag not found: ["
                << parentTag << "] inserting child: [" << childTag << "]";
          }
          react_native_assert(hasTag(parentTag));
          auto parentStubView = registry_[parentTag];
          react_native_assert(hasTag(childTag));
          auto childStubView = registry_[childTag];
          childStubView->update(mutation.newChildShadowView);
          STUB_VIEW_LOG({
            LOG(ERROR) << "StubView: Insert [" << childTag << "] into ["
                       << parentTag << "] @" << mutation.index << "("
                       << parentStubView->children.size() << " children)";
          });
          react_native_assert(childStubView->parentTag == NO_VIEW_TAG);
          react_native_assert(
              mutation.index >= 0 &&
              parentStubView->children.size() >=
                  static_cast<size_t>(mutation.index));
          childStubView->parentTag = parentTag;
          parentStubView->children.insert(
              parentStubView->children.begin() + mutation.index, childStubView);
        } else {
          auto childTag = mutation.newChildShadowView.tag;
          react_native_assert(hasTag(childTag));
          auto childStubView = registry_[childTag];
          childStubView->update(mutation.newChildShadowView);
        }

        recordMutation(mutation);

        break;
      }

      case ShadowViewMutation::Remove: {
        if (!mutation.mutatedViewIsVirtual()) {
          react_native_assert(mutation.newChildShadowView == ShadowView{});
          auto parentTag = mutation.parentTag;
          auto childTag = mutation.oldChildShadowView.tag;
          if (!hasTag(parentTag)) {
            LOG(ERROR)
                << "StubView: ASSERT FAILURE: REMOVE mutation assertion failure: parentTag not found: ["
                << parentTag << "] removing child: [" << childTag << "]";
          }
          react_native_assert(hasTag(parentTag));
          auto parentStubView = registry_[parentTag];
          STUB_VIEW_LOG({
            LOG(ERROR) << "StubView: Remove [" << childTag << "] from ["
                       << parentTag << "] @" << mutation.index << " with "
                       << parentStubView->children.size() << " children";
          });
          react_native_assert(
              mutation.index >= 0 &&
              parentStubView->children.size() >
                  static_cast<size_t>(mutation.index));
          react_native_assert(hasTag(childTag));
          auto childStubView = registry_[childTag];
          react_native_assert(childStubView->parentTag == parentTag);

          STUB_VIEW_LOG({
            std::string strChildList = "";
            int i = 0;
            for (const auto& child : parentStubView->children) {
              strChildList.append(std::to_string(i));
              strChildList.append(":");
              strChildList.append(std::to_string(child->tag));
              strChildList.append(", ");
              i++;
            }
            LOG(ERROR) << "StubView: BEFORE REMOVE: Children of " << parentTag
                       << ": " << strChildList;
          });
          react_native_assert(
              mutation.index >= 0 &&
              parentStubView->children.size() >
                  static_cast<size_t>(mutation.index) &&
              parentStubView->children[mutation.index]->tag ==
                  childStubView->tag);
          childStubView->parentTag = NO_VIEW_TAG;
          parentStubView->children.erase(
              parentStubView->children.begin() + mutation.index);
        }

        recordMutation(mutation);

        break;
      }

      case ShadowViewMutation::Update: {
        STUB_VIEW_LOG({
          LOG(ERROR) << "StubView: Update [" << mutation.newChildShadowView.tag
                     << "] old hash: ##"
                     << std::hash<ShadowView>{}(mutation.oldChildShadowView)
                     << " new hash: ##"
                     << std::hash<ShadowView>{}(mutation.newChildShadowView);
        });
        react_native_assert(mutation.oldChildShadowView.tag != 0);
        react_native_assert(mutation.newChildShadowView.tag != 0);
        react_native_assert(mutation.newChildShadowView.props);
        react_native_assert(
            mutation.newChildShadowView.tag == mutation.oldChildShadowView.tag);
        react_native_assert(hasTag(mutation.newChildShadowView.tag));
        auto oldStubView = registry_[mutation.newChildShadowView.tag];
        react_native_assert(oldStubView->tag != 0);
        if (mutation.parentTag != 0) {
          react_native_assert(hasTag(mutation.parentTag));
          react_native_assert(oldStubView->parentTag == mutation.parentTag);
        }

        oldStubView->update(mutation.newChildShadowView);

        // Hash for stub view and the ShadowView should be identical - this
        // tests that StubView and ShadowView hash are equivalent.
        react_native_assert(
            std::hash<ShadowView>{}((ShadowView)*oldStubView) ==
            std::hash<ShadowView>{}(mutation.newChildShadowView));

        recordMutation(mutation);

        break;
      }
    }
  }
  STUB_VIEW_LOG({ LOG(ERROR) << "StubView: Mutating End"; });

  // For iOS especially: flush logs because some might be lost on iOS if an
  // assert is hit right after this.
  google::FlushLogFiles(google::GLOG_INFO);
}

void StubViewTree::dispatchCommand(
    const ShadowView& shadowView,
    const std::string& commandName,
    const folly::dynamic& args) {
  auto stream = std::ostringstream();

  stream << "Command {type: " << getComponentName(shadowView)
         << ", nativeID: " << getNativeId(shadowView) << ", name: \""
         << commandName;

  if (!args.empty()) {
    stream << ", args: " << folly::toJson(args);
  }

  stream << "\"}";
  mountingLogs_.push_back(std::string(stream.str()));
}

std::vector<std::string> StubViewTree::takeMountingLogs() {
  auto logs = mountingLogs_;
  mountingLogs_.clear();
  return logs;
}

std::ostream& StubViewTree::dumpTags(std::ostream& stream) const {
  for (const auto& pair : registry_) {
    auto& stubView = *pair.second;
    stream << "[" << stubView.tag << "]##"
           << std::hash<ShadowView>{}((ShadowView)stubView) << " ";
  }
  return stream;
}

bool operator==(const StubViewTree& lhs, const StubViewTree& rhs) {
  if (lhs.registry_.size() != rhs.registry_.size()) {
    STUB_VIEW_LOG({
      LOG(ERROR) << "Registry sizes are different. Sizes: LHS: "
                 << lhs.registry_.size() << " RHS: " << rhs.registry_.size();

      LOG(ERROR) << "Tags in LHS: ";
      lhs.dumpTags(LOG(ERROR));

      LOG(ERROR) << "Tags in RHS: ";
      rhs.dumpTags(LOG(ERROR));
    });

    return false;
  }

  for (const auto& pair : lhs.registry_) {
    auto& lhsStubView = *lhs.registry_.at(pair.first);
    auto& rhsStubView = *rhs.registry_.at(pair.first);

    if (lhsStubView != rhsStubView) {
      STUB_VIEW_LOG({
        LOG(ERROR) << "Registry entries are different. LHS: ["
                   << lhsStubView.tag << "] ##"
                   << std::hash<ShadowView>{}((ShadowView)lhsStubView)
                   << " RHS: [" << rhsStubView.tag << "] ##"
                   << std::hash<ShadowView>{}((ShadowView)rhsStubView);
      });
      return false;
    }
  }

  return true;
}

void StubViewTree::recordMutation(const ShadowViewMutation& mutation) {
  switch (mutation.type) {
    case ShadowViewMutation::Create: {
      auto stream = std::ostringstream();

      stream << "Create {type: "
             << getComponentName(mutation.newChildShadowView)
             << ", nativeID: " << getNativeId(mutation.newChildShadowView)
             << "}";

      mountingLogs_.push_back(std::string(stream.str()));
      break;
    }
    case ShadowViewMutation::Delete: {
      auto stream = std::ostringstream();

      stream << "Delete {type: "
             << getComponentName(mutation.oldChildShadowView)
             << ", nativeID: " << getNativeId(mutation.oldChildShadowView)
             << "}";

      mountingLogs_.push_back(std::string(stream.str()));
      break;
    }
    case ShadowViewMutation::Insert: {
      auto stream = std::ostringstream();

      stream << "Insert {type: "
             << getComponentName(mutation.newChildShadowView)
             << ", parentNativeID: " << getNativeId(mutation.parentTag)
             << ", index: " << mutation.index
             << ", nativeID: " << getNativeId(mutation.newChildShadowView)
             << "}";

      mountingLogs_.push_back(std::string(stream.str()));
      break;
    }
    case ShadowViewMutation::Remove: {
      auto stream = std::ostringstream();

      stream << "Remove {type: "
             << getComponentName(mutation.oldChildShadowView)
             << ", parentNativeID: " << getNativeId(mutation.parentTag)
             << ", index: " << mutation.index
             << ", nativeID: " << getNativeId(mutation.oldChildShadowView)
             << "}";

      mountingLogs_.push_back(std::string(stream.str()));
      break;
    }
    case ShadowViewMutation::Update: {
      auto stream = std::ostringstream();

      stream << "Update {type: "
             << getComponentName(mutation.newChildShadowView)
             << ", nativeID: " << getNativeId(mutation.newChildShadowView)
             << "}";

      mountingLogs_.push_back(std::string(stream.str()));
      break;
    }
  }
}

std::string StubViewTree::getNativeId(Tag tag) {
  auto& view = getStubView(tag);
  return getNativeId(view);
}

std::string StubViewTree::getNativeId(const ShadowView& shadowView) {
  if (shadowView.traits.check(ShadowNodeTraits::Trait::RootNodeKind)) {
    return "(root)";
  }

  if (shadowView.props->nativeId.empty()) {
    return "(N/A)";
  }

  return "\"" + shadowView.props->nativeId + "\"";
}

} // namespace facebook::react
