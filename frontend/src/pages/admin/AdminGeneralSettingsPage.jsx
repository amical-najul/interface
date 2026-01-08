import { useState, useEffect } from 'react';
import GeneralSettings from './templates/GeneralSettings';
import { useAuth } from '../../context/AuthContext';

const AdminGeneralSettingsPage = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [settings, setSettings] = useState({
        app_name: '',
        app_favicon_url: ''
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // Fetch settings
    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/smtp`, {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({
                    ...prev,
                    app_name: data.app_name,
                    app_favicon_url: data.app_favicon_url
                }));
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchSettings();
    }, [token]);

    const handleSettingsChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveSettings = async () => {
        setSettingsSaving(true);
        setError('');
        setSuccess('');

        // Payload Isolation: Only send general settings
        const payload = {
            app_name: settings.app_name,
            app_favicon_url: settings.app_favicon_url
        };

        try {
            const res = await fetch(`${API_URL}/settings/smtp`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Ajustes generales guardados correctamente');
                if (settings.app_name) document.title = settings.app_name;
            } else {
                setError(data.message || 'Error al guardar');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleFaviconUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        setSettingsSaving(true);
        try {
            const res = await fetch(`${API_URL}/users/avatar`, {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setSettings(prev => ({ ...prev, app_favicon_url: data.avatar_url }));
                setSuccess('Favicon subido. Recuerda guardar los cambios.');
            } else {
                setError(data.message || 'Error al subir favicon');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setSettingsSaving(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Ajustes Generales</h2>
                <p className="text-gray-500">Personaliza la identidad visual de tu aplicación.</p>
            </div>

            {loading ? (
                <p>Cargando...</p>
            ) : (
                <GeneralSettings
                    settings={settings}
                    handleSettingsChange={handleSettingsChange}
                    handleFaviconUpload={handleFaviconUpload}
                    handleSaveSettings={handleSaveSettings}
                    settingsSaving={settingsSaving}
                    error={error}
                    success={success}
                />
            )}
        </div>
    );
};

export default AdminGeneralSettingsPage;
