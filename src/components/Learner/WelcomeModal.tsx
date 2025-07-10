import React from 'react';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
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
          <h2 className="text-2xl font-bold text-blue-700 mb-2">Welcome to TECHYX 360!</h2>
          <p className="text-gray-700 mb-4">
            We're excited to have you on board. Here's how to get the best out of your learning journey:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-2">
            <li>• <b>Browse and enroll</b> in courses that match your interests.</li>
            <li>• <b>Track your progress</b> and complete assignments to earn certificates.</li>
            <li>• <b>Join the WhatsApp community</b> to connect with peers and instructors.</li>
            <li>• <b>Check notifications</b> for important updates and announcements.</li>
            <li>• <b>Update your profile</b> to personalize your experience.</li>
          </ul>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
} 