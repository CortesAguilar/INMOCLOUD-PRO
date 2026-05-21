from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional
import pymysql
import os

load_dotenv()

app = FastAPI(title="Gestión Inmobiliaria")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),   # Railway usa puerto variable
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=pymysql.cursors.DictCursor
    )

# ── Modelos ──────────────────────────────────────────
class PagoRenta(BaseModel):
    id_contrato_renta: int
    monto: float
    fecha_pago: str

class GastoDepartamento(BaseModel):
    id_departamento: int
    categoria: str
    monto: float
    fecha_gasto: str
    descripcion: str

class RescindirContrato(BaseModel):
    fecha_fin_real: str
    monto_devuelto: float

class RenovarContrato(BaseModel):
    nueva_fecha_fin: str
    nueva_renta_mensual: float

# ── Departamentos ─────────────────────────────────────
@app.get("/departamentos")
def get_departamentos():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT d.*, p.nombre AS propiedad
            FROM departamento d
            JOIN propiedad p ON d.id_propiedad = p.id_propiedad
        """)
        return cur.fetchall()

@app.get("/departamentos/sin-rentar")
def get_sin_rentar():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM vista_departamentos_sin_rentar")
        return cur.fetchall()

# ── Contratos activos ─────────────────────────────────
@app.get("/contratos")
def get_contratos():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM vista_contratos_activos")
        return cur.fetchall()

@app.post("/contratos/{id}/rescindir")
def rescindir(id: int, body: RescindirContrato):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.callproc("sp_rescindir_contrato", [id, body.fecha_fin_real, body.monto_devuelto])
    conn.commit()
    return {"mensaje": "Contrato rescindido correctamente"}

@app.post("/contratos/{id}/renovar")
def renovar(id: int, body: RenovarContrato):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.callproc("sp_renovar_contrato", [id, body.nueva_fecha_fin, body.nueva_renta_mensual])
    conn.commit()
    return {"mensaje": "Contrato renovado correctamente"}

# ── Pagos de renta ────────────────────────────────────
@app.post("/pagos/renta")
def registrar_pago(pago: PagoRenta):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.callproc("sp_registrar_pago_renta", [pago.id_contrato_renta, pago.monto, pago.fecha_pago])
    conn.commit()
    return {"mensaje": "Pago registrado correctamente"}

# ── Recibos pendientes ────────────────────────────────
@app.get("/recibos/pendientes")
def get_recibos_pendientes():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT 'luz' AS servicio, rl.id_recibo_luz AS id_recibo,
                   d.numero AS departamento, p.nombre AS propiedad,
                   rl.monto, rl.fecha_limite_pago,
                   DATEDIFF(CURDATE(), rl.fecha_limite_pago) AS dias_vencido
            FROM recibo_luz rl
            JOIN contrato_luz cl ON rl.id_contrato_luz = cl.id_contrato_luz
            JOIN departamento d  ON cl.id_departamento = d.id_departamento
            JOIN propiedad p     ON d.id_propiedad = p.id_propiedad
            WHERE rl.pagado = FALSE
            UNION ALL
            SELECT 'agua' AS servicio, ra.id_recibo_agua AS id_recibo,
                   d.numero AS departamento, p.nombre AS propiedad,
                   ra.monto, ra.fecha_limite_pago,
                   DATEDIFF(CURDATE(), ra.fecha_limite_pago) AS dias_vencido
            FROM recibo_agua ra
            JOIN contrato_agua ca ON ra.id_contrato_agua = ca.id_contrato_agua
            JOIN departamento d   ON ca.id_departamento = d.id_departamento
            JOIN propiedad p      ON d.id_propiedad = p.id_propiedad
            WHERE ra.pagado = FALSE
            ORDER BY dias_vencido DESC
        """)
        return cur.fetchall()

@app.post("/recibos/luz/{id}/pagar")
def pagar_luz(id: int):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.callproc("sp_pagar_recibo_luz", [id])
    conn.commit()
    return {"mensaje": "Recibo de luz pagado"}

