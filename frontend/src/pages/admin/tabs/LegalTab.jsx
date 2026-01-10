import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { FileText } from 'lucide-react';

const LegalTab = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [legal, setLegal] = useState({
        terms_content: '',
        privacy_content: ''
    });

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/smtp`, {
                headers: { 'x-auth-token': token }
            });

            if (res.ok) {
                const data = await res.json();
                setLegal({
                    terms_content: data.terms_content || '',
                    privacy_content: data.privacy_content || ''
                });
            }
        } catch (err) {
            console.error('Error fetching legal settings:', err);
            setError('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`${API_URL}/settings/smtp`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(legal)
            });

            if (res.ok) {
                setSuccess('Textos legales guardados correctamente');
            } else {
                const data = await res.json();
                setError(data.message || 'Error al guardar');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">Cargando...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-6 max-w-4xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Plantillas Legales
            </h3>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{success}</div>}

            <div className="space-y-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Términos y Condiciones</label>
                    <p className="text-xs text-gray-500 mb-2">Acepta formato Markdown básico.</p>
                    <textarea
                        value={legal.terms_content}
                        onChange={(e) => setLegal({ ...legal, terms_content: e.target.value })}
                        rows="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                        placeholder="# Términos y Condiciones..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Política de Privacidad</label>
                    <p className="text-xs text-gray-500 mb-2">Acepta formato Markdown básico.</p>
                    <textarea
                        value={legal.privacy_content}
                        onChange={(e) => setLegal({ ...legal, privacy_content: e.target.value })}
                        rows="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                        placeholder="# Política de Privacidad..."
                    />
                </div>

                <div className="pt-4 border-t">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalTab;
