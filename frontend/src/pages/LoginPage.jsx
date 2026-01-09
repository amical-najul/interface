import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import GoogleLoginButton from '../components/GoogleLoginButton';
import VisualGoogleButton from '../components/VisualGoogleButton';
import AlertModal from '../components/AlertModal';
import { useGoogleConfig } from '../context/GoogleConfigContext';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth(); // Connect to AuthContext
    const { enabled: googleAuthEnabled } = useGoogleConfig();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Alert State
    const [alertData, setAlertData] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const closeAlert = () => setAlertData(prev => ({ ...prev, isOpen: false }));
    const showAlert = (title, message, type = 'info') => {
        setAlertData({ isOpen: true, title, message, type });
    };

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // State
    const [showVerification, setShowVerification] = useState(false);

    // Check for Verification Token in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            verifyEmail(token);
        }

        // Check if already logged in
        try {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                if (user && user.role === 'admin') navigate('/admin/users');
            }
        } catch (e) {
            console.error('Error reading stored user:', e);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }, [navigate]);

    const handleVisualClick = () => {
        showAlert(
            "Configuración Requerida",
            "La autenticación con Google no está configurada. Por favor, inicia sesión con email y contraseña.",
            "info"
        );
    };

    const verifyEmail = async (token) => {
        setIsLoading(true);
        try {
            await authService.verifyEmail(token);
            showAlert("¡Verificado!", "Cuenta verificada exitosamente. Ahora puedes iniciar sesión.", "success");
            window.history.replaceState({}, document.title, "/");
        } catch (err) {
            setError(err.message || "Error verificando email");
        } finally {
            setIsLoading(false);
        }
    };

    // Google Login Handler
    const handleGoogleSuccess = async (tokenResponse) => {
        setIsLoading(true);
        try {
            const data = await authService.googleLogin(tokenResponse.access_token);

            // Save session via AuthContext
            login(data.user, data.token);

            if (data.user.role === 'admin') navigate('/admin/users');
            else navigate('/dashboard');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const data = await authService.login(email, password);
                login(data.user, data.token);

                if (data.user.role === 'admin') navigate('/admin/users');
                else navigate('/dashboard');
            } else {
                await authService.register(email, password);
                setShowVerification(true);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (showVerification) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro Exitoso!</h2>
                    <p className="text-gray-600 mb-6">
                        Hemos enviado un correo a <strong>{email}</strong>. <br />
                        Por favor haz clic en el enlace para activar tu cuenta.
                    </p>
                    <button
                        onClick={() => { setShowVerification(false); setIsLogin(true); }}
                        className="text-[#008a60] font-semibold hover:underline"
                    >
                        Volver al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h1>
                        <p className="text-gray-500">
                            {isLogin ? 'Inicia sesión para continuar aprendiendo' : 'Crea tu cuenta para comenzar'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#008a60] focus:border-[#008a60] outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                Contraseña
                            </label>
                            <PasswordInput
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {isLogin && (
                                <div className="flex justify-end mt-2">
                                    <Link to="/forgot-password" className="text-sm text-[#008a60] hover:underline font-medium">
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#008a60] text-white font-bold py-3 rounded-lg hover:bg-[#007a55] transition-colors disabled:opacity-70"
                        >
                            {isLoading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                        </button>
                    </form>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">O continúa con</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    {googleAuthEnabled ? (
                        <GoogleLoginButton
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Error al conectar con Google')}
                        />
                    ) : (
                        <VisualGoogleButton onClick={handleVisualClick} />
                    )}
                </div>

                <div className="bg-gray-50 p-4 text-center">
                    <p className="text-gray-600 text-sm">
                        {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-[#008a60] font-bold hover:underline"
                        >
                            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                        </button>
                    </p>
                </div>
            </div>

            <AlertModal
                isOpen={alertData.isOpen}
                onClose={closeAlert}
                title={alertData.title}
                message={alertData.message}
                type={alertData.type}
            />
        </div>
    );
}

export default LoginPage;
