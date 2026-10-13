import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import { experience, projects, profile } from './data'

const SECTIONS = ['Experience', 'Projects', 'Education', 'Skills', 'Recently on GitHub']

beforeEach(() => {
  history.replaceState(null, '', '/')
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
})

describe('App', () => {
  it('shows the name and every section', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Anay Baid')
    for (const name of SECTIONS) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
  })

  it('lists every project', () => {
    render(<App />)
    for (const p of projects) expect(screen.getAllByText(p.title).length).toBeGreaterThan(0)
  })

  it('shows the current job first and switches when another is picked', () => {
    render(<App />)
    const detail = document.getElementById('exp-detail')!
    expect(detail).toHaveTextContent(experience[0].bullets[0])
    const job = (name: RegExp) => screen.getAllByRole('button', { name }).find((b) => b.classList.contains('job'))!
    fireEvent.click(job(/cineplex/i))
    expect(document.getElementById('exp-detail')).toHaveTextContent(experience[3].bullets[0])
    const bar = screen.getAllByRole('button', { name: /iotum/i }).find((b) => b.classList.contains('tl-bar'))!
    fireEvent.click(bar)
    expect(document.getElementById('exp-detail')).toHaveTextContent(experience[1].bullets[0])
  })

  it('arrow keys move through the jobs', () => {
    render(<App />)
    const first = screen.getAllByRole('button', { name: /purolator/i }).find((b) => b.classList.contains('job'))!
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(document.getElementById('exp-detail')).toHaveTextContent(experience[1].bullets[0])
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' })
    expect(document.getElementById('exp-detail')).toHaveTextContent(experience[3].bullets[0])
  })

  it('links the live Battleship game and its code', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Play it' })).toHaveAttribute('href', 'https://purolator-battleship.onrender.com')
    const code = screen.getAllByRole('link', { name: 'Code' }).map((a) => a.getAttribute('href'))
    expect(code).toContain('https://github.com/anaybaid7/battleship-purolator')
  })

  it('switches between light and dark', () => {
    document.documentElement.dataset.theme = 'light'
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('shows where a skill was used and jumps to that job', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Docker' }))
    expect(screen.getByText(/shows up in/)).toBeInTheDocument()
    const link = screen.getAllByRole('button', { name: 'Nationwide Appraisals' }).find((b) => b.closest('.evidence'))!
    fireEvent.click(link)
    expect(document.getElementById('exp-detail')).toHaveTextContent(experience[2].bullets[0])
  })

  it('opens a job from a link like #job-iotum', () => {
    history.replaceState(null, '', '#job-iotum')
    render(<App />)
    expect(document.getElementById('exp-detail')).toHaveTextContent(experience[1].bullets[0])
    history.replaceState(null, '', '/')
  })

  it('answers the recruiter basics up front', () => {
    render(<App />)
    const glance = document.querySelector('.glance')!
    expect(glance).toHaveTextContent('April 2027')
    expect(glance).toHaveTextContent(`${experience.length} co-op terms`)
    expect(glance).toHaveTextContent('2 wins')
  })

  it('makes result numbers stand out in bullets', () => {
    render(<App />)
    const nums = [...document.querySelectorAll('#exp-detail .num')].map((n) => n.textContent)
    expect(nums).toContain('40%')
  })

  it('copies the email address', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: `Copy ${profile.email}` }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(profile.email)
    await waitFor(() => expect(screen.getByText(/copied .* to your clipboard/i)).toBeInTheDocument())
  })

  it('falls back to a GitHub link when the API is unreachable', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText(/couldn't load this from github/i)).toBeInTheDocument())
  })
})
