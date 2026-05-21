USE gestion_inmobiliaria;


-- VISTAS

-- 1. Ingresos por departamento (mes y año)
CREATE VIEW vista_ingresos_por_departamento AS
SELECT
    d.id_departamento,
    d.numero,
    p.nombre                        AS propiedad,
    YEAR(pr.fecha_pago_real)         AS anio,
    MONTH(pr.fecha_pago_real)        AS mes,
    SUM(pr.monto)                    AS total_ingresos
FROM pago_renta pr
JOIN contrato_renta cr ON pr.id_contrato_renta = cr.id_contrato_renta
JOIN departamento d    ON cr.id_departamento  = d.id_departamento
JOIN propiedad p       ON d.id_propiedad      = p.id_propiedad
WHERE pr.fecha_pago_real IS NOT NULL
GROUP BY d.id_departamento, d.numero, p.nombre,
         YEAR(pr.fecha_pago_real), MONTH(pr.fecha_pago_real);

-- 2. Gastos por departamento (mes y año)
CREATE VIEW vista_gastos_por_departamento AS
SELECT
    d.id_departamento,
    d.numero,
    p.nombre                        AS propiedad,
    YEAR(gd.fecha_gasto)            AS anio,
    MONTH(gd.fecha_gasto)           AS mes,
    SUM(gd.monto)                   AS total_gastos
FROM gasto_departamento gd
JOIN departamento d ON gd.id_departamento = d.id_departamento
JOIN propiedad p    ON d.id_propiedad     = p.id_propiedad
GROUP BY d.id_departamento, d.numero, p.nombre,
         YEAR(gd.fecha_gasto), MONTH(gd.fecha_gasto);

-- 3. Gastos por propiedad (mes y año)
CREATE VIEW vista_gastos_por_propiedad AS
SELECT
    p.id_propiedad,
    p.nombre                        AS propiedad,
    YEAR(gp.fecha_gasto)            AS anio,
    MONTH(gp.fecha_gasto)           AS mes,
    SUM(gp.monto)                   AS total_gastos
FROM gasto_propiedad gp
JOIN propiedad p ON gp.id_propiedad = p.id_propiedad
GROUP BY p.id_propiedad, p.nombre,
         YEAR(gp.fecha_gasto), MONTH(gp.fecha_gasto);

-- 4. Saldo neto por departamento
CREATE VIEW vista_saldo_neto_departamento AS
SELECT
    d.id_departamento,
    d.numero,
    p.nombre                                        AS propiedad,
    YEAR(COALESCE(pr.fecha_pago_real, gd.fecha_gasto)) AS anio,
    COALESCE(SUM(pr.monto), 0)                      AS total_ingresos,
    COALESCE(SUM(gd.monto), 0)                      AS total_gastos,
    COALESCE(SUM(pr.monto), 0) -
    COALESCE(SUM(gd.monto), 0)                      AS saldo_neto
FROM departamento d
JOIN propiedad p            ON d.id_propiedad      = p.id_propiedad
LEFT JOIN contrato_renta cr ON cr.id_departamento  = d.id_departamento
LEFT JOIN pago_renta pr     ON pr.id_contrato_renta = cr.id_contrato_renta
                            AND pr.fecha_pago_real IS NOT NULL
LEFT JOIN gasto_departamento gd ON gd.id_departamento = d.id_departamento
GROUP BY d.id_departamento, d.numero, p.nombre,
         YEAR(COALESCE(pr.fecha_pago_real, gd.fecha_gasto));

-- 5. Saldo neto por propiedad
CREATE VIEW vista_saldo_neto_propiedad AS
SELECT
    p.id_propiedad,
    p.nombre                                            AS propiedad,
    YEAR(COALESCE(pr.fecha_pago_real, gp.fecha_gasto))  AS anio,
    COALESCE(SUM(pr.monto), 0)                         AS total_ingresos,
    COALESCE(SUM(gp.monto), 0)                         AS total_gastos_propiedad,
    COALESCE(SUM(pr.monto), 0) -
    COALESCE(SUM(gp.monto), 0)                         AS saldo_neto
FROM propiedad p
LEFT JOIN departamento d        ON d.id_propiedad       = p.id_propiedad
LEFT JOIN contrato_renta cr     ON cr.id_departamento   = d.id_departamento
LEFT JOIN pago_renta pr         ON pr.id_contrato_renta = cr.id_contrato_renta
                                AND pr.fecha_pago_real IS NOT NULL
LEFT JOIN gasto_propiedad gp    ON gp.id_propiedad      = p.id_propiedad
GROUP BY p.id_propiedad, p.nombre,
         YEAR(COALESCE(pr.fecha_pago_real, gp.fecha_gasto));

-- 6. Contratos activos con cliente y departamento
CREATE OR REPLACE VIEW vista_contratos_activos AS
SELECT
    cr.id_contrato_renta,
    cr.id_cliente,                                        -- ← línea añadida
    p.nombre                                          AS propiedad,
    d.numero                                          AS departamento,
    CONCAT(c.nombre, ' ', c.apellido_paterno)         AS cliente,
    c.telefono,
    cr.renta_mensual,
    cr.fecha_inicio,
    cr.fecha_fin_programada,
    fn_dias_para_vencer(cr.fecha_fin_programada)      AS dias_para_vencer
FROM contrato_renta cr
JOIN departamento d ON cr.id_departamento = d.id_departamento
JOIN propiedad p    ON d.id_propiedad     = p.id_propiedad
JOIN cliente c      ON cr.id_cliente      = c.id_cliente
WHERE cr.fecha_fin_real IS NULL
  AND cr.fecha_fin_programada >= CURDATE();

-- 7. Recibos pendientes de pago
CREATE VIEW vista_recibos_pendientes AS
SELECT
    'luz'                AS servicio,
    d.numero             AS departamento,
    p.nombre             AS propiedad,
    rl.monto,
    rl.fecha_limite_pago,
    DATEDIFF(CURDATE(), rl.fecha_limite_pago) AS dias_vencido
FROM recibo_luz rl
JOIN contrato_luz cl ON rl.id_contrato_luz  = cl.id_contrato_luz
JOIN departamento d  ON cl.id_departamento  = d.id_departamento
JOIN propiedad p     ON d.id_propiedad      = p.id_propiedad
WHERE rl.pagado = FALSE
UNION ALL
SELECT
    'agua'               AS servicio,
    d.numero             AS departamento,
    p.nombre             AS propiedad,
    ra.monto,
    ra.fecha_limite_pago,
    DATEDIFF(CURDATE(), ra.fecha_limite_pago) AS dias_vencido
FROM recibo_agua ra
JOIN contrato_agua ca ON ra.id_contrato_agua = ca.id_contrato_agua
JOIN departamento d   ON ca.id_departamento  = d.id_departamento
JOIN propiedad p      ON d.id_propiedad      = p.id_propiedad
WHERE ra.pagado = FALSE;

-- 8. Departamentos sin rentar
CREATE VIEW vista_departamentos_sin_rentar AS
SELECT
    d.id_departamento,
    d.numero,
    p.nombre                                          AS propiedad,
    d.estado_depto,
    fn_dias_sin_rentar(d.id_departamento)             AS dias_sin_rentar
FROM departamento d
JOIN propiedad p ON d.id_propiedad = p.id_propiedad
WHERE d.estado_depto != 'rentado';