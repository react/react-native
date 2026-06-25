/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export function getBackgroundColor(opacity?: number): string {
  return `rgba(51, 51, 51, ${opacity == null ? 1 : opacity})`;
}

export function getBackgroundLightColor(opacity?: number): string {
  return `rgba(69, 69, 69, ${opacity == null ? 1 : opacity})`;
}

export function getBackgroundDarkColor(opacity?: number): string {
  return `rgba(34, 34, 34, ${opacity == null ? 1 : opacity})`;
}

export function getWarningColor(opacity?: number): string {
  return `rgba(250, 186, 48, ${opacity == null ? 1 : opacity})`;
}

export function getWarningDarkColor(opacity?: number): string {
  return `rgba(224, 167, 8, ${opacity == null ? 1 : opacity})`;
}

export function getFatalColor(opacity?: number): string {
  return `rgba(243, 83, 105, ${opacity == null ? 1 : opacity})`;
}

export function getFatalDarkColor(opacity?: number): string {
  return `rgba(208, 75, 95, ${opacity == null ? 1 : opacity})`;
}

export function getErrorColor(opacity?: number): string {
  return `rgba(243, 83, 105, ${opacity == null ? 1 : opacity})`;
}

export function getErrorDarkColor(opacity?: number): string {
  return `rgba(208, 75, 95, ${opacity == null ? 1 : opacity})`;
}

export function getLogColor(opacity?: number): string {
  return `rgba(119, 119, 119, ${opacity == null ? 1 : opacity})`;
}

export function getDividerColor(opacity?: number): string {
  return `rgba(255, 255, 255, ${opacity == null ? 1 : opacity})`;
}

export function getHighlightColor(opacity?: number): string {
  return `rgba(252, 176, 29, ${opacity == null ? 1 : opacity})`;
}

export function getTextColor(opacity?: number): string {
  return `rgba(255, 255, 255, ${opacity == null ? 1 : opacity})`;
}
