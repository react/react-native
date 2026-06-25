# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require_relative './utils.rb'

# It sets up the Hermes.
#
# @parameter react_native_path: relative path to react-native
# @parameter fabric_enabled: whether Fabirc is enabled
def setup_hermes!(react_native_path: "../node_modules/react-native")
    react_native_dir = Pod::Config.instance.installation_root.join(react_native_path)
    # This `:tag => hermestag` below is only to tell CocoaPods to update hermes-engine when React Native version changes.
    # We have custom logic to compute the source for hermes-engine. See sdks/hermes-engine/*
    hermestag_file_name = ".hermesv1version"
    hermestag_file = File.join(react_native_dir, "sdks", hermestag_file_name)
    hermestag = File.exist?(hermestag_file) ? File.read(hermestag_file).strip : ''
    pod 'hermes-engine', :podspec => "#{react_native_path}/sdks/hermes-engine/hermes-engine.podspec", :tag => hermestag
    pod 'React-hermes', :path => "#{react_native_path}/ReactCommon/hermes"
end

def use_third_party_jsc
  return ENV['USE_THIRD_PARTY_JSC'] == '1'
end

# use Hermes is the default. The only other option is the third-party JSC
# if the 3rd party JSC is not true, we always want to use Hermes.
def use_hermes
  return !use_third_party_jsc()
end

def use_hermes_flags
  return "-DUSE_HERMES=1"
end

def use_third_party_jsc_flags
  return "-DUSE_THIRD_PARTY_JSC=1"
end

def js_engine_flags()
  if use_hermes()
    return use_hermes_flags()
  else
    return use_third_party_jsc_flags()
  end
end

# Utility function to depend on JS engine based on the environment variable.
def depend_on_js_engine(s)
  if use_hermes()
    s.dependency 'hermes-engine'
  elsif use_third_party_jsc()
    s.dependency 'React-jsc'
  end
end
