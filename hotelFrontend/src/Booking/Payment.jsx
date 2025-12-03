import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { bookingService } from "../services/bookingService";
import { paymentService } from "../services/paymentService";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import FullScreenLoader from '../components/FullScreenLoader';
import { formatINR } from '../utils/currency';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { days = 2, checkInDate, totalPrice = 400, hotelId, hotelName, hotelLocation, roomType, roomsCount = 1 } = location.state || {};
  // Normalize room type to backend expected enum values ('AC' | 'NON_AC')
  const normalizedRoomType = (roomType || '').toUpperCase().replace('-', '_');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState(null);
  const publishableKeyMissing = !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const [pageInvalid, setPageInvalid] = useState(false);

  // Calculate check-out date
  let checkOutDate = '';
  if (checkInDate) {
    const dateObj = new Date(checkInDate);
    dateObj.setDate(dateObj.getDate() + days);
    checkOutDate = dateObj.toISOString().split('T')[0];
  }

  // Note: We intentionally do NOT create a PaymentIntent on mount to avoid duplicate intents.
  // We will create it only when the user clicks Pay.

  const handleCancel = () => {
    if (hotelId) navigate(`/booking?hotelId=${hotelId}`);
    else navigate('/home');
  };

  const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();

    const [processing, setProcessing] = useState(false);
    const inFlightRef = useRef(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      // Hard guard against concurrent submissions (rapid double-clicks, hot reload quirks)
      if (inFlightRef.current || (typeof window !== 'undefined' && window.__confirmingCardPayment)) return;
      if (!stripe || !elements) return;
      // Basic validations
      if (!hotelId || !checkInDate || !days || !totalPrice || Number(totalPrice) <= 0) {
        setError('Payment cannot start: booking details are missing or invalid. Please go back and try again.');
        return;
      }
      const card = elements.getElement(CardElement);
      if (!card) {
        setError('Payment form is not ready yet.');
        return;
      }
      if (publishableKeyMissing) {
        setError('Stripe is not configured. Please contact support.');
        return;
      }
      inFlightRef.current = true;
      if (typeof window !== 'undefined') window.__confirmingCardPayment = true;
      setProcessing(true);
      try {
        // Hard guard against concurrent submissions (rapid double-clicks, hot reload quirks)
        const initialPayment = Math.round(totalPrice / 2);
        const intentResp = await paymentService.createPaymentIntent({ amount: initialPayment, metadata: { hotelId } });
        const secret = intentResp?.data?.clientSecret || intentResp?.clientSecret;
        if (!secret) {
          setError('Could not start payment. Please try again.');
          setProcessing(false);
          return;
        }
        setClientSecret(secret);
        
        // 2) Confirm the card payment using the freshly created secret
        const result = await stripe.confirmCardPayment(secret, {
          payment_method: { card }
        });

        if (result.error) {
          setError(result.error.message || 'Payment failed.');
          setProcessing(false);
          return;
        }

        if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          // 3) Create booking on server and attach paymentIntent id
          const bookingData = {
            hotel: hotelId,
            checkInDate,
            checkOutDate,
            days,
            totalPrice,
            roomsCount,
            initialPayment: Math.round(totalPrice / 2),
            roomType: normalizedRoomType,
            paymentDetails: {
              stripePaymentIntentId: result.paymentIntent.id,
              cardNumber: (result.paymentIntent.charges?.data?.[0]?.payment_method_details?.card?.last4) || ''
            }
          };

          const created = await bookingService.createBooking(bookingData);

          // 4) Ensure identifiers are persisted on the booking and PI metadata includes bookingId (fire-and-forget)
          try {
            const createdId = created?.data?._id || created?.data?.id || created?._id || created?.id;
            if (createdId) {
              // Do not block UI navigation on this auxiliary call
              paymentService.attachBooking({ bookingId: createdId, paymentIntentId: result.paymentIntent.id }).catch((metaErr) => {
                console.warn('Failed to attach booking to PI metadata', metaErr);
              });
            }
          } catch (metaErr) {
            console.warn('Attach booking skipped', metaErr);
          }

          navigate('/sucess', {
            state: { hotelName, hotelLocation, checkInDate, checkOutDate }
          });
        } else {
          setError('Payment was not completed.');
        }
      } catch (err) {
        console.error('payment/process', err);
        setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
      } finally {
        inFlightRef.current = false;
        if (typeof window !== 'undefined') window.__confirmingCardPayment = false;
        setProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="w-full">
        <label className="block text-[#1a237e] font-semibold mb-2 text-sm sm:text-base">Card details</label>
        <div className="bg-gray-100 rounded-lg p-3 mb-4">
          {/* Disable Stripe Link button to avoid aria-hidden warning from collapsing Link UI */}
          <CardElement
            options={{
              style: { base: { fontSize: '16px' } },
              disableLink: true,
            }}
          />
        </div>
        {error && <div className="text-red-500 mb-3">{error}</div>}
        <div className="flex flex-col items-center w-full max-w-xs mx-auto gap-3 sm:gap-4 mb-8">
          <button
            className="bg-[#0057FF] text-white text-base sm:text-lg font-medium rounded-lg py-2.5 sm:py-3 w-full shadow hover:bg-[#003bb3] transition disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={processing || !stripe || publishableKeyMissing}
          >
            {processing ? 'Processing...' : `Pay ${formatINR(Math.round(totalPrice / 2))} Now`}
          </button>
          <button
            className="bg-gray-100 text-gray-400 text-base sm:text-lg font-medium rounded-lg py-2.5 sm:py-3 w-full shadow"
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
        {processing && (
          <FullScreenLoader label="Processing payment..." />
        )}
      </form>
    );
  };
  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-white pt-4 sm:pt-6 md:pt-8 px-4 sm:px-6">
      {/* Logo */}
      <div className="text-xl sm:text-2xl font-bold text-[#3252DF] mb-6 sm:mb-8">
        India<span className="text-[#1a237e]">Stay.</span>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-6 sm:mb-8">
        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
          ✓
        </span>
        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">
          ✓
        </span>
        <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-sm sm:text-base">
          3
        </span>
      </div>

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1a237e] mb-2 text-center px-4">
        Payment
      </h2>
      <p className="text-gray-400 mb-6 sm:mb-8 text-center text-sm sm:text-base px-4">
        Kindly follow the instructions below
      </p>
      {publishableKeyMissing && (
        <div className="mb-4 w-full max-w-3xl mx-auto bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl px-4 py-3">
          Stripe publishable key is not configured. Payments are disabled in this environment.
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row items-start justify-center w-full max-w-3xl mx-auto gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
        {/* Left: Payment Info */}
        <div className="flex flex-col items-start w-full sm:w-[400px] mx-auto lg:mx-0">
          <span className="text-base sm:text-lg text-[#1a237e] mb-2 font-semibold">
            Transfer IndiaStay:
          </span>
          <span className="text-sm sm:text-base text-[#1a237e] mb-2">
            {days} Day{days > 1 ? 's' : ''} at {hotelName || 'Blue Origin Fams'},<br />{hotelLocation || 'Galle, Sri India'}
          </span>
          {roomType && (
            <span className="text-sm sm:text-base text-[#1a237e] mb-2">
              Room Type: <span className="font-bold">{roomType}</span>
            </span>
          )}
          {roomsCount > 1 && (
            <span className="text-sm sm:text-base text-[#1a237e] mb-2">
              Rooms: <span className="font-bold">{roomsCount}</span>
            </span>
          )}
          <span className="text-sm sm:text-base text-[#1a237e] mb-2">
            Check-in: <span className="font-bold">{checkInDate || '-'}</span><br />
            Check-out: <span className="font-bold">{checkOutDate || '-'}</span>
          </span>
          <span className="text-base sm:text-lg text-[#1a237e] mb-2">
            Total: <span className="font-bold">{formatINR(totalPrice)}</span>
          </span>
          <span className="text-base sm:text-lg text-[#1a237e] mb-2">
            Initial Payment: <span className="font-bold">{formatINR(Math.round(totalPrice/2))}</span>
          </span>
        </div>

        {/* Right: Payment Form */}
        <div className="flex flex-col gap-4 sm:gap-6 w-full sm:max-w-md mx-auto lg:mx-0">
          {!publishableKeyMissing ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          ) : (
            <div className="text-sm text-gray-500">Configure `VITE_STRIPE_PUBLISHABLE_KEY` to enable the payment form.</div>
          )}
        </div>
      </div>

      {/* Footer spacing - checkout form contains its own buttons */}
      <div style={{ height: 24 }} />
    </div>
  );
};

export default Payment;
