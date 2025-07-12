import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScheduleSessionForm from '../components/Admin/ScheduleSessionForm';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Course } from '../types';
import { Sidebar } from '../components/Layout/Sidebar';
import { Header } from '../components/Layout/Header';

export default function InstructorScheduleSessionPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    // Fetch only courses where the instructor is the current user
    supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', user.id)
      .then(({ data, error }: { data: Course[] | null, error: any }) => {
        setCourses(data || []);
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) return <div className="p-8 text-center text-blue-600">Loading your courses...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-0 lg:p-0 overflow-auto flex flex-col justify-start items-stretch">
          <div className="w-full h-full flex flex-col items-stretch justify-start">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 mt-4 px-6">Schedule a Live Session</h1>
            <div className="flex justify-center w-full">
              <div className="w-full max-w-5xl">
                <ScheduleSessionForm
                  courses={courses}
                  onSessionCreated={() => navigate('/instructor/events')}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 