/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricMountingManager.h"

#include "EventEmitterWrapper.h"
#include "MountItem.h"
#include "StateWrapperImpl.h"

#include <cxxreact/TraceSection.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/components/scrollview/ScrollViewProps.h>
#include <react/renderer/core/DynamicPropsUtilities.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/mounting/MountingTransaction.h>
#include <react/renderer/mounting/ShadowView.h>
#include <react/renderer/mounting/ShadowViewMutation.h>

#include <fbjni/fbjni.h>
#include <glog/logging.h>

#include <algorithm>
#include <cfenv>
#include <cmath>
#include <vector>

namespace facebook::react {

FabricMountingManager::FabricMountingManager(
    jni::global_ref<JFabricUIManager::javaobject>& javaUIManager)
    : javaUIManager_(javaUIManager) {}

FabricMountingManager::~FabricMountingManager() {
  // Manually reset `javaUIManager_` since FabricMountingManager may be retained
  // from a GC thread (destroyUnmountedShadowNode)
  jni::ThreadScope::WithClassLoader([&]() { javaUIManager_.reset(); });
}

void FabricMountingManager::onSurfaceStart(SurfaceId surfaceId) {
  std::lock_guard lock(allocatedViewsMutex_);
  allocatedViewRegistry_.emplace(
      surfaceId, std::unordered_set<Tag>({surfaceId}));
}

void FabricMountingManager::onSurfaceStop(SurfaceId surfaceId) {
  std::lock_guard lock(allocatedViewsMutex_);
  allocatedViewRegistry_.erase(surfaceId);
}

bool FabricMountingManager::isViewAllocated(SurfaceId surfaceId, Tag tag) {
  std::lock_guard lock(allocatedViewsMutex_);
  auto it = allocatedViewRegistry_.find(surfaceId);
  if (it == allocatedViewRegistry_.end()) {
    return false;
  }
  return it->second.count(tag) > 0;
}

namespace {

#ifdef REACT_NATIVE_DEBUG
// List of layout-only props extracted from ViewProps.kt used to filter out
// component props from Props 1.5 to validate the Props 2.0 output
inline bool isLayoutOnlyProp(const std::string& propName) {
  static const std::vector<std::string> layoutOnlyProps = {
      // Flexbox Alignment
      "alignItems",
      "alignSelf",
      "alignContent",

      // Flexbox Properties
      "flex",
      "flexBasis",
      "flexDirection",
      "flexGrow",
      "flexShrink",
      "flexWrap",
      "justifyContent",

      // Gaps
      "rowGap",
      "columnGap",
      "gap",

      // Display & Position
      "display",
      "position",

      // Positioning
      "right",
      "top",
      "bottom",
      "left",
      "start",
      "end",

      // Dimensions
      "width",
      "height",
      "minWidth",
      "maxWidth",
      "minHeight",
      "maxHeight",

      // Margins
      "margin",
      "marginVertical",
      "marginHorizontal",
      "marginLeft",
      "marginRight",
      "marginTop",
      "marginBottom",
      "marginStart",
      "marginEnd",

      // Paddings
      "padding",
      "paddingVertical",
      "paddingHorizontal",
      "paddingLeft",
      "paddingRight",
      "paddingTop",
      "paddingBottom",
      "paddingStart",
      "paddingEnd",

      // Other
      "collapsable",
  };
  return std::find(layoutOnlyProps.begin(), layoutOnlyProps.end(), propName) !=
      layoutOnlyProps.end();
}
#endif

inline int getIntBufferSizeForType(CppMountItem::Type mountItemType) {
  switch (mountItemType) {
    case CppMountItem::Type::Create:
      return 2; // tag, isLayoutable
    case CppMountItem::Type::Insert:
    case CppMountItem::Type::Remove:
      return 3; // tag, parentTag, index
    case CppMountItem::Type::Delete:
    case CppMountItem::Type::UpdateProps:
    case CppMountItem::Type::UpdateState:
    case CppMountItem::Type::UpdateEventEmitter:
      return 1; // tag
    case CppMountItem::Type::UpdatePadding:
      return 5; // tag, top, left, bottom, right
    case CppMountItem::Type::UpdateLayout:
      return 8; // tag, parentTag, x, y, w, h, DisplayType, LayoutDirection
    case CppMountItem::Type::UpdateOverflowInset:
      return 5; // tag, left, top, right, bottom
    case CppMountItem::Undefined:
    case CppMountItem::Multiple:
      return -1;
  }
}

inline int getObjectBufferSizeForType(CppMountItem::Type mountItemType) {
  switch (mountItemType) {
    case CppMountItem::Type::Create:
      return 4; // component name, props, state, event emitter
    case CppMountItem::Type::UpdateProps:
      return 1; // props object
    case CppMountItem::Type::UpdateState:
      return 1; // state object
    case CppMountItem::Type::UpdateEventEmitter:
      return 1; // event emitter object
    case CppMountItem::Type::UpdatePadding:
    case CppMountItem::Type::UpdateLayout:
    case CppMountItem::Type::UpdateOverflowInset:
    case CppMountItem::Type::Insert:
    case CppMountItem::Type::Remove:
    case CppMountItem::Type::Delete:
      return 0;
    case CppMountItem::Undefined:
    case CppMountItem::Multiple:
      return -1;
  }
}

inline void updateBufferSizes(
    CppMountItem::Type mountItemType,
    size_t numInstructions,
    int& batchMountItemIntsSize,
    int& batchMountItemObjectsSize) {
  if (numInstructions == 0) {
    return;
  }

  batchMountItemIntsSize +=
      numInstructions == 1 ? 1 : 2; // instructionType[, numInstructions]
  batchMountItemIntsSize +=
      numInstructions * getIntBufferSizeForType(mountItemType);
  batchMountItemObjectsSize +=
      numInstructions * getObjectBufferSizeForType(mountItemType);
}

inline std::pair<int, int> computeBufferSizes(
    std::vector<CppMountItem>& cppCommonMountItems,
    std::vector<CppMountItem>& cppDeleteMountItems,
    std::vector<CppMountItem>& cppUpdatePropsMountItems,
    std::vector<CppMountItem>& cppUpdateStateMountItems,
    std::vector<CppMountItem>& cppUpdatePaddingMountItems,
    std::vector<CppMountItem>& cppUpdateLayoutMountItems,
    std::vector<CppMountItem>& cppUpdateOverflowInsetMountItems,
    std::vector<CppMountItem>& cppUpdateEventEmitterMountItems) {
  int batchMountItemIntsSize = 0;
  int batchMountItemObjectsSize = 0;

  CppMountItem::Type lastType = CppMountItem::Type::Undefined;
  int numSameType = 0;
  for (const auto& mountItem : cppCommonMountItems) {
    const auto& mountItemType = mountItem.type;

    if (lastType == mountItemType) {
      numSameType++;
      if (numSameType == 2) {
        batchMountItemIntsSize += 1; // numInstructions
      }
    } else {
      numSameType = 1;
      lastType = mountItemType;
      batchMountItemIntsSize += 1; // instructionType
    }

    batchMountItemIntsSize += getIntBufferSizeForType(mountItemType);
    batchMountItemObjectsSize += getObjectBufferSizeForType(mountItemType);
  }

  updateBufferSizes(
      CppMountItem::Type::UpdateProps,
      cppUpdatePropsMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::UpdateState,
      cppUpdateStateMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::UpdatePadding,
      cppUpdatePaddingMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::UpdateLayout,
      cppUpdateLayoutMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::UpdateOverflowInset,
      cppUpdateOverflowInsetMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::UpdateEventEmitter,
      cppUpdateEventEmitterMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);
  updateBufferSizes(
      CppMountItem::Type::Delete,
      cppDeleteMountItems.size(),
      batchMountItemIntsSize,
      batchMountItemObjectsSize);

  return std::make_pair(batchMountItemIntsSize, batchMountItemObjectsSize);
}

// TODO: this method will be removed when binding for components are code-gen
jni::local_ref<jstring> getPlatformComponentName(const ShadowView& shadowView) {
  constexpr static std::string_view scrollViewComponentName = "ScrollView";

  if (scrollViewComponentName == shadowView.componentName) {
    const auto& newViewProps =
        static_cast<const ScrollViewProps&>(*shadowView.props);
    if (newViewProps.getProbablyMoreHorizontalThanVertical_DEPRECATED()) {
      return jni::make_jstring("AndroidHorizontalScrollView");
    }
  }
  return jni::make_jstring(shadowView.componentName);
}

inline float scale(Float value, Float pointScaleFactor) {
  std::feclearexcept(FE_ALL_EXCEPT);
  float result = value * pointScaleFactor;
  if (std::fetestexcept(FE_OVERFLOW) != 0) {
    LOG(ERROR) << "Binding::scale - FE_OVERFLOW - value: " << value
               << " pointScaleFactor: " << pointScaleFactor
               << " result: " << result;
  }
  if (std::fetestexcept(FE_UNDERFLOW) != 0) {
    LOG(ERROR) << "Binding::scale - FE_UNDERFLOW - value: " << value
               << " pointScaleFactor: " << pointScaleFactor
               << " result: " << result;
  }
  return result;
}

jni::local_ref<jobject> getProps(
    const ShadowView& oldShadowView,
    const ShadowView& newShadowView) {
  // We calculate the diffing between the props of the last mounted ShadowTree
  // and the Props of the latest commited ShadowTree). ONLY for <View>
  // components when the "enablePropsUpdateReconciliationAndroid" feature flag
  // is enabled.
  auto* oldProps = oldShadowView.props.get();
  auto* newProps = newShadowView.props.get();
  if ((ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid()) &&
      strcmp(
          newShadowView.componentName,
          newProps->getDiffPropsImplementationTarget()) == 0) {
    auto diff = newProps->getDiffProps(oldProps);

#ifdef REACT_NATIVE_DEBUG
    if (oldProps != nullptr) {
      auto controlDiff =
          diffDynamicProps(oldProps->rawProps, newProps->rawProps);

      for (const auto& [prop, value] : controlDiff.items()) {
        if (diff.count(prop) == 0) {
          // Skip layout-only props since they are not included in Props 2.0
          if (!isLayoutOnlyProp(prop.asString())) {
            LOG(ERROR) << "Props diff validation failed: Props 1.5 has prop '"
                       << prop.asString()
                       << "' = " << (value != nullptr ? value : "NULL")
                       << " that Props 2.0 doesn't have for component "
                       << newShadowView.componentName;
          }
        }
      }
    }
#endif

    return ReadableNativeMap::newObjectCxxArgs(std::move(diff));
  }
  if (ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid()) {
    if (oldProps == nullptr) {
      return ReadableNativeMap::newObjectCxxArgs(newProps->rawProps);
    } else {
      return ReadableNativeMap::newObjectCxxArgs(
          diffDynamicProps(oldProps->rawProps, newProps->rawProps));
    }
  }
  return ReadableNativeMap::newObjectCxxArgs(newProps->rawProps);
}

struct InstructionBuffer {
  JNIEnv* env;
  jintArray ints;
  jni::local_ref<jni::JArrayClass<jobject>> objects;

