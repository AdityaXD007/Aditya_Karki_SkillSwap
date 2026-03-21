import apiClient from './apiClient';

export const paymentAPI = {
    initiatePayment: (sessionId: number, amount: number, paymentMethod: string = 'KHALTI', returnUrl?: string) =>
        apiClient.post('/payment/initiate/', {
            session_id: sessionId,
            amount: amount,
            payment_method: paymentMethod,
            return_url: returnUrl
        }),
    verifyPayment: (pidx?: string, sessionId?: string) =>
        apiClient.post('/payment/verify/', { pidx, session_id: sessionId }),
};
