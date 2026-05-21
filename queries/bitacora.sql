USE gestion_inmobiliaria;

-- ============================================
-- TABLA BITACORA
-- ============================================
DELIMITER $$
CREATE TABLE bitacora (
    id_bitacora    INT          NOT NULL AUTO_INCREMENT,
    tabla_afectada VARCHAR(50)  NOT NULL,
    id_registro    INT          NOT NULL,
    campo          VARCHAR(50)  NOT NULL,
    valor_anterior TEXT,
    valor_nuevo    TEXT,
    usuario        VARCHAR(100) NOT NULL,
    fecha          DATETIME     DEFAULT NOW(),
    PRIMARY KEY (id_bitacora)
);

-- ============================================
-- TRIGGERS PARA contrato_renta
-- ============================================



CREATE TRIGGER trg_bitacora_contrato_renta
AFTER UPDATE ON contrato_renta
FOR EACH ROW
BEGIN

    IF OLD.renta_mensual != NEW.renta_mensual THEN
        INSERT INTO bitacora (tabla_afectada, id_registro, campo, valor_anterior, valor_nuevo, usuario)
        VALUES ('contrato_renta', OLD.id_contrato_renta, 'renta_mensual',
                OLD.renta_mensual, NEW.renta_mensual, CURRENT_USER());
    END IF;

    IF OLD.fecha_fin_programada != NEW.fecha_fin_programada THEN
        INSERT INTO bitacora (tabla_afectada, id_registro, campo, valor_anterior, valor_nuevo, usuario)
        VALUES ('contrato_renta', OLD.id_contrato_renta, 'fecha_fin_programada',
                OLD.fecha_fin_programada, NEW.fecha_fin_programada, CURRENT_USER());
    END IF;

    IF (OLD.fecha_fin_real IS NULL AND NEW.fecha_fin_real IS NOT NULL)
    OR (OLD.fecha_fin_real != NEW.fecha_fin_real) THEN
        INSERT INTO bitacora (tabla_afectada, id_registro, campo, valor_anterior, valor_nuevo, usuario)
        VALUES ('contrato_renta', OLD.id_contrato_renta, 'fecha_fin_real',
                OLD.fecha_fin_real, NEW.fecha_fin_real, CURRENT_USER());
    END IF;

    IF (OLD.monto_devuelto IS NULL AND NEW.monto_devuelto IS NOT NULL)
    OR (OLD.monto_devuelto != NEW.monto_devuelto) THEN
        INSERT INTO bitacora (tabla_afectada, id_registro, campo, valor_anterior, valor_nuevo, usuario)
        VALUES ('contrato_renta', OLD.id_contrato_renta, 'monto_devuelto',
                OLD.monto_devuelto, NEW.monto_devuelto, CURRENT_USER());
    END IF;

END$$

-- ============================================
-- TRIGGER PARA departamento
-- ============================================

CREATE TRIGGER trg_bitacora_departamento
AFTER UPDATE ON departamento
FOR EACH ROW
BEGIN

    IF OLD.estado_depto != NEW.estado_depto THEN
        INSERT INTO bitacora (tabla_afectada, id_registro, campo, valor_anterior, valor_nuevo, usuario)
        VALUES ('departamento', OLD.id_departamento, 'estado_depto',
                OLD.estado_depto, NEW.estado_depto, CURRENT_USER());
    END IF;

END$$

DELIMITER ;