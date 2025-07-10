import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CertificateDownload } from '../components/Learner/CertificateDownload';

interface CertificateData {
  id: string;
  user_id: string;
  course_id: string;
  issue_date: string;
  template?: string;
  url?: string;
  // Add more fields as needed
}

export default function CertificatePage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [courseTitle, setCourseTitle] = useState('');

  useEffect(() => {
    async function fetchCertificate() {
      setLoading(true);
      setError(null);
      // Fetch certificate by ID
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', certificateId)
        .single();
      if (error || !data) {
        setError('Certificate not found.');
        setLoading(false);
        return;
      }
      setCertificate(data);
      // Fetch user name
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', data.user_id)
        .single();
      setUserName(userData ? `${userData.first_name} ${userData.last_name}` : '');
      // Fetch course title
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', data.course_id)
        .single();
      setCourseTitle(courseData ? courseData.title : '');
      setLoading(false);
    }
    if (certificateId) fetchCertificate();
  }, [certificateId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading certificate...</div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>;
  }
  if (!certificate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-blue-700">Certificate</h1>
        <p className="text-gray-600">Share this link to let others verify your achievement!</p>
        <input
          className="mt-2 px-3 py-1 border rounded w-full max-w-md text-center text-sm bg-gray-50"
          value={window.location.href}
          readOnly
          onClick={e => (e.target as HTMLInputElement).select()}
        />
      </div>
      <div className="w-full flex justify-center">
        <CertificateDownload
          learnerName={userName}
          courseTitle={courseTitle}
          userId={certificate.user_id}
          courseId={certificate.course_id}
          completionDate={certificate.issue_date?.split('T')[0]}
          template={certificate.template as any}
        />
      </div>
    </div>
  );
} 