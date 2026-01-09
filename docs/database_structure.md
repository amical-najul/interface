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
- Claves soportadas: 
  - `email_verification` - Verificación de cuenta nueva
  - `password_reset` - Restablecimiento de contraseña
  - `email_change` - Confirmación de cambio de email

### 3. Configuraciones del Sistema (`03_app_settings.sql`)
- Crea la tabla `app_settings`.
- Almacena configuración dinámica key-value.
- Incluye:
    - **SMTP**: Servidor de correo.
    - **Branding**: Nombre y logo de la app.
    - **Google OAuth**: Credenciales de autenticación.
    - **IA / LLM**: Configuración de modelos (Principal y Respaldo).

### 4. Tokens de Restablecimiento de Contraseña (`04_password_reset_tokens.sql`)
- Crea la tabla `password_reset_tokens`.
- Gestiona tokens temporales para el flujo de "Olvidé mi Contraseña".
- Características:
    - **Expiración**: 1 hora desde creación
    - **Un solo uso**: Campo `used` previene reutilización
    - **Seguridad**: Tokens criptográficamente seguros (64 caracteres)
- Columnas clave: `user_id`, `token`, `expires_at`, `used`

### 5. Tokens de Cambio de Email (`05_email_change_tokens.sql`)
- Crea la tabla `email_change_tokens`.
- Gestiona tokens temporales para cambio de dirección de email.
- Características:
    - **Verificación doble**: Email enviado a la NUEVA dirección
    - **Expiración**: 1 hora desde creación
    - **Un solo uso**: Campo `used` previene reutilización
    - **Seguridad**: Tokens únicos e irrepetibles
- Columnas clave: `user_id`, `new_email`, `token`, `expires_at`, `used`

## Relaciones Entre Tablas

```
users (1) ----< (N) password_reset_tokens
  └─ ON DELETE CASCADE

users (1) ----< (N) email_change_tokens
  └─ ON DELETE CASCADE
```

## Índices Creados

Para optimizar el rendimiento, las tablas incluyen los siguientes índices:

**password_reset_tokens:**
- `idx_password_reset_tokens_token` - Búsqueda rápida por token
- `idx_password_reset_tokens_user_id` - Búsqueda por usuario
- `idx_password_reset_tokens_expires_at` - Limpieza de tokens expirados

**email_change_tokens:**
- `idx_email_change_tokens_token` - Búsqueda rápida por token
- `idx_email_change_tokens_user_id` - Búsqueda por usuario
- `idx_email_change_tokens_expires_at` - Limpieza de tokens expirados

## Cómo Ejecutar

Puedes ejecutar estos scripts manualmente usando `psql` o cualquier cliente SQL conectándote a tu base de datos:

```bash
# Ejemplo desde la raíz del proyecto
psql -U tu_usuario -d tu_base_de_datos -f backend/src/db/tables/01_users.sql
psql -U tu_usuario -d tu_base_de_datos -f backend/src/db/tables/02_email_templates.sql
psql -U tu_usuario -d tu_base_de_datos -f backend/src/db/tables/03_app_settings.sql
psql -U tu_usuario -d tu_base_de_datos -f backend/src/db/tables/04_password_reset_tokens.sql
psql -U tu_usuario -d tu_base_de_datos -f backend/src/db/tables/05_email_change_tokens.sql
```

O utilizar el archivo maestro `schema.sql` ubicado en `backend/src/db/schema.sql` que contiene todas las tablas consolidadas.

## Migración Automática

El backend ejecuta automáticamente las migraciones al iniciar si las tablas no existen. Ver `backend/src/index.js` para más detalles sobre el proceso de inicialización.

## Última Actualización

**Fecha:** 2026-01-08  
**Versión:** 1.1  
**Cambios:** Añadidas tablas para password reset y email change tokens