@app.post("/recibos/agua/{id}/pagar")
def pagar_agua(id: int):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.callproc("sp_pagar_recibo_agua", [id])
    conn.commit()
    return {"mensaje": "Recibo de agua pagado"}

# ── Gastos ────────────────────────────────────────────
@app.post("/gastos/departamento")
def registrar_gasto(gasto: GastoDepartamento):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.callproc("sp_registrar_gasto_departamento", [
            gasto.id_departamento, gasto.categoria,
            gasto.monto, gasto.fecha_gasto, gasto.descripcion
        ])
    conn.commit()
    return {"mensaje": "Gasto registrado correctamente"}

class GastoPropiedad(BaseModel):
    id_propiedad: int
    categoria: str
    monto: float
    fecha_gasto: str
    descripcion: str

@app.post("/gastos/propiedad")
def registrar_gasto_propiedad(gasto: GastoPropiedad):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.callproc("sp_registrar_gasto_propiedad", [
                gasto.id_propiedad, gasto.categoria,
                gasto.monto, gasto.fecha_gasto, gasto.descripcion
            ])
        conn.commit()
        return {"mensaje": "Gasto de propiedad registrado correctamente"}
    finally:
        conn.close()

# ── Alertas ───────────────────────────────────────────
@app.get("/alertas")
def get_alertas():
    conn = get_connection()
    with conn.cursor() as cur:
        alertas = {}

        # Recibos de luz vencidos
        cur.execute("""
            SELECT
                arl.id_alerta_recibo_luz,
                arl.id_recibo_luz,
                arl.fecha_generada,
                d.id_departamento,
                d.numero        AS departamento,
                p.nombre        AS propiedad,
                rl.monto,
                rl.fecha_limite_pago,
                DATEDIFF(CURDATE(), rl.fecha_limite_pago) AS dias_vencido
            FROM alerta_recibo_luz arl
            JOIN recibo_luz    rl  ON arl.id_recibo_luz    = rl.id_recibo_luz
            JOIN contrato_luz  cl  ON rl.id_contrato_luz   = cl.id_contrato_luz
            JOIN departamento  d   ON cl.id_departamento   = d.id_departamento
            JOIN propiedad     p   ON d.id_propiedad       = p.id_propiedad
        """)
        alertas["recibo_luz"] = cur.fetchall()

        # Recibos de agua vencidos
        cur.execute("""
            SELECT
                ara.id_alerta_recibo_agua,
                ara.id_recibo_agua,
                ara.fecha_generada,
                d.id_departamento,
                d.numero        AS departamento,
                p.nombre        AS propiedad,
                ra.monto,
                ra.fecha_limite_pago,
                DATEDIFF(CURDATE(), ra.fecha_limite_pago) AS dias_vencido
            FROM alerta_recibo_agua ara
            JOIN recibo_agua   ra  ON ara.id_recibo_agua   = ra.id_recibo_agua
            JOIN contrato_agua ca  ON ra.id_contrato_agua  = ca.id_contrato_agua
            JOIN departamento  d   ON ca.id_departamento   = d.id_departamento
            JOIN propiedad     p   ON d.id_propiedad       = p.id_propiedad
        """)
        alertas["recibo_agua"] = cur.fetchall()

        # Contratos próximos a vencer
        cur.execute("""
            SELECT
                acv.id_alerta_contrato,
                acv.id_contrato_renta,
                acv.fecha_generada,
                d.id_departamento,
                d.numero        AS departamento,
                p.nombre        AS propiedad,
                cr.renta_mensual,
                cr.fecha_fin_programada,
                fn_dias_para_vencer(cr.fecha_fin_programada) AS dias_para_vencer,
                CONCAT(c.nombre, ' ', c.apellido_paterno)    AS cliente
            FROM alerta_contrato_por_vencer acv
            JOIN contrato_renta cr ON acv.id_contrato_renta = cr.id_contrato_renta
            JOIN departamento   d  ON cr.id_departamento    = d.id_departamento
            JOIN propiedad      p  ON d.id_propiedad        = p.id_propiedad
            JOIN cliente        c  ON cr.id_cliente         = c.id_cliente
        """)
        alertas["contratos_por_vencer"] = cur.fetchall()

        # Rentas sin pagar este mes
        cur.execute("""
            SELECT
                ars.id_alerta_renta,
                ars.id_contrato_renta,
                ars.fecha_generada,
                d.id_departamento,
                d.numero        AS departamento,
                p.nombre        AS propiedad,
                cr.renta_mensual,
                CONCAT(c.nombre, ' ', c.apellido_paterno) AS cliente
            FROM alerta_renta_sin_pagar ars
            JOIN contrato_renta cr ON ars.id_contrato_renta = cr.id_contrato_renta
            JOIN departamento   d  ON cr.id_departamento    = d.id_departamento
            JOIN propiedad      p  ON d.id_propiedad        = p.id_propiedad
            JOIN cliente        c  ON cr.id_cliente         = c.id_cliente
        """)
        alertas["renta_sin_pagar"] = cur.fetchall()

        # Departamentos sin rentar
        cur.execute("""
            SELECT
                ads.id_alerta_depto,
                ads.id_departamento,
                ads.fecha_generada,
                d.numero        AS numero,
                p.nombre        AS propiedad,
                d.estado_depto,
                fn_dias_sin_rentar(d.id_departamento) AS dias_sin_rentar
            FROM alerta_depto_sin_rentar ads
            JOIN departamento d ON ads.id_departamento = d.id_departamento
            JOIN propiedad    p ON d.id_propiedad      = p.id_propiedad
        """)
        alertas["depto_sin_rentar"] = cur.fetchall()

        # Mantenimiento excesivo (>3 gastos de mantenimiento en un contrato activo)
        cur.execute("""
            SELECT
                ame.id_alerta,
                ame.id_departamento,
                ame.id_contrato_renta,
                ame.total_mantenimientos,
                ame.fecha_generada,
                d.numero                                  AS departamento,
                p.nombre                                  AS propiedad,
                p.id_propiedad,
                CONCAT(c.nombre, ' ', c.apellido_paterno) AS cliente,
                cr.fecha_inicio,
                cr.fecha_fin_programada
            FROM alerta_mantenimiento_excesivo ame
            JOIN departamento   d  ON ame.id_departamento   = d.id_departamento
            JOIN propiedad      p  ON d.id_propiedad        = p.id_propiedad
            JOIN contrato_renta cr ON ame.id_contrato_renta = cr.id_contrato_renta
            JOIN cliente        c  ON cr.id_cliente         = c.id_cliente
            WHERE cr.fecha_fin_real       IS NULL
              AND cr.fecha_fin_programada >= CURDATE()
        """)
        alertas["mantenimiento_excesivo"] = cur.fetchall()

        return alertas

