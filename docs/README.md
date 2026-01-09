# 📚 Documentación del Proyecto

Bienvenido a la documentación completa de la aplicación. Aquí encontrarás toda la información necesaria para entender, configurar, desarrollar y mantener el proyecto.

## 📑 Índice de Documentos

### Configuración y Setup
- **[google-oauth-setup.md](./google-oauth-setup.md)** - Guía para configurar Google OAuth en la aplicación

### Base de Datos
- **[database_structure.md](./database_structure.md)** - Estructura completa de las tablas SQL y sus relaciones

### API y Backend
- **[api-endpoints.md](./api-endpoints.md)** - Referencia completa de todos los endpoints del API

### Autenticación
- **[authentication-flows.md](./authentication-flows.md)** - Documentación detallada de todos los flujos de autenticación:
  - Registro de usuario
  - Login (Email/Password y Google OAuth)
  - Verificación de email
  - Olvidé mi contraseña
  - Cambio de email

## 🚀 Inicio Rápido

### Requisitos Previos
- Docker y Docker Compose
- Node.js 20+ (para desarrollo local)
- PostgreSQL (incluido en Docker)
- MinIO (incluido en Docker)

### Configuración Inicial

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd Interfaz
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

3. **Levantar contenedores**
```bash
docker-compose up --build -d
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:8090
- Backend API: http://localhost:3001
- Admin por defecto: `jock.alcantara@gmail.com` / `admin123`

## 🏗️ Arquitectura

### Stack Tecnológico

**Frontend:**
- React 18
- React Router DOM
- TailwindCSS
- Vite

**Backend:**
- Node.js 20
- Express
- PostgreSQL (pg)
- JWT Authentication
- bcrypt
- Nodemailer
- Google OAuth

**Almacenamiento:**
- MinIO (S3-compatible)

**Infraestructura:**
- Docker & Docker Compose
- Nginx (frontend)

### Estructura del Proyecto

```
Interfaz/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración (DB, MinIO)
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── db/              # Scripts SQL y schema
│   │   ├── middleware/      # Auth, validaciones
│   │   ├── routes/          # Rutas del API
│   │   └── services/        # Servicios (Email, etc.)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── context/         # Contextos de React
│   │   ├── layouts/         # Layouts (Admin, User)
│   │   ├── pages/           # Páginas de la app
│   │   └── App.jsx
│   └── Dockerfile
├── docs/                    # Documentación
├── docker-compose.yml
└── .env
```

## 🔐 Características de Seguridad

### Autenticación
- ✅ JWT Tokens
- ✅ bcrypt password hashing (10 rounds)
- ✅ Google OAuth 2.0
- ✅ Email verification
- ✅ Password reset con tokens seguros
- ✅ Email change con verificación doble

### Tokens de Seguridad
- Generados con `crypto.randomBytes(32)` (64 caracteres)
- Únicos en base de datos
- Expiración de 1 hora
- Un solo uso (campo `used`)

### Validaciones
- Email: formato válido y único
- Password: mínimo 8 caracteres, mayúsculas, minúsculas y números
- Sanitización de inputs
- CORS configurado

## 📧 Sistema de Emails

### Configuración SMTP
Configurable desde el panel de admin o archivo `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

### Plantillas Disponibles
1. **Email Verification** - Verificación de cuenta nueva
2. **Password Reset** - Restablecimiento de contraseña
3. **Email Change** - Confirmación de cambio de email

Todas las plantillas son **personalizables** desde el panel de administración.

### Variables en Plantillas
- `%APP_NAME%` - Nombre de la aplicación
- `%DISPLAY_NAME%` - Nombre del usuario
- `%LINK%` - Enlace de acción
- `%NEW_EMAIL%` - Nuevo email (solo en cambio de email)

## 🎨 Panel de Administración

### Funcionalidades
- ✅ Gestión de usuarios (crear, editar, eliminar)
- ✅ Configuración de branding (nombre, logo, favicon)
- ✅ Configuración SMTP
- ✅ Configuración Google OAuth
- ✅ Edición de plantillas de email
- ✅ Perfil personal y cambio de email

### Acceso
1. Login con cuenta de admin
2. Navegación: `/admin/*`
3. Rutas protegidas con middleware `adminAuth`

## 🗄️ Base de Datos

### Tablas Principales
1. **users** - Usuarios del sistema
2. **email_templates** - Plantillas de correo
3. **app_settings** - Configuración dinámica
4. **password_reset_tokens** - Tokens de reset de password
5. **email_change_tokens** - Tokens de cambio de email

Ver [database_structure.md](./database_structure.md) para detalles completos.

### Migraciones
Las migraciones se ejecutan **automáticamente** al iniciar el backend si las tablas no existen.

