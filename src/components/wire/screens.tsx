import type { ReactNode } from 'react'
import { Bars, Board, Box, Btn, Img, In, Meter, N, Row, T, Tabs, Tbl, Win } from './kit'

export interface Note {
  n: number
  title: string
  text: string
  // the box in the architecture diagram that this part of the screen talks to
  node?: string
}

export interface Screen {
  name: string
  notes: Note[]
  draw: () => ReactNode
}

// ---- StarRez extension, from content.js and popup.html ----
const starrez: Screen[] = [
  {
    name: 'Profile, with the extension',
    notes: [
      { n: 1, title: 'Name from the breadcrumb', text: 'The resident’s name is read from the breadcrumb. A change here is how the extension knows a new profile opened.', node: 'observer' },
      { n: 2, title: 'Checked before use', text: 'The student number has to be 8 digits and the room has to match the residence pattern, or no entry is made.', node: 'tasks' },
      { n: 3, title: 'Buttons it adds', text: 'Copy 2 pkgs is built from the parcel count, and Print Label sits by Entry Actions. Outlined here to show what the extension adds.', node: 'buttons' },
      { n: 4, title: 'Lockouts from the Keys card', text: 'Copy Lockout appears once the Rez 360 sidebar loads and asks for a reason first. Loaner key codes are used when there are any.', node: 'tasks' },
      { n: 5, title: 'What was copied', text: 'A preview shows the exact entry for a few seconds, so staff can paste it into the log and move on.', node: 'clip' },
    ],
    draw: () => (
      <Win title="StarRez" url="uwaterloo.starrezhousing.com">
        <N n={1}><T>Dashboard › Desk › <b>Lee, Sam</b></T></N>
        <Row>
          <Box grow>
            <N n={2} block>
              <Tbl cols={['Field', 'Value']} rows={[['EntryID:', '48213'], ['Student Number', '20871234'], ['Room Space', 'V1S-305a']]} />
            </N>
            <Row>
              <T>2 Parcels</T>
              <N n={3}><Btn added>Copy 2 pkgs</Btn></N>
            </Row>
            <Row>
              <Btn>Issue</Btn>
              <Btn added>Copy Log</Btn>
              <Btn>Entry Actions</Btn>
              <Btn added>Print Label</Btn>
            </Row>
          </Box>
          <Box title="Rez 360">
            <T b>KEYS</T>
            <T>Bedroom: 4F21A</T>
            <T>LOANER L-1: L0932</T>
            <N n={4}><Btn added>Copy Lockout</Btn></N>
          </Box>
        </Row>
        <N n={5} block>
          <Box title="Copied">
            <T>S.L (20871234) V1S-305a 2 pkgs @ 3:42 pm - A.B</T>
          </Box>
        </N>
      </Win>
    ),
  },
  {
    name: 'Popup, the shift’s activity',
    notes: [
      { n: 1, title: 'Counts for the shift', text: 'Packages, lockouts and labels logged so far, read through the service worker.', node: 'sw' },
      { n: 2, title: 'Find an entry', text: 'Search by student, room or staff, and filter by type.', node: 'popup' },
      { n: 3, title: 'Every entry', text: 'Click one to copy it again. Each keeps its type, who logged it and when.', node: 'log' },
      { n: 4, title: 'Out of the browser', text: 'Export the shift as CSV, or clear it. Nothing leaves the machine otherwise.', node: 'sw' },
    ],
    draw: () => (
      <Win title="StarRez Logger v3.1">
        <Tabs items={['Activity Log', 'Staff Stats']} />
        <N n={1} block>
          <Row between>
            {[['3', 'Packages'], ['1', 'Lockouts'], ['1', 'Labels'], ['5', 'Total']].map(([v, k]) => (
              <Box key={k}><T b>{v}</T><T>{k}</T></Box>
            ))}
          </Row>
        </N>
        <N n={2} block>
          <Row><In ph="Search student, room, staff..." /><Btn primary>All</Btn><Btn>Pkg</Btn><Btn>Lock</Btn><Btn>Label</Btn></Row>
        </N>
        <N n={3} block>
          <Tbl
            cols={['Type', 'Entry', 'Time']}
            hot={0}
            rows={[
              ['package', 'S.L (20871234) V1S-305a 2 pkgs @ 3:42 pm - A.B', '3:42p'],
              ['lockout', 'P.S (20895511) MKV-4-112b KC: 7K30C; locked out - A.B', '3:15p'],
              ['label', '2/18/2026 2:58p.m. / 20871234 / Sam Lee / V1S-305a', '2:58p'],
            ]}
          />
        </N>
        <N n={4} block>
          <Row><Btn>Export CSV</Btn><Btn>Refresh</Btn><Btn>Clear All</Btn></Row>
        </N>
      </Win>
    ),
  },
  {
    name: 'Popup, staff stats',
    notes: [
      { n: 1, title: 'Per staff member', text: 'Counts grouped by who logged them, busiest first.', node: 'log' },
      { n: 2, title: 'Same data', text: 'Built from the same local activity log as the list.', node: 'sw' },
    ],
    draw: () => (
      <Win title="StarRez Logger v3.1">
        <Tabs items={['Activity Log', 'Staff Stats']} on={1} />
        <N n={1} block>
          {[['Baid, Anay', '12', '3', '4', '19'], ['Lee, Jordan', '8', '1', '2', '11']].map(([who, p, l, b, t]) => (
            <Box key={who} title={who}>
              <Row between>
                <T>{p} Packages</T>
                <T>{l} Lockouts</T>
                <T>{b} Labels</T>
                <T b>{t} Total</T>
              </Row>
            </Box>
          ))}
        </N>
        <N n={2} block>
          <Row><Btn>Export CSV</Btn><Btn>Refresh</Btn><Btn>Clear All</Btn></Row>
        </N>
      </Win>
    ),
  },
]