# ── Finanzas (vistas) ─────────────────────────────────
@app.get("/finanzas/ingresos")
def get_ingresos():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM vista_ingresos_por_departamento ORDER BY anio DESC, mes DESC")
        return cur.fetchall()

@app.get("/finanzas/saldo-neto")
def get_saldo_neto():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM vista_saldo_neto_departamento ORDER BY anio DESC")
        return cur.fetchall()

# ── Bitácora ──────────────────────────────────────────
@app.get("/bitacora")
def get_bitacora(
    tabla:   Optional[str] = Query(None, description="Filtrar por tabla_afectada"),
    usuario: Optional[str] = Query(None, description="Filtrar por usuario (parcial)"),
    campo:   Optional[str] = Query(None, description="Filtrar por campo (parcial)"),
    desde:   Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD"),
    hasta:   Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD"),
    limite:  int           = Query(50, ge=1, le=500, description="Máximo de registros"),
):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            sql    = "SELECT * FROM bitacora WHERE 1=1"
            params = []

            if tabla:
                sql += " AND tabla_afectada = %s"
                params.append(tabla)

            if usuario:
                sql += " AND usuario LIKE %s"
                params.append(f"%{usuario}%")

            if campo:
                sql += " AND campo LIKE %s"
                params.append(f"%{campo}%")

            if desde:
                sql += " AND DATE(fecha) >= %s"
                params.append(desde)

            if hasta:
                sql += " AND DATE(fecha) <= %s"
                params.append(hasta)

            sql += " ORDER BY fecha DESC LIMIT %s"
            params.append(limite)

            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        conn.close()
    
