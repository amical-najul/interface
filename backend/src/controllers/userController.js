const pool = require('../config/db');
const bcrypt = require('bcrypt');
const minioClient = require('../config/minio');
const sharp = require('sharp');

// Image compression settings
const IMAGE_MAX_WIDTH = 400;
const IMAGE_QUALITY = 80;

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role, is_verified, active, name, avatar_url, created_at FROM users ORDER BY id ASC');
        res.json(result.rows);
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

        await minioClient.putObject(bucketName, objectName, compressedBuffer, {
            'Content-Type': 'image/webp'
        });

        // Construct generic URL
        const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
        // USE PUBLIC ENDPOINT for the URL stored in DB (accessible by browser)
        // Fallback to localhost if not set (for local dev)
        const publicEndpoint = (process.env.MINIO_PUBLIC_ENDPOINT || 'localhost').replace('http://', '').replace('https://', '');
        const url = `${protocol}://${publicEndpoint}:${process.env.MINIO_PORT}/${bucketName}/${objectName}`;

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

