import React, { useState } from 'react';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm }) => {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password) {
            setError('Debes ingresar tu contraseña para confirmar.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Here we just pass the password to the parent handler
            await onConfirm(password);
        } catch (err) {
            setError(err.message || 'Error al eliminar la cuenta.');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-red-100">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold">Eliminar Cuenta</h3>
                    </div>

                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                        Esta acción es <span className="font-bold text-gray-900">permanente e irreversible</span>.
                        Todos tus datos, progresos y configuraciones se borrarán definitivamente.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirma tu contraseña para continuar
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                placeholder="Tu contraseña actual"
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors disable:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !password}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-lg shadow-red-200 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Eliminando...
                                    </>
                                ) : (
                                    'Eliminar Definitivamente'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;
