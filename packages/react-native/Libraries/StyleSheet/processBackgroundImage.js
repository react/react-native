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

import type {ProcessedColorValue} from './processColor';
import type {
  BackgroundImageValue,
  RadialGradientPosition,
  RadialGradientShape,
  RadialGradientSize,
} from './StyleSheetTypes';

const processColor = require('./processColor').default;

// Pre-compiled regex patterns for performance - avoids regex compilation on each call
const NEWLINE_REGEX = /\n/g;
const GRADIENT_REGEX = /^(linear|radial)-gradient\(((?:\([^)]*\)|[^()])*)\)/;
const COMMA_SPLIT_REGEX = /,(?![^(]*\))/;
const WHITESPACE_SPLIT_REGEX = /\s+/;
const COLOR_STOP_PARTS_REGEX = /\S+\([^)]*\)|\S+/g;
const WHITESPACE_NORMALIZE_REGEX = /\s+/g;

// Linear Gradient
const LINEAR_GRADIENT_DIRECTION_REGEX =
  /^to\s+(?:top|bottom|left|right)(?:\s+(?:top|bottom|left|right))?/i;
const LINEAR_GRADIENT_ANGLE_UNIT_REGEX =
  /^([+-]?\d*\.?\d+)(deg|grad|rad|turn)$/i;
const LINEAR_GRADIENT_DEFAULT_DIRECTION: LinearGradientDirection = {
  type: 'angle',
  value: 180,
};

type LinearGradientDirection =
  | {type: 'angle', value: number}
  | {type: 'keyword', value: string};

type LinearGradientBackgroundImage = {
  type: 'linear-gradient',
  direction: LinearGradientDirection,
  colorStops: ReadonlyArray<{
    color: ColorStopColor,
    position: ColorStopPosition,
  }>,
};

// Radial Gradient
const DEFAULT_RADIAL_SHAPE = 'ellipse';
const DEFAULT_RADIAL_SIZE = 'farthest-corner';
// center
const DEFAULT_RADIAL_POSITION: RadialGradientPosition = {
  top: '50%',
  left: '50%',
};

type RadialGradientBackgroundImage = {
  type: 'radial-gradient',
  shape: RadialGradientShape,
  size: RadialGradientSize,
  position: RadialGradientPosition,
  colorStops: ReadonlyArray<{
    color: ColorStopColor,
    position: ColorStopPosition,
  }>,
};

// null color indicate that the transition hint syntax is used. e.g. red, 20%, blue
type ColorStopColor = ProcessedColorValue | null;
// percentage or pixel value
type ColorStopPosition = number | string | null;

type ParsedBackgroundImageValue =
  | LinearGradientBackgroundImage
  | RadialGradientBackgroundImage;