class LoginData(BaseModel):
    usuario: str
    password: str

@app.post("/login")
def login(data: LoginData):
    usuarios = {
        "admin_principal": {"rol": "admin",    "nombre": "Administrador"},
        "operador_01":     {"rol": "operador",  "nombre": "Operador"},
        "lector_01":       {"rol": "lector",    "nombre": "Lector"},
    }

    passwords = {
        "admin_principal": "Admin#2024!",
        "operador_01":     "Oper#2024!",
        "lector_01":       "Lect#2024!",
    }

    if data.usuario not in usuarios:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    if passwords[data.usuario] != data.password:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    return {
        "usuario": data.usuario,
        "rol": usuarios[data.usuario]["rol"],
        "nombre": usuarios[data.usuario]["nombre"]
    }

@app.get("/propiedades")
def get_propiedades():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM propiedad")
        return cur.fetchall()

@app.get("/propiedades/{id}/departamentos")
def get_deptos_por_propiedad(id: int):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT d.*, p.nombre AS propiedad
            FROM departamento d
            JOIN propiedad p ON d.id_propiedad = p.id_propiedad
            WHERE d.id_propiedad = %s
        """, (id,))
        return cur.fetchall()
    
@app.get("/contratos/{id}/pagos")
def get_pagos_contrato(id: int):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT * FROM pago_renta 
            WHERE id_contrato_renta = %s 
            ORDER BY fecha_pago_real DESC
        """, (id,))
        return cur.fetchall()
    
@app.get("/clientes")
def get_clientes():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM cliente ORDER BY apellido_paterno")
        return cur.fetchall()

@app.get("/departamentos/disponibles")
def get_departamentos_disponibles():
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT d.*, p.nombre AS propiedad
            FROM departamento d
            JOIN propiedad p ON d.id_propiedad = p.id_propiedad
            WHERE d.estado_depto != 'rentado'
        """)
        return cur.fetchall()

class NuevoContrato(BaseModel):
    id_departamento: int
    id_cliente: int
    renta_mensual: float
    monto_deposito: float
    fecha_inicio: str
    fecha_fin_programada: str

@app.post("/contratos")
def crear_contrato(c: NuevoContrato):
    conn = get_connection()
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO contrato_renta 
                (id_departamento, id_cliente, renta_mensual, monto_deposito, fecha_inicio, fecha_fin_programada)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (c.id_departamento, c.id_cliente, c.renta_mensual, c.monto_deposito, c.fecha_inicio, c.fecha_fin_programada))
    conn.commit()
    return {"mensaje": "Contrato creado correctamente"}

class PropiedadBody(BaseModel):
    nombre: str
    calle: str
    colonia: str
    ciudad: str
    estado: str
    codigo_postal: str

@app.post("/propiedades")
def crear_propiedad(p: PropiedadBody):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO propiedad (nombre, calle, colonia, ciudad, estado, codigo_postal)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (p.nombre, p.calle, p.colonia, p.ciudad, p.estado, p.codigo_postal))
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()

@app.put("/propiedades/{id}")
def editar_propiedad(id: int, p: PropiedadBody):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE propiedad SET nombre=%s, calle=%s, colonia=%s,
                ciudad=%s, estado=%s, codigo_postal=%s
                WHERE id_propiedad=%s
            """, (p.nombre, p.calle, p.colonia, p.ciudad, p.estado, p.codigo_postal, id))
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()

