import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import s from '../styles/propiedades'

// ── Constantes ────────────────────────────────────────────────────────────────

const TABLAS = [
  { value: '',                label: 'Todas las tablas'   },
  { value: 'contrato_renta',  label: 'Contrato de renta'  },
  { value: 'departamento',    label: 'Departamento'        },
]

const CAMPOS_LABEL = {
  renta_mensual:        'Renta mensual',
  fecha_fin_programada: 'Fecha fin programada',
  fecha_fin_real:       'Fecha fin real',
  monto_devuelto:       'Monto devuelto',
  estado_depto:         'Estado del depto',
}

const TABLA_ICONO = {
  contrato_renta: '📄',
  departamento:   '🏠',
}

const LIMITE_OPCIONES = [25, 50, 100, 200]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtFecha(dt) {
  if (!dt) return '—'
  const d = new Date(dt)
  return d.toLocaleString('es-MX', {
    day:    '2-digit', month: 'short', year: 'numeric',
    hour:   '2-digit', minute: '2-digit',
  })
}

function fmtValor(campo, val) {
  if (val === null || val === undefined || val === '') return <span style={st.valNull}>—</span>
  // Campos monetarios
  if (['renta_mensual', 'monto_devuelto'].includes(campo)) {
    return `$${Number(val).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  }
  return String(val)
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Bitacora({ rol }) {
  // Guardia de rol (solo admin llega aquí, pero por si acaso)
  if (rol !== 'admin') {
    return (
      <div style={st.accesoDenegado}>
        <span style={{ fontSize: '40px' }}>🔒</span>
        <p style={{ color: '#555', marginTop: '12px' }}>
          Solo el administrador puede acceder a la bitácora.
        </p>
      </div>
    )
  }

  return <BitacoraInterna />
}

function BitacoraInterna() {
  // ── Estado ──
  const [registros,  setRegistros]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  // Filtros
  const [tabla,      setTabla]      = useState('')
  const [usuario,    setUsuario]    = useState('')
  const [campo,      setCampo]      = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [limite,     setLimite]     = useState(50)

  // Paginación local
  const [pagina,     setPagina]     = useState(1)
  const POR_PAG = 20

  // ── Carga de datos ──
  const cargar = useCallback(() => {
    setLoading(true)
    setError('')
    const params = { limite }
    if (tabla)      params.tabla    = tabla
    if (usuario)    params.usuario  = usuario
    if (campo)      params.campo    = campo
    if (fechaDesde) params.desde    = fechaDesde
    if (fechaHasta) params.hasta    = fechaHasta

    api.get('/bitacora', { params })
      .then(res => {
        setRegistros(res.data)
        setPagina(1)
      })
      .catch(() => setError('No se pudo cargar la bitácora. Verifica la conexión con el servidor.'))
      .finally(() => setLoading(false))
  }, [tabla, usuario, campo, fechaDesde, fechaHasta, limite])

  useEffect(() => { cargar() }, [cargar])

  // ── Paginación ──
  const totalPags   = Math.max(1, Math.ceil(registros.length / POR_PAG))
  const paginados   = registros.slice((pagina - 1) * POR_PAG, pagina * POR_PAG)

  const limpiarFiltros = () => {
    setTabla(''); setUsuario(''); setCampo('')
    setFechaDesde(''); setFechaHasta(''); setLimite(50)
  }

  const hayFiltros = tabla || usuario || campo || fechaDesde || fechaHasta

  // ── Render ──
  return (
    <div>

      {/* ── Barra superior ── */}
      <div style={s.topRow}>
        <span style={s.contador}>
          {loading ? 'Cargando...' : `${registros.length} registros encontrados`}
        </span>
        <button style={s.btnPrimario} onClick={cargar} disabled={loading}>
          🔄 Actualizar
        </button>
      </div>

      {/* ── Panel de filtros ── */}
      <div style={st.filtrosPanel}>
        <div style={st.filtrosGrid}>

          <div style={st.filtroGrupo}>
            <label style={s.label}>Tabla afectada</label>
            <select style={{ ...s.select, width: '100%' }}
              value={tabla} onChange={e => setTabla(e.target.value)}>
              {TABLAS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={st.filtroGrupo}>
            <label style={s.label}>Usuario (MySQL)</label>
            <input style={{ ...s.input }}
              placeholder="ej. admin_principal@localhost"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
            />
          </div>

          <div style={st.filtroGrupo}>
            <label style={s.label}>Campo modificado</label>
            <input style={{ ...s.input }}
              placeholder="ej. renta_mensual"
              value={campo}
              onChange={e => setCampo(e.target.value)}
            />
          </div>

          <div style={st.filtroGrupo}>
            <label style={s.label}>Desde</label>
            <input type="date" style={{ ...s.input }}
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
            />
          </div>

          <div style={st.filtroGrupo}>
            <label style={s.label}>Hasta</label>
            <input type="date" style={{ ...s.input }}
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
            />
          </div>

          <div style={st.filtroGrupo}>
            <label style={s.label}>Límite de resultados</label>
            <select style={{ ...s.select, width: '100%' }}
              value={limite} onChange={e => setLimite(Number(e.target.value))}>
              {LIMITE_OPCIONES.map(l => (
                <option key={l} value={l}>{l} registros</option>
              ))}
            </select>
          </div>

        </div>

        {hayFiltros && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button style={{ ...s.btnSecundario, fontSize: '12px', padding: '6px 14px' }}
              onClick={limpiarFiltros}>
              ✕ Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && <p style={{ ...s.error, marginBottom: '16px' }}>{error}</p>}

      {/* ── Tabla ── */}
      {loading ? (
        <div style={st.cargando}>
          <span style={st.spinner} />
          <span style={{ color: '#888', fontSize: '14px' }}>Cargando registros...</span>
        </div>
      ) : registros.length === 0 ? (
        <div style={st.vacio}>
          <span style={{ fontSize: '36px' }}>📋</span>
          <p style={{ color: '#aaa', marginTop: '8px' }}>
            {hayFiltros ? 'Sin resultados con los filtros aplicados.' : 'La bitácora está vacía.'}
          </p>
        </div>
      ) : (
        <>
          <div style={st.tablaWrapper}>
            <table style={st.tabla}>
              <thead>
                <tr>
                  {['#', 'Fecha y hora', 'Tabla', 'ID Reg.', 'Campo', 'Valor anterior', 'Valor nuevo', 'Usuario'].map(col => (
                    <th key={col} style={st.th}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginados.map((r, i) => (
                  <tr key={r.id_bitacora}
                    style={{ background: i % 2 === 0 ? 'white' : '#fafbfd' }}>
                    <td style={{ ...st.td, ...st.tdId }}>{r.id_bitacora}</td>
                    <td style={{ ...st.td, ...st.tdFecha }}>{fmtFecha(r.fecha)}</td>
                    <td style={st.td}>
                      <span style={st.tablaBadge}>
                        {TABLA_ICONO[r.tabla_afectada] || '🗃️'} {r.tabla_afectada}
                      </span>
                    </td>
                    <td style={{ ...st.td, ...st.tdCenter }}>{r.id_registro}</td>
                    <td style={st.td}>
                      <span style={st.campoBadge}>
                        {CAMPOS_LABEL[r.campo] || r.campo}
                      </span>
                    </td>
                    <td style={{ ...st.td, ...st.tdValor, ...st.tdAnterior }}>
                      {fmtValor(r.campo, r.valor_anterior)}
                    </td>
                    <td style={{ ...st.td, ...st.tdValor, ...st.tdNuevo }}>
                      {fmtValor(r.campo, r.valor_nuevo)}
                    </td>
                    <td style={{ ...st.td, ...st.tdUsuario }}>
                      <span style={st.usuarioBadge} title={r.usuario}>
                        👤 {r.usuario.split('@')[0]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Paginación ── */}
          {totalPags > 1 && (
            <div style={st.paginacion}>
              <button style={st.btnPag}
                disabled={pagina === 1}
                onClick={() => setPagina(p => p - 1)}>
                ← Anterior
              </button>
              <span style={st.paginaInfo}>
                Página {pagina} de {totalPags}
                <span style={{ color: '#aaa', fontSize: '12px', marginLeft: '8px' }}>
                  ({registros.length} registros)
                </span>
              </span>
              <button style={st.btnPag}
                disabled={pagina === totalPags}
                onClick={() => setPagina(p => p + 1)}>
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Estilos locales ───────────────────────────────────────────────────────────

const st = {
  accesoDenegado: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '300px',
  },
  filtrosPanel: {
    background: 'white', borderRadius: '10px',
    padding: '16px 18px', marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
  filtrosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px',
  },
  filtroGrupo: {
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  tablaWrapper: {
    background: 'white', borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    overflowX: 'auto',
    marginBottom: '12px',
  },
  tabla: {
    width: '100%', borderCollapse: 'collapse',
    fontSize: '13px', minWidth: '780px',
  },
  th: {
    padding: '11px 14px', textAlign: 'left',
    fontWeight: '700', fontSize: '12px',
    color: '#555', textTransform: 'uppercase',
    letterSpacing: '0.04em', background: '#f7f9fc',
    borderBottom: '2px solid #e8edf3',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 14px', borderBottom: '1px solid #f0f0f0',
    color: '#333', verticalAlign: 'middle',
  },
  tdId:       { color: '#bbb', fontSize: '12px', fontVariantNumeric: 'tabular-nums' },
  tdFecha:    { whiteSpace: 'nowrap', color: '#555', fontSize: '12px' },
  tdCenter:   { textAlign: 'center', fontWeight: '600' },
  tdValor:    { maxWidth: '160px', wordBreak: 'break-all' },
  tdAnterior: { color: '#c0392b', background: '#fff5f5' },
  tdNuevo:    { color: '#27ae60', background: '#f0fff4' },
  tdUsuario:  { whiteSpace: 'nowrap' },
  valNull:    { color: '#ccc', fontStyle: 'italic' },
  tablaBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: '#eef2ff', color: '#3730a3',
    fontSize: '12px', fontWeight: '600',
    padding: '3px 9px', borderRadius: '999px',
    whiteSpace: 'nowrap',
  },
  campoBadge: {
    display: 'inline-block',
    background: '#f0f4ff', color: '#0f3460',
    fontSize: '12px', fontWeight: '600',
    padding: '3px 9px', borderRadius: '999px',
    whiteSpace: 'nowrap',
  },
  usuarioBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    background: '#f5f5f5', color: '#444',
    fontSize: '12px', padding: '3px 9px',
    borderRadius: '999px', whiteSpace: 'nowrap',
    maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  paginacion: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '16px', padding: '12px 0 4px',
  },
  btnPag: {
    padding: '7px 16px', borderRadius: '7px',
    border: '1px solid #ddd', background: 'white',
    color: '#333', fontSize: '13px', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  paginaInfo: {
    fontSize: '13px', color: '#555', fontWeight: '600',
  },
  cargando: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '12px', padding: '60px 0',
  },
  spinner: {
    display: 'inline-block',
    width: '20px', height: '20px',
    border: '3px solid #e0e0e0',
    borderTopColor: '#0f3460',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  vacio: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '60px 0', background: 'white', borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
}

// Keyframe para spinner
if (typeof document !== 'undefined' && !document.getElementById('bitacora-kf')) {
  const kf = document.createElement('style')
  kf.id = 'bitacora-kf'
  kf.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
  document.head.appendChild(kf)
}
