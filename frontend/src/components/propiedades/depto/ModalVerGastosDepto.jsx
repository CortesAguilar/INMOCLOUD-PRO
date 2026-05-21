import { useState } from 'react'
import { Modal } from '../ui'
import { fmtFecha } from './depto.utils'
import s from '../../../styles/propiedades'

const CATEGORIAS = ['reparacion', 'servicio', 'mantenimiento', 'limpieza', 'otro']

const ETIQUETAS = {
  reparacion:    '🔨 Reparación',
  servicio:      '⚙️ Servicio',
  mantenimiento: '🛠️ Mantenimiento',
  limpieza:      '🧹 Limpieza',
  otro:          '📦 Otro',
}

const ls = {
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
  catBadge: (cat) => {
    const colores = {
      reparacion:    { bg: '#fff3cd', color: '#856404' },
      servicio:      { bg: '#cfe2ff', color: '#084298' },
      mantenimiento: { bg: '#e2d9f3', color: '#432874' },
      limpieza:      { bg: '#d1e7dd', color: '#0a3622' },
      otro:          { bg: '#f0f0f0', color: '#555'    },
    }
    const c = colores[cat] || colores.otro
    return {
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: '600',
      padding: '3px 9px',
      borderRadius: '999px',
      background: c.bg,
      color: c.color,
    }
  },
  emptyState: {
    textAlign: 'center',
    padding: '28px 0',
    color: '#bbb',
    fontSize: '14px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '12px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a1a2e',
    gap: '8px',
  },
}

export default function ModalVerGastosDepto({ deptoNumero, gastos, onClose }) {
  const [busqueda,  setBusqueda]  = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [orden,     setOrden]     = useState('fecha_desc')

  const filtrados = gastos
    .filter(g => {
      if (categoria !== 'todas' && g.categoria !== categoria) return false
      if (busqueda) {
        const b = busqueda.toLowerCase()
        return (
          (g.descripcion || '').toLowerCase().includes(b) ||
          g.categoria.toLowerCase().includes(b)           ||
          String(g.monto).includes(b)                     ||
          fmtFecha(g.fecha_gasto).includes(b)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (orden === 'fecha_desc') return new Date(b.fecha_gasto) - new Date(a.fecha_gasto)
      if (orden === 'fecha_asc')  return new Date(a.fecha_gasto) - new Date(b.fecha_gasto)
      if (orden === 'monto_desc') return Number(b.monto) - Number(a.monto)
      if (orden === 'monto_asc')  return Number(a.monto) - Number(b.monto)
      return 0
    })

  const totalFiltrado = filtrados.reduce((sum, g) => sum + Number(g.monto), 0)
  const totalGeneral  = gastos.reduce((sum, g) => sum + Number(g.monto), 0)

  return (
    <Modal titulo={`Gastos — Departamento ${deptoNumero}`} onClose={onClose} ancho="680px">

      {/* Resumen */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        background: '#f7f9fc', borderRadius: '8px',
        padding: '12px 14px', marginBottom: '16px',
      }}>
        <div style={s.infoItem}>
          <span style={s.infoLabel}>Total gastos</span>
          <span style={{ ...s.infoVal, color: '#721c24' }}>
            ${totalGeneral.toLocaleString('es-MX')}
          </span>
        </div>
        <div style={s.infoItem}>
          <span style={s.infoLabel}>Registros</span>
          <span style={s.infoVal}>{gastos.length}</span>
        </div>
        {filtrados.length !== gastos.length && (
          <div style={s.infoItem}>
            <span style={s.infoLabel}>Filtrado</span>
            <span style={{ ...s.infoVal, color: '#721c24' }}>
              ${totalFiltrado.toLocaleString('es-MX')}
            </span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div style={ls.searchRow}>
        <input
          style={ls.searchInput}
          placeholder="Buscar por descripción, fecha, monto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <select style={ls.selectSmall} value={categoria} onChange={e => setCategoria(e.target.value)}>
          <option value="todas">Todas las categorías</option>
          {CATEGORIAS.map(c => (
            <option key={c} value={c}>{ETIQUETAS[c]}</option>
          ))}
        </select>
        <select style={ls.selectSmall} value={orden} onChange={e => setOrden(e.target.value)}>
          <option value="fecha_desc">Más reciente</option>
          <option value="fecha_asc">Más antiguo</option>
          <option value="monto_desc">Mayor monto</option>
          <option value="monto_asc">Menor monto</option>
        </select>
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div style={ls.emptyState}>
          {gastos.length === 0
            ? 'No hay gastos registrados para este departamento.'
            : 'No hay gastos que coincidan con la búsqueda.'}
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={ls.tabla}>
              <thead>
                <tr>
                  <th style={ls.th}>Fecha</th>
                  <th style={ls.th}>Categoría</th>
                  <th style={ls.th}>Monto</th>
                  <th style={ls.th}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(g => (
                  <tr key={g.id_gasto_departamento}>
                    <td style={ls.td}>{fmtFecha(g.fecha_gasto)}</td>
                    <td style={ls.td}>
                      <span style={ls.catBadge(g.categoria)}>
                        {ETIQUETAS[g.categoria] || g.categoria}
                      </span>
                    </td>
                    <td style={{ ...ls.td, fontWeight: '600' }}>
                      ${Number(g.monto).toLocaleString('es-MX')}
                    </td>
                    <td style={{ ...ls.td, color: '#555', maxWidth: '220px' }}>
                      {g.descripcion || <span style={{ color: '#ccc' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={ls.totalRow}>
            <span style={{ color: '#888', fontWeight: '400' }}>Total mostrado:</span>
            <span style={{ color: '#721c24' }}>${totalFiltrado.toLocaleString('es-MX')}</span>
          </div>
        </>
      )}
    </Modal>
  )
}
