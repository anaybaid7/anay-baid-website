import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { confusion, curve, sample, timeSplit } from './evaluate'
import { walk } from './network'
import { arrivals, serve, stats } from './shift'
import { FAULTS, grid } from './heatmap'
import { outcome } from './graph'
import Evaluate from './Evaluate'
import Network from './Network'
import Shift from './Shift'
import Heatmap from './Heatmap'
import Graph from './Graph'

beforeEach(() => {
  document.documentElement.dataset.motion = 'reduced'
})
afterEach(() => {
  delete document.documentElement.dataset.motion
})

describe('evaluate', () => {
  const { train, test } = timeSplit(sample())

  it('splits by date, never mixing days', () => {
    expect(Math.max(...train.map((r) => r.day))).toBeLessThan(Math.min(...test.map((r) => r.day)))
  })

  it('counts every test row exactly once', () => {
    const c = confusion(test, 0.5)
    expect(c.tp + c.fp + c.fn + c.tn).toBe(test.length)
  })

  it('trades recall for precision as the threshold rises', () => {
    const pts = curve(test)
    expect(pts[0].recall).toBeGreaterThanOrEqual(pts.at(-1)!.recall)
    expect(pts[0].fp).toBeGreaterThan(pts.at(-1)!.fp)
  })

  it('updates the matrix when the threshold moves', () => {
    render(<Evaluate />)
    const before = screen.getByText('Reviews').nextSibling!.textContent
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0.1' } })
    expect(screen.getByText('Reviews').nextSibling!.textContent).not.toBe(before)
  })
})

describe('network', () => {
  it('has no route to the database from outside', () => {
    expect(walk('direct', 'office').at(-1)).toMatchObject({ at: 'db', ok: false })
  })

  it('stops a tunnel from outside the office range at the bastion', () => {
    expect(walk('tunnel', 'cafe').at(-1)).toMatchObject({ at: 'bastion', ok: false, rule: 'r1' })
  })

  it('reaches the database through the bastion from the office', () => {
    render(<Network />)
    fireEvent.click(screen.getByRole('button', { name: 'Open the tunnel' }))
    expect(screen.getByText('localhost:5433 now reaches the database')).toBeTruthy()
  })
})

describe('shift', () => {
  it('serves one student at a time in arrival order', () => {
    const v = serve(arrivals(10, 5), 20)
    v.slice(1).forEach((x, i) => expect(x.start).toBeGreaterThanOrEqual(v[i].end))
  })

  it('builds a line by hand that one click clears', () => {
    const t = arrivals(15, 8)
    expect(stats(serve(t, 20)).longest).toBeGreaterThan(0)
    expect(stats(serve(t, 3)).longest).toBe(0)
  })

  it('plays the rush to the end', () => {
    render(<Shift />)
    fireEvent.click(screen.getByRole('button', { name: 'Play the rush' }))
    expect(screen.getAllByText(/0 waiting/)).toHaveLength(2)
  })
})

describe('heatmap', () => {
  it('nets a midnight shift to zero across the two days', () => {
    const f = FAULTS.find((x) => x.cause === 'midnight')!
    expect(f.cells.reduce((a, [, d]) => a + d, 0)).toBe(0)
  })

  it('clears every cell once every fault is fixed', () => {
    const { g } = grid(new Set(FAULTS.map((f) => f.id)))
    expect(g.flat().every((d) => d === 0)).toBe(true)
  })

  it('drills into a cell and fixes it', () => {
    render(<Heatmap />)
    fireEvent.click(screen.getByRole('button', { name: /Theatre 7120, Feb 10/ }))
    fireEvent.click(screen.getByRole('button', { name: /Delete the duplicates/ }))
    expect(screen.getByText(`${FAULTS.length - 1} faults left`)).toBeTruthy()
  })
})

describe('graph', () => {
  it('runs only the deploy job for the chosen environment', () => {
    expect(outcome('staging', true)).toMatchObject({ dev: 'skipped', staging: 'success', production: 'skipped' })
  })

  it('stays green without a token while nothing downstream runs', () => {
    const o = outcome('production', false)
    expect(o.trigger).toBe('success')
    expect(o.build).toBe('idle')
  })

  it('shows the 401 in the steps when the token is bad', () => {
    render(<Graph />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Token valid' }))
    fireEvent.click(screen.getByRole('button', { name: 'git push origin main' }))
    expect(screen.getByText(/HTTP 401/)).toBeTruthy()
    expect(screen.getByText(/nothing was built/)).toBeTruthy()
  })
})
