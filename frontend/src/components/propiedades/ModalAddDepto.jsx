import { useState } from 'react'
import { Modal } from './ui'
import s from '../../styles/propiedades'

function inputNumeroHabitacion(valor, campo, setErrorLocal) {
  const limpio = valor.replace(/[^0-9]/g, '').slice(0, 2)
  if (limpio === '0') {
    setErrorLocal(`El número de ${campo} no puede ser 0.`)
  } else {
    setErrorLocal('')
  }
  return limpio
}

export default function ModalAddDepto({
  propNombre,
  formDepto,
  setFormDepto,
  msgError,
  guardando,
  // ← ahora recibe la función de confirmación en lugar de onAgregar
  onSolicitarConfirmacion,
  onClose,
}) {
  const [errorLocal, setErrorLocal] = useState('')

  const errorVisible = errorLocal || msgError

  return (
    <Modal titulo={`Añadir departamento — ${propNombre}`} onClose={onClose} ancho="400px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>

        <div>
          <label style={s.label}>Número de departamento</label>
          <input style={s.input} value={formDepto.numero} placeholder="Ej: A1, 101" maxLength={5}
            onChange={e => setFormDepto(f => ({ ...f, numero: e.target.value.slice(0, 5) }))} />
          <span style={{ fontSize: '11px', color: '#aaa' }}>{formDepto.numero.length}/5 caracteres</span>
        </div>

        <div>
          <label style={s.label}>Recámaras</label>
          <input style={s.input} type="text" inputMode="numeric"
            value={formDepto.num_recamaras}
            onChange={e => {
              const v = inputNumeroHabitacion(e.target.value, 'recámaras', setErrorLocal)
              setFormDepto(f => ({ ...f, num_recamaras: v }))
            }} />
        </div>

        <div>
          <label style={s.label}>Baños</label>
          <input style={s.input} type="text" inputMode="numeric"
            value={formDepto.num_banos}
            onChange={e => {
              const v = inputNumeroHabitacion(e.target.value, 'baños', setErrorLocal)
              setFormDepto(f => ({ ...f, num_banos: v }))
            }} />
        </div>

        <div>
          <label style={s.label}>Número de contrato de luz</label>
          <input style={s.input} value={formDepto.contrato_luz} placeholder="Ej: CFE-00123" maxLength={20}
            onChange={e => setFormDepto(f => ({ ...f, contrato_luz: e.target.value.slice(0, 20) }))} />
          <span style={{ fontSize: '11px', color: '#aaa' }}>{formDepto.contrato_luz.length}/20 caracteres</span>
        </div>

        <div>
          <label style={s.label}>Número de contrato de agua</label>
          <input style={s.input} value={formDepto.contrato_agua} placeholder="Ej: CESPT-00456" maxLength={20}
            onChange={e => setFormDepto(f => ({ ...f, contrato_agua: e.target.value.slice(0, 20) }))} />
          <span style={{ fontSize: '11px', color: '#aaa' }}>{formDepto.contrato_agua.length}/20 caracteres</span>
        </div>

        <div style={{ background: '#f0f7ff', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#555' }}>
          El estado del departamento se establecerá en <strong>Promoción</strong> automáticamente.
        </div>
      </div>

      {errorVisible && <p style={s.error}>{errorVisible}</p>}

      <div style={s.modalBtns}>
        <button style={s.btnSecundario} onClick={onClose}>Cancelar</button>
        <button
          style={{ ...s.btnPrimario, background: '#2d6a4f' }}
          onClick={onSolicitarConfirmacion}
          disabled={guardando || !!errorLocal}
        >
          Añadir departamento
        </button>
      </div>
    </Modal>
  )
}