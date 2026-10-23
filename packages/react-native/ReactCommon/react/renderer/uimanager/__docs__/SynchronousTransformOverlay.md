# Synchronous Transform Overlay

[🏠 Home](../../../../../../../__docs__/README.md)

`SynchronousTransformOverlay` keeps the layout queries of the renderer
(`measure`, `measureInWindow`, `getBoundingClientRect`,
`UIManager::getRelativeLayoutMetrics`) in sync with views whose `transform` was
changed synchronously on the UI thread, without a ShadowTree commit. It is
enabled by the `enableSynchronousTransformOverlay` feature flag.

## 🚀 Usage

Nothing changes for application code: the layout APIs return the position of the
mounted view while it is moved by a native-driven animation (`Animated` with
`useNativeDriver`, the Animation Backend, sticky headers, third-party animation
libraries). The visible effect is that `Pressable` / `Touchable*`, which
validate a press against the rectangle they `measure()`, keep firing `onPress`
on animated views.

Animation systems that write props through the platform entry points
(`FabricUIManager.synchronouslyUpdateViewOnUIThread` on Android,
`RCTSurfacePresenter`'s `schedulerDidSynchronouslyUpdateViewOnUIThread:props:`
on iOS, `UIManager::synchronouslyUpdateViewOnUIThread` in C++) are covered
automatically. Systems that bypass them call
`UIManager::recordSynchronousTransform(tag, props)` with the props they applied,
and `UIManager::removeSynchronousTransform(tag)` when they stop managing a view.

## 📐 Design

The synchronous path exists because committing a ShadowTree revision on every
animation frame is too expensive, so non-layout props go straight to the mounted
views and the tree only catches up when the animation settles. For `transform`
that leaves the geometry of the tree, which
`LayoutableShadowNode::computeRelativeLayoutMetrics` reads through
`getTransform()`, behind what native hit-testing sees on the screen.

The overlay is a thread-safe map, owned by `UIManager`, from view tag to the
last `transform` / `transformOrigin` written synchronously, parsed with the same
conversions as ShadowNode props. It implements
`LayoutableShadowNode::TransformOverrideProvider`: when a provider is set in
`LayoutInspectingPolicy`, `computeRelativeLayoutMetrics` asks it for the
transform of every node it visits and falls back to `getTransform()`, so the
override composes with nested and committed ancestor transforms,
`transformOrigin` and percentages exactly like committed props would.
`UIManager::getTransformOverrideProvider()` returns `nullptr` unless the flag is
on and something was recorded, keeping the hot path unchanged otherwise.

Only `transform` is tracked: layout props always go through a commit, and the
other synchronously written props do not affect geometry or hit-testing.

An entry mirrors the mounted view, which keeps the latest synchronous value
across React commits (`tagToSynchronousMountProps` on Android,
`propKeysManagedByAnimated` on iOS). It lives until the writer removes it (the
Animation Backend does so after its `AnimationEndSync` commit) or the view is
deleted: once the overlay grows past a threshold,
`UIManager::shadowTreeDidCommit` walks the current revisions and drops the tags
that no longer exist; the threshold doubles after each prune so a steady set of
animated views does not trigger a walk on every commit.

## 🔗 Relationship with other systems

### Part of

- UIManager (`react/renderer/uimanager`).

### Used by this

- `LayoutableShadowNode` (`TransformOverrideProvider`,
  `LayoutInspectingPolicy`), `BaseViewProps::resolveTransform` and the view prop
  conversions, the feature flags system.

### Uses this

- The DOM layout APIs (`react/renderer/dom`, `NativeDOM`, `UIManagerBinding`)
  and `UIManager::getRelativeLayoutMetrics`; the platform mounting layers and
  the [Animation Backend](../../animationbackend/__docs__/AnimationBackend.md),
  which feed and clear it.
