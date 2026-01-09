import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserProfileMenu from '../components/layout/UserProfileMenu';

const UserLayout = () => {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'admin';

    return (
        <div className="min-h-screen bg-gray-50 font-inter">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-[#008a60]">Mi Aplicación</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <UserProfileMenu user={user} logout={logout} />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main>
                <Outlet />
            </main>

            {/* Admin Return Button (Floating) */}
            {isAdmin && (
                <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
                    <Link
                        to="/admin/users"
                        className="flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-full shadow-lg hover:bg-black transition-all transform hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        <span className="font-medium">Volver al AdminPanel</span>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default UserLayout;
