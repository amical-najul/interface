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

        let newHash = null;

        if (password && password.trim() !== "") {
            // SECURITY LIMITS (Skip for Admins)
            if (req.user.role !== 'admin') {
                // 1. Rate Limit Check (Max 3 changes in 24h)
                const recentChanges = await pool.query(
                    `SELECT COUNT(*) FROM password_history 
                     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 HOURS'`,
                    [userId]
                );

                if (parseInt(recentChanges.rows[0].count) >= 3) {
                    return res.status(429).json({ message: 'Límite de cambios de contraseña excedido (máx 3 en 24h).' });
                }

                // 2. History Check (Last 5 passwords)
                const history = await pool.query(
                    `SELECT password_hash FROM password_history 
                     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
                    [userId]
                );

                for (const entry of history.rows) {
                    const match = await bcrypt.compare(password, entry.password_hash);
                    if (match) {
                        return res.status(400).json({ message: 'Por seguridad, no puedes reutilizar ninguna de tus últimas 5 contraseñas.' });
                    }
                }
            }

            const salt = await bcrypt.genSalt(10);
            newHash = await bcrypt.hash(password, salt);
            query += `, password_hash=$${idx}`;
            params.push(newHash);
            idx++;
        }

        query += ` WHERE id=$${idx} RETURNING id, email, name, role, avatar_url`;
        params.push(userId);

        const result = await pool.query(query, params);

        // 3. Save to History
        if (newHash) {
            await pool.query(
                'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
                [userId, newHash]
            );
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error actualizando perfil' });
    }
};

// Avatar Upload with Image Compression (MinIO Implementation)
exports.uploadAvatar = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No se subió imagen' });

    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const bucketName = process.env.MINIO_BUCKET_NAME;
        if (!bucketName) throw new Error('MINIO_BUCKET_NAME not configured');

        // 1. Rate Limit Check (Max 2 changes in 24 hours) - SKIP FOR ADMIN
        if (req.user.role !== 'admin') {
            const recentUploads = await client.query(
                `SELECT COUNT(*) FROM avatar_history 
                 WHERE user_id = $1 
                 AND created_at > NOW() - INTERVAL '24 HOURS'`,
                [userId]
            );

            if (parseInt(recentUploads.rows[0].count) >= 2) {
                return res.status(429).json({ message: 'Límite de cambios de foto excedido (máx 2 en 24h).' });
            }
        }

        // Compress image with error handling
        let compressedBuffer;
        try {
            compressedBuffer = await sharp(req.file.buffer)
                .resize(IMAGE_MAX_WIDTH, IMAGE_MAX_WIDTH, { fit: 'cover', withoutEnlargement: true })
                .webp({ quality: IMAGE_QUALITY })
                .toBuffer();
        } catch (sharpError) {
            console.error('Sharp processing error:', sharpError.message);
            return res.status(400).json({
                message: 'La imagen no es válida o está corrupta. Intenta con otro archivo.',
                error: sharpError.message
            });
        }

        const objectName = `avatars/${userId}-${Date.now()}.webp`;

        // Ensure bucket exists
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) await minioClient.makeBucket(bucketName, 'us-east-1');

        // Upload to MinIO
        await minioClient.putObject(bucketName, objectName, compressedBuffer, { 'Content-Type': 'image/webp' });

        // Build URL
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
        const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || 'localhost';

        if (!publicEndpoint) throw new Error('MINIO_PUBLIC_ENDPOINT not configured');

        const port = process.env.MINIO_PORT;
        // If standard ports, don't show port in URL
        const portStr = (port === '80' || port === '443') ? '' : `:${port}`;
        const url = `${protocol}://${publicEndpoint}${portStr}/${bucketName}/${objectName}`;

        await client.query('BEGIN');

        // 2. Determine if "Original" (User has no history yet?)
        const historyCheck = await client.query('SELECT COUNT(*) FROM avatar_history WHERE user_id = $1', [userId]);
        const isOriginal = parseInt(historyCheck.rows[0].count) === 0;

        // 3. Save to History
        await client.query(
            `INSERT INTO avatar_history (user_id, avatar_url, is_original) 
             VALUES ($1, $2, $3)`,
            [userId, url, isOriginal]
        );

        // 4. Update Current Avatar
        await client.query('UPDATE users SET avatar_url=$1 WHERE id=$2', [url, userId]);

        // 5. Cleanup Policy: Keep "Original" + Last 5
        // Find photos that are NOT original and NOT in the last 5
        const cleanup = await client.query(
            `SELECT id, avatar_url FROM avatar_history 
             WHERE user_id = $1 
             AND is_original = FALSE
             AND id NOT IN (
                SELECT id FROM avatar_history 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 5
             )`,
            [userId]
        );

        for (const row of cleanup.rows) {
            // Delete from MinIO
            try {
                const urlParts = row.avatar_url.split('/');
                const oldObj = `avatars/${urlParts[urlParts.length - 1]}`;
                await minioClient.removeObject(bucketName, oldObj);
            } catch (ignored) { console.warn('MinIO delete failed', ignored.message); }

            // Delete from DB
            await client.query('DELETE FROM avatar_history WHERE id = $1', [row.id]);
        }

        await client.query('COMMIT');
        res.json({ avatar_url: url });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error subiendo avatar:', err);
        res.status(500).json({ message: 'Error subiendo avatar', error: err.message });
    } finally {
        client.release();
    }
};

// Delete Avatar
exports.deleteAvatar = async (req, res) => {
    try {
        console.log('Delete Avatar Request User:', req.user);

        let userId = req.user.id;

        // Ensure ID is integer to avoid PG 22P02 error
        if (typeof userId === 'string') {
            userId = parseInt(userId, 10);
        }

        if (!userId || isNaN(userId)) {
            console.error('Invalid User ID provided:', req.user.id);
            return res.status(400).json({ message: 'ID de usuario inválido.' });
        }

        console.log('Deleting avatar for UserID:', userId);

        // Solo eliminamos la referencia del perfil activo
        // El archivo físico y el registro en avatar_history se mantienen según política
        await pool.query('UPDATE users SET avatar_url = NULL WHERE id = $1', [userId]);

        res.json({ message: 'Avatar eliminado del perfil', avatar_url: null });
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
        const baseUrl = process.env.FRONTEND_URL;
        if (!baseUrl) throw new Error('FRONTEND_URL is not defined');
        const verifyLink = `${baseUrl}/verify-email-change?token=${changeToken}`;

        // Send email to NEW email address
        await emailService.sendAuthEmail('email_change',
            { email: newEmail, name: user.name || user.email.split('@')[0] },
            { link: verifyLink, newEmail: newEmail }
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

/**
 * Change Password (Authenticated)
 * PUT /api/users/change-password
 */
exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    try {
        // 1. Get user with current password hash
        const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

        const user = userResult.rows[0];

        // 2. Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
        }

        // 3. Security Checks (Reuse, etc.) - Simplified for now, reusing logic from updateProfile if needed
        // For now, just standard update
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        // 4. Update Password
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

        // 5. Add to history
        await pool.query(
            'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
            [userId, newHash]
        );

        res.json({ message: 'Contraseña actualizada correctamente' });

    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ message: 'Error al cambiar la contraseña' });
    }
};

/**
 * Delete Own Account (Authenticated)
 * DELETE /api/users/me
 */
exports.deleteOwnAccount = async (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;

    try {
        if (!password) {
            return res.status(400).json({ message: 'Se requiere contraseña para confirmar eliminación.' });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Get User Hash
            const userRes = await client.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
            if (userRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            // 2. Verify Password
            const valid = await bcrypt.compare(password, userRes.rows[0].password_hash);
            if (!valid) {
                await client.query('ROLLBACK');
                return res.status(401).json({ message: 'Contraseña incorrecta' });
            }

            // 3. Soft Delete
            await client.query(
                "UPDATE users SET status = 'deleted', active = false WHERE id = $1",
                [userId]
            );

            await client.query('COMMIT');
            res.json({ message: 'Cuenta eliminada correctamente.' });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Delete account error:', err);
        res.status(500).json({ message: 'Error al eliminar la cuenta' });
    }
};
