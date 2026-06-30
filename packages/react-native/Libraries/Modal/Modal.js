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
import type {RootTag} from '../ReactNative/RootTag';
import type {DirectEventHandler} from '../Types/CodegenTypes';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import {type ColorValue} from '../StyleSheet/StyleSheet';
import {type EventSubscription} from '../vendor/emitter/EventEmitter';
import NativeModalManager from './NativeModalManager';
import RCTModalHostView from './RCTModalHostViewNativeComponent';
import VirtualizedLists from '@react-native/virtualized-lists';
import * as React from 'react';

const ScrollView = require('../Components/ScrollView/ScrollView').default;
const View = require('../Components/View/View').default;
const AppContainer = require('../ReactNative/AppContainer').default;
const I18nManager = require('../ReactNative/I18nManager').default;
const {RootTagContext} = require('../ReactNative/RootTag');
const StyleSheet = require('../StyleSheet/StyleSheet').default;
const Platform = require('../Utilities/Platform').default;

const VirtualizedListContextResetter =
  VirtualizedLists.VirtualizedListContextResetter;

type ModalEventDefinitions = {
  modalDismissed: [{modalID: number}],
};

export type ModalInstance = HostInstance;

const ModalEventEmitter =
  Platform.OS === 'ios' && NativeModalManager != null
    ? new NativeEventEmitter<ModalEventDefinitions>(
        // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
        // If you want to use the native module on other platforms, please remove this condition and test its behavior
        Platform.OS !== 'ios' ? null : NativeModalManager,
      )
    : null;

// In order to route onDismiss callbacks, we need to uniquely identifier each
// <Modal> on screen. There can be different ones, either nested or as siblings.
// We cannot pass the onDismiss callback to native as the view will be
// destroyed before the callback is fired.
let uniqueModalIdentifier = 0;

type OrientationChangeEvent = Readonly<{
  orientation: 'portrait' | 'landscape',
}>;

