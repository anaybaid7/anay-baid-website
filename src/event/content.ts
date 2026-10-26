// The slides on /purolator-intern-event, in order. Edit, reorder, add or
// remove slides here; the page builds itself from this list.
//
//   label   small text above the title
//   title   the headline
//   line    one sentence under it (optional)
//   image   a screenshot in public/event-shots/ (optional)
//   steps   a row of numbered steps instead of an image (optional)
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

export type Slide = {
  label: string
  title: string
  line?: string
  image?: string
  steps?: string[]
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
    notes: [
      'Ops uses that number to decide how many couriers and trucks to send out.',
      "If we're too low, parcels sit at the terminal. If we're too high, we pay for trucks we didn't need.",
    ],
  },
  {
    label: 'Our week',
    title: 'How the forecast comes together',
    steps: ["Last week's numbers come in", 'We clean them up', 'The model runs', 'We adjust it', 'It gets split into days', 'Ops and the hubs use it'],
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
      { x: 0.017, y: 0.21, w: 0.585, h: 0.125, title: 'The year so far', text: 'Our forecast for the rest of the year, what came in so far, and how both compare to last year.' },
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
    notes: [
      'I built the web app the team uses to run the forecast, in Python and Flask, on top of our model.',
      'I built the Hub Reporting dashboard in Power BI.',
      'I automated some of the manual steps between the model and the final forecast.',
      'I got to demo the app to our VP with my manager.',
    ],
  },
]
