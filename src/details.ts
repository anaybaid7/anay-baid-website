// What opens when you click a job or project: an architecture diagram, and
// screens or a wireframe where there's a UI to show. Every label and figure here comes from the resume bullets, a
// project's README, or the event page's mock screenshots, nothing new.

export interface ArchNode {
  id: string
  label: string
  sub?: string
  note: string
  // position on a grid, columns left to right and rows top to bottom
  col: number
  row: number
}

export interface ArchEdge {
  from: string
  to: string
  label?: string
}

export interface ArchGroup {
  label: string
  nodes: string[]
}

export interface Architecture {
  nodes: ArchNode[]
  edges: ArchEdge[]
  groups?: ArchGroup[]
  footnote?: string
}


export type ScreenKind = 'forecast-tool' | 'insightvault' | 'starrez'

// a hands-on version of the idea behind the work, on made-up data
export type DemoKind = 'battleship' | 'allocation' | 'scorer' | 'schema' | 'build' | 'starrez'

export interface Detail {
  arch: Architecture
  screens?: ScreenKind
  demo?: DemoKind
}

export const DETAILS: Record<string, Detail> = {
  'job-purolator': {
    arch: {
      nodes: [
        { id: 'airflow', label: 'Airflow', sub: 'DAGs', col: 0, row: 0, note: 'Schedules and runs each step of the pipeline.' },
        { id: 'etl', label: 'ETL jobs', sub: 'Python, PowerShell', col: 1, row: 0, note: 'Pull in the forecast records, check them and reconcile them.' },
        { id: 'sql', label: 'SQL', sub: 'state and checks', col: 1, row: 1, note: 'Holds the pipeline state the validation and reconciliation steps use.' },
        { id: 's3', label: 'S3', sub: 'Parquet artifacts', col: 2, row: 0, note: 'Forecast artifacts are written to S3 as Parquet.' },
        { id: 'sm', label: 'SageMaker', sub: 'managed inference', col: 3, row: 0, note: 'Runs inference for the forecasting models.' },
        { id: 'api', label: 'Flask REST APIs', sub: 'Docker on ECS Fargate', col: 3, row: 1, note: 'Containerized with Docker and deployed through ECR to ECS on Fargate.' },
        { id: 'tools', label: 'Planning tools', sub: "the team's", col: 3, row: 2, note: 'What the team works in. They read from the APIs.' },
      ],
      edges: [
        { from: 'airflow', to: 'etl' },
        { from: 'etl', to: 'sql' },
        { from: 'etl', to: 's3' },
        { from: 's3', to: 'sm' },
        { from: 'sm', to: 'api' },
        { from: 'api', to: 'tools' },
      ],
      groups: [{ label: 'AWS, provisioned with Terraform', nodes: ['s3', 'sm', 'api'] }],
      footnote: 'IAM scoped per workload, private networking, Secrets Manager and KMS.',
    },
    screens: 'forecast-tool',
    demo: 'allocation',
  },
  'job-iotum': {
    arch: {
      nodes: [
        { id: 'sdk', label: 'Iotum SDK', col: 0, row: 0, note: 'The SDK the reference apps show how to integrate.' },
        { id: 'apps', label: 'Reference apps', sub: 'full-stack React', col: 1, row: 0, note: 'End to end examples of SDK integrations for client teams.' },
        { id: 'devs', label: 'Client developers', col: 2, row: 0, note: 'Use the reference apps as a starting point.' },
        { id: 'tests', label: 'Test automation', sub: 'JavaScript, Selenium, Mocha', col: 1, row: 1, note: 'Browser tests in JavaScript with Selenium and Mocha.' },
        { id: 'ci', label: 'CI/CD', sub: 'release pipeline', col: 2, row: 1, note: 'Releases got faster with the tests in the pipeline.' },
      ],
      edges: [
        { from: 'sdk', to: 'apps' },
        { from: 'apps', to: 'devs' },
        { from: 'apps', to: 'tests', label: 'tested by' },
        { from: 'tests', to: 'ci' },
      ],
    },
  },
  'job-nationwide-appraisals': {
    arch: {
      nodes: [
        { id: 'legacy', label: 'Legacy services', col: 0, row: 0, note: 'Services that ran without containers.' },
        { id: 'docker', label: 'Docker', sub: 'containers', col: 1, row: 0, note: 'Containerized, with TCP/IP and Layer 3 configuration tuned.' },
        { id: 'deploy', label: 'Deployments', sub: 'more consistent', col: 2, row: 0, note: 'The same containers across environments.' },
        { id: 'cloud', label: 'AWS, Azure', col: 0, row: 1, note: 'Cloud setup the automation covers.' },
        { id: 'prov', label: 'Setup automation', sub: 'SQL checks, SSH tunnels', col: 1, row: 1, note: 'Encrypted SSH tunnels and SQL checks, plus Java/Android tooling.' },
        { id: 'mdm', label: 'Intune MDM', sub: 'devices', col: 2, row: 1, note: 'Device setup through Intune.' },
      ],
      edges: [
        { from: 'legacy', to: 'docker' },
        { from: 'docker', to: 'deploy' },
        { from: 'cloud', to: 'prov' },
        { from: 'prov', to: 'mdm' },
      ],
    },
  },
  'job-cineplex-entertainment': {
    arch: {
      nodes: [
        { id: 'azure', label: 'Azure data', col: 0, row: 0, note: 'Cloud side of the data being reconciled.' },
        { id: 'onprem', label: 'On-prem data', col: 0, row: 1, note: 'On-prem side of the data being reconciled.' },
        { id: 'etl', label: 'ETL pipelines', sub: 'real-time', col: 1, row: 0, note: 'Feed the homepage dashboard.' },
        { id: 'val', label: 'Validation', sub: 'SQL schema compare, tests', col: 1, row: 1, note: 'Python scripts that compare schemas and flag what doesn’t match.' },
        { id: 'dash', label: 'Homepage dashboard', sub: 'box office reporting', col: 2, row: 0, note: 'Box office reporting with automated validation scripts.' },
        { id: 'ml', label: 'Showtime models', sub: 'machine learning', col: 2, row: 1, note: 'Showtime predictions, improved with cleaner inputs and better evaluation.' },
      ],
      edges: [
        { from: 'azure', to: 'etl' },
        { from: 'azure', to: 'val' },
        { from: 'onprem', to: 'val' },
        { from: 'etl', to: 'dash' },
        { from: 'val', to: 'ml', label: 'clean inputs' },
      ],
    },
    demo: 'schema',
  },
  'project-insightvault': {
    arch: {
      nodes: [
        { id: 'tx', label: 'Transactions', sub: 'time-based split', col: 0, row: 0, note: 'Split by date, so the model is tested on transactions newer than the ones it learned from.' },
        { id: 'train', label: 'Training', sub: 'pandas, scikit-learn', col: 1, row: 0, note: 'Trains the logistic regression model in Python.' },
        { id: 'weights', label: 'Weights', sub: 'exported', col: 2, row: 0, note: 'Plain weights, so the API needs no ML runtime.' },
        { id: 'api', label: 'Spring Boot API', sub: 'rules + model', col: 2, row: 1, note: 'Runs the rule engine and the model together on each transaction.' },
        { id: 'rds', label: 'RDS', sub: 'database', col: 3, row: 1, note: 'The API’s database on AWS.' },
        { id: 'dash', label: 'Review dashboard', sub: 'React, TypeScript', col: 1, row: 1, note: 'Where alerts get reviewed, served through CloudFront.' },
      ],
      edges: [
        { from: 'tx', to: 'train' },
        { from: 'train', to: 'weights' },
        { from: 'weights', to: 'api' },
        { from: 'api', to: 'rds' },
        { from: 'dash', to: 'api' },
      ],
      groups: [{ label: 'AWS: ECS Fargate, RDS, CloudFront, with Terraform', nodes: ['api', 'rds', 'dash'] }],
    },
    screens: 'insightvault',
    demo: 'scorer',
  },
  'project-starrez-enterprise-automation-suite': {
    arch: {
      nodes: [
        { id: 'staff', label: 'Front desk staff', col: 0, row: 1, note: 'Front desk staff across Campus Housing.' },
        { id: 'page', label: 'StarRez page', col: 0, row: 0, note: 'The housing system staff already work in.' },
        { id: 'ext', label: 'Extension', sub: 'reads the page', col: 1, row: 0, note: 'Extracts the data it needs from the StarRez page.' },
        { id: 'engine', label: 'Workflow engine', sub: 'JavaScript', col: 2, row: 0, note: 'Modular, so a new front desk task can be added without changing the rest.' },
        { id: 'tasks', label: 'Task modules', sub: 'pickups, labels, lockouts', col: 2, row: 1, note: 'Package pickups, package labels and key lockouts.' },
        { id: 'logs', label: 'Logs', sub: 'filled in', col: 3, row: 0, note: 'Filled in from the page instead of typed by hand.' },
      ],
      edges: [
        { from: 'staff', to: 'ext', label: 'one click' },
        { from: 'page', to: 'ext' },
        { from: 'ext', to: 'engine' },
        { from: 'engine', to: 'tasks' },
        { from: 'engine', to: 'logs' },
      ],
      footnote: 'Approved by University IST for use across Campus Housing.',
    },
    screens: 'starrez',
    demo: 'starrez',
  },
  'project-battleship-for-purolator': {
    arch: {
      nodes: [
        { id: 'p1', label: 'Player 1', sub: 'browser', col: 0, row: 0, note: 'Drag and drop placement that works on phones.' },
        { id: 'p2', label: 'Player 2', sub: 'invite link', col: 0, row: 1, note: 'Joins straight into the room from the invite link.' },
        { id: 'io', label: 'Socket.IO', sub: 'real-time', col: 1, row: 0, note: 'Shots, turns and lobby updates, with a reconnect window if a connection drops.' },
        { id: 'server', label: 'Express server', sub: 'Node', col: 2, row: 0, note: 'Serves the page, /status, /reset and the invite links.' },
        { id: 'rooms', label: 'Rooms', sub: 'in memory', col: 3, row: 0, note: 'Every active room lives in memory, no database.' },
        { id: 'board', label: 'Leaderboard', sub: 'in memory', col: 3, row: 1, note: 'Wins, losses and accuracy per callsign, cleared on reset.' },
        { id: 'reset', label: 'Reset', sub: 'password-locked', col: 1, row: 1, note: 'Wakes the free Render server and clears every game.' },
      ],
      edges: [
        { from: 'p1', to: 'io' },
        { from: 'p2', to: 'io' },
        { from: 'io', to: 'server' },
        { from: 'server', to: 'rooms' },
        { from: 'server', to: 'board' },
        { from: 'reset', to: 'server' },
      ],
      groups: [{ label: 'Render, free plan', nodes: ['server', 'rooms', 'board'] }],
    },
    demo: 'battleship',
  },
  'project-ci-cd-build-automation-tool': {
    arch: {
      nodes: [
        { id: 'tool', label: 'Python tool', col: 0, row: 0, note: 'Picks what to build and where.' },
        { id: 'check', label: 'Environment check', col: 1, row: 0, note: 'Validates the target environment before anything starts.' },
        { id: 'gh', label: 'GitHub API', col: 2, row: 0, note: 'Triggers only the targeted builds.' },
        { id: 'builds', label: 'Builds', sub: 'per environment', col: 3, row: 0, note: 'Runs for the environments that need it.' },
        { id: 'mail', label: 'Email', sub: 'secure SMTP', col: 3, row: 1, note: 'Sends the result when it finishes.' },
      ],
      edges: [
        { from: 'tool', to: 'check' },
        { from: 'check', to: 'gh' },
        { from: 'gh', to: 'builds' },
        { from: 'builds', to: 'mail' },
      ],
    },
    demo: 'build',
  },
  'project-pashu': {
    arch: {
      nodes: [
        { id: 'cs', label: 'Gameplay', sub: 'C#', col: 0, row: 0, note: 'Core loop with a finite-state machine for NPCs and event-driven scoring.' },
        { id: 'unity', label: 'Unity', col: 1, row: 0, note: 'The game engine.' },
        { id: 'webgl', label: 'WebGL build', sub: 'compressed assets', col: 2, row: 0, note: 'Textures and audio compressed to keep loading fast.' },
        { id: 'wix', label: 'Wix site', sub: 'in the browser', col: 3, row: 0, note: 'Judges played it in the browser on any device.' },
      ],
      edges: [
        { from: 'cs', to: 'unity' },
        { from: 'unity', to: 'webgl' },
        { from: 'webgl', to: 'wix' },
      ],
    },
  },
  'project-client-side-routing-system': {
    arch: {
      nodes: [
        { id: 'ws', label: 'WebSockets', sub: 'live updates', col: 0, row: 0, note: 'Pushes updates as they happen.' },
        { id: 'store', label: 'Redux store', col: 1, row: 0, note: 'Keeps state in sync across the app.' },
        { id: 'ui', label: 'React UI', col: 2, row: 0, note: 'Renders from the store.' },
        { id: 'router', label: 'React Router', sub: 'no full reloads', col: 2, row: 1, note: 'Pages switch on the client.' },
        { id: 'forms', label: 'React Hook Form', sub: 'validation', col: 1, row: 1, note: 'Form validation.' },
      ],
      edges: [
        { from: 'ws', to: 'store' },
        { from: 'store', to: 'ui' },
        { from: 'router', to: 'ui' },
        { from: 'forms', to: 'ui' },
      ],
    },
  },
}

export type Tab = 'overview' | 'how' | 'screens' | 'try'


export function tabsFor(id: string): Tab[] {
  const d = DETAILS[id]
  const tabs: Tab[] = ['overview']
  if (d?.arch) tabs.push('how')
  if (d?.screens) tabs.push('screens')
  if (d?.demo) tabs.push('try')
  return tabs
}

