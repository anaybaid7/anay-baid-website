import '@testing-library/jest-dom/vitest'

// jsdom has no layout, so these are no-ops in tests
Element.prototype.scrollIntoView = () => {}
window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
