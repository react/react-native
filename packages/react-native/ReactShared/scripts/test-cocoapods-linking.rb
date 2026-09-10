# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'cocoapods'
require 'fileutils'
require 'json'
require 'open3'
require 'tmpdir'

shared_root = File.expand_path('..', __dir__)
helper = File.expand_path('../scripts/cocoapods/kmp.rb', shared_root)
output_root = ENV['RCT_KMP_LINKING_TEST_OUTPUT_DIR'] || Dir.mktmpdir('react-native-kmp-linking-')
FileUtils.mkdir_p(output_root)
results = []

# These local pods exercise CocoaPods' real dependency and target-inheritance
# handling without downloading dependencies or compiling a Kotlin framework.
[nil, 'static', 'dynamic', 'mixed'].each do |linkage|
  name = linkage || 'static-library'
  fixture = File.join(output_root, name)
  FileUtils.mkdir_p(fixture)
  project = Xcodeproj::Project.new(File.join(fixture, 'Fixture.xcodeproj'))
  host = project.new_target(:application, 'Host', :ios, '15.1')
  hosted = project.new_target(:unit_test_bundle, 'HostedTests', :ios, '15.1')
  project.new_target(:unit_test_bundle, 'StandaloneTests', :ios, '15.1')
  hosted.add_dependency(host)
  hosted.build_configurations.each do |config|
    config.build_settings['TEST_HOST'] = '$(BUILT_PRODUCTS_DIR)/Host.app/Host'
    config.build_settings['BUNDLE_LOADER'] = '$(TEST_HOST)'
  end
  project.save

  %w[React-RCTFabric TestSupport].each do |pod_name|
    pod_dir = File.join(fixture, pod_name)
    FileUtils.mkdir_p(pod_dir)
    File.write(File.join(pod_dir, 'Fixture.m'), "#import <Foundation/Foundation.h>\n")
    File.write(File.join(pod_dir, "#{pod_name}.podspec"), <<~PODSPEC)
      Pod::Spec.new do |s|
        s.name = #{pod_name.dump}
        s.version = '1.0.0'
        s.summary = 'Local CocoaPods linking fixture.'
        s.homepage = 'https://reactnative.dev/'
        s.license = { :type => 'MIT', :text => 'Test fixture' }
        s.author = 'React Native'
        s.source = { :git => 'https://example.invalid/fixture.git' }
        s.platform = :ios, '15.1'
        s.source_files = 'Fixture.m'
        #{"s.dependency 'React-KMP'" if pod_name == 'React-RCTFabric'}
      end
    PODSPEC
  end

  File.write(File.join(fixture, 'helpers.rb'), <<~HELPERS)
    require #{helper.dump}
    def min_supported_versions
      { :ios => '15.1' }
    end
  HELPERS
  File.write(File.join(fixture, 'Podfile'), <<~PODFILE)
    require_relative './helpers'
    platform :ios, '15.1'
    install! 'cocoapods', :warn_for_unused_master_specs_repo => false
    project 'Fixture.xcodeproj'
    #{"use_frameworks! :linkage => :#{linkage}" if linkage && linkage != 'mixed'}
    target 'Host' do
      #{"use_frameworks! :linkage => :dynamic" if linkage == 'mixed'}
      pod 'React-KMP', :path => #{shared_root.dump}
      pod 'React-RCTFabric', :path => './React-RCTFabric'
      target 'HostedTests' do
        inherit! :search_paths
        pod 'TestSupport', :path => './TestSupport'
      end
    end
    target 'StandaloneTests' do
      #{"use_frameworks! :linkage => :static" if linkage == 'mixed'}
      pod 'React-KMP', :path => #{shared_root.dump}
      pod 'React-RCTFabric', :path => './React-RCTFabric'
    end
    post_install do |installer|
      ReactNativeKMPUtils.configure_aggregate_xcconfig(installer)
      ReactNativeKMPUtils.configure_aggregate_xcconfig(installer)
    end
  PODFILE

  output, status = Open3.capture2e(
    { 'COCOAPODS_DISABLE_STATS' => 'true', 'COCOAPODS_NO_BUNDLER' => 'true' },
    RbConfig.ruby, Gem.bin_path('cocoapods', 'pod'), 'install',
    "--project-directory=#{fixture}", '--no-repo-update'
  )
  File.write(File.join(fixture, 'pod-install.log'), output)
  raise "CocoaPods #{name} fixture failed: #{output}" unless status.success?

  %w[Host HostedTests StandaloneTests].each do |target|
    %w[debug release].each do |configuration|
      config_path = File.join(fixture, 'Pods', 'Target Support Files', "Pods-#{target}", "Pods-#{target}.#{configuration}.xcconfig")
      config = Xcodeproj::Config.new(Pathname.new(config_path)).attributes
      dynamic = linkage == 'dynamic' || (linkage == 'mixed' && target == 'Host')
      expected = target == 'HostedTests' || dynamic ? 0 : 1
      %w[iphoneos iphonesimulator].each do |sdk|
        flags = config["OTHER_LDFLAGS[sdk=#{sdk}*]"].to_s
        count = flags.scan('-framework ReactNativeShared').length
        raise "#{name}/#{target}/#{configuration}/#{sdk}: expected #{expected} Kotlin links, got #{count}" unless count == expected
        search_paths = config["FRAMEWORK_SEARCH_PATHS[sdk=#{sdk}*]"].to_s
        raise "Missing inherited framework search path for #{name}/#{target}" unless search_paths.include?('ReactNativeSharedKMP')
      end
      raise "Unconditional Kotlin link leaks into Catalyst for #{name}/#{target}" if config['OTHER_LDFLAGS'].to_s.include?('ReactNativeShared')
      results << { :linkage => name, :target => target, :configuration => configuration, :kotlin_links_per_ios_sdk => expected }
    end
  end
end

File.write(File.join(output_root, 'results.json'), JSON.pretty_generate(results) + "\n")
puts "Passed #{results.length} CocoaPods configurations across static libraries, static frameworks, dynamic frameworks, and mixed per-target linkage."
puts "Generated fixture configs and logs: #{output_root}"