export default function processBackgroundImage(
  backgroundImage: ?(ReadonlyArray<BackgroundImageValue> | string),
): ReadonlyArray<ParsedBackgroundImageValue> {
  let result: ReadonlyArray<ParsedBackgroundImageValue> = [];
  if (backgroundImage == null) {
    return result;
  }

  if (typeof backgroundImage === 'string') {
    result = parseBackgroundImageCSSString(
      backgroundImage.replace(NEWLINE_REGEX, ' '),
    );
  } else if (Array.isArray(backgroundImage)) {
    for (const bgImage of backgroundImage) {
      const processedColorStops = processColorStops(bgImage);
      if (processedColorStops == null) {
        // If a color stop is invalid, return an empty array and do not apply any gradient. Same as web.
        return [];
      }

      if (bgImage.type === 'linear-gradient') {
        let direction: LinearGradientDirection =
          LINEAR_GRADIENT_DEFAULT_DIRECTION;
        const bgDirection =
          bgImage.direction != null ? bgImage.direction.toLowerCase() : null;

        if (bgDirection != null) {
          if (LINEAR_GRADIENT_ANGLE_UNIT_REGEX.test(bgDirection)) {
            const parsedAngle = getAngleInDegrees(bgDirection);
            if (parsedAngle != null) {
              direction = {
                type: 'angle',
                value: parsedAngle,
              };
            } else {
              // If an angle is invalid, return an empty array and do not apply any gradient. Same as web.
              return [];
            }
          } else if (LINEAR_GRADIENT_DIRECTION_REGEX.test(bgDirection)) {
            const parsedDirection = getDirectionForKeyword(bgDirection);
            if (parsedDirection != null) {
              direction = parsedDirection;
            } else {
              // If a direction is invalid, return an empty array and do not apply any gradient. Same as web.
              return [];
            }
          } else {
            // If a direction is invalid, return an empty array and do not apply any gradient. Same as web.
            return [];
          }
        }

        result = result.concat({
          type: 'linear-gradient',
          direction,
          colorStops: processedColorStops,
        });
      } else if (bgImage.type === 'radial-gradient') {
        let shape: RadialGradientShape = DEFAULT_RADIAL_SHAPE;
        let size: RadialGradientSize = DEFAULT_RADIAL_SIZE;
        let position: RadialGradientPosition = {...DEFAULT_RADIAL_POSITION};

        if (bgImage.shape != null) {
          if (bgImage.shape === 'circle' || bgImage.shape === 'ellipse') {
            shape = bgImage.shape;
          } else {
            // If the shape is invalid, return an empty array and do not apply any gradient. Same as web.
            return [];
          }
        }

        if (bgImage.size != null) {
          if (
            typeof bgImage.size === 'string' &&
            (bgImage.size === 'closest-side' ||
              bgImage.size === 'closest-corner' ||
              bgImage.size === 'farthest-side' ||
              bgImage.size === 'farthest-corner')
          ) {
            size = bgImage.size;
          } else if (
            typeof bgImage.size === 'object' &&
            bgImage.size.x != null &&
            bgImage.size.y != null
          ) {
            size = {
              x: bgImage.size.x,
              y: bgImage.size.y,
            };
          } else {
            // If the size is invalid, return an empty array and do not apply any gradient. Same as web.
            return [];
          }
        }

        if (bgImage.position != null) {
          position = bgImage.position;
        }

        result = result.concat({
          type: 'radial-gradient',
          shape,
          size,
          position,
          colorStops: processedColorStops,
        });
      }
    }
  }

  return result;
}

function processColorStops(bgImage: BackgroundImageValue): ReadonlyArray<{
  color: ColorStopColor,
  position: ColorStopPosition,
}> | null {
  const processedColorStops: Array<{
    color: ColorStopColor,
    position: ColorStopPosition,
  }> = [];

  for (let index = 0; index < bgImage.colorStops.length; index++) {
    const colorStop = bgImage.colorStops[index];
    const positions = colorStop.positions;
    // Color transition hint syntax (red, 20%, blue)
    if (
      colorStop.color == null &&
      Array.isArray(positions) &&
      positions.length === 1
    ) {
      const position = positions[0];
      if (
        typeof position === 'number' ||
        (typeof position === 'string' && position.endsWith('%'))
      ) {
        processedColorStops.push({
          color: null,
          position,
        });
      } else {
        // If a position is invalid, return null and do not apply gradient. Same as web.
        return null;
      }
    } else {
      const processedColor = processColor(colorStop.color);
      if (processedColor == null) {
        // If a color is invalid, return null and do not apply gradient. Same as web.
        return null;
      }
      if (positions != null && positions.length > 0) {
        for (const position of positions) {
          if (
            typeof position === 'number' ||
            (typeof position === 'string' && position.endsWith('%'))
          ) {
            processedColorStops.push({
              color: processedColor,
              position,
            });
          } else {
            // If a position is invalid, return null and do not apply gradient. Same as web.
            return null;
          }
        }
      } else {
        processedColorStops.push({
          color: processedColor,
          position: null,
        });
      }
    }
  }

  return processedColorStops;
}

function parseBackgroundImageCSSString(
  cssString: string,
): ReadonlyArray<ParsedBackgroundImageValue> {
  const gradients = [];
  const bgImageStrings = splitGradients(cssString);

  for (const bgImageString of bgImageStrings) {
    const bgImage = bgImageString.toLowerCase();
    const match = GRADIENT_REGEX.exec(bgImage);
    if (match) {
      const [, type, gradientContent] = match;
      const isRadial = type.toLowerCase() === 'radial';
      const gradient = isRadial
        ? parseRadialGradientCSSString(gradientContent)
        : parseLinearGradientCSSString(gradientContent);

      if (gradient != null) {
        gradients.push(gradient);
      }
    }
  }
  return gradients;
}

