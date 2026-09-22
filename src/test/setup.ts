import '@testing-library/jest-dom/vitest'

// jsdom has no real Web Audio implementation — stub just enough of the
// AudioContext surface that useChiptune doesn't throw in tests that
// exercise the PLAY button.
class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  createOscillator() {
    return {
      type: 'square',
      frequency: { value: 0 },
      connect: () => {},
      start: () => {},
      stop: () => {},
    }
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    }
  }
  resume() {}
}

// @ts-expect-error — partial mock, sufficient for tests
window.AudioContext = MockAudioContext

// jsdom has no ResizeObserver, which cmdk (the command palette) uses
// internally to measure list height. A no-op stub is enough for tests —
// nothing here asserts on layout measurements.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = MockResizeObserver

// jsdom doesn't implement scrollIntoView either, which cmdk calls when
// keyboard/pointer selection moves between items.
Element.prototype.scrollIntoView = () => {}