/** @build-types emit-as-interface Uniwind compatibility */
export type ModalBaseProps = {
  /**
   * @deprecated Use `animationType` instead.
   */
  animated?: boolean,

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

export type ModalPropsIOS = {
  /**
   * Controls how the modal appears.
   *
   * @default `'fullScreen'` if `transparent` is `false`, `'overFullScreen'` if `transparent` is `true`.
   *
   * @platform ios
   */
  presentationStyle?: ?(
    | 'fullScreen'
    | 'pageSheet'
    | 'formSheet'
    | 'overFullScreen'
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

function confirmProps(props: ModalProps) {
  if (__DEV__) {
    if (
      props.presentationStyle &&
      props.presentationStyle !== 'overFullScreen' &&
      props.transparent === true
    ) {
      console.warn(
        `Modal with '${props.presentationStyle}' presentation style and 'transparent' value is not supported.`,
      );
    }
    if (
      props.navigationBarTranslucent === true &&
      props.statusBarTranslucent !== true
    ) {
      console.warn(
        'Modal with translucent navigation bar and without translucent status bar is not supported.',
      );
    }

    if (
      Platform.OS === 'ios' &&
      props.allowSwipeDismissal === true &&
      !props.onRequestClose
    ) {
      console.warn(
        'Modal requires the onRequestClose prop when used with `allowSwipeDismissal`. This is necessary to prevent state corruption.',
      );
    }
  }
}

// Create a state to track whether the Modal is rendering or not.
// This is the only prop that controls whether the modal is rendered or not.
type ModalState = {
  isRendered: boolean,
};

/**
 * A basic way to present content above an enclosing view.
 *
 * @see https://reactnative.dev/docs/modal
 */
class Modal extends React.Component<ModalProps, ModalState> {
  static defaultProps: {hardwareAccelerated: boolean, visible: boolean} = {
    visible: true,
    hardwareAccelerated: false,
  };

  static contextType: React.Context<RootTag> = RootTagContext;

  _identifier: number;
  _eventSubscription: ?EventSubscription;

  constructor(props: ModalProps) {
    super(props);
    if (__DEV__) {
      confirmProps(props);
    }
    this._identifier = uniqueModalIdentifier++;
    this.state = {
      isRendered: props.visible === true,
    };
  }

  componentDidMount() {
    // 'modalDismissed' is for the old renderer in iOS only
    if (ModalEventEmitter) {
      this._eventSubscription = ModalEventEmitter.addListener(
        'modalDismissed',
        event => {
          this.setState({isRendered: false}, () => {
            if (event.modalID === this._identifier && this.props.onDismiss) {
              this.props.onDismiss();
            }
          });
        },
      );
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'ios') {
      this.setState({isRendered: false});
    }
    if (this._eventSubscription) {
      this._eventSubscription.remove();
    }
  }

  componentDidUpdate(prevProps: ModalProps) {
    if (prevProps.visible === false && this.props.visible === true) {
      this.setState({isRendered: true});
    }

    if (__DEV__) {
      confirmProps(this.props);
    }
  }

  // Helper function to encapsulate platform specific logic to show or not the Modal.
  _shouldShowModal(): boolean {
    if (Platform.OS === 'ios') {
      return this.props.visible === true || this.state.isRendered === true;
    }

    return this.props.visible === true;
  }

  render(): React.Node {
    if (!this._shouldShowModal()) {
      return null;
    }

    // Only override backgroundColor when transparent or backdropColor are
    // explicitly set, so that these Modal-specific props take precedence
    // over the generic style prop. The default backgroundColor ('white')
    // is defined in styles.container below.
    const containerStyles: {backgroundColor?: ColorValue} = {};
    if (this.props.transparent === true) {
      containerStyles.backgroundColor = 'transparent';
    } else if (this.props.backdropColor != null) {
      containerStyles.backgroundColor = this.props.backdropColor;
    }

    let animationType = this.props.animationType || 'none';

    let presentationStyle = this.props.presentationStyle;
    if (!presentationStyle) {
      presentationStyle = 'fullScreen';
      if (this.props.transparent === true) {
        presentationStyle = 'overFullScreen';
      }
    }

    const innerChildren = __DEV__ ? (
      <AppContainer rootTag={this.context}>{this.props.children}</AppContainer>
    ) : (
      this.props.children
    );

    const onDismiss = () => {
      // OnDismiss is implemented on iOS only.
      if (Platform.OS === 'ios') {
        this.setState({isRendered: false}, () => {
          if (this.props.onDismiss) {
            this.props.onDismiss();
          }
        });
      }
    };

    return (
      <RCTModalHostView
        /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        animationType={animationType}
        presentationStyle={presentationStyle}
        transparent={this.props.transparent}
        hardwareAccelerated={this.props.hardwareAccelerated}
        onRequestClose={this.props.onRequestClose}
        onShow={this.props.onShow}
        onDismiss={onDismiss}
        ref={this.props.modalRef}
        visible={this.props.visible}
        statusBarTranslucent={this.props.statusBarTranslucent}
        navigationBarTranslucent={this.props.navigationBarTranslucent}
        identifier={this._identifier}
        style={styles.modal}
        // $FlowFixMe[method-unbinding] added when improving typing for this parameters
        onStartShouldSetResponder={this._shouldSetResponder}
        supportedOrientations={this.props.supportedOrientations}
        onOrientationChange={this.props.onOrientationChange}
        allowSwipeDismissal={this.props.allowSwipeDismissal}
        testID={this.props.testID}>
        <VirtualizedListContextResetter>
          <ScrollView.Context.Provider value={null}>
            <View
              // $FlowFixMe[incompatible-type]
              style={[styles.container, this.props.style, containerStyles]}
              collapsable={false}>
              {innerChildren}
            </View>
          </ScrollView.Context.Provider>
        </VirtualizedListContextResetter>
      </RCTModalHostView>
    );
  }

  // We don't want any responder events bubbling out of the modal.
  _shouldSetResponder(): boolean {
    return true;
  }
}

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

type ModalRefProps = Readonly<{
  ref?: React.RefSetter<ModalInstance>,
}>;

// NOTE: This wrapper component is necessary because `Modal` is a class
// component and we need to map `ref` to a differently named prop. This can be
// removed when `Modal` is a functional component.
function Wrapper({
  ref,
  ...props
}: {
  ...ModalRefProps,
  ...ModalProps,
}): React.Node {
  return <Modal {...props} modalRef={ref} />;
}

Wrapper.displayName = 'Modal';
// $FlowExpectedError[prop-missing]
Wrapper.Context = VirtualizedListContextResetter;

export default Wrapper;
