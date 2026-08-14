/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {____FontVariationSettings_Internal} from './StyleSheetTypes';

function quoteAxis(axis: string): string {
  if (
    axis.length !== 4 ||
    axis.split('').some(character => {
      const code = character.charCodeAt(0);
      return code < 0x20 || code > 0x7e;
    })
  ) {
    throw new Error(
      `Font variation axis tags must be exactly four printable ASCII characters: ${JSON.stringify(axis)}`,
    );
  }

  if (!axis.includes("'")) {
    return `'${axis}'`;
  }
  if (!axis.includes('"')) {
    return `"${axis}"`;
  }

  throw new Error(
    `Font variation axis tags containing both quote characters must use the string form: ${JSON.stringify(axis)}`,
  );
}

function processFontVariationSettings(
  settings: ____FontVariationSettings_Internal,
): string {
  if (typeof settings === 'string') {
    return settings;
  }

  return Object.keys(settings)
    .sort()
    .map(axis => {
      const value = settings[axis];
      if (!Number.isFinite(value)) {
        throw new Error(
          `Font variation axis values must be finite numbers: ${String(value)}`,
        );
      }
      return `${quoteAxis(axis)} ${String(value)}`;
    })
    .join(', ');
}

export default processFontVariationSettings;
