import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('renders the real photo, sized as requested', () => {
    render(<Avatar size={64} />)
    const img = screen.getByRole('img', { name: 'Anay Baid' })
    expect(img).toHaveAttribute('src', '/avatar.png')
    expect(img).toHaveAttribute('width', '64')
    expect(img).toHaveAttribute('height', '64')
  })

  it('the referenced photo file actually exists in public/', () => {
    expect(existsSync(resolve(process.cwd(), 'public/avatar.png'))).toBe(true)
  })
})
