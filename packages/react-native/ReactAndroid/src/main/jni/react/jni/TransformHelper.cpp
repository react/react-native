/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TransformHelper.h"

#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/components/view/conversions.h>

#include "NativeArray.h"

#include <cmath>

using namespace facebook::jni;

namespace facebook::react {

namespace {
void processTransform(
    jni::alias_ref<jclass> /*unused*/,
    NativeArray* jTransforms,
    jni::alias_ref<jni::JArrayDouble> jResult,
    float viewWidth,
    float viewHeight,
    NativeArray* jTransformOrigin) {
  // Assuming parsing transforms doesn't require a real PropsParserContext
  static ContextContainer contextContainer;
  static PropsParserContext context(0, contextContainer);

  RawValue transformValue(jTransforms->getArray());
  Transform transform;
  fromRawValue(context, transformValue, transform);

  TransformOrigin transformOrigin;
  if (jTransformOrigin != nullptr) {
    RawValue transformOriginValue(jTransformOrigin->getArray());
    fromRawValue(context, transformOriginValue, transformOrigin);
  }

  auto result = BaseViewProps::resolveTransform(
      Size{.width = viewWidth, .height = viewHeight},
      transform,
      transformOrigin);

  // Convert from matrix of floats to double matrix
  constexpr size_t MatrixSize = std::tuple_size_v<decltype(result.matrix)>;
  std::array<double, MatrixSize> doubleTransform{};
  std::copy(
      result.matrix.begin(), result.matrix.end(), doubleTransform.begin());
  jResult->setRegion(0, MatrixSize, doubleTransform.data());
}

// `matrix` is column-major: x' = m[0] x + m[4] y + m[12],
// y' = m[1] x + m[5] y + m[13]. The other entries are the Z axis, perspective
// and the homogeneous scale.
bool isAffine2DMatrix(const folly::dynamic& matrix) {
  if (!matrix.isArray() || matrix.size() != 16) {
    return false;
  }
  for (const auto& entry : matrix) {
    if (!entry.isNumber()) {
      return false;
    }
  }
  for (size_t i : {2, 3, 6, 7, 8, 9, 11, 14}) {
    if (matrix[i].asDouble() != 0.0) {
      return false;
    }
  }
  return matrix[10].asDouble() == 1.0 && matrix[15].asDouble() == 1.0;
}

bool hasSkew(const folly::dynamic& matrix) {
  double xAxisX = matrix[0].asDouble();
  double xAxisY = matrix[1].asDouble();
  double yAxisX = matrix[4].asDouble();
  double yAxisY = matrix[5].asDouble();
  double cosineBetweenAxes = (xAxisX * yAxisX + xAxisY * yAxisY) /
      (std::hypot(xAxisX, xAxisY) * std::hypot(yAxisX, yAxisY));
  return std::abs(cosineBetweenAxes) > 1e-5;
}

// Same result as SkewMatrixHelper.isAffine2DTransformWithSkew, but reads the
// array in place instead of crossing JNI for each element and key.
jboolean isAffine2DTransformWithSkew(
    jni::alias_ref<jclass> /*unused*/,
    NativeArray* jTransforms) {
  const auto& transforms = jTransforms->getArray();
  // The raw 16-element matrix shorthand used by Fabric LayoutAnimations.
  if (transforms.size() == 16 && transforms[0].isNumber()) {
    return JNI_FALSE;
  }
  bool hasSkewTransform = false;
  for (const auto& transform : transforms) {
    if (!transform.isObject() || transform.empty()) {
      continue;
    }
    const auto& [key, value] = *transform.items().begin();
    if (!key.isString()) {
      continue;
    }
    const auto& type = key.getString();
    if (type == "perspective" || type == "rotateX" || type == "rotateY") {
      return JNI_FALSE;
    }
    if (type == "matrix") {
      if (!isAffine2DMatrix(value)) {
        return JNI_FALSE;
      }
      if (hasSkew(value)) {
        hasSkewTransform = true;
      }
    } else if (type == "translate") {
      if (value.isArray() && value.size() > 2 && value[2].isNumber() &&
          value[2].asDouble() != 0.0) {
        return JNI_FALSE;
      }
    } else if (type == "skewX" || type == "skewY") {
      hasSkewTransform = true;
    }
  }
  return hasSkewTransform ? JNI_TRUE : JNI_FALSE;
}

} // namespace

void TransformHelper::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod("nativeProcessTransform", processTransform),
      makeNativeMethod(
          "nativeIsAffine2DTransformWithSkew", isAffine2DTransformWithSkew),
  });
}

} // namespace facebook::react
