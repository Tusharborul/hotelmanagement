import api from './api';

const createPaymentIntent = async ({ amount, currency = 'usd', metadata = {} }) => {
  const response = await api.post('/payments/create-payment-intent', { amount, currency, metadata });
  return response.data;
};

const attachBooking = async ({ bookingId, paymentIntentId }) => {
  const response = await api.post('/payments/attach-booking', { bookingId, paymentIntentId });
  return response.data;
};

export const paymentService = {
  createPaymentIntent,
  attachBooking
};
