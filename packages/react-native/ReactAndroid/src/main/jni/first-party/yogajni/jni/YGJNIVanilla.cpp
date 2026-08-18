/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YGJNIVanilla.h"
#include <array>
#include <bit>
#include <cstring>
#include <iostream>
#include <memory>
#include "LayoutContext.h"
#include "YGJNI.h"
#include "YGJTypesVanilla.h"
#include "YogaJniException.h"
#include "common.h"
#include "jni.h"

using namespace facebook;
using namespace facebook::yoga;
using namespace facebook::yoga::vanillajni;

static inline ScopedLocalRef<jobject> YGNodeJobject(YGNodeConstRef node) {
  return LayoutContext::getNodeMap()->ref(node);
}

static inline YGNodeRef _jlong2YGNodeRef(jlong addr) {
  return reinterpret_cast<YGNodeRef>(static_cast<intptr_t>(addr));
}

static inline YGConfigRef _jlong2YGConfigRef(jlong addr) {
  return reinterpret_cast<YGConfigRef>(static_cast<intptr_t>(addr));
}

static jlong jni_YGConfigNewJNI(JNIEnv* /*env*/, jobject /*obj*/) {
  return reinterpret_cast<jlong>(YGConfigNew());
}

static void
jni_YGConfigFreeJNI(JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  // unique_ptr will destruct the underlying global_ref, if present.
  auto context = std::unique_ptr<ScopedGlobalRef<jobject>>{
      static_cast<ScopedGlobalRef<jobject>*>(YGConfigGetContext(config))};
  YGConfigFree(config);
}

static void jni_YGConfigSetExperimentalFeatureEnabledJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint feature,
    jboolean enabled) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetExperimentalFeatureEnabled(
      config,
      static_cast<YGExperimentalFeature>(feature),
      static_cast<bool>(enabled));
}

static void jni_YGConfigSetUseWebDefaultsJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jboolean useWebDefaults) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetUseWebDefaults(config, static_cast<bool>(useWebDefaults));
}

static void jni_YGConfigSetPointScaleFactorJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jfloat pixelsInPoint) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetPointScaleFactor(config, pixelsInPoint);
}

static void jni_YGConfigSetErrataJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint errata) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetErrata(config, static_cast<YGErrata>(errata));
}

static jint jni_YGConfigGetErrataJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  return static_cast<jint>(YGConfigGetErrata(config));
}

static jlong jni_YGNodeNewJNI(JNIEnv* /*env*/, jobject /*obj*/) {
  const YGNodeRef node = YGNodeNew();
  YGNodeSetContext(node, YGNodeContext{}.asVoidPtr);
  return reinterpret_cast<jlong>(node);
}

static jlong jni_YGNodeNewWithConfigJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong configPointer) {
  const YGNodeRef node = YGNodeNewWithConfig(_jlong2YGConfigRef(configPointer));
  YGNodeSetContext(node, YGNodeContext{}.asVoidPtr);
  return reinterpret_cast<jlong>(node);
}

static int YGJNILogFunc(
    const YGConfigConstRef config,
    const YGNodeConstRef /*node*/,
    YGLogLevel level,
    const char* format,
    va_list args) {
  va_list argsCopy;
  va_copy(argsCopy, args);
  int result = vsnprintf(nullptr, 0, format, argsCopy);
  std::vector<char> buffer(1 + static_cast<size_t>(result));
  vsnprintf(buffer.data(), buffer.size(), format, args);

  auto jloggerPtr =
      static_cast<ScopedGlobalRef<jobject>*>(YGConfigGetContext(config));
  if (jloggerPtr != nullptr) {
    if (*jloggerPtr) {
      JNIEnv* env = getCurrentEnv();

      jclass cl = env->FindClass("com/facebook/yoga/YogaLogLevel");
      static const jmethodID smethodId =
          facebook::yoga::vanillajni::getStaticMethodId(
              env, cl, "fromInt", "(I)Lcom/facebook/yoga/YogaLogLevel;");
      ScopedLocalRef<jobject> logLevel =
          facebook::yoga::vanillajni::callStaticObjectMethod(
              env, cl, smethodId, level);

      auto objectClass = facebook::yoga::vanillajni::make_local_ref(
          env, env->GetObjectClass((*jloggerPtr).get()));
      static const jmethodID methodId = facebook::yoga::vanillajni::getMethodId(
          env,
          objectClass.get(),
          "log",
          "(Lcom/facebook/yoga/YogaLogLevel;Ljava/lang/String;)V");
      facebook::yoga::vanillajni::callVoidMethod(
          env,
          (*jloggerPtr).get(),
          methodId,
          logLevel.get(),
          env->NewStringUTF(buffer.data()));
    }
  }

  return result;
}

static void jni_YGConfigSetLoggerJNI(
    JNIEnv* env,
    jobject /*obj*/,
    jlong nativePointer,
    jobject logger) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  auto context =
      reinterpret_cast<ScopedGlobalRef<jobject>*>(YGConfigGetContext(config));

  if (logger != nullptr) {
    if (context == nullptr) {
      context = new ScopedGlobalRef<jobject>();
      YGConfigSetContext(config, context);
    }

    *context = newGlobalRef(env, logger);
    YGConfigSetLogger(config, YGJNILogFunc);
  } else {
    if (context != nullptr) {
      delete context;
      YGConfigSetContext(config, nullptr);
    }
    YGConfigSetLogger(config, nullptr);
  }
}

