// The slides on /purolator-intern-event, in order. Edit, reorder, add or
// remove slides here; the page builds itself from this list.
//
//   label   small text above the title
//   title   the headline
//   line    one sentence under it (optional)
//   image   a screenshot in public/event-shots/ (optional)
//   steps   a row of numbered steps instead of an image (optional)
//   visual  'map' draws the terminal map (optional)
//   points  a short list shown on the slide itself, each opening a visual (optional)
//   thumbs  small screenshots shown next to the points (optional)
//   notes   talking points, shown when you click the slide
//   spots   parts of the screenshot to zoom into (optional, see below)
//
// A spot is a box on the screenshot: x and y are where its top-left corner
// sits, w and h its size, all as fractions of the picture (0 to 1). Clicking
// inside the box zooms to it and shows the title and text. To get the numbers,
// hold Shift and drag over the picture on the page; the box is copied.

export type Spot = {
  x: number
  y: number
  w: number
  h: number
  title: string
  text: string
}

// What opens under a step or a point. Numbers in these are mock data.
export type SketchItem = {
  type: 'box' | 'button' | 'input' | 'select' | 'text' | 'line' | 'mark'
  x: number
  y: number
  w?: number
  h?: number
  label?: string
  strong?: boolean
  faint?: boolean
  size?: 'lg'
  align?: 'end'
}

export type Visual =
  | { kind: 'table'; columns: string[]; rows: (string | number)[][]; highlight?: number[]; caption?: string }
  | { kind: 'lines'; alt: string; labels: string[]; series: { name: string; tone: 'muted' | 'accent'; values: number[] }[]; marks?: { at: number; text: string }[] }
  | { kind: 'flow'; alt: string; inputs: string[]; center: string; outputs: string[] }
  | { kind: 'bars'; alt: string; labels: string[]; values: number[]; unit?: string; accent?: number[] }
  | { kind: 'sketch'; alt: string; w: number; h: number; items: SketchItem[] }
  | { kind: 'image'; src: string; alt: string }

// A step on the weekly cycle slide. Click it to open its title, text and visual.
export type Step = { label: string; title: string; text: string; visual: Visual }

// A point on a slide's list. Click it to open its title, text and visual.
export type Point = { label: string; title: string; text: string; visual: Visual }

export type Slide = {
  label: string
  title: string
  line?: string
  image?: string
  steps?: Step[]
  visual?: 'map'
  points?: Point[]
  thumbs?: string[]
  notes: string[]
  spots?: Spot[]
}

export const deck = {
  title: 'Forecasting the network',
  kicker: "Let's Connect",
  mockNote: 'Numbers in the screenshots are mock data.',
}