@app.get("/propiedades/{id}/gastos")
def get_gastos_propiedad(id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM gasto_propiedad
                WHERE id_propiedad = %s
                ORDER BY fecha_gasto DESC
            """, (id,))
            return cur.fetchall()
    finally:
        conn.close()

@app.delete("/propiedades/{id}")
def eliminar_propiedad(id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM propiedad WHERE id_propiedad=%s", (id,))
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()

class NuevoDepartamento(BaseModel):
    id_propiedad: int
    numero: str
    num_recamaras: int
    num_banos: int
    contrato_luz: str
    contrato_agua: str

@app.post("/departamentos")
def crear_departamento(d: NuevoDepartamento):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO departamento (id_propiedad, numero, num_recamaras, num_banos, estado_depto)
                VALUES (%s, %s, %s, %s, 'promocion')
            """, (d.id_propiedad, d.numero, d.num_recamaras, d.num_banos))
            id_depto = cur.lastrowid

            cur.execute("""
                INSERT INTO contrato_luz (id_departamento, numero_contrato)
                VALUES (%s, %s)
            """, (id_depto, d.contrato_luz))

            cur.execute("""
                INSERT INTO contrato_agua (id_departamento, numero_contrato)
                VALUES (%s, %s)
            """, (id_depto, d.contrato_agua))

        conn.commit()
        return {"ok": True}
    finally:
        conn.close()

class PagoRentaDepto(BaseModel):
    id_contrato_renta: int
    monto: float
    fecha_pago: str

class GastoDepto(BaseModel):
    id_departamento: int
    categoria: str
    monto: float
    fecha_gasto: str
    descripcion: str

