/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/*
The content of index.io.js could be something like

    'use strict';

    import { AppRegistry } from 'react-native'
    import Welcome from './gen/Welcome'

    AppRegistry.registerComponent('MopNative', () => Welcome);

For a list of complete Typescript examples: check https://github.com/bgrieder/RNTSExplorer
*/

import * as React from 'react';
import {
  AccessibilityInfo,
  ActionSheetIOS,
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Appearance,
  BackHandler,
  BlurEvent,
  Button,
  ColorValue,
  DevSettings,
  DeviceEventEmitter,
  Dimensions,
  DrawerLayoutAndroid,
  DrawerSlideEvent,
  DynamicColorIOS,
  EmitterSubscription,
  EventSubscription,
  FlatList,
  FlatListProps,
  FocusEvent,
  GestureResponderEvent,
  HostComponent,
  HostInstance,
  I18nManager,
  Image,
  ImageBackground,
  ImageErrorEvent,
  ImageLoadEvent,
  // @ts-ignore
  ImageResizeMode,
  ImageResolvedAssetSource,
  ImageStyle,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Linking,
  ListRenderItemInfo,
  LogBox,
  Modal,
  MouseEvent,
  NativeEventEmitter,
  // @ts-ignore
  NativeModule, // Not actually exported, not sure why
  NativeModules,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PermissionsAndroid,
  Platform,
  PlatformColor,
  Pressable,
  ProgressBarAndroid,
  PushNotificationIOS,
  RefreshControl,
  // @ts-ignore
  RegisteredStyle,
  ScaledSize,
  ScrollView,
  ScrollViewProps,
  SectionList,
  SectionListProps,
  SectionListRenderItemInfo,
  Share,
  ShareAction,
  StatusBar,
  StyleProp,
  StyleSheet,
  Switch,
  SwitchChangeEvent,
  Systrace,
  Text,
  TextInput,
  TextInputChangeEvent,
  TextInputContentSizeChangeEvent,
  TextInputEndEditingEvent,
  TextInputFocusEvent,
  TextInputKeyPressEvent,
  // @ts-ignore
  TextInputScrollEvent,
  TextInputSelectionChangeEvent,
  TextInputSubmitEditingEvent,
  TextLayoutEvent,
  TextProps,
  TextStyle,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  UIManager,
  View,
  ViewStyle,
  SafeAreaView,
  VirtualizedList,
  findNodeHandle,
  requireNativeComponent,
  useColorScheme,
  useWindowDimensions,
  // @ts-ignore
  SectionListData,
  ToastAndroid,
  Touchable,
  LayoutAnimation,
  processColor,
  experimental_LayoutConformance as LayoutConformance,
  ViewProps,
} from 'react-native';

declare module 'react-native' {
  interface NativeTypedModule {
    someFunction(): void;
    someProperty: string;
  }
  interface NativeModulesStatic {
    NativeTypedModule: NativeTypedModule;
  }
}

NativeModules.NativeUntypedModule;

NativeModules.NativeTypedModule.someFunction();
NativeModules.NativeTypedModule.someProperty = '';

function dimensionsListener(dimensions: {
  window: ScaledSize;
  screen: ScaledSize;
}) {
  console.log('window dimensions: ', dimensions.window);
  console.log('screen dimensions: ', dimensions.screen);
}

function testDimensions() {
  const {width, height, scale, fontScale} = Dimensions.get(
    1 === 1 ? 'window' : 'screen',
  );

  const subscription = Dimensions.addEventListener(
    'change',
    dimensionsListener,
  );
  subscription.remove();
}

function TextUseWindowDimensions() {
  const {width, height, scale, fontScale} = useWindowDimensions();
}

BackHandler.addEventListener('hardwareBackPress', () => true).remove();
BackHandler.addEventListener('hardwareBackPress', () => false).remove();
BackHandler.addEventListener('hardwareBackPress', () => undefined).remove();
BackHandler.addEventListener('hardwareBackPress', () => null).remove();

type LocalStyles = {
  container: ViewStyle;
  welcome: TextStyle;
  instructions: TextStyle;
};

const styles = StyleSheet.create<LocalStyles>({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

//alternative declaration of styles (inline typings)
const stylesAlt = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

StyleSheet.setStyleAttributePreprocessor(
  'fontFamily',
  (family: string) => family,
);

const welcomeFontSize = StyleSheet.flatten(styles.welcome)?.fontSize;

const viewStyle: StyleProp<ViewStyle> = {
  backgroundColor: '#F5FCFF',
};
const textStyle: StyleProp<TextStyle> = {
  fontSize: 20,
};
const imageStyle: StyleProp<ImageStyle> = {
  resizeMode: 'contain',
};
const fontVariantStyle: StyleProp<TextStyle> = {
  fontVariant: ['tabular-nums'],
};

const viewProperty = StyleSheet.flatten(viewStyle)?.backgroundColor;
const textProperty = StyleSheet.flatten(textStyle)?.fontSize;
const imageProperty = StyleSheet.flatten(imageStyle)?.resizeMode;
const fontVariantProperty = StyleSheet.flatten(fontVariantStyle)?.fontVariant;

// correct use of the StyleSheet.flatten
const styleArray: StyleProp<ViewStyle>[] = [];
const flattenStyle = StyleSheet.flatten(styleArray);
const {top} = flattenStyle;

const s = StyleSheet.create({
  shouldWork: {
    fontWeight: '900', // if we comment this line, errors gone
    marginTop: 5, // if this line commented, errors also gone
  },
});
const f1: TextStyle = s.shouldWork;

const styleDimensionValueValidPoint: ViewStyle = {
  width: 1,
};

const styleDimensionValueValidAuto: ViewStyle = {
  width: 'auto',
};

const styleDimensionValueValidPct: ViewStyle = {
  width: '5%',
};

// StyleSheet.compose
// It creates a new style object by composing two existing styles
const composeTextStyle: StyleProp<TextStyle> = {
  color: '#000000',
  fontSize: 20,
};

const composeImageStyle: StyleProp<ImageStyle> = {
  resizeMode: 'contain',
};

// The following use of the compose method is valid
const combinedStyle: StyleProp<TextStyle> = StyleSheet.compose(
  composeTextStyle,
  composeTextStyle,
);

const combinedStyle1: StyleProp<ImageStyle> = StyleSheet.compose(
  composeImageStyle,
  composeImageStyle,
);

const combinedStyle2: StyleProp<TextStyle | ConcatArray<TextStyle>> =
  StyleSheet.compose([composeTextStyle], [composeTextStyle]);

const combinedStyle3: StyleProp<TextStyle | null> = StyleSheet.compose(
  composeTextStyle,
  null,
);

const combinedStyle4: StyleProp<TextStyle | ConcatArray<TextStyle> | null> =
  StyleSheet.compose([composeTextStyle], null);

const combinedStyle5: StyleProp<TextStyle> = StyleSheet.compose(
  composeTextStyle,
  Math.random() < 0.5 ? composeTextStyle : null,
);

const combinedStyle6: StyleProp<TextStyle | null> = StyleSheet.compose(
  null,
  null,
);

const page = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 30,
    color: '#000',
  },
});