function parseRadialGradientCSSString(
  gradientContent: string,
): RadialGradientBackgroundImage | null {
  let shape: RadialGradientShape = DEFAULT_RADIAL_SHAPE;
  let size: RadialGradientSize = DEFAULT_RADIAL_SIZE;
  let position: RadialGradientPosition = {...DEFAULT_RADIAL_POSITION};

  // split the content by commas, but not if inside parentheses (for color values)
  const parts = gradientContent.split(COMMA_SPLIT_REGEX);
  // first part may contain shape, size, and position
  // [ <radial-shape> || <radial-size> ]? [ at <position> ]?
  const firstPartStr = parts[0].trim();
  const remainingParts = [...parts];
  let hasShapeSizeOrPositionString = false;
  let hasExplicitSingleSize = false;
  let hasExplicitShape = false;
  const firstPartTokens = firstPartStr.split(WHITESPACE_SPLIT_REGEX);

  // firstPartTokens is the shape, size, and position
  while (firstPartTokens.length > 0) {
    let token = firstPartTokens.shift();
    if (token == null) {
      continue;
    }
    let tokenTrimmed = token.toLowerCase().trim();

    if (tokenTrimmed === 'circle' || tokenTrimmed === 'ellipse') {
      shape = tokenTrimmed === 'circle' ? 'circle' : 'ellipse';
      hasShapeSizeOrPositionString = true;
      hasExplicitShape = true;
    } else if (
      tokenTrimmed === 'closest-corner' ||
      tokenTrimmed === 'farthest-corner' ||
      tokenTrimmed === 'closest-side' ||
      tokenTrimmed === 'farthest-side'
    ) {
      size = tokenTrimmed;
      hasShapeSizeOrPositionString = true;
    } else if (tokenTrimmed.endsWith('px') || tokenTrimmed.endsWith('%')) {
      let sizeX = getPositionFromCSSValue(tokenTrimmed);
      if (sizeX == null) {
        // If a size is invalid, return null and do not apply any gradient. Same as web.
        return null;
      }
      if (typeof sizeX === 'number' && sizeX < 0) {
        // If a size is invalid, return null and do not apply any gradient. Same as web.
        return null;
      }
      hasShapeSizeOrPositionString = true;
      size = {x: sizeX, y: sizeX};
      token = firstPartTokens.shift();
      if (token == null) {
        hasExplicitSingleSize = true;
        continue;
      }
      tokenTrimmed = token.toLowerCase().trim();
      if (tokenTrimmed.endsWith('px') || tokenTrimmed.endsWith('%')) {
        const sizeY = getPositionFromCSSValue(tokenTrimmed);
        if (sizeY == null) {
          // If a size is invalid, return null and do not apply any gradient. Same as web.
          return null;
        }
        if (typeof sizeY === 'number' && sizeY < 0) {
          // If a size is invalid, return null and do not apply any gradient. Same as web.
          return null;
        }
        size = {x: sizeX, y: sizeY};
      } else {
        hasExplicitSingleSize = true;
      }
    } else if (tokenTrimmed === 'at') {
      let top: string | number;
      let left: string | number;
      let right: string | number;
      let bottom: string | number;
      hasShapeSizeOrPositionString = true;

      if (firstPartTokens.length === 0) {
        // If 'at' is not followed by a position, return null and do not apply any gradient. Same as web.
        return null;
      }

      // 1. [ left | center | right | top | bottom | <length-percentage> ]
      if (firstPartTokens.length === 1) {
        token = firstPartTokens.shift();
        if (token == null) {
          // If 'at' is not followed by a position, return null and do not apply any gradient. Same as web.
          return null;
        }
        tokenTrimmed = token.toLowerCase().trim();
        if (tokenTrimmed === 'left') {
          left = '0%';
          top = '50%';
        } else if (tokenTrimmed === 'center') {
          left = '50%';
          top = '50%';
        } else if (tokenTrimmed === 'right') {
          left = '100%';
          top = '50%';
        } else if (tokenTrimmed === 'top') {
          left = '50%';
          top = '0%';
        } else if (tokenTrimmed === 'bottom') {
          left = '50%';
          top = '100%';
        } else if (tokenTrimmed.endsWith('px') || tokenTrimmed.endsWith('%')) {
          const value = getPositionFromCSSValue(tokenTrimmed);
          if (value == null) {
            // If a position is invalid, return null and do not apply any gradient. Same as web.
            return null;
          }
          left = value;
          top = '50%';
        }
      }

      if (firstPartTokens.length === 2) {
        const t1 = firstPartTokens.shift();
        const t2 = firstPartTokens.shift();
        if (t1 == null || t2 == null) {
          // If a position is invalid, return null and do not apply any gradient. Same as web.
          return null;
        }

        const token1 = t1.toLowerCase().trim();
        const token2 = t2.toLowerCase().trim();

        // 2. [ left | center | right ] && [ top | center | bottom ]
        const horizontalPositions = ['left', 'center', 'right'];
        const verticalPositions = ['top', 'center', 'bottom'];

        if (
          horizontalPositions.includes(token1) &&
          verticalPositions.includes(token2)
        ) {
          left =
            token1 === 'left' ? '0%' : token1 === 'center' ? '50%' : '100%';
          top = token2 === 'top' ? '0%' : token2 === 'center' ? '50%' : '100%';
        } else if (
          verticalPositions.includes(token1) &&
          horizontalPositions.includes(token2)
        ) {
          left =
            token2 === 'left' ? '0%' : token2 === 'center' ? '50%' : '100%';
          top = token1 === 'top' ? '0%' : token1 === 'center' ? '50%' : '100%';
        }
        // 3. [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]
        else {
          if (token1 === 'left') {
            left = '0%';
          } else if (token1 === 'center') {
            left = '50%';
          } else if (token1 === 'right') {
            left = '100%';
          } else if (token1.endsWith('px') || token1.endsWith('%')) {
            const value = getPositionFromCSSValue(token1);
            if (value == null) {
              // If a position is invalid, return null and do not apply any gradient. Same as web.
              return null;
            }
            left = value;
          } else {
            // If a position is invalid, return null and do not apply any gradient. Same as web.
            return null;
          }

          if (token2 === 'top') {
            top = '0%';
          } else if (token2 === 'center') {
            top = '50%';
          } else if (token2 === 'bottom') {
            top = '100%';
          } else if (token2.endsWith('px') || token2.endsWith('%')) {
            const value = getPositionFromCSSValue(token2);
            if (value == null) {
              // If a position is invalid, return null and do not apply any gradient. Same as web.
              return null;
            }
            top = value;
          } else {
            // If a position is invalid, return null and do not apply any gradient. Same as web.
            return null;
          }
        }
      }

      // 4. [ [ left | right ] <length-percentage> ] && [ [ top | bottom ] <length-percentage> ]
      if (firstPartTokens.length === 4) {
        const t1 = firstPartTokens.shift();
        const t2 = firstPartTokens.shift();
        const t3 = firstPartTokens.shift();
        const t4 = firstPartTokens.shift();

        if (t1 == null || t2 == null || t3 == null || t4 == null) {
          // If a position is invalid, return null and do not apply any gradient. Same as web.
          return null;
        }
        const token1 = t1.toLowerCase().trim();
        const token2 = t2.toLowerCase().trim();
        const token3 = t3.toLowerCase().trim();
        const token4 = t4.toLowerCase().trim();
        const keyword1 = token1;
        const value1 = getPositionFromCSSValue(token2);
        const keyword2 = token3;
        const value2 = getPositionFromCSSValue(token4);
        if (value1 == null || value2 == null) {
          // If a position is invalid, return null and do not apply any gradient. Same as web.
          return null;
        }

        if (keyword1 === 'left') {
          left = value1;
        } else if (keyword1 === 'right') {
          right = value1;
        } else if (keyword1 === 'top') {
          top = value1;
        } else if (keyword1 === 'bottom') {
          bottom = value1;
        } else {
          // If a position is invalid, return null and do not apply any gradient. Same as web.
          return null;
        }

        if (keyword2 === 'left') {
          left = value2;
        } else if (keyword2 === 'right') {
          right = value2;
        } else if (keyword2 === 'top') {
          top = value2;
        } else if (keyword2 === 'bottom') {
          bottom = value2;
        } else {
          // If a position is invalid, return null and do not apply any gradient. Same as web.
          return null;
        }
      }

      if (top != null && left != null) {
        position = {
          top,
          left,
        };
      } else if (bottom != null && right != null) {
        position = {
          bottom,
          right,
        };
      } else if (top != null && right != null) {
        position = {
          top,
          right,
        };
      } else if (bottom != null && left != null) {
        position = {
          bottom,
          left,
        };
      } else {
        // If a position is invalid, return null and do not apply any gradient. Same as web.
        return null;
      }
      // 'at' comes at the end of first part of radial gradient syntax;
      break;
    }

    // if there is no shape, size, or position string found in first token, break
    // if might be a color stop
    if (!hasShapeSizeOrPositionString) {
      break;
    }
  }

  if (hasShapeSizeOrPositionString) {
    remainingParts.shift();

    if (!hasExplicitShape && hasExplicitSingleSize) {
      shape = 'circle';
    }

    if (hasExplicitSingleSize && hasExplicitShape && shape === 'ellipse') {
      // If a single size is explicitly set and the shape is an ellipse, return null and do not apply any gradient. Same as web.
      return null;
    }
  }

  const colorStops = parseColorStopsCSSString(remainingParts);
  if (colorStops == null) {
    // If color stops are invalid, return null and do not apply any gradient. Same as web.
    return null;
  }

  return {
    type: 'radial-gradient',
    shape,
    size,
    position,
    colorStops,
  };
}

