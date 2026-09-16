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

const ALPHA_PNG_ASSET = require('../../assets/alpha-hotdog.png');

const IMAGE1 =
  'https://www.facebook.com/assets/fb_lite_messaging/E2EE-settings@3x.png';
const IMAGE2 =
  'https://www.facebook.com/ar_effect/external_textures/648609739826677.png';
const base64Icon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABLCAQAAACSR7JhAAADtUlEQVR4Ac3YA2Bj6QLH0XPT1Fzbtm29tW3btm3bfLZtv7e2ObZnms7d8Uw098tuetPzrxv8wiISrtVudrG2JXQZ4VOv+qUfmqCGGl1mqLhoA52oZlb0mrjsnhKpgeUNEs91Z0pd1kvihA3ULGVHiQO2narKSHKkEMulm9VgUyE60s1aWoMQUbpZOWE+kaqs4eLEjdIlZTcFZB0ndc1+lhB1lZrIuk5P2aib1NBpZaL+JaOGIt0ls47SKzLC7CqrlGF6RZ09HGoNy1lYl2aRSWL5GuzqWU1KafRdoRp0iOQEiDzgZPnG6DbldcomadViflnl/cL93tOoVbsOLVM2jylvdWjXolWX1hmfZbGR/wjypDjFLSZIRov09BgYmtUqPQPlQrPapecLgTIy0jMgPKtTeob2zWtrGH3xvjUkPCtNg/tm1rjwrMa+mdUkPd3hWbH0jArPGiU9ufCsNNWFZ40wpwn+62/66R2RUtoso1OB34tnLOcy7YB1fUdc9e0q3yru8PGM773vXsuZ5YIZX+5xmHwHGVvlrGPN6ZSiP1smOsMMde40wKv2VmwPPVXNut4sVpUreZiLBHi0qln/VQeI/LTMYXpsJtFiclUN+5HVZazim+Ky+7sAvxWnvjXrJFneVtLWLyPJu9K3cXLWeOlbMTlrIelbMDlrLenrjEQOtIF+fuI9xRp9ZBFp6+b6WT8RrxEpdK64BuvHgDk+vUy+b5hYk6zfyfs051gRoNO1usU12WWRWL73/MMEy9pMi9qIrR4ZpV16Rrvduxazmy1FSvuFXRkqTnE7m2kdb5U8xGjLw/spRr1uTov4uOgQE+0N/DvFrG/Jt7i/FzwxbA9kDanhf2w+t4V97G8lrT7wc08aA2QNUkuTfW/KimT01wdlfK4yEw030VfT0RtZbzjeMprNq8m8tnSTASrTLti64oBNdpmMQm0eEwvfPwRbUBywG5TzjPCsdwk3IeAXjQblLCoXnDVeoAz6SfJNk5TTzytCNZk/POtTSV40NwOFWzw86wNJRpubpXsn60NJFlHeqlYRbslqZm2jnEZ3qcSKgm0kTli3zZVS7y/iivZTweYXJ26Y+RTbV1zh3hYkgyFGSTKPfRVbRqWWVReaxYeSLarYv1Qqsmh1s95S7G+eEWK0f3jYKTbV6bOwepjfhtafsvUsqrQvrGC8YhmnO9cSCk3yuY984F1vesdHYhWJ5FvASlacshUsajFt2mUM9pqzvKGcyNJW0arTKN1GGGzQlH0tXwLDgQTurS8eIQAAAABJRU5ErkJggg==';
const IMAGE_PREFETCH_URL = `${IMAGE1}?r=1&t=${Date.now()}`;
const prefetchTask = Image.prefetch(IMAGE_PREFETCH_URL);
// The Image Loading Events example reports this failure when it consumes the
// task. Handle rejection immediately as the prefetch can finish before that
// example mounts, which would otherwise produce an unhandled rejection.
void prefetchTask.catch(() => {});
// Remote JPEG (RN OSS test fixture) used by the progressive example. Trusted by
// the API 24 Android CI emulator and reachable on both platforms.
const LARGE_JPEG =
  'https://www.facebook.com/assets/react_native_oss_tests/large-image@1x.jpg';
