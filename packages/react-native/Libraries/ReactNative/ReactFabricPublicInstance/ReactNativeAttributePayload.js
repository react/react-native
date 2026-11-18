/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  AnyAttributeType,
  AttributeConfiguration,
} from '../../Renderer/shims/ReactNativeTypes';
import type {
  CompiledConditionalValue,
  StyleObject,
} from '../../StyleSheet/processStyleConditions';

import ReactNativeStyleAttributes from '../../Components/View/ReactNativeStyleAttributes';
import flattenStyle from '../../StyleSheet/flattenStyle';
import {
  compileConditionalValue,
  isConditionalValue,
} from '../../StyleSheet/processStyleConditions';
import deepDiffer from '../../Utilities/differ/deepDiffer';

const emptyObject = {};

/**
 * Create a payload that contains all the updates between two sets of props.
 *
 * These helpers are all encapsulated into a single module, because they use
 * mutation as a performance optimization which leads to subtle shared
 * dependencies between the code paths. To avoid this mutable state leaking
 * across modules, I've kept them isolated to this module.
 */

type NestedNode = Array<NestedNode> | {[key: string]: unknown};

// Tracks removed keys
let removedKeys: {[key: string]: boolean} | null = null;
let removedKeyCount = 0;

const deepDifferOptions = {
  unsafelyIgnoreFunctions: true,
};

// Native reads a conditional value under its own prop as
// `{$conditionalValue: {default, conditions}}`.
const CONDITIONAL_VALUE_KEY = '$conditionalValue';

// Tells native that the payload has a conditional value, so that other
// payloads skip the search.
const HAS_CONDITIONAL_VALUES_KEY = '$hasConditionalValues';

let hasConditionalValues = false;

function isStyleConditionValue(
  value: unknown,
  validAttributes: AttributeConfiguration,
): implies value is StyleObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    (validAttributes as unknown) === ReactNativeStyleAttributes &&
    isConditionalValue(value)
  );
}

function processStyleConditionValue(
  value: StyleObject,
  attributeConfig: ?AnyAttributeType,
  propKey: string,
): unknown {
  const compiled = compileConditionalValue(value, propKey);
  if (compiled == null) {
    return null;
  }
  const process =
    attributeConfig != null && attributeConfig !== true
      ? attributeConfig.process
      : null;
  // `process` returns undefined for an invalid value.
  const processValue = (item: unknown) =>
    item == null || process == null ? (item ?? null) : (process(item) ?? null);
  const defaultValue = processValue(compiled.default);
  if (compiled.conditions.length === 0) {
    return defaultValue;
  }
  hasConditionalValues = true;
  const conditionalValue: CompiledConditionalValue = {
    default: defaultValue,
    conditions: compiled.conditions.map(condition => ({
      query: condition.query,
      value: processValue(condition.value),
    })),
  };
  return {[CONDITIONAL_VALUE_KEY]: conditionalValue};
}

function processAttributeValue(
  value: unknown,
  attributeConfig: ?AnyAttributeType,
  propKey: string,
  validAttributes: AttributeConfiguration,
): unknown {
  if (isStyleConditionValue(value, validAttributes)) {
    return processStyleConditionValue(value, attributeConfig, propKey);
  }
  return attributeConfig != null &&
    attributeConfig !== true &&
    attributeConfig.process != null
    ? attributeConfig.process(value)
    : value;
}

function defaultDiffer(prevProp: unknown, nextProp: unknown): boolean {
  if (typeof nextProp !== 'object' || nextProp === null) {
    // Scalars have already been checked for equality
    return true;
  } else {
    // For objects and arrays, the default diffing algorithm is a deep compare
    return deepDiffer(prevProp, nextProp, deepDifferOptions);
  }
}

function restoreDeletedValuesInNestedArray(
  updatePayload: {[key: string]: unknown},
  node: NestedNode,
  validAttributes: AttributeConfiguration,
) {
  if (Array.isArray(node)) {
    let i = node.length;
    while (i-- && removedKeyCount > 0) {
      restoreDeletedValuesInNestedArray(
        updatePayload,
        node[i],
        validAttributes,
      );
    }
  } else if (node && removedKeyCount > 0) {
    const obj = node;
    for (const propKey in removedKeys) {
      // $FlowFixMe[incompatible-use] removedKeys is always non-null
      if (!removedKeys[propKey]) {
        continue;
      }
      let nextProp = obj[propKey];
      if (nextProp === undefined) {
        continue;
      }

      const attributeConfig = validAttributes[propKey];
      if (!attributeConfig) {
        continue; // not a valid native prop
      }

      if (typeof nextProp === 'function') {
        nextProp = true;
      }
      if (typeof nextProp === 'undefined') {
        nextProp = null;
      }

      if (
        typeof attributeConfig !== 'object' ||
        typeof attributeConfig.diff === 'function' ||
        typeof attributeConfig.process === 'function'
      ) {
        // case: !Object | CustomAttributeConfiguration
        updatePayload[propKey] = processAttributeValue(
          nextProp,
          attributeConfig,
          propKey,
          validAttributes,
        );
      }
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      removedKeys[propKey] = false;
      removedKeyCount--;
    }
  }
}

