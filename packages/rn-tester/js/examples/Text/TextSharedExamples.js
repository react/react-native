/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {TextLayoutLine} from 'react-native/Libraries/Types/CoreEventTypes';

import RNTesterText from '../../components/RNTesterText';
import {useTheme} from '../../components/RNTesterTheme';
import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

function InlineView(props: {
  textAlign: 'auto' | 'left' | 'right' | 'center' | 'justify',
  long?: boolean,
}): React.Node {
  return (
    <View style={{margin: 4}}>
      <RNTesterText
        style={{textAlign: props.textAlign, backgroundColor: 'cyan'}}>
        Parent
        <RNTesterText style={{fontWeight: 'bold'}}>Child</RNTesterText>
        <View style={{width: 30, height: 30, backgroundColor: 'red'}} />
        <RNTesterText style={{fontWeight: 'bold'}}>Child</RNTesterText>
        {
          /* $FlowFixMe[invalid-compare] Error discovered during Constant
           * Condition roll out. See https://fburl.com/workplace/5whu3i34. */
          props !== null && props.long === true && (
            <RNTesterText style={{fontWeight: 'bold'}}>
              aaaa a aaaa aaaaaa aaa a a a aaaaa sdsds dsdSAD asd ASDasd ASDas
            </RNTesterText>
          )
        }
      </RNTesterText>
    </View>
  );
}

function TextInlineViewsExample(props: {}): React.Node {
  return (
    <View style={{flex: 1}} testID="view-test-inline-text-alignment">
      <RNTesterText style={{textAlign: 'center', fontSize: 14}}>
        BoringLayout
      </RNTesterText>
      <InlineView textAlign="left" />
      <InlineView textAlign="center" />
      <InlineView textAlign="right" />
      <InlineView textAlign="justify" />

      <RNTesterText style={{textAlign: 'center', fontSize: 14}}>
        StaticLayout
      </RNTesterText>
      <InlineView textAlign="left" long />
      <InlineView textAlign="center" long />
      <InlineView textAlign="right" long />
      <InlineView textAlign="justify" long />
    </View>
  );
}

function EmptyTextExample(): React.Node {
  const {BorderColor} = useTheme();
  return (
    <RNTesterText
      testID="empty-text"
      style={{
        borderWidth: 1,
        borderColor: BorderColor,
      }}
    />
  );
}

function TextAndLayoutLinesJSON({
  testID,
  ellipsizeMode,
}: Readonly<{
  testID: string,
  ellipsizeMode: 'head' | 'tail' | 'middle' | 'clip',
}>): React.Node {
  const [lines, setLines] = useState<?(TextLayoutLine[])>();

  return (
    <View testID={testID}>
      <RNTesterText variant="label">{ellipsizeMode}</RNTesterText>
      <RNTesterText
        numberOfLines={1}
        ellipsizeMode={ellipsizeMode}
        onTextLayout={ev => setLines(ev.nativeEvent.lines)}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin volutpat
        molestie nunc non tristique.
      </RNTesterText>
      <RNTesterText style={{fontSize: 8, fontFamily: 'monospace'}}>
        {JSON.stringify(lines, null, 2)}
      </RNTesterText>
    </View>
  );
}

function NumberOfLinesTextLayoutExample(): React.Node {
  return (
    <View style={{rowGap: 20}}>
      <TextAndLayoutLinesJSON ellipsizeMode="tail" testID="tail-layout" />
      <TextAndLayoutLinesJSON ellipsizeMode="head" testID="head-layout" />
      <TextAndLayoutLinesJSON ellipsizeMode="middle" testID="middle-layout" />
      <TextAndLayoutLinesJSON ellipsizeMode="clip" testID="clip-layout" />
    </View>
  );
}

component RtlInlineViewExample(
  label: string,
  testID: string,
  children: React.Node,
) {
  return (
    <View testID={testID} style={{flexDirection: 'row', flexGrow: 1}}>
      <RNTesterText variant="label" style={{width: 100, fontSize: 10}}>
        {label}
      </RNTesterText>
      <View style={{flexGrow: 1}}>{children}</View>
    </View>
  );
}

