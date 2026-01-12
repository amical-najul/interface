const pool = require('../config/db');
const minioClient = require('../config/minio');

exports.cleanupOrphanedFiles = async (req, res) => {
    console.log('Starting Orphaned Files Cleanup...');
    const bucketName = process.env.MINIO_BUCKET_NAME;

    if (!bucketName) {
        return res.status(500).json({ message: 'MinIO bucket not configured' });
    }

    const client = await pool.connect();

    try {
        // 1. Get all valid Avatar URLs from Database (users + history)
        // We only care about the filename part, but storing full URL is fine too for matching
        const validFiles = new Set();

        const usersResult = await client.query('SELECT avatar_url FROM users WHERE avatar_url IS NOT NULL');
        const historyResult = await client.query('SELECT avatar_url FROM avatar_history');

        const extractKey = (url) => {
            if (!url) return null;
            const parts = url.split('/');
            // Assuming structure .../bucketName/avatars/filename
            // or just .../bucketName/filename depending on how it's saved. 
            // Based on userController: `avatars/${userId}-${Date.now()}.webp`
            // Let's just match the last part if it contains 'avatars/' or grab the object name.
            // Simpler: MinIO listObjects returns "avatars/filename.webp".
            // Our URLs are http://host:port/bucket/avatars/filename.webp
            // So we need "avatars/filename.webp"
            const index = url.indexOf('/avatars/');
            if (index !== -1) {
                return url.substring(index + 1); // "avatars/filename.webp"
            }
            return null;
        };

        usersResult.rows.forEach(row => {
            const key = extractKey(row.avatar_url);
            if (key) validFiles.add(key);
        });

        historyResult.rows.forEach(row => {
            const key = extractKey(row.avatar_url);
            if (key) validFiles.add(key);
        });

        console.log(`Found ${validFiles.size} valid files in Database.`);

        // 2. Scan MinIO for all files in 'avatars/' prefix
        const orphans = [];
        const objectsStream = minioClient.listObjects(bucketName, 'avatars/', true);

        await new Promise((resolve, reject) => {
            objectsStream.on('data', obj => {
                // obj.name is "avatars/filename.webp"
                if (!validFiles.has(obj.name)) {
                    orphans.push(obj.name);
                }
            });
            objectsStream.on('error', err => reject(err));
            objectsStream.on('end', () => resolve());
        });

        console.log(`Found ${orphans.length} orphaned files in Storage.`);

        // 3. Delete Orphans
        let deletedCount = 0;
        let errorsCount = 0;

        // Delete in batches or one by one
        for (const orphan of orphans) {
            try {
                await minioClient.removeObject(bucketName, orphan);
                deletedCount++;
            } catch (err) {
                console.error(`Failed to delete ${orphan}:`, err);
                errorsCount++;
            }
        }

        res.json({
            message: 'Limpieza completada',
            stats: {
                total_db_files: validFiles.size,
                orphans_found: orphans.length,
                deleted: deletedCount,
                errors: errorsCount
            }
        });

    } catch (err) {
        console.error('Cleanup Error:', err);
        res.status(500).json({ message: 'Error durante la limpieza', error: err.message });
    } finally {
        client.release();
    }
};
