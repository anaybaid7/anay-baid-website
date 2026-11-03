// The slides on /purolator-intern-event, in order. Edit, reorder, add or
// remove slides here; the page builds itself from this list.
//
//   label   small text above the title
//   title   the headline
//   line    one sentence under it (optional)
//   image   a screenshot in public/event-shots/ (optional)
//   steps   a row of numbered steps instead of an image (optional)
//   visual  'map' draws the terminal map, 'units' the pieces per stop ratio,
//           'impact' the forecast slider, 'model' inside the forecast model,
//           'backtest' three models scored on held out weeks,
//           'qr' a code that opens these slides on a phone (optional)
//   notes   talking points, shown when you click the slide
//   spots   parts of the screenshot to zoom into (optional, see below)
//   stages  the steps the model slide walks through, one click each (optional)
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

// What opens under a step. Numbers in these are mock data.
export type Visual =
  | { kind: 'table'; columns: string[]; rows: (string | number)[][]; bars?: number; caption?: string }
  | { kind: 'lines'; alt: string; labels: string[]; series: { name: string; tone: 'muted' | 'accent'; values: number[] }[]; marks?: { at: number; text: string }[] }
  | { kind: 'flow'; alt: string; inputs: string[]; center: string; outputs: string[] }

// A step on the what I built slide. Click it to open its title, text and visual.
export type Step = { label: string; title: string; text: string; visual: Visual }

// A stage on the model slide, walked through one click at a time
export type Stage = { title: string; text: string }

export type Slide = {
  label: string
  title: string
  line?: string
  image?: string
  steps?: Step[]
  visual?: 'map' | 'units' | 'impact' | 'model' | 'backtest' | 'qr'
  notes: string[]
  spots?: Spot[]
  stages?: Stage[]
}

