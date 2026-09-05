/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import SwiftUI
import UIKit

@MainActor @objc public class RCTSwiftUIContainerView: NSObject {
  private var containerViewModel = ContainerViewModel()
  private var hostingController: UIHostingController<SwiftUIContainerView>?

  @objc public override init() {
    super.init()
    let controller = UIHostingController(rootView: SwiftUIContainerView(viewModel: containerViewModel))
    if #available(iOS 16.4, tvOS 16.4, *) {
      // Disable implicit safe area insets or else the view is shifted by the safe area insets
      controller.safeAreaRegions = []
    }
    hostingController = controller
    guard let view = controller.view else {
      return
    }
    view.backgroundColor = .clear
  }

  @objc public func updateContentView(_ view: UIView) {
    containerViewModel.contentView = view
  }

  @objc public func hostingView() -> UIView? {
    return hostingController?.view
  }

  @objc public func contentView() -> UIView? {
    return containerViewModel.contentView
  }

  @objc public func updateBlurRadius(_ radius: NSNumber) {
    let blurRadius = CGFloat(radius.floatValue)
    containerViewModel.blurRadius = blurRadius
  }

  @objc public func updateGrayscale(_ grayscale: NSNumber) {
    containerViewModel.grayscale = CGFloat(grayscale.floatValue)
  }

  @objc public func updateDropShadow(standardDeviation: NSNumber, x: NSNumber, y: NSNumber, color: UIColor) {
    containerViewModel.shadowRadius = CGFloat(standardDeviation.floatValue)
    containerViewModel.shadowX = CGFloat(x.floatValue)
    containerViewModel.shadowY = CGFloat(y.floatValue)
    containerViewModel.shadowColor = Color(color)
  }

  @objc public func updateSaturation(_ saturation: NSNumber) {
    containerViewModel.saturationAmount = CGFloat(saturation.floatValue)
  }

  @objc public func updateContrast(_ contrast: NSNumber) {
    containerViewModel.contrastAmount = CGFloat(contrast.floatValue)
  }

  @objc public func updateHueRotate(_ degrees: NSNumber) {
    containerViewModel.hueRotationDegrees = CGFloat(degrees.floatValue)
  }

  @objc public func updateLayout(withBounds bounds: CGRect) {
    hostingController?.view.frame = bounds
    containerViewModel.contentView?.frame = bounds
  }

  @objc public func resetStyles() {
    containerViewModel.blurRadius = 0
    containerViewModel.grayscale = 0
    containerViewModel.shadowRadius = 0
    containerViewModel.shadowX = 0
    containerViewModel.shadowY = 0
    containerViewModel.shadowColor = Color.clear
    containerViewModel.saturationAmount = 1
    containerViewModel.contrastAmount = 1
    containerViewModel.hueRotationDegrees = 0
  }
}

class ContainerViewModel: ObservableObject {
  // blur filter properties
  @Published var blurRadius: CGFloat = 0

  // grayscale filter properties
  @Published var grayscale: CGFloat = 0

  // drop-shadow filter properties
  @Published var shadowRadius: CGFloat = 0
  @Published var shadowX: CGFloat = 0
  @Published var shadowY: CGFloat = 0
  @Published var shadowColor: Color = Color.clear

  // saturation filter properties
  @Published var saturationAmount: CGFloat = 1

  // contrast filter properties
  @Published var contrastAmount: CGFloat = 1

  // hue-rotate filter properties
  @Published var hueRotationDegrees: CGFloat = 0

  @Published var contentView: UIView?
}

struct SwiftUIContainerView: View {
  @ObservedObject var viewModel: ContainerViewModel

  var body: some View {
    if let contentView = viewModel.contentView {
      UIViewWrapper(view: contentView)
        .blur(radius: viewModel.blurRadius)
        .grayscale(viewModel.grayscale)
        .shadow(color: viewModel.shadowColor, radius: viewModel.shadowRadius, x: viewModel.shadowX, y: viewModel.shadowY)
        .saturation(viewModel.saturationAmount)
        .contrast(viewModel.contrastAmount)
        .hueRotation(.degrees(viewModel.hueRotationDegrees))
    }
  }
}

struct UIViewWrapper: UIViewRepresentable {
  let view: UIView

  func makeUIView(context: Context) -> UIView {
    return view
  }

  func updateUIView(_ uiView: UIView, context: Context) {
  }
}
