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

import type {
  ClipPathBasicShape,
  ClipPathCircleShape,
  ClipPathEllipseShape,
  ClipPathFillRule,
  ClipPathGeometryBox,
  ClipPathInsetShape,
  ClipPathPolygonShape,
  ClipPathRectShape,
  ClipPathValue,
  ClipPathXywhShape,
} from './StyleSheetTypes';

type FillRule = ClipPathFillRule;
type InsetShapeValue = ClipPathInsetShape;
type CircleShapeValue = ClipPathCircleShape;
type EllipseShapeValue = ClipPathEllipseShape;
type PolygonShapeValue = ClipPathPolygonShape;
type RectShapeValue = ClipPathRectShape;
type XywhShapeValue = ClipPathXywhShape;
type BasicShapeValue = ClipPathBasicShape;

export type ParsedInsetShape = {
  type: 'inset',
  top?: number | string | null,
  bottom?: number | string | null,
  left?: number | string | null,
  right?: number | string | null,
  borderRadius?: number | string | null,
  ...
};

export type ParsedCircleShape = {
  type: 'circle',
  r?: number | string | null,
  cx?: number | string | null,
  cy?: number | string | null,
  ...
};

export type ParsedEllipseShape = {
  type: 'ellipse',
  rx?: number | string | null,
  ry?: number | string | null,
  cx?: number | string | null,
  cy?: number | string | null,
  ...
};

export type ParsedPolygonShape = {
  type: 'polygon',
  points: ReadonlyArray<{x: number | string, y: number | string, ...}>,
  fillRule?: FillRule | null,
  ...
};

export type ParsedRectShape = {
  type: 'rect',
  top: number | string,
  right: number | string,
  bottom: number | string,
  left: number | string,
  borderRadius?: number | string | null,
  ...
};

export type ParsedXywhShape = {
  type: 'xywh',
  x: number | string,
  y: number | string,
  width: number | string,
  height: number | string,
  borderRadius?: number | string | null,
  ...
};

export type ParsedBasicShape =
  | ParsedInsetShape
  | ParsedCircleShape
  | ParsedEllipseShape
  | ParsedPolygonShape
  | ParsedRectShape
  | ParsedXywhShape;

export type ParsedClipPath = {
  shape?: ParsedBasicShape | null,
  geometryBox?: ClipPathGeometryBox | null,
  ...
};

const GEOMETRY_BOX_VALUES = new Set([
  'border-box',
  'padding-box',
  'content-box',
  'margin-box',
  'fill-box',
  'stroke-box',
  'view-box',
]);

export default function processClipPath(
  clipPath: ?(ClipPathValue | string),
): ?ParsedClipPath {
  if (clipPath == null) {
    return null;
  }

  if (typeof clipPath === 'string') {
    return parseClipPathString(
      clipPath.replace(/\n/g, ' ').toLowerCase().trim(),
    );
  }

  // Process object input
  const result: ParsedClipPath = {};

  if (clipPath.shape != null) {
    const parsedShape = processBasicShape(clipPath.shape);
    if (parsedShape == null) {
      return null;
    }
    result.shape = parsedShape;
  }

  if (clipPath.geometryBox != null) {
    result.geometryBox = clipPath.geometryBox;
  }

  return result;
}

function processBasicShape(shape: BasicShapeValue): ?ParsedBasicShape {
  switch (shape.type) {
    case 'inset':
      return processInsetShape(shape);
    case 'circle':
      return processCircleShape(shape);
    case 'ellipse':
      return processEllipseShape(shape);
    case 'polygon':
      return processPolygonShape(shape);
    case 'rect':
      return processRectShape(shape);
    case 'xywh':
      return processXywhShape(shape);
    default:
      return null;
  }
}