static void
jni_YGNodeFinalizeJNI(JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {
  if (nativePointer == 0) {
    return;
  }
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  YGNodeFinalize(node);
}

static void
jni_YGNodeResetJNI(JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  void* context = YGNodeGetContext(node);
  YGNodeReset(node);
  YGNodeSetContext(node, context);
}

static void jni_YGNodeInsertChildJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jlong childPointer,
    jint index) {
  YGNodeInsertChild(
      _jlong2YGNodeRef(nativePointer),
      _jlong2YGNodeRef(childPointer),
      static_cast<uint32_t>(index));
}

static void jni_YGNodeSwapChildJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jlong childPointer,
    jint index) {
  YGNodeSwapChild(
      _jlong2YGNodeRef(nativePointer),
      _jlong2YGNodeRef(childPointer),
      static_cast<uint32_t>(index));
}

static void jni_YGNodeSetIsReferenceBaselineJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jboolean isReferenceBaseline) {
  YGNodeSetIsReferenceBaseline(
      _jlong2YGNodeRef(nativePointer), static_cast<bool>(isReferenceBaseline));
}

static jboolean jni_YGNodeIsReferenceBaselineJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer) {
  return static_cast<jboolean>(
      YGNodeIsReferenceBaseline(_jlong2YGNodeRef(nativePointer)));
}

static void jni_YGNodeRemoveAllChildrenJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer) {
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  YGNodeRemoveAllChildren(node);
}

static void jni_YGNodeRemoveChildJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jlong childPointer) {
  YGNodeRemoveChild(
      _jlong2YGNodeRef(nativePointer), _jlong2YGNodeRef(childPointer));
}

static void
YGTransferLayoutOutputsRecursive(JNIEnv* env, jobject thiz, YGNodeRef root) {
  if (!YGNodeGetHasNewLayout(root)) {
    return;
  }
  auto obj = YGNodeJobject(root);
  if (!obj) {
    return;
  }

  auto edgesSet = YGNodeEdges{root};

  bool marginFieldSet = edgesSet.has(YGNodeEdges::MARGIN);
  bool paddingFieldSet = edgesSet.has(YGNodeEdges::PADDING);
  bool borderFieldSet = edgesSet.has(YGNodeEdges::BORDER);

  int fieldFlags = edgesSet.get();
  fieldFlags |= HAS_NEW_LAYOUT;

  const int arrSize = 6 + (marginFieldSet ? 4 : 0) + (paddingFieldSet ? 4 : 0) +
      (borderFieldSet ? 4 : 0);
  std::array<float, 18> arr; // NOLINT(cppcoreguidelines-pro-type-member-init)
  arr[LAYOUT_EDGE_SET_FLAG_INDEX] = static_cast<float>(fieldFlags);
  arr[LAYOUT_WIDTH_INDEX] = YGNodeLayoutGetWidth(root);
  arr[LAYOUT_HEIGHT_INDEX] = YGNodeLayoutGetHeight(root);
  arr[LAYOUT_LEFT_INDEX] = YGNodeLayoutGetLeft(root);
  arr[LAYOUT_TOP_INDEX] = YGNodeLayoutGetTop(root);
  arr[LAYOUT_DIRECTION_INDEX] =
      static_cast<float>(YGNodeLayoutGetDirection(root));
  if (marginFieldSet) {
    arr[LAYOUT_MARGIN_START_INDEX] = YGNodeLayoutGetMargin(root, YGEdgeLeft);
    arr[LAYOUT_MARGIN_START_INDEX + 1] = YGNodeLayoutGetMargin(root, YGEdgeTop);
    arr[LAYOUT_MARGIN_START_INDEX + 2] =
        YGNodeLayoutGetMargin(root, YGEdgeRight);
    arr[LAYOUT_MARGIN_START_INDEX + 3] =
        YGNodeLayoutGetMargin(root, YGEdgeBottom);
  }
  if (paddingFieldSet) {
    auto paddingStartIndex = static_cast<size_t>(
        LAYOUT_PADDING_START_INDEX - (marginFieldSet ? 0 : 4));
    arr[paddingStartIndex] = YGNodeLayoutGetPadding(root, YGEdgeLeft);
    arr[paddingStartIndex + 1] = YGNodeLayoutGetPadding(root, YGEdgeTop);
    arr[paddingStartIndex + 2] = YGNodeLayoutGetPadding(root, YGEdgeRight);
    arr[paddingStartIndex + 3] = YGNodeLayoutGetPadding(root, YGEdgeBottom);
  }

  if (borderFieldSet) {
    auto borderStartIndex = static_cast<size_t>(
        LAYOUT_BORDER_START_INDEX - (marginFieldSet ? 0 : 4) -
        (paddingFieldSet ? 0 : 4));
    arr[borderStartIndex] = YGNodeLayoutGetBorder(root, YGEdgeLeft);
    arr[borderStartIndex + 1] = YGNodeLayoutGetBorder(root, YGEdgeTop);
    arr[borderStartIndex + 2] = YGNodeLayoutGetBorder(root, YGEdgeRight);
    arr[borderStartIndex + 3] = YGNodeLayoutGetBorder(root, YGEdgeBottom);
  }

  // Create scope to make sure to release any local refs created here
  {
    // Don't change this field name without changing the name of the field in
    // Database.java
    auto objectClass = facebook::yoga::vanillajni::make_local_ref(
        env, env->GetObjectClass(obj.get()));
    static const jfieldID arrField = facebook::yoga::vanillajni::getFieldId(
        env, objectClass.get(), "arr", "[F");

    ScopedLocalRef<jfloatArray> arrFinal =
        make_local_ref(env, env->NewFloatArray(arrSize));
    env->SetFloatArrayRegion(arrFinal.get(), 0, arrSize, arr.data());
    env->SetObjectField(obj.get(), arrField, arrFinal.get());
  }

  YGNodeSetHasNewLayout(root, false);

  for (size_t i = 0; i < YGNodeGetChildCount(root); i++) {
    YGTransferLayoutOutputsRecursive(env, thiz, YGNodeGetChild(root, i));
  }
}

static void jni_YGNodeCalculateLayoutJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jfloat width,
    jfloat height,
    jlongArray nativePointers,
    jobjectArray javaNodes) {
  try {
    PtrJNodeMapVanilla* layoutContext = nullptr;
    auto map = PtrJNodeMapVanilla{};
    if (nativePointers != nullptr) {
      map = PtrJNodeMapVanilla{nativePointers, javaNodes};
      layoutContext = &map;
    }

    LayoutContext::Provider contextProvider(layoutContext);

    const YGNodeRef root = _jlong2YGNodeRef(nativePointer);
    YGNodeCalculateLayout(
        root,
        static_cast<float>(width),
        static_cast<float>(height),
        YGNodeStyleGetDirection(_jlong2YGNodeRef(nativePointer)));
    YGTransferLayoutOutputsRecursive(env, obj, root);
  } catch (const YogaJniException& jniException) {
    ScopedLocalRef<jthrowable> throwable = jniException.getThrowable();
    if (throwable.get() != nullptr) {
      env->Throw(throwable.get());
    }
  } catch (const std::logic_error& ex) {
    env->ExceptionClear();
    jclass cl = env->FindClass("java/lang/IllegalStateException");
    static const jmethodID methodId = facebook::yoga::vanillajni::getMethodId(
        env, cl, "<init>", "(Ljava/lang/String;)V");
    auto throwable = env->NewObject(cl, methodId, env->NewStringUTF(ex.what()));
    env->Throw(static_cast<jthrowable>(throwable));
  }
}

static void
jni_YGNodeMarkDirtyJNI(JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {
  YGNodeMarkDirty(_jlong2YGNodeRef(nativePointer));
}

static jboolean
jni_YGNodeIsDirtyJNI(JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {
  return (jboolean)YGNodeIsDirty(_jlong2YGNodeRef(nativePointer));
}

static void jni_YGNodeCopyStyleJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong dstNativePointer,
    jlong srcNativePointer) {
  YGNodeCopyStyle(
      _jlong2YGNodeRef(dstNativePointer), _jlong2YGNodeRef(srcNativePointer));
}

#define YG_NODE_JNI_STYLE_PROP(javatype, type, name)                           \
  static javatype jni_YGNodeStyleGet##name##JNI(                               \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {                 \
    return (javatype)YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer));    \
  }                                                                            \
                                                                               \
  static void jni_YGNodeStyleSet##name##JNI(                                   \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer, javatype value) { \
    YGNodeStyleSet##name(                                                      \
        _jlong2YGNodeRef(nativePointer), static_cast<type>(value));            \
  }

#define YG_NODE_JNI_STYLE_UNIT_PROP(name)                                    \
  static jlong jni_YGNodeStyleGet##name##JNI(                                \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {               \
    return YogaValue::asJavaLong(                                            \
        YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer)));              \
  }                                                                          \
                                                                             \
  static void jni_YGNodeStyleSet##name##JNI(                                 \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer, jfloat value) { \
    YGNodeStyleSet##name(                                                    \
        _jlong2YGNodeRef(nativePointer), static_cast<float>(value));         \
  }                                                                          \
                                                                             \
  static void jni_YGNodeStyleSet##name##PercentJNI(                          \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer, jfloat value) { \
    YGNodeStyleSet##name##Percent(                                           \
        _jlong2YGNodeRef(nativePointer), static_cast<float>(value));         \
  }

#define YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(name)                   \
  YG_NODE_JNI_STYLE_UNIT_PROP(name)                              \
  static void jni_YGNodeStyleSet##name##AutoJNI(                 \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {   \
    YGNodeStyleSet##name##Auto(_jlong2YGNodeRef(nativePointer)); \
  }

#define YG_NODE_JNI_STYLE_UNIT_PROP_AUTO_INTRINSIC(name) \
  YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(name)                 \
  YG_NODE_JNI_STYLE_UNIT_INTRINSIC(name)

#define YG_NODE_JNI_STYLE_UNIT_PROP_INTRINSIC(name) \
  YG_NODE_JNI_STYLE_UNIT_PROP(name)                 \
  YG_NODE_JNI_STYLE_UNIT_INTRINSIC(name)

#define YG_NODE_JNI_STYLE_UNIT_INTRINSIC(name)                         \
  static void jni_YGNodeStyleSet##name##MaxContentJNI(                 \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {         \
    YGNodeStyleSet##name##MaxContent(_jlong2YGNodeRef(nativePointer)); \
  }                                                                    \
  static void jni_YGNodeStyleSet##name##FitContentJNI(                 \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {         \
    YGNodeStyleSet##name##FitContent(_jlong2YGNodeRef(nativePointer)); \
  }                                                                    \
  static void jni_YGNodeStyleSet##name##StretchJNI(                    \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {         \
    YGNodeStyleSet##name##Stretch(_jlong2YGNodeRef(nativePointer));    \
  }

#define YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(name)                            \
  static jlong jni_YGNodeStyleGet##name##JNI(                             \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer, jint edge) { \
    return YogaValue::asJavaLong(                                         \
        YGNodeStyleGet##name(                                             \
            _jlong2YGNodeRef(nativePointer), static_cast<YGEdge>(edge))); \
  }                                                                       \
                                                                          \
  static void jni_YGNodeStyleSet##name##JNI(                              \
      JNIEnv* /*env*/,                                                    \
      jobject /*obj*/,                                                    \
      jlong nativePointer,                                                \
      jint edge,                                                          \
      jfloat value) {                                                     \
    YGNodeStyleSet##name(                                                 \
        _jlong2YGNodeRef(nativePointer),                                  \
        static_cast<YGEdge>(edge),                                        \
        static_cast<float>(value));                                       \
  }                                                                       \
                                                                          \
  static void jni_YGNodeStyleSet##name##PercentJNI(                       \
      JNIEnv* /*env*/,                                                    \
      jobject /*obj*/,                                                    \
      jlong nativePointer,                                                \
      jint edge,                                                          \
      jfloat value) {                                                     \
    YGNodeStyleSet##name##Percent(                                        \
        _jlong2YGNodeRef(nativePointer),                                  \
        static_cast<YGEdge>(edge),                                        \
        static_cast<float>(value));                                       \
  }

