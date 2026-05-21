import { DURACIONES, st } from './depto.utils'

// ─── Selector de duración (6 meses / 1 año / 2 años) ─────────────────────────
export function SelectorDuracion({ duracion, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {DURACIONES.map(d => (
        <button
          key={d.meses}
          onClick={() => onChange(d.meses)}
          style={{
            flex: 1, padding: '10px 0', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px', transition: 'all 0.15s',
            border: `2px solid ${duracion === d.meses ? '#0d6efd' : '#ddd'}`,
            background: duracion === d.meses ? '#e8f0fe' : '#fff',
            color:      duracion === d.meses ? '#0d6efd' : '#555',
            fontWeight: duracion === d.meses ? '700' : '500',
          }}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}

// ─── Input de monto con prefijo $ ─────────────────────────────────────────────
export function InputMonto({ value, onChange, placeholder = '0.00' }) {
  return (
    <div style={{ position: 'relative', marginTop: '4px' }}>
      <span style={st.prefijo}>$</span>
      <input
        type="number" min="0" step="0.01"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        placeholder={placeholder}
        style={{ ...st.input, paddingLeft: '24px' }}
      />
    </div>
  )
}
