USE gestion_inmobiliaria;

-- ============================================
-- ROLES
-- ============================================

CREATE ROLE 'rol_admin';
CREATE ROLE 'rol_operador';
CREATE ROLE 'rol_lector';

-- ============================================
-- PERMISOS POR ROL
-- ============================================

-- Lector: solo SELECT en todo
GRANT SELECT ON gestion_inmobiliaria.* TO 'rol_lector';

-- Operador: SELECT en todo + operaciones del dia a dia
GRANT SELECT ON gestion_inmobiliaria.*                          TO 'rol_operador';
GRANT INSERT ON gestion_inmobiliaria.pago_renta                 TO 'rol_operador';
GRANT INSERT ON gestion_inmobiliaria.gasto_departamento         TO 'rol_operador';
GRANT INSERT ON gestion_inmobiliaria.gasto_propiedad            TO 'rol_operador';
GRANT INSERT ON gestion_inmobiliaria.recibo_luz                 TO 'rol_operador';
GRANT INSERT ON gestion_inmobiliaria.recibo_agua                TO 'rol_operador';
GRANT UPDATE ON gestion_inmobiliaria.recibo_luz                 TO 'rol_operador';
GRANT UPDATE ON gestion_inmobiliaria.recibo_agua                TO 'rol_operador';
GRANT EXECUTE ON PROCEDURE gestion_inmobiliaria.sp_registrar_pago_renta          TO 'rol_operador';
GRANT EXECUTE ON PROCEDURE gestion_inmobiliaria.sp_registrar_gasto_departamento  TO 'rol_operador';
GRANT EXECUTE ON PROCEDURE gestion_inmobiliaria.sp_registrar_gasto_propiedad     TO 'rol_operador';
GRANT EXECUTE ON PROCEDURE gestion_inmobiliaria.sp_pagar_recibo_luz              TO 'rol_operador';
GRANT EXECUTE ON PROCEDURE gestion_inmobiliaria.sp_pagar_recibo_agua             TO 'rol_operador';

-- Admin: acceso total
GRANT ALL PRIVILEGES ON gestion_inmobiliaria.* TO 'rol_admin';

-- ============================================
-- USUARIOS DE EJEMPLO
-- ============================================

-- Cambia las contrasenas antes de usar en produccion
CREATE USER 'admin_principal'@'localhost' IDENTIFIED BY 'Admin#2024!';
CREATE USER 'operador_01'@'localhost'    IDENTIFIED BY 'Oper#2024!';
CREATE USER 'lector_01'@'localhost'      IDENTIFIED BY 'Lect#2024!';

-- Asignar roles a usuarios
GRANT 'rol_admin'    TO 'admin_principal'@'localhost';
GRANT 'rol_operador' TO 'operador_01'@'localhost';
GRANT 'rol_lector'   TO 'lector_01'@'localhost';

-- Activar roles por defecto al conectarse
SET DEFAULT ROLE ALL TO
    'admin_principal'@'localhost',
    'operador_01'@'localhost',
    'lector_01'@'localhost';

FLUSH PRIVILEGES;