export const ESTADOS_MX = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
  'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
]

export const estadoColor = {
  rentado:       { bg: '#d4edda', text: '#155724' },
  promocion:     { bg: '#fff3cd', text: '#856404' },
  mantenimiento: { bg: '#f8d7da', text: '#721c24' },
}

export const colorCalendario = {
  pagado:   { bg: '#d4edda', text: '#155724', label: 'Pagado'    },
  gracia:   { bg: '#fff3cd', text: '#856404', label: 'En gracia' },
  atrasado: { bg: '#f8d7da', text: '#721c24', label: 'Atrasado'  },
  futuro:   { bg: '#f0f0f0', text: '#888',    label: 'Pendiente' },
}

/**
 * Parsea una fecha sin importar si viene como 'YYYY-MM-DD' o como ISO con timezone.
 * Siempre interpreta la fecha en hora local (evita el desplazamiento UTC→local).
 */
function parsearFecha(str) {
  if (!str) return new Date()
  const solo = typeof str === 'string' ? str.slice(0, 10) : new Date(str).toISOString().slice(0, 10)
  const [y, m, d] = solo.split('-').map(Number)
  return new Date(y, m - 1, d) // mes 0-indexado, sin timezone
}

/**
 * Calcula la fecha fin a partir de fecha de inicio y duración en meses.
 */
export function calcularFechaFin(fechaInicio, mesesDuracion) {
  const d = parsearFecha(fechaInicio)
  d.setMonth(d.getMonth() + mesesDuracion)
  d.setDate(d.getDate() - 1)
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

/**
 * Genera el calendario de pagos de un contrato.
 *
 * FIX timezone: MySQL devuelve strings tipo "2026-05-09T00:00:00.000Z".
 * Al parsearlos con new Date() en UTC-6 se interpolan al día anterior.
 * parsearFecha() toma solo YYYY-MM-DD y construye la fecha en hora local.
 *
 * FIX renovación: en vez de dividir totalPagado/rentaMensual (bug cuando
 * sube la renta), se recorre mes a mes FIFO usando la tarifa de cada mes.
 */
export function generarCalendario(fechaInicio, fechaFin, pagosReales, rentaMensual, segmentos) {
  const inicio = parsearFecha(fechaInicio)
  const fin    = parsearFecha(fechaFin)
  const hoy    = new Date()
  hoy.setHours(0, 0, 0, 0)

  // ── Construir meses con su tarifa ─────────────────────────────────────
  // FIX: en vez de mutar cur con setMonth (que puede desbordar el día
  // cuando el mes destino tiene menos días), avanzamos por índice desde
  // el año/mes de inicio. Así el día siempre es el mismo que fecha_inicio
  // y nunca se "corre" por desbordamiento de mes.
  const meses = []
  const añoBase = inicio.getFullYear()
  const mesBase  = inicio.getMonth()   // 0-indexado
  const diaBase  = inicio.getDate()

  let i = 0
  while (true) {
    const fecha = new Date(añoBase, mesBase + i, diaBase)
    if (fecha > fin) break

    let tarifa = rentaMensual
    if (segmentos && segmentos.length > 0) {
      const segs = segmentos
        .filter(s => parsearFecha(s.fechaDesde) <= fecha)
        .sort((a, b) => parsearFecha(b.fechaDesde) - parsearFecha(a.fechaDesde))
      if (segs.length > 0) tarifa = segs[0].rentaMensual
    }

    meses.push({ fecha, estado: 'futuro', tarifa })
    i++
  }

  // ── FIFO: cubrir meses con el saldo pagado ────────────────────────────
  const totalPagado = pagosReales.reduce((sum, p) => sum + Number(p.monto), 0)
  let saldoRestante  = totalPagado
  let mesesCubiertos = 0

  for (let i = 0; i < meses.length; i++) {
    if (saldoRestante >= meses[i].tarifa) {
      saldoRestante -= meses[i].tarifa
      meses[i].estado = 'pagado'
      mesesCubiertos++
    } else {
      break
    }
  }

  // ── Colorear no-pagados por fecha ─────────────────────────────────────
  meses.forEach(mes => {
    if (mes.estado === 'pagado') return
    const diasRetraso = Math.floor((hoy - mes.fecha) / 86400000)
    if (mes.fecha > hoy)       mes.estado = 'futuro'
    else if (diasRetraso <= 5) mes.estado = 'gracia'
    else                       mes.estado = 'atrasado'
  })

  // ── Totales ───────────────────────────────────────────────────────────
  const totalContrato      = meses.reduce((sum, m) => sum + m.tarifa, 0)
  const montoLiquidacion   = Math.max(0, totalContrato - totalPagado)
  const deberiaHaberPagado = meses.filter(m => m.fecha <= hoy).reduce((sum, m) => sum + m.tarifa, 0)
  const saldoAdeudado      = Math.max(0, deberiaHaberPagado - totalPagado)
  const contratoLiquidado  = totalPagado >= totalContrato

  return { meses, totalPagado, mesesCubiertos, montoLiquidacion, saldoAdeudado, contratoLiquidado, totalContrato }
}