export const profile = {
  name: 'Anay Baid',
  tagline: 'Honours Computer Science student at Waterloo with AI, SE and HCI specializations',
  location: 'Toronto, ON',
  status: 'Software & Network Optimization Engineer at Purolator (Co-op)',
  seeking: 'Open to New Grad Software Engineering roles starting 2027',
  gradDate: 'Expected April 2027',
  email: 'a2baid@uwaterloo.ca',
  phone: '226-899-8462',
  links: {
    github: 'https://github.com/anaybaid7',
    linkedin: 'https://linkedin.com/in/anaybaid/',
    devpost: 'https://devpost.com/anaybaid',
    site: 'https://a2baid.netlify.app',
  },
  blurb:
    "Computer Science student at Waterloo, on co-op at Purolator working on backend and data tooling for network planning.",
  // Exact GitHub repo names (case-sensitive) the Home page's live widget
  // always shows, in this order. Without this, "sort=updated" surfaces
  // whatever repo was pushed to most recently, which can just as easily be
  // a scratch interview-prep repo or a WIP demo with a placeholder
  // description as it can be real work. Add a repo's exact name here to
  // pin it; leave the array empty to fall back to "3 most recently
  // updated public repos".
  pinnedRepos: ['insight-vault', 'battleship-purolator', 'starrez-logger-prod'] as string[],
  intro: [
    "I'm a fourth-year Computer Science student at Waterloo, currently on co-op at Purolator working on internal forecasting tools and network optimization.",
    "Most of what I build starts the same way. Something at work or school is manual, slow, or annoying, and I end up automating it. That's how the StarRez extension happened, and most of what I've shipped on co-op since.",
    "Outside of work I do a handful of hackathons a year with friends, mostly for the excuse to build something end to end in a weekend without any of the usual scope creep.",
  ],
}

export type Tech = string

// The resume's own "Technical Skills" section, verbatim by category. This is
// broader than allTech below (which is only what's actually demonstrated in
// a specific experience bullet or project), so it's shown as its own block
// rather than merged into that derived list.
export const skills = {
  // "Languages & Frameworks" on the resume
  languages: ['Python', 'R', 'Java', 'C', 'C++', 'JavaScript', 'TypeScript', 'SQL', 'Kotlin', 'C#', 'React.js', 'Node.js'],
  // "Backend"
  frameworks: ['Spring Boot', 'FastAPI', 'Flask', 'REST APIs', 'Kafka', 'PostgreSQL', 'Oracle', 'MongoDB', 'Redis'],
  // "Cloud & Infra"
  devops: ['AWS', 'Azure', 'S3', 'ECS/EKS', 'Docker', 'Kubernetes', 'Terraform', 'Linux', 'Git', 'Airflow', 'Playwright'],
}

export const skillLabels = {
  languages: 'Languages & frameworks',
  frameworks: 'Backend',
  devops: 'Cloud & infra',
}

export interface ExperienceEntry {
  role: string
  org: string
  orgUrl: string
  logo: string
  period: string
  bullets: string[]
  tech: Tech[]
  // one number from the bullets above, shown in the list so it scans fast
  highlight?: { value: string; label: string }
}

