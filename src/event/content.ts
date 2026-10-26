// Everything written on /purolator-intern-event. Layout is in EventPage.tsx.

export const event = {
  kicker: "Let's Connect",
  title: 'Forecasting the network',
  lede: "Co-op on Purolator's Network Engineering team. We forecast parcel volume for every terminal, every week. I built the app the team now runs it in.",
  note: 'All numbers in the screenshots are mock data.',
}

export const steps = [
  'Courier Ops actuals',
  'Clean the data',
  'R forecast model',
  'Review and edit',
  'Split into days',
  'Power BI',
]

export const tool = {
  name: 'Forecast Tool',
  summary: 'Python and Flask. Runs the weekly forecast from data upload to the daily file ops uses.',
  shots: [
    { src: '/event-shots/weekly-chart.webp', title: 'Weekly forecast', text: 'Every terminal against past years, holidays and events.' },
    { src: '/event-shots/weekly-grid.webp', title: 'Edits', text: 'Change weeks like in Excel. Every edit is logged.' },
    { src: '/event-shots/shape-edit.webp', title: 'Daily split', text: 'Drag a day on the chart, see the change in pieces.' },
    { src: '/event-shots/accuracy.webp', title: 'Accuracy', text: 'Each day against what we forecast for it.' },
  ],
}

export const dashboard = {
  name: 'Hub Reporting',
  summary: 'Power BI dashboard for the hubs. Actual volume against the forecast.',
  shots: [
    { src: '/event-shots/powerbi-overview.webp', title: 'Actuals vs. forecast', text: 'Weekly accuracy and the commodity mix.' },
    { src: '/event-shots/powerbi-weekly-comparison.webp', title: 'Weekly comparison', text: 'Any two weeks side by side, by category.' },
  ],
}
