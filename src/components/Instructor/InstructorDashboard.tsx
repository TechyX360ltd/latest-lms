import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../Layout/Header';
import { Sidebar } from '../Layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, BookOpen, Users, DollarSign, Clock, AlertCircle, Download, Rocket, Edit, Eye, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaystackButton } from 'react-paystack';
import dayjs from 'dayjs';

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

// Placeholder for real email integration
function sendBoostReminderEmail(course: any, user: any) {
  // TODO: Integrate with real email service (e.g., Supabase Functions, SendGrid)
  // For now, just log to console
  console.log(`Email sent to ${user?.email}: Your boost for "${course.title}" expires in less than a week!`);
}

export function InstructorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boostCourse, setBoostCourse] = useState<any>(null);
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

  // Helper: is the instructor verified?
  const isVerified = user?.verification_status === 'verified';

  // Helper: show error if not verified
  function showVerifyError(feature: string) {
    alert(`You must verify your account to ${feature}. Please upload your ID in your profile.`);
  }

  // Fetch bank list from Paystack API
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

  // Resolve account name when account number and bank are filled
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

  // Fee calculation logic
  const calculateFee = (amount: number) => {
    if (isNaN(amount) || amount <= 0) return { fee: 0, net: 0 };
    let fee = amount * 0.015;
    if (amount >= 2500) fee += 100;
    fee = Math.min(fee, 2000);
    if (amount < 2500) fee -= 100; // Waive NGN 100 for < 2500
    if (fee < 0) fee = 0;
    return { fee: Math.round(fee), net: Math.round(amount - fee) };
  };

  // Handle amount input
  const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '');
    setWithdrawAmount(val);
    const { fee, net } = calculateFee(Number(val));
    setWithdrawFee(fee);
    setWithdrawNet(net);
    setWithdrawError('');
  };

  // Handle proceed to password step
  const handleWithdrawProceed = () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      setWithdrawError('Enter a valid amount');
      return;
    }
    if (Number(withdrawAmount) > 150000) { // Demo: hardcoded max
      setWithdrawError('You cannot withdraw more than your available balance.');
      return;
    }
    setWithdrawStep(2);
    setTimeout(() => withdrawInputRef.current?.focus(), 100);
  };

  // Handle password confirm and withdrawal
  const handleWithdrawConfirm = () => {
    setWithdrawLoading(true);
    setTimeout(() => {
      setWithdrawLoading(false);
      if (withdrawPassword === 'password123') { // Demo password
        setWithdrawSuccess(true);
        setWithdrawStep(3);
        // Placeholder for real email notification
        console.log(`Email sent to ${user?.email}: Withdrawal of ₦${withdrawNet.toLocaleString()} successful!`);
      } else {
        setWithdrawError('Incorrect password. Please try again.');
      }
    }, 1200);
  };

  // Reset drawer state
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
  };

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 4000);
  };
  // Payment loading state
  const [boostLoading, setBoostLoading] = useState(false);

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

  // Demo courses
  const demoCourses = [
    { id: 1, title: 'React for Beginners', featured: false, boostedAt: null, enrollments: 40, status: 'Active', date: '2024-07-01' },
    { id: 2, title: 'Advanced TypeScript', featured: true, boostedAt: dayjs().subtract(20, 'day').toISOString(), enrollments: 20, status: 'Active', date: '2024-06-15' },
    { id: 3, title: 'UI/UX Design', featured: false, boostedAt: null, enrollments: 30, status: 'Inactive', date: '2024-06-10' },
  ];
  const [courses, setCourses] = useState(demoCourses);

  // Check for boost expiry and send reminder toast
  useEffect(() => {
    courses.forEach(course => {
      if (course.featured && course.boostedAt) {
        const boostedDate = dayjs(course.boostedAt);
        const now = dayjs();
        const daysSinceBoost = now.diff(boostedDate, 'day');
        if (daysSinceBoost >= 23 && daysSinceBoost < 30 && !course.reminderSent) {
          showToast('success', `Reminder: Boost for "${course.title}" expires in ${30 - daysSinceBoost} days! Renew to stay featured.`);
          sendBoostReminderEmail(course, user);
          setCourses(cs => cs.map(c => c.id === course.id ? { ...c, reminderSent: true } : c));
        }
        if (daysSinceBoost >= 30 && course.featured) {
          setCourses(cs => cs.map(c => c.id === course.id ? { ...c, featured: false, boostedAt: null, reminderSent: false } : c));
        }
      }
    });
    // eslint-disable-next-line
  }, [courses]);

  // Placeholder stats
  const stats = [
    { title: 'Courses', value: courses.length, icon: BookOpen, color: 'bg-blue-500' },
    { title: 'Enrollments', value: courses.reduce((a, c) => a + c.enrollments, 0), icon: Users, color: 'bg-green-500' },
    { title: 'Earnings', value: '₦150,000', icon: DollarSign, color: 'bg-purple-500' },
    { title: 'Pending Payouts', value: '₦20,000', icon: Clock, color: 'bg-orange-500' },
  ];

  // Demo payout history
  const demoPayouts = [
    { id: 1, date: '2024-07-10', amount: 20000, status: 'Paid' },
    { id: 2, date: '2024-06-10', amount: 15000, status: 'Paid' },
    { id: 3, date: '2024-05-10', amount: 10000, status: 'Pending' },
  ];

  const PAYSTACK_PUBLIC_KEY = 'pk_test_78329ea72cb43b6435a12075cb3a2bca07ec53be'; // TODO: Replace with your real key

  useEffect(() => {
    const handlePopState = () => {
      window.location.reload();
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {showWelcome && <WelcomeInstructorModal onClose={handleCloseWelcome} />}
          {/* Verification Banner */}
          {!isVerified && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded flex items-center gap-4 shadow animate-pulse">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <div className="flex-1">
                <span className="font-semibold text-yellow-900">Your instructor account is not verified.</span>
                <span className="ml-2 text-yellow-800">To unlock all features, please verify your profile.</span>
              </div>
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
                onClick={() => navigate('/instructor/profile')}
              >
                Verify Now
              </button>
            </div>
          )}

          {/* Example: Publish Course Button (replace with your actual publish logic) */}
          <button
            className={`px-4 py-2 rounded-lg font-medium mb-4 ${isVerified ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            disabled={!isVerified}
            onClick={() => {
              if (!isVerified) return showVerifyError('publish courses');
              // ...actual publish logic...
            }}
          >
            Publish Course
          </button>

          {/* Example: Withdraw Button (replace with your actual withdraw logic) */}
          <button
            className={`px-4 py-2 rounded-lg font-medium mb-4 ${isVerified ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            disabled={!isVerified}
            onClick={() => {
              if (!isVerified) return showVerifyError('withdraw earnings');
              // ...actual withdraw logic...
            }}
          >
            Withdraw Earnings
          </button>

          {/* Example: Schedule Session Button (replace with your actual schedule logic) */}
          <button
            className={`px-4 py-2 rounded-lg font-medium mb-4 ${isVerified ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            disabled={!isVerified}
            onClick={() => {
              if (!isVerified) return showVerifyError('schedule live sessions');
              // ...actual schedule logic...
            }}
          >
            Schedule Live Session
          </button>

          {/* Example: Store Access (replace with your actual store link/component) */}
          <button
            className={`px-4 py-2 rounded-lg font-medium mb-4 ${isVerified ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            disabled={!isVerified}
            onClick={() => {
              if (!isVerified) return showVerifyError('access the store');
              // ...actual store logic...
            }}
          >
            Go to Store
          </button>

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
                <div key={idx} className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100 hover:shadow-lg transition">
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
              <div className="space-y-4">
                {courses.map((course) => {
                  const boostedDate = course.boostedAt ? dayjs(course.boostedAt) : null;
                  const now = dayjs();
                  const daysSinceBoost = boostedDate ? now.diff(boostedDate, 'day') : null;
                  const isBoosted = course.featured && boostedDate && daysSinceBoost < 30;
                  const isExpiringSoon = isBoosted && daysSinceBoost >= 23;
                  const isExpired = !isBoosted && boostedDate;
                  return (
                    <div key={course.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4 hover:shadow transition">
                      <div>
                        <div className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                          {course.title}
                          {isBoosted && <Rocket className="w-4 h-4 text-yellow-500" title="Featured" />}
                        </div>
                        <div className="text-xs text-gray-500">{course.status} • {course.enrollments} enrollments • {new Date(course.date).toLocaleDateString()}</div>
                        {isExpiringSoon && (
                          <div className="mt-1 text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1 inline-block">Boost expires in {30 - daysSinceBoost} days</div>
                        )}
                        {isExpired && (
                          <div className="mt-1 text-xs text-red-700 bg-red-50 rounded px-2 py-1 inline-block">Boost expired</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm flex items-center gap-1"><Eye className="w-4 h-4" />View</button>
                        <button className="px-3 py-1 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm flex items-center gap-1"><Edit className="w-4 h-4" />Edit</button>
                        {(!isBoosted || isExpiringSoon) && (
                          <button
                            className={`px-3 py-1 rounded text-sm flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100`}
                            onClick={() => { setBoostCourse(course); setShowBoostModal(true); }}
                          >
                            <Rocket className="w-4 h-4" />Renew Boost
                          </button>
                        )}
                        {isBoosted && !isExpiringSoon && (
                          <button
                            className={`px-3 py-1 rounded text-sm flex items-center gap-1 bg-yellow-100 text-yellow-700 cursor-not-allowed`}
                            disabled
                          >
                            <Rocket className="w-4 h-4" />Featured
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-6">
              <button
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                onClick={() => navigate('/instructor/create-course')}
              >
                Create New Course
              </button>
                <button
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  onClick={() => navigate('/instructor/enrollments')}
                >
                  View Enrollments
                </button>
              </div>
            </div>
            {/* Earnings & Payouts */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Earnings & Payouts</h2>
              <div className="mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-green-700">₦150,000</div>
                  <button className="px-4 py-2 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 border border-green-200" onClick={() => setShowWithdrawModal(true)}>
                    Withdraw Earnings
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">Total earnings to date</div>
              </div>
              <div className="overflow-x-auto rounded-xl shadow mt-4">
                <table className="min-w-full bg-white rounded-xl">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 text-left">
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demoPayouts.map(p => (
                      <tr key={p.id} className="border-b last:border-b-0 hover:bg-blue-50 transition">
                        <td className="py-3 px-4">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-bold text-green-700">₦{p.amount.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Boost Modal */}
          {showBoostModal && boostCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
                <button
                  onClick={() => setShowBoostModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                  aria-label="Close"
                >×</button>
                <div className="flex flex-col items-center text-center">
                  <Rocket className="w-12 h-12 text-yellow-500 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Boost Course</h2>
                  <p className="text-gray-700 mb-4">Feature <span className="font-semibold">{boostCourse.title}</span> on the website landing page for a token of <span className='text-green-700 font-bold'>₦5,000</span>.</p>
                  <div className="w-full bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-4 mb-4 flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Rocket className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold text-yellow-700 text-lg">Why you should boost your course</span>
                    </div>
                    <ul className="list-disc list-inside text-left text-sm text-yellow-900 space-y-1 pl-2">
                      <li>Get your course featured on our homepage and landing page for maximum visibility.</li>
                      <li>Attract more students and increase your enrollments rapidly.</li>
                      <li>Stand out from other courses in your category.</li>
                      <li>Boosted courses are promoted in our newsletters and social media.</li>
                      <li>Unlock higher earning potential and grow your instructor brand.</li>
                    </ul>
                  </div>
                  {boostLoading && <div className="mb-3 text-blue-600 font-semibold">Processing payment...</div>}
                  <PaystackButton
                    publicKey={PAYSTACK_PUBLIC_KEY}
                    email={user?.email || 'test@example.com'}
                    amount={5000 * 100}
                    currency="NGN"
                    text={boostLoading ? 'Processing...' : 'Pay ₦5,000 to Boost'}
                    onSuccess={() => {
                      setBoostLoading(false);
                      setCourses(courses => courses.map(c => c.id === boostCourse.id ? { ...c, featured: true, boostedAt: dayjs().toISOString(), reminderSent: false } : c));
                      setShowBoostModal(false);
                      showToast('success', 'Course successfully boosted and featured!');
                    }}
                    onClose={() => {
                      setBoostLoading(false);
                      setShowBoostModal(false);
                    }}
                    onClick={() => setBoostLoading(true)}
                    onError={() => {
                      setBoostLoading(false);
                      setShowBoostModal(false);
                      showToast('error', 'Payment failed. Please try again.');
                    }}
                    metadata={{ courseId: boostCourse.id, userId: user?.id, boost: true }}
                    className="bg-yellow-500 hover:bg-yellow-600 transition-colors text-white px-6 py-3 rounded-lg font-semibold text-lg w-full mb-3"
                  />
                  <button
                    onClick={() => setShowBoostModal(false)}
                    className="w-full py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium mt-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Withdraw Modal */}
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
          {/* Toast Notification */}
          {toast && (
            <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-semibold transition-all animate-fade-in ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {toast.message}
            </div>
          )}
        </main>
      </div>
    </div>
  );
} 