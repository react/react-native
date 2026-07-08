/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {ViewProps} from '../Components/View/ViewPropTypes';
import {NativeSyntheticEvent} from '../Types/CoreEventTypes';
import {ColorValue} from '../StyleSheet/StyleSheet';

export interface ModalBaseProps {
  /**
   * The `animationType` prop controls how the modal animates.
   *
   * - `slide` slides in from the bottom
   * - `fade` fades into view
   * - `none` appears without an animation
   */
  animationType?: 'none' | 'slide' | 'fade' | undefined;
  /**
   * The `transparent` prop determines whether your modal will fill the entire view.
   * Setting this to `true` will render the modal over a transparent background.
   */
  transparent?: boolean | undefined;
  /**
   * The `visible` prop determines whether your modal is visible.
   */
  visible?: boolean | undefined;
  /**
   * The `onRequestClose` callback is called when the user taps the hardware back button on Android, dismisses the sheet using a gesture on iOS (when `allowSwipeDismissal` is set to true) or the menu button on Apple TV.
   *
   * This is required on iOS and Android.
   */
  onRequestClose?: ((event: NativeSyntheticEvent<any>) => void) | undefined;
  /**
   * The `onShow` prop allows passing a function that will be called once the modal has been shown.
   */
  onShow?: ((event: NativeSyntheticEvent<any>) => void) | undefined;

  /**
   * The `backdropColor` props sets the background color of the modal's container.
   * Defaults to `white` if not provided and transparent is `false`. Ignored if `transparent` is `true`.
   */
  backdropColor?: ColorValue | undefined;

  /**
   * A ref to the native Modal component.
   */
  modalRef?: React.RefObject<Modal | null> | undefined;
}

export interface ModalPropsIOS {
  /**
   * The `presentationStyle` determines the style of modal to show
   */
  presentationStyle?:
    'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen' | undefined;

  /**
   * The `supportedOrientations` prop allows the modal to be rotated to any of the specified orientations.
   * On iOS, the modal is still restricted by what's specified in your app's Info.plist's UISupportedInterfaceOrientations field.
   */
  supportedOrientations?:
    | Array<
        | 'portrait'
        | 'portrait-upside-down'
        | 'landscape'
        | 'landscape-left'
        | 'landscape-right'
      >
    | undefined;

  /**
   * The `onDismiss` prop allows passing a function that will be called once the modal has been dismissed.
   */
  onDismiss?: (() => void) | undefined;

  /**
   * The `onOrientationChange` callback is called when the orientation changes while the modal is being displayed.
   * The orientation provided is only 'portrait' or 'landscape'. This callback is also called on initial render, regardless of the current orientation.
   */
  onOrientationChange?:
    ((event: NativeSyntheticEvent<any>) => void) | undefined;

  /**
   * Controls whether the modal can be dismissed by swiping down on iOS.
   * This requires you to implement the `onRequestClose` prop to handle the dismissal.
   */
  allowSwipeDismissal?: boolean | undefined;
}

export interface ModalPropsAndroid {
  /**
   *  Controls whether to force hardware acceleration for the underlying window.
   */
  hardwareAccelerated?: boolean | undefined;

  /**
   *  Determines whether your modal should go under the system statusbar.
   */
  statusBarTranslucent?: boolean | undefined;

  /**
   *  Determines whether your modal should go under the system navigationbar.
   */
  navigationBarTranslucent?: boolean | undefined;
}

export type ModalProps = ModalBaseProps &
  ModalPropsIOS &
  ModalPropsAndroid &
  ViewProps;

export class Modal extends React.Component<ModalProps> {}