@app.get("/departamentos/{id}/contrato-activo")
def get_contrato_activo_depto(id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Contrato activo
            cur.execute("""
                SELECT cr.*, 
                       c.nombre AS cliente_nombre,
                       c.apellido_paterno, c.apellido_materno,
                       c.telefono
                FROM contrato_renta cr
                JOIN cliente c ON cr.id_cliente = c.id_cliente
                WHERE cr.id_departamento = %s AND cr.fecha_fin_real IS NULL
                ORDER BY cr.fecha_inicio DESC LIMIT 1
            """, (id,))
            contrato = cur.fetchone()

            # Pagos del contrato activo
            pagos = []
            if contrato:
                cur.execute("""
                    SELECT * FROM pago_renta
                    WHERE id_contrato_renta = %s
                    ORDER BY fecha_pago_real ASC
                """, (contrato['id_contrato_renta'],))
                pagos = cur.fetchall()

            # Contrato de luz
            cur.execute("""
                SELECT * FROM contrato_luz WHERE id_departamento = %s
            """, (id,))
            contrato_luz = cur.fetchone()

            # Contrato de agua
            cur.execute("""
                SELECT * FROM contrato_agua WHERE id_departamento = %s
            """, (id,))
            contrato_agua = cur.fetchone()

            return {
                "contrato": contrato,
                "pagos": pagos,
                "contrato_luz": contrato_luz,
                "contrato_agua": contrato_agua,
            }
    finally:
        conn.close()

@app.get("/departamentos/{id}/historial-contratos")
def get_historial_contratos_depto(id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT cr.*,
                       c.nombre AS cliente_nombre,
                       c.apellido_paterno, c.apellido_materno
                FROM contrato_renta cr
                JOIN cliente c ON cr.id_cliente = c.id_cliente
                WHERE cr.id_departamento = %s AND cr.fecha_fin_real IS NOT NULL
                ORDER BY cr.fecha_inicio DESC
            """, (id,))
            return cur.fetchall()
    finally:
        conn.close()

@app.get("/departamentos/{id}/gastos")
def get_gastos_departamento(id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM gasto_departamento
                WHERE id_departamento = %s
                ORDER BY fecha_gasto DESC
            """, (id,))
            return cur.fetchall()
    finally:
        conn.close()
 # ── Agregar este modelo junto a los otros BaseModel existentes ────────────────

class CambiarEstadoDepto(BaseModel):
    estado: str  # 'promocion' | 'mantenimiento'


@app.patch("/departamentos/{id}/estado")
def cambiar_estado_depto(id: int, body: CambiarEstadoDepto):
    estados_validos = {'promocion', 'mantenimiento'}
    if body.estado not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Permitidos: {estados_validos}")
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Verificar que el depto no esté rentado (no debe cambiarse desde aquí)
            cur.execute("SELECT estado_depto FROM departamento WHERE id_departamento = %s", (id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Departamento no encontrado")
            if row['estado_depto'] == 'rentado':
                raise HTTPException(status_code=400, detail="No se puede cambiar el estado de un departamento rentado")
            cur.execute(
                "UPDATE departamento SET estado_depto = %s WHERE id_departamento = %s",
                (body.estado, id)
            )
        conn.commit()
        return {"mensaje": f"Estado cambiado a '{body.estado}'"}
    finally:
        conn.close()

class NuevoReciboLuz(BaseModel):
    id_contrato_luz: int
    monto: float
    fecha_inicio_periodo: str
    fecha_fin_periodo: str
    fecha_limite_pago: str
 
class NuevoReciboAgua(BaseModel):
    id_contrato_agua: int
    monto: float
    fecha_inicio_periodo: str
    fecha_fin_periodo: str
    fecha_limite_pago: str
 
# GET recibos de luz de un contrato_luz específico
@app.get("/contratos-luz/{id_contrato_luz}/recibos")
def get_recibos_luz(id_contrato_luz: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM recibo_luz
                WHERE id_contrato_luz = %s
                ORDER BY fecha_inicio_periodo DESC
            """, (id_contrato_luz,))
            return cur.fetchall()
    finally:
        conn.close()
 
# GET recibos de agua de un contrato_agua específico
@app.get("/contratos-agua/{id_contrato_agua}/recibos")
def get_recibos_agua(id_contrato_agua: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM recibo_agua
                WHERE id_contrato_agua = %s
                ORDER BY fecha_inicio_periodo DESC
            """, (id_contrato_agua,))
            return cur.fetchall()
    finally:
        conn.close()
 
# POST registrar nuevo recibo de luz
@app.post("/recibos/luz")
def registrar_recibo_luz(r: NuevoReciboLuz):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO recibo_luz
                    (id_contrato_luz, monto, fecha_inicio_periodo, fecha_fin_periodo, fecha_limite_pago)
                VALUES (%s, %s, %s, %s, %s)
            """, (r.id_contrato_luz, r.monto, r.fecha_inicio_periodo, r.fecha_fin_periodo, r.fecha_limite_pago))
        conn.commit()
        return {"mensaje": "Recibo de luz registrado correctamente"}
    finally:
        conn.close()
 
# POST registrar nuevo recibo de agua
@app.post("/recibos/agua")
def registrar_recibo_agua(r: NuevoReciboAgua):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO recibo_agua
                    (id_contrato_agua, monto, fecha_inicio_periodo, fecha_fin_periodo, fecha_limite_pago)
                VALUES (%s, %s, %s, %s, %s)
            """, (r.id_contrato_agua, r.monto, r.fecha_inicio_periodo, r.fecha_fin_periodo, r.fecha_limite_pago))
        conn.commit()
        return {"mensaje": "Recibo de agua registrado correctamente"}
    finally:
        conn.close()

class NuevoCliente(BaseModel):
    nombre:           str
    segundo_nombre:   Optional[str] = None
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    fecha_nacimiento: str          # 'YYYY-MM-DD'
    genero:           Optional[str] = None   # 'M' | 'F' | None
    telefono:         str          # exactamente 10 dígitos — validado en frontend también

@app.get("/clientes")
def get_clientes():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT * FROM cliente
                ORDER BY apellido_paterno, apellido_materno, nombre
            """)
            return cur.fetchall()
    finally:
        conn.close()

@app.post("/clientes")
def crear_cliente(c: NuevoCliente):
    # Validaciones básicas server-side
    import re
    from datetime import date, datetime

    if not re.match(r'^\d{10}$', c.telefono):
        raise HTTPException(status_code=400, detail="El teléfono debe tener exactamente 10 dígitos numéricos.")

    try:
        nac = datetime.strptime(c.fecha_nacimiento, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha de nacimiento inválida.")

    hoy  = date.today()
    edad = hoy.year - nac.year - ((hoy.month, hoy.day) < (nac.month, nac.day))
    if edad < 18:
        raise HTTPException(status_code=400, detail="El cliente debe ser mayor de 18 años.")

    if c.genero and c.genero not in ('M', 'F'):
        raise HTTPException(status_code=400, detail="Género inválido. Use 'M', 'F' o déjelo vacío.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO cliente
                    (nombre, segundo_nombre, apellido_paterno, apellido_materno,
                     fecha_nacimiento, genero, telefono)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                c.nombre, c.segundo_nombre or None,
                c.apellido_paterno, c.apellido_materno or None,
                c.fecha_nacimiento,
                c.genero or None,
                c.telefono,
            ))
            new_id = cur.lastrowid
        conn.commit()

        # Devolver el cliente recién creado para que el frontend lo use directamente
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM cliente WHERE id_cliente = %s", (new_id,))
            return cur.fetchone()

    except pymysql.err.IntegrityError as e:
        if 'telefono' in str(e):
            raise HTTPException(status_code=409, detail="Ya existe un cliente con ese número de teléfono.")
        raise HTTPException(status_code=409, detail="Error de duplicado en la base de datos.")
    finally:
        conn.close()

# ── Finanzas (endpoints completos para la página de reportes) ─────────────────

@app.get("/finanzas/resumen")
def get_finanzas_resumen():
    """KPIs globales: ingresos totales, gastos totales, saldo neto, deptos rentados."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    COALESCE(SUM(monto), 0) AS total_ingresos
                FROM pago_renta
                WHERE fecha_pago_real IS NOT NULL
            """)
            total_ingresos = cur.fetchone()['total_ingresos']

            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) AS total_gastos_depto
                FROM gasto_departamento
            """)
            total_gastos_depto = cur.fetchone()['total_gastos_depto']

            cur.execute("""
                SELECT COALESCE(SUM(monto), 0) AS total_gastos_prop
                FROM gasto_propiedad
            """)
            total_gastos_prop = cur.fetchone()['total_gastos_prop']

            cur.execute("""
                SELECT
                    COUNT(*) AS total,
                    SUM(estado_depto = 'rentado')       AS rentados,
                    SUM(estado_depto = 'promocion')     AS en_promocion,
                    SUM(estado_depto = 'mantenimiento') AS en_mantenimiento
                FROM departamento
            """)
            deptos = cur.fetchone()

            total_gastos = float(total_gastos_depto) + float(total_gastos_prop)

            return {
                "total_ingresos":      float(total_ingresos),
                "total_gastos":        total_gastos,
                "saldo_neto":          float(total_ingresos) - total_gastos,
                "total_deptos":        deptos['total'],
                "deptos_rentados":     deptos['rentados'],
                "deptos_promocion":    deptos['en_promocion'],
                "deptos_mantenimiento":deptos['en_mantenimiento'],
                "tasa_ocupacion":      round(deptos['rentados'] / deptos['total'] * 100, 1) if deptos['total'] else 0,
            }
    finally:
        conn.close()


@app.get("/finanzas/flujo-mensual")
def get_flujo_mensual():
    """Ingresos y gastos agrupados por mes (últimos 24 meses)."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    YEAR(fecha_pago_real)  AS anio,
                    MONTH(fecha_pago_real) AS mes,
                    SUM(monto)             AS ingresos
                FROM pago_renta
                WHERE fecha_pago_real IS NOT NULL
                  AND fecha_pago_real >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
                GROUP BY anio, mes
                ORDER BY anio, mes
            """)
            ingresos = {(r['anio'], r['mes']): float(r['ingresos']) for r in cur.fetchall()}

            cur.execute("""
                SELECT anio, mes, SUM(monto) AS gastos FROM (
                    SELECT YEAR(fecha_gasto) AS anio, MONTH(fecha_gasto) AS mes, monto
                    FROM gasto_departamento
                    WHERE fecha_gasto >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
                    UNION ALL
                    SELECT YEAR(fecha_gasto), MONTH(fecha_gasto), monto
                    FROM gasto_propiedad
                    WHERE fecha_gasto >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
                ) g GROUP BY anio, mes ORDER BY anio, mes
            """)
            gastos = {(r['anio'], r['mes']): float(r['gastos']) for r in cur.fetchall()}

            # Unir todas las claves
            claves = sorted(set(ingresos) | set(gastos))
            resultado = []
            MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
            for (anio, mes) in claves:
                ing = ingresos.get((anio, mes), 0)
                gas = gastos.get((anio, mes), 0)
                resultado.append({
                    "anio":     anio,
                    "mes":      mes,
                    "label":    f"{MESES[mes]} {anio}",
                    "ingresos": ing,
                    "gastos":   gas,
                    "saldo":    ing - gas,
                })
            return resultado
    finally:
        conn.close()