function parseLinearGradientCSSString(
  gradientContent: string,
): LinearGradientBackgroundImage | null {
  const parts = gradientContent.split(',');
  let direction: LinearGradientDirection = LINEAR_GRADIENT_DEFAULT_DIRECTION;
  const trimmedDirection = parts[0].trim().toLowerCase();

  if (LINEAR_GRADIENT_ANGLE_UNIT_REGEX.test(trimmedDirection)) {
    const parsedAngle = getAngleInDegrees(trimmedDirection);
    if (parsedAngle != null) {
      direction = {
        type: 'angle',
        value: parsedAngle,
      };
      parts.shift();
    } else {
      // If an angle is invalid, return null and do not apply any gradient. Same as web.
      return null;
    }
  } else if (LINEAR_GRADIENT_DIRECTION_REGEX.test(trimmedDirection)) {
    const parsedDirection = getDirectionForKeyword(trimmedDirection);
    if (parsedDirection != null) {
      direction = parsedDirection;
      parts.shift();
    } else {
      // If a direction is invalid, return null and do not apply any gradient. Same as web.
      return null;
    }
  }

  const colorStops = parseColorStopsCSSString(parts);
  if (colorStops == null) {
    // If a color stop is invalid, return null and do not apply any gradient. Same as web.
    return null;
  }

  return {
    type: 'linear-gradient',
    direction,
    colorStops,
  };
}

