import React, { useState, useEffect } from 'react';
import InviteeSelector from './InviteeSelector';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Course } from '../../types';

const platforms = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
];

const recurrenceOptions = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
];

interface ScheduleSessionFormProps {
  courses: Course[];
  onSessionCreated: () => void;
}

export default function ScheduleSessionForm({ courses, onSessionCreated }: ScheduleSessionFormProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    courseId: '',
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    platform: '',
    recurrence: 'none',
    customRecurrence: '',
    invitees: [] as string[],
    joinLink: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [learners, setLearners] = useState<any[]>([]);
  const [learnersLoading, setLearnersLoading] = useState(false);

  // Fetch learners for selected course
  useEffect(() => {
    if (!form.courseId) {
      setLearners([]);
      return;
    }
    setLearnersLoading(true);
    (async () => {
      // Get user IDs enrolled in this course
      const { data: userCourses, error: ucError } = await supabase
        .from('user_courses')
        .select('user_id')
        .eq('course_id', form.courseId);
      if (ucError || !userCourses) {
        setLearners([]);
        setLearnersLoading(false);
        return;
      }
      const userIds = userCourses.map((uc: any) => uc.user_id);
      if (userIds.length === 0) {
        setLearners([]);
        setLearnersLoading(false);
        return;
      }
      // Fetch user details
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', userIds);
      if (usersError || !users) {
        setLearners([]);
        setLearnersLoading(false);
        return;
      }
      setLearners(users.map((u: any) => ({
        id: u.id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        email: u.email,
      })));
      setLearnersLoading(false);
    })();
  }, [form.courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleInviteesChange = (invitees: string[]) => {
    setForm(prev => ({ ...prev, invitees }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      // Compose start_time and end_time
      const start_time = form.date && form.time ? new Date(`${form.date}T${form.time}`) : null;
      const end_time = start_time && form.duration ? new Date(start_time.getTime() + Number(form.duration) * 60000) : null;
      // Insert into Supabase
      const { data: sessionData, error } = await supabase.from('live_sessions').insert([
        {
          title: form.title,
          description: form.description,
          course_id: form.courseId,
          instructor_id: user?.id || null,
          start_time: start_time ? start_time.toISOString() : null,
          end_time: end_time ? end_time.toISOString() : null,
          platform: form.platform,
          recurrence: form.recurrence === 'custom' ? form.customRecurrence : form.recurrence,
          invitees: form.invitees,
          join_link: form.joinLink,
        },
      ]).select();
      if (error) throw error;
      // Insert notification for invitees
      if (form.invitees && form.invitees.length > 0) {
        const { error: notifError } = await supabase.from('notifications').insert([
          {
            title: 'You have been invited to a live session!',
            message: `You are invited to "${form.title}" on ${form.date} at ${form.time}.`,
            type: 'info',
            priority: 'medium',
            recipients: form.invitees,
            sender_id: user?.id,
            course_id: form.courseId,
            event_id: sessionData?.[0]?.id || null,
            created_at: new Date().toISOString(),
          },
        ]);
        if (notifError) {
          console.error('Failed to insert notification:', notifError);
        } else {
          console.log('Notification inserted for invitees:', form.invitees);
        }
      }
      setSuccess(true);
      setForm({
        courseId: '',
        title: '',
        description: '',
        date: '',
        time: '',
        duration: '',
        platform: '',
        recurrence: 'none',
        customRecurrence: '',
        invitees: [],
        joinLink: '',
      });
      onSessionCreated();
    } catch (err: any) {
      setError('Failed to schedule session. ' + (err?.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8 border border-gray-100">
      <h2 className="text-xl font-bold mb-6">Schedule Live Session</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course - full width */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            name="courseId"
            value={form.courseId}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
            disabled={coursesLoading}
          >
            <option value="">{coursesLoading ? 'Loading courses...' : 'Select a course'}</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
        {/* Session Title - full width */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Session Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        {/* Description - full width */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows={2}
          />
        </div>
        {/* Date & Time */}
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        {/* Duration & Platform */}
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input
            type="number"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            min={1}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select
            name="platform"
            value={form.platform}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Select platform</option>
            {platforms.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        {/* Recurrence - full width */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Recurrence</label>
          <select
            name="recurrence"
            value={form.recurrence}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            {recurrenceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {form.recurrence === 'custom' && (
            <input
              type="text"
              name="customRecurrence"
              value={form.customRecurrence}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-2"
              placeholder="Describe custom recurrence (e.g. every 2 weeks)"
            />
          )}
        </div>
        {/* Invitees - full width */}
        {form.courseId && (
          <div className="md:col-span-2">
            <InviteeSelector
              learners={learners}
              selected={form.invitees}
              onChange={handleInviteesChange}
            />
            {learnersLoading && <div className="text-sm text-gray-500 mt-1">Loading learners...</div>}
            {!learnersLoading && learners.length === 0 && <div className="text-sm text-gray-500 mt-1">No learners enrolled in this course.</div>}
          </div>
        )}
        {/* Join Link */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Join Link</label>
          <input
            type="url"
            name="joinLink"
            value={form.joinLink}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="Paste Zoom/Google Meet link here"
            required
          />
        </div>
        {/* Error/Success - full width */}
        {error && <div className="md:col-span-2 text-red-600 text-sm">{error}</div>}
        {success && <div className="md:col-span-2 text-green-600 text-sm">Session scheduled successfully!</div>}
        {/* Submit Button - full width on mobile, right on desktop */}
        <div className="md:col-span-2 flex flex-col md:flex-row md:justify-end gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-60 w-full md:w-auto"
            disabled={submitting}
          >
            {submitting ? 'Scheduling...' : 'Schedule Session'}
          </button>
        </div>
      </form>
    </div>
  );
} 