function diffNestedArrayProperty(
  updatePayloadInput: null | {[key: string]: unknown},
  prevArray: Array<NestedNode>,
  nextArray: Array<NestedNode>,
  validAttributes: AttributeConfiguration,
): null | {[key: string]: unknown} {
  let updatePayload = updatePayloadInput;
  const minLength =
    prevArray.length < nextArray.length ? prevArray.length : nextArray.length;
  let i;
  for (i = 0; i < minLength; i++) {
    // Diff any items in the array in the forward direction. Repeated keys
    // will be overwritten by later values.
    updatePayload = diffNestedProperty(
      updatePayload,
      prevArray[i],
      nextArray[i],
      validAttributes,
    );
  }
  for (; i < prevArray.length; i++) {
    // Clear out all remaining properties.
    updatePayload = clearNestedProperty(
      updatePayload,
      prevArray[i],
      validAttributes,
    );
  }
  for (; i < nextArray.length; i++) {
    // Add all remaining properties
    const nextProp = nextArray[i];
    if (!nextProp) {
      continue;
    }
    updatePayload = addNestedProperty(updatePayload, nextProp, validAttributes);
  }
  return updatePayload;
}

function diffNestedProperty(
  updatePayload: null | {[key: string]: unknown},
  prevProp: NestedNode,
  nextProp: NestedNode,
  validAttributes: AttributeConfiguration,
): null | {[key: string]: unknown} {
  if (!updatePayload && prevProp === nextProp) {
    // If no properties have been added, then we can bail out quickly on object
    // equality.
    return updatePayload;
  }

  if (!prevProp || !nextProp) {
    if (nextProp) {
      return addNestedProperty(updatePayload, nextProp, validAttributes);
    }
    if (prevProp) {
      return clearNestedProperty(updatePayload, prevProp, validAttributes);
    }
    return updatePayload;
  }

  if (!Array.isArray(prevProp) && !Array.isArray(nextProp)) {
    // Both are leaves, we can diff the leaves.
    return diffProperties(updatePayload, prevProp, nextProp, validAttributes);
  }

  if (Array.isArray(prevProp) && Array.isArray(nextProp)) {
    // Both are arrays, we can diff the arrays.
    return diffNestedArrayProperty(
      updatePayload,
      prevProp,
      nextProp,
      validAttributes,
    );
  }

  if (Array.isArray(prevProp)) {
    return diffProperties(
      updatePayload,
      // $FlowFixMe[incompatible-type] flattenStyle is reused to flatten a nested style array here
      flattenStyle(prevProp),
      // $FlowFixMe[incompatible-type] a non-array nested node is a plain props object here
      nextProp,
      validAttributes,
    );
  }

  return diffProperties(
    updatePayload,
    prevProp,
    // $FlowFixMe[incompatible-type] flattenStyle is reused to flatten a nested style array here
    flattenStyle(nextProp),
    validAttributes,
  );
}

/**
 * clearNestedProperty takes a single set of props and valid attributes. It
 * adds a null sentinel to the updatePayload, for each prop key.
 */
function clearNestedProperty(
  updatePayloadInput: null | {[key: string]: unknown},
  prevProp: NestedNode,
  validAttributes: AttributeConfiguration,
): null | {[key: string]: unknown} {
  let updatePayload = updatePayloadInput;
  if (!prevProp) {
    return updatePayload;
  }

  if (!Array.isArray(prevProp)) {
    // Add each property of the leaf.
    return clearProperties(updatePayload, prevProp, validAttributes);
  }

  for (let i = 0; i < prevProp.length; i++) {
    // Add all the properties of the array.
    updatePayload = clearNestedProperty(
      updatePayload,
      prevProp[i],
      validAttributes,
    );
  }
  return updatePayload;
}

/**
 * diffProperties takes two sets of props and a set of valid attributes
 * and write to updatePayload the values that changed or were deleted.
 * If no updatePayload is provided, a new one is created and returned if
 * anything changed.
 */
