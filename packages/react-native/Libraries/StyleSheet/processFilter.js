/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format strict-local
 */

'use strict';

import type {ColorValue} from './StyleSheet';
import type {DropShadowValue, FilterFunction} from './StyleSheetTypes';

import processColor from './processColor';

// Pre-compiled regex patterns for performance - avoids regex compilation on each call
const NEWLINE_REGEX = /\n/g;
const FILTER_FUNCTION_REGEX =
  /([\w-]+)\(([^()]*|\([^()]*\)|[^()]*\([^()]*\)[^()]*)\)/g;
const ARGS_WITH_UNITS_REGEX = /([+-]?\d*(\.\d+)?)([a-zA-Z%]+)?/g;
const WHITESPACE_SPLIT_REGEX = /\s+(?![^(]*\))/;
const LENGTH_PARSE_REGEX = /([+-]?\d*(\.\d+)?)([\w\W]+)?/g;

type ParsedFilter =
  | {brightness: number}
  | {blur: number}
  | {contrast: number}
  | {grayscale: number}
  | {hueRotate: number}
  | {invert: number}
  | {opacity: number}
  | {saturate: number}
  | {sepia: number}
  | {dropShadow: ParsedDropShadow};

type ParsedDropShadow = {
  offsetX: number,
  offsetY: number,
  standardDeviation?: number,
  color?: ColorValue,
};

export default function processFilter(
  filter: ?(ReadonlyArray<FilterFunction> | string),
): ReadonlyArray<ParsedFilter> {
  let result: Array<ParsedFilter> = [];
  if (filter == null) {
    return result;
  }

  if (typeof filter === 'string') {
    filter = filter.replace(NEWLINE_REGEX, ' ');

    // matches on functions with args and nested functions like "drop-shadow(10 10 10 rgba(0, 0, 0, 1))"
    FILTER_FUNCTION_REGEX.lastIndex = 0;
    let matches;

    while ((matches = FILTER_FUNCTION_REGEX.exec(filter))) {
      let filterName = matches[1].toLowerCase();
      if (filterName === 'drop-shadow') {
        const dropShadow = parseDropShadow(matches[2]);
        if (dropShadow != null) {
          result.push({dropShadow});
        } else {
          return [];
        }
      } else {
        const camelizedName =
          filterName === 'drop-shadow'
            ? 'dropShadow'
            : filterName === 'hue-rotate'
              ? 'hueRotate'
              : filterName;
        const amount = _getFilterAmount(camelizedName, matches[2]);

        if (amount != null) {
          const filterFunction = {};
          // $FlowFixMe[prop-missing] The key will be the correct one but flow can't see that.
          filterFunction[camelizedName] = amount;
          // $FlowFixMe[incompatible-type] The key will be the correct one but flow can't see that.
          result.push(filterFunction);
        } else {
          // If any primitive is invalid then apply none of the filters. This is how
          // web works and makes it clear that something is wrong becuase no
          // graphical effects are happening.
          return [];
        }
      }
    }
  } else if (Array.isArray(filter)) {
    for (const filterFunction of filter) {
      const [filterName, filterValue] = Object.entries(filterFunction)[0];
      if (filterName === 'dropShadow') {
        // $FlowFixMe[incompatible-type]
        const dropShadow = parseDropShadow(filterValue);
        if (dropShadow == null) {
          return [];
        }
        result.push({dropShadow});
      } else {
        const amount = _getFilterAmount(filterName, filterValue);

        if (amount != null) {
          const resultObject = {};
          // $FlowFixMe[prop-missing]
          resultObject[filterName] = amount;
          // $FlowFixMe[incompatible-type]
          result.push(resultObject);
        } else {
          // If any primitive is invalid then apply none of the filters. This is how
          // web works and makes it clear that something is wrong becuase no
          // graphical effects are happening.
          return [];
        }
      }
    }
  } else {
    throw new TypeError(`${typeof filter} filter is not a string or array`);
  }

  return result;
}

