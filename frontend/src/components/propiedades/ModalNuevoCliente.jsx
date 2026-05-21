import { useState } from 'react'
import { Modal } from './ui'
import { st } from './depto/depto.utils'
import s from '../../styles/propiedades'
import api from '../../api'

// ─── Estilos locales ──────────────────────────────────────────────────────────
const ls = {
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

const GENERO_OPCIONES = [
  { label: 'Masculino', val: 'M' },
  { label: 'Femenino',  val: 'F' },
  { label: 'Otro',      val: ''  },
]

const FORM_VACIO = {
  nombre: '', segundo_nombre: '',
  apellido_paterno: '', apellido_materno: '',
  fecha_nacimiento: '', genero: '', telefono: '',
}

function calcularEdad(fechaNac) {
  if (!fechaNac) return null
  const hoy  = new Date()
  const nac  = (() => {
    const s = String(fechaNac).slice(0, 10)
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  })()
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m  = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function maxFechaNac() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().split('T')[0]
}

/**
 * ModalNuevoCliente — componente compartido.
 *
 * Props:
 *   onClienteCreado(cliente)  — se llama con el objeto cliente recién creado
 *   onClose()                 — cierra el modal
 */
export default function ModalNuevoCliente({ onClienteCreado, onClose }) {
  const [form,      setForm]      = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const set = (k) => (e) => {
    let v = e.target.value
    if (['nombre','segundo_nombre','apellido_paterno','apellido_materno'].includes(k)) {
      v = v.slice(0, 40)
    }
    setForm(f => ({ ...f, [k]: v }))
  }

  const validar = () => {
    if (!form.nombre.trim())              return 'El nombre es obligatorio.'
    if (!form.apellido_paterno.trim())    return 'El apellido paterno es obligatorio.'
    if (!form.fecha_nacimiento)           return 'La fecha de nacimiento es obligatoria.'
    const edad = calcularEdad(form.fecha_nacimiento)
    if (edad < 18)                        return 'El cliente debe ser mayor de 18 años.'
    if (!form.telefono)                   return 'El teléfono es obligatorio.'
    if (!/^\d{10}$/.test(form.telefono))  return 'El teléfono debe tener exactamente 10 dígitos.'
    return null
  }

  const handleGuardar = async () => {
    const err = validar()
    if (err) return setError(err)
    setError('')
    setGuardando(true)
    try {
      const payload = {
        nombre:           form.nombre.trim(),
        segundo_nombre:   form.segundo_nombre.trim() || null,
        apellido_paterno: form.apellido_paterno.trim(),
        apellido_materno: form.apellido_materno.trim() || null,
        fecha_nacimiento: form.fecha_nacimiento,
        genero:           form.genero || null,
        telefono:         form.telefono,
      }
      const { data } = await api.post('/clientes', payload)
      onClienteCreado(data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Error al guardar el cliente.')
    } finally {
      setGuardando(false)
    }
  }

  const edad = calcularEdad(form.fecha_nacimiento)

  return (
    <Modal titulo="Agregar nuevo cliente" onClose={onClose} ancho="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>

        {/* Nombres */}
        <div style={ls.formGrid}>
          <div>
            <label style={ls.formLabel}>Nombre <span style={{ color: '#dc3545' }}>*</span></label>
            <input style={ls.formInput} maxLength={40} value={form.nombre}
              onChange={set('nombre')} placeholder="Ej: Juan" />
          </div>
          <div>
            <label style={ls.formLabel}>Segundo nombre</label>
            <input style={ls.formInput} maxLength={40} value={form.segundo_nombre}
              onChange={set('segundo_nombre')} placeholder="Opcional" />
          </div>
        </div>

        {/* Apellidos */}
        <div style={ls.formGrid}>
          <div>
            <label style={ls.formLabel}>Apellido paterno <span style={{ color: '#dc3545' }}>*</span></label>
            <input style={ls.formInput} maxLength={40} value={form.apellido_paterno}
              onChange={set('apellido_paterno')} placeholder="Ej: García" />
          </div>
          <div>
            <label style={ls.formLabel}>Apellido materno</label>
            <input style={ls.formInput} maxLength={40} value={form.apellido_materno}
              onChange={set('apellido_materno')} placeholder="Opcional" />
          </div>
        </div>

        {/* Fecha + Género */}
        <div style={ls.formGrid}>
          <div>
            <label style={ls.formLabel}>
              Fecha de nacimiento <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input type="date" style={ls.formInput} value={form.fecha_nacimiento}
              max={maxFechaNac()} onChange={set('fecha_nacimiento')} />
            {form.fecha_nacimiento && (
              <span style={{
                fontSize: '11px', marginTop: '3px', display: 'block',
                color: edad >= 18 ? '#155724' : '#dc3545',
              }}>
                {edad >= 0 ? `${edad} años` : 'Fecha inválida'}
                {edad < 18 && edad >= 0 ? ' — debe ser mayor de 18' : ''}
              </span>
            )}
          </div>
          <div>
            <label style={ls.formLabel}>Género</label>
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              {GENERO_OPCIONES.map(o => (
                <button key={o.val} onClick={() => setForm(f => ({ ...f, genero: o.val }))}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: '6px',
                    fontSize: '12px', cursor: 'pointer',
                    border:      `1.5px solid ${form.genero === o.val ? '#0d6efd' : '#ddd'}`,
                    background:  form.genero === o.val ? '#e8f0fe' : '#fff',
                    color:       form.genero === o.val ? '#0d6efd' : '#555',
                    fontWeight:  form.genero === o.val ? '700' : '500',
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Teléfono */}
        <div>
          <label style={ls.formLabel}>
            Teléfono <span style={{ color: '#dc3545' }}>*</span>
            <span style={{ fontWeight: '400', color: '#aaa' }}> (10 dígitos)</span>
          </label>
          <input style={ls.formInput} type="tel" maxLength={10}
            value={form.telefono}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 10)
              setForm(f => ({ ...f, telefono: v }))
            }}
            placeholder="Ej: 6641234567" />
          {form.telefono && !/^\d{10}$/.test(form.telefono) && (
            <span style={{ fontSize: '11px', color: '#dc3545', marginTop: '3px', display: 'block' }}>
              {form.telefono.length}/10 dígitos
            </span>
          )}
        </div>

        {error && <p style={{ fontSize: '13px', color: '#dc3545', margin: 0 }}>{error}</p>}
      </div>

      <div style={st.botonesRow}>
        <button style={s.btnSecundario} onClick={onClose} disabled={guardando}>Cancelar</button>
        <button style={s.btnPrimario}   onClick={handleGuardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Crear cliente'}
        </button>
      </div>
    </Modal>
  )
}
