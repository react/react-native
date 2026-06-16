/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.view.View
import android.view.ViewGroup
import android.view.ViewParent
import androidx.annotation.AnyThread
import androidx.annotation.UiThread
import androidx.collection.MutableIntObjectMap
import androidx.collection.SparseArrayCompat
import androidx.core.graphics.drawable.toDrawable
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.RetryableMountingLayerException
import com.facebook.react.bridge.SoftAssertions
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.fabric.events.EventEmitterWrapper
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.fabric.mounting.mountitems.MountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.touch.JSResponderHandler
import com.facebook.react.uimanager.IViewGroupManager
import com.facebook.react.uimanager.IllegalViewOperationException
import com.facebook.react.uimanager.ReactOverflowViewWithInset
import com.facebook.react.uimanager.ReactRoot
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.RootViewManager
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.events.EventCategoryDef
import com.facebook.systrace.Systrace
import java.util.ArrayDeque
import java.util.LinkedList
import java.util.Queue
import java.util.concurrent.locks.ReentrantReadWriteLock
import kotlin.concurrent.Volatile
import kotlin.concurrent.read
import kotlin.concurrent.write

/** Returns true if the collection contains [key]. */
private operator fun <T> SparseArrayCompat<T>.contains(key: Int): Boolean = containsKey(key)

/** Allows the use of the index operator for storing values in the collection. */
private operator fun <T> SparseArrayCompat<T>.set(key: Int, value: T): Unit = put(key, value)