function _getFilterAmount(filterName: string, filterArgs: unknown): ?number {
  let filterArgAsNumber: number;
  let unit: string;
  if (typeof filterArgs === 'string') {
    // matches on args with units like "1.5 5% -80deg"
    ARGS_WITH_UNITS_REGEX.lastIndex = 0;
    const match = ARGS_WITH_UNITS_REGEX.exec(filterArgs);

    if (!match || isNaN(Number(match[1]))) {
      return undefined;
    }

    filterArgAsNumber = Number(match[1]);
    unit = match[3];
  } else if (typeof filterArgs === 'number') {
    filterArgAsNumber = filterArgs;
  } else {
    return undefined;
  }

  switch (filterName) {
    // Hue rotate takes some angle that can have a unit and can be
    // negative. Additionally, 0 with no unit is allowed.
    case 'hueRotate':
      if (filterArgAsNumber === 0) {
        return 0;
      }
      if (unit !== 'deg' && unit !== 'rad') {
        return undefined;
      }
      return unit === 'rad'
        ? (180 * filterArgAsNumber) / Math.PI
        : filterArgAsNumber;
    // blur takes any positive CSS length that is not a percent. In RN
    // we currently only have DIPs, so we are not parsing units here.
    case 'blur':
      if ((unit && unit !== 'px') || filterArgAsNumber < 0) {
        return undefined;
      }
      return filterArgAsNumber;
    // All other filters except take a non negative number or percentage. There
    // are no units associated with this value and percentage numbers map 1-to-1
    // to a non-percentage number (e.g. 50% == 0.5).
    case 'brightness':
    case 'contrast':
    case 'grayscale':
    case 'invert':
    case 'opacity':
    case 'saturate':
    case 'sepia':
      if ((unit && unit !== '%' && unit !== 'px') || filterArgAsNumber < 0) {
        return undefined;
      }
      if (unit === '%') {
        filterArgAsNumber /= 100;
      }
      return filterArgAsNumber;
    default:
      return undefined;
  }
}

function parseDropShadow(
  rawDropShadow: string | DropShadowValue,
): ?ParsedDropShadow {
  const dropShadow =
    typeof rawDropShadow === 'string'
      ? parseDropShadowString(rawDropShadow)
      : rawDropShadow;

  const parsedDropShadow: ParsedDropShadow = {
    offsetX: 0,
    offsetY: 0,
  };
  let offsetX: number;
  let offsetY: number;

  for (const arg in dropShadow) {
    let value;
    switch (arg) {
      case 'offsetX':
        value =
          typeof dropShadow.offsetX === 'string'
            ? parseLength(dropShadow.offsetX)
            : dropShadow.offsetX;
        if (value == null) {
          return null;
        }
        offsetX = value;
        break;
      case 'offsetY':
        value =
          typeof dropShadow.offsetY === 'string'
            ? parseLength(dropShadow.offsetY)
            : dropShadow.offsetY;
        if (value == null) {
          return null;
        }
        offsetY = value;
        break;
      case 'standardDeviation':
        value =
          typeof dropShadow.standardDeviation === 'string'
            ? parseLength(dropShadow.standardDeviation)
            : dropShadow.standardDeviation;
        if (value == null || value < 0) {
          return null;
        }
        parsedDropShadow.standardDeviation = value;
        break;
      case 'color':
        const color = processColor(dropShadow.color);
        if (color == null) {
          return null;
        }
        parsedDropShadow.color = color;
        break;
      default:
        return null;
    }
  }

  if (offsetX == null || offsetY == null) {
    return null;
  }

  parsedDropShadow.offsetX = offsetX;
  parsedDropShadow.offsetY = offsetY;

  return parsedDropShadow;
}

function parseDropShadowString(rawDropShadow: string): ?DropShadowValue {
  const dropShadow: DropShadowValue = {
    offsetX: 0,
    offsetY: 0,
  };
  let offsetX: string;
  let offsetY: string;
  let lengthCount = 0;
  let keywordDetectedAfterLength = false;

  // split args by all whitespaces that are not in parenthesis
  for (const arg of rawDropShadow.split(WHITESPACE_SPLIT_REGEX)) {
    const processedColor = processColor(arg);
    if (processedColor != null) {
      if (dropShadow.color != null) {
        return null;
      }
      if (offsetX != null) {
        keywordDetectedAfterLength = true;
      }
      dropShadow.color = arg;
      continue;
    }

    switch (lengthCount) {
      case 0:
        offsetX = arg;
        lengthCount++;
        break;
      case 1:
        if (keywordDetectedAfterLength) {
          return null;
        }
        offsetY = arg;
        lengthCount++;
        break;
      case 2:
        if (keywordDetectedAfterLength) {
          return null;
        }
        dropShadow.standardDeviation = arg;
        lengthCount++;
        break;
      default:
        return null;
    }
  }
  if (offsetX == null || offsetY == null) {
    return null;
  }

  dropShadow.offsetX = offsetX;
  dropShadow.offsetY = offsetY;
  return dropShadow;
}

function parseLength(length: string): ?number {
  // matches on args with units like "1.5 5% -80deg"
  LENGTH_PARSE_REGEX.lastIndex = 0;
  const match = LENGTH_PARSE_REGEX.exec(length);

  if (!match || Number.isNaN(match[1])) {
    return null;
  }

  if (match[3] != null && match[3] !== 'px') {
    return null;
  }

  if (match[3] == null && match[1] !== '0') {
    return null;
  }

  return Number(match[1]);
}
