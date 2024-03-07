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
  CameraView,
  FlashMode,
  useCameraPermissions,
} from 'expo-camera/next'
import { isDevice } from 'expo-device'

import { mockPosition } from './utils'

const BORDER_RADIUS = 4
const SPACE = 16

const CAPTURE_BUTTON_SIZE = 64
const CAPTURE_WRAPPER_SIZE = CAPTURE_BUTTON_SIZE + SPACE

const SMALL_PREVIEW_SIZE = SPACE * 4

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

  const [isRecording, setIsRecording] = useState(false)

  const [expandedPreview, setExpandedPreview] = useState(false)
  const [flashMode, setFlashMode] = useState<FlashMode>('on')

  const cameraRef = useRef<CameraView>(null)

  const previewWidth = dimensions.width - SPACE * 2
  const previewAspectRatio = picture ? picture.width / picture.height : 0

  const startRecording = async () => {
    try {
      setIsRecording(true)
      // 🐛 Doesn't do anything
      const result = await cameraRef.current?.recordAsync()
      console.log(result?.uri)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCapturePress = async () => {
    if (isRecording) {
      // 🐛 Doesn't do anything
      cameraRef.current?.stopRecording()
      setIsRecording(false)
      return
    }

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
        exif: true,
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

  const $captureButtonStyles: ViewStyle = {
    ...$captureButton,
    backgroundColor: isRecording ? 'red' : 'white',
    width: isRecording ? CAPTURE_BUTTON_SIZE / 2 : CAPTURE_BUTTON_SIZE,
    height: isRecording ? CAPTURE_BUTTON_SIZE / 2 : CAPTURE_BUTTON_SIZE,
    borderRadius: isRecording ? BORDER_RADIUS : CAPTURE_BUTTON_SIZE / 2,
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
          flash={flashMode}
          style={[$camera, x && y ? { height: height(dimensions.width, x, y) } : undefined]}
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View style={$controlsContainer}>
            <TouchableOpacity
              style={$flashControls}
              activeOpacity={0.6}
              onPress={() => setFlashMode(flashMode === 'on' ? 'off' : 'on')}
            >
              <Text style={$text}>FLASH: {flashMode === 'on' ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
            <View style={$captureWrapper}>
              <TouchableOpacity
                activeOpacity={0.6}
                style={$captureButtonStyles}
                disabled={!isCameraReady || expandedPreview}
                onPress={handleCapturePress}
                onLongPress={startRecording}
              />
            </View>
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

const $controlsContainer: ViewStyle = {
  position: 'absolute',
  bottom: SPACE,
  width: '100%',
}

const $flashControls: ViewStyle = {
  alignSelf: 'center',
  paddingHorizontal: 8,
  paddingVertical: 4,
  backgroundColor: 'rgba(13, 14, 17, 0.5)',
  borderRadius: BORDER_RADIUS,
  marginBottom: SPACE,
}

const $overlay: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(13, 14, 17, 0.8)',
}

const $text: TextStyle = {
  color: '#ffffff',
  fontWeight: 'bold',
}

const $camera: ViewStyle = {
  width: '100%',
  height: '100%',
}

const $captureWrapper: ViewStyle = {
  alignSelf: 'center',
  backgroundColor: 'rgba(13, 14, 17, 0.25)',
  height: CAPTURE_WRAPPER_SIZE,
  width: CAPTURE_WRAPPER_SIZE,
  borderRadius: CAPTURE_WRAPPER_SIZE / 2,
  marginBottom: SPACE * 2,
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
  borderColor: 'white',
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
