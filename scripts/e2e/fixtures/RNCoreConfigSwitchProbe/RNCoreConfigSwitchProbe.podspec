# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Fixture pod for .github/workflows/test-ios-prebuilt-config-switch.yml.
#
# It declares NO dependencies on purpose. React Native activates the prebuilt
# React module map on every pod target, but only the pods that depend on
# React-Core-prebuilt are ordered behind its Debug/Release script phase. A pod
# without that edge is what lets its compilation overlap with the script phase,
# which is what regressed in #57803. Adding a dependency here would silence the
# lane instead of fixing anything.
Pod::Spec.new do |spec|
  spec.name         = 'RNCoreConfigSwitchProbe'
  spec.version      = '1.0.0'
  spec.summary      = 'Compiles one file, depends on nothing, and fails when the prebuilt React module map disappears mid-build.'
  spec.homepage     = 'https://reactnative.dev/'
  spec.license      = { :type => 'MIT' }
  spec.author       = 'Meta Platforms, Inc. and its affiliates'
  spec.platform     = :ios, '15.1'
  spec.source       = { :path => '.' }
  spec.source_files = 'RNCoreConfigSwitchProbe.m'
end
