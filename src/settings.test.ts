import { describe, it, expect, beforeEach } from 'vitest'
import { DEFAULTS, linkWithSettings, sameSettings, __resetForTests } from './settings'

describe('settings links', () => {
  beforeEach(() => {
    localStorage.clear()
    history.replaceState(null, '', '/')
    __resetForTests()
  })

  it('leave defaults out of the link', () => {
    expect(linkWithSettings(DEFAULTS)).toBe(`${location.origin}/`)
  })

  it('carry every changed setting, hidden sections included', () => {
    const url = new URL(linkWithSettings({ ...DEFAULTS, view: 'skim', width: 'narrow', hide: ['github', 'colophon'] }))
    expect(url.searchParams.get('view')).toBe('skim')
    expect(url.searchParams.get('width')).toBe('narrow')
    expect(url.searchParams.get('hide')).toBe('github,colophon')
  })

  it('compares hidden sections by value', () => {
    expect(sameSettings({ ...DEFAULTS, hide: ['github'] }, { ...DEFAULTS, hide: ['github'] })).toBe(true)
    expect(sameSettings({ ...DEFAULTS, hide: ['github'] }, DEFAULTS)).toBe(false)
  })
})
