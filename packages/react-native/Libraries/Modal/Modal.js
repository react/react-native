/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../src/private/types/HostInstance';
import type {ViewProps} from '../Components/View/ViewPropTypes';
import type {DirectEventHandler} from '../Types/CodegenTypes';

import {type ColorValue} from '../StyleSheet/StyleSheet';
import Platform from '../Utilities/Platform';
import RCTModalHostView from './RCTModalHostViewNativeComponent';
import VirtualizedLists from '@react-native/virtualized-lists';
import * as React from 'react';
import {useCallback, useContext, useEffect, useState} from 'react';

const ScrollView = require('../Components/ScrollView/ScrollView').default;
const View = require('../Components/View/View').default;
const AppContainer = require('../ReactNative/AppContainer').default;
const I18nManager = require('../ReactNative/I18nManager').default;
const {RootTagContext} = require('../ReactNative/RootTag');
const StyleSheet = require('../StyleSheet/StyleSheet').default;

const VirtualizedListContextResetter =
  VirtualizedLists.VirtualizedListContextResetter;

export type ModalInstance = HostInstance;

// In order to route onDismiss callbacks, we need to uniquely identifier each
// <Modal> on screen. There can be different ones, either nested or as siblings.
// We cannot pass the onDismiss callback to native as the view will be
// destroyed before the callback is fired.
let uniqueModalIdentifier = 0;

type OrientationChangeEvent = Readonly<{
  orientation: 'portrait' | 'landscape',
}>;

type ModalBasePropsCore = {
  /**
   * Controls how the modal animates. `'slide'` slides in from the bottom,
   * `'fade'` fades into view, `'none'` appears without animation.
   *
   * @default `'none'`
   */
  animationType?: ?('none' | 'slide' | 'fade'),

  /**
   * Whether the modal fills the entire view. Setting to `true` renders the
   * modal over a transparent background.
   *
   * @default `false`
   */
  transparent?: ?boolean,

  /**
   * Whether the modal is visible.
   *
   * @default `true`
   */
  visible?: ?boolean,

  /**
   * Called when the user taps the hardware back button on Android, the menu
   * button on Apple TV, or the modal is dismissed via drag gesture on iOS
   * (when `allowSwipeDismissal` is `true`). Required on Android and TV.
   */
  // onRequestClose?: (event: NativeSyntheticEvent<any>) => void;
  onRequestClose?: ?DirectEventHandler<null>,

  /**
   * Called once the modal has been shown.
   */
  // onShow?: (event: NativeSyntheticEvent<any>) => void;
  onShow?: ?DirectEventHandler<null>,

  /**
   * The backdrop color of the modal's container. Defaults to `white` if
   * `transparent` is `false`. Ignored if `transparent` is `true`.
   */
  backdropColor?: ColorValue,

  /**
   * A ref to the native Modal component.
   */
  modalRef?: React.RefSetter<ModalInstance>,
};

/** @build-types emit-as-interface Uniwind compatibility */
export type ModalBaseProps = ModalBasePropsCore;

export type ModalPropsIOS = {
  /**
   * Controls how the modal appears.
   *
   * @default `'fullScreen'` if `transparent` is `false`, `'overFullScreen'` if `transparent` is `true`.
   *
   * @platform ios
   */
  presentationStyle?: ?(
    'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen'
  ),

  /**
   * Array of orientations the modal can be rotated to. On iOS, the modal is
   * still restricted by what is specified in your app's Info.plist
   * `UISupportedInterfaceOrientations` field.
   *
   * @default `['portrait']`
   *
   * @platform ios
   */
  supportedOrientations?: ?ReadonlyArray<
    | 'portrait'
    | 'portrait-upside-down'
    | 'landscape'
    | 'landscape-left'
    | 'landscape-right',
  >,

  /**
   * Called once the modal has been dismissed.
   *
   * @platform ios
   */
  // onDismiss?: (() => void) | undefined;
  onDismiss?: ?() => void,

  /**
   * Called when the orientation changes while the modal is displayed. The
   * orientation provided is only `'portrait'` or `'landscape'`. This callback
   * is also called on initial render, regardless of the current orientation.
   *
   * @platform ios
   */
  // onOrientationChange?:
  //   | ((event: NativeSyntheticEvent<any>) => void)
  //   | undefined;
  onOrientationChange?: ?DirectEventHandler<OrientationChangeEvent>,

  /**
   * Controls whether the modal can be dismissed by swiping down. Requires
   * `onRequestClose` to be set.
   *
   * @default `false`
   *
   * @platform ios
   */
  allowSwipeDismissal?: ?boolean,
};

export type ModalPropsAndroid = {
  /**
   * Controls whether to force hardware acceleration for the underlying window.
   *
   * @default `false`
   *
   * @platform android
   */
  hardwareAccelerated?: ?boolean,

  /**
   * Whether the modal should go under the system statusbar.
   *
   * @default `false`
   *
   * @platform android
   */
  statusBarTranslucent?: ?boolean,

  /**
   * Whether the modal should go under the system navigation bar.
   * `statusBarTranslucent` also needs to be `true`.
   *
   * @default `false`
   *
   * @platform android
   */
  navigationBarTranslucent?: ?boolean,
};

export type ModalProps = {
  ...ModalBaseProps,
  ...ModalPropsIOS,
  ...ModalPropsAndroid,
  ...ViewProps,
};

