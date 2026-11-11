/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from 'react-native';

import * as React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const ASSETS = {
  bunny: require('../../../../../packages/rn-tester/js/assets/bunny.png'),
  ducky: require('../../../../../packages/rn-tester/js/assets/rubber-ducky.png'),
  flowers: require('../../../../../packages/rn-tester/js/assets/flowers.png'),
  hawk: require('../../../../../packages/rn-tester/js/assets/hawk.png'),
  home: require('../../../../../packages/rn-tester/js/assets/bottom-nav-components-icon-light.png'),
  hotdog: require('./feed-hotdog.png'),
  like: require('../../../../../packages/rn-tester/js/assets/like.png'),
  search: require('../../../../../packages/rn-tester/js/assets/search-icon.png'),
  trees: require('./feed-trees.png'),
};

const STORIES = [
  {name: 'Your story', avatar: ASSETS.bunny, isOwn: true},
  {name: 'hawk.eye', avatar: ASSETS.hawk, isOwn: false},
  {name: 'ducky', avatar: ASSETS.ducky, isOwn: false},
  {name: 'flower_power', avatar: ASSETS.flowers, isOwn: false},
  {name: 'hotdog_lover', avatar: ASSETS.hotdog, isOwn: false},
];

const POSTS = [
  {
    author: 'Hawk Eye',
    avatar: ASSETS.hawk,
    location: 'Muir Woods',
    time: '2h',
    text: 'Spent the whole morning among the redwoods. The light this time of the year is unreal!',
    tags: ['nature', 'weekend'],
    image: ASSETS.trees,
    likedBy: 'ducky',
    likes: 1204,
    comments: 87,
  },
  {
    author: 'Rubber Ducky',
    avatar: ASSETS.ducky,
    location: 'Fisherman’s Wharf',
    time: '5h',
    text: 'Found the best hot dog in town. Not sharing the address though.',
    tags: ['food'],
    image: ASSETS.hotdog,
    likedBy: 'bunny',
    likes: 342,
    comments: 12,
  },
];

function formatCount(count: number): string {
  return String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

component StatusBar() {
  return (
    <View style={styles.statusBar}>
      <Text style={styles.statusBarTime}>9:41</Text>
      <View style={styles.statusBarIcons}>
        {[6, 9, 12, 15].map(height => (
          <View key={height} style={[styles.signalBar, {height}]} />
        ))}
        <View style={styles.battery}>
          <View style={styles.batteryLevel} />
        </View>
      </View>
    </View>
  );
}

component Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Feed</Text>
      <View style={styles.headerButton}>
        <Text style={styles.headerButtonIcon}>♥</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3</Text>
        </View>
      </View>
    </View>
  );
}

component SearchBar() {
  return (
    <View style={styles.searchBar}>
      <Image source={ASSETS.search} style={styles.searchIcon} />
      <TextInput
        placeholder="Search posts, people and places"
        placeholderTextColor="#8A8D91"
        style={styles.searchInput}
      />
    </View>
  );
}

