import s from '../../styles/propiedades'

export function Modal({ titulo, onClose, children, ancho = '460px' }) {
  return (
    <div style={s.overlay}>
      <div style={{ ...s.modal, maxWidth: ancho }}>
        <div style={s.modalHeader}>
          <h3 style={s.modalTitulo}>{titulo}</h3>
          <button style={s.btnCerrar} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Dato({ label, valor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{valor}</span>
    </div>
  )
}