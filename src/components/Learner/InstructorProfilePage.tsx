import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CheckCircle } from 'lucide-react';

export function InstructorProfilePage() {
  const { instructorId } = useParams();
  const [instructor, setInstructor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInstructor() {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', instructorId)
        .single();
      setInstructor(data);
      setLoading(false);
    }
    if (instructorId) fetchInstructor();
  }, [instructorId]);

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;
  if (!instructor) return <div className="flex items-center justify-center h-64 text-red-600">Instructor not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-3xl font-bold text-blue-700">
          {instructor.firstName} {instructor.lastName}
        </h1>
        {instructor.isApproved && (
          <CheckCircle className="w-6 h-6 text-green-600" />
        )}
      </div>
      <div className="mb-2 text-gray-600">{instructor.bio || 'No bio provided.'}</div>
      <div className="mb-2"><strong>Email:</strong> {instructor.email}</div>
      <div className="mb-2"><strong>Expertise:</strong> {instructor.expertise || 'N/A'}</div>
      {/* Add more instructor info as needed */}
    </div>
  );
}

export default InstructorProfilePage; 