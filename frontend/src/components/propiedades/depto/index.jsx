import { useState } from 'react'
import { Modal } from '../ui'
import { generarCalendario } from '../../../utils/calendario'
import s from '../../../styles/propiedades'
import api from '../../../api'

import SeccionDatosGenerales from './SeccionDatosGenerales'
import SeccionContrato       from './SeccionContrato'
import SeccionHistorial      from './SeccionHistorial'
import ModalCambiarEstado    from './ModalCambiarEstado'
import ModalRescindir        from './ModalRescindir'
import ModalRenovar          from './ModalRenovar'
import ModalNuevoContrato    from './ModalNuevoContrato'
import ModalServicio         from './ModalServicio'         // 💡💧 NUEVO
import ModalVerGastosDepto   from './ModalVerGastosDepto'   // 📊 NUEVO

// Valores vacíos cuando no hay contrato activo
const CAL_VACIA = {
  meses: [], totalPagado: 0, mesesCubiertos: 0,
  montoLiquidacion: 0, saldoAdeudado: 0, contratoLiquidado: false,
}

export default function ModalDetalleDepto({
  deptoSeleccionado, infoDepto, gastosDepto, loadingDepto,
  historial, loadingHistorial, verHistorial,
  rol, guardando, msgError,
  onClose, onCargarHistorial, onAbrirPago, onAbrirGastoDepto, onRefrescar,
}) {
  const [subModal,       setSubModal]       = useState(null)
  const [nuevoEstado,    setNuevoEstado]    = useState(null)
  const [guardandoLocal, setGuardandoLocal] = useState(false)
  const [msgLocal,       setMsgLocal]       = useState('')

  const estado        = deptoSeleccionado.estado_depto
  const puedeAccionar = rol === 'admin' || rol === 'operador'
  const totalGastos   = gastosDepto.reduce((sum, g) => sum + Number(g.monto), 0)

  const cal = infoDepto?.contrato
    ? generarCalendario(
        infoDepto.contrato.fecha_inicio,
        infoDepto.contrato.fecha_fin_programada,
        infoDepto.pagos || [],
        Number(infoDepto.contrato.renta_mensual),
        infoDepto.contrato.segmentos_tarifa || null,
      )
    : CAL_VACIA

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const cerrarSubModal = () => {
    setSubModal(null)
    setNuevoEstado(null)
    setMsgLocal('')
  }

  const ejecutar = async (fn) => {
    setGuardandoLocal(true)
    setMsgLocal('')
    try {
      await fn()
      cerrarSubModal()
      onRefrescar?.()
    } catch (e) {
      setMsgLocal(e?.response?.data?.detail || 'Error al guardar')
    } finally {
      setGuardandoLocal(false)
    }
  }

  // ── Dispatch de acciones ─────────────────────────────────────────────────────
  const handleAccion = (accion) => {
    if (['nuevoContrato', 'rescindir', 'renovar', 'verLuz', 'verAgua', 'verGastosDepto'].includes(accion)) {
      setSubModal(accion)
    } else {
      setNuevoEstado(accion)
      setSubModal('cambiarEstado')
    }
  }

  const handleCambiarEstado = () =>
    ejecutar(() =>
      api.patch(`/departamentos/${deptoSeleccionado.id_departamento}/estado`, { estado: nuevoEstado })
    )

  const handleRescindir = ({ fechaFin, devolucion }) =>
    ejecutar(() =>
      api.post(`/contratos/${infoDepto.contrato.id_contrato_renta}/rescindir`, {
        fecha_fin_real: fechaFin,
        monto_devuelto: devolucion,
      })
    )

  const handleRenovar = ({ nuevaFechaFin, nuevaRentaMensual }) =>
    ejecutar(() =>
      api.post(`/contratos/${infoDepto.contrato.id_contrato_renta}/renovar`, {
        nueva_fecha_fin:      nuevaFechaFin,
        nueva_renta_mensual:  nuevaRentaMensual,
      })
    )

  const handleNuevoContrato = (payload) =>
    ejecutar(() => api.post('/contratos', payload))

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal titulo={`Departamento ${deptoSeleccionado.numero}`} onClose={onClose} ancho="700px">
        {loadingDepto ? (
          <p style={{ color: '#666' }}>Cargando...</p>
        ) : (
          <div>
            <SeccionDatosGenerales
              depto={deptoSeleccionado}
              infoDepto={infoDepto}
              puedeAccionar={puedeAccionar}
              estado={estado}
              contratoLiquidado={cal.contratoLiquidado}
              onAccion={handleAccion}
            />
            <SeccionContrato
              contrato={infoDepto?.contrato}
              calendario={cal.meses}
              totalPagado={cal.totalPagado}
              mesesCubiertos={cal.mesesCubiertos}
              montoLiquidacion={cal.montoLiquidacion}
              saldoAdeudado={cal.saldoAdeudado}
              contratoLiquidado={cal.contratoLiquidado}
              totalGastos={totalGastos}
              puedeAccionar={puedeAccionar}
              onAbrirPago={onAbrirPago}
              onAbrirGastoDepto={onAbrirGastoDepto}
              // 📊 Nuevo: botón ver gastos
              onVerGastos={() => handleAccion('verGastosDepto')}
            />
            <SeccionHistorial
              historial={historial}
              loadingHistorial={loadingHistorial}
              verHistorial={verHistorial}
              onCargarHistorial={onCargarHistorial}
            />
            {msgError && (
              <p style={{ color: '#dc3545', fontSize: '13px' }}>{msgError}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Sub-modales existentes */}
      {subModal === 'cambiarEstado' && (
        <ModalCambiarEstado
          depto={deptoSeleccionado}
          nuevoEstado={nuevoEstado}
          onConfirmar={handleCambiarEstado}
          onClose={cerrarSubModal}
          guardando={guardandoLocal}
        />
      )}
      {subModal === 'rescindir' && infoDepto?.contrato && (
        <ModalRescindir
          contrato={infoDepto.contrato}
          onConfirmar={handleRescindir}
          onClose={cerrarSubModal}
          guardando={guardandoLocal}
        />
      )}
      {subModal === 'renovar' && infoDepto?.contrato && (
        <ModalRenovar
          contrato={infoDepto.contrato}
          onConfirmar={handleRenovar}
          onClose={cerrarSubModal}
          guardando={guardandoLocal}
        />
      )}
      {subModal === 'nuevoContrato' && (
        <ModalNuevoContrato
          depto={deptoSeleccionado}
          onConfirmar={handleNuevoContrato}
          onClose={cerrarSubModal}
          guardando={guardandoLocal}
        />
      )}

      {/* 💡 Modal contrato de luz */}
      {subModal === 'verLuz' && infoDepto?.contrato_luz && (
        <ModalServicio
          servicio="luz"
          contrato={infoDepto.contrato_luz}
          puedeAccionar={puedeAccionar}
          onClose={cerrarSubModal}
        />
      )}

      {/* 💧 Modal contrato de agua */}
      {subModal === 'verAgua' && infoDepto?.contrato_agua && (
        <ModalServicio
          servicio="agua"
          contrato={infoDepto.contrato_agua}
          puedeAccionar={puedeAccionar}
          onClose={cerrarSubModal}
        />
      )}

      {/* 📊 Modal ver gastos del departamento */}
      {subModal === 'verGastosDepto' && (
        <ModalVerGastosDepto
          deptoNumero={deptoSeleccionado.numero}
          gastos={gastosDepto}
          onClose={cerrarSubModal}
        />
      )}

      {/* Toast de error local */}
      {msgLocal && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#dc3545', color: '#fff', padding: '10px 20px',
          borderRadius: '8px', fontSize: '14px', zIndex: 9999,
        }}>
          {msgLocal}
        </div>
      )}
    </>
  )
}