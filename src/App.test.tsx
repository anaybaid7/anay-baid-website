import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'
import { __resetForTests, setSettings } from './settings'
import { DETAILS } from './details'
import { experience, projects, profile } from './data'

const SECTIONS = ['Experience', 'Projects', 'Education', 'Skills', 'Recently on GitHub']

beforeEach(() => {
  history.replaceState(null, '', '/')
  localStorage.clear()
  __resetForTests()
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
})

const findDrawer = () =>
  waitFor(() => {
    const d = document.querySelector('dialog.drawer')
    if (!d?.querySelector('#drawer-title')) throw new Error('drawer not loaded yet')
    return d
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

  it('shows every job in full, newest first', () => {
    render(<App />)
    const roles = document.querySelectorAll('[id^="job-"]')
    expect(roles).toHaveLength(experience.length)
    experience.forEach((e, i) => {
      expect(roles[i]).toHaveTextContent(e.role)
      for (const b of e.bullets) expect(roles[i].textContent).toContain(b.slice(0, 30))
    })
  })

  it('picking a term on the timeline marks that job', () => {
    render(<App />)
    const bar = screen.getAllByRole('button', { name: /iotum/i }).find((b) => b.classList.contains('tl-bar'))!
    fireEvent.click(bar)
    expect(document.getElementById('job-iotum')).toHaveClass('on')
    expect(location.hash).toBe('#job-iotum')
  })

  it('shows every job and project with its headline result', () => {
    render(<App />)
    const rows = document.querySelectorAll('[id^="project-"]')
    expect(rows).toHaveLength(projects.length)
    projects.forEach((p, i) => {
      if (p.highlight) expect(rows[i].querySelector('.entry-result b')).toHaveTextContent(p.highlight.value)
    })
    const jobs = document.querySelectorAll('[id^="job-"]')
    experience.forEach((e, i) => {
      if (e.highlight) expect(jobs[i].querySelector('.entry-result b')).toHaveTextContent(e.highlight.value)
    })
  })

  it('links the live Battleship game and its code', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'Play it' })).toHaveAttribute('href', 'https://purolator-battleship.onrender.com')
    const code = screen.getAllByRole('link', { name: 'Code' }).map((a) => a.getAttribute('href'))
    expect(code).toContain('https://github.com/anaybaid7/battleship-purolator')
  })

  it('switches between light and dark', () => {
    setSettings({ theme: 'light' })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /dark mode/i }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(JSON.parse(localStorage.getItem('prefs')!).theme).toBe('dark')
  })

  it('lists skills by group and filters the page when one is clicked', () => {
    render(<App />)
    const list = document.querySelector('.skill-list')!
    expect(list).toHaveTextContent('Languages & frameworks')
    fireEvent.click(screen.getByRole('button', { name: 'Terraform' }))
    expect(document.getElementById('job-iotum')).toHaveClass('dim')
    expect(document.getElementById('job-purolator')).not.toHaveClass('dim')
  })

  it('opens a job from a link like #job-iotum', async () => {
    history.replaceState(null, '', '#job-iotum')
    render(<App />)
    await waitFor(() => expect(document.getElementById('job-iotum')).toHaveClass('on'))
    history.replaceState(null, '', '/')
  })

  it('answers the recruiter basics up front', () => {
    render(<App />)
    const glance = document.querySelector('.glance')!
    expect(glance).toHaveTextContent('April 2027')
    expect(glance).toHaveTextContent(`${experience.length} terms`)
    expect(glance).toHaveTextContent('2 wins')
  })

  it('copies the email address', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(profile.email)
    await waitFor(() => expect(screen.getByText(/copied .* to your clipboard/i)).toBeInTheDocument())
  })

  it('falls back to a GitHub link when the API is unreachable', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText(/couldn't load this from github/i)).toBeInTheDocument())
  })

  it('settings change the page and survive a reload', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: 'Results only', hidden: true }))
    fireEvent.click(screen.getByRole('radio', { name: 'Larger', hidden: true }))
    fireEvent.click(screen.getByRole('radio', { name: 'Green', hidden: true }))
    const root = document.documentElement.dataset
    expect([root.view, root.size, root.accent]).toEqual(['skim', 'l', 'green'])
    __resetForTests()
    expect(document.documentElement.dataset.view).toBe('skim')
  })

  it('takes settings from the URL', () => {
    history.replaceState(null, '', '/?view=skim&accent=red&size=nonsense')
    __resetForTests()
    render(<App />)
    expect(document.documentElement.dataset.view).toBe('skim')
    expect(document.documentElement.dataset.accent).toBe('red')
    expect(document.documentElement.dataset.size).toBe('m')
  })

  it('filters the page to one skill and puts it in the URL', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Terraform' }))
    expect(document.querySelector('.filterbar')).toHaveTextContent('Showing work with Terraform')
    expect(document.getElementById('job-purolator')).not.toHaveClass('dim')
    expect(document.getElementById('job-iotum')).toHaveClass('dim')
    expect(screen.getAllByRole('button', { name: /iotum/i }).find((b) => b.classList.contains('tl-bar'))).toHaveClass('dim')
    expect(new URL(location.href).searchParams.get('stack')).toBe('Terraform')
    fireEvent.click(screen.getByRole('button', { name: 'Clear filter' }))
    expect(document.getElementById('job-iotum')).not.toHaveClass('dim')
  })

  it('opens a filtered view from a shared link', () => {
    history.replaceState(null, '', '/?stack=Selenium')
    render(<App />)
    expect(document.getElementById('job-iotum')).not.toHaveClass('dim')
    expect(document.getElementById('job-purolator')).toHaveClass('dim')
  })

  it('checks a pasted job posting against the page', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Paste the job posting' }))
    fireEvent.change(screen.getByLabelText('Job posting'), {
      target: { value: 'You have 2+ years with Python and AWS, experience with k8s, and know your way around Kafka.' },
    })
    const out = document.querySelector('.match-list')!
    expect(out).toHaveTextContent('Python')
    expect(out).toHaveTextContent('AWS')
    expect(out).toHaveTextContent('Kubernetes')
    expect(out).toHaveTextContent('Kafka')
    fireEvent.click(screen.getByRole('button', { name: /show only/i }))
    expect(new URL(location.href).searchParams.get('stack')).toContain('Python')
  })

  it('single-key shortcuts work and stay out of the way while typing', () => {
    render(<App />)
    fireEvent.keyDown(document.body, { key: 's' })
    expect(document.documentElement.dataset.view).toBe('skim')
    fireEvent.keyDown(document.body, { key: 's' })
    expect(document.documentElement.dataset.view).toBe('full')
    fireEvent.keyDown(document.body, { key: '?' })
    expect(screen.getByRole('heading', { name: 'Keyboard shortcuts', hidden: true })).toBeInTheDocument()
  })

  it('opens a drawer for a project, with tabs, and keeps it in the URL', async () => {
    render(<App />)
    const row = document.getElementById('project-insightvault')!
    fireEvent.click(row.querySelector('.open-detail')!)
    const drawer = await findDrawer()
    expect(drawer).toHaveTextContent('InsightVault')
    expect(new URL(location.href).searchParams.get('open')).toBe('project-insightvault')
    expect(new URL(location.href).searchParams.get('tab')).toBe('how')
    const nodes = drawer.querySelectorAll('.arch-node')
    expect(nodes.length).toBe(DETAILS['project-insightvault'].arch.nodes.length)
    fireEvent.click(nodes[3])
    expect(drawer.querySelector('.arch-note')).toHaveTextContent(DETAILS['project-insightvault'].arch.nodes[3].note)
    fireEvent.click(screen.getByRole('tab', { name: 'Try it', hidden: true }))
    expect(drawer.querySelector('.scorer')).not.toBeNull()
    expect(new URL(location.href).searchParams.get('tab')).toBe('try')
  })

  it('moves between entries inside the drawer', async () => {
    history.replaceState(null, '', '/?open=job-purolator')
    render(<App />)
    const drawer = await findDrawer()
    expect(drawer).toHaveTextContent('Software & Network Optimization Engineer')
    fireEvent.click(drawer.querySelector('.drawer-foot button')!)
    expect(drawer.querySelector('#drawer-title')).toHaveTextContent('Iotum')
    expect(new URL(location.href).searchParams.get('open')).toBe('job-iotum')
  })

  it('shows the forecast tool screens with call-outs', async () => {
    history.replaceState(null, '', '/?open=job-purolator&tab=screens')
    render(<App />)
    const drawer = await findDrawer()
    const spots = drawer.querySelectorAll('.spot')
    expect(spots.length).toBeGreaterThan(1)
    fireEvent.click(spots[1])
    expect(spots[1]).toHaveAttribute('aria-pressed', 'true')
    expect(drawer).toHaveTextContent('Mock data')
  })

  it('opens the live game inside the page on request only', () => {
    render(<App />)
    expect(document.querySelector('.preview iframe')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Try it here' }))
    expect(document.querySelector('.preview iframe')).toHaveAttribute('src', 'https://purolator-battleship.onrender.com')
  })

  it('names a job on the timeline when you point at it', () => {
    render(<App />)
    const bar = screen.getAllByRole('button', { name: /cineplex/i }).find((b) => b.classList.contains('tl-bar'))!
    fireEvent.mouseEnter(bar)
    expect(document.querySelector('.tl-sum')).toHaveTextContent('Cineplex Entertainment, Data Engineer')
  })

  it('presets, section order and hidden sections all apply and go in the share link', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Quick scan', hidden: true }))
    const root = document.documentElement.dataset
    expect(root.view).toBe('skim')
    expect(root.lead).toBe('projects')
    expect(root.hide).toBe('github colophon')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Education', hidden: true }))
    expect(root.hide).toContain('education')
    fireEvent.click(screen.getByRole('radio', { name: /Narrow/, hidden: true }))
    expect(root.width).toBe('narrow')
  })

  it('reads hidden sections and width from a link', () => {
    history.replaceState(null, '', '/?hide=github,nonsense,skills&width=wide&lead=projects')
    __resetForTests()
    render(<App />)
    const root = document.documentElement.dataset
    expect(root.hide).toBe('skills github')
    expect(root.width).toBe('wide')
    expect(root.lead).toBe('projects')
  })

  it('plays a project flow one connection at a time', async () => {
    history.replaceState(null, '', '/?open=project-battleship-for-purolator&tab=how')
    render(<App />)
    const drawer = await findDrawer()
    const next = screen.getByRole('button', { name: 'Next step', hidden: true })
    fireEvent.click(next)
    expect(drawer.querySelector('.arch-count')).toHaveTextContent('Step 1 of')
    expect(drawer.querySelector('.arch-hop')).toHaveTextContent('Player 1 → Socket.IO')
    fireEvent.click(next)
    expect(drawer.querySelector('.arch-hop')).toHaveTextContent('Player 2 → Socket.IO')
    expect(drawer.querySelectorAll('.arch-edge.live')).toHaveLength(1)
  })

  it('has a working demo for each project that lists one', async () => {
    history.replaceState(null, '', '/?open=job-purolator&tab=try')
    render(<App />)
    const drawer = await findDrawer()
    expect(drawer.querySelector('.alloc')).not.toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Overview', hidden: true }))
    fireEvent.click(drawer.querySelector('.drawer-foot button:last-child')!)
    expect(drawer.querySelector('#drawer-title')).toHaveTextContent('Iotum')
  })

  it('shows the code behind a demo', async () => {
    history.replaceState(null, '', '/?open=job-purolator&tab=code')
    render(<App />)
    const drawer = await findDrawer()
    expect(drawer.querySelector('.code figcaption')).toHaveTextContent('allocate.ts')
    expect(drawer.querySelector('.code pre')).toHaveTextContent('export function allocate')
  })

  it('opens a terminal that drives the page', async () => {
    render(<App />)
    fireEvent.keyDown(document.body, { key: '`' })
    const input = await screen.findByRole('textbox', { name: 'Command', hidden: true })
    fireEvent.change(input, { target: { value: 'filter terraform' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(document.querySelector('.term-screen')).toHaveTextContent('showing work with Terraform')
    expect(document.getElementById('job-iotum')).toHaveClass('dim')
  })
})
