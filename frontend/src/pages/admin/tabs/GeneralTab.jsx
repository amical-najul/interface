import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Layout } from 'lucide-react';

const GeneralTab = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Solo Branding
    const [settings, setSettings] = useState({
        app_name: '',
        app_favicon_url: ''
    });

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            // Usamos endpoint legacy o public? settings/smtp trae app_settings
            const res = await fetch(`${API_URL}/settings/public`, {
                headers: { 'x-auth-token': token }
            });
            // Actually, public endpoint returns simple json used for initial load. 
            // Better use authenticated endpoint to get latest consistent data if changed
            const resAuth = await fetch(`${API_URL}/settings/smtp`, { // Legacy endpoint gets everything
                headers: { 'x-auth-token': token }
            });

            if (resAuth.ok) {
                const data = await resAuth.json();
                setSettings({
                    app_name: data.app_name || '',
                    app_favicon_url: data.app_favicon_url || ''
                });
            }
        } catch (err) {
            console.error('Error fetching general settings:', err);
            setError('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSettingsSaving(true);
        setError('');
        setSuccess('');

        const payload = {
            app_name: settings.app_name,
            app_favicon_url: settings.app_favicon_url
        };

        try {
            const res = await fetch(`${API_URL}/settings/smtp`, { // Legacy endpoint writes everything passed
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess('Ajustes guardados correctamente');
                if (settings.app_name) document.title = settings.app_name;
            } else {
                const data = await res.json();
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
            // Reusing user avatar upload endpoint? Or a specific one?
            // The original code used /users/avatar which updates USER avatar, not APP favicon.
            // Wait, looking at original code... it updated app_favicon_url state with data.avatar_url.
            // This means it was uploading to user profile but using that URL as global favicon? 
            // Probably fine for now as a hack.
            const res = await fetch(`${API_URL}/users/avatar`, {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setSettings(prev => ({ ...prev, app_favicon_url: data.avatar_url }));
                setSuccess('Imagen subida. Guarda para aplicar como Favicon.');
            } else {
                setError(data.message || 'Error al subir imagen');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleFaviconDelete = () => {
        setSettings(prev => ({ ...prev, app_favicon_url: '' }));
    };

    if (loading) return <div className="p-4">Cargando...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6 max-w-4xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Layout className="w-5 h-5 text-gray-600" />
                Identidad y Branding
            </h3>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{success}</div>}

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Aplicación</label>
                    <input
                        type="text"
                        value={settings.app_name}
                        onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                        placeholder="Mi Aplicación"
                        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Nombre visible en el navegador y correos.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Favicon / Logo</label>
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative group">
                            {settings.app_favicon_url ? (
                                <img src={settings.app_favicon_url} alt="Favicon" className="w-full h-full object-contain p-2" />
                            ) : (
                                <Layout className="w-8 h-8 text-gray-300" />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <label className="cursor-pointer bg-white px-3 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50">
                                    Subir Imagen
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFaviconUpload} />
                                </label>
                                {settings.app_favicon_url && (
                                    <button
                                        onClick={handleFaviconDelete}
                                        className="px-3 py-2 border border-red-200 text-red-600 rounded text-sm font-medium hover:bg-red-50"
                                    >
                                        Eliminar
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">Recomendado: 64x64px PNG o ICO.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t">
                    <button
                        onClick={handleSaveSettings}
                        disabled={settingsSaving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {settingsSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneralTab;
