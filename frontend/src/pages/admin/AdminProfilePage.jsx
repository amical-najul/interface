import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminProfilePage = () => {
    const { user, token, updateProfile } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    const [loading, setLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (!data.password) delete data.password;

        try {
            const res = await fetch(`${API_URL}/users/profile/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                const updatedUser = await res.json();
                updateProfile(updatedUser);
                alert('Perfil actualizado correctamente');
            } else {
                alert('Error al actualizar');
            }
        } catch (err) {
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);
        setAvatarLoading(true);

        try {
            const res = await fetch(`${API_URL}/users/avatar`, {
                method: 'POST',
                headers: { 'x-auth-token': token },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                updateProfile({ ...user, avatar_url: data.avatar_url });
            } else {
                alert('Error subiendo imagen');
            }
        } catch (err) {
            alert('Error subiendo imagen');
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!confirm('¿Estás seguro de eliminar tu foto de perfil?')) return;
        setAvatarLoading(true);

        try {
            const res = await fetch(`${API_URL}/users/avatar`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (res.ok) {
                updateProfile({ ...user, avatar_url: null });
            } else {
                alert('Error eliminando avatar');
            }
        } catch (err) {
            alert('Error de conexión');
        } finally {
            setAvatarLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div
                            className="cursor-pointer"
                            onClick={() => fileInputRef.current.click()}
                        >
                            {user?.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 group-hover:border-[#008a60] transition-colors"
                                />
                            ) : (
                                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500 group-hover:bg-gray-300 transition-colors">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </div>
                        </div>
                        {avatarLoading && (
                            <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-[#008a60] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    <p className="mt-3 text-sm text-gray-500">Haz clic en la foto para cambiarla</p>

                    {user?.avatar_url && (
                        <button
                            onClick={handleDeleteAvatar}
                            disabled={avatarLoading}
                            className="mt-2 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                            Eliminar foto de perfil
                        </button>
                    )}
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <input name="name" type="text" defaultValue={user?.name} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008a60] focus:border-transparent outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                            <input name="email" type="email" defaultValue={user?.email} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008a60] focus:border-transparent outline-none" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (Opcional)</label>
                            <input name="password" type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008a60] focus:border-transparent outline-none" />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-[#008a60] text-white font-medium rounded-lg hover:bg-[#007a55] transition-colors disabled:opacity-70">
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminProfilePage;
