import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function CouponTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const createTestCoupon = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          code: 'TEST20',
          name: 'Test 20% Off',
          description: 'Test coupon for 20% discount',
          discount_type: 'percentage',
          discount_value: 20,
          minimum_purchase: 1000,
          maximum_discount: 5000,
          usage_limit: 10,
          is_active: true,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        }])
        .select()
        .single();

      if (error) throw error;
      setTestResult(`✅ Test coupon created successfully: ${data.code}`);
    } catch (error: any) {
      setTestResult(`❌ Error creating test coupon: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCouponValidation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_and_apply_coupon', {
        p_coupon_code: 'TEST20',
        p_user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
        p_course_id: 'test-course-id',
        p_original_amount: 5000
      });

      if (error) throw error;
      setTestResult(`✅ Coupon validation test: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setTestResult(`❌ Error testing coupon validation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkCouponStatistics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_coupon_statistics');
      if (error) throw error;
      setTestResult(`✅ Coupon statistics: ${JSON.stringify(data[0], null, 2)}`);
    } catch (error: any) {
      setTestResult(`❌ Error fetching statistics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Coupon System Test</h2>
      
      <div className="space-y-4">
        <button
          onClick={createTestCoupon}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Test Coupon'}
        </button>

        <button
          onClick={testCouponValidation}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 ml-2"
        >
          {loading ? 'Testing...' : 'Test Coupon Validation'}
        </button>

        <button
          onClick={checkCouponStatistics}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 ml-2"
        >
          {loading ? 'Loading...' : 'Check Statistics'}
        </button>
      </div>

      {testResult && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  );
} 