#define YG_NODE_JNI_STYLE_EDGE_UNIT_PROP_AUTO(name)                       \
  YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(name)                                  \
  static void jni_YGNodeStyleSet##name##AutoJNI(                          \
      JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer, jint edge) { \
    YGNodeStyleSet##name##Auto(                                           \
        _jlong2YGNodeRef(nativePointer), static_cast<YGEdge>(edge));      \
  }

YG_NODE_JNI_STYLE_PROP(jint, YGDirection, Direction);
YG_NODE_JNI_STYLE_PROP(jint, YGFlexDirection, FlexDirection);
YG_NODE_JNI_STYLE_PROP(jint, YGJustify, JustifyContent);
YG_NODE_JNI_STYLE_PROP(jint, YGAlign, AlignItems);
YG_NODE_JNI_STYLE_PROP(jint, YGAlign, AlignSelf);
YG_NODE_JNI_STYLE_PROP(jint, YGAlign, AlignContent);
YG_NODE_JNI_STYLE_PROP(jint, YGPositionType, PositionType);
YG_NODE_JNI_STYLE_PROP(jint, YGBoxSizing, BoxSizing);
YG_NODE_JNI_STYLE_PROP(jint, YGWrap, FlexWrap);
YG_NODE_JNI_STYLE_PROP(jint, YGOverflow, Overflow);
YG_NODE_JNI_STYLE_PROP(jint, YGDisplay, Display);
YG_NODE_JNI_STYLE_PROP(jfloat, float, Flex);
YG_NODE_JNI_STYLE_PROP(jfloat, float, FlexGrow);
YG_NODE_JNI_STYLE_PROP(jfloat, float, FlexShrink);

YG_NODE_JNI_STYLE_UNIT_PROP_AUTO_INTRINSIC(FlexBasis);
YG_NODE_JNI_STYLE_UNIT_PROP_AUTO_INTRINSIC(Width);
YG_NODE_JNI_STYLE_UNIT_PROP_INTRINSIC(MinWidth);
YG_NODE_JNI_STYLE_UNIT_PROP_INTRINSIC(MaxWidth);
YG_NODE_JNI_STYLE_UNIT_PROP_AUTO_INTRINSIC(Height);
YG_NODE_JNI_STYLE_UNIT_PROP_INTRINSIC(MinHeight);
YG_NODE_JNI_STYLE_UNIT_PROP_INTRINSIC(MaxHeight);

YG_NODE_JNI_STYLE_EDGE_UNIT_PROP_AUTO(Position);

static jlong jni_YGNodeStyleGetMarginJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  if (!YGNodeEdges{yogaNodeRef}.has(YGNodeEdges::MARGIN)) {
    return YogaValue::undefinedAsJavaLong();
  }
  return YogaValue::asJavaLong(
      YGNodeStyleGetMargin(yogaNodeRef, static_cast<YGEdge>(edge)));
}

static void jni_YGNodeStyleSetMarginJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint edge,
    jfloat margin) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::MARGIN).setOn(yogaNodeRef);
  YGNodeStyleSetMargin(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(margin));
}

static void jni_YGNodeStyleSetMarginPercentJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint edge,
    jfloat percent) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::MARGIN).setOn(yogaNodeRef);
  YGNodeStyleSetMarginPercent(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(percent));
}

static void jni_YGNodeStyleSetMarginAutoJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::MARGIN).setOn(yogaNodeRef);
  YGNodeStyleSetMarginAuto(yogaNodeRef, static_cast<YGEdge>(edge));
}

static jlong jni_YGNodeStyleGetPaddingJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  if (!YGNodeEdges{yogaNodeRef}.has(YGNodeEdges::PADDING)) {
    return YogaValue::undefinedAsJavaLong();
  }
  return YogaValue::asJavaLong(
      YGNodeStyleGetPadding(yogaNodeRef, static_cast<YGEdge>(edge)));
}

static void jni_YGNodeStyleSetPaddingJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint edge,
    jfloat padding) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::PADDING).setOn(yogaNodeRef);
  YGNodeStyleSetPadding(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(padding));
}

static void jni_YGNodeStyleSetPaddingPercentJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint edge,
    jfloat percent) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::PADDING).setOn(yogaNodeRef);
  YGNodeStyleSetPaddingPercent(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(percent));
}

static jfloat jni_YGNodeStyleGetBorderJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  if (!YGNodeEdges{yogaNodeRef}.has(YGNodeEdges::BORDER)) {
    return (jfloat)YGUndefined;
  }
  return (jfloat)YGNodeStyleGetBorder(yogaNodeRef, static_cast<YGEdge>(edge));
}

static void jni_YGNodeStyleSetBorderJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint edge,
    jfloat border) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::BORDER).setOn(yogaNodeRef);
  YGNodeStyleSetBorder(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(border));
}

