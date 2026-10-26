import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EventPage from './EventPage'
import { dashboard, tool } from './content'

describe('EventPage', () => {
  it('shows the tool and the dashboard with their screenshots', () => {
    render(<EventPage />)
    expect(screen.getByRole('heading', { level: 1, name: /forecasting the network/i })).toBeInTheDocument()
    for (const part of [tool, dashboard]) {
      expect(screen.getByRole('heading', { level: 2, name: part.name })).toBeInTheDocument()
      for (const s of part.shots) expect(screen.getByRole('button', { name: `Open ${s.title} full size` })).toBeInTheDocument()
    }
  })
})