function processInsetShape(shape: InsetShapeValue): ?ParsedInsetShape {
  const result: ParsedInsetShape = {type: 'inset'};

  if (shape.top != null) {
    const parsed = parseLengthPercentage(shape.top);
    if (parsed == null) {
      return null;
    }
    result.top = parsed;
  }

  if (shape.bottom != null) {
    const parsed = parseLengthPercentage(shape.bottom);
    if (parsed == null) {
      return null;
    }
    result.bottom = parsed;
  }

  if (shape.left != null) {
    const parsed = parseLengthPercentage(shape.left);
    if (parsed == null) {
      return null;
    }
    result.left = parsed;
  }

  if (shape.right != null) {
    const parsed = parseLengthPercentage(shape.right);
    if (parsed == null) {
      return null;
    }
    result.right = parsed;
  }

  if (shape.borderRadius != null) {
    const parsed = parseLengthPercentage(shape.borderRadius);
    if (parsed == null) {
      return null;
    }
    result.borderRadius = parsed;
  }

  return result;
}

function processCircleShape(shape: CircleShapeValue): ?ParsedCircleShape {
  const result: ParsedCircleShape = {type: 'circle'};

  if (shape.r != null) {
    const parsed = parseLengthPercentage(shape.r);
    if (parsed == null) {
      return null;
    }
    result.r = parsed;
  }

  if (shape.cx != null) {
    const parsed = parseLengthPercentage(shape.cx);
    if (parsed == null) {
      return null;
    }
    result.cx = parsed;
  }

  if (shape.cy != null) {
    const parsed = parseLengthPercentage(shape.cy);
    if (parsed == null) {
      return null;
    }
    result.cy = parsed;
  }

  return result;
}

function processEllipseShape(shape: EllipseShapeValue): ?ParsedEllipseShape {
  const result: ParsedEllipseShape = {type: 'ellipse'};

  if (shape.rx != null) {
    const parsed = parseLengthPercentage(shape.rx);
    if (parsed == null) {
      return null;
    }
    result.rx = parsed;
  }

  if (shape.ry != null) {
    const parsed = parseLengthPercentage(shape.ry);
    if (parsed == null) {
      return null;
    }
    result.ry = parsed;
  }

  if (shape.cx != null) {
    const parsed = parseLengthPercentage(shape.cx);
    if (parsed == null) {
      return null;
    }
    result.cx = parsed;
  }

  if (shape.cy != null) {
    const parsed = parseLengthPercentage(shape.cy);
    if (parsed == null) {
      return null;
    }
    result.cy = parsed;
  }

  return result;
}

function processPolygonShape(shape: PolygonShapeValue): ?ParsedPolygonShape {
  if (shape.points.length < 3) {
    return null;
  }

  const result: ParsedPolygonShape = {
    type: 'polygon',
    points: [],
  };

  const parsedPoints = [];
  for (const point of shape.points) {
    const x = parseLengthPercentage(point.x);
    const y = parseLengthPercentage(point.y);
    if (x == null || y == null) {
      return null;
    }
    parsedPoints.push({x, y});
  }

  result.points = parsedPoints;

  if (shape.fillRule != null) {
    result.fillRule = shape.fillRule;
  }

  return result;
}

function processRectShape(shape: RectShapeValue): ?ParsedRectShape {
  const top = parseLengthPercentageOrAuto(shape.top, '0%');
  const right = parseLengthPercentageOrAuto(shape.right, '100%');
  const bottom = parseLengthPercentageOrAuto(shape.bottom, '100%');
  const left = parseLengthPercentageOrAuto(shape.left, '0%');

  if (top == null || right == null || bottom == null || left == null) {
    return null;
  }

  const result: ParsedRectShape = {
    type: 'rect',
    top,
    right,
    bottom,
    left,
  };

  if (shape.borderRadius != null) {
    const parsed = parseLengthPercentage(shape.borderRadius);
    if (parsed == null) {
      return null;
    }
    result.borderRadius = parsed;
  }

  return result;
}