static void YGTransferLayoutDirection(YGNodeConstRef node, jobject javaNode) {
  // Don't change this field name without changing the name of the field in
  // Database.java
  JNIEnv* env = getCurrentEnv();
  auto objectClass = facebook::yoga::vanillajni::make_local_ref(
      env, env->GetObjectClass(javaNode));
  static const jfieldID layoutDirectionField =
      facebook::yoga::vanillajni::getFieldId(
          env, objectClass.get(), "mLayoutDirection", "I");
  env->SetIntField(
      javaNode,
      layoutDirectionField,
      static_cast<jint>(YGNodeLayoutGetDirection(node)));
}

static YGSize YGJNIMeasureFunc(
    YGNodeConstRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {
  if (auto obj = YGNodeJobject(node)) {
    YGTransferLayoutDirection(node, obj.get());
    JNIEnv* env = getCurrentEnv();
    auto objectClass = facebook::yoga::vanillajni::make_local_ref(
        env, env->GetObjectClass(obj.get()));
    static const jmethodID methodId = facebook::yoga::vanillajni::getMethodId(
        env, objectClass.get(), "measure", "(FIFI)J");
    const auto measureResult = facebook::yoga::vanillajni::callLongMethod(
        env, obj.get(), methodId, width, widthMode, height, heightMode);

    static_assert(
        sizeof(measureResult) == 8,
        "Expected measureResult to be 8 bytes, or two 32 bit ints");

    uint32_t wBits = 0xFFFFFFFF & (measureResult >> 32);
    uint32_t hBits = 0xFFFFFFFF & measureResult;
    auto measuredWidth = std::bit_cast<float>(wBits);
    auto measuredHeight = std::bit_cast<float>(hBits);

    return YGSize{measuredWidth, measuredHeight};
  } else {
    return YGSize{
        widthMode == YGMeasureModeUndefined ? 0 : width,
        heightMode == YGMeasureModeUndefined ? 0 : height,
    };
  }
}

static void jni_YGNodeSetHasMeasureFuncJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jboolean hasMeasureFunc) {
  YGNodeSetMeasureFunc(
      _jlong2YGNodeRef(nativePointer),
      static_cast<bool>(hasMeasureFunc) ? YGJNIMeasureFunc : nullptr);
}

static YGSize YGJNIMinContentMeasureFunc(
    YGNodeConstRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {
  if (auto obj = YGNodeJobject(node)) {
    YGTransferLayoutDirection(node, obj.get());
    JNIEnv* env = getCurrentEnv();
    auto objectClass = facebook::yoga::vanillajni::make_local_ref(
        env, env->GetObjectClass(obj.get()));
    // NOLINTNEXTLINE(misc-misplaced-const)
    static const jmethodID methodId = facebook::yoga::vanillajni::getMethodId(
        env, objectClass.get(), "measureMinContent", "(FIFI)J");
    // NOLINTNEXTLINE(cppcoreguidelines-pro-type-vararg)
    const auto measureResult = facebook::yoga::vanillajni::callLongMethod(
        env, obj.get(), methodId, width, widthMode, height, heightMode);

    uint32_t wBits = 0xFFFFFFFF & (measureResult >> 32);
    uint32_t hBits = 0xFFFFFFFF & measureResult;
    auto measuredWidth = std::bit_cast<float>(wBits);
    auto measuredHeight = std::bit_cast<float>(hBits);

    return YGSize{measuredWidth, measuredHeight};
  } else {
    return YGSize{
        widthMode == YGMeasureModeUndefined ? 0 : width,
        heightMode == YGMeasureModeUndefined ? 0 : height,
    };
  }
}

static void jni_YGNodeSetHasMinContentMeasureFuncJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jboolean hasMinContentMeasureFunc) {
  YGNodeSetMinContentMeasureFunc(
      _jlong2YGNodeRef(nativePointer),
      static_cast<bool>(hasMinContentMeasureFunc) ? YGJNIMinContentMeasureFunc
                                                  : nullptr);
}

static void jni_YGNodeSetMinContentWidthJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jfloat minContentWidth) {
  YGNodeSetMinContentWidth(
      _jlong2YGNodeRef(nativePointer), static_cast<float>(minContentWidth));
}

static void jni_YGNodeSetMinContentHeightJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jfloat minContentHeight) {
  YGNodeSetMinContentHeight(
      _jlong2YGNodeRef(nativePointer), static_cast<float>(minContentHeight));
}

static jfloat jni_YGNodeGetMinContentWidthJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer) {
  return static_cast<jfloat>(
      YGNodeGetMinContentWidth(_jlong2YGNodeRef(nativePointer)));
}

static jfloat jni_YGNodeGetMinContentHeightJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer) {
  return static_cast<jfloat>(
      YGNodeGetMinContentHeight(_jlong2YGNodeRef(nativePointer)));
}

static float YGJNIBaselineFunc(YGNodeConstRef node, float width, float height) {
  if (auto obj = YGNodeJobject(node)) {
    JNIEnv* env = getCurrentEnv();
    auto objectClass = facebook::yoga::vanillajni::make_local_ref(
        env, env->GetObjectClass(obj.get()));
    static const jmethodID methodId = facebook::yoga::vanillajni::getMethodId(
        env, objectClass.get(), "baseline", "(FF)F");
    return facebook::yoga::vanillajni::callFloatMethod(
        env, obj.get(), methodId, width, height);
  } else {
    return height;
  }
}

static void jni_YGNodeSetHasBaselineFuncJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jboolean hasBaselineFunc) {
  YGNodeSetBaselineFunc(
      _jlong2YGNodeRef(nativePointer),
      static_cast<bool>(hasBaselineFunc) ? YGJNIBaselineFunc : nullptr);
}

static void jni_YGNodeSetAlwaysFormsContainingBlockJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jboolean alwaysFormsContainingBlock) {
  YGNodeSetAlwaysFormsContainingBlock(
      _jlong2YGNodeRef(nativePointer),
      static_cast<bool>(alwaysFormsContainingBlock));
}

