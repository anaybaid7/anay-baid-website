import { useState } from 'react'
import { money, pay, type Attempt, type Ledger } from './payments'

const ACCOUNT = '0012345678'
const START: Ledger = { balance: 1543250, postings: [], seen: {} }
const LOST = ['Reply arrives', 'First reply lost', 'Two replies lost', 'Every reply lost']
const AMOUNTS = [25000, 100000]

// A payment through the bridge when the network drops IMS's answer. Without
// a key, every retry is a new debit. With one, the retry gets the first
// result back and the money only moves once.
export default function Payments() {
  const [ledger, setLedger] = useState(START)
  const [useKey, setUseKey] = useState(false)
  const [lost, setLost] = useState(1)
  const [amount, setAmount] = useState(AMOUNTS[0])
  const [clicks, setClicks] = useState(0)
  const [last, setLast] = useState<{ attempts: Attempt[]; answered: boolean; amount: number; before: number; after: number } | null>(null)

  const send = () => {
    const key = useKey ? `pay-${clicks + 1}` : null
    const r = pay(ledger, ACCOUNT, -amount, key, lost)
    setLast({ attempts: r.attempts, answered: r.answered, amount, before: ledger.balance, after: r.ledger.balance })
    setLedger(r.ledger)
    setClicks(clicks + 1)
  }
  const reset = () => {
    setLedger(START)
    setLast(null)
    setClicks(0)
  }
  const charged = last ? last.before - last.after : 0

  return (
    <div className="demo pay">
      <p className="demo-hint">Lose the first reply and pay, then turn the key on and pay again.</p>
      <div className="gen-opts">
        <div className="demo-tabs" role="group" aria-label="Amount">
          {AMOUNTS.map((a) => <button key={a} type="button" aria-pressed={amount === a} onClick={() => setAmount(a)}>{money(a)}</button>)}
        </div>
        <label className="demo-inline">
          Network
          <select value={lost} onChange={(e) => setLost(Number(e.target.value))}>
            {LOST.map((l, i) => <option key={l} value={i}>{l}</option>)}
          </select>
        </label>
        <label className="demo-check tight">
          <input type="checkbox" checked={useKey} onChange={(e) => setUseKey(e.target.checked)} />
          Send an Idempotency-Key
        </label>
      </div>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={send}>Pay {money(amount)}</button>
        <button type="button" onClick={reset}>Reset</button>
      </div>

      <pre className="cb-json pay-req">{`POST /api/v1/transactions\n${useKey ? `Idempotency-Key: pay-${clicks + 1}\n` : ''}\n${JSON.stringify({ accountNumber: ACCOUNT, amount: -amount / 100, type: 'BILL_PAYMENT' }, null, 2)}`}</pre>

      <div className="br-grid">
        <div>
          <p className="demo-h">What happened</p>
          {!last && <p className="demo-out">Nothing sent yet</p>}
          {last && (
            <ol className="pay-steps">
              {last.attempts.map((a) => (
                <li key={a.n} className={a.committed && a.n > 1 ? 'dup' : ''}>
                  <b>Attempt {a.n}</b>{' '}
                  {a.replayed ? 'key already seen, bridge returns the first result, IMS not called' : 'IMS posts the debit'}
                  {a.replyLost ? ', reply lost, connector retries' : ', 201 back to the app'}
                </li>
              ))}
              {!last.answered && <li className="dup"><b>App</b> gives up after 3 attempts and shows an error</li>}
            </ol>
          )}
          {last && (
            <p className={`demo-out ${charged === last.amount ? 'ok' : 'warn'}`}>
              {charged === last.amount ? `Charged ${money(charged)} once.` : `Charged ${money(charged)} for one ${money(last.amount)} payment.`}
              {!last.answered && ' The app still thinks it failed.'}
            </p>
          )}
        </div>
        <div>
          <p className="demo-h">Account {ACCOUNT}</p>
          <dl className="br-stats">
            <div><dt>Balance</dt><dd>{money(ledger.balance)}</dd></div>
            <div><dt>Payments sent</dt><dd>{clicks}</dd></div>
          </dl>
          <div className="table-scroll">
            <table className="plan-table">
              <thead><tr><th>Posting</th><th>Amount</th><th>Key</th></tr></thead>
              <tbody>
                {ledger.postings.length === 0 && <tr><td colSpan={3}>No postings</td></tr>}
                {ledger.postings.map((p) => <tr key={p.id}><td><code>{p.id}</code></td><td>{money(p.amount)}</td><td>{p.key ?? 'none'}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
