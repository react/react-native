/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/graphics/Transform.h>
#include <react/renderer/graphics/ValueUnit.h>

namespace facebook::react {

/**
 * Serializes a ValueUnit to a folly::dynamic object and appends it to the
 * result array. Handles percentage values by converting them to strings
 * (e.g., "50%").
 */
inline void serializeTransformOperationValue(
    const std::string &operationName,
    const ValueUnit &valueUnit,
    folly::dynamic &resultArray)
{
  folly::dynamic result = folly::dynamic::object();
  if (valueUnit.unit == UnitType::Percent) {
    result[operationName] = std::to_string(valueUnit.value) + "%";
  } else {
    result[operationName] = valueUnit.value;
  }
  resultArray.push_back(std::move(result));
}

inline void serializeTransformAxis(
    const TransformOperation &operation,
    const std::string &operationName,
    float defaultValue,
    folly::dynamic &resultTranslateArray)
{
  if (operation.x.value != defaultValue) {
    serializeTransformOperationValue(operationName + "X", operation.x, resultTranslateArray);
  }
  if (operation.y.value != defaultValue) {
    serializeTransformOperationValue(operationName + "Y", operation.y, resultTranslateArray);
  }
  if (operation.z.value != defaultValue) {
    serializeTransformOperationValue(operationName + "Z", operation.z, resultTranslateArray);
  }
}

inline void updateTransformProps(
    const Transform &transform,
    const TransformOperation &operation,
    folly::dynamic &resultTranslateArray)
{
  // See serialization rules in:
  // react-native-github/packages/react-native/ReactCommon/react/renderer/components/view/conversions.h?lines=592
  std::string operationName;
  switch (operation.type) {
    case TransformOperationType::Scale:
      operationName = "scale";
      if (operation.x == operation.y && operation.x == operation.z) {
        serializeTransformOperationValue(operationName, operation.x, resultTranslateArray);
      } else {
        serializeTransformAxis(operation, operationName, 1.0f, resultTranslateArray);
      }
      return;
    case TransformOperationType::Translate:
      serializeTransformAxis(operation, "translate", 0, resultTranslateArray);
      return;
    case TransformOperationType::Rotate:
      serializeTransformAxis(operation, "rotate", 0, resultTranslateArray);
      return;
    case TransformOperationType::Perspective:
      serializeTransformAxis(operation, "perspective", 0, resultTranslateArray);
      return;
    case TransformOperationType::Arbitrary: {
      folly::dynamic result = folly::dynamic::object();
      result["matrix"] = transform;
      resultTranslateArray.push_back(std::move(result));
      return;
    }
    case TransformOperationType::Identity:
      // Do nothing
      return;
    case TransformOperationType::Skew:
      serializeTransformAxis(operation, "skew", 0, resultTranslateArray);
      return;
    default:
      return;
  }
}

} // namespace facebook::react