static jlong
jni_YGNodeCloneJNI(JNIEnv* /*env*/, jobject /*obj*/, jlong nativePointer) {
  auto node = _jlong2YGNodeRef(nativePointer);
  const YGNodeRef clonedYogaNode = YGNodeClone(node);
  YGNodeSetContext(clonedYogaNode, YGNodeGetContext(node));

  return reinterpret_cast<jlong>(clonedYogaNode);
}

static jlong jni_YGNodeStyleGetGapJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint gutter) {
  return YogaValue::asJavaLong(YGNodeStyleGetGap(
      _jlong2YGNodeRef(nativePointer), static_cast<YGGutter>(gutter)));
}

static void jni_YGNodeStyleSetGapJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint gutter,
    jfloat gapLength) {
  YGNodeStyleSetGap(
      _jlong2YGNodeRef(nativePointer),
      static_cast<YGGutter>(gutter),
      static_cast<float>(gapLength));
}

static void jni_YGNodeStyleSetGapPercentJNI(
    JNIEnv* /*env*/,
    jobject /*obj*/,
    jlong nativePointer,
    jint gutter,
    jfloat gapLength) {
  YGNodeStyleSetGapPercent(
      _jlong2YGNodeRef(nativePointer),
      static_cast<YGGutter>(gutter),
      static_cast<float>(gapLength));
}

// Yoga specific properties, not compatible with flexbox specification
YG_NODE_JNI_STYLE_PROP(jfloat, float, AspectRatio);

