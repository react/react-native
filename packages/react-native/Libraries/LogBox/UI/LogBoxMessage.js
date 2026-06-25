/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TextStyleProp} from '../../StyleSheet/StyleSheet';
import type {Message} from '../Data/parseLogBoxLog';

import Linking from '../../Linking/Linking';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import * as React from 'react';

type Range = {
  lowerBound: number,
  upperBound: number,
};

function getLinkRanges(string: string): ReadonlyArray<Range> {
  const regex = /https?:\/\/[^\s$.?#].[^\s]*/gi;
  const matches = [];

  let regexResult: RegExp$matchResult | null;
  while ((regexResult = regex.exec(string)) !== null) {
    if (regexResult != null) {
      matches.push({
        lowerBound: regexResult.index,
        upperBound: regex.lastIndex,
      });
    }
  }

  return matches;
}

component TappableLinks(content: string, style: void | TextStyleProp) {
  const matches = getLinkRanges(content);

  if (matches.length === 0) {
    // No URLs detected. Just return the content.
    return <Text style={style}>{content}</Text>;
  }

  // URLs were detected. Construct array of Text nodes.

  const fragments: Array<React.Node> = [];
  let indexCounter = 0;
  let startIndex = 0;

  for (const linkRange of matches) {
    if (startIndex < linkRange.lowerBound) {
      const text = content.substring(startIndex, linkRange.lowerBound);
      fragments.push(<Text key={++indexCounter}>{text}</Text>);
    }

    const link = content.substring(linkRange.lowerBound, linkRange.upperBound);
    fragments.push(
      <Text
        onPress={() => {
          // $FlowFixMe[unused-promise]
          Linking.openURL(link);
        }}
        key={++indexCounter}
        style={styles.linkText}>
        {link}
      </Text>,
    );

    startIndex = linkRange.upperBound;
  }

  if (startIndex < content.length) {
    const text = content.substring(startIndex);
    fragments.push(
      <Text key={++indexCounter} style={style}>
        {text}
      </Text>,
    );
  }

  return <Text style={style}>{fragments}</Text>;
}

const cleanContent = (content: string) =>
  content.replace(/^(TransformError |Error: )/g, '');

component LogBoxMessage(
  message: Message,
  style: TextStyleProp,
  plaintext?: ?boolean,
  maxLength?: ?number,
) {
  const {content, substitutions}: Message = message;

  if (plaintext === true) {
    return <Text>{cleanContent(content)}</Text>;
  }

  const resolvedMaxLength = maxLength != null ? maxLength : Infinity;
  const substitutionStyle: TextStyleProp = style;
  const elements = [];
  let length = 0;
  const createUnderLength = (
    key: string,
    messageText: string,
    textStyle: void | TextStyleProp,
  ) => {
    let cleanMessage = cleanContent(messageText);

    if (maxLength != null) {
      cleanMessage = cleanMessage.slice(0, maxLength - length);
    }

    if (length < resolvedMaxLength) {
      elements.push(
        <TappableLinks content={cleanMessage} key={key} style={textStyle} />,
      );
    }

    length += cleanMessage.length;
  };

  const lastOffset = substitutions.reduce((prevOffset, substitution, index) => {
    const key = String(index);

    if (substitution.offset > prevOffset) {
      const prevPart = content.slice(prevOffset, substitution.offset);

      createUnderLength(key, prevPart);
    }

    const substitutionPart = content.slice(
      substitution.offset,
      substitution.offset + substitution.length,
    );

    createUnderLength(key + '.5', substitutionPart, substitutionStyle);
    return substitution.offset + substitution.length;
  }, 0);

  if (lastOffset < content.length) {
    const lastPart = content.slice(lastOffset);
    createUnderLength('-1', lastPart);
  }

  return <>{elements}</>;
}

const styles = StyleSheet.create({
  linkText: {
    textDecorationLine: 'underline',
  },
});

export default LogBoxMessage;
