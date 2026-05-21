SQL — Procedimientos con transacción
DELIMITER $$

-- 1. Rescindir contrato antes de tiempo
CREATE PROCEDURE sp_rescindir_contrato(
    IN p_id_contrato_renta INT,
    IN p_fecha_fin_real    DATE,
    IN p_monto_devuelto    DECIMAL(8,2)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

        -- Cerrar el contrato
        UPDATE contrato_renta
        SET
            fecha_fin_real   = p_fecha_fin_real,
            monto_devuelto   = p_monto_devuelto
        WHERE id_contrato_renta = p_id_contrato_renta;

        -- Cambiar estado del departamento a promocion
        UPDATE departamento
        SET estado_depto = 'promocion'
        WHERE id_departamento = (
            SELECT id_departamento
            FROM contrato_renta
            WHERE id_contrato_renta = p_id_contrato_renta
        );

        -- Eliminar alerta de contrato por vencer si existia
        DELETE FROM alerta_contrato_por_vencer
        WHERE id_contrato_renta = p_id_contrato_renta;

        -- Eliminar alerta de renta sin pagar si existia
        DELETE FROM alerta_renta_sin_pagar
        WHERE id_contrato_renta = p_id_contrato_renta;

    COMMIT;
END$$

-- 2. Renovar contrato activo
CREATE PROCEDURE sp_renovar_contrato(
    IN p_id_contrato_renta    INT,
    IN p_nueva_fecha_fin      DATE,
    IN p_nueva_renta_mensual  DECIMAL(8,2)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

        -- Actualizar fecha de fin y renta
        UPDATE contrato_renta
        SET
            fecha_fin_programada = p_nueva_fecha_fin,
            renta_mensual        = p_nueva_renta_mensual
        WHERE id_contrato_renta = p_id_contrato_renta;

        -- Eliminar alerta de contrato por vencer si existia
        DELETE FROM alerta_contrato_por_vencer
        WHERE id_contrato_renta = p_id_contrato_renta;

    COMMIT;
END$$

-- 3. Pagar recibo de luz
CREATE PROCEDURE sp_pagar_recibo_luz(
    IN p_id_recibo_luz INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

        -- Marcar recibo como pagado
        UPDATE recibo_luz
        SET pagado = TRUE
        WHERE id_recibo_luz = p_id_recibo_luz;

        -- Eliminar alerta si existia
        DELETE FROM alerta_recibo_luz
        WHERE id_recibo_luz = p_id_recibo_luz;

    COMMIT;
END$$

-- 4. Pagar recibo de agua
CREATE PROCEDURE sp_pagar_recibo_agua(
    IN p_id_recibo_agua INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;

        -- Marcar recibo como pagado
        UPDATE recibo_agua
        SET pagado = TRUE
        WHERE id_recibo_agua = p_id_recibo_agua;

        -- Eliminar alerta si existia
        DELETE FROM alerta_recibo_agua
        WHERE id_recibo_agua = p_id_recibo_agua;

    COMMIT;
END$$

DELIMITER ;