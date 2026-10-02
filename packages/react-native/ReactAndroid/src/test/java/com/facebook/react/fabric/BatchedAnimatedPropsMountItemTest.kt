/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactNativeJNISoLoader
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.fabric.mounting.MountItemDispatcher
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.mountitems.BatchedAnimatedPropsMountItem
import com.facebook.react.uimanager.MatrixMathHelper
import com.facebook.react.uimanager.TransformHelper
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.within
import org.junit.Test
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class BatchedAnimatedPropsMountItemTest {
  private fun decode(
      ints: IntArray,
      doubles: DoubleArray,
      rawProps: Array<Any?> = emptyArray(),
  ): List<Pair<Int, ReadableMap>> {
    val updates = mutableListOf<Pair<Int, ReadableMap>>()
    BatchedAnimatedPropsMountItem(ints, doubles, rawProps, mock()).decode { tag, props ->
      updates.add(tag to props)
    }
    return updates
  }

  @Test
  fun decodesOpacityPerView() {
    val updates =
        decode(
            intArrayOf(
                CMD_START_OF_VIEW,
                11,
                CMD_OPACITY,
                CMD_END_OF_VIEW,
                CMD_START_OF_VIEW,
                12,
                CMD_OPACITY,
                CMD_END_OF_VIEW,
            ),
            doubleArrayOf(0.25, 0.75),
        )

    assertThat(updates.map { it.first }).containsExactly(11, 12)
    assertThat(updates[0].second.getDouble("opacity")).isEqualTo(0.25)
    assertThat(updates[1].second.getDouble("opacity")).isEqualTo(0.75)
  }

  @Test
  fun decodesAdditionalColorProps() {
    val color = 0xff112233.toInt()
    for ((command, name) in
        listOf(
            CMD_PLACEHOLDER_TEXT_COLOR to "placeholderTextColor",
            CMD_SHADOW_COLOR to "shadowColor",
            CMD_BORDER_BLOCK_COLOR to "borderBlockColor",
            CMD_BORDER_BLOCK_START_COLOR to "borderBlockStartColor",
            CMD_BORDER_BLOCK_END_COLOR to "borderBlockEndColor",
            CMD_OUTLINE_COLOR to "outlineColor",
        )) {
      val props =
          decode(intArrayOf(CMD_START_OF_VIEW, 7, command, color, CMD_END_OF_VIEW), doubleArrayOf())
              .single()
              .second
      assertThat(props.getInt(name)).describedAs(name).isEqualTo(color)
    }
  }

  @Test
  fun decodesOutlinePropsAcrossViews() {
    val updates =
        decode(
            intArrayOf(
                CMD_START_OF_VIEW,
                7,
                CMD_OUTLINE_OFFSET,
                CMD_OUTLINE_WIDTH,
                CMD_END_OF_VIEW,
                CMD_START_OF_VIEW,
                8,
                CMD_OPACITY,
                CMD_END_OF_VIEW,
            ),
            doubleArrayOf(-2.0, 1.25, 0.5),
        )

    assertThat(updates.map { it.first }).containsExactly(7, 8)
    val props = updates[0].second
    assertThat(props.getDouble("outlineOffset")).isEqualTo(-2.0)
    assertThat(props.getDouble("outlineWidth")).isEqualTo(1.25)
    assertThat(updates[1].second.getDouble("opacity")).isEqualTo(0.5)
  }

  @Test
  fun decodesTransformOpsInOrder() {
    val updates =
        decode(
            intArrayOf(
                CMD_START_OF_VIEW,
                7,
                CMD_START_OF_TRANSFORM,
                CMD_TRANSLATE_X,
                CMD_UNIT_PX,
                CMD_ROTATE,
                CMD_SCALE,
                CMD_END_OF_TRANSFORM,
                CMD_END_OF_VIEW,
            ),
            doubleArrayOf(10.0, 1.5, 2.0),
        )

    val transforms = checkNotNull(updates.single().second.getArray("transform"))
    assertThat(transforms.size()).isEqualTo(3)
    assertThat(transforms.getMap(0)?.getDouble("translateX")).isEqualTo(10.0)
    assertThat(transforms.getMap(1)?.getDouble("rotate")).isEqualTo(1.5)
    assertThat(transforms.getMap(2)?.getDouble("scale")).isEqualTo(2.0)
  }

  @Test
  fun decodesMatrixOpWithSixteenValues() {
    val matrix = DoubleArray(16) { it.toDouble() }
    val updates =
        decode(
            intArrayOf(
                CMD_START_OF_VIEW,
                7,
                CMD_START_OF_TRANSFORM,
                CMD_MATRIX,
                CMD_END_OF_TRANSFORM,
                CMD_END_OF_VIEW,
            ),
            matrix,
        )

    val transforms = checkNotNull(updates.single().second.getArray("transform"))
    val decoded = checkNotNull(transforms.getMap(0)?.getArray("matrix"))
    assertThat(decoded.size()).isEqualTo(16)
    assertThat(decoded.getDouble(15)).isEqualTo(15.0)
  }

  @Test
  fun preservesScaleWithThreeDimensionalRotations() {
    mockStatic(ReactNativeJNISoLoader::class.java).use {
      for ((rotation, axis) in listOf(CMD_ROTATE_X to 0, CMD_ROTATE_Y to 1)) {
        val props =
            decode(
                    intArrayOf(
                        CMD_START_OF_VIEW,
                        7,
                        CMD_START_OF_TRANSFORM,
                        CMD_PERSPECTIVE,
                        CMD_SCALE,
                        rotation,
                        CMD_END_OF_TRANSFORM,
                        CMD_END_OF_VIEW,
                    ),
                    doubleArrayOf(200.0, 2.0, Math.PI / 4),
                )
                .single()
                .second
        val matrix = DoubleArray(16)
        TransformHelper.processTransform(
            checkNotNull(props.getArray("transform")),
            matrix,
            0f,
            0f,
            null,
        )
        val decomposition = MatrixMathHelper.MatrixDecompositionContext()
        MatrixMathHelper.decomposeMatrix(matrix, decomposition)

        for (scale in decomposition.scale) {
          assertThat(scale).isCloseTo(2.0, within(0.000001))
        }
        assertThat(decomposition.rotationDegrees[axis]).isEqualTo(45.0)
      }
    }
  }

  @Test
  fun passesRawPropsThroughAsTheWholeView() {
    val raw = object : ReadableMap by JavaOnlyMap.of("translateX", 4.0, "opacity", null) {}
    val updates =
        decode(
            intArrayOf(
                CMD_START_OF_VIEW,
                7,
                CMD_RAW_PROPS,
                CMD_END_OF_VIEW,
                CMD_START_OF_VIEW,
                8,
                CMD_OPACITY,
                CMD_END_OF_VIEW,
            ),
            doubleArrayOf(0.5),
            arrayOf(raw),
        )

    assertThat(updates[0]).isEqualTo(7 to raw)
    assertThat(updates[1].second.getDouble("opacity")).isEqualTo(0.5)
  }

  @Test
  fun rejectsUnknownEntries() {
    org.junit.Assert.assertThrows(IllegalStateException::class.java) {
      decode(intArrayOf(CMD_START_OF_VIEW, 7, UNKNOWN_COMMAND, CMD_END_OF_VIEW), doubleArrayOf())
    }
  }

  @Test
  fun decodesRadiusAndTranslationUnits() {
    val props =
        decode(
                intArrayOf(
                    CMD_START_OF_VIEW,
                    7,
                    CMD_BORDER_RADIUS,
                    CMD_UNIT_PX,
                    CMD_BORDER_TOP_LEFT_RADIUS,
                    CMD_UNIT_PERCENT,
                    CMD_START_OF_TRANSFORM,
                    CMD_TRANSLATE_X,
                    CMD_UNIT_PX,
                    CMD_TRANSLATE_Y,
                    CMD_UNIT_PERCENT,
                    CMD_END_OF_TRANSFORM,
                    CMD_END_OF_VIEW,
                ),
                doubleArrayOf(4.0, 12.5, 10.0, 25.0),
            )
            .single()
            .second
    assertThat(props.getDouble("borderRadius")).isEqualTo(4.0)
    assertThat(props.getString("borderTopLeftRadius")).isEqualTo("12.5%")
    val transform = checkNotNull(props.getArray("transform"))
    assertThat(transform.getMap(0)?.getDouble("translateX")).isEqualTo(10.0)
    assertThat(transform.getMap(1)?.getString("translateY")).isEqualTo("25.0%")
  }

  @Test
  fun rejectsMalformedCommandsAndUnits() {
    for (ints in
        listOf(
            intArrayOf(UNKNOWN_COMMAND),
            intArrayOf(CMD_START_OF_VIEW, 7, CMD_BORDER_RADIUS, UNKNOWN_UNIT, CMD_END_OF_VIEW),
            intArrayOf(
                CMD_START_OF_VIEW,
                7,
                CMD_START_OF_TRANSFORM,
                CMD_TRANSLATE_X,
                UNKNOWN_UNIT,
                CMD_END_OF_TRANSFORM,
                CMD_END_OF_VIEW,
            ),
            intArrayOf(
                CMD_START_OF_VIEW,
                7,
                CMD_START_OF_TRANSFORM,
                UNKNOWN_TRANSFORM_COMMAND,
                CMD_END_OF_TRANSFORM,
                CMD_END_OF_VIEW,
            ),
            intArrayOf(
                CMD_START_OF_VIEW,
                7,
                CMD_START_OF_TRANSFORM,
                CMD_MATRIX,
                CMD_END_OF_TRANSFORM,
                CMD_END_OF_VIEW,
            ),
            intArrayOf(CMD_START_OF_VIEW, 7, CMD_RAW_PROPS, CMD_OPACITY, CMD_END_OF_VIEW),
        )) {
      org.junit.Assert.assertThrows(RuntimeException::class.java) {
        decode(ints, doubleArrayOf(1.0))
      }
    }
  }

  @Test
  fun queuesMissingViewsAndContinuesTheBatch() {
    val manager = mock<MountingManager>()
    val dispatcher = mock<MountItemDispatcher>()
    val second = JavaOnlyMap.of("opacity", 0.75)
    whenever(manager.updateAnimatedPropsSynchronously(12, second)).thenReturn(true)
    BatchedAnimatedPropsMountItem(
            intArrayOf(
                CMD_START_OF_VIEW,
                11,
                CMD_OPACITY,
                CMD_END_OF_VIEW,
                CMD_START_OF_VIEW,
                12,
                CMD_OPACITY,
                CMD_END_OF_VIEW,
            ),
            doubleArrayOf(0.25, 0.75),
            emptyArray(),
            dispatcher,
        )
        .execute(manager)
    verify(dispatcher).addMountItem(org.mockito.kotlin.any())
    verify(manager).updateAnimatedPropsSynchronously(12, second)
  }

  @Test
  fun continuesAfterOneViewManagerFails() {
    val manager = mock<MountingManager>()
    val dispatcher = mock<MountItemDispatcher>()
    whenever(manager.updateAnimatedPropsSynchronously(11, JavaOnlyMap.of("opacity", 0.25)))
        .thenThrow(IllegalStateException("view failure"))
    BatchedAnimatedPropsMountItem(
            intArrayOf(
                CMD_START_OF_VIEW,
                11,
                CMD_OPACITY,
                CMD_END_OF_VIEW,
                CMD_START_OF_VIEW,
                12,
                CMD_OPACITY,
                CMD_END_OF_VIEW,
            ),
            doubleArrayOf(0.25, 0.75),
            emptyArray(),
            dispatcher,
        )
        .execute(manager)
    verify(manager).updateAnimatedPropsSynchronously(12, JavaOnlyMap.of("opacity", 0.75))
  }

  private companion object {
    const val CMD_START_OF_VIEW = 1
    const val CMD_START_OF_TRANSFORM = 2
    const val CMD_END_OF_TRANSFORM = 3
    const val CMD_END_OF_VIEW = 4
    const val CMD_RAW_PROPS = 5
    const val CMD_OPACITY = 10
    const val CMD_PLACEHOLDER_TEXT_COLOR = 18
    const val CMD_SHADOW_COLOR = 19
    const val CMD_BORDER_RADIUS = 20
    const val CMD_BORDER_TOP_LEFT_RADIUS = 21
    const val CMD_BORDER_BLOCK_COLOR = 47
    const val CMD_BORDER_BLOCK_START_COLOR = 48
    const val CMD_BORDER_BLOCK_END_COLOR = 49
    const val CMD_OUTLINE_COLOR = 50
    const val CMD_OUTLINE_OFFSET = 51
    const val CMD_OUTLINE_WIDTH = 52
    const val CMD_TRANSLATE_X = 100
    const val CMD_TRANSLATE_Y = 101
    const val CMD_SCALE = 102
    const val CMD_ROTATE = 105
    const val CMD_ROTATE_X = 106
    const val CMD_ROTATE_Y = 107
    const val CMD_MATRIX = 111
    const val CMD_PERSPECTIVE = 112
    const val CMD_UNIT_PX = 202
    const val CMD_UNIT_PERCENT = 203

    const val UNKNOWN_COMMAND = 9
    const val UNKNOWN_TRANSFORM_COMMAND = 999
    const val UNKNOWN_UNIT = 999
  }
}
