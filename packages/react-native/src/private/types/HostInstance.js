/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// $FlowExpectedError[nonstrict-import] Making this module `strict-local` would require too many modules to revert back to `strict-local` as well.
import type ReactNativeElement from '../webapis/dom/nodes/ReactNativeElement';

export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

export type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

/**
 * Represents an instance of a React Native host component — i.e. a component
 * directly backed by a native view (e.g. `<View>`, `<Text>`, `<TextInput>`).
 *
 * `HostInstance` is an alias for `ReactNativeElement`, which exposes a
 * DOM-compatible element interface. This aligns with the New Architecture's
 * approach of surfacing W3C-compatible APIs for direct manipulation of native
 * views.
 *
 * @remarks
 * **Prefer component-specific `*Instance` types for refs.**
 * For most use cases, import the dedicated instance type for the component
 * you're working with rather than using `HostInstance` directly:
 *
 * ```tsx
 * import type { ViewInstance, TextInputInstance } from 'react-native';
 *
 * const viewRef = useRef<ViewInstance>(null);
 * const inputRef = useRef<TextInputInstance>(null);
 * ```
 *
 * `HostInstance` is the correct choice for **library authors** writing
 * component-agnostic utilities that accept any native element ref. For
 * application code targeting a specific component, `HostInstance` silently
 * loses access to component-specific imperative methods (e.g.
 * `TextInputInstance.clear()`, `ScrollViewInstance.scrollTo()`).
 *
 * **Only available on host components.** Composite components — including most
 * app-defined components — do not expose a `HostInstance` unless they forward
 * a ref to an underlying host component via `React.forwardRef`.
 *
 * **Avoid direct manipulation where possible.** Prefer `setState` and
 * controlled props. Direct manipulation bypasses React's reconciliation and
 * can cause subtle conflicts if the same property is also managed via props.
 * The primary valid use case is performance-sensitive scenarios such as
 * continuous animations, where triggering a full re-render on every frame
 * would introduce unacceptable overhead.
 *
 * @see {@link https://reactnative.dev/docs/the-new-architecture/direct-manipulation-new-architecture | Direct Manipulation}
 */
export type HostInstance = ReactNativeElement;
