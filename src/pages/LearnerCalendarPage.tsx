import React, { useEffect, useState } from 'react';
import CourseSessionCalendar from '../components/Course/CourseSessionCalendar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function LearnerCalendarPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user?.id) {
        setSessions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch all users (for instructor name mapping)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email');
        const users = usersData || [];
        // Fetch all live sessions
        const { data, error } = await supabase
          .from('live_sessions')
          .select('*');
        if (error || usersError) {
          setSessions([]);
          setLoading(false);
          return;
        }
        // Filter sessions where user is invitee or instructor, and enrolled in the course
        const filtered = (data || []).filter((session: any) => {
          const isInvitee = session.invitees && session.invitees.includes(user.id);
          const isInstructor = session.instructor_id === user.id;
          const isEnrolled = user.enrolledCourses?.includes(session.course_id);
          return (isInvitee || isInstructor) && isEnrolled;
        });
        // Map to calendar event format, with instructor name
        const events = filtered.map((s: any) => {
          const instructor = users.find((u: any) => u.id === s.instructor_id);
          const instructorName = instructor ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.email : s.instructor_id;
          return {
            id: s.id,
            title: s.title,
            start: new Date(s.start_time),
            end: s.end_time ? new Date(s.end_time) : new Date(s.start_time),
            platform: s.platform,
            instructor: instructorName,
            description: s.description,
            joinLink: s.join_link || '#',
            courseId: s.course_id,
          };
        });
        setSessions(events);
      } catch (err) {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="w-full max-w-full mx-auto p-0">
        <div className="mt-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold mb-0 ml-2">My Events</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto p-0">
      <div className="mt-2 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold mb-0 ml-2">My Events</h1>
      </div>
      <div className="w-full">
        <CourseSessionCalendar events={sessions} />
      </div>
    </div>
  );
} 