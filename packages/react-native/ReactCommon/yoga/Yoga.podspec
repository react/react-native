# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

package = JSON.parse(File.read(File.expand_path('../../package.json', __dir__)))
version = package['version']

source = { :git => ENV['INSTALL_YOGA_FROM_LOCATION'] || 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |spec|
  spec.name = 'Yoga'
  spec.version = '0.0.0'
  spec.license =  { :type => 'MIT' }
  spec.homepage = 'https://yogalayout.dev'
  spec.documentation_url = 'https://yogalayout.dev/docs/'

  spec.summary = 'Yoga is a cross-platform layout engine which implements Flexbox.'
  spec.description = 'Yoga is a cross-platform layout engine enabling maximum collaboration within your team by implementing an API many designers are familiar with, and opening it up to developers across different platforms.'

  spec.authors = 'Facebook'
  spec.source = source

  spec.module_name = 'yoga'
  spec.header_dir = 'yoga'
  spec.requires_arc = false
  spec.pod_target_xcconfig = {
      'DEFINES_MODULE' => 'YES'
  }.merge!(ENV['USE_FRAMEWORKS'] != nil ? {
      'HEADER_SEARCH_PATHS' => '"$(PODS_TARGET_SRCROOT)"'
  } : {})
  spec.compiler_flags = [
      '-fno-omit-frame-pointer',
      '-fexceptions',
      '-Wall',
      '-Werror',
      '-std=c++20',
      '-fPIC'
  ]

  # Pinning to the same version as React.podspec.
  spec.platforms = min_supported_versions

  # Set this environment variable when *not* using the `:path` option to install the pod.
  # E.g. when publishing this spec to a spec repo.
  source_files = 'yoga/**/*.{cpp,h}'
  source_files = File.join('ReactCommon/yoga', source_files) if ENV['INSTALL_YOGA_WITHOUT_PATH_OPTION']
  spec.source_files = podspec_sources(source_files, "yoga/**/*.h")
  spec.header_mappings_dir = 'yoga'

  public_header_files = 'yoga/*.h'
  public_header_files = File.join('ReactCommon/yoga', public_header_files) if ENV['INSTALL_YOGA_WITHOUT_PATH_OPTION']
  spec.public_header_files = public_header_files

  # Fabric must be able to access private headers (which should not be included in the umbrella header)
  all_header_files = 'yoga/**/*.h'
  all_header_files = File.join('ReactCommon/yoga', all_header_files) if ENV['INSTALL_YOGA_WITHOUT_PATH_OPTION']
  spec.private_header_files = Dir.glob(all_header_files).sort - Dir.glob(public_header_files).sort
  spec.preserve_paths = [all_header_files]
end
