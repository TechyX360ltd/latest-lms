import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCourses, useUsers, useCategories, useCourseStructure } from '../../hooks/useData';
import { Users, Clock, Star, Tag, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Auth/ToastContext';
import { PaystackButton } from 'react-paystack';
import Confetti from 'react-confetti';
import { CouponInput } from './CouponInput';
import { CouponValidationResult } from '../../types';
import { useWindowSize } from 'react-use';
import { supabase } from '../../lib/supabase';
import ShareCourseModal from './ShareCourseModal';
import GiftCourseModal from './GiftCourseModal';
import { Helmet } from 'react-helmet-async';
import { useGamification } from '../../hooks/useGamification';

interface CourseDetailsMainProps {
  courseSlug?: string;
}

const CourseDetailsMain: React.FC<CourseDetailsMainProps> = ({ courseSlug }) => {
  const { getCourseBySlug, loading: coursesLoading, refreshCourses } = useCourses();
  const { users } = useUsers();
  const { categories } = useCategories();
  const { user, updateUserEnrollment, updateUserProfile, refreshUserEnrollments } = useAuth();
  const { showToast } = useToast();
  const { triggerCourseEnrollment } = useGamification();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [appliedCoupon, setAppliedCoupon] = React.useState<CouponValidationResult | null>(null);
  const [coinConfirm, setCoinConfirm] = React.useState(false);
  const [coinLoading, setCoinLoading] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showGiftModal, setShowGiftModal] = React.useState(false);
  const { width, height } = useWindowSize();
  const PAYSTACK_PUBLIC_KEY = 'pk_test_78329ea72cb43b6435a12075cb3a2bca07ec53be';
  const [openModuleIdx, setOpenModuleIdx] = React.useState<number | null>(null);
  const toggleModule = (idx: number) => setOpenModuleIdx(openModuleIdx === idx ? null : idx);
  const course = getCourseBySlug(courseSlug || '');
  const instructor = users.find((u: any) => u.id === course?.instructor_id);
  const instructorName = instructor
    ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.email || 'Instructor'
    : 'Instructor';
  const category = categories.find((cat: any) => cat.id === course?.category_id);
  const { modules, loading: modulesLoading, error: modulesError } = useCourseStructure(course?.id || '');
  React.useEffect(() => {
    if (!modulesLoading) {
      console.log('Fetched modules for course:', modules);
    }
  }, [modules, modulesLoading]);
  if (coursesLoading || modulesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">Course not found.</div>
        <Link to="/dashboard/browse" className="text-blue-600 hover:underline">Back to Browse Courses</Link>
      </div>
    );
  }
  if (modulesError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">{modulesError}</div>
        <Link to="/dashboard/browse" className="text-blue-600 hover:underline">Back to Browse Courses</Link>
      </div>
    );
  }
  const safeInstructorName = instructorName || 'Instructor';
  const safeCategory = category ? category.name : 'Uncategorized';
  const safeThumbnail = course.thumbnail || '/public/Skill Sage Logo.png';
  const handleEnroll = () => {
    setShowPaymentModal(true);
  };
  const handleCouponApplied = (result: CouponValidationResult) => setAppliedCoupon(result);
  const handleCouponRemoved = () => setAppliedCoupon(null);
  const handlePaymentSuccess = async () => {
    if (user && updateUserEnrollment) {
              await updateUserEnrollment([...(user.enrolledCourses || []), course.id]);
        
        // Trigger gamification for course enrollment
        try {
          await triggerCourseEnrollment(course.id);
          showToast('Enrollment successful! +5000 points earned!', 'success');
        } catch (error) {
          console.error('Error triggering course enrollment gamification:', error);
          showToast('Enrollment successful!', 'success');
        }
      
              if (refreshUserEnrollments) await refreshUserEnrollments(user.id);
        // Refresh courses to update enrollment status
        if (refreshCourses) await refreshCourses();
        setShowPaymentModal(false);
        setAppliedCoupon(null);
        setShowSuccessModal(true);
    }
  };
  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setAppliedCoupon(null);
  };
  const handleStartLearning = () => {
    setShowSuccessModal(false);
    navigate('/dashboard/courses');
  };
  const handlePayWithCoins = async () => {
    if (!user) return;
    const coinCost = course.price * 100;
    if (!user.coins || user.coins < coinCost) {
      showToast('You do not have enough coins to enroll in this course.', 'error');
      return;
    }
    setCoinLoading(true);
    try {
      const { error } = await supabase.rpc('pay_with_coins_and_enroll', {
        user_id: user.id,
        course_id: course.id,
        coin_cost: coinCost,
      });
      if (!error) {
        // Trigger gamification for course enrollment
        try {
          await triggerCourseEnrollment(course.id);
          showToast('Enrollment successful! You paid with coins. +5000 points earned!', 'success');
        } catch (gamificationError) {
          console.error('Error triggering course enrollment gamification:', gamificationError);
          showToast('Enrollment successful! You paid with coins.', 'success');
        }
        
        if (refreshUserEnrollments) await refreshUserEnrollments(user.id);
        if (updateUserProfile) updateUserProfile({ coins: (user.coins || 0) - coinCost });
        // Refresh courses to update enrollment status
        if (refreshCourses) await refreshCourses();
        setShowPaymentModal(false);
        setCoinConfirm(false);
        setShowSuccessModal(true);
      } else {
        showToast(error.message || 'Coin payment failed.', 'error');
      }
    } catch (err) {
      showToast('Coin payment failed. Please try again.', 'error');
    }
    setCoinLoading(false);
  };
  const handleShare = () => {
    setShowShareModal(true);
  };
  const handleCloseShare = () => {
    setShowShareModal(false);
  };
  const handleGift = () => {
    setShowGiftModal(true);
  };
  const handleCloseGift = () => {
    setShowGiftModal(false);
  };
  const totalLectures = modules.reduce((sum, mod) => sum + (mod.lessons?.length || 0), 0);
  const totalSections = modules.length;
  const totalDurationMinutes = modules.reduce((sum, mod) => sum + (mod.lessons?.reduce((s, l) => s + (l.duration || 0), 0) || 0), 0);
  const totalDuration = `${Math.floor(totalDurationMinutes / 60)}h ${totalDurationMinutes % 60}m`;
  return (
    <>
      <Helmet>
        <title>{course.title} | Skill Sage</title>
        <meta property="og:title" content={course.title} />
        <meta property="og:description" content={course.description} />
        <meta property="og:image" content={safeThumbnail} />
        <meta property="og:url" content={`${window.location.origin}/courses/${course.slug}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={course.title} />
        <meta name="twitter:description" content={course.description} />
        <meta name="twitter:image" content={safeThumbnail} />
      </Helmet>
      <section className="bg-white border-b border-gray-200 px-3 md:px-8 pt-6 pb-8">
        {/* Breadcrumbs */}
        <nav className="text-xs text-gray-500 mb-2 flex items-center gap-2">
          <Link to="/dashboard" className="hover:underline flex items-center gap-1"><Home className="w-4 h-4 inline" /> Home</Link>
          <span>/</span>
          <Link to="/dashboard/browse" className="hover:underline">Browse Courses</Link>
          {category && <><span>/</span><span>{category.name}</span></>}
        </nav>
        {/* Mobile Sidebar (cover photo + pricing card) */}
        <aside className="block md:hidden w-full mb-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-0 overflow-hidden">
            {/* Course Preview Image */}
            <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center">
              <img src={safeThumbnail} alt={course.title} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = '/public/Skill Sage Logo.png')} />
            </div>
            <div className="p-4 md:p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">₦{course.price?.toLocaleString?.() ?? course.price}</span>
                {course.price && <span className="text-sm text-gray-400 line-through">₦{(course.price * 5).toLocaleString?.()}</span>}
                <span className="text-xs text-green-600 font-semibold">83% off</span>
              </div>
              <div className="text-xs text-red-600 font-semibold">21 hours left at this price!</div>
              <button onClick={handleEnroll} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg text-lg shadow transition-colors">Enroll now</button>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>30-Day Money-Back Guarantee</span>
                <span>Full Lifetime Access</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={handleShare} className="text-blue-600 hover:underline text-xs font-medium">Share</button>
                <button onClick={handleGift} className="text-blue-600 hover:underline text-xs font-medium">Gift this course</button>
                <button className="text-blue-600 hover:underline text-xs font-medium">Apply Coupon</button>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex flex-col md:flex-row md:items-start gap-8">
          {/* Main Content (Left) */}
          <div className="flex-1 min-w-0 px-3 md:px-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">{course.title}</h1>
            <p className="text-lg text-gray-700 mb-4 max-w-2xl">{course.description}</p>
            <div className="flex flex-wrap gap-4 items-center text-gray-600 text-sm mb-4">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-current" />{typeof (course as any).rating === 'number' ? (course as any).rating.toFixed(1) : '4.8'} <span className="ml-1 text-gray-500">({course.enrolled_count} students)</span></span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.enrolled_count} enrolled</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration}h</span>
              <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {safeCategory}</span>
              {course.level && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{course.level}</span>}
            </div>
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
              <span>Created by <Link to={`/instructor/${course.instructor_id}`} className="text-blue-600 hover:underline font-medium">{safeInstructorName}</Link></span>
              <span>•</span>
              <span>Last updated {new Date(course.updated_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>Language: English</span>
            </div>
            {/* Course Content Section (Modules) - moved up */}
            <div className="max-w-3xl mt-8 mb-8 px-0 md:px-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 px-3 md:px-0">Course content</h2>
              <div className="flex items-center text-sm text-gray-600 mb-4 px-3 md:px-0">
                <span>{totalSections} sections</span>
                <span className="mx-2">•</span>
                <span>{totalLectures} lectures</span>
                <span className="mx-2">•</span>
                <span>{totalDuration} total length</span>
                <button
                  className="ml-auto text-purple-700 font-semibold hover:underline text-sm"
                  onClick={() => setOpenModuleIdx(openModuleIdx === -1 ? null : -1)}
                >
                  {openModuleIdx === -1 ? 'Collapse all sections' : 'Expand all sections'}
                </button>
              </div>
              <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 bg-white">
                {modules.length === 0 ? (
                  <div className="text-gray-500 p-6">No modules available for this course yet.</div>
                ) : (
                  modules.map((mod, idx) => {
                    const isOpen = openModuleIdx === idx || openModuleIdx === -1;
                    const lectureCount = mod.lessons?.length || 0;
                    const duration = `${Math.floor((mod.lessons?.reduce((s, l) => s + (l.duration || 0), 0) || 0) / 60)}h ${(mod.lessons?.reduce((s, l) => s + (l.duration || 0), 0) || 0) % 60}m`;
                    return (
                      <div key={mod.id}>
                        <button
                          className="w-full flex items-center justify-between px-4 md:px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left font-semibold text-gray-900 text-base focus:outline-none"
                          onClick={() => toggleModule(idx)}
                        >
                          <span>{mod.title}</span>
                          <span className="flex items-center gap-4 text-sm font-normal text-gray-600">
                            <span>{lectureCount} lectures</span>
                            <span>•</span>
                            <span>{duration}</span>
                            {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                          </span>
                        </button>
                        {isOpen && mod.lessons && mod.lessons.length > 0 && (
                          <ul className="bg-white px-4 md:px-8 pb-4">
                            {mod.lessons.map((lesson, lidx) => (
                              <li key={lesson.id} className="flex items-center gap-2 py-1 text-gray-700 text-sm border-b border-gray-50 last:border-b-0">
                                <span className="w-6 text-xs text-gray-400">{lidx + 1}.</span>
                                <span className="flex-1">{lesson.title}</span>
                                {lesson.duration && <span className="text-xs text-gray-500 ml-2">{Math.floor(lesson.duration / 60)}h {lesson.duration % 60}m</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          {/* Desktop Sidebar (Right) */}
          <aside className="hidden md:block w-full md:w-96 flex-shrink-0 md:sticky md:top-24 z-10">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-0 overflow-hidden">
              {/* Course Preview Image */}
              <div className="relative w-full h-48 md:h-56 bg-gray-100 flex items-center justify-center">
                <img src={safeThumbnail} alt={course.title} className="w-full h-full object-cover" onError={e => (e.currentTarget.src = '/public/Skill Sage Logo.png')} />
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">₦{course.price?.toLocaleString?.() ?? course.price}</span>
                  {course.price && <span className="text-sm text-gray-400 line-through">₦{(course.price * 5).toLocaleString?.()}</span>}
                  <span className="text-xs text-green-600 font-semibold">83% off</span>
                </div>
                <div className="text-xs text-red-600 font-semibold">21 hours left at this price!</div>
                <button onClick={handleEnroll} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg text-lg shadow transition-colors">Enroll now</button>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  <span>30-Day Money-Back Guarantee</span>
                  <span>Full Lifetime Access</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={handleShare} className="text-blue-600 hover:underline text-xs font-medium">Share</button>
                  <button onClick={handleGift} className="text-blue-600 hover:underline text-xs font-medium">Gift this course</button>
                  <button className="text-blue-600 hover:underline text-xs font-medium">Apply Coupon</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <Confetti width={width} height={height} numberOfPieces={250} recycle={false} />
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center animate-scale-in">
            <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M8 12l2 2l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Congratulations!</h2>
            <div className="w-12 h-1 bg-green-100 rounded-full mb-4"></div>
            <p className="text-gray-700 text-center mb-6">
              You have just taken the <span className="font-semibold text-green-700">first step to success</span>.<br />
              Your enrollment was successful. Start learning now and unlock your full potential!
            </p>
            <button
              onClick={handleStartLearning}
              className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-lg transition-colors shadow-md"
            >
              Start Learning
            </button>
          </div>
        </div>
      )}
      {/* Share Modal */}
      <ShareCourseModal
        isOpen={showShareModal}
        onClose={handleCloseShare}
        courseTitle={course.title}
        courseSlug={course.slug}
      />
             {/* Payment Modal */}
       {showPaymentModal && (
         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
           <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
             <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Proceed to Payment</h2>
             <div className="w-12 h-1 bg-blue-100 rounded-full mb-4"></div>
             <p className="text-gray-700 text-center mb-6">
               You are about to enroll in <span className="font-semibold text-blue-700">{course.title}</span>
               <br />
               <span className="text-lg font-bold text-green-700 mt-2 block">
                 ₦{appliedCoupon ? appliedCoupon.final_amount?.toLocaleString() : course.price?.toLocaleString?.() ?? course.price}
               </span>
               {appliedCoupon && (
                 <span className="text-sm text-gray-500 line-through">
                   ₦{course.price?.toLocaleString?.() ?? course.price}
                 </span>
               )}
             </p>

             {/* Coupon Input */}
             <div className="w-full mb-6">
               <CouponInput
                 courseId={course.id}
                 originalAmount={course.price}
                 onCouponApplied={handleCouponApplied}
                 onCouponRemoved={handleCouponRemoved}
                 appliedCoupon={appliedCoupon || undefined}
               />
             </div>

             <PaystackButton
               publicKey={PAYSTACK_PUBLIC_KEY}
               email={user?.email || 'test@example.com'}
               amount={(appliedCoupon ? appliedCoupon.final_amount : course.price) * 100}
               currency="NGN"
               text="Pay with Paystack"
               onSuccess={handlePaymentSuccess}
               onClose={handlePaymentClose}
               metadata={{ 
                 courseId: course.id, 
                 userId: user?.id, 
                 couponId: appliedCoupon?.coupon_id,
                 custom_fields: [] 
               }}
               className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-3 rounded-lg font-semibold text-lg w-full mb-3"
             />
             <button
               onClick={handlePaymentClose}
               className="w-full py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium"
             >
               Cancel
             </button>
           </div>
         </div>
       )}
       <GiftCourseModal
         isOpen={showGiftModal}
         onClose={handleCloseGift}
         course={course}
         instructor={instructor}
       />
     </>
   );
 };

export default CourseDetailsMain; 