-- Creacion del esquema y las tablas principales 
CREATE DATABASE gestion_inmobiliaria;

USE gestion_inmobiliaria;

CREATE TABLE propiedad (
    id_propiedad   INT          NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(40) NOT NULL UNIQUE,
    calle          VARCHAR(50) NOT NULL,
    colonia        VARCHAR(50) NOT NULL,
    ciudad         VARCHAR(80)  NOT NULL,
    estado         VARCHAR(25)  NOT NULL,
    codigo_postal  CHAR(5)      NOT NULL,
    fecha_registro DATETIME     DEFAULT NOW(),
    PRIMARY KEY (id_propiedad),
    CONSTRAINT chk_cp CHECK (codigo_postal REGEXP '^[0-9]{5}$') -- Debe ser un numero de 5 digitos
);

CREATE TABLE departamento (
    id_departamento INT         NOT NULL AUTO_INCREMENT,
    id_propiedad    INT         NOT NULL,
    numero          VARCHAR(5)  NOT NULL,
    num_recamaras   TINYINT     NOT NULL,
    num_banos       TINYINT     NOT NULL,
    estado_depto    ENUM('rentado','promocion','mantenimiento')
                    NOT NULL DEFAULT 'promocion',
	fecha_registro DATETIME DEFAULT NOW(),
    PRIMARY KEY (id_departamento),
    UNIQUE (id_propiedad, numero),
    CONSTRAINT fk_depto_propiedad FOREIGN KEY (id_propiedad)
        REFERENCES propiedad(id_propiedad)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE contrato_luz (
    id_contrato_luz  INT         NOT NULL AUTO_INCREMENT,
    id_departamento  INT         NOT NULL UNIQUE,
    numero_contrato  VARCHAR(20) NOT NULL UNIQUE,
    PRIMARY KEY (id_contrato_luz),
    CONSTRAINT fk_cluz_depto FOREIGN KEY (id_departamento)
        REFERENCES departamento(id_departamento)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE contrato_agua (
    id_contrato_agua INT         NOT NULL AUTO_INCREMENT,
    id_departamento  INT         NOT NULL UNIQUE,
    numero_contrato  VARCHAR(20) NOT NULL UNIQUE,
    PRIMARY KEY (id_contrato_agua),
    CONSTRAINT fk_cagua_depto FOREIGN KEY (id_departamento)
        REFERENCES departamento(id_departamento)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE recibo_luz (
    id_recibo_luz        INT          NOT NULL AUTO_INCREMENT,
    id_contrato_luz      INT          NOT NULL,
    monto                DECIMAL(8,2) NOT NULL,
    fecha_inicio_periodo DATE         NOT NULL,
    fecha_fin_periodo    DATE         NOT NULL,
    fecha_limite_pago    DATE         NOT NULL,
    pagado               BOOLEAN      DEFAULT FALSE,
    fecha_registro       DATETIME     DEFAULT NOW(),
    PRIMARY KEY (id_recibo_luz),
    CONSTRAINT fk_rluz_contrato FOREIGN KEY (id_contrato_luz)
        REFERENCES contrato_luz(id_contrato_luz)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE recibo_agua (
    id_recibo_agua       INT          NOT NULL AUTO_INCREMENT,
    id_contrato_agua     INT          NOT NULL,
    monto                DECIMAL(8,2) NOT NULL,
    fecha_inicio_periodo DATE         NOT NULL,
    fecha_fin_periodo    DATE         NOT NULL,
    fecha_limite_pago    DATE         NOT NULL,
    pagado               BOOLEAN      DEFAULT FALSE,
    fecha_registro       DATETIME     DEFAULT NOW(),
    PRIMARY KEY (id_recibo_agua),
    CONSTRAINT fk_ragua_contrato FOREIGN KEY (id_contrato_agua)
        REFERENCES contrato_agua(id_contrato_agua)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE cliente (
    id_cliente       INT         NOT NULL AUTO_INCREMENT,
    nombre           VARCHAR(40) NOT NULL,
    segundo_nombre   VARCHAR(40),
    apellido_paterno VARCHAR(40) NOT NULL,
    apellido_materno VARCHAR(40),
    fecha_nacimiento DATE        NOT NULL,
    genero           ENUM('M','F'),
    telefono         CHAR(10)    NOT NULL UNIQUE,
    fecha_registro   DATETIME    DEFAULT NOW(),
    PRIMARY KEY (id_cliente),
    CONSTRAINT chk_tel CHECK (telefono REGEXP '^[0-9]{10}$')
);

CREATE TABLE contrato_renta (
    id_contrato_renta    INT          NOT NULL AUTO_INCREMENT,
    id_departamento      INT          NOT NULL,
    id_cliente           INT          NOT NULL,
    renta_mensual        DECIMAL(8,2) NOT NULL,
    monto_deposito    	 DECIMAL(8,2) NOT NULL,
    fecha_inicio         DATE         NOT NULL,
    fecha_fin_programada DATE         NOT NULL,
    fecha_fin_real       DATE,
    monto_devuelto       DECIMAL(8,2),
    fecha_registro DATETIME DEFAULT NOW(),
    PRIMARY KEY (id_contrato_renta),
    CONSTRAINT fk_cr_departamento FOREIGN KEY (id_departamento)
        REFERENCES departamento(id_departamento)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_cr_cliente FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE gasto_departamento (
    id_gasto_departamento INT          NOT NULL AUTO_INCREMENT,
    id_departamento       INT          NOT NULL,
    categoria             ENUM('reparacion','servicio','mantenimiento','limpieza','otro') NOT NULL,
    monto                 DECIMAL(8,2) NOT NULL,
    fecha_gasto           DATE         NOT NULL,
    descripcion           TEXT,
    PRIMARY KEY (id_gasto_departamento),
    CONSTRAINT fk_gd_departamento FOREIGN KEY (id_departamento)
        REFERENCES departamento(id_departamento)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE gasto_propiedad (
    id_gasto_propiedad INT          NOT NULL AUTO_INCREMENT,
    id_propiedad       INT          NOT NULL,
    categoria          ENUM('predial','mantenimiento','limpieza','seguro','otro') NOT NULL,
    monto              DECIMAL(8,2) NOT NULL,
    fecha_gasto        DATE         NOT NULL,
    descripcion        TEXT,
    PRIMARY KEY (id_gasto_propiedad),
    CONSTRAINT fk_gp_propiedad FOREIGN KEY (id_propiedad)
        REFERENCES propiedad(id_propiedad)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE pago_renta (
    id_pago_renta     INT          NOT NULL AUTO_INCREMENT,
    id_contrato_renta INT          NOT NULL,
    monto             DECIMAL(8,2) NOT NULL,
    fecha_pago_real   DATE,
    PRIMARY KEY (id_pago_renta),
    CONSTRAINT fk_pr_contrato FOREIGN KEY (id_contrato_renta)
        REFERENCES contrato_renta(id_contrato_renta)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