  int intsPosition = 0;
  int objectsPosition = 0;

  inline void writeInt(int value) {
    env->SetIntArrayRegion(ints, intsPosition, 1, &value);
    intsPosition += 1;
  }

  template <size_t N>
  inline void writeIntArray(const std::array<int, N>& buffer) {
    env->SetIntArrayRegion(ints, intsPosition, N, buffer.data());
    intsPosition += N;
  }

  inline void writeObject(jobject obj) {
    objects->setElement(objectsPosition, obj);
    objectsPosition += 1;
  }

  template <size_t N>
  inline void writeObjectsArray(const std::array<jobject, N>& buffer) {
    for (size_t i = 0; i < N; i++) {
      objects->setElement(objectsPosition + i, buffer[i]);
    }
    objectsPosition += N;
  }
};

inline void writeMountItemPreamble(
    InstructionBuffer& buffer,
    int mountItemType,
    size_t numItems) {
  if (numItems == 1) {
    buffer.writeInt(mountItemType);
  } else {
    buffer.writeIntArray(
        std::array<int, 2>{
            mountItemType | CppMountItem::Type::Multiple,
            static_cast<int>(numItems)});
  }
}

inline void writeCreateMountItem(
    InstructionBuffer& buffer,
    const CppMountItem& mountItem) {
  int isLayoutable =
      mountItem.newChildShadowView.layoutMetrics != EmptyLayoutMetrics ? 1 : 0;
  buffer.writeIntArray(
      std::array<int, 2>{mountItem.newChildShadowView.tag, isLayoutable});

  auto componentName = getPlatformComponentName(mountItem.newChildShadowView);

  jni::local_ref<jobject> props =
      getProps(mountItem.oldChildShadowView, mountItem.newChildShadowView);

  // Do not hold onto Java object from C
  // We DO want to hold onto C object from Java, since we don't know the
  // lifetime of the Java object
  jni::local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
  if (mountItem.newChildShadowView.state != nullptr) {
    javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
    StateWrapperImpl* cStateWrapper = cthis(javaStateWrapper);
    cStateWrapper->setState(mountItem.newChildShadowView.state);
  }

  // Do not hold a reference to javaEventEmitter from the C++ side.
  auto javaEventEmitter = EventEmitterWrapper::newObjectCxxArgs(
      mountItem.newChildShadowView.eventEmitter);

  buffer.writeObjectsArray(
      std::array<jobject, 4>{
          componentName.get(),
          props.get(),
          javaStateWrapper != nullptr ? javaStateWrapper.get() : nullptr,
          javaEventEmitter.get()});
}

inline void writeDeleteMountItem(
    InstructionBuffer& buffer,
    const CppMountItem& mountItem) {
  buffer.writeInt(mountItem.oldChildShadowView.tag);
}

inline void writeInsertMountItem(
    InstructionBuffer& buffer,
    const CppMountItem& mountItem) {
  buffer.writeIntArray(
      std::array<int, 3>{
          mountItem.newChildShadowView.tag,
          mountItem.parentTag,
          mountItem.index});
}

inline void writeRemoveMountItem(
    InstructionBuffer& buffer,
    const CppMountItem& mountItem) {
  buffer.writeIntArray(
      std::array<int, 3>{
          mountItem.oldChildShadowView.tag,
          mountItem.parentTag,
          mountItem.index});
}

inline void writeUpdatePropsMountItem(
    InstructionBuffer& buffer,
    const CppMountItem& mountItem) {
  buffer.writeInt(mountItem.newChildShadowView.tag);
  buffer.writeObject(
      getProps(mountItem.oldChildShadowView, mountItem.newChildShadowView)
          .get());
}

inline void writeUpdateStateMountItem(
    InstructionBuffer& buffer,
    const CppMountItem& mountItem) {
  buffer.writeInt(mountItem.newChildShadowView.tag);

  auto state = mountItem.newChildShadowView.state;
  // Do not hold onto Java object from C
  // We DO want to hold onto C object from Java, since we don't know the
  // lifetime of the Java object
  jni::local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;
  if (state != nullptr) {
    javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
    StateWrapperImpl* cStateWrapper = cthis(javaStateWrapper);
    cStateWrapper->setState(state);
  }

  buffer.writeObject(
      javaStateWrapper != nullptr ? javaStateWrapper.get() : nullptr);
}

inline void writeUpdateLayoutMountItem(
    InstructionBuffer& buffer,
    const CppMountItem& mountItem) {
  const auto& layoutMetrics = mountItem.newChildShadowView.layoutMetrics;
  auto pointScaleFactor = layoutMetrics.pointScaleFactor;
  auto frame = layoutMetrics.frame;

  int x = round(scale(frame.origin.x, pointScaleFactor));
  int y = round(scale(frame.origin.y, pointScaleFactor));
  int w = round(scale(frame.size.width, pointScaleFactor));
  int h = round(scale(frame.size.height, pointScaleFactor));

  buffer.writeIntArray(
      std::array<int, 8>{
          mountItem.newChildShadowView.tag,
          mountItem.parentTag,
          x,
          y,
          w,
          h,
          toInt(layoutMetrics.displayType),
          toInt(layoutMetrics.layoutDirection)});
}

inline void writeUpdateEventEmitterMountItem(
    InstructionBuffer& buffer,
    const CppMountItem& mountItem) {
  buffer.writeInt(mountItem.newChildShadowView.tag);

  // Do not hold a reference to javaEventEmitter from the C++ side.
  auto javaEventEmitter = EventEmitterWrapper::newObjectCxxArgs(
      mountItem.newChildShadowView.eventEmitter);
  buffer.writeObject(javaEventEmitter.get());
}

inline void writeUpdatePaddingMountItem(
    InstructionBuffer& buffer,
    const CppMountItem& mountItem) {
  auto layoutMetrics = mountItem.newChildShadowView.layoutMetrics;
  auto pointScaleFactor = layoutMetrics.pointScaleFactor;
  auto contentInsets = layoutMetrics.contentInsets;

  int insetLeft = floor(scale(contentInsets.left, pointScaleFactor));
  int insetTop = floor(scale(contentInsets.top, pointScaleFactor));
  int insetRight = floor(scale(contentInsets.right, pointScaleFactor));
  int insetBottom = floor(scale(contentInsets.bottom, pointScaleFactor));

  buffer.writeIntArray(
      std::array<int, 5>{
          mountItem.newChildShadowView.tag,
          insetLeft,
          insetTop,
          insetRight,
          insetBottom});
}

inline void writeUpdateOverflowInsetMountItem(
    InstructionBuffer& buffer,
    const CppMountItem& mountItem) {
  auto layoutMetrics = mountItem.newChildShadowView.layoutMetrics;
  auto pointScaleFactor = layoutMetrics.pointScaleFactor;
  auto overflowInset = layoutMetrics.overflowInset;

  int overflowInsetLeft = round(scale(overflowInset.left, pointScaleFactor));
  int overflowInsetTop = round(scale(overflowInset.top, pointScaleFactor));
  int overflowInsetRight = round(scale(overflowInset.right, pointScaleFactor));
  int overflowInsetBottom =
      round(scale(overflowInset.bottom, pointScaleFactor));

  buffer.writeIntArray(
      std::array<int, 5>{
          mountItem.newChildShadowView.tag,
          overflowInsetLeft,
          overflowInsetTop,
          overflowInsetRight,
          overflowInsetBottom});
}

} // namespace

void FabricMountingManager::executeMount(
    const MountingTransaction& transaction) {
  TraceSection section("FabricMountingManager::executeMount");

  std::scoped_lock lock(commitMutex_);
  auto finishTransactionStartTime = telemetryTimePointNow();

  auto env = jni::Environment::current();

  const auto& telemetry = transaction.getTelemetry();
  auto surfaceId = transaction.getSurfaceId();
  auto& mutations = transaction.getMutations();

  bool maintainMutationOrder =
      ReactNativeFeatureFlags::disableMountItemReorderingAndroid();

  auto revisionNumber = telemetry.getRevisionNumber();

  std::vector<CppMountItem> cppCommonMountItems;
  std::vector<CppMountItem> cppDeleteMountItems;
  std::vector<CppMountItem> cppUpdatePropsMountItems;
  std::vector<CppMountItem> cppUpdateStateMountItems;
  std::vector<CppMountItem> cppUpdatePaddingMountItems;
  std::vector<CppMountItem> cppUpdateLayoutMountItems;
  std::vector<CppMountItem> cppUpdateOverflowInsetMountItems;
  std::vector<CppMountItem> cppUpdateEventEmitterMountItems;

  {
    std::lock_guard allocatedViewsLock(allocatedViewsMutex_);

    auto allocatedViewsIterator = allocatedViewRegistry_.find(surfaceId);
    auto defaultAllocatedViews = std::unordered_set<Tag>{};
    // Do not remove `defaultAllocatedViews` or initialize
    // `std::unordered_set<Tag>{}` inline in below ternary expression - if falsy
    // operand is a value type, the compiler will decide the expression to be a
    // value type, an unnecessary (sometimes expensive) copy will happen as a
    // result.
    auto& allocatedViewTags =
        allocatedViewsIterator != allocatedViewRegistry_.end()
        ? allocatedViewsIterator->second
        : defaultAllocatedViews;
    if (allocatedViewsIterator == allocatedViewRegistry_.end()) {
      LOG(ERROR) << "Executing commit after surface " << surfaceId
                 << " was stopped!";
    }

    for (const auto& mutation : mutations) {
      auto parentTag = mutation.parentTag;
      const auto& oldChildShadowView = mutation.oldChildShadowView;
      const auto& newChildShadowView = mutation.newChildShadowView;
      auto& mutationType = mutation.type;
      auto& index = mutation.index;

      bool isVirtual = mutation.mutatedViewIsVirtual();
      switch (mutationType) {
        case ShadowViewMutation::Create: {
          bool shouldCreateView =
              !allocatedViewTags.contains(newChildShadowView.tag);

          if (shouldCreateView) {
            cppCommonMountItems.push_back(
                CppMountItem::CreateMountItem(newChildShadowView));
            allocatedViewTags.insert(newChildShadowView.tag);
          }
          break;
        }
        case ShadowViewMutation::Remove: {
          if (!isVirtual) {
            cppCommonMountItems.push_back(
                CppMountItem::RemoveMountItem(
                    parentTag, oldChildShadowView, index));
          }
          break;
        }
        case ShadowViewMutation::Delete: {
          (maintainMutationOrder ? cppCommonMountItems : cppDeleteMountItems)
              .push_back(CppMountItem::DeleteMountItem(oldChildShadowView));
          if (allocatedViewTags.erase(oldChildShadowView.tag) != 1) {
            LOG(ERROR) << "Emitting delete for unallocated view "
                       << oldChildShadowView.tag;
          }
          break;
        }
        case ShadowViewMutation::Update: {
          if (!isVirtual) {
            if (!allocatedViewTags.contains(newChildShadowView.tag)) {
              LOG(ERROR) << "Emitting update for unallocated view "
                         << newChildShadowView.tag;
            }

            if (oldChildShadowView.props != newChildShadowView.props) {
              (maintainMutationOrder ? cppCommonMountItems
                                     : cppUpdatePropsMountItems)
                  .push_back(
                      CppMountItem::UpdatePropsMountItem(
                          oldChildShadowView, newChildShadowView));
            }
            if (oldChildShadowView.state != newChildShadowView.state) {
              (maintainMutationOrder ? cppCommonMountItems
                                     : cppUpdateStateMountItems)
                  .push_back(
                      CppMountItem::UpdateStateMountItem(newChildShadowView));
            }

            // Padding: padding mountItems must be executed before layout props
            // are updated in the view. This is necessary to ensure that events
            // (resulting from layout changes) are dispatched with the correct
            // padding information.
            if (oldChildShadowView.layoutMetrics.contentInsets !=
                newChildShadowView.layoutMetrics.contentInsets) {
              (maintainMutationOrder ? cppCommonMountItems
                                     : cppUpdatePaddingMountItems)
                  .push_back(
                      CppMountItem::UpdatePaddingMountItem(newChildShadowView));
            }

            if (oldChildShadowView.layoutMetrics !=
                newChildShadowView.layoutMetrics) {
              (maintainMutationOrder ? cppCommonMountItems
                                     : cppUpdateLayoutMountItems)
                  .push_back(
                      CppMountItem::UpdateLayoutMountItem(
                          mutation.newChildShadowView, parentTag));
            }

            // OverflowInset: This is the values indicating boundaries including
            // children of the current view. The layout of current view may not
            // change, and we separate this part from layout mount items to not
            // pack too much data there.
            if ((oldChildShadowView.layoutMetrics.overflowInset !=
                 newChildShadowView.layoutMetrics.overflowInset)) {
              (maintainMutationOrder ? cppCommonMountItems
                                     : cppUpdateOverflowInsetMountItems)
                  .push_back(
                      CppMountItem::UpdateOverflowInsetMountItem(
                          newChildShadowView));
            }
          }

          if (oldChildShadowView.eventEmitter !=
              newChildShadowView.eventEmitter) {
            (maintainMutationOrder ? cppCommonMountItems
                                   : cppUpdatePropsMountItems)
                .push_back(
                    CppMountItem::UpdateEventEmitterMountItem(
                        mutation.newChildShadowView));
          }
          break;
        }
        case ShadowViewMutation::Insert: {
          if (!isVirtual) {
            // Insert item
            cppCommonMountItems.push_back(
                CppMountItem::InsertMountItem(
                    parentTag, newChildShadowView, index));

            bool shouldCreateView =
                !allocatedViewTags.contains(newChildShadowView.tag);
            if (ReactNativeFeatureFlags::
                    enableAccumulatedUpdatesInRawPropsAndroid()) {
              if (shouldCreateView) {
                LOG(ERROR) << "Emitting insert for unallocated view "
                           << newChildShadowView.tag;
              }
              (maintainMutationOrder ? cppCommonMountItems
                                     : cppUpdatePropsMountItems)
                  .push_back(
                      CppMountItem::UpdatePropsMountItem(
                          {}, newChildShadowView));
            } else {
              if (shouldCreateView) {
                LOG(ERROR) << "Emitting insert for unallocated view "
                           << newChildShadowView.tag;
                (maintainMutationOrder ? cppCommonMountItems
                                       : cppUpdatePropsMountItems)
                    .push_back(
                        CppMountItem::UpdatePropsMountItem(
                            {}, newChildShadowView));
              }
            }

            // State
            if (newChildShadowView.state) {
              (maintainMutationOrder ? cppCommonMountItems
                                     : cppUpdateStateMountItems)
                  .push_back(
                      CppMountItem::UpdateStateMountItem(newChildShadowView));
            }

            // Padding: padding mountItems must be executed before layout props
            // are updated in the view. This is necessary to ensure that events
            // (resulting from layout changes) are dispatched with the correct
            // padding information.
            if (newChildShadowView.layoutMetrics.contentInsets !=
                EdgeInsets::ZERO) {
              (maintainMutationOrder ? cppCommonMountItems
                                     : cppUpdatePaddingMountItems)
                  .push_back(
                      CppMountItem::UpdatePaddingMountItem(newChildShadowView));
            }

            // Layout
            (maintainMutationOrder ? cppCommonMountItems
                                   : cppUpdateLayoutMountItems)
                .push_back(
                    CppMountItem::UpdateLayoutMountItem(
                        newChildShadowView, parentTag));

            // OverflowInset: This is the values indicating boundaries including
            // children of the current view. The layout of current view may not
            // change, and we separate this part from layout mount items to not
            // pack too much data there.
            if (newChildShadowView.layoutMetrics.overflowInset !=
                EdgeInsets::ZERO) {
              (maintainMutationOrder ? cppCommonMountItems
                                     : cppUpdateOverflowInsetMountItems)
                  .push_back(
                      CppMountItem::UpdateOverflowInsetMountItem(
                          newChildShadowView));
            }
          }

          // EventEmitter
          // On insert we always update the event emitter, as we do not pass
          // it in when preallocating views
          (maintainMutationOrder ? cppCommonMountItems
                                 : cppUpdateEventEmitterMountItems)
              .push_back(
                  CppMountItem::UpdateEventEmitterMountItem(
                      mutation.newChildShadowView));

          break;
        }
        default: {
          break;
        }
      }
    }
  }

  // We now have all the information we need, including ordering of mount items,
  // to know exactly how much space must be allocated
  auto [batchMountItemIntsSize, batchMountItemObjectsSize] = computeBufferSizes(
      cppCommonMountItems,
      cppDeleteMountItems,
      cppUpdatePropsMountItems,
      cppUpdateStateMountItems,
      cppUpdatePaddingMountItems,
      cppUpdateLayoutMountItems,
      cppUpdateOverflowInsetMountItems,
      cppUpdateEventEmitterMountItems);

  static auto scheduleMountItem = JFabricUIManager::javaClassStatic()
                                      ->getMethod<void(
                                          JMountItem::javaobject,
                                          jint,
                                          jlong,
                                          jlong,
                                          jlong,
                                          jlong,
                                          jlong,
                                          jlong,
                                          jlong,
                                          jint)>("scheduleMountItem");

  if (batchMountItemIntsSize == 0) {
    auto finishTransactionEndTime = telemetryTimePointNow();
    scheduleMountItem(
        javaUIManager_,
        nullptr,
        telemetry.getRevisionNumber(),
        telemetryTimePointToMilliseconds(telemetry.getCommitStartTime()),
        telemetryTimePointToMilliseconds(telemetry.getDiffStartTime()),
        telemetryTimePointToMilliseconds(telemetry.getDiffEndTime()),
        telemetryTimePointToMilliseconds(telemetry.getLayoutStartTime()),
        telemetryTimePointToMilliseconds(telemetry.getLayoutEndTime()),
        telemetryTimePointToMilliseconds(finishTransactionStartTime),
        telemetryTimePointToMilliseconds(finishTransactionEndTime),
        telemetry.getAffectedLayoutNodesCount());
    return;
  }

  // Allocate the intBuffer and object array, now that we know exact sizes
  // necessary
  InstructionBuffer buffer = {
      .env = env,
      .ints = env->NewIntArray(batchMountItemIntsSize),
      .objects = jni::JArrayClass<jobject>::newArray(batchMountItemObjectsSize),
  };

  // Fill in arrays
  int prevMountItemType = -1;

  // Fill in CREATE instructions.
  for (int i = 0; i < cppCommonMountItems.size(); i++) {
    const auto& mountItem = cppCommonMountItems[i];
    const auto& mountItemType = mountItem.type;

    // Get type here, and count forward how many items of this type are in a
    // row. Write preamble to any common type here.
    if (prevMountItemType != mountItemType) {
      int numSameItemTypes = 1;
      for (int j = i + 1; j < cppCommonMountItems.size() &&
           cppCommonMountItems[j].type == mountItemType;
           j++) {
        numSameItemTypes++;
      }

      writeMountItemPreamble(buffer, mountItemType, numSameItemTypes);
      prevMountItemType = mountItemType;
    }

    switch (mountItemType) {
      case CppMountItem::Type::Create:
        writeCreateMountItem(buffer, mountItem);
        break;
      case CppMountItem::Type::Delete:
        writeDeleteMountItem(buffer, mountItem);
        break;
      case CppMountItem::Type::Insert:
        writeInsertMountItem(buffer, mountItem);
        break;
      case CppMountItem::Type::Remove:
        writeRemoveMountItem(buffer, mountItem);
        break;
      case CppMountItem::Type::UpdateProps:
        writeUpdatePropsMountItem(buffer, mountItem);
        break;
      case CppMountItem::Type::UpdateState:
        writeUpdateStateMountItem(buffer, mountItem);
        break;
      case CppMountItem::Type::UpdateLayout:
        writeUpdateLayoutMountItem(buffer, mountItem);
        break;
      case CppMountItem::Type::UpdateEventEmitter:
        writeUpdateEventEmitterMountItem(buffer, mountItem);
        break;
      case CppMountItem::Type::UpdatePadding:
        writeUpdatePaddingMountItem(buffer, mountItem);
        break;
      case CppMountItem::Type::UpdateOverflowInset:
        writeUpdateOverflowInsetMountItem(buffer, mountItem);
        break;
      default:
        LOG(FATAL) << "Unexpected CppMountItem type: " << mountItemType;
    }
  }

  if (!cppUpdatePropsMountItems.empty()) {
    writeMountItemPreamble(
        buffer,
        CppMountItem::Type::UpdateProps,
        cppUpdatePropsMountItems.size());
    for (const auto& mountItem : cppUpdatePropsMountItems) {
      writeUpdatePropsMountItem(buffer, mountItem);
    }
  }
  if (!cppUpdateStateMountItems.empty()) {
    writeMountItemPreamble(
        buffer,
        CppMountItem::Type::UpdateState,
        cppUpdateStateMountItems.size());
    for (const auto& mountItem : cppUpdateStateMountItems) {
      writeUpdateStateMountItem(buffer, mountItem);
    }
  }
  if (!cppUpdatePaddingMountItems.empty()) {
    writeMountItemPreamble(
        buffer,
        CppMountItem::Type::UpdatePadding,
        cppUpdatePaddingMountItems.size());
    for (const auto& mountItem : cppUpdatePaddingMountItems) {
      writeUpdatePaddingMountItem(buffer, mountItem);
    }
  }
  if (!cppUpdateLayoutMountItems.empty()) {
    writeMountItemPreamble(
        buffer,
        CppMountItem::Type::UpdateLayout,
        cppUpdateLayoutMountItems.size());
    for (const auto& mountItem : cppUpdateLayoutMountItems) {
      writeUpdateLayoutMountItem(buffer, mountItem);
    }
  }
  if (!cppUpdateOverflowInsetMountItems.empty()) {
    writeMountItemPreamble(
        buffer,
        CppMountItem::Type::UpdateOverflowInset,
        cppUpdateOverflowInsetMountItems.size());
    for (const auto& mountItem : cppUpdateOverflowInsetMountItems) {
      writeUpdateOverflowInsetMountItem(buffer, mountItem);
    }
  }
  if (!cppUpdateEventEmitterMountItems.empty()) {
    writeMountItemPreamble(
        buffer,
        CppMountItem::Type::UpdateEventEmitter,
        cppUpdateEventEmitterMountItems.size());
    for (const auto& mountItem : cppUpdateEventEmitterMountItems) {
      writeUpdateEventEmitterMountItem(buffer, mountItem);
    }
  }

  // Write deletes last - so that all prop updates, etc, for the tag in the same
  // batch don't fail. Without additional machinery, moving deletes here
  // requires that the differ never produces "DELETE...CREATE" in that order for
  // the same tag. It's nice to be able to batch all similar operations together
  // for space efficiency.
  // FIXME: this optimization is incorrect when multiple transactions are
  // merged together
  if (!cppDeleteMountItems.empty()) {
    writeMountItemPreamble(
        buffer, CppMountItem::Type::Delete, cppDeleteMountItems.size());
    for (const auto& mountItem : cppDeleteMountItems) {
      writeDeleteMountItem(buffer, mountItem);
    }
  }

  static auto createMountItemsIntBufferBatchContainer =
      JFabricUIManager::javaClassStatic()
          ->getMethod<jni::alias_ref<JMountItem>(
              jint, jintArray, jni::jtypeArray<jobject>, jint)>(
              "createIntBufferBatchMountItem");
  auto batch = createMountItemsIntBufferBatchContainer(
      javaUIManager_,
      surfaceId,
      // If there are no items, we pass a nullptr instead of passing the
      // object through the JNI
      batchMountItemIntsSize > 0 ? buffer.ints : nullptr,
      batchMountItemObjectsSize > 0 ? buffer.objects.get() : nullptr,
      revisionNumber);

  auto finishTransactionEndTime = telemetryTimePointNow();

  scheduleMountItem(
      javaUIManager_,
      batch.get(),
      telemetry.getRevisionNumber(),
      telemetryTimePointToMilliseconds(telemetry.getCommitStartTime()),
      telemetryTimePointToMilliseconds(telemetry.getDiffStartTime()),
      telemetryTimePointToMilliseconds(telemetry.getDiffEndTime()),
      telemetryTimePointToMilliseconds(telemetry.getLayoutStartTime()),
      telemetryTimePointToMilliseconds(telemetry.getLayoutEndTime()),
      telemetryTimePointToMilliseconds(finishTransactionStartTime),
      telemetryTimePointToMilliseconds(finishTransactionEndTime),
      telemetry.getAffectedLayoutNodesCount());

  env->DeleteLocalRef(buffer.ints);
}

void FabricMountingManager::drainPreallocateViewsQueue() {
  std::vector<ShadowView> shadowViews;

  {
    std::lock_guard lock(preallocateMutex_);
    std::swap(shadowViews, preallocatedViewsQueue_);
  }

  for (const auto& shadowView : shadowViews) {
    preallocateShadowView(shadowView);
  }
}

void FabricMountingManager::destroyUnmountedShadowNode(
    const ShadowNodeFamily& family) {
  auto tag = family.getTag();
  auto surfaceId = family.getSurfaceId();

  // Remove from allocatedViewRegistry so that executeMount does not skip
  // the Create mount item for this tag. Without this, if the view was
  // preallocated and then destroyed (e.g. due to a superseded concurrent
  // render), executeMount would skip the Create because allocatedViewTags
  // still contains the tag, but the Java side no longer has the view in
  // tagToViewState (it was deleted by destroyUnmountedView below).
  {
    std::lock_guard allocatedViewsLock(allocatedViewsMutex_);
    auto allocatedViewsIterator = allocatedViewRegistry_.find(surfaceId);
    if (allocatedViewsIterator != allocatedViewRegistry_.end()) {
      allocatedViewsIterator->second.erase(tag);
    }
  }

  // ThreadScope::WithClassLoader is necessary because
  // destroyUnmountedShadowNode is being called from a destructor thread
  jni::ThreadScope::WithClassLoader([&]() {
    static auto destroyUnmountedView =
        JFabricUIManager::javaClassStatic()->getMethod<void(jint, jint)>(
            "destroyUnmountedView");
    destroyUnmountedView(javaUIManager_, surfaceId, tag);
  });
}

void FabricMountingManager::maybePreallocateShadowNode(
    const ShadowNode& shadowNode) {
  if (!shadowNode.getTraits().check(ShadowNodeTraits::Trait::FormsView)) {
    return;
  }

  static thread_local bool onMainThread = isOnMainThread();
  if (onMainThread) {
    // View preallocation is not beneficial when rendering on the main thread
    return;
  }

  auto shadowView = ShadowView(shadowNode);

  {
    std::lock_guard lock(preallocateMutex_);
    preallocatedViewsQueue_.push_back(std::move(shadowView));
  }
}

void FabricMountingManager::preallocateShadowView(
    const ShadowView& shadowView) {
  TraceSection section("FabricMountingManager::preallocateShadowView");

  {
    std::lock_guard lock(allocatedViewsMutex_);
    auto allocatedViewsIterator =
        allocatedViewRegistry_.find(shadowView.surfaceId);
    if (allocatedViewsIterator == allocatedViewRegistry_.end()) {
      return;
    }
    const auto [_, inserted] =
        allocatedViewsIterator->second.insert(shadowView.tag);
    if (!inserted) {
      return;
    }
  }

  bool isLayoutableShadowNode = shadowView.layoutMetrics != EmptyLayoutMetrics;

  static auto preallocateView =
      JFabricUIManager::javaClassStatic()
          ->getMethod<void(jint, jint, jstring, jobject, jobject, jboolean)>(
              "preallocateView");

  // Do not hold onto Java object from C
  // We DO want to hold onto C object from Java, since we don't know the
  // lifetime of the Java object
  jni::local_ref<StateWrapperImpl::JavaPart> javaStateWrapper = nullptr;

  // Paragraph only has a dummy state during view preallocation.
  // Updating state on Android side has a cost and doing it unnecessarily for
  // dummy state is wasteful.
  bool preventPassingStateWrapperForText =
      strcmp(shadowView.componentName, "Paragraph") == 0;
  if (shadowView.state != nullptr && !preventPassingStateWrapperForText) {
    javaStateWrapper = StateWrapperImpl::newObjectJavaArgs();
    StateWrapperImpl* cStateWrapper = cthis(javaStateWrapper);
    cStateWrapper->setState(shadowView.state);
  }

  jni::local_ref<jobject> props = getProps({}, shadowView);

  auto component = getPlatformComponentName(shadowView);

  preallocateView(
      javaUIManager_,
      shadowView.surfaceId,
      shadowView.tag,
      component.get(),
      props.get(),
      (javaStateWrapper != nullptr ? javaStateWrapper.get() : nullptr),
      static_cast<unsigned char>(isLayoutableShadowNode));
}

bool FabricMountingManager::isOnMainThread() {
  static auto isOnMainThread =
      JFabricUIManager::javaClassStatic()->getMethod<jboolean()>(
          "isOnMainThread");
  return isOnMainThread(javaUIManager_) != 0u;
}

void FabricMountingManager::dispatchCommand(
    const ShadowView& shadowView,
    const std::string& commandName,
    const folly::dynamic& args) {
  static auto dispatchCommand =
      JFabricUIManager::javaClassStatic()
          ->getMethod<void(jint, jint, jstring, ReadableArray::javaobject)>(
              "dispatchCommand");
  auto command = jni::make_jstring(commandName);
  auto argsArray = jni::adopt_local(
      reinterpret_cast<ReadableArray::javaobject>(
          ReadableNativeArray::newObjectCxxArgs(args).release()));
  dispatchCommand(
      javaUIManager_,
      shadowView.surfaceId,
      shadowView.tag,
      command.get(),
      argsArray.get());
}

void FabricMountingManager::sendAccessibilityEvent(
    const ShadowView& shadowView,
    const std::string& eventType) {
  static auto sendAccessibilityEventFromJS =
      JFabricUIManager::javaClassStatic()->getMethod<void(jint, jint, jstring)>(
          "sendAccessibilityEventFromJS");

  auto eventTypeStr = jni::make_jstring(eventType);
  sendAccessibilityEventFromJS(
      javaUIManager_, shadowView.surfaceId, shadowView.tag, eventTypeStr.get());
}

void FabricMountingManager::setIsJSResponder(
    const ShadowView& shadowView,
    bool isJSResponder,
    bool blockNativeResponder) {
  static auto setJSResponder =
      JFabricUIManager::javaClassStatic()
          ->getMethod<void(jint, jint, jint, jboolean)>("setJSResponder");

  static auto clearJSResponder =
      JFabricUIManager::javaClassStatic()->getMethod<void()>(
          "clearJSResponder");

  if (isJSResponder) {
    setJSResponder(
        javaUIManager_,
        shadowView.surfaceId,
        shadowView.tag,
        // The closest non-flattened ancestor of the same value if the node is
        // not flattened. For now, we don't support the case when the node can
        // be flattened because the only component that uses this feature -
        // ScrollView - cannot be flattened.
        shadowView.tag,
        (jboolean)blockNativeResponder);
  } else {
    clearJSResponder(javaUIManager_);
  }
}

void FabricMountingManager::onAnimationStarted() {
  static auto layoutAnimationsStartedJNI =
      JFabricUIManager::javaClassStatic()->getMethod<void()>(
          "onAnimationStarted");

  layoutAnimationsStartedJNI(javaUIManager_);
}

void FabricMountingManager::onAllAnimationsComplete() {
  static auto allAnimationsCompleteJNI =
      JFabricUIManager::javaClassStatic()->getMethod<void()>(
          "onAllAnimationsComplete");

  allAnimationsCompleteJNI(javaUIManager_);
}

void FabricMountingManager::synchronouslyUpdateViewOnUIThread(
    Tag viewTag,
    const folly::dynamic& props) {
  static auto synchronouslyUpdateViewOnUIThreadJNI =
      JFabricUIManager::javaClassStatic()
          ->getMethod<void(jint, ReadableMap::javaobject)>(
              "synchronouslyUpdateViewOnUIThread");
  auto propsMap = reinterpret_cast<ReadableMap::javaobject>(
      ReadableNativeMap::newObjectCxxArgs(props).release());
  synchronouslyUpdateViewOnUIThreadJNI(javaUIManager_, viewTag, propsMap);
}

void FabricMountingManager::captureViewSnapshot(Tag tag, SurfaceId surfaceId) {
  static auto captureViewSnapshotJNI =
      JFabricUIManager::javaClassStatic()->getMethod<void(jint, jint)>(
          "captureViewSnapshot");
  captureViewSnapshotJNI(javaUIManager_, tag, surfaceId);
}

void FabricMountingManager::setViewSnapshot(
    Tag sourceTag,
    Tag targetTag,
    SurfaceId surfaceId) {
  static auto setViewSnapshotJNI =
      JFabricUIManager::javaClassStatic()->getMethod<void(jint, jint, jint)>(
          "setViewSnapshot");
  setViewSnapshotJNI(javaUIManager_, sourceTag, targetTag, surfaceId);
}

void FabricMountingManager::clearPendingSnapshots() {
  static auto clearPendingSnapshotsJNI =
      JFabricUIManager::javaClassStatic()->getMethod<void()>(
          "clearPendingSnapshots");
  clearPendingSnapshotsJNI(javaUIManager_);
}

void FabricMountingManager::scheduleReactRevisionMerge(SurfaceId surfaceId) {
  static const auto scheduleReactRevisionMerge =
      JFabricUIManager::javaClassStatic()->getMethod<void(int32_t)>(
          "scheduleReactRevisionMerge");
  scheduleReactRevisionMerge(javaUIManager_, surfaceId);
}

} // namespace facebook::react