// ---- Battleship, from public/index.html ----
const nav = (on: number) => <Tabs items={['Lobby', 'Fleet setup', 'Battle']} on={on} />
const battleship: Screen[] = [
  {
    name: 'Lobby',
    notes: [
      { n: 1, title: 'Start a room', text: 'A callsign and one button. The server answers with a five character room code.', node: 'p1' },
      { n: 2, title: 'Join with a code', text: 'Or open the invite link, which fills the code in.', node: 'p2' },
      { n: 3, title: 'Who is waiting', text: 'Open rooms and who is online update live from lobby events.', node: 'server' },
      { n: 4, title: 'Records', text: 'Recent games and rankings grouped by callsign, all kept in memory.', node: 'rank' },
      { n: 5, title: 'Reset game', text: 'Wakes the server if Render put it to sleep, then clears everything for the next event.', node: 'reset' },
    ],
    draw: () => (
      <Win title="Purolator Battleship" url="purolator-battleship.onrender.com">
        <Row between>{nav(0)}<N n={5}><Btn>Reset game</Btn></N></Row>
        <T>6 drivers around right now</T>
        <Row>
          <Box grow title="Callsign">
            <N n={1} block><In ph="e.g. Thunder_YYZ" /><Btn primary>Create game room</Btn></N>
            <N n={2} block><Row><In ph="Room code" mono /><Btn>Join delivery zone</Btn></Row></N>
          </Box>
          <Img h={120} label="Replay of the last game" />
        </Row>
        <Row>
          <N n={3} block><Box title="Waiting for a rival"><T>Maple, room K7QX2, 10x10</T><T w={70} /></Box></N>
          <N n={4} block><Box title="Driver rankings"><Tbl cols={['Driver', 'W', 'Aim']} rows={[['Thunder_YYZ', '4', '61%'], ['Maple', '3', '55%']]} /></Box></N>
        </Row>
      </Win>
    ),
  },
  {
    name: 'Waiting for a rival',
    notes: [
      { n: 1, title: 'The room code, as a shipping label', text: 'The code is printed big with a Copy button and a barcode, to match the theme.', node: 'rooms' },
      { n: 2, title: 'Invite link', text: 'The link routes straight into this room.', node: 'p2' },
    ],
    draw: () => (
      <Win title="Purolator Battleship">
        {nav(0)}
        <N n={1} block>
          <Box title="Shipping label">
            <Row between><T>From</T><T b>Thunder_YYZ</T></Row>
            <Row between><T b>K7QX2</T><Btn>Copy</Btn></Row>
            <span className="wbarcode" />
            <Row between><T>1 of 1</T><T>Driver Battle League</T></Row>
          </Box>
        </N>
        <N n={2} block><Row><In ph="purolator-battleship.onrender.com/K7QX2" mono /><Btn primary>Copy link</Btn></Row></N>
      </Win>
    ),
  },
  {
    name: 'Fleet setup',
    notes: [
      { n: 1, title: 'The manifest', text: 'All five vehicles, ticked off as they are placed. Random and Clear for a quick start.', node: 'p1' },
      { n: 2, title: 'Drag and drop', text: 'Works with a mouse or a finger. Click a placed vehicle to rotate it.', node: 'p1' },
      { n: 3, title: 'Board size handshake', text: 'Propose a size from 6 to 15. The other player has to accept before it changes.', node: 'io' },
      { n: 4, title: 'Lock in routes', text: 'Sends the placement. The server validates it before marking the player ready.', node: 'server' },
    ],
    draw: () => (
      <Win title="Purolator Battleship">
        {nav(1)}
        <Row>
          <Box title="Manifest, 3 of 5 placed">
            <N n={1} block>
              <Tbl cols={['Vehicle', 'Size']} rows={[['Air Freighter', '5'], ['Semi Truck', '4'], ['Delivery Van', '3'], ['Cargo Bike', '3'], ['Scooter', '2']]} hot={3} />
              <Row><Btn>Random</Btn><Btn>Clear</Btn></Row>
            </N>
            <N n={3} block><Row><In ph="10" mono /><Btn>Propose</Btn></Row></N>
            <N n={4} block><Btn primary>Lock in routes</Btn></N>
          </Box>
          <N n={2} block><Box title="Your territory"><Board n={10} ships={[11, 12, 13, 14, 15, 42, 52, 62, 72, 66, 67, 68]} /></Box></N>
        </Row>
      </Win>
    ),
  },
  {
    name: 'Battle',
    notes: [
      { n: 1, title: 'Whose turn', text: 'Set by the server after every shot. Clicks out of turn never count.', node: 'server' },
      { n: 2, title: 'Live stats', text: 'Shots, accuracy, vehicles sunk and time, for the match report at the end.', node: 'rooms' },
      { n: 3, title: 'Fire', text: 'Clicking a cell sends its index. The result comes back to both players at once.', node: 'io' },
      { n: 4, title: 'Dropped connection', text: 'A bar shows while reconnecting. The room is held for a short grace window.', node: 'server' },
    ],
    draw: () => (
      <Win title="Purolator Battleship">
        {nav(2)}
        <N n={4} block><Box><T>Connection lost. Reconnecting...</T></Box></N>
        <Row between>
          <T b>Thunder_YYZ</T>
          <N n={1}><Btn primary>Your turn</Btn></N>
          <T b>Maple</T>
        </Row>
        <N n={2} block><Row between><T>Shots 14</T><T>Accuracy 43%</T><T>Sunk 2</T><T>Time 3:41</T></Row></N>
        <Row>
          <Box title="Your fleet"><Board n={8} ships={[9, 10, 11, 12, 13, 33, 41, 49]} hits={[10, 41]} misses={[2, 20, 55]} /></Box>
          <N n={3} block><Box title="Their waters"><Board n={8} hits={[18, 19, 44]} misses={[3, 27, 30, 50, 61]} /></Box></N>
        </Row>
      </Win>
    ),
  },
  {
    name: 'Match report',
    notes: [
      { n: 1, title: 'Result', text: 'Winner, and a rematch without going back to the lobby.', node: 'server' },
      { n: 2, title: 'Side by side', text: 'Shots, hits, accuracy, first hit, best streak, ships lost.', node: 'rooms' },
      { n: 3, title: 'Final boards', text: 'The loser sees where the winner’s vehicles were.', node: 'rooms' },
    ],
    draw: () => (
      <Win title="Purolator Battleship">
        {nav(2)}
        <N n={1} block>
          <Row between><T b>Thunder_YYZ wins</T><Row><Btn primary>Request rematch</Btn><Btn>Return to lobby</Btn></Row></Row>
        </N>
        <Row>
          <N n={2} block>
            <Tbl
              cols={['', 'You', 'Maple']}
              rows={[['Shots', '31', '38'], ['Hits', '17', '14'], ['Accuracy', '55%', '37%'], ['First hit', '#3', '#6'], ['Best hit streak', '4', '3'], ['Ships lost', '3', '5']]}
            />
          </N>
          <N n={3} block>
            <Row>
              <Box title="Your board"><Board n={8} ships={[9, 10, 11, 33, 41]} hits={[9, 10, 41, 50]} misses={[2, 20, 55, 60]} /></Box>
              <Box title="Theirs"><Board n={8} ships={[26, 27, 28]} hits={[18, 19, 44, 45]} misses={[3, 30, 50, 61]} /></Box>
            </Row>
          </N>
        </Row>
      </Win>
    ),
  },
]

