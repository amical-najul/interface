import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

const StorageTab = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_URL;

    const runCleanup = async () => {
        if (!confirm('¿Estás seguro? Esta acción escaneará el almacenamiento y eliminará permanentemente cualquier archivo que no esté referenciado en la base de datos.')) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch(`${API_URL}/settings/maintenance/cleanup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                }
            });

            const data = await res.json();
            if (res.ok) {
                setResult(data);
            } else {
                setError(data.message || 'Error al ejecutar limpieza');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mantenimiento de Almacenamiento (S3/MinIO)</h3>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-amber-800">Atención</h3>
                            <div className="mt-2 text-sm text-amber-700">
                                <p>
                                    La herramienta de limpieza escaneará todo el bucket de avatares y <strong>eliminará permanentemente</strong> cualquier archivo que no esté asociado a un usuario activo o a un historial válido en la base de datos.
                                </p>
                                <p className="mt-2 text-xs">Utiliza esto periódicamente para recuperar espacio en disco.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Limpieza de Archivos Huérfanos</h4>
                        <p className="text-sm text-gray-500">Elimina avatares antiguos de usuarios borrados o subidas fallidas.</p>
                    </div>
                    <button
                        onClick={runCleanup}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200'
                            }`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Escaneando...
                            </>
                        ) : 'Ejecutar Limpieza'}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-fadeIn">
                        <h4 className="text-green-800 font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Resultado de la Limpieza
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded border border-green-100 shadow-sm">
                                <span className="block text-xs text-gray-500 uppercase">Archivos en BD</span>
                                <span className="text-xl font-bold text-gray-800">{result.stats.total_db_files}</span>
                            </div>
                            <div className="bg-white p-3 rounded border border-green-100 shadow-sm">
                                <span className="block text-xs text-gray-500 uppercase">Huérfanos Encontrados</span>
                                <span className="text-xl font-bold text-amber-600">{result.stats.orphans_found}</span>
                            </div>
                            <div className="bg-white p-3 rounded border border-green-100 shadow-sm">
                                <span className="block text-xs text-gray-500 uppercase">Eliminados</span>
                                <span className="text-xl font-bold text-green-600">{result.stats.deleted}</span>
                            </div>
                            <div className="bg-white p-3 rounded border border-green-100 shadow-sm">
                                <span className="block text-xs text-gray-500 uppercase">Errores</span>
                                <span className="text-xl font-bold text-red-500">{result.stats.errors}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StorageTab;
