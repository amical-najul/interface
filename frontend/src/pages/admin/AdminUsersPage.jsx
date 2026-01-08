import { useState, useEffect } from 'react';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // Fetch Users
    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                headers: { 'x-auth-token': token }
            });
            const data = await res.json();
            if (res.ok) setUsers(data);
            else setError(data.message);
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Delete User
    const handleDelete = async (id) => {
        if (!confirm('¿Seguro de eliminar este usuario?')) return;
        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });
            if (res.ok) fetchUsers();
            else alert('Error al eliminar');
        } catch (err) {
            alert('Error de conexión');
        }
    };

    // Save User (Create/Update)
    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.active = data.active === 'on'; // Checkbox handling

        const method = editingUser ? 'PUT' : 'POST';
        const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                setModalOpen(false);
                fetchUsers();
            } else {
                const err = await res.json();
                alert(err.message || 'Error al guardar');
            }
        } catch (err) {
            alert('Error al guardar');
        }
    };

    const openModal = (user = null) => {
        setEditingUser(user);
        setModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
                    <p className="text-gray-500">Administra roles, accesos y crea nuevas cuentas.</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-[#008a60] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#007a55] transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Crear Usuario
                </button>
            </div>

            {loading ? <p>Cargando...</p> : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                                    {user.email.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.name || 'Sin Nombre'}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {user.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openModal(user)} className="text-gray-400 hover:text-[#008a60] transition-colors p-1">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input name="email" type="email" defaultValue={editingUser?.email} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#008a60] focus:border-[#008a60]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                <input name="name" type="text" defaultValue={editingUser?.name} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#008a60] focus:border-[#008a60]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contraseña {editingUser && '(Dejar vacío para no cambiar)'}</label>
                                <input name="password" type="password" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#008a60] focus:border-[#008a60]" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                                    <select name="role" defaultValue={editingUser?.role || 'user'} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#008a60] focus:border-[#008a60]">
                                        <option value="user">Usuario</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                {editingUser && (
                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input name="active" type="checkbox" defaultChecked={editingUser.active} className="text-[#008a60] focus:ring-[#008a60] rounded" />
                                            <span className="text-sm text-gray-700">Activo</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-[#008a60] text-white rounded-lg font-medium hover:bg-[#007a55]">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
