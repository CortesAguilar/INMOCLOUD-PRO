import { useState, useEffect } from 'react'
import { Modal } from '../ui'
import { SelectorDuracion, InputMonto } from './depto.primitivos'
import { fmtFecha, parsearLocal, st } from './depto.utils'
import { calcularFechaFin } from '../../../utils/calendario'
import s from '../../../styles/propiedades'
import api from '../../../api'
import ModalNuevoCliente from '../ModalNuevoCliente'

// ─── Estilos locales ──────────────────────────────────────────────────────────
const ls = {
  searchRow: {
    display: 'flex', gap: '8px', alignItems: 'center',
    marginBottom: '12px', flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1, minWidth: '140px',
    padding: '7px 11px', borderRadius: '7px',
    border: '1px solid #ddd', fontSize: '13px', outline: 'none',
  },
  selectSmall: {
    padding: '7px 10px', borderRadius: '7px',
    border: '1px solid #ddd', fontSize: '13px',
    background: 'white', cursor: 'pointer',
  },
  clienteCard: (seleccionado) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
    border: `1.5px solid ${seleccionado ? '#0d6efd' : '#e8e8e8'}`,
    background: seleccionado ? '#f0f7ff' : '#fafafa',
    transition: 'border-color 0.12s, background 0.12s',
    marginBottom: '6px',
  }),
  clienteNombre: {
    fontWeight: '600', fontSize: '14px', color: '#1a1a2e', margin: '0 0 2px',
  },
  clienteMeta: {
    fontSize: '12px', color: '#888', margin: 0,
  },
  emptyState: {
    textAlign: 'center', padding: '28px 0',
    color: '#bbb', fontSize: '14px',
  },
  modoBtn: (activo) => ({
    flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: activo ? '700' : '500',
    border: `2px solid ${activo ? '#0d6efd' : '#ddd'}`,
    background: activo ? '#e8f0fe' : '#fff',
    color: activo ? '#0d6efd' : '#555',
    transition: 'all 0.15s',
  }),
  formGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  formLabel: {
    display: 'block', fontSize: '12px', fontWeight: '600',
    color: '#555', marginBottom: '4px',
  },
  formInput: {
    width: '100%', padding: '8px 10px', borderRadius: '6px',
    border: '1px solid #ddd', fontSize: '13px',
    boxSizing: 'border-box', outline: 'none',
  },
}



