/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import * as React from 'react';
import {useMemo} from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useAnimatedValue,
} from 'react-native';
import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

const optimizedAnimatedPropUpdatesEnabled =
  ReactNativeFeatureFlags.optimizedAnimatedPropUpdates();

// 1x1 white PNG embedded as a data URI so the `tintColor` row works without
// network access.
const TINT_SOURCE = {
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
};

function useLoop(): Animated.Value {
  const value = useAnimatedValue(0);

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [value]);

  return value;
}

function Row({
  label,
  children,
}: {
  label: string,
  children: React.Node,
}): React.Node {
  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.demo}>{children}</View>
    </View>
  );
}

function SectionHeader({title}: {title: string}): React.Node {
  return <Text style={styles.section}>{title}</Text>;
}

function FlagIndicator(): React.Node {
  return (
    <View style={styles.flagRow}>
      <Text style={styles.flagLabel}>optimizedAnimatedPropUpdates:</Text>
      <Text
        style={[
          styles.flagValue,
          optimizedAnimatedPropUpdatesEnabled ? styles.flagOn : styles.flagOff,
        ]}>
        {optimizedAnimatedPropUpdatesEnabled ? 'ON' : 'OFF'}
      </Text>
    </View>
  );
}

function AllAnimatedPropsExample(): React.Node {
  const t = useLoop();

  // All interpolators are derived from a single shared driver. Building them
  // in a useMemo keeps the underlying Animated nodes stable across renders.
  const rows = useMemo(() => {
    const num = (a: number, b: number) =>
      t.interpolate({inputRange: [0, 1], outputRange: [a, b]});

    const color = (a: string, b: string) =>
      t.interpolate({inputRange: [0, 1], outputRange: [a, b]});

    // NOTE: percent-based interpolators (outputRange like ["0%", "50%"]) are
    // intentionally omitted. InterpolationAnimatedNode in the C++ renderer
    // doesn't parse string outputRange entries with unit suffixes (it crashes
    // on `asDouble()` for values like "50%"), so the wire-side
    // CMD_UNIT_PERCENT path can't be exercised end-to-end from this example
    // until that's fixed. See InterpolationAnimatedNode.cpp:50.

    const deg = (a: number, b: number) =>
      t.interpolate({
        inputRange: [0, 1],
        outputRange: [`${a}deg`, `${b}deg`],
      });

    const rad = (a: number, b: number) =>
      t.interpolate({
        inputRange: [0, 1],
        outputRange: [`${a}rad`, `${b}rad`],
      });

    // Top-level numeric props (decoded as CMD_OPACITY..CMD_SHADOW_RADIUS).
    const numeric = [
      {label: 'opacity', style: {opacity: num(0.2, 1)}},
      {label: 'elevation (Android)', style: {elevation: num(0, 16)}},
      {label: 'zIndex', style: {zIndex: num(0, 10)}},
      {label: 'shadowOpacity (iOS)', style: {shadowOpacity: num(0, 1)}},
      {label: 'shadowRadius (iOS)', style: {shadowRadius: num(0, 12)}},
    ];

    // Color props (decoded as CMD_BACKGROUND_COLOR..CMD_TINT_COLOR and
    // CMD_BORDER_COLOR..CMD_BORDER_END_COLOR). `color` and `tintColor` are
    // rendered separately because they need Text and Image, respectively.
    const colorRows = [
      {
        label: 'backgroundColor',
        style: {backgroundColor: color('#fda4af', '#22c55e')},
      },
      {label: 'borderColor', style: {borderColor: color('red', 'blue')}},
      {label: 'borderTopColor', style: {borderTopColor: color('red', 'blue')}},
      {
        label: 'borderBottomColor',
        style: {borderBottomColor: color('red', 'blue')},
      },
      {
        label: 'borderLeftColor',
        style: {borderLeftColor: color('red', 'blue')},
      },
      {
        label: 'borderRightColor',
        style: {borderRightColor: color('red', 'blue')},
      },
      {
        label: 'borderStartColor',
        style: {borderStartColor: color('red', 'blue')},
      },
      {label: 'borderEndColor', style: {borderEndColor: color('red', 'blue')}},
    ];

    // Border radii (decoded as CMD_BORDER_RADIUS..CMD_BORDER_END_END_RADIUS).
    // Only the px unit path is exercised here; see note above for why the
    // percent path is currently disabled.
    const r = () => num(0, 24);
    const radiusPx = [
      {label: 'borderRadius (px)', style: {borderRadius: r()}},
      {label: 'borderTopLeftRadius (px)', style: {borderTopLeftRadius: r()}},
      {label: 'borderTopRightRadius (px)', style: {borderTopRightRadius: r()}},
      {label: 'borderTopStartRadius (px)', style: {borderTopStartRadius: r()}},
      {label: 'borderTopEndRadius (px)', style: {borderTopEndRadius: r()}},
      {
        label: 'borderBottomLeftRadius (px)',
        style: {borderBottomLeftRadius: r()},
      },
      {
        label: 'borderBottomRightRadius (px)',
        style: {borderBottomRightRadius: r()},
      },
      {
        label: 'borderBottomStartRadius (px)',
        style: {borderBottomStartRadius: r()},
      },
      {
        label: 'borderBottomEndRadius (px)',
        style: {borderBottomEndRadius: r()},
      },
      {
        label: 'borderStartStartRadius (px)',
        style: {borderStartStartRadius: r()},
      },
      {
        label: 'borderStartEndRadius (px)',
        style: {borderStartEndRadius: r()},
      },
      {
        label: 'borderEndStartRadius (px)',
        style: {borderEndStartRadius: r()},
      },
      {label: 'borderEndEndRadius (px)', style: {borderEndEndRadius: r()}},
    ];

    // Transforms (decoded under CMD_START_OF_TRANSFORM). Rotations cover both
    // CMD_UNIT_DEG and CMD_UNIT_RAD; translations cover CMD_UNIT_PX. The
    // CMD_UNIT_PERCENT path for translations is currently disabled (see note
    // above).
    const transforms = [
      {label: 'translateX (px)', transform: [{translateX: num(-30, 30)}]},
      {label: 'translateY (px)', transform: [{translateY: num(-15, 15)}]},
      {label: 'scale', transform: [{scale: num(0.5, 1.5)}]},
      {label: 'scaleX', transform: [{scaleX: num(0.5, 1.5)}]},
      {label: 'scaleY', transform: [{scaleY: num(0.5, 1.5)}]},
      {label: 'rotate (deg)', transform: [{rotate: deg(0, 360)}]},
      {label: 'rotate (rad)', transform: [{rotate: rad(0, Math.PI * 2)}]},
      {label: 'rotateX (deg)', transform: [{rotateX: deg(0, 360)}]},
      {label: 'rotateY (deg)', transform: [{rotateY: deg(0, 360)}]},
      {label: 'rotateZ (deg)', transform: [{rotateZ: deg(0, 360)}]},
      {label: 'skewX (deg)', transform: [{skewX: deg(0, 30)}]},
      {label: 'skewY (deg)', transform: [{skewY: deg(0, 30)}]},
      {
        label: 'perspective + rotateY',
        transform: [{perspective: num(200, 800)}, {rotateY: deg(0, 360)}],
      },
    ];

    return {
      numeric,
      textColor: color('red', 'blue'),
      tintColor: color('red', 'blue'),
      colorRows,
      radiusPx,
      transforms,
    };
  }, [t]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <FlagIndicator />
      <SectionHeader title="Top-level numeric props" />
      {rows.numeric.map(({label, style}) => (
        <Row key={label} label={label}>
          <Animated.View style={[styles.box, styles.colored, style]} />
        </Row>
      ))}

      <SectionHeader title="Color props" />
      {rows.colorRows.map(({label, style}) => (
        <Row key={label} label={label}>
          <Animated.View style={[styles.box, styles.thickBorder, style]} />
        </Row>
      ))}
      <Row label="color (Text)">
        <Animated.Text style={[styles.text, {color: rows.textColor}]}>
          Animated text color
        </Animated.Text>
      </Row>
      <Row label="tintColor (Image)">
        <Animated.Image
          source={TINT_SOURCE}
          style={[styles.tintImage, {tintColor: rows.tintColor}]}
        />
      </Row>

      <SectionHeader title="Border radius (px)" />
      {rows.radiusPx.map(({label, style}) => (
        <Row key={label} label={label}>
          <Animated.View style={[styles.box, styles.colored, style]} />
        </Row>
      ))}

      <SectionHeader title="Transforms" />
      {rows.transforms.map(({label, transform}) => (
        <Row key={label} label={label}>
          <Animated.View style={[styles.box, styles.colored, {transform}]} />
        </Row>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 8,
  },
  section: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 70,
  },
  label: {
    width: 170,
    fontSize: 12,
    paddingRight: 8,
  },
  demo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  box: {
    width: 50,
    height: 50,
  },
  colored: {
    backgroundColor: '#3b82f6',
  },
  thickBorder: {
    borderWidth: 4,
    borderColor: 'red',
    backgroundColor: '#e5e7eb',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tintImage: {
    width: 40,
    height: 40,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  flagLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  flagValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  flagOn: {
    color: '#16a34a',
  },
  flagOff: {
    color: '#dc2626',
  },
});

export default {
  title: 'All Animated Props',
  name: 'allAnimatedProps',
  description:
    'Runs an animation per each property handled by BatchedAnimatedPropsMountItem (opacity, elevation, colors, border radii, transforms, etc.).',
  render: (): React.Node => <AllAnimatedPropsExample />,
} as RNTesterModuleExample;
