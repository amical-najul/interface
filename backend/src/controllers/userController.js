const pool = require('../config/db');
const bcrypt = require('bcrypt');
const minioClient = require('../config/minio');
const sharp = require('sharp');

// Image compression settings
const IMAGE_MAX_WIDTH = 400;
const IMAGE_QUALITY = 80;

// Admin: Get all users with Pagination & Filtering
exports.getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role, active } = req.query;

        const offset = (page - 1) * limit;
        const params = [];
        let paramIdx = 1;

        // Build base query
        let query = 'SELECT id, email, role, is_verified, active, name, avatar_url, created_at FROM users WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';

        // Add Search Filter
        if (search) {
            const searchClause = ` AND (name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`;
            query += searchClause;
            countQuery += searchClause;
            params.push(`%${search}%`);
            paramIdx++;
        }

        // Add Role Filter
        if (role && role !== 'all') {
            const roleClause = ` AND role = $${paramIdx}`;
            query += roleClause;
            countQuery += roleClause;
            params.push(role);
            paramIdx++;
        }

        // Add Active Filter
        if (active && active !== 'all') {
            const activeClause = ` AND active = $${paramIdx}`;
            query += activeClause;
            countQuery += activeClause;
            params.push(active === 'true');
            paramIdx++;
        }

        // Add Pagination
        query += ` ORDER BY id ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;

        // Execute queries
        const totalResult = await pool.query(countQuery, params); // Params for count are subset, but PG ignores extra params if strictly positional? No, wait. 
        // FIX: The params array works for both if the index matches, but limit/offset are extra. 
        // Correction: Need separate params array or slice for count query? 
        // PG driver doesn't support named parameters easily. 
        // Simplest strategy: Execute Count Query FIRST with its own params.

        const countParams = [...params]; // Copy params before adding limit/offset
        const totalRows = await pool.query(countQuery, countParams);
        const total = parseInt(totalRows.rows[0].count);

        params.push(limit);
        params.push(offset);

        const result = await pool.query(query, params);

        res.json({
            data: result.rows,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

// Admin: Create User
exports.createUser = async (req, res) => {
    const { email, password, role, name } = req.body;
    try {
        // Check existence
        const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) return res.status(400).json({ message: 'El usuario ya existe' });

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);

        // Created users by admin are automatically verified
        const newUser = await pool.query(
            "INSERT INTO users (email, password_hash, role, name, is_verified, active) VALUES ($1, $2, $3, $4, TRUE, TRUE) RETURNING id, email, role, name, active",
            [email, hash, role || 'user', name]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creando usuario' });
    }
};

// Admin: Update User
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, role, active, password, name } = req.body;

    try {
        // Build query dynamically
        let query = "UPDATE users SET email=$1, role=$2, active=$3, name=$4";
        let params = [email, role, active, name];
        let idx = 5;

        // If password provided, hash and update
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            query += `, password_hash=$${idx}`;
            params.push(hash);
            idx++;
        }

        query += ` WHERE id=$${idx} RETURNING id, email, role, active, name`;
        params.push(id);

        const result = await pool.query(query, params);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error actualizando usuario' });
    }
};

// Admin: Delete User
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'Usuario eliminado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error eliminando usuario' });
    }
};

// Profile: Update Me
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, email, password } = req.body;

    try {
        let query = "UPDATE users SET name=$1, email=$2";
        let params = [name, email];
        let idx = 3;

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            query += `, password_hash=$${idx}`;
            params.push(hash);
            idx++;
        }

        query += ` WHERE id=$${idx} RETURNING id, email, name, role, avatar_url`;
        params.push(userId);

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error actualizando perfil' });
    }
};

// Avatar Upload with Image Compression (MinIO Implementation)
exports.uploadAvatar = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No se subió imagen' });

    try {
        const bucketName = process.env.MINIO_BUCKET_NAME;
        if (!bucketName) {
            throw new Error('MINIO_BUCKET_NAME not configured');
        }

        // Compress and resize image using Sharp
        const compressedBuffer = await sharp(req.file.buffer)
            .resize(IMAGE_MAX_WIDTH, IMAGE_MAX_WIDTH, {
                fit: 'cover',
                withoutEnlargement: true
            })
            .webp({ quality: IMAGE_QUALITY })
            .toBuffer();

        const objectName = `avatars/${req.user.id}-${Date.now()}.webp`;

        // Ensure bucket exists
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) await minioClient.makeBucket(bucketName, 'us-east-1');

        // [OPTIMIZATION] Delete old avatar if exists
        try {
            const currentUser = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
            const oldAvatarUrl = currentUser.rows[0]?.avatar_url;

            if (oldAvatarUrl) {
                const urlParts = oldAvatarUrl.split('/');
                const oldObjectName = `avatars/${urlParts[urlParts.length - 1]}`;
                await minioClient.removeObject(bucketName, oldObjectName);
                console.log(`Deleted old avatar: ${oldObjectName}`);
            }
        } catch (cleanupErr) {
            console.warn('Failed to cleanup old avatar:', cleanupErr.message);
            // Continue with upload even if cleanup fails
        }

        await minioClient.putObject(bucketName, objectName, compressedBuffer, {
            'Content-Type': 'image/webp'
        });

        // Construct browser-accessible URL
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
        // Use MINIO_PUBLIC_ENDPOINT if set, otherwise fall back to MINIO_ENDPOINT (for external services)
        const publicEndpoint = (process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT || 'localhost')
            .replace('http://', '')
            .replace('https://', '');
        const port = process.env.MINIO_PORT || '9000';
        const url = `${protocol}://${publicEndpoint}:${port}/${bucketName}/${objectName}`;

        console.log(`Avatar uploaded: ${url}`); // Debug log

        await pool.query('UPDATE users SET avatar_url=$1 WHERE id=$2', [url, req.user.id]);

        res.json({ avatar_url: url });

    } catch (err) {
        console.error('Error subiendo avatar:', err);
        res.status(500).json({ message: 'Error subiendo avatar', error: err.message });
    }
};