// NOLINTNEXTLINE(facebook-hte-CArray, modernize-avoid-c-arrays)
static JNINativeMethod methods[] = {
    {"jni_YGConfigNewJNI", "()J", (void*)jni_YGConfigNewJNI},
    {"jni_YGConfigFreeJNI", "(J)V", (void*)jni_YGConfigFreeJNI},
    {"jni_YGConfigSetExperimentalFeatureEnabledJNI",
     "(JIZ)V",
     (void*)jni_YGConfigSetExperimentalFeatureEnabledJNI},
    {"jni_YGConfigSetUseWebDefaultsJNI",
     "(JZ)V",
     (void*)jni_YGConfigSetUseWebDefaultsJNI},
    {"jni_YGConfigSetPointScaleFactorJNI",
     "(JF)V",
     (void*)jni_YGConfigSetPointScaleFactorJNI},
    {"jni_YGConfigSetErrataJNI", "(JI)V", (void*)jni_YGConfigSetErrataJNI},
    {"jni_YGConfigGetErrataJNI", "(J)I", (void*)jni_YGConfigGetErrataJNI},
    {"jni_YGConfigSetLoggerJNI",
     "(JLcom/facebook/yoga/YogaLogger;)V",
     (void*)jni_YGConfigSetLoggerJNI},
    {"jni_YGNodeNewJNI", "()J", (void*)jni_YGNodeNewJNI},
    {"jni_YGNodeNewWithConfigJNI", "(J)J", (void*)jni_YGNodeNewWithConfigJNI},
    {"jni_YGNodeFinalizeJNI", "(J)V", (void*)jni_YGNodeFinalizeJNI},
    {"jni_YGNodeResetJNI", "(J)V", (void*)jni_YGNodeResetJNI},
    {"jni_YGNodeInsertChildJNI", "(JJI)V", (void*)jni_YGNodeInsertChildJNI},
    {"jni_YGNodeSwapChildJNI", "(JJI)V", (void*)jni_YGNodeSwapChildJNI},
    {"jni_YGNodeSetIsReferenceBaselineJNI",
     "(JZ)V",
     (void*)jni_YGNodeSetIsReferenceBaselineJNI},
    {"jni_YGNodeIsReferenceBaselineJNI",
     "(J)Z",
     (void*)jni_YGNodeIsReferenceBaselineJNI},
    {"jni_YGNodeRemoveAllChildrenJNI",
     "(J)V",
     (void*)jni_YGNodeRemoveAllChildrenJNI},
    {"jni_YGNodeRemoveChildJNI", "(JJ)V", (void*)jni_YGNodeRemoveChildJNI},
    {"jni_YGNodeCalculateLayoutJNI",
     "(JFF[J[Lcom/facebook/yoga/YogaNodeJNIBase;)V",
     (void*)jni_YGNodeCalculateLayoutJNI},
    {"jni_YGNodeMarkDirtyJNI", "(J)V", (void*)jni_YGNodeMarkDirtyJNI},
    {"jni_YGNodeIsDirtyJNI", "(J)Z", (void*)jni_YGNodeIsDirtyJNI},
    {"jni_YGNodeCopyStyleJNI", "(JJ)V", (void*)jni_YGNodeCopyStyleJNI},
    {"jni_YGNodeStyleGetDirectionJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetDirectionJNI},
    {"jni_YGNodeStyleSetDirectionJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetDirectionJNI},
    {"jni_YGNodeStyleGetFlexDirectionJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetFlexDirectionJNI},
    {"jni_YGNodeStyleSetFlexDirectionJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetFlexDirectionJNI},
    {"jni_YGNodeStyleGetJustifyContentJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetJustifyContentJNI},
    {"jni_YGNodeStyleSetJustifyContentJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetJustifyContentJNI},
    {"jni_YGNodeStyleGetAlignItemsJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetAlignItemsJNI},
    {"jni_YGNodeStyleSetAlignItemsJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetAlignItemsJNI},
    {"jni_YGNodeStyleGetAlignSelfJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetAlignSelfJNI},
    {"jni_YGNodeStyleSetAlignSelfJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetAlignSelfJNI},
    {"jni_YGNodeStyleGetAlignContentJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetAlignContentJNI},
    {"jni_YGNodeStyleSetAlignContentJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetAlignContentJNI},
    {"jni_YGNodeStyleGetPositionTypeJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetPositionTypeJNI},
    {"jni_YGNodeStyleSetPositionTypeJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetPositionTypeJNI},
    {"jni_YGNodeStyleGetBoxSizingJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetBoxSizingJNI},
    {"jni_YGNodeStyleSetBoxSizingJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetBoxSizingJNI},
    {"jni_YGNodeStyleGetFlexWrapJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetFlexWrapJNI},
    {"jni_YGNodeStyleSetFlexWrapJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetFlexWrapJNI},
    {"jni_YGNodeStyleGetOverflowJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetOverflowJNI},
    {"jni_YGNodeStyleSetOverflowJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetOverflowJNI},
    {"jni_YGNodeStyleGetDisplayJNI",
     "(J)I",
     (void*)jni_YGNodeStyleGetDisplayJNI},
    {"jni_YGNodeStyleSetDisplayJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetDisplayJNI},
    {"jni_YGNodeStyleGetFlexJNI", "(J)F", (void*)jni_YGNodeStyleGetFlexJNI},
    {"jni_YGNodeStyleSetFlexJNI", "(JF)V", (void*)jni_YGNodeStyleSetFlexJNI},
    {"jni_YGNodeStyleGetFlexGrowJNI",
     "(J)F",
     (void*)jni_YGNodeStyleGetFlexGrowJNI},
    {"jni_YGNodeStyleSetFlexGrowJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetFlexGrowJNI},
    {"jni_YGNodeStyleGetFlexShrinkJNI",
     "(J)F",
     (void*)jni_YGNodeStyleGetFlexShrinkJNI},
    {"jni_YGNodeStyleSetFlexShrinkJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetFlexShrinkJNI},
    {"jni_YGNodeStyleGetFlexBasisJNI",
     "(J)J",
     (void*)jni_YGNodeStyleGetFlexBasisJNI},
    {"jni_YGNodeStyleSetFlexBasisJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetFlexBasisJNI},
    {"jni_YGNodeStyleSetFlexBasisPercentJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetFlexBasisPercentJNI},
    {"jni_YGNodeStyleSetFlexBasisAutoJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetFlexBasisAutoJNI},
    {"jni_YGNodeStyleSetFlexBasisMaxContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetFlexBasisMaxContentJNI},
    {"jni_YGNodeStyleSetFlexBasisFitContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetFlexBasisFitContentJNI},
    {"jni_YGNodeStyleSetFlexBasisStretchJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetFlexBasisStretchJNI},
    {"jni_YGNodeStyleGetMarginJNI",
     "(JI)J",
     (void*)jni_YGNodeStyleGetMarginJNI},
    {"jni_YGNodeStyleSetMarginJNI",
     "(JIF)V",
     (void*)jni_YGNodeStyleSetMarginJNI},
    {"jni_YGNodeStyleSetMarginPercentJNI",
     "(JIF)V",
     (void*)jni_YGNodeStyleSetMarginPercentJNI},
    {"jni_YGNodeStyleSetMarginAutoJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetMarginAutoJNI},
    {"jni_YGNodeStyleGetPaddingJNI",
     "(JI)J",
     (void*)jni_YGNodeStyleGetPaddingJNI},
    {"jni_YGNodeStyleSetPaddingJNI",
     "(JIF)V",
     (void*)jni_YGNodeStyleSetPaddingJNI},
    {"jni_YGNodeStyleSetPaddingPercentJNI",
     "(JIF)V",
     (void*)jni_YGNodeStyleSetPaddingPercentJNI},
    {"jni_YGNodeStyleGetBorderJNI",
     "(JI)F",
     (void*)jni_YGNodeStyleGetBorderJNI},
    {"jni_YGNodeStyleSetBorderJNI",
     "(JIF)V",
     (void*)jni_YGNodeStyleSetBorderJNI},
    {"jni_YGNodeStyleGetPositionJNI",
     "(JI)J",
     (void*)jni_YGNodeStyleGetPositionJNI},
    {"jni_YGNodeStyleSetPositionJNI",
     "(JIF)V",
     (void*)jni_YGNodeStyleSetPositionJNI},
    {"jni_YGNodeStyleSetPositionPercentJNI",
     "(JIF)V",
     (void*)jni_YGNodeStyleSetPositionPercentJNI},
    {"jni_YGNodeStyleSetPositionAutoJNI",
     "(JI)V",
     (void*)jni_YGNodeStyleSetPositionAutoJNI},
    {"jni_YGNodeStyleGetWidthJNI", "(J)J", (void*)jni_YGNodeStyleGetWidthJNI},
    {"jni_YGNodeStyleSetWidthJNI", "(JF)V", (void*)jni_YGNodeStyleSetWidthJNI},
    {"jni_YGNodeStyleSetWidthPercentJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetWidthPercentJNI},
    {"jni_YGNodeStyleSetWidthAutoJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetWidthAutoJNI},
    {"jni_YGNodeStyleSetWidthMaxContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetWidthMaxContentJNI},
    {"jni_YGNodeStyleSetWidthFitContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetWidthFitContentJNI},
    {"jni_YGNodeStyleSetWidthStretchJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetWidthStretchJNI},
    {"jni_YGNodeStyleGetHeightJNI", "(J)J", (void*)jni_YGNodeStyleGetHeightJNI},
    {"jni_YGNodeStyleSetHeightJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetHeightJNI},
    {"jni_YGNodeStyleSetHeightPercentJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetHeightPercentJNI},
    {"jni_YGNodeStyleSetHeightAutoJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetHeightAutoJNI},
    {"jni_YGNodeStyleSetHeightMaxContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetHeightMaxContentJNI},
    {"jni_YGNodeStyleSetHeightFitContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetHeightFitContentJNI},
    {"jni_YGNodeStyleSetHeightStretchJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetHeightStretchJNI},
    {"jni_YGNodeStyleGetMinWidthJNI",
     "(J)J",
     (void*)jni_YGNodeStyleGetMinWidthJNI},
    {"jni_YGNodeStyleSetMinWidthJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetMinWidthJNI},
    {"jni_YGNodeStyleSetMinWidthPercentJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetMinWidthPercentJNI},
    {"jni_YGNodeStyleSetMinWidthMaxContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMinWidthMaxContentJNI},
    {"jni_YGNodeStyleSetMinWidthFitContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMinWidthFitContentJNI},
    {"jni_YGNodeStyleSetMinWidthStretchJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMinWidthStretchJNI},
    {"jni_YGNodeStyleGetMinHeightJNI",
     "(J)J",
     (void*)jni_YGNodeStyleGetMinHeightJNI},
    {"jni_YGNodeStyleSetMinHeightJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetMinHeightJNI},
    {"jni_YGNodeStyleSetMinHeightPercentJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetMinHeightPercentJNI},
    {"jni_YGNodeStyleSetMinHeightMaxContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMinHeightMaxContentJNI},
    {"jni_YGNodeStyleSetMinHeightFitContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMinHeightFitContentJNI},
    {"jni_YGNodeStyleSetMinHeightStretchJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMinHeightStretchJNI},
    {"jni_YGNodeStyleGetMaxWidthJNI",
     "(J)J",
     (void*)jni_YGNodeStyleGetMaxWidthJNI},
    {"jni_YGNodeStyleSetMaxWidthJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetMaxWidthJNI},
    {"jni_YGNodeStyleSetMaxWidthPercentJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetMaxWidthPercentJNI},
    {"jni_YGNodeStyleSetMaxWidthMaxContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMaxWidthMaxContentJNI},
    {"jni_YGNodeStyleSetMaxWidthFitContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMaxWidthFitContentJNI},
    {"jni_YGNodeStyleSetMaxWidthStretchJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMaxWidthStretchJNI},
    {"jni_YGNodeStyleGetMaxHeightJNI",
     "(J)J",
     (void*)jni_YGNodeStyleGetMaxHeightJNI},
    {"jni_YGNodeStyleSetMaxHeightJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetMaxHeightJNI},
    {"jni_YGNodeStyleSetMaxHeightPercentJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetMaxHeightPercentJNI},
    {"jni_YGNodeStyleSetMaxHeightMaxContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMaxHeightMaxContentJNI},
    {"jni_YGNodeStyleSetMaxHeightFitContentJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMaxHeightFitContentJNI},
    {"jni_YGNodeStyleSetMaxHeightStretchJNI",
     "(J)V",
     (void*)jni_YGNodeStyleSetMaxHeightStretchJNI},
    {"jni_YGNodeStyleGetAspectRatioJNI",
     "(J)F",
     (void*)jni_YGNodeStyleGetAspectRatioJNI},
    {"jni_YGNodeStyleSetAspectRatioJNI",
     "(JF)V",
     (void*)jni_YGNodeStyleSetAspectRatioJNI},
    {"jni_YGNodeSetHasMeasureFuncJNI",
     "(JZ)V",
     (void*)jni_YGNodeSetHasMeasureFuncJNI},
    // NOLINTBEGIN(cppcoreguidelines-pro-type-cstyle-cast)
    {"jni_YGNodeSetHasMinContentMeasureFuncJNI",
     "(JZ)V",
     (void*)jni_YGNodeSetHasMinContentMeasureFuncJNI},
    {"jni_YGNodeSetMinContentWidthJNI",
     "(JF)V",
     (void*)jni_YGNodeSetMinContentWidthJNI},
    {"jni_YGNodeSetMinContentHeightJNI",
     "(JF)V",
     (void*)jni_YGNodeSetMinContentHeightJNI},
    {"jni_YGNodeGetMinContentWidthJNI",
     "(J)F",
     (void*)jni_YGNodeGetMinContentWidthJNI},
    {"jni_YGNodeGetMinContentHeightJNI",
     "(J)F",
     (void*)jni_YGNodeGetMinContentHeightJNI},
    // NOLINTEND(cppcoreguidelines-pro-type-cstyle-cast)
    {"jni_YGNodeStyleGetGapJNI", "(JI)J", (void*)jni_YGNodeStyleGetGapJNI},
    {"jni_YGNodeStyleSetGapJNI", "(JIF)V", (void*)jni_YGNodeStyleSetGapJNI},
    {"jni_YGNodeStyleSetGapPercentJNI",
     "(JIF)V",
     (void*)jni_YGNodeStyleSetGapPercentJNI},
    {"jni_YGNodeSetHasBaselineFuncJNI",
     "(JZ)V",
     (void*)jni_YGNodeSetHasBaselineFuncJNI},
    {"jni_YGNodeSetAlwaysFormsContainingBlockJNI",
     "(JZ)V",
     (void*)jni_YGNodeSetAlwaysFormsContainingBlockJNI},
    {"jni_YGNodeCloneJNI", "(J)J", (void*)jni_YGNodeCloneJNI},
};

void YGJNIVanilla::registerNatives(JNIEnv* env) {
  facebook::yoga::vanillajni::registerNatives(
      env,
      "com/facebook/yoga/YogaNative",
      methods,
      sizeof(methods) / sizeof(JNINativeMethod));
}
