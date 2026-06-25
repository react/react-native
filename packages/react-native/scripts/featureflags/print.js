/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {CommonFeatureFlagList} from './types';

import featureFlagDefinitions from './ReactNativeFeatureFlags.config';

function limitLength(str: string, maxLength: number): string {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + '...';
  }
  return str;
}

const DESC_MAX_LENGTH = 100;

const PURPOSE_ORDER = ['🔨', '🚀', '🧪'];

function getPurposeString(purpose: string): string {
  switch (purpose) {
    case 'operational':
      return '🔨';
    case 'experimentation':
      return '🧪';
    case 'release':
      return '🚀';
    default:
      return '🤷‍♂️';
  }
}

function compareFeatureFlags(
  [keyA, valueA]: Readonly<[string, Readonly<{Purpose: string, ...}>]>,
  [keyB, valueB]: Readonly<[string, Readonly<{Purpose: string, ...}>]>,
): number {
  const purposeA = PURPOSE_ORDER.indexOf(valueA.Purpose);
  const purposeB = PURPOSE_ORDER.indexOf(valueB.Purpose);
  if (purposeA !== purposeB) {
    return purposeA - purposeB;
  }
  return keyA.localeCompare(keyB);
}

export default function print(json: boolean): void {
  if (json) {
    console.log(JSON.stringify(featureFlagDefinitions));
    return;
  }

  const featureFlags = Object.fromEntries(
    [
      ...Object.entries(featureFlagDefinitions.common).map(([key, value]) => [
        key,
        {
          Description: limitLength(value.metadata.description, DESC_MAX_LENGTH),
          Purpose: getPurposeString(value.metadata.purpose),
          'Date added': value.metadata.dateAdded,
        },
      ]),
      ...Object.entries(featureFlagDefinitions.jsOnly).map(([key, value]) => [
        key,
        {
          Description: limitLength(value.metadata.description, DESC_MAX_LENGTH),
          Purpose: getPurposeString(value.metadata.purpose),
          'Date added': value.metadata.dateAdded,
        },
      ]),
    ].sort(compareFeatureFlags),
  );
  console.table(featureFlags);

  const allFeatureFlags = {
    ...featureFlagDefinitions.common,
    ...(featureFlagDefinitions.jsOnly as CommonFeatureFlagList),
  };

  console.log('Summary');
  console.table({
    Total: Object.keys(featureFlags).length,
    Common: Object.keys(featureFlagDefinitions.common).length,
    'JS Only': Object.keys(featureFlagDefinitions.jsOnly).length,
    Operational: Object.entries(allFeatureFlags).filter(
      ([key, value]) => value.metadata.purpose === 'operational',
    ).length,
    Release: Object.entries(allFeatureFlags).filter(
      ([key, value]) => value.metadata.purpose === 'release',
    ).length,
    Experimentation: Object.entries(allFeatureFlags).filter(
      ([key, value]) => value.metadata.purpose === 'experimentation',
    ).length,
  });
}
