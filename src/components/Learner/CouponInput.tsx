import React, { useState } from 'react';
import { Check, X, Tag, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CouponValidationResult } from '../../types';

interface CouponInputProps {
  courseId: string;
  originalAmount: number;
  onCouponApplied: (result: CouponValidationResult) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: CouponValidationResult;
}

export function CouponInput({ 
  courseId, 
  originalAmount, 
  onCouponApplied, 
  onCouponRemoved, 
  appliedCoupon 
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('validate_and_apply_coupon', {
        p_coupon_code: couponCode.trim().toUpperCase(),
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_course_id: courseId,
        p_original_amount: originalAmount
      });

      if (error) throw error;

      const result = data as CouponValidationResult;
      
      if (result.success) {
        onCouponApplied(result);
        setCouponCode('');
        setError(null);
      } else {
        setError(result.error || 'Failed to apply coupon');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemoved();
    setError(null);
  };

  const formatDiscount = (result: CouponValidationResult) => {
    if (result.discount_type === 'percentage') {
      return `${result.discount_value}% off`;
    } else {
      return `₦${result.discount_amount?.toLocaleString()} off`;
    }
  };

  return (
    <div className="space-y-4">
      {!appliedCoupon ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Have a coupon code?</h3>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={loading || !couponCode.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Check className="w-4 h-4" />
              )}
              Apply
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-green-900">
                  Coupon Applied: {appliedCoupon.coupon_name}
                </div>
                <div className="text-sm text-green-700">
                  {formatDiscount(appliedCoupon)} • You saved ₦{appliedCoupon.discount_amount?.toLocaleString()}
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-green-600 hover:text-green-800 transition-colors"
              title="Remove coupon"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {appliedCoupon && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-900">Original Price:</span>
            <span className="text-blue-900 font-medium">₦{originalAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-blue-900">Discount:</span>
            <span className="text-green-600 font-medium">-₦{appliedCoupon.discount_amount?.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-lg font-bold mt-2 pt-2 border-t border-blue-200">
            <span className="text-blue-900">Final Price:</span>
            <span className="text-blue-900">₦{appliedCoupon.final_amount?.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
} 