## 🔄 Flujos de Usuario

### Nuevo Usuario
1. Registro en `/`
2. Recibe email de verificación
3. Click en enlace → cuenta verificada
4. Login → acceso a dashboard

### Usuario Existente
1. Login en `/`
2. Acceso según rol:
   - Admin → `/admin/*`
   - User → `/dashboard`

### Olvidé mi Contraseña
1. Click "¿Olvidaste tu contraseña?" en login
2. Ingresa email → recibe link
3. Click en link → reset password
4. Login con nueva contraseña

### Cambio de Email
1. Perfil → "Cambiar Email"
2. Ingresa nuevo email
3. Recibe email en NUEVA dirección
4. Click en link → email actualizado
5. Logout automático → login con nuevo email

## 🧪 Testing

### Manual Testing
Ver guía completa en el brain del proyecto para testing paso a paso.

### Automated Testing
**Estado:** No implementado  
**Recomendado:** Jest (backend) + Vitest (frontend)

## 📊 Monitoreo y Logs

### Ver Logs del Backend
```bash
docker-compose logs -f api
```

### Ver Logs del Frontend
```bash
docker-compose logs -f web
```

### Ver Estado de Containers
```bash
docker-compose ps
```

## 🔧 Desarrollo

### Ambiente de Desarrollo

1. **Instalar dependencias**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

2. **Ejecutar en desarrollo**
```bash
# Backend (modo watch)
cd backend
npm run dev

# Frontend (con hot reload)
cd frontend
npm run dev
```

### Estructura de Código

**Backend:**
- `controllers/` - Lógica de negocio (authController, userController)
- `routes/` - Definición de endpoints
- `middleware/` - auth, adminAuth, validaciones
- `services/` - emailService, etc.

**Frontend:**
- `pages/` - Páginas completas
- `components/` - Componentes reutilizables
- `context/` - AuthContext, GoogleConfigContext
- `layouts/` - AdminLayout, UserLayout

## 🌍 Despliegue a Producción

### Variables de Entorno Críticas

```env
NODE_ENV=production
FRONTEND_URL=https://tudominio.com
JWT_SECRET=<genera-una-clave-segura>
DB_PASSWORD=<contraseña-segura>
MINIO_ACCESS_KEY=<key-segura>
MINIO_SECRET_KEY=<secret-segura>
```

### Checklist de Producción
- [ ] Cambiar `JWT_SECRET` a uno seguro
- [ ] Configurar CORS a dominio específico
- [ ] Usar HTTPS (configurar Traefik/nginx)
- [ ] Configurar backups de base de datos
- [ ] Implementar rate limiting
- [ ] Configurar monitoreo (logs, métricas)
- [ ] Configurar certificados SSL

## 📚 Recursos Adicionales

### Documentación Externa
- [React](https://react.dev/)
- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Docker](https://docs.docker.com/)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)

### Comandos Útiles

```bash
# Rebuild containers
docker-compose up --build -d

# Parar containers
docker-compose down

# Ver base de datos
docker-compose exec -T api node test-db.js

# Limpiar todo (CUIDADO: borra datos)
docker-compose down -v
```

## 🐛 Troubleshooting

### Problema: Emails no llegan
**Solución:**
1. Verificar configuración SMTP
2. Gmail: usar "Contraseña de aplicación"
3. Ver logs: `docker-compose logs api | grep -i email`

### Problema: Error de conexión a BD
**Solución:**
1. Verificar que container PostgreSQL esté corriendo
2. Verificar credenciales en `.env`
3. Reiniciar containers: `docker-compose restart`

### Problema: Frontend muestra pantalla en blanco
**Solución:**
1. Limpiar caché del navegador
2. Ver logs: `docker-compose logs web`
3. Rebuild frontend: `docker-compose up --build web`

## 🤝 Contribución

Para contribuir al proyecto:
1. Crear feature branch
2. Hacer cambios
3. Actualizar documentación si es necesario
4. Crear pull request

## 📝 Changelog

### v1.1 (2026-01-08)
- ✅ Implementado flujo "Olvidé mi Contraseña"
- ✅ Implementado flujo "Cambio de Email"
- ✅ Añadidas tablas `password_reset_tokens` y `email_change_tokens`
- ✅ Actualizada documentación completa
- ✅ Auditoría de seguridad completada

### v1.0 (2026-01-06)
- ✅ Sistema base de autenticación
- ✅ Panel de administración
- ✅ Gestión de usuarios
- ✅ Configuración SMTP y OAuth
- ✅ Plantillas de email editables

## 📄 Licencia

[Especificar licencia del proyecto]

---

**Última Actualización:** 2026-01-08  
**Versión:** 1.1  
**Mantenedor:** desarrollo@tuempresa.com
