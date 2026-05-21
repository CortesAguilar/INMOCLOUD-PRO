import { Dato } from '../ui'
import { fmtFecha } from './depto.utils'
import s from '../../../styles/propiedades'

export default function SeccionDatosGenerales({
  depto, infoDepto, puedeAccionar, estado, contratoLiquidado, onAccion,
}) {
  const tieneLuz  = !!infoDepto?.contrato_luz
  const tieneAgua = !!infoDepto?.contrato_agua

  const btnServicio = (disponible) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    background: disponible ? '#f0f7ff' : '#fafafa',
    border: `1px solid ${disponible ? '#bdd7f7' : '#e8e8e8'}`,
    borderRadius: '8px',
    padding: '10px 12px',
    cursor: disponible ? 'pointer' : 'default',
    textAlign: 'left',
    transition: 'box-shadow 0.15s',
    flex: 1,
    minWidth: 0,
  })

  return (
    <div style={s.seccion}>
      <p style={s.seccionTitulo}>📋 Datos generales</p>

      {/* Fila 1: datos escalares */}
      <div style={s.datosGrid}>
        <Dato label="ID"        valor={`#${depto.id_departamento}`} />
        <Dato label="Número"    valor={depto.numero} />
        <Dato label="Estado"    valor={depto.estado_depto} />
        <Dato label="Recámaras" valor={depto.num_recamaras} />
        <Dato label="Baños"     valor={depto.num_banos} />
        {depto.fecha_registro && (
          <Dato label="Registro" valor={fmtFecha(depto.fecha_registro)} />
        )}
      </div>

      {/* Fila 2: servicios — siempre en el mismo renglón */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>

        <button
          style={btnServicio(tieneLuz)}
          onClick={() => tieneLuz && onAccion('verLuz')}
          title={tieneLuz ? 'Ver recibos de luz' : 'Sin contrato de luz'}
        >
          <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>
            💡 Contrato luz
          </span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: tieneLuz ? '#0d6efd' : '#bbb' }}>
            {infoDepto?.contrato_luz?.numero_contrato || '—'}
          </span>
          {tieneLuz && (
            <span style={{ fontSize: '11px', color: '#0d6efd', marginTop: '2px' }}>Ver recibos →</span>
          )}
        </button>

        <button
          style={btnServicio(tieneAgua)}
          onClick={() => tieneAgua && onAccion('verAgua')}
          title={tieneAgua ? 'Ver recibos de agua' : 'Sin contrato de agua'}
        >
          <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.04em' }}>
            💧 Contrato agua
          </span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: tieneAgua ? '#0d6efd' : '#bbb' }}>
            {infoDepto?.contrato_agua?.numero_contrato || '—'}
          </span>
          {tieneAgua && (
            <span style={{ fontSize: '11px', color: '#0d6efd', marginTop: '2px' }}>Ver recibos →</span>
          )}
        </button>

      </div>

      {puedeAccionar && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>

          {estado === 'promocion' && (
            <>
              <button
                style={{ ...s.btnSecundario, borderColor: '#dc3545', color: '#dc3545' }}
                onClick={() => onAccion('mantenimiento')}
              >
                🔧 Pasar a mantenimiento
              </button>
              <button style={s.btnPrimario} onClick={() => onAccion('nuevoContrato')}>
                📝 Crear contrato
              </button>
            </>
          )}

          {estado === 'mantenimiento' && (
            <button
              style={{ ...s.btnSecundario, borderColor: '#0d6efd', color: '#0d6efd' }}
              onClick={() => onAccion('promocion')}
            >
              🏠 Poner en promoción
            </button>
          )}

          {estado === 'rentado' && (
            <>
              <button
                style={{ ...s.btnSecundario, borderColor: '#dc3545', color: '#dc3545' }}
                onClick={() => onAccion('rescindir')}
              >
                ✂️ Rescindir contrato
              </button>
              {contratoLiquidado && (
                <button
                  style={{ ...s.btnPrimario, background: '#198754' }}
                  onClick={() => onAccion('renovar')}
                >
                  🔄 Renovar contrato
                </button>
              )}
            </>
          )}

        </div>
      )}
    </div>
  )
}