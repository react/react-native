#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Bundle React Native app's code and image assets.
# This script is supposed to be invoked as part of Xcode build process
# and relies on environment variables (including PWD) set by Xcode

# Print commands before executing them (useful for troubleshooting)
set -x -e
DEST="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"

# Enables iOS devices to get the IP address of the machine running Metro
if [[ ! "$SKIP_BUNDLING_METRO_IP" && "$CONFIGURATION" = *Debug* && ! "$PLATFORM_NAME" == *simulator ]]; then
  for num in 0 1 2 3 4 5 6 7 8; do
    IP=$(ipconfig getifaddr en${num} || echo "")
    if [ ! -z "$IP" ]; then
      break
    fi
  done
  if [ -z "$IP" ]; then
    IP=$(ifconfig | grep 'inet ' | grep -v ' 127.' | grep -v ' 169.254.' |cut -d\   -f2  | awk 'NR==1{print $1}')
  fi

  echo "$IP" > "$DEST/ip.txt"
fi

if [[ "$SKIP_BUNDLING" ]]; then
  echo "SKIP_BUNDLING enabled; skipping."
  exit 0;
fi

case "$CONFIGURATION" in
  *Debug*)
    if [[ "$PLATFORM_NAME" == *simulator ]]; then
      if [[ "$FORCE_BUNDLING" ]]; then
        echo "FORCE_BUNDLING enabled; continuing to bundle."
      else
        echo "Skipping bundling in Debug for the Simulator (since the packager bundles for you). Use the FORCE_BUNDLING flag to change this behavior."
        exit 0;
      fi
    else
      echo "Bundling for physical device. Use the SKIP_BUNDLING flag to change this behavior."
    fi

    DEV=true
    ;;
  "")
    echo "$0 must be invoked by Xcode"
    exit 1
    ;;
  *)
    DEV=false
    ;;
esac

# Path to react-native folder inside node_modules
REACT_NATIVE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Most projects have their project root, one level up from their Xcode project dir (the "ios" directory)
PROJECT_ROOT="${PROJECT_ROOT:-"$PROJECT_DIR/.."}"

cd "$PROJECT_ROOT" || exit

# Define entry file
if [[ "$ENTRY_FILE" ]]; then
  # Use ENTRY_FILE defined by user
  :
elif [[ -s "index.ios.js" ]]; then
  ENTRY_FILE=${1:-index.ios.js}
else
  ENTRY_FILE=${1:-index.js}
fi

# check and assign NODE_BINARY env
# shellcheck source=/dev/null
source "$REACT_NATIVE_DIR/scripts/node-binary.sh"

HERMES_ENGINE_PATH="$PODS_ROOT/hermes-engine"
[ -z "$HERMES_CLI_PATH" ] && HERMES_CLI_PATH="$HERMES_ENGINE_PATH/destroot/bin/hermesc"

# SwiftPM consumers have no Pods directory to provide hermesc. When there is
# no Pods installation at all and the current HERMES_CLI_PATH does not exist
# (unset, or an injector-baked path gone stale after a package-store move),
# resolve the hermes-compiler npm package THROUGH react-native's own dependency
# graph — react-native pins the hermes-compiler version, so the compiler's
# bytecode version always matches the prebuilt hermes VM artifacts (a
# mismatched pair crashes at launch with "Wrong bytecode version").
# STRICTLY SwiftPM-scoped: in a CocoaPods build the hermes-engine pod owns both
# the VM and hermesc, and its hermes train may legitimately differ from the npm
# hermes-compiler — falling back there would compile bundles the podded VM
# rejects.
if [[ ( -z "$PODS_ROOT" || ! -d "$PODS_ROOT" ) && ! -f "$HERMES_CLI_PATH" ]]; then
  NODE_HERMESC=$(RN_DIR="$REACT_NATIVE_DIR" "$NODE_BINARY" --print \
    "require('path').join(require('path').dirname(require.resolve('hermes-compiler/package.json', {paths: [process.env.RN_DIR]})), 'hermesc', 'osx-bin', 'hermesc')" \
    2>/dev/null || true)
  if [[ -n "$NODE_HERMESC" && -f "$NODE_HERMESC" ]]; then
    HERMES_CLI_PATH="$NODE_HERMESC"
  fi
fi

# If hermesc is not available and USE_HERMES is not set to false, show error.
if [[ $USE_HERMES != false && -f "$HERMES_ENGINE_PATH" && ! -f "$HERMES_CLI_PATH" ]]; then
  echo "error: Hermes is enabled but the hermesc binary could not be found at ${HERMES_CLI_PATH}." \
       "Perhaps you need to run 'bundle exec pod install' or otherwise " \
       "point the HERMES_CLI_PATH variable to your custom location." >&2
  exit 2
fi

[ -z "$NODE_ARGS" ] && export NODE_ARGS=""

