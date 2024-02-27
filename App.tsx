import React, { useEffect, useRef, useState } from 'react'
import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
  StyleSheet,
  TextStyle,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Image, ImageStyle } from 'expo-image'
import {
  CameraCapturedPicture,
  CameraOrientation,
  CameraView,
  useCameraPermissions,
} from 'expo-camera/next'
import { isDevice } from 'expo-device'

import { mockPosition } from './utils'

const BORDER_RADIUS = 4
const SPACE = 16

const CAPTURE_BUTTON_SIZE = 72
const CAPTURE_WRAPPER_SIZE = CAPTURE_BUTTON_SIZE + SPACE

const SMALL_PREVIEW_SIZE = SPACE * 7

const height = (w: number, x: number, y: number) => Math.round(w * (y / x))

// Supported "portrait" Aspect Ratios: 9:16, 3:4
const ASPECT_RATIOS: [number, number][] = [
  [9, 16],
  [3, 4],
]

const App = () => {
  const dimensions = useWindowDimensions()
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()

  const [isCameraReady, setIsCameraReady] = useState(false)
  const [[x, y], setAspectRatio] = useState<[number, number]>([3, 4])
  const [picture, setPicture] = useState<CameraCapturedPicture>()

  const [expandedPreview, setExpandedPreview] = useState(false)

  const cameraRef = useRef<CameraView>(null)

  const previewWidth = dimensions.width - SPACE * 2
  const previewAspectRatio = picture ? picture.width / picture.height : 0

  /**
   * 🐛 Orientation type bug? Event returns numbers instead of stirngs!
   */
  const handleIOSRotation = (orientation: CameraOrientation) => {
    console.warn('IOS ORIENTAION:', orientation)
  }

  const takePicture = async () => {
    const [lng, lat] = mockPosition()

    const locationExif = {
      GPSLatitude: lat,
      GPSLongitude: lng,
      GPSAltitude: 0,
      GPSSpeed: 0,
      GPSTimeStamp: Date.now(),
    }

    try {
      const picture = await cameraRef.current?.takePictureAsync({
        exif: true, // 🐛 Enabling exif produces wrong orientation when landscaped
        additionalExif: {
          ...locationExif,
          UserComment: `Bug with expo-camera/next`,
        },
      })

      setPicture(picture)
    } catch (e) {
      console.error(e)
    }
  }

  const toggleExpandedPreview = () => {
    setExpandedPreview(!expandedPreview)
  }

  const $previewStyles: ImageStyle = {
    ...$preview,
    width: expandedPreview ? previewWidth : SMALL_PREVIEW_SIZE,
    height: expandedPreview ? previewWidth / previewAspectRatio : SMALL_PREVIEW_SIZE,
  }

  useEffect(() => {
    ;(async () => {
      await requestCameraPermission()
    })()
  }, [])

  useEffect(() => {
    // Set Camera height based on available screen height
    const ratio = ASPECT_RATIOS.find(([x, y]) => {
      return height(dimensions.width, x, y) < dimensions.height
    }) ?? [3, 4]

    setAspectRatio(ratio ?? [3, 4])
  }, [])

  if (!isDevice) {
    return (
      <View style={$container}>
        <Text style={$text}>Only available on your fully paid iPhone!</Text>
      </View>
    )
  }

  return (
    <View style={$container}>
      <StatusBar style="light" />
      {cameraPermission?.granted ? (
        <CameraView
          ref={cameraRef}
          facing="back"
          style={[$camera, x && y ? { height: height(dimensions.width, x, y) } : undefined]}
          onCameraReady={() => setIsCameraReady(true)}
          onResponsiveOrientationChanged={(e) => handleIOSRotation(e.orientation)}
          responsiveOrientationWhenOrientationLocked
        >
          <View style={$captureWrapper}>
            <TouchableOpacity
              activeOpacity={0.6}
              style={$captureButton}
              disabled={!isCameraReady || expandedPreview}
              onPress={takePicture}
            />
          </View>
          {expandedPreview && <Pressable onPress={toggleExpandedPreview} style={$overlay} />}
          {!!picture?.uri && (
            <Pressable onPress={toggleExpandedPreview}>
              <Image source={picture.uri} style={$previewStyles} />
            </Pressable>
          )}
        </CameraView>
      ) : (
        <Text style={$text}>⚠️ We need access to your Camera!</Text>
      )}
    </View>
  )
}

const $container: ViewStyle = {
  flex: 1,
  backgroundColor: '#0d0e11',
  alignItems: 'center',
  justifyContent: 'center',
}

const $overlay: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(13, 14, 17, 0.8)',
}

const $text: TextStyle = {
  color: '#ffffff',
}

const $camera: ViewStyle = {
  width: '100%',
  height: '100%',
}

const $captureWrapper: ViewStyle = {
  position: 'absolute',
  bottom: 0,
  alignSelf: 'center',
  backgroundColor: 'rgba(13, 14, 17, 0.25)',
  height: CAPTURE_WRAPPER_SIZE,
  width: CAPTURE_WRAPPER_SIZE,
  borderRadius: CAPTURE_WRAPPER_SIZE / 2,
  marginBottom: SPACE * 2,
  alignItems: 'center',
  justifyContent: 'center',
}

const $captureButton: ViewStyle = {
  backgroundColor: '#ffffff',
  height: CAPTURE_BUTTON_SIZE,
  width: CAPTURE_BUTTON_SIZE,
  borderRadius: CAPTURE_BUTTON_SIZE / 2,
}

const $preview: ImageStyle = {
  position: 'absolute',
  top: SPACE,
  right: SPACE,
  backgroundColor: '#ffffff',
  borderRadius: BORDER_RADIUS,
  borderWidth: 2,
  borderColor: '#ffffff',
}

export default App
