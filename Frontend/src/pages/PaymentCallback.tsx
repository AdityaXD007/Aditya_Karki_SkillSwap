import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentAPI } from '@/services';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const PaymentCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your payment...');

    useEffect(() => {
        const pidx = searchParams.get('pidx');

        if (pidx) {
            paymentAPI.verifyPayment(pidx)
                .then(() => {
                    setStatus('success');
                    setMessage('Payment successful! Your session is now unlocked.');
                    setTimeout(() => navigate('/messages'), 3000);
                })
                .catch((err) => {
                    console.error('Verification error:', err);
                    setStatus('error');
                    setMessage('Payment verification failed. Please contact support.');
                });
        } else if (searchParams.get('status') === 'User canceled') {
             setStatus('error');
             setMessage('Payment was canceled by the user.');
             setTimeout(() => navigate('/messages'), 3000);
        } else {
            setStatus('error');
            setMessage('Invalid callback parameters.');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verifying Payment</h2>
                        <p className="text-gray-600 dark:text-gray-400">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Success!</h2>
                        <p className="text-gray-600 dark:text-gray-400">{message}</p>
                        <p className="text-sm text-gray-500">Redirecting to chat...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center space-y-4">
                        <XCircle className="w-16 h-16 text-red-500" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Failed</h2>
                        <p className="text-gray-600 dark:text-gray-400">{message}</p>
                        <button 
                            onClick={() => navigate('/messages')}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Back to Messages
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
