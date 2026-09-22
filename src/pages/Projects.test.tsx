import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Projects from './Projects'
import { projects } from '../data'

describe('Projects — tech filter', () => {
  it('shows every project when no filter is active', () => {
    render(<Projects />)
    for (const p of projects) {
      expect(screen.getByText(p.title)).toBeInTheDocument()
    }
  })

  it('filters down to only projects using the selected tech', async () => {
    const user = userEvent.setup()
    render(<Projects />)

    const pythonProjects = projects.filter((p) => p.tech.includes('Python'))
    const nonPythonProjects = projects.filter((p) => !p.tech.includes('Python'))

    await user.click(screen.getByRole('button', { name: 'Python' }))

    for (const p of pythonProjects) {
      expect(screen.getByText(p.title)).toBeInTheDocument()
    }
    for (const p of nonPythonProjects) {
      expect(screen.queryByText(p.title)).not.toBeInTheDocument()
    }
  })

  it('clicking an active filter again clears it and shows everything', async () => {
    const user = userEvent.setup()
    render(<Projects />)

    const btn = screen.getByRole('button', { name: 'Python' })
    await user.click(btn)
    await user.click(btn)

    for (const p of projects) {
      expect(screen.getByText(p.title)).toBeInTheDocument()
    }
  })

  it('selecting a second tech is additive (OR), not a narrower AND filter', async () => {
    const user = userEvent.setup()
    render(<Projects />)

    // find two techs used by two different, non-overlapping projects
    const [techA, projA] = [projects[0].tech[0], projects[0]]
    const otherProject = projects.find((p) => !p.tech.includes(techA))
    if (!otherProject) return // data doesn't support this case; nothing to assert

    const techB = otherProject.tech[0]

    await user.click(screen.getByRole('button', { name: techA }))
    await user.click(screen.getByRole('button', { name: techB }))

    expect(screen.getByText(projA.title)).toBeInTheDocument()
    expect(screen.getByText(otherProject.title)).toBeInTheDocument()
  })
})
