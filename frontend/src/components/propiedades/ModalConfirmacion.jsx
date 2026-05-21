import { useEffect } from 'react'

/**
 * ModalConfirmacion — popup de autorización antes de guardar.
 *
 * Props:
 *  titulo      string          Título del popup
 *  descripcion string          Subtítulo / pregunta de confirmación
 *  filas       [{label, valor}] Datos a mostrar en la tabla de resumen
 *  onConfirmar fn              Se llama al presionar "Confirmar"
 *  onCancelar  fn              Se llama al presionar "Cancelar" o cerrar
 *  guardando   bool            Deshabilita el botón mientras se guarda
 *  colorBoton  string          Color hex del botón primario (default #2d6a4f)
 */
export default function ModalConfirmacion({
  titulo      = '¿Confirmar acción?',
  descripcion = 'Revisa los datos antes de continuar.',
  filas       = [],
  onConfirmar,
  onCancelar,
  guardando   = false,
  colorBoton  = '#2d6a4f',
}) {
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancelar?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancelar])

  return (
    <div style={estilos.overlay} onClick={onCancelar}>
      <div style={estilos.caja} onClick={e => e.stopPropagation()}>

        {/* Ícono de escudo */}
        <div style={estilos.iconoWrap}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
               stroke={colorBoton} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>

        <h2 style={estilos.titulo}>{titulo}</h2>
        <p style={estilos.descripcion}>{descripcion}</p>

        {/* Tabla de resumen */}
        {filas.length > 0 && (
          <div style={estilos.tabla}>
            {filas.map(({ label, valor }) => (
              <div key={label} style={estilos.fila}>
                <span style={estilos.filaLabel}>{label}</span>
                <span style={estilos.filaValor}>{valor || <em style={{ color: '#bbb' }}>—</em>}</span>
              </div>
            ))}
          </div>
        )}

        {/* Botones */}
        <div style={estilos.botones}>
          <button style={estilos.btnCancelar} onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
          <button
            style={{ ...estilos.btnConfirmar, background: colorBoton, opacity: guardando ? 0.7 : 1 }}
            onClick={onConfirmar}
            disabled={guardando}
          >
            {guardando
              ? <><Spinner /> Guardando...</>
              : <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Confirmar y guardar
                </>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 13, height: 13,
      border: '2px solid rgba(255,255,255,0.4)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      marginRight: 6,
    }}/>
  )
}

const estilos = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.15s ease',
  },
  caja: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px 28px 24px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    animation: 'slideUp 0.18s ease',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  iconoWrap: {
    width: 56, height: 56,
    borderRadius: '50%',
    background: '#f0faf4',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
    border: '1.5px solid #d1ead9',
  },
  titulo: {
    margin: '0 0 6px',
    fontSize: '17px',
    fontWeight: 700,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  descripcion: {
    margin: '0 0 20px',
    fontSize: '13px',
    color: '#666',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  tabla: {
    background: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '22px',
  },
  fila: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 14px',
    borderBottom: '1px solid #eee',
    fontSize: '13px',
    gap: '12px',
  },
  filaLabel: {
    color: '#888',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  filaValor: {
    color: '#1a1a1a',
    fontWeight: 600,
    textAlign: 'right',
    wordBreak: 'break-word',
  },
  botones: {
    display: 'flex',
    gap: '10px',
  },
  btnCancelar: {
    flex: 1,
    padding: '10px',
    border: '1.5px solid #ddd',
    borderRadius: '8px',
    background: '#fff',
    color: '#444',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  btnConfirmar: {
    flex: 1.6,
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'opacity 0.15s',
  },
}

// Keyframes — inyectados una sola vez
if (typeof document !== 'undefined' && !document.getElementById('mc-keyframes')) {
  const style = document.createElement('style')
  style.id = 'mc-keyframes'
  style.textContent = `
    @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideUp { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    @keyframes spin    { to { transform: rotate(360deg) } }
  `
  document.head.appendChild(style)
}
