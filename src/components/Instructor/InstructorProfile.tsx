import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Eye,
  EyeOff,
  Lock,
  Edit3,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { Header } from '../Layout/Header';
import { Sidebar } from '../Layout/Sidebar';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  occupation: string;
  education: string;
  avatar: string | null;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function InstructorProfile() {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load instructor profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    occupation: user?.occupation || '',
    education: user?.education || '',
    avatar: user?.avatar || null
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};
    if (!profileData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!profileData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!profileData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(profileData.email)) newErrors.email = 'Email is invalid';
    if (!profileData.phone.trim()) newErrors.phone = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) newErrors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (passwordData.currentPassword === passwordData.newPassword) newErrors.newPassword = 'New password must be different from current password';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedUser = { ...user, ...profileData, updatedAt: new Date().toISOString() };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (updateUserProfile) updateUserProfile(profileData);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsLoading(true);
    try {
      const result = await uploadToCloudinary(e.target.files[0]);
      setProfileData(prev => ({ ...prev, avatar: result.secure_url }));
      setSuccessMessage('Profile photo uploaded!');
    } catch (error) {
      setErrorMessage('Failed to upload photo.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAvatar = () => {
    setProfileData(prev => ({ ...prev, avatar: null }));
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  // Profile completion calculation
  const fields = ['firstName', 'lastName', 'email', 'phone', 'bio', 'location', 'occupation', 'education'];
  const getProfileCompletion = () => {
    const completedFields = fields.filter(field => profileData[field as keyof ProfileData]?.toString().trim());
    const avatarBonus = profileData.avatar ? 1 : 0;
    return Math.round(((completedFields.length + avatarBonus) / (fields.length + 1)) * 100);
  };
  const profileCompletion = getProfileCompletion();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-3xl mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6 text-center">My Profile</h1>
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-blue-200" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-5xl text-blue-400 border-4 border-blue-200">
                    <User />
                  </div>
                )}
                <button
                  className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow hover:bg-blue-50 border border-blue-200"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload Photo"
                >
                  <Camera className="w-5 h-5 text-blue-500" />
                </button>
                {profileData.avatar && (
                  <button
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 border border-red-200"
                    onClick={removeAvatar}
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                  <div className={`w-3 h-3 rounded-full ${profileCompletion === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={profileCompletion === 100 ? 'bg-green-500 h-2 rounded-full' : 'bg-blue-500 h-2 rounded-full'}
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900">{profileCompletion}%</span>
              </div>
            </div>
            <div className="flex justify-center mb-8">
              <div className="flex gap-4">
                <button
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-blue-700 hover:bg-blue-50'}`}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile Info
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-blue-700 hover:bg-blue-50'}`}
                  onClick={() => setActiveTab('password')}
                >
                  Change Password
                </button>
              </div>
            </div>
            {successMessage && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4 text-center font-medium flex items-center gap-2 justify-center">
                <CheckCircle className="w-5 h-5" /> {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg mb-4 text-center font-medium flex items-center gap-2 justify-center">
                <AlertCircle className="w-5 h-5" /> {errorMessage}
              </div>
            )}
            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={profileData.firstName}
                      onChange={e => handleInputChange('firstName', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.firstName && <div className="text-red-600 text-xs mt-1">{errors.firstName}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={profileData.lastName}
                      onChange={e => handleInputChange('lastName', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.lastName && <div className="text-red-600 text-xs mt-1">{errors.lastName}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={profileData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.email && <div className="text-red-600 text-xs mt-1">{errors.email}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={profileData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      disabled={isLoading}
                    />
                    {errors.phone && <div className="text-red-600 text-xs mt-1">{errors.phone}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={profileData.bio}
                      onChange={e => handleInputChange('bio', e.target.value)}
                      disabled={isLoading}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={profileData.location}
                      onChange={e => handleInputChange('location', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={profileData.occupation}
                      onChange={e => handleInputChange('occupation', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={profileData.education}
                      onChange={e => handleInputChange('education', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  {!isEditing ? (
                    <button
                      type="button"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        onClick={() => { setIsEditing(false); setProfileData({
                          firstName: user?.firstName || '',
                          lastName: user?.lastName || '',
                          email: user?.email || '',
                          phone: user?.phone || '',
                          bio: user?.bio || '',
                          location: user?.location || '',
                          occupation: user?.occupation || '',
                          education: user?.education || '',
                          avatar: user?.avatar || null
                        }); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}
            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={passwordData.currentPassword}
                        onChange={e => handlePasswordChange('currentPassword', e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2 text-gray-400 hover:text-blue-500"
                        onClick={() => setShowCurrentPassword(v => !v)}
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.currentPassword && <div className="text-red-600 text-xs mt-1">{errors.currentPassword}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={passwordData.newPassword}
                        onChange={e => handlePasswordChange('newPassword', e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2 text-gray-400 hover:text-blue-500"
                        onClick={() => setShowNewPassword(v => !v)}
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.newPassword && <div className="text-red-600 text-xs mt-1">{errors.newPassword}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={passwordData.confirmPassword}
                        onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2 text-gray-400 hover:text-blue-500"
                        onClick={() => setShowConfirmPassword(v => !v)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <div className="text-red-600 text-xs mt-1">{errors.confirmPassword}</div>}
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 