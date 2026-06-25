/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type VCTracker, {VisualElement} from './VCTrackerExample';

import * as React from 'react';
import {useEffect, useState} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';

const OVERLAY_SCALE = 0.25;

export default function VCOverlayExample(props: {
  vcTracker: VCTracker,
}): React.Node {
  const [visualElements, setVisualElements] = useState<
    ReadonlyArray<VisualElement>,
  >([]);

  useEffect(() => {
    setVisualElements(props.vcTracker.getVisualElements());
    props.vcTracker.onUpdateVisualElements(elements => {
      setVisualElements(elements);
    });
  }, [props.vcTracker]);

  return (
    <View style={styles.overlay}>
      {visualElements.map((visualElement, index) => (
        <View
          key={index}
          style={[
            styles.overlayElement,
            {
              top: visualElement.rect.top * OVERLAY_SCALE,
              left: visualElement.rect.left * OVERLAY_SCALE,
              width: visualElement.rect.width * OVERLAY_SCALE,
              height: visualElement.rect.height * OVERLAY_SCALE,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 60,
    right: 10,
    width: OVERLAY_SCALE * Dimensions.get('window').width,
    height: OVERLAY_SCALE * Dimensions.get('window').height,
    backgroundColor: 'gray',
    opacity: 0.9,
  },
  overlayElement: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'black',
  },
});