// The pieces per stop slide, one terminal's day, mock numbers. A route fits
// about 120 stops, so 1.25 pieces a stop is the same 150 pieces a route the
// forecast slider uses
export const units = { pieces: 4200, perRoute: 120, pps: 1.25 }

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
    notes: [
      "I'm on co-op with this team, this term I built the app we run the forecast in and worked on the models behind it",
      'Pick a division on the map to light up its terminals',
    ],
  },
  {
    label: 'The core number',
    title: 'Pieces per stop',
    line: 'A route only fits so many stops, so the more pieces each stop takes, the fewer routes the same parcels need',
    visual: 'units',
    notes: [
      'A piece is one parcel, a stop is one address, so an office tower can be one stop with a lot of pieces and a house is usually one',
      'A stop takes about the same time whether it drops one box or six, so density is where the cost is',
      'Online orders to homes are mostly one piece per stop, so in peak stops climb faster than pieces, which is why we forecast both',
      'Drag it toward dense, going from 1.25 to 1.5 pieces per stop saves 4 routes at one terminal in one day',
    ],
  },
  {
    label: 'Why it matters',
    title: 'One number sets up the whole day',
    line: 'Our forecast tells a terminal how many routes to run, so being off in either direction costs something',
    visual: 'impact',
    notes: [
      'Drag the forecast down and parcels wait a day',
      'Drag it up and vans go out half empty',
      'A few percent either way adds up fast across 135 terminals',
    ],
  },
  {
    label: 'What I built',
    title: 'One app for the whole week',
    line: 'The forecast used to be separate scripts run one by one, now it runs end to end in one app I built',
    steps: [
      {
        label: 'Data comes in',
        title: 'Getting the data ready',
        text: "Every terminal reports its pieces and stops each day, I rebuilt the team's prep scripts as steps in the app and matched the old output row for row",
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
        label: 'History gets cleaned',
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
        label: 'The models run',
        title: 'Running the models',
        text: "One button runs the team's R model from the app, I took out its old database and Java setup so it reads straight from files",
        visual: {
          kind: 'flow',
          alt: 'Inputs going into the app and out to three models',
          inputs: ['Cleaned weekly history', 'Holidays by province', 'Big client forecast'],
          center: 'Forecast app',
          outputs: ['R model', 'My Python version', 'Prophet'],
        },
      },
      {
        label: 'It goes out',
        title: 'Publishing it',
        text: 'Once the team has adjusted it and split it into days, one click publishes a versioned copy that ops, the hubs and the accuracy check all use',
        visual: {
          kind: 'flow',
          alt: 'The published forecast going to ops, the hubs and the accuracy check',
          inputs: ['Weekly forecast', 'Daily split'],
          center: 'Published version',
          outputs: ['Ops, staffing each day', 'Hubs, in Power BI', 'Accuracy, checked every day'],
        },
      },
    ],
    notes: [
      "Last week's real numbers go in, a forecast for the rest of the year comes out",
      'Before this it was scripts run one by one, now each step is a button in order',
      'The next two slides open up the models',
    ],
  },
  {
    label: 'Machine learning',
    title: 'Inside the forecast model',
    line: 'Every terminal gets its own machine learning model, trained on its own weekly history',
    visual: 'model',
    notes: [
      'This is the machine learning part, the model learns each terminal from its own past',
      "It's not a black box, every part it learns is something you can point at on the chart",
      'If anyone asks, it uses STL to split out the yearly pattern and ARIMA with holidays and the big client as extra inputs',
    ],
    stages: [
      { title: 'Training data', text: 'Three years of weekly pieces for one terminal, this is what the model learns from' },
      { title: 'Cleaning', text: 'One-off events and outages come out first, so it only learns from normal weeks' },
      { title: 'Yearly pattern', text: 'It learns what repeats every year, a quiet January, the summer dip and the climb into peak' },
      { title: 'Trend', text: 'Then the slow growth underneath that pattern' },
      { title: 'Holidays and big client', text: "Then how much each holiday takes off, and how volume follows our biggest client's own forecast" },
      { title: 'Forecast', text: 'Put the parts back together and run them forward to the end of next year' },
      { title: 'At scale', text: 'One model per terminal and per number we forecast, about a thousand trained every run' },
    ],
  },
  {
    label: 'Machine learning',
    title: "Testing on weeks it hasn't seen",
    line: 'I rebuilt the model in Python and added Prophet, then tested all three on weeks they never trained on',
    visual: 'backtest',
    notes: [
      'A model can look great on the weeks it learned from and still miss new ones, so we hide the last 26 weeks and see',
      'Numbers here are mock, the real test runs for each terminal against what actually came in',
      'If anyone asks, the Python version uses statsmodels and pmdarima, and Prophet is open source from Meta',
    ],
    stages: [
      { title: 'Hide 26 weeks', text: 'Train on everything before the line, then forecast the 26 weeks after it blind' },
      { title: 'Our R model', text: 'The model the team runs today' },
      { title: 'My Python version', text: 'The same model rebuilt in Python, so it runs right inside the forecast app' },
      { title: 'Prophet', text: "Meta's open source forecasting model, made for weekly business data with seasons and holidays" },
      { title: 'Compare', text: 'How far off each one was on average, and whether it ran high or low, which means spare vans or late parcels' },
    ],
  },
  {
    label: 'The forecast app',
    title: 'This year next to last year',
    line: 'The main screen of the app, our forecast next to what came in and last year',
    image: '/event-shots/weekly-chart.webp',
    notes: [
      'Red is this year, blue is last year, the dashed line is our forecast',
      'My manager and I demoed the app to our VP from this screen',
    ],
    spots: [
      { x: 0.006, y: 0.197, w: 0.596, h: 0.138, title: 'The year so far', text: 'Our forecast for the rest of the year, what came in so far and how both compare to last year' },
      { x: 0.514, y: 0.42, w: 0.222, h: 0.35, title: 'Summer', text: 'Volume dips in July and August and comes back in September' },
      { x: 0.743, y: 0.38, w: 0.23, h: 0.4, title: 'Peak', text: 'Late November into December is the busiest stretch of the year, so these are the weeks we work hardest to get right' },
    ],
  },
  {
    label: 'The forecast app',
    title: "Adding what the model can't see",
    line: 'The model gets us close, then we add what only people know',
    image: '/event-shots/weekly-grid.webp',
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
    label: 'The forecast app',
    title: 'Turning a week into days',
    line: 'Staffing happens by the day, so I built the split that turns each week into days',
    image: '/event-shots/shape-edit.webp',
    notes: [
      "Ops works day by day, so each terminal's week gets split into days",
      'The split comes from recent normal weeks with no holidays in them',
      'The app checks the days add back up to the week before anything is saved',
    ],
    spots: [
      { x: 0.17, y: 0.36, w: 0.65, h: 0.24, title: 'A normal week', text: 'Monday to Friday each get about 20% and Sunday gets almost nothing' },
      { x: 0.78, y: 0.38, w: 0.2, h: 0.27, title: 'Changing a day', text: 'Here Saturday goes up to 6% and the other days give a little back so the week still adds up' },
      { x: 0.55, y: 0.64, w: 0.43, h: 0.26, title: 'What it changes', text: 'Before saving you see it in pieces, Saturday picks up about 20,000 across Quebec' },
    ],
  },
  {
    label: 'The forecast app',
    title: 'How close we got',
    line: 'Every day we line up what came in against what we said would',
    image: '/event-shots/accuracy.webp',
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
    image: '/event-shots/hub-reporting.webp',
    notes: [
      'Hubs sort parcels between terminals, so they need a forecast too',
      'Everything a hub needs is on one page, how close we were and what changed',
    ],
    spots: [
      { x: 0.006, y: 0.118, w: 0.614, h: 0.434, title: 'Day by day', text: 'Each wave is a week, busy midweek and quiet on weekends, red is actual and black is forecast' },
      { x: 0.627, y: 0.118, w: 0.213, h: 0.434, title: 'Week by week', text: "How far off each week was, and here they're all within about 3%" },
      { x: 0.006, y: 0.564, w: 0.494, h: 0.43, title: 'Parcel types', text: 'Con, NonCon, mail and dangerous goods are handled differently, so the mix matters as much as the total' },
      { x: 0.627, y: 0.008, w: 0.369, h: 0.544, title: 'Two weeks', text: 'Pick any two weeks, here daily volume went up about 1.3%' },
      { x: 0.506, y: 0.564, w: 0.49, h: 0.43, title: 'What moved', text: 'Con and Mail went up the most while NonCon and Other dropped a little' },
    ],
  },
  {
    label: 'Thanks',
    title: 'Thanks for listening',
    line: 'Scan to open these slides on your phone and click through anything I skipped',
    visual: 'qr',
    notes: [
      'Next we are looking at outside signals like weather and events as model inputs, and planning couriers per terminal from the forecast',
      'Happy to take questions',
    ],
  },
]
