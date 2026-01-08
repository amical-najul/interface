import { useAuth } from '../../context/AuthContext';

const UserDashboardPage = () => {
    const { user } = useAuth();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        ¡Hola, {user?.name || user?.email}!
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Bienvenido a tu panel de usuario. Aquí podrás acceder a tus cursos y progreso próximamente.
                    </p>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Placeholder Stats */}
                        <div className="bg-[#f0fdf4] p-6 rounded-xl border border-[#008a60]/20">
                            <h3 className="font-semibold text-[#008a60]">Nivel Actual</h3>
                            <p className="text-2xl font-bold text-gray-800 mt-2">Principiante</p>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                            <h3 className="font-semibold text-blue-600">Lecciones Completadas</h3>
                            <p className="text-2xl font-bold text-gray-800 mt-2">0</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                            <h3 className="font-semibold text-purple-600">Racha</h3>
                            <p className="text-2xl font-bold text-gray-800 mt-2">0 Días</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboardPage;