// ---- InsightVault review dashboard ----
const insightvault: Screen[] = [
  {
    name: 'Alert queue',
    notes: [
      { n: 1, title: 'Only what needs a look', text: 'Open alerts first, filtered by status and score.', node: 'dash' },
      { n: 2, title: 'Rules and model side by side', text: 'How many rules fired and the model score, so either reason is visible at a glance.', node: 'api' },
      { n: 3, title: 'Straight from the API', text: 'The table reads alerts and their stored reasons.', node: 'rds' },
    ],
    draw: () => (
      <Win title="InsightVault, review dashboard">
        <N n={1} block><Row><Tabs items={['Open', 'Confirmed', 'Dismissed']} /><In ph="Min score 0.50" /></Row></N>
        <N n={3} block>
          <Tbl
            cols={['Transaction', 'Amount', 'Rules', 'Model', 'Status']}
            hot={0}
            rows={[
              ['tx_90211', '$2,840.00', '2', <N n={2} key="s"><Meter v={87} label="0.87" /></N>, 'open'],
              ['tx_90198', '$1,210.00', '1', <Meter key="m" v={64} label="0.64" />, 'open'],
              ['tx_90177', '$86.40', '0', <Meter key="m" v={12} label="0.12" />, 'dismissed'],
              ['tx_90163', '$2,450.00', '1', <Meter key="m" v={73} label="0.73" />, 'confirmed'],
            ]}
          />
        </N>
      </Win>
    ),
  },
  {
    name: 'Alert detail',
    notes: [
      { n: 1, title: 'Why it was flagged', text: 'The rules that fired, in plain words.', node: 'rules' },
      { n: 2, title: 'What moved the score', text: 'Each feature’s contribution to the logistic regression score.', node: 'weights' },
      { n: 3, title: 'The decision', text: 'Confirm or dismiss. The decision is stored and becomes a label for the next training run.', node: 'rds' },
    ],
    draw: () => (
      <Win title="InsightVault, alert al_3310">
        <Row between><T b>tx_90211, $2,840.00</T><T b>Score 0.87</T></Row>
        <Row>
          <N n={1} block><Box title="Rules fired"><T>Abroad at a new merchant</T><T>Amount over $2,500</T></Box></N>
          <N n={2} block>
            <Box title="Contributions">
              <Meter v={90} label="Abroad" /><Meter v={70} label="New merchant" /><Meter v={45} label="Amount" /><Meter v={15} label="Night" />
            </Box>
          </N>
        </Row>
        <N n={3} block><Row><Btn primary>Confirm fraud</Btn><Btn>Dismiss</Btn></Row></N>
      </Win>
    ),
  },
]

