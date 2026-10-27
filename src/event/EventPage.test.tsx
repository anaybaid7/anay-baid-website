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

  it('zooms into a part of a screenshot and back out', () => {
    const n = slides.findIndex((s) => s.spots?.length)
    window.location.hash = `#${n + 1}`
    const { container } = render(<EventPage />)
    fireEvent.click(screen.getByRole('button', { name: `Zoom in, ${slides[n].spots![0].title}` }))
    expect(container.querySelector('.deck-callout')).toHaveTextContent(slides[n].spots![0].text)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.deck-callout')).toBeNull()
    window.location.hash = ''
  })

  it('opens a step and a point with their own picture', () => {
    for (const key of ['steps', 'points'] as const) {
      const n = slides.findIndex((s) => s[key]?.length)
      window.location.hash = `#${n + 1}`
      const { container, unmount } = render(<EventPage />)
      const item = slides[n][key]![1]
      fireEvent.click(screen.getByRole('button', { name: new RegExp(item.label.slice(0, 12)) }))
      expect(container).toHaveTextContent(item.title)
      expect(container.querySelector('.vz-svg, .vz-table, .vz-img')).not.toBeNull()
      unmount()
    }
    window.location.hash = ''
  })
})
