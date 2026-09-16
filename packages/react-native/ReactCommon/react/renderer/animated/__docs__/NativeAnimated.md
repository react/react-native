# Native Animated

[🏠 Home](../../../../../../../__docs__/README.md)

Native Animated is the cross-platform C++ native driver for React Native's
`Animated` API. The JavaScript library sends a graph of values, operations,
styles, and transforms through the `NativeAnimatedModule` TurboModule. Native
Animated evaluates that graph off the JavaScript thread and applies the
resulting props to views.

The main purpose of this C++ implementation is to let platforms share the graph
and driver logic instead of maintaining separate native implementations. It
integrates Native Animated with the shared
[Animation Backend](../../animationbackend/__docs__/AnimationBackend.md), which
updates layout and non-layout props through Fabric and keeps those updates
synchronized with React commits.

## 🚀 Usage

Application code uses the public JavaScript `Animated` API rather than this
package directly. A typical animation:

1. Creates and connects animated nodes.
2. Starts a time-based animation or attaches an event mapping.
3. Evaluates affected nodes each frame, applies props, and invokes the
   completion callback.

JavaScript batches graph operations with `startOperationBatch` and
`finishOperationBatch` so they are applied together on the native side.
`queueAndExecuteBatchedOperations` is specific to the legacy Android
implementation and is not implemented by this C++ module.

## 📐 Design

Native Animated maintains a directed acyclic graph. Animation drivers and native
events update value nodes, changes propagate through dependent nodes, and
`PropsAnimatedNode` collects the props to apply to a view. Dirty tracking limits
each frame to nodes affected by changed values.

### Core components

- `AnimatedModule` (`AnimatedModule.h`) implements the `NativeAnimatedModule`
  spec. It buffers graph operations from JavaScript and schedules them on the
  render thread.
- `NativeAnimatedNodesManager` (`NativeAnimatedNodesManager.h`) owns the graph,
  animation drivers, and event drivers. It evaluates updates, schedules prop
  commits, and invokes listeners and completion callbacks.
- `NativeAnimatedNodesManagerProvider` (`NativeAnimatedNodesManagerProvider.h`)
  creates one shared manager per runtime, connects it to `UIManager`, selects
  the prop-application path, and registers native event delivery.

### Animated nodes

All nodes derive from `AnimatedNode` (`nodes/AnimatedNode.h`). The main groups
are:

- `ValueAnimatedNode`, which stores the scalar values written by animations and
  events.
- Operator, interpolation, and color nodes, which derive values from other
  nodes.
- `StyleAnimatedNode`, `TransformAnimatedNode`, and `ObjectAnimatedNode`, which
  assemble structured output.
- `TrackingAnimatedNode`, which follows another value through an animation.
- `PropsAnimatedNode`, which collects output for a view or `ShadowNodeFamily`.

### Animation and event drivers

Drivers derived from `AnimationDriver` (`drivers/AnimationDriver.h`) update a
single `ValueAnimatedNode` on each frame. Native Animated supports frame-based
timing, spring, and decay drivers.

`EventAnimationDriver` (`event_drivers/EventAnimationDriver.h`) maps a path in a
native event payload, such as `contentOffset.y`, to a value node. This lets
events drive the graph without a JavaScript round trip.

### Applying props

Native Animated supports two prop-application paths:

- The default path directly updates non-layout props and uses a Fabric commit
  for layout props. `MergedValueDispatcher` coalesces updates, while
  `AnimatedMountingOverrideDelegate` prevents React commits from overwriting
  animated values.
- The shared Animation Backend path delegates per-frame mutations to the
  [Animation Backend](../../animationbackend/__docs__/AnimationBackend.md),
  which applies them and coordinates with React commits.

### Threading

The JavaScript thread only buffers TurboModule operations. Graph mutation,
driver updates, evaluation, and prop commits run on the render thread using the
platform frame callback. The manager uses locks for state shared between the two
threads.

## 🔗 Relationships

- The JavaScript `Animated` library drives Native Animated through the
  `NativeAnimatedModule` TurboModule.
- Native Animated can delegate prop application to the shared
  [Animation Backend](../../animationbackend/__docs__/AnimationBackend.md).
