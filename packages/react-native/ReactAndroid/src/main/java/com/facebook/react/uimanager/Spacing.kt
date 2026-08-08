/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.uimanager.FloatUtil.floatsEqual
import com.facebook.yoga.YogaConstants

/**
 * Class representing CSS spacing (padding, margin, and borders). This is mostly necessary to
 * properly implement interactions and updates for properties like margin, marginLeft, and
 * marginHorizontal.
 */
public class Spacing(private val defaultValue: Float, private val spacing: FloatArray) {
  private var valueFlags = 0
  private var hasAliasesSet = false

  public constructor() : this(0f, newFullSpacingArray())

  public constructor(defaultValue: Float) : this(defaultValue, newFullSpacingArray())

  /**
   * Copy constructor.
   *
   * @param original the original [Spacing] to copy
   */
  public constructor(original: Spacing) : this(original.defaultValue, original.spacing.copyOf()) {
    valueFlags = original.valueFlags
    hasAliasesSet = original.hasAliasesSet
  }

  /**
   * Set a spacing value.
   *
   * @param spacingType one of [LEFT], [TOP], [RIGHT], [BOTTOM], [VERTICAL], [HORIZONTAL], [ALL]
   * @param value the value for this direction
   * @return `true` if the spacing has changed, or `false` if the same value was already set
   */
  public operator fun set(spacingType: Int, value: Float): Boolean {
    if (!floatsEqual(spacing[spacingType], value)) {
      spacing[spacingType] = value
      valueFlags =
          if (YogaConstants.isUndefined(value)) {
            valueFlags and flagsMap[spacingType].inv()
          } else {
            valueFlags or flagsMap[spacingType]
          }
      hasAliasesSet =
          valueFlags and flagsMap[ALL] != 0 ||
              valueFlags and flagsMap[VERTICAL] != 0 ||
              valueFlags and flagsMap[HORIZONTAL] != 0 ||
              valueFlags and flagsMap[BLOCK] != 0
      return true
    }
    return false
  }

  /**
   * Get the spacing for a direction. This takes into account any default values that have been set.
   *
   * @param spacingType one of [LEFT], [TOP], [RIGHT], [BOTTOM]
   */
  public operator fun get(spacingType: Int): Float {
    val defaultVal =
        if (
            spacingType == START ||
                spacingType == END ||
                spacingType == BLOCK ||
                spacingType == BLOCK_END ||
                spacingType == BLOCK_START
        ) {
          YogaConstants.UNDEFINED
        } else {
          defaultValue
        }
    if (valueFlags == 0) {
      return defaultVal
    }
    if ((valueFlags and flagsMap[spacingType]) != 0) {
      return spacing[spacingType]
    }
    if (hasAliasesSet) {
      val secondType = if (spacingType == TOP || spacingType == BOTTOM) VERTICAL else HORIZONTAL
      if (valueFlags and flagsMap[secondType] != 0) {
        return spacing[secondType]
      } else if (valueFlags and flagsMap[ALL] != 0) {
        return spacing[ALL]
      }
    }
    return defaultVal
  }

  /**
   * Get the raw value (that was set using [set]), without taking into account any default values.
   *
   * @param spacingType one of [LEFT], [TOP], [RIGHT], [BOTTOM], [ ][VERTICAL], [HORIZONTAL], [ALL]
   */
  public fun getRaw(spacingType: Int): Float = spacing[spacingType]

  /**
   * Resets the spacing instance to its default state. This method is meant to be used when
   * recycling [Spacing] instances.
   */
  public fun reset() {
    spacing.fill(YogaConstants.UNDEFINED)
    hasAliasesSet = false
    valueFlags = 0
  }

  /**
   * Try to get start value and fallback to given type if not defined. This is used privately by the
   * layout engine as a more efficient way to fetch direction-aware values by avoid extra method
   * invocations.
   */
  public fun getWithFallback(spacingType: Int, fallbackType: Int): Float {
    return if (valueFlags and flagsMap[spacingType] != 0) {
      spacing[spacingType]
    } else {
      get(fallbackType)
    }
  }

  public companion object {
    /** Spacing type that represents the left direction. E.g. `marginLeft`. */
    public const val LEFT: Int = 0

    /** Spacing type that represents the top direction. E.g. `marginTop`. */
    public const val TOP: Int = 1

    /** Spacing type that represents the right direction. E.g. `marginRight`. */
    public const val RIGHT: Int = 2

    /** Spacing type that represents the bottom direction. E.g. `marginBottom`. */
    public const val BOTTOM: Int = 3

    /**
     * Spacing type that represents start direction e.g. left in left-to-right, right in
     * right-to-left.
     */
    public const val START: Int = 4

    /**
     * Spacing type that represents end direction e.g. right in left-to-right, left in
     * right-to-left.
     */
    public const val END: Int = 5

    /**
     * Spacing type that represents horizontal direction (left and right). E.g. `marginHorizontal`.
     */
    public const val HORIZONTAL: Int = 6

    /** Spacing type that represents vertical direction (top and bottom). E.g. `marginVertical`. */
    public const val VERTICAL: Int = 7

    /** Spacing type that represents all directions (left, top, right, bottom). E.g. `margin`. */
    public const val ALL: Int = 8

    /** Spacing type that represents block directions (top, bottom). E.g. `marginBlock`. */
    public const val BLOCK: Int = 9

    /** Spacing type that represents the block end direction (bottom). E.g. `marginBlockEnd`. */
    public const val BLOCK_END: Int = 10

    /** Spacing type that represents the block start direction (top). E.g. `marginBlockStart`. */
    public const val BLOCK_START: Int = 11

    private val flagsMap =
        intArrayOf(
            1, /*LEFT*/
            2, /*TOP*/
            4, /*RIGHT*/
            8, /*BOTTOM*/
            16, /*START*/
            32, /*END*/
            64, /*HORIZONTAL*/
            128, /*VERTICAL*/
            256, /*ALL*/
            512, /*BLOCK*/
            1024, /*BLOCK_END*/
            2048,
        )

    private fun newFullSpacingArray(): FloatArray {
      return floatArrayOf(
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
          YogaConstants.UNDEFINED,
      )
    }
  }
}
