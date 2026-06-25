/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import androidx.annotation.AnyThread
import androidx.annotation.UiThread
import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeAnimatedModuleSpec
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ScrollEndedListener
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.bridge.buildReadableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.uimanager.GuardedFrameCallback
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import java.util.ArrayList
import java.util.Queue
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicReference
import kotlin.concurrent.Volatile

/**
 * Module that exposes interface for creating and managing animated nodes on the "native" side.
 *
 * Animated.js library is based on a concept of a graph where nodes are values or transform
 * operations (such as interpolation, addition, etc) and connection are used to describe how change
 * of the value in one node can affect other nodes.
 *
 * Few examples of the nodes that can be created on the JS side:
 * * Animated.Value is a simplest type of node with a numeric value which can be driven by an
 *   animation engine (spring, decay, etc) or by calling setValue on it directly from JS
 * * Animated.add is a type of node that may have two or more input nodes. It outputs the sum of all
 *   the input node values
 * * interpolate - is actually a method you can call on any node and it creates a new node that
 *   takes the parent node as an input and outputs its interpolated value (e.g. if you have value
 *   that can animate from 0 to 1 you can create interpolated node and set output range to be 0 to
 *   100 and when the input node changes the output of interpolated node will multiply the values
 *   by 100)
 *
 * You can mix and chain nodes however you like and this way create nodes graph with connections
 * between them.
 *
 * To map animated node values to view properties there is a special type of a node: AnimatedProps.
 * It is created by AnimatedImplementation whenever you render Animated.View and stores a mapping
 * from the view properties to the corresponding animated values (so it's actually also a node with
 * connections to the value nodes).
 *
 * Last "special" elements of the graph are "animation drivers". Those are objects (represented as a
 * graph nodes too) that based on some criteria updates attached values every frame (we have few
 * types of those, e.g., spring, timing, decay). Animation objects can be "started" and "stopped".
 * Those are like "pulse generators" for the rest of the nodes graph. Those pulses then propagate
 * along the graph to the children nodes up to the special node type: AnimatedProps which then can
 * be used to calculate property update map for a view.
 *
 * This class acts as a proxy between the "native" API that can be called from JS and the main class
 * that coordinates all the action: [NativeAnimatedNodesManager]. Since all the methods from
 * [NativeAnimatedNodesManager] need to be called from the UI thread, we we create a queue of
 * animated graph operations that is then enqueued to be executed in the UI Thread at the end of the
 * batch of JS->native calls (similarly to how it's handled in
 * [com.facebook.react.uimanager.UIManagerModule]). This isolates us from the problems that may be
 * caused by concurrent updates of animated graph while UI thread is "executing" the animation loop.
 */
