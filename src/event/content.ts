// Everything written on /purolator-intern-event. Change the words here; the
// layout is in EventPage.tsx.

export const event = {
  kicker: "Let's Connect, Purolator intern event",
  title: 'Forecasting the network',
  lede:
    "I'm Anay, a Software & Network Optimization Engineer co-op on Purolator's Network Engineering team. This page is what the team does, what I've built this year, and where it's gone.",
  sub: "Screenshots are from the real tools. Volumes in them are scaled and client names are swapped out; the shapes and percentages are real.",
}

export const glance: [string, string][] = [
  ['Team', 'Network Engineering'],
  ['Role', 'Software & Network Optimization Engineer, co-op'],
  ['The network', '136 terminals in 7 divisions, forecast every week'],
  ['What gets forecast', 'Pieces and stops, delivery and pickup, PCL and agent'],
  ['Built with', 'Python, Flask, R, Power BI, SQL'],
  ['Shown to', 'Our VP, with my manager'],
]

export const team = {
  intro:
    'Network Engineering plans how much volume each terminal will see, week by week and day by day. Those numbers decide couriers, dock hours and how the network gets ready for peak.',
  steps: [
    { title: 'Courier Ops actuals', text: 'What each terminal handled, every day' },
    { title: 'Clean and normalize', text: 'Steps 1 and 2 turn it into weekly history' },
    { title: 'Peak Model.R', text: 'A weekly forecast for every terminal and metric' },
    { title: 'Review and edit', text: 'Planners adjust for what the model cannot know' },
    { title: 'Daily split', text: 'Each week broken into days for operations' },
    { title: 'Dashboards', text: 'Power BI for the hubs and the network' },
  ],
}

export const tool = {
  name: 'Forecast Tool',
  summary:
    "One app for the whole weekly cycle, from this week's Courier Ops pull to the daily forecast operations uses. I built it from scratch on top of the team's own scripts and model, so the numbers match what the team already trusted.",
  before: [
    'The model, the cleanup steps and the daily split were separate scripts run by hand',
    'Peak Model.R needed a MySQL database and Java to run',
    'Weekly changes lived in spreadsheets, with no record of who changed what or why',
    'The weeks each daily shape came from were hard-coded in a script',
    'Nothing checked how close last month\'s forecast actually was',
  ],
  now: [
    'Upload the pull, run Steps 1 and 2 and the R model from one page, and watch terminals finish live',
    'The model reads plain files, so it runs on any laptop or in a container',
    'Edit weeks like Excel, and every change keeps who, when and why, with published versions to compare against',
    'Shape weeks are picked on a calendar that knows where every holiday falls, and can be dragged on the chart',
    'An Accuracy page scores each day against the forecast that was live before it',
  ],
  shots: [
    {
      src: '/event-shots/weekly-chart.webp',
      title: 'Weekly forecast',
      text: 'Every terminal and metric against past years, with holidays, client events and the forecast weeks marked. Drag across the chart to zoom into any stretch of weeks.',
    },
    {
      src: '/event-shots/weekly-grid.webp',
      title: 'Edit like a spreadsheet',
      text: 'Select weeks, increase them by a percent or set a number. The status bar shows the sum and the change on last year, like Excel.',
    },
    {
      src: '/event-shots/shape-events.webp',
      title: 'Holiday weeks, checked',
      text: 'Each event knows where its holiday falls every year. It caught Remembrance Day taking its daily shape from Canada Day weeks, and the peak weeks set one week late.',
    },
    {
      src: '/event-shots/shape-edit.webp',
      title: 'Change the daily shape on the chart',
      text: 'Drag a day up or down and see the change in pieces per day before saving. A division edit moves every terminal in it by the same percent.',
    },
    {
      src: '/event-shots/pipeline.webp',
      title: 'Data and model',
      text: "This week's pull, Steps 1 and 2, and checks on every file the model reads, so problems show up before an hour-long run.",
    },
    {
      src: '/event-shots/accuracy.webp',
      title: 'Accuracy',
      text: 'Actual, forecast and last year, day by day, for delivery and pickup, PCL and agent.',
    },
  ],
}

// Drop the four screenshots into public/event-shots/ with these names.
// Until a file is there, its card shows the text only.
export const dashboard = {
  name: 'Hub Reporting dashboard',
  summary:
    'A Power BI report for the hubs, fed by Python outputs, with its own theme. It puts actual volume next to the forecast so a hub can see where it is running ahead or behind.',
  pages: [
    {
      src: '/event-shots/powerbi-overview.png',
      title: 'Overview',
      text: 'Total volume, volume by location and by year, the commodity mix, and forecast accuracy against a 95% baseline.',
    },
    {
      src: '/event-shots/powerbi-actuals-vs-forecast.png',
      title: 'Actuals vs. forecast',
      text: 'The current year week by week, with weekly accuracy and how volume splits across categories.',
    },
    {
      src: '/event-shots/powerbi-weekly-comparison.png',
      title: 'Weekly comparison',
      text: 'Any two weeks side by side, with the daily average and the change by category.',
    },
    {
      src: '/event-shots/powerbi-yoy.png',
      title: 'Year over year, location and shift',
      text: 'Volume and forecast for any location and shift, against other years.',
    },
  ],
}

export const more = [
  {
    title: 'Forecast gap check',
    text: 'Compares every terminal\'s daily forecast to its last four weeks and flags the big gaps. It found Quebec Wednesdays 25% low because a holiday was being counted as a normal day.',
  },
  {
    title: 'Off local MySQL',
    text: 'Moving the team\'s tables to files on SharePoint that the scripts read and append to directly, starting with the daily ops dashboard.',
  },
  {
    title: 'Scheduled runs',
    text: 'Setting up Power Automate to pull the Volume Tracker every morning and run the daily dashboard after it, so nobody has to.',
  },
  {
    title: 'Battleship for Purolator',
    text: 'Two-player Battleship with Purolator trucks, built for our last intern event. The team still uses it.',
    link: 'https://purolator-battleship.onrender.com',
    linkText: 'Play it',
  },
]

export const presented = [
  'Demoed the Forecast Tool to our VP with my manager. The next step is launching it in-house.',
]
