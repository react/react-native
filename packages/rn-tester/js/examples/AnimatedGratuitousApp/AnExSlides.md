<br /><br />
# React Native: Animated

ReactEurope 2015, Paris - Spencer Ahrens - Facebook

<br /><br />

## Fluid Interactions

- People expect smooth, delightful experiences
- Complex interactions are hard
- Common patterns can be optimized

<br /><br />


## Declarative Interactions

- Wire up inputs (events) to outputs (props) + transforms (springs, easing, etc.)
- Arbitrary code can define/update this config
- Config can be serialized -> native/main thread
- No refs or lifecycle to worry about

<br /><br />


## var { Animated } = require('react-native');

- New library soon to be released for React Native
- 100% JS implementation -> X-Platform
- Per-platform native optimizations planned
- This talk -> usage examples, not implementation

<br /><br />


## Gratuitous Animation Demo App

- Layout uses `flexWrap: 'wrap'`
- longPress -> drag to reorder
- Tap to open example sets

<br /><br />

## Gratuitous Animation Code

- Step 1: 2D tracking pan gesture
- Step 2: Simple pop-out spring on select
- Step 3: Animate grid reordering with `LayoutAnimation`
- Step 4: Opening animation

<br /><br />

## Animation Example Set

- `Animated.Value` `this.props.open` passed in from parent
- `interpolate` works with string "shapes," e.g. `'rgb(0, 0, 255)'`, `'45deg'`
- Examples easily composed as separate components
- Dismissing tracks interpolated gesture
- Custom release logic

<br /><br />


## Tilting Photo

- Pan -> translateX * 2, rotate, opacity (via tracking)
- Gesture release triggers separate animations
- `addListener` for async, arbitrary logic on animation progress
- `interpolate` easily creates parallax and other effects

<br /><br />

## Bobbles

- Static positions defined
- Listens to events to maybe change selection
 - Springs previous selection back
 - New selection tracks selector
- `getTranslateTransform` adds convenience

<br /><br />

## Chained

- Classic "Chat Heads" animation
- Each sticker tracks the one before it with a soft spring
- `decay` maintains gesture velocity, followed by `spring` to home
- `stopAnimation` provides the last value for `setOffset`

<br /><br />

## Scrolling

- `Animated.event` can track all sorts of stuff
- Multi-part ranges and extrapolation options
- Transforms decompose into ordered components

<br /><br />

# React Native: Animated

- Landing soon in master (days)
- GitHub: @vjeux, @sahrens
- Questions?

<br />
