import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { allocate } from './allocate'
import Allocation from './Allocation'
import FraudScorer from './FraudScorer'
import PipelineRun from './PipelineRun'
import Reconcile from './Reconcile'
import DispatchRun from './DispatchRun'
import Extension from './Extension'
import BattleshipMatch from './BattleshipMatch'
import Shelter from './Shelter'
import RouterApp from './RouterApp'
import ReleaseRun from './ReleaseRun'
import SdkRun from './SdkRun'
import Provision from './Provision'

// every timed demo runs its steps at once with reduced motion
beforeEach(() => {
  document.documentElement.dataset.motion = 'reduced'
})
afterEach(() => {
  delete document.documentElement.dataset.motion
})

describe('allocate', () => {
  const sites = [
    { name: 'A', share: 50, capacity: 1000 },
    { name: 'B', share: 30, capacity: 5000 },
    { name: 'C', share: 20, capacity: 5000 },
  ]

  it('splits by share when everything fits', () => {
    expect(allocate(1000, sites).placed).toEqual([500, 300, 200])
  })

  it('moves overflow from a full site to the others and keeps the total', () => {
    const r = allocate(4000, sites)
    expect(r.placed[0]).toBe(1000)
    expect(r.capped[0]).toBe(true)
    expect(r.placed.reduce((a, b) => a + b, 0)).toBe(4000)
    expect(r.placed[1] / r.placed[2]).toBeCloseTo(1.5, 1)
  })

  it('reports what does not fit anywhere', () => {
    const r = allocate(20000, sites)
    expect(r.short).toBe(20000 - 11000)
    expect(r.capped.every(Boolean)).toBe(true)
  })
})

