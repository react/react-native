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

import type {AccessibilityProps, HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {Image} from 'react-native';
import * as ImageInjection from 'react-native/Libraries/Image/ImageInjection';
import accessibilityPropsSuite from 'react-native/src/private/__tests__/utilities/accessibilityPropsSuite';
import {testIDPropSuite} from 'react-native/src/private/__tests__/utilities/commonPropsSuite';
import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';
import NativeFantom from 'react-native/src/private/testing/fantom/specs/NativeFantom';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

const LOGO_SOURCE = {uri: 'https://reactnative.dev/img/tiny_logo.png'};

describe('<Image>', () => {
  describe('props', () => {
    describe('empty props', () => {
      // TODO T233552213: do not send empty source
      it('renders an empty element when there are no props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image />);
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-image
            overflow="hidden"
            resizeMode="cover"
            source-scale="1"
            source-type="remote"
          />,
        );

        Fantom.runTask(() => {
          root.render(<Image src="" />);
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-image
            overflow="hidden"
            resizeMode="cover"
            source-scale="1"
            source-type="remote"
          />,
        );
      });
    });

    describe('blurRadius', () => {
      it('provides blur radius for image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image blurRadius={10} />);
        });

        expect(root.getRenderedOutput({props: ['blurRadius']}).toJSX()).toEqual(
          <rn-image blurRadius="10" />,
        );
      });
    });

    describe('crossOrigin', () => {
      it('does not set any headers in anonymous mode', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-scale="1"
            source-type="remote"
            source-uri={LOGO_SOURCE.uri}
          />,
        );

        Fantom.runTask(() => {
          root.render(<Image crossOrigin="anonymous" source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-scale="1"
            source-type="remote"
            source-uri={LOGO_SOURCE.uri}
          />,
        );
      });

      it('sets the "Access-Control-Allow-Credentials" header in "use-credentials" mode', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image crossOrigin="use-credentials" source={LOGO_SOURCE} />,
          );
        });

        expect(
          root.getRenderedOutput({props: ['source-header']}).toJSX(),
        ).toEqual(
          <rn-image source-header-Access-Control-Allow-Credentials="true" />,
        );
      });
    });

    describe('defaultSource', () => {
      it('can provide a default image to display', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              defaultSource={require('./img/img1.png')}
              source={LOGO_SOURCE}
            />,
          );
        });

        expect(
          root.getRenderedOutput({props: ['defaultSource']}).toJSX(),
        ).toEqual(
          <rn-image
            defaultSource-type="remote"
            defaultSource-uri="file://drawable-mdpi/packages_reactnative_libraries_image___tests___img_img1.png"
          />,
        );
      });
    });

    describe('height', () => {
      it('provides height for image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image height={100} source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['height']}).toJSX()).toEqual(
          <rn-image height="100" />,
        );
      });
    });

    describe('width', () => {
      it('provides width for image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image width={100} source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['width']}).toJSX()).toEqual(
          <rn-image width="100" />,
        );
      });
    });

    describe('loading progress', () => {
      (
        [
          ['onError', 'fails to load'],
          ['onLoadStart', 'start loading'],
          ['onProgress', 'is loading'],
          ['onLoad', 'loads successfully'],
          ['onLoadEnd', 'ends loading'],
        ] as const
      ).forEach(([onProp, event]) => {
        it(`${onProp} is called when image ${event}`, () => {
          const onPropCallback = jest.fn();
          const ref = createRef<HostInstance>();

          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <Image
                ref={ref}
                source={LOGO_SOURCE}
                onError={() => {
                  onProp === 'onError' && onPropCallback();
                }}
                onLoad={() => {
                  onProp === 'onLoad' && onPropCallback();
                }}
                onLoadStart={() => {
                  onProp === 'onLoadStart' && onPropCallback();
                }}
                onLoadEnd={() => {
                  onProp === 'onLoadEnd' && onPropCallback();
                }}
                onProgress={() => {
                  onProp === 'onProgress' && onPropCallback();
                }}
              />,
            );
          });

          expect(onPropCallback).toHaveBeenCalledTimes(0);

          const image = ensureInstance(ref.current, ReactNativeElement);
          Fantom.dispatchNativeEvent(image, onProp, {});

          expect(onPropCallback).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('referrerPolicy', () => {
      (
        [
          'no-referrer',
          'no-referrer-when-downgrade',
          'origin',
          'origin-when-cross-origin',
          'same-origin',
          'strict-origin',
          'strict-origin-when-cross-origin',
          'unsafe-url',
        ] as const
      ).forEach(referrerPolicy => {
        it(`${referrerPolicy} sets correct "Referrer-Policy" header`, () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <>
                <Image referrerPolicy={referrerPolicy} src={LOGO_SOURCE.uri} />
                <Image referrerPolicy={referrerPolicy} source={LOGO_SOURCE} />
              </>,
            );
          });

          expect(
            root.getRenderedOutput({props: ['source-header']}).toJSX(),
          ).toEqual(
            <>
              <rn-image
                key="0"
                source-header-Referrer-Policy={referrerPolicy}
              />
              <rn-image
                key="1"
                source-header-Referrer-Policy={referrerPolicy}
              />
            </>,
          );
        });
      });
    });

    describe('resizeMode', () => {
      it('is set to "cover" by default', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['resizeMode']}).toJSX()).toEqual(
          <rn-image resizeMode="cover" />,
        );
      });

      it('can be set to "cover" explicitly', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image resizeMode="cover" source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['resizeMode']}).toJSX()).toEqual(
          <rn-image resizeMode="cover" />,
        );
      });

      it('can be set to "stretch", which is the same as not setting it', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image resizeMode="stretch" source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['resizeMode']}).toJSX()).toEqual(
          <rn-image />,
        );
      });

      (['contain', 'repeat', 'center'] as const).forEach(resizeMode => {
        it(`can be set to "${resizeMode}"`, () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<Image resizeMode={resizeMode} source={LOGO_SOURCE} />);
          });

          expect(
            root.getRenderedOutput({props: ['resizeMode']}).toJSX(),
          ).toEqual(<rn-image resizeMode={resizeMode} />);
        });
      });
    });

    describe('source', () => {
      it('can be set to a local image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image source={require('./img/img1.png')} />);
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

      it('can be set to a remote image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
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

      it('can be set to a list of remote images', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              source={[
                {
                  uri: 'https://reactnative.dev/img/tiny_logo.png',
                  scale: 1,
                  headers: {
                    Authorization: 'Basic RandomString',
                  },
                },
                {
                  uri: 'https://reactnative.dev/img/medium_logo.png',
                  scale: 2,
                  cache: 'only-if-cached',
                },
                {
                  uri: 'https://reactnative.dev/img/large_logo.png',
                  scale: 3,
                  method: 'POST',
                },
              ]}
            />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-1x-header-Authorization="Basic RandomString"
            source-1x-scale="1"
            source-1x-type="remote"
            source-1x-uri="https://reactnative.dev/img/tiny_logo.png"
            source-2x-cache="only-if-cached"
            source-2x-scale="2"
            source-2x-type="remote"
            source-2x-uri="https://reactnative.dev/img/medium_logo.png"
            source-3x-method="POST"
            source-3x-type="remote"
            source-3x-uri="https://reactnative.dev/img/large_logo.png"
          />,
        );
      });
    });

    describe('src', () => {
      it('can be set to a remote image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image src="https://reactnative.dev/img/tiny_logo.png" />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-scale="1"
            source-type="remote"
            source-uri="https://reactnative.dev/img/tiny_logo.png"
          />,
        );
      });

      it('takes precedence over `source` prop', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              src="https://reactnative.dev/img/tiny_logo.png"
              source={{uri: 'https://reactnative.dev/img/medium_logo.png'}}
            />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-scale="1"
            source-type="remote"
            source-uri="https://reactnative.dev/img/tiny_logo.png"
          />,
        );
      });

      it('merges dimension information into source', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              src="https://reactnative.dev/img/tiny_logo.png"
              width={40}
              height={40}
            />,
          );
        });

        expect(
          root
            .getRenderedOutput({props: ['source', 'width', 'height']})
            .toJSX(),
        ).toEqual(
          <rn-image
            source-scale="1"
            source-type="remote"
            source-size="{40, 40}"
            source-uri="https://reactnative.dev/img/tiny_logo.png"
            width="40"
            height="40"
          />,
        );
      });
    });

    describe('srcSet', () => {
      it('can be set to a list of remote images', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              srcSet={
                'https://reactnative.dev/img/tiny_logo.png 1x, https://reactnative.dev/img/header_logo.svg 2x'
              }
            />,
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

      it('defaults to `1x` descriptor', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              srcSet={
                'https://reactnative.dev/img/tiny_logo.png, https://reactnative.dev/img/header_logo.svg 2x'
              }
            />,
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

      it('uses `src` for `1x` descriptor when provided', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              srcSet={
                'https://reactnative.dev/img/header_logo.svg 2x, https://reactnative.dev/img/large_logo.svg 3x'
              }
              src="https://reactnative.dev/img/tiny_logo.png"
            />,
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
            source-3x-type="remote"
            source-3x-uri="https://reactnative.dev/img/large_logo.svg"
          />,
        );
      });
    });

    describe('style', () => {
      it('can be set', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              style={{
                width: 100,
                height: 100,
                resizeMode: 'contain',
              }}
              source={LOGO_SOURCE}
            />,
          );
        });

        expect(
          root
            .getRenderedOutput({props: ['width', 'height', 'resizeMode']})
            .toJSX(),
        ).toEqual(<rn-image height="100" resizeMode="contain" width="100" />);
      });
    });

    describe('tintColor', () => {
      it('can be set', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image tintColor="red" source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['tintColor']}).toJSX()).toEqual(
          <rn-image tintColor="rgba(255, 0, 0, 1)" />,
        );
      });
    });

    describe('aria-hidden', () => {
      it('is is passed as importantForAccessibility', () => {
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<Image aria-hidden={true} />);
        });
        expect(
          root
            .getRenderedOutput({props: ['importantForAccessibility']})
            .toJSX(),
        ).toEqual(<rn-image importantForAccessibility="no-hide-descendants" />);
      });
    });

    component TestComponent(testID?: ?string, ...props: AccessibilityProps) {
      return <Image {...props} testID={testID} source={LOGO_SOURCE} />;
    }

    accessibilityPropsSuite(TestComponent, false);
    testIDPropSuite(TestComponent);
  });

  describe('ref', () => {
    describe('instance', () => {
      it('is an element node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image ref={elementRef} />);
        });

        expect(elementRef.current).toBeInstanceOf(ReactNativeElement);
      });

      it('uses the "RN:Image" tag name', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image ref={elementRef} />);
        });

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        expect(element.tagName).toBe('RN:Image');
      });
    });
  });

  describe('resolveAssetSource', () => {
    it('resolves a plain source object to itself', () => {
      expect(Image.resolveAssetSource({uri: 'foo-bar.jpg'})).toEqual({
        uri: 'foo-bar.jpg',
      });
    });
  });

  describe('image attached callbacks', () => {
    it('invokes original ref callbacks correctly when using image attached callbacks', () => {
      let imageInstanceFromCallback = null;
      let imageInstanceFromRef1 = null;
      let imageInstanceFromRef2 = null;

      const callback = jest.fn((instance: HostInstance) => {
        imageInstanceFromCallback = instance;

        return () => {
          imageInstanceFromCallback = null;
        };
      });

      ImageInjection.unstable_registerImageAttachedCallback(callback);

      expect(imageInstanceFromCallback).toBe(null);

      const root = Fantom.createRoot();

      const ref1 = jest.fn();
      const ref1Setter = (instance: HostInstance | null): void => {
        imageInstanceFromRef1 = instance;
        ref1(instance);
      };

      Fantom.runTask(() => {
        root.render(<Image source={LOGO_SOURCE} ref={ref1Setter} />);
      });

      expect(imageInstanceFromCallback).not.toBe(null);
      expect(imageInstanceFromRef1).not.toBe(null);
      expect(imageInstanceFromCallback).toBe(imageInstanceFromRef1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(ref1).toHaveBeenCalledTimes(1);

      const ref2 = jest.fn();
      const ref2Setter = (instance: HostInstance | null): void => {
        imageInstanceFromRef2 = instance;
        ref2(instance);
      };

      Fantom.runTask(() => {
        root.render(<Image source={LOGO_SOURCE} ref={ref2Setter} />);
      });

      expect(imageInstanceFromCallback).not.toBe(null);
      expect(imageInstanceFromRef1).toBe(null);
      expect(imageInstanceFromRef2).not.toBe(null);
      expect(imageInstanceFromCallback).toBe(imageInstanceFromRef2);
      expect(callback).toHaveBeenCalledTimes(2);
      expect(ref1).toHaveBeenCalledTimes(2);
      expect(ref2).toHaveBeenCalledTimes(1);

      Fantom.runTask(() => {
        root.render(<Image source={LOGO_SOURCE} ref={ref2Setter} />);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(ref2).toHaveBeenCalledTimes(1);

      ImageInjection.unstable_unregisterImageAttachedCallback(callback);
      Fantom.runTask(() => {
        root.render(<></>);
      });
    });

    it('calls image attached callbacks (basic)', () => {
      let imageInstanceFromCallback = null;
      let imageInstanceFromRef = null;

      const callback = (instance: HostInstance) => {
        imageInstanceFromCallback = instance;

        return () => {
          imageInstanceFromCallback = null;
        };
      };

      ImageInjection.unstable_registerImageAttachedCallback(callback);

      expect(imageInstanceFromCallback).toBe(null);

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <Image
            source={LOGO_SOURCE}
            ref={instance => {
              imageInstanceFromRef = instance;
            }}
          />,
        );
      });

      expect(imageInstanceFromCallback).not.toBe(null);
      expect(imageInstanceFromRef).not.toBe(null);
      expect(imageInstanceFromCallback).toBe(imageInstanceFromRef);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(imageInstanceFromCallback).toBe(null);
      expect(imageInstanceFromRef).toBe(null);

      ImageInjection.unstable_unregisterImageAttachedCallback(callback);

      Fantom.runTask(() => {
        root.render(
          <Image
            source={LOGO_SOURCE}
            ref={instance => {
              imageInstanceFromRef = instance;
            }}
          />,
        );
      });

      expect(imageInstanceFromRef).not.toBe(null);
      expect(imageInstanceFromCallback).toBe(null);

      Fantom.runTask(() => {
        root.render(<></>);
      });
    });

    it('calls image attached callbacks (multiple callbacks)', () => {
      let imageInstanceFromCallback1 = null;
      let imageInstanceFromCallback2 = null;
      let imageInstanceFromRef = null;

      const callback1 = (instance: HostInstance) => {
        imageInstanceFromCallback1 = instance;

        return () => {
          imageInstanceFromCallback1 = null;
        };
      };
      const callback2 = (instance: HostInstance) => {
        imageInstanceFromCallback2 = instance;

        return () => {
          imageInstanceFromCallback2 = null;
        };
      };

      ImageInjection.unstable_registerImageAttachedCallback(callback1);
      ImageInjection.unstable_registerImageAttachedCallback(callback2);

      expect(imageInstanceFromCallback1).toBe(null);
      expect(imageInstanceFromCallback2).toBe(null);

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <Image
            source={LOGO_SOURCE}
            ref={instance => {
              imageInstanceFromRef = instance;
            }}
          />,
        );
      });

      expect(imageInstanceFromRef).not.toBe(null);
      expect(imageInstanceFromCallback1).not.toBe(null);
      expect(imageInstanceFromCallback2).not.toBe(null);
      expect(imageInstanceFromCallback1).toBe(imageInstanceFromRef);
      expect(imageInstanceFromCallback2).toBe(imageInstanceFromRef);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(imageInstanceFromRef).toBe(null);
      expect(imageInstanceFromCallback1).toBe(null);
      expect(imageInstanceFromCallback2).toBe(null);

      ImageInjection.unstable_unregisterImageAttachedCallback(callback1);
      ImageInjection.unstable_unregisterImageAttachedCallback(callback2);
    });

    it('calls image attached callbacks (multiple images)', () => {
      let imageInstancesFromCallback = new Set<HostInstance>();

      const callback = (instance: HostInstance) => {
        imageInstancesFromCallback.add(instance);

        return () => {
          imageInstancesFromCallback.delete(instance);
        };
      };

      ImageInjection.unstable_registerImageAttachedCallback(callback);

      expect(imageInstancesFromCallback.size).toBe(0);

      const root = Fantom.createRoot();

      let firstInstance;
      let secondInstance;

      const firstImageElement = (
        <Image
          key="first-image"
          source={LOGO_SOURCE}
          ref={instance => {
            firstInstance = instance;
          }}
        />
      );

      const secondImageElement = (
        <Image
          key="second-image"
          source={LOGO_SOURCE}
          ref={instance => {
            secondInstance = instance;
          }}
        />
      );

      Fantom.runTask(() => {
        root.render(
          <>
            {firstImageElement}
            {secondImageElement}
          </>,
        );
      });

      expect(firstInstance).not.toBe(null);
      expect(secondInstance).not.toBe(null);
      expect(imageInstancesFromCallback.size).toBe(2);
      expect([...imageInstancesFromCallback][0]).toBe(firstInstance);
      expect([...imageInstancesFromCallback][1]).toBe(secondInstance);

      Fantom.runTask(() => {
        root.render(<>{secondImageElement}</>);
      });

      expect(firstInstance).toBe(null);
      expect(secondInstance).not.toBe(null);
      expect(imageInstancesFromCallback.size).toBe(1);
      expect([...imageInstancesFromCallback][0]).toBe(secondInstance);

      Fantom.runTask(() => {
        root.render(<></>);
      });

      expect(firstInstance).toBe(null);
      expect(secondInstance).toBe(null);
      expect(imageInstancesFromCallback.size).toBe(0);

      ImageInjection.unstable_unregisterImageAttachedCallback(callback);
    });
  });

  describe('static methods', () => {
    afterEach(() => {
      NativeFantom.clearAllImages();
    });

    describe('getSize', () => {
      it('returns the size of the image when image is loaded', () => {
        const uri = 'https://reactnative.dev/img/tiny_logo.png';

        NativeFantom.setImageResponse(uri, {
          width: 100,
          height: 100,
        });

        let size;
        Fantom.runTask(() => {
          Image.getSize(uri, (width, height) => {
            size = {width, height};
          });
        });

        expect(size).toEqual({width: 100, height: 100});
      });

      it('fails when image is not loaded', () => {
        const uri = 'https://reactnative.dev/img/tiny_logo.png';

        let size;
        let err: ?Error;
        Fantom.runTask(async () => {
          Image.getSize(
            uri,
            (width, height) => {
              size = {width, height};
            },
            (e: unknown) => {
              if (e instanceof Error) {
                err = e;
              }
            },
          );
        });

        expect(size).toBeUndefined();
        expect(err).toBeInstanceOf(Error);
        expect(err?.message).toBe('image not loaded');
      });
    });

    describe('getSizeWithHeaders', () => {
      afterEach(() => {
        NativeFantom.clearAllImages();
      });

      it('returns the size of the image when image is loaded', () => {
        const uri = 'https://reactnative.dev/img/tiny_logo.png';

        NativeFantom.setImageResponse(uri, {
          width: 100,
          height: 100,
        });

        let size;
        Fantom.runTask(() => {
          Image.getSizeWithHeaders(
            uri,
            {
              Authorization: 'Basic RandomString',
            },
            (width: number, height: number) => {
              size = {width, height};
            },
          );
        });

        expect(size).toEqual({width: 100, height: 100});
      });
    });

    describe('prefetch', () => {
      it('prefetches the image', () => {
        const uri = 'https://reactnative.dev/img/tiny_logo.png';

        NativeFantom.setImageResponse(uri, {
          width: 100,
          height: 100,
        });

        let result;
        Fantom.runTask(async () => {
          result = await Image.prefetch(uri);
        });

        expect(result).toEqual(true);
      });

      it('can fail to prefetch image', () => {
        const uri = 'https://reactnative.dev/img/tiny_logo.png';

        NativeFantom.setImageResponse(uri, {
          width: 100,
          height: 100,
          errorMessage: 'Failed to prefetch image',
        });

        let result;
        let error;
        Fantom.runTask(async () => {
          try {
            result = await Image.prefetch(uri);
          } catch (e) {
            error = e;
          }
        });

        expect(result).toEqual(undefined);
        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toBe('Failed to prefetch image');
      });
    });

    describe('queryCache', () => {
      it('returns empty when image is not cached', () => {
        const uri = 'https://reactnative.dev/img/tiny_logo.png';

        let result;
        Fantom.runTask(async () => {
          result = await Image.queryCache([uri]);
        });

        expect(result).toEqual({});
      });

      (['disk', 'memory', 'disk/memory'] as const).forEach(cacheStatus => {
        it(`returns the '${cacheStatus}' record when image is cached`, () => {
          const uri = 'https://reactnative.dev/img/tiny_logo.png';

          NativeFantom.setImageResponse(uri, {
            width: 100,
            height: 100,
            cacheStatus,
          });

          let result;
          Fantom.runTask(async () => {
            result = await Image.queryCache([uri]);
          });

          expect(result).toEqual({
            [uri]: cacheStatus,
          });
        });
      });
    });
  });
});
