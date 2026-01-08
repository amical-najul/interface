import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function LoginPage() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user.role === 'admin') navigate('/admin/users');
            // else navigate('/dashboard'); // Future user dashboard
        }
    }, []);

    const verifyEmail = async (token) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/verify-email?token=${token}`);
            const data = await res.json();
            if (res.ok) {
                alert("¡Cuenta verificada exitosamente! Ahora puedes iniciar sesión.");
                window.history.replaceState({}, document.title, "/");
            } else {
                setError(data.message || "Error verificando email");
            }
        } catch (err) {
            setError("Error de conexión al verificar email");
        } finally {
            setIsLoading(false);
        }
    };

    // Google Login Handler
    const handleGoogleSuccess = async (tokenResponse) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenResponse.access_token }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error en Google Login');

            // Save session
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            if (data.user.role === 'admin') navigate('/admin/users');
            else alert('Login exitoso (User Dashboard pendiente)');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => setError('Error al conectar con Google'),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const endpoint = isLogin ? '/auth/login' : '/auth/register';

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Error en la solicitud');
            }

            if (isLogin) {
                // Login Success
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (data.user.role === 'admin') navigate('/admin/users');
                else alert('Login exitoso (User Dashboard pendiente)');

            } else {
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
                                    <a href="#" className="text-sm text-[#008a60] hover:underline font-medium">
                                        ¿Olvidaste tu contraseña?
                                    </a>
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

                    <button
                        onClick={() => loginWithGoogle()}
                        className="w-full border border-gray-300 bg-white text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84.81-.81z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>
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
        </div>
    );
}

export default LoginPage;
