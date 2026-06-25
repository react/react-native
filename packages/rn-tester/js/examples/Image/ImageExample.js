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
import type {PlatformTestComponentBaseProps} from '../Experimental/PlatformTest/RNTesterPlatformTestTypes';
import type {ImageProps, LayoutChangeEvent} from 'react-native';

import RNTesterButton from '../../components/RNTesterButton';
import RNTesterText from '../../components/RNTesterText';
import RNTesterPlatformTest from '../Experimental/PlatformTest/RNTesterPlatformTest';
import ImageCapInsetsExample from './ImageCapInsetsExample';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {
  Image,
  ImageBackground,
  PixelRatio,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const IMAGE1 =
  'https://www.facebook.com/assets/fb_lite_messaging/E2EE-settings@3x.png';
const IMAGE2 =
  'https://www.facebook.com/ar_effect/external_textures/648609739826677.png';

const base64Icon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABLCAQAAACSR7JhAAADtUlEQVR4Ac3YA2Bj6QLH0XPT1Fzbtm29tW3btm3bfLZtv7e2ObZnms7d8Uw098tuetPzrxv8wiISrtVudrG2JXQZ4VOv+qUfmqCGGl1mqLhoA52oZlb0mrjsnhKpgeUNEs91Z0pd1kvihA3ULGVHiQO2narKSHKkEMulm9VgUyE60s1aWoMQUbpZOWE+kaqs4eLEjdIlZTcFZB0ndc1+lhB1lZrIuk5P2aib1NBpZaL+JaOGIt0ls47SKzLC7CqrlGF6RZ09HGoNy1lYl2aRSWL5GuzqWU1KafRdoRp0iOQEiDzgZPnG6DbldcomadViflnl/cL93tOoVbsOLVM2jylvdWjXolWX1hmfZbGR/wjypDjFLSZIRov09BgYmtUqPQPlQrPapecLgTIy0jMgPKtTeob2zWtrGH3xvjUkPCtNg/tm1rjwrMa+mdUkPd3hWbH0jArPGiU9ufCsNNWFZ40wpwn+62/66R2RUtoso1OB34tnLOcy7YB1fUdc9e0q3yru8PGM773vXsuZ5YIZX+5xmHwHGVvlrGPN6ZSiP1smOsMMde40wKv2VmwPPVXNut4sVpUreZiLBHi0qln/VQeI/LTMYXpsJtFiclUN+5HVZazim+Ky+7sAvxWnvjXrJFneVtLWLyPJu9K3cXLWeOlbMTlrIelbMDlrLenrjEQOtIF+fuI9xRp9ZBFp6+b6WT8RrxEpdK64BuvHgDk+vUy+b5hYk6zfyfs051gRoNO1usU12WWRWL73/MMEy9pMi9qIrR4ZpV16Rrvduxazmy1FSvuFXRkqTnE7m2kdb5U8xGjLw/spRr1uTov4uOgQE+0N/DvFrG/Jt7i/FzwxbA9kDanhf2w+t4V97G8lrT7wc08aA2QNUkuTfW/KimT01wdlfK4yEw030VfT0RtZbzjeMprNq8m8tnSTASrTLti64oBNdpmMQm0eEwvfPwRbUBywG5TzjPCsdwk3IeAXjQblLCoXnDVeoAz6SfJNk5TTzytCNZk/POtTSV40NwOFWzw86wNJRpubpXsn60NJFlHeqlYRbslqZm2jnEZ3qcSKgm0kTli3zZVS7y/iivZTweYXJ26Y+RTbV1zh3hYkgyFGSTKPfRVbRqWWVReaxYeSLarYv1Qqsmh1s95S7G+eEWK0f3jYKTbV6bOwepjfhtafsvUsqrQvrGC8YhmnO9cSCk3yuY984F1vesdHYhWJ5FvASlacshUsajFt2mUM9pqzvKGcyNJW0arTKN1GGGzQlH0tXwLDgQTurS8eIQAAAABJRU5ErkJggg==';
const IMAGE_PREFETCH_URL = `${IMAGE1}?r=1&t=${Date.now()}`;
const prefetchTask = Image.prefetch(IMAGE_PREFETCH_URL);

type ImageSource = Readonly<{
  uri: string,
}>;

type BlobImageProps = Readonly<{
  url: string,
}>;

const BlobImage = ({url}: BlobImageProps): React.Node => {
  const [objectURL, setObjectURL] = useState<?string>(null);

  useEffect(() => {
    // $FlowFixMe[unused-promise]
    (async () => {
      const result = await fetch(url);
      const blob = await result.blob();
      setObjectURL(URL.createObjectURL(blob));
    })();
  }, [url]);

  return objectURL !== null ? (
    <Image source={{uri: objectURL}} style={styles.base} />
  ) : (
    <Text>Object URL not created yet</Text>
  );
};

type BlobImageExampleState = {};

type BlobImageExampleProps = Readonly<{
  urls: string[],
}>;

class BlobImageExample extends React.Component<
  BlobImageExampleProps,
  BlobImageExampleState,
> {
  render(): React.Node {
    return (
      <View style={styles.horizontal}>
        {this.props.urls.map(url => (
          <BlobImage key={url} url={url} />
        ))}
      </View>
    );
  }
}

type NetworkImageCallbackExampleProps = Readonly<{
  source: ImageSource,
  prefetchedSource: ImageSource,
}>;

const NetworkImageCallbackExample = ({
  source,
  prefetchedSource,
}: NetworkImageCallbackExampleProps): React.Node => {
  const [events, setEvents] = useState<ReadonlyArray<string>>([]);
  const [startLoadPrefetched, setStartLoadPrefetched] = useState(false);
  const [mountTime, setMountTime] = useState(Date.now());

  useEffect(() => {
    setMountTime(Date.now());
  }, []);

  const _loadEventFired = (event: string) => {
    setEvents(state => [...state, event]);
  };

  return (
    <View>
      <Image
        source={source}
        style={[styles.base, styles.visibleOverflow]}
        onError={event => {
          _loadEventFired(
            `✘ onError "${event.nativeEvent.error}" (+${Date.now() - mountTime}ms)`,
          );
        }}
        onLoadStart={() =>
          _loadEventFired(`✔ onLoadStart (+${Date.now() - mountTime}ms)`)
        }
        onProgress={event => {
          const {loaded, total} = event.nativeEvent;
          const percent = Math.round((loaded / total) * 100);
          _loadEventFired(
            `✔ onProgress ${percent}% (+${Date.now() - mountTime}ms)`,
          );
        }}
        onLoad={event => {
          if (event.nativeEvent.source) {
            const url = event.nativeEvent.source.uri;
            _loadEventFired(
              `✔ onLoad (+${Date.now() - mountTime}ms) for URL ${url}`,
            );
          } else {
            _loadEventFired(`✔ onLoad (+${Date.now() - mountTime}ms)`);
          }
        }}
        onLoadEnd={() => {
          _loadEventFired(`✔ onLoadEnd (+${Date.now() - mountTime}ms)`);
          setStartLoadPrefetched(true);
          prefetchTask.then(
            () => {
              _loadEventFired(`✔ prefetch OK (+${Date.now() - mountTime}ms)`);
              // $FlowFixMe[unused-promise]
              Image.queryCache([IMAGE_PREFETCH_URL]).then(map => {
                const result = map[IMAGE_PREFETCH_URL];
                if (result) {
                  _loadEventFired(
                    `✔ queryCache "${result}" (+${Date.now() - mountTime}ms)`,
                  );
                } else {
                  _loadEventFired(
                    `✘ queryCache (+${Date.now() - mountTime}ms)`,
                  );
                }
              });
            },
            error => {
              _loadEventFired(
                `✘ prefetch failed (+${Date.now() - mountTime}ms)`,
              );
            },
          );
        }}
      />
      {startLoadPrefetched && (
        <Image
          source={prefetchedSource}
          style={[styles.base, styles.visibleOverflow]}
          onLoadStart={() =>
            _loadEventFired(
              `✔ (prefetched) onLoadStart (+${Date.now() - mountTime}ms)`,
            )
          }
          onLoad={event => {
            if (event.nativeEvent.source) {
              const url = event.nativeEvent.source.uri;
              _loadEventFired(
                `✔ (prefetched) onLoad (+${
                  Date.now() - mountTime
                }ms) for URL ${url}`,
              );
            } else {
              _loadEventFired(
                `✔ (prefetched) onLoad (+${Date.now() - mountTime}ms)`,
              );
            }
          }}
          onLoadEnd={() =>
            _loadEventFired(
              `✔ (prefetched) onLoadEnd (+${Date.now() - mountTime}ms)`,
            )
          }
        />
      )}
      <RNTesterText style={styles.networkImageText}>
        {events.join('\n')}
      </RNTesterText>
    </View>
  );
};

type NetworkImageExampleState = {
  error: ?string,
  loading: boolean,
  progress: ReadonlyArray<number>,
};

class NetworkImageExample extends React.Component<
  ImageProps,
  NetworkImageExampleState,
> {
  state: NetworkImageExampleState = {
    error: null,
    loading: false,
    progress: [],
  };

  render(): React.Node {
    return this.state.error != null ? (
      <RNTesterText variant="label">{this.state.error}</RNTesterText>
    ) : (
      <>
        <Image
          {...this.props}
          style={[styles.base, styles.visibleOverflow]}
          onLoadStart={e => this.setState({loading: true})}
          onError={e =>
            this.setState({error: e.nativeEvent.error, loading: false})
          }
          onProgress={e => {
            const {loaded, total} = e.nativeEvent;
            this.setState(prevState => ({
              progress: [
                ...prevState.progress,
                Math.round((100 * loaded) / total),
              ],
            }));
          }}
          onLoad={() => this.setState({loading: false, error: null})}
        />
        <RNTesterText variant="label">
          Progress:{' '}
          {this.state.progress.map(progress => `${progress}%`).join('\n')}
        </RNTesterText>
      </>
    );
  }
}

type ImageSizeExampleState = {
  width: number,
  height: number,
};

type ImageSizeExampleProps = Readonly<{
  source: ImageSource,
}>;

class ImageSizeExample extends React.Component<
  ImageSizeExampleProps,
  ImageSizeExampleState,
> {
  state: ImageSizeExampleState = {
    width: 0,
    height: 0,
  };

  componentDidMount() {
    Image.getSize(this.props.source.uri, (width, height) => {
      this.setState({width, height});
    });
  }

  render(): React.Node {
    return (
      <View style={styles.flexRow}>
        <Image style={styles.imageSizeExample} source={this.props.source} />
        <RNTesterText>
          Actual dimensions:{'\n'}
          Width: {this.state.width}, Height: {this.state.height}
        </RNTesterText>
      </View>
    );
  }
}

type MultipleSourcesExampleState = {
  width: number,
  height: number,
};

type MultipleSourcesExampleProps = Readonly<{}>;

class MultipleSourcesExample extends React.Component<
  MultipleSourcesExampleProps,
  MultipleSourcesExampleState,
> {
  state: MultipleSourcesExampleState = {
    width: 30,
    height: 30,
  };

  increaseImageSize = () => {
    if (this.state.width >= 100) {
      return;
    }
    this.setState({
      width: this.state.width + 10,
      height: this.state.height + 10,
    });
  };

  decreaseImageSize = () => {
    if (this.state.width <= 10) {
      return;
    }
    this.setState({
      width: this.state.width - 10,
      height: this.state.height - 10,
    });
  };

  render(): React.Node {
    return (
      <View>
        <View style={styles.spaceBetweenView}>
          <RNTesterText
            style={styles.touchableText}
            onPress={this.decreaseImageSize}>
            Decrease image size
          </RNTesterText>
          <RNTesterText
            style={styles.touchableText}
            onPress={this.increaseImageSize}>
            Increase image size
          </RNTesterText>
        </View>
        <RNTesterText>
          Container image size: {this.state.width}x{this.state.height}{' '}
        </RNTesterText>
        <View style={{height: this.state.height, width: this.state.width}}>
          <Image
            style={styles.flex}
            source={[
              {
                uri: IMAGE1,
                width: 38,
                height: 38,
              },
              {
                uri: IMAGE2,
                width: 100,
                height: 100,
              },
            ]}
          />
        </View>
      </View>
    );
  }
}

type LoadingIndicatorSourceExampleState = {
  imageHash: number,
};

type LoadingIndicatorSourceExampleProps = Readonly<{}>;

class LoadingIndicatorSourceExample extends React.Component<
  LoadingIndicatorSourceExampleProps,
  LoadingIndicatorSourceExampleState,
> {
  state: LoadingIndicatorSourceExampleState = {
    imageHash: Date.now(),
  };

  reloadImage = () => {
    this.setState({
      imageHash: Date.now(),
    });
  };

  loaderGif: {uri: string} = {
    uri: 'https://media1.giphy.com/media/3oEjI6SIIHBdRxXI40/200.gif',
  };

  render(): React.Node {
    const loadingImage = {
      uri: `${IMAGE2}?hash=${this.state.imageHash}`,
    };

    return (
      <View>
        <View style={styles.spaceBetweenView}>
          <RNTesterText style={styles.touchableText} onPress={this.reloadImage}>
            Refresh Image
          </RNTesterText>
        </View>
        <Image
          loadingIndicatorSource={this.loaderGif}
          source={loadingImage}
          style={styles.base}
        />
        <RNTesterText>Image Hash: {this.state.imageHash}</RNTesterText>
        <RNTesterText>Image URI: {loadingImage.uri}</RNTesterText>
      </View>
    );
  }
}

type FadeDurationExampleState = {
  imageHash: number,
};

type FadeDurationExampleProps = Readonly<{}>;

class FadeDurationExample extends React.Component<
  FadeDurationExampleProps,
  FadeDurationExampleState,
> {
  state: FadeDurationExampleState = {
    imageHash: Date.now(),
  };

  reloadImage = () => {
    this.setState({
      imageHash: Date.now(),
    });
  };

  render(): React.Node {
    const loadingImage = {
      uri: `${IMAGE2}?hash=${this.state.imageHash}`,
    };

    return (
      <View>
        <View style={styles.spaceBetweenView}>
          <Text style={styles.touchableText} onPress={this.reloadImage}>
            Refresh Image
          </Text>
        </View>
        <Image fadeDuration={1500} source={loadingImage} style={styles.base} />
        <RNTesterText>
          This image will fade in over the time of 1.5s.
        </RNTesterText>
      </View>
    );
  }
}

type OnLayoutExampleState = {
  width: number,
  height: number,
  layoutHandlerMessage: string,
};

type OnLayoutExampleProps = Readonly<{}>;

class OnLayoutExample extends React.Component<
  OnLayoutExampleProps,
  OnLayoutExampleState,
> {
  state: OnLayoutExampleState = {
    width: 30,
    height: 30,
    layoutHandlerMessage: 'No Message',
  };

  onLayoutHandler = (event: LayoutChangeEvent) => {
    this.setState({
      width: this.state.width,
      height: this.state.height,
      layoutHandlerMessage: JSON.stringify(event.nativeEvent),
    });
    console.log(event.nativeEvent);
  };

  increaseImageSize = () => {
    if (this.state.width >= 100) {
      return;
    }
    this.setState({
      width: this.state.width + 10,
      height: this.state.height + 10,
    });
  };

  decreaseImageSize = () => {
    if (this.state.width <= 10) {
      return;
    }
    this.setState({
      width: this.state.width - 10,
      height: this.state.height - 10,
    });
  };

  render(): React.Node {
    return (
      <View>
        <RNTesterText>
          Adjust the image size to trigger the OnLayout handler.
        </RNTesterText>
        <View style={styles.spaceBetweenView}>
          <Text style={styles.touchableText} onPress={this.decreaseImageSize}>
            Decrease image size
          </Text>
          <Text style={styles.touchableText} onPress={this.increaseImageSize}>
            Increase image size
          </Text>
        </View>
        <RNTesterText>
          Container image size: {this.state.width}x{this.state.height}{' '}
        </RNTesterText>
        <View style={{height: this.state.height, width: this.state.width}}>
          <Image
            onLayout={this.onLayoutHandler}
            style={styles.flex}
            source={[
              {
                uri: IMAGE1,
                width: 38,
                height: 38,
              },
              {
                uri: IMAGE1,
                width: 76,
                height: 76,
              },
              {
                uri: IMAGE2,
                width: 400,
                height: 400,
              },
            ]}
          />
        </View>
        <RNTesterText>
          Layout Handler Message: {this.state.layoutHandlerMessage}
        </RNTesterText>
      </View>
    );
  }
}

type OnPartialLoadExampleState = {
  hasLoaded: boolean,
};

type OnPartialLoadExampleProps = Readonly<{}>;

class OnPartialLoadExample extends React.Component<
  OnPartialLoadExampleProps,
  OnPartialLoadExampleState,
> {
  state: OnPartialLoadExampleState = {
    hasLoaded: false,
  };

  partialLoadHandler = () => {
    this.setState({
      hasLoaded: true,
    });
  };

  render(): React.Node {
    return (
      <View>
        <RNTesterText>
          Partial Load Function Executed: {JSON.stringify(this.state.hasLoaded)}
        </RNTesterText>
        <Image
          source={{
            uri: `https://www.facebook.com/assets/react_native_oss_tests/large-image@1x.jpg&buster=${Math.random()}`,
          }}
          onPartialLoad={this.partialLoadHandler}
          style={styles.base}
        />
      </View>
    );
  }
}

const VectorDrawableExample = () => {
  return (
    <View style={styles.flex} testID="vector-drawable-example">
      <View style={styles.horizontal}>
        <Image
          source={require('../../assets/ic_android.xml')}
          style={styles.vectorDrawable}
        />
        <Image
          source={require('../../assets/ic_android.xml')}
          style={styles.vectorDrawable}
          tintColor="red"
        />
      </View>
    </View>
  );
};

const VectorDrawableGetSizeExample = () => {
  const [results, setResults] = useState<
    Array<{name: string, status: string, width?: number, height?: number}>,
  >([]);

  const testResources = [
    {name: 'ic_vector_test_24', label: 'VectorDrawable (24dp circle)'},
    {
      name: 'ic_launcher_foreground',
      label: 'VectorDrawable (108dp React logo)',
    },
    {name: 'ic_launcher_background', label: 'VectorDrawable (108dp grid)'},
    {name: 'ic_menu_black_24dp', label: 'PNG drawable (24dp menu icon)'},
    {
      name: 'ic_settings_black_48dp',
      label: 'PNG drawable (48dp settings icon)',
    },
    {name: 'nonexistent_drawable', label: 'Non-existent resource'},
  ];

  const runTest = () => {
    setResults([]);
    const scale = PixelRatio.get();
    testResources.forEach(({name, label}) => {
      Image.getSize(
        name,
        (width, height) => {
          setResults(prev => [
            ...prev,
            {
              name: label,
              status: 'success',
              width: Math.round(width / scale),
              height: Math.round(height / scale),
            },
          ]);
        },
        (error: unknown) => {
          setResults(prev => [
            ...prev,
            {name: label, status: `error: ${String(error)}`},
          ]);
        },
      );
    });
  };

  return (
    <View testID="vector-drawable-getsize-example">
      <RNTesterButton onPress={runTest}>
        Run Image.getSize on local drawable resources
      </RNTesterButton>
      {results.map((result, index) => (
        <View key={index} style={styles.getSizeRow}>
          <RNTesterText style={styles.getSizeLabel}>{result.name}</RNTesterText>
          {result.status === 'success' ? (
            <RNTesterText style={styles.getSizeSuccess}>
              {result.width}x{result.height} dp
            </RNTesterText>
          ) : (
            <RNTesterText style={styles.getSizeError}>
              {result.status}
            </RNTesterText>
          )}
        </View>
      ))}
    </View>
  );
};

function CacheControlExample(): React.Node {
  const [reload, setReload] = useState(0);

  const onReload = () => {
    setReload(prevReload => prevReload + 1);
  };

  return (
    <>
      <View style={styles.horizontal}>
        <View>
          <RNTesterText style={styles.resizeModeText}>Default</RNTesterText>
          <Image
            source={{
              uri: fullImage.uri + '?cacheBust=default',
              cache: 'default',
            }}
            style={styles.base}
            key={reload}
          />
        </View>
        <View style={styles.leftMargin}>
          <RNTesterText style={styles.resizeModeText}>Reload</RNTesterText>
          <Image
            source={{
              uri: fullImage.uri + '?cacheBust=reload',
              cache: 'reload',
            }}
            style={styles.base}
            key={reload}
          />
        </View>
        <View style={styles.leftMargin}>
          <RNTesterText style={styles.resizeModeText}>Force-cache</RNTesterText>
          <Image
            source={{
              uri: fullImage.uri + '?cacheBust=force-cache',
              cache: 'force-cache',
            }}
            style={styles.base}
            key={reload}
            onError={e => console.log(e.nativeEvent.error)}
          />
        </View>
        <View style={styles.leftMargin}>
          <RNTesterText style={styles.resizeModeText}>
            Only-if-cached
          </RNTesterText>
          <Image
            source={{
              uri: fullImage.uri + '?cacheBust=only-if-cached',
              cache: 'only-if-cached',
            }}
            style={styles.base}
            key={reload}
            onError={e => console.log(e.nativeEvent.error)}
          />
        </View>
      </View>

      <View style={styles.horizontal}>
        <View style={styles.cachePolicyAndroidButtonContainer}>
          <RNTesterButton onPress={onReload}>
            Re-render image components
          </RNTesterButton>
        </View>
      </View>
    </>
  );
}

const fullImage: ImageSource = {
  uri: IMAGE2,
};
const smallImage = {
  uri: IMAGE1,
};

const GET_SIZE_TEST_IMAGES: ReadonlyArray<{
  expectedHeight: number,
  expectedWidth: number,
  uri: string,
  name: string,
}> = [
  {
    expectedHeight: 492,
    expectedWidth: 960,
    uri: IMAGE1,
    name: 'large PNG',
  },
  {
    expectedHeight: 3000,
    expectedWidth: 4500,
    uri: 'https://www.facebook.com/assets/react_native_oss_tests/large-image@1x.jpg',
    name: 'large JPEG with density 2',
  },
  {
    expectedHeight: 1200,
    expectedWidth: 1800,
    // Rotated 90 degrees counter-clockwise
    uri: 'https://www.facebook.com/assets/react_native_oss_tests/exif-6@1x.jpg',
    name: 'EXIF rotated JPEG',
  },
];

function getImageSize(uri: string): Promise<{height: number, width: number}> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({height, width}), reject);
  });
}

