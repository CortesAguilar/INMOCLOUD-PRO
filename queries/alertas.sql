USE gestion_inmobiliaria;

-- TABLAS QUE GUARDAN ALERTAS

CREATE TABLE alerta_recibo_luz (
    id_alerta_recibo_luz INT      NOT NULL AUTO_INCREMENT,
    id_recibo_luz        INT      NOT NULL UNIQUE,
    fecha_generada       DATETIME DEFAULT NOW(),
    PRIMARY KEY (id_alerta_recibo_luz),
    CONSTRAINT fk_arl FOREIGN KEY (id_recibo_luz)
        REFERENCES recibo_luz(id_recibo_luz)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE alerta_recibo_agua (
    id_alerta_recibo_agua INT      NOT NULL AUTO_INCREMENT,
    id_recibo_agua        INT      NOT NULL UNIQUE,
    fecha_generada        DATETIME DEFAULT NOW(),
    PRIMARY KEY (id_alerta_recibo_agua),
    CONSTRAINT fk_ara FOREIGN KEY (id_recibo_agua)
        REFERENCES recibo_agua(id_recibo_agua)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE alerta_contrato_por_vencer (
    id_alerta_contrato    INT      NOT NULL AUTO_INCREMENT,
    id_contrato_renta     INT      NOT NULL UNIQUE,
    fecha_generada        DATETIME DEFAULT NOW(),
    PRIMARY KEY (id_alerta_contrato),
    CONSTRAINT fk_acv FOREIGN KEY (id_contrato_renta)
        REFERENCES contrato_renta(id_contrato_renta)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE alerta_renta_sin_pagar (
    id_alerta_renta   INT      NOT NULL AUTO_INCREMENT,
    id_contrato_renta INT      NOT NULL UNIQUE,
    fecha_generada    DATETIME DEFAULT NOW(),
    PRIMARY KEY (id_alerta_renta),
    CONSTRAINT fk_ars FOREIGN KEY (id_contrato_renta)
        REFERENCES contrato_renta(id_contrato_renta)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE alerta_depto_sin_rentar (
    id_alerta_depto INT      NOT NULL AUTO_INCREMENT,
    id_departamento INT      NOT NULL UNIQUE,
    fecha_generada  DATETIME DEFAULT NOW(),
    PRIMARY KEY (id_alerta_depto),
    CONSTRAINT fk_ads FOREIGN KEY (id_departamento)
        REFERENCES departamento(id_departamento)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS alerta_mantenimiento_excesivo (
    id_alerta             INT      NOT NULL AUTO_INCREMENT,
    id_departamento       INT      NOT NULL,
    id_contrato_renta     INT      NOT NULL,
    total_mantenimientos  INT      NOT NULL,   -- cuántos gastos de mantenimiento hay
    fecha_generada        DATETIME DEFAULT NOW(),
    PRIMARY KEY (id_alerta),
    -- Una sola alerta activa por contrato (se actualiza si crece el contador)
    UNIQUE KEY uq_alerta_contrato (id_contrato_renta),
    CONSTRAINT fk_ame_depto    FOREIGN KEY (id_departamento)
        REFERENCES departamento(id_departamento)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ame_contrato FOREIGN KEY (id_contrato_renta)
        REFERENCES contrato_renta(id_contrato_renta)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Eventos
SET GLOBAL event_scheduler = ON;

CREATE EVENT evt_alerta_recibo_luz
ON SCHEDULE EVERY 1 DAY
DO
    INSERT INTO alerta_recibo_luz (id_recibo_luz)
    SELECT id_recibo_luz
    FROM recibo_luz
    WHERE pagado = FALSE
      AND fecha_limite_pago < CURDATE()
      AND id_recibo_luz NOT IN (
          SELECT id_recibo_luz FROM alerta_recibo_luz
      );

-- 2. Recibo de agua vencido sin pagar
CREATE EVENT evt_alerta_recibo_agua
ON SCHEDULE EVERY 1 DAY
DO
    INSERT INTO alerta_recibo_agua (id_recibo_agua)
    SELECT id_recibo_agua
    FROM recibo_agua
    WHERE pagado = FALSE
      AND fecha_limite_pago < CURDATE()
      AND id_recibo_agua NOT IN (
          SELECT id_recibo_agua FROM alerta_recibo_agua
      );

-- 3. Contrato próximo a vencer (60 días de anticipación)
CREATE EVENT evt_alerta_contrato_por_vencer
ON SCHEDULE EVERY 1 DAY
DO
    INSERT INTO alerta_contrato_por_vencer (id_contrato_renta)
    SELECT id_contrato_renta
    FROM contrato_renta
    WHERE fecha_fin_real IS NULL
      AND fecha_fin_programada BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 60 DAY)
      AND id_contrato_renta NOT IN (
          SELECT id_contrato_renta FROM alerta_contrato_por_vencer
      );

-- 4. Renta mensual sin pagar
CREATE EVENT evt_alerta_renta_sin_pagar
ON SCHEDULE EVERY 1 DAY
DO
    INSERT INTO alerta_renta_sin_pagar (id_contrato_renta)
    SELECT cr.id_contrato_renta
    FROM contrato_renta cr
    WHERE cr.fecha_fin_real IS NULL
      AND fn_tiene_pago_mes_actual(cr.id_contrato_renta) = FALSE
      AND CURDATE() >= DATE_ADD(
          DATE_ADD(cr.fecha_inicio,
              INTERVAL TIMESTAMPDIFF(MONTH, cr.fecha_inicio, CURDATE()) MONTH
          ), INTERVAL 5 DAY
      )
      AND cr.id_contrato_renta NOT IN (
          SELECT id_contrato_renta FROM alerta_renta_sin_pagar
      );

-- 5. Departamento sin rentar por más de 40 días

CREATE EVENT evt_alerta_depto_sin_rentar
ON SCHEDULE EVERY 1 DAY
DO
    INSERT INTO alerta_depto_sin_rentar (id_departamento)
    SELECT d.id_departamento
    FROM departamento d
    WHERE d.estado_depto != 'rentado'
      AND fn_dias_sin_rentar(d.id_departamento) > 40
      AND d.id_departamento NOT IN (
          SELECT id_departamento FROM alerta_depto_sin_rentar
      );
____________________________________________________________________

CREATE EVENT IF NOT EXISTS evt_alerta_mantenimiento_excesivo
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
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
    WHERE cr.fecha_fin_real       IS NULL
      AND cr.fecha_fin_programada >= CURDATE()
    GROUP BY cr.id_contrato_renta, cr.id_departamento
    HAVING COUNT(gd.id_gasto_departamento) > 3
    ON DUPLICATE KEY UPDATE
        total_mantenimientos = VALUES(total_mantenimientos),
        fecha_generada       = NOW();
