// What opens when you click a job or project: an architecture diagram with
// named flows through it, screens where there's a UI, and hands-on demos.

export type NodeKind = 'client' | 'service' | 'store' | 'job' | 'queue' | 'cloud' | 'person' | 'file' | 'code'

export interface ArchNode {
  id: string
  label: string
  sub?: string
  kind?: NodeKind
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

// one hop in a flow: who talks to whom, what happens, and what is sent
export interface FlowStep {
  from: string
  to: string
  title: string
  detail: string
  payload?: { label: string; code: string }
}

export interface Flow {
  name: string
  summary?: string
  steps: FlowStep[]
}

export type ScreenKind = 'forecast-tool' | 'insightvault' | 'starrez'

export type DemoKind =
  | 'pipeline'
  | 'allocation'
  | 'sdk'
  | 'release'
  | 'provision'
  | 'stream'
  | 'dataval'
  | 'fraud'
  | 'scorer'
  | 'extension'
  | 'battleship'
  | 'build'
  | 'fsm'
  | 'router'

export interface Detail {
  arch: Architecture
  flows?: Flow[]
  screens?: ScreenKind
  demos?: { kind: DemoKind; name: string }[]
}

export const DETAILS: Record<string, Detail> = {
  'job-purolator': {
    arch: {
      nodes: [
        { id: 'airflow', label: 'Airflow', sub: 'Schedules the DAGs', kind: 'job', col: 0, row: 0, note: 'Runs the forecasting pipeline on a schedule. Each task is its own Python or PowerShell job, so one failure stops what depends on it and can be rerun on its own.' },
        { id: 'etl', label: 'ETL jobs', sub: 'Python, PowerShell', kind: 'job', col: 1, row: 0, note: 'Extract the weekly forecast records, validate them, and reconcile them against the state in SQL so reruns never double count.' },
        { id: 's3', label: 'S3', sub: 'Parquet, by week', kind: 'store', col: 2, row: 0, note: 'Curated data and model outputs are stored as Parquet, partitioned by year and week.' },
        { id: 'sm', label: 'SageMaker', sub: 'Inference endpoint', kind: 'service', col: 3, row: 0, note: 'Hosts the forecasting model behind a managed endpoint and returns a forecast per terminal and week.' },
        { id: 'alloc', label: 'Allocation', sub: 'Python', kind: 'code', col: 0, row: 1, note: 'Splits network volume across terminals within each terminal’s capacity and flags where capacity runs out.' },
        { id: 'sql', label: 'SQL', sub: 'State and targets', kind: 'store', col: 1, row: 1, note: 'Holds pipeline state, volume targets and terminal capacities that validation, reconciliation and allocation read from.' },
        { id: 'api', label: 'Flask REST API', sub: 'Docker on ECS Fargate', kind: 'service', col: 3, row: 1, note: 'Serves forecasts and allocations to the planning tools. Runs as a container on ECS Fargate in private subnets.' },
        { id: 'tf', label: 'Terraform', sub: 'IAM, VPC, KMS', kind: 'code', col: 0, row: 2, note: 'Declares the whole AWS setup: the ECS service, an IAM role per workload, private networking, Secrets Manager entries and KMS keys.' },
        { id: 'ecr', label: 'ECR', sub: 'Container images', kind: 'store', col: 2, row: 2, note: 'Each API version is a tagged Docker image in ECR that ECS pulls on deploy.' },
        { id: 'tools', label: 'Planning tools', sub: 'Used by the team', kind: 'client', col: 3, row: 2, note: 'The screens the team plans with. They read from the API instead of spreadsheets.' },
      ],
      edges: [
        { from: 'airflow', to: 'etl' },
        { from: 'etl', to: 's3' },
        { from: 's3', to: 'sm' },
        { from: 'etl', to: 'sql' },
        { from: 'alloc', to: 'sql' },
        { from: 'sql', to: 'api' },
        { from: 'sm', to: 'api' },
        { from: 'ecr', to: 'api' },
        { from: 'tf', to: 'api' },
        { from: 'api', to: 'tools' },
      ],
      groups: [{ label: 'AWS', nodes: ['s3', 'sm', 'api'] }],
    },
    flows: [
      {
        name: 'Weekly forecast run',
        summary: 'Raw forecast records go in at the left. Validated forecasts come out at the right as an API the planning tools read.',
        steps: [
          {
            from: 'airflow',
            to: 'etl',
            title: 'Airflow starts the run',
            detail: 'The DAG fires on schedule and runs each task in order. If validation fails, nothing downstream runs, and that one task can be retried without starting over.',
            payload: { label: 'DAG run', code: 'dag: forecast_weekly\nrun_id: scheduled__2026-10-26T06:00\ntasks: extract → validate → reconcile → write_parquet → infer → publish' },
          },
          {
            from: 'etl',
            to: 'sql',
            title: 'Validate and reconcile against SQL',
            detail: 'Every record is checked for a known terminal, a valid fiscal week and a non-negative volume, then reconciled against the state table so a rerun replaces rows instead of adding to them.',
            payload: { label: 'SQL', code: 'MERGE INTO forecast_state AS t\nUSING staging AS s\n  ON t.terminal_id = s.terminal_id AND t.fiscal_week = s.fiscal_week\nWHEN MATCHED THEN UPDATE SET volume = s.volume\nWHEN NOT MATCHED THEN INSERT VALUES (s.terminal_id, s.fiscal_week, s.volume);' },
          },
          {
            from: 'etl',
            to: 's3',
            title: 'Write clean data to S3 as Parquet',
            detail: 'Validated records are written as Parquet partitioned by year and week, so the model and any later job read only the weeks they need.',
            payload: { label: 'Object written', code: 's3://forecasting/curated/year=2026/week=43/part-0000.parquet\nterminal_id INT · fiscal_week INT · metric STRING · volume DOUBLE' },
          },
          {
            from: 's3',
            to: 'sm',
            title: 'Run inference on SageMaker',
            detail: 'The model endpoint reads the curated features and returns a forecast for each terminal over the coming weeks.',
            payload: { label: 'Request', code: 'POST /endpoints/forecast-weekly/invocations\n{ "terminal_id": 412, "weeks": [44, 45, 46, 47] }' },
          },
          {
            from: 'sm',
            to: 'api',
            title: 'Results land behind the API',
            detail: 'Forecasts are stored where the Flask API can serve them. The API is a container on ECS Fargate, reachable only from inside the network.',
            payload: { label: 'Response', code: 'GET /api/forecast?terminal=412&week=44\n200 OK\n{ "terminal": 412, "week": 44, "volume": 18240, "source": "model" }' },
          },
          {
            from: 'api',
            to: 'tools',
            title: 'The planning tools pick it up',
            detail: 'The planning screens call the API directly instead of opening exported spreadsheets, which is where the faster planning turnaround came from.',
          },
        ],
      },
      {
        name: 'Allocating volume',
        summary: 'How a week’s volume gets split across terminals without going over any terminal’s capacity.',
        steps: [
          {
            from: 'sql',
            to: 'alloc',
            title: 'Read targets and capacities',
            detail: 'The allocation job reads the network volume target for the week and each terminal’s capacity.',
            payload: { label: 'SQL', code: 'SELECT terminal_id, share, capacity\nFROM terminal_capacity\nWHERE fiscal_week = 44;' },
          },
          {
            from: 'alloc',
            to: 'sql',
            title: 'Allocate within capacity',
            detail: 'Volume is split by forecast share. Anything a full terminal can’t take moves to terminals with room, so the network total stays the same, and any shortfall is flagged as a bottleneck.',
            payload: { label: 'Result written', code: 'terminal  share  placed  capacity  status\n412       35%    3600    3600      full\n418       30%    3240    3500      ok\n431       20%    2160    2600      ok\n440       15%    1000    1000      full' },
          },
          {
            from: 'sql',
            to: 'api',
            title: 'Exposed through the API',
            detail: 'The API serves the allocation alongside the forecast, including which terminals hit capacity.',
            payload: { label: 'Response', code: 'GET /api/allocation?week=44\n{ "total": 10000, "bottlenecks": [412, 440], ... }' },
          },
          {
            from: 'api',
            to: 'tools',
            title: 'Bottlenecks show up early',
            detail: 'Planners see which terminals are at capacity before the week starts instead of finding out from the floor.',
          },
        ],
      },
      {
        name: 'Deploying a change',
        summary: 'How a new version of the API reaches production.',
        steps: [
          {
            from: 'tf',
            to: 'api',
            title: 'Infrastructure is declared in Terraform',
            detail: 'The ECS service, its task role, the private subnets, secrets and encryption keys are all in Terraform, so every environment is built the same way and changes go through review.',
            payload: { label: 'HCL', code: 'resource "aws_ecs_service" "forecast_api" {\n  cluster         = aws_ecs_cluster.main.id\n  task_definition = aws_ecs_task_definition.api.arn\n  launch_type     = "FARGATE"\n  network_configuration {\n    subnets          = var.private_subnets\n    assign_public_ip = false\n  }\n}' },
          },
          {
            from: 'ecr',
            to: 'api',
            title: 'ECS pulls the new image',
            detail: 'A new image is pushed to ECR with a version tag, and the service rolls over to it with no downtime.',
            payload: { label: 'Shell', code: 'docker build -t forecast-api:1.8.2 .\ndocker push <account>.dkr.ecr.ca-central-1.amazonaws.com/forecast-api:1.8.2' },
          },
          {
            from: 'api',
            to: 'tools',
            title: 'The new version is live',
            detail: 'Secrets are read from Secrets Manager at start-up and encrypted with KMS, so nothing sensitive lives in the image.',
          },
        ],
      },
    ],
    screens: 'forecast-tool',
    demos: [
      { kind: 'pipeline', name: 'Run the pipeline' },
      { kind: 'allocation', name: 'Allocate volume' },
    ],
  },

  'job-iotum': {
    arch: {
      nodes: [
        { id: 'devs', label: 'Client developer', kind: 'person', col: 0, row: 0, note: 'An engineer at a customer building on Iotum’s SDK.' },
        { id: 'app', label: 'Reference app', sub: 'Full-stack React', kind: 'client', col: 1, row: 0, note: 'Working React applications that show a full SDK integration, from auth to live events, so client teams start from a pattern that already works.' },
        { id: 'sdk', label: 'Iotum SDK', sub: 'JavaScript', kind: 'code', col: 2, row: 0, note: 'The client library the reference apps integrate.' },
        { id: 'platform', label: 'Platform APIs', sub: 'REST and events', kind: 'service', col: 3, row: 0, note: 'Iotum’s backend that the SDK talks to.' },
        { id: 'tests', label: 'Test suite', sub: 'Selenium, Mocha', kind: 'job', col: 1, row: 1, note: 'Browser tests that drive the apps the way a user would. This is where code coverage went up 85%.' },
        { id: 'ci', label: 'CI/CD pipeline', sub: 'Runs on every change', kind: 'job', col: 2, row: 1, note: 'Lint, unit and browser tests run on each change before anything ships.' },
        { id: 'release', label: 'Release', kind: 'cloud', col: 3, row: 1, note: 'Builds that pass go out, and failures stop before they reach users.' },
      ],
      edges: [
        { from: 'devs', to: 'app' },
        { from: 'app', to: 'sdk' },
        { from: 'sdk', to: 'platform' },
        { from: 'tests', to: 'app' },
        { from: 'tests', to: 'ci' },
        { from: 'ci', to: 'release' },
      ],
    },
    flows: [
      {
        name: 'Integrating the SDK',
        summary: 'What a client team copies from the reference app, step by step.',
        steps: [
          {
            from: 'devs',
            to: 'app',
            title: 'Start from the reference app',
            detail: 'Instead of reading docs and guessing, a client developer clones an app where auth, session setup and event handling already work.',
          },
          {
            from: 'app',
            to: 'sdk',
            title: 'Initialize the SDK',
            detail: 'The app creates one SDK client at start-up and signs in with a short-lived token from its own backend, so the API key never reaches the browser.',
            payload: { label: 'TypeScript', code: "const client = createClient({ region: 'ca' })\nawait client.auth.signIn(await fetchTokenFromBackend())" },
          },
          {
            from: 'sdk',
            to: 'platform',
            title: 'Create a session',
            detail: 'The SDK calls the platform API and returns a typed session object the app renders.',
            payload: { label: 'HTTP', code: 'POST /v1/sessions\n201 Created\n{ "id": "s_4821", "host": "user_19", "status": "open" }' },
          },
          {
            from: 'platform',
            to: 'sdk',
            title: 'Events stream back',
            detail: 'Participants joining or leaving arrive as events over a persistent connection.',
            payload: { label: 'Event', code: "client.on('participant.joined', (p) => setPeople((all) => [...all, p]))" },
          },
          {
            from: 'sdk',
            to: 'app',
            title: 'The UI updates from events',
            detail: 'React state updates from the event handlers, so the screen always matches the session without polling.',
          },
        ],
      },
      {
        name: 'Shipping a release',
        steps: [
          {
            from: 'tests',
            to: 'app',
            title: 'Selenium drives the app in a browser',
            detail: 'Each test opens the app in a real browser, clicks through a flow and asserts on what the user sees.',
            payload: { label: 'Mocha spec', code: "it('joins a session from the invite link', async () => {\n  await driver.get(`${BASE}/join/s_4821`)\n  await driver.wait(until.elementLocated(By.css('[data-test=room]')))\n})" },
          },
          {
            from: 'tests',
            to: 'ci',
            title: 'Tests run on every change',
            detail: 'The pipeline installs, lints, runs unit tests, then the browser suite. A failure blocks the merge.',
            payload: { label: 'Pipeline', code: 'install → lint → unit → e2e (selenium) → build → release' },
          },
          {
            from: 'ci',
            to: 'release',
            title: 'Green builds release',
            detail: 'With the browser suite catching regressions early, releases went out faster and with fewer rollbacks.',
          },
        ],
      },
    ],
    demos: [
      { kind: 'sdk', name: 'Integrate the SDK' },
      { kind: 'release', name: 'Run the test suite' },
    ],
  },

  'job-nationwide-appraisals': {
    arch: {
      nodes: [
        { id: 'legacy', label: 'Legacy services', kind: 'service', col: 0, row: 0, note: 'Services that used to be installed by hand on each machine.' },
        { id: 'docker', label: 'Docker image', sub: 'One build, versioned', kind: 'file', col: 1, row: 0, note: 'Each service packaged with its runtime and config into one image.' },
        { id: 'envs', label: 'Dev, staging, prod', sub: 'AWS and Azure', kind: 'cloud', col: 2, row: 0, note: 'The same image runs in every environment, with TCP/IP and Layer 3 settings tuned for the network.' },
        { id: 'devices', label: 'Laptops and phones', kind: 'client', col: 0, row: 1, note: 'Company devices that need encryption, apps and compliance settings.' },
        { id: 'intune', label: 'Intune MDM', sub: 'Policies and apps', kind: 'service', col: 1, row: 1, note: 'Enrolls devices and pushes encryption, compliance policies and apps automatically.' },
        { id: 'azure', label: 'Azure', sub: 'Identity and compliance', kind: 'cloud', col: 2, row: 1, note: 'Where devices are registered and compliance is reported.' },
        { id: 'ops', label: 'Engineer', kind: 'person', col: 0, row: 2, note: 'Runs the validation scripts.' },
        { id: 'ssh', label: 'SSH tunnel', sub: 'Encrypted', kind: 'service', col: 1, row: 2, note: 'An encrypted tunnel through a bastion host, so the database is never exposed publicly.' },
        { id: 'db', label: 'SQL database', kind: 'store', col: 2, row: 2, note: 'Checked with SQL validation queries after each change.' },
      ],
      edges: [
        { from: 'legacy', to: 'docker' },
        { from: 'docker', to: 'envs' },
        { from: 'devices', to: 'intune' },
        { from: 'intune', to: 'azure' },
        { from: 'ops', to: 'ssh' },
        { from: 'ssh', to: 'db' },
      ],
    },
    flows: [
      {
        name: 'Containerizing a service',
        steps: [
          {
            from: 'legacy',
            to: 'docker',
            title: 'Package the service with its runtime',
            detail: 'The service, its dependencies and config go into one image, so there is nothing left to install by hand.',
            payload: { label: 'Dockerfile', code: 'FROM eclipse-temurin:17-jre\nCOPY build/app.jar /app/app.jar\nEXPOSE 8080\nCMD ["java", "-jar", "/app/app.jar"]' },
          },
          {
            from: 'docker',
            to: 'envs',
            title: 'The same image runs everywhere',
            detail: 'Dev, staging and prod pull the exact same image digest, so a deployment behaves the same in each.',
            payload: { label: 'Shell', code: 'docker pull registry/appraisal-api@sha256:4f1c…\ndocker run -d -p 8080:8080 registry/appraisal-api@sha256:4f1c…' },
          },
        ],
      },
      {
        name: 'Enrolling a device',
        steps: [
          {
            from: 'devices',
            to: 'intune',
            title: 'The device enrolls',
            detail: 'A new laptop or phone signs in with a work account and enrolls in Intune.',
          },
          {
            from: 'intune',
            to: 'devices',
            title: 'Policies and apps are pushed',
            detail: 'Disk encryption, a password policy and the required apps are applied without anyone touching the device.',
            payload: { label: 'Policy', code: 'BitLocker: required\nMinimum password length: 12\nRequired apps: Company Portal, Outlook, VPN client' },
          },
          {
            from: 'intune',
            to: 'azure',
            title: 'Compliance is reported',
            detail: 'Azure marks the device compliant, which is what lets it reach company resources.',
          },
        ],
      },
      {
        name: 'Validating data over SSH',
        steps: [
          {
            from: 'ops',
            to: 'ssh',
            title: 'Open an encrypted tunnel',
            detail: 'The database only accepts connections from inside the network, so checks run through an SSH tunnel to a bastion host.',
            payload: { label: 'Shell', code: 'ssh -N -L 5433:db.internal:5432 ops@bastion' },
          },
          {
            from: 'ssh',
            to: 'db',
            title: 'Run the validation queries',
            detail: 'SQL checks confirm the data is complete and consistent after each change.',
            payload: { label: 'SQL', code: 'SELECT COUNT(*) AS missing_owner\nFROM appraisals\nWHERE owner_id IS NULL;' },
          },
        ],
      },
    ],
    demos: [{ kind: 'provision', name: 'Provision a device' }],
  },

  'job-cineplex-entertainment': {
    arch: {
      nodes: [
        { id: 'box', label: 'Box office', sub: 'Ticket sales', kind: 'store', col: 0, row: 0, note: 'Sales from theatres, arriving through the day.' },
        { id: 'etl', label: 'Real-time ETL', sub: 'Python', kind: 'job', col: 1, row: 0, note: 'Pulls sales as they happen and shapes them for reporting.' },
        { id: 'checks', label: 'Validation scripts', kind: 'code', col: 2, row: 0, note: 'Reject or flag rows that would break the dashboard before they reach it.' },
        { id: 'dash', label: 'Homepage dashboard', kind: 'client', col: 3, row: 0, note: 'Box office reporting that the business watches through the day.' },
        { id: 'azure', label: 'Azure copy', kind: 'store', col: 0, row: 1, note: 'The cloud copy of the data.' },
        { id: 'recon', label: 'Reconciliation', sub: 'Python, SQL', kind: 'code', col: 1, row: 1, note: 'Compares schemas and row counts between the two copies and lists every mismatch.' },
        { id: 'tests', label: 'Test automation', sub: 'JUnit, Selenium', kind: 'job', col: 2, row: 1, note: 'Runs the checks as tests so they repeat on every load.' },
        { id: 'ml', label: 'Showtime models', kind: 'service', col: 3, row: 1, note: 'Scheduling models that train on the reconciled data.' },
        { id: 'onprem', label: 'On-prem copy', kind: 'store', col: 0, row: 2, note: 'The on-prem copy of the same data.' },
      ],
      edges: [
        { from: 'box', to: 'etl' },
        { from: 'etl', to: 'checks' },
        { from: 'checks', to: 'dash' },
        { from: 'azure', to: 'recon' },
        { from: 'onprem', to: 'recon' },
        { from: 'recon', to: 'tests' },
        { from: 'tests', to: 'ml' },
      ],
    },
    flows: [
      {
        name: 'Sales to the dashboard',
        steps: [
          {
            from: 'box',
            to: 'etl',
            title: 'A sale comes in',
            detail: 'Each ticket sale arrives as a small record with the theatre, showtime and amount.',
            payload: { label: 'Record', code: '{ "theatre": 7104, "show_id": 88213, "tickets": 3, "gross": 41.85, "ts": "2024-02-17T19:42:10Z" }' },
          },
          {
            from: 'etl',
            to: 'checks',
            title: 'Validate before it’s shown',
            detail: 'Rows with a missing showtime, a negative amount or a duplicate ID are held back and logged instead of skewing the totals.',
            payload: { label: 'Python', code: 'if row.gross < 0 or row.show_id is None or row.id in seen:\n    quarantine(row)\nelse:\n    publish(row)' },
          },
          {
            from: 'checks',
            to: 'dash',
            title: 'The dashboard updates',
            detail: 'Clean totals flow into the homepage dashboard through the day.',
          },
        ],
      },
      {
        name: 'Reconciling two copies',
        summary: 'Checking that the Azure and on-prem copies of the same data actually match.',
        steps: [
          {
            from: 'azure',
            to: 'recon',
            title: 'Read the Azure schema and counts',
            detail: 'Column names, types and row counts come straight from the database catalog.',
            payload: { label: 'SQL', code: "SELECT column_name, data_type\nFROM information_schema.columns\nWHERE table_name = 'box_office';" },
          },
          {
            from: 'onprem',
            to: 'recon',
            title: 'Read the on-prem side the same way',
            detail: 'Same query on the other copy, then the two are compared column by column.',
          },
          {
            from: 'recon',
            to: 'tests',
            title: 'Mismatches become test failures',
            detail: 'Missing columns, type drift and row count gaps are reported as failing tests, so they get fixed instead of ignored.',
            payload: { label: 'Report', code: 'FAIL  screen_id missing on-prem\nFAIL  show_date DATE vs VARCHAR(10)\nFAIL  row count differs by 13' },
          },
          {
            from: 'tests',
            to: 'ml',
            title: 'Clean data feeds the models',
            detail: 'Once everything passes, the showtime models train on data both sides agree on.',
          },
        ],
      },
    ],
    demos: [
      { kind: 'stream', name: 'Stream sales' },
      { kind: 'dataval', name: 'Reconcile two copies' },
    ],
  },

  'project-insightvault': {
    arch: {
      nodes: [
        { id: 'history', label: 'Transaction history', kind: 'store', col: 0, row: 0, note: 'Labelled past transactions used for training.' },
        { id: 'train', label: 'Training pipeline', sub: 'pandas, scikit-learn', kind: 'job', col: 1, row: 0, note: 'Builds features and trains a logistic regression model, evaluated on later transactions than it learned from.' },
        { id: 'weights', label: 'Model weights', sub: 'Exported file', kind: 'file', col: 2, row: 0, note: 'The trained coefficients exported as plain data, so the API can score without an ML library.' },
        { id: 'incoming', label: 'New transaction', kind: 'client', col: 0, row: 1, note: 'A transaction arriving for scoring.' },
        { id: 'rules', label: 'Rule engine', sub: 'Auditable rules', kind: 'code', col: 1, row: 1, note: 'Readable rules that catch known patterns and explain themselves.' },
        { id: 'api', label: 'Spring Boot API', sub: 'Rules and model', kind: 'service', col: 2, row: 1, note: 'Scores each transaction with the rules and the model together and records why.' },
        { id: 'rds', label: 'RDS', sub: 'Alerts and decisions', kind: 'store', col: 3, row: 1, note: 'Stores alerts, the reasons behind them and each review decision.' },
        { id: 'dash', label: 'Review dashboard', sub: 'React on CloudFront', kind: 'client', col: 2, row: 2, note: 'Where alerts are reviewed and confirmed or dismissed.' },
      ],
      edges: [
        { from: 'history', to: 'train' },
        { from: 'train', to: 'weights' },
        { from: 'weights', to: 'api' },
        { from: 'incoming', to: 'rules' },
        { from: 'rules', to: 'api' },
        { from: 'api', to: 'rds' },
        { from: 'api', to: 'dash' },
      ],
      groups: [{ label: 'AWS, with Terraform', nodes: ['api', 'rds', 'dash'] }],
    },
    flows: [
      {
        name: 'Scoring a transaction',
        steps: [
          {
            from: 'incoming',
            to: 'rules',
            title: 'A transaction arrives',
            detail: 'The API receives the transaction and runs the rule engine first.',
            payload: { label: 'Request', code: 'POST /api/transactions/score\n{ "id": "tx_90211", "amount": 2840.00, "merchant_new": true, "country": "PT", "card_country": "CA" }' },
          },
          {
            from: 'rules',
            to: 'api',
            title: 'Rules and model score it together',
            detail: 'Readable rules catch known patterns, and the logistic regression model scores everything else. Either one can raise an alert.',
            payload: { label: 'Result', code: '{ "rules_fired": ["abroad_new_merchant", "amount_over_2500"],\n  "model_score": 0.87, "threshold": 0.5, "alert": true }' },
          },
          {
            from: 'api',
            to: 'rds',
            title: 'The alert is stored with its reasons',
            detail: 'Each alert keeps the rules that fired and each feature’s contribution, so every decision can be explained later.',
            payload: { label: 'SQL', code: "INSERT INTO alerts (tx_id, score, rules, contributions, status)\nVALUES ('tx_90211', 0.87, '{abroad_new_merchant,amount_over_2500}', '{...}', 'open');" },
          },
          {
            from: 'api',
            to: 'dash',
            title: 'It shows up for review',
            detail: 'The dashboard lists open alerts with the reasons next to each one.',
          },
        ],
      },
      {
        name: 'Training the model',
        steps: [
          {
            from: 'history',
            to: 'train',
            title: 'Split by date, not at random',
            detail: 'Training uses older transactions and evaluation uses newer ones, which is how the model would actually be used.',
            payload: { label: 'Python', code: "cutoff = df.ts.quantile(0.8)\ntrain, test = df[df.ts < cutoff], df[df.ts >= cutoff]\nmodel = LogisticRegression(max_iter=1000).fit(train[X], train.fraud)" },
          },
          {
            from: 'train',
            to: 'weights',
            title: 'Export the weights',
            detail: 'The coefficients and feature order are written as plain data.',
            payload: { label: 'weights.json', code: '{ "features": ["amount", "night", "merchant_new", "abroad", "velocity"],\n  "coef": [0.0011, 1.1, 1.4, 1.9, 0.4], "intercept": -4.2 }' },
          },
          {
            from: 'weights',
            to: 'api',
            title: 'The Java API loads them',
            detail: 'The API computes the same score in plain Java, and a parity test checks it matches Python on the same inputs.',
          },
        ],
      },
      {
        name: 'Reviewing an alert',
        steps: [
          {
            from: 'dash',
            to: 'api',
            title: 'A reviewer makes a call',
            detail: 'Confirming or dismissing an alert sends the decision back to the API.',
            payload: { label: 'Request', code: 'PATCH /api/alerts/al_3310\n{ "status": "confirmed" }' },
          },
          {
            from: 'api',
            to: 'rds',
            title: 'The decision is recorded',
            detail: 'Decisions are stored next to the alert, which is the labelled data for the next round of training.',
          },
        ],
      },
    ],
    screens: 'insightvault',
    demos: [
      { kind: 'fraud', name: 'Live alert queue' },
      { kind: 'scorer', name: 'Score one transaction' },
    ],
  },

  'project-starrez-enterprise-automation-suite': {
    arch: {
      nodes: [
        { id: 'page', label: 'StarRez page', sub: 'Resident record', kind: 'client', col: 0, row: 0, note: 'The housing system front desk staff already work in.' },
        { id: 'cs', label: 'Content script', sub: 'Reads the DOM', kind: 'code', col: 1, row: 0, note: 'Runs on StarRez pages and reads the fields it needs straight from the page.' },
        { id: 'sw', label: 'Service worker', sub: 'MV3 background', kind: 'service', col: 2, row: 0, note: 'The extension’s background process. Routes messages and stores settings.' },
        { id: 'staff', label: 'Front desk staff', kind: 'person', col: 0, row: 1, note: 'Picks the task and checks the entry before saving.' },
        { id: 'engine', label: 'Workflow engine', sub: 'JavaScript', kind: 'code', col: 1, row: 1, note: 'Matches the page to a task and runs that task’s steps in order.' },
        { id: 'tasks', label: 'Task modules', sub: 'Pickups, labels, lockouts', kind: 'code', col: 2, row: 1, note: 'Each front desk task is a self-contained module with its own fields and checks.' },
        { id: 'log', label: 'Log entry', kind: 'file', col: 3, row: 1, note: 'The filled-in log, ready to save.' },
      ],
      edges: [
        { from: 'page', to: 'cs' },
        { from: 'cs', to: 'sw' },
        { from: 'staff', to: 'engine' },
        { from: 'cs', to: 'engine' },
        { from: 'engine', to: 'tasks' },
        { from: 'tasks', to: 'log' },
      ],
      groups: [{ label: 'Chrome extension, Manifest V3', nodes: ['cs', 'sw', 'engine', 'tasks'] }],
      footnote: 'Approved by University IST for use across Campus Housing.',
    },
    flows: [
      {
        name: 'Logging a package pickup',
        steps: [
          {
            from: 'staff',
            to: 'engine',
            title: 'Staff pick the task',
            detail: 'With a resident’s record open, staff choose Package pickup from the extension.',
          },
          {
            from: 'page',
            to: 'cs',
            title: 'The content script reads the page',
            detail: 'It reads the resident’s name, room, student number and waiting packages straight from the record, so nothing is retyped.',
            payload: { label: 'JavaScript', code: "const read = (label) =>\n  [...document.querySelectorAll('.field')]\n    .find((f) => f.querySelector('label')?.textContent === label)\n    ?.querySelector('.value')?.textContent.trim()\n\nconst record = { name: read('Resident'), room: read('Room'), id: read('Student #') }" },
          },
          {
            from: 'cs',
            to: 'engine',
            title: 'The record goes to the workflow engine',
            detail: 'The engine matches the page and task to a module and passes the record along.',
            payload: { label: 'Message', code: "{ task: 'package-pickup', record: { name: 'Sam Lee', room: 'V1 South 305', id: '20871234', packages: 2 } }" },
          },
          {
            from: 'engine',
            to: 'tasks',
            title: 'The pickup module runs its steps',
            detail: 'Validate the record, format the fields the log expects, and stop with a clear message if something is missing.',
            payload: { label: 'Module', code: "export default {\n  id: 'package-pickup',\n  fields: ['name', 'room', 'id', 'packages'],\n  validate: (r) => r.packages > 0 || 'No packages waiting',\n}" },
          },
          {
            from: 'tasks',
            to: 'log',
            title: 'The log fills itself in',
            detail: 'Staff check the filled entry and save. That replaced most of the typing, which is where the 80% came from.',
          },
        ],
      },
      {
        name: 'Adding a new task',
        steps: [
          {
            from: 'engine',
            to: 'tasks',
            title: 'A new module registers itself',
            detail: 'Adding a front desk task means writing one module with its fields and checks. The engine and the other tasks stay untouched.',
            payload: { label: 'Module', code: "register({\n  id: 'key-lockout',\n  fields: ['name', 'room', 'id', 'keyType'],\n  validate: (r) => Boolean(r.keyType) || 'Pick a key type',\n})" },
          },
          {
            from: 'cs',
            to: 'sw',
            title: 'Settings sync through the service worker',
            detail: 'The background service worker stores which tasks are enabled, so every front desk computer behaves the same.',
            payload: { label: 'JavaScript', code: "chrome.storage.sync.set({ enabledTasks: ['package-pickup', 'package-label', 'key-lockout'] })" },
          },
        ],
      },
    ],
    screens: 'starrez',
    demos: [{ kind: 'extension', name: 'Run the extension' }],
  },

  'project-battleship-for-purolator': {
    arch: {
      nodes: [
        { id: 'p1', label: 'Player 1', sub: 'Browser', kind: 'client', col: 0, row: 0, note: 'Creates a room and shares the invite link.' },
        { id: 'io', label: 'Socket.IO', sub: 'WebSocket events', kind: 'queue', col: 1, row: 0, note: 'Carries every shot, turn change and lobby update in real time, with a reconnect window for dropped connections.' },
        { id: 'server', label: 'Express server', sub: 'Node', kind: 'service', col: 2, row: 0, note: 'Validates every move, serves the page, the invite links, /status and /reset.' },
        { id: 'rooms', label: 'Rooms', sub: 'In memory', kind: 'store', col: 3, row: 0, note: 'Each room’s boards, turn and shot history live in memory, no database needed.' },
        { id: 'p2', label: 'Player 2', sub: 'Invite link', kind: 'client', col: 0, row: 1, note: 'Joins straight into the room from the invite link.' },
        { id: 'reset', label: 'Reset', sub: 'Password protected', kind: 'person', col: 2, row: 1, note: 'Wakes the free Render instance and clears every game.' },
        { id: 'rank', label: 'Rankings', sub: 'In memory', kind: 'store', col: 3, row: 1, note: 'Wins, losses and accuracy per callsign.' },
      ],
      edges: [
        { from: 'p1', to: 'io' },
        { from: 'p2', to: 'io' },
        { from: 'io', to: 'server' },
        { from: 'server', to: 'rooms' },
        { from: 'server', to: 'rank' },
        { from: 'reset', to: 'server' },
      ],
      groups: [{ label: 'Render', nodes: ['server', 'rooms', 'reset', 'rank'] }],
    },
    flows: [
      {
        name: 'A shot is fired',
        steps: [
          {
            from: 'p1',
            to: 'io',
            title: 'Player 1 fires',
            detail: 'Clicking a cell emits a single event with the room and the cell.',
            payload: { label: 'Client', code: "socket.emit('fire', { room: 'K7QX2', cell: 'D4' })" },
          },
          {
            from: 'io',
            to: 'server',
            title: 'The server checks the move',
            detail: 'It confirms it is this player’s turn and the cell hasn’t been fired at, so a modified client can’t cheat.',
            payload: { label: 'Server', code: "socket.on('fire', ({ room, cell }) => {\n  const game = rooms.get(room)\n  if (game.turn !== socket.id || game.shots.has(cell)) return\n  const result = game.fire(cell)\n  io.to(room).emit('shot', result)\n})" },
          },
          {
            from: 'server',
            to: 'rooms',
            title: 'The room’s state updates',
            detail: 'The shot, hit or miss, any sunk vehicle and the next turn are written to the room in memory.',
            payload: { label: 'State', code: "{ shots: [..., 'D4'], hits: 7, sunk: ['Scooter'], turn: 'player2' }" },
          },
          {
            from: 'io',
            to: 'p2',
            title: 'Both players see it at once',
            detail: 'The result is broadcast to everyone in the room, so both screens update together.',
            payload: { label: 'Broadcast', code: "{ cell: 'D4', hit: true, sunk: 'Scooter', next: 'player2' }" },
          },
        ],
      },
      {
        name: 'Joining by invite link',
        steps: [
          {
            from: 'p1',
            to: 'io',
            title: 'Player 1 creates a room',
            detail: 'The server makes a short room code and returns an invite link.',
            payload: { label: 'Client', code: "socket.emit('create-room', { callsign: 'Anay' })\n// → { room: 'K7QX2', link: '/K7QX2' }" },
          },
          {
            from: 'p2',
            to: 'io',
            title: 'Player 2 opens the link',
            detail: 'The invite link route serves the page with the room code, and the client joins on connect.',
            payload: { label: 'Client', code: "GET /K7QX2\nsocket.emit('join-room', 'K7QX2')" },
          },
          {
            from: 'io',
            to: 'server',
            title: 'Both agree on a board size',
            detail: 'Either player can propose a size from 6x6 to 15x15, the other accepts, and it locks once a fleet is placed.',
          },
        ],
      },
      {
        name: 'Reconnect and reset',
        steps: [
          {
            from: 'p2',
            to: 'io',
            title: 'A connection drops and comes back',
            detail: 'The server holds the player’s seat for a short window, so refreshing or a flaky connection doesn’t end the game.',
            payload: { label: 'Server', code: "socket.on('disconnect', () => {\n  game.hold(socket.id, 30_000)\n})" },
          },
          {
            from: 'reset',
            to: 'server',
            title: 'Reset wakes and clears the server',
            detail: 'The reset button pings the free Render instance until it answers, then clears every game and sends open tabs back to the start.',
            payload: { label: 'Request', code: 'POST /reset\nx-reset-key: ••••••\n204 No Content' },
          },
          {
            from: 'server',
            to: 'rooms',
            title: 'Rooms and rankings clear',
            detail: 'Everything lives in memory, so a reset is a clean slate for the next event.',
          },
        ],
      },
    ],
    demos: [{ kind: 'battleship', name: 'Play a round' }],
  },

  'project-ci-cd-build-automation-tool': {
    arch: {
      nodes: [
        { id: 'dev', label: 'Developer', kind: 'person', col: 0, row: 0, note: 'Runs the tool with a target environment.' },
        { id: 'tool', label: 'Build trigger', sub: 'Python CLI', kind: 'code', col: 1, row: 0, note: 'Works out what changed, checks the environment and dispatches only the builds that need to run.' },
        { id: 'gh', label: 'GitHub Actions API', kind: 'service', col: 2, row: 0, note: 'Receives a workflow dispatch for each service that needs building.' },
        { id: 'wf', label: 'Workflows', sub: 'One per service', kind: 'job', col: 3, row: 0, note: 'Each service’s build and deploy workflow.' },
        { id: 'checks', label: 'Environment checks', kind: 'job', col: 1, row: 1, note: 'Confirms the environment exists, secrets are set and the branch is allowed to deploy there.' },
        { id: 'smtp', label: 'SMTP', sub: 'TLS', kind: 'service', col: 2, row: 1, note: 'Sends the summary email when the run finishes.' },
        { id: 'team', label: 'Team inbox', kind: 'person', col: 3, row: 1, note: 'Gets one email per run with what built and what didn’t.' },
      ],
      edges: [
        { from: 'dev', to: 'tool' },
        { from: 'tool', to: 'checks' },
        { from: 'tool', to: 'gh' },
        { from: 'gh', to: 'wf' },
        { from: 'tool', to: 'smtp' },
        { from: 'smtp', to: 'team' },
      ],
    },
    flows: [
      {
        name: 'A targeted build',
        steps: [
          {
            from: 'dev',
            to: 'tool',
            title: 'Run it with a target',
            detail: 'The developer points the tool at an environment. It diffs against the last build to see which services changed.',
            payload: { label: 'Shell', code: '$ build-trigger --env staging\nchanged: api/, web/' },
          },
          {
            from: 'tool',
            to: 'checks',
            title: 'Check the environment first',
            detail: 'Nothing is dispatched until the environment exists, its secrets are set and the branch may deploy there.',
            payload: { label: 'Checks', code: 'environment staging ......... ok\nsecrets API_KEY, DB_URL ..... ok\nbranch main → staging ....... allowed' },
          },
          {
            from: 'tool',
            to: 'gh',
            title: 'Dispatch only what changed',
            detail: 'One workflow dispatch per changed service. Unchanged services are skipped instead of rebuilt.',
            payload: { label: 'HTTP', code: 'POST /repos/{owner}/{repo}/actions/workflows/api.yml/dispatches\n{ "ref": "main", "inputs": { "env": "staging" } }\n204 No Content' },
          },
          {
            from: 'gh',
            to: 'wf',
            title: 'The workflows run',
            detail: 'GitHub runs each service’s workflow. The tool polls their status until they finish.',
          },
          {
            from: 'tool',
            to: 'smtp',
            title: 'Results are emailed',
            detail: 'One summary goes out over SMTP with TLS: what built, what was skipped and links to each run.',
            payload: { label: 'Email', code: 'Subject: staging build, 2 of 4 services\napi    success   1m 42s\nweb    success   2m 05s\nworker skipped   no changes\ndocs   skipped   no changes' },
          },
          {
            from: 'smtp',
            to: 'team',
            title: 'The team sees it',
            detail: 'Everyone gets the same summary, without anyone watching the Actions tab.',
          },
        ],
      },
    ],
    demos: [{ kind: 'build', name: 'Trigger a build' }],
  },

  'project-pashu': {
    arch: {
      nodes: [
        { id: 'player', label: 'Player', kind: 'person', col: 0, row: 0, note: 'Looks after the animals in the game.' },
        { id: 'loop', label: 'Game loop', sub: 'C#', kind: 'code', col: 1, row: 0, note: 'Reads input every frame, updates the world and fires gameplay events.' },
        { id: 'fsm', label: 'NPC state machine', kind: 'code', col: 2, row: 0, note: 'Each animal is always in one state, and events move it between states.' },
        { id: 'score', label: 'Scoring', sub: 'Event-driven', kind: 'code', col: 3, row: 0, note: 'Listens for gameplay events and updates the score, instead of checking every frame.' },
        { id: 'unity', label: 'Unity', kind: 'service', col: 1, row: 1, note: 'The engine the game is built in.' },
        { id: 'webgl', label: 'WebGL build', sub: 'Compressed assets', kind: 'file', col: 2, row: 1, note: 'Textures and audio compressed to keep the download small.' },
        { id: 'wix', label: 'Wix site', kind: 'client', col: 3, row: 1, note: 'Where judges played it in the browser.' },
      ],
      edges: [
        { from: 'player', to: 'loop' },
        { from: 'loop', to: 'fsm' },
        { from: 'fsm', to: 'score' },
        { from: 'unity', to: 'webgl' },
        { from: 'webgl', to: 'wix' },
      ],
    },
    flows: [
      {
        name: 'A moment of gameplay',
        steps: [
          {
            from: 'player',
            to: 'loop',
            title: 'The player acts',
            detail: 'Feeding or approaching an animal is read as input in the game loop.',
          },
          {
            from: 'loop',
            to: 'fsm',
            title: 'An event changes the animal’s state',
            detail: 'The state machine handles the event, for example moving a hungry animal to eating.',
            payload: { label: 'C#', code: 'switch (state) {\n  case State.Hungry when evt == Event.Fed:\n    state = State.Eating; break;\n  case State.Wandering when evt == Event.PlayerNear:\n    state = State.Following; break;\n}' },
          },
          {
            from: 'fsm',
            to: 'score',
            title: 'Scoring reacts to the event',
            detail: 'The score listens for state changes, so scoring rules live in one place.',
            payload: { label: 'C#', code: 'OnStateChanged += (from, to) => { if (to == State.Eating) score += 10; };' },
          },
        ],
      },
      {
        name: 'Shipping to the browser',
        steps: [
          {
            from: 'unity',
            to: 'webgl',
            title: 'Build for WebGL',
            detail: 'Textures and audio are compressed so the build loads quickly over a hackathon network.',
          },
          {
            from: 'webgl',
            to: 'wix',
            title: 'Embed it on the site',
            detail: 'The build is embedded in a Wix page, so judges could play it on any device without installing anything.',
          },
        ],
      },
    ],
    demos: [{ kind: 'fsm', name: 'Play with the NPC' }],
  },

  'project-client-side-routing-system': {
    arch: {
      nodes: [
        { id: 'user', label: 'User', kind: 'person', col: 0, row: 0, note: 'Clicks around the app.' },
        { id: 'router', label: 'React Router', kind: 'code', col: 1, row: 0, note: 'Matches the URL to a view and swaps it in without a page reload.' },
        { id: 'views', label: 'Views', sub: 'React', kind: 'client', col: 2, row: 0, note: 'Render from the store and re-render when it changes.' },
        { id: 'forms', label: 'React Hook Form', kind: 'code', col: 1, row: 1, note: 'Validates input as you type and only submits when it passes.' },
        { id: 'store', label: 'Redux store', kind: 'store', col: 2, row: 1, note: 'One shared state for the whole app.' },
        { id: 'ws', label: 'WebSocket server', kind: 'service', col: 3, row: 1, note: 'Pushes updates the moment they happen.' },
      ],
      edges: [
        { from: 'user', to: 'router' },
        { from: 'router', to: 'views' },
        { from: 'forms', to: 'store' },
        { from: 'ws', to: 'store' },
        { from: 'store', to: 'views' },
      ],
    },
    flows: [
      {
        name: 'Navigating',
        steps: [
          {
            from: 'user',
            to: 'router',
            title: 'A link is clicked',
            detail: 'The router intercepts the click and updates the URL with the History API instead of asking the server for a new page.',
            payload: { label: 'TSX', code: '<Link to="/events/42">Event 42</Link>' },
          },
          {
            from: 'router',
            to: 'views',
            title: 'Only the view changes',
            detail: 'The matching route renders, and everything else on the page stays put.',
            payload: { label: 'TSX', code: '<Route path="/events/:id" element={<Event />} />' },
          },
        ],
      },
      {
        name: 'A live update',
        steps: [
          {
            from: 'ws',
            to: 'store',
            title: 'A message arrives',
            detail: 'The socket handler dispatches an action, and the store updates.',
            payload: { label: 'TypeScript', code: "socket.onmessage = (m) => dispatch({ type: 'events/updated', payload: JSON.parse(m.data) })" },
          },
          {
            from: 'store',
            to: 'views',
            title: 'Subscribed views re-render',
            detail: 'Only components reading that part of the state update.',
          },
        ],
      },
      {
        name: 'Submitting a form',
        steps: [
          {
            from: 'forms',
            to: 'store',
            title: 'Valid input is dispatched',
            detail: 'Errors show inline as you type, and only valid data reaches the store.',
            payload: { label: 'TSX', code: "<input {...register('email', { required: true, pattern: /@/ })} />" },
          },
        ],
      },
    ],
    demos: [{ kind: 'router', name: 'Use the app' }],
  },
}

export type Tab = 'overview' | 'how' | 'screens' | 'try' | 'code'

export function tabsFor(id: string): Tab[] {
  const d = DETAILS[id]
  const tabs: Tab[] = ['overview']
  if (d?.arch) tabs.push('how')
  if (d?.screens) tabs.push('screens')
  if (d?.demos?.length) tabs.push('try')
  if (d?.demos?.some((x) => CODE_KINDS.includes(x.kind))) tabs.push('code')
  return tabs
}

// demos whose logic lives in its own module and shows in the Code tab
export const CODE_KINDS: DemoKind[] = ['pipeline', 'allocation', 'stream', 'dataval', 'fraud', 'scorer', 'extension', 'battleship', 'build', 'fsm', 'router']
