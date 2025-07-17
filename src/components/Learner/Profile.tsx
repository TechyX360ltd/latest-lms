import React, { useState, useRef, useEffect } from 'react';
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
  BookOpen,
  XCircle,
  Star,
  Users,
  DollarSign,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useGamification } from '../../hooks/useGamification';
import InstructorStatsCard from '../Instructor/InstructorStatsCard';
import { supabase } from '../../lib/supabase';

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

// Add a helper for badge rendering
function VerificationBadge({ status }: { status: string }) {
  if (status === 'verified') {
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mt-2"> <CheckCircle className="w-4 h-4 text-green-500" /> Verified </span>;
  }
  if (status === 'pending') {
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold mt-2"> <Clock className="w-4 h-4 text-yellow-500" /> Verification in progress </span>;
  }
  if (status === 'rejected') {
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold mt-2"> <XCircle className="w-4 h-4 text-red-500" /> Verification rejected </span>;
  }
  return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold mt-2"> <AlertCircle className="w-4 h-4 text-gray-500" /> Unverified </span>;
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
  const [refreshing, setRefreshing] = useState(false);

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

  // Add state for ID upload
  const [verificationIdFile, setVerificationIdFile] = useState<File | null>(null);
  const [verificationIdUrl, setVerificationIdUrl] = useState((user as any)?.verification_id_url || '');
  const [verificationUploading, setVerificationUploading] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Fetch latest user data from Supabase
  const fetchLatestUser = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setProfileData({
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        location: data.location,
        occupation: data.occupation,
        education: data.education,
        avatar: data.avatar_url || null,
      });
      setVerificationIdUrl(data.verification_id_url || '');
      if (updateUserProfile) {
        updateUserProfile({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          location: data.location,
          occupation: data.occupation,
          education: data.education,
          avatar: data.avatar_url || null,
          verification_status: data.verification_status,
          verification_id_url: data.verification_id_url,
          verification_rejection_reason: data.verification_rejection_reason,
        });
      }
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLatestUser();
    // eslint-disable-next-line
  }, [user?.id]);

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
      // Use Supabase Auth to update the password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });
      if (error) {
        setErrorMessage(error.message || 'Failed to change password. Please try again.');
        return;
      }
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

  // Handle ID upload
  const handleVerificationIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVerificationUploading(true);
    setVerificationError('');
    try {
      // Assume uploadToCloudinary returns a URL
      const result = await uploadToCloudinary(file, 'lms-verification-ids');
      setVerificationIdUrl(result.secure_url);
      setVerificationIdFile(file);
      setSuccessMessage('ID uploaded! Click Save Changes to submit for verification.');
    } catch (err) {
      setVerificationError('Failed to upload ID. Please try again.');
    } finally {
      setVerificationUploading(false);
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
        {/* Refresh Button for Instructors */}
        {user?.role === 'instructor' && (
          <button
            onClick={fetchLatestUser}
            disabled={refreshing}
            className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
            title="Refresh profile from server"
          >
            {refreshing ? (
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l5-5-5-5v4a10 10 0 00-10 10h4z"></path></svg>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19.364A9 9 0 104.582 9.582" /></svg>
                Refresh
              </>
            )}
          </button>
        )}
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
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6 text-white">
            <div className="flex items-center gap-8">
              {/* Avatar Section */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-white/20 border-4 border-white/30 shadow-xl relative">
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
                  {/* Verification tick overlay */}
                  {user?.role === 'instructor' && user?.verification_status === 'verified' && (
                    <span className="absolute bottom-2 right-2 bg-green-500 rounded-full p-1 border-2 border-white">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </span>
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
                  {(
                    (user?.first_name && user?.last_name)
                      ? `${user.first_name} ${user.last_name}`
                    : ((user as any)?.firstName && (user as any)?.lastName)
                      ? `${(user as any).firstName} ${(user as any).lastName}`
                    : (profileData.firstName && profileData.lastName)
                      ? `${profileData.firstName} ${profileData.lastName}`
                    : (user?.first_name || user?.last_name)
                      ? `${user.first_name || ''}${user?.last_name ? ' ' + user.last_name : ''}`
                    : ((user as any)?.firstName)
                      ? `${(user as any).firstName}${(user as any).lastName ? ' ' + (user as any).lastName : ''}`
                    : (profileData.firstName || profileData.lastName)
                      ? `${profileData.firstName || ''}${profileData.lastName ? ' ' + profileData.lastName : ''}`
                    : 'Unnamed User'
                  )}
                  {gamificationStats?.badges && gamificationStats.badges.length > 0 && (
                    <span className="ml-2 align-middle inline-flex items-center gap-1">
                      {gamificationStats.badges.map((userBadge: any, idx: number) =>
                        userBadge.badge?.icon_url ? (
                          <span key={userBadge.badge.id} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 shadow mr-1" style={{ aspectRatio: '1/1' }}>
                            <img
                              src={userBadge.badge.icon_url}
                              alt={userBadge.badge.name}
                              className="w-5 h-5 object-contain"
                              title={userBadge.badge.name}
                              style={{ aspectRatio: '1/1' }}
                            />
                          </span>
                        ) : (
                          <span key={userBadge.badge?.id || userBadge.id} className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 shadow mr-1" style={{ aspectRatio: '1/1' }}>
                            <Award className="w-5 h-5 text-yellow-400" />
                          </span>
                        )
                      )}
                    </span>
                  )}
                </h2>
                {/* Verification badge for instructors */}
                {user?.role === 'instructor' && (
                  <VerificationBadge status={(user as any)?.verification_status || 'unverified'} />
                )}
                <p className="text-blue-100 text-lg mb-1">{profileData.email}</p>
                <p className="text-blue-200">{profileData.phone}</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Joined {
                        (user?.created_at && !isNaN(Date.parse(user.created_at)))
                          ? new Date(user.created_at).toLocaleDateString()
                        : ((user as any)?.createdAt && !isNaN(Date.parse((user as any).createdAt)))
                          ? new Date((user as any).createdAt).toLocaleDateString()
                        : ((profileData as any)?.created_at && !isNaN(Date.parse((profileData as any).created_at)))
                          ? new Date((profileData as any).created_at).toLocaleDateString()
                        : ((profileData as any)?.createdAt && !isNaN(Date.parse((profileData as any).createdAt)))
                          ? new Date((profileData as any).createdAt).toLocaleDateString()
                        : (user?.updated_at && !isNaN(Date.parse(user.updated_at)))
                          ? new Date(user.updated_at).toLocaleDateString()
                        : ((user as any)?.updatedAt && !isNaN(Date.parse((user as any).updatedAt)))
                          ? new Date((user as any).updatedAt).toLocaleDateString()
                        : ((profileData as any)?.updated_at && !isNaN(Date.parse((profileData as any).updated_at)))
                          ? new Date((profileData as any).updated_at).toLocaleDateString()
                        : ((profileData as any)?.updatedAt && !isNaN(Date.parse((profileData as any).updatedAt)))
                          ? new Date((profileData as any).updatedAt).toLocaleDateString()
                        : 'Unknown'
                      }
                    </span>
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

                {/* Move the instructor verification card here, above the profile completion card */}
                {user?.role === 'instructor' && (
                  user?.verification_status === 'verified' ? (
                    <div className="bg-green-50 border-2 border-green-400 rounded-xl p-5 flex flex-col gap-3 shadow-md relative">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-7 h-7 text-green-500 animate-bounce" />
                        <span className="text-lg font-bold text-green-800">You are a Verified Instructor!</span>
                      </div>
                      <p className="text-green-900 text-sm mb-2">
                        Congratulations! Your instructor profile has been verified. You now have access to all instructor features.
                      </p>
                    </div>
                  ) : (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 flex flex-col gap-3 shadow-md relative animate-pulse focus-within:animate-none">
                    <div className="flex items-center gap-3 mb-2">
                      <ShieldAlert className="w-7 h-7 text-yellow-500 animate-bounce" />
                      <span className="text-lg font-bold text-yellow-800">Verify Your Instructor Profile</span>
                    </div>
                    <p className="text-yellow-900 text-sm mb-2">
                      To unlock all instructor features, please upload a valid government-issued ID for verification.<br/>
                      <span className="font-medium">Accepted: NIN, Driver's License, Voter's Card, Int'l Passport</span>
                    </p>
                    <label className="block">
                      <span className="text-sm font-medium text-yellow-900 mb-1 block">Upload ID Document</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleVerificationIdUpload}
                          className={`block w-full text-sm text-yellow-900 border border-yellow-300 rounded-lg ${isEditing ? 'cursor-pointer bg-yellow-100' : 'cursor-not-allowed bg-yellow-50 opacity-60'} focus:outline-none focus:ring-2 focus:ring-yellow-400`}
                          disabled={!isEditing || verificationUploading || isLoading}
                        />
                        <Upload className="w-6 h-6 text-yellow-500" />
                      </div>
                    </label>
                    {verificationIdUrl && (
                      <div className="mt-2 text-xs text-yellow-800">Uploaded: <a href={verificationIdUrl} target="_blank" rel="noopener noreferrer" className="underline">View ID</a></div>
                    )}
                    {verificationUploading && <div className="text-xs text-yellow-700 mt-1">Uploading...</div>}
                    {verificationError && <div className="text-xs text-red-600 mt-1">{verificationError}</div>}
                    {(user as any)?.verification_status === 'rejected' && (
                      <div className="text-xs text-red-600 mt-1">Your previous verification was rejected. Please upload a valid ID.</div>
                    )}
                    {(user as any)?.verification_status === 'unverified' && !verificationIdUrl && (
                      <div className="mt-2 text-xs text-yellow-900 font-semibold animate-pulse">You have not uploaded any ID yet. Please verify to continue as an instructor.</div>
                    )}
                    {(user as any)?.verification_status === 'pending' && (
                      <div className="mt-2 text-xs text-yellow-700 font-semibold">Your verification is in progress. You will be notified once reviewed.</div>
                    )}
                  </div>
                  )
                )}

                {/* Profile Completion Tips - now compact */}
                {profileCompletion < 100 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <h4 className="font-semibold text-blue-900 mb-1">Complete Your Profile</h4>
                    <ul className="list-disc pl-5 text-blue-700 space-y-0.5">
                      {!profileData.bio && <li>Add a bio</li>}
                      {!profileData.location && <li>Add your location</li>}
                      {!profileData.occupation && <li>Add your occupation</li>}
                      {!profileData.education && <li>Add your education</li>}
                      {!profileData.avatar && <li>Upload a profile photo</li>}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {user?.role === 'instructor' ? 'Instructor Statistics' : 'Learning Statistics'}
            </h2>
            <p className="text-gray-600">
              {user?.role === 'instructor'
                ? 'Your instructor journey at a glance'
                : 'Your learning journey at a glance'}
            </p>
          </div>

          {/* Instructor Stats (only for instructors) */}
          {user?.role === 'instructor' && <InstructorStatsCard />}

          {/* Learner Stats (only for learners) */}
          {user?.role !== 'instructor' && (
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
          )}

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