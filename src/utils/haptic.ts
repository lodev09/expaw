import { ImpactFeedbackStyle, impactAsync, selectionAsync } from 'expo-haptics'

/**
 * Haptic feedback
 */
export const haptic = (style?: ImpactFeedbackStyle) =>
  style ? impactAsync(style) : selectionAsync()