function processXywhShape(shape: XywhShapeValue): ?ParsedXywhShape {
  const x = parseLengthPercentage(shape.x);
  const y = parseLengthPercentage(shape.y);
  const width = parseLengthPercentage(shape.width);
  const height = parseLengthPercentage(shape.height);

  if (x == null || y == null || width == null || height == null) {
    return null;
  }

  const result: ParsedXywhShape = {
    type: 'xywh',
    x,
    y,
    width,
    height,
  };

  if (shape.borderRadius != null) {
    const parsed = parseLengthPercentage(shape.borderRadius);
    if (parsed == null) {
      return null;
    }
    result.borderRadius = parsed;
  }

  return result;
}

function parseClipPathString(clipPath: string): ?ParsedClipPath {
  const result: ParsedClipPath = {};

  // Try to match basic shape function
  const functionMatch = clipPath.match(
    /^(inset|circle|ellipse|polygon|rect|xywh)\s*\(([^)]*)\)\s*([\w-]+)?$/,
  );

  if (functionMatch) {
    const [, functionName, args, geometryBox] = functionMatch;
    const shape = parseBasicShapeFunction(functionName, args.trim());
    if (shape == null) {
      return null;
    }
    result.shape = shape;

    if (geometryBox && GEOMETRY_BOX_VALUES.has(geometryBox)) {
      // $FlowFixMe[incompatible-type]
      result.geometryBox = geometryBox as ClipPathGeometryBox;
    }

    return result;
  }

  // Try to match geometry box followed by basic shape
  const geometryBoxMatch = clipPath.match(
    /^([\w-]+)\s+(inset|circle|ellipse|polygon|rect|xywh)\s*\(([^)]*)\)$/,
  );

  if (geometryBoxMatch) {
    const [, geometryBox, functionName, args] = geometryBoxMatch;

    if (GEOMETRY_BOX_VALUES.has(geometryBox)) {
      // $FlowFixMe[incompatible-type]
      result.geometryBox = geometryBox as ClipPathGeometryBox;
    }

    const shape = parseBasicShapeFunction(functionName, args.trim());
    if (shape == null) {
      return null;
    }
    result.shape = shape;

    return result;
  }

  // Try to match just geometry box
  if (GEOMETRY_BOX_VALUES.has(clipPath)) {
    // $FlowFixMe[incompatible-type]
    result.geometryBox = clipPath as ClipPathGeometryBox;
    return result;
  }

  return null;
}

function parseBasicShapeFunction(
  functionName: string,
  args: string,
): ?ParsedBasicShape {
  switch (functionName) {
    case 'inset':
      return parseInsetFunction(args);
    case 'circle':
      return parseCircleFunction(args);
    case 'ellipse':
      return parseEllipseFunction(args);
    case 'polygon':
      return parsePolygonFunction(args);
    case 'rect':
      return parseRectFunction(args);
    case 'xywh':
      return parseXywhFunction(args);
    default:
      return null;
  }
}

function parseInsetFunction(args: string): ?ParsedInsetShape {
  // inset() syntax: <length-percentage>{1,4} [ round <border-radius> ]?
  const roundMatch = args.match(/^(.+?)\s+round\s+(.+)$/);
  let mainArgs = args;
  let borderRadius = null;

  if (roundMatch) {
    mainArgs = roundMatch[1];
    borderRadius = parseLengthPercentage(roundMatch[2].trim());
    if (borderRadius == null) {
      return null;
    }
  }

  const values = mainArgs.split(/\s+/).filter(v => v !== '');
  if (values.length === 0 || values.length > 4) {
    return null;
  }

  const parsed = values.map(v => parseLengthPercentage(v));
  if (parsed.some(p => p == null)) {
    return null;
  }

  const result: ParsedInsetShape = {type: 'inset'};

  // CSS inset follows top, right, bottom, left pattern
  if (parsed.length === 1) {
    result.top = result.right = result.bottom = result.left = parsed[0];
  } else if (parsed.length === 2) {
    result.top = result.bottom = parsed[0];
    result.right = result.left = parsed[1];
  } else if (parsed.length === 3) {
    result.top = parsed[0];
    result.right = result.left = parsed[1];
    result.bottom = parsed[2];
  } else if (parsed.length === 4) {
    result.top = parsed[0];
    result.right = parsed[1];
    result.bottom = parsed[2];
    result.left = parsed[3];
  }

  if (borderRadius != null) {
    result.borderRadius = borderRadius;
  }

  return result;
}