component Stories() {
  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      style={styles.stories}
      contentContainerStyle={styles.storiesContent}>
      {STORIES.map(story => (
        <View key={story.name} style={styles.story}>
          <View style={story.isOwn ? styles.storyRingSeen : styles.storyRing}>
            <Image source={story.avatar} style={styles.storyAvatar} />
          </View>
          {story.isOwn ? (
            <View style={styles.storyAddButton}>
              <Text style={styles.storyAddButtonText}>+</Text>
            </View>
          ) : null}
          <Text numberOfLines={1} style={styles.storyName}>
            {story.name}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

component Post(post: (typeof POSTS)[number]) {
  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Image source={post.avatar} style={styles.postAvatar} />
        <View style={styles.postAuthor}>
          <Text style={styles.postAuthorName}>
            {post.author} <Text style={styles.verified}>✓</Text>
          </Text>
          <Text style={styles.postMeta}>
            {post.location} · {post.time}
          </Text>
        </View>
        <Text style={styles.postMore}>•••</Text>
      </View>
      <Text style={styles.postText}>
        {post.text}
        {post.tags.map(tag => (
          <Text key={tag} style={styles.hashtag}>
            {' #' + tag}
          </Text>
        ))}
      </Text>
      <Image source={post.image} style={styles.postImage} />
      <View style={styles.postActions}>
        <View style={styles.postAction}>
          <Image source={ASSETS.like} style={styles.postActionIcon} />
          <Text style={styles.postActionText}>{formatCount(post.likes)}</Text>
        </View>
        <View style={styles.postAction}>
          <View style={styles.commentIcon} />
          <Text style={styles.postActionText}>{post.comments}</Text>
        </View>
        <View style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share</Text>
        </View>
      </View>
      <Text style={styles.postLikedBy}>
        Liked by <Text style={styles.bold}>{post.likedBy}</Text> and{' '}
        <Text style={styles.bold}>{formatCount(post.likes - 1)} others</Text>
      </Text>
    </View>
  );
}

component TabBar() {
  return (
    <View style={styles.tabBar}>
      <View style={styles.tab}>
        <Image
          source={ASSETS.home}
          style={[styles.tabIcon, styles.tabIconActive]}
        />
        <Text style={[styles.tabLabel, styles.tabLabelActive]}>Home</Text>
      </View>
      <View style={styles.tab}>
        <Image source={ASSETS.search} style={styles.tabIcon} />
        <Text style={styles.tabLabel}>Explore</Text>
      </View>
      <View style={styles.createButton}>
        <Text style={styles.createButtonText}>+</Text>
      </View>
      <View style={styles.tab}>
        <Text style={styles.tabGlyphIcon}>♡</Text>
        <Text style={styles.tabLabel}>Activity</Text>
      </View>
      <View style={styles.tab}>
        <Image source={ASSETS.bunny} style={styles.tabAvatar} />
        <Text style={styles.tabLabel}>Profile</Text>
      </View>
      <View style={styles.homeIndicator} />
    </View>
  );
}

export default component FeedScreen(feedRef?: React.RefSetter<HostInstance>) {
  return (
    <View style={styles.screen}>
      <StatusBar />
      <Header />
      <SearchBar />
      <ScrollView ref={feedRef} style={styles.feed}>
        <Stories />
        {POSTS.map(post => (
          <Post key={post.author} post={post} />
        ))}
      </ScrollView>
      <TabBar />
    </View>
  );
}

const PRIMARY_COLOR = '#1877F2';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  statusBar: {
    height: 44,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  statusBarTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBarIcons: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 3,
    borderRadius: 1,
    backgroundColor: 'black',
  },
  battery: {
    marginLeft: 6,
    width: 24,
    height: 12,
    padding: 1.5,
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.4)',
  },
  batteryLevel: {
    width: '80%',
    flex: 1,
    borderRadius: 1.5,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4E6EB',
  },
  headerButtonIcon: {
    fontSize: 22,
    color: '#E41E3F',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E41E3F',
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DADDE1',
  },
  searchIcon: {
    position: 'absolute',
    left: 28,
    top: 12,
    width: 20,
    height: 20,
    zIndex: 1,
    tintColor: '#65676B',
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingLeft: 42,
    paddingRight: 16,
    borderRadius: 22,
    fontSize: 15,
    backgroundColor: '#F0F2F5',
  },
  feed: {
    flex: 1,
  },
  stories: {
    marginTop: 8,
    flexGrow: 0,
    backgroundColor: 'white',
  },
  storiesContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  story: {
    width: 72,
    alignItems: 'center',
  },
  storyRing: {
    backgroundColor: '#D62976',
    padding: 3,
    borderRadius: 36,
    experimental_backgroundImage:
      'linear-gradient(45deg, #FEDA75, #FA7E1E, #D62976, #962FBF)',
  },
  storyRingSeen: {
    padding: 3,
    borderRadius: 36,
    backgroundColor: '#DADDE1',
  },
  storyAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: '#FFF8E1',
  },
  storyAddButton: {
    position: 'absolute',
    top: 48,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
  },
  storyAddButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  storyName: {
    marginTop: 6,
    fontSize: 12,
    color: '#050505',
  },
  post: {
    marginTop: 8,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
  },
  postAuthor: {
    flex: 1,
    marginLeft: 10,
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
  },
  verified: {
    color: PRIMARY_COLOR,
    fontSize: 13,
  },
  postMeta: {
    marginTop: 2,
    fontSize: 13,
    color: '#65676B',
  },
  postMore: {
    fontSize: 12,
    color: '#65676B',
    letterSpacing: 1,
  },
  postText: {
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    lineHeight: 21,
    color: '#050505',
  },
  hashtag: {
    color: PRIMARY_COLOR,
    fontWeight: '500',
  },
  postImage: {
    width: '100%',
    height: 260,
    backgroundColor: '#E4E6EB',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 20,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionIcon: {
    width: 22,
    height: 22,
  },
  postActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#65676B',
  },
  commentIcon: {
    width: 20,
    height: 18,
    borderRadius: 9,
    borderBottomLeftRadius: 2,
    borderWidth: 2,
    borderColor: '#65676B',
  },
  shareButton: {
    marginLeft: 'auto',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CED0D4',
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#050505',
  },
  postLikedBy: {
    marginTop: 10,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#65676B',
  },
  bold: {
    fontWeight: '700',
    color: '#050505',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 28,
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DADDE1',
    boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.06)',
  },
  tab: {
    width: 64,
    alignItems: 'center',
    gap: 4,
  },
  tabIcon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
    tintColor: '#65676B',
  },
  tabIconActive: {
    tintColor: PRIMARY_COLOR,
  },
  tabGlyphIcon: {
    height: 26,
    fontSize: 26,
    lineHeight: 26,
    color: '#65676B',
  },
  tabAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#CED0D4',
    backgroundColor: '#FFF8E1',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#65676B',
  },
  tabLabelActive: {
    color: PRIMARY_COLOR,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: PRIMARY_COLOR,
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    experimental_backgroundImage: 'linear-gradient(135deg, #3B9BFF, #1462D8)',
    boxShadow: '0 4px 10px rgba(24, 119, 242, 0.4)',
  },
  createButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 32,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    width: 134,
    height: 5,
    marginLeft: -67,
    borderRadius: 2.5,
    backgroundColor: 'black',
  },
});
