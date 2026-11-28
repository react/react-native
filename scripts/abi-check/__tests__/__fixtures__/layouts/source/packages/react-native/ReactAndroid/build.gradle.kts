/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

val preparePrefab by
    tasks.registering(PreparePrefabHeadersTask::class) {
      input.set(
          listOf(
              PrefabPreprocessingEntry("jsi", Pair("../ReactCommon/jsi/", "")),
              PrefabPreprocessingEntry(
                  "reactnative",
                  listOf(
                      Pair("../ReactCommon/react/", "react/"),
                      // folly
                      Pair(File(buildDir, "third-party-ndk/folly/").absolutePath, ""),
                      Pair(
                          "../ReactCommon/react/renderer/view/platform/android/",
                          "",
                      ),
                      Pair("../ReactCommon/jsi/jsi/jsi.h", "react/fabric/"),
                      Pair("src/main/jni/react/missing", ""),
                  ),
              ),
          ),
      )
      outputDir.set(prefabHeadersDir)
    }
