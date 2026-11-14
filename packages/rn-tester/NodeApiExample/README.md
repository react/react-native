# Node-API example

The addon behind RNTester's Node-API example (`js/examples/NodeApi/NodeApiExample.js`). RNTester builds React Native without Node-API by default, so the example shows an error until you enable it.

## Building with Node-API

On Android:

```sh
./gradlew :packages:rn-tester:android:app:installDebug -PnodeApiEnabled=true
```

On iOS, from `packages/rn-tester`, then build RNTester as usual:

```sh
RCT_NODE_API_ENABLED=1 HERMES_COMMIT=$(cat ../react-native/sdks/.hermesv1version) pod install
```

## End-to-end test

`.maestro/node-api.yml` covers a sync call, async work, a thread-safe function and env cleanup across a reload. CI builds RNTester without Node-API and doesn't run it, so run it locally against a build with Node-API enabled:

```sh
maestro test -e APP_ID=com.facebook.react.uiapp packages/rn-tester/NodeApiExample/.maestro/node-api.yml
```

Use `com.meta.RNTester.localDevelopment` as the `APP_ID` on iOS.
