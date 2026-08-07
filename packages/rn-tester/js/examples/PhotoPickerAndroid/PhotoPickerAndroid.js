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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterBlock from '../../components/RNTesterBlock';
import RNTesterPage from '../../components/RNTesterPage';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

function getNativeSampleTurboModule() {
  return require('react-native/Libraries/TurboModule/samples/NativeSampleTurboModule')
    .default;
}

/**
 * Drives the Android photo picker through SampleTurboModule, which registers
 * AndroidX ActivityResultContracts.PickVisualMedia / PickMultipleVisualMedia
 * against the ReactContext (no MainActivity changes). The mimeType argument
 * selects the picker mode: null shows images and videos, 'image/*' and
 * 'video/*' restrict to one kind, and a concrete type such as 'image/gif'
 * restricts to that type only.
 */
const PhotoPickerSingle = (): React.Node => {
  const [uri, setUri] = useState<?string>(null);
  const pick = useCallback(async (mimeType: ?string) => {
    try {
      const result = await getNativeSampleTurboModule().pickMedia?.(mimeType);
      setUri(result);
    } catch (e) {
      ToastAndroid.show('' + e, ToastAndroid.LONG);
    }
  }, []);

  return (
    <>
      <View style={styles.row}>
        <PickerButton label="Images & videos" onPress={() => pick(null)} />
        <PickerButton label="Images only" onPress={() => pick('image/*')} />
      </View>
      <View style={styles.row}>
        <PickerButton label="Videos only" onPress={() => pick('video/*')} />
        <PickerButton label="GIFs only" onPress={() => pick('image/gif')} />
      </View>
      <RNTesterText style={styles.uriText}>
        {uri != null ? uri : 'Nothing selected'}
      </RNTesterText>
      {uri != null && <Image style={styles.image} source={{uri}} />}
    </>
  );
};

/**
 * The item limit is a per-call JS argument rather than a fixed native
 * constant. Native-side, this works by subclassing PickMultipleVisualMedia so
 * the limit travels in the contract's launch input instead of its constructor
 * (see PickUpToMedia in SampleTurboModule.kt), the pattern library authors
 * should use for any contract parameter that comes from JS.
 */
const PhotoPickerMultiple = (): React.Node => {
  const [uris, setUris] = useState<Array<string>>([]);
  const pick = useCallback(async (maxItems: number) => {
    try {
      const result = await getNativeSampleTurboModule().pickMultipleMedia?.(
        null,
        maxItems,
      );
      setUris(result ?? []);
    } catch (e) {
      ToastAndroid.show('' + e, ToastAndroid.LONG);
    }
  }, []);

  return (
    <>
      <View style={styles.row}>
        <PickerButton label="Up to 3 items" onPress={() => pick(3)} />
        <PickerButton label="Up to 5 items" onPress={() => pick(5)} />
      </View>
      <RNTesterText style={styles.uriText}>
        {uris.length > 0
          ? `${uris.length} item(s) selected`
          : 'Nothing selected'}
      </RNTesterText>
      <View style={styles.thumbnailRow}>
        {uris.map(itemUri => (
          <Image
            key={itemUri}
            style={styles.thumbnail}
            source={{uri: itemUri}}
          />
        ))}
      </View>
    </>
  );
};

/**
 * Regression check for multi-Activity navigation: opening the second Activity
 * must rebind the ReactContext-registered launchers to its registry, so picks
 * on each screen deliver their results to that screen.
 */
const MultiActivity = (): React.Node => {
  return (
    <>
      <RNTesterText style={styles.uriText}>
        Opens this same example in a second Activity. Pick an image there: the
        result must arrive on that screen. Then go back and pick here again.
      </RNTesterText>
      <View style={styles.row}>
        <PickerButton
          label="Open in a second Activity"
          onPress={() => getNativeSampleTurboModule().startSecondActivity?.()}
        />
      </View>
    </>
  );
};

function PickerButton(props: {label: string, onPress: () => unknown}) {
  return (
    <TouchableOpacity onPress={props.onPress} style={styles.buttonContainer}>
      <View style={styles.button}>
        <RNTesterText>{props.label}</RNTesterText>
      </View>
    </TouchableOpacity>
  );
}

class PhotoPickerAndroidExample extends React.Component<{}, {}> {
  render(): React.Node {
    return (
      <RNTesterPage title="Photo picker via ActivityResultContracts">
        {Platform.OS === 'android' && (
          <>
            <RNTesterBlock title="Single select">
              <PhotoPickerSingle />
            </RNTesterBlock>
            <RNTesterBlock title="Multi select (JS-controlled limit)">
              <PhotoPickerMultiple />
            </RNTesterBlock>
            <RNTesterBlock title="Multi-Activity navigation">
              <MultiActivity />
            </RNTesterBlock>
          </>
        )}
      </RNTesterPage>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    padding: 10,
    backgroundColor: '#009688',
    marginBottom: 10,
    alignItems: 'center',
  },
  uriText: {
    paddingVertical: 8,
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
    height: 300,
  },
  thumbnailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  thumbnail: {
    width: 72,
    height: 72,
    resizeMode: 'cover',
  },
});

exports.title = 'PhotoPickerAndroid';
exports.description =
  'Android photo picker driven by a TurboModule via ActivityResultContracts.';
exports.examples = [
  {
    title: 'Photo picker',
    render(): React.MixedElement {
      return <PhotoPickerAndroidExample />;
    },
  },
] as Array<RNTesterModuleExample>;