const lists = StyleSheet.create({
  listContainer: {
    flex: 1,
    backgroundColor: '#61dafb',
  },
  listItem: {
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
});

const container = StyleSheet.compose(page.container, lists.listContainer);
<View style={container} />;

// Pointer events (W3C): all variants should be accepted on View.
<View
  onPointerOver={e => e.nativeEvent.pointerId}
  onPointerOverCapture={e => e.nativeEvent.pointerId}
  onPointerOut={e => e.nativeEvent.pointerId}
  onPointerOutCapture={e => e.nativeEvent.pointerId}
  onGotPointerCapture={e => e.nativeEvent.pointerId}
  onGotPointerCaptureCapture={e => e.nativeEvent.pointerId}
  onLostPointerCapture={e => e.nativeEvent.pointerId}
  onLostPointerCaptureCapture={e => e.nativeEvent.pointerId}
/>;
const text = StyleSheet.compose(page.text, lists.listItem) as TextStyle;
<Text style={text} />;

// The following use of the compose method is invalid:
const combinedStyle8: StyleProp<ImageStyle> = StyleSheet.compose(
  // @ts-expect-error
  composeTextStyle,
  composeTextStyle,
);

const combinedStyle9: StyleProp<ImageStyle> = StyleSheet.compose(
  // @ts-expect-error
  [composeTextStyle],
  null,
);

const combinedStyle10: StyleProp<ImageStyle> = StyleSheet.compose(
  // @ts-expect-error
  Math.random() < 0.5 ? composeTextStyle : null,
  null,
);

type TestOpaque = symbol & {smth: string};

declare function createTestOpaque(): TestOpaque;
const testOpaque = createTestOpaque();
// @ts-expect-error
processColor(testOpaque);
processColor('#000000');
processColor(123456);
// @ts-expect-error
processColor(true);
// @ts-expect-error
processColor(Symbol('test'));

const testNativeSyntheticEvent = <T extends {}>(
  e: NativeSyntheticEvent<T>,
): void => {
  e.isDefaultPrevented();
  e.preventDefault();
  e.isPropagationStopped();
  e.stopPropagation();
  e.persist();
  e.cancelable;
  e.bubbles;
  e.currentTarget;
  e.defaultPrevented;
  e.eventPhase;
  e.isTrusted;
  e.nativeEvent;
  e.target;
  e.timeStamp;
  e.type;
  e.nativeEvent;

  if (typeof e.target !== 'number') {
    e.target?.measure(() => {});
  }
};

function eventHandler<T extends React.BaseSyntheticEvent>(e: T) {}

function handler(e: GestureResponderEvent) {
  eventHandler(e);
}

type ElementProps<C> = C extends React.Component<infer P, any> ? P : never;

class CustomView extends React.Component {
  render() {
    return (
      <Text style={[StyleSheet.absoluteFill, {...StyleSheet.absoluteFill}]}>
        Custom View
      </Text>
    );
  }
}

class Welcome extends React.Component<
  ViewProps & {color: string; bgColor?: null | undefined | string}
> {
  rootViewRef = React.createRef<React.ComponentRef<typeof View>>();
  customViewRef = React.createRef<React.ComponentRef<typeof CustomView>>();

  testNativeMethods() {
    if (this.rootViewRef.current != null) {
      this.rootViewRef.current.setNativeProps({});
      this.rootViewRef.current.measure(
        (x: number, y: number, width: number, height: number) => {},
      );
    }
  }

  testFindNodeHandle() {
    if (this.rootViewRef.current != null) {
      const nativeComponentHandle = findNodeHandle(this.rootViewRef.current);
    }

    if (this.customViewRef.current != null) {
      const customComponentHandle = findNodeHandle(this.customViewRef.current);
      const fromHandle = findNodeHandle(customComponentHandle);
    }
  }

  render() {
    const {color, bgColor, ...props} = this.props;
    return (
      <View
        {...props}
        ref={this.rootViewRef}
        style={[
          [styles.container],
          undefined,
          null,
          false,
          bgColor && {backgroundColor: bgColor},
        ]}>
        <Text style={styles.welcome}>Welcome to React Native</Text>
        <Text style={styles.instructions}>
          To get started, edit index.ios.js
        </Text>
        <Text style={styles.instructions}>
          Press Cmd+R to reload,{'\n'}
          Cmd+D or shake for dev menu
        </Text>
        <CustomView ref={this.customViewRef} />
      </View>
    );
  }
}

export default Welcome;

// TouchableTest
function TouchableTest() {
  function basicUsage() {
    return Touchable.renderDebugView({
      color: 'mediumspringgreen',
      hitSlop: {bottom: 5, top: 5},
    });
  }

  function defaultHitSlop() {
    return Touchable.renderDebugView({
      color: 'red',
    });
  }
}

export class TouchableHighlightTest extends React.Component {
  buttonRef = React.createRef<React.ComponentRef<typeof TouchableHighlight>>();

  render() {
    return (
      <>
        <TouchableHighlight />
        <TouchableHighlight ref={this.buttonRef} />
        <TouchableHighlight
          ref={ref => {
            ref?.focus();
            ref?.blur();
            ref?.measure(
              (x, y, width, height, pageX, pageY): number =>
                x + y + width + height + pageX + pageY,
            );
            ref?.measureInWindow(
              (x, y, width, height): number => x + y + width + height,
            );
            ref?.setNativeProps({focusable: false});
          }}
        />
      </>
    );
  }
}

export class TouchableOpacityTest extends React.Component {
  buttonRef = React.createRef<React.ComponentRef<typeof TouchableOpacity>>();

  render() {
    return (
      <>
        <TouchableOpacity ref={this.buttonRef} />
        <TouchableOpacity
          ref={ref => {
            ref?.focus();
            ref?.blur();
            ref?.measure(
              (x, y, width, height, pageX, pageY): number =>
                x + y + width + height + pageX + pageY,
            );
            ref?.measureInWindow(
              (x, y, width, height): number => x + y + width + height,
            );
            ref?.setNativeProps({focusable: false});
          }}
        />
        <TouchableOpacity focusable={false} />
        <TouchableOpacity rejectResponderTermination={true} />
        <TouchableOpacity
          role="button"
          accessibilityRole="button"
          accessibilityLabelledBy="my-label-text"
          aria-labelledby="my-label-text"
        />
        <TouchableOpacity accessibilityRole="grid" />
        <TouchableOpacity accessibilityRole="pager" />
        <TouchableOpacity
          // @ts-expect-error - expected boolean value
          focusable={1}
        />
        <TouchableOpacity
          // @ts-expect-error - expected boolean value
          rejectResponderTermination={'not-bool'}
        />
      </>
    );
  }
}

// TouchableNativeFeedbackTest
export class TouchableNativeFeedbackTest extends React.Component {
  onPressButton = (e: GestureResponderEvent) => {
    e.persist();
    e.isPropagationStopped();
    e.isDefaultPrevented();
  };

  render() {
    return (
      <>
        <TouchableNativeFeedback onPress={this.onPressButton}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </TouchableNativeFeedback>
        <TouchableWithoutFeedback focusable={false}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback rejectResponderTermination={true}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </TouchableWithoutFeedback>
        <TouchableNativeFeedback
          background={TouchableNativeFeedback.Ripple('red', true)}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </TouchableNativeFeedback>
        <TouchableNativeFeedback
          background={TouchableNativeFeedback.Ripple('red', true, 30)}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </TouchableNativeFeedback>
        <TouchableNativeFeedback
          background={TouchableNativeFeedback.SelectableBackground()}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </TouchableNativeFeedback>
        <TouchableNativeFeedback
          background={TouchableNativeFeedback.SelectableBackground(30)}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </TouchableNativeFeedback>
        <TouchableNativeFeedback
          background={TouchableNativeFeedback.SelectableBackgroundBorderless()}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </TouchableNativeFeedback>
        <TouchableNativeFeedback
          background={TouchableNativeFeedback.SelectableBackgroundBorderless(
            30,
          )}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </TouchableNativeFeedback>
      </>
    );
  }
}

// PressableTest
export class PressableTest extends React.Component<{}> {
  private readonly myRef: React.RefObject<React.ComponentRef<
    typeof View
  > | null> = React.createRef();

  onPressButton = (e: GestureResponderEvent) => {
    e.persist();
    e.isPropagationStopped();
    e.isDefaultPrevented();
  };

  onHoverButton = (e: MouseEvent) => {
    e.persist();
    e.isPropagationStopped();
    e.isDefaultPrevented();
  };

  render() {
    return (
      <>
        <Pressable
          ref={this.myRef}
          onPress={this.onPressButton}
          style={{backgroundColor: 'blue'}}
          unstable_pressDelay={100}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </Pressable>
        {/* Style function */}
        <Pressable
          onPress={this.onPressButton}
          style={state => ({
            backgroundColor: state.pressed ? 'red' : 'blue',
          })}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </Pressable>
        {/* Children function */}
        <Pressable
          onPress={this.onPressButton}
          style={state => ({
            backgroundColor: state.pressed ? 'red' : 'blue',
          })}>
          {state =>
            state.pressed ? (
              <View>
                <Text>Pressed</Text>
              </View>
            ) : (
              <View>
                <Text>Not Pressed</Text>
              </View>
            )
          }
        </Pressable>
        {/* Android Ripple */}
        <Pressable
          android_ripple={{
            borderless: true,
            color: 'green',
            radius: 20,
            foreground: true,
          }}
          onPress={this.onPressButton}
          style={{backgroundColor: 'blue'}}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </Pressable>
        {/* onHoverIn */}
        <Pressable
          ref={this.myRef}
          onHoverIn={this.onHoverButton}
          style={{backgroundColor: 'blue'}}>
          <View style={{width: 150, height: 100, backgroundColor: 'red'}}>
            <Text style={{margin: 30}}>Button</Text>
          </View>
        </Pressable>
      </>
    );
  }
}

// App State
function appStateListener(state?: string) {
  console.log('New state: ' + state);
}

function appStateTest() {
  console.log('Current state: ' + AppState.currentState);
  AppState.addEventListener('change', appStateListener);
  AppState.addEventListener('blur', appStateListener);
  AppState.addEventListener('focus', appStateListener);
}

let appState: AppStateStatus = 'active';
appState = 'background';
appState = 'inactive';
appState = 'unknown';
appState = 'extension';

const AppStateExample = () => {
  const appState = React.useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = React.useState(
    appState.current,
  );
  const appStateIsAvailable = AppState.isAvailable;

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current?.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      console.log('AppState', appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Current state is: {appStateVisible}</Text>
      <Text>Available: {appStateIsAvailable}</Text>
    </View>
  );
};

if (Systrace.isEnabled()) {
  const cookie = Systrace.beginAsyncEvent('async-event');
  Systrace.endAsyncEvent('async-event', cookie);

  const cookie2 = Systrace.beginAsyncEvent('async-event-2', {foo: '123'});
  Systrace.endAsyncEvent('async-event-2', cookie2, {bar: '456'});

  Systrace.beginEvent('sync-event');
  Systrace.endEvent();

  Systrace.beginEvent('sync-event-2', {key: 'value'});
  Systrace.endEvent({key: 'other-value'});

  Systrace.counterEvent('counter', 123);
}

export class FlatListTest extends React.Component<FlatListProps<number>, {}> {
  list: FlatList<any> | null = null;

  componentDidMount(): void {
    if (this.list) {
      this.list.flashScrollIndicators();
    }
  }

  _renderItem = (rowData: any) => {
    return (
      <View>
        <Text> {rowData.item} </Text>
      </View>
    );
  };
  _cellRenderer = ({children}: any) => {
    return <View>{children}</View>;
  };

  _renderSeparator = () => (
    <View style={{height: 1, width: '100%', backgroundColor: 'gray'}} />
  );

  render() {
    return (
      <FlatList
        ref={list => {
          this.list = list;
        }}
        data={[1, 2, 3, 4, 5]}
        renderItem={this._renderItem}
        ItemSeparatorComponent={this._renderSeparator}
        ListFooterComponent={null}
        ListFooterComponentStyle={[
          {padding: 8},
          [{backgroundColor: 'transparent'}],
        ]}
        ListHeaderComponent={null}
        ListHeaderComponentStyle={[
          {padding: 8},
          [{backgroundColor: 'transparent'}],
        ]}
        CellRendererComponent={this._cellRenderer}
        fadingEdgeLength={200}
      />
    );
  }
}

<FlatList
  data={[1, 2, 3]}
  renderItem={null}
  getItemLayout={(
    data: ArrayLike<number> | null | undefined,
    index: number,
  ) => {
    return {
      length: data![index] % 2 === 0 ? 10 : 5,
      offset: 1234,
      index,
    };
  }}
/>;

export class SectionListTest extends React.Component<
  SectionListProps<string>,
  {}
> {
  myList: React.RefObject<SectionList<string> | null>;

  constructor(props: SectionListProps<string>) {
    super(props);
    this.myList = React.createRef();
  }

  scrollMe = () => {
    this.myList.current &&
      this.myList.current.scrollToLocation({itemIndex: 0, sectionIndex: 1});
  };

  render() {
    const sections = [
      {
        title: 'Section 1',
        data: ['A', 'B', 'C', 'D', 'E'],
      },
      {
        title: 'Section 2',
        data: ['A2', 'B2', 'C2', 'D2', 'E2'],
        renderItem: (info: {item: string}) => (
          <View>
            <Text>{info.item}</Text>
          </View>
        ),
      },
    ];

    const cellRenderer = ({children}: any) => {
      return <View>{children}</View>;
    };

    return (
      <React.Fragment>
        <Button title="Press" onPress={this.scrollMe} />

        <SectionList
          ref={this.myList}
          sections={sections}
          renderSectionHeader={({section}) => (
            <View>
              <Text>{section.title}</Text>
            </View>
          )}
          renderItem={(info: SectionListRenderItemInfo<string>) => (
            <View>
              <Text>{`${info.section.title} - ${info.item}`}</Text>
            </View>
          )}
          CellRendererComponent={cellRenderer}
          maxToRenderPerBatch={5}
          ListFooterComponent={null}
          ListFooterComponentStyle={[
            {padding: 8},
            [{backgroundColor: 'transparent'}],
          ]}
          ListHeaderComponent={null}
          ListHeaderComponentStyle={[
            {padding: 8},
            [{backgroundColor: 'transparent'}],
          ]}
        />
      </React.Fragment>
    );
  }
}

type SectionT = {displayTitle: false} | {displayTitle: true; title: string};

export class SectionListTypedSectionTest extends React.Component<
  SectionListProps<string, SectionT>,
  {}
> {
  myList: React.RefObject<SectionList<string, SectionT> | null>;

  constructor(props: SectionListProps<string, SectionT>) {
    super(props);
    this.myList = React.createRef();
  }

  scrollMe = () => {
    this.myList.current &&
      this.myList.current.scrollToLocation({itemIndex: 0, sectionIndex: 1});
  };

  render() {
    const sections: SectionListData<string, SectionT>[] = [
      {
        displayTitle: false,
        data: ['A', 'B', 'C', 'D', 'E'],
      },
      {
        displayTitle: true,
        title: 'Section 2',
        data: ['A2', 'B2', 'C2', 'D2', 'E2'],
        renderItem: (info: {item: string}) => (
          <View>
            <Text>{info.item}</Text>
          </View>
        ),
      },
    ];

    const cellRenderer = ({children}: any) => {
      return <View>{children}</View>;
    };

    return (
      <React.Fragment>
        <Button title="Press" onPress={this.scrollMe} />

        <SectionList
          ref={this.myList}
          sections={sections}
          renderSectionHeader={({section}) => {
            section; // $ExpectType SectionListData<string, SectionT>

            return section.displayTitle ? (
              <View>
                <Text>{section.title}</Text>
              </View>
            ) : null;
          }}
          renderItem={info => {
            info; // $ExpectType SectionListRenderItemInfo<string, SectionT>

            return (
              <View>
                <Text>
                  {info.section.displayTitle ? (
                    <Text>{`${info.section.title} - `}</Text>
                  ) : null}
                  <Text>{info.item}</Text>
                </Text>
              </View>
            );
          }}
          CellRendererComponent={cellRenderer}
          maxToRenderPerBatch={5}
        />

        <SectionList
          ref={this.myList}
          sections={sections}
          renderSectionHeader={({section}) => {
            section; // $ExpectType SectionListData<string, SectionT>

            return section.displayTitle ? (
              <View>
                <Text>{section.title}</Text>
              </View>
            ) : null;
          }}
          renderItem={info => {
            info; // $ExpectType SectionListRenderItemInfo<string, SectionT>

            return (
              <View>
                <Text>
                  {info.section.displayTitle ? (
                    <Text>{`${info.section.title} - `}</Text>
                  ) : null}
                  <Text>{info.item}</Text>
                </Text>
              </View>
            );
          }}
          CellRendererComponent={cellRenderer}
          maxToRenderPerBatch={5}
          ListFooterComponent={null}
          ListFooterComponentStyle={null}
          ListHeaderComponent={null}
          ListHeaderComponentStyle={null}
        />

        <SectionList
          ref={this.myList}
          sections={sections}
          renderSectionHeader={({section}) => {
            section; // $ExpectType SectionListData<string, SectionT>

            return section.displayTitle ? (
              <View>
                <Text>{section.title}</Text>
              </View>
            ) : null;
          }}
          renderItem={info => {
            info; // $ExpectType SectionListRenderItemInfo<string, SectionT>

            return (
              <View>
                <Text>
                  {info.section.displayTitle ? (
                    <Text>{`${info.section.title} - `}</Text>
                  ) : null}
                  <Text>{info.item}</Text>
                </Text>
              </View>
            );
          }}
          CellRendererComponent={cellRenderer}
          maxToRenderPerBatch={5}
          ListFooterComponent={null}
          ListFooterComponentStyle={undefined}
          ListHeaderComponent={null}
          ListHeaderComponentStyle={undefined}
        />
      </React.Fragment>
    );
  }
}

export class CapsLockComponent extends React.Component<TextProps> {
  render() {
    const content = (this.props.children || '') as string;
    return <Text {...this.props}>{content.toUpperCase()}</Text>;
  }
}

const getInitialUrlTest = () =>
  Linking.getInitialURL().then(val => {
    if (val !== null) {
      val.indexOf('val is now a string');
    }
  });

LogBox.ignoreAllLogs();
LogBox.ignoreAllLogs(true);
LogBox.ignoreLogs(['someString', /^aRegex/]);
LogBox.install();
LogBox.uninstall();

class AlertTest extends React.Component {
  showAlert() {
    Alert.alert(
      'Title',
      'Message',
      [
        {text: 'First button', onPress: () => {}},
        {text: 'Second button', onPress: () => {}},
        {text: 'Third button', onPress: () => {}},
      ],
      {
        cancelable: false,
        onDismiss: () => {},
      },
    );
  }

  render() {
    return <Button title="Press me" onPress={this.showAlert} />;
  }
}

Alert.prompt(
  'Enter password',
  'Enter your password to claim your $1.5B in lottery winnings',
  text => {
    console.log(text);
  },
  'secure-text',
);

Alert.prompt(
  'Enter password',
  'Enter your password to claim your $1.5B in lottery winnings',
  [
    {
      text: 'Cancel',
      onPress: () => console.log('Cancel Pressed'),
      style: 'cancel',
    },
    {
      text: 'OK',
      isPreferred: true,
      onPress: (password?: string) =>
        console.log('OK Pressed, password: ' + password),
    },
  ],
  'secure-text',
);

class InputAccessoryViewTest extends React.Component {
  render() {
    const uniqueID = 'foobar';
    return (
      <InputAccessoryView nativeID={uniqueID}>
        <TextInput inputAccessoryViewID={uniqueID} />
      </InputAccessoryView>
    );
  }
}

// DeviceEventEmitter
const deviceEventEmitter: typeof DeviceEventEmitter = DeviceEventEmitter;
deviceEventEmitter.addListener('keyboardWillShow', data => true);
deviceEventEmitter.addListener('keyboardWillShow', data => true, {});

// NativeEventEmitter - Android
const androidEventEmitter = new NativeEventEmitter();
const sub1 = androidEventEmitter.addListener('event', (event: object) => event);
const sub2 = androidEventEmitter.addListener(
  'event',
  (event: object) => event,
  {},
);
androidEventEmitter.listenerCount('event'); // $ExpectType number
sub2.remove();
androidEventEmitter.removeAllListeners('event');

// NativeEventEmitter - IOS
const nativeModule: NativeModule = {
  addListener(eventType: string) {},
  removeListeners(count: number) {},
};
const iosEventEmitter = new NativeEventEmitter(nativeModule);
const sub3 = iosEventEmitter.addListener('event', (event: object) => event);
const sub4 = iosEventEmitter.addListener('event', (event: object) => event, {});
iosEventEmitter.listenerCount('event');
sub4.remove();
iosEventEmitter.removeAllListeners('event');

class CustomEventEmitter extends NativeEventEmitter {}

const customEventEmitter = new CustomEventEmitter();
customEventEmitter.addListener('event', () => {});

class TextInputTest extends React.Component<{}, {username: string}> {
  username: React.ElementRef<typeof TextInput> | null = null;

  handleUsernameChange = (text: string) => {
    console.log(`text: ${text}`);
  };

  onScroll = (e: TextInputScrollEvent) => {
    testNativeSyntheticEvent(e);
    console.log(`x: ${e.nativeEvent.contentOffset.x}`);
    console.log(`y: ${e.nativeEvent.contentOffset.y}`);
  };

  handleOnBlur = (e: BlurEvent) => {
    testNativeSyntheticEvent(e);
  };

  handleOnFocus = (e: FocusEvent) => {
    testNativeSyntheticEvent(e);
  };

  handleOnSelectionChange = (e: TextInputSelectionChangeEvent) => {
    testNativeSyntheticEvent(e);

    console.log(`target: ${e.nativeEvent.target}`);
    console.log(`start: ${e.nativeEvent.selection.start}`);
    console.log(`end: ${e.nativeEvent.selection.end}`);
  };

  handleOnKeyPress = (e: TextInputKeyPressEvent) => {
    testNativeSyntheticEvent(e);
    console.log(`key: ${e.nativeEvent.key}`);
  };

  handleOnChange = (e: TextInputChangeEvent) => {
    testNativeSyntheticEvent(e);

    console.log(`eventCount: ${e.nativeEvent.eventCount}`);
    console.log(`target: ${e.nativeEvent.target}`);
    console.log(`text: ${e.nativeEvent.text}`);
  };

  handleOnContentSizeChange = (e: TextInputContentSizeChangeEvent) => {
    testNativeSyntheticEvent(e);
    console.log(`contentSize.width: ${e.nativeEvent.contentSize.width}`);
    console.log(`contentSize.height: ${e.nativeEvent.contentSize.height}`);
  };

  handleOnEndEditing = (e: TextInputEndEditingEvent) => {
    testNativeSyntheticEvent(e);
    console.log(`text: ${e.nativeEvent.text}`);
  };

  handleOnSubmitEditing = (e: TextInputSubmitEditingEvent) => {
    testNativeSyntheticEvent(e);
    console.log(`text: ${e.nativeEvent.text}`);
  };

  render() {
    return (
      <View>
        <Text onPress={() => this.username && this.username.focus()}>
          Username
        </Text>

        <TextInput
          ref={input => {
            this.username = input;
          }}
          textContentType="username"
          autoComplete="username"
          value={this.state.username}
          onChangeText={this.handleUsernameChange}
        />

        <TextInput multiline onScroll={this.onScroll} />

        <TextInput onBlur={this.handleOnBlur} onFocus={this.handleOnFocus} />

        <TextInput onSelectionChange={this.handleOnSelectionChange} />

        <TextInput onKeyPress={this.handleOnKeyPress} />

        <TextInput onChange={this.handleOnChange} />

        <TextInput onChange={this.handleOnChange} />

        <TextInput onEndEditing={this.handleOnEndEditing} />

        <TextInput onSubmitEditing={this.handleOnSubmitEditing} />

        <TextInput
          multiline
          onContentSizeChange={this.handleOnContentSizeChange}
        />

        <TextInput contextMenuHidden={true} />
      </View>
    );
  }
}

class TextTest extends React.Component {
  handleOnLayout = (e: LayoutChangeEvent) => {
    testNativeSyntheticEvent(e);

    const x = e.nativeEvent.layout.x; // $ExpectType number
    const y = e.nativeEvent.layout.y; // $ExpectType number
    const width = e.nativeEvent.layout.width; // $ExpectType number
    const height = e.nativeEvent.layout.height; // $ExpectType number
  };

  handleOnTextLayout = (e: TextLayoutEvent) => {
    testNativeSyntheticEvent(e);

    e.nativeEvent.lines.forEach(line => {
      const ascender = line.ascender; // $ExpectType number
      const capHeight = line.capHeight; // $ExpectType number
      const descender = line.descender; // $ExpectType number
      const height = line.height; // $ExpectType number
      const text = line.text; // $ExpectType string
      const width = line.width; // $ExpectType number
      const x = line.x; // $ExpectType number
      const xHeight = line.xHeight; // $ExpectType number
      const y = line.y; // $ExpectType number
    });
  };

  render() {
    return (
      <Text
        allowFontScaling={false}
        ellipsizeMode="head"
        numberOfLines={2}
        onLayout={this.handleOnLayout}
        onTextLayout={this.handleOnTextLayout}
        disabled>
        Test text
      </Text>
    );
  }
}

class StatusBarTest extends React.Component {
  render() {
    StatusBar.setBarStyle('dark-content', true);

    console.log('height:', StatusBar.currentHeight);

    return (
      <StatusBar backgroundColor="blue" barStyle="light-content" translucent />
    );
  }
}

export class ImageTest extends React.Component {
  componentDidMount(): void {
    const uri =
      'https://seeklogo.com/images/T/typescript-logo-B29A3F462D-seeklogo.com.png';
    const headers = {Authorization: 'Bearer test'};
    const image = Image.resolveAssetSource({uri});
    console.log(image?.width, image?.height, image?.scale, image?.uri);

    Image.queryCache &&
      Image.queryCache([uri]).then(({[uri]: status}) => {
        if (status === undefined) {
          console.log('Image is not in cache');
        } else {
          console.log(`Image is in ${status} cache`);
        }
      });

    const promise1: Promise<any> = Image.getSize(uri).then(({width, height}) =>
      console.log(width, height),
    );
    Image.getSize(uri, (width, height) => console.log(width, height));
    Image.getSize(
      uri,
      (width, height) => console.log(width, height),
      error => console.error(error),
    );
    const promise2: Promise<any> = Image.getSizeWithHeaders(uri, headers).then(
      ({width, height}) => console.log(width, height),
    );
    Image.getSizeWithHeaders(uri, headers, (width, height) =>
      console.log(width, height),
    );
    Image.getSizeWithHeaders(
      uri,
      headers,
      (width, height) => console.log(width, height),
      error => console.error(error),
    );
    Image.prefetch(uri); // $ExpectType Promise<boolean>
  }

  handleOnLoad = (e: ImageLoadEvent) => {
    testNativeSyntheticEvent(e);
    console.log('height:', e.nativeEvent.source.height);
    console.log('width:', e.nativeEvent.source.width);
    console.log('uri:', e.nativeEvent.source.uri);
  };

  handleOnError = (e: ImageErrorEvent) => {
    testNativeSyntheticEvent(e);
    console.log('error:', e.nativeEvent.error);
  };

  render() {
    const resizeMode: ImageResizeMode = 'contain';

    return (
      <View>
        <Image
          source={{
            uri: 'https://seeklogo.com/images/T/typescript-logo-B29A3F462D-seeklogo.com.png',
          }}
          onLoad={this.handleOnLoad}
          onError={this.handleOnError}
        />

        <Image
          source={{
            uri: 'https://seeklogo.com/images/T/typescript-logo-B29A3F462D-seeklogo.com.png',
          }}
          resizeMode={resizeMode}
        />
      </View>
    );
  }
}

export class ImageBackgroundProps extends React.Component {
  private _imageRef: React.ComponentRef<typeof Image> | null = null;

  setImageRef = (image: React.ComponentRef<typeof Image>) => {
    this._imageRef = image;
  };

  render() {
    return (
      <View>
        <ImageBackground
          source={{
            uri: 'https://seeklogo.com/images/T/typescript-logo-B29A3F462D-seeklogo.com.png',
          }}
          imageRef={this.setImageRef}>
          <Text>Some text</Text>
        </ImageBackground>
      </View>
    );
  }
}

class AccessibilityTest extends React.Component {
  render() {
    return (
      <>
        <View
          accessibilityElementsHidden={true}
          importantForAccessibility={'no-hide-descendants'}
          onAccessibilityTap={() => {}}
          accessibilityRole="header"
          accessibilityState={{checked: true}}
          accessibilityHint="Very important header"
          accessibilityValue={{min: 60, max: 120, now: 80}}
          aria-label="Aria Label"
          onMagicTap={() => {}}
          onAccessibilityEscape={() => {}}>
          <Text accessibilityIgnoresInvertColors>Text</Text>
          <View />
        </View>
        <Pressable aria-hidden={false} aria-label="Aria Label" />
        <TouchableOpacity
          aria-hidden={true}
          aria-label="Aria Label"
          aria-busy
          aria-valuemax={1}
        />
        <TouchableNativeFeedback
          aria-expanded={false}
          aria-label="Aria Label"
        />
      </>
    );
  }
}

AccessibilityInfo.isBoldTextEnabled().then(isEnabled =>
  console.log(`AccessibilityInfo.isBoldTextEnabled => ${isEnabled}`),
);
AccessibilityInfo.isGrayscaleEnabled().then(isEnabled =>
  console.log(`AccessibilityInfo.isGrayscaleEnabled => ${isEnabled}`),
);
AccessibilityInfo.isInvertColorsEnabled().then(isEnabled =>
  console.log(`AccessibilityInfo.isInvertColorsEnabled => ${isEnabled}`),
);
AccessibilityInfo.isReduceMotionEnabled().then(isEnabled =>
  console.log(`AccessibilityInfo.isReduceMotionEnabled => ${isEnabled}`),
);
AccessibilityInfo.isReduceTransparencyEnabled().then(isEnabled =>
  console.log(`AccessibilityInfo.isReduceTransparencyEnabled => ${isEnabled}`),
);
AccessibilityInfo.isScreenReaderEnabled().then(isEnabled =>
  console.log(`AccessibilityInfo.isScreenReaderEnabled => ${isEnabled}`),
);
AccessibilityInfo.getRecommendedTimeoutMillis(5000).then(timeoutMiles =>
  console.log(
    `AccessibilityInfo.getRecommendedTimeoutMillis => ${timeoutMiles}`,
  ),
);

AccessibilityInfo.addEventListener('accessibilityServiceChanged', isEnabled =>
  console.log(`AccessibilityInfo.accessibilityServiceChanged => ${isEnabled}`),
);
AccessibilityInfo.addEventListener(
  'announcementFinished',
  ({announcement, success}) =>
    console.log(
      `A11y Event: announcementFinished: ${announcement}, ${success}`,
    ),
);
AccessibilityInfo.addEventListener('boldTextChanged', isEnabled =>
  console.log(`AccessibilityInfo.isBoldTextEnabled => ${isEnabled}`),
);
AccessibilityInfo.addEventListener('change', isEnabled =>
  console.log(`AccessibilityInfo.change => ${isEnabled}`),
);
AccessibilityInfo.addEventListener('darkerSystemColorsChanged', isEnabled =>
  console.log(`AccessibilityInfo.darkerSystemColorsChanged => ${isEnabled}`),
);
AccessibilityInfo.addEventListener('grayscaleChanged', isEnabled =>
  console.log(`AccessibilityInfo.isGrayscaleEnabled => ${isEnabled}`),
);
AccessibilityInfo.addEventListener('highTextContrastChanged', isEnabled =>
  console.log(`AccessibilityInfo.highTextContrastChanged => ${isEnabled}`),
);
AccessibilityInfo.addEventListener('invertColorsChanged', isEnabled =>
  console.log(`AccessibilityInfo.isInvertColorsEnabled => ${isEnabled}`),
);
AccessibilityInfo.addEventListener('reduceMotionChanged', isEnabled =>
  console.log(`AccessibilityInfo.isReduceMotionEnabled => ${isEnabled}`),
);
AccessibilityInfo.addEventListener('reduceTransparencyChanged', isEnabled =>
  console.log(`AccessibilityInfo.isReduceTransparencyEnabled => ${isEnabled}`),
);
const screenReaderChangedListener = (isEnabled: boolean): void =>
  console.log(`AccessibilityInfo.isScreenReaderEnabled => ${isEnabled}`);
AccessibilityInfo.addEventListener(
  'screenReaderChanged',
  screenReaderChangedListener,
).remove();

const KeyboardAvoidingViewTest = () => <KeyboardAvoidingView enabled />;

const ModalTest = () => <Modal hardwareAccelerated />;
const ModalTest2 = () => <Modal hardwareAccelerated testID="modal-test-2" />;
const ModalRefTest = () => {
  const modalRef = React.useRef<Modal & HostInstance>(null);
  return <Modal modalRef={modalRef} />;
};

// $ExpectType HostComponent<{ nativeProp: string; }>
const NativeBridgedComponent = requireNativeComponent<{nativeProp: string}>(
  'NativeBridgedComponent',
);

class BridgedComponentTest extends React.Component {
  nativeComponentRef: React.ElementRef<typeof NativeBridgedComponent> | null;

  callNativeMethod = () => {
    const nodeHandle = findNodeHandle(this.nativeComponentRef);
    if (nodeHandle != null) {
      const commandID = 1; // some command
      UIManager.dispatchViewManagerCommand(nodeHandle, commandID, []);
    }
  };

  measureNativeComponent() {
    if (this.nativeComponentRef) {
      this.nativeComponentRef.measure(
        (x, y, width, height, pageX, pageY) =>
          x + y + width + height + pageX + pageY,
      );
    }
  }

  render() {
    return (
      <NativeBridgedComponent
        {...this.props}
        nativeProp="test"
        ref={ref => {
          this.nativeComponentRef = ref;
        }}
      />
    );
  }
}

const SafeAreaViewTest = () => {
  const viewRef = React.createRef<React.ComponentRef<typeof View>>();

  return (
    <>
      <SafeAreaView />;
      <SafeAreaView ref={viewRef} />;
      <SafeAreaView
        ref={ref => {
          ref?.focus();
          ref?.blur();
          ref?.measure(
            (x, y, width, height, pageX, pageY): number =>
              x + y + width + height + pageX + pageY,
          );
          ref?.measureInWindow(
            (x, y, width, height): number => x + y + width + height,
          );
          ref?.setNativeProps({focusable: false});
        }}
      />
    </>
  );
};

const SwitchRefTest = () => {
  const switchRef = React.createRef<React.ComponentRef<typeof Switch>>();

  return (
    <>
      <Switch ref={switchRef} />
      <Switch
        ref={ref => {
          ref?.focus();
          ref?.blur();
          ref?.measure(
            (x, y, width, height, pageX, pageY): number =>
              x + y + width + height + pageX + pageY,
          );
          ref?.measureInWindow(
            (x, y, width, height): number => x + y + width + height,
          );
          ref?.setNativeProps({focusable: false});
        }}
      />
    </>
  );
};
const SwitchColorTest = () => (
  <Switch trackColor={{true: 'pink', false: 'red'}} />
);
const SwitchColorOptionalTrueTest = () => (
  <Switch trackColor={{false: 'red'}} />
);
const SwitchColorOptionalFalseTest = () => (
  <Switch trackColor={{true: 'pink'}} />
);
const SwitchColorNullTest = () => (
  <Switch trackColor={{true: 'pink', false: null}} />
);

const SwitchThumbColorTest = () => <Switch thumbColor={'red'} />;

const SwitchOnChangeWithoutParamsTest = () => (
  <Switch onChange={() => console.log('test')} />
);
const SwitchOnChangeUndefinedTest = () => <Switch onChange={undefined} />;
const SwitchOnChangeNullTest = () => <Switch onChange={null} />;
const SwitchOnChangePromiseTest = () => (
  <Switch
    onChange={event => {
      const e: SwitchChangeEvent = event;
      return new Promise(() => e.nativeEvent.value);
    }}
  />
);

const SwitchOnValueChangeWithoutParamsTest = () => (
  <Switch onValueChange={() => console.log('test')} />
);
const SwitchOnValueChangeUndefinedTest = () => (
  <Switch onValueChange={undefined} />
);
const SwitchOnValueChangeNullTest = () => <Switch onValueChange={null} />;
const SwitchOnValueChangePromiseTest = () => (
  <Switch
    onValueChange={value => {
      const v: boolean = value;
      return new Promise(() => v);
    }}
  />
);

const NativeIDTest = () => (
  <ScrollView nativeID={'nativeID'}>
    <View nativeID={'nativeID'} />
    <Text nativeID={'nativeID'}>Text</Text>
    <Image
      source={{
        uri: 'https://seeklogo.com/images/T/typescript-logo-B29A3F462D-seeklogo.com.png',
      }}
      nativeID={'nativeID'}
    />
  </ScrollView>
);

const IdTest = () => (
  <View id={'id'}>
    <TouchableWithoutFeedback id={'id'} onPress={() => {}} />
    <Text id={'id'}>Text</Text>
    <TextInput id={'id'} value="text" />
    <Image
      source={{
        uri: 'https://seeklogo.com/images/T/typescript-logo-B29A3F462D-seeklogo.com.png',
      }}
      id={'id'}
    />
  </View>
);

const ScrollViewMaintainVisibleContentPositionTest = () => (
  <ScrollView
    maintainVisibleContentPosition={{
      autoscrollToTopThreshold: 1,
      minIndexForVisible: 10,
    }}></ScrollView>
);

const ScrollViewInsetsTest = () => (
  <>
    <ScrollView automaticallyAdjustKeyboardInsets />
    <ScrollView automaticallyAdjustKeyboardInsets={false} />
  </>
);

const MaxFontSizeMultiplierTest = () => (
  <Text maxFontSizeMultiplier={0}>Text</Text>
);

const ShareTest = () => {
  Share.share(
    {title: 'title', message: 'message'},
    {
      dialogTitle: 'dialogTitle',
      excludedActivityTypes: ['activity'],
      tintColor: 'red',
      subject: 'Email subject',
    },
  );
  Share.share({title: 'title', url: 'url'});
  Share.share({message: 'message'}).then(result => {
    if (result.action === Share.sharedAction) {
      const activity = result.activityType;
    } else if (result.action === Share.dismissedAction) {
    }
  });
};

const KeyboardTest = () => {
  const subscriber = Keyboard.addListener('keyboardDidHide', event => {
    event;
  });
  subscriber.remove();

  Keyboard.dismiss();

  // Android Keyboard Event
  Keyboard.scheduleLayoutAnimation({
    duration: 0,
    easing: 'keyboard',
    endCoordinates: {screenX: 0, screenY: 0, width: 0, height: 0},
  });

  // IOS Keyboard Event
  Keyboard.scheduleLayoutAnimation({
    duration: 0,
    easing: 'easeInEaseOut',
    endCoordinates: {screenX: 0, screenY: 0, width: 0, height: 0},
    startCoordinates: {screenX: 0, screenY: 0, width: 0, height: 0},
    isEventFromThisApp: true,
  });
  if (Keyboard.isVisible()) {
    Keyboard.metrics();
  }
};

const PermissionsAndroidTest = () => {
  PermissionsAndroid.request('android.permission.CAMERA').then(result => {
    switch (result) {
      case 'granted':
        break;
      case 'denied':
        break;
      case 'never_ask_again':
        break;
    }
  });

  PermissionsAndroid.requestMultiple([
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_BACKGROUND_LOCATION',
  ]).then(results => {
    switch (results['android.permission.CAMERA']) {
      case 'granted':
        break;
      case 'denied':
        break;
      case 'never_ask_again':
        break;
    }
    switch (results['android.permission.ACCESS_FINE_LOCATION']) {
      case 'granted':
        break;
      case 'denied':
        break;
      case 'never_ask_again':
        break;
    }
    switch (results['android.permission.ACCESS_BACKGROUND_LOCATION']) {
      case 'granted':
        break;
      case 'denied':
        break;
      case 'never_ask_again':
        break;
    }
  });

  PermissionsAndroid.requestMultiple([
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_ADVERTISE',
  ]).then(results => {
    switch (results['android.permission.BLUETOOTH_SCAN']) {
      case 'granted':
        break;
      case 'denied':
        break;
      case 'never_ask_again':
        break;
    }
    switch (results['android.permission.BLUETOOTH_CONNECT']) {
      case 'granted':
        break;
      case 'denied':
        break;
      case 'never_ask_again':
        break;
    }
    switch (results['android.permission.BLUETOOTH_ADVERTISE']) {
      case 'granted':
        break;
      case 'denied':
        break;
      case 'never_ask_again':
        break;
    }
  });
};

// Platform
const PlatformTest = () => {
  switch (Platform.OS) {
    case 'ios':
      if (!Platform.isPad) {
        return 32;
      } else {
        return 44;
      }
    case 'android':
    case 'macos':
    case 'windows':
      return Platform.isTV ? 64 : 56;
    default:
      return Platform.isTV ? 40 : 44;
  }
};

const PlatformConstantsTest = () => {
  if (Platform.OS !== 'web') {
    const testing: boolean = Platform.constants.isTesting;
  }
  if (Platform.OS === 'ios') {
    const hasForceTouch: boolean = Platform.constants.forceTouchAvailable;
  } else if (Platform.OS === 'android') {
    const {major, prerelease} = Platform.constants.reactNativeVersion;
    const v = Platform.constants.Version;
    const host: string | undefined = Platform.constants.ServerHost;
  }
};
Platform.select({native: 1}); // $ExpectType number | undefined
Platform.select({native: 1, web: 2, default: 0}); // $ExpectType number
Platform.select({android: 1}); // $ExpectType number | undefined
Platform.select({android: 1, ios: 2, default: 0}); // $ExpectType number
Platform.select({android: 1, ios: 2, macos: 3, web: 4, windows: 5}); // $ExpectType number | undefined
Platform.select({android: 1, ios: 2, macos: 3, web: 4, windows: 5, default: 0}); // $ExpectType number

PlatformColor('?attr/colorControlNormal');
PlatformColor('?attr/colorControlNormal', '?attr/colorAccent', 'another');

DynamicColorIOS({
  dark: 'lightskyblue',
  light: 'midnightblue',
});

DynamicColorIOS({
  dark: 'lightskyblue',
  light: PlatformColor('labelColor'),
});

// Test you cannot set internals of ColorValue directly
const OpaqueTest1 = () => (
  <View
    // @ts-expect-error
    style={{
      backgroundColor: {
        resource_paths: ['?attr/colorControlNormal'],
      },
    }}
  />
);

const OpaqueTest2 = () => (
  <View
    // @ts-expect-error
    style={{
      backgroundColor: {
        semantic: 'string',
        dynamic: {
          light: 'light',
          dark: 'dark',
        },
      },
    }}
  />
);

// Test you cannot amend opaque type
// @ts-expect-error
PlatformColor('?attr/colorControlNormal').resource_paths.push('foo');

const someColorProp: ColorValue = PlatformColor('test');

// Test PlatformColor inside Platform select with stylesheet
StyleSheet.create({
  labelCell: {
    flex: 1,
    alignItems: 'stretch',
    ...Platform.select({
      ios: {
        color: DynamicColorIOS({
          dark: 'lightskyblue',
          light: PlatformColor('labelColor'),
        }),
      },
      android: {
        color: PlatformColor('?attr/colorControlNormal'),
      },
      default: {color: PlatformColor('?attr/colorControlNormal')},
    }),
  },
});

// PlatformColor in style colors
StyleSheet.create({
  labelCell: {
    flex: 1,
    alignItems: 'stretch',
    color: PlatformColor('test'),
    backgroundColor: PlatformColor('test'),
    borderBottomColor: PlatformColor('test'),
    borderColor: PlatformColor('test'),
    borderEndColor: PlatformColor('test'),
    borderLeftColor: PlatformColor('test'),
    borderRightColor: PlatformColor('test'),
    borderStartColor: PlatformColor('test'),
    borderTopColor: PlatformColor('test'),
    overlayColor: PlatformColor('test'),
    shadowColor: PlatformColor('test'),
    textDecorationColor: PlatformColor('test'),
    textShadowColor: PlatformColor('test'),
    tintColor: PlatformColor('test'),
  },
});

function someColorString(): ColorValue {
  return '#000000';
}

function somePlatformColor(): ColorValue {
  return PlatformColor('test');
}

const colors = {
  color: someColorString(),
  backgroundColor: somePlatformColor(),
};

StyleSheet.create({
  labelCell: {
    color: colors.color,
    backgroundColor: colors.backgroundColor,
  },
});

const OpaqueTest3 = () => (
  <View
    style={{
      backgroundColor: colors.backgroundColor,
    }}
  />
);

// ProgressBarAndroid
const ProgressBarAndroidTest = () => {
  <ProgressBarAndroid
    animating
    color="white"
    styleAttr="Horizontal"
    progress={0.42}
    indeterminate={false}
  />;
};

// Push notification
const PushNotificationTest = () => {
  PushNotificationIOS.presentLocalNotification({
    alertBody: 'notificatus',
    userInfo: 'informius',
    alertTitle: 'Titulus',
    alertAction: 'view',
  });

  PushNotificationIOS.scheduleLocalNotification({
    alertAction: 'view',
    alertBody: 'Look at me!',
    alertTitle: 'Hello!',
    applicationIconBadgeNumber: 999,
    category: 'engagement',
    fireDate: +new Date(),
    isSilent: false,
    repeatInterval: 'minute',
    userInfo: {
      abc: 123,
    },
  });
};

// Appearance
const DarkMode = () => {
  const color = useColorScheme();
  const isDarkMode = Appearance.getColorScheme() === 'dark';

  const subscription = Appearance.addChangeListener(({colorScheme}) => {
    console.log(colorScheme);
  });

  React.useEffect(() => {
    console.log('-color', color);

    return () => {
      subscription.remove();
    };
  }, [color, subscription]);

  return <Text>Is dark mode enabled? {isDarkMode}</Text>;
};

// VirtualizedList
// Test inspired by: https://reactnative.dev/docs/virtualizedlist
const VirtualizedListTest = () => {
  const DATA = [1, 2, 3];

  const getItem = (data: number[], index: number) => {
    return {
      title: `Item ${data[index]}`,
    };
  };

  const getItemCount = (data: number[]) => data.length;

  return (
    <VirtualizedList
      data={DATA}
      initialNumToRender={4}
      renderItem={({item}: ListRenderItemInfo<ReturnType<typeof getItem>>) => (
        <Text>{item.title}</Text>
      )}
      getItemCount={getItemCount}
      getItem={getItem}
    />
  );
};

// DevSettings
DevSettings.addMenuItem('alert', () => {
  Alert.alert('alert');
});
DevSettings.reload();
DevSettings.reload('reload with reason');

// Accessibility custom actions
const AccessibilityCustomActionsTest = () => {
  return (
    <View
      accessible={true}
      accessibilityActions={[
        // should support custom defined actions
        {name: 'cut', label: 'cut'},
        {name: 'copy', label: 'copy'},
        {name: 'paste', label: 'paste'},
      ]}
      onAccessibilityAction={event => {
        switch (event.nativeEvent.actionName) {
          case 'cut':
            Alert.alert('Alert', 'cut action success');
            break;
          case 'copy':
            Alert.alert('Alert', 'copy action success');
            break;
          case 'paste':
            Alert.alert('Alert', 'paste action success');
            break;
        }
      }}
    />
  );
};

// DrawerLayoutAndroidTest
export class DrawerLayoutAndroidTest extends React.Component {
  drawerRef = React.createRef<React.ComponentRef<typeof DrawerLayoutAndroid>>();

  readonly styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 50,
      backgroundColor: '#ecf0f1',
      padding: 8,
    },
    navigationContainer: {
      flex: 1,
      paddingTop: 50,
      backgroundColor: '#fff',
      padding: 8,
    },
  });

  readonly navigationView = (
    <View style={this.styles.navigationContainer}>
      <Text style={{margin: 10, fontSize: 15}}>I'm in the Drawer!</Text>
    </View>
  );

  handleDrawerClose = () => {
    console.log('handleDrawerClose');
  };

  handleDrawerOpen = () => {
    console.log('handleDrawerOpen');
  };

  handleDrawerSlide = (event: DrawerSlideEvent) => {
    console.log('handleDrawerSlide', event);
  };

  handleDrawerStateChanged = (event: 'Idle' | 'Dragging' | 'Settling') => {
    console.log('handleDrawerStateChanged', event);
  };

  render() {
    return (
      <DrawerLayoutAndroid
        ref={this.drawerRef}
        drawerBackgroundColor="rgba(0,0,0,0.5)"
        drawerLockMode="locked-closed"
        drawerPosition="right"
        drawerWidth={300}
        keyboardDismissMode="on-drag"
        onDrawerClose={this.handleDrawerClose}
        onDrawerOpen={this.handleDrawerOpen}
        onDrawerSlide={this.handleDrawerSlide}
        onDrawerStateChanged={this.handleDrawerStateChanged}
        renderNavigationView={() => this.navigationView}
        statusBarBackgroundColor="yellow">
        <View style={this.styles.container}>
          <Text style={{margin: 10, fontSize: 15}}>
            DrawerLayoutAndroid example
          </Text>
        </View>
      </DrawerLayoutAndroid>
    );
  }
}

