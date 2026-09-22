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
    "I build full-stack tools fast and ship them to real users, from a browser extension used by 100+ campus staff to forecasting pipelines processing six figures of records a week. Currently on co-op at Purolator working on network optimization and internal tooling.",
  // Exact GitHub repo names (case-sensitive) the Home page's live widget
  // always shows, in this order. Without this, "sort=updated" surfaces
  // whatever repo was pushed to most recently, which can just as easily be
  // a scratch interview-prep repo or a WIP demo with a placeholder
  // description as it can be real work. Add a repo's exact name here to
  // pin it; leave the array empty to fall back to "3 most recently
  // updated public repos".
  pinnedRepos: ['starrez-logger-prod'] as string[],
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
  languages: ['C', 'C++', 'Python', 'JavaScript', 'TypeScript', 'Java', 'SQL', 'R', 'Kotlin', 'C#', 'HTML5', 'CSS3'],
  frameworks: ['React.js', 'Node.js', 'Express', 'Redux', 'Spring Boot', 'Django', '.NET', 'Flutter', 'TensorFlow', 'Pandas'],
  devops: ['Docker', 'Kubernetes', 'AWS', 'Azure', 'Linux', 'Git', 'CI/CD', 'Selenium', 'JUnit', 'MongoDB', 'Jira', 'Postman'],
}

export interface ExperienceEntry {
  role: string
  org: string
  orgUrl: string
  logo: string
  period: string
  bullets: string[]
  tech: Tech[]
}