// Delete Avatar
exports.deleteAvatar = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get current avatar URL
        const userResult = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
        const avatarUrl = userResult.rows[0]?.avatar_url;

        if (avatarUrl) {
            // Try to delete from MinIO
            try {
                const bucketName = process.env.MINIO_BUCKET_NAME;
                const urlParts = avatarUrl.split('/');
                const objectName = `avatars/${urlParts[urlParts.length - 1]}`;
                await minioClient.removeObject(bucketName, objectName);
            } catch (minioErr) {
                console.warn('Could not delete avatar from MinIO:', minioErr.message);
            }
        }

        // Clear avatar_url in database
        await pool.query('UPDATE users SET avatar_url = NULL WHERE id = $1', [userId]);

        res.json({ message: 'Avatar eliminado', avatar_url: null });
    } catch (err) {
        console.error('Error eliminando avatar:', err);
        res.status(500).json({ message: 'Error eliminando avatar' });
    }
};

// ==========================================
// EMAIL CHANGE FLOW
// ==========================================

const crypto = require('crypto');
const emailService = require('../services/emailService');

/**
 * Request Email Change
 * POST /api/users/change-email
 */
exports.requestEmailChange = async (req, res) => {
    const { newEmail } = req.body;
    const userId = req.user.id;

    try {
        // Validar email
        if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            return res.status(400).json({ message: 'Email inválido' });
        }

        // Verificar que el nuevo email no esté en uso
        const emailCheck = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [newEmail]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'El email ya está en uso' });
        }

        // Obtener usuario actual
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        // Generar token seguro
        const changeToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hora

        // Guardar token en BD
        await pool.query(
            `INSERT INTO email_change_tokens (user_id, new_email, token, expires_at) 
             VALUES ($1, $2, $3, $4)`,
            [userId, newEmail, changeToken, expiresAt]
        );

        // Build confirmation link
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8090';
        const confirmLink = `${baseUrl}/verify-email-change?token=${changeToken}`;

        // Send email to NEW email address
        await emailService.sendAuthEmail('email_change',
            { email: newEmail, name: user.name || user.email.split('@')[0] },
            { link: confirmLink, newEmail: newEmail }
        );

        res.json({
            message: `Se ha enviado un correo de confirmación a ${newEmail}`
        });

    } catch (err) {
        console.error('Request email change error:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

/**
 * Verify and Confirm Email Change
 * POST /api/users/verify-email-change
 */
exports.verifyEmailChange = async (req, res) => {
    const { token } = req.body;

    try {
        // Buscar token válido
        const tokenResult = await pool.query(
            `SELECT * FROM email_change_tokens 
             WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
            [token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        const changeToken = tokenResult.rows[0];

        // Verificar nuevamente que el email no esté en uso
        const emailCheck = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [changeToken.new_email]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ message: 'El email ya está en uso' });
        }

        // Actualizar email del usuario
        await pool.query(
            'UPDATE users SET email = $1 WHERE id = $2',
            [changeToken.new_email, changeToken.user_id]
        );

        // Marcar token como usado
        await pool.query(
            'UPDATE email_change_tokens SET used = TRUE WHERE id = $1',
            [changeToken.id]
        );

        res.json({ message: 'Email actualizado exitosamente' });

    } catch (err) {
        console.error('Verify email change error:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
