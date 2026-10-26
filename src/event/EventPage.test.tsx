import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EventPage from './EventPage'
import { dashboard, tool } from './content'

describe('EventPage', () => {
  it('shows every section', () => {
    render(<EventPage />)
    expect(screen.getByRole('heading', { level: 1, name: /forecasting the network/i })).toBeInTheDocument()
    for (const h of ['What the team does', tool.name, dashboard.name, 'Also this term', 'Presented']) {
      expect(screen.getByRole('heading', { level: 2, name: h })).toBeInTheDocument()
    }
  })

  it('has a screenshot for each part of the tool', () => {
    render(<EventPage />)
    for (const s of tool.shots) expect(screen.getByRole('button', { name: `Open ${s.title} full size` })).toBeInTheDocument()
  })
})
