import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex min-h-screen bg-gray-100 font-inter">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-xl min-h-screen flex flex-col fixed inset-y-0 left-0 z-10 transition-transform duration-300 transform md:relative md:translate-x-0">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-[#008a60]">AdminPanel</h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Gestión del Sistema</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        to="/admin/profile"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/profile')
                            ? 'bg-[#f0fdf4] text-[#008a60] font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        Mi Perfil
                    </Link>

                    <Link
                        to="/admin/users"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/users')
                            ? 'bg-[#f0fdf4] text-[#008a60] font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        Gestión de Usuarios
                    </Link>

                    <Link
                        to="/admin/templates"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin/templates')
                            ? 'bg-[#f0fdf4] text-[#008a60] font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        Plantillas de Email
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                            <div className="w-10 h-10 bg-[#008a60] text-white rounded-full flex items-center justify-center font-bold">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-800 truncate">{user.name || 'Admin'}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-500 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
