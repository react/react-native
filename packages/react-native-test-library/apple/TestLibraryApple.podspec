# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name            = "TestLibraryApple"
  s.version         = package["version"]
  s.summary         = package["description"]
  s.homepage        = "https://github.com/facebook/react-native"
  s.license         = "MIT"
  s.platforms       = min_supported_versions
  s.author          = "Meta Platforms, Inc. and its affiliates"
  s.source          = { :git => "https://github.com/facebook/react-native.git", :tag => "#{s.version}" }
  s.source_files    = "*.{h,m,mm,swift}"
  s.requires_arc    = true

  # TestLibraryApple.mm imports <ReactNativeTestLibraryCommon/TestLibraryCommon.h>.
  # CocoaPods resolves it leniently through the shared Public headers dir, but the
  # dependency edge must be declared for SwiftPM (the scaffolder wires sibling
  # packages from podspec dependencies).
  s.dependency "TestLibraryCommon"

  install_modules_dependencies(s)
end
