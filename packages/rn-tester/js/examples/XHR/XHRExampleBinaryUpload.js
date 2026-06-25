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

import RNTesterText from '../../components/RNTesterText';
import RNTOption from '../../components/RNTOption';
import * as React from 'react';
import {Alert, StyleSheet, Text, TouchableHighlight, View} from 'react-native';

const BINARY_TYPES = {
  String,
  ArrayBuffer,
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  DataView,
};

const SAMPLE_TEXT = `
I am the spirit that negates.
And rightly so, for all that comes to be
Deserves to perish wretchedly;
'Twere better nothing would begin.
Thus everything that that your terms, sin,
Destruction, evil represent—
That is my proper element.

--Faust, JW Goethe
`;

class XHRExampleBinaryUpload extends React.Component<{...}, $FlowFixMe> {
  static handlePostTestServerUpload(xhr: XMLHttpRequest) {
    if (xhr.status !== 200) {
      Alert.alert(
        'Upload failed',
        'Expected HTTP 200 OK response, got ' + xhr.status,
      );
      return;
    }
    if (!xhr.responseText) {
      Alert.alert('Upload failed', 'No response payload.');
      return;
    }
    const {status} = JSON.parse(xhr.responseText);
    if (status !== 'success') {
      Alert.alert('Upload failed', 'Invalid response payload.');
      return;
    }
    Alert.alert('Upload successful: https://ptsv3.com/react-native');
  }

  state: $FlowFixMe | {type: 'Uint8Array'} = {
    type: 'Uint8Array',
  };

  _upload = () => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://ptsv3.com/t/react-native/post');
    xhr.onload = () => XHRExampleBinaryUpload.handlePostTestServerUpload(xhr);
    xhr.setRequestHeader('Content-Type', 'text/plain');

    if (this.state.type === 'String') {
      xhr.send(SAMPLE_TEXT);
      return;
    }

    const arrayBuffer = new ArrayBuffer(256);
    const asBytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < SAMPLE_TEXT.length; i++) {
      asBytes[i] = SAMPLE_TEXT.charCodeAt(i);
    }
    if (this.state.type === 'ArrayBuffer') {
      xhr.send(arrayBuffer);
      return;
    }
    if (this.state.type === 'Uint8Array') {
      xhr.send(asBytes);
      return;
    }

    const TypedArrayClass = BINARY_TYPES[this.state.type];
    xhr.send(new TypedArrayClass(arrayBuffer));
  };

  render(): React.Node {
    return (
      <View>
        <View style={styles.block}>
          <RNTesterText style={styles.title}>
            Upload 255 bytes as ...
          </RNTesterText>
          <View style={styles.row}>
            {Object.keys(BINARY_TYPES).map(type => (
              <RNTOption
                selected={this.state.type === type}
                key={type}
                label={type}
                onPress={() => this.setState({type})}
                style={styles.option}
              />
            ))}
          </View>
        </View>
        <View style={styles.uploadButton}>
          <TouchableHighlight onPress={this._upload}>
            <View style={styles.uploadButtonBox}>
              <Text style={styles.uploadButtonLabel}>Upload</Text>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  block: {
    borderColor: 'rgba(0,0,0, 0.1)',
    borderBottomWidth: 1,
    padding: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  title: {
    fontWeight: 'bold',
  },
  option: {margin: 6},
  uploadButton: {
    marginTop: 16,
  },
  uploadButtonBox: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'blue',
    borderRadius: 4,
  },
  uploadButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

module.exports = XHRExampleBinaryUpload;
