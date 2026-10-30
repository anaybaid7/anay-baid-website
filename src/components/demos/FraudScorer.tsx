import { useState } from 'react'
import { decide, score as scoreTxn } from './score'

export default function FraudScorer() {
  const [amount, setAmount] = useState(180)
  const [hour, setHour] = useState(14)
  const [newMerchant, setNewMerchant] = useState(false)
  const [abroad, setAbroad] = useState(false)
  const [burst, setBurst] = useState(1)
  const [threshold, setThreshold] = useState(0.5)

  const t = { amount, hour, newMerchant, abroad, lastHour: burst }
  const { probability: score, parts: p, fired: rules } = scoreTxn(t)
  const parts = [
    { label: `Amount $${amount.toLocaleString('en-CA')}`, v: p.amount },
    { label: 'Between midnight and 6am', v: p.night },
    { label: 'New merchant for this card', v: p.newMerchant },
    { label: 'Different country from the card', v: p.abroad },
    { label: `${burst} ${burst === 1 ? 'transaction' : 'transactions'} in the last hour`, v: p.lastHour },
  ]
  const alert = decide(score, rules, threshold)
  const maxPart = Math.max(...parts.map((p) => p.v), 1)

  return (
    <div className="demo scorer">
      <p className="demo-hint">Change the inputs.</p>
      <div className="scorer-grid">
        <div className="scorer-inputs">
          <label className="demo-field">
            <span>Amount <b>${amount.toLocaleString('en-CA')}</b></span>
            <input type="range" min={5} max={5000} step={5} value={amount} onChange={(e) => setAmount(+e.target.value)} />
          </label>
          <label className="demo-field">
            <span>Hour <b>{String(hour).padStart(2, '0')}:00</b></span>
            <input type="range" min={0} max={23} value={hour} onChange={(e) => setHour(+e.target.value)} />
          </label>
          <label className="demo-field">
            <span>Transactions in the last hour <b>{burst}</b></span>
            <input type="range" min={0} max={10} value={burst} onChange={(e) => setBurst(+e.target.value)} />
          </label>
          <label className="demo-check">
            <input type="checkbox" checked={newMerchant} onChange={(e) => setNewMerchant(e.target.checked)} /> New merchant
          </label>
          <label className="demo-check">
            <input type="checkbox" checked={abroad} onChange={(e) => setAbroad(e.target.checked)} /> Different country
          </label>
        </div>
        <div className="scorer-out">
          <p className={alert ? 'verdict alert' : 'verdict'} aria-live="polite">
            {score >= threshold
              ? 'Alert, the score is over the threshold'
              : rules.length
                ? `Alert, ${rules.length === 1 ? 'a rule' : 'rules'} fired`
                : 'Passes'}
          </p>
          <p className="score">
            Model score <b>{score.toFixed(2)}</b>
            <span>alert at {threshold.toFixed(2)} or above</span>
          </p>
          <label className="demo-field small">
            <span>Threshold</span>
            <input type="range" min={0.1} max={0.9} step={0.05} value={threshold} onChange={(e) => setThreshold(+e.target.value)} />
          </label>
          <p className="scorer-h">Why, feature by feature</p>
          <ul className="contrib">
            {parts.map((p) => (
              <li key={p.label}>
                <span>{p.label}</span>
                <i style={{ width: `${(p.v / maxPart) * 100}%` }} />
              </li>
            ))}
          </ul>
          <p className="scorer-h">Rules</p>
          <p className="rules">{rules.length ? rules.join(', ') : 'None fired'}</p>
        </div>
      </div>
    </div>
  )
}