@app.get("/finanzas/por-propiedad")
def get_finanzas_por_propiedad():
    """Ingresos, gastos y saldo neto agrupados por propiedad."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    p.id_propiedad,
                    p.nombre AS propiedad,
                    COALESCE(SUM(pr.monto), 0)  AS ingresos,
                    COALESCE(SUM(gd.monto), 0)  AS gastos_depto,
                    COALESCE(SUM(gp.monto), 0)  AS gastos_prop
                FROM propiedad p
                LEFT JOIN departamento d        ON d.id_propiedad       = p.id_propiedad
                LEFT JOIN contrato_renta cr     ON cr.id_departamento   = d.id_departamento
                LEFT JOIN pago_renta pr         ON pr.id_contrato_renta = cr.id_contrato_renta
                                                AND pr.fecha_pago_real IS NOT NULL
                LEFT JOIN gasto_departamento gd ON gd.id_departamento   = d.id_departamento
                LEFT JOIN gasto_propiedad gp    ON gp.id_propiedad      = p.id_propiedad
                GROUP BY p.id_propiedad, p.nombre
                ORDER BY ingresos DESC
            """)
            rows = cur.fetchall()
            return [{
                "id_propiedad": r['id_propiedad'],
                "propiedad":    r['propiedad'],
                "ingresos":     float(r['ingresos']),
                "gastos":       float(r['gastos_depto']) + float(r['gastos_prop']),
                "saldo_neto":   float(r['ingresos']) - float(r['gastos_depto']) - float(r['gastos_prop']),
            } for r in rows]
    finally:
        conn.close()