function diffProperties(
  updatePayloadInput: null | {[key: string]: unknown},
  prevProps: {[key: string]: unknown},
  nextProps: {[key: string]: unknown},
  validAttributes: AttributeConfiguration,
): null | {[key: string]: unknown} {
  let updatePayload = updatePayloadInput;
  let attributeConfig;
  let nextProp: unknown;
  let prevProp: unknown;

  for (const propKey in nextProps) {
    attributeConfig = validAttributes[propKey];
    if (!attributeConfig) {
      continue; // not a valid native prop
    }

    prevProp = prevProps[propKey];
    nextProp = nextProps[propKey];

    if (typeof nextProp === 'function') {
      const attributeConfigHasProcess =
        typeof attributeConfig === 'object' &&
        typeof attributeConfig.process === 'function';
      if (!attributeConfigHasProcess) {
        // functions are converted to booleans as markers that the associated
        // events should be sent from native.
        nextProp = true;
        // If nextProp is not a function, then don't bother changing prevProp
        // since nextProp will win and go into the updatePayload regardless.
        if (typeof prevProp === 'function') {
          prevProp = true;
        }
      }
    }

    // An explicit value of undefined is treated as a null because it overrides
    // any other preceding value.
    if (typeof nextProp === 'undefined') {
      nextProp = null;
      if (typeof prevProp === 'undefined') {
        prevProp = null;
      }
    }

    if (removedKeys) {
      removedKeys[propKey] = false;
    }

    if (updatePayload && updatePayload[propKey] !== undefined) {
      // Something else already triggered an update to this key because another
      // value diffed. Since we're now later in the nested arrays our value is
      // more important so we need to calculate it and override the existing
      // value. It doesn't matter if nothing changed, we'll set it anyway.

      // Pattern match on: attributeConfig
      if (
        typeof attributeConfig !== 'object' ||
        typeof attributeConfig.diff === 'function' ||
        typeof attributeConfig.process === 'function'
      ) {
        // case: !Object | CustomAttributeConfiguration
        updatePayload[propKey] = processAttributeValue(
          nextProp,
          attributeConfig,
          propKey,
          validAttributes,
        );
      }
      continue;
    }

    if (prevProp === nextProp) {
      continue; // nothing changed
    }

    // Pattern match on: attributeConfig
    if (typeof attributeConfig !== 'object') {
      // case: !Object is the default case
      if (defaultDiffer(prevProp, nextProp)) {
        // a normal leaf has changed
        (updatePayload || (updatePayload = {} as {[key: string]: unknown}))[
          propKey
        ] = processAttributeValue(
          nextProp,
          attributeConfig,
          propKey,
          validAttributes,
        );
      }
    } else if (
      typeof attributeConfig.diff === 'function' ||
      typeof attributeConfig.process === 'function'
    ) {
      // case: CustomAttributeConfiguration
      // A custom `diff` does not know conditional values.
      const shouldUpdate =
        prevProp === undefined ||
        (!isStyleConditionValue(prevProp, validAttributes) &&
        !isStyleConditionValue(nextProp, validAttributes) &&
        typeof attributeConfig.diff === 'function'
          ? attributeConfig.diff(prevProp, nextProp)
          : defaultDiffer(prevProp, nextProp));
      if (shouldUpdate) {
        (updatePayload || (updatePayload = {} as {[key: string]: unknown}))[
          propKey
        ] = processAttributeValue(
          nextProp,
          attributeConfig,
          propKey,
          validAttributes,
        );
      }
    } else {
      // default: fallthrough case when nested properties are defined
      removedKeys = null;
      removedKeyCount = 0;
      // We think that attributeConfig is not CustomAttributeConfiguration at
      // this point so we assume it must be AttributeConfiguration.
      updatePayload = diffNestedProperty(
        updatePayload,
        // $FlowFixMe[incompatible-type] prop values are typed `unknown` but are nodes in this nested-config path
        prevProp,
        // $FlowFixMe[incompatible-type] prop values are typed `unknown` but are nodes in this nested-config path
        nextProp,
        // $FlowFixMe[unclear-type] AttributeConfiguration/AnyAttributeType are defined upstream with $FlowFixMe
        attributeConfig as any as AttributeConfiguration,
      );
      if (removedKeyCount > 0 && updatePayload) {
        restoreDeletedValuesInNestedArray(
          updatePayload,
          // $FlowFixMe[incompatible-type] prop values are typed `unknown` but are nodes in this nested-config path
          nextProp,
          // $FlowFixMe[unclear-type] AttributeConfiguration/AnyAttributeType are defined upstream with $FlowFixMe
          attributeConfig as any as AttributeConfiguration,
        );
        removedKeys = null;
      }
    }
  }

  // Also iterate through all the previous props to catch any that have been
  // removed and make sure native gets the signal so it can reset them to the
  // default.
  for (const propKey in prevProps) {
    if (nextProps[propKey] !== undefined) {
      continue; // we've already covered this key in the previous pass
    }
    attributeConfig = validAttributes[propKey];
    if (!attributeConfig) {
      continue; // not a valid native prop
    }

    if (updatePayload && updatePayload[propKey] !== undefined) {
      // This was already updated to a diff result earlier.
      continue;
    }

    prevProp = prevProps[propKey];
    if (prevProp === undefined) {
      continue; // was already empty anyway
    }
    // Pattern match on: attributeConfig
    if (
      typeof attributeConfig !== 'object' ||
      typeof attributeConfig.diff === 'function' ||
      typeof attributeConfig.process === 'function'
    ) {
      // case: CustomAttributeConfiguration | !Object
      // Flag the leaf property for removal by sending a sentinel.
      (updatePayload || (updatePayload = {} as {[key: string]: unknown}))[
        propKey
      ] = null;
      if (!removedKeys) {
        removedKeys = {} as {[key: string]: boolean};
      }
      if (!removedKeys[propKey]) {
        removedKeys[propKey] = true;
        removedKeyCount++;
      }
    } else {
      // default:
      // This is a nested attribute configuration where all the properties
      // were removed so we need to go through and clear out all of them.
      updatePayload = clearNestedProperty(
        updatePayload,
        // $FlowFixMe[incompatible-type] prop values are typed `unknown` but are nodes in this nested-config path
        prevProp,
        // $FlowFixMe[unclear-type] AttributeConfiguration/AnyAttributeType are defined upstream with $FlowFixMe
        attributeConfig as any as AttributeConfiguration,
      );
    }
  }
  return updatePayload;
}

