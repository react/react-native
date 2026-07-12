/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {____Styles_Internal} from './StyleSheetTypes';

import composeStyles from '../../src/private/styles/composeStyles';
import ReactNativeStyleAttributes from '../Components/View/ReactNativeStyleAttributes';
import flatten from './flattenStyle';

let _hairlineWidth: ?number;

const absoluteFill = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};
if (__DEV__) {
  Object.freeze(absoluteFill);
}

/**
 * A StyleSheet is an abstraction similar to CSS StyleSheets
 *
 * Create a new StyleSheet:
 *
 * ```
 * const styles = StyleSheet.create({
 *   container: {
 *     borderRadius: 4,
 *     borderWidth: 0.5,
 *     borderColor: '#d6d7da',
 *   },
 *   title: {
 *     fontSize: 19,
 *     fontWeight: 'bold',
 *   },
 *   activeTitle: {
 *     color: 'red',
 *   },
 * });
 * ```
 *
 * Use a StyleSheet:
 *
 * ```
 * <View style={styles.container}>
 *   <Text style={[styles.title, this.props.isActive && styles.activeTitle]} />
 * </View>
 * ```
 *
 * Code quality:
 *
 *  - By moving styles away from the render function, you're making the code
 *    easier to understand.
 *  - Naming the styles is a good way to add meaning to the low level components
 *  in the render function, and encourage reuse.
 *  - In most IDEs, using `StyleSheet.create()` will offer static type checking
 *  and suggestions to help you write valid styles.
 *
 */
export default {
  /**
   * This is defined as the width of a thin line on the platform. It can be
   * used as the thickness of a border or division between two elements.
   * Example:
   * ```
   *   {
   *     borderBottomColor: '#bbb',
   *     borderBottomWidth: StyleSheet.hairlineWidth
   *   }
   * ```
   *
   * This constant will always be a round number of pixels (so a line defined
   * by it look crisp) and will try to match the standard width of a thin line
   * on the underlying platform. However, you should not rely on it being a
   * constant size, because on different platforms and screen densities its
   * value may be calculated differently.
   *
   * A line with hairline width may not be visible if your simulator is downscaled.
   */
  // $FlowFixMe[unsafe-getters-setters] - Lazily import dependencies.
  get hairlineWidth(): number {
    if (_hairlineWidth == null) {
      const PixelRatio = require('../Utilities/PixelRatio').default;

      _hairlineWidth = PixelRatio.roundToNearestPixel(0.4);
      if (_hairlineWidth === 0) {
        _hairlineWidth = 1 / PixelRatio.get();
      }
    }
    return _hairlineWidth;
  },

  /**
   * A very common pattern is to create overlays with position absolute and
   * zero positioning (`top`, `right`, `bottom`, `left` all set to `0`), so
   * `absoluteFill` can be used for convenience and to reduce duplication of
   * these repeated styles.
   */
  absoluteFill,

  /**
   * Combines two styles such that `style2` will override any styles in `style1`.
   * If either style is falsy, the other one is returned without allocating an
   * array, saving allocations and maintaining reference equality for
   * PureComponent checks.
   */
  compose: composeStyles,

  /**
   * Flattens an array of style objects, into one aggregated style object.
   *
   * Example:
   * ```
   * const styles = StyleSheet.create({
   *   listItem: {
   *     flex: 1,
   *     fontSize: 16,
   *     color: 'white'
   *   },
   *   selectedListItem: {
   *     color: 'green'
   *   }
   * });
   *
   * StyleSheet.flatten([styles.listItem, styles.selectedListItem])
   * // returns { flex: 1, fontSize: 16, color: 'green' }
   * ```
   */
  flatten,

  /**
   * WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will
   * not be reliably announced. The whole thing might be deleted, who knows? Use
   * at your own risk.
   *
   * Sets a function to use to pre-process a style property value. This is used
   * internally to process color and transform values. You should not use this
   * unless you really know what you are doing and have exhausted other options.
   */
  setStyleAttributePreprocessor(
    property: string,
    process: (nextProp: unknown) => unknown,
  ) {
    let value;

    if (ReactNativeStyleAttributes[property] === true) {
      value = {process};
    } else if (typeof ReactNativeStyleAttributes[property] === 'object') {
      value = {...ReactNativeStyleAttributes[property], process};
    } else {
      console.error(`${property} is not a valid style attribute`);
      return;
    }

    if (
      __DEV__ &&
      typeof value.process === 'function' &&
      typeof ReactNativeStyleAttributes[property]?.process === 'function' &&
      value.process !== ReactNativeStyleAttributes[property]?.process
    ) {
      console.warn(`Overwriting ${property} style attribute preprocessor`);
    }

    ReactNativeStyleAttributes[property] = value;
  },

  /**
   * Creates a StyleSheet style reference from the given object. The values in
   * the object are frozen in development to prevent mutation.
   */
  // $FlowFixMe[unsupported-variance-annotation]
  create<out S extends ____Styles_Internal>(obj: S): Readonly<S> {
    // TODO: This should return S as the return type. But first,
    // we need to codemod all the callsites that are typing this
    // return value as a number (even though it was opaque).
    if (__DEV__) {
      for (const key in obj) {
        if (obj[key]) {
          Object.freeze(obj[key]);
        }
      }
    }
    return obj;
  },
};
