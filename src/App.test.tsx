import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

beforeEach(() => {
  localStorage.clear()
})

describe('App — tab navigation', () => {
  it('renders all four tabs with correct ARIA roles', () => {
    render(<App />)
    const tablist = screen.getByRole('tablist', { name: /portfolio sections/i })
    const tabs = within(tablist).getAllByRole('tab')
    expect(tabs).toHaveLength(4)
    expect(tabs.map((t) => t.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('HOME'),
        expect.stringContaining('RESUME'),
        expect.stringContaining('PROJECTS'),
        expect.stringContaining('HIRE ME'),
      ]),
    )
  })

  it('starts on the Home tab and marks it selected', () => {
    render(<App />)
    const homeTab = screen.getByRole('tab', { name: /home/i })
    expect(homeTab).toHaveAttribute('aria-selected', 'true')
  })

  it('clicking a tab switches the visible panel and updates aria-selected', async () => {
    const user = userEvent.setup()
    render(<App />)

    const resumeTab = screen.getByRole('tab', { name: /resume/i })
    await user.click(resumeTab)

    expect(resumeTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent(/download pdf/i)
  })

  it('ArrowRight moves selection to the next tab and wraps around', async () => {
    const user = userEvent.setup()
    render(<App />)

    const homeTab = screen.getByRole('tab', { name: /home/i })
    homeTab.focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /resume/i })).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    // three more rights from resume: projects -> hire -> home (wraps)
    expect(screen.getByRole('tab', { name: /home/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('End key jumps to the last tab', async () => {
    const user = userEvent.setup()
    render(<App />)
    const homeTab = screen.getByRole('tab', { name: /home/i })
    homeTab.focus()
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: /hire me/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('persists the active tab to localStorage and restores it on remount', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)

    await user.click(screen.getByRole('tab', { name: /projects/i }))
    expect(localStorage.getItem('anay-portfolio:last-tab')).toBe('projects')

    unmount()
    render(<App />)
    expect(screen.getByRole('tab', { name: /projects/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('the "SEE PROJECTS" button on Home navigates to the Projects tab', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /see projects/i }))
    expect(screen.getByRole('tab', { name: /projects/i })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('App — command palette', () => {
  it('is closed by default', () => {
    render(<App />)
    expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument()
  })

  it('opens on Cmd+K and closes on Escape', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.keyboard('{Meta>}k{/Meta}')
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument()
  })

  it('opens via the visible COMMANDS button in the status bar', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /open command palette/i }))
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument()
  })

  it('navigating via the palette switches tabs and closes the palette', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.keyboard('{Meta>}k{/Meta}')
    await user.click(screen.getByText(/go to resume/i))

    expect(screen.getByRole('tab', { name: /resume/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByPlaceholderText(/type a command/i)).not.toBeInTheDocument()
  })

  it('filters commands as you type', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.keyboard('{Meta>}k{/Meta}')
    await user.type(screen.getByPlaceholderText(/type a command/i), 'linkedin')

    expect(screen.getByText(/open linkedin/i)).toBeInTheDocument()
    expect(screen.queryByText(/go to resume/i)).not.toBeInTheDocument()
  })
})
