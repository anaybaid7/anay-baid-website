import { z } from 'zod'

// Runtime schema for the content in data.ts. This isn't decorative — data.ts
// is hand-edited prose (job bullets, project blurbs, links) with no compiler
// checking its *shape*, only its TypeScript types, which don't catch things
// like an empty bullet list or a link that isn't a real URL. This schema
// runs once at module load (see the `assertValidData` call at the bottom of
// data.ts) and throws a specific, readable error the moment content breaks
// a real invariant, instead of that mistake silently reaching production.

const urlString = z.url({ error: 'must be a valid absolute URL' })

// Logos are local static assets (public/logos/*.png), not absolute URLs.
const localAssetPath = z
  .string()
  .min(1)
  .refine((v) => v.startsWith('/'), { error: 'must be a root-relative path like /logos/foo.png' })

const experienceSchema = z.object({
  role: z.string().min(1),
  org: z.string().min(1),
  orgUrl: urlString,
  logo: localAssetPath,
  period: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1, 'needs at least one bullet'),
  tech: z.array(z.string().min(1)).min(1, 'needs at least one tech tag'),
})

const projectSchema = z.object({
  title: z.string().min(1),
  award: z.string().min(1).optional(),
  status: z.enum(['Live', 'Shipped', 'Ended']),
  period: z.string().min(1),
  description: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1, 'needs at least one bullet'),
  tech: z.array(z.string().min(1)).min(1, 'needs at least one tech tag'),
  link: urlString.optional(),
})

const profileSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  location: z.string().min(1),
  status: z.string().min(1),
  seeking: z.string().min(1),
  gradDate: z.string().min(1),
  email: z.email({ error: 'must be a valid email' }),
  phone: z.string().min(1),
  links: z.object({
    github: urlString,
    linkedin: urlString,
    devpost: urlString,
    site: urlString,
  }),
  blurb: z.string().min(1),
  intro: z.array(z.string().min(1)).min(1),
  pinnedRepos: z.array(z.string().min(1)),
})

const educationSchema = z.object({
  school: z.string().min(1),
  degree: z.string().min(1),
  specializations: z.string().min(1),
  gradDate: z.string().min(1),
  logo: localAssetPath,
  highlights: z.array(z.string().min(1)).min(1),
})

const skillsSchema = z.object({
  languages: z.array(z.string().min(1)).min(1),
  frameworks: z.array(z.string().min(1)).min(1),
  devops: z.array(z.string().min(1)).min(1),
})

export const dataSchema = z.object({
  profile: profileSchema,
  experience: z.array(experienceSchema).min(1),
  projects: z.array(projectSchema).min(1),
  education: educationSchema,
  skills: skillsSchema,
})

export function assertValidData(input: unknown) {
  const result = dataSchema.safeParse(input)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`data.ts failed schema validation:\n${issues}`)
  }
}
