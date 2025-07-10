import React, { useState, useEffect } from 'react';
import { Header } from '../Layout/Header';
import { Sidebar } from '../Layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, BookOpen, Users, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function WelcomeInstructorModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex flex-col items-center text-center">
          <img src="/BLACK-1-removebg-preview.png" alt="TECHYX 360" className="h-16 w-auto mb-4" />
          <h2 className="text-2xl font-bold text-blue-700 mb-2">Welcome to TECHYX 360, Instructor!</h2>
          <p className="text-gray-700 mb-4">
            You're now an instructor on TECHYX 360.<br />
            To unlock all features and start earning, please verify your profile.
          </p>
          <button
            onClick={() => { onClose(); navigate('/instructor/profile'); }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Verify Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export function InstructorDashboard() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user?.role === 'instructor') {
      const dismissed = localStorage.getItem('instructorWelcomeModalDismissed');
      if (!dismissed) setShowWelcome(true);
    }
  }, [user]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('instructorWelcomeModalDismissed', 'true');
  };

  // Placeholder stats
  const stats = [
    { title: 'Courses', value: 3, icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Enrollments', value: 120, icon: Users, color: 'bg-green-500' },
    { title: 'Earnings', value: '₦150,000', icon: DollarSign, color: 'bg-purple-500' },
    { title: 'Pending Payouts', value: '₦20,000', icon: Clock, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {showWelcome && <WelcomeInstructorModal onClose={handleCloseWelcome} />}
          {/* Welcome and Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Welcome, {user?.firstName} {user?.isApproved && <CheckCircle className="inline w-6 h-6 text-green-600 ml-1" />}
              </h1>
              <p className="text-gray-600">Here's your instructor dashboard overview</p>
            </div>
            <div className="flex items-center gap-4">
              <img src="/BLACK-1-removebg-preview.png" alt="TECHYX 360" className="h-10 w-auto opacity-60" />
            </div>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Main Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* My Courses */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">My Courses</h2>
              <div className="text-gray-500">(Course list and management coming soon...)</div>
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">Create New Course</button>
            </div>
            {/* Earnings & Payouts */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Earnings & Payouts</h2>
              <div className="text-gray-500">(Earnings summary and payout history coming soon...)</div>
              <button className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">Request Payout</button>
            </div>
          </div>
          {/* Notifications & Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Notifications</h2>
              <div className="flex items-center gap-2 text-yellow-600 mb-2"><AlertCircle className="w-5 h-5" /> (Notifications and messages coming soon...)</div>
            </div>
            {/* Profile & Verification */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Profile & Verification</h2>
              <div className="mb-2">Profile status: <span className="font-medium text-blue-700">{user?.isApproved ? 'Verified' : 'Pending Verification'}</span></div>
              <a href="/instructor/profile" className="text-blue-600 underline">Edit Profile / Upload ID</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 