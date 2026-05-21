-- Triggers para actualizar automaticamente estado del departamento 

USE gestion_inmobiliaria;

DELIMITER $$

-- Trigger 1: al crear un contrato de renta
-- el departamento pasa automaticamente a 'rentado'
CREATE TRIGGER trg_depto_rentado
AFTER INSERT ON contrato_renta
FOR EACH ROW
BEGIN
    IF NEW.fecha_fin_programada >= CURDATE() THEN

        -- Cambiar estado del departamento a rentado
        UPDATE departamento
        SET estado_depto = 'rentado'
        WHERE id_departamento = NEW.id_departamento;

        -- Eliminar alerta de depto sin rentar si existia
        DELETE FROM alerta_depto_sin_rentar
        WHERE id_departamento = NEW.id_departamento;

    END IF;
END$$

-- Trigger 2: al actualizar fecha_fin_real en contrato_renta
-- el departamento pasa automaticamente a 'promocion'
CREATE TRIGGER trg_depto_disponible
AFTER UPDATE ON contrato_renta
FOR EACH ROW
BEGIN
    IF OLD.fecha_fin_real IS NULL AND NEW.fecha_fin_real IS NOT NULL THEN
        UPDATE departamento
        SET estado_depto = 'promocion'
        WHERE id_departamento = NEW.id_departamento;
    END IF;
END$$

CREATE TRIGGER trg_alerta_mantenimiento
AFTER INSERT ON gasto_departamento
FOR EACH ROW
BEGIN
    -- Solo actúa si el gasto es de categoría 'mantenimiento'
    IF NEW.categoria = 'mantenimiento' THEN

        -- Busca si hay un contrato activo para ese departamento
        -- y si con este nuevo gasto ya se superan los 3
        INSERT INTO alerta_mantenimiento_excesivo
            (id_departamento, id_contrato_renta, total_mantenimientos)
        SELECT
            cr.id_departamento,
            cr.id_contrato_renta,
            COUNT(gd.id_gasto_departamento) AS total_mantenimientos
        FROM contrato_renta cr
        JOIN gasto_departamento gd
            ON  gd.id_departamento = cr.id_departamento
            AND gd.categoria       = 'mantenimiento'
            AND gd.fecha_gasto    >= cr.fecha_inicio
            AND (cr.fecha_fin_real IS NULL OR gd.fecha_gasto <= cr.fecha_fin_real)
        WHERE cr.id_departamento    = NEW.id_departamento
          AND cr.fecha_fin_real       IS NULL
          AND cr.fecha_fin_programada >= CURDATE()
        GROUP BY cr.id_contrato_renta, cr.id_departamento
        HAVING COUNT(gd.id_gasto_departamento) > 3
        ON DUPLICATE KEY UPDATE
            total_mantenimientos = VALUES(total_mantenimientos),
            fecha_generada       = NOW();

    END IF;
END$$

DELIMITER ;