public class SurfaceMountingManager
internal constructor(
    public val surfaceId: Int,
    jsResponderHandler: JSResponderHandler,
    viewManagerRegistry: ViewManagerRegistry,
    rootViewManager: RootViewManager,
    mountItemExecutor: MountItemExecutor,
    reactContext: ThemedReactContext,
) {
  @Volatile
  public var isStopped: Boolean = false
    private set

  @Volatile
  public var isRootViewAttached: Boolean = false
    private set

  public var context: ThemedReactContext? = reactContext
    private set

  private val tagToViewState: MutableIntObjectMap<ViewState> = MutableIntObjectMap()
  private val registryLock = ReentrantReadWriteLock()

  private val onViewAttachMountItems: Queue<MountItem> = ArrayDeque()

  // These are all non-null, until StopSurface is called
  private var jsResponderHandler: JSResponderHandler? = jsResponderHandler
  private val viewManagerRegistry: ViewManagerRegistry? = viewManagerRegistry
  @Suppress("UNCHECKED_CAST")
  private var rootViewManager: ViewManager<View, *>? = (rootViewManager as ViewManager<View, *>)
  private var mountItemExecutor: MountItemExecutor? = mountItemExecutor

  @ThreadConfined(ThreadConfined.UI)
  private val erroneouslyReaddedReactTags: MutableSet<Int> = HashSet()

  // This set is used to keep track of views that are currently being interacted with (i.e.
  // views that saw a ACTION_DOWN but not a ACTION_UP event yet). This is used to prevent
  // views from being removed while they are being interacted with as their event emitter will
  // also be removed, and `Pressables` will look "stuck".
  @ThreadConfined(ThreadConfined.UI) private val viewsWithActiveTouches: MutableSet<Int> = HashSet()

  // This set contains the views that are scheduled to be removed after their touch finishes.
  @ThreadConfined(ThreadConfined.UI)
  private val viewsToDeleteAfterTouchFinishes: MutableSet<Int> = HashSet()

  // This is null *until* StopSurface is called.
  private var tagSetForStoppedSurface: SparseArrayCompat<Any>? = null

  // This is to make sure direct manipulation result will not be overridden by React update.
  @ThreadConfined(ThreadConfined.UI)
  private val tagToSynchronousMountProps = SparseArrayCompat<MutableMap<String, Any>>()

  @AnyThread
  public fun attachRootView(rootView: View, themedReactContext: ThemedReactContext): Unit {
    this.context = themedReactContext

    if (isStopped) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException("Trying to attach root view to a stopped surface"),
      )
      return
    }

    registryLock.write {
      tagToViewState[surfaceId] = ViewState(surfaceId, rootView, rootViewManager, true)
    }

    val runnable: Runnable =
        object : GuardedRunnable(checkNotNull(context)) {
          override fun runGuarded() {
            // The CPU has ticked since `addRootView` was called, so the surface could technically
            // have already stopped here.
            if (isStopped) {
              return
            }

            if (rootView.id == surfaceId) {
              ReactSoftExceptionLogger.logSoftException(
                  TAG,
                  IllegalViewOperationException(
                      "Race condition in addRootView detected. Trying to set an id of [$surfaceId] on the RootView, but that id has already been set. "
                  ),
              )
            } else if (rootView.id != View.NO_ID) {
              FLog.e(
                  TAG,
                  "Trying to add RootTag to RootView that already has a tag: existing tag: [${rootView.id}] new tag: [$surfaceId]",
              )
              // This behavior can not be guaranteed in hybrid apps that have a native android layer
              // over which reactRootViews are added and the native views need to have ids on them
              // in order to work. Hence this can cause unnecessary crashes at runtime for hybrid
              // apps. So converting this to a soft exception such that pure react-native devs can
              // still see the warning while hybrid apps continue to run without crashes
              ReactSoftExceptionLogger.logSoftException(
                  TAG,
                  IllegalViewOperationException(
                      "Trying to add a root view with an explicit id already set. React Native uses the id field to track react tags and will overwrite this field. If that is fine, explicitly overwrite the id field to View.NO_ID before calling addRootView."
                  ),
              )
            }
            rootView.id = surfaceId

            if (rootView is ReactRoot) {
              rootView.setRootViewTag(surfaceId)
            }

            executeMountItemsOnViewAttach()

            // By doing this after `executeMountItemsOnViewAttach`, we ensure that any operations
            // scheduled while processing this queue are also added to the queue, instead of being
            // processed immediately through the queue in `MountItemDispatcher`.
            isRootViewAttached = true
          }
        }

    if (UiThreadUtil.isOnUiThread()) {
      runnable.run()
    } else {
      UiThreadUtil.runOnUiThread(runnable)
    }
  }

  public fun getViewExists(tag: Int): Boolean {
    // If Surface stopped, check if tag *was* associated with this Surface, even though it's been
    // deleted. This helps distinguish between scenarios where an invalid tag is referenced, vs
    // race conditions where an imperative method is called on a tag during/just after StopSurface.
    if (tagSetForStoppedSurface?.containsKey(tag) == true) {
      return true
    }
    return registryLock.read { tagToViewState.containsKey(tag) }
  }

  @UiThread
  @ThreadConfined(ThreadConfined.UI)
  internal fun scheduleMountItemOnViewAttach(item: MountItem): Unit {
    onViewAttachMountItems.add(item)
  }

  @UiThread
  @ThreadConfined(ThreadConfined.UI)
  private fun executeMountItemsOnViewAttach() {
    checkNotNull(mountItemExecutor).executeItems(onViewAttachMountItems)
  }

  /**
   * Stop surface and all operations within it. Garbage-collect Views (caller is responsible for
   * removing RootView from View layer).
   *
   * Delete rootView from cache. Since RN does not control the RootView, in a sense, the fragment is
   * responsible for actually removing the RootView from the hierarchy / tearing down the fragment.
   *
   * In the original version(s) of this function, we recursively went through all children of the
   * View and dropped those Views as well; ad infinitum. This was before we had a
   * SurfaceMountingManager, and all tags were in one global map. Doing this was particularly
   * important in the case of StopSurface, where race conditions between threads meant you couldn't
   * rely on DELETE instructions actually deleting all Views in the Surface.
   *
   * Now that we have SurfaceMountingManager, we can simply drop our local reference to the View.
   * Since it will be removed from the View hierarchy entirely (outside of the scope of this class),
   * garbage collection will take care of destroying it and all descendents.
   */
  @AnyThread
  public fun stopSurface(): Unit {
    FLog.e(TAG, "Stopping surface [$surfaceId]")
    if (isStopped) {
      return
    }

    // Prevent more views from being created, or the hierarchy from being manipulated at all. This
    // causes further operations to noop.
    isStopped = true

    // Reset all StateWrapper objects
    // Since this can happen on any thread, is it possible to race between StateWrapper destruction
    // and some accesses from View classes in the UI thread?
    registryLock.read {
      tagToViewState.forEachValue { viewState ->
        viewState.stateWrapper?.destroyState()
        viewState.stateWrapper = null

        viewState.eventEmitter?.destroy()
        viewState.eventEmitter = null
      }
    }

    val runnable = Runnable {
      if (ReactNativeFeatureFlags.enableViewRecycling()) {
        viewManagerRegistry?.onSurfaceStopped(surfaceId)
      }

      // Using this as a placeholder value in the map. We're using SparseArrayCompat
      // since it can efficiently represent the list of pending tags
      val tagSetForStoppedSurface =
          SparseArrayCompat<Any>().also { this.tagSetForStoppedSurface = it }

      val viewStatesToDelete: ArrayList<ViewState>
      registryLock.write {
        viewStatesToDelete = ArrayList(tagToViewState.size)
        tagToViewState.forEach { key, value ->
          tagSetForStoppedSurface[key] = this@SurfaceMountingManager
          viewStatesToDelete.add(value)
        }
        tagToViewState.clear()
      }
      for (viewState in viewStatesToDelete) {
        // We must call `onDropViewInstance` on all remaining Views
        onViewStateDeleted(viewState)
      }

      // Evict all views from cache and memory
      jsResponderHandler = null
      rootViewManager = null
      mountItemExecutor = null
      context = null
      onViewAttachMountItems.clear()
      tagToSynchronousMountProps.clear()
      FLog.e(TAG, "Surface [$surfaceId] was stopped on SurfaceMountingManager.")
    }

    if (UiThreadUtil.isOnUiThread()) {
      runnable.run()
    } else {
      UiThreadUtil.runOnUiThread(runnable)
    }
  }

  @UiThread
  public fun addViewAt(parentTag: Int, tag: Int, index: Int): Unit {
    UiThreadUtil.assertOnUiThread()
    if (isStopped) {
      return
    }

    val parentViewState = getNullableViewState(parentTag)
    if (parentViewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          ReactNoCrashSoftException("Unable to find viewState for tag: [$parentTag] for addViewAt"),
      )
      return
    }
    if (parentViewState.view !is ViewGroup) {
      val message =
          "Unable to add a view into a view that is not a ViewGroup. ParentTag: $parentTag - Tag: $tag - Index: $index"
      FLog.e(TAG, message)
      throw IllegalStateException(message)
    }
    val parentView = parentViewState.view as ViewGroup
    val viewState = getNullableViewState(tag)
    if (viewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          ReactNoCrashSoftException("Unable to find viewState for tag: [$tag] for addViewAt"),
      )
      return
    }
    val view = viewState.view
    checkNotNull(view) { "Unable to find view for viewState $viewState and tag $tag" }

    // Display children before inserting
    if (SHOW_CHANGED_VIEW_HIERARCHIES) {
      FLog.e(TAG, "addViewAt: [$tag] -> [$parentTag] idx: $index BEFORE")
      logViewHierarchy(parentView, false)
    }

    val viewParent = view.parent
    if (viewParent != null) {
      val actualParentId = if (viewParent is ViewGroup) viewParent.id else View.NO_ID
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException(
              "addViewAt: cannot insert view [$tag] into parent [$parentTag]: View already has a parent: [$actualParentId]  Parent: ${viewParent.javaClass.simpleName} View: ${view.javaClass.simpleName}"
          ),
      )

      // We've hit an error case, and `addView` will crash below
      // if we don't take evasive action (it is an error to add a View
      // to the hierarchy if it already has a parent).
      // We don't know /why/ this happens yet, but it does happen
      // very infrequently in production.
      // Thus, we do three things here:
      // (1) We logged a SoftException above, so if there's a crash later
      // on, we might have some hints about what caused it.
      // (2) We remove the View from its parent.
      // (3) In case the View was removed from the hierarchy with the
      // RemoveDeleteTree instruction, and is now being readded - which
      // should be impossible - we mark this as a "readded" View and
      // thus prevent the RemoveDeleteTree worker from deleting this
      // View in the future.
      if (viewParent is ViewGroup) {
        viewParent.removeView(view)
      }
      erroneouslyReaddedReactTags.add(tag)
    }

    try {
      getViewGroupManager(parentViewState).addView(parentView, view, index)
    } catch (e: IllegalStateException) {
      // Wrap error with more context for debugging
      throw IllegalStateException(
          ("addViewAt: failed to insert view [$tag] into parent [$parentTag] at index $index"),
          e,
      )
    } catch (e: IndexOutOfBoundsException) {
      throw IllegalStateException(
          ("addViewAt: failed to insert view [$tag] into parent [$parentTag] at index $index"),
          e,
      )
    }

    // Display children after inserting
    if (SHOW_CHANGED_VIEW_HIERARCHIES) {
      // Why are we calling `runOnUiThread`? We're already on the UI thread, right?!
      // Yes - but if you get the children of the View here and display them, *it might show you
      // the previous children*. Without getting too much into Android internals, basically if we
      // wait a tick, everything is what we expect.
      // tldr is that `parent.children == []; parent.addView(x); parent.children == []`
      // and you need to wait a tick for `parent.children == [x]`.
      UiThreadUtil.runOnUiThread {
        FLog.e(TAG, "addViewAt: [$tag] -> [$parentTag] idx: $index AFTER")
        logViewHierarchy(parentView, false)
      }
    }
  }

  @UiThread
  public fun removeViewAt(tag: Int, parentTag: Int, index: Int): Unit {
    if (isStopped) {
      return
    }

    // This is "impossible". See comments above.
    if (erroneouslyReaddedReactTags.contains(tag)) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalViewOperationException(
              "removeViewAt tried to remove a React View that was actually reused. This indicates a bug in the Differ (specifically instruction ordering). [$tag]"
          ),
      )
      return
    }

    UiThreadUtil.assertOnUiThread()
    val parentViewState = getNullableViewState(parentTag)

    // TODO: throw exception here?
    if (parentViewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          IllegalStateException("Unable to find viewState for tag: [$parentTag] for removeViewAt"),
      )
      return
    }

    val parentView = parentViewState.view
    if (parentView !is ViewGroup) {
      val message =
          "Unable to remove a view from a view that is not a ViewGroup. ParentTag: $parentTag - Tag: $tag - Index: $index"
      FLog.e(TAG, message)
      throw IllegalStateException(message)
    }

    if (SHOW_CHANGED_VIEW_HIERARCHIES) {
      // Display children before deleting any
      FLog.e(TAG, "removeViewAt: [$tag] -> [$parentTag] idx: $index BEFORE")
      logViewHierarchy(parentView, false)
    }

    val viewGroupManager = getViewGroupManager(parentViewState)

    // Verify that the view we're about to remove has the same tag we expect
    val view = viewGroupManager.getChildAt(parentView, index)
    val actualTag = view?.id ?: -1
    var actualIndex = index
    if (actualTag != tag) {
      var tagActualIndex = -1
      val parentChildrenCount = parentView.childCount
      for (i in 0..<parentChildrenCount) {
        if (parentView.getChildAt(i).id == tag) {
          tagActualIndex = i
          break
        }
      }

      // TODO T74425739: previously, we did not do this check and `removeViewAt` would be executed
      // below, sometimes crashing there. *However*, interestingly enough, `removeViewAt` would not
      // complain if you removed views from an already-empty parent. This seems necessary currently
      // for certain ViewManagers that remove their own children - like BottomSheet?
      // This workaround seems not-great, but for now, we just return here for
      // backwards-compatibility. Essentially, if a view has already been removed from the
      // hierarchy, we treat it as a noop.
      if (tagActualIndex == -1) {
        FLog.e(
            TAG,
            "removeViewAt: [$tag] -> [$parentTag] @$index: view already removed from parent! Children in parent: $parentChildrenCount",
        )
        return
      }

      // Here we are guaranteed that the view is still in the View hierarchy, just
      // at a different index. In debug mode we'll crash here; in production, we'll remove
      // the child from the parent and move on.
      // This is an issue that is safely recoverable 95% of the time. If this allows corruption
      // of the view hierarchy and causes bugs or a crash after this point, there will be logs
      // indicating that this happened.
      // This is likely *only* necessary because of Fabric's LayoutAnimations implementation.
      // If we can fix the bug there, or remove the need for LayoutAnimation index adjustment
      // entirely, we can just throw this exception without regression user experience.
      logViewHierarchy(parentView, true)
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException(
              "Tried to remove view [$tag] of parent [$parentTag] at index $index, but got view tag $actualTag - actual index of view: $tagActualIndex"
          ),
      )
      actualIndex = tagActualIndex
    }

    try {
      viewGroupManager.removeViewAt(parentView, actualIndex)
    } catch (e: RuntimeException) {
      // Note: `getChildCount` may not always be accurate!
      // We don't currently have a good explanation other than, in situations where you
      // would empirically expect to see childCount > 0, the childCount is reported as 0.
      // This is likely due to a ViewManager overriding getChildCount or some other methods
      // in a way that is strictly incorrect, but potentially only visible here.
      // The failure mode is actually that in `removeViewAt`, a NullPointerException is
      // thrown when we try to perform an operation on a View that doesn't exist, and
      // is therefore null.
      // We try to add some extra diagnostics here, but we always try to remove the View
      // from the hierarchy first because detecting by looking at childCount will not work.
      //
      // Note that the lesson here is that `getChildCount` is not /required/ to adhere to
      // any invariants. If you add 9 children to a parent, the `getChildCount` of the parent
      // may not be equal to 9. This apparently causes no issues with Android and is common
      // enough that we shouldn't try to change this invariant, without a lot of thought.
      val childCount = viewGroupManager.getChildCount(parentView)

      logViewHierarchy(parentView, true)

      throw IllegalStateException(
          "Cannot remove child at index $actualIndex from parent ViewGroup [${parentView.id}], only $childCount children in parent. Warning: childCount may be incorrect!",
          e,
      )
    }

    // Display children after deleting any
    if (SHOW_CHANGED_VIEW_HIERARCHIES) {
      UiThreadUtil.runOnUiThread {
        FLog.e(TAG, ("removeViewAt: [$tag] -> [$parentTag] idx: $actualIndex AFTER"))
        logViewHierarchy(parentView, false)
      }
    }
  }

  @UiThread
  internal fun createView(
      componentName: String,
      reactTag: Int,
      props: ReadableMap,
      stateWrapper: StateWrapper?,
      eventEmitterWrapper: EventEmitterWrapper?,
      isLayoutable: Boolean,
  ): Unit {
    if (isStopped) {
      return
    }
    // We treat this as a perf problem and not a logical error. View Preallocation or unexpected
    // changes to Differ or C++ Binding could cause some redundant Create instructions.
    // There are cases where preallocation happens and a node is recreated: if a node is
    // preallocated and then committed with revision 2+, an extra CREATE instruction will be
    // generated.
    // This represents a perf issue only, not a correctness issue. In the future we need to
    // refactor View preallocation to correct the currently incorrect assumptions.
    val viewState = getNullableViewState(reactTag)
    if (viewState?.view != null) {
      return
    }

    createViewUnsafe(
        componentName,
        reactTag,
        props,
        stateWrapper,
        eventEmitterWrapper,
        isLayoutable,
    )
  }

  /**
   * Perform view creation without any safety checks. You must ensure safety before calling this
   * method (see existing callsites).
   *
   * @param componentName
   * @param reactTag
   * @param props
   * @param stateWrapper
   * @param eventEmitterWrapper
   * @param isLayoutable
   */
  @UiThread
  private fun createViewUnsafe(
      componentName: String,
      reactTag: Int,
      props: ReadableMap,
      stateWrapper: StateWrapper?,
      eventEmitterWrapper: EventEmitterWrapper?,
      isLayoutable: Boolean,
  ): Unit {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT,
        "SurfaceMountingManager::createViewUnsafe($componentName)",
    )
    try {
      val propMap = ReactStylesDiffMap(props)
      val viewState =
          ViewState(reactTag).apply {
            this.currentProps = propMap
            this.stateWrapper = stateWrapper
            this.eventEmitter = eventEmitterWrapper
          }
      registryLock.write { tagToViewState[reactTag] = viewState }

      if (isLayoutable) {
        @Suppress("UNCHECKED_CAST")
        val viewManager = viewManagerRegistry?.get(componentName) as ViewManager<View, *>
        // View Managers are responsible for dealing with inital state and props.
        viewState.view =
            viewManager.createView(
                reactTag,
                checkNotNull(context),
                propMap,
                stateWrapper,
                jsResponderHandler,
            )
        viewState.viewManager = viewManager
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
    }
  }

  public fun storeSynchronousMountPropsOverride(reactTag: Int, props: ReadableMap): Unit {
    if (ReactNativeFeatureFlags.overrideBySynchronousMountPropsAtMountingAndroid()) {
      val propsMap = getAnimatedPropsMap(props)
      val synchronousMountProps = tagToSynchronousMountProps[reactTag] ?: mutableMapOf()
      clearAnimatedNullPropsMapKeys(props, synchronousMountProps)
      synchronousMountProps.putAll(propsMap)
      if (synchronousMountProps.isEmpty()) {
        tagToSynchronousMountProps.remove(reactTag)
      } else {
        tagToSynchronousMountProps[reactTag] = synchronousMountProps
      }
    }
  }

  public fun updatePropsSynchronously(reactTag: Int, props: ReadableMap): Unit {
    updateProps(reactTag, props, true)
  }

  public fun updateProps(reactTag: Int, props: ReadableMap): Unit {
    updateProps(reactTag, props, false)
  }

  @UiThread
  private fun updateProps(
      reactTag: Int,
      props: ReadableMap,
      shouldSkipSynchronousMountPropsOverride: Boolean,
  ) {
    if (isStopped) {
      return
    }

    val viewState = getNullableViewState(reactTag)
    if (viewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          ReactNoCrashSoftException("Unable to find viewState for tag $reactTag for updateProps"),
      )
      return
    }

    if (
        ReactNativeFeatureFlags.overrideBySynchronousMountPropsAtMountingAndroid() &&
            !shouldSkipSynchronousMountPropsOverride &&
            tagToSynchronousMountProps.containsKey(reactTag)
    ) {
      val modifiedProps = WritableNativeMap()
      modifiedProps.merge(props)
      val directPropsMap = checkNotNull(tagToSynchronousMountProps[reactTag])
      overridePropsReadableMap(directPropsMap, modifiedProps)
      viewState.currentProps = ReactStylesDiffMap(modifiedProps)
    } else {
      viewState.currentProps = ReactStylesDiffMap(props)
    }

    val view: View = viewState.view ?: return
    checkNotNull(viewState.viewManager).updateProperties(view, viewState.currentProps)
  }

  /**
   * This prefetch method is experimental, do not use it for production code. it will most likely
   * change or be removed in the future.
   *
   * @param surfaceId surface ID
   * @param componentName
   * @param params prefetch request params defined in C++
   */
  @SuppressLint("FunctionName")
  @AnyThread
  @UnstableReactNativeAPI
  public fun experimental_prefetchResources(
      surfaceId: Int,
      componentName: String,
      params: MapBuffer?,
  ): Unit {
    if (isStopped) {
      return
    }
    viewManagerRegistry
        ?.get(componentName)
        ?.experimental_prefetchResources(surfaceId, checkNotNull(context), params)
  }

  @Deprecated("")
  public fun receiveCommand(reactTag: Int, commandId: Int, commandArgs: ReadableArray?): Unit {
    if (isStopped) {
      return
    }

    val viewState =
        getNullableViewState(reactTag)
            ?: throw RetryableMountingLayerException(
                "Unable to find viewState for tag $reactTag for commandId $commandId"
            )

    // It's not uncommon for JS to send events as/after a component is being removed from the
    // view hierarchy. For example, TextInput may send a "blur" command in response to the view
    // disappearing. Throw `ReactNoCrashSoftException` so they're logged but don't crash in dev
    // for now.

    val viewManager = viewState.viewManager
    if (viewManager == null) {
      throw RetryableMountingLayerException("Unable to find viewManager for tag $reactTag")
    }

    val view = viewState.view
    if (view == null) {
      throw RetryableMountingLayerException("Unable to find viewState view for tag $reactTag")
    }

    @Suppress("DEPRECATION") viewManager.receiveCommand(view, commandId, commandArgs)
  }

  public fun receiveCommand(reactTag: Int, commandId: String, commandArgs: ReadableArray?): Unit {
    if (isStopped) {
      return
    }

    val viewState =
        getNullableViewState(reactTag)
            ?: throw RetryableMountingLayerException(
                "Unable to find viewState for tag $reactTag for commandId $commandId"
            )

    // It's not uncommon for JS to send events as/after a component is being removed from the
    // view hierarchy. For example, TextInput may send a "blur" command in response to the view
    // disappearing. Throw `ReactNoCrashSoftException` so they're logged but don't crash in dev
    // for now.

    val viewManager = viewState.viewManager
    if (viewManager == null) {
      throw RetryableMountingLayerException("Unable to find viewState manager for tag $reactTag")
    }

    val view = viewState.view
    if (view == null) {
      throw RetryableMountingLayerException("Unable to find viewState view for tag $reactTag")
    }

    viewManager.receiveCommand(view, commandId, commandArgs)
  }

  public fun sendAccessibilityEvent(reactTag: Int, eventType: Int): Unit {
    if (isStopped) {
      return
    }

    val view = getViewState(reactTag).view
    if (view == null) {
      throw RetryableMountingLayerException("Unable to find viewState view for tag $reactTag")
    }

    view.sendAccessibilityEvent(eventType)
  }

  @UiThread
  public fun updateLayout(
      reactTag: Int,
      parentTag: Int,
      x: Int,
      y: Int,
      width: Int,
      height: Int,
      displayType: Int,
      layoutDirection: Int,
  ): Unit {
    if (isStopped) {
      return
    }

    val viewState = getNullableViewState(reactTag)
    if (viewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          ReactNoCrashSoftException("Unable to find viewState for tag $reactTag for updateLayout"),
      )
      return
    }
    // Do not layout Root Views
    if (viewState.isRoot) {
      return
    }

    val viewToUpdate = viewState.view ?: return

    viewToUpdate.layoutDirection =
        when (layoutDirection) {
          1 -> View.LAYOUT_DIRECTION_LTR
          2 -> View.LAYOUT_DIRECTION_RTL
          else -> View.LAYOUT_DIRECTION_INHERIT
        }

    // Even though we have exact dimensions, we still call measure because some platform views (e.g.
    // Switch) assume that method will always be called before onLayout and onDraw. They use it to
    // calculate and cache information used in the draw pass. For most views, onMeasure can be
    // stubbed out to only call setMeasuredDimensions. For ViewGroups, onLayout should be stubbed
    // out to not recursively call layout on its children: React Native already handles doing
    // that.
    //
    // Also, note measure and layout need to be called *after* all View properties have been updated
    // because of caching and calculation that may occur in onMeasure and onLayout. Layout
    // operations should also follow the native view hierarchy and go top to bottom for
    // consistency with standard layout passes (some views may depend on this).
    viewToUpdate.measure(
        View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY),
    )

    // We update the layout of the RootView when there is a change in the layout of its child. This
    // is required to re-measure the size of the native View container (usually a FrameLayout) that
    // is configured with layout_height = WRAP_CONTENT or layout_width = WRAP_CONTENT
    //
    // This code is going to be executed ONLY when there is a change in the size of the root view
    // defined in the JS side. Changes in the layout of inner views will not trigger an update  on
    // the layout of the root view.
    val parent = viewToUpdate.parent
    if (parent is RootView) {
      parent.requestLayout()
    }

    // TODO T212247085: Make this non-nullable again after rolling out
    // disableMountItemReorderingAndroid
    val parentViewState = getNullableViewState(parentTag)
    var parentViewManager: IViewGroupManager<*>? = null
    if (parentViewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          ReactNoCrashSoftException("Unable to find viewState for tag $parentTag for updateLayout"),
      )
    } else if (parentViewState.viewManager != null) {
      parentViewManager = parentViewState.viewManager as IViewGroupManager<*>
    }
    if (parentViewManager == null || !parentViewManager.needsCustomLayoutForChildren()) {
      viewToUpdate.layout(x, y, x + width, y + height)
    }

    // displayType: 0 represents display: 'none'
    val visibility = if (displayType == 0) View.INVISIBLE else View.VISIBLE
    if (viewToUpdate.visibility != visibility) {
      viewToUpdate.visibility = visibility
    }
  }

  @UiThread
  public fun updatePadding(reactTag: Int, left: Int, top: Int, right: Int, bottom: Int): Unit {
    UiThreadUtil.assertOnUiThread()
    if (isStopped) {
      return
    }

    val viewState = getNullableViewState(reactTag)
    if (viewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          ReactNoCrashSoftException("Unable to find viewState for tag $reactTag for updatePadding"),
      )
      return
    }
    // Do not layout Root Views
    if (viewState.isRoot) {
      return
    }

    val viewToUpdate = checkNotNull(viewState.view) { "Unable to find View for tag: $reactTag" }
    val viewManager =
        checkNotNull(viewState.viewManager) { "Unable to find ViewManager for view: $viewState" }

    // noinspection unchecked
    viewManager.setPadding(viewToUpdate, left, top, right, bottom)
  }

  @UiThread
  public fun updateOverflowInset(
      reactTag: Int,
      overflowInsetLeft: Int,
      overflowInsetTop: Int,
      overflowInsetRight: Int,
      overflowInsetBottom: Int,
  ): Unit {
    if (isStopped) {
      return
    }

    val viewState = getNullableViewState(reactTag)
    if (viewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          ReactNoCrashSoftException(
              "Unable to find viewState for tag $reactTag for updateOverflowInset"
          ),
      )
      return
    }
    // Do not layout Root Views
    if (viewState.isRoot) {
      return
    }

    val viewToUpdate = viewState.view
    checkNotNull(viewToUpdate) { "Unable to find View for tag: $reactTag" }

    if (viewToUpdate is ReactOverflowViewWithInset) {
      (viewToUpdate as ReactOverflowViewWithInset).setOverflowInset(
          overflowInsetLeft,
          overflowInsetTop,
          overflowInsetRight,
          overflowInsetBottom,
      )
    }
  }

  @UiThread
  public fun updateState(reactTag: Int, stateWrapper: StateWrapper?): Unit {
    UiThreadUtil.assertOnUiThread()
    if (isStopped) {
      return
    }

    val viewState = getNullableViewState(reactTag)
    if (viewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          ReactNoCrashSoftException("Unable to find viewState for tag $reactTag for updateState"),
      )
      return
    }

    val prevStateWrapper = viewState.stateWrapper
    viewState.stateWrapper = stateWrapper

    val viewManager =
        checkNotNull(viewState.viewManager) { "Unable to find ViewManager for tag: $reactTag" }
    val view = checkNotNull(viewState.view)

    val extraData = viewManager.updateState(view, viewState.currentProps, stateWrapper)
    if (extraData != null) {
      viewManager.updateExtraData(view, extraData)
    }

    // Immediately clear native side of previous state wrapper. This causes the State object in C++
    // to be destroyed immediately instead of waiting for Java GC to kick in.
    prevStateWrapper?.destroyState()
  }

  /** We update the event emitter from the main thread when the view is mounted. */
  @UiThread
  internal fun updateEventEmitter(reactTag: Int, eventEmitter: EventEmitterWrapper): Unit {
    UiThreadUtil.assertOnUiThread()
    if (isStopped) {
      return
    }

    // TODO T62717437 - Use a flag to determine that these event emitters belong to virtual nodes
    // only.
    val viewState: ViewState = registryLock.write {
      tagToViewState.getOrPut(reactTag) { ViewState(reactTag) }
    }

    val previousEventEmitterWrapper = viewState.eventEmitter
    synchronized(viewState) {
      viewState.eventEmitter = eventEmitter
      // Invoke pending events queued to the view state
      viewState.pendingEventQueue?.forEach { it.dispatch(eventEmitter) }
      viewState.pendingEventQueue = null
    }

    // Immediately destroy native side of wrapper, instead of waiting for Java GC.
    if (previousEventEmitterWrapper != eventEmitter && previousEventEmitterWrapper != null) {
      previousEventEmitterWrapper.destroy()
    }
  }

  @UiThread
  @Synchronized
  public fun setJSResponder(
      reactTag: Int,
      initialReactTag: Int,
      blockNativeResponder: Boolean,
  ): Unit {
    UiThreadUtil.assertOnUiThread()
    if (isStopped) {
      return
    }

    val jsResponderHandler = jsResponderHandler ?: return

    if (!blockNativeResponder) {
      jsResponderHandler.setJSResponder(initialReactTag, null)
      return
    }

    val viewState = getViewState(reactTag)
    val view = viewState.view
    if (initialReactTag != reactTag && view is ViewParent) {
      // In this case, initialReactTag corresponds to a virtual/layout-only View, and we already
      // have a parent of that View in reactTag, so we can use it.
      jsResponderHandler.setJSResponder(initialReactTag, view as ViewParent)
      return
    } else if (view == null) {
      SoftAssertions.assertUnreachable("Cannot find view for tag [$reactTag].")
      return
    }

    if (viewState.isRoot) {
      SoftAssertions.assertUnreachable(
          "Cannot block native responder on [$reactTag] that is a root view"
      )
    }
    jsResponderHandler.setJSResponder(initialReactTag, view.parent)
  }

  @UiThread
  private fun onViewStateDeleted(viewState: ViewState) {
    // Destroy state immediately instead of waiting for Java GC.
    viewState.stateWrapper?.destroyState()
    viewState.stateWrapper = null

    // Destroy EventEmitterWrapper immediately instead of waiting for Java GC.
    // Notably, this is also required to ensure that the EventEmitterWrapper is deallocated
    // before the JS VM is deallocated, since it holds onto a JSI::Pointer.
    viewState.eventEmitter?.destroy()
    viewState.eventEmitter = null

    // For non-root views we notify viewmanager with [ViewManager#onDropInstance]
    val viewManager = viewState.viewManager
    if (!viewState.isRoot && viewManager != null) {
      viewManager.onDropViewInstance(checkNotNull(viewState.view))
    }
  }

  @UiThread
  public fun deleteView(reactTag: Int): Unit {
    UiThreadUtil.assertOnUiThread()
    if (isStopped) {
      return
    }

    if (
        ReactNativeFeatureFlags.overrideBySynchronousMountPropsAtMountingAndroid() &&
            tagToSynchronousMountProps.containsKey(reactTag)
    ) {
      tagToSynchronousMountProps.remove(reactTag)
    }

    val viewState = getNullableViewState(reactTag)

    if (viewState == null) {
      ReactSoftExceptionLogger.logSoftException(
          ReactSoftExceptionLogger.Categories.SURFACE_MOUNTING_MANAGER_MISSING_VIEWSTATE,
          ReactNoCrashSoftException("Unable to find viewState for tag $reactTag for deleteView"),
      )
      return
    }

    if (viewsWithActiveTouches.contains(reactTag)) {
      // If the view that went offscreen is still being touched, we can't delete it yet.
      // We have to delay the deletion till the touch is completed.
      // This is causing bugs like those otherwise:
      // - https://github.com/facebook/react-native/issues/44610
      // - https://github.com/facebook/react-native/issues/45126
      viewsToDeleteAfterTouchFinishes.add(reactTag)
    } else {
      // To delete we simply remove the tag from the registry.
      // We want to rely on the correct set of MountInstructions being sent to the platform,
      // or StopSurface being called, so we do not handle deleting descendants of the View.
      registryLock.write { tagToViewState.remove(reactTag) }

      onViewStateDeleted(viewState)
    }
  }

  @UiThread
  public fun preallocateView(
      componentName: String,
      reactTag: Int,
      props: ReadableMap,
      stateWrapper: StateWrapper?,
      isLayoutable: Boolean,
  ): Unit {
    UiThreadUtil.assertOnUiThread()

    if (isStopped) {
      return
    }
    // We treat this as a perf problem and not a logical error. View Preallocation or unexpected
    // changes to Differ or C++ Binding could cause some redundant Create instructions.
    if (getNullableViewState(reactTag) != null) {
      return
    }

    createViewUnsafe(componentName, reactTag, props, stateWrapper, null, isLayoutable)
  }

  @AnyThread
  @ThreadConfined(ThreadConfined.ANY)
  internal fun getEventEmitter(reactTag: Int): EventEmitterWrapper? {
    val viewState = getNullableViewState(reactTag)
    return viewState?.eventEmitter
  }

  @UiThread
  public fun getView(reactTag: Int): View {
    val state = getNullableViewState(reactTag)
    return state?.view
        ?: throw IllegalViewOperationException(
            "Unable to find view for tag $reactTag. Surface $surfaceId stopped: $isStopped, rootViewAttached: $isRootViewAttached"
        )
  }

  private fun getViewState(reactTag: Int): ViewState =
      getNullableViewState(reactTag)
          ?: throw RetryableMountingLayerException(
              "Unable to find viewState for tag $reactTag. Surface stopped: $isStopped"
          )

  private inline fun getNullableViewState(reactTag: Int): ViewState? = registryLock.read {
    tagToViewState[reactTag]
  }

  /** Applies a bitmap as the background of the view with the given tag, if it exists. */
  @UiThread
  public fun applyViewSnapshot(tag: Int, bitmap: Bitmap) {
    val view = getNullableViewState(tag)?.view ?: return
    view.background = bitmap.toDrawable(view.resources)
  }

  public fun printSurfaceState(): Unit {
    FLog.e(TAG, "Views created for surface $surfaceId:")
    registryLock.read {
      tagToViewState.forEachValue { viewState ->
        val viewManagerName = viewState.viewManager?.name
        val view = viewState.view
        val parent = if (view != null) view.parent as View? else null
        val parentTag = parent?.id

        FLog.e(
            TAG,
            "<$viewManagerName id=${viewState.reactTag} parentTag=$parentTag isRoot=${viewState.isRoot} />",
        )
      }
    }
  }

  @AnyThread
  internal fun dispatchEvent(
      reactTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      params: WritableMap?,
      @EventCategoryDef eventCategory: Int,
      eventTimestamp: Long,
  ) {
    val viewState = getNullableViewState(reactTag)
    if (viewState == null) {
      FLog.i(TAG, "Unable to invoke event: %s for reactTag: %d", eventName, reactTag)
      return
    }

    var emitter = viewState.eventEmitter
    if (emitter == null) {
      synchronized(viewState) {
        val emitterUnderLock = viewState.eventEmitter
        if (emitterUnderLock != null) {
          emitter = emitterUnderLock
        } else {
          // The view is pre-allocated and created. However, it hasn't been mounted yet. We will
          // have access to the event emitter later when the view is mounted. For now just save the
          // event in the view state and trigger it later.
          val queue =
              viewState.pendingEventQueue
                  ?: LinkedList<PendingViewEvent>().also { viewState.pendingEventQueue = it }
          queue.add(
              PendingViewEvent(eventName, params, eventCategory, canCoalesceEvent, eventTimestamp)
          )
          return
        }
      }
    }

    if (viewState.pendingEventQueue != null) {
      // We have an emitter and also a pending event queue - we must lock
      // and wait for the pending event queue to be cleared.
      synchronized<Unit>(viewState) {}
      assert(viewState.pendingEventQueue == null)
    }

    checkNotNull(emitter)
    if (canCoalesceEvent) {
      emitter.dispatchUnique(eventName, params, eventTimestamp)
    } else {
      emitter.dispatch(eventName, params, eventCategory, eventTimestamp)
    }
  }

  public fun markActiveTouchForTag(reactTag: Int): Unit {
    viewsWithActiveTouches.add(reactTag)
  }

  public fun sweepActiveTouchForTag(reactTag: Int): Unit {
    viewsWithActiveTouches.remove(reactTag)
    if (viewsToDeleteAfterTouchFinishes.contains(reactTag)) {
      viewsToDeleteAfterTouchFinishes.remove(reactTag)
      deleteView(reactTag)
    }
  }

  /**
   * This class holds view state for react tags. Objects of this class are stored into the
   * [mTagToViewState], and they should be updated in the same thread.
   */
  private class ViewState(
      val reactTag: Int,
      var view: View? = null,
      var viewManager: ViewManager<View, *>? = null,
      val isRoot: Boolean = false,
  ) {
    var currentProps: ReactStylesDiffMap? = null
    var stateWrapper: StateWrapper? = null
    @Volatile var eventEmitter: EventEmitterWrapper? = null
    @Volatile var pendingEventQueue: Queue<PendingViewEvent>? = null

    override fun toString(): String {
      val isLayoutOnly = viewManager == null
      return "ViewState [$reactTag] - isRoot: $isRoot - props: $currentProps - viewManager: $viewManager - isLayoutOnly: $isLayoutOnly"
    }
  }

  private class PendingViewEvent(
      private val eventName: String,
      private val params: WritableMap?,
      @field:EventCategoryDef private val eventCategory: Int,
      private val canCoalesceEvent: Boolean,
      private val eventTimestamp: Long,
  ) {
    fun dispatch(eventEmitter: EventEmitterWrapper) {
      if (canCoalesceEvent) {
        eventEmitter.dispatchUnique(eventName, params, eventTimestamp)
      } else {
        eventEmitter.dispatch(eventName, params, eventCategory, eventTimestamp)
      }
    }
  }

  private companion object {
    private val TAG: String = SurfaceMountingManager::class.java.simpleName

    private val SHOW_CHANGED_VIEW_HIERARCHIES = ReactBuildConfig.DEBUG && false
    private const val PROP_TRANSFORM = "transform"
    private const val PROP_OPACITY = "opacity"

    private fun logViewHierarchy(parent: ViewGroup, recurse: Boolean) {
      val parentTag = parent.id
      FLog.e(TAG, "  <ViewGroup tag=$parentTag class=${parent.javaClass.toString()}>")
      for (i in 0..<parent.childCount) {
        FLog.e(
            TAG,
            ("     <View idx=$i tag=${parent.getChildAt(i).id} class=${parent.getChildAt(i).javaClass.toString()}>"),
        )
      }
      FLog.e(TAG, "  </ViewGroup tag=$parentTag>")

      if (recurse) {
        FLog.e(TAG, "Displaying Ancestors:")
        var ancestor = parent.parent
        while (ancestor != null) {
          val ancestorViewGroup = if (ancestor is ViewGroup) ancestor else null
          val ancestorId = ancestorViewGroup?.id ?: View.NO_ID
          FLog.e(TAG, "<ViewParent tag=$ancestorId class=${ancestor.javaClass.toString()}>")
          ancestor = ancestor.parent
        }
      }
    }

    private fun overridePropsReadableMap(
        patchMap: Map<String, Any>,
        outputReadableMap: WritableMap,
    ) {
      for ((propKey, propValue) in patchMap) {
        if (outputReadableMap.hasKey(propKey)) {
          if (propKey == PROP_TRANSFORM) {
            val outputType = outputReadableMap.getType(propKey)
            assert(
                (outputType == ReadableType.Array || outputType == ReadableType.Null) &&
                    propValue is List<*>
            )
            val array = WritableNativeArray()
            for (item in propValue as List<*>) {
              if (item is Map<*, *>) {
                val itemMap = WritableNativeMap()
                @Suppress("UNCHECKED_CAST")
                for ((key, value) in (item as Map<String, Any>)) {
                  if (value is String) {
                    itemMap.putString(key, value)
                  } else if (value is Number) {
                    itemMap.putDouble(key, value.toDouble())
                  }
                }
                array.pushMap(itemMap)
              }
            }
            outputReadableMap.putArray(propKey, array)
          } else if (propKey == PROP_OPACITY) {
            val outputType = outputReadableMap.getType(propKey)
            assert(
                (outputType == ReadableType.Number || outputType == ReadableType.Null) &&
                    propValue is Number
            )
            outputReadableMap.putDouble(propKey, (propValue as Number).toDouble())
          }
        }
      }
    }

    private fun getAnimatedPropsMap(readableMap: ReadableMap): MutableMap<String, Any> {
      val outputMap = mutableMapOf<String, Any>()

      if (
          readableMap.hasKey(PROP_TRANSFORM) &&
              readableMap.getType(PROP_TRANSFORM) == ReadableType.Array
      ) {
        val transformArray = readableMap.getArray(PROP_TRANSFORM)
        if (transformArray != null) {
          val arrayList = ArrayList<Map<String, Any?>>(transformArray.size())
          for (i in 0..<transformArray.size()) {
            val map = transformArray.getMap(i)
            if (map != null) {
              arrayList.add(map.toHashMap())
            }
          }
          outputMap[PROP_TRANSFORM] = arrayList
        }
      }

      if (
          readableMap.hasKey(PROP_OPACITY) &&
              readableMap.getType(PROP_OPACITY) == ReadableType.Number
      ) {
        outputMap[PROP_OPACITY] = readableMap.getDouble(PROP_OPACITY)
      }

      return outputMap
    }

    private fun clearAnimatedNullPropsMapKeys(
        readableMap: ReadableMap,
        outputMap: MutableMap<String, Any>,
    ) {
      // Native Animated uses synchronous null updates to restore animated-managed props.
      // Keep this scoped to props stored by this override path today.
      if (
          readableMap.hasKey(PROP_TRANSFORM) &&
              readableMap.getType(PROP_TRANSFORM) == ReadableType.Null
      ) {
        outputMap.remove(PROP_TRANSFORM)
      }
      if (
          readableMap.hasKey(PROP_OPACITY) && readableMap.getType(PROP_OPACITY) == ReadableType.Null
      ) {
        outputMap.remove(PROP_OPACITY)
      }
    }

    // prevents unchecked conversion warn of the <ViewGroup> type
    private fun getViewGroupManager(viewState: ViewState): IViewGroupManager<View> {
      val viewManager =
          checkNotNull(viewState.viewManager) { "Unable to find ViewManager for view: $viewState" }
      @Suppress("UNCHECKED_CAST")
      return viewManager as IViewGroupManager<View>
    }
  }
}
