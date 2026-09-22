import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('boom')
  return <div>safe content</div>
}

describe('ErrorBoundary', () => {
  // React (and this component's own componentDidCatch) both log the caught
  // error to the console by design; silence it here so the test output
  // doesn't look like a failing suite when it's actually working correctly.
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })

  it('renders a fallback instead of a blank page when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('SIGNAL LOST')).toBeInTheDocument()
    expect(screen.queryByText('safe content')).not.toBeInTheDocument()
  })

  it('logs the caught error rather than swallowing it silently', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('"TRY AGAIN" resets the boundary so a re-render can recover', () => {
    let shouldThrow = true
    function Toggle() {
      return <Bomb shouldThrow={shouldThrow} />
    }

    const { rerender } = render(
      <ErrorBoundary>
        <Toggle />
      </ErrorBoundary>,
    )
    expect(screen.getByText('SIGNAL LOST')).toBeInTheDocument()

    // Fix the underlying condition, then click reset. The boundary clears
    // its own error state, and since the next render no longer throws, the
    // real children come back instead of another fallback.
    shouldThrow = false
    fireEvent.click(screen.getByText('TRY AGAIN'))
    rerender(
      <ErrorBoundary>
        <Toggle />
      </ErrorBoundary>,
    )
    expect(screen.getByText('safe content')).toBeInTheDocument()
  })
})
