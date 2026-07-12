/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {ImageBackground} from 'react-native';

describe('<ImageBackground>', () => {
  describe('props', () => {
    describe('ImageProps', () => {
      it('can have local source', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ImageBackground source={require('./img/img1.png')} />);
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-scale="1"
            source-size="{1, 1}"
            source-type="local"
            source-uri="file://drawable-mdpi/packages_reactnative_libraries_image___tests___img_img1.png"
          />,
        );
      });

      it('can have remote source', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ImageBackground
              source={{
                uri: 'https://reactnative.dev/img/tiny_logo.png',
                width: 100,
                height: 100,
                scale: 2,
                cache: 'only-if-cached',
                method: 'POST',
                body: 'name=React+Native',
                headers: {
                  Authorization: 'Basic RandomString',
                },
              }}
            />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-body="name=React+Native"
            source-cache="only-if-cached"
            source-header-Authorization="Basic RandomString"
            source-method="POST"
            source-scale="2"
            source-size="{100, 100}"
            source-type="remote"
            source-uri="https://reactnative.dev/img/tiny_logo.png"
          />,
        );
      });

      it('can have srcSet', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ImageBackground srcSet="https://reactnative.dev/img/tiny_logo.png 1x, https://reactnative.dev/img/header_logo.svg 2x" />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-1x-scale="1"
            source-1x-type="remote"
            source-1x-uri="https://reactnative.dev/img/tiny_logo.png"
            source-2x-scale="2"
            source-2x-type="remote"
            source-2x-uri="https://reactnative.dev/img/header_logo.svg"
          />,
        );
      });
    });

    describe('style', () => {
      it('can be set', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<ImageBackground style={{width: 100, height: 100}} />);
        });

        expect(
          root.getRenderedOutput({props: ['width|height']}).toJSX(),
        ).toEqual(<rn-image width="100" height="100" />);
      });
    });

    describe('importantForAccessibility', () => {
      it('is set on both the wrapper `View` and the inner `Image`', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ImageBackground
              importantForAccessibility="no"
              style={{width: 150, height: 50}}
              source={{uri: 'foo-bar.jpg'}}
            />,
          );
        });

        expect(
          root
            .getRenderedOutput({props: ['importantForAccessibility']})
            .toJSX(),
        ).toEqual(
          <rn-view importantForAccessibility="no">
            <rn-image importantForAccessibility="no" />
          </rn-view>,
        );
      });
    });
  });

  describe('ref', () => {
    it('Allows to set a reference to the inner `Image` component', () => {
      const elementRef = createRef<HostInstance>();
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<ImageBackground imageRef={elementRef} />);
      });

      const image = nullthrows(elementRef.current);
      expect(image.tagName).toBe('RN:Image');
    });
  });
});
