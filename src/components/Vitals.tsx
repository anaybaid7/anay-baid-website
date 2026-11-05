import { useEffect, useState } from 'react'
import { grade, watchVitals, type Vitals as V } from '../vitals'

const ROWS = [
  { k: 'lcp', name: 'Largest paint', show: (v: number) => `${(v / 1000).toFixed(2)}s` },
  { k: 'cls', name: 'Layout shift', show: (v: number) => v.toFixed(3) },
  { k: 'inp', name: 'Slowest interaction', show: (v: number) => `${Math.round(v)}ms` },
] as const

// how this page is performing for whoever is reading it, right now
export default function Vitals() {
  const [v, setV] = useState<V | null>(null)
  useEffect(() => watchVitals(setV), [])
  if (!v) return null

  return (
    <div className="vitals">
      <table>
        <tbody>
          {ROWS.map((r) => {
            const value = v[r.k]
            return (
              <tr key={r.k}>
                <th scope="row">{r.name}</th>
                <td>{value !== null ? r.show(value) : r.k !== 'inp' ? 'not reported here' : v.interacted ? 'under 16ms' : 'click something'}</td>
                <td className={value !== null ? `g-${grade(r.k, value).replace(' ', '-')}` : r.k === 'inp' && v.interacted ? 'g-good' : ''}>
                  {value !== null ? grade(r.k, value) : r.k === 'inp' && v.interacted ? 'good' : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p>Measured in your browser on this visit, nothing is sent anywhere</p>
    </div>
  )
}
