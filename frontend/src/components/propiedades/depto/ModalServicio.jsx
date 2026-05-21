import { useState, useEffect } from 'react'
import { Modal } from '../ui'
import { fmtFecha } from './depto.utils'
import s from '../../../styles/propiedades'
import api from '../../../api'

// ─── Estilos locales ──────────────────────────────────────────────────────────
const ls = {
  badge: (pagado) => ({
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '999px',
    background: pagado ? '#d4edda' : '#fff3cd',
    color:      pagado ? '#155724' : '#856404',
  }),
  vencidoBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '999px',
    background: '#f8d7da',
    color: '#721c24',
    marginLeft: '6px',
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '2px solid #f0f0f0',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 10px',
    borderBottom: '1px solid #f5f5f5',
    verticalAlign: 'middle',
  },
  searchRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: '140px',
    padding: '7px 11px',
    borderRadius: '7px',
    border: '1px solid #ddd',
    fontSize: '13px',
    outline: 'none',
  },
  selectSmall: {
    padding: '7px 10px',
    borderRadius: '7px',
    border: '1px solid #ddd',
    fontSize: '13px',
    background: 'white',
    cursor: 'pointer',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '4px',
  },
  formLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '4px',
  },
  formInput: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  seccionTitulo: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#0f3460',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 10px',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #f0f0f0',
    margin: '16px 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '28px 0',
    color: '#bbb',
    fontSize: '14px',
  },
}

// ─── Formulario de nuevo recibo ───────────────────────────────────────────────
const FORM_VACIO = {
  monto: '',
  fecha_inicio_periodo: '',
  fecha_fin_periodo: '',
  fecha_limite_pago: '',
}

function FormNuevoRecibo({ servicio, contratoId, onRegistrado }) {
  const [form,      setForm]      = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = async () => {
    if (!form.monto || !form.fecha_inicio_periodo || !form.fecha_fin_periodo || !form.fecha_limite_pago) {
      setError('Completa todos los campos')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const endpoint = servicio === 'luz' ? '/recibos/luz' : '/recibos/agua'
      const idKey    = servicio === 'luz' ? 'id_contrato_luz' : 'id_contrato_agua'
      await api.post(endpoint, {
        [idKey]: contratoId,
        monto: parseFloat(form.monto),
        fecha_inicio_periodo: form.fecha_inicio_periodo,
        fecha_fin_periodo:    form.fecha_fin_periodo,
        fecha_limite_pago:    form.fecha_limite_pago,
      })
      setForm(FORM_VACIO)
      onRegistrado()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Error al registrar')
    } finally {
      setGuardando(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <p style={ls.seccionTitulo}>➕ Registrar nuevo recibo</p>
      <div style={ls.formGrid}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={ls.formLabel}>Monto ($)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '13px' }}>$</span>
            <input
              type="number" min="0" step="0.01"
              value={form.monto}
              onChange={set('monto')}
              placeholder="0.00"
              style={{ ...ls.formInput, paddingLeft: '22px' }}
            />
          </div>
        </div>
        <div>
          <label style={ls.formLabel}>Inicio periodo</label>
          <input type="date" style={ls.formInput} value={form.fecha_inicio_periodo} onChange={set('fecha_inicio_periodo')} />
        </div>
        <div>
          <label style={ls.formLabel}>Fin periodo</label>
          <input type="date" style={ls.formInput} value={form.fecha_fin_periodo} onChange={set('fecha_fin_periodo')} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={ls.formLabel}>Fecha límite de pago</label>
          <input type="date" style={ls.formInput} value={form.fecha_limite_pago} onChange={set('fecha_limite_pago')} />
        </div>
      </div>

      {error && <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '8px' }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <button style={s.btnPrimario} onClick={handleSubmit} disabled={guardando}>
          {guardando ? 'Registrando...' : 'Registrar recibo'}
        </button>
      </div>
    </div>
  )
}

