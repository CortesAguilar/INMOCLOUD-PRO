import { Dato } from '../ui'
import { fmtFecha } from './depto.utils'
import { colorCalendario } from '../../../utils/calendario'
import s from '../../../styles/propiedades'

// ─── Resumen financiero ───────────────────────────────────────────────────────
function ResumenFinanciero({ totalPagado, mesesCubiertos, totalMeses, saldoAdeudado, montoLiquidacion, contratoLiquidado, totalGastos }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
      gap: '10px', margin: '16px 0 12px',
      background: '#f7f9fc', borderRadius: '8px', padding: '12px 14px',
    }}>
      <div style={s.infoItem}>
        <span style={s.infoLabel}>Total cobrado</span>
        <span style={{ ...s.infoVal, color: '#155724' }}>
          ${totalPagado.toLocaleString('es-MX')}
        </span>
      </div>
      <div style={s.infoItem}>
        <span style={s.infoLabel}>Meses cubiertos</span>
        <span style={s.infoVal}>{mesesCubiertos} de {totalMeses}</span>
      </div>
      <div style={s.infoItem}>
        <span style={s.infoLabel}>Saldo adeudado a la fecha</span>
        <span style={{ ...s.infoVal, color: saldoAdeudado > 0 ? '#721c24' : '#155724' }}>
          ${saldoAdeudado.toLocaleString('es-MX')}
        </span>
      </div>
      <div style={s.infoItem}>
        <span style={s.infoLabel}>Monto de liquidación</span>
        <span style={{ ...s.infoVal, color: montoLiquidacion > 0 ? '#856404' : '#155724' }}>
          {contratoLiquidado ? 'Liquidado ✓' : `$${montoLiquidacion.toLocaleString('es-MX')}`}
        </span>
      </div>
      <div style={s.infoItem}>
        <span style={s.infoLabel}>Gastos en este contrato</span>
        <span style={{ ...s.infoVal, color: '#721c24' }}>
          ${totalGastos.toLocaleString('es-MX')}
        </span>
      </div>
    </div>
  )
}

// ─── Calendario de pagos ──────────────────────────────────────────────────────
function CalendarioPagos({ calendario }) {
  return (
    <>
      <p style={{ ...s.seccionTitulo, marginTop: '4px' }}>📅 Calendario de pagos</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        {calendario.map((mes, i) => {
          const c = colorCalendario[mes.estado]
          return (
            <div
              key={i}
              title={`${c.label} — $${mes.tarifa.toLocaleString('es-MX')}`}
              style={{
                background: c.bg, color: c.text,
                borderRadius: '6px', padding: '4px 8px',
                fontSize: '11px', fontWeight: '600',
              }}
            >
              {mes.fecha
                .toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
                .replace(/^\w/, ch => ch.toUpperCase())}
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {Object.entries(colorCalendario).map(([k, v]) => (
          <span key={k} style={{
            fontSize: '11px', color: v.text, background: v.bg,
            borderRadius: '4px', padding: '2px 7px',
          }}>
            {v.label}
          </span>
        ))}
      </div>
    </>
  )
}

// ─── SeccionContrato ──────────────────────────────────────────────────────────
export default function SeccionContrato({
  contrato, calendario,
  totalPagado, mesesCubiertos, montoLiquidacion, saldoAdeudado, contratoLiquidado,
  totalGastos, puedeAccionar, onAbrirPago, onAbrirGastoDepto, onVerGastos,
}) {
  return (
    <div style={s.seccion}>
      <p style={s.seccionTitulo}>📄 Contrato activo</p>

      {!contrato ? (
        <p style={{ color: '#aaa', fontSize: '14px' }}>
          Este departamento no tiene un contrato activo.
        </p>
      ) : (
        <>
          {/* Datos del contrato */}
          <div style={s.datosGrid}>
            <Dato
              label="Cliente"
              valor={[contrato.cliente_nombre, contrato.apellido_paterno, contrato.apellido_materno].filter(Boolean).join(' ')}
            />
            <Dato label="Teléfono"       valor={contrato.telefono} />
            <Dato label="Renta mensual"  valor={`$${Number(contrato.renta_mensual).toLocaleString('es-MX')}`} />
            <Dato label="Depósito"       valor={`$${Number(contrato.monto_deposito).toLocaleString('es-MX')}`} />
            <Dato label="Inicio"         valor={fmtFecha(contrato.fecha_inicio)} />
            <Dato label="Fin programado" valor={fmtFecha(contrato.fecha_fin_programada)} />
          </div>

          <ResumenFinanciero
            totalPagado={totalPagado}
            mesesCubiertos={mesesCubiertos}
            totalMeses={calendario.length}
            saldoAdeudado={saldoAdeudado}
            montoLiquidacion={montoLiquidacion}
            contratoLiquidado={contratoLiquidado}
            totalGastos={totalGastos}
          />

          <CalendarioPagos calendario={calendario} />

          {/* Botones pago / gasto / ver gastos */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            {puedeAccionar && (
              <>
                {contratoLiquidado ? (
                  <span style={{
                    fontSize: '13px', color: '#155724', background: '#d4edda',
                    borderRadius: '6px', padding: '8px 14px', fontWeight: '600',
                  }}>
                    ✓ Contrato liquidado — no se permiten más pagos
                  </span>
                ) : (
                  <button style={s.btnPrimario} onClick={onAbrirPago}>
                    + Registrar pago
                  </button>
                )}
                <button style={s.btnSecundario} onClick={onAbrirGastoDepto}>
                  + Registrar gasto
                </button>
              </>
            )}
            {/* Ver gastos disponible para todos los roles */}
            <button
              style={{ ...s.btnSecundario, borderColor: '#6c757d', color: '#6c757d' }}
              onClick={onVerGastos}
            >
              📊 Ver gastos
            </button>
          </div>
        </>
      )}
    </div>
  )
}