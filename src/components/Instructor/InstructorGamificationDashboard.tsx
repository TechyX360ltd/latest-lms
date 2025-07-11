import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Coins,
  Flame,
  Award,
  TrendingUp,
  Store,
  Target,
  Star,
  Calendar,
  Zap,
  Crown,
  Gift,
  PlusCircle,
  DollarSign,
  ShoppingBag,
  Smile,
  Sparkles,
  Lock
} from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import { useAuth } from '../../context/AuthContext';
import { StoreFront } from '../Gamification/StoreFront';
import { BadgeCollection } from '../Gamification/BadgeCollection';
import { Leaderboard } from '../Gamification/Leaderboard';
import { ActivityFeed } from '../Gamification/ActivityFeed';
import { useNavigate } from 'react-router-dom';

// Tabs for the dashboard
const tabs = [
  { id: 'overview', label: 'Overview', icon: Trophy },
  { id: 'badges', label: 'Badges', icon: Award },
  { id: 'store', label: 'Store', icon: Store },
  { id: 'leaderboard', label: 'Leaderboard', icon: Crown },
  { id: 'activity', label: 'Activity', icon: Calendar },
];

type TabType = typeof tabs[number]['id'];

export default function InstructorGamificationDashboard() {
  const { stats, loading, error, loadUserEvents } = useGamification();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const navigate = useNavigate();

  // Withdraw modal state (copied from InstructorDashboard)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(1);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawFee, setWithdrawFee] = useState(0);
  const [withdrawNet, setWithdrawNet] = useState(0);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const withdrawInputRef = useRef<HTMLInputElement>(null);
  const [bankList, setBankList] = useState<any[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountResolving, setAccountResolving] = useState(false);
  const [accountError, setAccountError] = useState('');

  useEffect(() => {
    const fetchBanks = async () => {
      setBankLoading(true);
      try {
        const res = await fetch('https://api.paystack.co/bank?country=nigeria', {
          headers: { Authorization: 'Bearer pk_test_78329ea72cb43b6435a12075cb3a2bca07ec53be' }
        });
        const data = await res.json();
        setBankList(data.data || []);
      } catch (e) {
        setBankList([]);
      }
      setBankLoading(false);
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    const resolveAccount = async () => {
      if (accountNumber.length === 10 && selectedBank) {
        setAccountResolving(true);
        setAccountError('');
        setAccountName('');
        try {
          const res = await fetch(`http://localhost:5001/api/resolve-account?account_number=${accountNumber}&bank_code=${selectedBank}`);
          const data = await res.json();
          if (data.status && data.data && data.data.account_name) {
            setAccountName(data.data.account_name);
          } else {
            setAccountError('Could not resolve account. Please check details.');
          }
        } catch (e) {
          setAccountError('Could not resolve account. Please try again.');
        }
        setAccountResolving(false);
      } else {
        setAccountName('');
        setAccountError('');
      }
    };
    resolveAccount();
  }, [accountNumber, selectedBank]);

  const calculateFee = (amount: number) => {
    if (isNaN(amount) || amount <= 0) return { fee: 0, net: 0 };
    let fee = amount * 0.015;
    if (amount >= 2500) fee += 100;
    fee = Math.min(fee, 2000);
    if (amount < 2500) fee -= 100;
    if (fee < 0) fee = 0;
    return { fee: Math.round(fee), net: Math.round(amount - fee) };
  };

  const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    setWithdrawAmount(val);
    const { fee, net } = calculateFee(Number(val));
    setWithdrawFee(fee);
    setWithdrawNet(net);
    setWithdrawError('');
  };

  const handleWithdrawProceed = () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      setWithdrawError('Enter a valid amount');
      return;
    }
    if (Number(withdrawAmount) > 150000) {
      setWithdrawError('You cannot withdraw more than your available balance.');
      return;
    }
    setWithdrawStep(2);
    setTimeout(() => withdrawInputRef.current?.focus(), 100);
  };

  const handleWithdrawConfirm = () => {
    setWithdrawLoading(true);
    setTimeout(() => {
      setWithdrawLoading(false);
      if (withdrawPassword === 'password123') {
        setWithdrawSuccess(true);
        setWithdrawStep(3);
        // Placeholder for real email notification
        // console.log(`Email sent to user: Withdrawal of ₦${withdrawNet.toLocaleString()} successful!`);
      } else {
        setWithdrawError('Incorrect password. Please try again.');
      }
    }, 1200);
  };

  const closeWithdrawModal = () => {
    setShowWithdrawModal(false);
    setWithdrawStep(1);
    setWithdrawAmount('');
    setWithdrawFee(0);
    setWithdrawNet(0);
    setWithdrawError('');
    setWithdrawPassword('');
    setWithdrawLoading(false);
    setWithdrawSuccess(false);
    setAccountNumber('');
    setSelectedBank('');
    setAccountName('');
    setAccountResolving(false);
    setAccountError('');
  };

  // Fun, modern gradients and playful icons
  const funGradients = [
    'from-pink-500 to-yellow-400',
    'from-green-400 to-blue-500',
    'from-purple-500 to-indigo-500',
    'from-orange-400 to-pink-500',
    'from-yellow-400 to-red-500',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-yellow-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-yellow-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center shadow-xl">
          <div className="text-red-600 mb-2 text-4xl">😢</div>
          <h3 className="text-2xl font-bold text-red-800 mb-2">Error Loading Gamification</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-blue-50">
      {/* Fun Header */}
      <div className="bg-gradient-to-r from-pink-500 via-yellow-400 to-purple-500 text-white shadow-lg rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-yellow-200 animate-bounce" />
              Instructor Gamification
              <Smile className="w-8 h-8 text-pink-200 animate-spin-slow" />
            </h1>
            <p className="text-lg text-yellow-100 font-medium drop-shadow-md">
              Earn <span className="font-bold text-white">gold coins</span> for listing courses, <span className="font-bold text-white">points</span> for withdrawals, and unlock fun rewards!
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-7 h-7 text-yellow-300 animate-bounce" />
                <span className="text-3xl font-extrabold">{stats?.coins || 0}</span>
              </div>
              <span className="text-md text-yellow-100">Gold Coins</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-7 h-7 text-green-200 animate-pulse" />
                <span className="text-3xl font-extrabold">{stats?.points || 0}</span>
              </div>
              <span className="text-md text-yellow-100">Points</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-7 h-7 text-pink-200 animate-wiggle" />
                <span className="text-3xl font-extrabold">{stats?.current_streak || 0}</span>
              </div>
              <span className="text-md text-yellow-100">Streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-pink-50">
            {tabs.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-4 font-bold text-lg transition-colors ${
                    isActive
                      ? `border-pink-500 text-pink-600 bg-gradient-to-r ${funGradients[i % funGradients.length]} bg-clip-text text-transparent` 
                      : 'border-transparent text-gray-400 hover:text-pink-500'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'overview' && (
          <div className="space-y-10">
            {/* Fun Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-yellow-400 to-pink-400 rounded-2xl p-8 text-white shadow-xl flex flex-col items-center">
                <PlusCircle className="w-10 h-10 mb-3 animate-bounce" />
                <h3 className="text-2xl font-bold mb-2">List a Course</h3>
                <p className="mb-4 text-lg">Earn <span className="font-extrabold">gold coins</span> every time you list a new course!</p>
                <button
                  className="bg-white text-pink-500 font-bold px-6 py-2 rounded-full shadow hover:bg-pink-50 transition"
                  onClick={() => navigate('/instructor/create-course')}
                >
                  List Course
                </button>
              </div>
              <div className="bg-gradient-to-br from-green-400 to-blue-400 rounded-2xl p-8 text-white shadow-xl flex flex-col items-center">
                <DollarSign className="w-10 h-10 mb-3 animate-pulse" />
                <h3 className="text-2xl font-bold mb-2">Withdraw Earnings</h3>
                <p className="mb-4 text-lg">Earn <span className="font-extrabold">points</span> when you make a withdrawal!</p>
                <button className="bg-white text-green-500 font-bold px-6 py-2 rounded-full shadow hover:bg-green-50 transition" onClick={() => setShowWithdrawModal(true)}>Withdraw</button>
              </div>
              <div className="bg-gradient-to-br from-pink-400 to-yellow-400 rounded-2xl p-8 text-white shadow-xl flex flex-col items-center">
                <ShoppingBag className="w-10 h-10 mb-3 animate-wiggle" />
                <h3 className="text-2xl font-bold mb-2">Shop Store</h3>
                <p className="mb-4 text-lg">Spend your <span className="font-extrabold">gold coins</span> on fun items and upgrades!</p>
                <button className="bg-white text-yellow-500 font-bold px-6 py-2 rounded-full shadow hover:bg-yellow-50 transition">Go to Store</button>
              </div>
            </div>

            {/* Fun Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
                <h3 className="text-xl font-bold text-pink-600 mb-4 flex items-center gap-2"><Star className="w-6 h-6 text-yellow-400" /> Your Achievements</h3>
                <BadgeCollection />
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
                <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2"><Gift className="w-6 h-6 text-pink-400" /> Recent Activity</h3>
                <ActivityFeed />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'badges' && <BadgeCollection />}
        {activeTab === 'store' && <StoreFront />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'activity' && <ActivityFeed />}
      </div>
      {showWithdrawModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in max-h-[80vh] overflow-y-auto">
      <button
        onClick={closeWithdrawModal}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
        aria-label="Close"
      >×</button>
      <div className="flex flex-col gap-6 flex-1">
        <div className="flex flex-col items-center text-center">
          <DollarSign className="w-12 h-12 text-green-500 mb-2" />
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Withdraw Earnings</h2>
          <p className="text-gray-700 mb-2">Instant payout to your bank account.</p>
        </div>
        {withdrawStep === 1 && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Amount</label>
            <input
              type="number"
              min={1}
              max={150000}
              value={withdrawAmount}
              onChange={handleWithdrawAmountChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold mb-2"
              placeholder="Enter amount (₦)"
            />
            {withdrawAmount && (
              <div className="bg-green-50 border-l-4 border-green-400 rounded-xl p-4 mb-2">
                <div className="flex items-center gap-2 text-green-700 font-semibold text-lg">
                  <span>Fee:</span> <span>₦{withdrawFee.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-green-900 font-bold text-lg">
                  <span>You’ll receive:</span> <span>₦{withdrawNet.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Fee: 1.5% + ₦100, capped at ₦2,000. ₦100 waived for withdrawals under ₦2,500.</div>
              </div>
            )}
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">Bank Account Number</label>
            <input
              type="text"
              maxLength={10}
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value.replace(/[^\d]/g, ''))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold mb-2"
              placeholder="Enter 10-digit account number"
            />
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-2">Select Bank</label>
            <select
              value={selectedBank}
              onChange={e => setSelectedBank(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold mb-2"
              disabled={bankLoading}
            >
              <option value="">{bankLoading ? 'Loading banks...' : 'Select a bank'}</option>
              {bankList.map((bank: any, idx: number) => (
                <option key={bank.code + '-' + idx} value={bank.code}>{bank.name}</option>
              ))}
            </select>
            {accountResolving && <div className="text-green-700 text-sm mb-2">Resolving account name...</div>}
            {accountName && <div className="text-green-900 font-semibold mb-2">Account Name: {accountName}</div>}
            {accountError && <div className="text-red-600 text-sm mb-2">{accountError}</div>}
            {withdrawError && <div className="text-red-600 text-sm mb-2">{withdrawError}</div>}
            <button
              className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-lg transition-colors mt-2 disabled:opacity-50"
              onClick={handleWithdrawProceed}
              disabled={
                !withdrawAmount ||
                !accountNumber ||
                !selectedBank ||
                !accountName ||
                accountResolving ||
                !!accountError
              }
            >
              Proceed
            </button>
          </>
        )}
        {withdrawStep === 2 && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter your password to confirm</label>
            <div className="relative mb-2">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={withdrawInputRef}
                type="password"
                value={withdrawPassword}
                onChange={e => setWithdrawPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg font-semibold"
                placeholder="Password"
                autoFocus
              />
            </div>
            {withdrawError && <div className="text-red-600 text-sm mb-2">{withdrawError}</div>}
            <button
              className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-lg transition-colors mt-2 disabled:opacity-50"
              onClick={handleWithdrawConfirm}
              disabled={withdrawLoading}
            >
              {withdrawLoading ? 'Processing...' : 'Confirm & Withdraw'}
            </button>
          </>
        )}
        {withdrawStep === 3 && withdrawSuccess && (
          <div className="flex flex-col items-center gap-4 mt-8">
            <svg className="w-16 h-16 text-green-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M8 12l2 2l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h3 className="text-2xl font-bold text-green-700">Withdrawal Successful!</h3>
            <div className="text-lg text-gray-700">₦{withdrawNet.toLocaleString()} has been sent to your account.</div>
            <div className="text-sm text-gray-500">You will receive an email notification shortly.</div>
            <button
              className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-lg transition-colors mt-2"
              onClick={closeWithdrawModal}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
} 