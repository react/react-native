/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {ViewProps} from '../View/ViewPropTypes';

import AndroidSwipeRefreshLayoutNativeComponent, {
  Commands as AndroidSwipeRefreshLayoutCommands,
} from './AndroidSwipeRefreshLayoutNativeComponent';
import PullToRefreshViewNativeComponent, {
  Commands as PullToRefreshCommands,
} from './PullToRefreshViewNativeComponent';
import * as React from 'react';

const Platform = require('../../Utilities/Platform').default;

export type RefreshControlPropsIOS = Readonly<{
  /**
   * The color of the refresh indicator.
   */
  tintColor?: ?ColorValue,
  /**
   * Title color.
   */
  titleColor?: ?ColorValue,
  /**
   * The title displayed under the refresh indicator.
   */
  title?: ?string,
}>;

export type RefreshControlPropsAndroid = Readonly<{
  /**
   * Whether the pull to refresh functionality is enabled.
   */
  enabled?: ?boolean,
  /**
   * The colors (at least one) that will be used to draw the refresh indicator.
   */
  colors?: ?ReadonlyArray<ColorValue>,
  /**
   * The background color of the refresh indicator.
   */
  progressBackgroundColor?: ?ColorValue,
  /**
   * Size of the refresh indicator.
   */
  size?: ?('default' | 'large'),
}>;

type RefreshControlBaseProps = Readonly<{
  /**
   * Called when the view starts refreshing.
   */
  onRefresh?: ?() => void | Promise<void>,

  /**
   * Whether the view should be indicating an active refresh.
   */
  refreshing: boolean,

  /**
   * Progress view top offset
   */
  progressViewOffset?: ?number,
}>;

/** @build-types emit-as-interface Uniwind compatibility */
export type RefreshControlProps = Readonly<{
  ...ViewProps,
  ...RefreshControlPropsIOS,
  ...RefreshControlPropsAndroid,
  ...RefreshControlBaseProps,
}>;

/**
 * This component is used inside a ScrollView or ListView to add pull to refresh
 * functionality. When the ScrollView is at `scrollY: 0`, swiping down
 * triggers an `onRefresh` event.
 *
 * ### Usage example
 *
 * ``` js
 * class RefreshableList extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {
 *       refreshing: false,
 *     };
 *   }
 *
 *   _onRefresh() {
 *     this.setState({refreshing: true});
 *     fetchData().then(() => {
 *       this.setState({refreshing: false});
 *     });
 *   }
 *
 *   render() {
 *     return (
 *       <ListView
 *         refreshControl={
 *           <RefreshControl
 *             refreshing={this.state.refreshing}
 *             onRefresh={this._onRefresh.bind(this)}
 *           />
 *         }
 *         ...
 *       >
 *       ...
 *       </ListView>
 *     );
 *   }
 *   ...
 * }
 * ```
 *
 * __Note:__ `refreshing` is a controlled prop, this is why it needs to be set to true
 * in the `onRefresh` function otherwise the refresh indicator will stop immediately.
 */
class RefreshControl extends React.Component<RefreshControlProps> {
  _nativeRef: ?React.ElementRef<
    | typeof PullToRefreshViewNativeComponent
    | typeof AndroidSwipeRefreshLayoutNativeComponent,
  >;
  _lastNativeRefreshing: boolean = false;

  componentDidMount() {
    this._lastNativeRefreshing = this.props.refreshing;
  }

  componentDidUpdate(prevProps: RefreshControlProps) {
    // RefreshControl is a controlled component so if the native refreshing
    // value doesn't match the current js refreshing prop update it to
    // the js value.
    if (this.props.refreshing !== prevProps.refreshing) {
      this._lastNativeRefreshing = this.props.refreshing;
    } else if (
      this.props.refreshing !== this._lastNativeRefreshing &&
      this._nativeRef
    ) {
      if (Platform.OS === 'android') {
        AndroidSwipeRefreshLayoutCommands.setNativeRefreshing(
          this._nativeRef,
          this.props.refreshing,
        );
      } else {
        PullToRefreshCommands.setNativeRefreshing(
          this._nativeRef,
          this.props.refreshing,
        );
      }
      this._lastNativeRefreshing = this.props.refreshing;
    }
  }

  render(): React.Node {
    if (Platform.OS === 'ios') {
      const {enabled, colors, progressBackgroundColor, size, ...props} =
        this.props;
      return (
        <PullToRefreshViewNativeComponent
          {...props}
          ref={this._setNativeRef}
          onRefresh={this._onRefresh}
        />
      );
    } else {
      const {tintColor, titleColor, title, ...props} = this.props;
      return (
        <AndroidSwipeRefreshLayoutNativeComponent
          {...props}
          ref={this._setNativeRef}
          onRefresh={this._onRefresh}
        />
      );
    }
  }

  _onRefresh = () => {
    this._lastNativeRefreshing = true;

    // $FlowFixMe[unused-promise]
    this.props.onRefresh && this.props.onRefresh();

    // The native component will start refreshing so force an update to
    // make sure it stays in sync with the js component.
    this.forceUpdate();
  };

  _setNativeRef = (
    ref: ?React.ElementRef<
      | typeof PullToRefreshViewNativeComponent
      | typeof AndroidSwipeRefreshLayoutNativeComponent,
    >,
  ) => {
    this._nativeRef = ref;
  };
}

export type RefreshControlInstance = RefreshControl;

export default RefreshControl;
