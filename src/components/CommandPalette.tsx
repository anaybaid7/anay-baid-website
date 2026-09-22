import { Command } from 'cmdk'
import { profile } from '../data'
import type { TabId } from '../App'

// A real Cmd/Ctrl+K command palette, built on cmdk (the same fuzzy-match
// command-menu primitive behind Linear, Vercel and Raycast's web surfaces).
// It's wired to the same selectTab function the tab bar uses, so it isn't a
// decorative overlay — it drives the actual app. Open state is owned by the
// parent (App) since both the global ⌘K shortcut and the visible "COMMANDS"
// button in the status bar need to trigger it.
export default function CommandPalette({
  open,
  onOpenChange,
  goTo,
  onDownload,
  onToggleMusic,
  musicPlaying,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  goTo: (id: TabId) => void
  onDownload: () => void
  onToggleMusic: () => void
  musicPlaying: boolean
}) {
  const run = (fn: () => void) => {
    onOpenChange(false)
    fn()
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      className="cmdk-root"
      overlayClassName="cmdk-overlay"
      contentClassName="cmdk-content"
    >
      <div className="cmdk-header">
        <Command.Input autoFocus placeholder="Type a command or search…" className="cmdk-input" />
        <kbd className="cmdk-esc">ESC</kbd>
      </div>
      <Command.List className="cmdk-list">
        <Command.Empty className="cmdk-empty">No matching command.</Command.Empty>

        <Command.Group heading="Navigate" className="cmdk-group">
          <Command.Item onSelect={() => run(() => goTo('home'))} className="cmdk-item" keywords={['start', 'about']}>
            <span className="cmdk-dot" style={{ background: 'var(--c-home)' }} /> Go to Home
          </Command.Item>
          <Command.Item onSelect={() => run(() => goTo('resume'))} className="cmdk-item" keywords={['cv', 'experience', 'work']}>
            <span className="cmdk-dot" style={{ background: 'var(--c-resume)' }} /> Go to Resume
          </Command.Item>
          <Command.Item onSelect={() => run(() => goTo('projects'))} className="cmdk-item" keywords={['portfolio', 'hackathons']}>
            <span className="cmdk-dot" style={{ background: 'var(--c-projects)' }} /> Go to Projects
          </Command.Item>
          <Command.Item onSelect={() => run(() => goTo('hire'))} className="cmdk-item" keywords={['contact', 'email']}>
            <span className="cmdk-dot" style={{ background: 'var(--c-hire)' }} /> Go to Hire Me
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Actions" className="cmdk-group">
          <Command.Item onSelect={() => run(onDownload)} className="cmdk-item" keywords={['pdf', 'cv', 'resume']}>
            ↓ Download resume PDF
          </Command.Item>
          <Command.Item
            onSelect={() => run(() => window.open(`mailto:${profile.email}`, '_self'))}
            className="cmdk-item"
            keywords={['contact', 'mail']}
          >
            ✉ Email me
          </Command.Item>
          <Command.Item onSelect={() => run(onToggleMusic)} className="cmdk-item" keywords={['audio', 'sound', 'chiptune']}>
            {musicPlaying ? '■ Stop music' : '▶ Play music'}
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Links" className="cmdk-group">
          <Command.Item onSelect={() => run(() => window.open(profile.links.github, '_blank', 'noreferrer'))} className="cmdk-item">
            ↗ Open GitHub
          </Command.Item>
          <Command.Item onSelect={() => run(() => window.open(profile.links.linkedin, '_blank', 'noreferrer'))} className="cmdk-item">
            ↗ Open LinkedIn
          </Command.Item>
          <Command.Item onSelect={() => run(() => window.open(profile.links.devpost, '_blank', 'noreferrer'))} className="cmdk-item">
            ↗ Open Devpost
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}
