/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {InspectorData} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {ViewStyleProp} from '../../../../../Libraries/StyleSheet/StyleSheet';

import * as React from 'react';

const TouchableHighlight =
  require('../../../../../Libraries/Components/Touchable/TouchableHighlight').default;
const TouchableWithoutFeedback =
  require('../../../../../Libraries/Components/Touchable/TouchableWithoutFeedback').default;
const View = require('../../../../../Libraries/Components/View/View').default;
const flattenStyle =
  require('../../../../../Libraries/StyleSheet/flattenStyle').default;
const StyleSheet =
  require('../../../../../Libraries/StyleSheet/StyleSheet').default;
const Text = require('../../../../../Libraries/Text/Text').default;
const mapWithSeparator =
  require('../../../../../Libraries/Utilities/mapWithSeparator').default;
const BoxInspector = require('./BoxInspector').default;
const StyleInspector = require('./StyleInspector').default;

type Props = Readonly<{
  hierarchy: ?InspectorData['hierarchy'],
  style?: ?ViewStyleProp,
  frame?: ?Object,
  selection?: ?number,
  setSelection?: number => unknown,
}>;

class ElementProperties extends React.Component<Props> {
  render(): React.Node {
    const style = flattenStyle(this.props.style);
    const selection = this.props.selection;

    // Without the `TouchableWithoutFeedback`, taps on this inspector pane
    // would change the inspected element to whatever is under the inspector
    return (
      <TouchableWithoutFeedback>
        <View style={styles.info}>
          <View style={styles.breadcrumb}>
            {this.props.hierarchy != null &&
              mapWithSeparator(
                this.props.hierarchy,
                (hierarchyItem, i): React.MixedElement => (
                  <TouchableHighlight
                    key={'item-' + i}
                    style={[
                      styles.breadItem,
                      i === selection && styles.selected,
                    ]}
                    // $FlowFixMe[not-a-function] found when converting React.createClass to ES6
                    onPress={() => this.props.setSelection(i)}>
                    <Text style={styles.breadItemText}>
                      {hierarchyItem.name}
                    </Text>
                  </TouchableHighlight>
                ),
                (i): React.MixedElement => (
                  <Text key={'sep-' + i} style={styles.breadSep}>
                    &#9656;
                  </Text>
                ),
              )}
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <StyleInspector style={style} />
            </View>
            <BoxInspector style={style} frame={this.props.frame} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  breadSep: {
    fontSize: 8,
    color: 'white',
  },
  breadcrumb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  selected: {
    borderColor: 'white',
    borderRadius: 5,
  },
  breadItem: {
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 2,
  },
  breadItemText: {
    fontSize: 10,
    color: 'white',
    marginHorizontal: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  info: {
    padding: 10,
  },
});

export default ElementProperties;
