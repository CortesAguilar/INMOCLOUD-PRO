USE gestion_inmobiliaria;

-- Creacion de indices

      -- pago_renta
CREATE INDEX idx_pr_contrato    ON pago_renta      (id_contrato_renta);
CREATE INDEX idx_pr_fecha       ON pago_renta      (fecha_pago_real);

-- contrato_renta
CREATE INDEX idx_cr_departamento ON contrato_renta  (id_departamento);
CREATE INDEX idx_cr_cliente      ON contrato_renta  (id_cliente);

-- gasto_departamento
CREATE INDEX idx_gd_departamento ON gasto_departamento (id_departamento);
CREATE INDEX idx_gd_fecha        ON gasto_departamento (fecha_gasto);

-- gasto_propiedad
CREATE INDEX idx_gp_propiedad    ON gasto_propiedad (id_propiedad);
CREATE INDEX idx_gp_fecha        ON gasto_propiedad (fecha_gasto);

-- recibo_luz
CREATE INDEX idx_rl_contrato     ON recibo_luz      (id_contrato_luz);
CREATE INDEX idx_rl_fecha        ON recibo_luz      (fecha_limite_pago);

-- recibo_agua
CREATE INDEX idx_ra_contrato     ON recibo_agua     (id_contrato_agua);
CREATE INDEX idx_ra_fecha        ON recibo_agua     (fecha_limite_pago);

-- departamento
CREATE INDEX idx_d_propiedad     ON departamento    (id_propiedad);
CREATE INDEX idx_d_estado        ON departamento    (estado_depto);
      