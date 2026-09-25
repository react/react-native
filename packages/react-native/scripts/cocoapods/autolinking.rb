# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require 'pathname'
require 'cocoapods'
require_relative './autolinking_utils.rb'
require_relative '../react_native_pods.rb'

# Your project will have to depend on the @react-native-community/cli if you use this method
# for listing React native modules.
#
# Parameters:
# - config_command: the command to run to get the application's current config, e.g. ['npx', '@react-native-community/cli', 'config']
def list_native_modules!(config_command)

  if !(config_command.is_a? Array and config_command.size > 0)
    Pod::UI.warn "Expected a list_native_modules! to be called with a config command", [
      "Unable to autolink if no config is provided for the current project."
    ]
    exit(1)
  end

  # Ignore stderr output, we're only interested in stdout and the return code. Libraries can output warnings to
  # stderr which create problems for JSON deserializing.
  json, _, status = Pod::Executable.capture_command(config_command[0], config_command[1..], capture: :both)

  if not status.success?
    Pod::UI.warn "The command: '#{config_command.join(" ").bold.yellow}' returned a status code of #{status.exitstatus.to_s.bold.red}", [
        json,
        "In order to autolink using Cocoapods, this framework uses @react-native-community/cli to discover React Native native modules",
        "Please either add it: yarn add -D @react-native-community/cli or consult your framework's documentation."
    ]
    exit(status.exitstatus)
  end

  config = JSON.parse(json)

  packages = config["dependencies"]
  ios_project_root = Pathname.new(config["project"]["ios"]["sourceDir"])
  react_native_path = Pathname.new(config["reactNativePath"])
  codegen_output_path = ios_project_root.join("build/generated/autolinking/autolinking.json")

  # Write autolinking react-native-config output to codegen folder
  FileUtils.mkdir_p(File.dirname(codegen_output_path))
  File.write(codegen_output_path, json)

  found_pods = []

  packages.each do |package_name, package|
    next unless package_config = package["platforms"]["ios"]

    name = package["name"]
    podspec_path = package_config["podspecPath"]
    script_phases = package_config["scriptPhases"]
    configurations = package_config["configurations"]

    # Add a warning to the queue and continue to the next dependency if the podspec_path is nil/empty
    if podspec_path.nil? || podspec_path.empty?
      Pod::UI.warn("list_native_modules! skipped the react-native dependency '#{name}'. No podspec file was found.",
        [
          "Check to see if there is an updated version that contains the necessary podspec file",
          "Contact the library maintainers or send them a PR to add a podspec. The react-native-webview podspec is a good example of a package.json driven podspec. See https://github.com/react-native-community/react-native-webview/blob/master/react-native-webview.podspec",
          "If necessary, you can disable autolinking for the dependency and link it manually. See https://github.com/react-native-community/cli/blob/main/docs/autolinking.md#how-can-i-disable-autolinking-for-unsupported-library"
        ])
      next
    end

    spec = Pod::Specification.from_file(podspec_path)

    # Skip pods that do not support the platform of the current target.
    next unless AutolinkingUtils.is_platform_supported?(current_target_definition, spec)

    podspec_dir_path = Pathname.new(File.dirname(podspec_path))

    relative_path = podspec_dir_path.relative_path_from ios_project_root

    found_pods.push({
      "configurations": configurations,
      "name": name,
      "root": package["root"],
      "path": relative_path.to_path,
      "podspec_path": podspec_path,
      "script_phases": script_phases
    })
  end

  if found_pods.size > 0
    pods = found_pods.map { |p| p[:name] }.sort.to_sentence
    Pod::UI.puts "Found #{found_pods.size} #{"module".pluralize(found_pods.size)} for target `#{current_target_definition.name}`"
  end

  return {
    "ios_packages": found_pods,
    "ios_project_root_path": ios_project_root.to_s,
    "react_native_path": react_native_path.relative_path_from(ios_project_root).to_s
  }
end