[ -z "$CLI_PATH" ] && CLI_PATH="$REACT_NATIVE_DIR/scripts/bundle.js"

[ -z "$BUNDLE_COMMAND" ] && BUNDLE_COMMAND="bundle"

[ -z "$COMPOSE_SOURCEMAP_PATH" ] && COMPOSE_SOURCEMAP_PATH="$REACT_NATIVE_DIR/scripts/compose-source-maps.js"

if [[ -z "$BUNDLE_CONFIG" ]]; then
  CONFIG_ARG=""
else
  CONFIG_ARG="--config $BUNDLE_CONFIG"
fi

if [[ -z "$BUNDLE_NAME" ]]; then
  BUNDLE_NAME="main"
fi
BUNDLE_FILE="$CONFIGURATION_BUILD_DIR/$BUNDLE_NAME.jsbundle"

EXTRA_ARGS=()

case "$PLATFORM_NAME" in
  "macosx")
    BUNDLE_PLATFORM="macos"
    ;;
  *)
    BUNDLE_PLATFORM="ios"
    ;;
esac

if [ "${IS_MACCATALYST}" = "YES" ]; then
  BUNDLE_PLATFORM="ios"
fi

EMIT_SOURCEMAP=
if [[ ! -z "$SOURCEMAP_FILE" ]]; then
  EMIT_SOURCEMAP=true
fi

PACKAGER_SOURCEMAP_FILE=
if [[ $EMIT_SOURCEMAP == true ]]; then
  if [[ $USE_HERMES != false ]]; then
    PACKAGER_SOURCEMAP_FILE="$CONFIGURATION_BUILD_DIR/$(basename "$SOURCEMAP_FILE")"
  else
    PACKAGER_SOURCEMAP_FILE="$SOURCEMAP_FILE"
  fi
  EXTRA_ARGS+=("--sourcemap-output" "$PACKAGER_SOURCEMAP_FILE")
fi

# Hermes doesn't require JS minification.
if [[ $USE_HERMES != false && $DEV == false ]]; then
  EXTRA_ARGS+=("--minify" "false")
fi

# Allow opting out of using npx react-native config
if [[ -n "$CONFIG_JSON" ]]; then
  EXTRA_ARGS+=("--load-config" "$CONFIG_JSON")
elif [[ -n "$CONFIG_CMD" ]]; then
  EXTRA_ARGS+=("--config-cmd" "$CONFIG_CMD")
else
  EXTRA_ARGS+=("--config-cmd" "'$NODE_BINARY' $NODE_ARGS '$REACT_NATIVE_DIR/cli.js' config")
fi

# shellcheck disable=SC2086
"$NODE_BINARY" $NODE_ARGS "$CLI_PATH" $BUNDLE_COMMAND \
  $CONFIG_ARG \
  --entry-file "$ENTRY_FILE" \
  --platform "$BUNDLE_PLATFORM" \
  --dev $DEV \
  --reset-cache \
  --bundle-output "$BUNDLE_FILE" \
  --assets-dest "$DEST" \
  "${EXTRA_ARGS[@]}" \
  $EXTRA_PACKAGER_ARGS

if [[ $USE_HERMES == false ]]; then
  cp "$BUNDLE_FILE" "$DEST/"
  BUNDLE_FILE="$DEST/$BUNDLE_NAME.jsbundle"
else
  EXTRA_COMPILER_ARGS=
  if [[ $DEV == true ]]; then
    EXTRA_COMPILER_ARGS=-Og
  else
    EXTRA_COMPILER_ARGS=-O
  fi
  if [[ $EMIT_SOURCEMAP == true ]]; then
    EXTRA_COMPILER_ARGS="$EXTRA_COMPILER_ARGS -output-source-map"
  fi
  "$HERMES_CLI_PATH" -emit-binary -max-diagnostic-width=80 $EXTRA_COMPILER_ARGS -out "$DEST/$BUNDLE_NAME.jsbundle" "$BUNDLE_FILE"
  if [[ $EMIT_SOURCEMAP == true ]]; then
    HBC_SOURCEMAP_FILE="$DEST/$BUNDLE_NAME.jsbundle.map"
    "$NODE_BINARY" "$COMPOSE_SOURCEMAP_PATH" "$PACKAGER_SOURCEMAP_FILE" "$HBC_SOURCEMAP_FILE" -o "$SOURCEMAP_FILE"
    rm "$HBC_SOURCEMAP_FILE"
    rm "$PACKAGER_SOURCEMAP_FILE"
  fi
  BUNDLE_FILE="$DEST/$BUNDLE_NAME.jsbundle"
fi

if [[ $DEV != true && ! -f "$BUNDLE_FILE" ]]; then
  echo "error: File $BUNDLE_FILE does not exist. Your environment is misconfigured as Metro was not able to produce the bundle so your release application won't work!" >&2
  exit 2
fi