component RtlAndInlineViewsExample() {
  return (
    <View style={{rowGap: 5}}>
      <RtlInlineViewExample
        label="RTL script in LTR Layout with end attachment"
        testID="rtl-inline-view-example-1">
        <RNTesterText style={{textAlign: 'left', direction: 'ltr'}}>
          مَٰنِ ٱلرَّحِيمِ
          <View style={{width: 10, height: 10, backgroundColor: 'red'}} />
        </RNTesterText>
      </RtlInlineViewExample>

      <RtlInlineViewExample
        label="LTR script in RTL layout with middle attachment"
        testID="rtl-inline-view-example-2">
        <RNTesterText style={{textAlign: 'left', direction: 'rtl'}}>
          Hello
          <View style={{width: 10, height: 10, backgroundColor: 'red'}} />{' '}
          World!
        </RNTesterText>
      </RtlInlineViewExample>

      <RtlInlineViewExample
        label="RTL script in LTR layout with start attachment"
        testID="rtl-inline-view-example-3">
        <RNTesterText style={{textAlign: 'left', direction: 'ltr'}}>
          <View style={{width: 10, height: 10, backgroundColor: 'red'}} />
          مَٰنِ ٱلرَّحِيمِ
        </RNTesterText>
      </RtlInlineViewExample>

      <RtlInlineViewExample
        label="RTL script in RTL layout with end attachment"
        testID="rtl-inline-view-example-4">
        <RNTesterText style={{textAlign: 'left', direction: 'rtl'}}>
          مَٰنِ ٱلرَّحِيمِ
          <View style={{width: 10, height: 10, backgroundColor: 'red'}} />
        </RNTesterText>
      </RtlInlineViewExample>

      <RtlInlineViewExample
        label="RTL dominant BiDi script in RTL layout with end attachments"
        testID="rtl-inline-view-example-5">
        <RNTesterText style={{textAlign: 'left', direction: 'rtl'}}>
          مَٰنِ ٱلرَّحِيمِ
          <View style={{width: 10, height: 10, backgroundColor: 'red'}} /> Hello
          <View style={{width: 10, height: 10, backgroundColor: 'blue'}} />
        </RNTesterText>
      </RtlInlineViewExample>

      <RtlInlineViewExample
        label="LTR dominant BiDi script in RTL layout with end attachments"
        testID="rtl-inline-view-example-6">
        <RNTesterText style={{textAlign: 'left', direction: 'rtl'}}>
          Hello
          <View style={{width: 10, height: 10, backgroundColor: 'red'}} />
          مَٰنِ ٱلرَّحِيمِ
          <View style={{width: 10, height: 10, backgroundColor: 'blue'}} />
        </RNTesterText>
      </RtlInlineViewExample>
    </View>
  );
}

component TextWithLinkRoleExample() {
  const [pressed, setPressed] = useState(false);
  const handlePress = () => setPressed(true);
  const linkColor = pressed ? 'red' : 'teal';

  return (
    <View testID="text-with-link-role">
      <Text
        role="link"
        style={[styles.link, {color: linkColor}]}
        onPress={handlePress}
        testID="text-link-role-link">
        Link Text
      </Text>

      <Text>
        <Text role="link" style={styles.link} onPress={handlePress}>
          Nested Link
        </Text>
      </Text>

      <Text>
        Before{' '}
        <Text role="link" style={styles.link} onPress={handlePress}>
          Nested Link
        </Text>
        {' After'}
      </Text>

      <Text>
        <Text role="link" style={styles.link} onPress={handlePress}>
          Nested Link 1
        </Text>
        {' - '}
        <Text role="link" style={styles.link} onPress={handlePress}>
          Nested Link 2
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    color: 'teal',
    textDecorationLine: 'underline',
  },
});

export default [
  {
    title: 'Empty Text',
    name: 'emptyText',
    render: EmptyTextExample,
  },
  {
    title: 'TextInlineViewsExample',
    name: 'inlineViews',
    description:
      'Shows how inline views are rendered when text is subject to alignment.',
    expect: 'The red box should align correctly with the rest of the text.',
    render: TextInlineViewsExample,
  },
  {
    title: 'RTL and Inline Views',
    name: 'rtlInlineViews',
    description: 'RTL Script and Layout Direction, Combined with Inline Views',
    scrollable: true,
    render: RtlAndInlineViewsExample,
  },
  {
    title: 'numberOfLines with onTextLayout',
    name: 'numberOfLinesLayout',
    description:
      'Shows the behavior of numberOfLines and ellipsizeMode in conjunction with the onTextLayout event',
    scrollable: true,
    render: NumberOfLinesTextLayoutExample,
  },
  {
    title: 'Text with link role',
    name: 'textWithLinkRole',
    description: 'Shows the a11y behavior of Text with role="link"',
    render: TextWithLinkRoleExample,
  },
] as ReadonlyArray<RNTesterModuleExample>;
