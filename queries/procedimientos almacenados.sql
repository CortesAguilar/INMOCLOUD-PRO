USE gestion_inmobiliaria;
-- Procedimientos almacenados
DELIMITER $$

-- 1. Registrar pago de renta
CREATE PROCEDURE sp_registrar_pago_renta(
    IN p_id_contrato_renta INT,
    IN p_monto             DECIMAL(8,2),
    IN p_fecha_pago        DATE
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

        -- Registrar el pago
        INSERT INTO pago_renta (id_contrato_renta, monto, fecha_pago_real)
        VALUES (p_id_contrato_renta, p_monto, p_fecha_pago);

        -- Eliminar alerta de renta sin pagar si el mes actual ya quedó cubierto
        DELETE FROM alerta_renta_sin_pagar
        WHERE id_contrato_renta = p_id_contrato_renta
          AND fn_tiene_pago_mes_actual(p_id_contrato_renta) = TRUE;

    COMMIT;
END$$

-- 2. Registrar gasto en departamento
CREATE PROCEDURE sp_registrar_gasto_departamento(
    IN p_id_departamento INT,
    IN p_categoria       VARCHAR(20),
    IN p_monto           DECIMAL(8,2),
    IN p_fecha_gasto     DATE,
    IN p_descripcion     TEXT
)
BEGIN
    INSERT INTO gasto_departamento
        (id_departamento, categoria, monto, fecha_gasto, descripcion)
    VALUES
        (p_id_departamento, p_categoria, p_monto, p_fecha_gasto, p_descripcion);
END$$

-- 3. Registrar gasto en propiedad
CREATE PROCEDURE sp_registrar_gasto_propiedad(
    IN p_id_propiedad INT,
    IN p_categoria    VARCHAR(20),
    IN p_monto        DECIMAL(8,2),
    IN p_fecha_gasto  DATE,
    IN p_descripcion  TEXT
)
BEGIN
    INSERT INTO gasto_propiedad
        (id_propiedad, categoria, monto, fecha_gasto, descripcion)
    VALUES
        (p_id_propiedad, p_categoria, p_monto, p_fecha_gasto, p_descripcion);
END$$
DELIMITER ;