import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './ToastContext';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../../hooks/useGamification';
import { supabase } from '../../lib/supabase';

interface LoginFormProps {
  onToggleForm: () => void;
  formData: any;
  setFormData: any;
  error: string;
  setError: any;
  showPassword: boolean;
  setShowPassword: any;
}

export function LoginForm({
  formData,
  setFormData,
  error,
  setError,
  showPassword,
  setShowPassword
}: Omit<LoginFormProps, 'onToggleForm'>) {
  const { login, isLoading, isSupabaseConnected, resetPassword, user } = useAuth();
  const { showToast } = useToast();
  const { triggerDailyLogin } = useGamification();
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const navigate = useNavigate();

  // Prefill email if remembered
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData((prev: any) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, [setFormData]);

  useEffect(() => {
    if (localStorage.getItem('showEmailConfirmToast')) {
      showToast('Please check your email and confirm your account to continue.', 'confirmation', 20000);
      localStorage.removeItem('showEmailConfirmToast');
    }
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', formData.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    try {
      await login(formData.email, formData.password);
      await triggerDailyLogin(); // <-- Update streak and award daily login bonus
      showToast('Login successful!', 'success', 4000);
      // Fetch the latest user profile from Supabase to get the correct role
      const { data: authData } = await supabase.auth.getUser();
      const id = authData?.user?.id;
      if (id) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', id)
          .single();
        if (profile?.role === 'admin') {
          navigate('/admin/overview');
        } else if (profile?.role === 'instructor') {
          navigate('/instructor/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      let msg = 'Login failed. Please try again.';
      let details = '';
      let type = 'error';
      if (err?.message?.toLowerCase().includes('invalid login credentials')) {
        details = 'Invalid email or password.';
      } else if (err?.message?.toLowerCase().includes('email not confirmed') || err?.message?.toLowerCase().includes('user not confirmed')) {
        msg = 'Login failed.';
        details = 'Please confirm your email before logging in.';
        type = 'confirmation';
      }
      setError(details || msg);
      showToast(msg, type as any, type === 'confirmation' ? 20000 : 5000, details);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotModal(true);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(forgotEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    try {
      await resetPassword(forgotEmail);
      setForgotSuccess(true);
      showToast('A link to reset your password has been sent to your mail', 'success', 6000);
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to send reset link. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left: Image (hidden on mobile) */}
      <div className="hidden md:block md:w-1/2 h-screen">
        <img
          src="/man-wearing-glasses-reading-from-his-digital-tablet.jpg"
          alt="Login Visual"
          className="object-cover w-full h-full"
        />
      </div>
      {/* Right: Login Form */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            {/* Logo or App Name */}
          <img 
            src="/BLACK-1-removebg-preview.png" 
            alt="TECHYX 360" 
              className="h-12 w-auto mb-4"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
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
                Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev: boolean) => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600 rounded mr-2"
              />
              Remember Me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Forgot Password?
            </button>
          </div>
        </div>
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}
        {isSupabaseConnected && (
          <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
            Connected to Supabase - Your login will be authenticated with the database
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
                onClick={() => navigate('/signup')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
                Signup
          </button>
        </p>
          </div>
        </div>
      </div>
    </div>
  );
}