import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { allocate } from './allocate'
import Allocation from './Allocation'
import FraudScorer from './FraudScorer'
import PipelineRun from './PipelineRun'
import Reconcile from './Reconcile'
import TargetedBuild from './TargetedBuild'
import Extension from './Extension'
import BattleshipMatch from './BattleshipMatch'
import NpcFsm from './NpcFsm'
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

  it('build trigger dispatches only changed services and blocks a feature branch on prod', () => {
    render(<TargetedBuild />)
    fireEvent.click(screen.getByRole('button', { name: 'Run build-trigger' }))
    expect(document.querySelector('.email')).toHaveTextContent('2 of 4 services')
    fireEvent.click(screen.getByLabelText('prod'))
    fireEvent.click(screen.getByLabelText('feature/login'))
    fireEvent.click(screen.getByRole('button', { name: 'Run build-trigger' }))
    expect(document.querySelector('.email')).toHaveTextContent('build blocked')
  })

  it('extension reads the page and fills the log', () => {
    render(<Extension />)
    fireEvent.click(screen.getByRole('button', { name: 'Run package pickup' }))
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('.sr-field input'))
    expect(inputs.every((i) => i.value.length > 0)).toBe(true)
    expect(document.querySelector('.log')).toHaveTextContent('read "Room" → V1 South 305')
  })

  it('battleship refuses a shot out of turn', () => {
    render(<BattleshipMatch />)
    fireEvent.click(screen.getByRole('button', { name: 'A1' }))
    expect(document.querySelector('.log')).toHaveTextContent('emit fire { room: "K7QX2", cell: "A1" }')
    expect(document.querySelector('.log')).toHaveTextContent('broadcast turn { next: "you" }')
  })

  it('state machine ignores events that do not apply', () => {
    render(<NpcFsm />)
    fireEvent.click(screen.getByRole('button', { name: 'Fed' }))
    expect(document.querySelector('.log')).toHaveTextContent('Fed ignored in Wandering')
    fireEvent.click(screen.getByRole('button', { name: 'PlayerNear' }))
    expect(document.querySelector('.fsm-now b')).toHaveTextContent('Following')
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

  it('sdk demo walks the integration and reacts to live events', () => {
    render(<SdkRun />)
    fireEvent.click(screen.getByRole('button', { name: 'Run the app' }))
    expect(document.querySelector('.log')).toHaveTextContent('POST /v1/sessions 201')
    fireEvent.click(screen.getByRole('button', { name: 'Someone joins' }))
    expect(document.querySelector('.sdk-people')).toHaveTextContent('Priya')
  })

  it('provisioning shows a device become compliant', () => {
    render(<Provision />)
    fireEvent.click(screen.getByRole('button', { name: 'Enroll the laptop' }))
    expect(document.querySelector('.laptop')).toHaveTextContent('Compliant')
    fireEvent.click(screen.getByRole('button', { name: 'Turn off encryption' }))
    expect(document.querySelector('.laptop')).toHaveTextContent('Not compliant')
  })
})