// Display-P3 wide-gamut sample from the WebKit color-gamut test. Keep the
// ICC-profiled fixture inline so the example does not depend on network access.
const WIDE_GAMUT_P3_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABY2lDQ1BrQ0dDb2xvclNwYWNlRGlzcGxheVAzAAAokX2QsUvDUBDG' +
  'v1aloHUQHRwcMolDlJIKuji0FURxCFXB6pS+pqmQxkeSIgU3/4GC/4EKzm4Whzo6OAiik+jm5KTgouV5L4mkInqP435877vjOCA5' +
  'bnBu9wOoO75bXMorm6UtJfWMBL0gDObxnK6vSv6uP+P9PvTeTstZv///jcGK6TGqn5QZxl0fSKjE+p7PJe8Tj7m0FHFLshXyieRy' +
  'yOeBZ71YIL4mVljNqBC/EKvlHt3q4brdYNEOcvu06WysyTmUE1jEDjxw2DDQhAId2T/8s4G/gF1yN+FSn4UafOrJkSInmMTLcMAw' +
  'A5VYQ4ZSk3eO7ncX3U+NtYMnYKEjhLiItZUOcDZHJ2vH2tQ8MDIEXLW54RqB1EeZrFaB11NguASM3lDPtlfNauH26Tww8CjE2ySQ' +
  'OgS6LSE+joToHlPzA3DpfAEDp2ITpJYOWwAAACBjSFJNAABtmAAAc48AAQg1AAB+agAAZMkAAQmxAAAxcQAAE7wS/w/XAAAABGNJ' +
  'Q1AMDQABbgPj7wAAAOhlWElmTU0AKgAAAAgABwESAAMAAAABAAEAAAEaAAUAAAABAAAAYgEbAAUAAAABAAAAagEoAAMAAAABAAIA' +
  'AAExAAIAAAAkAAAAcgEyAAIAAAAUAAAAlodpAAQAAAABAAAAqgAAAAAAAABIAAAAAQAAAEgAAAABQWRvYmUgUGhvdG9zaG9wIEND' +
  'IDIwMTUgKE1hY2ludG9zaCkAMjAxNjowNjoyMiAxMTozNDo1NwAAA5AEAAIAAAAUAAAA1KACAAQAAAABAAAAQKADAAQAAAABAAAA' +
  'QAAAAAAyMDE2OjA2OjIyIDExOjM0OjU3ABq+17sAAAAJcEhZcwAACxMAAAsTAQCanBgAAAPRaVRYdFhNTDpjb20uYWRvYmUueG1w' +
  'AAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6' +
  'UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVz' +
  'Y3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIK' +
  'ICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOnRp' +
  'ZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3No' +
  'b3AgQ0MgMjAxNSAoTWFjaW50b3NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxNi0wNi0y' +
  'MlQxMTozNDo1NzwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDx4bXA6Q3JlYXRlRGF0ZT4yMDE2LTA2LTIyVDExOjM0OjU3PC94' +
  'bXA6Q3JlYXRlRGF0ZT4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjEwMDA8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgog' +
  'ICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjY1NTM1PC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVu' +
  'c2lvbj4xMDAwPC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNv' +
  'bHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzI8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZm' +
  'OllSZXNvbHV0aW9uPjcyPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVu' +
  'dGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4Kl/0+VQAABktJREFUeAHt' +
  '2gl34yoMBeD27dv//6Vv3/nS3gx1jQHb6ZmeRmeIMUji6kpgJ53H/x4eyr+PK1983NCfIr8TcK+AD87AfQt88AJ4+PAV8NVbVIAX' +
  'jX9L++f5qr98+XgsY7Khffl8NXZruSkBfxf0f5WWwJdBt4ILGYj4urRbgnwsoEZxtfC+GOdM0H+WVme6Dir92jC6S7Ki+01RRob7' +
  'M+VUAmT899IEQYCVPcBT1qXblWwXRPKZDPHxXWlnVsQpBAAocID17WNBJ/DS3S3I5FdDDFL5RcQZ1XCYAAB/K801GQduz+MlmV4L' +
  'TPBITkWohu9Lcz0ihwgARvDACfjb0uzVvSLLeQq0fDhb/igtayLhyJbYk6gLtjp4WfihtCPBc4qAteybi1jDWtZEggTAsld2EZCy' +
  'ByDBHy1FPrONesHUa4YEtntkmgD7NGUfINNOVpAq7Rmx5rIScobM+pnRvz7mALD/zggecGXcK/+i8kJqDCrAITkrU/iBtE+Jk/5o' +
  '2V8clY884tzPkgADLISf2fNgmABZwrBrnvGl+0rsyVkJqb3gW76Dp8Y4imGYACBzSIXxtUXo/Pqsuza/HJOx+G0RMOITJvZ0Q2jp' +
  'dmWYgBxSHkNbRrIhU7+Ulhek0n0hMqURYNO/DFQfguHj59Lo8N0SmPIYDtaWbj0+9A4hS4LCcBapnSz7soEAwWmAxw44gTnBCd/8' +
  'CjAVYC0vO8mkcS9ZPbEG/+z5HQluROeaJYFsZb9MX4RTukAQoBJMMslP3ugSeK7GtazF3whQ+vRC/KhNMWkLwDJGtkrwSePTZ52x' +
  'BMYXkKkGQDP3yfKpV4/XvpZ6y/tghNl6PQnJTT3llPKfeezRDZg4F/iPpclMtlXmXBM04PqufMyuyza4S3dTugSESYpd5cVSgAsi' +
  'gdQvTraF8VpCgHUyNxM8X8HJPpVrvCXdmDBJZoEAIEgi4/Wjk88cfuYjIUDJZ701oqLfusY22Ft6xocJ6CouVhFgMqD0Exy1taDq' +
  'ef3se0HED9sRCdZTCEgp1gBHQAQ0MPVpzN9a9vms12DDNvrmRyV+gn3LLmRt6eyay+LABBBHiGllptar7eKL/dlyMwICtA7K2C2D' +
  'yZoz15sRkMBlexn08h5gB1cOL/d0ohdfxs+WLgFZPGBGASQYdvZ8ZM2PseU7A5tslfiKj941awT7ln6XgCgEzJazeq4+xPI4NB9w' +
  'ta41lgTERvD1IVrbtfrBGuwtPeNdnSjkVN9yVs9hP6+8stn6tQYhAqyzlZ+/y/CFmHrOWE+CNdi39Ls6MgAAVsPslsN6Ltlmn22Q' +
  'seiZC1H8+/or+wl6qV+mNiU42Y9snS4BFDRAwmzpdoVuHUgCWhoCqSHIV+iUfuleSHA/uy6swc3PlnQJqJnMV9oth5nzdTbZy9Xc' +
  'sp+9L1DZWxJFn69RCcZUbs+uSwAHQAJWn8zGW0JPSzDs811AQBm3uLmUra3gh5J8Yyzd67r89YSfrBtiezZDB2xO9JR1gmk5T/aB' +
  'qL/Y1PqIMB8yBJ0+PURYjy9Zde2BVUX8yn5Pt6hcZKgCaOagSqk+mb/+zI8cP5Wp/OGi1gKQCDY+9evgzROB8MGX+ZR36b4S2YeN' +
  'xO/T3fbnMAGyBZAAWo80SwW0a0uSpS2d2nbEZ36ypzta/tYYJkAGlH4y0cpGz2EqYAYkoKTlG5ZUXjBeDAY+Wj5XTe2rAMf4zOOJ' +
  'wwRv0fgxfkRgSEXyObr3s+YUAYwwrMzsufyRtHSHBQlAru35YSfPijUGmHqH85r/aQIAz2972PdXIEBmZOaQavm1Zv4CJQiY9pA6' +
  'TQBA2F6SMLIdZg8/a61JiHdN8DDtkTf9LzIAy9yR/e9R552AnwQ/u++L6VUOEcCLoPI3QCUIjL24Vlo5BPeUqoAddt70UkmqcG/m' +
  'i+lFDhPAC0DAeRTpC16WtaMAEZzHHBKQx+/s466YrMopBMSz7NSPx1REiFiritjWV4Em8GTcPDIFfqTk+anlVAI4VgEylldm9wQZ' +
  'CBBE+qV7FUHTzTmxtPPkQCTbM+V0AmpwsoeMZVC1zlo/BCFL0GdmfLneTQnIYrKZsnZNtjPvmqBTJa5nZ7teL/03ISCLfY7X0XPp' +
  'c8R+CqY7AafQ+I6d3CvgHSfvFOj3CjiFxnfs5H+w+5OV96hz8wAAAABJRU5ErkJggg==';

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

