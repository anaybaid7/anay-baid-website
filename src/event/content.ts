// The slides on /purolator-intern-event, in order. Edit, reorder, add or
// remove slides here; the page builds itself from this list.
//
//   label   small text above the title
//   title   the headline
//   line    one sentence under it (optional)
//   image   a screenshot in public/event-shots/ (optional)
//   steps   a row of numbered steps instead of an image (optional)
//   notes   talking points, shown when you click the slide

export type Slide = {
  label: string
  title: string
  line?: string
  image?: string
  steps?: string[]
  notes: string[]
}

export const deck = {
  title: 'Forecasting the network',
  kicker: "Let's Connect",
  mockNote: 'Numbers in the screenshots are mock data.',
}

export const slides: Slide[] = [
  {
    label: "Purolator, Network Engineering",
    title: 'Forecasting the network',
    line: 'How many parcels is each terminal going to see next week?',
    notes: [
      "That's the question our team answers every week.",
      '136 terminals, 7 divisions, pickup and delivery.',
      'The answer decides couriers, trucks and dock hours.',
    ],
  },
  {
    label: 'The weekly cycle',
    title: 'From last week to next week',
    steps: ['Actuals come in', 'Clean them up', 'Model forecasts', 'Planners adjust', 'Split into days', 'Ops and the hubs use it'],
    notes: [
      'Every week starts with what actually happened.',
      'A statistical model in R projects each terminal forward.',
      'People add what the model cannot know.',
      'Ops plans each day from the result.',
    ],
  },
  {
    label: 'Seeing the year',
    title: 'Next week, against every week before it',
    image: '/event-shots/weekly-chart.webp',
    notes: [
      'Red is this year, blue is last year, dashed is the forecast.',
      'Holidays, sales events and peak season all move volume.',
      'Peak in late November is the week everything is planned around.',
    ],
  },
  {
    label: 'People in the loop',
    title: 'The model is a starting point',
    image: '/event-shots/weekly-grid.webp',
    notes: [
      'Planners know things a model never sees, like a new client or a backlog.',
      'They adjust the weeks that need it.',
      'Every change keeps who made it and why.',
    ],
  },
  {
    label: 'Down to the day',
    title: 'A week is not five equal days',
    image: '/event-shots/shape-edit.webp',
    notes: [
      'Mondays are heavy. A holiday pushes volume into the next day.',
      'Each terminal gets its own pattern from weeks like the one coming up.',
      'That daily number is what staffing works from.',
    ],
  },
  {
    label: 'Keeping score',
    title: 'Checking ourselves every day',
    image: '/event-shots/accuracy.webp',
    notes: [
      'Each day is compared with the forecast we made for it.',
      'Misses show where the model or the plan needs work.',
    ],
  },
  {
    label: 'For the hubs',
    title: 'The same idea, at the hubs',
    image: '/event-shots/powerbi-overview.webp',
    notes: [
      'Hubs sort parcels between terminals.',
      'This Power BI report puts their actual volume next to the forecast.',
    ],
  },
  {
    label: 'For the hubs',
    title: 'What changed this week',
    image: '/event-shots/powerbi-weekly-comparison.webp',
    notes: [
      'Pick any two weeks and see the difference by type of parcel.',
      'Good for spotting a shift early.',
    ],
  },
  {
    label: 'My part',
    title: 'What I worked on',
    line: 'The app the team runs the forecast in, the hub dashboard, and automating the steps in between.',
    notes: [
      "Built the forecast app with Python and Flask on top of the team's own model.",
      'Built the Hub Reporting dashboard in Power BI.',
      'Demoed the app to our VP with my manager.',
    ],
  },
]
