import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MiniBattleship from './MiniBattleship'
import { FLEET, placeFleet } from '../battleship'

describe('mini battleship', () => {
  it('places the whole fleet on the board without overlaps', () => {
    for (let seed = 1; seed < 50; seed++) {
      let x = seed
      const rand = () => ((x = (x * 9301 + 49297) % 233280) / 233280)
      const ships = placeFleet(rand)
      const cells = ships.flatMap((s) => s.cells)
      expect(ships.map((s) => s.cells.length)).toEqual(FLEET.map((f) => f.size))
      expect(new Set(cells).size).toBe(cells.length)
      for (const c of cells) expect(c >= 0 && c < 64).toBe(true)
    }
  })

  it('counts shots and reports a miss or a hit', () => {
    render(<MiniBattleship />)
    fireEvent.click(screen.getByRole('button', { name: 'A1' }))
    expect(screen.getByText(/1 shot,/)).toBeInTheDocument()
    expect(screen.getByText(/A1, (miss|hit|sank)/)).toBeInTheDocument()
  })
})
