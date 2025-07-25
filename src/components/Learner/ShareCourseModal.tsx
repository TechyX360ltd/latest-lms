import React from 'react';
import { X, Copy, Mail, Check } from 'lucide-react';
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton, 
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon
} from 'react-share';
import { useToast } from '../Auth/ToastContext';

interface ShareCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  courseSlug: string;
}

export default function ShareCourseModal({ isOpen, onClose, courseTitle, courseSlug }: ShareCourseModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const courseUrl = `${window.location.origin}/courses/${courseSlug}`;
  const shareTitle = `Check out this course: ${courseTitle}`;
  const shareText = `I found this amazing course: ${courseTitle}. Check it out!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(courseUrl);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Check out this course: ${courseTitle}`);
    const body = encodeURIComponent(`${shareText}\n\n${courseUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900">Share Course</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Course Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{courseTitle}</h3>
          <p className="text-sm text-gray-600">Share this course with friends and family</p>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <WhatsappShareButton url={courseUrl} title={shareTitle}>
            <div className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors">
              <WhatsappIcon size={20} round />
              <span>WhatsApp</span>
            </div>
          </WhatsappShareButton>

          <FacebookShareButton url={courseUrl} quote={shareText}>
            <div className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors">
              <FacebookIcon size={20} round />
              <span>Facebook</span>
            </div>
          </FacebookShareButton>

          <TwitterShareButton url={courseUrl} title={shareTitle}>
            <div className="flex items-center justify-center gap-2 bg-blue-400 hover:bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold transition-colors">
              <TwitterIcon size={20} round />
              <span>Twitter</span>
            </div>
          </TwitterShareButton>

          <LinkedinShareButton url={courseUrl} title={courseTitle} summary={shareText}>
            <div className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-lg font-semibold transition-colors">
              <LinkedinIcon size={20} round />
              <span>LinkedIn</span>
            </div>
          </LinkedinShareButton>
        </div>

        {/* Copy Link & Email */}
        <div className="space-y-3">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleEmailShare}
            className="w-full flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            <Mail className="w-5 h-5" />
            <span>Share via Email</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
} 