// One run of the action as messages between the parties, in the order
// gitpython.py makes them. send_email_notification uses smtplib, so the
// mail leg is the SMTP conversation starttls(), login() and send_message()
// actually have on port 587.

export const LANES = ['runner', 'github', 'target', 'smtp'] as const
export type Lane = (typeof LANES)[number]
export const LANE_NAME: Record<Lane, string> = { runner: 'Action runner', github: 'api.github.com', target: 'Target repo', smtp: 'SMTP :587' }

export interface Msg {
  from: Lane
  to: Lane
  text: string
  tone?: 'ok' | 'bad' | 'tls'
}

export interface Opts {
  token: boolean
  email: boolean
  smtpAuth: boolean
}

export function messages({ token, email, smtpAuth }: Opts): Msg[] {
  const m: Msg[] = [
    { from: 'runner', to: 'runner', text: 'validate_input_params()' },
    { from: 'runner', to: 'github', text: 'POST /repos/{user}/{repo}/dispatches' },
    token
      ? { from: 'github', to: 'runner', text: '204 No Content', tone: 'ok' }
      : { from: 'github', to: 'runner', text: '401 Bad credentials, ignored', tone: 'bad' },
  ]
  if (token) m.push({ from: 'github', to: 'target', text: 'repository_dispatch: build', tone: 'ok' })
  if (!email) return m
  m.push(
    { from: 'runner', to: 'smtp', text: 'connect' },
    { from: 'smtp', to: 'runner', text: '220 ready' },
    { from: 'runner', to: 'smtp', text: 'EHLO' },
    { from: 'smtp', to: 'runner', text: '250 STARTTLS' },
    { from: 'runner', to: 'smtp', text: 'STARTTLS' },
    { from: 'smtp', to: 'runner', text: '220 go ahead, TLS from here', tone: 'tls' },
    { from: 'runner', to: 'smtp', text: 'AUTH', tone: 'tls' },
  )
  if (!smtpAuth) {
    m.push({ from: 'smtp', to: 'runner', text: '535 auth failed', tone: 'bad' }, { from: 'runner', to: 'runner', text: 'logging.error("Failed to send mail")', tone: 'bad' })
    return m
  }
  m.push(
    { from: 'smtp', to: 'runner', text: '235 authenticated', tone: 'tls' },
    { from: 'runner', to: 'smtp', text: 'MAIL FROM, RCPT TO, DATA', tone: 'tls' },
    { from: 'smtp', to: 'runner', text: '250 queued', tone: 'ok' },
    { from: 'runner', to: 'smtp', text: 'QUIT', tone: 'tls' },
  )
  return m
}
