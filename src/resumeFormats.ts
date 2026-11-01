// Every format the resume is published in, built from data.ts. Used by the
// page and by the build (vite.config.ts), so nothing here touches the DOM.
import { education, experience, profile, projects, hackathonWins, skills, skillLabels } from './data'
import { parsePeriod } from './timeline'


const [first, last] = profile.name.split(' ')

// a contact card phones and mail apps can import in one tap
export function vcard() {
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1')
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(last)};${esc(first)};;;`,
    `FN:${esc(profile.name)}`,
    `TITLE:${esc(experience[0].role)}`,
    `ORG:${esc(education.school)}`,
    `EMAIL;TYPE=INTERNET:${profile.email}`,
    `TEL;TYPE=CELL:${profile.phone}`,
    `ADR;TYPE=HOME:;;;Toronto;ON;;Canada`,
    `URL:${profile.links.site}`,
    `URL:${profile.links.github}`,
    `URL:${profile.links.linkedin}`,
    'END:VCARD',
    '',
  ].join('\r\n')
}


// ISO dates for JSON Resume, worked out from the same periods the page shows
function isoRange(period: string) {
  const span = parsePeriod(period)
  if (!span) return {}
  const iso = (m: number) => `${Math.floor(m / 12) + 2000}-${String((m % 12) + 1).padStart(2, '0')}`
  return { startDate: iso(span.start), endDate: iso(span.end) }
}

// the resume in the JSON Resume format (jsonresume.org), so it can be fed
// into an ATS, a resume theme, or a script without retyping anything
export function jsonResume() {
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: profile.name,
      label: experience[0].role,
      email: profile.email,
      phone: profile.phone,
      url: profile.links.site,
      location: { city: 'Toronto', region: 'ON', countryCode: 'CA' },
      profiles: [
        { network: 'GitHub', username: 'anaybaid7', url: profile.links.github },
        { network: 'LinkedIn', username: 'anaybaid', url: profile.links.linkedin },
        { network: 'Devpost', username: 'anaybaid', url: profile.links.devpost },
      ],
    },
    work: experience.map((e) => ({
      name: e.org,
      position: e.role,
      url: e.orgUrl,
      ...isoRange(e.period),
      summary: e.highlight ? `${e.highlight.value} ${e.highlight.label}` : undefined,
      highlights: e.bullets,
    })),
    education: [
      {
        institution: education.school,
        area: 'Computer Science',
        studyType: education.degree,
        endDate: '2027-04',
        courses: ['CS 445 Software Requirements Specification', 'CS 446 Software Design and Architectures'],
      },
    ],
    awards: hackathonWins.map((w) => ({ title: w.title, awarder: w.event, summary: w.project })),
    skills: (Object.keys(skills) as (keyof typeof skills)[]).map((k) => ({ name: skillLabels[k], keywords: skills[k] })),
    projects: projects.map((p) => ({
      name: p.title,
      description: p.description,
      highlights: p.bullets,
      keywords: p.tech,
      url: p.link ?? p.code,
    })),
  }
}


const wrap = (text: string, width = 78, indent = '  ') => {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > width - indent.length) {
      lines.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  return lines.map((l, i) => (i === 0 ? `${indent.slice(0, -2)}- ${l}` : `${indent}${l}`)).join('\n')
}

// wraps a line at 80 columns, continuing under the first word after the label
const hang = (text: string, indent = '  ', width = 80) => {
  const lead = text.match(/^ */)![0]
  const lines: string[] = []
  let line = lead
  for (const word of text.trimStart().split(' ')) {
    if (line.trim() && (line + ' ' + word).length > width) {
      lines.push(line)
      line = indent + word
    } else line = line.trim() ? `${line} ${word}` : line + word
  }
  return [...lines, line].join('\n')
}

const rule = (title: string) => `${title}\n${'-'.repeat(title.length)}`

// the whole resume as plain text, for applicant tracking systems, screen
// readers, email, or `curl https://a2baid.netlify.app/resume.txt`
export function plainText() {
  const out: string[] = []
  out.push(profile.name, `${profile.email}  ${profile.phone}  Toronto, Ontario`, `${profile.links.site}  ${profile.links.github}`, profile.links.linkedin, '')
  out.push(rule('Education'), `${education.school}, ${education.degree}, ${education.gradDate.replace('Expected ', 'graduating ')}`, education.specializations)
  for (const h of education.highlights) out.push(wrap(h))
  out.push('', rule('Experience'))
  for (const e of experience) {
    out.push('', `${e.role}, ${e.org}`, e.period)
    for (const b of e.bullets) out.push(wrap(b))
    out.push(hang(`  Tech: ${e.tech.join(', ')}`, '        '))
  }
  out.push('', rule('Projects'))
  for (const p of projects) {
    out.push('', p.award ? `${p.title}, ${p.award}` : p.title, p.period)
    for (const b of p.bullets) out.push(wrap(b))
    out.push(hang(`  Tech: ${p.tech.join(', ')}`, '        '))
    if (p.link) out.push(`  ${p.link}`)
  }
  out.push('', rule('Skills'))
  for (const k of Object.keys(skills) as (keyof typeof skills)[]) out.push(hang(`${skillLabels[k]}: ${skills[k].join(', ')}`))
  return out.join('\n') + '\n'
}

// schema.org data for search engines, from the same file as everything else
export function personLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: profile.links.site,
    email: `mailto:${profile.email}`,
    jobTitle: experience[0].role,
    worksFor: { '@type': 'Organization', name: experience[0].org, url: experience[0].orgUrl },
    alumniOf: { '@type': 'CollegeOrUniversity', name: education.school },
    address: { '@type': 'PostalAddress', addressLocality: 'Toronto', addressRegion: 'ON', addressCountry: 'CA' },
    knowsAbout: [...skills.languages, ...skills.frameworks, ...skills.devops],
    sameAs: [profile.links.github, profile.links.linkedin, profile.links.devpost],
  }
}
