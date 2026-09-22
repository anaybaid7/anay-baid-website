import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from './Home'
import { projects, experience } from '../data'

describe('Home — derived stats', () => {
  it('shows a hackathon win count that matches the number of awards containing "Winner"', () => {
    render(<Home goTo={vi.fn()} />)
    const expected = projects.filter((p) => p.award?.toLowerCase().includes('winner')).length
    expect(screen.getByText(String(expected))).toBeInTheDocument()
  })

  it('shows a co-op term count that matches the number of experience entries', () => {
    render(<Home goTo={vi.fn()} />)
    expect(screen.getByText(String(experience.length))).toBeInTheDocument()
  })

  it('does not claim a specific relocation scope that was never stated', () => {
    render(<Home goTo={vi.fn()} />)
    expect(screen.queryByText(/nationwide/i)).not.toBeInTheDocument()
  })
})
