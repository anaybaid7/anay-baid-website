import { profile, education, projects, experience } from '../data'
import type { TabId } from '../App'
import Avatar from '../components/Avatar'
import GithubActivity from '../components/GithubActivity'

// Derived, not hand-typed, so these can't quietly go stale the next time a
// project or job is added to data.ts and this file doesn't get touched.
const hackathonWins = projects.filter((p) => p.award?.toLowerCase().includes('winner')).length
const coopTerms = experience.length

export default function Home({ goTo }: { goTo: (t: TabId) => void }) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div
        className="self-start flex items-center gap-2 rounded-md px-3 py-1.5 text-xs md:text-sm font-semibold"
        style={{ background: 'var(--c-hire)', color: '#1a2e1f' }}
      >
        <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: '#1a2e1f' }} />
        SEEKING NEW GRAD ROLES · 2027
      </div>

      <div className="flex gap-5 items-start">
        <div className="shrink-0 rounded-lg overflow-hidden border-2" style={{ borderColor: 'var(--line)' }}>
          <Avatar size={88} />
        </div>
        <div>
          <p className="text-lg md:text-xl leading-snug">
            Hi, I'm <span className="font-bold" style={{ color: 'var(--ink-bright)' }}>Anay</span>, a{' '}
            <span className="font-bold" style={{ color: 'var(--c-home)' }}>Computer Science student</span> from{' '}
            <span className="font-bold" style={{ color: 'var(--ink-bright)' }}>Waterloo, Ontario</span>.
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--ink-dim)' }}>
            {education.gradDate} · {profile.location}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm md:text-[15px] leading-relaxed">
        {profile.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm">
        {[
          ['School', 'University of Waterloo'],
          ['Graduation Date', 'Apr 2027'],
          ['Co-op Terms', String(coopTerms)],
          ['Hackathon Wins', String(hackathonWins)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md px-3 py-2" style={{ background: 'var(--screen-bg-2)', border: '1px solid var(--line)' }}>
            <div style={{ color: 'var(--ink-dim)' }}>{label}</div>
            <div className="mt-0.5 font-semibold" style={{ color: 'var(--ink-bright)' }}>{value}</div>
          </div>
        ))}
      </div>

      <GithubActivity />

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          onClick={() => goTo('resume')}
          className="px-4 py-2.5 rounded-md text-sm md:text-base font-bold"
          style={{ background: 'var(--c-resume)', color: '#3a2410' }}
        >
          VIEW RESUME →
        </button>
        <button
          onClick={() => goTo('projects')}
          className="px-4 py-2.5 rounded-md text-sm md:text-base font-bold border-2"
          style={{ borderColor: 'var(--c-projects)', color: 'var(--c-projects)' }}
        >
          SEE PROJECTS
        </button>
      </div>
    </div>
  )
}