// ---- Pashu, from UIManager.cs and TimeManager.cs ----
const pashu: Screen[] = [
  {
    name: 'The shelter',
    notes: [
      { n: 1, title: 'HUD', text: 'Money, level and XP, the date, and how many animals are in the shelter.', node: 'hud' },
      { n: 2, title: 'Needs over their heads', text: 'A food or water icon appears when an animal drops under 50 and goes looking.', node: 'npc' },
      { n: 3, title: 'Radial build menu', text: 'Place bowls, walls and decorations.', node: 'build' },
      { n: 4, title: 'Month end', text: 'Government funding per animal plus donations, minus rent. Below zero is game over.', node: 'time' },
    ],
    draw: () => (
      <Win title="Pashu">
        <N n={1} block>
          <Row between><T b>$ 2,400</T><T>Level 3</T><Meter v={62} label="XP" /><T>14 MAR</T><T>Animals: 6</T></Row>
        </N>
        <Row>
          <Box grow>
            <N n={2} block><Img h={150} label="Shelter, animals wander. Milo: food icon" /></N>
          </Box>
          <N n={3} block><Box title="Build"><Btn>Food bowl</Btn><Btn>Water bowl</Btn><Btn>Wall</Btn><Btn>Decor</Btn></Box></N>
        </Row>
        <N n={4} block>
          <Box title="Month end">
            <Row between><T>Govt. funds</T><T>$600</T></Row>
            <Row between><T>Donations</T><T>$340</T></Row>
            <Row between><T>Rent and costs</T><T>−$1,480</T></Row>
            <Row between><T b>Total</T><T b>−$540</T></Row>
            <Btn primary>Pay bills</Btn>
          </Box>
        </N>
      </Win>
    ),
  },
  {
    name: 'Building',
    notes: [
      { n: 1, title: 'Radial menu', text: 'Pick what to build from a pie menu.', node: 'build' },
      { n: 2, title: 'Preview', text: 'A ghost follows the cursor until you place it.', node: 'build' },
      { n: 3, title: 'Bowls', text: 'Food and water bowls are what hungry animals walk to.', node: 'res' },
    ],
    draw: () => (
      <Win title="Pashu">
        <Row between><T b>$ 2,400</T><T>Level 3</T><T>14 MAR</T></Row>
        <Box>
          <Row between>
            <Img h={170} label="Shelter floor" />
            <N n={1}>
              <span className="wpie">
                <i>Food</i><i>Water</i><i>Wall</i><i>Decor</i>
              </span>
            </N>
          </Row>
          <Row>
            <N n={2}><Btn added>Water bowl, click to place</Btn></N>
            <N n={3}><Btn>2 food bowls out</Btn></N>
          </Row>
        </Box>
      </Win>
    ),
  },
]


