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
      "Built and maintain the backend for the team's planning tools, with Python and PowerShell ETL jobs orchestrated as Airflow DAGs, Flask REST APIs on top, and SQL-backed state for validation and reconciliation.",
      "Containerized the forecasting workloads with Docker, storing forecast artifacts in S3 as Parquet, running inference on SageMaker, and deploying the services through ECR to ECS on Fargate.",
      "Provisioned the whole stack in Terraform, with IAM roles scoped per workload, private networking, and secrets and encryption handled through Secrets Manager and KMS.",
      "Wrote constraint-aware allocation algorithms in Python that hold network volume targets while respecting terminal capacity, which surfaces capacity bottlenecks early in planning.",
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
      "Built full-stack React reference applications that show an SDK integration end to end, giving client teams a working baseline that shortened their implementation time.",
      "Developed a browser test automation framework in JavaScript with Selenium and Mocha and wired it into the CI/CD pipeline, which made release cycles faster.",
      "Diagnosed and fixed user-facing latency issues, improving stability under high concurrency.",
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
      "Containerized legacy services with Docker and tuned TCP/IP and Layer 3 network configuration, so deployments behaved the same across environments.",
      "Automated cloud and endpoint provisioning across AWS, Azure and Intune MDM, using SQL-based validation, encrypted SSH tunneling and Java/Android tooling.",
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
      "Built real-time ETL pipelines feeding the Cineplex homepage dashboard, with automated data validation keeping box office reporting reliable.",
      "Improved the machine learning models behind showtime scheduling through cleaner input data and better model evaluation.",
      "Built Python data validation pipelines using SQL schema comparison and JUnit/Selenium test automation to reconcile Azure and on-prem data and resolve the anomalies they surfaced.",
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
      "A fraud-alert triage service for financial transactions that pairs an auditable rule engine with a trained classifier, plus a dashboard for reviewing alerts.",
    bullets: [
      "Spring Boot REST API that scores each transaction with a rule engine and a logistic regression model together, so every alert traces back to the rules and features behind it.",
      "Python training pipeline with pandas and scikit-learn, evaluated on a time-based split, that exports the model weights to a dependency-free Java inference layer to keep training and serving in parity.",
      "React and TypeScript dashboard for reviewing alerts, deployed on AWS ECS Fargate, RDS and CloudFront with Terraform.",
    ],
    tech: ['Java', 'Spring Boot', 'React', 'TypeScript', 'AWS', 'Terraform', 'Python', 'Playwright'],
    highlight: { value: '92.9%', label: 'precision on held-out transactions' },
  },
  {
    title: 'StarRez Enterprise Automation Suite',
    award: 'Approved by University IST Management',
    status: 'Shipped',
    period: 'February 2026',
    description:
      "A Chrome extension (Manifest V3) that automates logging for UWaterloo Campus Housing front desk staff.",
    bullets: [
      "Content script parses the StarRez page DOM to extract record data and populates the log entry automatically.",
      "Built around a modular workflow engine in JavaScript where each front desk task is a self-contained module, which kept the campus-wide rollout and new tasks simple.",
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
      "Node and Express server with Socket.IO for real-time play, holding room state in memory with a reconnect window so a dropped connection doesn't end the game.",
      "Invite links route straight into a room, the lobby lists open rooms, and both players negotiate the board size before placement.",
      "Touch-friendly drag and drop fleet placement, plus a password-protected reset endpoint that wakes the Render instance and clears all game state.",
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
      "A Python tool that triggers targeted builds across environments through the GitHub Actions API, built at uOttaHack 5.",
    bullets: [
      "Dispatches only the affected workflows through the GitHub Actions API instead of rebuilding the whole pipeline.",
      "Validates the target environment before dispatch and reports results over SMTP with TLS.",
    ],
    tech: ['Python', 'GitHub Actions API', 'SMTP', 'REST'],
    highlight: { value: 'Won', label: 'Best Use of GitHub at uOttaHack 5' },
    link: 'https://devpost.com/software/github-build-trigger-application',
    code: 'https://github.com/anaybaid7/GitHub-Build-Trigger-Code-UOttaHack5',
  },
  {
    title: 'Pashu (Animal Welfare Game)',
    award: 'Winner, Best Gaming Hack (Big Blue Bubble)',
    status: 'Ended',
    period: 'HackWestern 9',
    highlight: { value: 'Won', label: 'Best Gaming Hack at HackWestern 9' },
    description:
      "A browser-based Unity game about animal welfare, built by a team of three at HackWestern 9.",
    bullets: [
      "Wrote the core gameplay loop in C#, with a finite-state machine driving NPC behavior and event-driven scoring.",
      "Shipped a Unity WebGL build embedded in a Wix site so judges could play it in any browser.",
      "Compressed textures and audio to keep the WebGL bundle small and load times short.",
    ],
    code: 'https://github.com/anaybaid7/HackWestern9-ProjectPashu',
    tech: ['Unity', 'WebGL', 'C#', 'Wix'],
  },
  {
    title: 'Client-Side Routing System',
    status: 'Ended',
    period: 'Hack The North',
    highlight: { value: 'Real-time', label: 'updates over WebSockets, fewer page reloads' },
    description:
      "A full-stack React app built at Hack The North, focused on client-side navigation and real-time state.",
    bullets: [
      "Client-side routing with React Router to avoid full page reloads, with form validation through React Hook Form.",
      "Real-time updates over WebSockets, with Redux managing shared state across the app.",
    ],
    tech: ['React', 'React Router', 'Redux', 'WebSockets'],
  },
]

// Public repos shown in the Code section, with my own one-line summary.
// Language and last push are read live from GitHub.
export const repos = [
  { name: 'insight-vault', about: 'Fraud-alert triage service with a Spring Boot API, a rule engine and logistic regression model, and a React review dashboard.' },
  { name: 'battleship-purolator', about: 'Real-time two-player Battleship on Node, Express and Socket.IO, built for a Purolator intern event.' },
  { name: 'starrez-logger-prod', about: 'Manifest V3 Chrome extension that automates front desk logging in StarRez for UWaterloo Campus Housing.' },
  { name: 'GitHub-Build-Trigger-Code-UOttaHack5', about: 'Python tool that dispatches targeted GitHub Actions builds per environment. Best Use of GitHub at uOttaHack 5.' },
  { name: 'HackWestern9-ProjectPashu', about: 'Unity and C# browser game with FSM-driven NPCs, shipped as a WebGL build. Best Gaming Hack at HackWestern 9.' },
  { name: 'anay-baid-website', about: 'This site, built with React, TypeScript and Vite.' },
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