export const slides: Slide[] = [
  {
    label: 'Network Engineering, Purolator',
    title: 'Forecasting parcel volume',
    line: 'Every week our team forecasts how many parcels each of our 135 terminals will see, for pickup and delivery.',
    visual: 'map',
    notes: [
      'Ops uses that number to decide how many couriers and trucks to send out.',
      "If we're too low, parcels sit at the terminal. If we're too high, we pay for trucks we didn't need.",
    ],
  },
  {
    label: 'Our week',
    title: 'How the forecast comes together',
    steps: [
      {
        label: "Last week's numbers come in",
        title: 'The daily numbers',
        text: 'Every terminal reports pieces and stops for each day. We pull a fresh copy at the start of the week.',
        visual: {
          kind: 'table',
          columns: ['Day', 'Delivery pieces', 'Pickup pieces', 'Stops'],
          rows: [
            ['Sun', 212, 48, 96],
            ['Mon', 18420, 6115, 7310],
            ['Tue', 19870, 6402, 7655],
            ['Wed', 19105, 6233, 7498],
            ['Thu', 18660, 6080, 7342],
            ['Fri', 17935, 5874, 7120],
            ['Sat', 380, 61, 154],
          ],
          caption: 'One terminal, one week. Mock numbers.',
        },
      },
      {
        label: 'We clean them up',
        title: 'Cleaning the history',
        text: 'A short week is scaled up to a full week of working days, and one-off spikes are taken out, so the model learns the normal pattern.',
        visual: {
          kind: 'lines',
          alt: 'Weekly volume before and after cleaning',
          labels: ['W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34', 'W35', 'W36', 'W37', 'W38', 'W39'],
          series: [
            { name: 'As reported', tone: 'muted', values: [96400, 95100, 97800, 94200, 77600, 96900, 98300, 99100, 128400, 100200, 101500, 102800] },
            { name: 'Cleaned', tone: 'accent', values: [96400, 95100, 97800, 94200, 97000, 96900, 98300, 99100, 99700, 100200, 101500, 102800] },
          ],
          marks: [
            { at: 4, text: 'Holiday, 4 working days' },
            { at: 8, text: 'One-off spike' },
          ],
        },
      },
      {
        label: 'The model runs',
        title: 'What goes into the model',
        text: 'Our model in R looks at years of history plus what we know is coming, and forecasts every terminal for the rest of the year.',
        visual: {
          kind: 'flow',
          alt: 'Inputs flowing into the R model and out as a forecast',
          inputs: ['Cleaned weekly history', 'Holidays', 'Sales and events', 'Big client forecasts'],
          center: 'R model',
          outputs: ['A forecast for every terminal, every week'],
        },
      },
      {
        label: 'We adjust it',
        title: 'Adding what the model can\'t know',
        text: 'Pick the weeks, type the change and a reason. Every change is saved with who made it.',
        visual: {
          kind: 'sketch',
          alt: 'Wireframe of the weeks table with four weeks selected and raised by 5%',
          w: 640,
          h: 330,
          items: [
            { type: 'box', x: 4, y: 4, w: 632, h: 322 },
            { type: 'text', x: 24, y: 40, label: 'Weeks', size: 'lg', strong: true },
            { type: 'select', x: 24, y: 56, w: 150, h: 36, label: 'Increase by %' },
            { type: 'input', x: 184, y: 56, w: 56, h: 36, label: '5' },
            { type: 'input', x: 250, y: 56, w: 200, h: 36, label: 'Peak plan from ops' },
            { type: 'button', x: 460, y: 56, w: 80, h: 36, label: 'Apply', strong: true },
            { type: 'text', x: 616, y: 80, label: '4 weeks', align: 'end', faint: true },
            { type: 'text', x: 24, y: 128, label: 'Week', strong: true },
            { type: 'text', x: 250, y: 128, label: 'Last year', strong: true },
            { type: 'text', x: 420, y: 128, label: 'Forecast', strong: true },
            { type: 'text', x: 616, y: 128, label: 'Change', strong: true, align: 'end' },
            { type: 'line', x: 20, y: 140, w: 600, h: 0 },
            { type: 'mark', x: 20, y: 174, w: 600, h: 112 },
            { type: 'text', x: 24, y: 166, label: 'W46' },
            { type: 'text', x: 250, y: 166, label: '1,096,277' },
            { type: 'text', x: 420, y: 166, label: '1,110,871' },
            { type: 'text', x: 24, y: 194, label: 'W47' },
            { type: 'text', x: 250, y: 194, label: '1,128,499' },
            { type: 'text', x: 420, y: 194, label: '1,199,231' },
            { type: 'text', x: 616, y: 194, label: '+5%', align: 'end', strong: true },
            { type: 'text', x: 24, y: 222, label: 'W48' },
            { type: 'text', x: 250, y: 222, label: '1,171,095' },
            { type: 'text', x: 420, y: 222, label: '1,250,937' },
            { type: 'text', x: 616, y: 222, label: '+5%', align: 'end', strong: true },
            { type: 'text', x: 24, y: 250, label: 'W49' },
            { type: 'text', x: 250, y: 250, label: '1,273,959' },
            { type: 'text', x: 420, y: 250, label: '1,358,711' },
            { type: 'text', x: 616, y: 250, label: '+5%', align: 'end', strong: true },
            { type: 'text', x: 24, y: 278, label: 'W50' },
            { type: 'text', x: 250, y: 278, label: '1,221,679' },
            { type: 'text', x: 420, y: 278, label: '1,300,357' },
            { type: 'text', x: 616, y: 278, label: '+5%', align: 'end', strong: true },
            { type: 'text', x: 24, y: 310, label: 'W51' },
            { type: 'text', x: 250, y: 310, label: '1,185,511' },
            { type: 'text', x: 420, y: 310, label: '1,200,783' },
          ],
        },
      },
      {
        label: 'It gets split into days',
        title: 'Splitting the week',
        text: "Each terminal's week is split by the share each day usually gets, taken from recent weeks with no holidays.",
        visual: {
          kind: 'bars',
          alt: 'Share of the week by day',
          labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          values: [0.3, 20.1, 21.0, 20.4, 19.6, 18.4, 0.2],
          unit: '%',
          accent: [1, 2, 3, 4, 5],
        },
      },
      {
        label: 'Ops and the hubs use it',
        title: 'Where it goes',
        text: 'Once it is published, ops plans each day from it, the hubs see it in Power BI, and every day gets checked against what came in.',
        visual: {
          kind: 'flow',
          alt: 'The published forecast going to ops, the hubs and the accuracy check',
          inputs: ['Weekly forecast', 'Daily split'],
          center: 'Published forecast',
          outputs: ['Ops, staffing each day', 'Hubs, in Power BI', 'Accuracy, checked every day'],
        },
      },
    ],
    notes: [
      "It starts with last week's actual volume.",
      'Our model in R forecasts each terminal for the rest of the year.',
      "Then we adjust for things the model can't know, and split it into days.",
    ],
  },
  {
    label: 'The forecast tool',
    title: 'This year next to last year',
    image: '/event-shots/weekly-chart.webp',
    notes: [
      'Red is this year, blue is last year, and the dashed line is where we think the rest of the year goes.',
    ],
    spots: [
      { x: 0.006, y: 0.197, w: 0.596, h: 0.138, title: 'The year so far', text: 'Our forecast for the rest of the year, what came in so far, and how both compare to last year.' },
      { x: 0.514, y: 0.42, w: 0.222, h: 0.35, title: 'Summer', text: 'Volume dips in July and August, then picks back up in September.' },
      { x: 0.743, y: 0.38, w: 0.23, h: 0.4, title: 'Peak', text: 'Late November to December is the busiest part of the year. These are the weeks that matter most to get right.' },
    ],
  },
  {
    label: 'The forecast tool',
    title: "Adding what the model can't see",
    image: '/event-shots/weekly-grid.webp',
    notes: [
      'The model only knows the past.',
      'We know about things like a new client starting or a sale date moving, so we adjust those weeks.',
    ],
    spots: [
      { x: 0.02, y: 0.3, w: 0.6, h: 0.055, title: 'Making a change', text: 'Pick the weeks, type the change and a reason. Here Cyber week goes up 5%.' },
      { x: 0.02, y: 0.655, w: 0.58, h: 0.16, title: 'Cyber week', text: 'The busiest weeks of the year, so they get the closest look.' },
      { x: 0.7, y: 0.355, w: 0.135, h: 0.56, title: 'What changed', text: 'Shows what moved since the last forecast we sent out.' },
    ],
  },
  {
    label: 'The forecast tool',
    title: 'Turning a week into days',
    image: '/event-shots/shape-edit.webp',
    notes: [
      "Ops works day to day, so each terminal's week gets split into days.",
      'The split comes from recent normal weeks, with no holidays in them.',
    ],
    spots: [
      { x: 0.17, y: 0.36, w: 0.65, h: 0.24, title: 'A normal week', text: 'Monday to Friday each take about 20%. Sunday is close to nothing.' },
      { x: 0.78, y: 0.38, w: 0.2, h: 0.27, title: 'Changing a day', text: 'Here Saturday goes up to 6%, and the other days drop a little so the week still adds up.' },
      { x: 0.55, y: 0.64, w: 0.43, h: 0.26, title: 'What it changes', text: 'Before saving, you can see it in pieces. Saturday picks up about 20,000 across Quebec.' },
    ],
  },
  {
    label: 'The forecast tool',
    title: 'How close we got',
    image: '/event-shots/accuracy.webp',
    notes: [
      'Every day, we check what came in against what we forecast.',
    ],
    spots: [
      { x: 0.118, y: 0.405, w: 0.28, h: 0.17, title: 'Delivery stops', text: 'Red is what came in, blue is last year, dashed is the forecast.' },
      { x: 0.25, y: 0.6, w: 0.085, h: 0.17, title: 'Holidays', text: 'The drops to zero are holidays. Missing one means a terminal is staffed on a day with no parcels.' },
      { x: 0.694, y: 0.405, w: 0.3, h: 0.17, title: 'Agent terminals', text: 'These are smaller, so a few parcels move the line a lot.' },
    ],
  },
  {
    label: 'Hub Reporting',
    title: 'The same for the hubs',
    image: '/event-shots/powerbi-overview.webp',
    notes: [
      'Hubs sort parcels between terminals, so they need a forecast too.',
      'I built this report in Power BI so each hub can see its volume next to the forecast.',
    ],
    spots: [
      { x: 0, y: 0.16, w: 0.69, h: 0.44, title: 'Day by day', text: 'Each wave is a week, busy midweek and quiet on weekends. Red is actual, black is forecast.' },
      { x: 0.69, y: 0.02, w: 0.31, h: 0.5, title: 'Week by week', text: "How far off each week was. Here they're all within about 3%." },
      { x: 0, y: 0.61, w: 0.31, h: 0.39, title: 'Parcel types', text: 'Con, NonCon, mail and dangerous goods get handled differently, so the mix matters.' },
    ],
  },
  {
    label: 'Hub Reporting',
    title: 'Week over week at a hub',
    image: '/event-shots/powerbi-weekly-comparison.webp',
    notes: [
      'Pick any two weeks and see what changed for each type of parcel.',
    ],
    spots: [
      { x: 0.64, y: 0, w: 0.36, h: 0.15, title: 'Picking weeks', text: 'Choose a hub and any two weeks.' },
      { x: 0.57, y: 0.15, w: 0.43, h: 0.34, title: 'The total', text: 'Daily volume went up about 1.3% from one week to the next.' },
      { x: 0, y: 0.5, w: 0.47, h: 0.5, title: 'By type', text: 'Con and Mail went up the most. NonCon and Other dropped a little.' },
    ],
  },
  {
    label: 'My part',
    title: 'What I worked on',
    points: [
      {
        label: 'The web app the team runs the forecast in',
        title: 'The forecast app',
        text: 'One place for the whole week, from loading the data to publishing. Python and Flask, built on top of our model.',
        visual: {
          kind: 'flow',
          alt: 'Data going into the forecast app and what the app does with it',
          inputs: ['Daily ops data', 'Weekly history', 'Holidays and events'],
          center: 'Forecast app',
          outputs: ['Runs the R model', 'Weekly changes, with reasons', 'Split into days', 'Published versions', 'Daily accuracy'],
        },
      },
      {
        label: 'The Hub Reporting dashboard in Power BI',
        title: 'Hub Reporting',
        text: 'Hub volume and the forecast in one report, with a page for any two weeks side by side.',
        visual: {
          kind: 'flow',
          alt: 'Hub volume and forecast going into the Power BI report and its two pages',
          inputs: ['Hub actual volume', 'Hub forecast'],
          center: 'Power BI report',
          outputs: ['Overview, actual against forecast', 'Two weeks compared, by parcel type'],
        },
      },
      {
        label: 'Automating the manual steps in between',
        title: 'Steps the app runs now',
        text: 'Each of these is a button in the app, in the order the week goes.',
        visual: {
          kind: 'table',
          columns: ['Step', 'In the app'],
          rows: [
            ['Clean the daily ops data', 'Step 1'],
            ['Build the weekly history for the model', 'Step 2'],
            ['Run the model', 'Run the R model'],
            ['Split into days', 'Build daily forecast'],
            ['Send it out', 'Publish version'],
          ],
        },
      },
      {
        label: 'Demoing the app to our VP with my manager',
        title: 'The demo',
        text: 'My manager and I walked our VP through the app.',
        visual: { kind: 'image', src: '/event-shots/weekly-chart.webp', alt: 'The weekly forecast screen of the app' },
      },
    ],
    thumbs: ['/event-shots/weekly-chart.webp', '/event-shots/powerbi-overview.webp'],
    notes: [
      'The app is Python and Flask, built on top of our model.',
      'The dashboard pulls hub volume and forecast into one place.',
    ],
  },
]
