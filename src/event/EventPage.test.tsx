import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EventPage from './EventPage'
import { deck, slides } from './content'
import { readFileSync, readdirSync } from 'node:fs'

// the deck's stylesheet and its components' source, read as plain text
const dir = 'src/event/'
const css = readFileSync(dir + 'event.css', 'utf8')
const sources = readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => readFileSync(dir + f, 'utf8'))
// classes styled elsewhere (the site header and footer) or only used as hooks
const shared = ['top', 'top-name', 'top-time', 'foot', 'foot-row', 'foot-links', 'deck-headline', 'tone-r']

describe('EventPage', () => {
  it('shows the notes on the first click and moves on with the second', () => {
    const { container } = render(<EventPage />)
    const slide = () => container.querySelector('.deck-slide') as HTMLElement
    expect(screen.getByRole('heading', { level: 1, name: slides[0].title })).toBeInTheDocument()
    fireEvent.click(slide())
    expect(slide()).toHaveAccessibleName('Next slide')
    fireEvent.click(slide())
    expect(screen.getByRole('heading', { level: 1, name: slides[1].title })).toBeInTheDocument()
  })

  it('has a dot for every slide', () => {
    render(<EventPage />)
    expect(screen.getAllByRole('tab')).toHaveLength(slides.length)
  })

  it('zooms into a part of a screenshot and back out', () => {
    const n = slides.findIndex((s) => s.spots?.length)
    window.location.hash = `#${n + 1}`
    const { container } = render(<EventPage />)
    fireEvent.click(screen.getByRole('button', { name: `Zoom in, ${slides[n].spots![0].title}` }))
    expect(container.querySelector('.deck-callout')).toHaveTextContent(slides[n].spots![0].text)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.deck-callout')).toBeNull()
    window.location.hash = ''
  })

  it('opens a step with its own picture', () => {
    const n = slides.findIndex((s) => s.steps?.length)
    window.location.hash = `#${n + 1}`
    const { container } = render(<EventPage />)
    const step = slides[n].steps![1]
    fireEvent.click(screen.getByRole('button', { name: new RegExp(step.label) }))
    expect(container).toHaveTextContent(step.title)
    expect(container.querySelector('.vz-svg, .vz-table')).not.toBeNull()
    window.location.hash = ''
  })

  it('walks the model slide stage by stage', () => {
    const n = slides.findIndex((s) => s.visual === 'model')
    window.location.hash = `#${n + 1}`
    const { container } = render(<EventPage />)
    const stages = slides[n].stages!
    expect(container.querySelector('.model-stages li.on')).toHaveTextContent(stages[0].title)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(stages[2].title) }))
    expect(container.querySelector('.model-stages li.on')).toHaveTextContent(stages[2].text)
    window.location.hash = ''
  })

  it('builds the scale slide up one term per click', () => {
    const n = slides.findIndex((s) => s.visual === 'scale')
    window.location.hash = `#${n + 1}`
    const { container } = render(<EventPage />)
    expect(container.querySelectorAll('.scale-sum li.on')).toHaveLength(1)
    fireEvent.keyDown(window, { key: '4' })
    expect(container.querySelectorAll('.scale-sum li.on')).toHaveLength(4)
    window.location.hash = ''
  })

  it('has a style for every class the slides use', () => {
    const used = new Set<string>()
    for (const src of sources) {
      for (const [, a, b] of src.matchAll(/className=(?:"([^"]+)"|\{`([^`]+)`\})/g)) {
        for (const c of (a ?? b).replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) if (c && !c.endsWith('-')) used.add(c)
      }
    }
    const missing = [...used].filter((c) => !shared.includes(c) && !new RegExp(`\\.${c}(?![\\w-])`).test(css))
    expect(missing).toEqual([])
  })

  it('has no full stops in any text on the slides', () => {
    const found: string[] = []
    const walk = (v: unknown, key = ''): void => {
      if (typeof v === 'string') {
        // paths and links are fine, sentences are not
        if (!['src', 'image', 'url'].includes(key) && !v.startsWith('/') && /\.(\s|$)/.test(v)) found.push(v)
      } else if (Array.isArray(v)) v.forEach((x) => walk(x, key))
      else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, k))
    }
    walk(slides)
    walk(deck)
    expect(found).toEqual([])
  })
})
