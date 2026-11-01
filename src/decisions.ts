// The judgment behind each piece of work: what I chose, what I chose it
// over and why, the failure cases it handles, and what I would change next.
// Everything here comes from the project's own code and notes.

export interface Decision {
  chose: string
  over: string
  because: string
}

export interface Notes {
  decisions: Decision[]
  handles: string[]
  next?: string[]
}

export const NOTES: Record<string, Notes> = {
  'job-purolator': {
    decisions: [
      {
        chose: 'Prophet with the Cyber week and Amazon volume regressors, one setup for every series',
        over: 'porting the R model’s per-series ARIMA tuning one to one',
        because: 'PCL and Agent pieces have stable history back to 2018, so they don’t need the per-series start years and special cases the R script carried for other commodities.',
      },
      {
        chose: 'Scaling PCL and Agent by the same ratio when a planner edits Total',
        over: 're-splitting the new total with another year’s PCL to Agent mix',
        because: 'A +20% edit to Total should mean +20% to both parts.',
      },
      {
        chose: 'Operations that run in sequence, with a per-week undo stack',
        over: 'recomputing every edit from the original forecast',
        because: 'Planners build an adjustment up in steps, so Set to 500 then Add 500 should give 1,000.',
      },
      {
        chose: 'A MERGE into the state table for reconciliation',
        over: 'appending each run’s rows',
        because: 'A rerun after a failure updates the week instead of counting it twice.',
      },
    ],
    handles: [
      'A missing holidays package used to fail silently and pull Quebec Wednesday baselines down by about a quarter, because Saint-Jean-Baptiste counted as a zero. The gap check now leaves holidays out of the baseline.',
      'Terminal ids were stored as "12.0" in one table and "12" in another, so every join matched nothing. One canonical form is applied wherever terminals come in.',
      'Weekday shares must add to 100% before the daily split saves, and every build checks that the daily rows add back to the weekly forecast.',
      'Amazon volume for 2027 is projected from the 2025 to 2026 change week by week, clamped to between 0.5x and 1.5x so one noisy week can’t produce an outlier.',
    ],
    next: [
      'Move the remaining tables off local MySQL onto Parquet files the scripts append to directly, which is already underway.',
      'Set the 2027 Cyber and Catchup weeks from the real fiscal calendar instead of repeating 2026’s.',
      'Add leading indicators like weather and events as regressors, which came up when the tool was presented.',
    ],
  },

  'project-starrez-enterprise-automation-suite': {
    decisions: [
      {
        chose: 'Reading the text already rendered on the page',
        over: 'calling the StarRez backend',
        because: 'The extension only sees what the logged-in staff member already sees, needs no new access, and that is what made IT approval possible.',
      },
      {
        chose: 'Manifest V3 with the narrowest permissions',
        over: 'broader host or tab access',
        because: 'It runs only on the StarRez domain and asks for clipboard, storage and the active tab.',
      },
      {
        chose: 'A debounced MutationObserver keyed on the breadcrumb',
        over: 'running once on page load',
        because: 'StarRez is a single page app and swaps profiles without reloading.',
      },
      {
        chose: 'Keeping the activity log in the browser on that machine',
        over: 'syncing it to a server',
        because: 'The log only holds the formatted entries and timestamps, and nothing about residents leaves the desk computer.',
      },
    ],
    handles: [
      'Old buttons are removed when a new profile opens, so an entry can’t be made against the previous resident.',
      'An entry is only made if the student number is eight digits and the room matches the residence pattern. The room is found with three fallbacks because it shows up in different places on different profiles.',
      'Copy Lockout says "No loaner keys found" instead of making a blank entry, and prefers loaner key codes when there are any.',
      'The Keys sidebar loads separately, so the lockout button is added by its own observer once that card appears.',
    ],
    next: ['Use StarRez’s integration API through an approved route instead of reading the page.'],
  },

  'project-battleship-for-purolator': {
    decisions: [
      {
        chose: 'The server owns the game state and checks every move',
        over: 'trusting what each browser sends',
        because: 'Turn order, shot bounds and repeat shots are all checked server side, so a modified client can’t fire twice or out of turn.',
      },
      {
        chose: 'Keeping rooms, rankings and history in memory',
        over: 'a database',
        because: 'It is played at events, a reset between events is the point, and Render’s free plan sleeps anyway.',
      },
      {
        chose: 'A board size both players have to agree to',
        over: 'letting the room creator pick',
        because: 'Nobody can resize a board the other player already planned on.',
      },
      {
        chose: 'A reset key compared in constant time',
        over: 'an open reset endpoint',
        because: 'Anyone at an event could otherwise end every game.',
      },
    ],
    handles: [
      'A dropped connection tells the other player right away, and the room is held for 8 seconds before it is torn down.',
      'Joining a full room, a game already running or a mistyped code each get their own clear error.',
      'Names are trimmed and capped, room codes are normalized, and board sizes are clamped between 6 and 15.',
      'The Reset button pings until the sleeping instance answers, so it doubles as the way to wake the server.',
    ],
    next: [
      'Placement validation checks bounds, overlap and the number of vehicles, but not each vehicle’s length or that its cells are in a line. That check belongs on the server too.',
    ],
  },

  'project-ci-cd-build-automation-tool': {
    decisions: [
      {
        chose: 'One repository_dispatch event carrying the branch and environment',
        over: 'triggering every workflow and filtering later',
        because: 'The receiving workflow reads the environment from the payload and runs only that job, so deploying one branch to staging doesn’t rebuild everything else.',
      },
      {
        chose: 'Failing before dispatch when an input is missing',
        over: 'letting the API call fail',
        because: 'The error names the exact variable that is missing, which is quicker to fix than a vague API error.',
      },
      {
        chose: 'A log file per run, named with a UUID',
        over: 'one shared log',
        because: 'Runs can overlap, and a separate file per run means one never overwrites another.',
      },
    ],
    handles: ['Email goes out over SMTP with STARTTLS, and a mail failure is logged instead of failing the build.'],
    next: [
      'Read the access token from repository secrets. The hackathon version has a placeholder in the code.',
      'Check the dispatch result before emailing. Right now the email says a build was triggered even if the API call failed.',
    ],
  },

  'project-legacybridge-ai': {
    decisions: [
      {
        chose: 'A REST layer in front of the mainframe',
        over: 'rewriting the COBOL',
        because: 'GETACCT keeps running exactly as it does today. The bridge calls it the way a terminal would, so the risky part of a modernization never starts.',
      },
      {
        chose: 'Numeric ids as strings',
        over: 'parsing every PIC 9 as a number',
        because: 'ACCT-NUMBER is PIC 9(10) and starts with zeros. As a number 0012345678 turns into 12345678 and no longer matches the record key.',
      },
      {
        chose: 'A five minute Redis cache on reads',
        over: 'calling CICS on every request',
        because: 'Mainframe time is billed by use, and the same account gets read over and over by a mobile app. Five minutes keeps balances fresh enough for a lookup.',
      },
      {
        chose: 'Validation before the cache',
        over: 'checking the number inside the connector',
        because: 'A malformed number is a 400 in the route, so it never costs a Redis lookup or a CICS transaction.',
      },
    ],
    handles: [
      'A 9(10)V99 balance is stored with no decimal point, so the last two digits are split off as cents instead of parsing the field as a float.',
      'A date of all zeros means never and maps to null. An impossible date like 20101399 is reported on that field and the rest of the record still maps.',
      'A down mainframe gets the connector’s two retries and then a 500 with a request id, never a stale or guessed balance.',
      'An unknown account is the program’s INVALID KEY branch, returned as a 404 instead of an empty record.',
    ],
    next: [
      'Send the source to Gemini for real. The weekend build scripted the analysis steps, so the model’s field map would be checked against the PIC clauses before anything is generated.',
      'COMP-3 packed decimals, signed fields and REDEFINES, which real copybooks lean on and the sample layout does not use.',
      'Write routes. Everything here is a read, and POST /transactions needs an idempotency key before it can safely retry against IMS.',
    ],
  },

  'project-insightvault': {
    decisions: [
      {
        chose: 'Rules and a logistic regression model together',
        over: 'a single black-box model',
        because: 'Every alert has to trace back to the rules and features behind it, so a reviewer can see why it fired and a decision can be audited later.',
      },
      {
        chose: 'Evaluating on a time-based split',
        over: 'a random split',
        because: 'A random split lets the model learn from transactions that come after the ones it is tested on.',
      },
      {
        chose: 'Exporting the trained weights to a dependency-free Java inference layer',
        over: 'running a Python model service next to the API',
        because: 'One service to deploy instead of two, and a parity check keeps training and serving giving the same score.',
      },
    ],
    handles: ['Each review decision is stored next to its alert, which becomes the labelled data for the next round of training.'],
  },
}
