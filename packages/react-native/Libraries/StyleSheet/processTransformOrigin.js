/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import invariant from 'invariant';

// Pre-compiled regex pattern for performance - avoids regex compilation on each call
const TRANSFORM_ORIGIN_REGEX = /(top|bottom|left|right|center|\d+(?:%|px)|0)/gi;

const INDEX_X = 0;
const INDEX_Y = 1;
const INDEX_Z = 2;

/* eslint-disable no-labels */
export default function processTransformOrigin(
  transformOrigin: Array<string | number> | string,
): Array<string | number> {
  if (typeof transformOrigin === 'string') {
    const transformOriginString = transformOrigin;
    TRANSFORM_ORIGIN_REGEX.lastIndex = 0;
    const transformOriginArray: Array<string | number> = ['50%', '50%', 0];

    let index = INDEX_X;
    let matches;
    outer: while (
      (matches = TRANSFORM_ORIGIN_REGEX.exec(transformOriginString))
    ) {
      let nextIndex = index + 1;

      const value = matches[0];
      const valueLower = value.toLowerCase();

      switch (valueLower) {
        case 'left':
        case 'right': {
          invariant(
            index === INDEX_X,
            'Transform-origin %s can only be used for x-position',
            value,
          );
          transformOriginArray[INDEX_X] = valueLower === 'left' ? 0 : '100%';
          break;
        }
        case 'top':
        case 'bottom': {
          invariant(
            index !== INDEX_Z,
            'Transform-origin %s can only be used for y-position',
            value,
          );
          transformOriginArray[INDEX_Y] = valueLower === 'top' ? 0 : '100%';

          // Handle [[ center | left | right ] && [ center | top | bottom ]] <length>?
          if (index === INDEX_X) {
            const horizontal = TRANSFORM_ORIGIN_REGEX.exec(
              transformOriginString,
            );
            if (horizontal == null) {
              break outer;
            }

            switch (horizontal[0].toLowerCase()) {
              case 'left':
                transformOriginArray[INDEX_X] = 0;
                break;
              case 'right':
                transformOriginArray[INDEX_X] = '100%';
                break;
              case 'center':
                transformOriginArray[INDEX_X] = '50%';
                break;
              default:
                invariant(
                  false,
                  'Could not parse transform-origin: %s',
                  transformOriginString,
                );
            }
            nextIndex = INDEX_Z;
          }

          break;
        }
        case 'center': {
          invariant(
            index !== INDEX_Z,
            'Transform-origin value %s cannot be used for z-position',
            value,
          );
          transformOriginArray[index] = '50%';
          break;
        }
        default: {
          if (value.endsWith('%')) {
            transformOriginArray[index] = value;
          } else {
            transformOriginArray[index] = parseFloat(value); // Remove `px`
          }
          break;
        }
      }

      index = nextIndex;
    }

    transformOrigin = transformOriginArray;
  }

  if (__DEV__) {
    _validateTransformOrigin(transformOrigin);
  }

  return transformOrigin;
}

function _validateTransformOrigin(transformOrigin: Array<string | number>) {
  invariant(
    transformOrigin.length === 3,
    'Transform origin must have exactly 3 values.',
  );
  const [x, y, z] = transformOrigin;
  invariant(
    typeof x === 'number' || (typeof x === 'string' && x.endsWith('%')),
    'Transform origin x-position must be a number. Passed value: %s.',
    x,
  );
  invariant(
    typeof y === 'number' || (typeof y === 'string' && y.endsWith('%')),
    'Transform origin y-position must be a number. Passed value: %s.',
    y,
  );
  invariant(
    typeof z === 'number',
    'Transform origin z-position must be a number. Passed value: %s.',
    z,
  );
}
