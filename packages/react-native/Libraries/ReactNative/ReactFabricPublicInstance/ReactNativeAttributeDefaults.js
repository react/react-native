/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

type Payload = {[key: string]: unknown};

// View configs are immutable. Avoid walking their attributes on every mount.
const defaultValuesCache = new WeakMap<{...}, Payload | null>();

/** Collects final default payloads, including defaults inside flattened props. */
export default function getDefaultValues(validAttributes: {
  ...
}): Payload | null {
  const cached = defaultValuesCache.get(validAttributes);
  if (cached !== undefined) {
    return cached;
  }

  let defaults: Payload | null = null;
  for (const [propName, attributeConfig] of Object.entries(validAttributes)) {
    if (attributeConfig == null || typeof attributeConfig !== 'object') {
      continue;
    }

    if (
      'defaultValue' in attributeConfig &&
      Object.hasOwn(attributeConfig, 'defaultValue')
    ) {
      if (defaults == null) {
        const emptyPayload: Payload = {};
        defaults = emptyPayload;
      }
      defaults[propName] = attributeConfig.defaultValue;
    } else if (
      !Object.hasOwn(attributeConfig, 'resetValue') &&
      !(
        'diff' in attributeConfig && typeof attributeConfig.diff === 'function'
      ) &&
      !(
        'process' in attributeConfig &&
        typeof attributeConfig.process === 'function'
      )
    ) {
      const nestedDefaults = getDefaultValues(attributeConfig);
      if (nestedDefaults != null) {
        defaults = {...defaults, ...nestedDefaults};
      }
    }
  }

  defaultValuesCache.set(validAttributes, defaults);
  return defaults;
}
