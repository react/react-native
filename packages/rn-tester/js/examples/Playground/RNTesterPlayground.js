/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';

/**
 * Repro for #57780.
 *
 * Android only: a View with `borderRadius` + `overflow: 'hidden'` stops drawing
 * ALL of its children once its `borderWidth` prop is *removed* (as opposed to
 * being set to 0). The view's own background keeps painting, so the row becomes
 * a correctly sized, correctly rounded, empty box.
 *
 * Tap "Row B" in group A: "Row A" keeps its grey background and loses its text.
 * Group B is identical except its base style sets `borderWidth: 0`, so the prop
 * is never removed - that one behaves correctly. Both groups undergo the same
 * 1px geometry change, which is what rules out a layout/measurement cause and
 * points at the `Float.NaN` that `ReactViewManager` sends for a removed
 * borderWidth prop (see the issue for the full trace through
 * BorderInsets.resolve -> clipToPaddingBox -> canvas.clipPath).
 *
 * iOS renders both groups correctly.
 */

const ROWS = ['Row A', 'Row B', 'Row C'];

function Group({
  title,
  keepBorderWidth,
}: {
  title: string,
  keepBorderWidth: boolean,
}): React.Node {
  const [selected, setSelected] = React.useState<number>(0);

  return (
    <View style={styles.group}>
      <RNTesterText style={styles.groupTitle}>{title}</RNTesterText>
      {ROWS.map((label, i) => (
        <Pressable
          key={label}
          onPress={() => setSelected(i)}
          style={[
            styles.row,
            // Group B only: keeps borderWidth present in every state.
            keepBorderWidth ? styles.rowZeroBorder : null,
            // borderWidth appears on select and DISAPPEARS on deselect.
            i === selected ? styles.rowSelected : null,
          ]}>
          <RNTesterText style={styles.rowLabel}>{label}</RNTesterText>
        </Pressable>
      ))}
    </View>
  );
}

function Playground(): React.Node {
  return (
    <View style={styles.container}>
      <Group
        keepBorderWidth={false}
        title="A) BROKEN on Android - unselected style has no borderWidth"
      />
      <Group
        keepBorderWidth={true}
        title="B) OK - unselected style has borderWidth: 0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    backgroundColor: '#e6e8ee',
    // ingredient 1: rounded corners, so the clip is built as a Path
    borderRadius: 8,
    // ingredient 2: installs the padding-box clip on children
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rowZeroBorder: {
    borderWidth: 0,
    borderColor: 'transparent',
  },
  rowSelected: {
    borderWidth: 1,
    borderColor: '#3b5afb',
  },
  rowLabel: {
    fontSize: 16,
    color: '#111111',
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
