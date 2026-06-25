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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {Node} from 'react';

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {useContext, useRef, useState} from 'react';
import {
  Button,
  DrawerLayoutAndroid,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const Drawer = () => {
  const theme = useContext(RNTesterThemeContext);
  const drawer = useRef<null | any>(null);
  const [drawerPosition, setDrawerPosition] = useState('left');
  const changeDrawerPosition = () => {
    if (drawerPosition === 'left') {
      setDrawerPosition('right');
    } else {
      setDrawerPosition('left');
    }
  };

  const navigationView = () => (
    <View style={[styles.container, styles.navigationContainer]}>
      <Text style={styles.paragraph}>I'm in the Drawer!</Text>
      <Button
        title="Close drawer"
        /* $FlowFixMe[incompatible-use] */
        onPress={() => drawer.current.closeDrawer()}
      />
    </View>
  );

  return (
    <DrawerLayoutAndroid
      ref={drawer}
      accessibilityRole="drawerlayout"
      drawerWidth={300}
      /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
       * https://fburl.com/workplace/6291gfvu */
      drawerPosition={drawerPosition}
      renderNavigationView={navigationView}>
      <View style={styles.container}>
        <Text style={[{color: theme.LabelColor}, styles.paragraph]}>
          Drawer on the {drawerPosition}!
        </Text>
        <Button
          title="Change Drawer Position"
          onPress={() => changeDrawerPosition()}
        />
        <Text style={styles.paragraph}>
          Swipe from the side or press button below to see it!
        </Text>
        <Button
          title="Open drawer"
          /* $FlowFixMe[incompatible-use] */
          onPress={() => drawer.current.openDrawer()}
        />
      </View>
    </DrawerLayoutAndroid>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  navigationContainer: {
    backgroundColor: '#ecf0f1',
  },
  paragraph: {
    padding: 16,
    fontSize: 15,
    textAlign: 'center',
  },
});

exports.title = 'DrawerLayoutAndroid';
exports.documentationURL =
  'https://reactnative.dev/docs/next/drawerlayoutandroid';
exports.description = 'Drawer Example';
exports.examples = [
  {
    title: 'Drawer Example',
    render(): Node {
      return <Drawer />;
    },
  },
] as Array<RNTesterModuleExample>;