// DataDetectorType for Text component
const DataDetectorTypeTest = () => {
  return (
    <>
      <Text dataDetectorType={'all'}>
        http://test.com test@test.com +33123456789
      </Text>
      <Text dataDetectorType={'email'}>test@test.com</Text>
      <Text dataDetectorType={'link'}>http://test.com</Text>
      <Text dataDetectorType={'none'}>Hi there !</Text>
      <Text dataDetectorType={'phoneNumber'}>+33123456789</Text>
      <Text dataDetectorType={null}>Must allow null value</Text>
    </>
  );
};

const ToastAndroidTest = () => {
  ToastAndroid.showWithGravityAndOffset(
    'My Toast',
    ToastAndroid.SHORT,
    ToastAndroid.BOTTOM,
    0,
    50,
  );
};

const I18nManagerTest = () => {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
  const {isRTL, doLeftAndRightSwapInRTL} = I18nManager.getConstants();
  const isRtlFlag = I18nManager.isRTL;
  const doLeftAndRightSwapInRtlFlag = I18nManager.doLeftAndRightSwapInRTL;

  console.log(
    isRTL,
    isRtlFlag,
    doLeftAndRightSwapInRTL,
    doLeftAndRightSwapInRtlFlag,
  );
};

// LayoutAnimations
LayoutAnimation.configureNext(
  LayoutAnimation.create(
    123,
    LayoutAnimation.Types.easeIn,
    LayoutAnimation.Properties.opacity,
  ),
);

LayoutAnimation.configureNext(LayoutAnimation.create(123, 'easeIn', 'opacity'));

// ActionSheetIOS
const ActionSheetIOSTest = () => {
  // test destructiveButtonIndex undefined
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: ['foo'],
      destructiveButtonIndex: undefined,
    },
    () => undefined,
  );

  // test destructiveButtonIndex null
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: ['foo'],
      destructiveButtonIndex: null,
    },
    () => undefined,
  );

  // test destructiveButtonIndex single number
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: ['foo'],
      destructiveButtonIndex: 0,
    },
    () => undefined,
  );

  // test destructiveButtonIndex number array
  ActionSheetIOS.showActionSheetWithOptions(
    {
      options: ['foo', 'bar'],
      destructiveButtonIndex: [0, 1],
    },
    () => undefined,
  );

  // test dismissActionSheet method
  ActionSheetIOS.dismissActionSheet();
};

<LayoutConformance mode="strict">
  <View />
</LayoutConformance>;