export const experience: ExperienceEntry[] = [
  {
    role: 'Software & Network Optimization Engineer',
    org: 'Purolator Inc',
    orgUrl: 'https://www.purolator.com/en/services/technology-solutions',
    logo: '/logos/purolator.webp',
    period: 'May 2026 to December 2026',
    bullets: [
      "Backend for the team's planning tools, with ETL jobs in Python and PowerShell, Airflow DAGs and Flask APIs, and state and checks kept in SQL.",
      "Containerized the forecasting jobs with Docker. Outputs go to S3 as Parquet, inference runs on SageMaker, and the services run on ECS Fargate.",
      "Set up the AWS side in Terraform, with IAM per workload, private networking, Secrets Manager and KMS.",
      "Wrote allocation logic in Python that keeps network volume targets and flags capacity bottlenecks.",
    ],
    tech: ['Python', 'PowerShell', 'Flask', 'REST', 'Airflow', 'SQL', 'Docker', 'AWS S3', 'SageMaker', 'ECS/Fargate', 'Terraform'],
    highlight: { value: '10-20×', label: 'faster planning turnaround' },
  },
  {
    role: 'Software Engineer',
    org: 'Iotum Global Holdings Inc',
    orgUrl: 'https://www.iotum.com/',
    logo: '/logos/iotum.webp',
    period: 'May 2025 to August 2025',
    bullets: [
      "Built full-stack React reference apps showing how to integrate the SDK, which made client integrations faster.",
      "Built test automation in JavaScript with Selenium and Mocha, which sped up CI/CD releases.",
      "Fixed latency issues users were hitting so the app held up under heavy load.",
    ],
    tech: ['React', 'JavaScript', 'Selenium', 'Mocha', 'CI/CD'],
    highlight: { value: '85%', label: 'increase in code coverage' },
  },
  {
    role: 'DevOps Engineer',
    org: 'Nationwide Appraisals',
    orgUrl: 'https://www.tngoc.com/',
    logo: '/logos/nationwide-appraisals.webp',
    period: 'September 2024 to December 2024',
    bullets: [
      "Moved legacy services into Docker and tuned TCP/IP and Layer 3 settings for more consistent deployments.",
      "Automated cloud and device setup across AWS, Azure and Intune MDM, using SQL checks, encrypted SSH tunnels and Java/Android tooling.",
    ],
    tech: ['Docker', 'TCP/IP', 'AWS', 'Azure', 'Intune MDM', 'SQL', 'SSH', 'Java', 'Android'],
    highlight: { value: '40%', label: 'less manual setup' },
  },
  {
    role: 'Data Engineer',
    org: 'Cineplex Entertainment LP',
    orgUrl: 'https://www.cineplex.com/',
    logo: '/logos/cineplex.webp',
    period: 'January 2024 to April 2024',
    bullets: [
      "Worked on the real-time ETL pipelines behind the Cineplex homepage dashboard, with validation scripts for box office reporting.",
      "Improved the machine learning models used for showtime scheduling by cleaning up their inputs and evaluating them properly.",
      "Wrote Python validation pipelines with SQL schema comparison to reconcile Azure and on-prem data and fix what didn't match.",
    ],
    tech: ['Python', 'SQL', 'Azure', 'ETL', 'JUnit', 'Selenium'],
    highlight: { value: '10TB+', label: 'of data reconciled' },
  },
]

export interface ProjectEntry {
  title: string
  award?: string
  status: 'Live' | 'Shipped' | 'Ended'
  period: string
  description: string
  bullets: string[]
  tech: Tech[]
  link?: string
  code?: string
  highlight?: { value: string; label: string }
  image?: { src: string; alt: string; caption: string }
}

