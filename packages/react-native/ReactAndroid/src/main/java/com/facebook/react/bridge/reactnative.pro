# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

-keepnames class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keepnames class * extends com.facebook.react.bridge.CxxModuleWrapper {*; }
-keepclassmembers class * extends com.facebook.react.bridge.NativeModule {
    @com.facebook.react.bridge.ReactMethod *;
    public <init>(...);
}

-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactProp <methods>; }
-keepclassmembers class *  { @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>; }
-keepnames class * extends com.facebook.react.uimanager.ViewManager
-keepnames class * extends com.facebook.react.uimanager.ReactShadowNode
-keep class **$$PropsSetter
-keep class **$$ReactModuleInfoProvider
-keep class com.facebook.react.bridge.ReadableType { *; }

# Let tools outside the app's own code identify the views React Native renders.
# Keep in sync with ReactAndroid/proguard-rules.pro, which explains each rule.
-keep class com.facebook.react.uimanager.UIManagerHelper {
    public static *** getUIManager(...);
}
-keep interface com.facebook.react.bridge.UIManager {
    android.view.View resolveView(int);
}

-keepnames class com.facebook.quicklog.QuickPerformanceLogger {
  void markerAnnotate(int,int,java.lang.String,java.lang.String);
  void markerTag(int,int,java.lang.String);
}

## Putting this here is kind of a hack.  I don't want to modify the OSS bridge.
## TODO mhorowitz: add @DoNotStrip to the interface directly.

-keepclassmembers class com.facebook.react.bridge.queue.MessageQueueThread {
  public boolean isOnThread();
  public void assertIsOnThread();
}