# Your project will have to depend on the @react-native-community/cli if you use this method
# for listing React native modules.
#
# Parameters:
# - config:
#   - :ios_packages - Array of React Native iOS packages, e.g. [{ package_name: "Foo", package: { .. }}, ...]
#   - :ios_project_root_path - Absolute path to the react_native project's ios folder, e.g. /Users/foobar/project/rn_project/ios
#   - :react_native_path - Relative path to the react_native from the project, e.g. ./node_modules/react-native
def link_native_modules!(config)
  Pod::UI.puts "link_native_modules! #{config}"

  if !(
    config[:ios_packages].is_a? Array and
    config[:ios_project_root_path].is_a? String and
    config[:react_native_path].is_a? String
  )
    Pod::UI.warn("link_native_modules! has been called with a malformed 'config' parameter",
      [
        "This is the config argument passed: #{config.inspect}",
      ]);
    exit(1)
  end

  ios_project_root = config[:ios_project_root_path]

  packages = config[:ios_packages]
  found_pods = []

  packages.each do |package|
    podspec_path = package[:podspec_path]
    configurations = package[:configurations]

    # Add a warning to the queue and continue to the next dependency if the podspec_path is nil/empty
    if podspec_path.nil? || podspec_path.empty?
      Pod::UI.warn("use_native_modules! skipped the react-native dependency '#{package[:name]}'. No podspec file was found.",
        [
          "Check to see if there is an updated version that contains the necessary podspec file",
          "Contact the library maintainers or send them a PR to add a podspec. The react-native-webview podspec is a good example of a package.json driven podspec. See https://github.com/react-native-community/react-native-webview/blob/master/react-native-webview.podspec",
          "If necessary, you can disable autolinking for the dependency and link it manually. See https://github.com/react-native-community/cli/blob/main/docs/autolinking.md#how-can-i-disable-autolinking-for-unsupported-library"
        ])
      next
    end

    spec = Pod::Specification.from_file(podspec_path)

    # Don't try track packages that exclude our platforms
    next unless AutolinkingUtils.is_platform_supported?(current_target_definition, spec)

    # We want to do a look up inside the current CocoaPods target
    # to see if it's already included, this:
    #   1. Gives you the chance to define it beforehand
    #   2. Ensures CocoaPods won't explode if it's included twice
    #
    this_target = current_target_definition
    existing_deps = current_target_definition.dependencies

    # Skip dependencies that the user already activated themselves.
    next if existing_deps.find do |existing_dep|
      existing_dep.name.split('/').first == spec.name
    end

    podspec_dir_path = Pathname.new(File.dirname(podspec_path))

    relative_path = podspec_dir_path.relative_path_from ios_project_root

    # Register the found React Native module into our collection of Pods.
    pod spec.name, :path => relative_path.to_path, :configurations => configurations

    if package[:script_phases] && !this_target.abstract?
      # Can be either an object, or an array of objects
      Array(package[:script_phases]).each do |phase|
        # see https://www.rubydoc.info/gems/cocoapods-core/Pod/Podfile/DSL#script_phase-instance_method
        # for the full object keys
        Pod::UI.puts "Adding a custom script phase for Pod #{spec.name}: #{phase["name"] || 'No name specified.'}"

        # Support passing in a path relative to the root of the package
        if phase["path"]
          phase["script"] = File.read(File.expand_path(phase["path"], package[:root]))
          phase.delete("path")
        end

        # Support converting the execution position into a symbol
        phase["execution_position"] = phase["execution_position"]&.to_sym

        phase = Hash[phase.map { |k, v| [k.to_sym, v] }]
        script_phase phase
      end
    end

    found_pods.push spec
  end

  if found_pods.size > 0
    pods = found_pods.map { |p| p.name }.sort.to_sentence
    Pod::UI.puts "Auto-linking React Native #{"module".pluralize(found_pods.size)} for target `#{current_target_definition.name}`: #{pods}"
  end

  return {
    :reactNativePath => config[:react_native_path]
  }
end

$default_command = ['node', '-e', "process.argv=['', '', 'config'];require('@react-native-community/cli').run()"];

# Autolink your native modules
#
# Parameters:
# - config_command: the command to run to get the application's current config, e.g. ['npx', '@react-native-community/cli', 'config'],
#                   you can override this if you'd like to avoid the dependency. e.g. ['cat', 'your_config.json']
def use_native_modules!(config_command = $default_command)
  return link_native_modules!(list_native_modules!(config_command))
end