// ─── Lista de recibos ─────────────────────────────────────────────────────────
function ListaRecibos({ recibos, servicio, puedeAccionar, onPagar, pagando }) {
  const [busqueda, setBusqueda] = useState('')
  const [orden,    setOrden]    = useState('fecha_desc')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const hoy = new Date()

  const filtrados = recibos
    .filter(r => {
      if (filtroEstado === 'pagado'   && !r.pagado)  return false
      if (filtroEstado === 'pendiente' && r.pagado)  return false
      if (filtroEstado === 'vencido') {
        if (r.pagado) return false
        if (new Date(r.fecha_limite_pago) >= hoy) return false
      }
      if (busqueda) {
        const b = busqueda.toLowerCase()
        return (
          fmtFecha(r.fecha_inicio_periodo).includes(b) ||
          fmtFecha(r.fecha_fin_periodo).includes(b)    ||
          fmtFecha(r.fecha_limite_pago).includes(b)    ||
          String(r.monto).includes(b)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (orden === 'fecha_desc') return new Date(b.fecha_inicio_periodo) - new Date(a.fecha_inicio_periodo)
      if (orden === 'fecha_asc')  return new Date(a.fecha_inicio_periodo) - new Date(b.fecha_inicio_periodo)
      if (orden === 'monto_desc') return Number(b.monto) - Number(a.monto)
      if (orden === 'monto_asc')  return Number(a.monto) - Number(b.monto)
      return 0
    })

  const idKey = servicio === 'luz' ? 'id_recibo_luz' : 'id_recibo_agua'

  return (
    <>
      <div style={ls.searchRow}>
        <input
          style={ls.searchInput}
          placeholder="Buscar por fecha o monto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <select style={ls.selectSmall} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="pendiente">Pendientes</option>
          <option value="pagado">Pagados</option>
          <option value="vencido">Vencidos</option>
        </select>
        <select style={ls.selectSmall} value={orden} onChange={e => setOrden(e.target.value)}>
          <option value="fecha_desc">Más reciente</option>
          <option value="fecha_asc">Más antiguo</option>
          <option value="monto_desc">Mayor monto</option>
          <option value="monto_asc">Menor monto</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div style={ls.emptyState}>
          {recibos.length === 0
            ? `No hay recibos de ${servicio} registrados.`
            : 'No hay recibos que coincidan con el filtro.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={ls.tabla}>
            <thead>
              <tr>
                <th style={ls.th}>Periodo</th>
                <th style={ls.th}>Límite pago</th>
                <th style={ls.th}>Monto</th>
                <th style={ls.th}>Estado</th>
                {puedeAccionar && <th style={ls.th}>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(r => {
                const vencido = !r.pagado && new Date(r.fecha_limite_pago) < hoy
                return (
                  <tr key={r[idKey]}>
                    <td style={ls.td}>
                      {fmtFecha(r.fecha_inicio_periodo)} — {fmtFecha(r.fecha_fin_periodo)}
                    </td>
                    <td style={ls.td}>
                      {fmtFecha(r.fecha_limite_pago)}
                      {vencido && <span style={ls.vencidoBadge}>Vencido</span>}
                    </td>
                    <td style={{ ...ls.td, fontWeight: '600' }}>
                      ${Number(r.monto).toLocaleString('es-MX')}
                    </td>
                    <td style={ls.td}>
                      <span style={ls.badge(r.pagado)}>
                        {r.pagado ? '✓ Pagado' : '⏳ Pendiente'}
                      </span>
                    </td>
                    {puedeAccionar && (
                      <td style={ls.td}>
                        {!r.pagado && (
                          <button
                            style={{
                              ...s.btnPrimario,
                              padding: '5px 12px',
                              fontSize: '12px',
                              background: '#198754',
                            }}
                            onClick={() => onPagar(r[idKey])}
                            disabled={pagando === r[idKey]}
                          >
                            {pagando === r[idKey] ? '...' : 'Marcar pagado'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function ModalServicio({ servicio, contrato, puedeAccionar, onClose }) {
  // servicio: 'luz' | 'agua'
  // contrato: { id_contrato_luz, numero_contrato } | { id_contrato_agua, numero_contrato }

  const [recibos,  setRecibos]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [pagando,  setPagando]  = useState(null)  // id del recibo que se está pagando
  const [msgOk,    setMsgOk]    = useState('')

  const idContrato = servicio === 'luz'
    ? contrato?.id_contrato_luz
    : contrato?.id_contrato_agua

  const icono = servicio === 'luz' ? '💡' : '💧'
  const titulo = `${icono} Contrato de ${servicio} — ${contrato?.numero_contrato}`

  const cargar = async () => {
    if (!idContrato) return
    setLoading(true)
    try {
      const endpoint = servicio === 'luz'
        ? `/contratos-luz/${idContrato}/recibos`
        : `/contratos-agua/${idContrato}/recibos`
      const { data } = await api.get(endpoint)
      setRecibos(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [idContrato])

  const handlePagar = async (idRecibo) => {
    setPagando(idRecibo)
    try {
      const endpoint = servicio === 'luz'
        ? `/recibos/luz/${idRecibo}/pagar`
        : `/recibos/agua/${idRecibo}/pagar`
      await api.post(endpoint)
      setMsgOk('Recibo marcado como pagado ✓')
      setTimeout(() => setMsgOk(''), 3000)
      await cargar()
    } catch (e) {
      // silencioso, el error se muestra a través del estado
    } finally {
      setPagando(null)
    }
  }

  // Resumen rápido
  const total    = recibos.length
  const pagados  = recibos.filter(r => r.pagado).length
  const pendientes = total - pagados
  const hoy = new Date()
  const vencidos = recibos.filter(r => !r.pagado && new Date(r.fecha_limite_pago) < hoy).length

  return (
    <Modal titulo={titulo} onClose={onClose} ancho="720px">
      {loading ? (
        <p style={{ color: '#888', fontSize: '14px' }}>Cargando recibos...</p>
      ) : (
        <>
          {/* Resumen rápido */}
          <div style={{
            display: 'flex', gap: '12px', flexWrap: 'wrap',
            background: '#f7f9fc', borderRadius: '8px',
            padding: '12px 14px', marginBottom: '16px',
          }}>
            <div style={s.infoItem}>
              <span style={s.infoLabel}>Total recibos</span>
              <span style={s.infoVal}>{total}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}>Pagados</span>
              <span style={{ ...s.infoVal, color: '#155724' }}>{pagados}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}>Pendientes</span>
              <span style={{ ...s.infoVal, color: pendientes > 0 ? '#856404' : '#155724' }}>{pendientes}</span>
            </div>
            {vencidos > 0 && (
              <div style={s.infoItem}>
                <span style={s.infoLabel}>Vencidos</span>
                <span style={{ ...s.infoVal, color: '#721c24' }}>{vencidos}</span>
              </div>
            )}
          </div>

          {/* Lista de recibos */}
          <p style={ls.seccionTitulo}>📋 Recibos</p>
          <ListaRecibos
            recibos={recibos}
            servicio={servicio}
            puedeAccionar={puedeAccionar}
            onPagar={handlePagar}
            pagando={pagando}
          />

          {/* Formulario solo para admin/operador */}
          {puedeAccionar && (
            <>
              <hr style={ls.divider} />
              <FormNuevoRecibo
                servicio={servicio}
                contratoId={idContrato}
                onRegistrado={cargar}
              />
            </>
          )}

          {msgOk && (
            <div style={{
              position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
              background: '#198754', color: '#fff', padding: '10px 20px',
              borderRadius: '8px', fontSize: '14px', zIndex: 9999,
            }}>
              {msgOk}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
