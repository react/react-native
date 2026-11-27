# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "fileutils"
require "json"
require "test/unit"
require "tmpdir"

class HermesPodspecTest < Test::Unit::TestCase
    PODSPEC_RELATIVE_PATH = File.expand_path("../../../sdks/hermes-engine/hermes-engine.podspec", __dir__)
    HERMES_ENGINE_DIR = File.dirname(PODSPEC_RELATIVE_PATH)
    CREATE_DUMMY_SCRIPT_PATH = File.join(HERMES_ENGINE_DIR, "utils", "create-dummy-hermes-xcframework.sh")
    HERMES_UTILS_PATH = File.join(HERMES_ENGINE_DIR, "hermes-utils.rb")
    VERSION_PROPERTIES_PATH = File.join(HERMES_ENGINE_DIR, "version.properties")
    PACKAGE_JSON_PATH = File.expand_path("../../../package.json", __dir__)

    def capture_command(env, *cmd, stdin_data: nil)
        out_r, out_w = IO.pipe
        err_r, err_w = IO.pipe
        opts = {out: out_w, err: err_w}
        if stdin_data
            in_r, in_w = IO.pipe
            opts[:in] = in_r
        end
        pid = Process.spawn(env, *cmd, opts)
        out_w.close
        err_w.close
        if stdin_data
            in_r.close
            in_w.write(stdin_data)
            in_w.close
        end
        stdout = out_r.read
        stderr = err_r.read
        out_r.close
        err_r.close
        _, status = Process.wait2(pid)
        return [stdout, stderr, status]
    end

    def evaluate_podspec_in_checkout(checkout_root, cmake_path:, define_executable: true)
        podspec_dir = File.join(checkout_root, "sdks", "hermes-engine")
        FileUtils.mkdir_p(File.join(podspec_dir, "utils"))
        FileUtils.cp(PODSPEC_RELATIVE_PATH, File.join(podspec_dir, "hermes-engine.podspec"))
        FileUtils.cp(HERMES_UTILS_PATH, File.join(podspec_dir, "hermes-utils.rb"))
        FileUtils.cp(VERSION_PROPERTIES_PATH, File.join(podspec_dir, "version.properties"))
        FileUtils.cp(CREATE_DUMMY_SCRIPT_PATH, File.join(podspec_dir, "utils", "create-dummy-hermes-xcframework.sh"))
        FileUtils.cp(PACKAGE_JSON_PATH, File.join(checkout_root, "package.json"))

        runner = <<~'RUBY'
            require "json"

            module Pod
                class Spec
                    attr_accessor :name, :version, :summary, :description, :homepage, :license, :author, :source, :platforms
                    attr_accessor :preserve_paths, :source_files, :pod_target_xcconfig, :user_target_xcconfig
                    attr_accessor :prepare_command, :script_phases, :script_phase
                    attr_reader :ios, :tvos, :osx, :visionos, :subspecs

                    PlatformMock = Struct.new(:vendored_frameworks)
                    SubspecMock = Struct.new(
                        :name,
                        :source_files,
                        :public_header_files,
                        :header_dir,
                        :preserve_paths,
                        :header_mappings_dir,
                        :ios,
                        :visionos,
                        :tvos,
                        :osx
                    )

                    def initialize
                        @ios = PlatformMock.new
                        @tvos = PlatformMock.new
                        @osx = PlatformMock.new
                        @visionos = PlatformMock.new
                        @subspecs = []
                        yield self if block_given?
                    end

                    def subspec(name)
                        ss = SubspecMock.new(
                            name,
                            nil,
                            nil,
                            nil,
                            nil,
                            nil,
                            PlatformMock.new,
                            PlatformMock.new,
                            PlatformMock.new,
                            PlatformMock.new
                        )
                        yield ss
                        @subspecs << ss
                    end

                    def to_h
                        {
                            "name" => @name,
                            "version" => @version,
                            "source" => @source,
                            "platforms" => @platforms,
                            "preserve_paths" => @preserve_paths,
                            "source_files" => @source_files,
                            "pod_target_xcconfig" => @pod_target_xcconfig,
                            "user_target_xcconfig" => @user_target_xcconfig,
                            "prepare_command" => @prepare_command,
                            "script_phases" => @script_phases,
                            "ios_vendored_frameworks" => @ios.vendored_frameworks,
                            "tvos_vendored_frameworks" => @tvos.vendored_frameworks,
                            "osx_vendored_frameworks" => @osx.vendored_frameworks,
                            "visionos_vendored_frameworks" => @visionos.vendored_frameworks,
                            "subspecs" => @subspecs.map(&:to_h),
                        }
                    end
                end
            end

            if ENV["TEST_DEFINE_EXECUTABLE"] == "1"
                module Pod
                    class Executable
                        def self.execute_command(command, arguments)
                            if command == "node"
                                return File.join(ENV["TEST_CHECKOUT_ROOT"], "package.json")
                            end
                            raise "Unexpected command: #{command}"
                        end

                        def self.which!(binary)
                            raise "Unexpected binary: #{binary}" unless binary == "cmake"
                            ENV["TEST_CMAKE_PATH"]
                        end
                    end
                end
            end

            evaluated_spec = nil
            orig_new = Pod::Spec.method(:new)
            Pod::Spec.define_singleton_method(:new) do |&block|
                evaluated_spec = orig_new.call(&block)
                evaluated_spec
            end

            Dir.chdir(File.join(ENV["TEST_CHECKOUT_ROOT"], "sdks", "hermes-engine")) do
                load File.expand_path("hermes-engine.podspec")
            end

            puts JSON.generate(evaluated_spec.to_h)
        RUBY

        env = {
            "RCT_BUILD_HERMES_FROM_SOURCE" => "true",
            "HERMES_COMMIT" => "0123456789abcdef0123456789abcdef01234567",
            "TEST_CHECKOUT_ROOT" => checkout_root,
            "TEST_CMAKE_PATH" => cmake_path,
            "TEST_DEFINE_EXECUTABLE" => define_executable ? "1" : "0",
        }
        stdout, stderr, status = capture_command(env, "ruby", "-e", runner)
        assert(status.success?, "Podspec evaluation failed:\n#{stderr}")
        return JSON.parse(stdout)
    end

    def test_fromSourceSpecIsDeterministicAcrossCheckoutsAndCmakePaths
        Dir.mktmpdir do |tmpdir|
            checkout_a = File.join(tmpdir, "developer_a", "app", "node_modules", "react-native")
            checkout_b = File.join(tmpdir, "ci_runner", "workspace", "node_modules", "react-native")
            cmake_a = "/opt/homebrew/bin/cmake"
            cmake_b = "/usr/local/bin/cmake"

            spec_a = evaluate_podspec_in_checkout(checkout_a, cmake_path: cmake_a)
            spec_b = evaluate_podspec_in_checkout(checkout_b, cmake_path: cmake_b)

            assert_equal(spec_a, spec_b)
            assert_equal(File.read(CREATE_DUMMY_SCRIPT_PATH), spec_a["prepare_command"])
            refute_includes(spec_a["prepare_command"], checkout_a)
            refute_includes(spec_a["prepare_command"], checkout_b)

            scripts = spec_a["script_phases"].map { |phase| phase["script"] }
            assert_equal(2, scripts.length)
            scripts.each do |script|
                refute_includes(script, cmake_a)
                refute_includes(script, cmake_b)
                refute_includes(script, checkout_a)
                refute_includes(script, checkout_b)

                _, stderr, status = capture_command({}, "/bin/bash", "-n", stdin_data: script)
                assert(status.success?, "Generated script failed bash syntax check:\n#{stderr}\n#{script}")
            end
        end
    end

    def test_fromSourceCmakeResolutionRespectsXcodeEnvAndHomebrewFallback
        Dir.mktmpdir do |tmpdir|
            checkout = File.join(tmpdir, "node_modules", "react-native")
            spec = evaluate_podspec_in_checkout(checkout, cmake_path: "/opt/homebrew/bin/cmake")
            first_script = spec["script_phases"].first["script"]
            # Extract lines up to `export CMAKE_BINARY` (before sourcing build-hermesc-xcode.sh)
            resolution_snippet = first_script.lines.take_while { |line| !line.include?("build-hermesc-xcode.sh") }.join

            fake_react_native = File.join(tmpdir, "fake_rn")
            FileUtils.mkdir_p(File.join(fake_react_native, "scripts", "xcode"))
            File.write(File.join(fake_react_native, "scripts", "xcode", "with-environment.sh"), "")

            fake_bin = File.join(tmpdir, "fake_bin")
            FileUtils.mkdir_p(fake_bin)
            fake_cmake = File.join(fake_bin, "cmake")
            File.write(fake_cmake, "#!/bin/sh\nexit 0\n")
            File.chmod(0755, fake_cmake)

            # 1. Existing CMAKE_BINARY (e.g. from .xcode.env) is preserved
            probe = "#{resolution_snippet}\nprintf '%s' \"$CMAKE_BINARY\"\n"
            out, err, st = capture_command(
                {"REACT_NATIVE_PATH" => fake_react_native, "CMAKE_BINARY" => "/custom/cmake"},
                "/bin/bash", "-c", probe
            )
            assert(st.success?, err)
            assert_equal("/custom/cmake", out)

            # 2. Resolves cmake from PATH when CMAKE_BINARY is unset
            out, err, st = capture_command(
                {"REACT_NATIVE_PATH" => fake_react_native, "CMAKE_BINARY" => nil, "PATH" => "#{fake_bin}:/usr/bin:/bin"},
                "/bin/bash", "-c", probe
            )
            assert(st.success?, err)
            assert_equal(fake_cmake, out)

            # 3. Resolves cmake from standard macOS fallback locations when stripped from PATH (e.g. Xcode GUI)
            standard_fallbacks = %w[
                /opt/homebrew/bin/cmake
                /usr/local/bin/cmake
                /opt/local/bin/cmake
                /Applications/CMake.app/Contents/bin/cmake
            ]
            expected_fallback = standard_fallbacks.find { |path| File.executable?(path) }
            if expected_fallback
                out, err, st = capture_command(
                    {"REACT_NATIVE_PATH" => fake_react_native, "CMAKE_BINARY" => nil, "PATH" => "/usr/bin:/bin"},
                    "/bin/bash", "-c", probe
                )
                assert(st.success?, err)
                assert_equal(expected_fallback, out)
            else
                # 4. Fails clearly when cmake is not available anywhere
                _, err, st = capture_command(
                    {"REACT_NATIVE_PATH" => fake_react_native, "CMAKE_BINARY" => nil, "PATH" => "/nonexistent"},
                    "/bin/bash", "-c", probe
                )
                refute(st.success?)
                assert_includes(err, "cmake not found")
            end
        end
    end

    def test_fromSourceEvaluatesWithoutPodExecutable
        Dir.mktmpdir do |tmpdir|
            checkout = File.join(tmpdir, "node_modules", "react-native")
            spec = evaluate_podspec_in_checkout(checkout, cmake_path: "/opt/homebrew/bin/cmake", define_executable: false)
            assert_nil(spec["script_phases"])
            assert_equal(File.read(CREATE_DUMMY_SCRIPT_PATH), spec["prepare_command"])
        end
    end
end