function ImageGetSizePlatformTest(props: PlatformTestComponentBaseProps) {
  const {harness} = props;
  const asyncTest = harness.useAsyncTest(
    'Image.getSize resolves source dimensions',
    30000,
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      GET_SIZE_TEST_IMAGES.map(image =>
        getImageSize(image.uri).then(size => ({image, size})),
      ),
    )
      .then(results => {
        if (cancelled) {
          return;
        }

        for (const result of results) {
          asyncTest.step(({assert_equals}) => {
            assert_equals(
              result.size.width,
              result.image.expectedWidth,
              `${result.image.name} width`,
            );
            assert_equals(
              result.size.height,
              result.image.expectedHeight,
              `${result.image.name} height`,
            );
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          asyncTest.step(({assert_true}) => {
            assert_true(false, `Image.getSize failed: ${String(error)}`);
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          asyncTest.done();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [asyncTest]);

  return (
    <RNTesterText>
      Calling Image.getSize for {GET_SIZE_TEST_IMAGES.length} remote images.
    </RNTesterText>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 64,
    height: 64,
    margin: 4,
  },
  visibleOverflow: {
    overflow: 'visible',
  },
  leftMargin: {
    marginLeft: 10,
  },
  background: {
    backgroundColor: '#222222',
  },
  sectionText: {
    marginVertical: 6,
  },
  nestedText: {
    marginLeft: 12,
    marginTop: 20,
    backgroundColor: 'transparent',
    color: 'white',
  },
  resizeMode: {
    width: 90,
    height: 60,
    borderWidth: 0.5,
    borderColor: 'black',
  },
  resizeModeText: {
    fontSize: 11,
    marginBottom: 3,
  },
  icon: {
    width: 15,
    height: 15,
    margin: 4,
  },
  horizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gif: {
    flex: 1,
    height: 200,
  },
  base64: {
    flex: 1,
    height: 50,
    resizeMode: 'contain',
  },
  touchableText: {
    fontWeight: '500',
    color: 'blue',
  },
  networkImageText: {
    marginTop: 20,
  },
  flex: {
    flex: 1,
  },
  imageWithBorderRadius: {
    borderRadius: 5,
  },
  imageSizeExample: {
    width: 60,
    height: 60,
    backgroundColor: 'transparent',
    marginRight: 10,
  },
  flexRow: {
    flexDirection: 'row',
  },
  spaceBetweenView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customBorderColor: {
    borderWidth: 5,
    borderColor: '#f099f0',
  },
  borderTopLeftRadius: {
    borderTopLeftRadius: 20,
  },
  opacity1: {
    opacity: 1,
  },
  opacity2: {
    opacity: 0.8,
  },
  opacity3: {
    opacity: 0.6,
  },
  opacity4: {
    opacity: 0.4,
  },
  opacity5: {
    opacity: 0.2,
  },
  opacity6: {
    opacity: 0,
  },
  transparentImageBackground: {
    width: 60,
    height: 60,
    backgroundColor: 'transparent',
  },
  tintColor1: {
    tintColor: '#ff2d55',
  },
  tintColor2: {
    tintColor: '#5ac8fa',
  },
  tintColor3: {
    tintColor: '#4cd964',
  },
  tintColor4: {
    tintColor: '#8e8e93',
  },
  objectFitContain: {
    objectFit: 'contain',
  },
  objectFitCover: {
    objectFit: 'cover',
  },
  objectFitFill: {
    objectFit: 'fill',
  },
  objectFitScaleDown: {
    objectFit: 'scale-down',
  },
  objectFitNone: {
    objectFit: 'none',
  },
  imageInBundle: {
    borderColor: 'yellow',
    borderWidth: 4,
  },
  imageInAssetCatalog: {
    marginLeft: 10,
    borderColor: 'blue',
    borderWidth: 4,
  },
  backgroundColor1: {
    backgroundColor: 'rgba(0, 0, 100, 0.25)',
  },
  backgroundColor2: {
    backgroundColor: 'red',
  },
  backgroundColor3: {
    backgroundColor: 'red',
    borderColor: 'green',
    borderWidth: 3,
    borderRadius: 25,
  },
  borderRadius1: {
    borderRadius: 19,
  },
  borderRadius2: {
    borderWidth: 4,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 20,
    borderColor: 'green',
  },
  borderRadius3: {
    resizeMode: 'cover',
    width: 90,
    borderWidth: 4,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 40,
    borderColor: 'red',
  },
  borderRadius4: {
    resizeMode: 'stretch',
    width: 90,
    borderWidth: 4,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 40,
    borderColor: 'red',
    backgroundColor: 'yellow',
  },
  borderRadius5: {
    resizeMode: 'contain',
    width: 90,
    borderWidth: 4,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 40,
    borderColor: 'red',
    backgroundColor: 'yellow',
  },
  boxShadow: {
    margin: 10,
  },
  boxShadowWithBackground: {
    backgroundColor: 'lightblue',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.5)',
  },
  boxShadowMultiOutsetInset: {
    boxShadow:
      '-5px -5px 10px 2px rgba(0, 128, 0, 0.5), 5px 5px 10px 2px rgba(128, 0, 0, 0.5), inset orange 0px 0px 20px 0px, black 0px 0px 5px 1px',
    borderColor: 'blue',
    borderWidth: 1,
    borderRadius: 20,
  },
  boxShadowAsymetricallyRounded: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 20,
    marginRight: 80,
    marginTop: 40,
    boxShadow: '80px 0px 10px 0px hotpink',
    transform: 'rotate(-15deg)',
  },
  vectorDrawable: {
    height: 64,
    width: 64,
  },
  getSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  getSizeLabel: {
    flex: 1,
  },
  getSizeSuccess: {
    color: 'green',
    fontWeight: 'bold',
  },
  getSizeError: {
    color: 'red',
  },
  resizedImage: {
    height: 100,
    width: '500%',
  },
  cachePolicyAndroidButtonContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 10,
  },
});

exports.displayName = undefined as ?string;
exports.framework = 'React';
exports.title = 'Image';
exports.category = 'Basic';
exports.description =
  'Base component for displaying different types of images.';

exports.examples = [
  {
    title: 'Plain Network Image with `source` prop.',
    description: ('If the `source` prop `uri` property is prefixed with ' +
      '"http", then it will be downloaded from the network.') as string,
    render: function (): React.Node {
      return <Image source={fullImage} style={styles.base} />;
    },
  },
  {
    title: 'Plain Network Image with `src` prop.',
    description: ('If the `src` prop is defined with ' +
      '"http", then it will be downloaded from the network.') as string,
    render: function (): React.Node {
      return <Image src={fullImage.uri} style={styles.base} />;
    },
  },
  {
    title: 'Multiple Image Source using the `srcSet` prop.',
    description:
      ('A list of comma separated uris along with scale are provided in `srcSet`.' +
        'An appropriate value will be used based on the scale of the device.') as string,
    render: function (): React.Node {
      return (
        <Image
          width={64}
          height={64}
          srcSet={`${IMAGE2} 4x, ${IMAGE1} 2x`}
          style={styles.base}
        />
      );
    },
  },
  {
    title: 'Plain Blob Image',
    description: ('If the `source` prop `uri` property is an object URL, ' +
      'then it will be resolved using `BlobProvider` (Android) or `RCTBlobManager` (iOS).') as string,
    render: function (): React.Node {
      return <BlobImageExample urls={[IMAGE1, IMAGE2]} />;
    },
  },
  {
    title: 'Plain Static Image',
    name: 'static-image',
    description:
      ('Static assets should be placed in the source code tree, and ' +
        'required in the same way as JavaScript modules.') as string,
    render: function (): React.Node {
      return (
        <View testID="image-static" style={styles.horizontal}>
          <Image
            source={require('../../assets/uie_thumb_normal.png')}
            style={styles.icon}
          />
          <Image
            source={require('../../assets/uie_thumb_selected.png')}
            style={styles.icon}
          />
          <Image
            source={require('../../assets/uie_comment_normal.png')}
            style={styles.icon}
          />
          <Image
            source={require('../../assets/uie_comment_highlighted.png')}
            style={styles.icon}
          />
        </View>
      );
    },
  },
  {
    title: 'Image Loading Events',
    render: function (): React.Node {
      return (
        <NetworkImageCallbackExample
          source={{
            uri: `${IMAGE1}?r=1&t=${Date.now()}`,
          }}
          prefetchedSource={{uri: IMAGE_PREFETCH_URL}}
        />
      );
    },
  },
  {
    title: 'Error Handler',
    render: function (): React.Node {
      return (
        <NetworkImageExample
          source={{
            uri: IMAGE1 + '_TYPO',
          }}
        />
      );
    },
  },
  {
    title: 'Error Handler for Large Images',
    render: function (): React.Node {
      return (
        <NetworkImageExample
          resizeMethod="none"
          // 6000x5340 ~ 128 MB
          source={require('../../assets/very-large-image.png')}
        />
      );
    },
  },
  {
    title: 'Image Download Progress',
    render: function (): React.Node {
      return (
        <NetworkImageExample
          source={{
            uri: `${IMAGE1}?r=1`,
          }}
        />
      );
    },
  },
  {
    title: 'defaultSource',
    description: 'Show a placeholder image when a network image is loading',
    render: function (): React.Node {
      return (
        <Image
          defaultSource={require('../../assets/bunny.png')}
          source={{
            // Note: Use a large image and bust cache so we can in fact
            // visualize the `defaultSource` image.
            uri: fullImage.uri + '?cacheBust=notinCache' + Date.now(),
          }}
          style={styles.base}
        />
      );
    },
    platform: 'ios',
  },
  {
    title: 'Cache Policy',
    description: `- First image will be loaded and cached.
- Second image is the same but will be reloaded if re-rendered as the cache policy is set to reload.
- Third image will try to load from the cache first and only use the network if the cached version is unavailable.
- Fourth image will never be loaded as the cache policy is set to only-if-cached and the image has not been loaded before.`,
    render: function (): React.Node {
      return <CacheControlExample />;
    },
  },
  {
    title: 'Borders',
    name: 'borders',
    render: function (): React.Node {
      return (
        <View style={styles.horizontal} testID="borders-example">
          <Image
            source={smallImage}
            style={[styles.base, styles.background, styles.customBorderColor]}
          />
        </View>
      );
    },
  },
  {
    title: 'Border Radius',
    name: 'border-radius',
    render: function (): React.Node {
      return (
        <View style={styles.horizontal} testID="border-radius-example">
          <Image
            style={[styles.base, styles.imageWithBorderRadius]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.borderRadius1]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.borderTopLeftRadius]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.borderRadius2]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.borderRadius3]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.borderRadius4]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.borderRadius5]}
            source={fullImage}
          />
        </View>
      );
    },
  },
  {
    title: 'Background Color',
    name: 'background-color',
    render: function (): React.Node {
      return (
        <View style={styles.horizontal} testID="background-color-example">
          <Image source={smallImage} style={styles.base} />
          <Image
            style={[styles.base, styles.backgroundColor1]}
            source={smallImage}
          />
          <Image
            style={[styles.base, styles.backgroundColor2]}
            source={smallImage}
          />
          <Image
            style={[styles.base, styles.backgroundColor3]}
            source={smallImage}
          />
        </View>
      );
    },
  },
  {
    title: 'Box Shadow',
    name: 'box-shadow',
    render: function (): React.Node {
      return (
        <View style={styles.horizontal} testID="box-shadow-example">
          <Image
            style={[
              styles.base,
              styles.boxShadow,
              styles.boxShadowWithBackground,
            ]}
            source={smallImage}
          />
          <Image
            style={[
              styles.base,
              styles.boxShadow,
              styles.boxShadowMultiOutsetInset,
            ]}
            source={smallImage}
          />
          <Image
            style={[
              styles.base,
              styles.boxShadow,
              styles.boxShadowAsymetricallyRounded,
            ]}
            source={fullImage}
          />
        </View>
      );
    },
  },
  {
    title: 'Opacity',
    name: 'opacity',
    render: function (): React.Node {
      return (
        <View testID="image-opacity" style={styles.horizontal}>
          <Image style={[styles.base, styles.opacity1]} source={fullImage} />
          <Image style={[styles.base, styles.opacity2]} source={fullImage} />
          <Image style={[styles.base, styles.opacity3]} source={fullImage} />
          <Image style={[styles.base, styles.opacity4]} source={fullImage} />
          <Image style={[styles.base, styles.opacity5]} source={fullImage} />
          <Image style={[styles.base, styles.opacity6]} source={fullImage} />
        </View>
      );
    },
  },
  {
    title: 'Nesting content inside <Image> component',
    name: 'nesting-content',
    render: function (): React.Node {
      return (
        <View testID="image-nesting-content" style={styles.base}>
          <Image style={{...StyleSheet.absoluteFill}} source={fullImage} />
          <Text style={styles.nestedText}>React</Text>
        </View>
      );
    },
  },
  {
    title: 'Nesting content inside <ImageBackground> component',
    name: 'nesting-image-background',
    render: function (): React.Node {
      return (
        <ImageBackground
          testID="image-nesting-background"
          style={styles.transparentImageBackground}
          source={fullImage}>
          <Text style={styles.nestedText}>React</Text>
        </ImageBackground>
      );
    },
  },
  {
    title: 'Tint Color',
    name: 'tint-color',
    description: ('The `tintColor` prop changes all the non-alpha ' +
      'pixels to the tint color.') as string,
    render: function (): React.Node {
      return (
        <View testID="image-tint-color">
          <View style={styles.horizontal}>
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.imageWithBorderRadius,
                styles.tintColor1,
              ]}
              tintColor={'#5ac8fa'}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[styles.icon, styles.imageWithBorderRadius]}
              tintColor={'#4cd964'}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[styles.icon, styles.imageWithBorderRadius]}
              tintColor={'#ff2d55'}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[styles.icon, styles.imageWithBorderRadius]}
              tintColor={'#8e8e93'}
            />
          </View>
          <RNTesterText style={styles.sectionText} variant="label">
            It also works using the `tintColor` style prop
          </RNTesterText>
          <View style={styles.horizontal}>
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.imageWithBorderRadius,
                styles.tintColor2,
              ]}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.imageWithBorderRadius,
                styles.tintColor3,
              ]}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.imageWithBorderRadius,
                styles.tintColor1,
              ]}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.imageWithBorderRadius,
                styles.tintColor4,
              ]}
            />
          </View>
          <RNTesterText style={styles.sectionText} variant="label">
            The `tintColor` prop has precedence over the `tintColor` style prop
          </RNTesterText>
          <View style={styles.horizontal}>
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.imageWithBorderRadius,
                styles.tintColor2,
              ]}
              tintColor={'#5ac8fa'}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.imageWithBorderRadius,
                styles.tintColor3,
              ]}
              tintColor={'#5ac8fa'}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.imageWithBorderRadius,
                styles.tintColor1,
              ]}
              tintColor={'#5ac8fa'}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.imageWithBorderRadius,
                styles.tintColor4,
              ]}
              tintColor={'#5ac8fa'}
            />
          </View>
          <RNTesterText style={styles.sectionText} variant="label">
            It also works with downloaded images:
          </RNTesterText>
          <View style={styles.horizontal}>
            <Image
              source={smallImage}
              style={[
                styles.base,
                styles.imageWithBorderRadius,
                styles.tintColor2,
              ]}
            />
            <Image
              source={smallImage}
              style={[
                styles.base,
                styles.imageWithBorderRadius,
                styles.tintColor3,
              ]}
            />
            <Image
              source={smallImage}
              style={[
                styles.base,
                styles.imageWithBorderRadius,
                styles.tintColor1,
              ]}
            />
            <Image
              source={smallImage}
              style={[
                styles.base,
                styles.imageWithBorderRadius,
                styles.tintColor4,
              ]}
            />
          </View>
        </View>
      );
    },
  },
  {
    title: 'Object Fit',
    description: ('The `objectFit` style prop controls how the image is ' +
      'rendered within the frame.') as string,
    render: function (): React.Node {
      return (
        <View>
          {[smallImage, fullImage].map((image, index) => {
            return (
              <View key={index}>
                <View style={styles.horizontal}>
                  <View>
                    <RNTesterText style={styles.resizeModeText}>
                      Contain
                    </RNTesterText>
                    <Image
                      style={[styles.resizeMode, styles.objectFitContain]}
                      source={image}
                    />
                  </View>
                  <View style={styles.leftMargin}>
                    <RNTesterText style={styles.resizeModeText}>
                      Cover
                    </RNTesterText>
                    <Image
                      style={[styles.resizeMode, styles.objectFitCover]}
                      source={image}
                    />
                  </View>
                </View>
                <View style={styles.horizontal}>
                  <View>
                    <RNTesterText style={styles.resizeModeText}>
                      Fill
                    </RNTesterText>
                    <Image
                      style={[styles.resizeMode, styles.objectFitFill]}
                      source={image}
                    />
                  </View>
                  <View style={styles.leftMargin}>
                    <RNTesterText style={styles.resizeModeText}>
                      Scale Down
                    </RNTesterText>
                    <Image
                      style={[styles.resizeMode, styles.objectFitScaleDown]}
                      source={image}
                    />
                  </View>
                </View>
                <View style={styles.horizontal}>
                  <View>
                    <RNTesterText style={styles.resizeModeText}>
                      None
                    </RNTesterText>
                    <Image
                      style={[styles.resizeMode, styles.objectFitNone]}
                      source={image}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      );
    },
  },
  {
    title: 'Resize Mode',
    description: ('The `resizeMode` style prop controls how the image is ' +
      'rendered within the frame.') as string,
    render: function (): React.Node {
      return (
        <View>
          {[smallImage, fullImage].map((image, index) => {
            return (
              <View key={index}>
                <View style={styles.horizontal}>
                  <View>
                    <RNTesterText style={styles.resizeModeText}>
                      Contain
                    </RNTesterText>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="contain"
                      source={image}
                    />
                  </View>
                  <View style={styles.leftMargin}>
                    <RNTesterText style={styles.resizeModeText}>
                      Cover
                    </RNTesterText>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="cover"
                      source={image}
                    />
                  </View>
                </View>
                <View style={styles.horizontal}>
                  <View>
                    <RNTesterText style={styles.resizeModeText}>
                      Stretch
                    </RNTesterText>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="stretch"
                      source={image}
                    />
                  </View>
                  <View style={styles.leftMargin}>
                    <RNTesterText style={styles.resizeModeText}>
                      Repeat
                    </RNTesterText>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="repeat"
                      source={image}
                    />
                  </View>
                  <View style={styles.leftMargin}>
                    <RNTesterText style={styles.resizeModeText}>
                      Center
                    </RNTesterText>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="center"
                      source={image}
                    />
                  </View>
                </View>
                <View style={styles.horizontal}>
                  <View>
                    <RNTesterText style={styles.resizeModeText}>
                      None
                    </RNTesterText>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="none"
                      source={image}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      );
    },
  },
  {
    title: 'Animated GIF',
    name: 'animated-gif',
    render: function (): React.Node {
      return (
        <Image
          testID="image-animated-gif"
          style={styles.gif}
          source={require('../../assets/tumblr_mfqekpMktw1rn90umo1_500.gif')}
        />
      );
    },
    platform: 'ios',
  },
  {
    title: 'Base64 image',
    name: 'base64-image',
    render: function (): React.Node {
      return (
        <Image
          testID="image-base64"
          style={styles.base64}
          source={{uri: base64Icon, scale: 3}}
        />
      );
    },
    platform: 'ios',
  },
  {
    title: 'Cap Insets',
    description:
      ('When the image is resized, the corners of the size specified ' +
        'by capInsets will stay a fixed size, but the center content and ' +
        'borders of the image will be stretched. This is useful for creating ' +
        'resizable rounded buttons, shadows, and other resizable assets.') as string,
    render: function (): React.Node {
      return <ImageCapInsetsExample />;
    },
    platform: 'ios',
  },
  {
    title: 'Image Size',
    render: function (): React.Node {
      return <ImageSizeExample source={fullImage} />;
    },
  },
  {
    title: 'Image.getSize',
    render: function (): React.Node {
      return (
        <RNTesterPlatformTest
          title="Image.getSize"
          description="Calls Image.getSize and verifies the source dimensions returned by native image metadata."
          component={ImageGetSizePlatformTest}
        />
      );
    },
  },
  {
    title: 'MultipleSourcesExample',
    description:
      ('The `source` prop allows passing in an array of uris, so that native to choose which image ' +
        'to diplay based on the size of the of the target image') as string,
    render: function (): React.Node {
      return <MultipleSourcesExample />;
    },
  },
  {
    title: 'Legacy local image',
    description: ('Images shipped with the native bundle, but not managed ' +
      'by the JS packager') as string,
    render: function (): React.Node {
      return <Image source={{uri: 'legacy_image', width: 120, height: 120}} />;
    },
  },
  {
    title: 'Bundled images',
    description: 'Images shipped in a separate native bundle',
    render: function (): React.Node {
      return (
        <View style={styles.flexRow}>
          <Image
            source={{
              uri: 'ImageInBundle',
              bundle: 'RNTesterBundle',
              width: 100,
              height: 100,
            }}
            style={styles.imageInBundle}
          />
          <Image
            source={{
              uri: 'ImageInAssetCatalog',
              bundle: 'RNTesterBundle',
              width: 100,
              height: 100,
            }}
            style={styles.imageInAssetCatalog}
          />
        </View>
      );
    },
    platform: 'ios',
  },
  {
    title: 'Blur Radius',
    name: 'blur-radius',
    render: function (): React.Node {
      return (
        <View testID="image-blur-radius" style={styles.horizontal}>
          <Image style={styles.base} source={fullImage} blurRadius={0} />
          <Image style={styles.base} source={fullImage} blurRadius={5} />
          <Image style={styles.base} source={fullImage} blurRadius={10} />
          <Image style={styles.base} source={fullImage} blurRadius={15} />
          <Image style={styles.base} source={fullImage} blurRadius={20} />
          <Image style={styles.base} source={fullImage} blurRadius={25} />
        </View>
      );
    },
  },
  {
    title: 'Accessibility',
    description:
      'If the `accessible` (boolean) prop is set to True, the image will be indicated as an accessbility element.' as string,
    render: function (): React.Node {
      return <Image accessible source={fullImage} style={styles.base} />;
    },
  },
  {
    title: 'Accessibility Label',
    description:
      'When an element is marked as accessibile (using the accessibility prop), it is good practice to set an accessibilityLabel on the image to provide a description of the element to people who use VoiceOver. VoiceOver will read this string when people select this element.' as string,
    render: function (): React.Node {
      return (
        <Image
          accessible
          accessibilityLabel="Picture of people standing around a table"
          source={fullImage}
          style={styles.base}
        />
      );
    },
  },
  {
    title: 'Accessibility Label via alt prop',
    description:
      'Using the alt prop markes an element as being accessibile, and passes the alt text to accessibilityLabel',
    render: function (): React.Node {
      return (
        <Image
          alt="Picture of people standing around a table"
          source={fullImage}
          style={styles.base}
        />
      );
    },
  },
  {
    title: 'Fade Duration',
    description:
      'The time (in miliseconds) that an image will fade in for when it appears (default = 300).' as string,
    render: function (): React.Node {
      return <FadeDurationExample />;
    },
    platform: 'android',
  },
  {
    title: 'Loading Indicator Source',
    description:
      'This prop is used to set the resource that will be used as the loading indicator for the image (displayed until the image is ready to be displayed).' as string,
    render: function (): React.Node {
      return <LoadingIndicatorSourceExample />;
    },
  },
  {
    title: 'On Layout',
    description:
      'This prop is used to set the handler function to be called when the image is mounted or its layout changes. The function receives an event with `{nativeEvent: {layout: {x, y, width, height}}}`' as string,
    render: function (): React.Node {
      return <OnLayoutExample />;
    },
  },
  {
    title: 'On Partial Load',
    description:
      'This prop is used to set the handler function to be called when the partial load of the image is complete. This is meant for progressive JPEG loads.' as string,
    render: function (): React.Node {
      return <OnPartialLoadExample />;
    },
    platform: 'ios',
  },
  {
    title: 'Vector Drawable',
    name: 'vector-drawable',
    description:
      'Demonstrating an example of loading a vector drawable asset by name',
    render: function (): React.Node {
      return <VectorDrawableExample />;
    },
    platform: 'android',
  },
  {
    title: 'Image.getSize with local drawables',
    name: 'vector-drawable-getsize',
    description:
      'Calls Image.getSize() on Android drawable resource names (both VectorDrawable and raster PNG) and displays dimensions in density-independent pixels (dp).',
    render: function (): React.Node {
      return <VectorDrawableGetSizeExample />;
    },
    platform: 'android',
  },
  {
    title: 'Large image with different resize methods',
    name: 'resize-method',
    description:
      'Demonstrating the effects of loading a large image with different resize methods',
    scrollable: true,
    render: function (): React.Node {
      const methods: Array<ImageProps['resizeMethod']> = [
        'auto',
        'resize',
        'scale',
        'none',
      ];
      // Four copies of the same image so we don't serve cached copies of the same image
      const images = [
        require('../../assets/large-image-1.png'),
        require('../../assets/large-image-2.png'),
        require('../../assets/large-image-3.png'),
        require('../../assets/large-image-4.png'),
      ];
      return (
        <View testID="resize-method-example">
          {methods.map((method, index) => (
            <View
              key={method}
              style={{display: 'flex', overflow: 'hidden'}}
              testID={`resize-method-example-${method ?? ''}`}>
              <RNTesterText>{method}</RNTesterText>
              <Image
                resizeMethod={method}
                source={images[index]}
                style={styles.resizedImage}
              />
            </View>
          ))}
        </View>
      );
    },
    platform: 'android',
  },
] as Array<RNTesterModuleExample>;