function parseColorStopsCSSString(parts: Array<string>): Array<{
  color: ColorStopColor,
  position: ColorStopPosition,
}> | null {
  const colorStopsString = parts.join(',');
  const colorStops: Array<{
    color: ColorStopColor,
    position: ColorStopPosition,
  }> = [];
  // split by comma, but not if it's inside a parentheses. e.g. red, rgba(0, 0, 0, 0.5), green => ["red", "rgba(0, 0, 0, 0.5)", "green"]
  const stops = colorStopsString.split(COMMA_SPLIT_REGEX);
  let prevStop = null;
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const trimmedStop = stop.trim().toLowerCase();
    // Match function like pattern or single words
    const colorStopParts = trimmedStop.match(COLOR_STOP_PARTS_REGEX);
    if (colorStopParts == null) {
      // If a color stop is invalid, return null and do not apply any gradient. Same as web.
      return null;
    }
    // Case 1: [color, position, position]
    if (colorStopParts.length === 3) {
      const color = colorStopParts[0];
      const position1 = getPositionFromCSSValue(colorStopParts[1]);
      const position2 = getPositionFromCSSValue(colorStopParts[2]);
      const processedColor = processColor(color);
      if (processedColor == null) {
        // If a color is invalid, return null and do not apply any gradient. Same as web.
        return null;
      }

      if (position1 == null || position2 == null) {
        // If a position is invalid, return null and do not apply any gradient. Same as web.
        return null;
      }

      colorStops.push({
        color: processedColor,
        position: position1,
      });
      colorStops.push({
        color: processedColor,
        position: position2,
      });
    }
    // Case 2: [color, position]
    else if (colorStopParts.length === 2) {
      const color = colorStopParts[0];
      const position = getPositionFromCSSValue(colorStopParts[1]);
      const processedColor = processColor(color);
      if (processedColor == null) {
        // If a color is invalid, return null and do not apply any gradient. Same as web.
        return null;
      }
      if (position == null) {
        // If a position is invalid, return null and do not apply any gradient. Same as web.
        return null;
      }
      colorStops.push({
        color: processedColor,
        position,
      });
    }
    // Case 3: [color]
    // Case 4: [position] => transition hint syntax
    else if (colorStopParts.length === 1) {
      const position = getPositionFromCSSValue(colorStopParts[0]);
      if (position != null) {
        // handle invalid transition hint syntax. transition hint syntax must have color before and after the position. e.g. red, 20%, blue
        if (
          (prevStop != null &&
            prevStop.length === 1 &&
            getPositionFromCSSValue(prevStop[0]) != null) ||
          i === stops.length - 1 ||
          i === 0
        ) {
          // If the last stop is a transition hint syntax, return null and do not apply any gradient. Same as web.
          return null;
        }
        colorStops.push({
          color: null,
          position,
        });
      } else {
        const processedColor = processColor(colorStopParts[0]);
        if (processedColor == null) {
          // If a color is invalid, return null and do not apply any gradient. Same as web.
          return null;
        }
        colorStops.push({
          color: processedColor,
          position: null,
        });
      }
    } else {
      // If a color stop is invalid, return null and do not apply any gradient. Same as web.
      return null;
    }
    prevStop = colorStopParts;
  }

  return colorStops;
}