@OptIn(UnstableReactNativeAPI::class)
@ReactModule(name = NativeAnimatedModuleSpec.NAME)
public class NativeAnimatedModule(reactContext: ReactApplicationContext) :
    NativeAnimatedModuleSpec(reactContext),
    LifecycleEventListener,
    UIManagerListener,
    ScrollEndedListener {

  // For `queueAndExecuteBatchedOperations`
  private enum class BatchExecutionOpCodes(value: Int) {
    OP_CODE_CREATE_ANIMATED_NODE(1),
    OP_CODE_UPDATE_ANIMATED_NODE_CONFIG(2),
    OP_CODE_GET_VALUE(3),
    OP_START_LISTENING_TO_ANIMATED_NODE_VALUE(4),
    OP_STOP_LISTENING_TO_ANIMATED_NODE_VALUE(5),
    OP_CODE_CONNECT_ANIMATED_NODES(6),
    OP_CODE_DISCONNECT_ANIMATED_NODES(7),
    OP_CODE_START_ANIMATING_NODE(8),
    OP_CODE_STOP_ANIMATION(9),
    OP_CODE_SET_ANIMATED_NODE_VALUE(10),
    OP_CODE_SET_ANIMATED_NODE_OFFSET(11),
    OP_CODE_FLATTEN_ANIMATED_NODE_OFFSET(12),
    OP_CODE_EXTRACT_ANIMATED_NODE_OFFSET(13),
    OP_CODE_CONNECT_ANIMATED_NODE_TO_VIEW(14),
    OP_CODE_DISCONNECT_ANIMATED_NODE_FROM_VIEW(15),
    OP_CODE_RESTORE_DEFAULT_VALUES(16),
    OP_CODE_DROP_ANIMATED_NODE(17),
    OP_CODE_ADD_ANIMATED_EVENT_TO_VIEW(18),
    OP_CODE_REMOVE_ANIMATED_EVENT_FROM_VIEW(19),
    OP_CODE_ADD_LISTENER(20), // ios only
    OP_CODE_REMOVE_LISTENERS(21); // ios only

    companion object {
      private var valueMap: Array<BatchExecutionOpCodes>? = null

      @JvmStatic
      fun fromId(id: Int): BatchExecutionOpCodes {
        val valueMapNonnull: Array<BatchExecutionOpCodes> =
            valueMap ?: BatchExecutionOpCodes.values()
        if (valueMap == null) {
          valueMap = valueMapNonnull
        }
        // Enum values are 1-indexed, but the value array is 0-indexed
        return valueMapNonnull[id - 1]
      }
    }
  }

  private abstract inner class UIThreadOperation {
    abstract fun execute(animatedNodesManager: NativeAnimatedNodesManager)

    var batchNumber: Long = -1
  }

  private inner class ConcurrentOperationQueue {
    private val queue: Queue<UIThreadOperation> = ConcurrentLinkedQueue()
    private var peekedOperation: UIThreadOperation? = null

    @get:AnyThread
    val isEmpty: Boolean
      get() = queue.isEmpty() && peekedOperation == null

    @AnyThread
    fun add(operation: UIThreadOperation) {
      queue.add(operation)
    }

    @UiThread
    fun executeBatch(maxBatchNumber: Long, nodesManager: NativeAnimatedNodesManager?) {
      val operations = drainQueueIntoList(maxBatchNumber)
      if (operations != null) {
        for (operation in operations) {
          operation.execute(checkNotNull(nodesManager))
        }
      }
    }

    @UiThread
    fun drainQueueIntoList(maxBatchNumber: Long): List<UIThreadOperation>? {
      if (isEmpty) {
        return null
      }

      val operations: MutableList<UIThreadOperation> = ArrayList()
      while (true) {
        // Due to a race condition, we manually "carry-over" a polled item from previous batch
        // instead of peeking the queue itself for consistency.
        // TODO(T112522554): Clean up the queue access
        val peekedOperation = peekedOperation
        if (peekedOperation != null) {
          if (peekedOperation.batchNumber > maxBatchNumber) {
            break
          }
          operations.add(peekedOperation)
          this.peekedOperation = null
        }

        val polledOperation =
            queue.poll()
                ?: // This is the same as mQueue.isEmpty()
                break

        if (polledOperation.batchNumber > maxBatchNumber) {
          // Because the operation is already retrieved from the queue, there's no way of placing it
          // back as the head element, so we remember it manually here
          this.peekedOperation = polledOperation
          break
        }
        operations.add(polledOperation)
      }

      return operations
    }
  }

  private val reactChoreographer: ReactChoreographer = ReactChoreographer.getInstance()

  private val operations = ConcurrentOperationQueue()
  private val preOperations = ConcurrentOperationQueue()

  private val nodesManagerRef = AtomicReference<NativeAnimatedNodesManager?>()

  private var batchingControlledByJS = false // TODO T71377544: delete

  @Volatile private var currentFrameNumber: Long = 0 // TODO T71377544: delete

  @Volatile private var currentBatchNumber: Long = 0

  private var initializedForFabric = false

  /**
   * This method is used to notify the JS side that the user has stopped scrolling. With natively
   * driven animation, we might have to force a resync between the Shadow Tree and the Native Tree.
   * This is because with natively driven animation, the Shadow Tree is bypassed and it can have
   * stale information on the layout of the native views. This method takes care of verifying if
   * there are some views listening to the native driven animation and it triggers the resynch.
   *
   * @param viewTag The tag of the scroll view that has stopped scrolling
   */
  public fun userDrivenScrollEnded(viewTag: Int) {
    // ask to the Node Manager for all the native nodes listening to OnScroll event
    val nodeManager = nodesManagerRef.get() ?: return

    val tags = nodeManager.getTagsOfConnectedNodes(viewTag, "topScrollEnded")

    if (tags.isEmpty()) {
      return
    }

    // emit the event to JS to resync the trees
    val onAnimationEndedData = buildReadableMap { putArray("tags") { tags.forEach { add(it) } } }

    val reactApplicationContext = reactApplicationContextIfActiveOrWarn
    reactApplicationContext?.emitDeviceEvent("onUserDrivenAnimationEnded", onAnimationEndedData)
  }

  override fun initialize() {
    super.initialize()

    reactApplicationContext.addLifecycleEventListener(this)
    reactApplicationContext.scrollEndedListeners.addListener(this)
  }

  override fun onScrollEnded(scrollView: android.view.ViewGroup) {
    userDrivenScrollEnded(scrollView.id)
  }

  override fun onHostResume() {
    enqueueFrameCallback()
  }

  private fun addOperation(operation: UIThreadOperation) {
    operation.batchNumber = currentBatchNumber
    operations.add(operation)
  }

  private fun addUnbatchedOperation(operation: UIThreadOperation) {
    operation.batchNumber = -1
    operations.add(operation)
  }

  private fun addPreOperation(operation: UIThreadOperation) {
    operation.batchNumber = currentBatchNumber
    preOperations.add(operation)
  }

  // For FabricUIManager only
  override fun didScheduleMountItems(uiManager: UIManager) {
    currentFrameNumber++
  }

  override fun willMountItems(uiManager: UIManager) {
    // noop
  }

  override fun didMountItems(uiManager: UIManager) {
    // noop
  }

  // For FabricUIManager only
  @UiThread
  override fun didDispatchMountItems(uiManager: UIManager) {
    var batchNumber = currentBatchNumber - 1

    // TODO T71377544: delete this when the JS method is confirmed safe
    if (!batchingControlledByJS) {
      // The problem we're trying to solve here: we could be in the middle of queueing
      // a batch of related animation operations when Fabric flushes a batch of MountItems.
      // It's visually bad if we execute half of the animation ops and then wait another frame
      // (or more) to execute the rest.
      // See mFrameNumber. If the dispatchedFrameNumber drifts too far - that
      // is, if no MountItems are scheduled for a while, which can happen if a tree
      // is committed but there are no changes - bring these counts back in sync and
      // execute any queued operations. This number is arbitrary, but we want it low
      // enough that the user shouldn't be able to see this delay in most cases.
      currentFrameNumber++
      if ((currentFrameNumber - currentBatchNumber) > 2) {
        currentBatchNumber = currentFrameNumber
        batchNumber = currentBatchNumber
      }
    }

    preOperations.executeBatch(batchNumber, nodesManager)
    operations.executeBatch(batchNumber, nodesManager)
  }

  // For non-FabricUIManager only (no-op since Fabric is the only supported UIManager)
  @UiThread
  override fun willDispatchViewUpdates(uiManager: UIManager) {
    // No-op: Fabric is the only supported UIManager
  }

  override fun onHostPause() {
    clearFrameCallback()
  }

  override fun onHostDestroy() {
    // Is it possible for onHostDestroy to be called without a corresponding onHostPause?
    clearFrameCallback()
  }

  @set:VisibleForTesting
  public var nodesManager: NativeAnimatedNodesManager?
    /**
     * Returns a [NativeAnimatedNodesManager], either the existing instance or a new one. Will
     * return null if and only if the [ReactApplicationContext] is also null.
     *
     * @return [NativeAnimatedNodesManager]
     */
    get() {
      if (nodesManagerRef.get() == null) {
        val reactApplicationContext = reactApplicationContextIfActiveOrWarn

        if (reactApplicationContext != null) {
          nodesManagerRef.compareAndSet(null, NativeAnimatedNodesManager(reactApplicationContext))
        }
      }

      return nodesManagerRef.get()
    }
    set(nodesManager) {
      nodesManagerRef.set(nodesManager)
    }

  private var enqueuedAnimationOnFrame = false
  private val animatedFrameCallback =
      object : GuardedFrameCallback(reactContext) {
        override fun doFrameGuarded(frameTimeNanos: Long) {
          try {
            enqueuedAnimationOnFrame = false
            val nodesManager = nodesManager ?: return
            if (nodesManager.hasActiveAnimations()) {
              nodesManager.runUpdates(frameTimeNanos)
            }

            enqueueFrameCallback()
          } catch (ex: Exception) {
            throw RuntimeException(ex)
          }
        }
      }

  private fun clearFrameCallback() {
    reactChoreographer.removeFrameCallback(
        ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
        animatedFrameCallback,
    )
    enqueuedAnimationOnFrame = false
  }

  private fun enqueueFrameCallback() {
    if (!enqueuedAnimationOnFrame) {
      reactChoreographer.postFrameCallback(
          ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
          animatedFrameCallback,
      )
      enqueuedAnimationOnFrame = true
    }
  }

  /**
   * Given a viewTag, attach an event listener to the Fabric UIManager if necessary. This is
   * expected to only be called from the native module thread, and not concurrently.
   *
   * @param viewTag
   */
  private fun initializeLifecycleEventListenersForViewTag(viewTag: Int) {
    val nodesManager = this.nodesManager
    if (nodesManager != null) {
      nodesManager.initializeEventListenerForUIManagerType(UIManagerType.FABRIC)
    } else {
      ReactSoftExceptionLogger.logSoftException(
          NAME,
          RuntimeException(
              "initializeLifecycleEventListenersForViewTag could not get NativeAnimatedNodesManager"
          ),
      )
    }

    // Subscribe to Fabric UIManager lifecycle events if we haven't yet
    if (initializedForFabric) {
      return
    }

    val reactApplicationContext = reactApplicationContextIfActiveOrWarn
    if (reactApplicationContext != null) {
      val uiManager = UIManagerHelper.getUIManager(reactApplicationContext, UIManagerType.FABRIC)
      if (uiManager != null) {
        uiManager.addUIManagerEventListener(this)
        initializedForFabric = true
      }
    }
  }

  override fun startOperationBatch() {
    batchingControlledByJS = true
    currentBatchNumber++
  }

  override fun finishOperationBatch() {
    batchingControlledByJS = false
    currentBatchNumber++
  }

  override fun createAnimatedNode(tagDouble: Double, config: ReadableMap) {
    val tag = tagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue createAnimatedNode: $tag config: ${config.toHashMap()}")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, ("execute createAnimatedNode: $tag config: ${config.toHashMap()}"))
            }
            animatedNodesManager.createAnimatedNode(tag, config)
          }
        }
    )
  }

  override fun updateAnimatedNodeConfig(tagDouble: Double, config: ReadableMap) {
    val tag = tagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue updateAnimatedNodeConfig: $tag config: ${config.toHashMap()}")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, ("execute updateAnimatedNodeConfig: $tag config: ${config.toHashMap()}"))
            }
            animatedNodesManager.updateAnimatedNodeConfig(tag, config)
          }
        }
    )
  }

  override fun startListeningToAnimatedNodeValue(tagDouble: Double) {
    val tag = tagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue startListeningToAnimatedNodeValue: $tag")
    }

    val listener = AnimatedNodeValueListener { value, offset ->
      val onAnimatedValueData = buildReadableMap {
        put("tag", tag)
        put("value", value)
        put("offset", offset)
      }

      val reactApplicationContext = reactApplicationContextIfActiveOrWarn
      reactApplicationContext?.emitDeviceEvent("onAnimatedValueUpdate", onAnimatedValueData)
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute startListeningToAnimatedNodeValue: $tag")
            }
            animatedNodesManager.startListeningToAnimatedNodeValue(tag, listener)
          }
        }
    )
  }

  override fun stopListeningToAnimatedNodeValue(tagDouble: Double) {
    val tag = tagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue stopListeningToAnimatedNodeValue: $tag")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute stopListeningToAnimatedNodeValue: $tag")
            }
            animatedNodesManager.stopListeningToAnimatedNodeValue(tag)
          }
        }
    )
  }

  override fun dropAnimatedNode(tagDouble: Double) {
    val tag = tagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue dropAnimatedNode: $tag")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute dropAnimatedNode: $tag")
            }
            animatedNodesManager.dropAnimatedNode(tag)
          }
        }
    )
  }

  override fun setAnimatedNodeValue(tagDouble: Double, value: Double) {
    val tag = tagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue setAnimatedNodeValue: $tag value: $value")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute setAnimatedNodeValue: $tag value: $value")
            }
            animatedNodesManager.setAnimatedNodeValue(tag, value)
          }
        }
    )
  }

  override fun setAnimatedNodeOffset(tagDouble: Double, value: Double) {
    val tag = tagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue setAnimatedNodeOffset: $tag offset: $value")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute setAnimatedNodeOffset: $tag offset: $value")
            }
            animatedNodesManager.setAnimatedNodeOffset(tag, value)
          }
        }
    )
  }

  override fun flattenAnimatedNodeOffset(tagDouble: Double) {
    val tag = tagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue flattenAnimatedNodeOffset: $tag")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute flattenAnimatedNodeOffset: $tag")
            }
            animatedNodesManager.flattenAnimatedNodeOffset(tag)
          }
        }
    )
  }

  override fun extractAnimatedNodeOffset(tagDouble: Double) {
    val tag = tagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue extractAnimatedNodeOffset: $tag")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute extractAnimatedNodeOffset: $tag")
            }
            animatedNodesManager.extractAnimatedNodeOffset(tag)
          }
        }
    )
  }

  override fun startAnimatingNode(
      animationIdDouble: Double,
      animatedNodeTagDouble: Double,
      animationConfig: ReadableMap,
      endCallback: Callback,
  ) {
    val animationId = animationIdDouble.toInt()
    val animatedNodeTag = animatedNodeTagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue startAnimatingNode: ID: $animationId tag: $animatedNodeTag")
    }

    addUnbatchedOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute startAnimatingNode: ID: $animationId tag: $animatedNodeTag")
            }
            animatedNodesManager.startAnimatingNode(
                animationId,
                animatedNodeTag,
                animationConfig,
                endCallback,
            )
          }
        }
    )
  }

  override fun stopAnimation(animationIdDouble: Double) {
    val animationId = animationIdDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue stopAnimation: ID: $animationId")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute stopAnimation: ID: $animationId")
            }
            animatedNodesManager.stopAnimation(animationId)
          }
        }
    )
  }

  override fun connectAnimatedNodes(parentNodeTagDouble: Double, childNodeTagDouble: Double) {
    val parentNodeTag = parentNodeTagDouble.toInt()
    val childNodeTag = childNodeTagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue connectAnimatedNodes: parent: $parentNodeTag child: $childNodeTag")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  ("execute connectAnimatedNodes: parent: $parentNodeTag child: $childNodeTag"),
              )
            }
            animatedNodesManager.connectAnimatedNodes(parentNodeTag, childNodeTag)
          }
        }
    )
  }

  override fun disconnectAnimatedNodes(parentNodeTagDouble: Double, childNodeTagDouble: Double) {
    val parentNodeTag = parentNodeTagDouble.toInt()
    val childNodeTag = childNodeTagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue disconnectAnimatedNodes: parent: $parentNodeTag child: $childNodeTag")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  ("execute disconnectAnimatedNodes: parent: $parentNodeTag child: $childNodeTag"),
              )
            }
            animatedNodesManager.disconnectAnimatedNodes(parentNodeTag, childNodeTag)
          }
        }
    )
  }

  override fun connectAnimatedNodeToView(animatedNodeTagDouble: Double, viewTagDouble: Double) {
    val animatedNodeTag = animatedNodeTagDouble.toInt()
    val viewTag = viewTagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME,
          ("queue connectAnimatedNodeToView: animatedNodeTag: $animatedNodeTag viewTag: $viewTag"),
      )
    }

    initializeLifecycleEventListenersForViewTag(viewTag)

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  ("execute connectAnimatedNodeToView: animatedNodeTag: $animatedNodeTag viewTag: $viewTag"),
              )
            }
            animatedNodesManager.connectAnimatedNodeToView(animatedNodeTag, viewTag)
          }
        }
    )
  }

  override fun disconnectAnimatedNodeFromView(
      animatedNodeTagDouble: Double,
      viewTagDouble: Double,
  ) {
    val animatedNodeTag = animatedNodeTagDouble.toInt()
    val viewTag = viewTagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue disconnectAnimatedNodeFromView: $animatedNodeTag viewTag: $viewTag")
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  ("execute disconnectAnimatedNodeFromView: $animatedNodeTag viewTag: $viewTag"),
              )
            }
            animatedNodesManager.disconnectAnimatedNodeFromView(animatedNodeTag, viewTag)
          }
        }
    )
  }

  override fun restoreDefaultValues(animatedNodeTagDouble: Double) {
    val animatedNodeTag = animatedNodeTagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(NAME, "queue restoreDefaultValues: $animatedNodeTag")
    }

    addPreOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(NAME, "execute restoreDefaultValues: $animatedNodeTag")
            }
            animatedNodesManager.restoreDefaultValues(animatedNodeTag)
          }
        }
    )
  }

  override fun addAnimatedEventToView(
      viewTagDouble: Double,
      eventName: String,
      eventMapping: ReadableMap,
  ) {
    val viewTag = viewTagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME,
          ("queue addAnimatedEventToView: $viewTag eventName: $eventName eventMapping: ${eventMapping.toHashMap()}"),
      )
    }

    initializeLifecycleEventListenersForViewTag(viewTag)

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  ("execute addAnimatedEventToView: $viewTag eventName: $eventName eventMapping: ${eventMapping.toHashMap()}"),
              )
            }
            animatedNodesManager.addAnimatedEventToView(viewTag, eventName, eventMapping)
          }
        }
    )
  }

  override fun removeAnimatedEventFromView(
      viewTagDouble: Double,
      eventName: String,
      animatedValueTagDouble: Double,
  ) {
    val viewTag = viewTagDouble.toInt()
    val animatedValueTag = animatedValueTagDouble.toInt()
    if (ANIMATED_MODULE_DEBUG) {
      FLog.d(
          NAME,
          ("queue removeAnimatedEventFromView: viewTag: $viewTag eventName: $eventName animatedValueTag: $animatedValueTag"),
      )
    }

    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            if (ANIMATED_MODULE_DEBUG) {
              FLog.d(
                  NAME,
                  ("execute removeAnimatedEventFromView: viewTag: $viewTag eventName: $eventName animatedValueTag: $animatedValueTag"),
              )
            }
            animatedNodesManager.removeAnimatedEventFromView(viewTag, eventName, animatedValueTag)
          }
        }
    )
  }

  override fun addListener(eventName: String) {
    // iOS only
  }

  override fun removeListeners(count: Double) {
    // iOS only
  }

  override fun getValue(animatedValueNodeTagDouble: Double, callback: Callback) {
    val animatedValueNodeTag = animatedValueNodeTagDouble.toInt()
    addOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            animatedNodesManager.getValue(animatedValueNodeTag, callback)
          }
        }
    )
  }

  override fun invalidate() {
    super.invalidate()

    reactApplicationContext.scrollEndedListeners.removeListener(this)
    reactApplicationContext.removeLifecycleEventListener(this)
  }

  /**
   * This is a currently-experimental method that allows JS to queue and immediately execute many
   * instructions at once. Since we make 1 JNI/JSI call instead of N, this should significantly
   * improve performance.
   *
   * The arguments operate as a byte buffer. All integer command IDs and any args are packed into
   * opsAndArgs.
   *
   * For the getValue callback: since this is batched, we accumulate a list of all requested values,
   * in order, and call the callback once at the end (if present) with the list of requested values.
   */
  override fun queueAndExecuteBatchedOperations(opsAndArgs: ReadableArray) {
    val opBufferSize = opsAndArgs.size()

    if (ANIMATED_MODULE_DEBUG) {
      FLog.e(NAME, "queueAndExecuteBatchedOperations: opBufferSize: $opBufferSize")
    }

    // This block of code is unfortunate and should be refactored - we just want to
    // extract the ViewTags in the ReadableArray to mark animations on views as being enabled.
    // We only do this for initializing animations on views - disabling animations on views
    // happens later, when the disconnect/stop operations are actually executed.
    var i = 0
    while (i < opBufferSize) {
      val command = BatchExecutionOpCodes.fromId(opsAndArgs.getInt(i++))
      when (command) {
        BatchExecutionOpCodes.OP_CODE_GET_VALUE,
        BatchExecutionOpCodes.OP_START_LISTENING_TO_ANIMATED_NODE_VALUE,
        BatchExecutionOpCodes.OP_STOP_LISTENING_TO_ANIMATED_NODE_VALUE,
        BatchExecutionOpCodes.OP_CODE_STOP_ANIMATION,
        BatchExecutionOpCodes.OP_CODE_FLATTEN_ANIMATED_NODE_OFFSET,
        BatchExecutionOpCodes.OP_CODE_EXTRACT_ANIMATED_NODE_OFFSET,
        BatchExecutionOpCodes.OP_CODE_RESTORE_DEFAULT_VALUES,
        BatchExecutionOpCodes.OP_CODE_DROP_ANIMATED_NODE,
        BatchExecutionOpCodes.OP_CODE_ADD_LISTENER,
        BatchExecutionOpCodes.OP_CODE_REMOVE_LISTENERS -> i++
        BatchExecutionOpCodes.OP_CODE_CREATE_ANIMATED_NODE,
        BatchExecutionOpCodes.OP_CODE_UPDATE_ANIMATED_NODE_CONFIG,
        BatchExecutionOpCodes.OP_CODE_CONNECT_ANIMATED_NODES,
        BatchExecutionOpCodes.OP_CODE_DISCONNECT_ANIMATED_NODES,
        BatchExecutionOpCodes.OP_CODE_SET_ANIMATED_NODE_VALUE,
        BatchExecutionOpCodes.OP_CODE_SET_ANIMATED_NODE_OFFSET,
        BatchExecutionOpCodes.OP_CODE_DISCONNECT_ANIMATED_NODE_FROM_VIEW -> i += 2
        BatchExecutionOpCodes.OP_CODE_START_ANIMATING_NODE,
        BatchExecutionOpCodes.OP_CODE_REMOVE_ANIMATED_EVENT_FROM_VIEW -> i += 3
        BatchExecutionOpCodes.OP_CODE_CONNECT_ANIMATED_NODE_TO_VIEW -> {
          i++ // tag
          initializeLifecycleEventListenersForViewTag(opsAndArgs.getInt(i++)) // viewTag
        }

        BatchExecutionOpCodes.OP_CODE_ADD_ANIMATED_EVENT_TO_VIEW -> {
          initializeLifecycleEventListenersForViewTag(opsAndArgs.getInt(i++)) // viewTag
          i++ // eventName
          i++ // eventMapping
        }
      }
    }

    // Batching happens inside this operation - so signal to the thread loop that
    // this operation should be executed as soon as possible, "unbatched" with other
    // UIThreadOperations
    startOperationBatch()
    addUnbatchedOperation(
        object : UIThreadOperation() {
          override fun execute(animatedNodesManager: NativeAnimatedNodesManager) {
            val reactApplicationContext = reactApplicationContextIfActiveOrWarn

            var viewTag = -1
            var i = 0
            while (i < opBufferSize) {
              val command = BatchExecutionOpCodes.fromId(opsAndArgs.getInt(i++))

              when (command) {
                BatchExecutionOpCodes.OP_CODE_CREATE_ANIMATED_NODE ->
                    animatedNodesManager.createAnimatedNode(
                        opsAndArgs.getInt(i++),
                        checkNotNull(opsAndArgs.getMap(i++)),
                    )

                BatchExecutionOpCodes.OP_CODE_UPDATE_ANIMATED_NODE_CONFIG ->
                    animatedNodesManager.updateAnimatedNodeConfig(
                        opsAndArgs.getInt(i++),
                        checkNotNull(opsAndArgs.getMap(i++)),
                    )

                BatchExecutionOpCodes.OP_CODE_GET_VALUE ->
                    animatedNodesManager.getValue(opsAndArgs.getInt(i++), null)

                BatchExecutionOpCodes.OP_START_LISTENING_TO_ANIMATED_NODE_VALUE -> {
                  val tag = opsAndArgs.getInt(i++)
                  val listener = AnimatedNodeValueListener { value, offset ->
                    val onAnimatedValueData = buildReadableMap {
                      put("tag", tag)
                      put("value", value)
                      put("offset", offset)
                    }

                    val reactApplicationContext = reactApplicationContextIfActiveOrWarn
                    reactApplicationContext?.emitDeviceEvent(
                        "onAnimatedValueUpdate",
                        onAnimatedValueData,
                    )
                  }
                  animatedNodesManager.startListeningToAnimatedNodeValue(tag, listener)
                }

                BatchExecutionOpCodes.OP_STOP_LISTENING_TO_ANIMATED_NODE_VALUE ->
                    animatedNodesManager.stopListeningToAnimatedNodeValue(opsAndArgs.getInt(i++))

                BatchExecutionOpCodes.OP_CODE_CONNECT_ANIMATED_NODES ->
                    animatedNodesManager.connectAnimatedNodes(
                        opsAndArgs.getInt(i++),
                        opsAndArgs.getInt(i++),
                    )

                BatchExecutionOpCodes.OP_CODE_DISCONNECT_ANIMATED_NODES ->
                    animatedNodesManager.disconnectAnimatedNodes(
                        opsAndArgs.getInt(i++),
                        opsAndArgs.getInt(i++),
                    )

                BatchExecutionOpCodes.OP_CODE_START_ANIMATING_NODE ->
                    animatedNodesManager.startAnimatingNode(
                        opsAndArgs.getInt(i++),
                        opsAndArgs.getInt(i++),
                        checkNotNull(opsAndArgs.getMap(i++)),
                        null,
                    )

                BatchExecutionOpCodes.OP_CODE_STOP_ANIMATION ->
                    animatedNodesManager.stopAnimation(opsAndArgs.getInt(i++))

                BatchExecutionOpCodes.OP_CODE_SET_ANIMATED_NODE_VALUE ->
                    animatedNodesManager.setAnimatedNodeValue(
                        opsAndArgs.getInt(i++),
                        opsAndArgs.getDouble(i++),
                    )

                BatchExecutionOpCodes.OP_CODE_SET_ANIMATED_NODE_OFFSET ->
                    animatedNodesManager.setAnimatedNodeOffset(
                        opsAndArgs.getInt(i++),
                        opsAndArgs.getDouble(i++),
                    )

                BatchExecutionOpCodes.OP_CODE_FLATTEN_ANIMATED_NODE_OFFSET ->
                    animatedNodesManager.flattenAnimatedNodeOffset(opsAndArgs.getInt(i++))

                BatchExecutionOpCodes.OP_CODE_EXTRACT_ANIMATED_NODE_OFFSET ->
                    animatedNodesManager.extractAnimatedNodeOffset(opsAndArgs.getInt(i++))

                BatchExecutionOpCodes.OP_CODE_CONNECT_ANIMATED_NODE_TO_VIEW ->
                    animatedNodesManager.connectAnimatedNodeToView(
                        opsAndArgs.getInt(i++),
                        opsAndArgs.getInt(i++),
                    )

                BatchExecutionOpCodes.OP_CODE_DISCONNECT_ANIMATED_NODE_FROM_VIEW -> {
                  val animatedNodeTag = opsAndArgs.getInt(i++)
                  viewTag = opsAndArgs.getInt(i++)
                  animatedNodesManager.disconnectAnimatedNodeFromView(animatedNodeTag, viewTag)
                }

                BatchExecutionOpCodes.OP_CODE_RESTORE_DEFAULT_VALUES ->
                    animatedNodesManager.restoreDefaultValues(opsAndArgs.getInt(i++))

                BatchExecutionOpCodes.OP_CODE_DROP_ANIMATED_NODE ->
                    animatedNodesManager.dropAnimatedNode(opsAndArgs.getInt(i++))

                BatchExecutionOpCodes.OP_CODE_ADD_ANIMATED_EVENT_TO_VIEW ->
                    animatedNodesManager.addAnimatedEventToView(
                        opsAndArgs.getInt(i++),
                        checkNotNull(opsAndArgs.getString(i++)),
                        checkNotNull(opsAndArgs.getMap(i++)),
                    )

                BatchExecutionOpCodes.OP_CODE_REMOVE_ANIMATED_EVENT_FROM_VIEW -> {
                  viewTag = opsAndArgs.getInt(i++)
                  animatedNodesManager.removeAnimatedEventFromView(
                      viewTag,
                      checkNotNull(opsAndArgs.getString(i++)),
                      opsAndArgs.getInt(i++),
                  )
                }

                BatchExecutionOpCodes.OP_CODE_ADD_LISTENER,
                BatchExecutionOpCodes.OP_CODE_REMOVE_LISTENERS -> i++
              }
            }
          }
        }
    )
    finishOperationBatch()
  }

  public companion object {
    public const val NAME: String = NativeAnimatedModuleSpec.NAME

    public const val ANIMATED_MODULE_DEBUG: Boolean = false
  }
}
