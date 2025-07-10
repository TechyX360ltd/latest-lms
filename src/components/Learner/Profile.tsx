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
  GraduationCap,
  Award,
  Clock,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useGamification } from '../../hooks/useGamification';

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

export function Profile() {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user profile data
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

  const { stats: gamificationStats, loading: gamificationLoading } = useGamification();

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};
    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!profileData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user profile in localStorage and context
      const updatedUser = {
        ...user,
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      // Update in localStorage
      const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
      const updatedUsers = allUsers.map((u: any) => 
        u.id === user?.id ? { ...u, ...profileData } : u
      );
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Update context if updateUserProfile function exists
      if (updateUserProfile) {
        updateUserProfile(profileData);
      }

      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify current password (in real app, this would be done on server)
      const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
      const currentUser = allUsers.find((u: any) => u.id === user?.id);
      
      if (currentUser?.password !== passwordData.currentPassword) {
        setErrors({ currentPassword: 'Current password is incorrect' });
        return;
      }

      // Update password in localStorage
      const updatedUsers = allUsers.map((u: any) => 
        u.id === user?.id ? { ...u, password: passwordData.newPassword } : u
      );
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));

      setSuccessMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB');
        return;
      }
      setIsLoading(true);
      setErrorMessage('');
      try {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, 'lms-avatars');
        setProfileData(prev => ({ ...prev, avatar: result.secure_url }));
        setSuccessMessage('Profile photo uploaded!');
      } catch (err) {
        setErrorMessage('Failed to upload image. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeAvatar = () => {
    setProfileData(prev => ({ ...prev, avatar: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Calculate profile completion percentage
  const getProfileCompletion = () => {
    const fields = ['firstName', 'lastName', 'email', 'phone', 'bio', 'location', 'occupation', 'education'];
    const completedFields = fields.filter(field => profileData[field as keyof ProfileData]?.toString().trim());
    const avatarBonus = profileData.avatar ? 1 : 0;
    return Math.round(((completedFields.length + avatarBonus) / (fields.length + 1)) * 100);
  };

  const profileCompletion = getProfileCompletion();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            My Profile
          </h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        
        {/* Profile Completion */}
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
            <div className={`w-3 h-3 rounded-full ${profileCompletion === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  profileCompletion === 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-gray-900">{profileCompletion}%</span>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
        <div className="flex">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'password'
                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Lock className="w-5 h-5" />
            Change Password
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'preferences'
                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            Learning Stats
          </button>
        </div>
      </div>

      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-12 text-white">
            <div className="flex items-center gap-8">
              {/* Avatar Section */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-white/20 border-4 border-white/30 shadow-xl">
                  {profileData.avatar ? (
                    <img
                      src={profileData.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10">
                      <User className="w-16 h-16 text-white/70" />
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
                      title="Upload Photo"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                    {profileData.avatar && (
                      <button
                        onClick={removeAvatar}
                        className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
                        title="Remove Photo"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    )}
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">
                  {profileData.firstName} {profileData.lastName}
                  {gamificationStats?.badges && gamificationStats.badges.length > 0 && (
                    <span className="ml-4 align-middle inline-flex items-center gap-2">
                      {gamificationStats.badges.map((userBadge: any, idx: number) =>
                        userBadge.badge?.icon_url ? (
                          <img key={userBadge.badge.id} src={userBadge.badge.icon_url} alt={userBadge.badge.name} className="inline w-8 h-8 object-contain" title={userBadge.badge.name} />
                        ) : (
                          <Award key={userBadge.badge?.id || userBadge.id} className="inline w-8 h-8 text-yellow-400" />
                        )
                      )}
                    </span>
                  )}
                </h2>
                <p className="text-blue-100 text-lg mb-1">{profileData.email}</p>
                <p className="text-blue-200">{profileData.phone}</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Joined {new Date(user?.createdAt || '').toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">{user?.enrolledCourses?.length || 0} Courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    <span className="text-sm">{user?.completedCourses?.length || 0} Completed</span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 backdrop-blur-sm"
                  >
                    <Edit3 className="w-5 h-5" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setProfileData({
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
                        setErrors({});
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleProfileSubmit} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isEditing ? 'bg-gray-50 text-gray-600' : ''} ${errors.firstName ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter your first name"
                    />
                  </div>
                  {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isEditing ? 'bg-gray-50 text-gray-600' : ''} ${errors.lastName ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter your last name"
                    />
                  </div>
                  {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : ''
                      } ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : ''
                      } ${errors.phone ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : ''
                    } border-gray-300`}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : ''
                      } border-gray-300`}
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={profileData.occupation}
                      onChange={(e) => handleInputChange('occupation', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : ''
                      } border-gray-300`}
                      placeholder="Your job title or profession"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={profileData.education}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : ''
                      } border-gray-300`}
                      placeholder="Your highest education level"
                    />
                  </div>
                </div>

                {/* Profile Completion Tips */}
                {profileCompletion < 100 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Complete Your Profile</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Add the missing information to reach 100% profile completion:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {!profileData.bio && <li>• Add a bio to tell others about yourself</li>}
                      {!profileData.location && <li>• Add your location</li>}
                      {!profileData.occupation && <li>• Add your occupation</li>}
                      {!profileData.education && <li>• Add your education background</li>}
                      {!profileData.avatar && <li>• Upload a profile photo</li>}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
              <p className="text-gray-600">Update your password to keep your account secure</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.currentPassword && <p className="text-red-600 text-sm mt-1">{errors.currentPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.newPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Password Requirements:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className={`flex items-center gap-2 ${passwordData.newPassword.length >= 6 ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least 6 characters long
                  </li>
                  <li className={`flex items-center gap-2 ${passwordData.newPassword !== passwordData.currentPassword && passwordData.newPassword ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordData.newPassword !== passwordData.currentPassword && passwordData.newPassword ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Different from current password
                  </li>
                  <li className={`flex items-center gap-2 ${passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Passwords match
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Learning Stats Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Statistics</h2>
            <p className="text-gray-600">Your learning journey at a glance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-100">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{user?.enrolledCourses?.length || 0}</p>
              <p className="text-sm text-blue-700">Enrolled Courses</p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-100">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-green-600">{user?.completedCourses?.length || 0}</p>
              <p className="text-sm text-green-700">Completed Courses</p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-100">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-purple-600">{user?.completedCourses?.length || 0}</p>
              <p className="text-sm text-purple-700">Certificates Earned</p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-bold text-indigo-900">Account Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-indigo-800">Member Since:</span>
                <p className="text-indigo-700">{new Date(user?.createdAt || '').toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-indigo-800">Account Type:</span>
                <p className="text-indigo-700 capitalize">{user?.role}</p>
              </div>
              <div>
                <span className="font-medium text-indigo-800">Profile Completion:</span>
                <p className="text-indigo-700">{profileCompletion}%</p>
              </div>
              <div>
                <span className="font-medium text-indigo-800">Last Updated:</span>
                <p className="text-indigo-700">Today</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}