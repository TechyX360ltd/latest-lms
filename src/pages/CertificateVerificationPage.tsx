import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function CertificateVerificationPage() {
  const [certificateId, setCertificateId] = useState('');
  const [certificate, setCertificate] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCertificate(null);
    setUserName(null);
    setCourseTitle(null);
    // Fetch certificate
    const { data, error } = await supabase
      .from('certificates')
      .select('id, user_id, course_id, issue_date, template, url')
      .eq('id', certificateId)
      .single();
    if (error || !data) {
      setError('❌ Certificate not found or invalid.');
      setLoading(false);
      return;
    }
    setCertificate(data);
    // Fetch user full name
    const { data: userData } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', data.user_id)
      .single();
    setUserName(userData ? `${userData.first_name} ${userData.last_name}` : null);
    // Fetch course title
    const { data: courseData } = await supabase
      .from('courses')
      .select('title')
      .eq('id', data.course_id)
      .single();
    setCourseTitle(courseData ? courseData.title : null);
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4 py-8"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Logo */}
      <img
        src="/BLACK-1-removebg-preview.png"
        alt="TECHYX 360 Logo"
        className="h-16 w-auto mb-6 drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 2px 8px #2563eb33)' }}
      />
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 md:p-12 text-center border border-blue-100">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 mb-2 tracking-tight">
          Certificate Verification
        </h1>
        <p className="text-gray-500 mb-8 text-lg">Enter your certificate ID to verify its authenticity.</p>
        <form onSubmit={handleVerify} className="mb-8 flex flex-col items-center gap-4">
          <input
            type="text"
            placeholder="Enter Certificate ID"
            value={certificateId}
            onChange={e => setCertificateId(e.target.value)}
            className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-5 py-3 w-full max-w-md text-lg shadow-sm transition"
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full max-w-md px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Certificate'}
          </button>
        </form>
        {error && <div className="mb-4 text-red-600 text-lg font-semibold animate-pulse">{error}</div>}
        {certificate && (
          <div className="mt-6 animate-fade-in">
            <div className="mb-4 text-green-700 font-bold text-xl flex items-center justify-center gap-2">
              <span className="text-2xl">✅</span> This certificate is <span className="underline">valid</span>!
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-gray-700 text-lg mb-4">
              <div>
                <span className="font-semibold">Certificate ID:</span>
                <div className="font-mono text-blue-700 break-all">{certificate.id}</div>
              </div>
              <div>
                <span className="font-semibold">User Name:</span>
                <div className="font-mono">{userName || <span className="text-gray-400">Loading...</span>}</div>
              </div>
              <div>
                <span className="font-semibold">Course Title:</span>
                <div className="font-mono">{courseTitle || <span className="text-gray-400">Loading...</span>}</div>
              </div>
              <div>
                <span className="font-semibold">Issued:</span>
                <div>{new Date(certificate.issue_date).toLocaleString()}</div>
              </div>
              <div>
                <span className="font-semibold">Template:</span>
                <div className="capitalize">{certificate.template}</div>
              </div>
            </div>
            <div className="mb-4">
              <a
                href={certificate.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
              >
                View Certificate PDF
              </a>
            </div>
          </div>
        )}
      </div>
      <div className="mt-10 text-gray-400 text-sm">© {new Date().getFullYear()} TECHYX 360 LMS</div>
    </div>
  );
} 