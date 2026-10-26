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
    label: 'Network Engineering at Purolator',
    title: 'Forecasting parcel volume for every terminal',
    line: 'Our team works out how many parcels each terminal will get in the next few weeks, so ops can plan for it.',
    notes: [
      'We do this for 135 terminals, for both pickup and delivery.',
      'Ops uses our numbers to decide how many couriers and trucks they need each day.',
      "If we're too low, parcels get left behind. If we're too high, we pay for trucks and couriers we didn't need.",
    ],
  },
  {
    label: 'How a week works',
    title: 'How the forecast gets made each week',
    steps: ["Last week's actuals", 'Cleaned up', 'Model forecast', 'Planner changes', 'Split into days', 'Sent to ops and the hubs'],
    notes: [
      "We start with last week's actual volume and clean it up.",
      'Our model in R then forecasts every terminal for the weeks ahead.',
      "Planners adjust it for things the model can't know about, and then it gets split into days for ops and the hubs.",
    ],
  },
  {
    label: 'Weekly forecast',
    title: 'This year against last year, week by week',
    image: '/event-shots/weekly-chart.webp',
    notes: [
      'Red is this year so far, blue is last year, and the dashed line is our forecast for the rest of the year.',
    ],
    spots: [
      { x: 0.017, y: 0.21, w: 0.585, h: 0.125, title: 'Year so far', text: 'The forecast for the rest of the year, what came in so far, and how both compare to last year.' },
      { x: 0.514, y: 0.42, w: 0.222, h: 0.35, title: 'Summer', text: 'Volume usually drops in July and August and comes back in September.' },
      { x: 0.743, y: 0.38, w: 0.23, h: 0.4, title: 'Peak season', text: 'Late November into December is the busiest time of the year, so these weeks get planned the most carefully.' },
    ],
  },
  {
    label: 'Weekly forecast',
    title: 'Where planners adjust the forecast',
    image: '/event-shots/weekly-grid.webp',
    notes: [
      'The model only knows what happened before.',
      'Planners know things like a new client starting or a sale moving, so they adjust those weeks.',
    ],
    spots: [
      { x: 0.02, y: 0.3, w: 0.6, h: 0.055, title: 'Adjusting weeks', text: 'You pick the weeks, type the change and add a reason. Here Cyber week goes up 5%.' },
      { x: 0.02, y: 0.655, w: 0.58, h: 0.16, title: 'Cyber week', text: "These are the busiest weeks of the year, so planners look at them the most." },
      { x: 0.7, y: 0.355, w: 0.135, h: 0.56, title: 'Changes since the last version', text: 'This shows what changed since the last forecast we sent out.' },
    ],
  },
  {
    label: 'Daily split',
    title: 'Splitting the week into days',
    image: '/event-shots/shape-edit.webp',
    notes: [
      "Ops plans each day, so every terminal's weekly number gets split into days.",
      'The split comes from recent weeks with no holidays in them.',
    ],
    spots: [
      { x: 0.17, y: 0.36, w: 0.65, h: 0.24, title: 'A typical week', text: 'Monday to Friday each get roughly 20% of the week, and Sunday gets almost nothing.' },
      { x: 0.78, y: 0.38, w: 0.2, h: 0.27, title: 'Changing a day', text: 'Here Saturday goes up to 6%, and the other days come down a bit so the week still adds up.' },
      { x: 0.55, y: 0.64, w: 0.43, h: 0.26, title: 'Effect on volume', text: 'Before saving, you can see what it means in pieces. About 20,000 more on Saturday across Quebec.' },
    ],
  },
  {
    label: 'Accuracy',
    title: 'Checking the forecast against what came in',
    image: '/event-shots/accuracy.webp',
    notes: [
      "Once a day's numbers come in, we check them against the forecast to see where we were off.",
    ],
    spots: [
      { x: 0.118, y: 0.405, w: 0.28, h: 0.17, title: 'Total delivery stops', text: 'Red is actual, blue is last year, and the dashed line is the forecast.' },
      { x: 0.25, y: 0.6, w: 0.085, h: 0.17, title: 'Holidays', text: 'The drops to zero are holidays. If the forecast missed one, a terminal would be staffed on a day with no parcels.' },
      { x: 0.694, y: 0.405, w: 0.3, h: 0.17, title: 'Agent terminals', text: 'These are smaller, so a few parcels move the line a lot more.' },
    ],
  },
  {
    label: 'Hub Reporting',
    title: 'Hub volume against the forecast',
    image: '/event-shots/powerbi-overview.webp',
    notes: [
      'Hubs sort parcels going between terminals, so they need a forecast too.',
      "I built this Power BI report to show each hub's actual volume next to its forecast.",
    ],
    spots: [
      { x: 0, y: 0.16, w: 0.69, h: 0.44, title: 'Daily volume', text: 'Each wave is one week, busy midweek and low on weekends. Red is actual and black is the forecast.' },
      { x: 0.69, y: 0.02, w: 0.31, h: 0.5, title: 'Weekly accuracy', text: 'This shows how far off the forecast was for each week. Here every week is within about 3%.' },
      { x: 0, y: 0.61, w: 0.31, h: 0.39, title: 'Commodity mix', text: 'Con, NonCon, mail and dangerous goods get handled differently at the hub, so it helps to see the split.' },
    ],
  },
  {
    label: 'Hub Reporting',
    title: 'Comparing two weeks at a hub',
    image: '/event-shots/powerbi-weekly-comparison.webp',
    notes: [
      'Pick any two weeks at a hub and see what changed for each type of parcel.',
    ],
    spots: [
      { x: 0.64, y: 0, w: 0.36, h: 0.15, title: 'Choosing the weeks', text: 'You choose the hub and the two weeks you want to compare.' },
      { x: 0.57, y: 0.15, w: 0.43, h: 0.34, title: 'Totals', text: 'Average daily volume went up about 1.3% between the two weeks.' },
      { x: 0, y: 0.5, w: 0.47, h: 0.5, title: 'By category', text: 'Con and Mail went up the most, while NonCon and Other went down a little.' },
    ],
  },
  {
    label: 'My part',
    title: 'What I worked on this term',
    notes: [
      "I built the web app the team uses to run the forecast, in Python and Flask, on top of our model.",
      'I built the Hub Reporting dashboard in Power BI.',
      'I automated some steps between the model and the final forecast that used to be done by hand.',
      'I got to demo the app to our VP with my manager.',
    ],
  },
]
