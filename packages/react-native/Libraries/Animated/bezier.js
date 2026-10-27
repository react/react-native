/**
 * Portions Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * BezierEasing - use bezier curve for transition easing function
 * https://github.com/gre/bezier-easing
 * @copyright 2014-2026 Gaëtan Renaudeau. MIT License.
 */

'use strict';

// Solves x(t) = ((2a * t + 3b) * t + 3c) * t = x for t, with x in (0, 1):
// u = 1/t is the largest real root of x·u³ − 3c·u² − 3b·u − 2a = 0
function solveTForX(x: number, a: number, b: number, c: number): number {
  const j = 1 / Math.max(c, Math.sqrt(x));
  const k = x * j;
  const l = k * j;
  const s = c * j;
  const q = b * l;
  const m = s * s + q;
  const h = -s * (s * s + 1.5 * q) - a * k * l;
  const D = h * h - m * m * m;
  let v: number;
  if (m === 0 || D > 1e-12 * h * h) {
    // one real root (Cardano)
    const U = -Math.cbrt(h < 0 ? h - Math.sqrt(D) : h + Math.sqrt(D));
    v = U + m / U || 0;
  } else {
    // three real roots, take the largest
    const r = Math.sqrt(m);
    v =
      2 * r * Math.cos(Math.acos(Math.max(-1, Math.min(1, -h / (m * r)))) / 3);
  }
  return Math.min(1, k / (v + s));
}

export default function bezier(
  mX1: number,
  mY1: number,
  mX2: number,
  mY2: number,
): (x: number) => number {
  if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }

  if (mX1 === mY1 && mX2 === mY2) {
    return function LinearEasing(x: number): number {
      return x;
    };
  }

  // x(t) = ((2a * t + 3b) * t + 3c) * t, y(t) = ((ay * t + by) * t + cy) * t
  const a = (3 * mX1 - 3 * mX2 + 1) / 2;
  const b = mX2 - 2 * mX1;
  const c = mX1;
  const ay = 3 * mY1 - 3 * mY2 + 1;
  const by = 3 * (mY2 - 2 * mY1);
  const cy = 3 * mY1;

  return function BezierEasing(x: number): number {
    // x outside (0, 1) saturates to 0 / 1
    if (x <= 0) {
      return 0;
    }
    if (x >= 1) {
      return 1;
    }
    const t = solveTForX(x, a, b, c);
    return ((ay * t + by) * t + cy) * t;
  };
}
