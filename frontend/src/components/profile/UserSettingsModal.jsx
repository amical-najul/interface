import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import DeleteAccountModal from './DeleteAccountModal';

const UserSettingsModal = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();
    const { appName, appVersion, footerText, appFaviconUrl } = useBranding();

    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // ... (keep state) ...

    // Profile State
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        if (isOpen) {
            setProfileData({
                name: user?.name || '',
                email: user?.email || '',
            });
            setMessage({ type: '', text: '' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
    }, [isOpen, user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const updatedUser = await userService.updateProfile({
                name: profileData.name,
                email: profileData.email
            });
            updateProfile({ ...user, name: profileData.name });
            setMessage({ type: 'success', text: 'Perfil actualizado' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error al actualizar perfil' });
        } finally {
            setIsLoading(false);
        }
    };

    // ... (keep password & delete handlers) ...

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }
        setIsLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await userService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Error al cambiar contraseña' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccountClick = () => setIsDeleteModalOpen(true);

    const handleConfirmDeleteAccount = async (password) => {
        try {
            await userService.deleteOwnAccount(password);
            window.location.href = '/login';
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Error al eliminar cuenta');
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const fileInputRef = React.useRef(null);
    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Por favor selecciona un archivo de imagen válido' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'La imagen no debe superar los 5MB' });
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await userService.uploadAvatar(formData);
            updateProfile({ ...user, avatar_url: res.avatar_url });
            setMessage({ type: 'success', text: 'Foto actualizada correctamente' });
        } catch (error) {
            console.error("Avatar upload failed:", error);
            setMessage({ type: 'error', text: error.data?.message || error.message || 'Error al subir la imagen' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarDelete = async (e) => {
        e.stopPropagation(); // Prevent triggering upload click
        if (!window.confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) return;

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await userService.deleteAvatar();
            updateProfile({ ...user, avatar_url: null });
            setMessage({ type: 'success', text: 'Foto eliminada correctamente' });
        } catch (error) {
            setMessage({ type: 'error', text: error.data?.message || error.message || 'Error al eliminar la imagen' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        // ... (keep structure wrapper) ... 
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                <div className="bg-white w-full h-full sm:w-[420px] sm:h-[80vh] sm:max-h-[800px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-in-out">

                    {/* Header & Tabs (Keep them as is in logic, assumed unchanged in replacement range unless included) */}
                    {/* ... Since I'm viewing lines 159-417, I'm replacing handleAvatarDelete and the JSX return logic ... */}

                    <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center shrink-0">
                        <h2 className="text-xl font-bold text-gray-800">Configuración de Cuenta</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 px-6 shrink-0 overflow-x-auto scrollbar-hide">
                        {['profile', 'security', 'preferences', 'info'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-4 font-medium text-sm transition-colors whitespace-nowrap border-b-2 capitalize ${activeTab === tab
                                    ? 'border-[#008a60] text-[#008a60]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab === 'profile' && 'Perfil'}
                                {tab === 'security' && 'Seguridad'}
                                {tab === 'preferences' && 'Preferencias'}
                                {tab === 'info' && 'Información'}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200">
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div
                                            className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg cursor-pointer relative"
                                            onClick={handleAvatarClick}
                                        >
                                            {user?.avatar_url ? (
                                                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover transition-opacity group-hover:opacity-75" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400 group-hover:bg-gray-200 transition-colors">
                                                    {user?.name?.charAt(0) || user?.email?.charAt(0)}
                                                </div>
                                            )}

                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                        </div>

                                        {user?.avatar_url && (
                                            <button
                                                type="button"
                                                onClick={handleAvatarDelete}
                                                className="absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full p-1.5 hover:bg-red-200 transition-colors shadow-sm z-10"
                                                title="Eliminar foto"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">{user?.name || 'Usuario'}</h3>
                                        <p className="text-gray-500 text-sm">{user?.email}</p>
                                        <button
                                            type="button"
                                            onClick={handleAvatarClick}
                                            className="text-sm text-[#008a60] hover:underline mt-1 font-medium"
                                        >
                                            Cambiar foto
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#008a60] focus:border-transparent transition-shadow text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            disabled
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed text-base"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Para cambiar tu email, usa la opción específica de seguridad.</p>
                                    </div>
                                </div>

                                <div className="pt-4 sticky bottom-0 bg-white pb-2">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full sm:w-auto px-6 py-3 bg-[#008a60] text-white rounded-lg font-medium hover:bg-[#00704e] transition-colors disabled:opacity-50 text-base shadow-sm"
                                    >
                                        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                <form onSubmit={handlePasswordChange} className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Cambiar Contraseña</h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#008a60] focus:border-transparent text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#008a60] focus:border-transparent text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#008a60] focus:border-transparent text-base"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50 text-base"
                                    >
                                        {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                    </button>
                                </form>

                                <div className="pt-6 border-t border-gray-100">
                                    <h3 className="text-lg font-semibold text-red-600 border-b border-red-100 pb-2 mb-4">Zona de Peligro</h3>
                                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="font-semibold text-red-800">Eliminar Cuenta</h4>
                                            <p className="text-sm text-red-600 mt-1">Esta acción es permanente y no se puede deshacer.</p>
                                        </div>
                                        <button
                                            onClick={handleDeleteAccountClick}
                                            className="whitespace-nowrap px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all text-sm font-medium shadow-sm"
                                        >
                                            Eliminar mi cuenta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <h3 className="font-medium text-gray-900">Tema Oscuro</h3>
                                        <p className="text-sm text-gray-500">Cambiar la apariencia de la aplicación.</p>
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#008a60] focus:ring-offset-2 ${theme === 'dark' ? 'bg-[#008a60]' : 'bg-gray-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'info' && (
                            <div className="space-y-6 text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center mb-4 overflow-hidden">
                                    {appFaviconUrl ? (
                                        <img src={appFaviconUrl} alt="App Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-4xl">🚀</span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{appName || 'Mi Aplicación'}</h3>
                                <p className="text-gray-500">Versión {appVersion || '1.0.0'}</p>

                                <div className="flex justify-center gap-4 mt-8">
                                    <button className="text-[#008a60] hover:underline text-sm">Términos y Condiciones</button>
                                    <span className="text-gray-300">|</span>
                                    <button className="text-[#008a60] hover:underline text-sm">Política de Privacidad</button>
                                </div>

                                <div className="mt-12 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm inline-block">
                                    {footerText || '© 2024 Mi Aplicación. Todos los derechos reservados.'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDeleteAccount}
            />
        </>
    );
};

export default UserSettingsModal;
