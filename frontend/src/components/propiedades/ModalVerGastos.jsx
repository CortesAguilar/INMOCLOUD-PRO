import { useState, useMemo } from 'react'
import { Modal } from './ui'
import s from '../../styles/propiedades'

const CATEGORIAS = ['todas', 'mantenimiento', 'seguro', 'predial', 'limpieza', 'otro']

export default function ModalVerGastos({ propNombre, gastosProp, loadingGastosProp, onClose }) {
  const [filtroCategoria,   setFiltroCategoria]   = useState('todas')
  const [filtroDescripcion, setFiltroDescripcion] = useState('')
  const [ordenCampo,        setOrdenCampo]        = useState('fecha_gasto')
  const [ordenDir,          setOrdenDir]          = useState('desc')

  const gastosFiltrados = useMemo(() => {
    return gastosProp
      .filter(g => {
        const coincideCategoria   = filtroCategoria === 'todas' || g.categoria === filtroCategoria
        const coincideDescripcion = (g.descripcion || g.categoria)
          .toLowerCase().includes(filtroDescripcion.toLowerCase())
        return coincideCategoria && coincideDescripcion
      })
      .sort((a, b) => {
        let va, vb
        if (ordenCampo === 'fecha_gasto') {
          va = new Date(a.fecha_gasto).getTime()
          vb = new Date(b.fecha_gasto).getTime()
        } else {
          va = (a.descripcion || a.categoria).toLowerCase()
          vb = (b.descripcion || b.categoria).toLowerCase()
        }
        if (va < vb) return ordenDir === 'asc' ? -1 : 1
        if (va > vb) return ordenDir === 'asc' ? 1 : -1
        return 0
      })
  }, [gastosProp, filtroCategoria, filtroDescripcion, ordenCampo, ordenDir])

  const total    = gastosFiltrados.reduce((sum, g) => sum + Number(g.monto), 0)
  const promedio = gastosFiltrados.length > 0 ? total / gastosFiltrados.length : 0

  function toggleOrden(campo) {
    if (ordenCampo === campo) {
      setOrdenDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenCampo(campo)
      setOrdenDir('asc')
    }
  }

  const flecha = (campo) => {
    if (ordenCampo !== campo) return ' ↕'
    return ordenDir === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <Modal titulo={`Gastos — ${propNombre}`} onClose={onClose} ancho="580px">
      {loadingGastosProp ? (
        <p style={{ color: '#666' }}>Cargando...</p>
      ) : gastosProp.length === 0 ? (
        <p style={{ color: '#aaa' }}>Sin gastos registrados para esta propiedad.</p>
      ) : (
        <div>
          {/* ── Filtros ── */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <input
              style={{ ...s.input, flex: 1, minWidth: '160px', marginBottom: 0 }}
              placeholder="Buscar por descripción..."
              value={filtroDescripcion}
              onChange={e => setFiltroDescripcion(e.target.value)}
            />
            <select
              style={{ ...s.input, minWidth: '160px', marginBottom: 0 }}
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
            >
              {CATEGORIAS.map(c => (
                <option key={c} value={c}>
                  {c === 'todas' ? 'Todas las categorías' : c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* ── Ordenamiento ── */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>Ordenar por:</span>
            {[
              { campo: 'fecha_gasto', label: 'Fecha' },
              { campo: 'descripcion', label: 'Descripción' },
            ].map(({ campo, label }) => (
              <button
                key={campo}
                style={{
                  padding: '5px 12px', borderRadius: '6px', border: 'none',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  background: ordenCampo === campo ? '#e8f0fe' : '#f0f0f0',
                  color:      ordenCampo === campo ? '#1d4ed8' : '#555',
                }}
                onClick={() => toggleOrden(campo)}
              >
                {label}{flecha(campo)}
              </button>
            ))}
          </div>

          {/* ── Resumen (refleja filtro activo) ── */}
          <div style={{ display: 'flex', gap: '16px', background: '#f7f9fc', borderRadius: '10px', padding: '14px 18px', marginBottom: '18px' }}>
            <div style={s.infoItem}>
              <span style={s.infoLabel}>Gastos</span>
              <span style={{ ...s.infoVal, color: '#0f3460' }}>{gastosFiltrados.length}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}>Total</span>
              <span style={{ ...s.infoVal, color: '#721c24' }}>${total.toLocaleString('es-MX')}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}>Promedio</span>
              <span style={{ ...s.infoVal, color: '#5a4a00' }}>
                ${promedio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* ── Lista ── */}
          {gastosFiltrados.length === 0 ? (
            <p style={{ color: '#aaa', textAlign: 'center', padding: '16px 0' }}>Sin gastos con esos filtros.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {gastosFiltrados.map(g => (
                <div key={g.id_gasto_propiedad}
                  style={{ background: '#f7f9fc', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '14px', color: '#1a1a2e' }}>
                      {g.descripcion || g.categoria}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                      {g.categoria} · {new Date(g.fecha_gasto).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <span style={{ fontWeight: '700', color: '#721c24', fontSize: '15px', whiteSpace: 'nowrap' }}>
                    ${Number(g.monto).toLocaleString('es-MX')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}