function confirmProps({
  transparent,
  presentationStyle,
  navigationBarTranslucent,
  statusBarTranslucent,
  allowSwipeDismissal,
  onRequestClose,
}: ModalProps) {
  if (__DEV__) {
    if (
      presentationStyle &&
      presentationStyle !== 'overFullScreen' &&
      transparent === true
    ) {
      console.warn(
        `Modal with '${presentationStyle}' presentation style and 'transparent' value is not supported.`,
      );
    }
    if (navigationBarTranslucent === true && statusBarTranslucent !== true) {
      console.warn(
        'Modal with translucent navigation bar and without translucent status bar is not supported.',
      );
    }

    if (
      Platform.OS === 'ios' &&
      allowSwipeDismissal === true &&
      !onRequestClose
    ) {
      console.warn(
        'Modal requires the onRequestClose prop when used with `allowSwipeDismissal`. This is necessary to prevent state corruption.',
      );
    }
  }
}

const onStartShouldSetResponder = () => true; // We don't want any responder events bubbling out of the modal.

const Modal: component(
  ref?: React.RefSetter<ModalInstance>,
  ...props: ModalProps
) = ({
  backdropColor,
  transparent,
  children,
  presentationStyle,
  animationType,
  onRequestClose,
  onShow,
  visible = true,
  hardwareAccelerated = false,
  ref: modalRef,
  statusBarTranslucent,
  navigationBarTranslucent,
  supportedOrientations,
  onOrientationChange,
  allowSwipeDismissal,
  testID,
  onDismiss,
  style,
}: {
  ref?: React.RefSetter<ModalInstance>,
  ...ModalProps,
}): React.Node => {
  const isVisible = visible === true;

  // Create a state to track whether the Modal is rendering or not.
  // This is the only prop that controls whether the modal is rendered or not.
  const [isRendered, setIsRendered] = useState(visible === true);
  const [identifier] = useState(() => uniqueModalIdentifier++);

  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      setIsRendered(false);
    };
  }, []);

  useEffect(() => {
    if (__DEV__) {
      confirmProps({
        transparent,
        presentationStyle,
        navigationBarTranslucent,
        statusBarTranslucent,
        allowSwipeDismissal,
        onRequestClose,
      });
    }
  }, [
    transparent,
    presentationStyle,
    navigationBarTranslucent,
    statusBarTranslucent,
    allowSwipeDismissal,
    onRequestClose,
  ]);

  const rootTag = useContext(RootTagContext);

  const onDismissIos = useCallback(() => {
    // OnDismiss is implemented on iOS only.
    if (Platform.OS === 'ios') {
      setIsRendered(false);
      onDismiss?.();
    }
  }, [onDismiss]);

  const shouldShowModal =
    Platform.OS === 'ios' ? isRendered && isVisible : isVisible;

  if (!shouldShowModal) {
    return null;
  }

  const isTransparent = transparent === true;

  // Only override backgroundColor when transparent or backdropColor are
  // explicitly set, so that these Modal-specific props take precedence
  // over the generic style prop. The default backgroundColor ('white')
  // is defined in styles.container below.
  const containerStyles: {backgroundColor?: ColorValue} = {};
  if (isTransparent) {
    containerStyles.backgroundColor = 'transparent';
  } else if (backdropColor != null) {
    containerStyles.backgroundColor = backdropColor;
  }

  return (
    <RCTModalHostView
      /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */
      animationType={animationType || 'none'}
      presentationStyle={
        presentationStyle || (isTransparent ? 'overFullScreen' : 'fullScreen')
      }
      transparent={transparent}
      hardwareAccelerated={hardwareAccelerated}
      onRequestClose={onRequestClose}
      onShow={onShow}
      onDismiss={onDismissIos}
      ref={modalRef}
      visible={visible}
      statusBarTranslucent={statusBarTranslucent}
      navigationBarTranslucent={navigationBarTranslucent}
      identifier={identifier}
      style={styles.modal}
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      onStartShouldSetResponder={onStartShouldSetResponder}
      supportedOrientations={supportedOrientations}
      onOrientationChange={onOrientationChange}
      allowSwipeDismissal={allowSwipeDismissal}
      testID={testID}>
      <VirtualizedListContextResetter>
        <ScrollView.Context.Provider value={null}>
          <View
            // $FlowFixMe[incompatible-type]
            style={[styles.container, style, containerStyles]}
            collapsable={false}>
            {__DEV__ ? (
              <AppContainer rootTag={rootTag}>{children}</AppContainer>
            ) : (
              children
            )}
          </View>
        </ScrollView.Context.Provider>
      </VirtualizedListContextResetter>
    </RCTModalHostView>
  );
};

const side = I18nManager.getConstants().isRTL ? 'right' : 'left';
const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
  },
  /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
   * https://fburl.com/workplace/6291gfvu */
  container: {
    /* $FlowFixMe[invalid-computed-prop] (>=0.111.0 site=react_native_fb) This
     * comment suppresses an error found when Flow v0.111 was deployed. To see
     * the error, delete this comment and run Flow. */
    // $FlowFixMe[incompatible-type]
    [side]: 0,
    top: 0,
    flex: 1,
    backgroundColor: 'white',
  },
});

Modal.displayName = 'Modal';

// $FlowExpectedError[prop-missing]
Modal.Context = VirtualizedListContextResetter;

export default Modal;
