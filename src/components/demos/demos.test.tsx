import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { allocate } from './allocate'
import Allocation from './Allocation'
import FraudScorer from './FraudScorer'
import SchemaCheck from './SchemaCheck'
import TargetedBuild from './TargetedBuild'
import StarrezFill from './StarrezFill'

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
    expect(document.querySelector('.demo-out')).toHaveTextContent('All 10,000 placed')
    fireEvent.change(screen.getByLabelText('Terminal C capacity'), { target: { value: '500' } })
    expect(document.querySelector('.demo-out')).toHaveTextContent("300 parcels don't fit anywhere")
  })

  it('scorer alerts when a hard rule fires', () => {
    render(<FraudScorer />)
    expect(document.querySelector('.verdict')).toHaveTextContent('Passes')
    fireEvent.click(screen.getByLabelText(/New merchant/))
    fireEvent.click(screen.getByLabelText(/Different country/))
    expect(document.querySelector('.verdict')).toHaveTextContent('Alert')
    expect(document.querySelector('.rules')).toHaveTextContent('Abroad at a new merchant')
  })

  it('schema check finds every mismatch', () => {
    document.documentElement.dataset.motion = 'reduced'
    render(<SchemaCheck />)
    fireEvent.click(screen.getByRole('button', { name: 'Run the check' }))
    const out = document.querySelector('.findings')!
    expect(out).toHaveTextContent('screen_id is missing on-prem')
    expect(out).toHaveTextContent('show_date is DATE in Azure but VARCHAR(10) on-prem')
    expect(out).toHaveTextContent('Row counts differ by 13')
    delete document.documentElement.dataset.motion
  })

  it('targeted build only triggers what changed', () => {
    document.documentElement.dataset.motion = 'reduced'
    render(<TargetedBuild />)
    fireEvent.click(screen.getByRole('button', { name: 'Run' }))
    const term = document.querySelector('.term')!
    expect(term).toHaveTextContent('triggering 2 of 4 builds')
    expect(term).toHaveTextContent('skipped worker, docs')
    delete document.documentElement.dataset.motion
  })

  it('StarRez fill copies every field from the page in one click', () => {
    render(<StarrezFill />)
    fireEvent.click(screen.getByRole('button', { name: 'Fill from the page' }))
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('.sr-field input'))
    expect(inputs.every((i) => i.value.length > 0)).toBe(true)
  })
})
