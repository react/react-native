# Background images

[Home](../../../../../__docs__/README.md)

`View`'s `backgroundImage` style supports linear, radial, and conic gradients on
iOS and Android. Each background layer uses the existing `backgroundSize`,
`backgroundPosition`, and `backgroundRepeat` styles.

## Usage

Conic gradients sweep clockwise from the top of the gradient box. The default
rotation is zero degrees and the default center is `50% 50%`.

```js
const backgroundImage = 'conic-gradient(from 45deg at center, red, 25%, blue)';
```

The equivalent object form supports native colors as well as color strings:

```js
const backgroundImage = [
  {
    type: 'conic-gradient',
    from: '45deg',
    position: {left: '50%', top: '50%'},
    colorStops: [{color: 'red'}, {positions: ['25%']}, {color: 'blue'}],
  },
];
```

Angles accept `deg`, `grad`, `rad`, `turn`, or unitless zero. Color-stop
positions accept angles or percentages. A colored stop can have two positions; a
transition hint has one position and must be between colored stops. Center
offsets accept percentages and lengths, including negative values. Object
lengths are numeric layout points, while string lengths use `px`.

The conic implementation does not support `repeating-conic-gradient()` or
explicit color-interpolation methods such as `in hsl`. Stops outside the visible
zero-to-one-turn interval are not normalized for platform-independent rendering.

## Design

With `enableNativeCSSParsing` disabled, `processBackgroundImage` parses styles
in JavaScript. With it enabled, Fabric parses strings through
`CSSBackgroundImage` and objects through `BackgroundImagePropsConversions`. Both
paths convert angular stops to percentages before native rendering.

Android uses `SweepGradient`, rotated to put zero degrees at the top. iOS uses a
square `CAGradientLayer` inside a clipped container. The square preserves angles
on rectangular views; the container preserves the requested tile size. Both
renderers reuse the existing color-stop fixup and transition-hint logic.

## Relationship with other systems

- Fabric's view props hold the shared `ConicGradient` model.
- The existing background-image utilities size, position, and repeat each layer.
- RNTester's **Conic Gradient Corner Cases** example exercises geometry, stops,
  tiling, and updates without remounting.
- `View-conicGradient-itest.js` checks native prop conversion with both CSS
  parsing modes and both C++ prop-setter modes. Platform tests check native
  geometry and rendering separately.