describe('demos', () => {
  it('allocation flags a terminal at capacity', () => {
    render(<Allocation />)
    fireEvent.change(screen.getByLabelText('Terminal C capacity'), { target: { value: '1500' } })
    expect(document.querySelector('.demo-out')).toHaveTextContent('Terminal A, Terminal B and Terminal C are at capacity')
    fireEvent.change(screen.getByLabelText('Terminal C capacity'), { target: { value: '500' } })
    expect(document.querySelector('.demo-out')).toHaveTextContent("300 parcels don't fit anywhere")
  })

  it('scorer alerts when a hard rule fires', () => {
    render(<FraudScorer />)
    expect(document.querySelector('.verdict')).toHaveTextContent('Passes')
    fireEvent.click(screen.getByLabelText(/New merchant/))
    fireEvent.click(screen.getByLabelText(/Different country/))
    expect(document.querySelector('.verdict')).toHaveTextContent('Alert')
  })

  it('pipeline fails on a bad record, then clears and retries the same run', () => {
    render(<PipelineRun />)
    fireEvent.click(screen.getByLabelText('Add a bad record to the export'))
    fireEvent.click(screen.getByRole('button', { name: 'Trigger a run' }))
    fireEvent.click(screen.getByRole('button', { name: 'validate, run 1' }))
    expect(document.querySelector('.log')).toHaveTextContent('unknown terminal 999')
    fireEvent.click(screen.getByRole('button', { name: 'Fix the record, clear validate' }))
    expect(screen.getByText('try 2')).toBeInTheDocument()
    expect(document.querySelector('.pipe-facts')).toHaveTextContent('success')
    expect(document.querySelector('.pipe-facts')).toHaveTextContent('4 rows')
  })

  it('reconcile needs every fix and a rerun before it goes green', () => {
    render(<Reconcile />)
    fireEvent.click(screen.getByRole('button', { name: 'Run the check' }))
    expect(document.querySelector('.findings')).toHaveTextContent('screen_id is missing on-prem')
    for (const b of screen.getAllByRole('button', { name: 'Apply fix' })) fireEvent.click(b)
    expect(screen.getByText(/Run the check again to confirm/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Run it again' }))
    expect(screen.getByText(/Both copies match/)).toBeInTheDocument()
  })

  it('build trigger stops on a missing variable, and builds only the matching environment', () => {
    render(<DispatchRun />)
    fireEvent.click(screen.getByRole('button', { name: 'Run the action' }))
    expect(document.querySelector('.wf.s-success')).toHaveTextContent('staging')
    expect(document.querySelector('.email')).toHaveTextContent('anaybaid7/planner-app/refs/heads/main/staging')
    fireEvent.change(screen.getByLabelText('GITHUB_REPO_NAME'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Run the action' }))
    expect(document.querySelector('.log')).toHaveTextContent('GITHUB_REPO_NAME is missing')
  })

  it('extension reads the profile and copies a formatted entry', () => {
    render(<Extension />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy 2 pkgs' }))
    expect(document.querySelector('.sr-list')).toHaveTextContent('S.L (20871234) V1S-305a 2 pkgs @ 3:42 pm - A.B')
    fireEvent.click(screen.getByRole('button', { name: 'Copy Lockout' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copy entry' }))
    expect(document.querySelector('.sr-list')).toHaveTextContent('KC: L0932; locked out after class - A.B')
    fireEvent.click(screen.getByLabelText(/No keys on file/))
    fireEvent.click(screen.getByRole('button', { name: 'Copy Lockout' }))
    fireEvent.click(screen.getByRole('button', { name: 'Copy entry' }))
    expect(document.querySelector('.log')).toHaveTextContent('No loaner keys found')
  })

  it('battleship sends the real socket events for a shot and the reply', () => {
    render(<BattleshipMatch />)
    fireEvent.click(screen.getByRole('button', { name: 'Random' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lock in routes' }))
    expect(document.querySelector('.log')).toHaveTextContent('placement_confirmed')
    fireEvent.click(screen.getByRole('button', { name: 'A1' }))
    expect(document.querySelector('.log')).toHaveTextContent('emit fire { index: 0 }')
    expect(document.querySelector('.log')).toHaveTextContent('shot_result { index: 0')
    expect(document.querySelector('.log')).toHaveTextContent('nextTurn: "you"')
  })

  it('shelter animals go for food and score when they eat', () => {
    render(<Shelter />)
    for (let i = 0; i < 12; i++) fireEvent.click(screen.getByRole('button', { name: 'Advance one tick' }))
    expect(document.querySelector('.log')).toHaveTextContent('goToFood')
    expect(document.querySelector('.log')).toHaveTextContent('XP')
  })

  it('routing app navigates without a reload and validates the form', () => {
    render(<RouterApp />)
    fireEvent.click(screen.getByRole('button', { name: 'New event' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }))
    expect(screen.getByText('Title is required')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^Title/), { target: { value: 'Demo day' } })
    fireEvent.change(screen.getByLabelText(/^Organizer email/), { target: { value: 'a@b.co' } })
    fireEvent.change(screen.getByLabelText(/^Seats/), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create event' }))
    expect(document.querySelector('.frame-url')).toHaveTextContent('app.local/events/43')
    expect(document.querySelector('.rf-event')).toHaveTextContent('Demo day')
    expect(document.querySelector('.rf-foot')).toHaveTextContent('Page loads 1')
  })

  it('release pipeline blocks on a failing browser spec', () => {
    render(<ReleaseRun />)
    fireEvent.click(screen.getByLabelText(/Introduce a regression/))
    fireEvent.click(screen.getByRole('button', { name: 'Run the pipeline' }))
    expect(document.querySelector('.log')).toHaveTextContent('release blocked')
  })

  it('sdk demo joins through the real widget events and handles blocked cookies', () => {
    render(<SdkRun />)
    fireEvent.click(screen.getByRole('button', { name: 'Join' }))
    expect(document.querySelector('.log')).toHaveTextContent('room.READY')
    expect(document.querySelectorAll('.tile')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Someone joins' }))
    expect(document.querySelectorAll('.tile')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Chat message' }))
    expect(screen.getByLabelText('2 unread')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/Safari/))
    fireEvent.click(screen.getByRole('button', { name: 'Rejoin' }))
    expect(screen.getByText('Allow the meeting to use cookies')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }))
    expect(document.querySelectorAll('.tile')).toHaveLength(1)
  })

  it('provisioning shows a device become compliant', () => {
    render(<Provision />)
    fireEvent.click(screen.getByRole('button', { name: 'Enroll the laptop' }))
    expect(document.querySelector('.laptop')).toHaveTextContent('Compliant')
    fireEvent.click(screen.getByRole('button', { name: 'Turn off encryption' }))
    expect(document.querySelector('.laptop')).toHaveTextContent('Not compliant')
  })
})

describe('fleet setup', () => {
  it('places a vehicle, rotates it, and checks the fleet like the server does', async () => {
    const { validPlacement, cellsAt } = await import('../../battleship')
    expect(cellsAt(6, 3, true)).toBeNull()
    expect(cellsAt(0, 3, false)).toEqual([0, 8, 16])
    expect(validPlacement([{ name: 'x', cells: [0, 1] }])).toMatch(/need 5/)
    render(<BattleshipMatch />)
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'A1' }))
    fireEvent.click(screen.getByRole('button', { name: 'A1' }))
    expect(screen.getByText('Manifest, 1 of 5')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /A1, Air Freighter, click to rotate/ }))
    expect(screen.getByRole('button', { name: /A2, Air Freighter/ })).toBeInTheDocument()
  })
})