function parseCircleFunction(args: string): ?ParsedCircleShape {
  // circle() syntax: [ <radius> ]? [ at <position> ]?
  const result: ParsedCircleShape = {type: 'circle'};

  if (!args) {
    return result;
  }

  const atMatch = args.match(/^(.+?)\s+at\s+(.+)$/);

  if (atMatch) {
    const radiusStr = atMatch[1].trim();
    const positionStr = atMatch[2].trim();

    if (radiusStr) {
      const radius = parseLengthPercentage(radiusStr);
      if (radius == null) {
        return null;
      }
      result.r = radius;
    }

    const position = parsePosition(positionStr);
    if (position == null) {
      return null;
    }
    result.cx = position.x;
    result.cy = position.y;
  } else {
    // No 'at' keyword, just radius
    const radius = parseLengthPercentage(args);
    if (radius == null) {
      return null;
    }
    result.r = radius;
  }

  return result;
}

function parseEllipseFunction(args: string): ?ParsedEllipseShape {
  // ellipse() syntax: [ <rx> <ry>? ]? [ at <position> ]?
  const result: ParsedEllipseShape = {type: 'ellipse'};

  if (!args) {
    return result;
  }

  const atMatch = args.match(/^(.+?)\s+at\s+(.+)$/);

  if (atMatch) {
    const radiiStr = atMatch[1].trim();
    const positionStr = atMatch[2].trim();

    if (radiiStr) {
      const radii = radiiStr.split(/\s+/).filter(v => v !== '');
      if (radii.length === 1) {
        const rx = parseLengthPercentage(radii[0]);
        if (rx == null) {
          return null;
        }
        result.rx = rx;
        result.ry = rx; // ry defaults to rx
      } else if (radii.length === 2) {
        const rx = parseLengthPercentage(radii[0]);
        const ry = parseLengthPercentage(radii[1]);
        if (rx == null || ry == null) {
          return null;
        }
        result.rx = rx;
        result.ry = ry;
      } else {
        return null;
      }
    }

    const position = parsePosition(positionStr);
    if (position == null) {
      return null;
    }
    result.cx = position.x;
    result.cy = position.y;
  } else {
    // No 'at' keyword, just radii
    const radii = args.split(/\s+/).filter(v => v !== '');
    if (radii.length === 1) {
      const rx = parseLengthPercentage(radii[0]);
      if (rx == null) {
        return null;
      }
      result.rx = rx;
      result.ry = rx;
    } else if (radii.length === 2) {
      const rx = parseLengthPercentage(radii[0]);
      const ry = parseLengthPercentage(radii[1]);
      if (rx == null || ry == null) {
        return null;
      }
      result.rx = rx;
      result.ry = ry;
    } else {
      return null;
    }
  }

  return result;
}

function parsePolygonFunction(args: string): ?ParsedPolygonShape {
  // polygon() syntax: [ <fill-rule>, ]? <point>#
  const result: ParsedPolygonShape = {
    type: 'polygon',
    points: [],
  };

  let pointsStr = args;
  const fillRuleMatch = args.match(/^(nonzero|evenodd)\s*,\s*(.+)$/);

  if (fillRuleMatch) {
    // $FlowFixMe[incompatible-type]
    result.fillRule = fillRuleMatch[1] as ClipPathFillRule;
    pointsStr = fillRuleMatch[2];
  }

  // Split by comma to get coordinate pairs
  const pairs = pointsStr.split(',').map(p => p.trim());
  const points = [];

  for (const pair of pairs) {
    const coords = pair.split(/\s+/).filter(c => c !== '');
    if (coords.length !== 2) {
      return null;
    }

    const x = parseLengthPercentage(coords[0]);
    const y = parseLengthPercentage(coords[1]);

    if (x == null || y == null) {
      return null;
    }

    points.push({x, y});
  }

  if (points.length < 3) {
    return null;
  }

  result.points = points;
  return result;
}

