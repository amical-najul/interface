# Estructura de Base de Datos y Tablas SQL

Este documento sirve como referencia para ubicar y entender los scripts de creación de tablas de la base de datos del proyecto.

## Ubicación de los Scripts SQL

Todos los scripts SQL para la creación de tablas se encuentran en la siguiente ruta del proyecto:

`backend/src/db/tables/`

## Scripts Disponibles

En dicha carpeta encontrarás los siguientes archivos ordenados por ejecución:

### 1. Usuarios (`01_users.sql`)
- Crea la tabla `users`.
- Maneja la autenticación local y OAuth.
- Columnas clave: `email`, `password_hash`, `role`, `verification_token`.

### 2. Plantillas de Email (`02_email_templates.sql`)
- Crea la tabla `email_templates`.
- Almacena el contenido HTML y texto de los correos del sistema.
- Claves: `email_verification`, `password_reset`, `email_change`.

### 3. Configuraciones del Sistema (`03_app_settings.sql`)
- Crea la tabla `app_settings`.
- Almacena configuración dinámica key-value.
- Incluye:
    - **SMTP**: Servidor de correo.
    - **Branding**: Nombre y logo de la app.
    - **Google OAuth**: Credenciales de autenticación.

## Cómo Ejecutar

Puedes ejecutar estos scripts manualmente usando `psql` o cualquier cliente SQL conectándote a tu base de datos:

```bash
# Ejemplo desde la raíz del proyecto
psql -U tu_usuario -d tu_base_de_datos -f backend/src/db/tables/01_users.sql
```

O utilizar el archivo maestro `schema.sql` ubicado en `backend/src/db/schema.sql` que puede contener una versión consolidada.
