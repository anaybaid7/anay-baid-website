// The slides on /purolator-intern-event, in order. Edit, reorder, add or
// remove slides here; the page builds itself from this list.
//
//   label   small text above the title
//   title   the headline
//   line    one sentence under it (optional)
//   image   a screenshot in public/event-shots/ (optional)
//   steps   a row of numbered steps instead of an image (optional)
//   visual  'map' draws the terminal map, 'impact' the forecast slider,
//           'qr' a code that opens these slides on a phone (optional)
//   time    about how many seconds to spend on the slide, for the presenter timer
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

// One piece of a wireframe. Positions are in the wireframe's own units.
export type WireItem = {
  type: 'box' | 'button' | 'input' | 'select' | 'text' | 'line' | 'mark' | 'bar'
  x: number
  y: number
  w?: number
  h?: number
  label?: string
  strong?: boolean
  faint?: boolean
  size?: 'lg'
  align?: 'end'
  // a placeholder chart drawn inside a box
  chart?: 'line' | 'bars' | 'donut' | 'rows'
}

// What opens under a step or a point. Numbers in these are mock data.
export type Visual =
  | { kind: 'table'; columns: string[]; rows: (string | number)[][]; bars?: number; caption?: string }
  | { kind: 'lines'; alt: string; labels: string[]; series: { name: string; tone: 'muted' | 'accent'; values: number[] }[]; marks?: { at: number; text: string }[] }
  | { kind: 'flow'; alt: string; inputs: string[]; center: string; outputs: string[] }
  | { kind: 'bars'; alt: string; labels: string[]; values: number[]; unit?: string; accent?: number[]; total?: number }
  | { kind: 'wireframe'; alt: string; w: number; h: number; items: WireItem[] }
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
  visual?: 'map' | 'impact' | 'qr'
  points?: Point[]
  thumbs?: string[]
  notes: string[]
  spots?: Spot[]
  time: number
}

// The forecast slider on the why it matters slide, mock numbers for one
// terminal on one day
export const impact = { pieces: 4200, perRoute: 150, range: 20 }

export const deck = {
  title: 'Forecasting the network',
  kicker: "Let's Connect",
  mockNote: 'Numbers in the screenshots are mock data',
  url: 'https://a2baid.netlify.app/purolator-intern-event',
}