// 16x8 JPEG with no EXIF orientation, inline so the check needs no network.
const GET_SIZE_JPEG_DATA_URI =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiU' +
  'FVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8f' +
  'Hx8fHx8fHx8fHx8fHz/wAARCAAIABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAT/xAAWEAEBAQAAAAAAAAAAAAAAAAAAFWL/x' +
  'AAVAQEBAAAAAAAAAAAAAAAAAAAFBv/EABcRAAMBAAAAAAAAAAAAAAAAAAADFFH/2gAMAwEAAhEDEQA/AKYuSLkExQzRSpun/9k=';

// The same 16x8 raster tagged EXIF orientation 6 (rotate 90 CW to display), so a
// decoder that honours the tag reports 8x16 and one that ignores it reports 16x8.
const GET_SIZE_EXIF_ROTATED_JPEG_DATA_URI =
  'data:image/jpeg;base64,/9j/4QAiRXhpZgAASUkqAAgAAAABABIBAwABAAAABgAAAAAAAAD/4AAQSkZJRgABAQAAAQABAAD/2wBDABQOD' +
  'xIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTf' +
  'Hx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIABADASIAAhEBAxEB/8QAFQABAQAAAAAAA' +
  'AAAAAAAAAAAAAT/xAAWEAEBAQAAAAAAAAAAAAAAAAAAFWL/xAAVAQEBAAAAAAAAAAAAAAAAAAAFBv/EABcRAAMBAAAAAAAAAAAAAAAAAAADF' +
  'FH/2gAMAwEAAhEDEQA/AJYuSLkDVDNJqpun/9k=';

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
  {
    expectedHeight: 8,
    expectedWidth: 16,
    uri: GET_SIZE_JPEG_DATA_URI,
    name: 'data: URI JPEG',
  },
  {
    // Transposed against the row above: the tag must be applied, so these are
    // the visible dimensions rather than the 16x8 stored raster.
    expectedHeight: 16,
    expectedWidth: 8,
    uri: GET_SIZE_EXIF_ROTATED_JPEG_DATA_URI,
    name: 'EXIF rotated data: URI JPEG',
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
      Calling Image.getSize for {GET_SIZE_TEST_IMAGES.length} images.
    </RNTesterText>
  );
}