// ---- Volume Planner, laid out from my own wireframe doc for the tool ----
const side = (
  <Box title="Load files">
    <T>Actual.xlsx loaded</T>
    <T>Forecast.xlsx loaded</T>
    <In ph="Daily Dist. (optional)" />
    <T b>Metric</T>
    <In ph="Total Del Pieces" />
    <Row><In ph="Base 2021" /><In ph="Fc 2026" /></Row>
    <T b>Division</T>
    <In ph="(ALL)" />
    <T b>Terminal</T>
    <In ph="12 Toronto West" />
    <Btn primary>Export CSV</Btn>
  </Box>
)
const forecast: Screen[] = [
  {
    name: 'Where it fits',
    notes: [
      { n: 1, title: 'Weekly pull', text: 'Daily volume comes out of Courier Ops every Monday.', node: 'airflow' },
      { n: 2, title: 'Model', text: 'STL and ARIMA fit the seasonal trend and write a forecast CSV.', node: 'sm' },
      { n: 3, title: 'The tool', text: 'Planners review, adjust and validate daily shapes here.', node: 'tools' },
      { n: 4, title: 'Output becomes input', text: 'Every export is what gets loaded next session. State lives in files.', node: 'api' },
    ],
    draw: () => (
      <Win title="Volume Planner, pipeline">
        <Row between>
          <N n={1}><Box title="01 Courier Ops"><T>QlikView pull</T></Box></N>
          <T b>→</T>
          <Box title="02 FMR daily DB"><T>Cleaned history</T></Box>
          <T b>→</T>
          <N n={2}><Box title="03 R model"><T>STL + ARIMA</T></Box></N>
        </Row>
        <Row between>
          <N n={3}><Box title="04 Volume Planner"><T>Review and adjust</T></Box></N>
          <T b>→</T>
          <N n={4}><Box title="05 Final forecast"><T>CSV to daily model</T></Box></N>
        </Row>
      </Win>
    ),
  },
  {
    name: 'Weekly review',
    notes: [
      { n: 1, title: 'Filters', text: 'Metric, base year, division and terminal. Every change redraws at once.', node: 'api' },
      { n: 2, title: 'Chart', text: 'Last year, this year, the forecast, edits, and the Prophet 2027 overlay on the same weeks.', node: 'sm' },
      { n: 3, title: 'Selection KPIs', text: 'YoY and totals for just the selected weeks.', node: 'tools' },
      { n: 4, title: 'Operations', text: '% up, % down, set to, add. They run in sequence.', node: 'tools' },
      { n: 5, title: 'Change log', text: 'Every edit with before and after, one-step revert.', node: 'tools' },
    ],
    draw: () => (
      <Win title="Forecast Tool" url="volume-planner/weekly">
        <Tabs items={['Weekly Forecast', 'Daily Distribution']} />
        <Row>
          <N n={1} block>{side}</N>
          <Box grow>
            <N n={2} block><Bars values={[50, 48, 52, 55, 54, 60, 58, 62, 70, 66, 74, 92, 98, 90, 84, 88, 56]} /></N>
            <N n={3} block><Row between><T b>W36, W41, W47</T><T>YoY +3.2%</T><T>16.8M</T></Row></N>
            <N n={4} block><Row><In ph="% Increase" /><In ph="5" mono /><Btn primary>Apply</Btn><Btn>Revert</Btn></Row></N>
            <Tbl cols={['Wk', 'Base', 'Forecast', 'YoY', 'Status']} hot={2} rows={[['36', '3,300K', '3,465K', '+5.0%', 'Mod'], ['41', '3,150K', '3,200K', '+1.6%', 'Mod'], ['47', '4,200K', '4,550K', '+8.3%', 'Mod']]} />
          </Box>
          <N n={5} block>
            <Box title="Change log">
              <T>W36 % Increase 5%</T>
              <T>W41 Set to 3200K</T>
              <T>W47 % Increase 12%</T>
            </Box>
          </N>
        </Row>
      </Win>
    ),
  },
  {
    name: 'Daily distribution',
    notes: [
      { n: 1, title: 'Event week', text: 'Known holidays load their base weeks as overlays automatically.', node: 'sql' },
      { n: 2, title: 'Overlays', text: 'Past weeks with the same holiday weekday, plus their average.', node: 'sql' },
      { n: 3, title: 'Edit table', text: 'Sun to Sat shares. Total must be 100% to save.', node: 'api' },
      { n: 4, title: 'Save', text: 'Writes the change log and downloads the CSV for next session.', node: 'api' },
    ],
    draw: () => (
      <Win title="Forecast Tool" url="volume-planner/daily">
        <Tabs items={['Weekly Forecast', 'Daily Distribution']} on={1} />
        <N n={1} block><Row between><T b>Week 27</T><Btn>Canada Day</Btn><T>T101, PCL Del Pieces</T></Row></N>
        <Row>
          <Box grow>
            <N n={2} block><Bars values={[4, 14, 92, 86, 80, 76, 58]} /></N>
            <Row><Btn>2015 W27 ×</Btn><Btn>2020 W28 ×</Btn><Btn>Avg</Btn></Row>
          </Box>
          <N n={3} block>
            <Tbl cols={['Day', 'Now', 'New']} rows={[['Sun', '0.81%', '0.81'], ['Mon', '3.20%', '4.10'], ['Tue', '22.40%', '22.40'], ['Total', '100%', '100.9']]} hot={1} />
          </N>
        </Row>
        <N n={4} block><Row><Btn>Normalize to 100%</Btn><Btn primary>Save and download CSV</Btn><Btn>Reset</Btn></Row></N>
      </Win>
    ),
  },
]

export const WIREFRAMES = { forecast, starrez, battleship, insightvault, pashu }
