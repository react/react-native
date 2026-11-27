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
import type {ViewProps} from '../View/ViewPropTypes';

import Platform from '../../Utilities/Platform';
import View from '../View/View';
import RCTSafeAreaViewNativeComponent from './RCTSafeAreaViewNativeComponent';
import * as React from 'react';

export type SafeAreaViewInstance = HostInstance;

component SafeAreaViewIOS(
  ref?: React.RefSetter<SafeAreaViewInstance>,
  ...props: ViewProps
) {
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
    'aria-modal': ariaModal,
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

  if (ariaModal !== undefined) {
    resolvedProps.accessibilityViewIsModal = ariaModal;
  }

  if (ariaHidden !== undefined) {
    resolvedProps.accessibilityElementsHidden = ariaHidden;
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

  return ref == null ? (
    <RCTSafeAreaViewNativeComponent {...resolvedProps} />
  ) : (
    <RCTSafeAreaViewNativeComponent {...resolvedProps} ref={ref} />
  );
}

/**
 * Renders content within the safe area boundaries of a device. Currently only applicable to iOS devices with iOS version 11 or later. Automatically applies padding to reflect the portion of the view not covered by navigation bars, tab bars, toolbars, and other ancestor views.
 *
 * @see https://reactnative.dev/docs/safeareaview
 * @deprecated Use `react-native-safe-area-context` instead.
 * @platform ios
 */
const SafeAreaView: component(
  ref?: React.RefSetter<SafeAreaViewInstance>,
  ...props: ViewProps
) = Platform.select({
  ios: SafeAreaViewIOS,
  default: View,
});

export default SafeAreaView;
