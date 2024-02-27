### Install and run
```
npx expo prebuild --clean
yarn ios --device
```

### What platform(s) does this occur on?

IOS

### Did you reproduce this issue in a development build?

Yes

### Summary

After upgrading to Expo 50 and using `expo-camera/next`, the orientation is messed up when `exif: true` is enabled. It looks like it has to do with the EXIF Orientation metadata having wrong values.

Portrait = ✅
LandscapeLeft = ❌ rotated to 180deg
LandscapeRight = ❌ rotated to 180deg
PortraitUpsideDown = ❌ rotated to 180deg

Below is my workaround the issue:
```typescript

const takePicture = async () => {
  const picture = await cameraRef.current.takePictureAsync({
    exif: true,
    additionalExif: {
      // ...
    },
  })

  // save picture...
}

// 1 = portrait
// 2 = portraitUpsideDown
// 3 = landscapeLeft
// 4 = landscapeRight
const handleIOSOrientation = (cameraOrientation: number) => {
  // TODO: Bug? When landscape, photo is rotated 180deg 🤷‍♂️
  // Re-rotate back our image when this happens
  setOrientation((cameraOrientation !== 1 && cameraOrientation !== 2) ? 180 : 0)
}

return (
  <CameraView>
    // ...
    ref={cameraRef}
    onResponsiveOrientationChanged={(e) => handleIOSOrientation(Number(e.orientation))}
    responsiveOrientationWhenOrientationLocked
  >
    <Button onPress={takePicture} />
  </CameraView >
)
```

Also, note that `CameraOrientation` from the `onResponsiveOrientationChanged` event callback is returning `number` instead of the typed orientations so had to account for that as well.
https://github.com/expo/expo/blob/0cbae8e2dacbebfc3334fb26f80f31fd33b3c62f/packages/expo-camera/src/next/Camera.types.ts#L33

### Environment

```bash
$ npx expo-env-info
expo-env-info 1.2.0 environment info:
  System:
    OS: macOS 14.2.1
    Shell: 5.9 - /bin/zsh
  Binaries:
    Node: 18.18.2 - /opt/homebrew/bin/node
    Yarn: 1.22.19 - /opt/homebrew/bin/yarn
    npm: 9.8.1 - /opt/homebrew/bin/npm
    Watchman: 2023.11.06.00 - /opt/homebrew/bin/watchman
  Managers:
    CocoaPods: 1.14.2 - /opt/homebrew/bin/pod
  SDKs:
    iOS SDK:
      Platforms: DriverKit 23.2, iOS 17.2, macOS 14.2, tvOS 17.2, visionOS 1.0, watchOS 10.2
  IDEs:
    Android Studio: 2023.1 AI-231.9392.1.2311.11330709
    Xcode: 15.2/15C500b - /usr/bin/xcodebuild
  npmPackages:
    expo: ~50.0.8 => 50.0.8 
    react: 18.2.0 => 18.2.0 
    react-native: 0.73.4 => 0.73.4 
  npmGlobalPackages:
    eas-cli: 7.3.0
  Expo Workflow: bare
```

### Expo Doctor Diagnostics

```
$ npx expo-doctor@latest
✔ Check Expo config for common issues
✔ Check package.json for common issues
✔ Check dependencies for packages that should not be installed directly
✔ Check for issues with metro config
✔ Check for common project setup issues
✔ Check npm/ yarn versions
✔ Check Expo config (app.json/ app.config.js) schema
✔ Check that native modules do not use incompatible support packages
✔ Check for legacy global CLI installed locally
✔ Check that native modules use compatible support package versions for installed Expo SDK
✔ Check that packages match versions required by installed Expo SDK

Didn't find any issues with the project!
```