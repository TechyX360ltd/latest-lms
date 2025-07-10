import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Coupon, CouponUsage, CouponStatistics } from '../types';

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponUsage, setCouponUsage] = useState<CouponUsage[]>([]);
  const [statistics, setStatistics] = useState<CouponStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCoupons(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('coupon_usage')
        .select('*')
        .order('used_at', { ascending: false });
      
      if (error) throw error;
      setCouponUsage(data || []);
    } catch (err: any) {
      console.error('Error fetching coupon usage:', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_coupon_statistics');
      if (error) throw error;
      setStatistics(data[0] || null);
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
    }
  };

  const createCoupon = async (couponData: Partial<Coupon>) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert([couponData])
        .select()
        .single();
      
      if (error) throw error;
      
      setCoupons([data, ...coupons]);
      await fetchStatistics();
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create coupon');
    }
  };

  const updateCoupon = async (id: string, updates: Partial<Coupon>) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setCoupons(coupons.map(c => c.id === id ? data : c));
      await fetchStatistics();
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update coupon');
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCoupons(coupons.filter(c => c.id !== id));
      await fetchStatistics();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete coupon');
    }
  };

  const validateCoupon = async (
    couponCode: string,
    userId: string,
    courseId: string,
    originalAmount: number
  ) => {
    try {
      const { data, error } = await supabase.rpc('validate_and_apply_coupon', {
        p_coupon_code: couponCode,
        p_user_id: userId,
        p_course_id: courseId,
        p_original_amount: originalAmount
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to validate coupon');
    }
  };

  const getAvailableCoupons = async (userId: string, courseId?: string) => {
    try {
      const { data, error } = await supabase.rpc('get_available_coupons', {
        p_user_id: userId,
        p_course_id: courseId || null
      });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching available coupons:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchCouponUsage();
    fetchStatistics();
  }, []);

  return {
    coupons,
    couponUsage,
    statistics,
    loading,
    error,
    fetchCoupons,
    fetchCouponUsage,
    fetchStatistics,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    getAvailableCoupons
  };
} 