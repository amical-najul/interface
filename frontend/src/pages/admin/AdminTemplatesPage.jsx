import { useState, useEffect } from 'react';

const TEMPLATES_CONFIG = [
    {
        key: 'email_verification',
        name: 'Verificación de Email',
        description: 'Enviado cuando un usuario se registra para verificar su dirección de correo.',
        icon: '✉️'
    },
    {
        key: 'password_reset',
        name: 'Restablecer Contraseña',
        description: 'Enviado cuando un usuario solicita restablecer su contraseña.',
        icon: '🔑'
    },
    {
        key: 'email_change',
        name: 'Cambio de Email',
        description: 'Enviado cuando un usuario solicita cambiar su dirección de correo.',
        icon: '📧'
    }
];

const PLACEHOLDERS = [
    { var: '%DISPLAY_NAME%', desc: 'Nombre del usuario' },
    { var: '%APP_NAME%', desc: 'Nombre de la aplicación' },
    { var: '%LINK%', desc: 'URL de acción (verificar/reset)' },
    { var: '%EMAIL%', desc: 'Correo electrónico del usuario' },
    { var: '%NEW_EMAIL%', desc: 'Nuevo correo (solo cambio de email)' },
];

const AdminTemplatesPage = () => {
    const [activeTab, setActiveTab] = useState('templates'); // 'templates', 'smtp', 'general'
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Template form state
    const [formData, setFormData] = useState({
        sender_name: '',
        sender_email: '',
        reply_to: '',
        subject: '',
        body_html: ''
    });

    // SMTP & General Settings state
    const [settings, setSettings] = useState({
        enabled: false,
        sender_email: '',
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_pass: '',
        smtp_secure: 'tls',
        app_name: '',
        app_favicon_url: ''
    });
    const [settingsSaving, setSettingsSaving] = useState(false);

    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // Fetch templates
    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${API_URL}/templates`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) setTemplates(data);
        } catch (err) {
            console.error('Error fetching templates:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch settings
    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/smtp`, {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    useEffect(() => {
        fetchTemplates();
        fetchSettings();
    }, []);

    const handleSelectTemplate = (templateKey) => {
        const template = templates.find(t => t.template_key === templateKey);
        const config = TEMPLATES_CONFIG.find(c => c.key === templateKey);

        if (template) {
            setFormData({
                sender_name: template.sender_name || '',
                sender_email: template.sender_email || '',
                reply_to: template.reply_to || '',
                subject: template.subject || '',
                body_html: template.body_html || ''
            });
        } else {
            setFormData({
                sender_name: '',
                sender_email: 'noreply@example.com',
                reply_to: 'noreply',
                subject: templateKey === 'email_verification'
                    ? 'Verifica tu correo electrónico para %APP_NAME%'
                    : templateKey === 'password_reset'
                        ? 'Restablece tu contraseña para %APP_NAME%'
                        : 'Confirma tu cambio de correo en %APP_NAME%',
                body_html: getDefaultBody(templateKey)
            });
        }

        setSelectedTemplate({ ...config, key: templateKey, data: template });
        setEditMode(true);
        setError('');
        setSuccess('');
    };

    const getDefaultBody = (key) => {
        if (key === 'email_verification') {
            return `Hola, %DISPLAY_NAME%:

Visita este vínculo para verificar tu dirección de correo electrónico.

%LINK%

Si no solicitaste la verificación de esta dirección, ignora este correo electrónico.

Gracias.

El equipo de %APP_NAME%`;
        }
        if (key === 'password_reset') {
            return `Hola, %DISPLAY_NAME%:

Haz clic en el siguiente enlace para restablecer tu contraseña.

%LINK%

Si no solicitaste restablecer tu contraseña, ignora este correo.

Gracias.

El equipo de %APP_NAME%`;
        }
        return `Hola, %DISPLAY_NAME%:

Has solicitado cambiar tu correo electrónico a %NEW_EMAIL%.

Haz clic en el siguiente enlace para confirmar el cambio.

%LINK%

Si no solicitaste este cambio, ignora este correo.

Gracias.

El equipo de %APP_NAME%`;
    };

    const handleSaveTemplate = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`${API_URL}/templates/${selectedTemplate.key}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Plantilla guardada correctamente');
                fetchTemplates();
            } else {
                setError(data.message || 'Error al guardar');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSettings = async () => {
        setSettingsSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`${API_URL}/settings/smtp`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(settings)
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Configuración guardada correctamente');
                // Optional: Force reload to apply branding changes if any
                if (settings.app_name) document.title = settings.app_name;
            } else {
                setError(data.message || 'Error al guardar configuración');
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
        formData.append('avatar', file); // API expects 'avatar' key for MinIO uploads for now

        setSettingsSaving(true);
        try {
            const res = await fetch(`${API_URL}/users/avatar`, { // Re-using avatar upload endpoint
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

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSettingsChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    // General Settings Panel (Branding)
    const renderGeneralSettings = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Personalización de Marca</h3>

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
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                            {settings.app_favicon_url ? (
                                <img src={settings.app_favicon_url} alt="Favicon" className="w-full h-full object-contain" />
                            ) : (
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            )}
                        </div>
                        <div className="flex-1">
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
                                Seleccionar Imagen
                            </label>
                            <p className="mt-1 text-xs text-gray-500">Se recomienda una imagen cuadrada (PNG/SVG/ICO).</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="px-6 py-2 bg-[#008a60] text-white rounded-lg font-medium hover:bg-[#007a55] disabled:opacity-50"
                >
                    {settingsSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );

    // SMTP Configuration Panel
    const renderSmtpConfig = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configuración del SMTP</h3>
                    <p className="text-sm text-gray-500">Usa tu propio servidor SMTP para el envío de correos electrónicos.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-600">Habilitar</span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => handleSettingsChange('enabled', e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${settings.enabled ? 'bg-[#008a60]' : 'bg-gray-300'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enabled ? 'translate-x-5' : ''}`}></div>
                        </div>
                    </div>
                </label>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{success}</div>}

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email del remitente</label>
                    <input
                        type="email"
                        value={settings.sender_email}
                        onChange={(e) => handleSettingsChange('sender_email', e.target.value)}
                        placeholder="support@yourdomain.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Host del servidor SMTP</label>
                    <input
                        type="text"
                        value={settings.smtp_host}
                        onChange={(e) => handleSettingsChange('smtp_host', e.target.value)}
                        placeholder="smtp.host.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
                    <input
                        type="text"
                        value={settings.smtp_port}
                        onChange={(e) => handleSettingsChange('smtp_port', e.target.value)}
                        placeholder="587"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modo de seguridad</label>
                    <select
                        value={settings.smtp_secure}
                        onChange={(e) => handleSettingsChange('smtp_secure', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                    >
                        <option value="none">Ninguno</option>
                        <option value="tls">TLS</option>
                        <option value="ssl">SSL</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de usuario</label>
                    <input
                        type="text"
                        value={settings.smtp_user}
                        onChange={(e) => handleSettingsChange('smtp_user', e.target.value)}
                        placeholder="username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input
                        type="password"
                        value={settings.smtp_pass}
                        onChange={(e) => handleSettingsChange('smtp_pass', e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                    />
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving || !settings.enabled}
                    className="px-6 py-2 bg-[#008a60] text-white rounded-lg font-medium hover:bg-[#007a55] disabled:opacity-50"
                >
                    {settingsSaving ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </div>
    );

    // Templates List
    const renderTemplatesList = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TEMPLATES_CONFIG.map(config => {
                const template = templates.find(t => t.template_key === config.key);
                return (
                    <div
                        key={config.key}
                        onClick={() => handleSelectTemplate(config.key)}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#008a60] transition-all cursor-pointer"
                    >
                        <div className="text-3xl mb-3">{config.icon}</div>
                        <h3 className="font-semibold text-gray-900 mb-1">{config.name}</h3>
                        <p className="text-sm text-gray-500">{config.description}</p>
                        {template && (
                            <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Personalizada
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // Template Editor
    const renderTemplateEditor = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setEditMode(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div>
                        <h3 className="font-semibold text-gray-900">{selectedTemplate?.name}</h3>
                        <p className="text-sm text-gray-500">{selectedTemplate?.description}</p>
                    </div>
                </div>
                <button
                    onClick={handleSaveTemplate}
                    disabled={saving}
                    className="px-4 py-2 bg-[#008a60] text-white rounded-lg font-medium hover:bg-[#007a55] disabled:opacity-50"
                >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Form */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del remitente</label>
                            <input
                                type="text"
                                value={formData.sender_name}
                                onChange={(e) => handleChange('sender_name', e.target.value)}
                                placeholder="Mi App"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email remitente</label>
                            <input
                                type="email"
                                value={formData.sender_email}
                                onChange={(e) => handleChange('sender_email', e.target.value)}
                                placeholder="noreply@app.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Responder a</label>
                        <input
                            type="text"
                            value={formData.reply_to}
                            onChange={(e) => handleChange('reply_to', e.target.value)}
                            placeholder="noreply"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                        <textarea
                            value={formData.body_html}
                            onChange={(e) => handleChange('body_html', e.target.value)}
                            rows={10}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#008a60] focus:border-[#008a60] font-mono text-sm"
                        />
                    </div>

                    {/* Variables */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Variables disponibles</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {PLACEHOLDERS.map(p => (
                                <div key={p.var} className="flex items-center gap-2">
                                    <code className="bg-gray-200 px-1 rounded text-xs">{p.var}</code>
                                    <span className="text-gray-500 text-xs">{p.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Preview */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vista Previa</label>
                    <div className="border border-gray-200 rounded-lg bg-white p-4 min-h-[400px]">
                        <div className="border-b pb-3 mb-3">
                            <p className="text-xs text-gray-500">De: {formData.sender_name || 'Remitente'} &lt;{formData.sender_email || 'email@example.com'}&gt;</p>
                            <p className="text-xs text-gray-500">Responder a: {formData.reply_to || 'noreply'}</p>
                            <p className="text-sm font-semibold mt-2">{formData.subject || 'Sin asunto'}</p>
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-700">
                            {formData.body_html
                                .replace(/%DISPLAY_NAME%/g, 'Juan Pérez')
                                .replace(/%APP_NAME%/g, settings.app_name || 'Mi Aplicación')
                                .replace(/%EMAIL%/g, 'juan@example.com')
                                .replace(/%NEW_EMAIL%/g, 'nuevo@example.com')
                                .replace(/%LINK%/g, 'https://app.example.com/action?mode=verify&code=abc123')
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Personalización y Plantillas</h2>
                <p className="text-gray-500">Configura la identidad de tu aplicación y las comunicaciones por email.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => { setActiveTab('general'); setEditMode(false); }}
                    className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'general'
                            ? 'text-[#008a60] border-[#008a60]'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                >
                    Ajustes Generales
                </button>
                <button
                    onClick={() => { setActiveTab('templates'); setEditMode(false); }}
                    className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'templates'
                            ? 'text-[#008a60] border-[#008a60]'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                >
                    Plantillas de Email
                </button>
                <button
                    onClick={() => { setActiveTab('smtp'); setEditMode(false); }}
                    className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'smtp'
                            ? 'text-[#008a60] border-[#008a60]'
                            : 'text-gray-500 border-transparent hover:text-gray-700'
                        }`}
                >
                    Configuración SMTP
                </button>
            </div>

            {loading ? (
                <p>Cargando...</p>
            ) : activeTab === 'general' ? (
                renderGeneralSettings()
            ) : activeTab === 'smtp' ? (
                renderSmtpConfig()
            ) : editMode ? (
                renderTemplateEditor()
            ) : (
                renderTemplatesList()
            )}
        </div>
    );
};

export default AdminTemplatesPage;
