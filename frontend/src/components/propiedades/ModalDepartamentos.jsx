import { Modal } from './ui'
import { estadoColor } from '../../utils/calendario'
import s from '../../styles/propiedades'

export default function ModalDepartamentos({
  seleccionada, deptos, loadingDeptos, rol,
  onClose, onAbrirDepto, onAbrirGastoProp, onAbrirVerGastos, onAbrirAddDepto,
}) {
  return (
    <Modal titulo={`Departamentos — ${seleccionada.nombre}`} onClose={onClose} ancho="740px">
      {(rol === 'admin' || rol === 'operador') && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button style={s.btnSecundario} onClick={onAbrirVerGastos}>
            📊 Ver gastos de propiedad
          </button>
          <button style={s.btnPrimario} onClick={onAbrirGastoProp}>
            + Registrar gasto de propiedad
          </button>
          {rol === 'admin' && (
            <button style={{ ...s.btnPrimario, background: '#2d6a4f' }} onClick={onAbrirAddDepto}>
              + Añadir departamento
            </button>
          )}
        </div>
      )}

      {loadingDeptos ? (
        <p style={{ color: '#666' }}>Cargando...</p>
      ) : deptos.length === 0 ? (
        <p style={{ color: '#aaa' }}>Sin departamentos registrados.</p>
      ) : (
        <div style={s.deptoGrid}>
          {deptos.map(d => (
            <div key={d.id_departamento}
              style={{ ...s.deptoCard, cursor: 'pointer' }}
              onClick={() => onAbrirDepto(d)}>
              <div style={s.deptoHeader2}>
                <span style={s.deptoNum}>Depto {d.numero}</span>
                <span style={{ ...s.badge, background: estadoColor[d.estado_depto]?.bg, color: estadoColor[d.estado_depto]?.text }}>
                  {d.estado_depto}
                </span>
              </div>
              <div style={s.deptoInfo}>
                <div style={s.infoItem}><span style={s.infoLabel}>Recámaras</span><span style={s.infoVal}>{d.num_recamaras}</span></div>
                <div style={s.infoItem}><span style={s.infoLabel}>Baños</span><span style={s.infoVal}>{d.num_banos}</span></div>
              </div>
              <p style={{ fontSize: '11px', color: '#aaa', margin: 0, textAlign: 'right' }}>Ver detalle →</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