// ─── Sub-modal: Seleccionar cliente existente ─────────────────────────────────
function ModalSeleccionarCliente({ clientes, onSeleccionar, onClose }) {
  const [busqueda,   setBusqueda]   = useState('')
  const [campoSort,  setCampoSort]  = useState('apellido_paterno')
  const [dirSort,    setDirSort]    = useState('asc')
  const [seleccionado, setSeleccionado] = useState(null)

  const SORT_OPCIONES = [
    { val: 'apellido_paterno', label: 'Apellido' },
    { val: 'nombre',           label: 'Nombre'   },
    { val: 'fecha_nacimiento', label: 'F. nacimiento' },
    { val: 'id_cliente',       label: 'ID'        },
  ]

  const filtrados = clientes
    .filter(c => {
      if (!busqueda) return true
      const b = busqueda.toLowerCase()
      return (
        c.nombre.toLowerCase().includes(b)                        ||
        c.apellido_paterno.toLowerCase().includes(b)              ||
        (c.apellido_materno || '').toLowerCase().includes(b)      ||
        (c.segundo_nombre  || '').toLowerCase().includes(b)       ||
        String(c.id_cliente).includes(b)                          ||
        (c.telefono || '').includes(b)                            ||
        (c.fecha_nacimiento || '').includes(b)                    ||
        (c.genero || '').toLowerCase().includes(b)
      )
    })
    .sort((a, b) => {
      const va = String(a[campoSort] || '').toLowerCase()
      const vb = String(b[campoSort] || '').toLowerCase()
      return dirSort === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const generoLabel = (g) => g === 'M' ? 'Masculino' : g === 'F' ? 'Femenino' : '—'

  return (
    <Modal titulo="Seleccionar cliente" onClose={onClose} ancho="560px">
      {/* Controles */}
      <div style={ls.searchRow}>
        <input
          style={ls.searchInput}
          placeholder="Buscar por nombre, apellido, teléfono, ID..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          autoFocus
        />
        <select style={ls.selectSmall} value={campoSort} onChange={e => setCampoSort(e.target.value)}>
          {SORT_OPCIONES.map(o => (
            <option key={o.val} value={o.val}>{o.label}</option>
          ))}
        </select>
        <button
          style={{ ...s.btnSecundario, padding: '7px 10px', fontSize: '13px' }}
          onClick={() => setDirSort(d => d === 'asc' ? 'desc' : 'asc')}
          title="Cambiar orden"
        >
          {dirSort === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>

      {/* Lista */}
      <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
        {filtrados.length === 0 ? (
          <div style={ls.emptyState}>
            {clientes.length === 0 ? 'No hay clientes registrados.' : 'Sin resultados.'}
          </div>
        ) : (
          filtrados.map(c => (
            <div
              key={c.id_cliente}
              style={ls.clienteCard(seleccionado?.id_cliente === c.id_cliente)}
              onClick={() => setSeleccionado(c)}
            >
              <div>
                <p style={ls.clienteNombre}>
                  {c.nombre}{c.segundo_nombre ? ` ${c.segundo_nombre}` : ''} {c.apellido_paterno}{c.apellido_materno ? ` ${c.apellido_materno}` : ''}
                </p>
                <p style={ls.clienteMeta}>
                  #{c.id_cliente} · {fmtFecha(c.fecha_nacimiento)} · {generoLabel(c.genero)} · {c.telefono}
                </p>
              </div>
              {seleccionado?.id_cliente === c.id_cliente && (
                <span style={{ fontSize: '18px', color: '#0d6efd' }}>✓</span>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ ...st.botonesRow, marginTop: '16px' }}>
        <button style={s.btnSecundario} onClick={onClose}>Cancelar</button>
        <button
          style={s.btnPrimario}
          onClick={() => seleccionado && onSeleccionar(seleccionado)}
          disabled={!seleccionado}
        >
          Confirmar selección
        </button>
      </div>
    </Modal>
  )
}

// ─── Modal principal: Nuevo contrato ─────────────────────────────────────────
export default function ModalNuevoContrato({ depto, onConfirmar, onClose, guardando }) {
  const hoy = new Date().toISOString().split('T')[0]

  const [clientes,       setClientes]       = useState([])
  const [loadingCli,     setLoadingCli]     = useState(true)
  const [clienteElegido, setClienteElegido] = useState(null)   // objeto cliente seleccionado
  const [subModal,       setSubModal]       = useState(null)   // 'seleccionar' | 'nuevo'

  const [renta,       setRenta]       = useState('')
  const [deposito,    setDeposito]    = useState('')
  const [fechaInicio, setFechaInicio] = useState(hoy)
  const [duracion,    setDuracion]    = useState(12)
  const [error,       setError]       = useState('')

  useEffect(() => {
    api.get('/clientes')
      .then(r => setClientes(r.data))
      .catch(() => setClientes([]))
      .finally(() => setLoadingCli(false))
  }, [])

  const fechaFin = fechaInicio ? calcularFechaFin(fechaInicio, duracion) : ''

  const handleConfirmar = () => {
    if (!clienteElegido)                     return setError('Selecciona o registra un inquilino.')
    if (!renta || Number(renta) <= 0)        return setError('Ingresa la renta mensual.')
    if (deposito === '' || Number(deposito) < 0) return setError('Ingresa el depósito.')
    setError('')
    onConfirmar({
      id_departamento:      depto.id_departamento,
      id_cliente:           clienteElegido.id_cliente,
      renta_mensual:        Number(renta),
      monto_deposito:       Number(deposito),
      fecha_inicio:         fechaInicio,
      fecha_fin_programada: fechaFin,
    })
  }

  // Al crear un cliente nuevo, se agrega a la lista local y se selecciona automáticamente
  const handleClienteCreado = (nuevoCliente) => {
    setClientes(prev => [...prev, nuevoCliente])
    setClienteElegido(nuevoCliente)
    setSubModal(null)
  }

  const nombreCompleto = (c) =>
    `${c.nombre}${c.segundo_nombre ? ` ${c.segundo_nombre}` : ''} ${c.apellido_paterno}${c.apellido_materno ? ` ${c.apellido_materno}` : ''}`

  return (
    <>
      <Modal titulo={`Nuevo contrato — Depto ${depto.numero}`} onClose={onClose} ancho="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>

          {/* ── Selector de inquilino ── */}
          <div>
            <p style={{ ...st.label, marginBottom: '8px' }}>Inquilino</p>

            {/* Si hay cliente elegido, mostrarlo con opción de cambiar */}
            {clienteElegido ? (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#f0f7ff', border: '1.5px solid #bdd7f7',
                borderRadius: '8px', padding: '10px 14px',
              }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: '700', fontSize: '14px', color: '#1a1a2e' }}>
                    {nombreCompleto(clienteElegido)}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                    #{clienteElegido.id_cliente} · {clienteElegido.telefono}
                  </p>
                </div>
                <button
                  style={{ ...s.btnSecundario, padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => setClienteElegido(null)}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              /* Dos opciones: seleccionar existente o crear nuevo */
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={ls.modoBtn(false)}
                  onClick={() => setSubModal('seleccionar')}
                  disabled={loadingCli}
                >
                  {loadingCli ? 'Cargando…' : '🔍 Seleccionar existente'}
                </button>
                <button
                  style={ls.modoBtn(false)}
                  onClick={() => setSubModal('nuevo')}
                >
                  ➕ Agregar nuevo cliente
                </button>
              </div>
            )}
          </div>

          {/* Fecha de inicio */}
          <label style={st.label}>
            Fecha de inicio
            <input
              type="date" value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              style={st.input}
            />
          </label>

          {/* Duración */}
          <div>
            <p style={{ ...st.label, marginBottom: '8px' }}>Duración del contrato</p>
            <SelectorDuracion duracion={duracion} onChange={setDuracion} />
          </div>

          {/* Fecha fin calculada */}
          {fechaFin && (
            <div style={st.infoBloque}>
              <span style={st.infoLabel}>Fecha de fin calculada</span>
              <span style={{ ...st.infoVal, color: '#0d6efd' }}>{fmtFecha(fechaFin)}</span>
            </div>
          )}

          {/* Renta */}
          <label style={st.label}>
            Renta mensual
            <InputMonto value={renta} onChange={setRenta} />
          </label>

          {/* Depósito */}
          <label style={st.label}>
            Depósito
            <InputMonto value={deposito} onChange={setDeposito} />
          </label>

          {error && <p style={{ fontSize: '13px', color: '#dc3545', margin: 0 }}>{error}</p>}
        </div>

        <div style={st.botonesRow}>
          <button style={s.btnSecundario} onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button style={s.btnPrimario} onClick={handleConfirmar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Crear contrato'}
          </button>
        </div>
      </Modal>

      {/* Sub-modal: lista de clientes */}
      {subModal === 'seleccionar' && (
        <ModalSeleccionarCliente
          clientes={clientes}
          onSeleccionar={(c) => { setClienteElegido(c); setSubModal(null) }}
          onClose={() => setSubModal(null)}
        />
      )}

      {/* Sub-modal: nuevo cliente */}
      {subModal === 'nuevo' && (
        <ModalNuevoCliente
          onClienteCreado={handleClienteCreado}
          onClose={() => setSubModal(null)}
        />
      )}
    </>
  )
}