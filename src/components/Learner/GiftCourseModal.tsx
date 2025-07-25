import React from 'react';
import { X, Mail, Gift, Check } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import { CouponInput } from './CouponInput';
import { CouponValidationResult } from '../../types';
import { useToast } from '../Auth/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface GiftCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  instructor: any;
}

export default function GiftCourseModal({ isOpen, onClose, course, instructor }: GiftCourseModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [recipientEmail, setRecipientEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<CouponValidationResult | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const PAYSTACK_PUBLIC_KEY = 'pk_test_78329ea72cb43b6435a12075cb3a2bca07ec53be';

  const handleCouponApplied = (result: CouponValidationResult) => setAppliedCoupon(result);
  const handleCouponRemoved = () => setAppliedCoupon(null);

  const handleGift = async () => {
    if (!recipientEmail) {
      showToast('Recipient email is required', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('http://localhost:4000/api/send-course-gift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipientEmail,
          courseId: course.id,
          message,
        }),
      });
      const data = await res.json();
      if (data.success) {
      setShowSuccess(true);
        setRecipientEmail('');
        setMessage('');
        setAppliedCoupon(null);
      } else {
        showToast(data.error || 'Failed to send course gift', 'error');
      }
    } catch (err) {
      showToast('Failed to send course gift', 'error');
    }
      setLoading(false);
  };

  const handleClose = () => {
    setShowSuccess(false);
    setRecipientEmail('');
    setMessage('');
    setAppliedCoupon(null);
    onClose();
  };

  if (!isOpen) return null;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-scale-in flex flex-col items-center">
          <Check className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Gift Sent!</h2>
          <div className="w-12 h-1 bg-green-100 rounded-full mb-4"></div>
          <p className="text-gray-700 text-center mb-6">
            Your gift has been sent to <span className="font-semibold text-blue-700">{recipientEmail}</span>.<br />
            The recipient will receive an email with instructions to redeem the course.
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-lg transition-colors shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Gift className="w-6 h-6 text-pink-500" /> Gift this Course</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Recipient Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient's Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="recipient@example.com"
            value={recipientEmail}
            onChange={e => setRecipientEmail(e.target.value)}
            required
          />
        </div>

        {/* Optional Message */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Write a message to the recipient..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={2}
          />
        </div>

        {/* Coupon Input */}
        <div className="mb-6">
          <CouponInput
            courseId={course.id}
            originalAmount={course.price}
            onCouponApplied={handleCouponApplied}
            onCouponRemoved={handleCouponRemoved}
            appliedCoupon={appliedCoupon || undefined}
          />
        </div>

        {/* Paystack Payment */}
        <PaystackButton
          publicKey={PAYSTACK_PUBLIC_KEY}
          email={user?.email || 'test@example.com'}
          amount={(appliedCoupon ? appliedCoupon.final_amount : course.price) * 100}
          currency="NGN"
          text="Pay & Send Gift"
          onSuccess={handleGift}
          onClose={onClose}
          metadata={{ 
            courseId: course.id, 
            userId: user?.id, 
            recipientEmail,
            message,
            couponId: appliedCoupon?.coupon_id,
            custom_fields: [] 
          }}
          className="bg-pink-500 hover:bg-pink-600 transition-colors text-white px-6 py-3 rounded-lg font-semibold text-lg w-full mb-3"
          disabled={loading || !recipientEmail}
        />

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 