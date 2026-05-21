// ─── Constantes ───────────────────────────────────────────────────────────────
export const DURACIONES = [
  { label: '6 meses', meses: 6 },
  { label: '1 año',   meses: 12 },
  { label: '2 años',  meses: 24 },
]

// ─── Parsear fecha local (evita offset UTC) ───────────────────────────────────
// "2026-05-09" → new Date(2026, 4, 9)  ← sin timezone, siempre correcto
export function parsearLocal(str) {
  if (!str) return new Date()
  const s = String(str).slice(0, 10)
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ─── Formatear fecha para mostrar ─────────────────────────────────────────────
export function fmtFecha(str) {
  return parsearLocal(str).toLocaleDateString('es-MX')
}

// ─── Estilos locales compartidos entre sub-componentes ────────────────────────
export const st = {
  label: {
    display: 'flex', flexDirection: 'column', gap: '4px',
    fontSize: '13px', fontWeight: '600', color: '#333',
  },
  input: {
    width: '100%', padding: '8px 10px', borderRadius: '6px',
    border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box',
    outline: 'none',
  },
  prefijo: {
    position: 'absolute', left: '8px', top: '50%',
    transform: 'translateY(-50%)', color: '#888', fontSize: '14px',
  },
  infoBloque: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#f7f9fc', borderRadius: '8px', padding: '10px 14px',
  },
  infoLabel: { fontSize: '12px', color: '#888' },
  infoVal:   { fontSize: '14px', fontWeight: '600', color: '#1a1a2e' },
  botonesRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' },
}
