import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';
import { supabase } from '../../lib/supabase';

interface RegisterFormProps {
  onToggleForm: () => void;
}

function useUserSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('settings').select('data').eq('id', 'user').single();
      setSettings(data?.data || null);
      setLoading(false);
    })();
  }, []);
  return { settings, loading };
}

export function RegisterForm() {
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    role: 'learner' | 'instructor' | 'admin';
    expertise: string;
    payoutEmail: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'learner',
    expertise: '',
    payoutEmail: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register, isLoading, isSupabaseConnected } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { settings: userSettings, loading: userSettingsLoading } = useUserSettings();

  // Get referral code from URL parameter
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Extract referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      console.log('Referral code found in URL:', refCode);
    }
  }, []);

  useEffect(() => {
    if (userSettings && userSettings.defaultUserRole) {
      setFormData(prev => ({ ...prev, role: userSettings.defaultUserRole }));
    }
  }, [userSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (userSettingsLoading) {
      setError('Loading registration settings...');
      return;
    }
    if (userSettings && userSettings.allowSelfRegistration === false) {
      setError('Registration is currently disabled.');
      showToast('Registration is currently disabled.', 'error', 5000);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      showToast('Passwords do not match', 'error', 5000);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      console.log('Attempting to register user with:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        password: formData.password,
        expertise: formData.role === 'instructor' ? formData.expertise : undefined,
        payoutEmail: formData.role === 'instructor' ? formData.payoutEmail : undefined,
        referralCode: referralCode, // Add referral code to registration data
      });
      
      console.log('Is Supabase connected:', isSupabaseConnected);
      
      await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: userSettings?.defaultUserRole || formData.role,
        expertise: formData.role === 'instructor' ? formData.expertise : undefined,
        payoutEmail: formData.role === 'instructor' ? formData.payoutEmail : undefined,
        referralCode: referralCode || undefined, // Pass referral code to registration
        bio: '',
        location: '',
        occupation: '',
        education: '',
        created_at: new Date().toISOString(),
      });
      
      console.log('Registration successful');
      localStorage.setItem('showEmailConfirmToast', 'true');
      showToast('Please check your email and confirm your account to continue.', 'confirmation', 20000);
      navigate('/');
      return;
    } catch (err: any) {
      let msg = 'Registration failed. Please try again.';
      if (err?.status === 409 || err?.message?.toLowerCase().includes('user already registered') || err?.message?.toLowerCase().includes('duplicate key value')) {
        msg = 'This email is already registered. Please log in or use a different email.';
      }
      setError(msg);
      showToast(msg, 'error', 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      role: e.target.checked ? 'instructor' : 'learner',
    }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left: Image (hidden on mobile) */}
      <div className="hidden md:block md:w-1/2 h-screen">
        <img
          src="/businessman-working-laptop.jpg"
          alt="Signup Visual"
          className="object-cover w-full h-full"
        />
      </div>
      {/* Right: Signup Form */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-2xl md:max-w-2xl md:w-[90vw] md:p-8 md:max-h-[90vh] md:overflow-y-auto md:scrollbar-thin md:scrollbar-thumb-blue-200 md:scrollbar-track-blue-50">
          <div className="flex flex-col items-center mb-8">
            {/* Logo or App Name */}
          <img 
            src="/BLACK-1-removebg-preview.png" 
            alt="SKILL SAGE" 
              className="h-12 w-auto mb-4"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            
            {/* Referral Code Indicator */}
            {referralCode && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4">
                <div className="flex items-center gap-2 text-green-700">
                  <span className="text-sm font-medium">🎁 Referral Bonus Applied!</span>
                  <span className="text-xs">You'll earn bonus coins when you complete your first course.</span>
                </div>
              </div>
            )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John"
                required
              />
            </div>
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Doe"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-orange-500">(This will also be your payout email)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
                  type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. +2348012345678"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
                  autoComplete="new-password"
            />
            <button
              type="button"
                  onClick={() => setShowPassword((prev: boolean) => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm your password"
              required
                  autoComplete="new-password"
            />
          </div>
        </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
          </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="learner">Learner</option>
                <option value="instructor">Instructor</option>
              </select>
        </div>

        {formData.role === 'instructor' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expertise</label>
              <input
                type="text"
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Web Development, Data Science"
                required
              />
            </div>
          </>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        {isSupabaseConnected && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
            Connected to Supabase - Your account will be created in the database
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
                onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
                Log in
          </button>
        </p>
          </div>
        </div>
      </div>
    </div>
  );
}