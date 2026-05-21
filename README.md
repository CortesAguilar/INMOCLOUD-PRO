# 🏢 Sistema de Gestión Inmobiliaria

Aplicación web full-stack para la administración de propiedades de renta residencial. Permite gestionar propiedades, departamentos, contratos de arrendamiento, pagos, gastos, servicios y alertas operativas desde una sola interfaz.

---

## ✨ Características principales

- **Propiedades y departamentos** — Alta, edición y seguimiento de estado (rentado, en promoción, mantenimiento)
- **Contratos de arrendamiento** — Creación, renovación y rescisión de contratos
- **Pagos de renta** — Registro de pagos con historial por contrato
- **Gastos** — Control de gastos por departamento y por propiedad con categorías
- **Servicios (luz y agua)** — Gestión de recibos, fechas límite y marcado de pago
- **Alertas operativas** — Notificaciones automáticas de recibos vencidos y contratos próximos a vencer
- **Clientes** — Directorio con historial completo de contratos y estadísticas de pago
- **Finanzas** — Dashboard con KPIs: ingresos, gastos, saldo neto, flujo mensual y rendimiento por propiedad
- **Bitácora** — Registro de actividad del sistema
- **Roles de acceso** — Admin, Operador y Lector

---

## 🛠 Stack tecnológico

### Frontend
| Tecnología | Uso |
|---|---|
| React 18 + Vite | Framework y bundler |
| Axios | Llamadas HTTP a la API |
| Estilos inline (JS) | Sistema de diseño propio sin framework UI |

### Backend
| Tecnología | Uso |
|---|---|
| FastAPI (Python) | API REST |
| PyMySQL | Conexión a MySQL |
| python-dotenv | Variables de entorno |
| Uvicorn | Servidor ASGI |

### Base de datos
| Tecnología | Uso |
|---|---|
| MySQL | Motor de base de datos |
| Stored Procedures | Lógica de negocio (pagos, rescisiones, renovaciones) |
| Triggers | Automatización (generación de alertas, actualización de estados) |
| Vistas | Consultas reutilizables (contratos activos, deptos sin rentar) |

---

## 📁 Estructura del proyecto

```
proyecto_gestion/
├── backend/
│   ├── main.py              # API REST — todos los endpoints
│   ├── requirements.txt     # Dependencias Python
│   └── .env                 # Variables de entorno (no incluido en el repo)
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── api.js           # Instancia Axios centralizada
        ├── App.jsx
        ├── pages/           # Vistas principales
        │   ├── Dashboard.jsx
        │   ├── Propiedades.jsx
        │   ├── Clientes.jsx
        │   ├── Finanzas.jsx
        │   ├── Alertas.jsx
        │   └── Bitacora.jsx
        ├── components/
        │   └── propiedades/ # Modales y componentes de propiedades/deptos
        ├── hooks/
        │   └── usePropiedades.js
        └── styles/
            └── propiedades.js
```

---

## 🚀 Instalación local

### Prerrequisitos
- Node.js 18+
- Python 3.10+
- MySQL 8+

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/proyecto-gestion.git
cd proyecto-gestion
```

### 2. Base de datos

Crea la base de datos en MySQL y ejecuta los scripts en este orden:

```
1. tablas principales.sql
2. funciones.sql
3. procedimientos almacenados.sql
4. triggers.sql
5. vistas.sql
6. roles y usuarios.sql
7. transacciones.sql
```

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Crea el archivo `.env` en la carpeta `backend/`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=gestion_inmobiliaria
```

Inicia el servidor:

```bash
uvicorn main:app --reload
```

La API quedará disponible en `http://127.0.0.1:8000`.  
Documentación interactiva: `http://127.0.0.1:8000/docs`

### 4. Frontend

```bash
cd frontend
npm install
```

Crea el archivo `.env` en la carpeta `frontend/`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

---

## 📡 Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/departamentos` | Lista todos los departamentos |
| GET | `/contratos` | Contratos activos |
| POST | `/contratos/{id}/renovar` | Renovar contrato |
| POST | `/contratos/{id}/rescindir` | Rescindir contrato |
| POST | `/pagos/renta` | Registrar pago de renta |
| GET | `/recibos/pendientes` | Recibos de luz y agua sin pagar |
| POST | `/recibos/luz/{id}/pagar` | Marcar recibo de luz como pagado |
| POST | `/recibos/agua/{id}/pagar` | Marcar recibo de agua como pagado |
| GET | `/alertas` | Alertas operativas activas |
| GET | `/finanzas/resumen` | KPIs financieros globales |
| GET | `/finanzas/flujo-mensual` | Ingresos y gastos por mes |
| GET | `/finanzas/por-propiedad` | Rendimiento por propiedad |
| GET | `/clientes/{id}/perfil` | Perfil completo de un cliente |

La documentación completa y pruebas interactivas están disponibles en `/docs` (Swagger UI).

---

## 📄 Licencia

Este proyecto fue desarrollado con fines académicos en el Instituto Tecnológico de Tijuana (ITT) — TecNM.