# ── Clientes (página dedicada) ────────────────────────────────────────────────

@app.get("/clientes/{id}/perfil")
def get_perfil_cliente(id: int):
    """Datos completos del cliente + historial de contratos + estadísticas de pago."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM cliente WHERE id_cliente = %s", (id,))
            cliente = cur.fetchone()
            if not cliente:
                raise HTTPException(status_code=404, detail="Cliente no encontrado")

            cur.execute("""
                SELECT
                    cr.id_contrato_renta,
                    cr.renta_mensual,
                    cr.monto_deposito,
                    cr.fecha_inicio,
                    cr.fecha_fin_programada,
                    cr.fecha_fin_real,
                    cr.monto_devuelto,
                    cr.fecha_registro,
                    d.numero        AS departamento,
                    p.nombre        AS propiedad,
                    p.id_propiedad,
                    d.id_departamento,
                    CASE WHEN cr.fecha_fin_real IS NULL THEN 'activo' ELSE 'finalizado' END AS estado,
                    (
                        SELECT COALESCE(SUM(pr.monto), 0)
                        FROM pago_renta pr
                        WHERE pr.id_contrato_renta = cr.id_contrato_renta
                          AND pr.fecha_pago_real IS NOT NULL
                    ) AS total_pagado,
                    (
                        SELECT COUNT(*)
                        FROM pago_renta pr
                        WHERE pr.id_contrato_renta = cr.id_contrato_renta
                    ) AS num_pagos
                FROM contrato_renta cr
                JOIN departamento d ON cr.id_departamento = d.id_departamento
                JOIN propiedad    p ON d.id_propiedad     = p.id_propiedad
                WHERE cr.id_cliente = %s
                ORDER BY cr.fecha_inicio DESC
            """, (id,))
            contratos = cur.fetchall()

            total_pagado  = sum(float(c['total_pagado']) for c in contratos)
            num_contratos = len(contratos)
            activo        = next((c for c in contratos if c['estado'] == 'activo'), None)

            return {
                "cliente":   cliente,
                "contratos": contratos,
                "stats": {
                    "num_contratos":   num_contratos,
                    "total_pagado":    total_pagado,
                    "tiene_activo":    activo is not None,
                    "contrato_activo": activo,
                }
            }
    finally:
        conn.close()