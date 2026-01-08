-- Tabla de Usuarios para la Aplicación Base
-- Esta tabla maneja la autenticación local y con Google.
-- Se incluye la columna 'role' para gestión de permisos (user/admin).

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    name VARCHAR(255),
    avatar_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices recomendados para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabla de Plantillas de Email para Autenticación
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    template_key VARCHAR(50) UNIQUE NOT NULL,
    sender_name VARCHAR(255),
    sender_email VARCHAR(255),
    reply_to VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Configuraciones del Sistema (incluyendo SMTP)
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
