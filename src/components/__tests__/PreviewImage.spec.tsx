import React from 'react'
import { render, screen } from '@testing-library/react-native'

import { PreviewImage } from '../PreviewImage'

describe('PreviewImage', () => {
  it('should render', () => {
    render(<PreviewImage source={{ uri: 'somefile.jpg' }} />)
    expect(screen.queryByRole('image'))
  })
})
