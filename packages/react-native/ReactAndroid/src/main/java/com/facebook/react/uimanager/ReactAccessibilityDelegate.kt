/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.Context
import android.graphics.Rect
import android.os.Bundle
import android.os.Handler
import android.os.Message
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import android.widget.EditText
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.AccessibilityActionCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.CollectionItemInfoCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.RangeInfoCompat
import androidx.core.view.accessibility.AccessibilityNodeProviderCompat
import androidx.customview.widget.ExploreByTouchHelper
import com.facebook.infer.annotation.Assertions
import com.facebook.react.R
import com.facebook.react.bridge.Arguments.createMap
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper.getSurfaceId
import com.facebook.react.uimanager.UIManagerHelper.getUIManager
import com.facebook.react.uimanager.common.UIManagerType
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.util.ReactFindViewUtil.findView

/**
 * Utility class that handles the addition of a "role" for accessibility to either a View or
 * AccessibilityNodeInfo.
 */
public open class ReactAccessibilityDelegate( // The View this delegate is attached to
    protected val hostView: View,
    originalFocus: Boolean,
    originalImportantForAccessibility: Int,
) : ExploreByTouchHelper(hostView) {
  @Suppress("DEPRECATION") // TODO: Replace with handler tied to host view's context
  private val accessibilityEventHandler: Handler =
      object : Handler() {
        override fun handleMessage(msg: Message) {
          val host = msg.obj as View?
          host?.sendAccessibilityEvent(AccessibilityEvent.TYPE_VIEW_SELECTED)
        }
      }
  private val accessibilityActionsMap = HashMap<Int, String?>()
  private var accessibilityLabelledBy: View? = null

  init {
    // We need to reset these two properties, as ExploreByTouchHelper sets focusable to "true" and
    // importantForAccessibility to "Yes" (if it is Auto). If we don't reset these it would force
    // every element that has this delegate attached to be focusable, and not allow for
    // announcement coalescing.
    hostView.isFocusable = originalFocus
    hostView.importantForAccessibility = originalImportantForAccessibility
  }

  override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
    super.onInitializeAccessibilityNodeInfo(host, info)

    if (host.getTag(R.id.accessibility_state_expanded) != null) {
      val accessibilityStateExpanded = host.getTag(R.id.accessibility_state_expanded) as Boolean
      info.addAction(
          if (accessibilityStateExpanded) AccessibilityNodeInfoCompat.ACTION_COLLAPSE
          else AccessibilityNodeInfoCompat.ACTION_EXPAND
      )
    }
    val accessibilityRole = AccessibilityRole.fromViewTag(host)
    val accessibilityHint = host.getTag(R.id.accessibility_hint) as String?
    if (accessibilityRole != null) {
      setRole(info, accessibilityRole, host.context)
    }

    if (accessibilityHint != null) {
      info.tooltipText = accessibilityHint
    }

    val accessibilityLabelledBy = host.getTag(R.id.labelled_by)
    if (accessibilityLabelledBy != null) {
      this.accessibilityLabelledBy = findView(host.rootView, accessibilityLabelledBy as String)
      if (this.accessibilityLabelledBy != null) {
        info.setLabeledBy(this.accessibilityLabelledBy)
      }
    }

    // state is changeable.
    val accessibilityState = host.getTag(R.id.accessibility_state) as ReadableMap?
    if (accessibilityState != null) {
      setState(info, accessibilityState)
    }
    val accessibilityActions = host.getTag(R.id.accessibility_actions) as ReadableArray?

    val accessibilityCollectionItem =
        host.getTag(R.id.accessibility_collection_item) as ReadableMap?
    if (accessibilityCollectionItem != null) {
      val rowIndex = accessibilityCollectionItem.getInt("rowIndex")
      val columnIndex = accessibilityCollectionItem.getInt("columnIndex")
      val rowSpan = accessibilityCollectionItem.getInt("rowSpan")
      val columnSpan = accessibilityCollectionItem.getInt("columnSpan")
      val heading = accessibilityCollectionItem.getBoolean("heading")

      val collectionItemCompat =
          CollectionItemInfoCompat.obtain(rowIndex, rowSpan, columnIndex, columnSpan, heading)
      info.setCollectionItemInfo(collectionItemCompat)
    }

    if (accessibilityActions != null) {
      for (i in 0..<accessibilityActions.size()) {
        val action = accessibilityActions.getMap(i)
        require(!(action == null || !action.hasKey("name"))) { "Unknown accessibility action." }

        val actionName = action.getString("name")
        // AccessibilityActionCompat actionLabel must be non-null
        val actionLabel =
            if (action.hasKey("label")) Assertions.assertNotNull(action.getString("label")) else ""
        val actionId: Int =
            actionIdMap.get(actionName)
                ?: customActionIdMap.getOrPut(actionName) { customActionCounter++ }
        accessibilityActionsMap[actionId] = actionName
        val accessibilityAction = AccessibilityActionCompat(actionId, actionLabel)
        info.addAction(accessibilityAction)
      }
    }

    // Process accessibilityValue
    val accessibilityValue = host.getTag(R.id.accessibility_value) as ReadableMap?
    if (
        accessibilityValue != null &&
            accessibilityValue.hasKey("min") &&
            accessibilityValue.hasKey("now") &&
            accessibilityValue.hasKey("max")
    ) {
      val minDynamic = accessibilityValue.getDynamic("min")
      val nowDynamic = accessibilityValue.getDynamic("now")
      val maxDynamic = accessibilityValue.getDynamic("max")
      if (
          minDynamic.type == ReadableType.Number &&
              nowDynamic.type == ReadableType.Number &&
              maxDynamic.type == ReadableType.Number
      ) {
        val min = minDynamic.asInt()
        val now = nowDynamic.asInt()
        val max = maxDynamic.asInt()
        if (max > min && now >= min && max >= now) {
          info.rangeInfo =
              RangeInfoCompat.obtain(
                  RangeInfoCompat.RANGE_TYPE_INT,
                  min.toFloat(),
                  max.toFloat(),
                  now.toFloat(),
              )
        }
      }
    }

    // Expose the testID prop as the resource-id name of the view. Black-box E2E/UI testing
    // frameworks, which interact with the UI through the accessibility framework, do not have
    // access to view tags. This allows developers/testers to avoid polluting the
    // content-description with test identifiers.
    val testId = host.getTag(R.id.react_test_id) as String?
    if (testId != null) {
      info.viewIdResourceName = testId
    }
    val missingContentDescription = info.contentDescription.isNullOrEmpty()
    val missingText = info.text.isNullOrEmpty()
    val missingTextAndDescription = missingContentDescription && missingText
    val hasContentToAnnounce =
        accessibilityActions != null ||
            accessibilityState != null ||
            accessibilityLabelledBy != null ||
            accessibilityRole != null
    if (missingTextAndDescription && hasContentToAnnounce) {
      info.contentDescription = getTalkbackDescription(host, info)
    }
  }

  override fun onInitializeAccessibilityEvent(host: View, event: AccessibilityEvent) {
    super.onInitializeAccessibilityEvent(host, event)
    // Set item count and current item index on accessibility events for adjustable
    // in order to make Talkback announce the value of the adjustable
    val accessibilityValue = host.getTag(R.id.accessibility_value) as ReadableMap?
    if (
        accessibilityValue != null &&
            accessibilityValue.hasKey("min") &&
            accessibilityValue.hasKey("now") &&
            accessibilityValue.hasKey("max")
    ) {
      val minDynamic = accessibilityValue.getDynamic("min")
      val nowDynamic = accessibilityValue.getDynamic("now")
      val maxDynamic = accessibilityValue.getDynamic("max")
      if (
          minDynamic.type == ReadableType.Number &&
              nowDynamic.type == ReadableType.Number &&
              maxDynamic.type == ReadableType.Number
      ) {
        val min = minDynamic.asInt()
        val now = nowDynamic.asInt()
        val max = maxDynamic.asInt()
        if (max > min && now >= min && max >= now) {
          event.itemCount = max - min
          event.currentItemIndex = now
        }
      }
    }
  }

  override fun performAccessibilityAction(host: View, action: Int, args: Bundle?): Boolean {
    if (action == AccessibilityNodeInfoCompat.ACTION_COLLAPSE) {
      host.setTag(R.id.accessibility_state_expanded, false)
    }
    if (action == AccessibilityNodeInfoCompat.ACTION_EXPAND) {
      host.setTag(R.id.accessibility_state_expanded, true)
    }
    if (accessibilityActionsMap.containsKey(action)) {
      val eventData = createMap()
      eventData.putString("actionName", accessibilityActionsMap[action])
      val reactContext = host.context as ReactContext
      if (reactContext.hasActiveReactInstance()) {
        val reactTag = host.id
        val surfaceId = getSurfaceId(reactContext)
        val uiManager = getUIManager(reactContext, UIManagerType.FABRIC)
        if (uiManager != null) {
          uiManager.eventDispatcher.dispatchEvent(
              AccessibilityActionEvent(eventData, surfaceId, reactTag)
          )
        }
      } else {
        logSoftException(
            TAG,
            ReactNoCrashSoftException("Cannot get RCTEventEmitter, no CatalystInstance"),
        )
      }

      // In order to make Talkback announce the change of the adjustable's value,
      // schedule to send a TYPE_VIEW_SELECTED event after performing the scroll actions.
      val accessibilityRole = host.getTag(R.id.accessibility_role) as AccessibilityRole?
      val accessibilityValue = host.getTag(R.id.accessibility_value) as ReadableMap?
      if (
          accessibilityRole == AccessibilityRole.ADJUSTABLE &&
              (action == AccessibilityActionCompat.ACTION_SCROLL_FORWARD.id ||
                  (action == AccessibilityActionCompat.ACTION_SCROLL_BACKWARD.id))
      ) {
        if (accessibilityValue != null && !accessibilityValue.hasKey("text")) {
          scheduleAccessibilityEventSender(host)
        }
        return super.performAccessibilityAction(host, action, args)
      }
      return true
    }
    return super.performAccessibilityAction(host, action, args)
  }

  /**
   * Schedule a command for sending an accessibility event. Note: A command is used to ensure that
   * accessibility events are sent at most one in a given time frame to save system resources while
   * the progress changes quickly.
   */
  private fun scheduleAccessibilityEventSender(host: View) {
    if (accessibilityEventHandler.hasMessages(SEND_EVENT, host)) {
      accessibilityEventHandler.removeMessages(SEND_EVENT, host)
    }
    val msg = accessibilityEventHandler.obtainMessage(SEND_EVENT, host)
    accessibilityEventHandler.sendMessageDelayed(msg, TIMEOUT_SEND_ACCESSIBILITY_EVENT.toLong())
  }

  override fun getVirtualViewAt(x: Float, y: Float): Int {
    return INVALID_ID
  }

  override fun getVisibleVirtualViews(virtualViewIds: MutableList<Int>): Unit = Unit

  override fun onPopulateNodeForVirtualView(virtualViewId: Int, node: AccessibilityNodeInfoCompat) {
    node.contentDescription = ""
    @Suppress("DEPRECATION") // TODO: Remove this
    node.setBoundsInParent(Rect(0, 0, 1, 1))
  }

  override fun onPerformActionForVirtualView(
      virtualViewId: Int,
      action: Int,
      arguments: Bundle?,
  ): Boolean {
    return false
  }

  override fun getAccessibilityNodeProvider(host: View): AccessibilityNodeProviderCompat? {
    return null
  }

  // This exists so classes that extend this can properly call super's impl of this method while
  // still being able to override it properly for this class
  protected fun superGetAccessibilityNodeProvider(host: View): AccessibilityNodeProviderCompat? {
    return super.getAccessibilityNodeProvider(host)
  }

  /**
   * An ARIA Role representable by View's `role` prop. Ordinals should be kept in sync with
   * `facebook::react::Role`.
   */
  public enum class Role {
    ALERT,
    ALERTDIALOG,
    APPLICATION,
    ARTICLE,
    BANNER,
    BUTTON,
    CELL,
    CHECKBOX,
    COLUMNHEADER,
    COMBOBOX,
    COMPLEMENTARY,
    CONTENTINFO,
    DEFINITION,
    DIALOG,
    DIRECTORY,
    DOCUMENT,
    FEED,
    FIGURE,
    FORM,
    GRID,
    GROUP,
    HEADING,
    IMG,
    LINK,
    LIST,
    LISTITEM,
    LOG,
    MAIN,
    MARQUEE,
    MATH,
    MENU,
    MENUBAR,
    MENUITEM,
    METER,
    NAVIGATION,
    NONE,
    NOTE,
    OPTION,
    PRESENTATION,
    PROGRESSBAR,
    RADIO,
    RADIOGROUP,
    REGION,
    ROW,
    ROWGROUP,
    ROWHEADER,
    SCROLLBAR,
    SEARCHBOX,
    SEPARATOR,
    SLIDER,
    SPINBUTTON,
    STATUS,
    SUMMARY,
    SWITCH,
    TAB,
    TABLE,
    TABLIST,
    TABPANEL,
    TERM,
    TIMER,
    TOOLBAR,
    TOOLTIP,
    TREE,
    TREEGRID,
    TREEITEM;

    public companion object {
      @JvmStatic
      public fun fromValue(value: String?): Role? {
        for (role in entries) {
          if (role.name.equals(value, ignoreCase = true)) {
            return role
          }
        }
        return null
      }
    }
  }

  private class AccessibilityActionEvent(
      private val accessibilityEventData: WritableMap,
      surfaceId: Int,
      viewId: Int,
  ) : Event<AccessibilityActionEvent>(surfaceId, viewId) {
    override fun getEventName(): String {
      return TOP_ACCESSIBILITY_ACTION_EVENT
    }

    public override fun getEventData(): WritableMap? {
      return accessibilityEventData
    }
  }

  /**
   * These roles are defined by Google's TalkBack screen reader, and this list should be kept up to
   * date with their implementation. Details can be seen in their source code here:
   *
   * https://github.com/google/talkback/blob/master/utils/src/main/java/Role.java
   */
  public enum class AccessibilityRole {
    NONE,
    BUTTON,
    DROPDOWNLIST,
    TOGGLEBUTTON,
    LINK,
    SEARCH,
    IMAGE,
    IMAGEBUTTON,
    KEYBOARDKEY,
    TEXT,
    ADJUSTABLE,
    SUMMARY,
    HEADER,
    ALERT,
    CHECKBOX,
    COMBOBOX,
    MENU,
    MENUBAR,
    MENUITEM,
    PROGRESSBAR,
    RADIO,
    RADIOGROUP,
    SCROLLBAR,
    SPINBUTTON,
    SWITCH,
    TAB,
    TABLIST,
    TIMER,
    LIST,
    GRID,
    PAGER,
    SCROLLVIEW,
    HORIZONTALSCROLLVIEW,
    VIEWGROUP,
    WEBVIEW,
    DRAWERLAYOUT,
    SLIDINGDRAWER,
    ICONMENU,
    TOOLBAR;

    public companion object {
      @JvmStatic
      public fun getValue(role: AccessibilityRole): String {
        return when (role) {
          BUTTON -> "android.widget.Button"
          DROPDOWNLIST -> "android.widget.Spinner"
          TOGGLEBUTTON -> "android.widget.ToggleButton"
          SEARCH -> "android.widget.EditText"
          IMAGE -> "android.widget.ImageView"
          IMAGEBUTTON -> "android.widget.ImageButton"
          KEYBOARDKEY -> "android.inputmethodservice.Keyboard\$Key"
          TEXT -> "android.widget.TextView"
          ADJUSTABLE -> "android.widget.SeekBar"
          CHECKBOX -> "android.widget.CheckBox"
          RADIO -> "android.widget.RadioButton"
          SPINBUTTON -> "android.widget.SpinButton"
          SWITCH -> "android.widget.Switch"
          LIST -> "android.widget.AbsListView"
          GRID -> "android.widget.GridView"
          SCROLLVIEW -> "android.widget.ScrollView"
          HORIZONTALSCROLLVIEW -> "android.widget.HorizontalScrollView"
          PAGER -> "androidx.viewpager.widget.ViewPager"
          DRAWERLAYOUT -> "androidx.drawerlayout.widget.DrawerLayout"
          SLIDINGDRAWER -> "android.widget.SlidingDrawer"
          ICONMENU -> "com.android.internal.view.menu.IconMenuView"
          VIEWGROUP -> "android.view.ViewGroup"
          WEBVIEW -> "android.webkit.WebView"
          NONE,
          LINK,
          SUMMARY,
          HEADER,
          ALERT,
          COMBOBOX,
          MENU,
          MENUBAR,
          MENUITEM,
          PROGRESSBAR,
          RADIOGROUP,
          SCROLLBAR,
          TAB,
          TABLIST,
          TIMER,
          TOOLBAR -> "android.view.View"
        }
      }

      @JvmStatic
      public fun fromValue(value: String?): AccessibilityRole {
        if (value == null) {
          return NONE
        }

        for (role in entries) {
          if (role.name.equals(value, ignoreCase = true)) {
            return role
          }
        }
        throw IllegalArgumentException("Invalid accessibility role value: $value")
      }

      @JvmStatic
      public fun fromRole(role: Role): AccessibilityRole? {
        return when (role) {
          Role.ALERT -> ALERT
          Role.BUTTON -> BUTTON
          Role.CHECKBOX -> CHECKBOX
          Role.COMBOBOX -> COMBOBOX
          Role.GRID -> GRID
          Role.HEADING -> HEADER
          Role.IMG -> IMAGE
          Role.LINK -> LINK
          Role.LIST -> LIST
          Role.MENU -> MENU
          Role.MENUBAR -> MENUBAR
          Role.MENUITEM -> MENUITEM
          Role.NONE -> NONE
          Role.PROGRESSBAR -> PROGRESSBAR
          Role.RADIO -> RADIO
          Role.RADIOGROUP -> RADIOGROUP
          Role.SCROLLBAR -> SCROLLBAR
          Role.SEARCHBOX -> SEARCH
          Role.SLIDER -> ADJUSTABLE
          Role.SPINBUTTON -> SPINBUTTON
          Role.SUMMARY -> SUMMARY
          Role.SWITCH -> SWITCH
          Role.TAB -> TAB
          Role.TABLIST -> TABLIST
          Role.TIMER -> TIMER
          Role.TOOLBAR -> TOOLBAR
          else -> // No mapping from ARIA role to AccessibilityRole
          null
        }
      }

      @JvmStatic
      public fun fromViewTag(view: View): AccessibilityRole? {
        val role = view.getTag(R.id.role) as Role?
        return if (role != null) {
          fromRole(role)
        } else {
          view.getTag(R.id.accessibility_role) as AccessibilityRole?
        }
      }
    }
  }

  public companion object {
    public const val TOP_ACCESSIBILITY_ACTION_EVENT: String = "topAccessibilityAction"

    private val actionIdMap =
        mapOf<String, Int>(
            "activate" to AccessibilityActionCompat.ACTION_CLICK.id,
            "longpress" to AccessibilityActionCompat.ACTION_LONG_CLICK.id,
            "increment" to AccessibilityActionCompat.ACTION_SCROLL_FORWARD.id,
            "decrement" to AccessibilityActionCompat.ACTION_SCROLL_BACKWARD.id,
            "expand" to AccessibilityActionCompat.ACTION_EXPAND.id,
            "collapse" to AccessibilityActionCompat.ACTION_COLLAPSE.id,
        )

    private const val TAG = "ReactAccessibilityDelegate"
    private var customActionCounter = 0x3f000000
    private val customActionIdMap: MutableMap<String?, Int> = HashMap()
    private const val TIMEOUT_SEND_ACCESSIBILITY_EVENT = 200
    private const val SEND_EVENT = 1
    private const val delimiter = ", "
    private const val delimiterLength = delimiter.length

    // State constants for states which have analogs in AccessibilityNodeInfo
    private const val STATE_DISABLED = "disabled"
    private const val STATE_SELECTED = "selected"
    private const val STATE_CHECKED = "checked"

    @JvmStatic
    public fun setDelegate(
        view: View,
        originalFocus: Boolean,
        originalImportantForAccessibility: Int,
    ) {
      // if a view already has an accessibility delegate, replacing it could cause
      // problems, so leave it alone.
      if (
          !ViewCompat.hasAccessibilityDelegate(view) &&
              (view.getTag(R.id.accessibility_role) != null ||
                  view.getTag(R.id.accessibility_state) != null ||
                  view.getTag(R.id.accessibility_actions) != null ||
                  view.getTag(R.id.react_test_id) != null ||
                  view.getTag(R.id.accessibility_collection_item) != null ||
                  view.getTag(R.id.accessibility_links) != null ||
                  view.getTag(R.id.role) != null)
      ) {
        ViewCompat.setAccessibilityDelegate(
            view,
            ReactAccessibilityDelegate(view, originalFocus, originalImportantForAccessibility),
        )
      }
    }

    // Explicitly re-set the delegate, even if one has already been set.
    @JvmStatic
    public fun resetDelegate(
        view: View,
        originalFocus: Boolean,
        originalImportantForAccessibility: Int,
    ) {
      ViewCompat.setAccessibilityDelegate(
          view,
          ReactAccessibilityDelegate(view, originalFocus, originalImportantForAccessibility),
      )
    }

    private fun setState(
        info: AccessibilityNodeInfoCompat,
        accessibilityState: ReadableMap,
    ) {
      val i = accessibilityState.keySetIterator()
      while (i.hasNextKey()) {
        val state = i.nextKey()
        val value = accessibilityState.getDynamic(state)
        if (state == STATE_SELECTED && value.type == ReadableType.Boolean) {
          info.isSelected = value.asBoolean()
        } else if (state == STATE_DISABLED && value.type == ReadableType.Boolean) {
          info.isEnabled = !value.asBoolean()
        } else if (state == STATE_CHECKED && value.type == ReadableType.Boolean) {
          val boolValue = value.asBoolean()
          info.isCheckable = true
          info.isChecked = boolValue
        }
      }
    }

    // TODO: Eventually support for other languages on talkback
    @JvmStatic
    public fun setRole(
        nodeInfo: AccessibilityNodeInfoCompat,
        role: AccessibilityRole?,
        context: Context,
    ) {
      val resolvedRole = role ?: AccessibilityRole.NONE
      nodeInfo.className = AccessibilityRole.getValue(resolvedRole)
      when (resolvedRole) {
        AccessibilityRole.LINK -> {
          nodeInfo.roleDescription = context.getString(R.string.link_description)
        }
        AccessibilityRole.IMAGE -> {
          nodeInfo.roleDescription = context.getString(R.string.image_description)
        }
        AccessibilityRole.IMAGEBUTTON -> {
          nodeInfo.roleDescription = context.getString(R.string.imagebutton_description)
          nodeInfo.isClickable = true
        }
        AccessibilityRole.BUTTON -> {
          nodeInfo.isClickable = true
        }
        AccessibilityRole.TOGGLEBUTTON -> {
          nodeInfo.isClickable = true
          nodeInfo.isCheckable = true
        }
        AccessibilityRole.SUMMARY -> {
          nodeInfo.roleDescription = context.getString(R.string.summary_description)
        }
        AccessibilityRole.HEADER -> {
          nodeInfo.isHeading = true
        }
        AccessibilityRole.ALERT -> {
          nodeInfo.roleDescription = context.getString(R.string.alert_description)
        }
        AccessibilityRole.COMBOBOX -> {
          nodeInfo.roleDescription = context.getString(R.string.combobox_description)
        }
        AccessibilityRole.MENU -> {
          nodeInfo.roleDescription = context.getString(R.string.menu_description)
        }
        AccessibilityRole.MENUBAR -> {
          nodeInfo.roleDescription = context.getString(R.string.menubar_description)
        }
        AccessibilityRole.MENUITEM -> {
          nodeInfo.roleDescription = context.getString(R.string.menuitem_description)
        }
        AccessibilityRole.PROGRESSBAR -> {
          nodeInfo.roleDescription = context.getString(R.string.progressbar_description)
        }
        AccessibilityRole.RADIOGROUP -> {
          nodeInfo.roleDescription = context.getString(R.string.radiogroup_description)
        }
        AccessibilityRole.SCROLLBAR -> {
          nodeInfo.roleDescription = context.getString(R.string.scrollbar_description)
        }
        AccessibilityRole.SPINBUTTON -> {
          nodeInfo.roleDescription = context.getString(R.string.spinbutton_description)
        }
        AccessibilityRole.TAB -> {
          nodeInfo.roleDescription = context.getString(R.string.rn_tab_description)
        }
        AccessibilityRole.TABLIST -> {
          nodeInfo.roleDescription = context.getString(R.string.tablist_description)
        }
        AccessibilityRole.TIMER -> {
          nodeInfo.roleDescription = context.getString(R.string.timer_description)
        }
        AccessibilityRole.TOOLBAR -> {
          nodeInfo.roleDescription = context.getString(R.string.toolbar_description)
        }
        else -> {
          // TODO: Add support for other roles
        }
      }
    }

    /**
     * Determines if the supplied [View] and [AccessibilityNodeInfoCompat] has any children which
     * are not independently accessibility focusable and also have a spoken description.
     *
     * NOTE: Accessibility services will include these children's descriptions in the closest
     * focusable ancestor.
     *
     * @param view The [View] to evaluate
     * @param node The [AccessibilityNodeInfoCompat] to evaluate
     * @return `true` if it has any non-actionable speaking descendants within its subtree
     */
    @JvmStatic
    public fun hasNonActionableSpeakingDescendants(
        node: AccessibilityNodeInfoCompat?,
        view: View?,
    ): Boolean {
      if (node == null || view == null || (view !is ViewGroup)) {
        return false
      }

      val viewGroup = view
      var i = 0
      val count = viewGroup.childCount
      while (i < count) {
        val childView = viewGroup.getChildAt(i)

        if (childView == null) {
          i++
          continue
        }

        val childNode = AccessibilityNodeInfoCompat.obtain()
        @Suppress("DEPRECATION") // TODO: Replace with direct invocation on view
        ViewCompat.onInitializeAccessibilityNodeInfo(childView, childNode)

        if (!childNode.isVisibleToUser) {
          i++
          continue
        }

        if (isAccessibilityFocusable(childNode, childView)) {
          i++
          continue
        }

        if (isSpeakingNode(childNode, childView)) {
          return true
        }

        i++
      }

      return false
    }

    /**
     * Returns whether the node has valid RangeInfo.
     *
     * @param node The node to check.
     * @return Whether the node has valid RangeInfo.
     */
    @JvmStatic
    public fun hasValidRangeInfo(node: AccessibilityNodeInfoCompat?): Boolean {
      if (node == null) {
        return false
      }

      val rangeInfo = node.rangeInfo ?: return false

      val maxProgress = rangeInfo.max
      val minProgress = rangeInfo.min
      val currentProgress = rangeInfo.current
      val diffProgress = maxProgress - minProgress
      return (diffProgress > 0.0f) &&
          (currentProgress >= minProgress) &&
          (currentProgress <= maxProgress)
    }

    /**
     * Returns whether the specified node has state description.
     *
     * @param node The node to check.
     * @return `true` if the node has state description.
     */
    private fun hasStateDescription(node: AccessibilityNodeInfoCompat?): Boolean {
      return node != null &&
          (!node.stateDescription.isNullOrEmpty() || node.isCheckable || hasValidRangeInfo(node))
    }

    /**
     * Returns whether the supplied [View] and [AccessibilityNodeInfoCompat] would produce spoken
     * feedback if it were accessibility focused. NOTE: not all speaking nodes are focusable.
     *
     * @param view The [View] to evaluate
     * @param node The [AccessibilityNodeInfoCompat] to evaluate
     * @return `true` if it meets the criterion for producing spoken feedback
     */
    @Suppress("DEPRECATION") // TODO: Replace ViewCompat with direct invocation on view
    @JvmStatic
    public fun isSpeakingNode(node: AccessibilityNodeInfoCompat?, view: View?): Boolean {
      if (node == null || view == null) {
        return false
      }

      val important = ViewCompat.getImportantForAccessibility(view)
      if (
          important == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS ||
              (important == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO && node.childCount <= 0)
      ) {
        return false
      }

      return hasText(node) ||
          hasStateDescription(node) ||
          node.isCheckable ||
          hasNonActionableSpeakingDescendants(node, view)
    }

    @JvmStatic
    public fun hasText(node: AccessibilityNodeInfoCompat?): Boolean {
      return node != null &&
          node.collectionInfo == null &&
          (!node.text.isNullOrEmpty() ||
              !node.contentDescription.isNullOrEmpty() ||
              !node.hintText.isNullOrEmpty())
    }

    /**
     * Determines if the provided [View] and [AccessibilityNodeInfoCompat] meet the criteria for
     * gaining accessibility focus.
     *
     * Note: this is evaluating general focusability by accessibility services, and does not mean
     * this view will be guaranteed to be focused by specific services such as Talkback. For
     * Talkback focusability, see [isTalkbackFocusable(View)]
     *
     * @param view The [View] to evaluate
     * @param node The [AccessibilityNodeInfoCompat] to evaluate
     * @return `true` if it is possible to gain accessibility focus
     */
    @JvmStatic
    public fun isAccessibilityFocusable(node: AccessibilityNodeInfoCompat?, view: View?): Boolean {
      if (node == null || view == null) {
        return false
      }

      // Never focus invisible nodes.
      if (!node.isVisibleToUser) {
        return false
      }

      // Always focus "actionable" nodes.
      return node.isScreenReaderFocusable || isActionableForAccessibility(node)
    }

    /**
     * Returns whether a node is actionable. That is, the node supports one of
     * [AccessibilityNodeInfoCompat#isClickable()], [AccessibilityNodeInfoCompat#isFocusable()], or
     * [AccessibilityNodeInfoCompat#isLongClickable()].
     *
     * @param node The [AccessibilityNodeInfoCompat] to evaluate
     * @return `true` if node is actionable.
     */
    @JvmStatic
    public fun isActionableForAccessibility(node: AccessibilityNodeInfoCompat?): Boolean {
      if (node == null) {
        return false
      }

      if (node.isClickable || node.isLongClickable || node.isFocusable) {
        return true
      }

      return node.actionList.any { action ->
        action == AccessibilityActionCompat.ACTION_CLICK ||
            action == AccessibilityActionCompat.ACTION_LONG_CLICK ||
            action == AccessibilityActionCompat.ACTION_FOCUS
      }
    }

    /**
     * Returns a cached instance if such is available otherwise a new one.
     *
     * @param view The [View] to derive the AccessibilityNodeInfo properties from.
     * @return [FlipperObject] containing the properties.
     */
    @JvmStatic
    public fun createNodeInfoFromView(view: View?): AccessibilityNodeInfoCompat? {
      if (view == null) {
        return null
      }

      val nodeInfo = AccessibilityNodeInfoCompat.obtain()

      try {
        @Suppress("DEPRECATION") // TODO: Replace with direct invocation on view
        ViewCompat.onInitializeAccessibilityNodeInfo(view, nodeInfo)
      } catch (e: NullPointerException) {
        // For some unknown reason, Android seems to occasionally throw a NPE from
        // onInitializeAccessibilityNodeInfo.
        return null
      }

      return nodeInfo
    }

    /**
     * Creates the text that Google's TalkBack screen reader will read aloud for a given [View].
     * This may be any combination of the [View]'s `text`, `contentDescription`, and the `text` and
     * `contentDescription` of any ancestor [View].
     *
     * This description is generally ported over from Google's TalkBack screen reader, and this
     * should be kept up to date with their implementation (as much as necessary). Details can be
     * seen in their source code here:
     *
     * https://github.com/google/talkback/compositor/src/main/res/raw/compositor.json - search for
     * "get_description_for_tree", "append_description_for_tree", "description_for_tree_nodes"
     *
     * @param view The [View] to evaluate.
     * @param info The default [AccessibilityNodeInfoCompat].
     * @return `String` representing what talkback will say when a [View] is focused.
     */
    @JvmStatic
    public fun getTalkbackDescription(
        view: View,
        info: AccessibilityNodeInfoCompat?,
    ): CharSequence? {
      val node =
          if (info == null) createNodeInfoFromView(view)
          else AccessibilityNodeInfoCompat.obtain(info)

      if (node == null) {
        return null
      }

      val contentDescription = node.contentDescription
      val nodeText = node.text

      val hasNodeText = !nodeText.isNullOrEmpty()
      val isEditText = view is EditText

      val talkbackSegments = StringBuilder()

      // EditText's prioritize their own text content over a contentDescription so skip this
      if (!contentDescription.isNullOrEmpty() && (!isEditText || !hasNodeText)) {
        // next add content description
        talkbackSegments.append(contentDescription)
        return talkbackSegments
      }

      // TextView
      if (hasNodeText) {
        talkbackSegments.append(nodeText)
        return talkbackSegments
      }

      // If there are child views and no contentDescription the text of all non-focusable
      // children,
      // comma separated, becomes the description.
      if (view is ViewGroup) {
        val concatChildDescription = StringBuilder()
        val viewGroup = view

        var i = 0
        val count = viewGroup.childCount
        while (i < count) {
          val child = viewGroup.getChildAt(i)

          val childNodeInfo = AccessibilityNodeInfoCompat.obtain()
          @Suppress("DEPRECATION") // TODO: Replace with direct invocation on view
          ViewCompat.onInitializeAccessibilityNodeInfo(child, childNodeInfo)

          if (
              isSpeakingNode(childNodeInfo, child) &&
                  !isAccessibilityFocusable(childNodeInfo, child)
          ) {
            val childNodeDescription = getTalkbackDescription(child, null)
            if (!childNodeDescription.isNullOrEmpty()) {
              concatChildDescription.append(childNodeDescription.toString() + delimiter)
            }
          }
          i++
        }

        return removeFinalDelimiter(concatChildDescription)
      }

      return null
    }

    private fun removeFinalDelimiter(builder: StringBuilder): String {
      val end = builder.length
      if (end > 0) {
        builder.delete(end - delimiterLength, end)
      }
      return builder.toString()
    }
  }
}