function getDirectionForKeyword(direction?: string): ?LinearGradientDirection {
  if (direction == null) {
    return null;
  }
  // Remove extra whitespace
  const normalized = direction
    .replace(WHITESPACE_NORMALIZE_REGEX, ' ')
    .toLowerCase();

  switch (normalized) {
    case 'to top':
      return {type: 'angle', value: 0};
    case 'to right':
      return {type: 'angle', value: 90};
    case 'to bottom':
      return {type: 'angle', value: 180};
    case 'to left':
      return {type: 'angle', value: 270};
    case 'to top right':
    case 'to right top':
      return {type: 'keyword', value: 'to top right'};
    case 'to bottom right':
    case 'to right bottom':
      return {type: 'keyword', value: 'to bottom right'};
    case 'to top left':
    case 'to left top':
      return {type: 'keyword', value: 'to top left'};
    case 'to bottom left':
    case 'to left bottom':
      return {type: 'keyword', value: 'to bottom left'};
    default:
      return null;
  }
}

function getAngleInDegrees(angle?: string): ?number {
  if (angle == null) {
    return null;
  }
  const match = angle.match(LINEAR_GRADIENT_ANGLE_UNIT_REGEX);
  if (!match) {
    return null;
  }

  const [, value, unit] = match;

  const numericValue = parseFloat(value);
  switch (unit) {
    case 'deg':
      return numericValue;
    case 'grad':
      return numericValue * 0.9; // 1 grad = 0.9 degrees
    case 'rad':
      return (numericValue * 180) / Math.PI;
    case 'turn':
      return numericValue * 360; // 1 turn = 360 degrees
    default:
      return null;
  }
}

function getPositionFromCSSValue(position: string) {
  if (position.endsWith('px')) {
    return parseFloat(position);
  }

  if (position.endsWith('%')) {
    return position;
  }
}

function splitGradients(input: string) {
  const result = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
    } else if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim() !== '') {
    result.push(current.trim());
  }

  return result;
}