function ProgressiveJpegExample(): React.Node {
  const [loadStarted, setLoadStarted] = useState(false);
  const [progress, setProgress] = useState<?number>(null);
  const [loaded, setLoaded] = useState(false);
  const [uri] = useState(() => `${LARGE_JPEG}?progressive=${Date.now()}`);
  return (
    <View testID="image-progressive-jpeg">
      <Image
        testID="progressive-jpeg-image"
        style={styles.base}
        source={{uri}}
        progressiveRenderingEnabled={true}
        onLoadStart={() => setLoadStarted(true)}
        onProgress={event => {
          const {loaded: bytesLoaded, total} = event.nativeEvent;
          if (total > 0) {
            setProgress(Math.round((bytesLoaded / total) * 100));
          }
        }}
        onLoad={() => setLoaded(true)}
      />
      {loadStarted ? (
        <RNTesterText testID="progressive-jpeg-loadstart">
          loadStart
        </RNTesterText>
      ) : null}
      {progress != null ? (
        <RNTesterText testID="progressive-jpeg-progress">
          progress {progress}%
        </RNTesterText>
      ) : null}
      {loaded ? (
        <RNTesterText testID="progressive-jpeg-load">load</RNTesterText>
      ) : null}
    </View>
  );
}

function BlurRadiusPrefetchExample(): React.Node {
  const [uri] = useState(() => `${IMAGE2}?blurPrefetch=${Date.now()}`);
  const [prefetchStatus, setPrefetchStatus] = useState('pending');
  const [loadStatus, setLoadStatus] = useState('pending');

  useEffect(() => {
    let cancelled = false;
    void Image.prefetch(uri).then(
      () => {
        if (!cancelled) {
          setPrefetchStatus('ok');
        }
      },
      () => {
        if (!cancelled) {
          setPrefetchStatus('failed');
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return (
    <View testID="image-blur-prefetch">
      <RNTesterText testID="blur-prefetch-prefetch-status">
        prefetch: {prefetchStatus}
      </RNTesterText>
      {prefetchStatus === 'ok' ? (
        <Image
          testID="blur-prefetch-image"
          style={styles.base}
          source={{uri}}
          blurRadius={15}
          onLoad={() => setLoadStatus('loaded')}
          onError={() => setLoadStatus('error')}
        />
      ) : null}
      <RNTesterText testID="blur-prefetch-load-status">
        blurred image: {loadStatus}
      </RNTesterText>
    </View>
  );
}

function WideGamutTransparencyExample(): React.Node {
  const [alphaStatus, setAlphaStatus] = useState('loading');
  const [srgbStatus, setSrgbStatus] = useState('loading');
  const [p3Status, setP3Status] = useState('loading');
  return (
    <View testID="image-wide-gamut">
      <RNTesterText style={styles.sectionText}>
        Alpha / transparency
      </RNTesterText>
      <View style={styles.checkerBackground}>
        <Image
          testID="wide-gamut-alpha-image"
          style={styles.base}
          source={ALPHA_PNG_ASSET}
          onLoad={() => setAlphaStatus('loaded')}
          onError={() => setAlphaStatus('error')}
        />
      </View>
      <RNTesterText testID="wide-gamut-alpha-status">
        alpha: {alphaStatus}
      </RNTesterText>
      <RNTesterText style={styles.sectionText}>sRGB vs Display-P3</RNTesterText>
      <View style={styles.horizontal}>
        <View>
          <RNTesterText style={styles.resizeModeText}>sRGB</RNTesterText>
          <Image
            testID="wide-gamut-srgb-image"
            style={styles.base}
            source={smallImage}
            onLoad={() => setSrgbStatus('loaded')}
            onError={() => setSrgbStatus('error')}
          />
        </View>
        <View style={styles.leftMargin}>
          <RNTesterText style={styles.resizeModeText}>Display-P3</RNTesterText>
          <Image
            testID="wide-gamut-p3-image"
            style={styles.base}
            source={{uri: WIDE_GAMUT_P3_DATA_URI}}
            onLoad={() => setP3Status('loaded')}
            onError={() => setP3Status('error')}
          />
        </View>
      </View>
      <RNTesterText testID="wide-gamut-srgb-status">
        sRGB: {srgbStatus}
      </RNTesterText>
      <RNTesterText testID="wide-gamut-p3-status">P3: {p3Status}</RNTesterText>
    </View>
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
  borderRadiusPercentage: {
    borderWidth: 4,
    borderRadius: '50%',
    borderColor: 'green',
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
  checkerBackground: {
    backgroundColor: '#cccccc',
    padding: 4,
    alignSelf: 'flex-start',
  },
});

exports.displayName = undefined as ?string;
exports.framework = 'React';
exports.title = 'Image';
exports.category = 'Basic';
exports.description =
  'Base component for displaying different types of images.';

component BoxShadowExample() {
  const [loadedImageCount, setLoadedImageCount] = useState(0);
  const onLoad = () => setLoadedImageCount(count => count + 1);

  return (
    <View
      style={styles.horizontal}
      testID={loadedImageCount >= 3 ? 'box-shadow-example' : undefined}>
      <Image
        onLoad={onLoad}
        style={[styles.base, styles.boxShadow, styles.boxShadowWithBackground]}
        source={smallImage}
      />
      <Image
        onLoad={onLoad}
        style={[
          styles.base,
          styles.boxShadow,
          styles.boxShadowMultiOutsetInset,
        ]}
        source={smallImage}
      />
      <Image
        onLoad={onLoad}
        style={[
          styles.base,
          styles.boxShadow,
          styles.boxShadowAsymetricallyRounded,
        ]}
        source={fullImage}
      />
    </View>
  );
}

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
          <Image
            style={[styles.base, styles.borderRadiusPercentage]}
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
      return <BoxShadowExample />;
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
  {
    title: 'Progressive JPEG',
    name: 'progressive-jpeg',
    description:
      'Loads a JPEG with progressiveRenderingEnabled and logs progress/load events.',
    render: function (): React.Node {
      return <ProgressiveJpegExample />;
    },
    platform: 'android',
  },
  {
    title: 'Blur Radius with Prefetch',
    name: 'blur-radius-prefetch',
    description:
      'Prefetches then renders the same URI with blurRadius to ensure the blur postprocessor is applied on prefetched images.',
    render: function (): React.Node {
      return <BlurRadiusPrefetchExample />;
    },
  },
  {
    title: 'Wide Gamut and Transparency',
    name: 'wide-gamut',
    description:
      'Alpha transparency and sRGB vs Display-P3 comparison targets for screenshot tests.',
    render: function (): React.Node {
      return <WideGamutTransparencyExample />;
    },
  },
] as Array<RNTesterModuleExample>;
