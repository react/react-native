/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageRenderer.h"
#include "../stubs/FantomTextInput.h"
#include "TextLayout.h"

#include <include/codec/SkCodec.h>
#include <include/core/SkCanvas.h>
#include <include/core/SkColorFilter.h>
#include <include/core/SkData.h>
#include <include/core/SkImage.h>
#include <include/core/SkPaint.h>
#include <include/core/SkPath.h>
#include <include/core/SkRRect.h>
#include <include/core/SkShader.h>
#include <include/utils/SkBase64.h>
#include <react/renderer/components/image/ImageProps.h>
#include <react/renderer/components/image/ImageState.h>
#include <react/renderer/components/scrollview/ScrollViewState.h>
#include <react/renderer/components/text/ParagraphState.h>
#include <react/renderer/core/ConcreteState.h>
#include <algorithm>
#include <array>
#include <cmath>
#include <stdexcept>

namespace facebook::react {
namespace {

SkPaint color(SharedColor value) {
  SkPaint paint;
  paint.setAntiAlias(true);
  paint.setColor(SkColorSetARGB(
      alphaFromColor(value),
      redFromColor(value),
      greenFromColor(value),
      blueFromColor(value)));
  return paint;
}

SkRRect roundedRect(Size size, const BorderRadii& radii) {
  std::array<SkVector, 4> corners{};
  int index = 0;
  for (const auto& radius :
       {radii.topLeft, radii.topRight, radii.bottomRight, radii.bottomLeft}) {
    corners[index++] = SkVector::Make(
        std::min(radius.horizontal, size.width / 2),
        std::min(radius.vertical, size.height / 2));
  }
  SkRRect rect;
  rect.setRectRadii(SkRect::MakeWH(size.width, size.height), corners.data());
  return rect;
}

sk_sp<SkImage> loadImage(const std::string& uri) {
  constexpr std::string_view prefix = "data:image/png;base64,";
  sk_sp<SkData> bytes;
  if (uri.starts_with(prefix)) {
    const auto encoded = std::string_view(uri).substr(prefix.size());
    size_t decodedSize = 0;
    if (SkBase64::Decode(
            encoded.data(), encoded.size(), nullptr, &decodedSize) !=
        SkBase64::kNoError) {
      throw std::runtime_error("Cannot decode Fantom PNG data source");
    }
    bytes = SkData::MakeUninitialized(decodedSize);
    if (SkBase64::Decode(
            encoded.data(),
            encoded.size(),
            bytes->writable_data(),
            &decodedSize) != SkBase64::kNoError) {
      throw std::runtime_error("Cannot decode Fantom PNG data source");
    }
  } else {
    if (uri.starts_with("http:") || uri.starts_with("https:") ||
        uri.starts_with("data:")) {
      throw std::runtime_error(
          "Fantom screenshots support local PNG files and data:image/png;base64 sources: " +
          uri.substr(0, 100));
    }
    const auto path = uri.starts_with("file://") ? uri.substr(7) : uri;
    bytes = SkData::MakeFromFileName(path.c_str());
  }
  const auto codec = bytes ? SkCodec::MakeFromData(std::move(bytes)) : nullptr;
  if (!codec || codec->getEncodedFormat() != SkEncodedImageFormat::kPNG) {
    throw std::runtime_error(
        "Cannot decode Fantom PNG image: " + uri.substr(0, 100));
  }
  SkBitmap bitmap;
  const auto info = codec->getInfo()
                        .makeColorType(kN32_SkColorType)
                        .makeAlphaType(kPremul_SkAlphaType);
  if (!bitmap.tryAllocPixels(info)) {
    throw std::bad_alloc();
  }
  if (codec->getPixels(bitmap.pixmap()) != SkCodec::kSuccess) {
    throw std::runtime_error("Cannot decode Fantom PNG pixels");
  }
  bitmap.setImmutable();
  auto image = SkImage::MakeFromBitmap(bitmap);
  if (!image) {
    throw std::runtime_error("Cannot create Fantom PNG image");
  }
  return image;
}

void paintBorders(SkCanvas& canvas, Size size, const BorderMetrics& border) {
  const auto& widths = border.borderWidths;
  if (widths.left + widths.right + widths.top + widths.bottom <= 0) {
    return;
  }
  canvas.save();
  SkPath ring;
  ring.addRRect(roundedRect(size, border.borderRadii));
  const Size innerSize{
      .width = std::max<Float>(0, size.width - widths.left - widths.right),
      .height = std::max<Float>(0, size.height - widths.top - widths.bottom)};
  if (innerSize.width > 0 && innerSize.height > 0) {
    auto innerRadii = border.borderRadii;
    const auto inset = [](CornerRadii& radius,
                          Float horizontal,
                          Float vertical) {
      radius.horizontal = std::max<Float>(0, radius.horizontal - horizontal);
      radius.vertical = std::max<Float>(0, radius.vertical - vertical);
    };
    inset(innerRadii.topLeft, widths.left, widths.top);
    inset(innerRadii.topRight, widths.right, widths.top);
    inset(innerRadii.bottomLeft, widths.left, widths.bottom);
    inset(innerRadii.bottomRight, widths.right, widths.bottom);
    auto inner = roundedRect(innerSize, innerRadii);
    inner.offset(widths.left, widths.top);
    ring.addRRect(inner);
  }
  ring.setFillType(SkPathFillType::kEvenOdd);
  canvas.clipPath(ring, true);
  if (border.borderColors.top &&
      border.borderColors.top == border.borderColors.right &&
      border.borderColors.top == border.borderColors.bottom &&
      border.borderColors.top == border.borderColors.left) {
    canvas.drawPaint(color(border.borderColors.top));
    canvas.restore();
    return;
  }
  const auto edge = [&](std::initializer_list<Point> points,
                        SharedColor value) {
    if (!value) {
      return;
    }
    SkPath path;
    for (auto point = points.begin(); point != points.end(); ++point) {
      if (point == points.begin()) {
        path.moveTo(point->x, point->y);
      } else {
        path.lineTo(point->x, point->y);
      }
    }
    path.close();
    canvas.drawPath(path, color(value));
  };
  const auto w = size.width;
  const auto h = size.height;
  edge(
      {{.x = 0, .y = 0},
       {.x = w, .y = 0},
       {.x = w - widths.right, .y = widths.top},
       {.x = widths.left, .y = widths.top}},
      border.borderColors.top);
  edge(
      {{.x = w, .y = 0},
       {.x = w, .y = h},
       {.x = w - widths.right, .y = h - widths.bottom},
       {.x = w - widths.right, .y = widths.top}},
      border.borderColors.right);
  edge(
      {{.x = w, .y = h},
       {.x = 0, .y = h},
       {.x = widths.left, .y = h - widths.bottom},
       {.x = w - widths.right, .y = h - widths.bottom}},
      border.borderColors.bottom);
  edge(
      {{.x = 0, .y = h},
       {.x = 0, .y = 0},
       {.x = widths.left, .y = widths.top},
       {.x = widths.left, .y = h - widths.bottom}},
      border.borderColors.left);
  canvas.restore();
}
void paintImage(
    SkCanvas& canvas,
    const StubView& view,
    const ImageProps& props,
    const AssetPathMap& assetPaths) {
  auto source =
      props.sources.empty() ? props.defaultSource : props.sources.front();
  if (view.state) {
    source = static_cast<const ConcreteState<ImageState>&>(*view.state)
                 .getData()
                 .getImageSource();
  }
  const auto size = view.layoutMetrics.frame.size;
  if (source.uri.empty() || size.width <= 0 || size.height <= 0) {
    return;
  }
  const auto asset = assetPaths.find(source.uri);
  auto image =
      loadImage(asset == assetPaths.end() ? source.uri : asset->second);
  const double width = image->width();
  const double height = image->height();
  double sx = size.width / width;
  double sy = size.height / height;
  switch (props.resizeMode) {
    case ImageResizeMode::Cover:
      sx = sy = std::max(sx, sy);
      break;
    case ImageResizeMode::Contain:
      sx = sy = std::min(sx, sy);
      break;
    case ImageResizeMode::Center:
      sx = sy = std::min(1.0, std::min(sx, sy));
      break;
    case ImageResizeMode::Repeat:
    case ImageResizeMode::None:
      sx = sy = 1.0 / std::max<Float>(source.scale, 1);
      break;
    case ImageResizeMode::Stretch:
      break;
  }
  canvas.save();
  canvas.clipRRect(
      roundedRect(
          size, props.resolveBorderMetrics(view.layoutMetrics).borderRadii),
      true);
  SkPaint paint;
  paint.setAntiAlias(true);
  if (props.tintColor && *props.tintColor) {
    paint.setColorFilter(
        SkColorFilters::Blend(
            color(*props.tintColor).getColor(), SkBlendMode::kSrcIn));
  }
  const SkSamplingOptions sampling(SkFilterMode::kLinear);
  if (props.resizeMode == ImageResizeMode::Repeat) {
    SkMatrix scale;
    scale.setScale(static_cast<SkScalar>(sx), static_cast<SkScalar>(sy));
    paint.setShader(image->makeShader(
        SkTileMode::kRepeat, SkTileMode::kRepeat, sampling, scale));
    canvas.drawRect(SkRect::MakeWH(size.width, size.height), paint);
  } else {
    const auto destination = SkRect::MakeXYWH(
        static_cast<SkScalar>((size.width - width * sx) / 2),
        static_cast<SkScalar>((size.height - height * sy) / 2),
        static_cast<SkScalar>(width * sx),
        static_cast<SkScalar>(height * sy));
    canvas.drawImageRect(image, destination, sampling, &paint);
  }
  canvas.restore();
}

void paintView(
    SkCanvas& canvas,
    const StubView& view,
    const AssetPathMap& assetPaths) {
  const auto& metrics = view.layoutMetrics;
  if (metrics.displayType == DisplayType::None) {
    return;
  }
  const auto* props = dynamic_cast<const ViewProps*>(view.props.get());
  canvas.save();
  canvas.translate(metrics.frame.origin.x, metrics.frame.origin.y);
  if (props) {
    const auto& matrix = props->resolveTransform(metrics).matrix;
    const auto determinant = static_cast<long double>(matrix[0]) * matrix[5] -
        static_cast<long double>(matrix[1]) * matrix[4];
    if (determinant == 0 || !std::isfinite(determinant)) {
      canvas.restore();
      return;
    }
    SkMatrix transform;
    transform.setAll(
        matrix[0],
        matrix[4],
        matrix[12],
        matrix[1],
        matrix[5],
        matrix[13],
        0,
        0,
        1);
    if (!transform.isIdentity()) {
      canvas.translate(
          metrics.frame.size.width / 2, metrics.frame.size.height / 2);
      canvas.concat(transform);
      canvas.translate(
          -metrics.frame.size.width / 2, -metrics.frame.size.height / 2);
    }
    if (props->opacity < 1) {
      canvas.saveLayerAlpha(
          nullptr, static_cast<U8CPU>(std::round(255 * props->opacity)));
    }
    const auto border = props->resolveBorderMetrics(metrics);
    if (props->backgroundColor) {
      canvas.drawRRect(
          roundedRect(metrics.frame.size, border.borderRadii),
          color(props->backgroundColor));
    }
    if (props->getClipsContentToBounds()) {
      canvas.clipRRect(
          roundedRect(metrics.frame.size, border.borderRadii), true);
    }
  }

  const std::string_view name(view.componentName ? view.componentName : "");
  if (name == "Paragraph" && view.state) {
    const auto& state =
        static_cast<const ConcreteState<ParagraphState>&>(*view.state)
            .getData();
    const auto frame = metrics.getContentFrame();
    canvas.save();
    canvas.translate(frame.origin.x, frame.origin.y);
    canvas.clipRect(SkRect::MakeWH(frame.size.width, frame.size.height));
    paintText(
        &canvas,
        layoutText(
            &canvas,
            state.attributedString,
            state.paragraphAttributes,
            frame.size.width),
        frame.size.width);
    canvas.restore();
  } else if (
      const auto* input =
          dynamic_cast<const FantomTextInputProps*>(view.props.get())) {
    auto attributes =
        input->getEffectiveTextAttributes(metrics.fontSizeMultiplier);
    const bool placeholder = input->text.empty();
    if (placeholder) {
      attributes.foregroundColor = input->placeholderTextColor
          ? input->placeholderTextColor
          : colorFromRGBA(128, 128, 128, 255);
    }
    auto text = placeholder ? input->placeholder : input->text;
    if (!placeholder && input->secureTextEntry) {
      std::string masked;
      for (const unsigned char character : text) {
        if ((character & 0xc0) != 0x80) {
          masked += "•";
        }
      }
      text = masked;
    }
    AttributedString string;
    string.appendFragment(
        {.string = text, .textAttributes = attributes, .parentShadowView = {}});
    const auto frame = metrics.getContentFrame();
    auto paragraph = input->paragraphAttributes;
    if (!input->multiline) {
      paragraph.maximumNumberOfLines = 1;
    }
    auto layout = layoutText(&canvas, string, paragraph, frame.size.width);
    canvas.save();
    canvas.translate(frame.origin.x, frame.origin.y);
    canvas.clipRect(SkRect::MakeWH(frame.size.width, frame.size.height));
    if (!input->multiline) {
      canvas.translate(
          0,
          std::max<Float>(
              0, (frame.size.height - layout.measurement.size.height) / 2));
    }
    paintText(&canvas, layout, frame.size.width);
    canvas.restore();
  } else if (
      const auto* image = dynamic_cast<const ImageProps*>(view.props.get())) {
    paintImage(canvas, view, *image, assetPaths);
  }

  canvas.save();
  if (name == "ScrollView") {
    canvas.clipRect(
        SkRect::MakeWH(metrics.frame.size.width, metrics.frame.size.height));
    if (view.state) {
      const auto& state =
          static_cast<const ConcreteState<ScrollViewState>&>(*view.state)
              .getData();
      canvas.translate(-state.contentOffset.x, -state.contentOffset.y);
    }
  }
  for (const auto& child : view.children) {
    paintView(canvas, *child, assetPaths);
  }
  canvas.restore();

  if (props) {
    paintBorders(
        canvas, metrics.frame.size, props->resolveBorderMetrics(metrics));
    if (props->opacity < 1) {
      canvas.restore();
    }
  }
  canvas.restore();
}

SkBitmap renderSurface(
    const StubViewTree& tree,
    const AssetPathMap& assetPaths) {
  const auto& root = tree.getRootStubView();
  const auto scale = root.layoutMetrics.pointScaleFactor;
  const auto width = std::ceil(
      static_cast<double>(root.layoutMetrics.frame.size.width) * scale);
  const auto height = std::ceil(
      static_cast<double>(root.layoutMetrics.frame.size.height) * scale);
  if (!std::isfinite(width) || !std::isfinite(height) || width <= 0 ||
      height <= 0 || width * height > 64.0 * 1024 * 1024) {
    throw std::runtime_error(
        "Invalid Fantom screenshot dimensions (maximum 64 million pixels)");
  }
  SkBitmap surface;
  if (!surface.tryAllocPixels(
          SkImageInfo::Make(
              static_cast<int>(width),
              static_cast<int>(height),
              kBGRA_8888_SkColorType,
              kPremul_SkAlphaType))) {
    throw std::bad_alloc();
  }
  surface.eraseColor(SK_ColorTRANSPARENT);
  SkCanvas canvas(surface);
  canvas.scale(scale, scale);
  for (const auto& child : root.children) {
    paintView(canvas, *child, assetPaths);
  }
  return surface;
}
} // namespace

std::shared_ptr<Screenshot> ImageRenderer::capture(
    const StubViewTree& tree,
    const AssetPathMap& assetPaths) const {
  return std::make_shared<Screenshot>(renderSurface(tree, assetPaths));
}

std::vector<unsigned char> ImageRenderer::render(
    const StubViewTree& tree) const {
  return capture(tree)->getPNG();
}

void ImageRenderer::renderToFile(
    const StubViewTree& tree,
    const std::string& filePath) const {
  capture(tree)->saveToFile(filePath);
}

} // namespace facebook::react