export const slides: Slide[] = [
  {
    label: 'Network Engineering, Purolator',
    title: 'Forecasting parcel volume',
    line: 'Every week our team works out how many parcels each of our 135 terminals will get, for pickup and delivery',
    visual: 'map',
    time: 30,
    notes: [
      "I'm on co-op with this team, working on the tools we use to do it",
      'Pick a division on the map to light up its terminals',
    ],
  },
  {
    label: 'Why it matters',
    title: 'One number sets up the whole day',
    line: 'Our forecast tells a terminal how many routes to run, so being off in either direction costs something',
    visual: 'impact',
    time: 45,
    notes: [
      'Drag the forecast down and parcels wait a day',
      'Drag it up and vans go out half empty',
      'A few percent either way adds up fast across 135 terminals',
    ],
  },
  {
    label: 'Our week',
    title: 'How the forecast comes together',
    steps: [
      {
        label: "Last week's numbers come in",
        title: 'The daily numbers',
        text: 'Every terminal reports its pieces and stops for each day, and we pull a fresh copy at the start of every week',
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
          bars: 1,
          caption: 'One terminal, one week, mock numbers',
        },
      },
      {
        label: 'We clean them up',
        title: 'Cleaning the history',
        text: 'A short holiday week gets scaled up to a full one and one-off spikes come out, so the model learns what a normal week looks like',
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
        text: 'Our model in R takes years of history plus what we know is coming and forecasts every terminal for the rest of the year',
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
        text: 'Pick the weeks, type the change and why, and the app keeps a record of who made it',
        visual: {
          kind: 'wireframe',
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
        text: "Each terminal's week gets split by the share each day usually gets, shown here for a week of 98,400 pieces",
        visual: {
          kind: 'bars',
          alt: 'Share of the week by day',
          labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          values: [0.3, 20.1, 21.0, 20.4, 19.6, 18.4, 0.2],
          unit: '%',
          accent: [1, 2, 3, 4, 5],
          total: 98400,
        },
      },
      {
        label: 'Ops and the hubs use it',
        title: 'Where it goes',
        text: 'Once we publish it, ops plans each day from it, the hubs see it in Power BI and every day gets checked against what came in',
        visual: {
          kind: 'flow',
          alt: 'The published forecast going to ops, the hubs and the accuracy check',
          inputs: ['Weekly forecast', 'Daily split'],
          center: 'Published forecast',
          outputs: ['Ops, staffing each day', 'Hubs, in Power BI', 'Accuracy, checked every day'],
        },
      },
    ],
    time: 75,
    notes: [
      "Last week's real numbers go in, a forecast for the rest of the year comes out",
      'Most of the work is the cleaning and checking in between',
      'Click any step to open it up',
    ],
  },
  {
    label: 'The forecast tool',
    title: 'This year next to last year',
    line: 'Peak season in late November is the stretch the whole year gets planned around',
    image: '/event-shots/weekly-chart.webp',
    time: 35,
    notes: [
      'Red is this year, blue is last year, the dashed line is our forecast',
    ],
    spots: [
      { x: 0.006, y: 0.197, w: 0.596, h: 0.138, title: 'The year so far', text: 'Our forecast for the rest of the year, what came in so far and how both compare to last year' },
      { x: 0.514, y: 0.42, w: 0.222, h: 0.35, title: 'Summer', text: 'Volume dips in July and August and comes back in September' },
      { x: 0.743, y: 0.38, w: 0.23, h: 0.4, title: 'Peak', text: 'Late November into December is the busiest stretch of the year, so these are the weeks we work hardest to get right' },
    ],
  },
  {
    label: 'The forecast tool',
    title: "Adding what the model can't see",
    line: 'The model gets us close, then we add what only people know',
    image: '/event-shots/weekly-grid.webp',
    time: 30,
    notes: [
      'The model only knows the past',
      'We know when a new client is starting or a sale date moves, so we adjust those weeks by hand',
    ],
    spots: [
      { x: 0.02, y: 0.3, w: 0.6, h: 0.055, title: 'Making a change', text: 'Pick the weeks, type the change and a reason, here Cyber week goes up 5%' },
      { x: 0.02, y: 0.655, w: 0.58, h: 0.16, title: 'Cyber week', text: 'The busiest weeks of the year, so they get the closest look' },
      { x: 0.7, y: 0.355, w: 0.135, h: 0.56, title: 'What changed', text: 'Shows what moved since the last forecast we sent out' },
    ],
  },
  {
    label: 'The forecast tool',
    title: 'Turning a week into days',
    line: 'Staffing happens by the day, so every week gets split into days',
    image: '/event-shots/shape-edit.webp',
    time: 30,
    notes: [
      "Ops works day by day, so each terminal's week gets split into days",
      'The split comes from recent normal weeks with no holidays in them',
    ],
    spots: [
      { x: 0.17, y: 0.36, w: 0.65, h: 0.24, title: 'A normal week', text: 'Monday to Friday each get about 20% and Sunday gets almost nothing' },
      { x: 0.78, y: 0.38, w: 0.2, h: 0.27, title: 'Changing a day', text: 'Here Saturday goes up to 6% and the other days give a little back so the week still adds up' },
      { x: 0.55, y: 0.64, w: 0.43, h: 0.26, title: 'What it changes', text: 'Before saving you see it in pieces, Saturday picks up about 20,000 across Quebec' },
    ],
  },
  {
    label: 'The forecast tool',
    title: 'How close we got',
    line: 'Every day we line up what came in against what we said would',
    image: '/event-shots/accuracy.webp',
    time: 30,
    notes: [
      'Every day we check what actually came in against what we forecast',
    ],
    spots: [
      { x: 0.118, y: 0.405, w: 0.28, h: 0.17, title: 'Delivery stops', text: 'Red is what came in, blue is last year and dashed is the forecast' },
      { x: 0.25, y: 0.6, w: 0.085, h: 0.17, title: 'Holidays', text: 'The drops to zero are holidays, and missing one means a terminal is staffed on a day with no parcels' },
      { x: 0.694, y: 0.405, w: 0.3, h: 0.17, title: 'Agent terminals', text: 'These are smaller, so a handful of parcels moves the line a lot' },
    ],
  },
  {
    label: 'Hub Reporting',
    title: 'The same for the hubs',
    line: 'Hubs need their own forecast, so I built them a report in Power BI',
    image: '/event-shots/powerbi-overview.webp',
    time: 30,
    notes: [
      'Hubs sort parcels between terminals, so they need a forecast too',
      'I built this report in Power BI so each hub can see its volume next to the forecast',
    ],
    spots: [
      { x: 0, y: 0.16, w: 0.69, h: 0.44, title: 'Day by day', text: 'Each wave is a week, busy midweek and quiet on weekends, red is actual and black is forecast' },
      { x: 0.69, y: 0.02, w: 0.31, h: 0.5, title: 'Week by week', text: "How far off each week was, and here they're all within about 3%" },
      { x: 0, y: 0.61, w: 0.31, h: 0.39, title: 'Parcel types', text: 'Con, NonCon, mail and dangerous goods are handled differently, so the mix matters as much as the total' },
    ],
  },
  {
    label: 'Hub Reporting',
    title: 'Week over week at a hub',
    line: 'Pick any two weeks and see what changed for each type of parcel',
    image: '/event-shots/powerbi-weekly-comparison.webp',
    time: 20,
    notes: [
      'Pick any two weeks at a hub and see what changed for each type of parcel',
    ],
    spots: [
      { x: 0.64, y: 0, w: 0.36, h: 0.15, title: 'Picking weeks', text: 'Choose a hub and any two weeks' },
      { x: 0.57, y: 0.15, w: 0.43, h: 0.34, title: 'The total', text: 'Daily volume went up about 1.3% from one week to the next' },
      { x: 0, y: 0.5, w: 0.47, h: 0.5, title: 'By type', text: 'Con and Mail went up the most while NonCon and Other dropped a little' },
    ],
  },
  {
    label: 'My part',
    title: 'What I worked on',
    points: [
      {
        label: 'The web app the team runs the forecast in',
        title: 'The forecast app',
        text: 'One place for the whole week, from loading the data to publishing, built in Python and Flask on top of our model',
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
        text: "Two pages, one puts each hub's volume next to its forecast and the other compares any two weeks by parcel type",
        visual: {
          kind: 'wireframe',
          alt: 'Wireframe of the two report pages',
          w: 640,
          h: 360,
          items: [
            { type: 'text', x: 4, y: 16, label: 'Overview', strong: true },
            { type: 'box', x: 4, y: 26, w: 308, h: 330 },
            { type: 'select', x: 16, y: 40, w: 52, h: 24 },
            { type: 'select', x: 74, y: 40, w: 52, h: 24 },
            { type: 'select', x: 132, y: 40, w: 52, h: 24 },
            { type: 'select', x: 190, y: 40, w: 52, h: 24 },
            { type: 'select', x: 248, y: 40, w: 52, h: 24 },
            { type: 'box', x: 16, y: 76, w: 200, h: 120, chart: 'line' },
            { type: 'box', x: 224, y: 76, w: 76, h: 268, chart: 'rows' },
            { type: 'box', x: 16, y: 206, w: 96, h: 138, chart: 'donut' },
            { type: 'box', x: 120, y: 206, w: 96, h: 138, chart: 'bars' },
            { type: 'text', x: 328, y: 16, label: 'Two weeks compared', strong: true },
            { type: 'box', x: 328, y: 26, w: 308, h: 330 },
            { type: 'select', x: 340, y: 40, w: 64, h: 24 },
            { type: 'select', x: 410, y: 40, w: 64, h: 24 },
            { type: 'select', x: 480, y: 40, w: 64, h: 24 },
            { type: 'select', x: 550, y: 40, w: 64, h: 24 },
            { type: 'box', x: 340, y: 76, w: 284, h: 92, chart: 'rows' },
            { type: 'box', x: 340, y: 176, w: 65, h: 40 },
            { type: 'bar', x: 350, y: 193, w: 30, h: 7 },
            { type: 'box', x: 413, y: 176, w: 65, h: 40 },
            { type: 'bar', x: 423, y: 193, w: 37, h: 7 },
            { type: 'box', x: 486, y: 176, w: 65, h: 40 },
            { type: 'bar', x: 496, y: 193, w: 44, h: 7 },
            { type: 'box', x: 559, y: 176, w: 65, h: 40 },
            { type: 'bar', x: 569, y: 193, w: 31, h: 7 },
            { type: 'box', x: 340, y: 226, w: 138, h: 118, chart: 'bars' },
            { type: 'box', x: 486, y: 226, w: 138, h: 118, chart: 'bars' },
          ],
        },
      },
      {
        label: 'Automating the manual steps in between',
        title: 'Steps the app runs now',
        text: 'Each of these is a button in the app now, in the order the week runs',
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
        text: 'My manager and I walked our VP through the app',
        visual: { kind: 'image', src: '/event-shots/weekly-chart.webp', alt: 'The weekly forecast screen of the app' },
      },
    ],
    thumbs: ['/event-shots/weekly-chart.webp', '/event-shots/powerbi-overview.webp'],
    time: 45,
    notes: [
      'Click a line to open it up',
      'Happy to show any of these properly after',
    ],
  },
  {
    label: 'Thanks',
    title: 'Thanks for listening',
    line: 'Scan to open these slides on your phone and click through anything I skipped',
    visual: 'qr',
    time: 10,
    notes: [
      'Happy to take questions',
    ],
  },
]
