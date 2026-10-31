import { NOTES } from './decisions'

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

export type ScreenKind = 'forecast-tool' | 'insightvault' | 'starrez' | 'battleship' | 'pashu' | 'iotum' | 'nationwide' | 'cineplex' | 'cicd' | 'routing'

export type DemoKind =
  | 'pipeline'
  | 'planner'
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
  | 'evaluate'
  | 'network'
  | 'shift'
  | 'heatmap'
  | 'graph'
  | 'observer'
  | 'drift'
  | 'showtime'
  | 'sequence'
  | 'terraform'

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
        name: 'Adjusting a forecast',
        summary: 'What happens when a planner changes a number in the forecast tool.',
        steps: [
          {
            from: 'tools',
            to: 'api',
            title: 'A planner raises Cyber week',
            detail: 'Operations run one after another on the current value, and each week keeps a stack of its previous values so Revert steps back one at a time. Changing Total scales PCL and Agent by the same ratio, so the parts always add back to it.',
            payload: { label: 'ratio_split.js', code: 'const ratio = newTotal / oldTotal\nreturn { overrideA: pcl * ratio, overrideB: agent * ratio }\n// pcl*r + agent*r = oldTotal*r = newTotal' },
          },
          {
            from: 'api',
            to: 'sql',
            title: 'The week is split into days',
            detail: 'Each weekday gets a share of the week. Shares are rounded to two decimals with the last day taking the remainder, and saving is refused unless they add to 100%.',
            payload: { label: 'Request', code: 'POST /api/save_daily_dist\n{ "week": 48, "terminal": "412", "metric": "PCL.Del.Pcs.N",\n  "days": [{ "wd": 1, "pct": 0.4 }, { "wd": 2, "pct": 20.6 }, ...] }' },
          },
          {
            from: 'sql',
            to: 'api',
            title: 'Days add back to the week',
            detail: 'Every build checks that the daily rows sum back to the weekly forecast for every terminal, so no volume is created or lost in the split.',
            payload: { label: 'Check', code: 'for each terminal and week:\n  assert sum(daily) == weekly' },
          },
          {
            from: 'api',
            to: 'tools',
            title: 'The export matches the screen',
            detail: 'The CSV export is exactly what is on screen, adjustments included, so what planners review is what gets sent.',
            payload: { label: 'Request', code: 'POST /api/export\n200 text/csv  forecast_412_2026.csv' },
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
      { kind: 'planner', name: 'Plan a week' },
      { kind: 'allocation', name: 'Allocate volume' },
    ],
  },

  'job-iotum': {
    arch: {
      nodes: [
        { id: 'devs', label: 'Client developer', kind: 'person', col: 0, row: 0, note: 'An engineer at a customer embedding Iotum video and chat in their own product.' },
        { id: 'app', label: 'Reference app', sub: 'Full-stack React', kind: 'client', col: 1, row: 0, note: 'A working host app that shows the integration end to end, so client teams start from a pattern that already works.' },
        { id: 'sdk', label: 'callbridge-js', sub: 'Meeting, Dashboard', kind: 'code', col: 2, row: 0, note: 'Iotum’s JavaScript SDK. Each widget is an iframe the host page controls through methods and events.' },
        { id: 'platform', label: 'Callbridge', sub: 'Meetings and chat', kind: 'service', col: 3, row: 0, note: 'Iotum’s platform the widgets connect to.' },
        { id: 'backend', label: 'App backend', sub: 'Issues SSO tokens', kind: 'service', col: 1, row: 1, note: 'The host app’s own server gets an SSO token and host id, so no credentials sit in the browser.' },
        { id: 'tests', label: 'Test suite', sub: 'Selenium, Mocha', kind: 'job', col: 2, row: 1, note: 'Browser tests that drive the apps the way a user would. This is where code coverage went up 85%.' },
        { id: 'ci', label: 'CI/CD pipeline', sub: 'Runs on every change', kind: 'job', col: 3, row: 1, note: 'Lint, unit and browser tests run on each change before anything ships.' },
      ],
      edges: [
        { from: 'devs', to: 'app' },
        { from: 'app', to: 'backend' },
        { from: 'app', to: 'sdk' },
        { from: 'sdk', to: 'platform' },
        { from: 'tests', to: 'app' },
        { from: 'tests', to: 'ci' },
      ],
    },
    flows: [
      {
        name: 'Joining a meeting',
        steps: [
          {
            from: 'app',
            to: 'backend',
            title: 'Get an SSO token',
            detail: 'The host app asks its own backend for a token and host id.',
            payload: { label: 'HTTP', code: 'POST /api/sso-token\n200 { "token": "…", "hostId": 12345 }' },
          },
          {
            from: 'app',
            to: 'sdk',
            title: 'Create the Meeting widget',
            detail: 'One constructor call with the domain, the SSO token and a container.',
            payload: { label: 'TypeScript', code: "const meeting = new Meeting(\n  { domain, sso: { token, hostId }, container: '#meeting' },\n  accessCode,\n  { skipJoin: true },\n)" },
          },
          {
            from: 'sdk',
            to: 'platform',
            title: 'The widget loads the room',
            detail: 'widget.LOAD, then room.READY once controls like setMute can be called.',
            payload: { label: 'Events', code: "widget.LOAD\nroom.READY" },
          },
          {
            from: 'platform',
            to: 'sdk',
            title: 'People come and go',
            detail: 'participant.CHANGE and conference.SPEAKER keep the host’s own UI in sync.',
            payload: { label: 'TypeScript', code: "meeting.on('participant.CHANGE', ({ id, name, isLeft }) => update(id, name, isLeft))\nmeeting.on('conference.SPEAKER', ({ speakerId }) => highlight(speakerId))" },
          },
          {
            from: 'sdk',
            to: 'app',
            title: 'Unload on teardown',
            detail: 'The component cleans the widget up when it unmounts.',
            payload: { label: 'React', code: 'useEffect(() => () => meeting.unload(), [])' },
          },
        ],
      },
      {
        name: 'Blocked cookies',
        summary: 'Safari blocks the widget’s cookie inside an iframe.',
        steps: [
          {
            from: 'sdk',
            to: 'app',
            title: 'The widget asks for storage access',
            detail: 'The host has to make the widget visible and clickable.',
            payload: { label: 'Event', code: "widget.STORAGE_ACCESS_REQUIRED { step: 'request' }" },
          },
          {
            from: 'app',
            to: 'sdk',
            title: 'The user allows it',
            detail: 'Granted is not signed in yet, so the app waits for room.READY.',
            payload: { label: 'Events', code: 'widget.STORAGE_ACCESS_GRANTED\nwidget.LOAD\nroom.READY' },
          },
        ],
      },
      {
        name: 'Shipping a release',
        steps: [
          {
            from: 'tests',
            to: 'app',
            title: 'Selenium drives the app',
            detail: 'Each spec clicks through a flow in a real browser.',
            payload: { label: 'Mocha spec', code: "it('joins a meeting from the access code', async () => {\n  await driver.get(`${BASE}/meeting`)\n  await driver.findElement(By.name('accessCode')).sendKeys('1234567', Key.ENTER)\n  await driver.wait(until.elementLocated(By.css('iframe')))\n})" },
          },
          {
            from: 'tests',
            to: 'ci',
            title: 'Every change runs the suite',
            detail: 'A failing spec blocks the merge.',
            payload: { label: 'Pipeline', code: 'install → lint → unit → e2e (selenium) → build → release' },
          },
        ],
      },
    ],
    screens: 'iotum',
    demos: [
      { kind: 'sdk', name: 'Embed a meeting' },
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
    screens: 'nationwide',
    demos: [
      { kind: 'provision', name: 'Provision a device' },
      { kind: 'network', name: 'Reach the database' },
      { kind: 'drift', name: 'Drift' },
    ],
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
    screens: 'cineplex',
    demos: [
      { kind: 'stream', name: 'Stream sales' },
      { kind: 'dataval', name: 'Reconcile two copies' },
      { kind: 'heatmap', name: 'Find the anomalies' },
      { kind: 'showtime', name: 'Clean the training data' },
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
      { kind: 'evaluate', name: 'Pick a threshold' },
      { kind: 'terraform', name: 'Plan and apply' },
    ],
  },

  'project-starrez-enterprise-automation-suite': {
    arch: {
      nodes: [
        { id: 'page', label: 'StarRez profile', sub: 'Rez 360 page', kind: 'client', col: 0, row: 0, note: 'The resident profile front desk staff already have open. StarRez is a single page app, so it swaps profiles without a page load.' },
        { id: 'observer', label: 'MutationObserver', sub: 'Debounced 500 ms', kind: 'code', col: 1, row: 0, note: 'Watches the page for changes and notices when the breadcrumb shows a different resident, which is how the extension knows a new profile is open.' },
        { id: 'cs', label: 'Content script', sub: 'Reads the DOM', kind: 'code', col: 2, row: 0, note: 'Runs only on the StarRez domain. It reads the text already on screen, never the StarRez backend, and adds the buttons to the page.' },
        { id: 'staff', label: 'Front desk staff', kind: 'person', col: 0, row: 1, note: 'Clicks one button instead of retyping a name, student number and room from the screen.' },
        { id: 'buttons', label: 'Injected buttons', sub: 'Next to what staff use', kind: 'client', col: 1, row: 1, note: 'Copy Log beside Issue, Copy 2 pkgs from the parcel count, Print Label by Entry Actions, and Copy Lockout under Keys.' },
        { id: 'tasks', label: 'Task modules', sub: 'Package, label, lockout', kind: 'code', col: 2, row: 1, note: 'Each task extracts what it needs, validates it and formats the entry its own way, so adding a task never touches the others.' },
        { id: 'clip', label: 'Clipboard', sub: 'Formatted entry', kind: 'file', col: 3, row: 1, note: 'The finished entry is copied, ready to paste into the StarRez log.' },
        { id: 'popup', label: 'Popup', sub: 'Activity and stats', kind: 'client', col: 1, row: 2, note: 'Shows the shift’s entries with counts, search, per-staff stats and CSV export.' },
        { id: 'sw', label: 'Service worker', sub: 'MV3 background', kind: 'service', col: 2, row: 2, note: 'Answers the popup’s messages to read, export or clear the activity log.' },
        { id: 'log', label: 'Activity log', sub: 'Stored in the browser', kind: 'store', col: 3, row: 2, note: 'Formatted entries and timestamps, kept on the local machine only. Nothing is sent to a server.' },
      ],
      edges: [
        { from: 'page', to: 'observer' },
        { from: 'observer', to: 'cs' },
        { from: 'cs', to: 'buttons' },
        { from: 'staff', to: 'buttons' },
        { from: 'buttons', to: 'tasks' },
        { from: 'tasks', to: 'clip' },
        { from: 'tasks', to: 'log' },
        { from: 'popup', to: 'sw' },
        { from: 'sw', to: 'log' },
      ],
      groups: [{ label: 'Chrome extension, Manifest V3', nodes: ['observer', 'cs', 'buttons', 'tasks', 'popup', 'sw'] }],
      footnote: 'Approved by University IST and deployed across Campus Housing desks.',
    },
    flows: [
      {
        name: 'Logging a package pickup',
        summary: 'By hand this took about 20 seconds per entry. With the extension it is one click.',
        steps: [
          {
            from: 'page',
            to: 'observer',
            title: 'A new profile opens',
            detail: 'StarRez swaps the content without reloading. The observer waits for the page to settle, then compares the breadcrumb to the last resident it saw.',
            payload: { label: 'JavaScript', code: 'const observer = new MutationObserver(() => {\n  clearTimeout(timer)\n  timer = setTimeout(initialize, 500)\n})\nobserver.observe(document.body, { childList: true, subtree: true })' },
          },
          {
            from: 'observer',
            to: 'cs',
            title: 'Old buttons go, new ones come in',
            detail: 'Buttons from the previous resident are removed so nothing gets logged against the wrong person, then the script waits for the profile details to finish loading.',
          },
          {
            from: 'cs',
            to: 'buttons',
            title: 'Buttons land where staff already look',
            detail: 'The parcel count becomes a Copy 2 pkgs button, and Copy Lockout appears under the Keys card once that sidebar loads.',
            payload: { label: 'JavaScript', code: "const parcels = [...document.querySelectorAll('span')]\n  .find((s) => /^\\d+\\s+Parcels?$/i.test(s.textContent.trim()))\nconst count = parseInt(parcels.textContent)\nparcels.after(button(`Copy ${count} pkgs`, () => copyPackage(count)))" },
          },
          {
            from: 'staff',
            to: 'buttons',
            title: 'Staff click Copy 2 pkgs',
            detail: 'One click replaces reading the student number, copying the room code, formatting the line and noting the time.',
          },
          {
            from: 'buttons',
            to: 'tasks',
            title: 'Read, validate and format',
            detail: 'The name comes from the breadcrumb, the student number must be 8 digits, and the room is found with three fallbacks. If anything fails validation, no entry is made.',
            payload: { label: 'JavaScript', code: "const id = text.match(/Student Number\\s+(\\d{8})/)?.[1]\nconst room = extractBedspace(text)   // three fallbacks\n\n`${initials} (${id}) ${room} ${n} pkgs @ ${time} - ${staff}`\n// S.L (20871234) V1S-305a 2 pkgs @ 3:42 pm - A.B" },
          },
          {
            from: 'tasks',
            to: 'clip',
            title: 'Copied, with a preview',
            detail: 'The entry goes to the clipboard and a short preview shows exactly what was copied, so staff can paste it into the log straight away.',
          },
          {
            from: 'tasks',
            to: 'log',
            title: 'Recorded for the shift',
            detail: 'Each entry is saved locally with its type, the staff member and a timestamp.',
            payload: { label: 'Stored', code: "{ type: 'package', log: 'S.L (20871234) V1S-305a 2 pkgs @ 3:42 pm - A.B',\n  staffName: 'Baid, Anay', timestamp: 1771450920000 }" },
          },
        ],
      },
      {
        name: 'Logging a lockout',
        steps: [
          {
            from: 'staff',
            to: 'buttons',
            title: 'Copy Lockout asks for a reason',
            detail: 'A small dialog asks why the resident was locked out before anything is generated.',
          },
          {
            from: 'buttons',
            to: 'tasks',
            title: 'Key codes come from the Keys card',
            detail: 'The lockout module reads the key codes listed on the profile and prefers loaner keys. If there are no keys, it says so instead of making a blank entry.',
            payload: { label: 'Output', code: 'S.L (20871234) V1S-305a KC: L0932; locked out after class - A.B' },
          },
          {
            from: 'tasks',
            to: 'clip',
            title: 'Ready to paste',
            detail: 'Same as packages, copied with a preview and saved to the activity log.',
          },
        ],
      },
      {
        name: 'Reviewing the shift',
        steps: [
          {
            from: 'popup',
            to: 'sw',
            title: 'The popup asks for the activity',
            detail: 'Opening the popup sends a message to the background service worker.',
            payload: { label: 'Message', code: "chrome.runtime.sendMessage({ type: 'GET_ACTIVITY' }, render)" },
          },
          {
            from: 'sw',
            to: 'log',
            title: 'Read from local storage',
            detail: 'The worker returns the shift’s entries, and the popup shows counts by type, search, per-staff stats and a CSV export.',
          },
        ],
      },
    ],
    screens: 'starrez',
    demos: [
      { kind: 'extension', name: 'Use it on a profile' },
      { kind: 'shift', name: 'Desk rush' },
      { kind: 'observer', name: 'Page load timing' },
    ],
  },

  'project-battleship-for-purolator': {
    arch: {
      nodes: [
        { id: 'p1', label: 'Player 1', sub: 'Creates the room', kind: 'client', col: 0, row: 0, note: 'Enters a callsign, creates a room and shares the code or invite link.' },
        { id: 'io', label: 'Socket.IO', sub: 'WebSocket events', kind: 'queue', col: 1, row: 0, note: 'Every shot, turn change, board size proposal and lobby update travels as an event.' },
        { id: 'server', label: 'Express server', sub: 'Node', kind: 'service', col: 2, row: 0, note: 'Owns the game. It checks every move server side, so a modified client can’t fire out of turn or twice at a cell.' },
        { id: 'rooms', label: 'Rooms', sub: 'In memory', kind: 'store', col: 3, row: 0, note: 'Each room’s boards, turn and stats live in memory. Idle rooms are cleaned up after 30 minutes.' },
        { id: 'p2', label: 'Player 2', sub: 'Invite link', kind: 'client', col: 0, row: 1, note: 'Opens the invite link or types the code and joins the room directly.' },
        { id: 'reset', label: 'Reset', sub: 'Keyed endpoint', kind: 'person', col: 2, row: 1, note: 'Wakes the free Render instance, ends every game and clears the standings for the next event.' },
        { id: 'rank', label: 'Rankings', sub: 'History and records', kind: 'store', col: 3, row: 1, note: 'Records grouped by callsign, recent games and best stats, shown in the lobby.' },
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
            detail: 'Clicking a cell sends one event with the cell’s index on the board.',
            payload: { label: 'Client', code: "socket.emit('fire', { index: 27 })" },
          },
          {
            from: 'io',
            to: 'server',
            title: 'The server checks the move',
            detail: 'The room has to be playing, it has to be this player’s turn, the index has to be on the board, and the cell can’t have been fired at already. Anything else is dropped.',
            payload: { label: 'server/src/handlers/gameplay.js', code: "socket.on('fire', ({ index }) => {\n  if (!room || room.state !== 'playing') return\n  if (room.turn !== socket.id) return\n  if (!isValidShotIndex(index, room.boardSize)) return\n  const cell = opponent.board[index]\n  if (cell === 'hit' || cell === 'miss') return\n  ..." },
          },
          {
            from: 'server',
            to: 'rooms',
            title: 'The board and stats update',
            detail: 'The cell becomes a hit or a miss, shot counts update for the match report, and the turn passes to the other player.',
          },
          {
            from: 'io',
            to: 'p2',
            title: 'Both players see it at once',
            detail: 'One broadcast to the room carries the result, whose turn is next, and which vehicle sank if any.',
            payload: { label: 'Broadcast', code: "io.to(roomId).emit('shot_result', {\n  index: 27, result: 'hit', firedBy, nextTurn, sunk: 'Scooter',\n})" },
          },
        ],
      },
      {
        name: 'Setting up a game',
        steps: [
          {
            from: 'p1',
            to: 'io',
            title: 'Create a room',
            detail: 'The server makes a five character room code and the player gets an invite link with it.',
            payload: { label: 'Events', code: "emit   create_room   { name: 'Thunder_YYZ', boardDim: 10 }\nreceive room_created  { roomId: 'K7QX2', playerIndex: 0 }" },
          },
          {
            from: 'p2',
            to: 'io',
            title: 'Join from the link',
            detail: 'The link route serves the page with the code filled in. Full rooms, games already running and typos get a clear error.',
            payload: { label: 'Events', code: "GET /K7QX2\nemit   join_room      { roomId: 'K7QX2', name: 'Maple' }\nreceive both_connected { names, ships, boardDim: 10 }" },
          },
          {
            from: 'io',
            to: 'server',
            title: 'Agree on a board size',
            detail: 'Either player proposes a size from 6 to 15, and the other has to accept before it changes. Placement waits until the handshake settles.',
            payload: { label: 'Events', code: "emit set_board_dim { boardDim: 12 }      → board_dim_proposed\nemit board_dim_response { accept: true } → board_resized { boardDim: 12 }" },
          },
          {
            from: 'server',
            to: 'rooms',
            title: 'Both fleets locked in, coin flip',
            detail: 'Each placement is validated server side. When both are ready, a random player is picked to fire first.',
            payload: { label: 'Server', code: "room.turn = room.players[Math.floor(Math.random() * 2)].id\nio.to(roomId).emit('game_start', { turn: room.turn })" },
          },
        ],
      },
      {
        name: 'Disconnects and reset',
        steps: [
          {
            from: 'p2',
            to: 'io',
            title: 'A connection drops',
            detail: 'The other player is told right away, and the room is held for a short grace window before it is torn down.',
            payload: { label: 'Server', code: "socket.on('disconnect', () => {\n  io.to(opponent.id).emit('opponent_left')\n  setTimeout(() => rooms.get(roomId) && deleteRoom(roomId), 8000)\n})" },
          },
          {
            from: 'reset',
            to: 'server',
            title: 'Reset wakes and clears the server',
            detail: 'The Reset button pings until the sleeping Render instance answers, then posts with a key compared in constant time.',
            payload: { label: 'Request', code: 'POST /reset\nx-reset-key: ••••••\n200 { "ok": true, "roomsClosed": 3 }' },
          },
          {
            from: 'server',
            to: 'rank',
            title: 'Standings clear for the next event',
            detail: 'Rooms, rankings and history are wiped, and every open tab is sent back to the start screen.',
            payload: { label: 'Server', code: "rooms.clearAll(); leaderboard.clear(); history.clear()\nio.emit('server_reset')" },
          },
        ],
      },
    ],
    screens: 'battleship',
    demos: [{ kind: 'battleship', name: 'Play a round' }],
  },

  'project-ci-cd-build-automation-tool': {
    arch: {
      nodes: [
        { id: 'push', label: 'Push to main', kind: 'person', col: 0, row: 0, note: 'A push to the branch the workflow watches starts everything.' },
        { id: 'wf', label: 'Trigger Build', sub: 'GitHub Actions workflow', kind: 'job', col: 1, row: 0, note: 'Sets the repo, user, branch and target environment as environment variables and runs the action.' },
        { id: 'action', label: 'gitpython.py', sub: 'Python action', kind: 'code', col: 2, row: 0, note: 'Validates its inputs, dispatches one build for that branch and environment, logs the run and sends the email.' },
        { id: 'api', label: 'GitHub REST API', sub: '/repos/{owner}/{repo}/dispatches', kind: 'service', col: 3, row: 0, note: 'Accepts a repository_dispatch event and answers 204 when it is queued.' },
        { id: 'check', label: 'Input checks', kind: 'code', col: 1, row: 1, note: 'Stops the run with a clear error if the repo, user, branch or environment is missing.' },
        { id: 'log', label: 'Run log', sub: 'github_dispatch_{uuid}.log', kind: 'file', col: 2, row: 1, note: 'Every run writes its inputs and any errors to its own log file.' },
        { id: 'target', label: 'Build workflow', sub: 'on repository_dispatch', kind: 'job', col: 3, row: 1, note: 'Listens for the build event and runs only the job for the environment in the payload.' },
        { id: 'smtp', label: 'SMTP', sub: 'STARTTLS on 587', kind: 'service', col: 2, row: 2, note: 'Sends the notification email over an encrypted connection.' },
        { id: 'team', label: 'Team inbox', kind: 'person', col: 3, row: 2, note: 'Gets an email saying which branch and environment were built.' },
      ],
      edges: [
        { from: 'push', to: 'wf' },
        { from: 'wf', to: 'action' },
        { from: 'action', to: 'api' },
        { from: 'api', to: 'target' },
        { from: 'wf', to: 'check' },
        { from: 'action', to: 'log' },
        { from: 'action', to: 'smtp' },
        { from: 'smtp', to: 'team' },
      ],
    },
    flows: [
      {
        name: 'Triggering a build',
        summary: 'Builds one branch for one environment instead of rerunning the whole pipeline.',
        steps: [
          {
            from: 'push',
            to: 'wf',
            title: 'A push starts the workflow',
            detail: 'The workflow sets which repo, branch and environment to build, and any custom data to pass along.',
            payload: { label: '.github/workflows/trigger.yml', code: 'on:\n  push:\n    branches: [main]\nenv:\n  GITHUB_BRANCH_NAME: ${{ github.ref }}\n  ENVIRONMENT_NAME: staging\n  SEND_EMAIL_NOTIFICATION: true' },
          },
          {
            from: 'wf',
            to: 'check',
            title: 'Check the inputs first',
            detail: 'If any required variable is missing, the run stops with an error that names it, before anything is dispatched.',
            payload: { label: 'Python', code: 'if not environment:\n    raise Exception("Error: Required environment variable ENVIRONMENT_NAME is missing.")' },
          },
          {
            from: 'action',
            to: 'api',
            title: 'Dispatch one build',
            detail: 'A single repository_dispatch event carries the branch, the environment and the custom data.',
            payload: { label: 'HTTP', code: 'POST /repos/anaybaid7/app/dispatches\n{ "event_type": "build",\n  "client_payload": { "ref": "refs/heads/main", "environment": "staging" } }\n204 No Content' },
          },
          {
            from: 'api',
            to: 'target',
            title: 'Only that environment builds',
            detail: 'The receiving workflow reads the environment from the payload, so the staging job runs and the others are skipped.',
            payload: { label: 'Receiving workflow', code: 'on:\n  repository_dispatch:\n    types: [build]\njobs:\n  staging:\n    if: github.event.client_payload.environment == \'staging\'' },
          },
          {
            from: 'action',
            to: 'log',
            title: 'Log the run',
            detail: 'Inputs and errors go to a log file named with a fresh UUID, so runs never overwrite each other.',
          },
          {
            from: 'action',
            to: 'smtp',
            title: 'Email the team',
            detail: 'With notifications on, an email goes out over SMTP after upgrading the connection with STARTTLS.',
            payload: { label: 'Email', code: 'Subject: GitHub Action: Build triggered for anaybaid7/app/refs/heads/main/staging' },
          },
          {
            from: 'smtp',
            to: 'team',
            title: 'Everyone knows what was built',
            detail: 'No one has to watch the Actions tab to know which environment got which branch.',
          },
        ],
      },
    ],
    screens: 'cicd',
    demos: [
      { kind: 'build', name: 'Run the action' },
      { kind: 'graph', name: 'Both workflows' },
      { kind: 'sequence', name: 'Message by message' },
    ],
  },

  'project-pashu': {
    arch: {
      nodes: [
        { id: 'player', label: 'Player', sub: 'Runs the shelter', kind: 'person', col: 0, row: 0, note: 'Builds the shelter, puts out food and water, and takes in animals.' },
        { id: 'build', label: 'Build system', sub: 'Radial menu', kind: 'code', col: 1, row: 0, note: 'Places walls, bowls and decorations on the map.' },
        { id: 'res', label: 'Food and water', sub: 'Resources', kind: 'store', col: 2, row: 0, note: 'Bowls the animals walk to. Each one is used up when an animal eats or drinks.' },
        { id: 'npc', label: 'Animal state machine', sub: 'C#, NavMesh', kind: 'code', col: 1, row: 1, note: 'Each animal is in one state: Wander, goToFood, goToWater or Dead. Health and water drain every frame and pick the next state.' },
        { id: 'stats', label: 'Stats', sub: 'XP, level, money', kind: 'store', col: 2, row: 1, note: 'XP goes up when animals eat, drink or get adopted, and down when one dies. Every 100 XP is a level.' },
        { id: 'hud', label: 'HUD', sub: 'Unity UI', kind: 'client', col: 3, row: 1, note: 'Money, level, the XP bar, animal count and the date.' },
        { id: 'time', label: 'Time manager', sub: 'Days and month end', kind: 'job', col: 1, row: 2, note: 'Advances a day every 30 seconds and pauses for the month-end bill.' },
        { id: 'webgl', label: 'WebGL build', sub: 'Embedded on Wix', kind: 'file', col: 3, row: 2, note: 'Built for the browser so judges could play it anywhere.' },
      ],
      edges: [
        { from: 'player', to: 'build' },
        { from: 'build', to: 'res' },
        { from: 'res', to: 'npc' },
        { from: 'npc', to: 'stats' },
        { from: 'stats', to: 'hud' },
        { from: 'time', to: 'stats' },
        { from: 'hud', to: 'webgl' },
      ],
    },
    flows: [
      {
        name: 'An animal gets hungry',
        steps: [
          {
            from: 'player',
            to: 'build',
            title: 'Put out a food bowl',
            detail: 'The player places a bowl from the radial build menu.',
          },
          {
            from: 'res',
            to: 'npc',
            title: 'Health drops below 50',
            detail: 'Health and water drain every frame. Under 50, the animal switches to goToFood and the NavMesh agent heads for the closest bowl.',
            payload: { label: 'AnimalController.cs', code: 'health -= Time.deltaTime * healthReductionSpeed;\nwater  -= Time.deltaTime * (healthReductionSpeed / 2);\nif (health < 50) { foodIndicator.SetActive(true); currentState = State.goToFood; }\nif (water  < 50) { waterIndicator.SetActive(true); currentState = State.goToWater; }' },
          },
          {
            from: 'npc',
            to: 'stats',
            title: 'It eats and the player scores',
            detail: 'Within 2 units of the bowl, the bowl is used up, health resets to 100, the player gains XP and the animal goes back to wandering.',
            payload: { label: 'AnimalController.cs', code: 'if (Vector3.Distance(transform.position, target) <= 2f) {\n  health = 100;\n  stats.XP += Random.Range(10, 20);\n  currentState = State.Wander;\n}' },
          },
          {
            from: 'stats',
            to: 'hud',
            title: 'The HUD updates',
            detail: 'XP past 100 rolls over into a level. If an animal is left until health or water hits zero, it dies and the player loses 75 XP.',
          },
        ],
      },
      {
        name: 'Month end',
        steps: [
          {
            from: 'time',
            to: 'stats',
            title: 'The bill comes due',
            detail: 'On the last day of the month time slows to a stop and a bill shows government funding per animal, donations and rent.',
            payload: { label: 'TimeManager.cs', code: 'int govt = stats.animalCount * 100;\nint donations = Random.Range(100, 500);\nint rent = Random.Range(1000, 2000);\nbill = govt + donations - rent;' },
          },
          {
            from: 'stats',
            to: 'hud',
            title: 'Pay it or go under',
            detail: 'Paying adds the total to the balance. If money goes below zero, it is game over.',
          },
          {
            from: 'hud',
            to: 'webgl',
            title: 'All of it runs in the browser',
            detail: 'The Unity WebGL build is embedded in a Wix page, so it plays without installing anything.',
          },
        ],
      },
    ],
    screens: 'pashu',
    demos: [{ kind: 'fsm', name: 'Run the shelter' }],
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
    screens: 'routing',
    demos: [{ kind: 'router', name: 'Use the app' }],
  },
}

export type Tab = 'overview' | 'how' | 'decisions' | 'screens' | 'try' | 'code'

export function tabsFor(id: string): Tab[] {
  const d = DETAILS[id]
  const tabs: Tab[] = ['overview']
  if (d?.arch) tabs.push('how')
  if (NOTES[id]) tabs.push('decisions')
  if (d?.screens) tabs.push('screens')
  if (d?.demos?.length) tabs.push('try')
  if (d?.demos?.some((x) => CODE_KINDS.includes(x.kind))) tabs.push('code')
  return tabs
}

// demos whose logic lives in its own module and shows in the Code tab
export const CODE_KINDS: DemoKind[] = ['sdk', 'pipeline', 'planner', 'allocation', 'stream', 'dataval', 'fraud', 'scorer', 'extension', 'battleship', 'build', 'fsm', 'router', 'evaluate', 'heatmap', 'graph', 'observer', 'drift', 'showtime', 'sequence', 'terraform']
