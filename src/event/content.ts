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
    label: 'Purolator, Network Engineering',
    title: 'How many parcels is each terminal going to see next week?',
    line: "That's the question my team answers, every week, for the whole country.",
    notes: [
      '136 terminals, 7 divisions, pickup and delivery.',
      'The answer decides how many couriers go out, how many trucks run, how long the docks stay open.',
      'Too low and parcels sit. Too high and we pay for trucks that drive half empty.',
    ],
  },
  {
    label: 'The weekly cycle',
    title: 'Every week, the same loop',
    steps: ['Last week comes in', 'Clean it up', 'Model forecasts', 'Planners adjust', 'Split into days', 'Ops and the hubs plan from it'],
    notes: [
      'It starts with what actually happened last week.',
      'A statistical model projects every terminal forward.',
      'Then people add what the model can\'t know.',
      'By the end of the week ops is planning from it.',
    ],
  },
  {
    label: 'Seeing the year',
    title: 'The year has a shape',
    image: '/event-shots/weekly-chart.webp',
    notes: [
      'Red is this year, blue is last year, dashed is the forecast.',
      'Summer is quiet. Then everything builds to late November.',
    ],
    spots: [
      { x: 0.017, y: 0.21, w: 0.585, h: 0.125, title: 'Where the year stands', text: 'The rest of the year, what came in so far, and both against last year. The numbers the business plans around.' },
      { x: 0.514, y: 0.42, w: 0.222, h: 0.35, title: 'Summer', text: 'Volume dips through July and August, then climbs back in September.' },
      { x: 0.743, y: 0.38, w: 0.23, h: 0.4, title: 'Peak', text: 'Cyber week runs about a third above a normal week. Extra couriers, trucks and shifts for it get booked weeks ahead, off this line.' },
    ],
  },
  {
    label: 'People in the loop',
    title: 'The model is a starting point',
    image: '/event-shots/weekly-grid.webp',
    notes: [
      'A model only knows the past.',
      'Planners know about the new client, the backlog, the sale that got moved.',
    ],
    spots: [
      { x: 0.02, y: 0.3, w: 0.6, h: 0.055, title: "A person's call", text: 'Say ops expects a bigger peak than the model. A planner lifts Cyber week by 5% and writes down why.' },
      { x: 0.02, y: 0.655, w: 0.58, h: 0.16, title: 'Cyber week', text: 'Four weeks that make or break the year. These get looked at more than any others.' },
      { x: 0.7, y: 0.355, w: 0.135, h: 0.56, title: 'Nothing changes quietly', text: 'Every change is measured against what was last sent out, so ops can see exactly what moved.' },
    ],
  },
  {
    label: 'Down to the day',
    title: 'A week is not five equal days',
    image: '/event-shots/shape-edit.webp',
    notes: [
      'Staffing happens by the day, so the week has to be split.',
      'Each terminal gets its own pattern from recent normal weeks.',
    ],
    spots: [
      { x: 0.17, y: 0.36, w: 0.65, h: 0.24, title: 'A normal week', text: 'Monday to Friday each take about a fifth. Sunday is close to nothing.' },
      { x: 0.78, y: 0.38, w: 0.2, h: 0.27, title: 'Saturday', text: 'Here Saturday gets pulled up to 6%, and the weekdays give a little back so the week still adds up.' },
      { x: 0.55, y: 0.64, w: 0.43, h: 0.26, title: 'Before anyone hits save', text: 'It shows what that means in parcels. About 17,500 more on Saturday across the 24 terminals in Quebec.' },
    ],
  },
  {
    label: 'Keeping score',
    title: 'Checking ourselves every day',
    image: '/event-shots/accuracy.webp',
    notes: [
      'Every day, actuals are lined up against what we said would happen.',
      'The misses tell us where to look next week.',
    ],
    spots: [
      { x: 0.118, y: 0.405, w: 0.28, h: 0.17, title: 'Every day, every terminal', text: 'Red is what came in, blue is last year, dashed is the forecast. Each day gets checked as soon as its numbers land.' },
      { x: 0.25, y: 0.6, w: 0.085, h: 0.17, title: 'Holidays', text: 'The drops to zero are holidays. Miss one and a whole terminal is staffed for a day with no parcels.' },
      { x: 0.694, y: 0.405, w: 0.3, h: 0.17, title: 'Small terminals', text: 'Agent terminals are small, so a few parcels swing the line a lot. That is where misses show up first.' },
    ],
  },
  {
    label: 'For the hubs',
    title: 'The same idea, at the hubs',
    image: '/event-shots/powerbi-overview.webp',
    notes: [
      'Hubs sort parcels between terminals, so they need the same answer.',
      'This Power BI report puts their actual volume next to the forecast.',
    ],
    spots: [
      { x: 0, y: 0.16, w: 0.69, h: 0.44, title: 'Every day of every week', text: 'Each wave is a week, busy midweek and quiet on the weekend. Two lines on top of each other is what you want to see.' },
      { x: 0.69, y: 0.02, w: 0.31, h: 0.5, title: 'Week by week', text: 'How far off each week was. All of these are within 4%.' },
      { x: 0, y: 0.61, w: 0.31, h: 0.39, title: "What's in the parcels", text: 'Conveyable, non-conveyable, mail and dangerous goods are each handled differently, so the mix matters as much as the total.' },
    ],
  },
  {
    label: 'For the hubs',
    title: 'What changed this week',
    image: '/event-shots/powerbi-weekly-comparison.webp',
    notes: [
      'Pick two weeks at any hub and see what changed.',
      'It catches a shift before it turns into a problem on the floor.',
    ],
    spots: [
      { x: 0.64, y: 0, w: 0.36, h: 0.15, title: 'Pick two weeks', text: 'Any two weeks at any hub. This one is Richmond.' },
      { x: 0.57, y: 0.15, w: 0.43, h: 0.34, title: 'The short version', text: 'Daily average down about 2.5% from one week to the other.' },
      { x: 0, y: 0.5, w: 0.47, h: 0.5, title: 'What moved', text: 'Mail and Con dropped the most. NonCon went up.' },
    ],
  },
  {
    label: 'My part',
    title: 'What my team let me take on',
    line: 'Real pieces of this process, not a side project.',
    notes: [
      "Built the app the team runs the forecast in, in Python and Flask, on top of the team's own model.",
      'Built the Hub Reporting dashboard in Power BI.',
      'Automated the steps in between that used to be done by hand.',
      'Got to demo the app to our VP alongside my manager.',
    ],
  },
]