function addNestedProperty(
  payloadInput: null | {[key: string]: unknown},
  props: NestedNode,
  validAttributes: AttributeConfiguration,
): null | {[key: string]: unknown} {
  let payload = payloadInput;
  // Flatten nested style props.
  if (Array.isArray(props)) {
    for (let i = 0; i < props.length; i++) {
      payload = addNestedProperty(payload, props[i], validAttributes);
    }
    return payload;
  }

  for (const propKey in props) {
    const prop = props[propKey];

    const attributeType = validAttributes[propKey];
    const attributeConfig =
      // $FlowFixMe[unclear-type] AttributeConfiguration/AnyAttributeType are defined upstream with $FlowFixMe
      attributeType as any as AttributeConfiguration;

    if (attributeConfig == null) {
      continue;
    }

    let newValue;

    if (prop === undefined) {
      // Discard the prop if it was previously defined.
      if (payload && payload[propKey] !== undefined) {
        newValue = null;
      } else {
        continue;
      }
    } else if (typeof attributeConfig === 'object') {
      if (
        typeof attributeConfig.process === 'function' ||
        typeof attributeConfig.diff === 'function'
      ) {
        // An atomic prop with custom processing or diffing. We don't need to
        // do diffing when adding props.
        newValue = processAttributeValue(
          prop,
          attributeType,
          propKey,
          validAttributes,
        );
      }
    } else {
      if (typeof prop === 'function') {
        // A function prop. It represents an event handler. Pass it to native as 'true'.
        newValue = true;
      } else {
        // An atomic prop. Doesn't need to be flattened.
        newValue = processAttributeValue(
          prop,
          attributeType,
          propKey,
          validAttributes,
        );
      }
    }

    if (newValue !== undefined) {
      if (!payload) {
        payload = {} as {[key: string]: unknown};
      }
      payload[propKey] = newValue;
      continue;
    }

    payload = addNestedProperty(
      payload,
      // $FlowFixMe[incompatible-type] prop values are typed `unknown` but are nodes here
      prop,
      attributeConfig,
    );
  }

  return payload;
}

/**
 * clearProperties clears all the previous props by adding a null sentinel
 * to the payload for each valid key.
 */
function clearProperties(
  updatePayload: null | {[key: string]: unknown},
  prevProps: {[key: string]: unknown},
  validAttributes: AttributeConfiguration,
): null | {[key: string]: unknown} {
  return diffProperties(updatePayload, prevProps, emptyObject, validAttributes);
}

// A later plain value can replace the conditional value, so the flag can be
// set without one. Native handles that.
function markConditionalValues(
  payload: null | {[key: string]: unknown},
): null | {[key: string]: unknown} {
  if (hasConditionalValues && payload != null) {
    payload[HAS_CONDITIONAL_VALUES_KEY] = true;
  }
  return payload;
}

export function create(
  props: NestedNode,
  validAttributes: AttributeConfiguration,
): null | {[key: string]: unknown} {
  hasConditionalValues = false;
  return markConditionalValues(addNestedProperty(null, props, validAttributes));
}

export function diff(
  prevProps: {[key: string]: unknown},
  nextProps: {[key: string]: unknown},
  validAttributes: AttributeConfiguration,
): null | {[key: string]: unknown} {
  hasConditionalValues = false;
  return markConditionalValues(
    diffProperties(
      null, // updatePayload
      prevProps,
      nextProps,
      validAttributes,
    ),
  );
}
