import { Modal } from '../ui'
import { st } from './depto.utils'
import s from '../../../styles/propiedades'

const CFG = {
  mantenimiento: {
    titulo: 'Pasar a mantenimiento',
    color: '#dc3545',
    desc: (num) =>
      `El departamento ${num} quedará en mantenimiento y no estará disponible para renta.`,
  },
  promocion: {
    titulo: 'Poner en promoción',
    color: '#0d6efd',
    desc: (num) =>
      `El departamento ${num} quedará disponible para ser rentado.`,
  },
}

export default function ModalCambiarEstado({ depto, nuevoEstado, onConfirmar, onClose, guardando }) {
  const cfg = CFG[nuevoEstado]

  return (
    <Modal titulo={cfg.titulo} onClose={onClose} ancho="420px">
      <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
        {cfg.desc(depto.numero)}
      </p>
      <div style={st.botonesRow}>
        <button style={s.btnSecundario} onClick={onClose} disabled={guardando}>
          Cancelar
        </button>
        <button
          style={{ ...s.btnPrimario, background: cfg.color }}
          onClick={onConfirmar}
          disabled={guardando}
        >
          {guardando ? 'Guardando…' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  )
}
