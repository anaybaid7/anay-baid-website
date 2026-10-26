import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EventPage from './EventPage'
import { slides } from './content'

describe('EventPage', () => {
  it('shows the notes on the first click and moves on with the second', () => {
    const { container } = render(<EventPage />)
    const slide = () => container.querySelector('.deck-slide') as HTMLElement
    expect(screen.getByRole('heading', { level: 1, name: slides[0].title })).toBeInTheDocument()
    fireEvent.click(slide())
    expect(slide()).toHaveAccessibleName('Next slide')
    fireEvent.click(slide())
    expect(screen.getByRole('heading', { level: 1, name: slides[1].title })).toBeInTheDocument()
  })

  it('has a dot for every slide', () => {
    render(<EventPage />)
    expect(screen.getAllByRole('tab')).toHaveLength(slides.length)
  })
})
