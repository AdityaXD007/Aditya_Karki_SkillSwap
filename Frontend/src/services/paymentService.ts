import apiClient from './apiClient';

export const paymentAPI = {
    initiatePayment: (sessionId: number, amount: number, returnUrl?: string) =>
        apiClient.post('/payment/initiate/', {
            session_id: sessionId,
            amount: amount,
            return_url: returnUrl
        }),
    verifyPayment: (pidx: string) =>
        apiClient.post('/payment/verify/', { pidx }),
};
