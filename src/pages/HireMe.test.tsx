import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HireMe from './HireMe'
import { profile } from '../data'

describe('HireMe — copy to clipboard', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  })

  it('copies the email to the clipboard and shows a confirmation', async () => {
    render(<HireMe />)
    fireEvent.click(screen.getByLabelText(`Copy ${profile.email} to clipboard`))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(profile.email)
    await waitFor(() => expect(screen.getAllByText('COPIED').length).toBeGreaterThan(0))
  })

  it('copies the phone number to the clipboard', async () => {
    render(<HireMe />)
    fireEvent.click(screen.getByLabelText(`Copy ${profile.phone} to clipboard`))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(profile.phone)
  })
})
