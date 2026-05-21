USE gestion_inmobiliaria;
-- Funciones
DELIMITER $$

-- 1. Días que lleva un departamento sin rentar
CREATE FUNCTION fn_dias_sin_rentar(p_id_departamento INT)
RETURNS INT
READS SQL DATA
BEGIN
    RETURN DATEDIFF(
        CURDATE(),
        COALESCE(
            (SELECT MAX(fecha_fin_real)
             FROM contrato_renta
             WHERE id_departamento = p_id_departamento),
            (SELECT fecha_registro
             FROM departamento
             WHERE id_departamento = p_id_departamento)
        )
    );
END$$

-- 2. Si un contrato tiene pago registrado en el mes actual
CREATE FUNCTION fn_tiene_pago_mes_actual(p_id_contrato_renta INT)
RETURNS BOOLEAN
READS SQL DATA
BEGIN
    RETURN (
        SELECT COUNT(*) > 0
        FROM pago_renta
        WHERE id_contrato_renta = p_id_contrato_renta
          AND YEAR(fecha_pago_real)  = YEAR(CURDATE())
          AND MONTH(fecha_pago_real) = MONTH(CURDATE())
    );
END$$

-- 3. Días que faltan para que venza un contrato
CREATE FUNCTION fn_dias_para_vencer(p_fecha_fin_programada DATE)
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN DATEDIFF(p_fecha_fin_programada, CURDATE());
END$$

DELIMITER ;