function parseRectFunction(args: string): ?ParsedRectShape {
  // rect() syntax: <top> <right> <bottom> <left> [ round <border-radius> ]?
  const roundMatch = args.match(/^(.+?)\s+round\s+(.+)$/);
  let mainArgs = args;
  let borderRadius = null;

  if (roundMatch) {
    mainArgs = roundMatch[1];
    borderRadius = parseLengthPercentage(roundMatch[2].trim());
    if (borderRadius == null) {
      return null;
    }
  }

  const values = mainArgs.split(/\s+/).filter(v => v !== '');
  if (values.length !== 4) {
    return null;
  }

  const top = parseLengthPercentageOrAuto(values[0], '0%');
  const right = parseLengthPercentageOrAuto(values[1], '100%');
  const bottom = parseLengthPercentageOrAuto(values[2], '100%');
  const left = parseLengthPercentageOrAuto(values[3], '0%');

  if (top == null || right == null || bottom == null || left == null) {
    return null;
  }

  const result: ParsedRectShape = {
    type: 'rect',
    top,
    right,
    bottom,
    left,
  };

  if (borderRadius != null) {
    result.borderRadius = borderRadius;
  }

  return result;
}

function parseXywhFunction(args: string): ?ParsedXywhShape {
  // xywh() syntax: <x> <y> <width> <height> [ round <border-radius> ]?
  const roundMatch = args.match(/^(.+?)\s+round\s+(.+)$/);
  let mainArgs = args;
  let borderRadius = null;

  if (roundMatch) {
    mainArgs = roundMatch[1];
    borderRadius = parseLengthPercentage(roundMatch[2].trim());
    if (borderRadius == null) {
      return null;
    }
  }

  const values = mainArgs.split(/\s+/).filter(v => v !== '');
  if (values.length !== 4) {
    return null;
  }

  const x = parseLengthPercentage(values[0]);
  const y = parseLengthPercentage(values[1]);
  const width = parseLengthPercentage(values[2]);
  const height = parseLengthPercentage(values[3]);

  if (x == null || y == null || width == null || height == null) {
    return null;
  }

  const result: ParsedXywhShape = {
    type: 'xywh',
    x,
    y,
    width,
    height,
  };

  if (borderRadius != null) {
    result.borderRadius = borderRadius;
  }

  return result;
}

function parsePosition(
  position: string,
): ?{x: number | string, y: number | string} {
  const coords = position.split(/\s+/).filter(c => c !== '');

  if (coords.length === 2) {
    const x = parseLengthPercentage(coords[0]);
    const y = parseLengthPercentage(coords[1]);

    if (x == null || y == null) {
      return null;
    }

    return {x, y};
  }

  return null;
}

function parseLengthPercentageOrAuto(
  value: number | string | 'auto',
  autoValue: string,
): ?(number | string) {
  if (value === 'auto') {
    return autoValue;
  }
  return parseLengthPercentage(value);
}

function parseLengthPercentage(value: number | string): ?(number | string) {
  if (typeof value === 'number') {
    return value;
  }

  const trimmed = value.trim();

  // Check for percentage
  if (trimmed.endsWith('%')) {
    const num = parseFloat(trimmed.slice(0, -1));
    if (Number.isNaN(num)) {
      return null;
    }
    return trimmed;
  }

  // Check for px units
  if (trimmed.endsWith('px')) {
    const num = parseFloat(trimmed.slice(0, -2));
    if (Number.isNaN(num)) {
      return null;
    }
    return num;
  }

  // Unitless zero
  if (trimmed === '0') {
    return 0;
  }

  return null;
}
