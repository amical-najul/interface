import React from 'react';
import { LLM_PROVIDERS } from '../../../constants/llmModels';

const GeneralSettings = ({ settings, handleSettingsChange, handleFaviconUpload, handleFaviconDelete, settingsSaving, handleSaveSettings, error, success }) => {

    // Helper to get models for specific provider
    const getModelsForProvider = (providerId) => {
        const provider = LLM_PROVIDERS.find(p => p.id === providerId);
        return provider ? provider.models : { general: [], code: [] };
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
            {/* Branding Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Personalización de Marca</h3>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
                {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{success}</div>}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Aplicación</label>
                        <input
                            type="text"
                            value={settings.app_name}
                            onChange={(e) => handleSettingsChange('app_name', e.target.value)}
                            placeholder="Mi Increíble App"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                        />
                        <p className="mt-1 text-xs text-gray-500">Este nombre aparecerá en la pestaña del navegador y en los correos electrónicos.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Favicon del Proyecto</label>
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                {settings.app_favicon_url ? (
                                    <>
                                        <img src={settings.app_favicon_url} alt="Favicon" className="w-full h-full object-contain p-2" />
                                    </>
                                ) : (
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFaviconUpload}
                                        className="hidden"
                                        id="favicon-upload"
                                    />
                                    <label
                                        htmlFor="favicon-upload"
                                        className="inline-block px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Subir Nuevo
                                    </label>
                                    {settings.app_favicon_url && (
                                        <button
                                            onClick={handleFaviconDelete}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">Se recomienda una imagen cuadrada (PNG/SVG/ICO, 32x32px idealmente).</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Settings Section - Primary */}
            <div>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Configuración de IA (Principal)</h3>
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-0.5 rounded">Activo por defecto</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                        <select
                            value={settings.llm_provider || 'openai'}
                            onChange={(e) => {
                                handleSettingsChange('llm_provider', e.target.value);
                                handleSettingsChange('llm_model', ''); // Reset model on provider change
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60] bg-white"
                        >
                            {LLM_PROVIDERS.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                        <select
                            value={settings.llm_model}
                            onChange={(e) => handleSettingsChange('llm_model', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60] bg-white"
                        >
                            <option value="">Seleccionar modelo...</option>
                            <optgroup label="Modelos Generales">
                                {getModelsForProvider(settings.llm_provider || 'openai').general.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Modelos de Código">
                                {getModelsForProvider(settings.llm_provider || 'openai').code.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                            type="password"
                            value={settings.llm_api_key}
                            onChange={(e) => handleSettingsChange('llm_api_key', e.target.value)}
                            placeholder="sk-..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60] font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* AI Settings Section - Secondary */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                    <h3 className="text-base font-semibold text-gray-700">Configuración Secundaria (Fallback)</h3>
                    <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded">Uso en caso de fallo</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor (Backup)</label>
                        <select
                            value={settings.llm_provider_secondary || ''}
                            onChange={(e) => {
                                handleSettingsChange('llm_provider_secondary', e.target.value);
                                handleSettingsChange('llm_model_secondary', '');
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60] bg-white"
                        >
                            <option value="">Desactivado</option>
                            {LLM_PROVIDERS.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Modelo (Backup)</label>
                        <select
                            value={settings.llm_model_secondary}
                            onChange={(e) => handleSettingsChange('llm_model_secondary', e.target.value)}
                            disabled={!settings.llm_provider_secondary}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60] bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="">Seleccionar modelo...</option>
                            {settings.llm_provider_secondary && (
                                <>
                                    <optgroup label="Modelos Generales">
                                        {getModelsForProvider(settings.llm_provider_secondary).general.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Modelos de Código">
                                        {getModelsForProvider(settings.llm_provider_secondary).code.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </optgroup>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key (Backup)</label>
                        <input
                            type="password"
                            value={settings.llm_api_key_secondary}
                            onChange={(e) => handleSettingsChange('llm_api_key_secondary', e.target.value)}
                            disabled={!settings.llm_provider_secondary}
                            placeholder="sk-..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60] font-mono disabled:bg-gray-100"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="px-6 py-2 bg-[#008a60] text-white rounded-lg font-medium hover:bg-[#007a55] disabled:opacity-50 shadow-sm"
                >
                    {settingsSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
};

export default GeneralSettings;
