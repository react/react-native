/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict
 * @format
 */

declare module 'jest-diff' {
  import type {CompareKeys} from 'pretty-format';

  declare export type DiffOptionsColor = (arg: string) => string; // subset of Chalk type

  declare export type DiffOptions = {
    aAnnotation?: string,
    aColor?: DiffOptionsColor,
    aIndicator?: string,
    bAnnotation?: string,
    bColor?: DiffOptionsColor,
    bIndicator?: string,
    changeColor?: DiffOptionsColor,
    changeLineTrailingSpaceColor?: DiffOptionsColor,
    commonColor?: DiffOptionsColor,
    commonIndicator?: string,
    commonLineTrailingSpaceColor?: DiffOptionsColor,
    contextLines?: number,
    emptyFirstOrLastLinePlaceholder?: string,
    expand?: boolean,
    includeChangeCounts?: boolean,
    omitAnnotationLines?: boolean,
    patchColor?: DiffOptionsColor,
    compareKeys?: CompareKeys,
  };

  declare export function diff(
    a: unknown,
    b: unknown,
    options?: DiffOptions,
  ): string | null;
}
