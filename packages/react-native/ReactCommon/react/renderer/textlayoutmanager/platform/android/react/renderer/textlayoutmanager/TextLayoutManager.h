/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <React/RendererCore.h>
#include <React/Utils.h>
#include <react/jni/SafeReleaseJniRef.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/textlayoutmanager/JPreparedLayout.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>
#include <react/renderer/textlayoutmanager/TextMeasureCache.h>
#include <react/utils/SimpleThreadSafeCache.h>

#include <fbjni/fbjni.h>
#include <memory>

namespace facebook::react {

class TextLayoutManager;

/*
 * Cross platform facade for text measurement (e.g. Android-specific
 * TextLayoutManager)
 */
class TextLayoutManager {
 public:
  /*
   * A prepared layout's Java object. Copies share one JNI global reference, so
   * returning a cached layout or storing it in state doesn't create another.
   */
  class PreparedTextLayout {
   public:
    PreparedTextLayout() = default;
    explicit PreparedTextLayout(jni::global_ref<JPreparedLayout> ref)
        : ref_(std::make_shared<const SafeReleaseJniRef<jni::global_ref<JPreparedLayout>>>(std::move(ref)))
    {
    }

    JPreparedLayout::javaobject get() const
    {
      return ref_ ? ref_->get() : nullptr;
    }

    explicit operator bool() const noexcept
    {
      return ref_ && *ref_;
    }

   private:
    std::shared_ptr<const SafeReleaseJniRef<jni::global_ref<JPreparedLayout>>> ref_;
  };

  TextLayoutManager(const std::shared_ptr<const ContextContainer> &contextContainer);

  /*
   * Not copyable.
   */
  TextLayoutManager(const TextLayoutManager &) = delete;
  TextLayoutManager &operator=(const TextLayoutManager &) = delete;

  /*
   * Not movable.
   */
  TextLayoutManager(TextLayoutManager &&) = delete;
  TextLayoutManager &operator=(TextLayoutManager &&) = delete;

  /*
   * Measures `attributedString` using native text rendering infrastructure.
   */
  TextMeasurement measure(
      const AttributedStringBox &attributedStringBox,
      const ParagraphAttributes &paragraphAttributes,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const;

  /**
   * Measures an AttributedString on the platform, as identified by some
   * opaque cache ID.
   */
  TextMeasurement measureCachedSpannableById(
      int64_t cacheId,
      const ParagraphAttributes &paragraphAttributes,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const;

  /*
   * Measures lines of `attributedString` using native text rendering
   * infrastructure.
   */
  LinesMeasurements measureLines(
      const AttributedStringBox &attributedStringBox,
      const ParagraphAttributes &paragraphAttributes,
      const Size &size) const;

  /**
   * Create a platform representation of fully laid out text, to later be
   * reused.
   */
  PreparedTextLayout prepareLayout(
      const AttributedString &attributedString,
      const ParagraphAttributes &paragraphAttributes,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const;

  /**
   * Derive text and attachment measurements from a PreparedTextLayout.
   */
  TextMeasurement measurePreparedLayout(
      const PreparedTextLayout &layout,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const;

 private:
  std::shared_ptr<const ContextContainer> contextContainer_;
  TextMeasureCache textMeasureCache_;
  LineMeasureCache lineMeasureCache_;
  SimpleThreadSafeCache<PreparedTextCacheKey, PreparedTextLayout, -1 /* Set dynamically*/> preparedTextCache_;
};

} // namespace facebook::react