export const projects: ProjectEntry[] = [
  {
    title: 'InsightVault (Financial Fraud Detector)',
    status: 'Shipped',
    period: 'August 2026',
    description:
      "A fraud-alert triage tool for financial transactions, combining an auditable rule engine with a trained model, plus a dashboard for reviewing alerts.",
    bullets: [
      "Java/Spring Boot API that runs a rule engine and a logistic regression model together.",
      "Training pipeline in Python with pandas and scikit-learn. The weights get exported to plain Java, so the API doesn't need an ML library.",
      "React and TypeScript dashboard for reviewing alerts, deployed on AWS with Terraform.",
    ],
    tech: ['Java', 'Spring Boot', 'React', 'TypeScript', 'AWS', 'Terraform', 'Python', 'Playwright'],
    highlight: { value: '92.9%', label: 'precision on held-out transactions' },
    link: 'https://github.com/anaybaid7/insight-vault',
  },
  {
    title: 'StarRez Enterprise Automation Suite',
    award: 'Approved by University IST Management',
    status: 'Shipped',
    period: 'February 2026',
    description:
      "A browser extension that does the logging for UWaterloo Campus Housing front desk staff.",
    bullets: [
      "Reads what it needs from the StarRez page and fills in the log.",
      "Each front desk task is its own module in JavaScript, so adding one doesn't touch the rest.",
    ],
    tech: ['JavaScript', 'DOM Injection', 'Workflow Automation'],
    highlight: { value: '80%', label: 'less manual logging' },
    link: 'https://github.com/anaybaid7/starrez-logger-prod',
  },
  {
    title: 'Battleship for Purolator',
    status: 'Live',
    period: "Let's Connect, Summer 2026",
    description:
      "Two-player Battleship with Purolator delivery vehicles instead of boats, built for our summer intern event.",
    bullets: [
      "Node, Express and Socket.IO server that keeps every room in memory, with a reconnect window so a dropped connection doesn't end the game.",
      'Invite links that drop a friend straight into your room, open rooms anyone can join from the lobby, and a board size both players agree on.',
      'Drag and drop fleet placement that works on phones, and a password-locked reset that wakes the free Render server and clears every game.',
    ],
    tech: ['Node.js', 'Express', 'Socket.IO', 'Render'],
    highlight: { value: 'Live', label: 'on Render, with invite links and a lobby' },
    link: 'https://purolator-battleship.onrender.com',
    code: 'https://github.com/anaybaid7/battleship-purolator',
  },
  {
    title: 'CI/CD Build Automation Tool',
    award: 'Winner, Best Use of GitHub',
    status: 'Shipped',
    period: 'uOttaHack 5, March 2023',
    description:
      "A small Python tool for running builds across several environments from one place, built over the uOttaHack 5 weekend.",
    bullets: [
      "Python tool that uses the GitHub API to trigger targeted builds for each environment.",
      "Checks the target environment before a build starts and emails the result over secure SMTP when it finishes.",
    ],
    tech: ['Python', 'GitHub Actions API', 'SMTP', 'REST'],
    highlight: { value: 'Won', label: 'Best Use of GitHub at uOttaHack 5' },
    link: 'https://devpost.com/software/github-build-trigger-application',
  },
  {
    title: 'Pashu (Animal Welfare Game)',
    award: 'Winner, Best Gaming Hack (Big Blue Bubble)',
    status: 'Ended',
    period: 'HackWestern 9',
    highlight: { value: 'Won', label: 'Best Gaming Hack at HackWestern 9' },
    description:
      "A browser game about animal welfare, built by a team of 3 over the HackWestern 9 weekend.",
    bullets: [
      "Wrote the core gameplay loop in C#, with a finite-state machine driving NPC behavior and event-driven scoring.",
      "Embedded the Unity WebGL build in a Wix site so the judges could play it in a browser on any device.",
      "Compressed textures and audio to keep the WebGL build loading quickly.",
    ],
    tech: ['Unity', 'WebGL', 'C#', 'Wix'],
  },
  {
    title: 'Client-Side Routing System',
    status: 'Ended',
    period: 'Hack The North',
    highlight: { value: 'Real-time', label: 'updates over WebSockets, fewer page reloads' },
    description:
      "A full-stack React app built at Hack The North, focused on fast navigation and live updates.",
    bullets: [
      "Client-side routing with React Router so pages switch without a full reload, plus form validation with React Hook Form.",
      "Live updates pushed over WebSockets, with Redux keeping state in sync across the app.",
    ],
    tech: ['React', 'React Router', 'Redux', 'WebSockets'],
  },
]

export const education = {
  school: 'University of Waterloo',
  degree: 'Honours Computer Science',
  specializations: 'AI, SE and HCI Specializations, Math Minor',
  gradDate: 'Expected April 2027',
  logo: '/logos/waterloo.webp',
  highlights: [
    '100% in CS 445 (Software Requirements Specification) and CS 446 (Software Design and Architectures), and recognized for it by the Director of Software Engineering.',
  ],
}

export const allTech = Array.from(
  new Set([
    ...experience.flatMap((e) => e.tech),
    ...projects.flatMap((p) => p.tech),
  ]),
).sort()

// Fail loudly, at load time, if a hand-edit to this file broke a real
// invariant (an empty bullet list, a malformed link, a missing field) —
// see data.schema.ts for what's actually checked and why.
if (import.meta.env.DEV) {
  const { assertValidData } = await import('./data.schema')
  assertValidData({ profile, experience, projects, education, skills })
}
