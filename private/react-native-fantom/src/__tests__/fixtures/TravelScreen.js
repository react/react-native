/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScrollViewInstance} from 'react-native';

import * as React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default component TravelScreen(
  query: string = '',
  scrollRef?: React.RefObject<ScrollViewInstance | null>,
) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>WEEKEND CLUB</Text>
        <Text style={styles.title}>Find your next escape.</Text>
        <Text style={styles.subtitle}>Small adventures. Great memories.</Text>
        <TextInput
          value={query}
          placeholder="Search trails, cabins, and places"
          placeholderTextColor="#7b8580"
          style={styles.search}
        />
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.feed}
        contentContainerStyle={styles.content}>
        <View style={styles.categories}>
          <View style={styles.selected}>
            <Text style={styles.selectedText}>For you</Text>
          </View>
          <Text style={styles.category}>Outdoors</Text>
          <Text style={styles.category}>City breaks</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A little closer to nature</Text>
          <Text style={styles.link}>See all</Text>
        </View>
        <View style={styles.card}>
          <Image
            source={require('./travelImage.png')}
            resizeMode="cover"
            style={styles.photo}
          />
          <View style={styles.cardBody}>
            <Text style={styles.eyebrow}>TRAIL OF THE WEEK</Text>
            <Text style={styles.cardTitle}>
              The quiet side of the mountains
            </Text>
            <Text style={styles.description}>
              Follow the pines to an open valley, with room to slow down and
              take it all in.
            </Text>
            <View style={styles.details}>
              <Text style={styles.detail}>6.4 km loop</Text>
              <Text style={styles.detail}>Easy pace</Text>
              <Text style={styles.detail}>4.9 rating</Text>
            </View>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Explore this trail</Text>
            </View>
          </View>
        </View>
        <View style={styles.tip}>
          <Text style={styles.cardTitle}>Make a day of it</Text>
          <Text style={styles.description}>
            Pack a picnic, invite a friend, and save a little time for the
            scenic route home.
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.cardTitle}>Your saved places</Text>
          <Text style={styles.description}>
            Keep your favorite escapes together. Your next weekend starts here.
          </Text>
        </View>
      </ScrollView>
      <View style={styles.navigation}>
        <Text style={styles.activeNav}>Discover</Text>
        <Text style={styles.category}>Saved</Text>
        <Text style={styles.category}>Profile</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f6f7f2'},
  header: {paddingTop: 40, paddingHorizontal: 24, paddingBottom: 20, gap: 10},
  eyebrow: {fontSize: 11, fontWeight: '700', color: '#426c58'},
  title: {fontSize: 28, fontWeight: '700', color: '#203c30'},
  subtitle: {fontSize: 14, color: '#718078'},
  search: {
    height: 48,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dce3d9',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#203c30',
    marginTop: 8,
  },
  feed: {flex: 1},
  content: {paddingHorizontal: 24, paddingBottom: 24, gap: 18},
  categories: {flexDirection: 'row', alignItems: 'center', gap: 24},
  selected: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#254f3d',
    borderRadius: 20,
  },
  selectedText: {fontSize: 13, fontWeight: '600', color: 'white'},
  category: {fontSize: 13, color: '#758077'},
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {fontSize: 16, fontWeight: '700', color: '#203c30'},
  link: {fontSize: 12, fontWeight: '600', color: '#426c58'},
  card: {
    borderRadius: 18,
    backgroundColor: 'white',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e6dc',
  },
  photo: {width: '100%', height: 180},
  cardBody: {padding: 20, gap: 12},
  cardTitle: {fontSize: 20, fontWeight: '700', color: '#203c30'},
  description: {fontSize: 14, lineHeight: 21, color: '#718078'},
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detail: {fontSize: 11, color: '#426c58'},
  button: {
    backgroundColor: '#254f3d',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {fontSize: 14, fontWeight: '600', color: 'white'},
  tip: {padding: 20, backgroundColor: '#eaf0e1', borderRadius: 14, gap: 10},
  navigation: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e6dc',
  },
  activeNav: {fontSize: 13, fontWeight: '700', color: '#254f3d'},
});