export const experience: ExperienceEntry[] = [
  {
    role: 'Software & Network Optimization Engineer',
    org: 'Purolator Inc',
    orgUrl: 'https://www.purolator.com/en/services/technology-solutions',
    logo: '/logos/purolator.png',
    period: 'Spring 2026 to Present',
    bullets: [
      'Cut planning turnaround 10 to 20x and diagnostics 40% by owning backend development of Python/PowerShell ETL pipelines, Airflow DAGs, and Flask REST APIs processing 100K+ forecast records with SQL-backed state, validation, and reconciliation.',
      'Containerized forecasting workloads with Docker, using Amazon S3 and Parquet for forecast artifacts and Amazon SageMaker for managed inference, deployed via ECR/ECS/Fargate.',
      'Provisioned the Airflow to S3 to SageMaker to ECS/Fargate architecture with Terraform, IAM-scoped workloads, private networking, Secrets Manager, and KMS.',
      'Developed Python constraint-aware allocation algorithms preserving network volume targets, exposing capacity bottlenecks and supporting 10 to 15% projected throughput gains.',
    ],
    tech: ['Python', 'PowerShell', 'Flask', 'Airflow', 'Docker', 'AWS S3', 'SageMaker', 'ECS/Fargate', 'Terraform', 'SQL'],
  },
  {
    role: 'Software Engineer',
    org: 'Iotum Global Holdings Inc',
    orgUrl: 'https://www.iotum.com/',
    logo: '/logos/iotum.png',
    period: 'May 2025 to August 2025',
    bullets: [
      'Engineered full-stack React reference applications to demonstrate complex SDK integrations, increasing external developer adoption and reducing client implementation time by 30%.',
      'Architected scalable test automation frameworks using JavaScript, Selenium, and Mocha, increasing code coverage by 85% and enabling faster CI/CD release cycles.',
      'Diagnosed and resolved critical user-facing latency issues, improving application stability under high concurrency for 10,000+ users.',
    ],
    tech: ['React', 'JavaScript', 'Selenium', 'Mocha', 'CI/CD'],
  },
  {
    role: 'DevOps Engineer',
    org: 'Nationwide Appraisals',
    orgUrl: 'https://www.nationwideappraisals.com/',
    logo: '/logos/nationwide-appraisals.png',
    period: 'September 2024 to December 2024',
    bullets: [
      'Modernized legacy corporate infrastructure by containerizing services with Docker, optimizing TCP protocols and Layer 3 network configurations to reduce system latency.',
      'Secured sensitive financial data pipelines using SQL Workbench and encrypted SSH tunneling, ensuring compliance and integrity across AWS S3 and hybrid cloud environments.',
      'Orchestrated reproducible development environments for mobile testing by integrating Java 8 JDK with Android Emulators, accelerating debugging.',
      'Implemented automated device compliance via Azure Cloud and Intune MDM, reducing manual provisioning overhead by 40%.',
    ],
    tech: ['Docker', 'SQL', 'SSH', 'AWS S3', 'Java', 'Android', 'Azure', 'Intune MDM'],
  },
  {
    role: 'Data Engineer',
    org: 'Cineplex Entertainment LP',
    orgUrl: 'https://www.cineplex.com/',
    logo: '/logos/cineplex.png',
    period: 'January 2024 to April 2024',
    bullets: [
      'Engineered real-time ETL pipelines for the Cineplex Homepage Dashboard, ensuring high-availability box office reporting via automated data validation scripts.',
      'Optimized Machine Learning algorithms for show-time scheduling, improving prediction accuracy by 15% via rigorous model evaluation and input data cleansing.',
      'Built automated data governance tools using Python and SQL schema comparison, validating 10TB+ of Azure data to ensure 100% integrity.',
      'Led data quality assurance across hybrid Azure and on-prem systems, identifying and resolving 200+ anomalies with automated JUnit and Selenium test suites.',
    ],
    tech: ['Python', 'SQL', 'Azure', 'ETL', 'JUnit', 'Selenium'],
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
}

export const projects: ProjectEntry[] = [
  {
    title: 'StarRez Enterprise Automation Suite',
    award: 'Approved by University IST Management',
    status: 'Shipped',
    period: 'University of Waterloo',
    description:
      'A production-grade browser automation extension for UWaterloo Campus Housing front desk staff, deployed to 100+ users.',
    bullets: [
      'Architected a production-grade automation extension for 100+ Front Desk staff, reducing manual logging by 80% via automated DOM data extraction and processing pipelines.',
      'Designed a scalable, modular workflow engine in JavaScript, enabling campus-wide deployment approved by University IST Management, supporting high-volume student record processing with zero manual intervention.',
    ],
    tech: ['JavaScript', 'Chrome MV3', 'DOM APIs', 'Workflow Automation'],
    link: 'https://github.com/anaybaid7/starrez-logger-prod',
  },
  {
    title: 'CI/CD Build Automation Tool',
    award: 'Winner, Best Use of GitHub',
    status: 'Shipped',
    period: 'uOttaHack 5',
    description:
      'A dispatch tool that triggers targeted build pipelines via the GitHub Actions API, streamlining cross-environment deployments.',
    bullets: [
      'Developed a dispatch tool that triggers targeted build pipelines via the GitHub API, streamlining cross-environment deployments.',
      'Implemented secure SMTP notifications and environment validation in Python, enabling auditable builds.',
    ],
    tech: ['Python', 'Flask', 'GitHub Actions API', 'SMTP', 'REST'],
    link: 'https://devpost.com/software/github-build-trigger-application',
  },
  {
    title: 'Pashu (Animal Welfare Game)',
    award: 'Winner, Best Gaming Hack (Big Blue Bubble)',
    status: 'Ended',
    period: 'HackWestern 9',
    description:
      'An interactive social-impact game built with a team of 3, recognized for innovation, execution, and impact.',
    bullets: [
      'Integrated a Unity/WebGL build into a Wix site for instant cross-platform, browser-based play during judging.',
      'Architected the core gameplay loop in C# with a finite-state machine for NPC behavior and event-driven scoring.',
      'Compressed textures and audio to keep the WebGL bundle under load-time targets.',
    ],
    tech: ['Unity', 'WebGL', 'C#', 'Wix'],
  },
  {
    title: 'Driver Battle League',
    status: 'Shipped',
    period: "Let's Connect Summer 2026 Intern Event",
    description: 'A multiplayer Battleship game built for a Purolator intern event, deployed on Render.',
    bullets: [
      'Built a Socket.io backend with reconnect handling for live multiplayer state sync.',
    ],
    tech: ['Node.js', 'Socket.io', 'Render'],
  },
  {
    title: 'Client-Side Routing System',
    status: 'Ended',
    period: 'Hack The North',
    description: 'A full-stack build exploring client-side routing and real-time state.',
    bullets: [
      'Configured client-side routing with React Router to cut reloads, plus React-hook form validation for cleaner UX.',
      'Streamed real-time updates via WebSockets with Redux state handling across the stack.',
    ],
    tech: ['React', 'React Router', 'Redux', 'WebSockets'],
  },
]

export const education = {
  school: 'University of Waterloo',
  degree: 'Honours Computer Science',
  specializations: 'AI, SE and HCI Specializations, Math Minor',
  gradDate: 'Expected April 2027',
  logo: '/logos/waterloo.png',
  highlights: [
    'Achieved 100% in CS 445 (Software Requirements Specification) and CS 446 (Software Design and Architectures), recognized by the Director of Software Engineering.',
    'Delivered academic support for CS 136/136L (Algorithm Design and Data Abstraction) via CS and Math Tutoring, addressing technical queries and coordinating review sessions.',
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
