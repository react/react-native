/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../../src/private/types/HostInstance';
import type {SafeAreaInsetsChangeEvent} from '../../Types/CoreEventTypes';
import type {ViewProps} from './ViewPropTypes';

import TextAncestorContext from '../../Text/TextAncestorContext';
import ViewNativeComponent from './ViewNativeComponent';
import * as React from 'react';
import {use} from 'react';

const warnOnRepeatedSafeAreaInsetsChanges: (
  onSafeAreaInsetsChange: (event: SafeAreaInsetsChangeEvent) => unknown,
) => (event: SafeAreaInsetsChangeEvent) => unknown = __DEV__
  ? require('../../../src/private/components/view/warnOnRepeatedSafeAreaInsetsChanges')
      .default
  : onSafeAreaInsetsChange => onSafeAreaInsetsChange;

export type ViewInstance = HostInstance;

/**
 * The most fundamental component for building a UI. `View` is a container that
 * supports layout with flexbox, style, some touch handling, and accessibility
 * controls. `View` maps directly to the native view equivalent on whatever
 * platform React Native is running on, whether that is a `UIView`, `<div>`,
 * `android.view`, etc. `View` is designed to be nested inside other views and
 * can have 0 to many children of any type.
 *
 * @see https://reactnative.dev/docs/view
 */
component View(ref?: React.RefSetter<ViewInstance>, ...props: ViewProps) {
  const hasTextAncestor = use(TextAncestorContext);

  // Fast path: most views use none of the props that need transforming, so
  // skip copying and rewriting their props.
  let resolvedProps = needsPropTransforms(props)
    ? transformProps(props)
    : props;

  if (__DEV__) {
    const onSafeAreaInsetsChange =
      resolvedProps.experimental_onSafeAreaInsetsChange;
    if (onSafeAreaInsetsChange != null) {
      // Copy rather than assign: on the fast path this is the incoming props.
      resolvedProps = {
        ...resolvedProps,
        experimental_onSafeAreaInsetsChange:
          warnOnRepeatedSafeAreaInsetsChanges(onSafeAreaInsetsChange),
      };
    }
  }

  const actualView =
    ref == null ? (
      <ViewNativeComponent {...resolvedProps} />
    ) : (
      <ViewNativeComponent {...resolvedProps} ref={ref} />
    );

  if (hasTextAncestor) {
    return (
      <TextAncestorContext value={false}>{actualView}</TextAncestorContext>
    );
  }
  return actualView;
}

// Must check every prop that `transformProps` reads. Compares against
// `undefined` rather than `null` so that `null` values still go through
// `transformProps`, which strips them.
function needsPropTransforms(props: ViewProps): boolean {
  return (
    props.accessibilityState !== undefined ||
    props.accessibilityValue !== undefined ||
    props['aria-busy'] !== undefined ||
    props['aria-checked'] !== undefined ||
    props['aria-disabled'] !== undefined ||
    props['aria-expanded'] !== undefined ||
    props['aria-hidden'] !== undefined ||
    props['aria-label'] !== undefined ||
    props['aria-labelledby'] !== undefined ||
    props['aria-live'] !== undefined ||
    props['aria-selected'] !== undefined ||
    props['aria-valuemax'] !== undefined ||
    props['aria-valuemin'] !== undefined ||
    props['aria-valuenow'] !== undefined ||
    props['aria-valuetext'] !== undefined ||
    props.id !== undefined ||
    props.tabIndex !== undefined
  );
}

function transformProps(props: ViewProps): ViewProps {
  const {
    accessibilityState,
    accessibilityValue,
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-hidden': ariaHidden,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-live': ariaLive,
    'aria-selected': ariaSelected,
    'aria-valuemax': ariaValueMax,
    'aria-valuemin': ariaValueMin,
    'aria-valuenow': ariaValueNow,
    'aria-valuetext': ariaValueText,
    id,
    tabIndex,
    ...otherProps
  } = props;

  const resolvedProps = otherProps as {...ViewProps};

  const parsedAriaLabelledBy = ariaLabelledBy?.split(/\s*,\s*/g);
  if (parsedAriaLabelledBy !== undefined) {
    resolvedProps.accessibilityLabelledBy = parsedAriaLabelledBy;
  }

  if (ariaLabel !== undefined) {
    resolvedProps.accessibilityLabel = ariaLabel;
  }

  if (ariaLive !== undefined) {
    resolvedProps.accessibilityLiveRegion =
      ariaLive === 'off' ? 'none' : ariaLive;
  }

  if (ariaHidden !== undefined) {
    resolvedProps.accessibilityElementsHidden = ariaHidden;
    if (ariaHidden === true) {
      resolvedProps.importantForAccessibility = 'no-hide-descendants';
    }
  }

  if (id !== undefined) {
    resolvedProps.nativeID = id;
  }

  if (tabIndex !== undefined) {
    resolvedProps.focusable = !tabIndex;
  }

  if (
    accessibilityState != null ||
    ariaBusy != null ||
    ariaChecked != null ||
    ariaDisabled != null ||
    ariaExpanded != null ||
    ariaSelected != null
  ) {
    resolvedProps.accessibilityState = {
      busy: ariaBusy ?? accessibilityState?.busy,
      checked: ariaChecked ?? accessibilityState?.checked,
      disabled: ariaDisabled ?? accessibilityState?.disabled,
      expanded: ariaExpanded ?? accessibilityState?.expanded,
      selected: ariaSelected ?? accessibilityState?.selected,
    };
  }

  if (
    accessibilityValue != null ||
    ariaValueMax != null ||
    ariaValueMin != null ||
    ariaValueNow != null ||
    ariaValueText != null
  ) {
    resolvedProps.accessibilityValue = {
      max: ariaValueMax ?? accessibilityValue?.max,
      min: ariaValueMin ?? accessibilityValue?.min,
      now: ariaValueNow ?? accessibilityValue?.now,
      text: ariaValueText ?? accessibilityValue?.text,
    };
  }

  return resolvedProps;
}

View.displayName = 'View';

export default View;
